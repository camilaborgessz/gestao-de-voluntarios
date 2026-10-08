/**
 * Sends ONE test reminder through the same WhatsApp code the app uses.
 *
 *   npx tsx scripts/whatsapp-test.ts "(69) 99239-8509"
 *
 * Needs WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in `.env` (see src/lib/whatsapp.ts).
 */
import "dotenv/config";
import { isWhatsAppConfigured, sendReminderWhatsApp, toWhatsAppNumber } from "../src/lib/whatsapp";

async function main() {
  const to = toWhatsAppNumber(process.argv[2]);
  if (!to) {
    console.error('Informe um telefone válido, ex.: npx tsx scripts/whatsapp-test.ts "(69) 99239-8509"');
    process.exit(1);
  }
  console.log("Destino:", to.replace(/\d(?=\d{4})/g, "*"), "| configurado:", isWhatsAppConfigured(), "| ativado:", process.env.WHATSAPP_ENABLED === "true");

  const result = await sendReminderWhatsApp({
    to,
    name: "Teste",
    eventTitle: "Culto de Teste",
    when: "Sexta-feira, 16/10/2026 às 19:30",
    lead: "24 horas",
  });
  console.log("Resultado:", result);
  process.exit(result.status === "FAILED" ? 1 : 0);
}

void main();
