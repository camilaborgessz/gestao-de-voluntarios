const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function formatEventSchedule(startsAt: Date) {
  return {
    date: `${String(startsAt.getDate()).padStart(2, "0")}/${String(startsAt.getMonth() + 1).padStart(2, "0")}`,
    weekday: WEEKDAYS_SHORT[startsAt.getDay()],
    time: `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`,
  };
}

export function toDateInputValue(startsAt: Date) {
  return `${startsAt.getFullYear()}-${String(startsAt.getMonth() + 1).padStart(2, "0")}-${String(startsAt.getDate()).padStart(2, "0")}`;
}

export function toTimeInputValue(startsAt: Date) {
  return `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`;
}

export function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(2)}`;
}
