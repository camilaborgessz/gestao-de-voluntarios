/**
 * WhatsApp delivery through the official WhatsApp Business Cloud API (Meta).
 *
 * Reminders are business-initiated messages, so WhatsApp only delivers them as an APPROVED TEMPLATE.
 * Create a template in Meta Business Manager (category "Utility", language pt_BR) with this body:
 *
 *   Olá {{1}}! Lembrete: o evento {{2}} acontece {{3}} (faltam {{4}}). Deus abençoe!
 *
 * and set these variables in `.env`:
 *   WHATSAPP_TOKEN            permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID  id of the sending number
 *   WHATSAPP_TEMPLATE_NAME    template name (default: lembrete_evento)
 *   WHATSAPP_TEMPLATE_LANG    template language (default: pt_BR)
 *
 *   WHATSAPP_ENABLED          must be "true" to send anything (OFF by default)
 *
 * Without the three first variables, messages are NOT sent and the result is "SKIPPED".
 *
 * This file must stay dependency-free so it can also run from `scripts/`.
 */

const GRAPH_VERSION = "v21.0";

export type DeliveryResult = { status: "SENT" | "SKIPPED" | "FAILED"; error?: string };

export interface ReminderMessage {
  /** E.164 digits without "+", e.g. 5569992398509 */
  to: string;
  name: string;
  eventTitle: string;
  /** e.g. "Sexta-feira, 16/10/2026 às 19:30" */
  when: string;
  /** e.g. "24 horas" */
  lead: string;
}

/** Brazilian numbers as typed in the profile ("(69) 99239-8509") -> "5569992398509". */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 11) digits = `55${digits}`;
  // Only mobile numbers have WhatsApp: 55 + DDD (2 digits) + 9 + 8 digits.
  if (!/^55\d{2}9\d{8}$/.test(digits)) return null;
  return digits;
}

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Sending is switched off unless explicitly enabled (the church has no dedicated number yet). */
export function isWhatsAppEnabled() {
  return process.env.WHATSAPP_ENABLED === "true" && isWhatsAppConfigured();
}

export async function sendReminderWhatsApp(message: ReminderMessage): Promise<DeliveryResult> {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    return { status: "SKIPPED", error: "Envio por WhatsApp desativado" };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { status: "SKIPPED", error: "WhatsApp não configurado (faltam WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID)" };
  }

  const text = (value: string) => ({ type: "text", text: value });

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to,
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE_NAME || "lembrete_evento",
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "pt_BR" },
          components: [
            {
              type: "body",
              parameters: [text(message.name), text(message.eventTitle), text(message.when), text(message.lead)],
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (response.ok) return { status: "SENT" };

    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { status: "FAILED", error: `HTTP ${response.status}: ${body?.error?.message ?? "erro desconhecido"}`.slice(0, 300) };
  } catch (error) {
    return { status: "FAILED", error: (error instanceof Error ? error.message : "falha de rede").slice(0, 300) };
  }
}
