import { NextResponse } from "next/server";
import { purgeExpiredNotifications } from "@/lib/notifications";
import { runReminders } from "@/lib/reminders";

// Sending emails one by one can take a while on a serverless host.
export const maxDuration = 60;

/**
 * Called by Vercel Cron twice a day (see vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`
 * automatically when the CRON_SECRET environment variable is set; anyone else gets 401.
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
