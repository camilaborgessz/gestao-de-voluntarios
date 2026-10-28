"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, User, Users, X } from "lucide-react";
import { ConfirmDialog } from "./confirm-dialog";
import { joinEvent, leaveEvent } from "@/app/dashboard/participar/actions";

type Mode = "INDIVIDUAL" | "COUPLE";

const pill =
  "flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold transition duration-150 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";
const chipButton =
  "flex size-7 shrink-0 items-center justify-center rounded-full transition duration-150 ease-out active:scale-90 disabled:cursor-not-allowed disabled:opacity-60";
const iconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition duration-150 ease-out hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

export function ParticipateButton({
  eventId,
  joined,
  joinedMode,
  coupleOption = false,
  defaultSpouseName = "",
  onOptimistic,
  className = "",
}: {
  eventId: string;
  joined: boolean;
  joinedMode?: Mode;
  /** Volunteer serves as a couple: ask whether the spouse comes along this time. */
  coupleOption?: boolean;
  /** Spouse name saved on the volunteer's profile, used to pre-fill the field. */
  defaultSpouseName?: string;
  /** Called the moment the user acts, so the screen can update before the server answers. */
  onOptimistic?: (joined: boolean, mode: Mode) => void;
  className?: string;
}) {
  const [choosing, setChoosing] = useState(false);
  const [askSpouse, setAskSpouse] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [spouseName, setSpouseName] = useState(defaultSpouseName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => ReturnType<typeof joinEvent>, onDone: () => void, optimistic?: () => void) {
    setError(null);
    startTransition(async () => {
      optimistic?.();
      const result = await action();
      if (result?.error) setError(result.error);
      else onDone();
    });
  }

  function join(mode: Mode) {
    if (mode === "COUPLE" && !spouseName.trim()) {
      setError("Informe o nome do cônjuge");
      return;
    }
    run(
      () => joinEvent(eventId, mode, spouseName),
      () => {
        setChoosing(false);
        setAskSpouse(false);
      },
      () => onOptimistic?.(true, mode),
    );
  }

  function leave() {
    setConfirmLeave(false);
    run(
      () => leaveEvent(eventId),
      () => undefined,
      () => onOptimistic?.(false, "INDIVIDUAL"),
    );
  }

  function cancelChoosing() {
    setChoosing(false);
    setAskSpouse(false);
    setError(null);
  }

  let content: React.ReactNode;

  if (joined) {
    content = (
      <div className="flex h-9 items-center rounded-full bg-gradient-to-r from-success-from to-success-to pl-3 pr-1 text-white shadow-sm">
        <span
          title={joinedMode === "COUPLE" ? "Participando com cônjuge" : undefined}
          className="min-w-0 flex-1 truncate text-center text-sm font-semibold"
        >
          Participando
        </span>
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          title="Cancelar participação"
          aria-label="Cancelar participação"
          className={`${chipButton} bg-white/25 text-white hover:bg-white/40`}
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  } else if (choosing) {
    content = (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => join("INDIVIDUAL")}
            className={`${pill} min-w-0 flex-1 border border-brand bg-brand/10 text-brand hover:bg-brand/20 dark:text-lime-from`}
          >
            <User size={15} className="shrink-0" />
            Só eu
          </button>
          <button
            type="button"
            onClick={cancelChoosing}
            title="Voltar"
            aria-label="Voltar"
            className={`${iconButton} text-ink/60 hover:bg-ink/5`}
          >
            <X size={18} />
          </button>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setAskSpouse(true)}
          className={`${pill} w-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand text-white ${
            askSpouse ? "ring-2 ring-lime-to ring-offset-2 ring-offset-surface" : ""
          }`}
        >
          <Users size={15} className="shrink-0" />
          Com cônjuge
        </button>

        {askSpouse && (
          <div className="flex items-center gap-2">
            <input
              value={spouseName}
              onChange={(e) => setSpouseName(e.target.value)}
              maxLength={120}
              autoFocus
              aria-label="Nome do cônjuge"
              placeholder="Nome do cônjuge"
              className="h-9 min-w-0 flex-1 rounded-full border border-[#6e9193] bg-surface px-4 text-sm text-ink outline-none focus:border-brand"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => join("COUPLE")}
              title="Confirmar"
              aria-label="Confirmar"
              className={`${iconButton} bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand text-white`}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
            </button>
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <button
        type="button"
        disabled={isPending}
        onClick={() => (coupleOption ? setChoosing(true) : join("INDIVIDUAL"))}
        className={`${pill} w-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand text-white shadow-sm hover:scale-[1.02] hover:brightness-110`}
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        Participar
      </button>
    );
  }

  return (
    <div className={`flex w-full flex-col gap-1 ${className}`}>
      {content}
      {error && (
        <p role="alert" className="text-center text-xs text-danger-text">
          {error}
        </p>
      )}
      {confirmLeave &&
        createPortal(
          <ConfirmDialog
            title="Cancelar participação?"
            description="Você deixará de participar deste evento. Se mudar de ideia, é só participar de novo."
            confirmLabel="Cancelar participação"
            cancelLabel="Manter participação"
            tone="danger"
            isLoading={false}
            onCancel={() => setConfirmLeave(false)}
            onConfirm={leave}
          />,
          document.body,
        )}
    </div>
  );
}
