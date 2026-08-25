"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme";

export function ThemeToggle() {
  // Starts as "light" to match the server-rendered output exactly, even though the
  // inline script in layout.tsx may have already set data-theme="dark" on <html>.
  // Reading the DOM here on first render would mismatch SSR and force React to
  // discard and remount the whole tree, wiping out that script's DOM mutation.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={toggleTheme}
      className="flex size-10 items-center justify-center rounded-full bg-lime-from/40 text-brand transition duration-150 ease-out hover:scale-110 hover:bg-lime-from/60 active:scale-95"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
