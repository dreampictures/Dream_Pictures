import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, Lock, Unlock, LogOut, ChevronLeft, ChevronRight, History, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff, Sparkles, Banknote, CalendarDays, Coins, Download, Landmark, Printer, RefreshCw, Scale, Search, Wallet } from "lucide-react";

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
  "data-testid": testId,
  onKeyDown,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className: string;
  style?: React.CSSProperties;
  "data-testid"?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <input
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
function Card({ title, accent = "#d4af37", children, className = "" }: { title: string; accent?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`da-panel rounded-xl overflow-hidden flex flex-col ${className}`} style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 8px 22px rgba(1,9,20,0.13)" }}>
      <div className="px-3 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
        <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: accent }} />
        <h3 className="text-[11px] font-bold text-white tracking-wide">{title}</h3>
      </div>
      <div className="p-3 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}

// ─── Denomination Row ─────────────────────────────────────────────────────────
function DenomRow({ denom, count, onChange, disabled }: { denom: number; count: number; onChange: (v: number) => void; disabled?: boolean }) {
  const total = count * denom;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-14 shrink-0 text-center">
        <span className="inline-flex min-w-12 justify-center text-xs font-bold text-slate-200 bg-slate-700/80 rounded-md px-1.5 py-1">₹{denom}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          aria-label={`Decrease ₹${denom} note count`}
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={disabled || count <= 0}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          className="w-16 bg-slate-950/50 text-white text-center rounded-md px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-80"
          style={{ border: "1px solid #2a4763" }}
        />
        <button
          type="button"
          aria-label={`Increase ₹${denom} note count`}
          onClick={() => onChange(count + 1)}
          disabled={disabled}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
    <div className="flex items-center gap-2 py-1 border-b border-slate-700/25 last:border-0">
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
          className={`w-28 bg-slate-950/40 text-white text-right rounded-md px-2 pl-5 py-1 text-xs outline-none focus:ring-1 ${accentColor} disabled:opacity-85 disabled:cursor-not-allowed`}
          style={{ border: "1px solid #2a4763" }}
        />
      </div>
    </div>
  );
}

// ─── Section total bar ────────────────────────────────────────────────────────
function TotalBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: `1px solid ${color}30` }}>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>₹{fmt(value)}</span>
    </div>
  );
}

function MetricCard({ label, accent, icon, children, testId, sub }: {
  label: string; accent: string; icon: React.ReactNode; children: React.ReactNode; testId: string; sub?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="da-metric min-w-0 rounded-xl px-2.5 py-2 flex items-center gap-2.5"
      style={{ background: "linear-gradient(140deg, rgba(17,42,71,0.97), rgba(11,30,52,0.92))", border: `1px solid ${accent}35`, boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 4px 12px rgba(0,0,0,0.12)" }}
    >
      <div
        className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: `${accent}20`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{label}</p>
        <div className="text-sm sm:text-base font-bold font-mono text-white truncate">{children}</div>
        {sub && <p className="text-[9px] text-slate-500 truncate">{sub}</p>}
      </div>
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
    const search = txSearch.trim().toLowerCase();
    if (!search) return true;
    return [tx.note, tx.type, String(tx.amount)].some((value) => String(value || "").toLowerCase().includes(search));
  });

  if (!pin) {
    return <PinScreen onSuccess={(p) => setPin(p)} />;
  }

  const bg = "radial-gradient(ellipse at 50% -32%, rgba(30,78,125,0.42), transparent 60%), linear-gradient(135deg, #07172b 0%, #091b32 55%, #071529 100%)";

  return (
    <div className="da-page h-screen overflow-hidden flex flex-col text-slate-100" style={{ background: bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          html, body, #root { height: auto !important; overflow: visible !important; background: #fff !important; }
          .da-page, .da-main, .da-dashboard-grid, .da-column { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; color: #111827 !important; }
          .da-dashboard-grid { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; flex: none !important; gap: 8px !important; }
          .da-column { display: flex !important; flex-direction: column !important; gap: 8px !important; }
          .da-panel .flex-1 { flex: none !important; }
          .da-toolbar, .da-print-hidden { display: none !important; }
          .da-panel { overflow: visible !important; background: #fff !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; backdrop-filter: none !important; break-inside: avoid; }
          .da-panel *, .da-metric * { color: #111827 !important; }
          .da-metric { background: #f8fafc !important; border-color: #cbd5e1 !important; }
        }
      `}</style>

      {/* ── Header and daily controls ─────────────────────────────────────── */}
      <header
        className="da-toolbar relative z-10 shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 lg:px-4 py-2 sm:py-0 min-h-[54px]"
        style={{ background: "rgba(8,14,31,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(96,165,250,0.16)" }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-300" style={{ background: "linear-gradient(145deg, rgba(250,204,21,0.2), rgba(59,130,246,0.16))", border: "1px solid rgba(250,204,21,0.18)" }}>
            <Banknote size={17} />
          </div>
          <span className="hidden sm:block text-white font-bold text-sm tracking-tight">Daily Reconciliation</span>
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
      <div className="da-main flex-1 min-h-0 flex flex-col gap-2.5 lg:gap-3 overflow-y-auto lg:overflow-hidden p-2.5 lg:p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-2.5 shrink-0">
          <MetricCard label="Opening balance" accent="#f2c94c" icon={<Banknote size={17} />} testId="metric-opening-balance" sub="Carry-in">
            <span className="text-amber-200">₹{fmt(fields.openingBalance)}</span>
          </MetricCard>
          <MetricCard label="Cash total" accent="#34d399" icon={<Coins size={17} />} testId="metric-cash-total" sub="Counted notes + coins">
            <span className="text-emerald-300">₹{fmt(cashTotal)}</span>
          </MetricCard>
          <MetricCard label="Bank total" accent="#60a5fa" icon={<Landmark size={17} />} testId="metric-bank-total" sub="6 accounts">
            <span className="text-blue-300">₹{fmt(bankTotal)}</span>
          </MetricCard>
          <MetricCard label="AEPS wallet" accent="#c084fc" icon={<Wallet size={17} />} testId="metric-aeps-total" sub="4 sources">
            <span className="text-purple-300">₹{fmt(aepsTotal)}</span>
          </MetricCard>
          <MetricCard label="Expected balance" accent="#fbbf24" icon={<Scale size={17} />} testId="metric-expected-balance" sub="Opening + net transactions">
            <span className="text-amber-200">₹{fmt(expectedBalance)}</span>
          </MetricCard>
          <MetricCard label="Difference" accent={isBalanced ? "#34d399" : "#fb7185"} icon={isBalanced ? <CheckCircle size={17} /> : <AlertTriangle size={17} />} testId="metric-difference" sub={isBalanced ? "In balance" : "Needs review"}>
            <span className={isBalanced ? "text-emerald-300" : "text-rose-300"}>{difference >= 0 ? "+" : "−"}₹{fmt(Math.abs(difference))}</span>
          </MetricCard>
        </div>

        <div className="da-dashboard-grid flex-1 min-h-0 flex flex-col gap-2.5 lg:grid lg:gap-3" style={{ gridTemplateColumns: "minmax(300px,1.08fr) minmax(300px,0.95fr) minmax(350px,1.16fr)" }}>

          {/* ══ COLUMN 1 — Cash Counting ══════════════════════════════════ */}
          <div className="da-column lg:h-full lg:overflow-y-auto lg:overflow-x-hidden">
            <Card title="Cash Counting" accent="#10b981" className="h-full">
              <div className="space-y-0">
                <div className="grid grid-cols-[3.5rem_8.25rem_minmax(0,1fr)] gap-2 px-2 pb-2 text-[9px] text-slate-500 border-b border-slate-700/40">
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
                <div className="flex items-center gap-2 py-1 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
                      className="w-20 bg-slate-950/40 text-white text-right rounded-md px-2 pl-5 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-85"
                      style={{ border: "1px solid #2a4763" }}
                    />
                  </div>
                  <span className="text-slate-600 text-xs shrink-0">=</span>
                  <span className="flex-1 text-right text-yellow-400 text-xs font-mono">₹{fmt(fields.coins)}</span>
                </div>
              </div>

              {/* Cash Total */}
              <div className="mt-auto pt-2">
                <div className="rounded-lg p-2.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-emerald-400">Cash Total</span>
                    <span className="text-base font-bold font-mono text-emerald-400">₹{fmt(cashTotal)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ══ COLUMN 2 — Banks / AEPS / System Balance ══════════════════ */}
          <div className="da-column lg:h-full lg:overflow-y-auto lg:overflow-x-hidden flex flex-col gap-2.5 lg:gap-3">
            <div className="da-panel shrink-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025)" }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
                <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: "#e7bf56" }} />
                <h3 className="text-xs font-bold text-white tracking-wide flex-1">Opening balance</h3>
                {autoFilledBalance ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-300"><Sparkles size={11} />Carry forward</span>
                ) : (
                  <span className="text-[10px] text-slate-500">Starting funds</span>
                )}
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-300">Starting funds</span>
                <div className="relative w-36 max-w-[55%]">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <AmountInput
                    data-testid="input-opening-balance"
                    value={fields.openingBalance}
                    onChange={(value) => updateField("openingBalance", value)}
                    disabled={!editUnlocked}
                    placeholder="0"
                    className="w-full bg-slate-950/30 text-amber-200 text-right rounded-md px-2 pl-6 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-80"
                    style={{ border: "1px solid rgba(109,145,179,0.28)" }}
                  />
                </div>
              </div>
            </div>

            {/* Bank Balances */}
            <Card title="Bank Balances" accent="#3b82f6" className="shrink-0">
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
              <TotalBar label="Bank Total" value={bankTotal} color="#3b82f6" />
            </Card>

            {/* AEPS Wallet */}
            <Card title="AEPS Wallet" accent="#a855f7" className="shrink-0">
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
              <TotalBar label="AEPS Total" value={aepsTotal} color="#a855f7" />
            </Card>

            {/* System Balance */}
            <div className="da-panel rounded-xl p-3 shrink-0" style={{ background: "linear-gradient(115deg, rgba(105,81,36,0.27), rgba(38,43,47,0.3))", border: "1px solid rgba(228,188,82,0.33)" }}>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <div className="text-center">
                  <p className="text-xs text-emerald-400 mb-0.5">Cash</p>
                  <p className="text-xs font-bold text-white font-mono">₹{fmt(cashTotal)}</p>
                </div>
                <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs text-blue-400 mb-0.5">Banks</p>
                  <p className="text-xs font-bold text-white font-mono">₹{fmt(bankTotal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-purple-400 mb-0.5">AEPS</p>
                  <p className="text-xs font-bold text-white font-mono">₹{fmt(aepsTotal)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }}>
                <span className="text-xs font-bold text-yellow-400">System Balance</span>
                <span className="text-lg font-bold font-mono text-yellow-400">₹{fmt(systemBalance)}</span>
              </div>
            </div>
          </div>

          {/* ══ COLUMN 3 — Transactions + Reconciliation ══════════════════ */}
          <div className="da-column lg:h-full lg:overflow-hidden flex flex-col gap-2.5 lg:gap-3">

            {/* Transactions card */}
            <div className="da-panel flex-1 rounded-xl overflow-hidden flex flex-col min-h-0" style={{ background: "linear-gradient(155deg, rgba(13,32,55,0.97), rgba(9,26,47,0.97))", border: "1px solid rgba(78,117,158,0.42)", boxShadow: "inset 0 1px rgba(255,255,255,0.025), 0 8px 22px rgba(1,9,20,0.13)" }}>
              <div className="px-3 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(104,143,182,0.2)", background: "linear-gradient(90deg, rgba(19,48,79,0.7), rgba(11,32,56,0.44))" }}>
                <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: "#f97316" }} />
                <h3 className="text-xs font-bold text-white tracking-widest uppercase flex-1">Transactions</h3>
              </div>

              <div className="flex flex-col flex-1 min-h-0 p-3 gap-2">
                <div className="da-print-hidden shrink-0 flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      data-testid="input-tx-search"
                      type="search"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Search transactions"
                      className="w-full bg-black/20 text-white rounded-md pl-8 pr-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-slate-600"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  {txArray.length > 0 && (
                    <div className="shrink-0 flex items-center gap-1.5 text-[10px] sm:text-xs">
                      <span className="text-emerald-400 font-mono">+₹{fmt(incomeTotal)}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400 font-mono">−₹{fmt(expenseTotal)}</span>
                    </div>
                  )}
                </div>

                {/* Add Transaction Form */}
                {editUnlocked ? (
                  <div className="da-print-hidden shrink-0 rounded-lg p-2.5 space-y-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                ) : (
                  <div className="da-print-hidden shrink-0 rounded-lg py-2 px-3 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Lock size={11} className="text-slate-600" />
                    <span className="text-slate-600 text-xs">Unlock editing to add transactions</span>
                  </div>
                )}

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
                          className="flex items-center gap-2 py-2 px-2.5 rounded-lg border-b border-slate-700/30"
                          style={{ background: "rgba(8,26,44,0.5)" }}
                        >
                          <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${tx.type === "income" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-rose-300 bg-rose-500/10 border-rose-500/20"}`}>
                            {tx.type === "income" ? <Plus size={13} /> : <Minus size={13} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{tx.note || (tx.type === "income" ? "Income" : "Expense")}</p>
                            <p className="text-slate-600 text-xs">{new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <span className={`text-xs font-bold font-mono shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
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
              <div className="px-3 py-2 flex items-center gap-2 text-[11px] font-bold text-slate-200" style={{ borderBottom: "1px solid rgba(104,141,177,0.14)" }}>
                <Scale size={13} className="text-amber-300" /> Reconciliation
              </div>
              <div className="grid grid-cols-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Expected Balance</p>
                  <p className="text-sm font-bold text-white font-mono">₹{fmt(expectedBalance)}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Open + Income − Expense</p>
                </div>
                <div className="p-3" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs text-slate-500 mb-0.5">System Balance</p>
                  <p className="text-sm font-bold text-yellow-400 font-mono">₹{fmt(systemBalance)}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Cash + Banks + AEPS</p>
                </div>
              </div>
              <div
                className="px-3 py-2.5 flex items-center justify-between"
                style={{
                  background: isBalanced ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  borderTop: `1px solid ${isBalanced ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <div>
                  <p className="text-xs text-slate-500">Difference</p>
                  <p className={`text-base font-bold font-mono ${isBalanced ? "text-emerald-400" : "text-red-400"}`}>
                    {difference >= 0 ? "+" : ""}₹{fmt(difference)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs ${isBalanced ? "text-emerald-400" : "text-red-400"}`}
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
  );
}
