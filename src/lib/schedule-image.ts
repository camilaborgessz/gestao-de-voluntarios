/**
 * Draws the shareable image of an event schedule (escala) on a canvas, using the
 * system colors and fonts (Poppins / Nunito). The image is what gets sent on WhatsApp.
 */

const WEEKDAYS_LONG = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const pad = (value: number) => String(value).padStart(2, "0");

/** Events are stored on the UTC wall clock, so the UTC getters give the date/time people typed. */
export function describeEventDate(startsAt: Date) {
  return {
    weekdayLong: WEEKDAYS_LONG[startsAt.getUTCDay()],
    dateFull: `${pad(startsAt.getUTCDate())}/${pad(startsAt.getUTCMonth() + 1)}/${startsAt.getUTCFullYear()}`,
    time: `${pad(startsAt.getUTCHours())}:${pad(startsAt.getUTCMinutes())}`,
  };
}

export interface SchedulePersonInput {
  name: string;
  couple: boolean;
  spouseName: string | null;
}

export interface ScheduleImageData {
  heading: string;
  weekdayLong: string;
  dateFull: string;
  time: string;
  title: string;
  uniform: string[];
  note: string;
  rows: { label: string; location: string; people: { text: string; couple: boolean }[] }[];
}

export function personChipText(person: SchedulePersonInput) {
  return person.couple ? `CASAL: ${person.name} e ${person.spouseName?.trim() || "cônjuge"}` : person.name;
}

// ---- design tokens (same values as globals.css) ---------------------------------------------

const C = {
  brand: "#02575c",
  brandDark: "#16302c",
  limeFrom: "#e3f498",
  limeTo: "#cae25f",
  bg: "#f3f6f6",
  line: "#d9e6e3",
  muted: "#5b7773",
  warningFrom: "#f5cd5d",
  warningTo: "#e6b01b",
  white: "#ffffff",
};

const WIDTH = 1080;
const SCALE = 2;
const M = 40; // outer margin
const CARD_PAD = 28;
const CHIP_H = 50;
const CHIP_GAP = 12;

interface Fonts {
  sans: string;
  display: string;
}

/** The next/font families are exposed through CSS variables on <html>. */
async function loadFonts(): Promise<Fonts> {
  const root = getComputedStyle(document.documentElement);
  const sans = root.getPropertyValue("--font-poppins").trim() || "Poppins";
  const display = root.getPropertyValue("--font-nunito").trim() || "Nunito";
  try {
    await Promise.all([
      document.fonts.load(`500 24px ${sans}`),
      document.fonts.load(`600 24px ${sans}`),
      document.fonts.load(`700 24px ${sans}`),
      document.fonts.load(`700 24px ${display}`),
    ]);
  } catch {
    // Falls back to the generic family below if the fonts are not available.
  }
  return { sans: `${sans}, Arial, sans-serif`, display: `${display}, Arial, sans-serif` };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
}

interface ChipPlacement {
  x: number;
  y: number;
  w: number;
  text: string;
  couple: boolean;
}

/** Flows chips left to right, wrapping to the next line; positions are relative to the area origin. */
function flowChips(
  ctx: CanvasRenderingContext2D,
  chips: { text: string; couple: boolean }[],
  maxWidth: number,
  chipFont: string,
  chipHeight: number,
) {
  ctx.font = chipFont;
  const placements: ChipPlacement[] = [];
  let x = 0;
  let y = 0;
  for (const chip of chips) {
    const text = fitText(ctx, chip.text, maxWidth - 44);
    const w = Math.ceil(ctx.measureText(text).width) + 44;
    if (x > 0 && x + w > maxWidth) {
      x = 0;
      y += chipHeight + CHIP_GAP;
    }
    placements.push({ x, y, w, text, couple: chip.couple });
    x += w + CHIP_GAP;
  }
  const height = chips.length === 0 ? 0 : y + chipHeight;
  return { placements, height };
}

export async function renderScheduleImage(data: ScheduleImageData): Promise<Blob> {
  const [fonts, logo] = await Promise.all([loadFonts(), loadImage("/logo-dark.png")]);
  const f = (weight: number, size: number, family: keyof Fonts = "sans") => `${weight} ${size}px ${fonts[family]}`;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  const innerW = WIDTH - 2 * M;

  // ---------- measure ----------
  const logoH = 56;
  const logoW = logo ? Math.round((logo.width / logo.height) * logoH) : 0;

  ctx.font = f(700, 24, "display");
  if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
  const headingText = fitText(ctx, data.heading.toUpperCase(), innerW - logoW - 24);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  const dateText = `${data.weekdayLong}, ${data.dateFull}`;
  ctx.font = f(700, 46);
  const dateLines = wrapText(ctx, dateText, innerW);

  ctx.font = f(700, 26);
  const timeW = Math.ceil(ctx.measureText(data.time).width) + 40;
  ctx.font = f(600, 30);
  const titleLines = wrapText(ctx, data.title, innerW - timeW - 18);
  const titleRowH = Math.max(46, titleLines.length * 40);

  ctx.font = f(600, 22);
  const uniformLabelW = data.uniform.length ? Math.ceil(ctx.measureText("Uniforme").width) + 20 : 0;
  const uniformFlow = flowChips(
    ctx,
    data.uniform.map((text) => ({ text, couple: false })),
    innerW - uniformLabelW,
    f(600, 22),
    42,
  );

  const headerH =
    40 +
    logoH +
    26 +
    dateLines.length * 56 +
    10 +
    titleRowH +
    (uniformFlow.height ? 22 + uniformFlow.height : 0) +
    40;

  ctx.font = f(600, 24);
  const noteLines = data.note ? wrapText(ctx, data.note, innerW - 2 * 24 - 10) : [];
  const noteH = noteLines.length ? 24 + 30 + noteLines.length * 34 + 22 : 0;

  const cards = data.rows.map((row) => {
    const flow = flowChips(
      ctx,
      row.people,
      innerW - 2 * CARD_PAD,
      f(600, 24),
      CHIP_H,
    );
    const titleH = row.location ? 36 + 30 : 36;
    const bodyH = flow.height || 34;
    return { row, flow, titleH, height: CARD_PAD + titleH + 18 + 2 + 18 + bodyH + CARD_PAD };
  });

  const CARD_GAP = 22;
  const cardsH = cards.reduce((sum, card) => sum + card.height, 0) + Math.max(0, cards.length - 1) * CARD_GAP;
  const totalH = Math.ceil(headerH + 32 + (noteH ? noteH + 24 : 0) + cardsH + 44);

  canvas.width = WIDTH * SCALE;
  canvas.height = totalH * SCALE;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "middle";

  // ---------- draw: background + header ----------
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, WIDTH, totalH);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, headerH);
  gradient.addColorStop(0, C.brand);
  gradient.addColorStop(1, C.brandDark);
  ctx.save();
  roundRect(ctx, 0, 0, WIDTH, headerH, [0, 0, 44, 44]);
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, headerH);
  // soft decorative circles
  ctx.fillStyle = "rgba(227, 244, 152, 0.07)";
  ctx.beginPath();
  ctx.arc(WIDTH - 60, 30, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(227, 244, 152, 0.05)";
  ctx.beginPath();
  ctx.arc(120, headerH + 10, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  let y = 40;
  if (logo) ctx.drawImage(logo, M, y, logoW, logoH);

  ctx.textAlign = "right";
  ctx.fillStyle = C.limeFrom;
  ctx.font = f(700, 24, "display");
  if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
  ctx.fillText(headingText, WIDTH - M, y + logoH / 2);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  y += logoH + 26;

  ctx.textAlign = "left";
  ctx.fillStyle = C.white;
  ctx.font = f(700, 46);
  for (const line of dateLines) {
    ctx.fillText(line, M, y + 28);
    y += 56;
  }
  y += 10;

  // time pill + event title
  const pillGradient = ctx.createLinearGradient(M, y, M + timeW, y);
  pillGradient.addColorStop(0, C.limeFrom);
  pillGradient.addColorStop(1, C.limeTo);
  ctx.fillStyle = pillGradient;
  roundRect(ctx, M, y, timeW, 46, 23);
  ctx.fill();
  ctx.fillStyle = C.brandDark;
  ctx.font = f(700, 26);
  ctx.textAlign = "center";
  ctx.fillText(data.time, M + timeW / 2, y + 24);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = f(600, 30);
  const titleTop = y + (titleRowH - titleLines.length * 40) / 2;
  titleLines.forEach((line, index) => ctx.fillText(line, M + timeW + 18, titleTop + 21 + index * 40));
  y += titleRowH;

  if (uniformFlow.height) {
    y += 22;
    ctx.fillStyle = C.limeFrom;
    ctx.font = f(600, 22);
    ctx.fillText("Uniforme", M, y + 21);
    for (const chip of uniformFlow.placements) {
      const cx = M + uniformLabelW + chip.x;
      const cy = y + chip.y;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      roundRect(ctx, cx, cy, chip.w, 42, 21);
      ctx.fill();
      ctx.strokeStyle = "rgba(227,244,152,0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.textAlign = "center";
      ctx.font = f(600, 22);
      ctx.fillText(chip.text, cx + chip.w / 2, cy + 22);
      ctx.textAlign = "left";
    }
  }

  // ---------- note ----------
  let cursor = headerH + 32;
  if (noteH) {
    ctx.save();
    roundRect(ctx, M, cursor, innerW, noteH, 22);
    ctx.clip();
    ctx.fillStyle = "#fdf3d2";
    ctx.fillRect(M, cursor, innerW, noteH);
    ctx.fillStyle = C.warningTo;
    ctx.fillRect(M, cursor, 10, noteH);
    ctx.restore();
    ctx.fillStyle = "#8a6400";
    ctx.font = f(700, 20);
    ctx.fillText("AVISO", M + 34, cursor + 24 + 12);
    ctx.fillStyle = C.brandDark;
    ctx.font = f(600, 24);
    noteLines.forEach((line, index) => ctx.fillText(line, M + 34, cursor + 24 + 30 + 17 + index * 34));
    cursor += noteH + 24;
  }

  // ---------- entry cards ----------
  for (const card of cards) {
    ctx.save();
    ctx.shadowColor = "rgba(2, 87, 92, 0.14)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = C.white;
    roundRect(ctx, M, cursor, innerW, card.height, 26);
    ctx.fill();
    ctx.restore();

    // accent bar
    ctx.fillStyle = C.brand;
    roundRect(ctx, M, cursor + 22, 8, 40, [0, 4, 4, 0]);
    ctx.fill();

    const x0 = M + CARD_PAD;
    let cy = cursor + CARD_PAD;
    ctx.fillStyle = C.brandDark;
    ctx.font = f(700, 28);
    ctx.fillText(fitText(ctx, card.row.label, innerW - 2 * CARD_PAD), x0, cy + 18);
    if (card.row.location) {
      ctx.fillStyle = C.muted;
      ctx.font = f(500, 22);
      ctx.fillText(fitText(ctx, card.row.location, innerW - 2 * CARD_PAD), x0, cy + 36 + 14);
    }
    cy += card.titleH + 18;

    ctx.fillStyle = C.line;
    ctx.fillRect(x0, cy, innerW - 2 * CARD_PAD, 2);
    cy += 2 + 18;

    if (card.flow.placements.length === 0) {
      ctx.fillStyle = C.muted;
      ctx.font = f(500, 22);
      ctx.fillText("Sem voluntários nesta entrada", x0, cy + 17);
    }
    for (const chip of card.flow.placements) {
      const px = x0 + chip.x;
      const py = cy + chip.y;
      const g = ctx.createLinearGradient(px, py, px + chip.w, py);
      if (chip.couple) {
        g.addColorStop(0, C.limeFrom);
        g.addColorStop(1, C.limeTo);
      } else {
        g.addColorStop(0, C.brand);
        g.addColorStop(1, C.brandDark);
      }
      ctx.fillStyle = g;
      roundRect(ctx, px, py, chip.w, CHIP_H, CHIP_H / 2);
      ctx.fill();
      ctx.fillStyle = chip.couple ? C.brandDark : C.white;
      ctx.font = f(600, 24);
      ctx.textAlign = "center";
      ctx.fillText(chip.text, px + chip.w / 2, py + CHIP_H / 2 + 1);
      ctx.textAlign = "left";
    }

    cursor += card.height + CARD_GAP;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))), "image/png");
  });
}
