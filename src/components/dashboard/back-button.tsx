"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Goes back to wherever the user came from (agenda, painel, gestão…). */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/dashboard/agenda"))}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline dark:text-lime-from ${className}`}
    >
      <ArrowLeft size={16} />
      Voltar
    </button>
  );
}
