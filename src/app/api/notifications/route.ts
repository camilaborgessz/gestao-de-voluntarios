import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TTL_DAYS, READ_NOTIFICATION_TTL_DAYS } from "@/lib/notifications";

const DAY_MS = 86_400_000;

function since() {
  return new Date(Date.now() - NOTIFICATION_TTL_DAYS * DAY_MS);
}

function readSince() {
  return new Date(Date.now() - READ_NOTIFICATION_TTL_DAYS * DAY_MS);
}

/** The signed-in user's notifications: unread from the last 7 days, read ones from the last 3 (older ones are deleted). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, createdAt: { gte: since() }, OR: [{ readAt: null }, { readAt: { gte: readSince() } }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, kind: true, title: true, message: true, createdAt: true, readAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null, createdAt: { gte: since() } } }),
  ]);

  return NextResponse.json({ items, unread });
}

/** `{ "action": "read-all" }` marks everything as read; `{ "action": "clear-all" }` deletes all of the user's notifications. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  if (body?.action === "clear-all") {
    await prisma.notification.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ ok: true });
  }
  if (body?.action !== "read-all") return NextResponse.json({ error: "invalid action" }, { status: 400 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
