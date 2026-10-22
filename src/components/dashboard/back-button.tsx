"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

/** Goes back to wherever the user came from (agenda, painel, gestão…). */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function goBack() {
    setBusy(true);
    if (window.history.length > 1) router.back();
    else router.push("/dashboard/agenda");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline disabled:opacity-70 dark:text-lime-from ${className}`}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
      Voltar
    </button>
  );
}
