import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, Lock, Unlock, LogOut, ChevronLeft, ChevronRight, History, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff, Banknote, CalendarDays, Coins, Download, Landmark, Printer, RefreshCw, Scale, Search, Wallet, ArrowUpRight, FileText, Settings } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #0a0e1a 100%)" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}>
            <Lock size={28} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Daily Reconciliation</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your PIN to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="relative">
            <input
              data-testid="input-pin"
              type={show ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full bg-transparent text-white text-center text-2xl tracking-widest rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 pr-10"
              style={{ border: "1px solid rgba(255,255,255,0.12)", letterSpacing: "0.4em" }}
              autoFocus
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            data-testid="button-pin-submit"
            type="submit"
            disabled={loading || !pin}
            className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, subtitle, accent = "#d4af37", children, className = "", action, id }: { title: string; subtitle?: string; accent?: string; children: React.ReactNode; className?: string; action?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className={`da-panel rounded-xl overflow-hidden flex flex-col ${className}`} style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 8px 22px rgba(1,9,20,0.13)" }}>
      <div className="da-card-head px-3 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
        <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: accent }} />
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
        <span className="inline-flex min-w-12 justify-center text-xs font-bold text-slate-200 bg-slate-700/80 rounded-md px-1.5 py-1">₹{denom}</span>
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

function MetricCard({ label, accent, icon, children, testId, sub, className = "" }: {
  label: string; accent: string; icon: React.ReactNode; children: React.ReactNode; testId: string; sub?: string; className?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`da-metric min-w-0 rounded-lg px-2 py-1.5 flex items-center gap-2 ${className}`}
      style={{ background: "linear-gradient(140deg, rgba(17,42,71,0.97), rgba(11,30,52,0.92))", border: `1px solid ${accent}35`, boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 4px 12px rgba(0,0,0,0.12)" }}
    >
      <div
        className="da-metric-icon w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: `${accent}20`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="da-metric-label text-[9px] text-slate-400 truncate">{label}</p>
        <div className="da-metric-value text-xs sm:text-[13px] font-bold font-mono text-white truncate">{children}</div>
        {sub && <p className="da-metric-sub text-[8px] text-slate-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function Artwork({ src, label, icon, className = "" }: { src: string; label: string; icon: React.ReactNode; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`da-artwork ${className}`} aria-label={label}>
      {failed ? <span className="da-artwork-fallback" aria-hidden="true">{icon}</span> : (
        <img src={src} alt="" onError={() => setFailed(true)} />
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
      await fetch(`/api/dailyamount/entry/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-da-pin": pin },
        body: JSON.stringify(data),
      });
      setSaveStatus("saved");
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("idle");
    }
    // NOTE: We deliberately do NOT call qc.setQueryData here.
    // Updating the cache would trigger the entry useEffect, which would
    // call setFields and overwrite any in-progress keystrokes (e.g. "100." → "100").
  }, [pin, date]);

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
          z-index: 2;
          display: flex;
          flex: 0 0 128px;
          min-width: 0;
          min-height: 0;
          flex-direction: column;
          padding: 10px 8px 8px;
          border-right: 1px solid rgba(112, 157, 204, .2);
          background: linear-gradient(180deg, rgba(7, 19, 39, .98), rgba(6, 16, 33, .98));
        }
        .da-side-brand { display: flex; align-items: center; justify-content: center; height: 29px; margin-bottom: 11px; color: #f3c65a; }
        .da-side-brand-mark {
          display: grid; width: 27px; height: 27px; place-items: center; border-radius: 8px;
          border: 1px solid rgba(244, 192, 68, .32); background: linear-gradient(145deg, #183a61, #122746);
          box-shadow: 0 0 14px rgba(234, 176, 51, .14);
        }
        .da-nav { display: flex; flex-direction: column; gap: 4px; }
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
        .da-nav-item:disabled { opacity: .48; cursor: not-allowed; }
        .da-nav-item svg { flex: 0 0 auto; }
        .da-side-art {
          height: 82px; min-height: 55px; margin-top: auto; overflow: hidden;
          border: 1px solid rgba(68, 127, 180, .24); border-radius: 9px;
          background: linear-gradient(155deg, rgba(20, 50, 82, .58), rgba(11, 26, 49, .8));
        }
        .da-side-foot { padding-top: 6px; color: #607991; font-size: 8px; line-height: 1.4; text-align: center; }
        .da-artwork {
          position: relative; display: grid; min-width: 0; min-height: 0; place-items: center;
          overflow: hidden; color: #89b9ed; background:
            radial-gradient(circle at 55% 40%, rgba(57, 143, 224, .2), transparent 65%),
            linear-gradient(135deg, rgba(20, 57, 94, .76), rgba(12, 28, 52, .78));
        }
        .da-artwork img { width: 100%; height: 100%; object-fit: contain; }
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
          position: relative; min-height: 57px; overflow: hidden; padding: 6px 7px;
          border-radius: 8px; border: 1px solid rgba(73, 153, 232, .3);
          background: linear-gradient(135deg, rgba(13, 34, 61, .97), rgba(9, 24, 46, .96));
          box-shadow: inset 0 1px rgba(255,255,255,.035), 0 5px 15px rgba(0,0,0,.18);
          transition: transform .18s, border-color .18s, box-shadow .18s;
        }
        .da-metric::after {
          content: ""; position: absolute; right: 3px; bottom: 2px; width: 39px; height: 22px;
          opacity: .36; background: currentColor;
          clip-path: polygon(0 85%, 20% 61%, 39% 69%, 57% 30%, 74% 48%, 100% 0, 100% 100%, 0 100%);
        }
        .da-metric:hover { transform: translateY(-1px); box-shadow: 0 0 15px rgba(64, 143, 225, .12), inset 0 1px rgba(255,255,255,.05); }
        .da-metric:nth-child(1) { color: #45d8b3; border-color: rgba(63, 211, 173, .42) !important; background: linear-gradient(120deg, rgba(10, 73, 71, .8), rgba(10, 36, 55, .95)) !important; }
        .da-metric:nth-child(2) { color: #36b5ff; border-color: rgba(44, 150, 247, .44) !important; background: linear-gradient(120deg, rgba(12, 56, 105, .86), rgba(10, 31, 62, .96)) !important; }
        .da-metric:nth-child(3) { color: #b190ff; border-color: rgba(151, 106, 237, .45) !important; background: linear-gradient(120deg, rgba(57, 34, 114, .8), rgba(29, 27, 67, .96)) !important; }
        .da-metric:nth-child(4) { color: #ffb44c; border-color: rgba(244, 150, 40, .45) !important; background: linear-gradient(120deg, rgba(112, 62, 15, .74), rgba(54, 35, 28, .96)) !important; }
        .da-metric:nth-child(5) { color: #ff6d92; border-color: rgba(255, 73, 115, .48) !important; background: linear-gradient(120deg, rgba(98, 29, 62, .72), rgba(45, 24, 52, .96)) !important; }
        .da-metric[data-testid="metric-difference"] { box-shadow: inset 0 1px rgba(255,255,255,.03), 0 0 14px rgba(255, 65, 108, .1); }
        .da-metric[data-testid="metric-difference"].is-balanced { color: #45d8b3; border-color: rgba(63, 211, 173, .42); background: linear-gradient(120deg, rgba(10, 73, 71, .8), rgba(10, 36, 55, .95)); box-shadow: 0 0 14px rgba(51, 207, 156, .1); }
        .da-metric[data-testid="metric-difference"].is-balanced .da-metric-icon { color: #45d8b3 !important; }
        .da-metric-icon { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,.09) !important; }
        .da-metric > div:last-child { position: relative; z-index: 1; }
        .da-metric-label { color: #c3d2e3; font-size: 8px; text-transform: none; }
        .da-metric-value { font-size: clamp(10px, 1vw, 13px); line-height: 1.2; }
        .da-metric-sub { color: #a7bbcf; font-size: 7px; }
        .da-opening-metric-input { height: 19px; }
        .da-dashboard-grid {
          display: grid; flex: 1; min-width: 0; min-height: 0; grid-template-columns: minmax(0, .96fr) minmax(0, .98fr) minmax(0, 1.12fr);
          gap: 8px;
        }
        .da-column { display: flex; min-width: 0; min-height: 0; flex-direction: column; gap: 7px; overflow: hidden; }
        .da-column:first-child > .da-panel { flex: 1; min-height: 0; }
        .da-panel {
          border-radius: 9px; border: 1px solid rgba(80, 132, 190, .36) !important;
          background: linear-gradient(150deg, rgba(12, 29, 54, .97), rgba(8, 22, 43, .97)) !important;
          box-shadow: inset 0 1px rgba(255,255,255,.03), 0 7px 20px rgba(0, 5, 15, .19) !important;
          transition: border-color .18s, box-shadow .18s;
        }
        .da-panel:hover { border-color: rgba(105, 166, 226, .46) !important; }
        .da-card-head, .da-tx-header { min-height: 31px; padding: 3px 8px; border-bottom-color: rgba(100, 151, 202, .17) !important; background: linear-gradient(90deg, rgba(18, 48, 82, .72), rgba(10, 28, 52, .35)) !important; }
        .da-card-head h3, .da-tx-header h3 { font-size: 10px; }
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
        .da-overview { position: relative; flex: 1 0 75px; min-height: 75px; overflow: hidden; padding: 6px 7px; border: 1px solid rgba(91, 146, 202, .3); border-radius: 9px; background: linear-gradient(125deg, rgba(13, 30, 54, .94), rgba(9, 22, 43, .96)); box-shadow: inset 0 1px rgba(255,255,255,.025); }
        .da-overview-title { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; color: #e5edf7; font-size: 9px; font-weight: 700; }
        .da-overview-breakdown { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
        .da-overview-item { display: grid; grid-template-columns: 6px minmax(0, 1fr); gap: 3px 4px; align-items: center; min-width: 0; }
        .da-overview-dot { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 7px currentColor; }
        .da-overview-item span:nth-child(2) { color: #9aafc4; font-size: 7px; }
        .da-overview-item strong { grid-column: 2; overflow: hidden; color: #e2ebf5; font-size: 8px; font-family: ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; }
        .da-overview-item small { grid-column: 2; color: #7f97ae; font-size: 7px; }
        .da-overview-bar { display: flex; height: 5px; overflow: hidden; margin-top: 5px; border-radius: 999px; background: rgba(6, 17, 32, .9); box-shadow: inset 0 0 0 1px rgba(118, 154, 192, .12); }
        .da-overview-bar span { min-width: 0; transition: width .25s ease; }
        .da-overview-bar .cash { background: #32c89b; box-shadow: 0 0 8px rgba(50, 200, 155, .7); }
        .da-overview-bar .banks { background: #3d9cff; box-shadow: 0 0 8px rgba(61, 156, 255, .65); }
        .da-overview-bar .aeps { background: #a67aff; box-shadow: 0 0 8px rgba(166, 122, 255, .65); }
        .da-overview-art { position: absolute; right: 5px; bottom: 5px; width: 34px; height: 25px; opacity: .25; pointer-events: none; }
        .da-nav-status { position: absolute; left: 136px; top: 7px; z-index: 12; padding: 6px 9px; border-radius: 7px; color: #d6e2f0; background: #112542; border: 1px solid rgba(103, 151, 205, .3); font-size: 10px; }
        @media (min-width: 1024px) and (max-height: 520px) {
          .da-toolbar { flex-basis: 37px; min-height: 37px; }
          .da-main { gap: 6px; padding: 6px 7px 7px; }
          .da-main > .grid { gap: 6px; }
          .da-metric { min-height: 53px; gap: 5px; padding: 4px 5px; border-radius: 7px; }
          .da-metric-icon { width: 24px; height: 24px; }
          .da-metric-label { font-size: 7px; line-height: 1.1; }
          .da-metric-value { font-size: 10px; line-height: 1.15; }
          .da-metric-sub { font-size: 6px; line-height: 1.1; }
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
          .da-overview { flex-basis: 66px; min-height: 66px; padding: 4px 5px; }
          .da-overview-title { margin-bottom: 3px; font-size: 8px; }
          .da-overview-breakdown { gap: 2px; }
          .da-overview-item { gap: 2px 3px; }
          .da-overview-item span:nth-child(2), .da-overview-item small { font-size: 6px; }
          .da-overview-item strong { font-size: 7px; }
          .da-overview-bar { height: 4px; margin-top: 3px; }
          .da-overview-art { width: 28px; height: 18px; }
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
          .da-dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .da-column { overflow: visible; }
          .da-column:last-child { grid-column: 1 / -1; min-height: 430px; }
          .da-column:first-child { min-height: 400px; }
          .da-column:nth-child(2) { min-height: 400px; }
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
        }
      `}</style>

      <aside className="da-sidebar" aria-label="Daily reconciliation navigation">
        <div className="da-side-brand">
          <span className="da-side-brand-mark"><Scale size={16} /></span>
        </div>
        <nav className="da-nav">
          {[
            { label: "Dashboard", icon: <Wallet size={14} />, target: "top" },
            { label: "Cash Counting", icon: <Banknote size={14} />, target: "cash-panel" },
            { label: "Bank Balances", icon: <Landmark size={14} />, target: "bank-panel" },
            { label: "AEPS Wallet", icon: <Wallet size={14} />, target: "aeps-panel" },
            { label: "Transactions", icon: <ArrowUpRight size={14} />, target: "transactions-panel" },
            { label: "Reports", icon: <FileText size={14} />, target: "reports", unavailable: true },
            { label: "Settings", icon: <Settings size={14} />, target: "settings", unavailable: true },
          ].map((item) => (
            <button
              key={item.target}
              type="button"
              className={`da-nav-item ${activeSection === item.target ? "active" : ""}`}
              disabled={item.unavailable}
              title={item.unavailable ? `${item.label} is not available on this page` : item.label}
              aria-current={activeSection === item.target ? "page" : undefined}
              onClick={() => {
                if (item.unavailable) return;
                setActiveSection(item.target);
                document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="da-side-art">
          <Artwork src="/assets/dailyamount/sidebar-finance.png" label="Financial illustration" icon={<Banknote size={28} />} />
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
            <Banknote size={17} />
          </div>
          <span className="da-brand-title">Daily <em>Reconciliation</em></span>
        </div>

        <div className="order-3 sm:order-none flex items-center justify-center gap-1 rounded-lg px-1 py-1 min-w-0 w-full sm:w-auto" style={{ background: "rgba(15,29,57,0.82)", border: "1px solid rgba(148,163,184,0.16)" }}>
          <button data-testid="button-prev-date" aria-label="Previous day" onClick={() => changeDate(-1)} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <CalendarDays size={14} className="shrink-0 text-slate-400 hidden sm:block" />
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setEditUnlocked(false); setTxSearch(""); }}
            className="w-[122px] sm:w-[132px] bg-transparent text-white text-xs sm:text-sm font-semibold text-center outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
            data-testid="input-date"
          />
          <button data-testid="button-next-date" aria-label="Next day" onClick={() => changeDate(1)} disabled={date >= todayStr()} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
        {date === todayStr() && (
          <span className="hidden xl:inline-flex text-[10px] text-amber-300 font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(250,204,21,0.1)" }}>Today</span>
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
          <MetricCard label="Opening balance" accent="#39d7aa" icon={<Banknote size={16} />} testId="metric-opening-balance" sub={autoFilledBalance ? "Carry forward" : "Carry-in"}>
            {editUnlocked ? (
              <div className="relative w-full">
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-amber-300/70 text-[10px]">₹</span>
                <AmountInput
                  data-testid="input-opening-balance"
                  value={fields.openingBalance}
                  onChange={(value) => updateField("openingBalance", value)}
                  placeholder="0"
                  className="da-opening-metric-input w-full bg-slate-950/40 text-emerald-200 text-right rounded px-1 py-0.5 pl-4 text-[11px] font-bold outline-none focus:ring-1 focus:ring-emerald-400"
                  style={{ border: "1px solid rgba(109,145,179,0.28)" }}
                />
              </div>
            ) : (
              <span className="text-emerald-200">₹{fmt(fields.openingBalance)}</span>
            )}
          </MetricCard>
          <MetricCard label="Cash total" accent="#1687ff" icon={<Coins size={17} />} testId="metric-cash-total" sub="Notes + coins">
            <span className="text-blue-300">₹{fmt(cashTotal)}</span>
          </MetricCard>
          <MetricCard label="Bank total" accent="#8b5cf6" icon={<Landmark size={17} />} testId="metric-bank-total" sub="6 accounts">
            <span className="text-purple-300">₹{fmt(bankTotal)}</span>
          </MetricCard>
          <MetricCard label="AEPS wallet" accent="#ff9f1c" icon={<Wallet size={17} />} testId="metric-aeps-total" sub="4 sources">
            <span className="text-orange-300">₹{fmt(aepsTotal)}</span>
          </MetricCard>
          <MetricCard label="Difference" accent={isBalanced ? "#34d399" : "#fb7185"} icon={isBalanced ? <CheckCircle size={17} /> : <AlertTriangle size={17} />} testId="metric-difference" sub={isBalanced ? "In balance" : "Needs review"} className={isBalanced ? "is-balanced" : ""}>
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
                    <span className="text-xs font-bold text-slate-200 bg-slate-700/80 rounded px-1.5 py-0.5">Coins</span>
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
                    <Artwork src="/assets/dailyamount/cash-illustration.png" label="Cash illustration" icon={<Coins size={18} />} className="da-artwork-small" />
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
              accent="#3b82f6"
              className="shrink-0"
              id="bank-panel"
              action={<div className="da-card-action-total"><span>₹{fmt(bankTotal)}</span><Artwork src="/assets/dailyamount/bank-illustration.png" label="Bank illustration" icon={<Landmark size={18} />} className="da-artwork-small" /></div>}
            >
              <div className="space-y-0">
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
            </Card>

            {/* AEPS Wallet */}
            <Card
              title="AEPS Wallet"
              accent="#a855f7"
              className="shrink-0"
              id="aeps-panel"
              action={<div className="da-card-action-total"><span>₹{fmt(aepsTotal)}</span><Artwork src="/assets/dailyamount/aeps-illustration.png" label="AEPS illustration" icon={<Wallet size={18} />} className="da-artwork-small da-aeps-artwork" /></div>}
            >
              <div className="space-y-0">
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
            </Card>

            {/* Balance Overview */}
            <div className="da-overview" aria-label="Balance overview by category">
              <div className="da-overview-title"><Scale size={12} /> Balance Overview</div>
              <div className="da-overview-breakdown">
                <div className="da-overview-item">
                  <span className="da-overview-dot" style={{ color: "#32c89b", background: "#32c89b" }} />
                  <span>Cash</span><strong>₹{fmt(cashTotal)}</strong>
                  <small>{systemBalance ? ((cashTotal / systemBalance) * 100).toFixed(1) : "0.0"}%</small>
                </div>
                <div className="da-overview-item">
                  <span className="da-overview-dot" style={{ color: "#3d9cff", background: "#3d9cff" }} />
                  <span>Banks</span><strong>₹{fmt(bankTotal)}</strong>
                  <small>{systemBalance ? ((bankTotal / systemBalance) * 100).toFixed(1) : "0.0"}%</small>
                </div>
                <div className="da-overview-item">
                  <span className="da-overview-dot" style={{ color: "#a67aff", background: "#a67aff" }} />
                  <span>AEPS</span><strong>₹{fmt(aepsTotal)}</strong>
                  <small>{systemBalance ? ((aepsTotal / systemBalance) * 100).toFixed(1) : "0.0"}%</small>
                </div>
              </div>
              <div className="da-overview-bar" role="img" aria-label={`Cash ${systemBalance ? ((cashTotal / systemBalance) * 100).toFixed(1) : "0"}%, banks ${systemBalance ? ((bankTotal / systemBalance) * 100).toFixed(1) : "0"}%, AEPS ${systemBalance ? ((aepsTotal / systemBalance) * 100).toFixed(1) : "0"}%`}>
                <span className="cash" style={{ width: `${systemBalance ? (cashTotal / systemBalance) * 100 : 0}%` }} />
                <span className="banks" style={{ width: `${systemBalance ? (bankTotal / systemBalance) * 100 : 0}%` }} />
                <span className="aeps" style={{ width: `${systemBalance ? (aepsTotal / systemBalance) * 100 : 0}%` }} />
              </div>
              <Artwork src="/assets/dailyamount/balance-overview.png" label="Balance overview illustration" icon={<Scale size={18} />} className="da-overview-art" />
            </div>
          </div>

          {/* ══ COLUMN 3 — Transactions + Reconciliation ══════════════════ */}
          <div className="da-column">

            {/* Transactions card */}
            <div id="transactions-panel" className="da-panel da-transactions-panel rounded-xl overflow-hidden flex flex-col min-h-0" style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 8px 22px rgba(1,9,20,0.13)" }}>
              <div className="da-tx-header px-3 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
                <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: "#f97316" }} />
                <h3 className="text-[11px] font-bold text-white tracking-wide flex-1">Transactions</h3>
                {txArray.length > 0 && (
                  <div className="da-tx-totals da-print-hidden hidden xl:flex items-center gap-1 text-[9px]" title={`Income ₹${fmt(incomeTotal)} · expenses ₹${fmt(expenseTotal)}`}>
                    <span className="text-emerald-400 font-mono">+₹{fmt(incomeTotal)}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-rose-400 font-mono">−₹{fmt(expenseTotal)}</span>
                  </div>
                )}
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
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-600 text-xs">No transactions for this date</p>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-600 text-xs">No matching transactions</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredTransactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          data-testid={`tx-item-${tx.id}`}
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
            <div className="da-panel shrink-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025)" }}>
              <div className="da-reconcile-title px-3 py-2 flex items-center gap-2 text-[11px] font-bold text-slate-200" style={{ borderBottom: "1px solid rgba(104,141,177,0.14)" }}>
                <Scale size={13} className="text-amber-300" /> Reconciliation
              </div>
              <div className="da-reconcile-values grid grid-cols-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="da-reconcile-value p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Expected Balance</p>
                  <p className="text-sm font-bold text-white font-mono">₹{fmt(expectedBalance)}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Open + Income − Expense</p>
                </div>
                <div className="da-reconcile-value p-3" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs text-slate-500 mb-0.5">System Balance</p>
                  <p className="text-sm font-bold text-yellow-400 font-mono">₹{fmt(systemBalance)}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Cash + Banks + AEPS</p>
                </div>
              </div>
              <div
                className={`da-difference px-3 py-2.5 flex items-center justify-between ${isBalanced ? "good" : ""}`}
                style={{
                  background: isBalanced ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  borderTop: `1px solid ${isBalanced ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <div>
                  <p className="text-xs text-slate-500">Difference</p>
                  <p className={`da-difference-value text-base font-bold font-mono ${isBalanced ? "text-emerald-400" : "text-red-400"}`}>
                    {difference >= 0 ? "+" : ""}₹{fmt(difference)}
                  </p>
                </div>
                <div
                  className={`da-status flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs ${isBalanced ? "text-emerald-400" : "text-red-400"}`}
                  style={{ background: isBalanced ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${isBalanced ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}
                >
                  {isBalanced ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {isBalanced ? "BALANCED" : "MISMATCH"}
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
      </div>
    </div>
  );
}
