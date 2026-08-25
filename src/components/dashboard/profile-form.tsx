"use client";

import { useActionState, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { updateProfile, type ActionState } from "@/app/dashboard/perfil/actions";
import { DatePicker } from "./date-picker";
import { formatPhoneInput } from "@/lib/phone";

const inputClass =
  "rounded-[5px] border border-[#6e9193] bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

export type ProfileUser = {
  name: string;
  email: string;
  phone: string | null;
  birthDate: Date | null;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateProfile, undefined);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [birthDate, setBirthDate] = useState(user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "");

  const justSaved = state?.success === true;

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">Perfil</h2>

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-[15px] bg-surface p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <input type="hidden" name="birthDate" value={birthDate} />

        <label className="flex flex-col gap-1.5">
          <span className="text-base font-medium text-ink">Nome Completo</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-base font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-ink">Nascimento</span>
            <DatePicker value={birthDate} onChange={setBirthDate} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-ink">Telefone</span>
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

        {state?.error && <p className="text-sm text-danger-to">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex items-center gap-2 self-end rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {justSaved ? <Check size={16} /> : <Pencil size={16} />}
          {isPending ? "Salvando..." : justSaved ? "Perfil atualizado" : "Editar Perfil"}
        </button>
      </form>
    </section>
  );
}
