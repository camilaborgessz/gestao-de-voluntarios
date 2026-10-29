import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { spouseKey } from "@/lib/spouse-key";
import { formatPhoneInput } from "@/lib/phone";
import { seatsFor, seatsTaken } from "@/lib/seats";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";
import {
  buildMonthGrid,
  formatEventSchedule,
  toDateInputValue,
  toTimeInputValue,
  wallClockNow,
  wallClockToDate,
} from "@/lib/event-schedule";
import { initialReminderMarks } from "@/lib/notifications";
import { eventArchiveDaysLeft, noticeArchiveDaysLeft, ARCHIVE_DAYS } from "@/lib/archive";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";
import { VERSES } from "@/lib/verses-arc";
import { passwordProblem, MIN_PASSWORD_LENGTH, TOKEN_TTL_MS } from "@/lib/password-tokens";

describe("nome do cônjuge (spouse-key)", () => {
  test("ignora maiúsculas, acentos e espaços extras", () => {
    assert.equal(spouseKey("  JOSÉ   da Silva "), "jose da silva");
    assert.equal(spouseKey("Melk"), spouseKey(" melk "));
  });
  test("nomes diferentes geram chaves diferentes", () => {
    assert.notEqual(spouseKey("Ana Paula"), spouseKey("Ana Maria"));
  });
});

describe("telefone", () => {
  test("formata celular com 11 dígitos", () => {
    assert.equal(formatPhoneInput("69991234567"), "(69) 99123-4567");
  });
  test("formata fixo com 10 dígitos", () => {
    assert.equal(formatPhoneInput("6932211234"), "(69) 3221-1234");
  });
  test("ignora letras e limita a 11 dígitos", () => {
    assert.equal(formatPhoneInput("(69) 9 9123-4567 99"), "(69) 99123-4567");
    assert.equal(formatPhoneInput("abc"), "");
  });
});

describe("vagas (meta)", () => {
  test("casal ocupa duas vagas e individual, uma", () => {
    assert.equal(seatsFor("INDIVIDUAL"), 1);
    assert.equal(seatsFor("COUPLE"), 2);
    assert.equal(seatsTaken([{ helpMode: "INDIVIDUAL" }, { helpMode: "COUPLE" }, { helpMode: "COUPLE" }]), 5);
  });
});

describe("limite de tentativas (rate-limit)", () => {
  test("bloqueia depois do máximo e libera ao limpar", () => {
    const key = "teste-limite";
    clearAttempts(key);
    assert.equal(allowAttempt(key, 3, 60_000), true);
    assert.equal(allowAttempt(key, 3, 60_000), true);
    assert.equal(allowAttempt(key, 3, 60_000), true);
    assert.equal(allowAttempt(key, 3, 60_000), false);
    clearAttempts(key);
    assert.equal(allowAttempt(key, 3, 60_000), true);
  });
  test("a janela expira", async () => {
    const key = "teste-janela";
    clearAttempts(key);
    assert.equal(allowAttempt(key, 1, 30), true);
    assert.equal(allowAttempt(key, 1, 30), false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(allowAttempt(key, 1, 30), true);
  });
});

describe("datas e horários (horário de Porto Velho)", () => {
  test("data e hora digitadas voltam iguais, em qualquer fuso", () => {
    const date = wallClockToDate("2026-11-01", "19:30");
    assert.equal(toDateInputValue(date), "2026-11-01");
    assert.equal(toTimeInputValue(date), "19:30");
    assert.deepEqual(formatEventSchedule(date), { date: "01/11", weekday: "Dom", time: "19:30" });
  });
  test("o relógio do app usa UTC-4: 02h UTC ainda é o dia anterior à noite", () => {
    const now = wallClockNow(new Date("2026-10-28T02:00:00Z"));
    assert.equal(now.toISOString(), "2026-10-27T22:00:00.000Z");
  });
  test("o grid do calendário começa no domingo e marca os dias de outro mês", () => {
    const weeks = buildMonthGrid(2026, 9); // outubro de 2026 começa numa quinta-feira
    assert.equal(weeks[0].length, 7);
    assert.equal(weeks[0][0].muted, true);
    assert.equal(weeks[0][4].day, 1);
    assert.equal(weeks[0][4].muted, false);
    assert.ok(weeks.length >= 4 && weeks.length <= 6);
    assert.equal(weeks.flat().filter((cell) => !cell.muted).length, 31);
  });
});

describe("lembrete de 24 horas (marcação inicial)", () => {
  const now = wallClockToDate("2026-10-28", "12:00");
  test("evento daqui a 5 horas: o lembrete já é dado como feito", () => {
    const marks = initialReminderMarks(wallClockToDate("2026-10-28", "17:00"), now);
    assert.ok(marks.remind24At instanceof Date);
  });
  test("evento daqui a 3 dias: o lembrete continua pendente", () => {
    const marks = initialReminderMarks(wallClockToDate("2026-10-31", "19:00"), now);
    assert.equal(marks.remind24At, null);
  });
});

describe("arquivo de eventos e avisos (30 dias)", () => {
  const now = wallClockToDate("2026-10-28", "12:00");
  test("evento de ontem tem 30 dias restantes", () => {
    assert.equal(eventArchiveDaysLeft(wallClockToDate("2026-10-27", "19:00"), now), ARCHIVE_DAYS);
  });
  test("evento de 31 dias atrás já expirou", () => {
    assert.equal(eventArchiveDaysLeft(wallClockToDate("2026-09-27", "19:00"), now), 0);
  });
  test("aviso que terminou há 10 dias tem 20 dias restantes", () => {
    const left = noticeArchiveDaysLeft(wallClockToDate("2026-10-18", "12:00"), now);
    assert.equal(left, 20);
  });
});

describe("versículo do dia (ARC)", () => {
  test("devolve texto e referência, sempre o mesmo no mesmo dia", async () => {
    const a = await getVerseOfTheDay();
    const b = await getVerseOfTheDay();
    assert.ok(a.verse.length > 10 && a.reference.length > 3);
    assert.deepEqual(a, b);
  });
  test("a lista não tem versículos repetidos nem vazios", () => {
    assert.ok(VERSES.length >= 20);
    assert.equal(new Set(VERSES.map((v) => v.reference)).size, VERSES.length);
    assert.ok(VERSES.every((v) => v.text.trim().length > 0));
  });
});

describe("regras de senha e de links", () => {
  test("mínimo de caracteres", async () => {
    assert.match((await passwordProblem("abc12"))!, new RegExp(String(MIN_PASSWORD_LENGTH)));
  });
  test("senhas comuns são recusadas", async () => {
    assert.ok(await passwordProblem("senha123"));
    assert.ok(await passwordProblem("aaaaaaaaaa"));
  });
  test("máximo de 72 caracteres (limite do bcrypt)", async () => {
    assert.ok(await passwordProblem("x".repeat(73) + "Y1"));
  });
  test("convite vale 72 horas e recuperação, 30 minutos", () => {
    assert.equal(TOKEN_TTL_MS.INVITE, 72 * 3_600_000);
    assert.equal(TOKEN_TTL_MS.RESET, 30 * 60_000);
  });
});
