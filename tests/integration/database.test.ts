/**
 * Testes de integração: usam o banco real (DATABASE_URL) e, no caso do lembrete, o envio de e-mail.
 * Todos os registros criados têm o prefixo "TESTE-" e são apagados no final.
 * Rodar com: npm run test:integration
 */
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";

import { prisma } from "@/lib/prisma";
import { wallClockToDate } from "@/lib/event-schedule";
import { runReminders } from "@/lib/reminders";
import { getTopVolunteers } from "@/lib/leaderboard";
import { deleteArchivedEvent } from "@/lib/archive";
import { purgeExpiredNotifications } from "@/lib/notifications";
import { consumePasswordToken, issuePasswordToken, lookupPasswordToken } from "@/lib/password-tokens";

const RUN = Date.now().toString(36);
const mail = (tag: string) => `teste-${RUN}-${tag}@example.com`;
const DAY = 86_400_000;

// Eventos de teste ficam num ano em que o sistema não tinha nenhum evento real, então o lembrete
// (que olha só a janela de 36 horas a partir de "agora") nunca alcança inscrições de verdade.
const NOW = wallClockToDate("2025-01-10", "12:00");

const userIds: string[] = [];
const eventIds: string[] = [];

async function makeUser(tag: string, data: { notifyEmail?: boolean; email?: string; servicesDone?: number } = {}) {
  const user = await prisma.user.create({
    data: { name: `TESTE-${tag}-${RUN}`, email: data.email ?? mail(tag), notifyEmail: data.notifyEmail ?? true, servicesDone: data.servicesDone ?? 0 },
  });
  userIds.push(user.id);
  return user;
}

async function makeEvent(tag: string, startsAt: Date) {
  const event = await prisma.event.create({ data: { title: `TESTE-${tag}-${RUN}`, startsAt, capacity: 1, dressCode: ["Camisa branca"] } });
  eventIds.push(event.id);
  return event;
}

after(async () => {
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("lembrete por e-mail (runReminders)", () => {
  test("avisa quem está na janela de 24–36 h, respeita a preferência de e-mail e não repete", async () => {
    const inbox = process.env.TEST_INBOX ?? process.env.SMTP_USER;
    assert.ok(inbox, "defina SMTP_USER (ou TEST_INBOX) para receber o e-mail de teste");

    const near = await makeEvent("perto", wallClockToDate("2025-01-11", "18:00")); // 30 h depois de NOW
    const far = await makeEvent("longe", wallClockToDate("2025-01-15", "18:00")); // 4 dias depois
    // endereço "+teste" cai na mesma caixa de entrada, mas não colide com o cadastro real
    const wants = await makeUser("quer", { email: inbox.replace("@", `+teste${RUN}@`) });
    const refuses = await makeUser("recusa", { notifyEmail: false });
    const distant = await makeUser("distante");

    await prisma.enrollment.createMany({
      data: [
        { userId: wants.id, eventId: near.id, status: "CONFIRMED" },
        { userId: refuses.id, eventId: near.id, status: "CONFIRMED" },
        { userId: distant.id, eventId: far.id, status: "CONFIRMED" },
      ],
    });

    const first = await runReminders(NOW);
    assert.equal(first.created, 2, "um lembrete para cada inscrito do evento próximo");

    const forWants = await prisma.notification.findFirst({ where: { userId: wants.id, kind: "REMINDER_24H" } });
    assert.ok(forWants, "o sininho recebe o aviso");
    assert.equal(forWants.emailStatus, "SENT", `e-mail enviado (erro: ${forWants.emailError ?? "nenhum"})`);
    assert.equal(forWants.emailAttempts, 1);

    const forRefuses = await prisma.notification.findFirst({ where: { userId: refuses.id, kind: "REMINDER_24H" } });
    assert.ok(forRefuses, "quem desativou o e-mail ainda recebe o aviso no sininho");
    assert.equal(forRefuses.emailStatus, "SKIPPED");

    const forDistant = await prisma.notification.count({ where: { userId: distant.id } });
    assert.equal(forDistant, 0, "evento a mais de 36 h não gera lembrete");

    const second = await runReminders(NOW);
    assert.equal(second.created, 0, "rodar de novo não repete o lembrete");
    assert.equal(await prisma.notification.count({ where: { userId: wants.id, kind: "REMINDER_24H" } }), 1);
  });

  test("inscrição cancelada não recebe lembrete", async () => {
    const event = await makeEvent("cancelada", wallClockToDate("2025-01-11", "09:00"));
    const user = await makeUser("cancelou");
    await prisma.enrollment.create({ data: { userId: user.id, eventId: event.id, status: "CANCELLED" } });
    await runReminders(NOW);
    assert.equal(await prisma.notification.count({ where: { userId: user.id } }), 0);
  });
});

describe("ranking dos mais assíduos (getTopVolunteers)", () => {
  test("ordena por cultos servidos, desempata pelo mais recente e dá linha própria ao cônjuge", async () => {
    const e1 = await makeEvent("r1", new Date(Date.now() - 30 * DAY));
    const e2 = await makeEvent("r2", new Date(Date.now() - 20 * DAY));
    const e3 = await makeEvent("r3", new Date(Date.now() - 10 * DAY));
    const ana = await makeUser("ana");
    const bia = await makeUser("bia");
    const caio = await makeUser("caio");

    await prisma.enrollment.createMany({
      data: [
        // Ana: 3 cultos, em dois deles com o cônjuge
        { userId: ana.id, eventId: e1.id, status: "CONFIRMED", helpMode: "COUPLE", spouseName: `TESTE-conjuge-${RUN}` },
        { userId: ana.id, eventId: e2.id, status: "CONFIRMED", helpMode: "COUPLE", spouseName: `TESTE-conjuge-${RUN}` },
        { userId: ana.id, eventId: e3.id, status: "CONFIRMED" },
        // Bia e Caio empatam em 1 culto; Caio serviu depois
        { userId: bia.id, eventId: e1.id, status: "CONFIRMED" },
        { userId: caio.id, eventId: e3.id, status: "CONFIRMED" },
        // inscrição cancelada não conta
        { userId: bia.id, eventId: e2.id, status: "CANCELLED" },
      ],
    });

    const ranking = await getTopVolunteers(1000);
    const mine = ranking.filter((row) => /^TESTE-(ana|bia|caio|conjuge)-/.test(row.name) && row.name.endsWith(RUN));
    assert.deepEqual(
      mine.map((row) => [row.name.replace(`-${RUN}`, ""), row.services]),
      [["TESTE-ana", 3], ["TESTE-conjuge", 2], ["TESTE-caio", 1], ["TESTE-bia", 1]],
    );
    const positions = ranking.map((row) => row.rank);
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "posições crescentes");
    assert.equal(new Set(positions).size, positions.length, "nenhuma posição repetida");
  });
});

describe("arquivo: excluir evento passado preserva o crédito", () => {
  test("soma 1 em servicesDone e guarda o serviço do cônjuge", async () => {
    const event = await makeEvent("arquivado", new Date(Date.now() - 40 * DAY));
    const user = await makeUser("arq", { servicesDone: 4 });
    await prisma.enrollment.create({
      data: { userId: user.id, eventId: event.id, status: "CONFIRMED", helpMode: "COUPLE", spouseName: "TESTE-Esposa Arq" },
    });

    assert.equal(await deleteArchivedEvent(event.id), true);
    assert.equal(await deleteArchivedEvent(event.id), false, "segunda chamada não conta de novo");

    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { spouseServices: true } });
    assert.equal(after.servicesDone, 5);
    assert.equal(after.spouseServices.length, 1);
    assert.equal(after.spouseServices[0].count, 1);
    assert.equal(await prisma.event.count({ where: { id: event.id } }), 0);
  });
});

describe("limpeza do sininho", () => {
  test("apaga lidas há mais de 3 dias e não lidas há mais de 7", async () => {
    const user = await makeUser("sino");
    const base = { userId: user.id, kind: "VOLUNTEER_JOINED" as const, message: "x" };
    await prisma.notification.createMany({
      data: [
        { ...base, title: "nova" },
        { ...base, title: "lida-ontem", readAt: new Date(Date.now() - 1 * DAY) },
        { ...base, title: "lida-5-dias", readAt: new Date(Date.now() - 5 * DAY) },
        { ...base, title: "nao-lida-8-dias", createdAt: new Date(Date.now() - 8 * DAY) },
      ],
    });
    await purgeExpiredNotifications();
    const titles = (await prisma.notification.findMany({ where: { userId: user.id } })).map((n) => n.title).sort();
    assert.deepEqual(titles, ["lida-ontem", "nova"]);
  });
});

describe("links de convite e de recuperação de senha", () => {
  test("o link só funciona uma vez e grava a senha com hash", async () => {
    const user = await makeUser("token");
    const token = await issuePasswordToken(user.id, "INVITE");

    assert.deepEqual(await lookupPasswordToken(token), { ok: true, purpose: "INVITE", userName: user.name });
    assert.equal(await consumePasswordToken(token, "uma-senha-forte-123"), true);
    assert.equal(await consumePasswordToken(token, "outra-senha-forte-456"), false, "segundo uso é recusado");
    assert.deepEqual(await lookupPasswordToken(token), { ok: false, reason: "used" });

    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.ok(saved.passwordHash?.startsWith("$2"), "senha guardada como hash bcrypt");
    assert.notEqual(saved.passwordHash, "uma-senha-forte-123");
    assert.ok(saved.passwordChangedAt, "sessões antigas são invalidadas");
  });

  test("link expirado e link inventado são recusados", async () => {
    const user = await makeUser("expirado");
    const token = await issuePasswordToken(user.id, "RESET");
    await prisma.passwordToken.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.deepEqual(await lookupPasswordToken(token), { ok: false, reason: "expired" });
    assert.equal(await consumePasswordToken(token, "uma-senha-forte-123"), false);
    assert.deepEqual(await lookupPasswordToken("token-que-nao-existe-de-jeito-nenhum"), { ok: false, reason: "invalid" });
  });

  test("reenviar o convite invalida o link anterior", async () => {
    const user = await makeUser("reenvio");
    const first = await issuePasswordToken(user.id, "INVITE");
    const second = await issuePasswordToken(user.id, "INVITE");
    assert.deepEqual(await lookupPasswordToken(first), { ok: false, reason: "invalid" });
    assert.equal((await lookupPasswordToken(second)).ok, true);
  });
});
