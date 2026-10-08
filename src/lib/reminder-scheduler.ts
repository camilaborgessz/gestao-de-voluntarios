import { purgeExpiredNotifications, runReminders } from "@/lib/reminders";

const TICK_MS = 5 * 60_000;

/**
 * Checks for due reminders every 5 minutes while the server is running (`next start` / `next dev`).
 * On serverless hosting there is no long-lived process: call `/api/cron/reminders` from a scheduler instead.
 */
export function startReminderScheduler() {
  const globalState = globalThis as unknown as { __reminderScheduler?: NodeJS.Timeout };
  if (globalState.__reminderScheduler) return;

  const tick = async () => {
    try {
      const summary = await runReminders();
      await purgeExpiredNotifications();
      if (summary.created > 0 || summary.failed > 0) console.info("[lembretes]", summary);
    } catch (error) {
      console.error("[lembretes] erro ao processar", error);
    }
  };

  setTimeout(tick, 20_000).unref();
  globalState.__reminderScheduler = setInterval(tick, TICK_MS);
  globalState.__reminderScheduler.unref();
}
