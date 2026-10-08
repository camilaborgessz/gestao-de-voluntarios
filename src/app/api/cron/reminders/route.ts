import { NextResponse } from "next/server";
import { purgeExpiredNotifications, runReminders } from "@/lib/reminders";

/**
 * Trigger for hosts without a long-running server (or an external scheduler such as cron-job.org / Vercel Cron).
 * Call it every 5-15 minutes with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await runReminders();
  const purged = await purgeExpiredNotifications();
  return NextResponse.json({ ...summary, purged });
}
