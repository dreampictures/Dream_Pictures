import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Lock, Unlock, LogOut, ChevronLeft, ChevronRight, History, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";

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
    <div className={`rounded-xl overflow-hidden flex flex-col ${className}`} style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-3 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
        <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: accent }} />
        <h3 className="text-xs font-bold text-white tracking-widest uppercase">{title}</h3>
      </div>
      <div className="p-3 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}

// ─── Denomination Row ─────────────────────────────────────────────────────────
function DenomRow({ denom, count, onChange, disabled }: { denom: number; count: number; onChange: (v: number) => void; disabled?: boolean }) {
  const total = count * denom;
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-14 shrink-0 text-center">
        <span className="text-xs font-bold text-slate-200 bg-slate-700/80 rounded px-1.5 py-0.5">₹{denom}</span>
      </div>
      <span className="text-slate-600 text-xs shrink-0">×</span>
      <input
        type="number"
        value={count || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        placeholder="0"
        min="0"
        className="w-20 bg-transparent text-white text-right rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      />
      <span className="text-slate-600 text-xs shrink-0">=</span>
      <span className="flex-1 text-right text-yellow-400 text-xs font-mono">₹{fmt(total)}</span>
    </div>
  );
}

// ─── Bank / AEPS Amount Row ───────────────────────────────────────────────────
function AmountRow({ label, fieldKey, value, onChange, disabled, accentColor = "focus:ring-yellow-500" }: {
  label: string; fieldKey: string; value: number; onChange: (v: number) => void; disabled?: boolean; accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1 text-slate-300 text-xs truncate">{label}</span>
      <div className="relative shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
        <input
          data-testid={`input-${fieldKey}`}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          placeholder="0"
          className={`w-28 bg-transparent text-white text-right rounded-md px-2 pl-5 py-1 text-xs outline-none focus:ring-1 ${accentColor} disabled:opacity-40 disabled:cursor-not-allowed`}
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedDateRef = useRef<string>("");
  const qc = useQueryClient();

  const [fields, setFields] = useState({
    openingBalance: 0,
    notes10: 0, notes20: 0, notes50: 0, notes100: 0, notes200: 0, notes500: 0, coins: 0,
    bobSaving: 0, bobCurrent: 0, hdfc: 0, kotak: 0, au: 0, sbi: 0,
    aepsBob: 0, aepsFino: 0, aepsPayworld: 0, aepsDigipay: 0,
  });

  const { data: entry, isLoading: entryLoading } = useQuery({
    queryKey: ["/api/dailyamount/entry", date],
    queryFn: async () => {
      if (!pin) return null;
      const res = await fetch(`/api/dailyamount/entry/${date}`, { headers: dapiHeaders(pin) });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!pin,
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
  });

  useEffect(() => {
    if (entryLoading) return;
    const isNewDate = loadedDateRef.current !== date;
    loadedDateRef.current = date;
    if (entry) {
      setFields({
        openingBalance: entry.openingBalance || 0,
        notes10: entry.notes10 || 0, notes20: entry.notes20 || 0, notes50: entry.notes50 || 0,
        notes100: entry.notes100 || 0, notes200: entry.notes200 || 0, notes500: entry.notes500 || 0,
        coins: entry.coins || 0, bobSaving: entry.bobSaving || 0, bobCurrent: entry.bobCurrent || 0,
        hdfc: entry.hdfc || 0, kotak: entry.kotak || 0, au: entry.au || 0, sbi: entry.sbi || 0,
        aepsBob: entry.aepsBob || 0, aepsFino: entry.aepsFino || 0,
        aepsPayworld: entry.aepsPayworld || 0, aepsDigipay: entry.aepsDigipay || 0,
      });
    } else if (isNewDate) {
      setFields({ openingBalance: 0, notes10: 0, notes20: 0, notes50: 0, notes100: 0, notes200: 0, notes500: 0, coins: 0, bobSaving: 0, bobCurrent: 0, hdfc: 0, kotak: 0, au: 0, sbi: 0, aepsBob: 0, aepsFino: 0, aepsPayworld: 0, aepsDigipay: 0 });
    }
  }, [entry, entryLoading, date]);

  const saveEntry = useCallback(async (data: typeof fields) => {
    if (!pin) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/dailyamount/entry/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-da-pin": pin },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const saved = await res.json();
        qc.setQueryData(["/api/dailyamount/entry", date], saved);
        loadedDateRef.current = date;
      }
      setSaveStatus("saved");
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("idle");
    }
  }, [pin, date, qc]);

  const debouncedSave = useCallback((data: typeof fields) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveEntry(data), 500);
  }, [saveEntry]);

  function updateField(key: keyof typeof fields, value: number) {
    if (!editUnlocked) return;
    const updated = { ...fields, [key]: value };
    setFields(updated);
    debouncedSave(updated);
  }

  useEffect(() => {
    const handleUnload = () => {
      if (!pin) return;
      const body = JSON.stringify(fields);
      navigator.sendBeacon(`/api/dailyamount/entry/${date}?daPin=${pin}`, new Blob([body], { type: "application/json" }));
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [pin, date, fields]);

  const currentDate = date;

  const addTxMutation = useMutation({
    mutationFn: async () => {
      if (!pin) throw new Error("No PIN");
      const amount = parseFloat(txAmount);
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

  // ── Calculations ─────────────────────────────────────────────────────────
  const cashTotal =
    fields.notes10 * 10 + fields.notes20 * 20 + fields.notes50 * 50 +
    fields.notes100 * 100 + fields.notes200 * 200 + fields.notes500 * 500 + fields.coins;
  const bankTotal = fields.bobSaving + fields.bobCurrent + fields.hdfc + fields.kotak + fields.au + fields.sbi;
  const aepsTotal = fields.aepsBob + fields.aepsFino + fields.aepsPayworld + fields.aepsDigipay;
  const systemBalance = cashTotal + bankTotal + aepsTotal;
  const txArray = Array.isArray(transactions) ? transactions : [];
  const incomeTotal = txArray.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const expenseTotal = txArray.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const expectedBalance = fields.openingBalance + incomeTotal - expenseTotal;
  const difference = systemBalance - expectedBalance;
  const isBalanced = Math.abs(difference) < 0.01;

  if (!pin) {
    return <PinScreen onSuccess={(p) => setPin(p)} />;
  }

  const bg = "linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #080c18 100%)";

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: bg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Compact Header ───────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 h-12"
        style={{ background: "rgba(10,14,26,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Title */}
        <span className="text-white font-bold text-sm shrink-0 hidden sm:block">Daily Reconciliation</span>
        <div className="hidden sm:block w-px h-4 bg-white/10 shrink-0" />

        {/* Date Navigator */}
        <div className="flex items-center gap-1 flex-1">
          <button data-testid="button-prev-date" onClick={() => changeDate(-1)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setEditUnlocked(false); }}
            className="bg-transparent text-white text-sm font-semibold text-center outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
            data-testid="input-date"
          />
          <button data-testid="button-next-date" onClick={() => changeDate(1)} disabled={date >= todayStr()} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
          {date === todayStr() && (
            <span className="text-xs text-yellow-400 font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(212,175,55,0.12)" }}>Today</span>
          )}
        </div>

        {/* Save Status */}
        <div className="shrink-0 hidden md:flex items-center">
          {saveStatus === "saving" && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Saving…</span>}
          {saveStatus === "saved" && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={10} />Saved</span>}
          {saveStatus === "idle" && lastSaved && <span className="text-xs text-slate-600">{lastSaved.toLocaleTimeString()}</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button data-testid="button-history" onClick={() => navigate("/dailyamount/history")} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="History">
            <History size={15} />
          </button>
          {!editUnlocked ? (
            <button data-testid="button-unlock-edit" onClick={() => setShowEditModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-400 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Lock size={12} /> Edit
            </button>
          ) : (
            <button data-testid="button-lock-edit" onClick={() => setEditUnlocked(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 transition-all" style={{ border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.07)" }}>
              <Unlock size={12} /> Editing
            </button>
          )}
          <button data-testid="button-logout" onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── Dashboard Body ────────────────────────────────────────────────── */}
      {/* Mobile: normal scroll. Desktop: fixed height 3-col grid */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden p-2.5 lg:p-3">
        <div className="h-full flex flex-col gap-2.5 lg:grid lg:gap-3" style={{ gridTemplateColumns: "1fr 1fr 1.05fr" }}>

          {/* ══ COLUMN 1 — Cash Counting ══════════════════════════════════ */}
          <div className="lg:h-full lg:overflow-y-auto lg:overflow-x-hidden">
            <Card title="Cash Counting" accent="#10b981" className="h-full">
              <div className="space-y-0">
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

                {/* Coins row */}
                <div className="flex items-center gap-2 py-1 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-14 shrink-0 text-center">
                    <span className="text-xs font-bold text-slate-200 bg-slate-700/80 rounded px-1.5 py-0.5">Coins</span>
                  </div>
                  <div className="flex-1" />
                  <div className="relative shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                    <input
                      data-testid="input-coins"
                      type="number"
                      value={fields.coins || ""}
                      onChange={(e) => updateField("coins", parseFloat(e.target.value) || 0)}
                      disabled={!editUnlocked}
                      placeholder="0"
                      className="w-20 bg-transparent text-white text-right rounded-md px-2 pl-5 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
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

          {/* ══ COLUMN 2 — Opening / Banks / AEPS / System Balance ════════ */}
          <div className="lg:h-full lg:overflow-y-auto lg:overflow-x-hidden flex flex-col gap-2.5 lg:gap-3">

            {/* Opening Balance */}
            <div className="rounded-xl overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
                <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: "#d4af37" }} />
                <h3 className="text-xs font-bold text-white tracking-widest uppercase flex-1">Opening Balance</h3>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    data-testid="input-opening-balance"
                    type="number"
                    value={fields.openingBalance || ""}
                    onChange={(e) => updateField("openingBalance", parseFloat(e.target.value) || 0)}
                    disabled={!editUnlocked}
                    placeholder="0"
                    className="w-32 bg-transparent text-yellow-400 text-right rounded-lg px-2 pl-6 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ border: "1px solid rgba(212,175,55,0.25)" }}
                  />
                </div>
              </div>
            </div>

            {/* Bank Balances */}
            <Card title="Bank Balances" accent="#3b82f6" className="shrink-0">
              <div className="space-y-0">
                {[
                  { key: "bobSaving", label: "BOB Saving" },
                  { key: "bobCurrent", label: "BOB Current" },
                  { key: "hdfc", label: "HDFC" },
                  { key: "kotak", label: "Kotak" },
                  { key: "au", label: "AU" },
                  { key: "sbi", label: "SBI" },
                ].map(({ key, label }) => (
                  <AmountRow
                    key={key}
                    label={label}
                    fieldKey={key}
                    value={fields[key as keyof typeof fields]}
                    onChange={(v) => updateField(key as keyof typeof fields, v)}
                    disabled={!editUnlocked}
                    accentColor="focus:ring-blue-500"
                  />
                ))}
              </div>
              <TotalBar label="Bank Total" value={bankTotal} color="#3b82f6" />
            </Card>

            {/* AEPS Wallet */}
            <Card title="AEPS Wallet" accent="#a855f7" className="shrink-0">
              <div className="space-y-0">
                {[
                  { key: "aepsBob", label: "BOB" },
                  { key: "aepsFino", label: "Fino" },
                  { key: "aepsPayworld", label: "Payworld" },
                  { key: "aepsDigipay", label: "Digipay" },
                ].map(({ key, label }) => (
                  <AmountRow
                    key={key}
                    label={label}
                    fieldKey={key}
                    value={fields[key as keyof typeof fields]}
                    onChange={(v) => updateField(key as keyof typeof fields, v)}
                    disabled={!editUnlocked}
                    accentColor="focus:ring-purple-500"
                  />
                ))}
              </div>
              <TotalBar label="AEPS Total" value={aepsTotal} color="#a855f7" />
            </Card>

            {/* System Balance */}
            <div className="rounded-xl p-3 shrink-0" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))", border: "1px solid rgba(212,175,55,0.2)" }}>
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
          <div className="lg:h-full lg:overflow-hidden flex flex-col gap-2.5 lg:gap-3">

            {/* Transactions card — flex-1 so it fills remaining space */}
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col min-h-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-3 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
                <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: "#f97316" }} />
                <h3 className="text-xs font-bold text-white tracking-widest uppercase flex-1">Transactions</h3>
                {txArray.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400 font-mono">+₹{fmt(incomeTotal)}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-red-400 font-mono">−₹{fmt(expenseTotal)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 min-h-0 p-3 gap-2">
                {/* Add Transaction Form */}
                {editUnlocked ? (
                  <div className="shrink-0 rounded-lg p-2.5 space-y-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                        <input
                          data-testid="input-tx-amount"
                          type="number"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
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
                  <div className="shrink-0 rounded-lg py-2 px-3 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)" }}>
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
                  ) : (
                    <div className="space-y-1.5">
                      {txArray.map((tx: any) => (
                        <div
                          key={tx.id}
                          data-testid={`tx-item-${tx.id}`}
                          className="flex items-center gap-2 py-2 px-2.5 rounded-lg"
                          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tx.type === "income" ? "bg-emerald-400" : "bg-red-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{tx.note || (tx.type === "income" ? "Income" : "Expense")}</p>
                            <p className="text-slate-600 text-xs">{new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <span className={`text-xs font-bold font-mono shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                            {tx.type === "income" ? "+" : "−"}₹{fmt(tx.amount)}
                          </span>
                          {editUnlocked && (
                            <button
                              data-testid={`button-delete-tx-${tx.id}`}
                              onClick={() => deleteTxMutation.mutate(tx.id)}
                              className="p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
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
            <div className="shrink-0 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="grid grid-cols-2 divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
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
                style={{ background: isBalanced ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderTop: `1px solid ${isBalanced ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
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
