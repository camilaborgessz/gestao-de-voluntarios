import nodemailer, { type Transporter } from "nodemailer";
/** Outcome of one delivery attempt. */
export type DeliveryResult = { status: "SENT" | "SKIPPED" | "FAILED"; error?: string };

/**
 * Emails (invite / new password link / event reminder) over plain SMTP, so any provider works. Free setup with a Gmail account:
 *
 *   1. Turn on 2-step verification on the Google account.
 *   2. Create an "App password" (myaccount.google.com/apppasswords).
 *   3. In `.env`:
 *        EMAIL_ENABLED=true
 *        SMTP_USER=seu-email@gmail.com
 *        SMTP_PASSWORD=<the 16-letter app password>
 *        EMAIL_FROM="Koinonia <seu-email@gmail.com>"     (optional)
 *        APP_URL=https://seu-site.com                  (optional, link inside the email)
 *
 * Other providers: also set SMTP_HOST / SMTP_PORT (defaults: smtp.gmail.com, 465).
 * Gmail allows about 500 emails per day, far more than a church needs.
 *
 * Emails are NOT sent unless EMAIL_ENABLED is "true" and SMTP_USER / SMTP_PASSWORD are set.
 */

let cached: Transporter | null = null;

function transporter() {
  if (cached) return cached;
  const port = Number(process.env.SMTP_PORT ?? 465);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return cached;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export interface ReminderEmail {
  to: string;
  name: string;
  eventTitle: string;
  /** e.g. "Sexta-feira, 16/10/2026 às 19:30" */
  when: string;
  uniform: string[];
  note: string | null;
  /** e.g. "ENTRADA 4 e 5 — Nave esquerda" */
  slot: string | null;
}

function buildReminderMessage(email: ReminderEmail) {
  const first = email.name.split(" ")[0];
  const appUrl = process.env.APP_URL?.trim();
  const details: [string, string][] = [["Quando", email.when]];
  if (email.slot) details.push(["Sua entrada", email.slot]);
  if (email.uniform.length > 0) details.push(["Traje", email.uniform.join(", ")]);

  const text = [
    `Olá, ${first}!`,
    "",
    `Lembrete: você serve em "${email.eventTitle}".`,
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    ...(email.note ? ["", `Aviso: ${email.note}`] : []),
    ...(appUrl ? ["", `Veja os detalhes: ${appUrl}`] : []),
    "",
    "Deus abençoe!",
  ].join("\n");

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#5b7773;font-size:14px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:#16302c">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3f6f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden" cellspacing="0" cellpadding="0">
<tr><td style="background:#02575c;padding:22px 28px;color:#e3f498;font-size:13px;letter-spacing:2px;font-weight:700">LEMBRETE DE SERVIÇO</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:16px;color:#16302c">Olá, ${escapeHtml(first)}!</p>
<h1 style="margin:0 0 18px;font-size:24px;color:#16302c">${escapeHtml(email.eventTitle)}</h1>
<p style="margin:0 0 16px;font-size:15px;color:#16302c">Seu serviço está chegando.</p>
<table role="presentation" cellspacing="0" cellpadding="0">${rows}</table>
${email.note ? `<p style="margin:20px 0 0;padding:12px 14px;background:#fdf3d2;border-left:4px solid #e6b01b;border-radius:6px;font-size:14px;color:#16302c"><strong>Aviso:</strong> ${escapeHtml(email.note)}</p>` : ""}
${appUrl ? `<p style="margin:24px 0 0"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#02575c;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">Abrir o sistema</a></p>` : ""}
<p style="margin:24px 0 0;font-size:14px;color:#5b7773">Deus abençoe!</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject: `Lembrete: ${email.eventTitle}`, text, html };
}

/** Sends the "your event is coming" reminder. Same SMTP setup and result values as the account emails. */
export async function sendReminderEmail(email: ReminderEmail): Promise<DeliveryResult> {
  if (process.env.EMAIL_ENABLED !== "true") return { status: "SKIPPED", error: "Envio por e-mail desativado" };
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { status: "SKIPPED", error: "E-mail não configurado (faltam SMTP_USER e SMTP_PASSWORD)" };
  }
  try {
    await transporter().sendMail({
      from: process.env.EMAIL_FROM || `"Koinonia" <${process.env.SMTP_USER}>`,
      to: email.to,
      ...buildReminderMessage(email),
    });
    return { status: "SENT" };
  } catch (error) {
    return { status: "FAILED", error: (error instanceof Error ? error.message : "falha ao enviar").slice(0, 300) };
  }
}

export interface AccountEmail {
  to: string;
  name: string;
  /** INVITE: first access chosen by a leader. RESET: "esqueci minha senha". */
  kind: "INVITE" | "RESET";
  link: string;
  /** e.g. "72 horas" */
  validFor: string;
}

function buildAccountMessage({ name, kind, link, validFor }: AccountEmail) {
  const first = name.split(" ")[0];
  const invite = kind === "INVITE";
  const subject = invite ? "Seu acesso ao Koinonia" : "Redefinir sua senha do Koinonia";
  const intro = invite ? "Você foi cadastrado(a) no Koinonia. Crie sua senha para entrar." : "Recebemos um pedido para redefinir sua senha.";
  const button = invite ? "Criar minha senha" : "Redefinir senha";

  const text = [
    `Olá, ${first}!`,
    "",
    intro,
    "",
    `${button}: ${link}`,
    "",
    `O link vale por ${validFor} e só pode ser usado uma vez.`,
    ...(invite ? [] : ["Se não foi você, ignore este e-mail: sua senha continua a mesma."]),
  ].join("\n");

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3f6f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden" cellspacing="0" cellpadding="0">
<tr><td style="background:#02575c;padding:22px 28px;color:#e3f498;font-size:13px;letter-spacing:2px;font-weight:700">${invite ? "SEU ACESSO" : "NOVA SENHA"}</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:16px;color:#16302c">Olá, ${escapeHtml(first)}!</p>
<p style="margin:0 0 22px;font-size:15px;color:#16302c">${escapeHtml(intro)}</p>
<p style="margin:0 0 22px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#02575c;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">${button}</a></p>
<p style="margin:0;font-size:13px;color:#5b7773">O link vale por ${escapeHtml(validFor)} e só pode ser usado uma vez.${invite ? "" : " Se não foi você, ignore este e-mail."}</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

/** Sends the "create / reset your password" link. Uses the SMTP settings above. */
export async function sendAccountEmail(email: AccountEmail): Promise<DeliveryResult> {
  if (process.env.EMAIL_ENABLED !== "true") return { status: "SKIPPED", error: "Envio por e-mail desativado" };
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { status: "SKIPPED", error: "E-mail não configurado (faltam SMTP_USER e SMTP_PASSWORD)" };
  }
  try {
    await transporter().sendMail({
      from: process.env.EMAIL_FROM || `"Koinonia" <${process.env.SMTP_USER}>`,
      to: email.to,
      ...buildAccountMessage(email),
    });
    return { status: "SENT" };
  } catch (error) {
    return { status: "FAILED", error: (error instanceof Error ? error.message : "falha ao enviar").slice(0, 300) };
  }
}
