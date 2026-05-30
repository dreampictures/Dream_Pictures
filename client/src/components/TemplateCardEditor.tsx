import { useRef, useEffect, useState, useCallback } from "react";

const W = 1080;
const H = 1080;
type TplType = "birthday" | "anniversary" | "payment";

interface Props {
  type: TplType;
  clientName: string;
  phone: string;
  balance?: number;
  workDesc?: string;
  onClose: () => void;
}

// ── Gold palette ───────────────────────────────────────────────────────────────
const GOLD = "#c9a227";
const GOLD_LIGHT = "#f0d060";
const GOLD_DIM = "rgba(201,162,39,0.55)";
const NAVY = "#080c1a";

// ── Helpers ────────────────────────────────────────────────────────────────────

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function goldGrad(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, "#9a7010");
  g.addColorStop(0.3, GOLD_LIGHT);
  g.addColorStop(0.5, "#ffe080");
  g.addColorStop(0.7, GOLD_LIGHT);
  g.addColorStop(1, "#9a7010");
  return g;
}

function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha = 0.8) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.25;
    i === 0
      ? ctx.moveTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a))
      : ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function smallHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, alpha = 0.5) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.3);
  ctx.bezierCurveTo(cx, cy, cx - s, cy, cx - s, cy - s * 0.4);
  ctx.bezierCurveTo(cx - s, cy - s, cx, cy - s, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx, cy - s, cx + s, cy - s, cx + s, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s, cy, cx, cy, cx, cy + s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function balloon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  color: string, dark = false
) {
  ctx.save();

  // Shadow/glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  // Main body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Highlight
  ctx.globalAlpha = dark ? 0.12 : 0.25;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.22, cy - ry * 0.22, rx * 0.38, ry * 0.28, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Shine dot
  ctx.globalAlpha = dark ? 0.15 : 0.4;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.12, ry * 0.1, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Bottom knot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy + ry - 2);
  ctx.lineTo(cx + 7, cy + ry - 2);
  ctx.lineTo(cx, cy + ry + 14);
  ctx.closePath();
  ctx.fill();

  // String (bezier curve downward)
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy + ry + 14);
  ctx.bezierCurveTo(cx - 25, cy + ry + 80, cx + 15, cy + ry + 160, cx - 10, cy + ry + 240);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function cornerOrnament(ctx: CanvasRenderingContext2D, ox: number, oy: number, mx: number, my: number) {
  // ox,oy = corner; mx,my = direction multipliers (+1 or -1)
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.9;

  const L = 90; // length along edge

  // Horizontal scroll
  ctx.beginPath();
  ctx.moveTo(ox + mx * 18, oy);
  ctx.bezierCurveTo(ox + mx * 40, oy + my * 12, ox + mx * 55, oy - my * 8, ox + mx * 70, oy + my * 4);
  ctx.bezierCurveTo(ox + mx * 82, oy - my * 8, ox + mx * L, oy, ox + mx * L, oy);
  ctx.stroke();

  // Vertical scroll
  ctx.beginPath();
  ctx.moveTo(ox, oy + my * 18);
  ctx.bezierCurveTo(ox + mx * 12, oy + my * 40, ox - mx * 8, oy + my * 55, ox + mx * 4, oy + my * 70);
  ctx.bezierCurveTo(ox - mx * 8, oy + my * 82, ox, oy + my * L, ox, oy + my * L);
  ctx.stroke();

  // Corner dot cluster
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(ox + mx * 6, oy + my * 6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ox + mx * 14, oy + my * 6, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ox + mx * 6, oy + my * 14, 2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function ornamentDivider(ctx: CanvasRenderingContext2D, cx: number, y: number, halfW = 220) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.6;

  // Left line
  ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - 28, y); ctx.stroke();
  // Right line
  ctx.beginPath(); ctx.moveTo(cx + 28, y); ctx.lineTo(cx + halfW, y); ctx.stroke();

  // Center ornament
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(cx, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 14, y, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14, y, 2.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function giftBox(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  const s = size;

  // Box body
  ctx.fillStyle = "#0a1020";
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  rrect(ctx, x, y + s * 0.35, s, s * 0.65, 4);
  ctx.fill(); ctx.stroke();

  // Lid
  ctx.fillStyle = "#0d1530";
  rrect(ctx, x - s * 0.05, y + s * 0.25, s * 1.1, s * 0.18, 4);
  ctx.fill(); ctx.stroke();

  // Ribbon vertical
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.25);
  ctx.lineTo(x + s * 0.5, y + s);
  ctx.stroke();

  // Ribbon horizontal
  ctx.beginPath();
  ctx.moveTo(x - s * 0.05, y + s * 0.34);
  ctx.lineTo(x + s * 1.05, y + s * 0.34);
  ctx.stroke();

  // Bow left loop
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.3, y + s * 0.2, s * 0.2, s * 0.12, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();

  // Bow right loop
  ctx.beginPath();
  ctx.ellipse(x + s * 0.7, y + s * 0.2, s * 0.2, s * 0.12, Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();

  // Bow center
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.24, s * 0.07, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function socialIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, type: "fb" | "ig" | "wa") {
  ctx.save();
  const r = 22;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.fillStyle = "transparent";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = "bold 20px Arial,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (type === "fb") ctx.fillText("f", cx, cy + 1);
  else if (type === "ig") {
    // Instagram: square with circle
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.8;
    rrect(ctx, cx - 11, cy - 11, 22, 22, 6);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(cx + 7, cy - 7, 2, 0, Math.PI * 2); ctx.fill();
  } else {
    // WhatsApp: WA text
    ctx.font = "bold 14px Arial,sans-serif";
    ctx.fillText("WA", cx, cy + 1);
  }
  ctx.restore();
}

// ── BIRTHDAY TEMPLATE ──────────────────────────────────────────────────────────

function drawBirthday(ctx: CanvasRenderingContext2D, f: Record<string, string>, logo: HTMLImageElement | null) {
  ctx.clearRect(0, 0, W, H);

  // ── Background ──
  const bg = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, W * 0.85);
  bg.addColorStop(0, "#0e1530");
  bg.addColorStop(0.6, "#080c1e");
  bg.addColorStop(1, "#040810");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Outer gold border ──
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // ── Inner border (thin) ──
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // ── Corner ornaments ──
  cornerOrnament(ctx, 30, 30, 1, 1);
  cornerOrnament(ctx, W - 30, 30, -1, 1);
  cornerOrnament(ctx, 30, H - 30, 1, -1);
  cornerOrnament(ctx, W - 30, H - 30, -1, -1);

  // ── Scattered sparkles ──
  const sparkles: [number, number, number, number][] = [
    [80, 220, 6, 0.7], [160, 350, 4, 0.5], [50, 600, 7, 0.6],
    [130, 750, 5, 0.5], [200, 130, 4, 0.4], [320, 60, 5, 0.5],
    [1010, 300, 6, 0.6], [970, 480, 4, 0.5], [1020, 650, 7, 0.6],
    [440, 1020, 5, 0.4], [620, 50, 4, 0.4], [760, 1020, 6, 0.5],
    [900, 1020, 4, 0.4], [150, 980, 5, 0.5],
  ];
  sparkles.forEach(([x, y, r, a]) => sparkle(ctx, x, y, r, a));

  // ── Scattered hearts ──
  const hearts: [number, number, number, number][] = [
    [70, 180, 10, 0.45], [120, 500, 8, 0.35], [1000, 230, 10, 0.4],
    [990, 550, 8, 0.35], [200, 970, 9, 0.4], [900, 960, 9, 0.4],
    [440, 975, 8, 0.35],
  ];
  hearts.forEach(([x, y, s, a]) => smallHeart(ctx, x, y, s, a));

  // ── Balloons top-right ──
  balloon(ctx, 920, 115, 52, 64, "#c9a227");
  balloon(ctx, 1010, 80, 44, 55, "#0a1020");
  balloon(ctx, 1055, 160, 38, 48, "#c9a227");

  // ── Balloons bottom-right ──
  balloon(ctx, 880, 895, 50, 62, "#0a1020");
  balloon(ctx, 960, 860, 55, 68, "#c9a227");
  balloon(ctx, 1035, 875, 44, 55, "#c9a227");

  // ── Gold ribbon bottom-left ──
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(60, 820);
  ctx.bezierCurveTo(90, 860, 50, 900, 80, 940);
  ctx.bezierCurveTo(110, 980, 70, 1010, 100, 1040);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, 820);
  ctx.bezierCurveTo(70, 860, 110, 900, 80, 940);
  ctx.bezierCurveTo(50, 980, 90, 1010, 60, 1040);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Gift box bottom-right ──
  giftBox(ctx, 810, 870, 130);

  // ── Logo area ──
  const logoY = 72;
  if (logo) {
    const lw = 72, lh = 72;
    ctx.drawImage(logo, W / 2 - lw / 2, logoY, lw, lh);
  } else {
    // Fallback: gold camera icon circle
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, logoY + 32, 32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 22px Georgia,serif";
    ctx.fillStyle = GOLD;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DP", W / 2, logoY + 32);
    ctx.restore();
  }

  // ── "Dream Pictures" brand ──
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 36px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Dream Pictures", W / 2, 170);

  // Tagline
  ctx.font = "12px Arial,sans-serif";
  ctx.fillStyle = GOLD_DIM;
  ctx.letterSpacing = "3px";
  ctx.fillText("CAPTURING MEMORIES, CREATING STORIES", W / 2, 191);
  ctx.letterSpacing = "0px";

  // Divider under tagline
  ornamentDivider(ctx, W / 2, 208, 180);

  // ── → H A P P Y ← ──
  ctx.font = "bold 52px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  // Arrows
  ctx.fillStyle = GOLD;
  ctx.font = "28px Arial,sans-serif";
  ctx.fillText("»", W / 2 - 200, 268);
  ctx.fillText("«", W / 2 + 200, 268);

  ctx.font = "bold 52px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "14px";
  ctx.fillText("HAPPY", W / 2 + 7, 272);
  ctx.letterSpacing = "0px";

  // ── BIRTHDAY (large gold gradient) ──
  ctx.font = "bold 138px Georgia,serif";
  ctx.fillStyle = goldGrad(ctx, W / 2 - 440, W / 2 + 440);
  ctx.letterSpacing = "4px";
  ctx.fillText("BIRTHDAY", W / 2 + 2, 418);
  ctx.letterSpacing = "0px";

  // ── — TO — ──
  ctx.font = "18px Arial,sans-serif";
  ctx.fillStyle = GOLD_DIM;
  ctx.fillText("———  TO  ———", W / 2, 453);

  // ── Client name ──
  const name = (f.name || "YOUR NAME").toUpperCase();
  ctx.font = "bold 78px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "3px";
  ctx.fillText(name, W / 2, 545, W - 200);
  ctx.letterSpacing = "0px";

  // ── Ornament divider under name ──
  ornamentDivider(ctx, W / 2, 570, 260);

  // ── Message box ──
  ctx.save();
  ctx.fillStyle = "rgba(8,12,26,0.75)";
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1.5;
  rrect(ctx, 200, 590, 680, 195, 14);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Message text (mixed gold italic + white)
  ctx.textAlign = "center";
  const msgLines: { text: string; gold: boolean; italic?: boolean }[] = [
    { text: "Wishing you a day filled with", gold: false },
    { text: "Joy, Love, Laughter", gold: true, italic: true },
    { text: "and wonderful moments.", gold: false },
    { text: "May this year bring you", gold: false },
    { text: "Good Health, Success, Happiness", gold: true, italic: true },
    { text: "and all that your heart desires.", gold: false },
  ];

  let msgY = 626;
  const msgLineH = 29;
  msgLines.forEach(line => {
    ctx.font = line.italic
      ? `italic 23px Georgia,serif`
      : `23px Georgia,serif`;
    ctx.fillStyle = line.gold ? GOLD_LIGHT : "rgba(255,255,255,0.88)";
    ctx.fillText(line.text, W / 2, msgY, 640);
    msgY += line.italic ? msgLineH + 2 : msgLineH - 1;
  });

  // ── Left circle badge ──
  ctx.save();
  const bx = 138, by = 690, br = 78;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(bx, by, br - 10, 0, Math.PI * 2); ctx.stroke();

  // Camera icon inside badge
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  rrect(ctx, bx - 22, by - 10, 44, 28, 5);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(bx, by + 4, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(bx, by + 4, 4, 0, Math.PI * 2); ctx.fill();
  rrect(ctx, bx + 5, by - 14, 10, 6, 2); ctx.fill();

  // Badge text
  ctx.font = "bold 8.5px Arial,sans-serif";
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.letterSpacing = "0.5px";
  ["THANK YOU", "FOR LETTING US", "BE A PART OF YOUR", "BEAUTIFUL MEMORIES"].forEach((t, i) => {
    ctx.fillText(t, bx, by + 32 + i * 12);
  });
  ctx.letterSpacing = "0px";
  ctx.restore();

  // ── Small heart above "Best Wishes" ──
  smallHeart(ctx, W / 2, 808, 10, 0.8);

  // ── "Best Wishes" script style ──
  ctx.textAlign = "center";
  ctx.font = "italic bold 68px Georgia,serif";
  ctx.fillStyle = goldGrad(ctx, W / 2 - 240, W / 2 + 240);
  ctx.fillText("Best Wishes", W / 2, 870);

  // Small hearts flanking
  smallHeart(ctx, W / 2 - 220, 855, 9, 0.7);
  smallHeart(ctx, W / 2 + 220, 855, 9, 0.7);

  // ── "With love & gratitude," ──
  ctx.font = "24px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("With love & gratitude,", W / 2, 910);

  // ── "Dream Pictures" ──
  ctx.font = "bold 34px Georgia,serif";
  ctx.fillStyle = goldGrad(ctx, W / 2 - 160, W / 2 + 160);
  ctx.fillText(f.from || "Dream Pictures", W / 2, 950);

  // ── Thin divider before social ──
  ornamentDivider(ctx, W / 2, 970, 160);

  // ── Social icons ──
  socialIcon(ctx, W / 2 - 60, 1002, "fb");
  socialIcon(ctx, W / 2, 1002, "ig");
  socialIcon(ctx, W / 2 + 60, 1002, "wa");
}

// ── ANNIVERSARY TEMPLATE ───────────────────────────────────────────────────────

function drawAnniversary(ctx: CanvasRenderingContext2D, f: Record<string, string>) {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.8);
  bg.addColorStop(0, "#2d0a18");
  bg.addColorStop(0.55, "#1a0510");
  bg.addColorStop(1, "#080208");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#cc7080";
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.strokeStyle = "rgba(204,112,128,0.3)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  cornerOrnament(ctx, 30, 30, 1, 1);
  cornerOrnament(ctx, W - 30, 30, -1, 1);
  cornerOrnament(ctx, 30, H - 30, 1, -1);
  cornerOrnament(ctx, W - 30, H - 30, -1, -1);

  // Scattered hearts
  [[90, 150, 18, 0.28], [960, 250, 14, 0.22], [80, 700, 12, 0.2],
   [975, 700, 16, 0.28], [245, 955, 11, 0.2], [820, 955, 13, 0.22],
   [510, 80, 9, 0.18], [840, 130, 7, 0.15]].forEach(([cx, cy, s, a]) =>
    smallHeart(ctx, cx, cy, s, a));

  ornamentDivider(ctx, W / 2, 195, 220);
  ornamentDivider(ctx, W / 2, H - 195, 220);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "italic 38px Georgia,serif";
  ctx.fillStyle = "rgba(204,112,128,0.9)";
  ctx.fillText("Dream Pictures", W / 2, 158);

  const g1 = ctx.createLinearGradient(W / 2 - 420, 0, W / 2 + 420, 0);
  g1.addColorStop(0, "#cc7080");
  g1.addColorStop(0.5, "#ffb3c1");
  g1.addColorStop(1, "#cc7080");

  ctx.font = "bold 84px Georgia,serif";
  ctx.fillStyle = g1;
  ctx.fillText("HAPPY", W / 2, 326);
  ctx.fillText("ANNIVERSARY", W / 2, 430);

  const name = (f.name || "Dear Client").toUpperCase();
  ctx.font = "bold 62px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, W / 2, 560, W - 160);

  ornamentDivider(ctx, W / 2, 582, 260);

  let msgY = 668;
  if (f.years && f.years.trim()) {
    ctx.font = "italic 34px Georgia,serif";
    ctx.fillStyle = "rgba(255,179,193,0.8)";
    ctx.fillText(`Celebrating ${f.years} Beautiful Years Together`, W / 2, 636, W - 160);
    msgY = 716;
  }

  ctx.font = "italic 33px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(f.message || "Wishing you love, joy & many beautiful years together!", W / 2, msgY, W - 160);

  ctx.font = "30px Georgia,serif";
  ctx.fillStyle = "rgba(204,112,128,0.65)";
  ctx.fillText("With warm wishes,", W / 2, 818);
  ctx.font = "italic bold 60px Georgia,serif";
  ctx.fillStyle = g1;
  ctx.fillText("Best Wishes", W / 2, 880);
  ctx.font = "bold 34px Georgia,serif";
  ctx.fillStyle = "rgba(204,112,128,0.95)";
  ctx.fillText(f.from || "Dream Pictures", W / 2, 938);

  socialIcon(ctx, W / 2 - 60, 990, "fb");
  socialIcon(ctx, W / 2, 990, "ig");
  socialIcon(ctx, W / 2 + 60, 990, "wa");
}

// ── PAYMENT TEMPLATE ───────────────────────────────────────────────────────────

function drawPayment(ctx: CanvasRenderingContext2D, f: Record<string, string>) {
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f0e09"); bg.addColorStop(0.5, "#1c1a0e"); bg.addColorStop(1, "#0f0e09");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const strip = ctx.createLinearGradient(0, 0, W, 0);
  strip.addColorStop(0, "transparent"); strip.addColorStop(0.3, "#d4770a");
  strip.addColorStop(0.7, "#d4770a"); strip.addColorStop(1, "transparent");
  ctx.fillStyle = strip;
  ctx.fillRect(0, 0, W, 7); ctx.fillRect(0, H - 7, W, 7);

  ctx.strokeStyle = "#d4770a"; ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = "rgba(212,119,10,0.18)"; ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  cornerOrnament(ctx, 30, 30, 1, 1);
  cornerOrnament(ctx, W - 30, 30, -1, 1);
  cornerOrnament(ctx, 30, H - 30, 1, -1);
  cornerOrnament(ctx, W - 30, H - 30, -1, -1);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = "italic 38px Georgia,serif";
  ctx.fillStyle = "rgba(212,119,10,0.82)";
  ctx.fillText("Dream Pictures", W / 2, 138);

  ornamentDivider(ctx, W / 2, 158, 200);

  const g1 = ctx.createLinearGradient(W / 2 - 420, 0, W / 2 + 420, 0);
  g1.addColorStop(0, "#d4770a"); g1.addColorStop(0.5, "#ffca6b"); g1.addColorStop(1, "#d4770a");
  ctx.font = "bold 70px Georgia,serif"; ctx.fillStyle = g1;
  ctx.fillText("PAYMENT REMINDER", W / 2, 268);

  ctx.font = "italic 32px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("Dear client, your balance is pending.", W / 2, 322);

  ornamentDivider(ctx, W / 2, 355, 200);

  const name = (f.name || "Valued Client").toUpperCase();
  ctx.font = "bold 60px Georgia,serif"; ctx.fillStyle = "#ffffff";
  ctx.fillText(name, W / 2, 450, W - 180);

  if (f.workDesc && f.workDesc.trim()) {
    ctx.font = "italic 30px Georgia,serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(f.workDesc, W / 2, 510, W - 180);
  }

  ctx.fillStyle = "rgba(212,119,10,0.09)";
  rrect(ctx, W / 2 - 290, 548, 580, 158, 18); ctx.fill();
  ctx.strokeStyle = "rgba(212,119,10,0.55)"; ctx.lineWidth = 2;
  rrect(ctx, W / 2 - 290, 548, 580, 158, 18); ctx.stroke();

  ctx.font = "bold 22px Arial,sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.letterSpacing = "4px";
  ctx.fillText("PENDING BALANCE", W / 2, 596);
  ctx.letterSpacing = "0px";

  const balGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
  balGrad.addColorStop(0, "#d4770a"); balGrad.addColorStop(0.5, "#ffd27a"); balGrad.addColorStop(1, "#d4770a");
  ctx.font = "bold 82px Georgia,serif"; ctx.fillStyle = balGrad;
  ctx.fillText(f.balance || "₹0", W / 2, 696);

  ornamentDivider(ctx, W / 2, 730, 200);

  ctx.font = "italic 33px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.fillText(f.message || "Kindly clear the payment at your earliest convenience.", W / 2, 806, W - 160);

  ctx.font = "30px Georgia,serif"; ctx.fillStyle = "rgba(212,119,10,0.65)";
  ctx.fillText("Thank you for your trust.", W / 2, 860);

  ctx.font = "italic bold 54px Georgia,serif";
  ctx.fillStyle = g1;
  ctx.fillText("Thank You", W / 2, 930);

  ctx.font = "bold 34px Georgia,serif";
  ctx.fillStyle = "rgba(212,119,10,0.9)";
  ctx.fillText(f.from || "Dream Pictures", W / 2, 978);

  ornamentDivider(ctx, W / 2, 998, 160);
  socialIcon(ctx, W / 2 - 60, 1032, "fb");
  socialIcon(ctx, W / 2, 1032, "ig");
  socialIcon(ctx, W / 2 + 60, 1032, "wa");
}

// ── Field config ───────────────────────────────────────────────────────────────

const FIELD_DEFS: Record<TplType, { key: string; label: string; placeholder?: string }[]> = {
  birthday: [
    { key: "name", label: "Client Name" },
    { key: "message", label: "Wish Message (optional)", placeholder: "Default message will show" },
    { key: "from", label: "From", placeholder: "Dream Pictures" },
  ],
  anniversary: [
    { key: "name", label: "Client Name" },
    { key: "years", label: "Years Together (optional)", placeholder: "e.g. 5" },
    { key: "message", label: "Wish Message", placeholder: "Wishing you love, joy & many beautiful years!" },
    { key: "from", label: "From", placeholder: "Dream Pictures" },
  ],
  payment: [
    { key: "name", label: "Client Name" },
    { key: "workDesc", label: "Work Description", placeholder: "Wedding Album, Studio Shoot…" },
    { key: "balance", label: "Pending Balance", placeholder: "₹5,000" },
    { key: "message", label: "Message", placeholder: "Kindly clear the payment at your earliest convenience." },
    { key: "from", label: "From", placeholder: "Dream Pictures" },
  ],
};

const TITLE: Record<TplType, string> = {
  birthday: "🎂 Birthday Card",
  anniversary: "💐 Anniversary Card",
  payment: "💰 Payment Reminder Card",
};

// ── Main component ─────────────────────────────────────────────────────────────

export function TemplateCardEditor({ type, clientName, phone, balance, workDesc, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  // Load DP logo once
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setLogoImg(img);
    img.onerror = () => setLogoImg(null);
    img.src = "/dp-logo-white.png";
  }, []);

  const initFields = (): Record<string, string> => {
    if (type === "birthday")
      return { name: clientName, message: "", from: "Dream Pictures" };
    if (type === "anniversary")
      return { name: clientName, years: "", message: "Wishing you love, joy & many beautiful years together!", from: "Dream Pictures" };
    return {
      name: clientName,
      workDesc: workDesc ?? "",
      balance: balance ? `₹${balance.toLocaleString("en-IN")}` : "₹0",
      message: "Kindly clear the payment at your earliest convenience.",
      from: "Dream Pictures",
    };
  };

  const [fields, setFields] = useState<Record<string, string>>(initFields);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (type === "birthday") drawBirthday(ctx, fields, logoImg);
    else if (type === "anniversary") drawAnniversary(ctx, fields);
    else drawPayment(ctx, fields);
  }, [fields, type, logoImg]);

  useEffect(() => { draw(); }, [draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${type}-${clientName.replace(/\s+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  function shareCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) { download(); return; }
      const file = new File([blob], `${type}-card.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; } catch { /* fall through */ }
      }
      download();
    }, "image/png");
  }

  const textMsg =
    type === "birthday"
      ? `Happy Birthday ${fields.name}!\nWishing you joy, success & happiness!\n— ${fields.from}`
      : type === "anniversary"
      ? `Happy Anniversary ${fields.name}!\n${fields.message}\n— ${fields.from}`
      : `Hello ${fields.name},\nYour pending balance for Dream Pictures work is ${fields.balance}.\n${fields.message}\nThank you. — ${fields.from}`;

  const waUrl = `https://wa.me/${phone.replace(/\D/g, "").replace(/^(?!91)/, "91")}?text=${encodeURIComponent(textMsg)}`;

  const SCALE = 0.40;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">{TITLE[type]}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Edit fields → live preview → Download PNG → Share</p>
          </div>
          <button
            onClick={onClose}
            data-testid="button-close-card-editor"
            className="text-zinc-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >×</button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-zinc-950 p-6 overflow-auto">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              style={{
                width: `${W * SCALE}px`,
                height: `${H * SCALE}px`,
                borderRadius: "12px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
                flexShrink: 0,
              }}
            />
          </div>

          <div className="w-full lg:w-72 flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto">
            <div className="p-5 flex flex-col gap-3 flex-1">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold">Edit Fields</p>
              {FIELD_DEFS[type].map(fd => (
                <div key={fd.key}>
                  <label className="text-zinc-400 text-xs mb-1 block">{fd.label}</label>
                  <input
                    data-testid={`input-card-${fd.key}`}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                    value={fields[fd.key] ?? ""}
                    onChange={e => setFields(prev => ({ ...prev, [fd.key]: e.target.value }))}
                    placeholder={fd.placeholder ?? fd.label}
                  />
                </div>
              ))}
            </div>

            <div className="p-5 pt-0 flex flex-col gap-2 border-t border-zinc-800">
              <button
                data-testid="button-download-card"
                onClick={shareCard}
                className="w-full bg-white text-black font-bold rounded-xl py-3 text-sm hover:bg-zinc-100 transition-colors"
              >⬇ Download / Share Image</button>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="button-wa-text-card"
                className="w-full bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl py-3 text-sm text-center transition-colors block"
              >💬 Send Text via WhatsApp</a>
              <p className="text-zinc-600 text-[11px] text-center leading-tight">
                Download image → open WhatsApp → attach &amp; send
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
