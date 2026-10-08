"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS_FULL = [
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
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parse(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day, key: year * 10000 + month * 100 + day };
}

function format(value: string) {
  const parsed = parse(value);
  if (!parsed) return "";
  return `${String(parsed.day).padStart(2, "0")}/${String(parsed.month).padStart(2, "0")}/${parsed.year}`;
}

type View = "days" | "months" | "years";

export function DateRangePicker({
  from,
  to,
  onChange,
  defaultYear,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  defaultYear?: number;
}) {
  const fromParsed = parse(from);
  const today = new Date();
  const fallbackYear = defaultYear ?? today.getFullYear() - 20;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const [cursorYear, setCursorYear] = useState(fromParsed?.year ?? fallbackYear);
  const [cursorMonth, setCursorMonth] = useState(fromParsed?.month ?? today.getMonth() + 1);
  const [decadeStart, setDecadeStart] = useState(Math.floor((fromParsed?.year ?? fallbackYear) / 12) * 12);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView("days");
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setView("days");
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function selectDay(d: number) {
    const clicked = `${cursorYear}-${String(cursorMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (!from || (from && to)) {
      onChange(clicked, "");
      return;
    }

    if (clicked < from) {
      onChange(clicked, from);
    } else {
      onChange(from, clicked);
    }
    setOpen(false);
    setView("days");
  }

  function goMonth(delta: number) {
    let m = cursorMonth + delta;
    let y = cursorYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setCursorMonth(m);
    setCursorYear(y);
  }

  const firstWeekday = new Date(cursorYear, cursorMonth - 1, 1).getDay();
  const totalDays = daysInMonth(cursorYear, cursorMonth);
  const years12 = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  const fromKey = parse(from)?.key;
  const toKey = parse(to)?.key;

  const displayValue =
    from && to ? `${format(from)} – ${format(to)}` : from ? `${format(from)} – ...` : "";

  return (
    <div
      className="relative"
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          setOpen(false);
          setView("days");
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-[5px] border border-[#6e9193] px-3 py-2 text-left text-sm outline-none transition-colors duration-150 focus:border-brand"
      >
        <span className={displayValue ? "text-ink" : "text-ink/40"}>{displayValue || "Selecione o período"}</span>
        <Calendar size={16} className="text-brand dark:text-lime-from" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 rounded-[10px] border border-brand/20 bg-surface p-3 shadow-xl">
          {view === "days" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goMonth(-1)}
                  className="rounded-full p-1 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("months")}
                  className="rounded-full px-2 py-1 text-sm font-semibold text-ink transition-colors hover:bg-lime-from/40"
                >
                  {MONTHS_FULL[cursorMonth - 1]} {cursorYear}
                </button>
                <button
                  type="button"
                  onClick={() => goMonth(1)}
                  className="rounded-full p-1 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink/50">
                {WEEKDAYS.map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
                  const key = cursorYear * 10000 + cursorMonth * 100 + d;
                  const isFrom = key === fromKey;
                  const isTo = key === toKey;
                  const inRange = fromKey != null && toKey != null && key > fromKey && key < toKey;
                  const highlighted = isFrom || isTo || inRange;

                  let bandRounding = "";
                  if (isFrom && isTo) bandRounding = "rounded-full";
                  else if (isFrom) bandRounding = "rounded-l-full";
                  else if (isTo) bandRounding = "rounded-r-full";

                  return (
                    <div
                      key={d}
                      className={`flex h-8 items-center justify-center ${highlighted ? `bg-lime-from/25 ${bandRounding}` : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => selectDay(d)}
                        className={`flex size-8 items-center justify-center rounded-full text-sm transition duration-150 ease-out hover:scale-110 ${
                          isFrom || isTo
                            ? "bg-gradient-to-b from-lime-from to-lime-to font-bold text-[#1d2326]"
                            : "text-ink hover:bg-lime-from/40"
                        }`}
                      >
                        {d}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === "months" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCursorYear((y) => y - 1)}
                  className="rounded-full p-1 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecadeStart(Math.floor(cursorYear / 12) * 12);
                    setView("years");
                  }}
                  className="rounded-full px-2 py-1 text-sm font-semibold text-ink transition-colors hover:bg-lime-from/40"
                >
                  {cursorYear}
                </button>
                <button
                  type="button"
                  onClick={() => setCursorYear((y) => y + 1)}
                  className="rounded-full p-1 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS_SHORT.map((label, i) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => {
                      setCursorMonth(i + 1);
                      setView("days");
                    }}
                    className={`rounded-[8px] py-2 text-sm transition duration-150 ease-out hover:scale-105 ${
                      i + 1 === cursorMonth
                        ? "bg-gradient-to-b from-lime-from to-lime-to font-bold text-[#1d2326]"
                        : "text-ink hover:bg-lime-from/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {view === "years" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDecadeStart((d) => d - 12)}
                  className="rounded-full p-1 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-ink">
                  {decadeStart} – {decadeStart + 11}
                </span>
                <button
                  type="button"
                  onClick={() => setDecadeStart((d) => d + 12)}
                  className="rounded-full p-1 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {years12.map((y) => (
                  <button
                    type="button"
                    key={y}
                    onClick={() => {
                      setCursorYear(y);
                      setView("months");
                    }}
                    className={`rounded-[8px] py-2 text-sm transition duration-150 ease-out hover:scale-105 ${
                      y === cursorYear
                        ? "bg-gradient-to-b from-lime-from to-lime-to font-bold text-[#1d2326]"
                        : "text-ink hover:bg-lime-from/40"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
