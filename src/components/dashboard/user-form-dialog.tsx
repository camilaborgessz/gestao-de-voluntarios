"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { X, Copy, Check } from "lucide-react";
import { createUser, updateUser, resetUserPassword, type ActionState } from "@/app/dashboard/voluntarios/actions";
import type { UserRecord } from "./user-table";
import { DatePicker } from "./date-picker";
import { formatPhoneInput } from "@/lib/phone";

const inputClass =
  "rounded-[5px] border border-[#6e9193] px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

export function UserFormDialog({ user, onClose }: { user: UserRecord | null; onClose: () => void }) {
  const isEdit = user !== null;
  const action = isEdit ? updateUser : createUser;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);
  const wasPending = useRef(false);

  // Controlled fields: a Server Action submission resets uncontrolled inputs
  // even when it returns a validation error, so we keep the typed values in
  // React state ourselves and re-assert them on every render.
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [birthDate, setBirthDate] = useState(user?.birthDate ? user.birthDate.toISOString().slice(0, 10) : "");
  const [role, setRole] = useState<UserRecord["role"]>(user?.role ?? "VOLUNTEER");

  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();
  const [copied, setCopied] = useState(false);

  const generatedPassword = state?.generatedPassword ?? resetPassword;

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error && !state?.generatedPassword) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state, onClose]);

  function handleResetPassword() {
    if (!user) return;
    if (!window.confirm(`Gerar uma nova senha temporária para "${user.name}"? A senha atual deixará de funcionar.`)) {
      return;
    }
    startReset(async () => {
      const password = await resetUserPassword(user.id);
      setResetPassword(password);
    });
  }

  function copyPassword() {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
  }

  if (generatedPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-[15px] bg-surface p-6 text-center shadow-xl">
          <h2 className="text-xl font-semibold text-ink">
            {resetPassword ? "Nova senha gerada" : "Usuário criado"}
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            Copie e repasse essa senha temporária para a pessoa. Ela deve trocá-la assim que entrar.
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-[5px] border border-[#6e9193] bg-bg px-4 py-3">
            <code className="text-lg font-bold tracking-wide text-ink">{generatedPassword}</code>
            <button
              type="button"
              title="Copiar"
              onClick={copyPassword}
              className="text-brand transition-colors hover:text-brand-dark"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] active:scale-95"
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[15px] bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isEdit ? "Editar usuário" : "Novo usuário"}</h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          {isEdit && <input type="hidden" name="id" value={user.id} />}
          <input type="hidden" name="birthDate" value={birthDate} />
          <input type="hidden" name="role" value={role} />

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Nome completo
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Email
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              Nascimento
              <DatePicker value={birthDate} onChange={setBirthDate} />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              Telefone
              <input
                name="phoneDisplay"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                placeholder="(69) 99239-8509"
                inputMode="tel"
                className={inputClass}
              />
              <input type="hidden" name="phone" value={phone} />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Perfil
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRecord["role"])}
              className={inputClass}
            >
              <option value="VOLUNTEER">Voluntário</option>
              <option value="ADMIN">Líder</option>
            </select>
          </label>

          {isEdit && (
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetting}
              className="self-start text-sm font-medium text-brand transition-colors hover:text-brand-dark hover:underline disabled:opacity-60"
            >
              {isResetting ? "Gerando..." : "Gerar nova senha para esse usuário"}
            </button>
          )}

          {state?.error && <p className="text-sm text-danger-to">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar usuário"}
          </button>
        </form>
      </div>
    </div>
  );
}
