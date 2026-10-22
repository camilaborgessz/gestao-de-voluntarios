"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

/** The theme lives on <html data-theme>; the inline script in layout.tsx sets it before the first paint. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

// The server always renders "light"; the real value is picked up right after hydration.
const getServerTheme = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode): the theme still changes for this visit.
    }
  };

  return (
    <button
      type="button"
      title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={toggleTheme}
      className="flex size-10 items-center justify-center rounded-full bg-lime-from/40 text-brand dark:bg-white/10 dark:text-lime-from transition duration-150 ease-out hover:scale-110 hover:bg-lime-from/60 dark:hover:bg-white/20 active:scale-95"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
