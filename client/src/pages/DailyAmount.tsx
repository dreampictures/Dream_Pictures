import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, Lock, Unlock, LogOut, ChevronLeft, ChevronRight, History, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff, Banknote, BarChart3, CalendarDays, Coins, Download, Home, Landmark, Printer, RefreshCw, Scale, Search, Wallet, WalletCards, ArrowUpRight, FileText, Settings, Calculator } from "lucide-react";

const PIN_KEY = "da_auth_pin";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n || 0);
}

function dapiHeaders(pin: string) {
  return { "x-da-pin": pin };
}

function pf(v: any): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

type DailyHistoryPoint = {
  date: string;
  openingBalance: number;
  cashTotal: number;
  bankTotal: number;
  aepsTotal: number;
  systemBalance: number;
  difference: number | null;
};

type HistorySeriesPoint = { date: string; value: number };

function normalizeHistoryDate(value: any): string | null {
  const key = value instanceof Date && Number.isFinite(value.getTime())
    ? value.toISOString().slice(0, 10)
    : String(value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const timestamp = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === key
    ? key
    : null;
}

function shiftHistoryDate(date: string, days: number): string {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`) + days * 86_400_000;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function optionalHistoryNumber(value: any): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dailyHistoryMetrics(entry: any): DailyHistoryPoint | null {
  const date = normalizeHistoryDate(entry?.date);
  if (!date) return null;

  const fields = [
    entry.openingBalance,
    entry.notes10,
    entry.notes20,
    entry.notes50,
    entry.notes100,
    entry.notes200,
    entry.notes500,
    entry.coins,
    entry.bobSaving,
    entry.bobCurrent,
    entry.hdfc,
    entry.kotak,
    entry.au,
    entry.sbi,
    entry.aepsBob,
    entry.aepsFino,
    entry.aepsPayworld,
    entry.aepsDigipay,
  ].map(optionalHistoryNumber);
  if (fields.some((value) => value === null)) return null;

  const [
    openingBalance, notes10, notes20, notes50, notes100, notes200, notes500, coins,
    bobSaving, bobCurrent, hdfc, kotak, au, sbi,
    aepsBob, aepsFino, aepsPayworld, aepsDigipay,
  ] = fields as number[];
  const cashTotal = notes10 * 10 + notes20 * 20 + notes50 * 50 +
    notes100 * 100 + notes200 * 200 + notes500 * 500 + coins;
  const bankTotal = bobSaving + bobCurrent + hdfc + kotak + au + sbi;
  const aepsTotal = aepsBob + aepsFino + aepsPayworld + aepsDigipay;
  const systemBalance = cashTotal + bankTotal + aepsTotal;
  if (![cashTotal, bankTotal, aepsTotal, systemBalance].every(Number.isFinite)) return null;

  const storedDifference = optionalHistoryNumber(entry.difference);
  const incomeTotal = optionalHistoryNumber(entry.incomeTotal);
  const expenseTotal = optionalHistoryNumber(entry.expenseTotal);
  const calculatedDifference = incomeTotal !== null && expenseTotal !== null
    ? systemBalance - (openingBalance + incomeTotal - expenseTotal)
    : null;
  const difference = storedDifference !== null
    ? storedDifference
    : calculatedDifference !== null && Number.isFinite(calculatedDifference)
      ? calculatedDifference
      : null;

  return {
    date,
    openingBalance,
    cashTotal,
    bankTotal,
    aepsTotal,
    systemBalance,
    difference,
  };
}

function normalizedRangeRatio(value: number, min: number, max: number): number {
  const scale = Math.max(1, Math.abs(min), Math.abs(max));
  const scaledMin = min / scale;
  const scaledSpan = max / scale - scaledMin;
  if (scaledSpan === 0) return 0.5;
  return Math.min(1, Math.max(0, (value / scale - scaledMin) / scaledSpan));
}

function sparklineGeometry(series: HistorySeriesPoint[], startDate: string, endDate: string) {
  const validPoints = series.filter((point) => Number.isFinite(point.value));
  if (!validPoints.length) return null;
  const startTimestamp = Date.parse(`${startDate}T00:00:00.000Z`);
  const endTimestamp = Date.parse(`${endDate}T00:00:00.000Z`);
  const duration = Math.max(1, endTimestamp - startTimestamp);
  const min = Math.min(...validPoints.map((point) => point.value));
  const max = Math.max(...validPoints.map((point) => point.value));
  const points = validPoints.map((point) => ({
    x: 4 + ((Date.parse(`${point.date}T00:00:00.000Z`) - startTimestamp) / duration) * 152,
    y: 38 - normalizedRangeRatio(point.value, min, max) * 28,
  }));
  const line = points.map((point, index) =>
    `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  ).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  return {
    points,
    line,
    area: points.length > 1 ? `${line} L${last.x.toFixed(2)} 48 L${first.x.toFixed(2)} 48 Z` : "",
  };
}

function formatHistoryDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function fmtInputAmount(n: number) {
  return n ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 20 }).format(n) : "";
}

function AmountInput({
  value,
  onChange,
  disabled,
  placeholder = "0",
  className,
  style,
  id,
  "data-testid": testId,
  onKeyDown,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className: string;
  style?: React.CSSProperties;
  id?: string;
  "data-testid"?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <input
      id={id}
      data-testid={testId}
      type="text"
      inputMode="decimal"
      value={isFocused ? draft : fmtInputAmount(value)}
      onFocus={() => {
        setIsFocused(true);
        setDraft(value ? String(value) : "");
      }}
      onChange={(e) => {
        const input = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
        const decimalIndex = input.indexOf(".");
        const normalized = decimalIndex === -1
          ? input
          : input.slice(0, decimalIndex + 1) + input.slice(decimalIndex + 1).replace(/\./g, "");
        setDraft(normalized);
        onChange(normalized === "" ? 0 : pf(normalized));
      }}
      onBlur={() => setIsFocused(false)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      style={style}
    />
  );
}

// ─── PIN Screen ───────────────────────────────────────────────────────────────
function PinScreen({ onSuccess }: { onSuccess: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dailyamount/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        localStorage.setItem(PIN_KEY, pin);
        onSuccess(pin);
      } else {
        setError("Incorrect PIN. Try again.");
        setPin("");
      }
    } catch {
      setError("Connection error. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        minHeight: "100svh",
        backgroundImage: 'url("/assets/login-background.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#020916]/10" />
      <div className="relative z-10 w-full max-w-[432px] -translate-y-[3px]">
        <div className="relative mb-5 text-center">
          <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-300/70 bg-amber-300/[0.08] shadow-[0_0_24px_rgba(250,204,21,0.22)]">
            <Lock size={32} className="text-amber-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[72px] z-0 h-[90px] w-[calc(100%+80px)] -translate-x-1/2 rounded-full blur-[2px]"
            style={{ background: "radial-gradient(ellipse, rgba(0,14,40,0.99) 0%, rgba(0,14,40,0.97) 82%, rgba(0,14,40,0) 100%)" }}
          />
          <h1 className="relative z-10 text-[21px] font-bold leading-[26px] text-white">Daily Reconciliation</h1>
          <p className="relative z-10 mt-[10px] text-xs leading-[18px] tracking-wide text-slate-400">Enter your PIN to continue</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl px-[27px] py-[30px]"
          style={{
            background: "rgba(7,18,38,0.56)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(148,163,184,0.20)",
            boxShadow: "0 18px 54px rgba(0,0,0,0.32), inset 0 1px rgba(255,255,255,0.055)",
          }}
        >
          <div className="relative">
            <input
              data-testid="input-pin"
              type={show ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              aria-label="Enter PIN"
              aria-describedby={error ? "dailyamount-pin-error" : undefined}
              className="h-[60px] w-full rounded-xl bg-[#09172e]/75 px-4 pr-11 text-center text-sm tracking-[0.32em] text-white outline-none transition placeholder:tracking-[0.28em] placeholder:text-slate-400 focus:ring-2 focus:ring-amber-300/50"
              style={{
                border: "1px solid rgba(250,204,21,0.82)",
                boxShadow: "0 0 15px rgba(250,204,21,0.08)",
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide PIN" : "Show PIN"}
              aria-pressed={show}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p id="dailyamount-pin-error" role="alert" className="text-center text-xs text-red-300">{error}</p>}
          <button
            data-testid="button-pin-submit"
            type="submit"
            disabled={loading || !pin}
            className="flex h-[56px] w-full items-center justify-center rounded-[11px] font-semibold text-[#15100a] shadow-[0_6px_18px_rgba(235,174,25,0.20)] transition duration-200 hover:-translate-y-px hover:shadow-[0_8px_22px_rgba(235,174,25,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09172e] disabled:cursor-not-allowed disabled:opacity-55"
            style={{ background: "linear-gradient(180deg, #f7c743 0%, #e8ad1e 100%)" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, subtitle, accent = "#d4af37", icon, children, className = "", action, id }: { title: string; subtitle?: string; accent?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className={`da-panel rounded-xl overflow-hidden flex flex-col ${className}`} style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 8px 22px rgba(1,9,20,0.13)" }}>
      <div className="da-card-head px-3 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
        {icon ? (
          <span className="da-card-icon" style={{ color: accent, background: `${accent}20`, borderColor: `${accent}60` }}>{icon}</span>
        ) : (
          <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: accent }} />
        )}
        <div className="da-card-heading">
          <h3 className="text-[11px] font-bold text-white tracking-wide">{title}</h3>
          {subtitle && <span className="da-card-subtitle">{subtitle}</span>}
        </div>
        {action}
      </div>
      <div className="da-card-body p-3 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}

// ─── Denomination Row ─────────────────────────────────────────────────────────
function DenomRow({ denom, count, onChange, disabled }: { denom: number; count: number; onChange: (v: number) => void; disabled?: boolean }) {
  const total = count * denom;
  return (
    <div className="da-denom-row flex items-center gap-2 py-1.5">
      <div className="w-14 shrink-0 text-center">
        <span
          data-denomination={denom}
          className="da-denom-badge inline-flex min-w-12 justify-center text-xs font-bold text-slate-200 bg-slate-700/80 rounded-md px-1.5 py-1"
        >
          ₹{denom}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          aria-label={`Decrease ₹${denom} note count`}
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={disabled || count <= 0}
          className="da-stepper w-7 h-7 flex items-center justify-center rounded-md text-slate-300 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={13} />
        </button>
        <input
          type="number"
          step="0.01"
          min="0"
          value={count || ""}
          onChange={(e) => onChange(pf(e.target.value))}
          disabled={disabled}
          placeholder="0"
          className="da-count-input w-16 bg-slate-950/50 text-white text-center rounded-md px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-80"
          style={{ border: "1px solid #2a4763" }}
        />
        <button
          type="button"
          aria-label={`Increase ₹${denom} note count`}
          onClick={() => onChange(count + 1)}
          disabled={disabled}
          className="da-stepper w-7 h-7 flex items-center justify-center rounded-md text-slate-300 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
      <span className="flex-1 text-right text-yellow-400 text-xs font-mono">₹{fmt(total)}</span>
    </div>
  );
}

// ─── Amount Row ───────────────────────────────────────────────────────────────
function AmountRow({ label, fieldKey, value, onChange, disabled, accentColor = "focus:ring-yellow-500", marker, markerColor = "#60a5fa" }: {
  label: string; fieldKey: string; value: number; onChange: (v: number) => void; disabled?: boolean; accentColor?: string; marker?: string; markerColor?: string;
}) {
  return (
    <div className="da-account-row flex items-center gap-2 py-1 border-b border-slate-700/25 last:border-0">
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {marker && <span className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center text-[8px] font-bold" style={{ background: `${markerColor}25`, border: `1px solid ${markerColor}45`, color: markerColor }}>{marker}</span>}
        <span className="text-slate-300 text-xs truncate">{label}</span>
      </div>
      <div className="relative shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
        <AmountInput
          data-testid={`input-${fieldKey}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder="0"
          className={`da-account-input w-28 bg-slate-950/40 text-white text-right rounded-md px-2 pl-5 py-1 text-xs outline-none focus:ring-1 ${accentColor} disabled:opacity-85 disabled:cursor-not-allowed`}
          style={{ border: "1px solid #2a4763" }}
        />
      </div>
    </div>
  );
}

// ─── Section total bar ────────────────────────────────────────────────────────
function TotalBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="da-section-total flex justify-between items-center pt-2 mt-1" style={{ borderTop: `1px solid ${color}30` }}>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>₹{fmt(value)}</span>
    </div>
  );
}

function MetricIconSlot({ fallback, slotName, accent }: {
  fallback: React.ReactNode; slotName: string; accent: string;
}) {
  return (
    <div
      className="da-metric-icon w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
      data-image-slot={slotName}
      aria-hidden="true"
      style={{ background: `${accent}20`, color: accent }}
    >
      {fallback}
    </div>
  );
}

function MetricSparkline({ label, accent, series, startDate, endDate }: {
  label: string; accent: string; series: HistorySeriesPoint[]; startDate: string; endDate: string;
}) {
  const geometry = sparklineGeometry(series, startDate, endDate);
  if (!geometry) return null;

  return (
    <svg
      className="da-metric-sparkline"
      viewBox="0 0 160 48"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Historical ${label} values across ${series.length} saved reconciliation date${series.length === 1 ? "" : "s"}`}
      style={{ color: accent }}
    >
      {geometry.area && <path d={geometry.area} fill="currentColor" opacity=".12" />}
      {geometry.points.length > 1 && (
        <path
          d={geometry.line}
          fill="none"
          stroke="currentColor"
          strokeOpacity=".48"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {geometry.points.length === 1 && (
        <circle cx={geometry.points[0].x} cy={geometry.points[0].y} r="2.4" fill="currentColor" />
      )}
    </svg>
  );
}

function MetricCard({ label, accent, icon, children, testId, sub, className = "", sparklineSeries = [], sparklineStartDate = "", sparklineEndDate = "" }: {
  label: string; accent: string; icon: React.ReactNode; children: React.ReactNode; testId: string; sub?: string; className?: string;
  sparklineSeries?: HistorySeriesPoint[]; sparklineStartDate?: string; sparklineEndDate?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`da-metric min-w-0 rounded-lg px-2 py-1.5 flex items-center gap-2 ${className}`}
    >
      <MetricIconSlot fallback={icon} slotName={testId} accent={accent} />
      <div className="min-w-0 flex-1">
        <p className="da-metric-label text-[9px] text-slate-400 truncate">{label}</p>
        <div className="da-metric-value text-xs sm:text-[13px] font-bold font-mono text-white truncate">{children}</div>
        {sub && <p className="da-metric-sub text-[8px] text-slate-500 truncate">{sub}</p>}
      </div>
      <MetricSparkline label={label} accent={accent} series={sparklineSeries} startDate={sparklineStartDate} endDate={sparklineEndDate} />
    </div>
  );
}

function BalanceOverviewChart({ points, startDate, endDate, hasAnyHistory, historyLoading = false, historyError = false }: {
  points: DailyHistoryPoint[];
  startDate: string;
  endDate: string;
  hasAnyHistory: boolean;
  historyLoading?: boolean;
  historyError?: boolean;
}) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const startTimestamp = Date.parse(`${startDate}T00:00:00.000Z`);
  const endTimestamp = Date.parse(`${endDate}T00:00:00.000Z`);
  const duration = Math.max(1, endTimestamp - startTimestamp);
  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const minValue = sortedPoints.length ? Math.min(...sortedPoints.map((point) => point.systemBalance)) : 0;
  const maxValue = sortedPoints.length ? Math.max(...sortedPoints.map((point) => point.systemBalance)) : 0;
  const valueRange = Math.max(0, maxValue) - Math.min(0, minValue);
  const rawTickStep = (valueRange || 1000) / 4;
  const tickMagnitude = 10 ** Math.floor(Math.log10(rawTickStep));
  const normalizedTickStep = rawTickStep / tickMagnitude;
  const tickStep = (normalizedTickStep <= 1 ? 1 : normalizedTickStep <= 2 ? 2 : normalizedTickStep <= 5 ? 5 : 10) * tickMagnitude;
  const axisMin = valueRange ? Math.floor(Math.min(0, minValue) / tickStep) * tickStep : 0;
  const axisMax = valueRange ? Math.ceil(Math.max(0, maxValue) / tickStep) * tickStep : tickStep;
  const yTickCount = Math.max(2, Math.min(7, Math.round((axisMax - axisMin) / tickStep) + 1));
  const yTicks = Array.from({ length: yTickCount }, (_, index) => axisMin + index * tickStep);
  const compactRupees = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
  const formatAxisValue = (value: number) => `${value < 0 ? "−" : ""}₹${compactRupees.format(Math.abs(value))}`;
  const tickCount = duration <= 8 * 86_400_000 ? 5 : 7;
  const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
  const dateTicks = Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    const timestamp = startTimestamp + duration * ratio;
    return {
      x: 2 + ratio * 96,
      label: dateFormatter.format(new Date(timestamp)),
    };
  });
  const plottedPoints = sortedPoints.map((point) => ({
    ...point,
    x: 2 + Math.min(1, Math.max(0, (Date.parse(`${point.date}T00:00:00.000Z`) - startTimestamp) / duration)) * 96,
    y: 95 - normalizedRangeRatio(point.systemBalance, axisMin, axisMax) * 90,
  }));
  const linePath = plottedPoints.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    const previous = plottedPoints[index - 1];
    const before = plottedPoints[index - 2] ?? previous;
    const after = plottedPoints[index + 1] ?? point;
    const lowerY = Math.min(previous.y, point.y);
    const upperY = Math.max(previous.y, point.y);
    const control1Y = Math.min(upperY, Math.max(lowerY, previous.y + (point.y - before.y) / 6));
    const control2Y = Math.min(upperY, Math.max(lowerY, point.y - (after.y - previous.y) / 6));
    const deltaX = point.x - previous.x;
    return `${path} C${(previous.x + deltaX / 3).toFixed(2)} ${control1Y.toFixed(2)} ${(point.x - deltaX / 3).toFixed(2)} ${control2Y.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, "");
  const firstPoint = plottedPoints[0];
  const lastPoint = plottedPoints[plottedPoints.length - 1];
  const zeroY = 95 - normalizedRangeRatio(0, axisMin, axisMax) * 90;
  const areaPath = plottedPoints.length > 1
    ? `${linePath} L${lastPoint.x.toFixed(2)} ${zeroY.toFixed(2)} L${firstPoint.x.toFixed(2)} ${zeroY.toFixed(2)} Z`
    : "";
  const activePoint = plottedPoints.find((point) => point.date === hoveredDate);
  const markerStep = Math.max(1, Math.ceil(Math.max(0, plottedPoints.length - 1) / 5));

  return (
    <div className="da-overview-chart" role="group" aria-label="Historical system balance chart">
      {plottedPoints.length === 0 ? (
        <div className="da-overview-chart-empty" role={historyError ? "alert" : undefined}>
          {historyLoading ? "Loading history…" : historyError ? "History unavailable" : hasAnyHistory ? "No records in this range" : "No historical data yet"}
        </div>
      ) : (
        <div className="da-overview-chart-layout">
          <div className="da-chart-yaxis" aria-label="System balance in rupees">
            {[...yTicks].reverse().map((value) => <span key={value}>{formatAxisValue(value)}</span>)}
          </div>
          <div className="da-chart-plot-surface">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="da-overview-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0b84d" stopOpacity=".38" />
                  <stop offset="100%" stopColor="#f0b84d" stopOpacity=".015" />
                </linearGradient>
              </defs>
              <g className="da-overview-grid">
                {yTicks.map((value) => {
                  const y = 95 - normalizedRangeRatio(value, axisMin, axisMax) * 90;
                  return <line key={`y-${value}`} x1="0" x2="100" y1={y} y2={y} />;
                })}
                {dateTicks.map((tick, index) => (
                  <line key={`x-${index}`} x1={tick.x} x2={tick.x} y1="5" y2="95" />
                ))}
              </g>
              {areaPath && <path d={areaPath} fill="url(#da-overview-area-gradient)" />}
              {plottedPoints.length > 1 && (
                <path
                  className="da-overview-line"
                  d={linePath}
                  fill="none"
                  stroke="#f4bc50"
                  strokeWidth="2.2"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            {plottedPoints.map((point, index) => (
              <button
                key={`${point.date}-${index}`}
                type="button"
                className={`da-chart-hitpoint${index === 0 || index === plottedPoints.length - 1 || index % markerStep === 0 ? " has-marker" : ""}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-label={`${formatHistoryDate(point.date)}. System Balance: ₹${fmt(point.systemBalance)}`}
                onMouseEnter={() => setHoveredDate(point.date)}
                onMouseLeave={() => setHoveredDate(null)}
                onFocus={() => setHoveredDate(point.date)}
                onBlur={() => setHoveredDate(null)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="da-chart-xaxis" aria-label="Saved reconciliation dates">
            {dateTicks.map((tick, index) => (
              <span className={index === 0 ? "is-first" : index === dateTicks.length - 1 ? "is-last" : ""} key={`${tick.label}-${index}`}>
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {activePoint && (
        <div className="da-overview-tooltip" aria-live="polite">
          <span>{formatHistoryDate(activePoint.date)}</span>
          <strong>System Balance: ₹{fmt(activePoint.systemBalance)}</strong>
        </div>
      )}
    </div>
  );
}

function Artwork({ src, label, className = "", decorative = false, loading = "lazy" }: {
  src: string; label: string; className?: string; decorative?: boolean; loading?: "eager" | "lazy";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  return (
    <div
      className={`da-artwork ${className}`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      data-image-slot={src.split("?")[0].split("/").pop()}
    >
      {failed ? <span className="da-artwork-placeholder" aria-hidden="true" /> : (
        <img src={src} alt="" loading={loading} decoding="async" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DailyAmount() {
  const [, navigate] = useLocation();
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem(PIN_KEY));
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [editPin, setEditPin] = useState("");
  const [editPinError, setEditPinError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");
  const [activeSection, setActiveSection] = useState("top");
  const [autoFilledBalance, setAutoFilledBalance] = useState(false);

  // ── Auto-logout after 20 min inactivity ───────────────────────────────────
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pin) return;
    const TIMEOUT = 20 * 60 * 1000;
    const reset = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        localStorage.removeItem(PIN_KEY);
        setPin(null);
      }, TIMEOUT);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [pin]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedDateRef = useRef<string>("");
  // Tracks if user is actively editing — prevents server re-renders from overwriting keystrokes
  const userEditingRef = useRef(false);
  const editingResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks if we've already auto-filled opening balance for this date
  const autoFilledRef = useRef(false);

  const qc = useQueryClient();

  const emptyFields = {
    openingBalance: 0,
    notes10: 0, notes20: 0, notes50: 0, notes100: 0, notes200: 0, notes500: 0, coins: 0,
    bobSaving: 0, bobCurrent: 0, hdfc: 0, kotak: 0, au: 0, sbi: 0,
    aepsBob: 0, aepsFino: 0, aepsPayworld: 0, aepsDigipay: 0,
  };

  const [fields, setFields] = useState(emptyFields);
  const [historyRangeDays, setHistoryRangeDays] = useState<7 | 30 | 90>(30);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: entry, isLoading: entryLoading } = useQuery({
    queryKey: ["/api/dailyamount/entry", date],
    queryFn: async () => {
      if (!pin) return null;
      const res = await fetch(`/api/dailyamount/entry/${date}`, { headers: dapiHeaders(pin) });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!pin,
    // Prevent background refetches from interrupting active typing
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: prevBalanceData } = useQuery({
    queryKey: ["/api/dailyamount/prev-balance", date],
    queryFn: async () => {
      if (!pin) return null;
      const res = await fetch(`/api/dailyamount/prev-balance/${date}`, { headers: dapiHeaders(pin) });
      if (!res.ok) return null;
      return res.json() as Promise<{ balance: number }>;
    },
    enabled: !!pin,
    staleTime: 60 * 1000,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<any[]>({
    queryKey: ["/api/dailyamount/transactions", date],
    queryFn: async () => {
      if (!pin) return [];
      const res = await fetch(`/api/dailyamount/transactions/${date}`, { headers: dapiHeaders(pin) });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!pin,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: dailyHistory = [], isLoading: dailyHistoryLoading, isError: dailyHistoryError } = useQuery<any[]>({
    queryKey: ["/api/dailyamount/history"],
    queryFn: async () => {
      if (!pin) return [];
      const res = await fetch("/api/dailyamount/history", { headers: dapiHeaders(pin) });
      if (!res.ok) throw new Error("Failed to fetch reconciliation history");
      return res.json();
    },
    enabled: !!pin,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ── Reset auto-fill tracking when date changes ────────────────────────────
  useEffect(() => {
    autoFilledRef.current = false;
    setAutoFilledBalance(false);
    userEditingRef.current = false;
  }, [date]);

  // ── Load entry from server (guarded — won't overwrite active typing) ───────
  useEffect(() => {
    if (entryLoading) return;

    const isNewDate = loadedDateRef.current !== date;
    loadedDateRef.current = date;

    if (entry) {
      // If user is actively typing and it's not a date navigation, preserve their input
      if (userEditingRef.current && !isNewDate) return;

      setAutoFilledBalance(false);
      setFields({
        openingBalance: pf(entry.openingBalance),
        notes10: pf(entry.notes10), notes20: pf(entry.notes20), notes50: pf(entry.notes50),
        notes100: pf(entry.notes100), notes200: pf(entry.notes200), notes500: pf(entry.notes500),
        coins: pf(entry.coins), bobSaving: pf(entry.bobSaving), bobCurrent: pf(entry.bobCurrent),
        hdfc: pf(entry.hdfc), kotak: pf(entry.kotak), au: pf(entry.au), sbi: pf(entry.sbi),
        aepsBob: pf(entry.aepsBob), aepsFino: pf(entry.aepsFino),
        aepsPayworld: pf(entry.aepsPayworld), aepsDigipay: pf(entry.aepsDigipay),
      });
    } else if (isNewDate) {
      // Clear fields when navigating to a new date with no entry
      setFields(emptyFields);
    }
  }, [entry, entryLoading, date]);

  // ── Auto-fill opening balance from previous day ───────────────────────────
  useEffect(() => {
    // Only auto-fill if:
    // 1. No existing entry for this date
    // 2. Previous balance data is ready
    // 3. We haven't already auto-filled for this date
    // 4. User isn't manually editing the opening balance
    if (entryLoading) return;
    if (entry) return;                      // existing entry — don't override
    if (!prevBalanceData) return;           // prev data not ready
    if (autoFilledRef.current) return;      // already auto-filled
    if (userEditingRef.current) return;     // user is typing

    autoFilledRef.current = true;
    const prevBal = pf(prevBalanceData.balance);
    setFields((prev) => ({ ...prev, openingBalance: prevBal }));
    setAutoFilledBalance(prevBal > 0);
  }, [prevBalanceData, entry, entryLoading]);

  // ── Save entry to server ──────────────────────────────────────────────────
  const saveEntry = useCallback(async (data: typeof fields) => {
    if (!pin) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/dailyamount/entry/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-da-pin": pin },
        body: JSON.stringify(data),
      });
      if (res.ok) void qc.invalidateQueries({ queryKey: ["/api/dailyamount/history"] });
      setSaveStatus("saved");
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("idle");
    }
    // NOTE: We deliberately do NOT call qc.setQueryData here.
    // Updating the cache would trigger the entry useEffect, which would
    // call setFields and overwrite any in-progress keystrokes (e.g. "100." → "100").
  }, [pin, date, qc]);

  // ── Debounced save — 800ms after last keystroke ───────────────────────────
  const debouncedSave = useCallback((data: typeof fields) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveEntry(data), 800);
  }, [saveEntry]);

  // ── Update a field: mark user as editing, update state, schedule save ─────
  function updateField(key: keyof typeof fields, value: number) {
    if (!editUnlocked) return;

    // Mark user as actively editing — blocks server data from overwriting state
    userEditingRef.current = true;
    if (editingResetTimer.current) clearTimeout(editingResetTimer.current);
    editingResetTimer.current = setTimeout(() => {
      userEditingRef.current = false;
    }, 2000); // 2s after last keystroke, allow server updates again

    // If user manually edits opening balance, clear the auto-filled label
    if (key === "openingBalance") {
      setAutoFilledBalance(false);
      autoFilledRef.current = true; // prevent re-auto-fill
    }

    const updated = { ...fields, [key]: value };
    setFields(updated);
    debouncedSave(updated);
  }

  function clearCashCounts() {
    if (!editUnlocked) return;
    if (!window.confirm("Clear all cash counts for this date? The zero values will be saved with your other reconciliation data.")) return;

    const updated = {
      ...fields,
      notes10: 0,
      notes20: 0,
      notes50: 0,
      notes100: 0,
      notes200: 0,
      notes500: 0,
      coins: 0,
    };
    userEditingRef.current = true;
    if (editingResetTimer.current) clearTimeout(editingResetTimer.current);
    editingResetTimer.current = setTimeout(() => {
      userEditingRef.current = false;
    }, 2000);
    setFields(updated);
    debouncedSave(updated);
  }

  // ── Flush on page unload ──────────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (!pin) return;
      const body = JSON.stringify(fields);
      navigator.sendBeacon(`/api/dailyamount/entry/${date}?daPin=${pin}`, new Blob([body], { type: "application/json" }));
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [pin, date, fields]);

  // ── Transaction mutations ─────────────────────────────────────────────────
  const currentDate = date;

  const addTxMutation = useMutation({
    mutationFn: async () => {
      if (!pin) throw new Error("No PIN");
      const amount = pf(txAmount);
      if (!amount || amount <= 0) throw new Error("Invalid amount");
      const res = await fetch("/api/dailyamount/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-da-pin": pin },
        body: JSON.stringify({ date: currentDate, type: txType, amount, note: txNote }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (newTx: any) => {
      qc.setQueryData(
        ["/api/dailyamount/transactions", currentDate],
        (old: any[] | undefined) => [newTx, ...(Array.isArray(old) ? old : [])],
      );
      setTxAmount("");
      setTxNote("");
    },
    onError: (err: any) => {
      alert(`Could not add transaction: ${err.message}`);
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!pin) throw new Error("No PIN");
      const res = await fetch(`/api/dailyamount/transactions/${id}`, {
        method: "DELETE",
        headers: dapiHeaders(pin),
      });
      if (!res.ok) throw new Error(`Delete failed ${res.status}`);
      return id;
    },
    onSuccess: (deletedId: any) => {
      qc.setQueryData(
        ["/api/dailyamount/transactions", currentDate],
        (old: any[] | undefined) => (Array.isArray(old) ? old.filter((tx) => tx.id !== deletedId) : []),
      );
    },
    onError: (err: any) => {
      alert(`Could not delete transaction: ${err.message}`);
    },
  });

  function changeDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
    setEditUnlocked(false);
    setTxSearch("");
  }

  function handleUnlockEdit(e: React.FormEvent) {
    e.preventDefault();
    const expected = localStorage.getItem(PIN_KEY);
    if (editPin === expected) {
      setEditUnlocked(true);
      setShowEditModal(false);
      setEditPin("");
      setEditPinError("");
    } else {
      setEditPinError("Incorrect PIN");
    }
  }

  function handleLogout() {
    localStorage.removeItem(PIN_KEY);
    setPin(null);
    setEditUnlocked(false);
  }

  function refreshData() {
    void Promise.all([
      qc.invalidateQueries({ queryKey: ["/api/dailyamount/entry", date] }),
      qc.invalidateQueries({ queryKey: ["/api/dailyamount/prev-balance", date] }),
      qc.invalidateQueries({ queryKey: ["/api/dailyamount/transactions", date] }),
      qc.invalidateQueries({ queryKey: ["/api/dailyamount/history"] }),
    ]);
  }

  function exportCsv() {
    const rows: Array<Array<string | number>> = [
      ["Daily Reconciliation", date],
      ["Opening Balance", fields.openingBalance],
      ["Cash Total", cashTotal],
      ["Bank Total", bankTotal],
      ["AEPS Wallet Total", aepsTotal],
      ["Expected Balance", expectedBalance],
      ["System Balance", systemBalance],
      ["Difference", difference],
      ["Status", isBalanced ? "Balanced" : "Mismatch"],
      [],
      ["Section", "Item", "Value"],
      ["Cash", "₹500 notes", fields.notes500],
      ["Cash", "₹200 notes", fields.notes200],
      ["Cash", "₹100 notes", fields.notes100],
      ["Cash", "₹50 notes", fields.notes50],
      ["Cash", "₹20 notes", fields.notes20],
      ["Cash", "₹10 notes", fields.notes10],
      ["Cash", "Coins", fields.coins],
      ["Bank", "BOB Saving", fields.bobSaving],
      ["Bank", "BOB Current", fields.bobCurrent],
      ["Bank", "HDFC", fields.hdfc],
      ["Bank", "Kotak", fields.kotak],
      ["Bank", "AU", fields.au],
      ["Bank", "SBI", fields.sbi],
      ["AEPS", "BOB", fields.aepsBob],
      ["AEPS", "Fino", fields.aepsFino],
      ["AEPS", "Payworld", fields.aepsPayworld],
      ["AEPS", "Digipay", fields.aepsDigipay],
      [],
      ["Transactions", "Type", "Amount", "Note", "Time"],
      ...txArray.map((tx) => [
        "Transaction",
        tx.type,
        pf(tx.amount),
        tx.note || "",
        new Date(tx.createdAt).toLocaleString(),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-reconciliation-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── 15-min inactivity auto-logout ─────────────────────────────────────────
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pin) return;
    const TIMEOUT = 15 * 60 * 1000;
    function resetTimer() {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(() => {
        localStorage.removeItem(PIN_KEY);
        setPin(null);
        setEditUnlocked(false);
      }, TIMEOUT);
    }
    const events = ["mousemove", "click", "keydown", "scroll", "touchstart"] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [pin]);

  // ── Calculations (all decimal-safe with parseFloat) ───────────────────────
  const cashTotal =
    fields.notes10 * 10 + fields.notes20 * 20 + fields.notes50 * 50 +
    fields.notes100 * 100 + fields.notes200 * 200 + fields.notes500 * 500 + fields.coins;
  const bankTotal = fields.bobSaving + fields.bobCurrent + fields.hdfc + fields.kotak + fields.au + fields.sbi;
  const aepsTotal = fields.aepsBob + fields.aepsFino + fields.aepsPayworld + fields.aepsDigipay;
  const systemBalance = cashTotal + bankTotal + aepsTotal;
  const txArray = Array.isArray(transactions) ? transactions : [];
  const incomeTotal = txArray.filter((t) => t.type === "income").reduce((s, t) => s + pf(t.amount), 0);
  const expenseTotal = txArray.filter((t) => t.type === "expense").reduce((s, t) => s + pf(t.amount), 0);
  const expectedBalance = fields.openingBalance + incomeTotal - expenseTotal;
  const difference = systemBalance - expectedBalance;
  const isBalanced = Math.abs(difference) < 0.01;
  const cashShare = systemBalance > 0 ? (cashTotal / systemBalance) * 100 : 0;
  const bankShare = systemBalance > 0 ? (bankTotal / systemBalance) * 100 : 0;
  const aepsShare = systemBalance > 0 ? (aepsTotal / systemBalance) * 100 : 0;
  const todayDateKey = normalizeHistoryDate(todayStr()) || todayStr();
  const requestedEndDate = normalizeHistoryDate(date) || todayDateKey;
  const historyEndDate = requestedEndDate > todayDateKey ? todayDateKey : requestedEndDate;
  const historyStartDate = shiftHistoryDate(historyEndDate, -(historyRangeDays - 1));
  const allHistoryPoints = (Array.isArray(dailyHistory) ? dailyHistory : [])
    .map(dailyHistoryMetrics)
    .filter((point): point is DailyHistoryPoint => !!point && point.date <= todayDateKey)
    .sort((a, b) => a.date.localeCompare(b.date));
  const chartHistoryPoints = allHistoryPoints.filter(
    (point) => point.date >= historyStartDate && point.date <= historyEndDate,
  );
  const openingHistory = chartHistoryPoints.map((point) => ({ date: point.date, value: point.openingBalance }));
  const cashHistory = chartHistoryPoints.map((point) => ({ date: point.date, value: point.cashTotal }));
  const bankHistory = chartHistoryPoints.map((point) => ({ date: point.date, value: point.bankTotal }));
  const aepsHistory = chartHistoryPoints.map((point) => ({ date: point.date, value: point.aepsTotal }));
  const differenceHistory = chartHistoryPoints.flatMap((point) =>
    point.difference === null ? [] : [{ date: point.date, value: point.difference }]
  );
  const filteredTransactions = txArray.filter((tx) => {
    if (txFilter !== "all" && tx.type !== txFilter) return false;
    const search = txSearch.trim().toLowerCase();
    if (!search) return true;
    return [tx.note, tx.type, String(tx.amount)].some((value) => String(value || "").toLowerCase().includes(search));
  });

  if (!pin) {
    return <PinScreen onSuccess={(p) => setPin(p)} />;
  }

  return (
    <div className="da-page text-slate-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .da-page {
          --da-sidebar-width: 128px;
          --da-ink: #edf4ff;
          --da-muted: #91a6c0;
          --da-line: rgba(103, 151, 205, .2);
          display: flex;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          color: var(--da-ink);
          background:
            radial-gradient(ellipse at 74% -32%, rgba(31, 111, 199, .24), transparent 54%),
            radial-gradient(ellipse at 38% 110%, rgba(15, 154, 136, .07), transparent 46%),
            linear-gradient(135deg, #050b18 0%, #08152b 54%, #071226 100%);
          color-scheme: dark;
        }
        .da-page * { box-sizing: border-box; }
        .da-page button, .da-page input { font: inherit; }
        .da-sidebar {
          position: relative; isolation: isolate;
          z-index: 2;
          display: flex;
          flex: 0 0 128px;
          min-width: 0;
          min-height: 0;
          flex-direction: column;
          padding: 10px 8px 8px;
          border-right: 1px solid rgba(112, 157, 204, .2);
          background: #071326;
        }
        .da-side-brand { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; height: 29px; margin-bottom: 11px; color: #f3c65a; }
        .da-side-brand-mark {
          display: grid; width: 27px; height: 27px; place-items: center; border-radius: 8px;
          border: 1px solid rgba(244, 192, 68, .32); background: linear-gradient(145deg, #183a61, #122746);
          box-shadow: 0 0 14px rgba(234, 176, 51, .14);
        }
        .da-nav { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 4px; }
        .da-nav-item {
          display: flex; align-items: center; gap: 7px; min-height: 29px; padding: 0 7px;
          border: 1px solid transparent; border-radius: 7px; background: transparent; color: #91a7c0;
          text-align: left; font-size: 9px; cursor: pointer;
          transition: color .18s, border-color .18s, background .18s, box-shadow .18s;
        }
        .da-nav-item:hover { color: #dceafb; border-color: rgba(102, 157, 216, .2); background: rgba(41, 91, 145, .16); }
        .da-nav-item.active {
          color: #f3ca61; border-color: rgba(240, 189, 63, .4);
          background: linear-gradient(100deg, rgba(201, 149, 34, .22), rgba(32, 61, 94, .45));
          box-shadow: inset 0 0 15px rgba(230, 180, 53, .09), 0 0 12px rgba(225, 176, 52, .08);
        }
        .da-nav-item:focus-visible { outline: 2px solid rgba(255, 211, 99, .85); outline-offset: 1px; }
        .da-nav-item svg { flex: 0 0 auto; }
        .da-side-art {
          position: absolute; z-index: 0; inset: 0; overflow: hidden; pointer-events: none;
          border: 0; border-radius: 0; background: linear-gradient(155deg, #143252, #0b1a31);
        }
        .da-side-art::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,14,29,.42), rgba(5,14,29,.56) 56%, rgba(5,14,29,.3)); }
        .da-side-art .da-artwork { position: absolute; inset: 0; width: 100%; height: 100%; background: transparent; }
        .da-side-art .da-artwork img { object-fit: contain; object-position: right center; opacity: .76; }
        .da-side-art .da-artwork-fallback { align-items: end; padding-bottom: 36px; opacity: .22; }
        .da-side-foot { position: relative; z-index: 1; margin-top: auto; padding: 6px 2px 1px; color: #a3b3c6; font-size: 8px; line-height: 1.4; text-align: center; text-shadow: 0 1px 4px #071326; }
        .da-artwork {
          position: relative; display: grid; min-width: 0; min-height: 0; place-items: center;
          overflow: hidden; color: #89b9ed; background:
            radial-gradient(circle at 55% 40%, rgba(57, 143, 224, .2), transparent 65%),
            linear-gradient(135deg, rgba(20, 57, 94, .76), rgba(12, 28, 52, .78));
        }
        .da-artwork img { width: 100%; height: 100%; object-fit: contain; object-position: right center; }
        .da-artwork-fallback { display: grid; width: 100%; height: 100%; place-items: center; opacity: .6; }
        .da-side-art .da-artwork { width: 100%; height: 100%; color: #f0c659; background: radial-gradient(ellipse at 50% 95%, rgba(225, 170, 46, .25), transparent 70%); }
        .da-app-main { display: flex; flex: 1; min-width: 0; min-height: 0; flex-direction: column; }
        .da-toolbar {
          display: flex; flex: 0 0 40px; align-items: center; gap: 9px; min-width: 0; min-height: 40px;
          padding: 0 10px; border-bottom: 1px solid rgba(96, 165, 250, .16);
          background: rgba(8, 14, 31, .94); backdrop-filter: blur(16px);
        }
        .da-toolbar > .flex.items-center:first-child { gap: 7px; }
        .da-toolbar > .flex.items-center:first-child > div { width: 27px; height: 27px; }
        .da-brand-title { display: block; color: #f4f7fb; white-space: nowrap; font-size: 12px; font-weight: 700; letter-spacing: -.2px; text-shadow: 0 0 12px rgba(236, 186, 74, .1); }
        .da-brand-title em { color: #f2c75a; font-style: normal; }
        .da-toolbar > .flex.items-center:first-child > div { color: #f2c75a; box-shadow: 0 0 15px rgba(234, 176, 51, .1); }
        .da-toolbar > .order-3 {
          order: 0; width: auto; flex: 0 0 auto; min-height: 28px; padding: 2px 4px;
          border-radius: 7px; background: linear-gradient(130deg, rgba(12, 31, 57, .96), rgba(10, 25, 48, .96)) !important;
          border: 1px solid rgba(100, 145, 192, .24) !important;
        }
        .da-toolbar > .order-3 button { padding: 2px 4px; }
        .da-toolbar > .order-3 input { width: 112px; font-size: 10px; }
        .da-toolbar > .ml-auto { margin-left: auto; gap: 4px; }
        .da-toolbar > .ml-auto button {
          height: 27px; padding: 0 7px; border: 1px solid rgba(92, 144, 197, .25);
          border-radius: 6px; background: linear-gradient(145deg, rgba(17, 42, 70, .74), rgba(10, 28, 50, .78));
          box-shadow: inset 0 1px rgba(255,255,255,.025); white-space: nowrap;
        }
        .da-toolbar > .ml-auto button:hover { border-color: rgba(102, 178, 255, .5); box-shadow: 0 0 13px rgba(42, 136, 224, .14); }
        .da-toolbar > .ml-auto button[data-testid="button-export"] { border-color: rgba(255, 218, 120, .8); background: linear-gradient(135deg, #ffd565, #eaa52c); box-shadow: 0 3px 13px rgba(231, 166, 46, .17); }
        .da-main {
          display: flex; flex: 1; min-width: 0; min-height: 0; flex-direction: column;
          gap: 7px; overflow: hidden; padding: 7px 9px 8px;
        }
        .da-main > .grid { display: grid; flex: 0 0 auto; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 7px; }
        .da-clear-cash {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 23px;
          padding: 0 7px;
          border: 1px solid rgba(239, 94, 108, .3);
          border-radius: 6px;
          color: #ff9da4;
          background: rgba(130, 43, 57, .18);
          font-size: 9px;
          white-space: nowrap;
        }
        .da-clear-cash:hover { background: rgba(156, 52, 67, .3); }
        .da-metric {
          position: relative; isolation: isolate; min-height: 112px; overflow: hidden; padding: 12px 14px;
          border-radius: 16px; border: 1px solid rgba(48, 234, 183, .58);
          background: linear-gradient(135deg, rgba(5, 71, 60, .97), rgba(5, 43, 51, .98) 58%, rgba(6, 34, 49, .98)) !important;
          box-shadow: inset 0 1px rgba(255,255,255,.09), 0 7px 20px rgba(0,0,0,.22), 0 0 20px var(--metric-glow, rgba(25,220,170,.18));
          transition: transform .18s, border-color .18s, box-shadow .18s;
        }
        .da-metric::before {
          content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
           opacity: .38; background: radial-gradient(ellipse at 100% 100%, color-mix(in srgb, currentColor 25%, transparent), transparent 68%);
        }
        .da-metric::after {
           content: ""; position: absolute; right: 0; bottom: 0; z-index: -1; width: 96px; height: 48px;
           opacity: .42; pointer-events: none; background: linear-gradient(180deg, transparent, currentColor);
           clip-path: polygon(0 80%, 15% 67%, 28% 72%, 43% 53%, 57% 67%, 72% 43%, 85% 52%, 100% 30%, 100% 100%, 0 100%);
        }
        .da-metric:hover { transform: translateY(-1px); border-color: currentColor; box-shadow: 0 0 19px var(--metric-glow, rgba(64,143,225,.16)), inset 0 1px rgba(255,255,255,.07); }
        .da-metric[data-testid="metric-opening-balance"] { --metric-glow: rgba(25, 224, 169, .2); color: #45d8b3; border-color: rgba(63, 211, 173, .58) !important; background: linear-gradient(135deg, rgba(6, 82, 68, .98), rgba(5, 44, 53, .98) 58%, rgba(5, 31, 49, .98)) !important; }
        .da-metric[data-testid="metric-cash-total"] { --metric-glow: rgba(39, 132, 255, .2); color: #48a9ff; border-color: rgba(57, 145, 255, .6) !important; background: linear-gradient(135deg, rgba(8, 55, 125, .98), rgba(5, 33, 82, .98) 58%, rgba(5, 27, 62, .98)) !important; }
        .da-metric[data-testid="metric-bank-total"] { --metric-glow: rgba(151, 74, 255, .2); color: #bb8bff; border-color: rgba(160, 93, 255, .58) !important; background: linear-gradient(135deg, rgba(64, 29, 131, .97), rgba(39, 22, 86, .98) 58%, rgba(26, 20, 61, .98)) !important; }
        .da-metric[data-testid="metric-aeps-total"] { --metric-glow: rgba(244, 146, 45, .18); color: #ffb253; border-color: rgba(243, 152, 61, .56) !important; background: linear-gradient(135deg, rgba(105, 57, 19, .96), rgba(64, 39, 30, .98) 58%, rgba(43, 29, 39, .98)) !important; }
        .da-metric[data-testid="metric-difference"] { --metric-glow: rgba(255, 72, 112, .18); color: #ff8297; border-color: rgba(255, 111, 137, .58) !important; background: linear-gradient(135deg, rgba(102, 25, 54, .96), rgba(59, 25, 51, .98) 58%, rgba(39, 21, 49, .98)) !important; }
        .da-metric[data-testid="metric-difference"].is-balanced { --metric-glow: rgba(25, 224, 169, .2); color: #45d8b3; border-color: rgba(63, 211, 173, .58) !important; background: linear-gradient(135deg, rgba(6, 82, 68, .98), rgba(5, 44, 53, .98) 58%, rgba(5, 31, 49, .98)) !important; }
        .da-metric-icon { position: relative; z-index: 1; width: 62px; height: 72px; flex: 0 0 62px; overflow: hidden; border: 1px solid rgba(255,255,255,.25); border-radius: 14px; color: #f6fffc !important; background: linear-gradient(145deg, #21c99e, #08755f) !important; box-shadow: 0 0 17px rgba(21,220,164,.24), inset 0 1px rgba(255,255,255,.3); }
        .da-metric[data-testid="metric-cash-total"] .da-metric-icon { border-color: rgba(113,190,255,.42); background: linear-gradient(145deg, #168cff, #0758c5) !important; box-shadow: 0 0 15px rgba(29,132,255,.23), inset 0 1px rgba(255,255,255,.3); }
        .da-metric[data-testid="metric-bank-total"] .da-metric-icon { border-color: rgba(201,153,255,.42); background: linear-gradient(145deg, #a145f1, #6221bd) !important; box-shadow: 0 0 15px rgba(152,69,255,.23), inset 0 1px rgba(255,255,255,.3); }
        .da-metric[data-testid="metric-aeps-total"] .da-metric-icon { border-color: rgba(255,195,119,.4); background: linear-gradient(145deg, #f4a438, #b9631a) !important; box-shadow: 0 0 15px rgba(241,139,47,.18), inset 0 1px rgba(255,255,255,.3); }
        .da-metric[data-testid="metric-difference"] .da-metric-icon { border-color: rgba(255,133,165,.42); background: linear-gradient(145deg, #ef416e, #b6194f) !important; box-shadow: 0 0 15px rgba(245,56,104,.22), inset 0 1px rgba(255,255,255,.3); }
        .da-metric[data-testid="metric-difference"].is-balanced .da-metric-icon { border-color: rgba(106,255,218,.38); background: linear-gradient(145deg, #21c99e, #08755f) !important; box-shadow: 0 0 15px rgba(21,220,164,.2), inset 0 1px rgba(255,255,255,.3); }
        .da-metric-icon-image { display: block; width: 100%; height: 100%; padding: 5px; object-fit: contain; object-position: right center; }
        .da-metric-icon svg { width: 23px; height: 23px; }
        .da-metric > div:last-child { position: relative; z-index: 1; }
        .da-metric-label { color: #f2f8f5; font-size: clamp(11px, 1.08vw, 15px); font-weight: 500; letter-spacing: .05px; text-transform: none; }
        .da-metric-value { color: #ffe35a; font-size: clamp(16px, 1.7vw, 24px); font-weight: 800; letter-spacing: -.35px; line-height: 1.12; }
        .da-metric[data-testid="metric-opening-balance"] .da-metric-value > span,
        .da-metric[data-testid="metric-opening-balance"] .da-metric-value input { color: #ffe35a !important; }
        .da-metric[data-testid="metric-cash-total"] .da-metric-value,
        .da-metric[data-testid="metric-cash-total"] .da-metric-value > span,
        .da-metric[data-testid="metric-bank-total"] .da-metric-value,
        .da-metric[data-testid="metric-bank-total"] .da-metric-value > span,
        .da-metric[data-testid="metric-aeps-total"] .da-metric-value,
        .da-metric[data-testid="metric-aeps-total"] .da-metric-value > span { color: #f3f7ff !important; }
        .da-metric-sub { color: #45e58b; font-size: clamp(8px, .78vw, 11px); font-weight: 600; }
        .da-metric[data-testid="metric-difference"] .da-metric-value,
        .da-metric[data-testid="metric-difference"] .da-metric-value > span { color: #ff8798 !important; }
        .da-metric[data-testid="metric-difference"].is-balanced .da-metric-value,
        .da-metric[data-testid="metric-difference"].is-balanced .da-metric-value > span { color: #73e5ba !important; }
        .da-metric[data-testid="metric-difference"] .da-metric-sub { color: #ffadba; }
        .da-metric[data-testid="metric-difference"].is-balanced .da-metric-sub { color: #26e18d; }
        .da-opening-metric-input { height: 19px; }
        .da-dashboard-grid {
          display: grid; flex: 1; min-width: 0; min-height: 0; grid-template-columns: minmax(0, .96fr) minmax(0, .98fr) minmax(0, 1.12fr);
          grid-template-rows: minmax(0, 1fr) 75px;
          gap: 8px;
        }
        .da-column { display: flex; min-width: 0; min-height: 0; flex-direction: column; gap: 7px; overflow: hidden; }
        .da-column:first-child > .da-panel { flex: 1; min-height: 0; }
        .da-column:nth-child(2) { grid-column: 2; grid-row: 1; }
        .da-column:nth-child(2) > .da-panel { flex: 1; min-height: 0; }
        .da-column:last-child { grid-column: 3; grid-row: 1 / span 2; }
        .da-panel {
          border-radius: 9px; border: 1px solid rgba(80, 132, 190, .36) !important;
          background: linear-gradient(150deg, rgba(12, 29, 54, .97), rgba(8, 22, 43, .97)) !important;
          box-shadow: inset 0 1px rgba(255,255,255,.03), 0 7px 20px rgba(0, 5, 15, .19) !important;
          transition: border-color .18s, box-shadow .18s;
        }
        .da-panel:hover { border-color: rgba(105, 166, 226, .46) !important; }
        .da-card-head, .da-tx-header { min-height: 31px; padding: 3px 8px; border-bottom-color: rgba(100, 151, 202, .17) !important; background: linear-gradient(90deg, rgba(18, 48, 82, .72), rgba(10, 28, 52, .35)) !important; }
        .da-card-head h3, .da-tx-header h3 { color: #f1f6ff; font-size: 10px; font-weight: 800; letter-spacing: .01em; }
        .da-card-heading { flex: 1; min-width: 0; }
        .da-card-heading h3 { overflow: hidden; margin: 0; text-overflow: ellipsis; white-space: nowrap; }
        .da-card-subtitle { display: block; overflow: hidden; color: #8299b2; font-size: 7px; line-height: 1.1; text-overflow: ellipsis; white-space: nowrap; }
        .da-card-body { padding: 6px 7px; }
        .da-cash-table-header { padding: 1px 5px 4px; font-size: 8px; }
        .da-denom-row { min-height: 26px; padding-top: 2px; padding-bottom: 2px; }
        .da-denom-row > div:first-child { width: 48px; }
        .da-denom-row > div:first-child span { min-width: 42px; padding: 3px 5px; font-size: 9px; }
        .da-denom-row .da-stepper { width: 20px; height: 20px; }
        .da-denom-row .da-count-input { width: 46px; height: 20px; padding: 0 2px; font-size: 10px; }
        .da-coins-row { margin-top: 0; }
        .da-coins-row .da-count-input { width: 60px; }
        .da-cash-total { padding-top: 5px; }
        .da-cash-total-band { padding: 6px 7px; box-shadow: 0 0 13px rgba(33, 208, 153, .08); }
        .da-cash-total-band > div { min-width: 0; }
        .da-cash-total-band > div > span { font-size: 14px; }
        .da-account-row { min-height: 20px; gap: 5px; padding-top: 1px; padding-bottom: 1px; }
        .da-account-row > div:first-child span:first-child { width: 17px; height: 17px; }
        .da-account-row > div:first-child span:last-child { font-size: 9px; }
        .da-account-input { height: 19px; padding-top: 0; padding-bottom: 0; font-size: 9px; }
        .da-section-total { padding-top: 3px; margin-top: 0; }
        .da-section-total span { font-size: 9px; }
        .da-section-total > span:last-child { font-size: 10px; }
        .da-card-action-total { display: flex; align-items: center; gap: 5px; color: #9dc8f0; font-size: 9px; font-weight: 700; font-family: ui-monospace, monospace; white-space: nowrap; }
        .da-card-action-total .da-artwork-small { width: 23px; height: 20px; flex-basis: 23px; }
        .da-aeps-artwork { color: #c6a3fa; background: radial-gradient(circle, rgba(147, 87, 244, .27), transparent 70%), rgba(33, 20, 61, .4); }
        .da-system-summary { padding: 6px; }
        .da-system-summary-components { gap: 3px; margin-bottom: 4px; }
        .da-system-summary-components p { font-size: 9px; margin-bottom: 0; line-height: 1.15; }
        .da-system-line { padding-top: 4px; }
        .da-system-line > span, .da-system-line > span:first-child { font-size: 10px; }
        .da-system-line > span:last-child { font-size: 13px; }
        .da-transactions-panel { flex: 1; min-height: 0; }
        .da-tx-header { gap: 6px; }
        .da-tx-header h3 { flex: 1; }
        .da-view-all { flex: 0 0 auto; min-height: 21px; padding: 0 7px; border: 1px solid rgba(100, 151, 202, .25); border-radius: 6px; color: #b6d7f6; background: rgba(17, 52, 88, .55); font-size: 8px; white-space: nowrap; }
        .da-view-all:hover { border-color: rgba(112, 181, 244, .55); background: rgba(24, 70, 116, .65); }
        .da-tx-header .da-tx-totals { display: none; }
        .da-tx-search-wrap { max-width: 116px; min-width: 78px; }
        .da-tx-search { height: 22px; font-size: 9px; }
        .da-tx-filterbar { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; padding: 4px 7px; border-bottom: 1px solid rgba(104, 141, 177, .12); }
        .da-tx-filter {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-height: 21px; padding: 0 7px;
          border: 1px solid rgba(100, 139, 178, .2); border-radius: 6px; color: #9bafc3;
          background: rgba(10, 26, 47, .65); font-size: 8px; cursor: pointer; transition: .16s;
        }
        .da-tx-filter:hover { color: #e4edf6; border-color: rgba(100, 165, 224, .42); }
        .da-tx-filter.active { color: #f5d06b; border-color: rgba(242, 192, 72, .42); background: rgba(166, 116, 24, .2); box-shadow: 0 0 9px rgba(241, 181, 63, .08); }
        .da-tx-date { width: 96px; height: 21px; margin-left: auto; padding: 0 4px; border: 1px solid rgba(100, 139, 178, .2); border-radius: 6px; color: #a9bfd3; background: rgba(10, 26, 47, .65); font-size: 8px; }
        .da-tx-form { padding: 5px; gap: 5px; }
        .da-tx-form button, .da-tx-form input { min-height: 23px; padding-top: 2px; padding-bottom: 2px; font-size: 9px; }
        .da-tx-item { min-height: 31px; gap: 6px; padding: 3px 5px; transition: background .15s; }
        .da-tx-item:hover { background: rgba(47, 83, 117, .17) !important; }
        .da-tx-symbol { width: 21px; height: 21px; }
        .da-tx-description { font-size: 9px; line-height: 1.15; }
        .da-tx-time { font-size: 8px; line-height: 1.1; }
        .da-tx-value { font-size: 9px; }
        .da-reconcile-title { padding: 5px 7px; font-size: 9px; }
        .da-reconcile-values .da-reconcile-value { padding: 5px 7px; }
        .da-reconcile-value p:first-child { font-size: 8px; }
        .da-reconcile-value p:nth-child(2) { font-size: 11px; }
        .da-reconcile-value p:last-child { margin-top: 2px; font-size: 7px; }
        .da-difference { padding: 5px 7px; }
        .da-difference-value { font-size: 13px; }
        .da-status { gap: 3px; padding: 3px 5px; font-size: 8px; }
        .da-artwork-small { width: 30px; height: 24px; flex: 0 0 30px; border-radius: 5px; opacity: .78; }
        .da-overview { position: relative; grid-column: 1 / span 2; grid-row: 2; min-width: 0; min-height: 0; overflow: hidden; padding: 5px 7px; border: 1px solid rgba(91, 146, 202, .3); border-radius: 9px; background: linear-gradient(125deg, rgba(13, 30, 54, .94), rgba(9, 22, 43, .96)); box-shadow: inset 0 1px rgba(255,255,255,.025); }
        .da-overview-title { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; color: #e5edf7; font-size: 9px; font-weight: 700; }
        .da-overview-title small { color: #8499b3; font-size: 7px; font-weight: 500; }
        .da-chart-range-control { display: flex; flex: 0 0 auto; align-items: center; gap: 2px; margin-left: auto; padding: 1px; border: 1px solid rgba(126, 157, 190, .2); border-radius: 5px; background: rgba(4, 14, 28, .55); }
        .da-chart-range-button { min-width: 19px; padding: 2px 4px; border: 1px solid transparent; border-radius: 4px; color: #91a6bf; background: transparent; font-size: 7px; font-weight: 700; line-height: 1; cursor: pointer; }
        .da-chart-range-button:hover { color: #e8f1fc; background: rgba(255, 255, 255, .06); }
        .da-chart-range-button.is-active { border-color: rgba(247, 185, 78, .35); color: #ffe0a0; background: rgba(234, 157, 51, .16); }
        .da-overview-content { display: grid; height: 48px; grid-template-columns: minmax(0, 1fr) 48px minmax(0, 112px); align-items: center; gap: 8px; }
        .da-overview-chart { position: relative; min-width: 0; height: 100%; overflow: hidden; border-bottom: 1px solid rgba(203, 145, 50, .25); background: linear-gradient(180deg, rgba(232, 151, 43, .03), transparent); }
        .da-overview-chart svg { display: block; width: 100%; height: 100%; overflow: visible; }
        .da-overview-chart-empty { display: grid; width: 100%; height: 100%; place-items: center; color: #71869f; font-size: 7px; }
        .da-overview-chart .da-overview-line { filter: drop-shadow(0 0 5px rgba(255, 176, 61, .9)); }
        .da-overview-chart circle[role="button"]:focus-visible { stroke: #fff1cf; stroke-width: 1.2; outline: none; }
        .da-overview-tooltip { position: absolute; top: 4px; right: 5px; z-index: 4; display: grid; max-width: calc(100% - 10px); gap: 2px; padding: 4px 6px; border: 1px solid rgba(248, 180, 72, .36); border-radius: 6px; color: #dce7f5; background: rgba(7, 18, 34, .94); box-shadow: 0 5px 16px rgba(0, 0, 0, .28), 0 0 10px rgba(232, 151, 43, .1); pointer-events: none; }
        .da-overview-tooltip span { color: #9fb2c8; font-size: 7px; line-height: 1.2; }
        .da-overview-tooltip strong { color: #ffe1aa; font: 700 8px/1.2 ui-monospace, monospace; white-space: nowrap; }
        .da-overview-breakdown { display: flex; min-width: 0; flex-direction: column; justify-content: center; gap: 3px; }
        .da-overview-item { display: grid; grid-template-columns: 6px minmax(20px, 1fr) auto auto; gap: 3px; align-items: center; min-width: 0; }
        .da-overview-dot { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 7px currentColor; }
        .da-overview-item span:nth-child(2) { color: #9aafc4; font-size: 7px; }
        .da-overview-item strong { overflow: hidden; color: #e2ebf5; font-size: 7px; font-family: ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; }
        .da-overview-item small { color: #7f97ae; font-size: 6px; }
        .da-overview-donut { display: grid; flex: 0 0 48px; width: 48px; height: 48px; padding: 5px; place-items: center; border-radius: 50%; box-shadow: 0 0 12px rgba(67, 134, 221, .18); }
        .da-overview-donut-hole { display: flex; width: 100%; height: 100%; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(151, 181, 215, .18); border-radius: 50%; background: #0b1930; }
        .da-overview-donut-hole strong { max-width: 100%; overflow: hidden; color: #f3f7ff; font: 700 7px/1 ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; }
        .da-overview-donut-hole small { margin-top: 2px; color: #91a6c0; font-size: 6px; line-height: 1; }
        .da-nav-status { position: absolute; left: 136px; top: 7px; z-index: 12; padding: 6px 9px; border-radius: 7px; color: #d6e2f0; background: #112542; border: 1px solid rgba(103, 151, 205, .3); font-size: 10px; }
        @media (min-width: 1024px) and (max-height: 520px) {
          .da-toolbar { flex-basis: 40px; min-height: 40px; }
          .da-main { gap: 6px; padding: 6px 7px 7px; }
          .da-main > .grid { gap: 6px; }
          .da-metric { min-height: 64px; gap: 6px; padding: 4px 6px; border-radius: 8px; }
          .da-metric-icon { width: 36px; height: 40px; flex-basis: 36px; border-radius: 9px; }
          .da-metric-icon svg { width: 19px; height: 19px; }
          .da-metric-label { font-size: 8px; line-height: 1.1; }
          .da-metric-value { font-size: 11px; line-height: 1.15; }
          .da-metric-sub { font-size: 7px; line-height: 1.1; }
          .da-opening-metric-input { height: 18px; font-size: 9px; }
          .da-dashboard-grid, .da-column { gap: 5px; }
          .da-card-head, .da-tx-header { min-height: 26px; padding: 2px 6px; }
          .da-card-subtitle { font-size: 6px; }
          .da-card-body { padding: 4px 5px; }
          .da-cash-table-header { padding: 0 4px 3px; font-size: 7px; }
          .da-denom-row { min-height: 23px; gap: 4px; padding-top: 1px; padding-bottom: 1px; }
          .da-denom-row > div:first-child { width: 42px; }
          .da-denom-row > div:first-child span { min-width: 37px; padding: 2px 3px; font-size: 8px; }
          .da-denom-row .da-stepper { width: 17px; height: 17px; padding: 0; }
          .da-denom-row .da-count-input { width: 39px; height: 17px; padding: 0 2px; font-size: 9px; }
          .da-coins-row .da-count-input { width: 53px; }
          .da-cash-total { padding-top: 3px; }
          .da-cash-total-band { padding: 4px 6px; }
          .da-cash-total-band span { font-size: 9px; }
          .da-cash-total-band > div > span { font-size: 12px; }
          .da-clear-cash { height: 19px; padding: 0 5px; font-size: 7px; }
          .da-account-row { min-height: 16px; gap: 4px; padding-top: 0; padding-bottom: 0; }
          .da-account-row > div:first-child span:first-child { width: 14px; height: 14px; }
          .da-account-row > div:first-child span:last-child { font-size: 8px; }
          .da-account-input { height: 15px; padding: 0 3px 0 14px; font-size: 8px; }
          .da-section-total { padding-top: 1px; }
          .da-section-total span { font-size: 8px; }
          .da-section-total > span:last-child { font-size: 9px; }
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) 66px; }
          .da-overview { height: 66px; padding: 4px 5px; }
          .da-overview-title { margin-bottom: 2px; font-size: 8px; }
          .da-overview-title small { font-size: 6px; }
          .da-overview-content { height: 40px; grid-template-columns: minmax(0, 1fr) 40px minmax(0, 94px); gap: 5px; }
          .da-overview-chart-empty { font-size: 6px; }
          .da-overview-breakdown { gap: 2px; }
          .da-overview-item { grid-template-columns: 5px minmax(15px, 1fr) auto auto; gap: 2px; }
          .da-overview-dot { width: 5px; height: 5px; }
          .da-overview-item span:nth-child(2), .da-overview-item small { font-size: 6px; }
          .da-overview-item strong { font-size: 6px; }
          .da-overview-donut { flex-basis: 40px; width: 40px; height: 40px; padding: 4px; }
          .da-overview-donut-hole strong { font-size: 6px; }
          .da-tx-filterbar { gap: 3px; padding: 3px 5px; }
          .da-tx-filter { min-height: 18px; padding: 0 5px; font-size: 7px; }
          .da-tx-date { width: 87px; height: 18px; font-size: 7px; }
          .da-tx-search-wrap { max-width: 98px; min-width: 68px; }
          .da-tx-search { height: 19px; font-size: 8px; }
          .da-tx-form { padding: 4px; gap: 4px; }
          .da-tx-form button, .da-tx-form input { min-height: 19px; padding-top: 1px; padding-bottom: 1px; font-size: 8px; }
          .da-tx-item { min-height: 26px; gap: 4px; padding: 2px 4px; }
          .da-tx-symbol { width: 18px; height: 18px; }
          .da-tx-description { font-size: 8px; }
          .da-tx-time { font-size: 7px; }
          .da-tx-value { font-size: 8px; }
          .da-reconcile-title { padding: 3px 5px; font-size: 8px; }
          .da-reconcile-values .da-reconcile-value { padding: 3px 5px; }
          .da-reconcile-value p:first-child { font-size: 7px; }
          .da-reconcile-value p:nth-child(2) { font-size: 9px; }
          .da-reconcile-value p:last-child { display: none; }
          .da-difference { padding: 3px 5px; }
          .da-difference-value { font-size: 11px; }
          .da-status { gap: 2px; padding: 2px 4px; font-size: 7px; }
        }
        @media print {
          @page { size: landscape; margin: 10mm; }
          html, body, #root { height: auto !important; overflow: visible !important; background: #fff !important; }
          .da-page, .da-app-main, .da-main, .da-dashboard-grid, .da-column { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; color: #111827 !important; }
          .da-sidebar { display: none !important; }
          .da-dashboard-grid { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; flex: none !important; gap: 8px !important; }
          .da-column { display: flex !important; flex-direction: column !important; gap: 8px !important; }
          .da-panel .flex-1 { flex: none !important; }
          .da-toolbar, .da-print-hidden, .da-tx-filterbar { display: none !important; }
          .da-panel { overflow: visible !important; background: #fff !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; backdrop-filter: none !important; break-inside: avoid; }
          .da-panel *, .da-metric * { color: #111827 !important; }
          .da-metric { background: #f8fafc !important; border-color: #cbd5e1 !important; }
        }
        @media (max-width: 920px) {
          .da-page { height: auto; min-height: 100dvh; overflow: visible; flex-direction: column; }
          .da-sidebar { position: sticky; top: 0; flex-basis: auto; min-height: 48px; padding: 5px 8px; border-right: 0; border-bottom: 1px solid rgba(112, 157, 204, .2); }
          .da-side-brand, .da-side-art, .da-side-foot { display: none; }
          .da-nav { flex-direction: row; gap: 4px; overflow-x: auto; scrollbar-width: thin; }
          .da-nav-item { flex: 0 0 auto; min-height: 34px; padding: 0 9px; }
          .da-app-main { min-height: 0; }
          .da-toolbar { flex-wrap: wrap; min-height: 46px; padding: 5px 9px; }
          .da-main { overflow: visible; }
          .da-dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto; }
          .da-column { overflow: visible; }
          .da-column:first-child { grid-column: 1; grid-row: auto; min-height: 400px; }
          .da-column:nth-child(2) { grid-column: 2; grid-row: auto; min-height: 400px; }
          .da-column:last-child { grid-column: 1 / -1; grid-row: auto; min-height: 430px; }
          .da-overview { grid-column: 1 / -1; grid-row: auto; min-height: 66px; }
        }
        @media (max-width: 920px) and (min-width: 621px) {
          .da-main > .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .da-metric { min-height: 88px; gap: 9px; padding: 9px; }
          .da-metric-icon { width: 46px; height: 56px; flex-basis: 46px; }
          .da-metric-icon svg { width: 20px; height: 20px; }
          .da-metric-label { font-size: 11px; }
          .da-metric-value { font-size: clamp(14px, 1.8vw, 17px); }
          .da-metric-sub { font-size: 9px; }
        }
        @media (max-width: 620px) {
          .da-main { padding: 8px; }
          .da-toolbar { gap: 6px; }
          .da-brand-title { font-size: 11px; }
          .da-toolbar > .order-3 { order: 3; }
          .da-toolbar > .ml-auto { margin-left: auto; }
          .da-toolbar > .ml-auto button { width: 30px; padding: 0; font-size: 0; justify-content: center; }
          .da-toolbar > .ml-auto button[data-testid="button-export"] { width: auto; padding: 0 7px; font-size: 10px; }
          .da-toolbar > .ml-auto button[data-testid="button-unlock-edit"],
          .da-toolbar > .ml-auto button[data-testid="button-lock-edit"] { width: auto; padding: 0 7px; font-size: 9px; }
          .da-main > .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .da-metric:last-child { grid-column: 1 / -1; }
          .da-metric { min-height: 88px; gap: 8px; padding: 8px; border-radius: 13px; }
          .da-metric-icon { width: 42px; height: 54px; flex-basis: 42px; border-radius: 11px; }
          .da-metric-icon svg { width: 19px; height: 19px; }
          .da-metric-label { font-size: 10px; }
          .da-metric-value { font-size: clamp(12px, 3.6vw, 15px); }
          .da-metric-sub { font-size: 8px; }
          .da-dashboard-grid { display: flex; flex-direction: column; }
          .da-column:first-child, .da-column:nth-child(2), .da-column:last-child { min-height: 0; }
          .da-column:first-child > .da-panel { min-height: 340px; }
          .da-transactions-panel { min-height: 350px; }
          .da-tx-search-wrap { max-width: 135px; }
        }
        @media (max-width: 390px) {
          .da-nav-item { padding: 0 6px; }
          .da-nav-item span { display: none; }
          .da-brand-title { font-size: 10px; }
          .da-metric { gap: 6px; padding: 7px; }
          .da-metric-icon { width: 36px; height: 48px; flex-basis: 36px; }
          .da-metric-icon svg { width: 17px; height: 17px; }
          .da-metric-label { font-size: 9px; }
          .da-metric-value { font-size: 12px; }
          .da-metric-sub { font-size: 7px; }
        }

        /* Premium dark-fintech visual refinement */
        .da-page {
          background:
            radial-gradient(ellipse at 68% -12%, rgba(31, 111, 224, .27), transparent 43%),
            radial-gradient(ellipse at 100% 58%, rgba(121, 63, 217, .13), transparent 35%),
            radial-gradient(ellipse at 24% 100%, rgba(15, 187, 158, .1), transparent 39%),
            radial-gradient(ellipse at 50% 42%, rgba(20, 55, 97, .17), transparent 58%),
            linear-gradient(135deg, #050a17 0%, #08152b 54%, #071126 100%);
        }
        .da-sidebar {
          flex-basis: clamp(150px, 11.6vw, 224px);
          padding: 15px 12px 13px;
          border-right-color: rgba(93, 148, 209, .25);
          background:
            radial-gradient(ellipse at 50% 76%, rgba(31, 100, 163, .2), transparent 48%),
            linear-gradient(180deg, #09172d 0%, #071328 62%, #08172c 100%);
          box-shadow: inset -1px 0 rgba(114, 172, 235, .07), 8px 0 34px rgba(1, 7, 20, .2);
        }
        .da-side-brand { justify-content: flex-start; height: 42px; margin-bottom: 18px; padding: 4px 7px; }
        .da-side-brand-mark { width: 36px; height: 36px; border-radius: 11px; box-shadow: 0 0 20px rgba(234, 176, 51, .2), inset 0 1px rgba(255,255,255,.15); }
        .da-side-brand-mark svg { width: 20px; height: 20px; }
        .da-nav { gap: 7px; }
        .da-nav-item {
          min-height: 42px;
          gap: 11px;
          padding: 0 11px;
          border-radius: 10px;
          font-size: clamp(10px, .72vw, 13px);
        }
        .da-nav-item svg { width: 18px; height: 18px; }
        .da-nav-item.active {
          padding-left: 8px;
          border-left: 3px solid #f1c552;
          background: linear-gradient(100deg, rgba(204, 150, 35, .28), rgba(30, 68, 111, .48));
          box-shadow: inset 0 0 18px rgba(230, 180, 53, .1), 0 0 18px rgba(225, 176, 52, .13);
        }
        .da-side-art {
          inset: 0;
          height: auto;
          border-top: 0;
          background: #08172d;
        }
        .da-side-art::after {
          background: linear-gradient(180deg, #08172d 0%, rgba(8, 23, 44, .48) 24%, rgba(7, 18, 36, .04) 72%, rgba(6, 15, 31, .28) 100%);
        }
        .da-side-art .da-artwork { inset: 0; display: block; width: 100%; height: 100%; border: 0; border-radius: 0; background: transparent; }
        .da-side-art .da-artwork img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; object-position: right center; padding: 0; opacity: .98; }
        .da-side-art .da-artwork-placeholder { background: radial-gradient(ellipse at 50% 80%, rgba(225, 170, 46, .09), transparent 69%); }
        .da-side-foot { z-index: 2; margin-top: auto; padding: 10px 4px 16px; font-size: 10px; }
        .da-artwork { border: 1px solid rgba(111, 163, 217, .18); border-radius: 10px; background: linear-gradient(145deg, rgba(16, 39, 69, .52), rgba(8, 21, 41, .72)); }
        .da-artwork-placeholder { display: block; width: 100%; height: 100%; background: radial-gradient(ellipse at 55% 42%, rgba(57, 143, 224, .07), transparent 66%), linear-gradient(135deg, rgba(20, 42, 70, .32), rgba(9, 21, 40, .5)); }
        .da-artwork img { object-fit: contain; }

        .da-toolbar {
          flex-basis: 54px;
          min-height: 54px;
          gap: 12px;
          padding: 0 18px;
          border-bottom-color: rgba(91, 152, 216, .25);
          background: linear-gradient(90deg, rgba(7, 16, 33, .97), rgba(8, 19, 39, .92));
          box-shadow: 0 8px 28px rgba(0, 5, 16, .18);
        }
        .da-toolbar > .flex.items-center:first-child { gap: 10px; }
        .da-toolbar > .flex.items-center:first-child > div { width: 38px; height: 38px; border-radius: 11px; }
        .da-toolbar > .flex.items-center:first-child > div svg { width: 21px; height: 21px; }
        .da-brand-title { font-size: clamp(15px, 1vw, 19px); letter-spacing: -.35px; }
        .da-toolbar > .order-3 { min-height: 36px; padding: 3px 7px; border-radius: 10px; }
        .da-toolbar > .order-3 input { width: 132px; font-size: 12px; }
        .da-toolbar > .order-3 button { padding: 4px 6px; }
        .da-toolbar > .ml-auto { gap: 7px; }
        .da-toolbar > .ml-auto button {
          height: 35px;
          padding: 0 10px;
          border-radius: 9px;
          font-size: 11px;
          box-shadow: inset 0 1px rgba(255,255,255,.04), 0 3px 11px rgba(0,0,0,.12);
        }
        .da-toolbar > .ml-auto button[data-testid="button-export"] { box-shadow: 0 0 18px rgba(231, 166, 46, .24), inset 0 1px rgba(255,255,255,.42); }
        .da-main { gap: 13px; padding: 13px 16px 15px; }
        .da-main > .grid { gap: 11px; }

        .da-metric {
          min-height: clamp(100px, 10vh, 132px);
          gap: 14px;
          padding: 14px 17px;
          border-radius: 16px;
          box-shadow: inset 0 1px rgba(255,255,255,.11), 0 8px 24px rgba(0,0,0,.22), 0 0 26px var(--metric-glow, rgba(25,220,170,.18));
        }
        .da-metric::before { opacity: .6; }
        .da-metric::after { display: none; }
        .da-metric-sparkline { position: absolute; z-index: 0; right: 0; bottom: 0; width: 49%; height: 53%; overflow: visible; opacity: .88; pointer-events: none; }
        .da-metric-icon {
          width: clamp(54px, 4.3vw, 72px);
          height: clamp(58px, 6.4vh, 76px);
          flex-basis: clamp(54px, 4.3vw, 72px);
          border-radius: 15px;
        }
        .da-metric-icon svg { width: 29px; height: 29px; }
        .da-metric-label { font-size: clamp(12px, .82vw, 15px); }
        .da-metric-value { font-size: clamp(20px, 1.45vw, 29px); line-height: 1.15; }
        .da-metric-sub { font-size: clamp(9px, .66vw, 12px); }

        .da-dashboard-grid {
          grid-template-rows: minmax(0, 1fr) clamp(122px, 14vh, 160px);
          gap: 12px;
        }
        .da-column { gap: 11px; }
        .da-panel {
          position: relative;
          border-radius: 14px !important;
          border-color: rgba(100, 155, 214, .35) !important;
          background: linear-gradient(150deg, rgba(13, 31, 58, .97), rgba(7, 20, 41, .985)) !important;
          box-shadow: inset 0 1px rgba(255,255,255,.045), 0 9px 24px rgba(0, 5, 15, .24), 0 0 18px rgba(43, 127, 212, .08) !important;
        }
        .da-panel:hover { border-color: rgba(121, 180, 238, .55) !important; }
        #cash-panel { border-color: rgba(44, 213, 171, .44) !important; box-shadow: inset 0 1px rgba(255,255,255,.055), 0 0 18px rgba(16, 185, 129, .14), 0 0 36px rgba(16, 185, 129, .07) !important; }
        #bank-panel { border-color: rgba(75, 158, 255, .45) !important; box-shadow: inset 0 1px rgba(255,255,255,.055), 0 0 19px rgba(37, 119, 235, .16), 0 0 38px rgba(37, 119, 235, .07) !important; }
        #aeps-panel { border-color: rgba(171, 111, 255, .45) !important; box-shadow: inset 0 1px rgba(255,255,255,.055), 0 0 19px rgba(145, 68, 255, .16), 0 0 38px rgba(145, 68, 255, .08) !important; }
        #transactions-panel { border-color: rgba(46, 201, 227, .39) !important; box-shadow: inset 0 1px rgba(255,255,255,.055), 0 0 19px rgba(23, 178, 211, .12), 0 0 36px rgba(23, 178, 211, .06) !important; }
        .da-card-head, .da-tx-header {
          min-height: 44px;
          gap: 10px;
          padding: 7px 12px;
          border-bottom-color: rgba(121, 169, 217, .21) !important;
          background: linear-gradient(90deg, rgba(20, 53, 90, .8), rgba(9, 27, 52, .56)) !important;
        }
        .da-card-head h3, .da-tx-header h3 { font-size: clamp(12px, .84vw, 15px); }
        .da-card-head .w-1 { width: 3px; height: 19px; border-radius: 999px; box-shadow: 0 0 9px currentColor; }
        .da-card-subtitle { margin-top: 2px; font-size: 9px; }
        .da-card-body { padding: 10px 12px; }

        .da-cash-table-header { padding: 4px 8px 8px; font-size: 10px; border-bottom-color: rgba(115, 159, 205, .25); }
        .da-denom-row { min-height: clamp(34px, 4.6vh, 51px); gap: 9px; padding: 4px 4px; border-radius: 8px; transition: background .18s; }
        .da-denom-row:hover { background: rgba(40, 93, 145, .14); }
        .da-denom-row > div:first-child { width: 62px; }
        .da-denom-row > div:first-child span { min-width: 54px; padding: 5px 7px; border-radius: 8px; font-size: 11px; }
        .da-denom-badge { border: 1px solid rgba(255,255,255,.17); box-shadow: inset 0 1px rgba(255,255,255,.2), 0 3px 10px rgba(0,0,0,.14); }
        .da-denom-badge[data-denomination="500"] { color: #f0e6ff !important; background: linear-gradient(145deg, #8558d8, #5832a0) !important; }
        .da-denom-badge[data-denomination="200"] { color: #fff0df !important; background: linear-gradient(145deg, #ed9850, #b95c2f) !important; }
        .da-denom-badge[data-denomination="100"] { color: #e6f2ff !important; background: linear-gradient(145deg, #368dd8, #2457a6) !important; }
        .da-denom-badge[data-denomination="50"] { color: #e4fdff !important; background: linear-gradient(145deg, #22b9c8, #147190) !important; }
        .da-denom-badge[data-denomination="20"] { color: #e6fff1 !important; background: linear-gradient(145deg, #31bd89, #1a795d) !important; }
        .da-denom-badge[data-denomination="10"] { color: #fff3e0 !important; background: linear-gradient(145deg, #bd8544, #765027) !important; }
        .da-coins-badge { display: inline-flex; min-width: 54px; justify-content: center; border: 1px solid rgba(255, 209, 83, .42); color: #fff3c1; background: linear-gradient(145deg, #9d7122, #644414); box-shadow: 0 0 12px rgba(225, 174, 51, .12); }
        .da-denom-row .da-stepper {
          width: 29px;
          height: 29px;
          border: 1px solid rgba(83, 155, 220, .32);
          color: #c2def8;
          background: linear-gradient(145deg, rgba(23, 52, 82, .94), rgba(10, 28, 51, .96));
          box-shadow: inset 0 1px rgba(255,255,255,.055);
        }
        .da-denom-row .da-stepper:hover:not(:disabled) { border-color: rgba(94, 190, 255, .62); color: white; box-shadow: 0 0 12px rgba(44, 153, 229, .24); }
        .da-denom-row .da-count-input { width: 72px; height: 29px; border-color: rgba(77, 139, 198, .48) !important; border-radius: 8px; background: rgba(4, 14, 29, .73); font-size: 12px; box-shadow: inset 0 2px 8px rgba(0,0,0,.23); }
        .da-coins-row .da-count-input { width: 82px; }
        .da-denom-row > span:last-child { color: #f4d876; font-size: 12px; }
        .da-cash-total { padding-top: 9px; }
        .da-cash-total-band {
          padding: 11px 13px !important;
          border: 1px solid rgba(37, 224, 166, .4) !important;
          border-radius: 11px !important;
          background: linear-gradient(105deg, rgba(8, 86, 70, .68), rgba(5, 52, 58, .65)) !important;
          box-shadow: inset 0 1px rgba(255,255,255,.07), 0 0 17px rgba(15, 210, 155, .16), 0 0 34px rgba(15, 210, 155, .07);
        }
        .da-cash-total-band span:first-child { font-size: 13px; }
        .da-cash-total-band > div > span:last-child { font-size: clamp(18px, 1.2vw, 23px); }
        .da-cash-illustration { width: 48px; height: 37px; flex: 0 0 48px; border: 0; background: transparent; filter: drop-shadow(0 0 8px rgba(37, 220, 167, .23)); }
        .da-cash-total-band {
          position: relative;
          overflow: hidden;
        }
        .da-cash-total-band::after {
          content: "";
          position: absolute;
          z-index: 1;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(3, 49, 42, .62), rgba(3, 43, 45, .34) 58%, rgba(3, 37, 43, .58));
        }
        .da-cash-total-band > div { position: static; }
        .da-cash-total-band > div > span { position: relative; z-index: 2; }
        .da-cash-total-band .da-cash-illustration {
          position: absolute;
          z-index: 0;
          inset: 0;
          width: 100%;
          height: 100%;
          flex: none;
          border: 0;
          border-radius: inherit;
          opacity: .34;
          pointer-events: none;
          filter: none;
        }
        .da-cash-total-band .da-cash-illustration img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 58%;
        }

        .da-account-row { min-height: clamp(26px, 3.4vh, 38px); gap: 8px; padding: 4px 5px; border-bottom-color: rgba(99, 147, 194, .14); border-radius: 7px; transition: background .16s, border-color .16s; }
        .da-account-row:hover { background: rgba(41, 104, 163, .14); }
        .da-account-row > div:first-child span:first-child { width: 22px; height: 22px; border-radius: 7px; font-size: 9px; }
        .da-account-row > div:first-child span:last-child { font-size: 11px; }
        .da-account-input { width: 122px; height: 27px; border-color: rgba(72, 133, 194, .45) !important; border-radius: 7px; background: rgba(4, 14, 29, .68); font-size: 11px; }
        .da-section-total { padding-top: 8px; margin-top: 5px; }
        .da-section-total span { font-size: 11px; }
        .da-section-total > span:last-child { font-size: 13px; }
        .da-illustrated-content { position: relative; flex: 1; min-height: 0; }
        .da-illustrated-rows { position: relative; z-index: 1; height: 100%; }
        .da-illustrated-content .da-illustrated-rows { padding-right: calc(clamp(52px, 5.5vw, 98px) + var(--da-aeps-entry-inset, 0px)); }
        .da-inline-illustration {
          position: absolute;
          z-index: 0;
          top: 50%;
          right: 0;
          width: clamp(48px, 5vw, 88px);
          height: clamp(78px, 10vh, 132px);
          transform: translateY(-50%);
          border: 0;
          border-radius: 12px;
          opacity: .88;
          filter: drop-shadow(0 0 12px rgba(53, 147, 247, .24));
        }
        .da-bank-illustration { background: radial-gradient(ellipse, rgba(36, 127, 239, .2), transparent 73%); }
        .da-aeps-illustration { filter: drop-shadow(0 0 12px rgba(165, 94, 255, .32)); background: radial-gradient(ellipse, rgba(145, 74, 243, .2), transparent 73%); }
        .da-card-action-total { gap: 8px; font-size: 11px; }
        .da-total-badge {
          gap: 7px;
          padding: 5px 9px;
          border: 1px solid rgba(94, 162, 239, .33);
          border-radius: 8px;
          color: #bddcff;
          background: linear-gradient(135deg, rgba(22, 68, 115, .72), rgba(12, 38, 71, .78));
          box-shadow: inset 0 1px rgba(255,255,255,.06), 0 0 12px rgba(44, 132, 231, .1);
        }
        .da-total-badge span { color: #91b6da; font: 600 9px/1 ui-sans-serif, system-ui; }
        .da-total-badge strong { color: #f1f7ff; font-size: 12px; }
        .da-aeps-total-badge { border-color: rgba(181, 119, 255, .38); color: #e0c7ff; background: linear-gradient(135deg, rgba(85, 42, 146, .75), rgba(41, 25, 77, .8)); box-shadow: 0 0 12px rgba(151, 75, 238, .14); }

        .da-transactions-panel { border-radius: 14px !important; }
        .da-tx-header { min-height: 44px; }
        .da-view-all { min-height: 28px; padding: 0 10px; border-color: rgba(80, 176, 221, .35); border-radius: 8px; color: #c2efff; background: rgba(11, 76, 105, .38); font-size: 10px; }
        .da-tx-filterbar { gap: 7px; padding: 8px 10px; border-bottom-color: rgba(98, 166, 207, .18); }
        .da-tx-filter { min-height: 28px; padding: 0 10px; border-radius: 8px; font-size: 10px; }
        .da-tx-filter.active { border-color: rgba(255, 195, 61, .52); color: #ffe4a1; background: linear-gradient(135deg, rgba(157, 105, 21, .35), rgba(57, 45, 27, .36)); box-shadow: 0 0 12px rgba(244, 183, 58, .12); }
        .da-tx-date { width: 122px; height: 28px; border-radius: 8px; font-size: 10px; }
        .da-tx-search { height: 29px; border-radius: 8px; font-size: 10px; }
        .da-tx-form { padding: 9px; gap: 7px; border-color: rgba(83, 163, 204, .24) !important; background: linear-gradient(120deg, rgba(7, 39, 58, .56), rgba(8, 25, 45, .6)) !important; }
        .da-tx-form button, .da-tx-form input { min-height: 29px; font-size: 10px; }
        .da-tx-item {
          min-height: 52px;
          gap: 10px;
          padding: 7px 9px;
          border: 1px solid rgba(103, 159, 202, .12);
          border-left: 2px solid var(--tx-accent, rgba(41, 193, 211, .48));
          border-radius: 10px;
          background: linear-gradient(100deg, rgba(11, 36, 62, .78), rgba(8, 25, 46, .78)) !important;
          transition: transform .16s, border-color .16s, box-shadow .16s, background .16s;
        }
        .da-tx-item[data-type="income"] { --tx-accent: rgba(53, 226, 170, .76); }
        .da-tx-item[data-type="expense"] { --tx-accent: rgba(255, 86, 119, .78); }
        .da-tx-item:hover { transform: translateX(2px); border-color: rgba(85, 178, 222, .35); background: linear-gradient(100deg, rgba(14, 48, 78, .88), rgba(8, 29, 51, .88)) !important; box-shadow: 0 0 15px rgba(39, 171, 204, .1); }
        .da-tx-symbol { width: 35px; height: 35px; border-radius: 50% !important; box-shadow: 0 0 11px currentColor; }
        .da-tx-item[data-type="income"] .da-tx-symbol { box-shadow: 0 0 13px rgba(40, 221, 163, .22); }
        .da-tx-item[data-type="expense"] .da-tx-symbol { box-shadow: 0 0 13px rgba(244, 73, 112, .2); }
        .da-tx-description { font-size: 12px; }
        .da-tx-time { font-size: 10px; }
        .da-tx-value { font-size: 12px; }
        .da-tx-arrow { color: #65809b; opacity: .75; }
        .da-tx-empty { display: flex; min-height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px; color: #9bb2ca; text-align: center; }
        .da-tx-empty-icon { display: grid; width: 48px; height: 48px; place-items: center; border: 1px solid rgba(68, 178, 209, .25); border-radius: 15px; color: #65cde0; background: linear-gradient(145deg, rgba(25, 91, 113, .32), rgba(12, 40, 65, .45)); box-shadow: 0 0 20px rgba(48, 182, 205, .12); }
        .da-tx-empty strong { color: #dce9f7; font-size: 13px; }
        .da-tx-empty small { color: #7993ad; font-size: 10px; }

        .da-reconciliation-card {
          border-color: rgba(245, 191, 73, .48) !important;
          border-radius: 14px !important;
          background: linear-gradient(135deg, rgba(91, 62, 20, .76), rgba(26, 31, 45, .98) 56%, rgba(16, 27, 43, .98)) !important;
          box-shadow: inset 0 1px rgba(255,255,255,.08), 0 0 19px rgba(229, 166, 47, .15), 0 0 37px rgba(229, 166, 47, .06) !important;
        }
        .da-reconciliation-card.is-balanced { border-color: rgba(55, 220, 161, .48) !important; box-shadow: inset 0 1px rgba(255,255,255,.08), 0 0 18px rgba(22, 204, 142, .16), 0 0 36px rgba(22, 204, 142, .07) !important; }
        .da-reconciliation-card.is-mismatch { border-color: rgba(255, 101, 132, .5) !important; box-shadow: inset 0 1px rgba(255,255,255,.08), 0 0 18px rgba(246, 66, 104, .17), 0 0 36px rgba(246, 66, 104, .07) !important; }
        .da-reconcile-title { min-height: 40px; padding: 7px 12px !important; border-bottom-color: rgba(238, 191, 93, .22) !important; font-size: 12px !important; }
        .da-reconciliation-card.is-balanced .da-reconcile-title { border-bottom-color: rgba(67, 216, 161, .2) !important; }
        .da-reconcile-values .da-reconcile-value { padding: 11px 13px; }
        .da-reconcile-value p:first-child { color: #a9b7c7; font-size: 10px; }
        .da-reconcile-value p:nth-child(2) { margin-top: 2px; color: #fff3d0; font-size: clamp(15px, 1vw, 20px); }
        .da-reconcile-value p:last-child { color: #8194aa; font-size: 9px; }
        .da-reconciliation-card.is-balanced .da-reconcile-value p:nth-child(2) { color: #b0f6d7; }
        .da-difference { padding: 10px 13px; }
        .da-difference > div:first-child p:first-child { color: #aebbd0; font-size: 10px; }
        .da-difference-value { font-size: clamp(16px, 1.15vw, 22px); text-shadow: 0 0 13px currentColor; }
        .da-status { padding: 7px 10px; border-radius: 9px; font-size: 10px; box-shadow: 0 0 14px currentColor; }
        .da-status.text-emerald-400 { box-shadow: 0 0 15px rgba(39, 221, 155, .17); }
        .da-status.text-red-400 { box-shadow: 0 0 15px rgba(255, 65, 103, .18); }
        .da-reconciliation-illustration { width: 42px; height: 32px; flex: 0 0 42px; margin-left: auto; border: 0; background: radial-gradient(ellipse, rgba(237, 183, 68, .18), transparent 74%); }

        .da-overview {
          border-color: rgba(232, 166, 59, .38);
          border-radius: 14px;
          background:
            radial-gradient(ellipse at 88% 8%, rgba(212, 143, 37, .12), transparent 48%),
            linear-gradient(125deg, rgba(12, 28, 52, .97), rgba(8, 21, 41, .98));
          box-shadow: inset 0 1px rgba(255,255,255,.05), 0 0 18px rgba(223, 152, 40, .1), 0 0 34px rgba(223, 152, 40, .04);
          padding: 10px 13px;
        }
        .da-overview-title { gap: 9px; margin-bottom: 7px; color: #f3f6fb; font-size: 13px; }
        .da-overview-title svg { width: 18px; height: 18px; color: #f1bb4f; filter: drop-shadow(0 0 6px rgba(241, 187, 79, .35)); }
        .da-overview-title small { margin-left: 1px; color: #a3b5c9; font-size: 9px; }
        .da-overview-content { height: calc(100% - 28px); min-height: 74px; grid-template-columns: minmax(0, 1fr) clamp(60px, 4.2vw, 76px) minmax(130px, 180px); gap: clamp(10px, 1vw, 17px); }
        .da-overview-chart { border-bottom-color: rgba(247, 177, 65, .34); background: linear-gradient(180deg, rgba(231, 150, 43, .08), transparent); }
        .da-overview-chart svg { position: relative; z-index: 1; }
        .da-overview-chart svg path:last-child { filter: drop-shadow(0 0 3px rgba(255, 176, 61, .7)); }
        .da-overview-chart-empty { position: relative; z-index: 2; color: #9fb3c9; font-size: 10px; }
        .da-overview-donut { width: clamp(60px, 4.2vw, 76px); height: clamp(60px, 4.2vw, 76px); flex-basis: clamp(60px, 4.2vw, 76px); padding: 6px; box-shadow: 0 0 19px rgba(104, 76, 237, .22), 0 0 31px rgba(45, 140, 223, .11); }
        .da-overview-donut-hole { border-color: rgba(175, 198, 225, .23); background: #09172d; }
        .da-overview-donut-hole strong { font-size: clamp(8px, .56vw, 11px); }
        .da-overview-donut-hole small { font-size: 8px; }
        .da-overview-breakdown { gap: 7px; }
        .da-overview-item { grid-template-columns: 8px minmax(34px, 1fr) auto auto; gap: 6px; }
        .da-overview-dot { width: 8px; height: 8px; }
        .da-overview-item span:nth-child(2) { color: #b0c1d5; font-size: 10px; }
        .da-overview-item strong { color: #edf4fc; font-size: 10px; }
        .da-overview-item small { color: #96aac2; font-size: 9px; }

        @media (min-width: 921px) and (max-height: 620px) {
          .da-toolbar { flex-basis: 42px; min-height: 42px; padding: 0 10px; }
          .da-toolbar > .flex.items-center:first-child > div { width: 30px; height: 30px; }
          .da-brand-title { font-size: 14px; }
          .da-toolbar > .ml-auto button { height: 28px; }
          .da-main { gap: 6px; padding: 6px 8px 7px; }
          .da-main > .grid { gap: 6px; }
          .da-metric { min-height: 66px; gap: 7px; padding: 5px 8px; border-radius: 10px; }
          .da-metric-icon { width: 42px; height: 48px; flex-basis: 42px; border-radius: 9px; }
          .da-metric-icon svg { width: 21px; height: 21px; }
          .da-metric-label { font-size: 9px; }
          .da-metric-value { font-size: clamp(12px, 1.25vw, 16px); }
          .da-metric-sub { font-size: 7px; }
          .da-metric-sparkline { width: 44%; height: 48%; }
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) 70px; gap: 7px; }
          .da-column { gap: 5px; }
          .da-card-head, .da-tx-header { min-height: 30px; padding: 4px 7px; gap: 6px; }
          .da-card-head h3, .da-tx-header h3 { font-size: 9px; }
          .da-card-subtitle { font-size: 6px; }
          .da-card-body { padding: 4px 6px; }
          .da-cash-table-header { padding: 0 4px 3px; font-size: 7px; }
          .da-denom-row { min-height: 22px; gap: 4px; padding: 0 2px; }
          .da-denom-row > div:first-child { width: 43px; }
          .da-denom-row > div:first-child span { min-width: 39px; padding: 2px 3px; font-size: 8px; }
          .da-denom-row .da-stepper { width: 19px; height: 19px; }
          .da-denom-row .da-count-input { width: 43px; height: 19px; font-size: 9px; }
          .da-coins-row .da-count-input { width: 54px; }
          .da-cash-total { padding-top: 3px; }
          .da-cash-total-band { padding: 4px 6px !important; }
          .da-cash-total-band span:first-child { font-size: 9px; }
          .da-cash-total-band > div > span:last-child { font-size: 12px; }
          .da-cash-illustration { width: 28px; height: 22px; flex-basis: 28px; }
          .da-account-row { min-height: 16px; gap: 4px; padding: 0 3px; }
          .da-account-row > div:first-child span:first-child { width: 15px; height: 15px; font-size: 7px; }
          .da-account-row > div:first-child span:last-child { font-size: 8px; }
          .da-account-input { width: 96px; height: 15px; font-size: 8px; }
          .da-section-total { padding-top: 2px; margin-top: 2px; }
          .da-section-total span { font-size: 8px; }
          .da-section-total > span:last-child { font-size: 9px; }
          .da-inline-illustration { width: 42px; height: 62px; }
          .da-illustrated-content .da-illustrated-rows { padding-right: calc(46px + var(--da-aeps-entry-inset, 0px)); }
          .da-total-badge { gap: 4px; padding: 3px 5px; }
          .da-total-badge span { font-size: 7px; }
          .da-total-badge strong { font-size: 8px; }
          .da-tx-filterbar { gap: 3px; padding: 3px 5px; }
          .da-tx-filter { min-height: 18px; padding: 0 5px; font-size: 7px; }
          .da-tx-date { width: 86px; height: 18px; font-size: 7px; }
          .da-tx-search { height: 19px; font-size: 7px; }
          .da-tx-item { min-height: 28px; gap: 4px; padding: 3px 4px; }
          .da-tx-symbol { width: 20px; height: 20px; }
          .da-tx-description { font-size: 8px; }
          .da-tx-time { font-size: 7px; }
          .da-tx-value { font-size: 8px; }
          .da-tx-arrow { width: 11px; }
          .da-tx-empty-icon { width: 34px; height: 34px; }
          .da-tx-empty strong { font-size: 9px; }
          .da-tx-empty small { font-size: 7px; }
          .da-reconcile-title { min-height: 28px; padding: 3px 6px !important; font-size: 8px !important; }
          .da-reconciliation-illustration { width: 29px; height: 21px; flex-basis: 29px; }
          .da-reconcile-values .da-reconcile-value { padding: 3px 6px; }
          .da-reconcile-value p:first-child { font-size: 7px; }
          .da-reconcile-value p:nth-child(2) { font-size: 9px; }
          .da-reconcile-value p:last-child { display: none; }
          .da-difference { padding: 3px 6px; }
          .da-difference-value { font-size: 11px; }
          .da-status { gap: 2px; padding: 3px 5px; font-size: 7px; }
          .da-overview { padding: 3px 6px; }
          .da-overview-title { margin-bottom: 1px; font-size: 8px; }
          .da-overview-title svg { width: 12px; height: 12px; }
          .da-overview-title small { font-size: 6px; }
          .da-overview-content { min-height: 0; height: calc(100% - 14px); grid-template-columns: minmax(0, 1fr) 40px minmax(84px, 105px); gap: 5px; }
          .da-overview-donut { width: 40px; height: 40px; flex-basis: 40px; padding: 4px; }
          .da-overview-donut-hole strong { font-size: 6px; }
          .da-overview-donut-hole small { font-size: 5px; }
          .da-overview-breakdown { gap: 2px; }
          .da-overview-item { grid-template-columns: 5px minmax(12px, 1fr) auto auto; gap: 2px; }
          .da-overview-dot { width: 5px; height: 5px; }
          .da-overview-item span:nth-child(2), .da-overview-item small { font-size: 6px; }
          .da-overview-item strong { font-size: 6px; }
        }
        @media (max-width: 920px) {
          .da-sidebar { flex-basis: auto; padding: 5px 8px; }
          .da-side-brand, .da-side-art, .da-side-foot { display: none; }
          .da-nav-item { min-height: 36px; gap: 7px; padding: 0 9px; font-size: 10px; }
          .da-nav-item svg { width: 15px; height: 15px; }
          .da-toolbar { flex-basis: auto; min-height: 46px; padding: 5px 9px; }
          .da-main { overflow: visible; gap: 10px; padding: 10px; }
          .da-main > .grid { gap: 7px; }
          .da-metric { min-height: 90px; gap: 9px; padding: 8px; border-radius: 12px; }
          .da-metric-icon { width: 46px; height: 56px; flex-basis: 46px; border-radius: 11px; }
          .da-metric-icon svg { width: 21px; height: 21px; }
          .da-metric-label { font-size: 10px; }
          .da-metric-value { font-size: clamp(13px, 1.8vw, 18px); }
          .da-metric-sub { font-size: 8px; }
          .da-dashboard-grid { gap: 8px; }
          .da-column { gap: 8px; }
          .da-card-head, .da-tx-header { min-height: 38px; padding: 6px 9px; }
          .da-card-body { padding: 8px; }
          .da-overview { min-height: 94px; padding: 8px; }
          .da-overview-content { min-height: 58px; height: auto; grid-template-columns: minmax(0, 1fr) 58px minmax(100px, 130px); gap: 7px; }
          .da-overview-donut { width: 58px; height: 58px; flex-basis: 58px; }
        }
        @media (max-width: 620px) {
          .da-main { padding: 8px; gap: 9px; }
          .da-metric { min-height: 80px; gap: 7px; padding: 7px; }
          .da-metric-icon { width: 38px; height: 46px; flex-basis: 38px; border-radius: 9px; }
          .da-metric-icon svg { width: 18px; height: 18px; }
          .da-metric-label { font-size: 9px; }
          .da-metric-value { font-size: clamp(11px, 3.4vw, 15px); }
          .da-metric-sub { font-size: 7px; }
          .da-dashboard-grid { display: flex; flex-direction: column; gap: 9px; }
          .da-column:first-child, .da-column:nth-child(2), .da-column:last-child { min-height: 0; }
          .da-column:first-child > .da-panel { min-height: 345px; }
          .da-column:nth-child(2) > .da-panel { min-height: 220px; }
          .da-transactions-panel { min-height: 360px; }
          .da-overview { min-height: 174px; padding: 9px; }
          .da-overview-content { height: auto; grid-template-columns: minmax(0, 1fr) 62px; gap: 8px; }
          .da-overview-chart { grid-column: 1 / -1; min-height: 88px; }
          .da-overview-donut { width: 62px; height: 62px; flex-basis: 62px; }
          .da-overview-breakdown { gap: 6px; }
          .da-overview-item { grid-template-columns: 7px minmax(32px, 1fr) auto auto; gap: 5px; }
          .da-overview-item span:nth-child(2), .da-overview-item small { font-size: 8px; }
          .da-overview-item strong { font-size: 8px; }
          .da-inline-illustration { width: 50px; height: 75px; }
          .da-illustrated-content .da-illustrated-rows { padding-right: calc(54px + var(--da-aeps-entry-inset, 0px)); }
        }
        @media (min-width: 921px) and (min-height: 621px) and (max-height: 820px) {
          .da-column:nth-child(2) > #bank-panel { flex: 1.2 1 0%; min-height: 0; }
          .da-column:nth-child(2) > #aeps-panel { flex: 1 1 0%; min-height: 0; }
          .da-account-row { min-height: 20px; gap: 4px; padding: 1px 3px; }
          .da-account-row > div:first-child span:first-child { width: 17px; height: 17px; font-size: 7px; }
          .da-account-row > div:first-child span:last-child { font-size: 9px; }
          .da-account-input { width: 100px; height: 19px; padding: 2px 4px; font-size: 9px; line-height: 1; }
          .da-section-total { padding-top: 4px; margin-top: 3px; }
          .da-card-body { padding: 6px 8px; }
        }
        @media (min-width: 921px) and (max-height: 620px) {
          .da-column:nth-child(2) > #bank-panel { flex: 1.2 1 0%; min-height: 0; }
          .da-column:nth-child(2) > #aeps-panel { flex: 1 1 0%; min-height: 0; }
          .da-account-row { height: 17px !important; min-height: 17px !important; gap: 3px; padding: 0 3px !important; overflow: hidden; }
          .da-account-row > div:first-child span:first-child { width: 13px !important; height: 13px !important; min-width: 13px; font-size: 6px; line-height: 1; }
          .da-account-row > div:first-child span:last-child { font-size: 7px !important; line-height: 1 !important; }
          .da-account-input { width: 78px; height: 14px !important; min-height: 14px !important; padding: 1px 3px !important; font-size: 8px !important; line-height: 1 !important; }
          .da-section-total { padding-top: 1px; margin-top: 1px; }
        }

        /* Final reference polish: keep the navy foundation, add brighter glass surfaces and clearer accent lighting. */
        @media screen {
          .da-date-value {
            position: relative;
            display: inline-flex;
            width: 88px;
            height: 20px;
            flex: 0 0 88px;
            align-items: center;
            justify-content: center;
            color: #f4f7fb;
            font-size: 10px;
            font-weight: 650;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .da-toolbar > .order-3 .da-date-input {
            position: absolute;
            inset: 0;
            z-index: 1;
            width: 100%;
            height: 100%;
            padding: 0;
            opacity: 0;
            cursor: pointer;
          }
          .da-date-value:focus-within { border-radius: 4px; outline: 1px solid rgba(250, 204, 92, .72); outline-offset: 1px; }
          .da-tx-header-icon { display: inline-flex; width: 18px; height: 18px; flex: 0 0 18px; align-items: center; justify-content: center; border: 1px solid rgba(64, 213, 223, .34); border-radius: 5px; color: #64e2e8; background: linear-gradient(145deg, rgba(17, 131, 144, .34), rgba(11, 49, 75, .52)); box-shadow: 0 0 11px rgba(37, 197, 212, .15), inset 0 1px rgba(255,255,255,.12); }

          .da-card-icon {
            display: inline-flex;
            width: 22px;
            height: 22px;
            flex: 0 0 22px;
            align-items: center;
            justify-content: center;
            border: 1px solid;
            border-radius: 7px;
            box-shadow: inset 0 1px rgba(255,255,255,.16), 0 0 11px color-mix(in srgb, currentColor 25%, transparent);
          }
          .da-card-icon svg { width: 14px; height: 14px; }

          .da-nav-item { transition: color .18s, background .18s, border-color .18s, box-shadow .18s, transform .18s; }
          .da-nav-item:hover { transform: translateX(2px); border-color: rgba(120, 183, 245, .34); background: linear-gradient(100deg, rgba(44, 95, 151, .28), rgba(20, 54, 94, .18)); box-shadow: inset 0 1px rgba(255,255,255,.04), 0 0 16px rgba(47, 133, 226, .12); }
          .da-nav-item.active { border-color: rgba(250, 204, 92, .6); background: linear-gradient(105deg, rgba(219, 163, 42, .34), rgba(36, 78, 127, .54) 72%, rgba(18, 47, 83, .58)); box-shadow: inset 0 1px rgba(255,255,255,.11), inset 0 0 20px rgba(245, 188, 57, .13), 0 0 20px rgba(232, 170, 47, .2), 0 0 34px rgba(46, 126, 213, .1); }

          .da-metric { border-width: 1px; box-shadow: inset 0 1px rgba(255,255,255,.16), inset 0 -1px rgba(0,0,0,.18), 0 9px 24px rgba(0,4,14,.24), 0 0 24px var(--metric-glow, rgba(25,220,170,.2)), 0 0 42px color-mix(in srgb, var(--metric-glow, rgba(25,220,170,.2)) 58%, transparent); }
          .da-metric::before { opacity: .95; background: radial-gradient(ellipse at 8% 0%, rgba(255,255,255,.12), transparent 52%), radial-gradient(ellipse at 100% 100%, color-mix(in srgb, currentColor 34%, transparent), transparent 67%); }
          .da-metric::after { display: block; opacity: .18; }
          .da-metric-sparkline { opacity: .98; filter: drop-shadow(0 0 5px currentColor); }
          .da-metric-icon { border-color: rgba(255,255,255,.36); box-shadow: 0 0 18px currentColor, inset 0 1px rgba(255,255,255,.42), inset 0 -7px 14px rgba(0,0,0,.12); }

          .da-panel {
            border-color: rgba(111, 176, 239, .42) !important;
            background: radial-gradient(ellipse at 12% 0%, rgba(59, 132, 207, .12), transparent 44%), linear-gradient(145deg, rgba(15, 37, 68, .985), rgba(8, 22, 44, .99) 70%) !important;
            box-shadow: inset 0 1px rgba(255,255,255,.09), inset 0 -1px rgba(0,0,0,.2), 0 9px 25px rgba(0,5,16,.26), 0 0 18px rgba(51, 137, 224, .12), 0 0 35px rgba(51, 137, 224, .055) !important;
          }
          #cash-panel { border-color: rgba(47, 224, 177, .56) !important; background: radial-gradient(ellipse at 5% 0%, rgba(42, 220, 168, .2), transparent 49%), radial-gradient(ellipse at 95% 100%, rgba(26, 158, 190, .12), transparent 53%), linear-gradient(145deg, #0d2c3a, #081b32 76%) !important; box-shadow: inset 0 1px rgba(255,255,255,.11), 0 0 18px rgba(22, 202, 155, .2), 0 0 38px rgba(22, 202, 155, .09) !important; }
          #bank-panel { border-color: rgba(75, 160, 255, .56) !important; background: radial-gradient(ellipse at 3% 0%, rgba(48, 137, 255, .2), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(27, 103, 206, .12), transparent 55%), linear-gradient(145deg, #102a4d, #091a34 76%) !important; box-shadow: inset 0 1px rgba(255,255,255,.1), 0 0 19px rgba(43, 135, 255, .2), 0 0 39px rgba(43, 135, 255, .09) !important; }
          #aeps-panel { border-color: rgba(183, 121, 255, .6) !important; background: radial-gradient(ellipse at 4% 0%, rgba(157, 79, 255, .24), transparent 53%), radial-gradient(ellipse at 100% 100%, rgba(107, 57, 203, .18), transparent 56%), linear-gradient(145deg, #28174b, #11152f 78%) !important; box-shadow: inset 0 1px rgba(255,255,255,.12), 0 0 20px rgba(145, 74, 255, .22), 0 0 40px rgba(145, 74, 255, .1) !important; }
          #transactions-panel { border-color: rgba(56, 213, 233, .5) !important; background: radial-gradient(ellipse at 2% 0%, rgba(37, 198, 221, .16), transparent 48%), linear-gradient(145deg, #102b48, #091b35 75%) !important; box-shadow: inset 0 1px rgba(255,255,255,.1), 0 0 19px rgba(26, 191, 218, .18), 0 0 38px rgba(26, 191, 218, .075) !important; }
          .da-card-head, .da-tx-header { border-bottom-color: rgba(141, 190, 237, .27) !important; box-shadow: inset 0 1px rgba(255,255,255,.08); }
          #cash-panel > .da-card-head { background: linear-gradient(90deg, rgba(15, 116, 91, .72), rgba(9, 48, 58, .64)) !important; }
          #bank-panel > .da-card-head { background: linear-gradient(90deg, rgba(24, 86, 155, .76), rgba(13, 38, 70, .68)) !important; }
          #aeps-panel > .da-card-head { background: linear-gradient(90deg, rgba(94, 47, 156, .82), rgba(39, 28, 82, .72)) !important; }
          #transactions-panel > .da-tx-header { background: linear-gradient(90deg, rgba(13, 101, 126, .72), rgba(11, 39, 70, .64)) !important; }

          .da-denom-row { transition: background .18s, box-shadow .18s; }
          .da-denom-row:hover { background: linear-gradient(90deg, rgba(27, 122, 123, .19), rgba(27, 92, 139, .08)); box-shadow: inset 2px 0 rgba(61, 222, 184, .64), 0 0 13px rgba(35, 174, 170, .09); }
          .da-denom-row .da-stepper { border-color: rgba(93, 177, 239, .44); background: linear-gradient(145deg, rgba(31, 73, 111, .98), rgba(11, 36, 65, .98)); box-shadow: inset 0 1px rgba(255,255,255,.1), 0 2px 8px rgba(0,0,0,.14); }
          .da-denom-row .da-count-input { border-color: rgba(91, 160, 218, .58) !important; background: linear-gradient(180deg, rgba(5, 20, 39, .94), rgba(7, 17, 34, .94)); }
          .da-cash-total-band { border-color: rgba(58, 245, 188, .58) !important; background: linear-gradient(105deg, rgba(11, 125, 92, .82), rgba(7, 83, 86, .76), rgba(5, 49, 66, .75)) !important; box-shadow: inset 0 1px rgba(255,255,255,.15), 0 0 20px rgba(24, 221, 166, .23), 0 0 39px rgba(24, 221, 166, .1); }

          .da-account-row { border-bottom-color: rgba(134, 177, 221, .2); }
          .da-account-row:nth-of-type(odd) { background: rgba(55, 109, 165, .09); }
          #aeps-panel .da-account-row:nth-of-type(odd) { background: rgba(151, 90, 224, .1); }
          .da-account-input:disabled { border-color: transparent !important; background: transparent !important; box-shadow: none; color: #eef5ff !important; opacity: 1 !important; cursor: default; }
          .da-account-row .relative > span { color: #92a9c1; }
          .da-account-table-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; margin: 0 2px 3px; padding: 0 calc(clamp(52px, 5.5vw, 98px) + var(--da-aeps-entry-inset, 0px)) 4px 5px; border-bottom: 1px solid rgba(132, 169, 207, .22); color: #9bb2ca; font-size: 9px; font-weight: 650; line-height: 1.2; }
          .da-account-table-header span:last-child { min-width: 48px; text-align: right; }
          #bank-panel .da-account-row:hover { background: linear-gradient(90deg, rgba(32, 117, 205, .25), rgba(32, 117, 205, .06)); box-shadow: inset 2px 0 rgba(93, 177, 255, .72), 0 0 15px rgba(55, 148, 255, .16); }
          #aeps-panel .da-account-row:hover { background: linear-gradient(90deg, rgba(133, 77, 214, .25), rgba(133, 77, 214, .06)); box-shadow: inset 2px 0 rgba(196, 139, 255, .75), 0 0 15px rgba(154, 86, 255, .17); }
          .da-total-badge { border-color: rgba(105, 183, 255, .46); background: linear-gradient(135deg, rgba(25, 85, 145, .82), rgba(13, 43, 83, .86)); box-shadow: inset 0 1px rgba(255,255,255,.09), 0 0 16px rgba(44, 132, 231, .18); }
          .da-aeps-total-badge { border-color: rgba(194, 142, 255, .56); background: linear-gradient(135deg, rgba(119, 61, 190, .86), rgba(55, 35, 105, .9)); box-shadow: 0 0 16px rgba(151, 75, 238, .22); }

          .da-tx-filter { border-color: rgba(118, 171, 208, .3); background: linear-gradient(145deg, rgba(16, 47, 73, .8), rgba(9, 28, 50, .82)); }
          .da-tx-filter.active { border-color: rgba(255, 206, 83, .66); background: linear-gradient(135deg, rgba(180, 125, 28, .42), rgba(65, 54, 29, .4)); box-shadow: inset 0 1px rgba(255,255,255,.12), 0 0 15px rgba(244, 183, 58, .2); }
          .da-tx-search, .da-tx-date { border-color: rgba(103, 177, 211, .36); background: linear-gradient(145deg, rgba(7, 29, 51, .92), rgba(6, 20, 39, .94)); }
          .da-tx-filterbar .da-tx-search-wrap { flex: 1 1 90px; min-width: 78px; max-width: 180px; margin-left: auto; }
          .da-tx-filterbar .da-tx-search { width: 100%; min-width: 0; }
          .da-tx-item { border-color: rgba(113, 172, 214, .2); box-shadow: inset 0 1px rgba(255,255,255,.035), 0 3px 10px rgba(0,0,0,.12); }
          .da-tx-item[data-type="income"] { background: linear-gradient(100deg, rgba(8, 67, 61, .68), rgba(8, 31, 49, .84)) !important; }
          .da-tx-item[data-type="expense"] { background: linear-gradient(100deg, rgba(75, 28, 53, .67), rgba(35, 22, 47, .84)) !important; }
          .da-tx-item[data-type="income"]:hover { box-shadow: 0 0 17px rgba(39, 215, 163, .17); }
          .da-tx-item[data-type="expense"]:hover { box-shadow: 0 0 17px rgba(244, 73, 112, .17); }
          .da-tx-empty-icon { border-color: rgba(75, 211, 230, .38); background: linear-gradient(145deg, rgba(24, 129, 150, .4), rgba(14, 45, 78, .58)); box-shadow: 0 0 24px rgba(48, 182, 205, .18), inset 0 1px rgba(255,255,255,.1); }

          .da-reconciliation-card { border-color: rgba(252, 195, 84, .62) !important; background: radial-gradient(ellipse at 0% 0%, rgba(219, 150, 43, .24), transparent 58%), linear-gradient(135deg, rgba(87, 58, 21, .9), rgba(31, 31, 43, .98) 64%, rgba(17, 28, 45, .99)) !important; box-shadow: inset 0 1px rgba(255,255,255,.12), 0 0 20px rgba(229, 166, 47, .2), 0 0 40px rgba(229, 166, 47, .09) !important; }
          .da-reconciliation-card.is-balanced { border-color: rgba(65, 234, 169, .62) !important; box-shadow: inset 0 1px rgba(255,255,255,.12), 0 0 20px rgba(22, 204, 142, .22), 0 0 40px rgba(22, 204, 142, .1) !important; }
          .da-reconciliation-card.is-mismatch { border-color: rgba(255, 109, 139, .64) !important; box-shadow: inset 0 1px rgba(255,255,255,.12), 0 0 20px rgba(246, 66, 104, .23), 0 0 40px rgba(246, 66, 104, .1) !important; }
          .da-reconcile-title { background: linear-gradient(90deg, rgba(157, 105, 28, .48), rgba(42, 38, 41, .26)); }
          .da-reconciliation-card.is-balanced .da-reconcile-title { background: linear-gradient(90deg, rgba(13, 112, 83, .4), rgba(22, 50, 51, .2)); }
          .da-reconciliation-card.is-mismatch .da-reconcile-title { background: linear-gradient(90deg, rgba(128, 35, 61, .48), rgba(50, 32, 48, .24)); }

          .da-overview { border-color: rgba(240, 178, 70, .5); background: radial-gradient(ellipse at 88% 0%, rgba(241, 161, 43, .18), transparent 49%), linear-gradient(125deg, rgba(14, 34, 62, .99), rgba(8, 21, 42, .99)); box-shadow: inset 0 1px rgba(255,255,255,.09), 0 0 19px rgba(223, 152, 40, .14), 0 0 36px rgba(223, 152, 40, .06); }
          .da-overview-chart { border-bottom-color: rgba(255, 184, 64, .56); background: linear-gradient(180deg, rgba(248, 166, 48, .13), rgba(30, 64, 83, .03) 76%, transparent); }
          .da-overview-chart svg path:last-child { filter: drop-shadow(0 0 5px rgba(255, 176, 61, .9)); }
          .da-overview-donut { box-shadow: 0 0 20px rgba(104, 76, 237, .3), 0 0 34px rgba(45, 140, 223, .17); }
        }

        @media screen and (min-width: 921px) {
          .da-column:nth-child(3) { display: contents; }
          .da-column:nth-child(3) > .da-transactions-panel { grid-column: 3; grid-row: 1; min-height: 0; }
          .da-column:nth-child(3) > .da-reconciliation-card { grid-column: 3; grid-row: 2; min-height: 0; }
          .da-reconciliation-card { display: grid; grid-template-rows: 32px minmax(0, 1fr) 34px; min-height: 0; }
          .da-reconcile-title { grid-row: 1; min-height: 32px; padding: 3px 8px !important; }
          .da-reconcile-values { grid-row: 2; min-height: 0; }
          .da-reconcile-values .da-reconcile-value { min-width: 0; padding: 4px 8px !important; }
          .da-reconcile-value p { line-height: 1.15; }
          .da-reconcile-value p:first-child { font-size: 9px; }
          .da-reconcile-value p:nth-child(2) { font-size: 13px; }
          .da-reconcile-value p:last-child { font-size: 7px; }
          .da-difference { grid-row: 3; min-height: 34px; padding: 2px 8px; }
          .da-difference > div:first-child p { line-height: 1.1; }
          .da-difference-value { font-size: 14px; line-height: 1.05; }
          .da-status { padding: 3px 7px; font-size: 9px; }
        }

        @media screen and (min-width: 921px) and (max-width: 1100px) {
          .da-sidebar { flex-basis: 132px; padding-left: 5px; padding-right: 5px; }
          .da-nav-item { gap: 7px; padding-right: 6px; padding-left: 6px; font-size: 10px; white-space: nowrap; }
          .da-nav-item svg { width: 15px; height: 15px; }
          .da-dashboard-grid { grid-template-columns: minmax(0, .99fr) minmax(0, 1.01fr) minmax(0, 1.08fr); }
          .da-tx-date { display: none; }
        }

        @media screen and (min-width: 921px) and (max-height: 620px) {
          .da-main { padding-left: 2px; }
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) 86px; }
          .da-metric { padding: 5px 8px; }
          .da-metric-icon { width: 46px; height: 50px; flex-basis: 46px; border-radius: 10px; }
          .da-metric-icon svg { width: 24px; height: 24px; }
          .da-metric-label { font-size: 10px; }
          .da-metric-value { font-size: clamp(13px, 1.35vw, 16px); }
          .da-metric-sub { font-size: 8px; }
          .da-card-head h3, .da-tx-header h3 { font-size: 10px; }
          .da-card-subtitle { font-size: 7px; }
          .da-card-icon { width: 18px; height: 18px; flex-basis: 18px; border-radius: 5px; }
          .da-card-icon svg { width: 12px; height: 12px; }
          .da-denom-row { min-height: 27px; gap: 4px; padding: 0 2px; }
          .da-denom-row .da-stepper { width: 20px; height: 20px; }
          .da-denom-row .da-count-input { width: 48px; height: 20px; font-size: 9px; }
          .da-coins-row .da-count-input { width: 56px; }
          .da-denom-row > div:first-child span { font-size: 9px; }
          .da-cash-total-band { padding: 5px 7px !important; }
          .da-cash-total-band span:first-child { font-size: 10px; }
          .da-cash-total-band > div > span:last-child { font-size: 14px; }
          .da-account-row { height: 17px !important; min-height: 17px !important; }
          .da-account-table-header { padding-right: calc(46px + var(--da-aeps-entry-inset, 0px)); padding-bottom: 2px; font-size: 7px; }
          .da-tx-filterbar { gap: 4px; padding: 4px 6px; }
          .da-tx-filter { min-height: 20px; padding: 0 6px; font-size: 8px; }
          .da-tx-date { width: 90px; height: 20px; font-size: 8px; }
          .da-tx-search { height: 21px; font-size: 8px; }
          .da-tx-item { min-height: 32px; padding: 4px 5px; }
          .da-tx-symbol { width: 23px; height: 23px; }
          .da-tx-description, .da-tx-value { font-size: 9px; }
          .da-tx-empty-icon { width: 38px; height: 38px; }
          .da-tx-empty strong { font-size: 10px; }
          .da-tx-empty small { font-size: 8px; }
          .da-reconciliation-card { display: grid; grid-template-columns: minmax(0, 2fr) minmax(90px, 1fr); grid-template-rows: 23px minmax(0, 1fr); }
          .da-reconcile-title { grid-column: 1 / -1; min-height: 23px !important; padding: 2px 6px !important; font-size: 9px !important; }
          .da-reconcile-values { grid-column: 1; grid-row: 2; min-height: 0; border-bottom: 0 !important; }
          .da-reconcile-values .da-reconcile-value { display: flex; min-width: 0; flex-direction: column; justify-content: center; padding: 1px 5px !important; }
          .da-reconcile-value p:first-child { font-size: 8px; }
          .da-reconcile-value p:nth-child(2) { font-size: 11px; }
          .da-reconcile-value p:last-child { display: none; }
          .da-difference { grid-column: 2; grid-row: 2; flex-direction: column; align-items: flex-start; justify-content: center; gap: 1px; padding: 1px 5px !important; border-top: 0 !important; border-left: 1px solid rgba(255,255,255,.1); }
          .da-difference-value { font-size: 12px; }
          .da-status { padding: 2px 5px; font-size: 8px; }
          .da-overview { padding: 4px 6px; }
          .da-overview { height: 100% !important; }
          .da-overview-title { margin-bottom: 2px; font-size: 9px; }
          .da-overview-title svg { width: 14px; height: 14px; }
          .da-overview-title small { font-size: 7px; }
          .da-overview-content { min-height: 0; height: calc(100% - 16px); grid-template-columns: minmax(0, 1fr) 46px minmax(84px, 112px); gap: 5px; }
          .da-overview-donut { width: 46px; height: 46px; flex-basis: 46px; padding: 4px; }
          .da-overview-donut-hole strong { font-size: 7px; }
          .da-overview-donut-hole small { font-size: 6px; }
          .da-overview-breakdown { gap: 3px; }
          .da-overview-item { grid-template-columns: 6px minmax(14px, 1fr) auto auto; gap: 3px; }
          .da-overview-dot { width: 6px; height: 6px; }
          .da-overview-item span:nth-child(2), .da-overview-item small, .da-overview-item strong { font-size: 7px; }
        }

        @media screen and (max-width: 920px) {
          .da-account-table-header { padding-right: calc(54px + var(--da-aeps-entry-inset, 0px)); font-size: 8px; }
        }

        @media screen and (min-width: 921px) {
          .da-sidebar { padding-top: 50px; }
          .da-side-brand { display: none; }
          .da-tx-date { display: none; }
          .da-toolbar { width: calc(100% + var(--da-sidebar-width)); margin-left: calc(-1 * var(--da-sidebar-width)); }
        }

        @media screen and (min-width: 921px) and (max-width: 1100px) {
          .da-page { --da-sidebar-width: 120px; }
          .da-sidebar { flex-basis: 120px; }
          .da-toolbar { padding-left: 10px; }
          .da-toolbar > .order-3 { margin-left: 24px; }
          .da-main { padding-left: 14px; }
          .da-toolbar > .flex.items-center:first-child > div { width: 28px; height: 28px; }
          .da-brand-title { font-size: 18px; }
          .da-date-value { font-size: 10px; }
          .da-tx-header-icon { width: 16px; height: 16px; flex-basis: 16px; }
        }

        /* Reference-matched overview and compact reconciliation summary. */
        @media screen and (min-width: 921px) {
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) clamp(104px, 13vh, 140px); }
          .da-panel.da-reconciliation-card {
            position: relative;
            border-color: rgba(236, 183, 88, .72) !important;
            background:
              radial-gradient(ellipse at 8% 0%, rgba(249, 174, 54, .28), transparent 56%),
              radial-gradient(ellipse at 100% 100%, rgba(194, 86, 42, .2), transparent 54%),
              linear-gradient(140deg, rgba(62, 43, 22, .98), rgba(38, 30, 28, .98) 56%, rgba(27, 27, 35, .99)) !important;
            box-shadow:
              inset 0 1px rgba(255, 240, 203, .16),
              0 0 20px rgba(232, 157, 45, .13),
              0 8px 22px rgba(0, 5, 15, .24) !important;
          }
          .da-panel.da-reconciliation-card::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: radial-gradient(ellipse at 92% 12%, rgba(255, 210, 122, .13), transparent 46%);
            pointer-events: none;
          }
          .da-reconciliation-card {
            display: block !important;
            min-height: 0;
            padding: 8px;
          }
          .da-reconcile-layout {
            position: relative;
            z-index: 1;
            display: grid;
            width: 100%;
            height: 100%;
            min-height: 0;
            grid-template-columns: minmax(0, 1.15fr) minmax(112px, .85fr);
            align-items: stretch;
            gap: 9px;
          }
          .da-system-block {
            position: relative;
            display: grid;
            min-width: 0;
            grid-template-columns: 34px minmax(0, 1fr);
            grid-template-rows: minmax(0, 1fr) auto;
            align-items: center;
            column-gap: 7px;
          }
          .da-system-icon {
            display: grid;
            width: 32px;
            height: 32px;
            grid-column: 1;
            grid-row: 1;
            place-items: center;
            border: 1px solid rgba(255, 226, 151, .7);
            border-radius: 8px;
            color: #372609;
            background: linear-gradient(145deg, #ffdf84, #e89b24);
            box-shadow: inset 0 1px rgba(255,255,255,.58), 0 0 15px rgba(239, 166, 46, .28);
          }
          .da-system-primary { min-width: 0; grid-column: 2; grid-row: 1; }
          .da-system-label { color: #ffe6ac; font-size: 10px; font-weight: 700; line-height: 1.1; }
          .da-system-amount { overflow: hidden; color: #fff4d9; font: 800 clamp(15px, 1.15vw, 20px)/1.12 ui-monospace, monospace; letter-spacing: -.35px; text-overflow: ellipsis; white-space: nowrap; }
          .da-system-caption { margin-top: 1px; color: #c9b58f; font-size: 8px; line-height: 1.1; }
          .da-reconciliation-illustration {
            position: absolute;
            top: 0;
            right: 1px;
            width: 30px;
            height: 24px;
            border: 0;
            opacity: .18;
            pointer-events: none;
            background: transparent;
          }
          .da-expected-line {
            display: flex;
            min-width: 0;
            grid-column: 1 / -1;
            grid-row: 2;
            align-items: baseline;
            gap: 5px;
            padding-top: 4px;
            border-top: 1px solid rgba(255, 226, 158, .2);
            white-space: nowrap;
          }
          .da-expected-line span { color: #dac79f; font-size: 8px; }
          .da-expected-line strong { color: #fff0ce; font: 700 11px/1 ui-monospace, monospace; }
          .da-expected-line small { overflow: hidden; color: #a8936e; font-size: 7px; text-overflow: ellipsis; }
          .da-difference-box {
            display: flex;
            min-width: 0;
            align-items: center;
            gap: 7px;
            padding: 6px 8px;
            border: 1px solid rgba(255, 203, 103, .44);
            border-radius: 11px;
            background: linear-gradient(135deg, rgba(238, 170, 48, .27), rgba(120, 70, 22, .43));
            box-shadow: inset 0 1px rgba(255,255,255,.13), 0 0 17px rgba(231, 164, 47, .11);
          }
          .da-difference-box.is-mismatch { border-color: rgba(255, 142, 117, .62); background: linear-gradient(135deg, rgba(237, 139, 51, .29), rgba(135, 48, 47, .5)); }
          .da-difference-box.is-balanced { border-color: rgba(78, 226, 166, .52); background: linear-gradient(135deg, rgba(35, 151, 111, .3), rgba(24, 77, 67, .48)); }
          .da-difference-icon { display: grid; width: 27px; height: 27px; flex: 0 0 27px; place-items: center; border-radius: 50%; color: #fff0d4; background: rgba(255, 244, 220, .16); }
          .da-difference-box.is-mismatch .da-difference-icon { color: #fff1e8; background: rgba(255, 91, 105, .48); }
          .da-difference-box.is-balanced .da-difference-icon { color: #d1ffec; background: rgba(34, 203, 142, .28); }
          .da-difference-copy { min-width: 0; }
          .da-difference-copy > p { color: #fff0d1; font-size: 9px; font-weight: 700; line-height: 1.1; }
          .da-difference-value { display: block; overflow: hidden; color: #ffcf68; font: 800 clamp(13px, 1.1vw, 19px)/1.2 ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 0 10px rgba(255, 190, 75, .24); }
          .da-difference-box.is-mismatch .da-difference-value { color: #ff8b9a; }
          .da-difference-box.is-balanced .da-difference-value { color: #70edbb; }
          .da-status { display: inline-flex; width: fit-content; margin-top: 3px; padding: 2px 5px; border: 1px solid currentColor; border-radius: 5px; font-size: 7px; font-weight: 800; line-height: 1; letter-spacing: .04em; }
          .da-overview { padding: 8px; }
          .da-overview-title { gap: 8px; margin-bottom: 5px; font-size: 12px; }
          .da-overview-title svg { width: 16px; height: 16px; }
          .da-overview-title small { font-size: 8px; }
          .da-overview-content { height: calc(100% - 22px); min-height: 0; grid-template-columns: minmax(0, 1fr) clamp(62px, 4.8vw, 78px) minmax(110px, .32fr); gap: clamp(7px, .8vw, 12px); }
          .da-overview-chart { border-radius: 0 0 5px 5px; }
          .da-overview-chart svg { overflow: hidden; }
          .da-overview-donut { width: clamp(62px, 4.8vw, 78px); height: clamp(62px, 4.8vw, 78px); flex-basis: clamp(62px, 4.8vw, 78px); padding: 6px; }
          .da-overview-donut-hole strong { font-size: clamp(9px, .68vw, 12px); }
          .da-overview-donut-hole small { font-size: 8px; }
          .da-overview-breakdown { gap: 7px; }
          .da-overview-item { grid-template-columns: 8px minmax(31px, 1fr) auto auto; gap: 5px; }
          .da-overview-dot { width: 8px; height: 8px; }
          .da-overview-item span:nth-child(2) { font-size: 9px; }
          .da-overview-item strong { font-size: 9px; }
          .da-overview-item small { font-size: 8px; }
        }
        @media screen and (min-width: 921px) and (max-height: 620px) {
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) 86px; }
          .da-reconciliation-card { padding: 5px; }
          .da-reconcile-layout { grid-template-columns: minmax(0, 1.12fr) minmax(108px, .88fr); gap: 6px; }
          .da-system-icon { width: 27px; height: 27px; }
          .da-system-icon svg { width: 19px; height: 19px; }
          .da-system-label { font-size: 8px; }
          .da-system-amount { font-size: clamp(13px, 1.15vw, 17px); }
          .da-system-caption { font-size: 7px; }
          .da-expected-line { gap: 4px; padding-top: 3px; }
          .da-expected-line span { font-size: 7px; }
          .da-expected-line strong { font-size: 9px; }
          .da-expected-line small { font-size: 6px; }
          .da-difference-box { gap: 5px; padding: 4px 5px; }
          .da-difference-icon { width: 22px; height: 22px; flex-basis: 22px; }
          .da-difference-icon svg { width: 15px; height: 15px; }
          .da-difference-copy > p { font-size: 8px; }
          .da-difference-value { font-size: clamp(12px, 1.05vw, 16px); }
          .da-status { margin-top: 2px; font-size: 6px; }
          .da-overview { padding: 4px 6px; }
          .da-overview-title { margin-bottom: 2px; }
          .da-overview-content { height: calc(100% - 18px); grid-template-columns: minmax(0, 1fr) 62px minmax(110px, .36fr); gap: 6px; }
          .da-overview-donut { width: 62px; height: 62px; flex-basis: 62px; padding: 5px; }
          .da-overview-breakdown { gap: 5px; }
          .da-overview-item { grid-template-columns: 7px minmax(26px, 1fr) auto auto; gap: 4px; }
          .da-overview-dot { width: 7px; height: 7px; }
          .da-overview-item span:nth-child(2), .da-overview-item strong { font-size: 8px; }
          .da-overview-item small { font-size: 7px; }
        }
        @media screen and (max-width: 920px) {
          .da-reconciliation-card { min-height: 128px; padding: 9px; }
          .da-reconcile-layout { display: grid; min-height: 108px; grid-template-columns: minmax(0, 1fr) minmax(130px, .82fr); gap: 10px; }
          .da-system-block { position: relative; display: grid; min-width: 0; grid-template-columns: 34px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; align-items: center; gap: 5px 7px; }
          .da-system-icon { display: grid; width: 32px; height: 32px; grid-column: 1; grid-row: 1; place-items: center; border: 1px solid rgba(255,226,151,.7); border-radius: 8px; color: #372609; background: linear-gradient(145deg,#ffdf84,#e89b24); }
          .da-system-primary { min-width: 0; grid-column: 2; grid-row: 1; }
          .da-system-label { color: #ffe6ac; font-size: 10px; font-weight: 700; }
          .da-system-amount { color: #fff4d9; font: 800 17px/1.1 ui-monospace,monospace; }
          .da-system-caption { color: #c9b58f; font-size: 8px; }
          .da-reconciliation-illustration { display: none; }
          .da-expected-line { display: flex; min-width: 0; grid-column: 1/-1; grid-row: 2; align-items: baseline; gap: 5px; padding-top: 5px; border-top: 1px solid rgba(255,226,158,.2); white-space: nowrap; }
          .da-expected-line span { color: #dac79f; font-size: 8px; }
          .da-expected-line strong { color: #fff0ce; font: 700 11px/1 ui-monospace,monospace; }
          .da-expected-line small { color: #a8936e; font-size: 7px; }
          .da-difference-box { display: flex; min-width: 0; align-items: center; gap: 7px; padding: 7px; border: 1px solid rgba(255,203,103,.44); border-radius: 11px; background: linear-gradient(135deg,rgba(238,170,48,.27),rgba(120,70,22,.43)); }
          .da-difference-box.is-mismatch { border-color: rgba(255,142,117,.62); background: linear-gradient(135deg,rgba(237,139,51,.29),rgba(135,48,47,.5)); }
          .da-difference-box.is-balanced { border-color: rgba(78,226,166,.52); background: linear-gradient(135deg,rgba(35,151,111,.3),rgba(24,77,67,.48)); }
          .da-difference-icon { display: grid; width: 27px; height: 27px; flex: 0 0 27px; place-items: center; border-radius: 50%; color: #fff1e8; background: rgba(255,91,105,.48); }
          .da-difference-box.is-balanced .da-difference-icon { color: #d1ffec; background: rgba(34,203,142,.28); }
          .da-difference-copy { min-width: 0; }
          .da-difference-copy > p { color: #fff0d1; font-size: 9px; font-weight: 700; }
          .da-difference-value { display: block; color: #ff8b9a; font: 800 15px/1.2 ui-monospace,monospace; }
          .da-difference-box.is-balanced .da-difference-value { color: #70edbb; }
          .da-status { display: inline-flex; width: fit-content; margin-top: 4px; padding: 2px 5px; border: 1px solid currentColor; border-radius: 5px; font-size: 7px; font-weight: 800; }
        }
        @media screen and (max-width: 620px) {
          .da-reconcile-layout { grid-template-columns: minmax(0, 1fr) minmax(116px, .82fr); gap: 7px; }
          .da-expected-line { flex-wrap: wrap; column-gap: 5px; row-gap: 2px; white-space: normal; }
          .da-expected-line small { flex-basis: 100%; }
          .da-system-amount { font-size: 15px; }
          .da-difference-box { gap: 5px; padding: 6px 5px; }
          .da-difference-icon { width: 23px; height: 23px; flex-basis: 23px; }
          .da-difference-icon svg { width: 15px; height: 15px; }
          .da-difference-value { font-size: 13px; }
          .da-overview-content { height: auto; grid-template-columns: minmax(0, 1fr) 62px; grid-template-rows: minmax(74px, auto) auto; gap: 8px; }
          .da-overview-chart { grid-column: 1; grid-row: 1; }
          .da-overview-donut { grid-column: 2; grid-row: 1; position: relative; z-index: 2; }
          .da-overview-breakdown { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
          .da-overview-item { grid-template-columns: 7px minmax(0, 1fr) auto auto; gap: 3px; }
          .da-overview-donut { width: 62px; height: 62px; flex-basis: 62px; }
        }
        /* Reference palette: gold for the system total, red for a mismatch, green when balanced. */
        .da-panel.da-reconciliation-card {
          position: relative;
          border-color: rgba(255, 220, 139, .92) !important;
          background:
            radial-gradient(ellipse at 8% 0%, rgba(255, 248, 205, .52), transparent 54%),
            radial-gradient(ellipse at 100% 100%, rgba(198, 105, 25, .25), transparent 52%),
            linear-gradient(125deg, #ffc64b, #efad37 57%, #d89131) !important;
          box-shadow: inset 0 1px rgba(255, 250, 220, .42), 0 0 20px rgba(232, 157, 45, .2), 0 8px 22px rgba(0, 5, 15, .24) !important;
        }
        .da-panel.da-reconciliation-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          background: radial-gradient(ellipse at 92% 12%, rgba(255, 248, 218, .28), transparent 48%);
          pointer-events: none;
        }
        .da-reconciliation-card > .da-reconcile-layout { position: relative; z-index: 1; }
        .da-reconciliation-card .da-system-icon {
          border-color: rgba(255, 255, 255, .72);
          color: #3b2609;
          background: linear-gradient(145deg, #ffe68a, #ffc24c);
          box-shadow: inset 0 1px rgba(255, 255, 255, .72), 0 2px 7px rgba(110, 61, 7, .16);
        }
        .da-reconciliation-card .da-system-label { color: #533404; }
        .da-reconciliation-card .da-system-amount { color: #211700; text-shadow: 0 1px rgba(255, 240, 192, .35); }
        .da-reconciliation-card .da-system-caption { color: #684814; }
        .da-reconciliation-card .da-expected-line { border-top-color: rgba(94, 61, 10, .25); }
        .da-reconciliation-card .da-expected-line span { color: #684910; }
        .da-reconciliation-card .da-expected-line strong { color: #2e200d; }
        .da-reconciliation-card .da-expected-line small { color: #65461c; }
        .da-reconciliation-card .da-difference-box {
          border-color: rgba(166, 102, 17, .48);
          background: linear-gradient(135deg, rgba(255, 215, 105, .94), rgba(247, 167, 48, .98));
          box-shadow: inset 0 1px rgba(255, 255, 255, .42), 0 2px 8px rgba(115, 62, 6, .14);
        }
        .da-reconciliation-card .da-difference-copy > p { color: #57370a; }
        .da-reconciliation-card .da-difference-box.is-mismatch {
          border-color: rgba(185, 81, 33, .58);
          background: linear-gradient(135deg, #ffc653, #ed992e);
        }
        .da-reconciliation-card .da-difference-box.is-mismatch .da-difference-icon {
          color: #fff7f5;
          background: #c83b47;
        }
        .da-reconciliation-card .da-difference-box.is-mismatch .da-difference-value { color: #b32635; text-shadow: 0 1px rgba(255, 233, 202, .42); }
        .da-reconciliation-card .da-difference-box.is-mismatch .da-difference-value.is-positive { color: #146b42; text-shadow: 0 1px rgba(255, 245, 214, .58); }
        .da-reconciliation-card .da-difference-box.is-mismatch .da-difference-value.is-negative { color: #b32635; }
        .da-reconciliation-card.is-mismatch .da-status { color: #9f2634; border-color: rgba(159, 38, 52, .48); }
        .da-reconciliation-card .da-difference-box.is-balanced {
          border-color: rgba(46, 133, 86, .55);
          background: linear-gradient(135deg, #d8f4c4, #a8dda0);
        }
        .da-reconciliation-card .da-difference-box.is-balanced .da-difference-copy > p { color: #1c5e3b; }
        .da-reconciliation-card .da-difference-box.is-balanced .da-difference-icon { color: #f3fff8; background: #218252; }
        .da-reconciliation-card .da-difference-box.is-balanced .da-difference-value { color: #146b42; text-shadow: none; }
        .da-reconciliation-card.is-balanced .da-status { color: #146b42; border-color: rgba(20, 107, 66, .46); }

        #bank-panel {
          --da-bank-art-width: clamp(76px, 28%, 150px);
          --da-bank-entry-inset: clamp(24px, 3vw, 36px);
        }
        #aeps-panel {
          --da-aeps-art-width: clamp(76px, 28%, 150px);
          --da-aeps-entry-inset: clamp(24px, 3vw, 36px);
        }
        #bank-panel .da-card-head,
        #bank-panel .da-card-body {
          position: relative;
          z-index: 1;
        }
        #bank-panel .da-card-head {
          background: linear-gradient(90deg, rgba(12, 34, 64, .72), rgba(9, 27, 52, .54)) !important;
        }
        #bank-panel::before {
          content: "";
          position: absolute;
          z-index: 0;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: .96;
          background: url("/assets/reconciliation/bank-illustration.webp") right center / contain no-repeat;
          -webkit-mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 18%, rgba(0, 0, 0, .45) 62%, #000 100%);
          mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 18%, rgba(0, 0, 0, .45) 62%, #000 100%);
        }
        #bank-panel .da-account-table-header {
          padding-right: calc(var(--da-bank-art-width) + var(--da-bank-entry-inset));
        }
        #bank-panel .da-bank-content .da-illustrated-rows {
          padding-right: calc(var(--da-bank-art-width) + var(--da-bank-entry-inset));
        }
        #aeps-panel .da-account-table-header,
        #aeps-panel .da-aeps-content .da-illustrated-rows {
          padding-right: calc(var(--da-aeps-art-width) + var(--da-aeps-entry-inset));
        }
        #bank-panel .da-account-input,
        #aeps-panel .da-account-input {
          color: #f8fbff !important;
          font-weight: 700;
          caret-color: #ffd166;
        }
        #bank-panel .da-account-input:not(:disabled),
        #aeps-panel .da-account-input:not(:disabled) {
          background: rgba(3, 13, 27, .94) !important;
        }
        #bank-panel .da-account-input:focus-visible {
          border-color: rgba(132, 201, 255, .96) !important;
          outline: 2px solid rgba(87, 166, 244, .42);
          outline-offset: 1px;
        }
        #aeps-panel .da-account-input:focus-visible {
          border-color: rgba(211, 171, 255, .96) !important;
          outline: 2px solid rgba(171, 118, 244, .42);
          outline-offset: 1px;
        }
        #bank-panel .da-account-row:nth-child(odd) { background: rgba(20, 56, 98, .32); }
        #bank-panel .da-account-row:hover {
          background: linear-gradient(90deg, rgba(32, 117, 205, .25), rgba(32, 117, 205, .06));
          box-shadow: inset 2px 0 rgba(93, 177, 255, .72), 0 0 15px rgba(55, 148, 255, .16);
        }
        #aeps-panel .da-card-head,
        #aeps-panel .da-card-body {
          position: relative;
          z-index: 1;
        }
        #aeps-panel .da-card-head {
          background: linear-gradient(90deg, rgba(39, 22, 72, .72), rgba(23, 18, 56, .54)) !important;
        }
        #aeps-panel::before {
          content: "";
          position: absolute;
          z-index: 0;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: .96;
          background: url("/assets/reconciliation/aeps-illustration.webp") right center / contain no-repeat;
          -webkit-mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 18%, rgba(0, 0, 0, .45) 62%, #000 100%);
          mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 18%, rgba(0, 0, 0, .45) 62%, #000 100%);
        }
        .da-reconciliation-card {
          position: relative;
          isolation: isolate;
        }
        .da-reconciliation-card > .da-reconcile-layout {
          position: relative;
          z-index: 1;
        }
        .da-reconciliation-card > .da-reconciliation-illustration {
          display: block;
          position: absolute;
          z-index: 0;
          inset: 0;
          width: 100%;
          height: 100%;
          flex: none;
          margin: 0;
          border: 0;
          border-radius: inherit;
          opacity: .28;
          overflow: hidden;
          pointer-events: none;
          background: transparent;
          -webkit-mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, .08) 25%, rgba(0, 0, 0, .56) 68%, #000 100%);
          mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, .08) 25%, rgba(0, 0, 0, .56) 68%, #000 100%);
        }
        .da-reconciliation-card > .da-reconciliation-illustration img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: right center;
        }
        .da-overview-title {
          position: relative;
          z-index: 2;
        }
        .da-overview-content {
          position: relative;
          z-index: 1;
          align-items: center;
        }
        .da-overview > .da-overview-artwork {
          position: absolute;
          z-index: 0;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          border-radius: inherit;
          background: transparent;
          opacity: .28;
          pointer-events: none;
          -webkit-mask-image: linear-gradient(90deg, rgba(0, 0, 0, .12) 0%, rgba(0, 0, 0, .22) 30%, rgba(0, 0, 0, .66) 64%, #000 100%);
          mask-image: linear-gradient(90deg, rgba(0, 0, 0, .12) 0%, rgba(0, 0, 0, .22) 30%, rgba(0, 0, 0, .66) 64%, #000 100%);
        }
        .da-overview > .da-overview-artwork img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: right center;
        }
        .da-overview-title { padding-right: 38px; }
        .da-overview-chart {
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }
        .da-chart-range-control {
          position: absolute;
          z-index: 3;
          top: 0;
          right: 0;
          flex-direction: column;
          align-items: stretch;
          gap: 2px;
          margin-left: 0;
        }
        .da-chart-range-button {
          min-width: 32px;
          padding: 3px 4px;
          font-size: 9px;
          text-align: center;
        }
        .da-overview-content {
          grid-template-columns: minmax(0, 1fr) max-content minmax(130px, 180px);
        }
        @media screen and (min-width: 621px) {
          .da-overview-chart {
            grid-column: 1 / 3;
            grid-row: 1;
          }
          .da-overview-donut {
            grid-column: 2;
            grid-row: 1;
            position: relative;
            z-index: 2;
          }
        }
        .da-overview-breakdown {
          padding-right: clamp(22px, 3vw, 38px);
        }
        .da-overview-donut {
          width: auto;
          height: calc(100% - 4px);
          aspect-ratio: 1;
          flex-basis: auto;
          justify-self: center;
          align-self: center;
        }
        .da-overview-item { column-gap: 3px; }
        .da-overview-item small {
          min-width: 28px;
          color: #b5c7dc;
          font-size: clamp(10px, .75vw, 12px);
          text-align: right;
        }
        @media screen and (max-width: 620px) {
          .da-overview-content {
            grid-template-columns: minmax(0, 1fr) clamp(104px, 26vw, 152px);
            grid-template-rows: clamp(104px, 26vw, 152px) auto;
          }
          .da-overview-breakdown { padding-right: 0; }
          .da-overview-donut {
            width: calc(100% - 4px);
            height: calc(100% - 4px);
            flex-basis: auto;
          }
          .da-overview-item small { min-width: 24px; font-size: 10px; }
        }
        .da-overview-donut-hole strong { font-size: clamp(10px, 1.4vh, 18px); }
        .da-overview-donut-hole small { font-size: clamp(8px, 1vh, 12px); }
        @media screen and (min-width: 621px) {
          .da-overview-donut-hole strong { font-size: clamp(14px, 1.6vh, 22px); }
          .da-overview-donut-hole small { font-size: clamp(10px, 1vh, 14px); }
          .da-overview-donut {
            transform: translateY(-14px);
            padding: 9px;
            box-shadow: none;
          }
        }
        @media screen and (min-width: 621px) and (min-height: 621px) {
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) clamp(160px, 20vh, 210px); }
        }
        @media screen and (min-width: 621px) and (max-height: 620px) {
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) 140px; }
        }
        .da-overview {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 0;
          padding: 9px 12px 10px;
          border-color: rgba(203, 164, 91, .48);
          background: linear-gradient(150deg, rgba(12, 28, 52, .98), rgba(7, 19, 37, .98));
        }
        .da-overview-title {
          min-height: 22px;
          margin: 0 0 7px;
          padding-right: 52px;
          gap: 7px;
          color: #f0f3f8;
          font-size: clamp(12px, 1.08vw, 15px);
          letter-spacing: .01em;
        }
        .da-overview-title > svg { width: 15px; height: 15px; flex: 0 0 auto; color: #f0bd53; }
        .da-overview-title small { color: #9caec3; font-size: clamp(8px, .76vw, 10px); }
        .da-chart-range-control {
          top: 0;
          right: 0;
          z-index: 4;
          gap: 3px;
          padding: 2px;
          border-color: rgba(199, 169, 108, .25);
          background: rgba(5, 13, 26, .68);
        }
        .da-chart-range-button {
          min-width: 42px;
          padding: 5px 7px;
          color: #a9b8ca;
          font-size: 10px;
        }
        .da-overview-content {
          width: 100%;
          height: 100%;
          min-height: 0;
          grid-template-columns: minmax(0, 1fr) clamp(112px, 13vw, 144px) minmax(128px, 170px);
          grid-template-rows: minmax(0, 1fr);
          align-items: stretch;
          gap: clamp(8px, 1.1vw, 14px);
        }
        .da-overview-chart {
          grid-column: 1;
          grid-row: 1;
          min-height: 0;
          height: 100%;
          overflow: visible;
          border: 0;
          background: transparent;
        }
        .da-overview-chart-layout {
          display: grid;
          width: 100%;
          height: 100%;
          min-height: 0;
          grid-template-columns: clamp(38px, 4.5vw, 52px) minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr) 18px;
          column-gap: 6px;
          row-gap: 3px;
        }
        .da-overview-chart-empty {
          grid-column: 1 / -1;
          grid-row: 1 / -1;
          color: #8c9fb6;
          font-size: 10px;
        }
        .da-chart-yaxis {
          display: flex;
          min-height: 0;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          padding: 3px 0 2px;
          color: #91a2b7;
          font: 600 clamp(8px, .72vw, 10px)/1 ui-monospace, monospace;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .da-chart-plot-surface {
          position: relative;
          grid-column: 2;
          grid-row: 1;
          min-width: 0;
          min-height: 0;
          overflow: visible;
        }
        .da-chart-plot-surface > svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .da-overview-grid line {
          vector-effect: non-scaling-stroke;
          stroke: rgba(144, 164, 190, .15);
          stroke-width: .7;
          stroke-dasharray: 2 4;
        }
        .da-overview-grid line:first-child {
          stroke: rgba(202, 170, 108, .27);
          stroke-dasharray: none;
        }
        .da-overview-chart .da-overview-line {
          filter: drop-shadow(0 0 3px rgba(245, 188, 80, .72));
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .da-chart-hitpoint {
          position: absolute;
          z-index: 2;
          display: grid;
          width: 18px;
          height: 18px;
          padding: 0;
          place-items: center;
          transform: translate(-50%, -50%);
          border: 0;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }
        .da-chart-hitpoint > span {
          width: 6px;
          height: 6px;
          border: 1px solid #fff0c1;
          border-radius: 50%;
          background: #f8c75f;
          box-shadow: 0 0 0 3px rgba(245, 188, 80, .14), 0 0 9px rgba(245, 188, 80, .85);
          opacity: 0;
          transition: opacity .12s ease;
        }
        .da-chart-hitpoint.has-marker > span,
        .da-chart-hitpoint:hover > span,
        .da-chart-hitpoint:focus-visible > span { opacity: 1; }
        .da-chart-hitpoint:focus-visible { outline: 2px solid #fff0c1; outline-offset: 0; }
        .da-chart-xaxis {
          display: flex;
          min-width: 0;
          grid-column: 2;
          grid-row: 2;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0;
          color: #899bb1;
          font: 500 clamp(8px, .7vw, 10px)/1.2 "DM Sans", sans-serif;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          pointer-events: none;
        }
        .da-chart-xaxis span { flex: 0 1 auto; text-align: center; }
        .da-chart-xaxis .is-first { text-align: left; }
        .da-chart-xaxis .is-last { text-align: right; }
        .da-overview-tooltip { top: 3px; right: 4px; }
        .da-overview-breakdown {
          grid-column: 3;
          grid-row: 1;
          justify-content: center;
          gap: 10px;
          min-width: 0;
          padding: 44px clamp(38px, 5vw, 52px) 0 0;
        }
        .da-overview-item {
          grid-template-columns: 8px minmax(24px, 1fr) auto auto;
          gap: 5px;
          align-items: center;
        }
        .da-overview-dot { width: 8px; height: 8px; }
        .da-overview-item span:nth-child(2) { color: #a8b7c9; font-size: clamp(10px, .82vw, 12px); }
        .da-overview-item strong { color: #eef2f7; font-size: clamp(10px, .82vw, 12px); }
        .da-overview-item small { min-width: 28px; color: #aab9cb; font-size: clamp(9px, .72vw, 11px); }
        .da-overview-donut {
          grid-column: 2;
          grid-row: 1;
          position: relative;
          z-index: 2;
          width: auto;
          height: min(100%, clamp(112px, 13vw, 144px));
          flex-basis: auto;
          justify-self: center;
          align-self: center;
          padding: 9px;
          transform: none;
          box-shadow: 0 0 24px rgba(67, 134, 221, .17);
        }
        .da-overview-donut-hole strong { font-size: clamp(12px, 1.15vw, 16px); }
        .da-overview-donut-hole small { font-size: clamp(9px, .8vw, 11px); }
        @media screen and (min-width: 621px) and (min-height: 621px) {
          .da-dashboard-grid { grid-template-rows: minmax(0, 1fr) clamp(194px, 24vh, 224px); }
        }
        @media screen and (min-width: 621px) and (max-height: 620px) {
          .da-overview { padding: 6px 9px 7px; }
          .da-overview-title { min-height: 19px; margin-bottom: 4px; font-size: 11px; }
          .da-overview-title small { font-size: 8px; }
          .da-chart-range-control { flex-direction: row; gap: 2px; }
          .da-chart-range-button { min-width: 33px; padding: 3px 4px; font-size: 8px; }
          .da-overview-content { gap: 7px; }
          .da-chart-yaxis { font-size: 8px; }
          .da-chart-xaxis { font-size: 8px; }
          .da-overview-breakdown { gap: 6px; padding: 0 0 0 0; }
          .da-overview-item { grid-template-columns: 7px minmax(18px, 1fr) auto auto; gap: 3px; }
          .da-overview-item span:nth-child(2),
          .da-overview-item strong { font-size: 9px; }
          .da-overview-item small { min-width: 22px; font-size: 8px; }
          .da-overview-donut { height: min(100%, 96px); padding: 6px; }
          .da-overview-donut-hole strong { font-size: 11px; }
          .da-overview-donut-hole small { font-size: 8px; }
        }
        @media screen and (max-width: 620px) {
          .da-overview { padding: 8px 9px 9px; }
          .da-overview-title { margin-bottom: 6px; padding-right: 0; font-size: 12px; }
          .da-overview-title small { display: none; }
          .da-chart-range-control { flex-direction: row; gap: 1px; }
          .da-chart-range-button { min-width: 31px; padding: 4px 3px; font-size: 8px; }
          .da-overview-content {
            height: auto;
            grid-template-columns: minmax(0, 1fr) clamp(86px, 24vw, 116px);
            grid-template-rows: minmax(110px, auto) auto;
            gap: 8px 9px;
          }
          .da-overview-chart { grid-column: 1; grid-row: 1; min-height: 110px; }
          .da-overview-chart-layout { grid-template-columns: 37px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) 17px; column-gap: 4px; }
          .da-chart-yaxis { font-size: 8px; }
          .da-chart-xaxis { font-size: 7px; }
          .da-overview-donut {
            grid-column: 2;
            grid-row: 1;
            width: auto;
            height: min(100%, clamp(86px, 24vw, 116px));
            padding: 6px;
          }
          .da-overview-donut-hole strong { font-size: 11px; }
          .da-overview-donut-hole small { font-size: 8px; }
          .da-overview-breakdown {
            grid-column: 1 / -1;
            grid-row: 2;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 5px;
            padding: 0;
          }
          .da-overview-item { grid-template-columns: 6px minmax(0, 1fr) auto; gap: 4px; }
          .da-overview-item span:nth-child(2) { font-size: 9px; }
          .da-overview-item strong { font-size: 9px; }
          .da-overview-item small { display: none; }
        }
        @media screen and (min-width: 621px) and (max-width: 920px) {
          .da-column:nth-child(2) { min-height: 430px; }
          .da-column:nth-child(2) > #bank-panel { flex: 0 0 auto; min-height: 230px; }
          .da-column:nth-child(2) > #aeps-panel { flex: 0 0 auto; min-height: 190px; }
        }
        @media screen and (min-width: 921px) and (max-width: 1100px) {
          .da-main { overflow-x: hidden; overflow-y: auto; }
          .da-dashboard-grid {
            flex: 0 0 auto;
            grid-template-rows: minmax(440px, auto) clamp(194px, 24vh, 224px);
          }
          .da-column { overflow: visible; }
          .da-column:nth-child(2) { min-height: 440px; }
          .da-column:nth-child(2) > #bank-panel { flex: 0 0 auto; min-height: 230px; }
          .da-column:nth-child(2) > #aeps-panel { flex: 0 0 auto; min-height: 190px; }
        }
        @media screen and (min-width: 921px) and (min-height: 621px) {
          .da-main { overflow-x: hidden; overflow-y: auto; }
          .da-dashboard-grid {
            flex: 0 0 auto;
            grid-template-rows: minmax(441px, auto) clamp(194px, 24vh, 224px);
          }
          .da-column { overflow: visible; }
          .da-column:nth-child(2) { min-height: 441px; }
          .da-column:nth-child(2) > #bank-panel { flex: 0 0 auto; min-height: 240px; }
          .da-column:nth-child(2) > #aeps-panel { flex: 0 0 auto; min-height: 190px; }
        }
      `}</style>

      <aside className="da-sidebar" aria-label="Daily reconciliation navigation">
        <div className="da-side-brand">
          <span className="da-side-brand-mark"><Scale size={16} /></span>
        </div>
        <nav className="da-nav">
          {[
            { label: "Dashboard", icon: <Home size={14} />, target: "top" },
            { label: "Cash Counting", icon: <Banknote size={14} />, target: "cash-panel" },
            { label: "Bank Balances", icon: <Landmark size={14} />, target: "bank-panel" },
            { label: "AEPS Wallet", icon: <Wallet size={14} />, target: "aeps-panel" },
            { label: "Transactions", icon: <ArrowUpRight size={14} />, target: "transactions-panel" },
            { label: "Reports", icon: <FileText size={14} />, target: "reports" },
            { label: "Settings", icon: <Settings size={14} />, target: "settings" },
          ].map((item) => (
            <button
              key={item.target}
              type="button"
              className={`da-nav-item ${activeSection === item.target ? "active" : ""}`}
              title={item.label}
              aria-current={activeSection === item.target ? "page" : undefined}
              aria-haspopup={item.target === "settings" ? "dialog" : undefined}
              onClick={() => {
                setActiveSection(item.target);
                if (item.target === "reports") {
                  navigate("/dailyamount/history");
                  return;
                }
                if (item.target === "settings") {
                  setShowSettingsModal(true);
                  return;
                }
                document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
      <div className="da-side-art">
          <Artwork src="/assets/reconciliation/sidebar-finance.webp" label="Financial illustration" loading="eager" />
        </div>
        <div className="da-side-foot">Daily closeout<br />Stay organized</div>
      </aside>
      <div className="da-app-main">
      {/* ── Header and daily controls ─────────────────────────────────────── */}
      <header
        className="da-toolbar relative z-10 shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 lg:px-4 py-2 sm:py-0 min-h-[54px]"
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-300" style={{ background: "linear-gradient(145deg, rgba(250,204,21,0.2), rgba(59,130,246,0.16))", border: "1px solid rgba(250,204,21,0.18)" }}>
          <BarChart3 size={17} />
          </div>
          <span className="da-brand-title">Daily <em>Reconciliation</em></span>
        </div>

        <div className="order-3 sm:order-none flex items-center justify-center gap-1 rounded-lg px-1 py-1 min-w-0 w-full sm:w-auto" style={{ background: "rgba(15,29,57,0.82)", border: "1px solid rgba(148,163,184,0.16)" }}>
          <CalendarDays size={14} className="shrink-0 text-slate-400 hidden sm:block" />
          <div className="da-date-value">
            <span aria-hidden="true">{date.split("-").reverse().join("-")}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setEditUnlocked(false); setTxSearch(""); }}
              aria-label="Selected date"
              className="da-date-input"
              style={{ colorScheme: "dark" }}
              data-testid="input-date"
            />
          </div>
          <button data-testid="button-prev-date" aria-label="Previous day" onClick={() => changeDate(-1)} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button data-testid="button-next-date" aria-label="Next day" onClick={() => changeDate(1)} disabled={date >= todayStr()} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
        {date === todayStr() && (
          <span className="hidden lg:inline-flex text-[10px] text-amber-300 font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(250,204,21,0.1)" }}>Today</span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <div className="hidden xl:flex items-center min-w-[72px] justify-end mr-1">
            {saveStatus === "saving" && <span className="text-[11px] text-amber-300 flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Saving</span>}
            {saveStatus === "saved" && <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle size={11} />Saved</span>}
            {saveStatus === "idle" && lastSaved && <span className="text-[11px] text-slate-500">{lastSaved.toLocaleTimeString()}</span>}
          </div>
          <button data-testid="button-refresh" onClick={refreshData} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors" title="Refresh data">
            <RefreshCw size={13} /><span className="hidden md:inline">Refresh</span>
          </button>
          <button data-testid="button-print" onClick={() => window.print()} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors" title="Print reconciliation">
            <Printer size={13} /><span className="hidden md:inline">Print</span>
          </button>
          <button data-testid="button-export" onClick={exportCsv} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors" title="Export CSV">
            <Download size={13} /><span className="hidden md:inline">Export</span>
          </button>
          <button data-testid="button-history" onClick={() => navigate("/dailyamount/history")} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="History">
            <History size={14} />
          </button>
          {!editUnlocked ? (
            <button data-testid="button-unlock-edit" onClick={() => setShowEditModal(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all text-slate-300 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <Lock size={12} /><span className="hidden sm:inline">Edit</span>
            </button>
          ) : (
            <button data-testid="button-lock-edit" onClick={() => setEditUnlocked(false)} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-emerald-400 transition-all" style={{ border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.07)" }}>
              <Unlock size={12} /><span className="hidden sm:inline">Editing</span>
            </button>
          )}
          <button data-testid="button-logout" onClick={handleLogout} className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ── Dashboard Body ────────────────────────────────────────────────── */}
      <div className="da-main" id="top">
        <div className="grid">
          <MetricCard label="Opening Balance" accent="#39d7aa" icon={<WalletCards size={17} />} testId="metric-opening-balance" sub={autoFilledBalance ? "Carry forward" : "Carry-in"} sparklineSeries={openingHistory} sparklineStartDate={historyStartDate} sparklineEndDate={historyEndDate}>
            {editUnlocked ? (
              <div className="relative w-full">
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-amber-300/70 text-[10px]">₹</span>
                <AmountInput
                  data-testid="input-opening-balance"
                  value={fields.openingBalance}
                  onChange={(value) => updateField("openingBalance", value)}
                  placeholder="0"
                  className="da-opening-metric-input w-full bg-slate-950/40 text-amber-200 text-right rounded px-1 py-0.5 pl-4 text-[11px] font-bold outline-none focus:ring-1 focus:ring-emerald-400"
                  style={{ border: "1px solid rgba(109,145,179,0.28)" }}
                />
              </div>
            ) : (
              <span className="text-amber-300">₹{fmt(fields.openingBalance)}</span>
            )}
          </MetricCard>
          <MetricCard label="Cash Total" accent="#1687ff" icon={<Banknote size={17} />} testId="metric-cash-total" sub="Notes + coins" sparklineSeries={cashHistory} sparklineStartDate={historyStartDate} sparklineEndDate={historyEndDate}>
            <span className="text-white">₹{fmt(cashTotal)}</span>
          </MetricCard>
          <MetricCard label="Bank Total" accent="#8b5cf6" icon={<Landmark size={17} />} testId="metric-bank-total" sub="6 accounts" sparklineSeries={bankHistory} sparklineStartDate={historyStartDate} sparklineEndDate={historyEndDate}>
            <span className="text-white">₹{fmt(bankTotal)}</span>
          </MetricCard>
          <MetricCard label="AEPS Wallet" accent="#ff9f1c" icon={<Wallet size={17} />} testId="metric-aeps-total" sub="4 sources" sparklineSeries={aepsHistory} sparklineStartDate={historyStartDate} sparklineEndDate={historyEndDate}>
            <span className="text-white">₹{fmt(aepsTotal)}</span>
          </MetricCard>
          <MetricCard label="Difference" accent={isBalanced ? "#34d399" : "#fb7185"} icon={<Scale size={17} />} testId="metric-difference" sub={isBalanced ? "In balance" : "Needs review"} className={isBalanced ? "is-balanced" : ""} sparklineSeries={differenceHistory} sparklineStartDate={historyStartDate} sparklineEndDate={historyEndDate}>
            <span className={isBalanced ? "text-emerald-300" : "text-rose-300"}>{difference >= 0 ? "+" : "−"}₹{fmt(Math.abs(difference))}</span>
          </MetricCard>
        </div>

        <div className="da-dashboard-grid">

          {/* ══ COLUMN 1 — Cash Counting ══════════════════════════════════ */}
          <div className="da-column">
            <Card
              title="Cash Counting"
              subtitle="Enter denomination counts for today"
              accent="#10b981"
              icon={<Banknote size={15} />}
              className="h-full"
              id="cash-panel"
              action={editUnlocked ? (
                <button type="button" className="da-clear-cash da-print-hidden" onClick={clearCashCounts} title="Clear cash denominations and coins">
                  <Trash2 size={11} /> Clear All
                </button>
              ) : null}
            >
              <div className="space-y-0">
                <div className="da-cash-table-header grid grid-cols-[3.5rem_8.25rem_minmax(0,1fr)] gap-2 px-2 pb-2 text-[9px] text-slate-500 border-b border-slate-700/40">
                  <span>Denomination</span>
                  <span className="text-center">Count</span>
                  <span className="text-right">Amount</span>
                </div>
                {([500, 200, 100, 50, 20, 10] as const).map((d) => {
                  const key = `notes${d}` as keyof typeof fields;
                  return (
                    <DenomRow
                      key={d}
                      denom={d}
                      count={fields[key]}
                      onChange={(v) => updateField(key, v)}
                      disabled={!editUnlocked}
                    />
                  );
                })}

                {/* Coins */}
                <div className="da-denom-row da-coins-row flex items-center gap-2 py-1 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-14 shrink-0 text-center">
                    <span className="da-denom-badge da-coins-badge text-xs font-bold rounded px-1.5 py-0.5">Coins</span>
                  </div>
                  <div className="flex-1" />
                  <div className="relative shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                    <AmountInput
                      data-testid="input-coins"
                      value={fields.coins}
                      onChange={(value) => updateField("coins", value)}
                      disabled={!editUnlocked}
                      placeholder="0"
                      className="da-count-input w-20 bg-slate-950/40 text-white text-right rounded-md px-2 pl-5 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-85"
                      style={{ border: "1px solid #2a4763" }}
                    />
                  </div>
                  <span className="text-slate-600 text-xs shrink-0">=</span>
                  <span className="flex-1 text-right text-yellow-400 text-xs font-mono">₹{fmt(fields.coins)}</span>
                </div>
              </div>

              {/* Cash Total */}
              <div className="da-cash-total mt-auto pt-2">
                <div className="da-cash-total-band rounded-lg p-2.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-emerald-400">Cash Total</span>
                    <Artwork src="/assets/reconciliation/cash-illustration.webp" label="" decorative className="da-artwork-small da-cash-illustration" loading="eager" />
                    <span className="text-base font-bold font-mono text-emerald-400">₹{fmt(cashTotal)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ══ COLUMN 2 — Banks / AEPS / System Balance ══════════════════ */}
          <div className="da-column">
            {/* Bank Balances */}
            <Card
              title="Bank Balances"
              accent="#f4c84c"
              icon={<Landmark size={15} />}
              className="shrink-0"
              id="bank-panel"
              action={<div className="da-card-action-total da-total-badge"><span>Total:</span><strong>₹{fmt(bankTotal)}</strong><ChevronRight size={14} aria-hidden="true" /></div>}
            >
              <div className="da-account-table-header"><span>Account Name</span><span>Balance</span></div>
              <div className="da-illustrated-content da-bank-content">
                <div className="da-illustrated-rows space-y-0">
                {[
                  { key: "bobSaving", label: "BOB Saving", marker: "BS", markerColor: "#fb923c" },
                  { key: "bobCurrent", label: "BOB Current", marker: "BC", markerColor: "#fb7185" },
                  { key: "hdfc", label: "HDFC", marker: "H", markerColor: "#fbbf24" },
                  { key: "kotak", label: "Kotak", marker: "K", markerColor: "#34d399" },
                  { key: "au", label: "AU", marker: "A", markerColor: "#fb7185" },
                  { key: "sbi", label: "SBI", marker: "S", markerColor: "#60a5fa" },
                ].map(({ key, label, marker, markerColor }) => (
                  <AmountRow
                    key={key}
                    label={label}
                    fieldKey={key}
                    value={fields[key as keyof typeof fields]}
                    onChange={(v) => updateField(key as keyof typeof fields, v)}
                    disabled={!editUnlocked}
                    accentColor="focus:ring-blue-500"
                    marker={marker}
                    markerColor={markerColor}
                  />
                ))}
                </div>
              </div>
            </Card>

            {/* AEPS Wallet */}
            <Card
              title="AEPS Wallet"
              accent="#a855f7"
              icon={<Wallet size={15} />}
              className="shrink-0"
              id="aeps-panel"
              action={<div className="da-card-action-total da-total-badge da-aeps-total-badge"><span>Total</span><strong>₹{fmt(aepsTotal)}</strong></div>}
            >
              <div className="da-account-table-header"><span>Wallet / Source</span><span>Balance</span></div>
              <div className="da-illustrated-content da-aeps-content">
                <div className="da-illustrated-rows space-y-0">
                {[
                  { key: "aepsBob", label: "BOB", marker: "B", markerColor: "#fb923c" },
                  { key: "aepsFino", label: "Fino", marker: "F", markerColor: "#60a5fa" },
                  { key: "aepsPayworld", label: "Payworld", marker: "P", markerColor: "#34d399" },
                  { key: "aepsDigipay", label: "Digipay", marker: "D", markerColor: "#fbbf24" },
                ].map(({ key, label, marker, markerColor }) => (
                  <AmountRow
                    key={key}
                    label={label}
                    fieldKey={key}
                    value={fields[key as keyof typeof fields]}
                    onChange={(v) => updateField(key as keyof typeof fields, v)}
                    disabled={!editUnlocked}
                    accentColor="focus:ring-purple-500"
                    marker={marker}
                    markerColor={markerColor}
                  />
                ))}
                </div>
              </div>
            </Card>

          </div>

          {/* ══ COLUMN 3 — Transactions + Reconciliation ══════════════════ */}
          <div className="da-column">

            {/* Transactions card */}
            <div id="transactions-panel" className="da-panel da-transactions-panel rounded-xl overflow-hidden flex flex-col min-h-0" style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 8px 22px rgba(1,9,20,0.13)" }}>
              <div className="da-tx-header px-3 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
                <span className="da-tx-header-icon"><History size={13} /></span>
                <h3 className="text-[11px] font-bold text-white tracking-wide flex-1">Transactions</h3>
                {txArray.length > 0 && (
                  <div className="da-tx-totals da-print-hidden hidden xl:flex items-center gap-1 text-[9px]" title={`Income ₹${fmt(incomeTotal)} · expenses ₹${fmt(expenseTotal)}`}>
                    <span className="text-emerald-400 font-mono">+₹{fmt(incomeTotal)}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-rose-400 font-mono">−₹{fmt(expenseTotal)}</span>
                  </div>
                )}
                <button
                  type="button"
                  data-testid="button-view-all-transactions"
                  className="da-view-all da-print-hidden"
                  onClick={() => navigate("/dailyamount/history")}
                  title="View transaction history"
                >
                  View All
                </button>
                {editUnlocked && (
                  <button
                    type="button"
                    className="da-add-open da-print-hidden flex items-center gap-1 px-2 py-1 rounded-md text-[10px]"
                    onClick={() => document.getElementById("da-new-tx-amount")?.focus()}
                    title="Add a transaction"
                  >
                    <Plus size={12} /> Add
                  </button>
                )}
              </div>

              <div className="da-tx-filterbar da-print-hidden" aria-label="Filter transactions by type">
                {([
                  ["all", "All"],
                  ["income", "Credit"],
                  ["expense", "Debit"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`da-tx-filter ${txFilter === value ? "active" : ""}`}
                    aria-pressed={txFilter === value}
                    data-testid={`button-tx-filter-${value}`}
                    onClick={() => setTxFilter(value)}
                  >
                    {value === "income" && <span aria-hidden="true" style={{ color: "#41d3a1" }}>●</span>}
                    {value === "expense" && <span aria-hidden="true" style={{ color: "#fa7584" }}>●</span>}
                    {label}
                  </button>
                ))}
                <div className="da-tx-search-wrap da-print-hidden relative flex-1 min-w-[88px] max-w-[150px]">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    data-testid="input-tx-search"
                    type="search"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search"
                    className="da-tx-search w-full bg-black/20 text-white rounded-md pl-7 pr-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-slate-600"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
                <input
                  className="da-tx-date da-print-hidden"
                  type="date"
                  value={date}
                  aria-label="Transaction date"
                  data-testid="input-tx-date"
                  onChange={(e) => { setDate(e.target.value); setEditUnlocked(false); setTxSearch(""); }}
                />
              </div>

              <div className="flex flex-col flex-1 min-h-0 p-2.5 gap-2">
                {/* Add Transaction Form */}
                {editUnlocked ? (
                  <div className="da-tx-form da-print-hidden shrink-0 rounded-lg p-2 space-y-1.5" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-1.5">
                      <button
                        data-testid="button-type-income"
                        onClick={() => setTxType("income")}
                        className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={{ background: txType === "income" ? "rgba(16,185,129,0.2)" : "transparent", border: `1px solid ${txType === "income" ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`, color: txType === "income" ? "#10b981" : "#94a3b8" }}
                      >
                        + Income
                      </button>
                      <button
                        data-testid="button-type-expense"
                        onClick={() => setTxType("expense")}
                        className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={{ background: txType === "expense" ? "rgba(239,68,68,0.18)" : "transparent", border: `1px solid ${txType === "expense" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, color: txType === "expense" ? "#ef4444" : "#94a3b8" }}
                      >
                        − Expense
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                        <AmountInput
                          id="da-new-tx-amount"
                          data-testid="input-tx-amount"
                          value={pf(txAmount)}
                          onChange={(value) => setTxAmount(value === 0 ? "" : String(value))}
                          onKeyDown={(e) => e.key === "Enter" && txAmount && addTxMutation.mutate()}
                          placeholder="Amount"
                          className="w-full bg-transparent text-white rounded-md px-2 pl-6 py-1.5 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      </div>
                      <input
                        data-testid="input-tx-note"
                        type="text"
                        value={txNote}
                        onChange={(e) => setTxNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && txAmount && addTxMutation.mutate()}
                        placeholder="Note"
                        className="flex-1 bg-transparent text-white rounded-md px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      <button
                        data-testid="button-add-tx"
                        onClick={() => addTxMutation.mutate()}
                        disabled={!txAmount || addTxMutation.isPending}
                        className="p-1.5 rounded-md transition-all disabled:opacity-40 shrink-0"
                        style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.35)", color: "#f97316" }}
                      >
                        {addTxMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Transaction List — scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                  {txLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 size={18} className="animate-spin text-slate-600" />
                    </div>
                  ) : txArray.length === 0 ? (
                    <div className="da-tx-empty" role="status">
                      <span className="da-tx-empty-icon"><History size={20} /></span>
                      <strong>No transactions for this date</strong>
                      <small>Transactions for the selected day will appear here.</small>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="da-tx-empty" role="status">
                      <span className="da-tx-empty-icon"><Search size={18} /></span>
                      <strong>No matching transactions</strong>
                      <small>Try a different search or filter.</small>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredTransactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          data-testid={`tx-item-${tx.id}`}
                          data-type={tx.type}
                          className="da-tx-item flex items-center gap-2 py-2 px-2.5 rounded-lg border-b border-slate-700/30"
                          style={{ background: "rgba(8,26,44,0.5)" }}
                        >
                          <div className={`da-tx-symbol w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${tx.type === "income" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-rose-300 bg-rose-500/10 border-rose-500/20"}`}>
                            {tx.type === "income" ? <Plus size={13} /> : <Minus size={13} />}
                          </div>
                          <div className="da-tx-meta flex-1 min-w-0">
                            <p className="da-tx-description text-white text-xs font-medium truncate">{tx.note || (tx.type === "income" ? "Income" : "Expense")}</p>
                            <p className="da-tx-time text-slate-600 text-xs">{new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <span className={`da-tx-value text-xs font-bold font-mono shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                            {tx.type === "income" ? "+" : "−"}₹{fmt(pf(tx.amount))}
                          </span>
                          <ChevronRight className="da-tx-arrow shrink-0" size={15} aria-hidden="true" />
                          {editUnlocked && (
                            <button
                              data-testid={`button-delete-tx-${tx.id}`}
                              onClick={() => deleteTxMutation.mutate(tx.id)}
                              className="da-print-hidden p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reconciliation Summary */}
            <div className={`da-panel da-reconciliation-card shrink-0 rounded-xl overflow-hidden ${isBalanced ? "is-balanced" : "is-mismatch"}`} data-balanced={isBalanced} style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025)" }}>
              <Artwork src="/assets/reconciliation/reconciliation-illustration.webp" label="" decorative className="da-reconciliation-illustration" />
              <div className="da-reconcile-layout">
                <div className="da-system-block">
                  <div className="da-system-icon" aria-hidden="true"><Calculator size={22} /></div>
                  <div className="da-system-primary">
                    <p className="da-system-label">System Balance</p>
                    <p className="da-system-amount">₹{fmt(systemBalance)}</p>
                    <p className="da-system-caption">Cash + Banks + AEPS</p>
                  </div>
                  <div className="da-expected-line">
                    <span>Expected Balance</span>
                    <strong>₹{fmt(expectedBalance)}</strong>
                    <small>Opening + Today&apos;s Transactions</small>
                  </div>
                </div>
                <div className={`da-difference-box ${isBalanced ? "is-balanced" : "is-mismatch"}`}>
                  <div className="da-difference-icon" aria-hidden="true">
                    {isBalanced ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="da-difference-copy">
                    <p>Difference</p>
                    <strong className={`da-difference-value ${isBalanced ? "is-balanced" : difference > 0 ? "is-positive" : "is-negative"}`}>
                      {difference >= 0 ? `+₹${fmt(difference)}` : `−₹${fmt(Math.abs(difference))}`}
                    </strong>
                    <span className={`da-status ${isBalanced ? "text-emerald-400" : "text-red-400"}`}>
                      {isBalanced ? "BALANCED" : "MISMATCH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-overview" role="group" aria-label="Balance overview">
            <Artwork src="/assets/reconciliation/balance-overview.webp" label="" decorative className="da-overview-artwork" />
            <div className="da-overview-title">
              <BarChart3 size={12} />
              <span>Balance Overview</span>
              <small>Cash + Banks + AEPS</small>
              <div className="da-chart-range-control" role="group" aria-label="Balance chart date range">
                {([7, 30, 90] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={`da-chart-range-button${historyRangeDays === days ? " is-active" : ""}`}
                    aria-label={`Show ${days} days`}
                    aria-pressed={historyRangeDays === days}
                    onClick={() => setHistoryRangeDays(days)}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
            <div className="da-overview-content">
              <BalanceOverviewChart
                points={chartHistoryPoints}
                startDate={historyStartDate}
                endDate={historyEndDate}
                hasAnyHistory={allHistoryPoints.length > 0}
                historyLoading={dailyHistoryLoading}
                historyError={dailyHistoryError}
              />
              <div
                className="da-overview-donut"
                role="img"
                aria-label={`Current balance mix: cash ${cashShare.toFixed(1)}%, banks ${bankShare.toFixed(1)}%, AEPS ${aepsShare.toFixed(1)}%`}
                title={`System balance ₹${fmt(systemBalance)}`}
                style={{
                  background: systemBalance > 0
                    ? `conic-gradient(#32c89b 0% ${cashShare}%, #3d9cff ${cashShare}% ${cashShare + bankShare}%, #a67aff ${cashShare + bankShare}% 100%)`
                    : "conic-gradient(#38506b 0% 100%)",
                }}
              >
                <div className="da-overview-donut-hole">
                  <strong>{systemBalance ? `₹${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(systemBalance)}` : "₹0"}</strong>
                  <small>Total</small>
                </div>
              </div>
              <div className="da-overview-breakdown">
                <div className="da-overview-item">
                  <span className="da-overview-dot" style={{ color: "#32c89b", background: "#32c89b" }} />
                  <span>Cash</span><strong>₹{fmt(cashTotal)}</strong><small>{cashShare.toFixed(0)}%</small>
                </div>
                <div className="da-overview-item">
                  <span className="da-overview-dot" style={{ color: "#3d9cff", background: "#3d9cff" }} />
                  <span>Banks</span><strong>₹{fmt(bankTotal)}</strong><small>{bankShare.toFixed(0)}%</small>
                </div>
                <div className="da-overview-item">
                  <span className="da-overview-dot" style={{ color: "#a67aff", background: "#a67aff" }} />
                  <span>AEPS</span><strong>₹{fmt(aepsTotal)}</strong><small>{aepsShare.toFixed(0)}%</small>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit Unlock Modal ─────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="da-print-hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="w-80 rounded-2xl p-6 space-y-4" style={{ background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-center">
              <Unlock size={24} className="text-yellow-400 mx-auto mb-2" />
              <h3 className="text-white font-bold">Unlock to Edit</h3>
              <p className="text-slate-400 text-sm mt-1">Enter your PIN to enable editing</p>
            </div>
            <form onSubmit={handleUnlockEdit} className="space-y-3">
              <input
                data-testid="input-edit-pin"
                type="password"
                value={editPin}
                onChange={(e) => { setEditPin(e.target.value); setEditPinError(""); }}
                placeholder="PIN"
                className="w-full bg-transparent text-white text-center text-xl tracking-widest rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500"
                style={{ border: "1px solid rgba(255,255,255,0.12)", letterSpacing: "0.3em" }}
                autoFocus
              />
              {editPinError && <p className="text-red-400 text-sm text-center">{editPinError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowEditModal(false); setEditPin(""); setEditPinError(""); }} className="flex-1 py-2 rounded-xl text-slate-400 text-sm transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Cancel
                </button>
                <button data-testid="button-confirm-edit-unlock" type="submit" disabled={!editPin} className="flex-1 py-2 rounded-xl text-black font-semibold text-sm transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}>
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div
          className="da-print-hidden fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}
        >
          <section
            className="w-full max-w-sm rounded-2xl p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="da-settings-title"
            style={{ background: "linear-gradient(155deg, #10233e, #0a172c)", border: "1px solid rgba(117,163,210,.3)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="da-settings-title" className="text-base font-bold text-white">Settings</h2>
                <p className="mt-1 text-xs text-slate-400">Manage this reconciliation view.</p>
              </div>
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <label className="mb-4 block text-xs font-medium text-slate-300">
              Reconciliation date
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setEditUnlocked(false); setTxSearch(""); }}
                className="mt-1.5 w-full rounded-lg bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400"
                style={{ border: "1px solid rgba(120,158,196,.25)", colorScheme: "dark" }}
              />
            </label>
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: "rgba(5,16,31,.6)", border: "1px solid rgba(120,158,196,.15)" }}>
              <div>
                <p className="text-xs font-semibold text-white">Edit access</p>
                <p className="mt-1 text-[11px] text-slate-400">{editUnlocked ? "Editing is unlocked" : "Editing is locked"}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (editUnlocked) {
                    setEditUnlocked(false);
                  } else {
                    setShowSettingsModal(false);
                    setShowEditModal(true);
                  }
                }}
                className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ color: editUnlocked ? "#fda4af" : "#f5d06b", background: editUnlocked ? "rgba(244,63,94,.12)" : "rgba(234,179,8,.12)", border: `1px solid ${editUnlocked ? "rgba(244,63,94,.25)" : "rgba(234,179,8,.25)"}` }}
              >
                {editUnlocked ? "Lock editing" : "Unlock"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refreshData}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
                style={{ border: "1px solid rgba(120,158,196,.25)" }}
              >
                <RefreshCw size={12} className="mr-1.5 inline" />Refresh data
              </button>
              <button
                type="button"
                onClick={() => { setShowSettingsModal(false); navigate("/dailyamount/history"); }}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-slate-950"
                style={{ background: "linear-gradient(135deg, #ffd565, #eaa52c)" }}
              >
                View reports
              </button>
            </div>
          </section>
        </div>
      )}
      </div>
    </div>
  );
}
