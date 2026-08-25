"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  iconClassName?: string;
};

export function PasswordInput({ className, iconClassName, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input {...props} type={visible ? "text" : "password"} className={`${className ?? ""} w-full pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? "Ocultar senha" : "Mostrar senha"}
        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 ${
          iconClassName ?? "text-ink/50 hover:text-ink"
        }`}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
