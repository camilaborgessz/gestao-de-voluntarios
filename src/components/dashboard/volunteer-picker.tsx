"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";

/** Lower case and no accents, so "jose" finds "José". */
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const MAX_RESULTS = 50;

/**
 * Type-to-filter picker for one person: the list narrows as the leader types, so it stays easy to use with
 * many registered users. Mount it again (change its `key`) to clear it after an add.
 */
export function VolunteerPicker({
  users,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  users: { id: string; name: string }[];
  /** The chosen user's id, or "" while nothing is chosen. */
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const needle = normalize(query);
    const found = needle ? users.filter((user) => normalize(user.name).includes(needle)) : users;
    return found.slice(0, MAX_RESULTS);
  }, [users, query]);

  function choose(user: { id: string; name: string }) {
    setQuery(user.name);
    setOpen(false);
    onChange(user.id);
  }

  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" />
      <input
        type="text"
        role="combobox"
        aria-label="Adicionar voluntário ao evento"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        disabled={disabled || users.length === 0}
        placeholder={users.length === 0 ? "Todos já estão no evento" : "Buscar pelo nome…"}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange(""); // typing again drops the previous choice
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, matches.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter" && open && matches[active]) {
            event.preventDefault();
            choose(matches[active]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-[8px] border border-[#6e9193] bg-surface py-3 pl-9 pr-3 text-base text-ink outline-none transition-colors duration-150 focus:border-brand disabled:opacity-60 sm:rounded-[5px] sm:py-2 sm:text-sm"
      />

      {open && !disabled && users.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-[10px] border border-brand/20 bg-surface py-1 shadow-xl"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink/55">Ninguém com esse nome</li>}
          {matches.map((user, index) => (
            <li
              key={user.id}
              role="option"
              aria-selected={user.id === value}
              // mouse down (not click) so the input keeps focus and its blur does not close the list first
              onMouseDown={(event) => {
                event.preventDefault();
                choose(user);
              }}
              onMouseEnter={() => setActive(index)}
              className={`cursor-pointer px-3 py-2.5 text-base text-ink sm:py-2 sm:text-sm ${index === active ? "bg-lime-from/40 dark:bg-white/10" : ""}`}
            >
              {user.name}
            </li>
          ))}
          {users.length > matches.length && matches.length === MAX_RESULTS && (
            <li className="px-3 py-2 text-xs text-ink/50">Continue digitando para filtrar</li>
          )}
        </ul>
      )}
    </div>
  );
}
