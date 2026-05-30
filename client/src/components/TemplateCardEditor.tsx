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

// ── Canvas helpers ─────────────────────────────────────────────────────────────

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

function star5(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ia = a + Math.PI / 5;
    i === 0
      ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.lineTo(cx + r * 0.4 * Math.cos(ia), cy + r * 0.4 * Math.sin(ia));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function heart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
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

function centeredText(ctx: CanvasRenderingContext2D, text: string, y: number, maxW = W - 120) {
  ctx.fillText(text, W / 2, y, maxW);
}

function hLine(ctx: CanvasRenderingContext2D, y: number, color: string, alpha = 0.35) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, y);
  ctx.lineTo(W - 80, y);
  ctx.stroke();
  ctx.restore();
}

// ── Template: Birthday ─────────────────────────────────────────────────────────

function drawBirthday(ctx: CanvasRenderingContext2D, f: Record<string, string>) {
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.8);
  bg.addColorStop(0, "#1e1550");
  bg.addColorStop(0.55, "#0e0a30");
  bg.addColorStop(1, "#050318");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = "rgba(201,162,39,0.25)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  // Corner dots
  for (const [cx, cy] of [[28, 28], [W - 28, 28], [28, H - 28], [W - 28, H - 28]] as [number, number][]) {
    ctx.fillStyle = "#c9a227";
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scattered stars
  for (const [x, y, r, a] of [
    [110, 110, 16, 0.55], [960, 190, 12, 0.45], [75, 520, 10, 0.35],
    [985, 620, 18, 0.5], [190, 910, 12, 0.4], [890, 920, 14, 0.55],
    [510, 95, 8, 0.3], [730, 115, 10, 0.35], [145, 760, 8, 0.28],
    [940, 400, 10, 0.3],
  ] as [number, number, number, number][])
    star5(ctx, x, y, r, "#c9a227", a);

  // Dividers
  hLine(ctx, 195, "#c9a227");
  hLine(ctx, H - 195, "#c9a227");

  // Brand
  ctx.textAlign = "center";
  ctx.font = "italic 38px Georgia,serif";
  ctx.fillStyle = "rgba(201,162,39,0.85)";
  centeredText(ctx, "Dream Pictures", 158);

  // HAPPY BIRTHDAY
  const g1 = ctx.createLinearGradient(W / 2 - 420, 0, W / 2 + 420, 0);
  g1.addColorStop(0, "#c9a227");
  g1.addColorStop(0.5, "#ffe88a");
  g1.addColorStop(1, "#c9a227");
  ctx.font = "bold 92px Georgia,serif";
  ctx.fillStyle = g1;
  centeredText(ctx, "HAPPY", 340);
  centeredText(ctx, "BIRTHDAY", 452);

  // Client name
  const name = (f.name || "Dear Client").toUpperCase();
  ctx.font = "bold 66px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  centeredText(ctx, name, 592);

  // Underline
  const nw = Math.min(ctx.measureText(name).width + 80, 680);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nw / 2, 612);
  ctx.lineTo(W / 2 + nw / 2, 612);
  ctx.stroke();

  // Wish message
  ctx.font = "italic 34px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  centeredText(ctx, f.message || "Wishing you joy, success & happiness!", 692, W - 160);

  // From
  ctx.font = "30px Georgia,serif";
  ctx.fillStyle = "rgba(201,162,39,0.65)";
  centeredText(ctx, "With love & gratitude,", 812);
  ctx.font = "bold 36px Georgia,serif";
  ctx.fillStyle = "rgba(201,162,39,0.95)";
  centeredText(ctx, f.from || "Dream Pictures", 864);

  // Bottom stars
  for (let i = 0; i < 5; i++) star5(ctx, W / 2 - 60 + i * 30, 950, 7, "#c9a227", 0.7);
}

// ── Template: Anniversary ──────────────────────────────────────────────────────

function drawAnniversary(ctx: CanvasRenderingContext2D, f: Record<string, string>) {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.8);
  bg.addColorStop(0, "#38061c");
  bg.addColorStop(0.55, "#1e0310");
  bg.addColorStop(1, "#080208");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#cc7080";
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = "rgba(204,112,128,0.25)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  for (const [cx, cy] of [[28, 28], [W - 28, 28], [28, H - 28], [W - 28, H - 28]] as [number, number][]) {
    ctx.fillStyle = "#cc7080";
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const [cx, cy, s, a] of [
    [100, 150, 20, 0.28], [960, 250, 16, 0.22], [80, 700, 14, 0.2],
    [975, 700, 18, 0.28], [245, 955, 12, 0.2], [820, 955, 14, 0.22],
    [510, 80, 10, 0.18], [840, 130, 8, 0.15], [165, 480, 8, 0.15],
  ] as [number, number, number, number][])
    heart(ctx, cx, cy, s, "#cc7080", a);

  hLine(ctx, 195, "#cc7080");
  hLine(ctx, H - 195, "#cc7080");

  ctx.textAlign = "center";
  ctx.font = "italic 38px Georgia,serif";
  ctx.fillStyle = "rgba(204,112,128,0.9)";
  centeredText(ctx, "Dream Pictures", 158);

  const g1 = ctx.createLinearGradient(W / 2 - 420, 0, W / 2 + 420, 0);
  g1.addColorStop(0, "#cc7080");
  g1.addColorStop(0.5, "#ffb3c1");
  g1.addColorStop(1, "#cc7080");
  ctx.font = "bold 84px Georgia,serif";
  ctx.fillStyle = g1;
  centeredText(ctx, "HAPPY", 326);
  centeredText(ctx, "ANNIVERSARY", 430);

  const name = (f.name || "Dear Client").toUpperCase();
  ctx.font = "bold 62px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  centeredText(ctx, name, 560);

  const nw = Math.min(ctx.measureText(name).width + 80, 680);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nw / 2, 582);
  ctx.lineTo(W / 2 + nw / 2, 582);
  ctx.stroke();

  let msgY = 668;
  if (f.years && f.years.trim()) {
    ctx.font = "italic 34px Georgia,serif";
    ctx.fillStyle = "rgba(255,179,193,0.8)";
    centeredText(ctx, `Celebrating ${f.years} Beautiful Years Together`, 636, W - 160);
    msgY = 716;
  }

  ctx.font = "italic 33px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  centeredText(ctx, f.message || "Wishing you love, joy & many beautiful years together!", msgY, W - 160);

  ctx.font = "30px Georgia,serif";
  ctx.fillStyle = "rgba(204,112,128,0.65)";
  centeredText(ctx, "With warm wishes,", 818);
  ctx.font = "bold 36px Georgia,serif";
  ctx.fillStyle = "rgba(204,112,128,0.95)";
  centeredText(ctx, f.from || "Dream Pictures", 866);

  for (let i = 0; i < 5; i++) heart(ctx, W / 2 - 60 + i * 30, 950, 8, "#cc7080", 0.7);
}

// ── Template: Payment Reminder ─────────────────────────────────────────────────

function drawPayment(ctx: CanvasRenderingContext2D, f: Record<string, string>) {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f0e09");
  bg.addColorStop(0.5, "#1c1a0e");
  bg.addColorStop(1, "#0f0e09");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Top / bottom accent strips
  const strip = ctx.createLinearGradient(0, 0, W, 0);
  strip.addColorStop(0, "transparent");
  strip.addColorStop(0.3, "#d4770a");
  strip.addColorStop(0.7, "#d4770a");
  strip.addColorStop(1, "transparent");
  ctx.fillStyle = strip;
  ctx.fillRect(0, 0, W, 7);
  ctx.fillRect(0, H - 7, W, 7);

  ctx.strokeStyle = "#d4770a";
  ctx.lineWidth = 5;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = "rgba(212,119,10,0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  for (const [cx, cy] of [[28, 28], [W - 28, 28], [28, H - 28], [W - 28, H - 28]] as [number, number][]) {
    ctx.fillStyle = "#d4770a";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.font = "italic 38px Georgia,serif";
  ctx.fillStyle = "rgba(212,119,10,0.82)";
  centeredText(ctx, "Dream Pictures", 138);

  hLine(ctx, 168, "#d4770a");

  const g1 = ctx.createLinearGradient(W / 2 - 420, 0, W / 2 + 420, 0);
  g1.addColorStop(0, "#d4770a");
  g1.addColorStop(0.5, "#ffca6b");
  g1.addColorStop(1, "#d4770a");
  ctx.font = "bold 70px Georgia,serif";
  ctx.fillStyle = g1;
  centeredText(ctx, "PAYMENT REMINDER", 268);

  ctx.font = "italic 32px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  centeredText(ctx, "Dear client, your balance is pending.", 322);

  hLine(ctx, 362, "#d4770a");

  const name = (f.name || "Valued Client").toUpperCase();
  ctx.font = "bold 60px Georgia,serif";
  ctx.fillStyle = "#ffffff";
  centeredText(ctx, name, 458);

  if (f.workDesc && f.workDesc.trim()) {
    ctx.font = "italic 30px Georgia,serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    centeredText(ctx, f.workDesc, 516, W - 180);
  }

  // Balance box
  ctx.fillStyle = "rgba(212,119,10,0.09)";
  rrect(ctx, W / 2 - 290, 560, 580, 150, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(212,119,10,0.55)";
  ctx.lineWidth = 2;
  rrect(ctx, W / 2 - 290, 560, 580, 150, 18);
  ctx.stroke();

  ctx.font = "bold 26px Arial,sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.letterSpacing = "3px";
  centeredText(ctx, "PENDING BALANCE", 610);
  ctx.letterSpacing = "0px";

  const balGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
  balGrad.addColorStop(0, "#d4770a");
  balGrad.addColorStop(0.5, "#ffd27a");
  balGrad.addColorStop(1, "#d4770a");
  ctx.font = "bold 78px Georgia,serif";
  ctx.fillStyle = balGrad;
  centeredText(ctx, f.balance || "₹0", 706);

  hLine(ctx, 746, "#d4770a");

  ctx.font = "italic 33px Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  centeredText(ctx, f.message || "Kindly clear the payment at your earliest convenience.", 822, W - 160);

  ctx.font = "30px Georgia,serif";
  ctx.fillStyle = "rgba(212,119,10,0.65)";
  centeredText(ctx, "Thank you for your trust.", 876);

  ctx.font = "bold 36px Georgia,serif";
  ctx.fillStyle = "rgba(212,119,10,0.95)";
  centeredText(ctx, f.from || "Dream Pictures", 948);
}

// ── Field config per template ──────────────────────────────────────────────────

const FIELD_DEFS: Record<TplType, { key: string; label: string; placeholder?: string }[]> = {
  birthday: [
    { key: "name", label: "Client Name" },
    { key: "message", label: "Wish Message", placeholder: "Wishing you joy, success & happiness!" },
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

  const initFields = (): Record<string, string> => {
    if (type === "birthday")
      return { name: clientName, message: "Wishing you joy, success & happiness!", from: "Dream Pictures" };
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
    if (type === "birthday") drawBirthday(ctx, fields);
    else if (type === "anniversary") drawAnniversary(ctx, fields);
    else drawPayment(ctx, fields);
  }, [fields, type]);

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
      ? `🎉 Happy Birthday ${fields.name}!\n${fields.message}\n— ${fields.from}`
      : type === "anniversary"
      ? `💐 Happy Anniversary ${fields.name}!\n${fields.message}\n— ${fields.from}`
      : `Hello ${fields.name},\nYour pending balance for Dream Pictures work is ${fields.balance}.\n${fields.message}\nThank you. — ${fields.from}`;

  const waUrl = `https://wa.me/${phone.replace(/\D/g, "").replace(/^(?!91)/, "91")}?text=${encodeURIComponent(textMsg)}`;

  const SCALE = 0.40;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">{TITLE[type]}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Edit fields → live preview → Download PNG → Share on WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            data-testid="button-close-card-editor"
            className="text-zinc-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Canvas preview */}
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

          {/* Editor sidebar */}
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

            {/* Actions */}
            <div className="p-5 pt-0 flex flex-col gap-2 border-t border-zinc-800">
              <button
                data-testid="button-download-card"
                onClick={shareCard}
                className="w-full bg-white text-black font-bold rounded-xl py-3 text-sm hover:bg-zinc-100 transition-colors"
              >
                ⬇ Download / Share Image
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="button-wa-text-card"
                className="w-full bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl py-3 text-sm text-center transition-colors block"
              >
                💬 Send Text via WhatsApp
              </a>
              <p className="text-zinc-600 text-[11px] text-center leading-tight">
                Download the image → open WhatsApp → attach &amp; send
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
