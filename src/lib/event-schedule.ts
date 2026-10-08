export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The app treats every stored date/time as a "wall clock" value anchored to UTC,
 * so rendering is identical regardless of the server or browser timezone.
 * Always build dates from form input with this helper, and read them back with
 * the `toDateInputValue` / `toTimeInputValue` / `formatEventSchedule` helpers
 * below (all of which use the `getUTC*` accessors).
 */
export function wallClockToDate(date: string, time = "00:00") {
  return new Date(`${date}T${time}:00.000Z`);
}

/**
 * Time zone where the events happen (Porto Velho, UTC-4, no daylight saving).
 * "Today" must be computed here: the server may run in UTC, which is already
 * "tomorrow" in the evening and would highlight the wrong day.
 */
export const APP_TIME_ZONE = "America/Porto_Velho";

/**
 * The current moment as a "wall clock" Date: its UTC fields hold the local date/time
 * in `APP_TIME_ZONE`. Compare it with stored event/notice dates (which use the same convention).
 */
export function wallClockNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")));
}

/** Today's year/month (0-11)/day in `APP_TIME_ZONE`. */
export function currentYearMonth() {
  const now = wallClockNow();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth(), day: now.getUTCDate() };
}

export interface MonthGridCell {
  date: Date;
  day: number;
  muted: boolean;
  weekend: boolean;
}

/**
 * Builds a Sunday-first month grid (4 to 6 weeks) covering `month` (0-11) of `year`.
 * Cells outside the target month are flagged `muted`.
 */
export function buildMonthGrid(year: number, month: number): MonthGridCell[][] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const cursor = new Date(Date.UTC(year, month, 1 - firstWeekday));

  const weeks: MonthGridCell[][] = [];
  for (let week = 0; week < 6; week++) {
    const cells: MonthGridCell[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      cells.push({
        date: new Date(cursor),
        day: cursor.getUTCDate(),
        muted: cursor.getUTCMonth() !== month,
        weekend: weekday === 0 || weekday === 6,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(cells);
  }

  // Drop trailing weeks that belong entirely to the next month.
  while (weeks.length > 4 && weeks[weeks.length - 1].every((cell) => cell.muted)) {
    weeks.pop();
  }
  return weeks;
}

export function formatEventSchedule(startsAt: Date) {
  return {
    date: `${pad(startsAt.getUTCDate())}/${pad(startsAt.getUTCMonth() + 1)}`,
    weekday: WEEKDAYS_SHORT[startsAt.getUTCDay()],
    time: `${pad(startsAt.getUTCHours())}:${pad(startsAt.getUTCMinutes())}`,
  };
}

export function toDateInputValue(startsAt: Date) {
  return `${startsAt.getUTCFullYear()}-${pad(startsAt.getUTCMonth() + 1)}-${pad(startsAt.getUTCDate())}`;
}

export function toTimeInputValue(startsAt: Date) {
  return `${pad(startsAt.getUTCHours())}:${pad(startsAt.getUTCMinutes())}`;
}

export function formatShortDate(date: Date) {
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${String(date.getUTCFullYear()).slice(2)}`;
}
