"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

/** Pill-shaped input from the design: leading icon, optional show/hide for passwords. */
type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  kind: "identifier" | "password";
};

export function AuthField({ kind, className = "", ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = kind === "password";
  const Icon = kind === "identifier" ? Mail : Lock;

  return (
    <label className="flex h-14 items-center gap-3 rounded-full border border-brand/30 bg-transparent px-6 transition-colors duration-150 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand dark:border-lime-from/30 dark:focus-within:border-lime-from dark:focus-within:ring-lime-from">
      <Icon size={20} className="shrink-0 text-brand dark:text-lime-from" aria-hidden />
      <input
        {...props}
        type={isPassword && !visible ? "password" : "text"}
        className={`auth-input min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/70 ${className}`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          tabIndex={-1}
          title={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="shrink-0 text-brand transition-colors hover:text-brand-dark dark:text-lime-from"
        >
          {visible ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      )}
    </label>
  );
}

/** The gradient button from the design (deep teal fading into lime). */
export function AuthButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-[49px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#02575c_22%,#e3f498_100%)] text-base font-semibold text-white transition duration-150 ease-out hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
    >
      {children}
    </button>
  );
}
