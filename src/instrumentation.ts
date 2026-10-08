export async function register() {
  // Only the Node.js server runs the reminder checks (not the edge runtime, not serverless hosts).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL || process.env.DISABLE_REMINDER_SCHEDULER === "true") return;

  const { startReminderScheduler } = await import("./lib/reminder-scheduler");
  startReminderScheduler();
}
