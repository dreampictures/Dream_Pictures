import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, accent = "#d4af37" }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
        <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Amount Input Row ─────────────────────────────────────────────────────────
function AmountRow({ label, value, onChange, sublabel, disabled }: { label: string; value: number; onChange: (v: number) => void; sublabel?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <span className="text-slate-300 text-sm">{label}</span>
        {sublabel && <span className="text-slate-500 text-xs ml-1">{sublabel}</span>}
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          placeholder="0"
          className="w-32 bg-transparent text-white text-right rounded-lg px-2 pl-5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </div>
      {sublabel && (
        <div className="w-20 text-right">
          <span className="text-yellow-400 text-xs font-mono">= ₹{fmt(value * parseFloat(sublabel.replace("×", "").trim()) || value)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Count Row (for cash denominations) ──────────────────────────────────────
function DenomRow({ denom, count, onChange, disabled }: { denom: number; count: number; onChange: (v: number) => void; disabled?: boolean }) {
  const total = count * denom;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-16 text-center">
        <span className="text-xs font-bold text-slate-200 bg-slate-700 rounded px-2 py-0.5">₹{denom}</span>
      </div>
      <span className="text-slate-500 text-xs">×</span>
      <input
        type="number"
        value={count || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        placeholder="0"
        min="0"
        className="w-24 bg-transparent text-white text-right rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      />
      <span className="text-slate-500 text-xs">=</span>
      <span className="flex-1 text-right text-yellow-400 text-sm font-mono">₹{fmt(total)}</span>
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
      // Always load server data when available (new date load or refetch returned data)
      setFields({
        openingBalance: entry.openingBalance || 0,
        notes10: entry.notes10 || 0,
        notes20: entry.notes20 || 0,
        notes50: entry.notes50 || 0,
        notes100: entry.notes100 || 0,
        notes200: entry.notes200 || 0,
        notes500: entry.notes500 || 0,
        coins: entry.coins || 0,
        bobSaving: entry.bobSaving || 0,
        bobCurrent: entry.bobCurrent || 0,
        hdfc: entry.hdfc || 0,
        kotak: entry.kotak || 0,
        au: entry.au || 0,
        sbi: entry.sbi || 0,
        aepsBob: entry.aepsBob || 0,
        aepsFino: entry.aepsFino || 0,
        aepsPayworld: entry.aepsPayworld || 0,
        aepsDigipay: entry.aepsDigipay || 0,
      });
    } else if (isNewDate) {
      // Only clear fields when navigating to a new date with no entry.
      // Do NOT reset if it's just a background refetch returning null
      // (that would erase the user's unsaved typing).
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
        // Update the query cache with the saved data so background refetches
        // don't overwrite the user's current fields with stale/null data.
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

  const addTxMutation = useMutation({
    mutationFn: async () => {
      if (!pin) throw new Error("No PIN");
      const res = await fetch("/api/dailyamount/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-da-pin": pin },
        body: JSON.stringify({ date, type: txType, amount: parseFloat(txAmount) || 0, note: txNote }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dailyamount/transactions", date] });
      setTxAmount("");
      setTxNote("");
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!pin) throw new Error("No PIN");
      await fetch(`/api/dailyamount/transactions/${id}`, { method: "DELETE", headers: dapiHeaders(pin) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dailyamount/transactions", date] });
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
    <div className="min-h-screen pb-48" style={{ background: bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3" style={{ background: "rgba(10,14,26,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Daily Reconciliation</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {saveStatus === "saving" && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Saved {lastSaved ? lastSaved.toLocaleTimeString() : ""}</span>}
            {saveStatus === "idle" && lastSaved && <span className="text-xs text-slate-500">Last saved {lastSaved.toLocaleTimeString()}</span>}
          </div>
        </div>
        <button data-testid="button-history" onClick={() => navigate("/dailyamount/history")} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <History size={18} />
        </button>
        {!editUnlocked ? (
          <button data-testid="button-unlock-edit" onClick={() => setShowEditModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-400 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <Lock size={13} /> Edit
          </button>
        ) : (
          <button data-testid="button-lock-edit" onClick={() => setEditUnlocked(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-green-400" style={{ border: "1px solid rgba(74,222,128,0.3)" }}>
            <Unlock size={13} /> Editing
          </button>
        )}
        <button data-testid="button-logout" onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-center gap-4 px-4 py-4">
        <button data-testid="button-prev-date" onClick={() => changeDate(-1)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setEditUnlocked(false); }}
            className="bg-transparent text-white text-lg font-bold text-center outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
            data-testid="input-date"
          />
          {date === todayStr() && <p className="text-xs text-yellow-400 mt-0.5">Today</p>}
        </div>
        <button data-testid="button-next-date" onClick={() => changeDate(1)} disabled={date >= todayStr()} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4">
        {/* Opening Balance */}
        <SectionCard title="Opening Balance" accent="#d4af37">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 text-sm flex-1">Opening Balance</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <input
                data-testid="input-opening-balance"
                type="number"
                value={fields.openingBalance || ""}
                onChange={(e) => updateField("openingBalance", parseFloat(e.target.value) || 0)}
                disabled={!editUnlocked}
                placeholder="0"
                className="w-40 bg-transparent text-white text-right rounded-xl px-3 pl-7 py-2 text-base font-bold outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: "1px solid rgba(212,175,55,0.3)" }}
              />
            </div>
          </div>
        </SectionCard>

        {/* Cash Counting */}
        <SectionCard title="Cash Counting" accent="#10b981">
          <div className="space-y-0.5">
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
            <div className="flex items-center gap-3 py-1.5 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-16 text-center">
                <span className="text-xs font-bold text-slate-200 bg-slate-700 rounded px-2 py-0.5">Coins</span>
              </div>
              <div className="flex-1" />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                <input
                  data-testid="input-coins"
                  type="number"
                  value={fields.coins || ""}
                  onChange={(e) => updateField("coins", parseFloat(e.target.value) || 0)}
                  disabled={!editUnlocked}
                  placeholder="0"
                  className="w-24 bg-transparent text-white text-right rounded-lg px-2 pl-5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <span className="flex-1 text-right text-yellow-400 text-sm font-mono">₹{fmt(fields.coins)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="text-emerald-400 text-sm font-semibold">Cash Total</span>
            <span className="text-emerald-400 text-lg font-bold font-mono">₹{fmt(cashTotal)}</span>
          </div>
        </SectionCard>

        {/* Bank Balances */}
        <SectionCard title="Bank Balances" accent="#3b82f6">
          <div className="space-y-0.5">
            {[
              { key: "bobSaving", label: "BOB Saving" },
              { key: "bobCurrent", label: "BOB Current" },
              { key: "hdfc", label: "HDFC" },
              { key: "kotak", label: "Kotak" },
              { key: "au", label: "AU" },
              { key: "sbi", label: "SBI" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 py-1.5">
                <span className="flex-1 text-slate-300 text-sm">{label}</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    data-testid={`input-${key}`}
                    type="number"
                    value={fields[key as keyof typeof fields] || ""}
                    onChange={(e) => updateField(key as keyof typeof fields, parseFloat(e.target.value) || 0)}
                    disabled={!editUnlocked}
                    placeholder="0"
                    className="w-36 bg-transparent text-white text-right rounded-lg px-2 pl-5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: "1px solid rgba(59,130,246,0.2)" }}>
            <span className="text-blue-400 text-sm font-semibold">Bank Total</span>
            <span className="text-blue-400 text-lg font-bold font-mono">₹{fmt(bankTotal)}</span>
          </div>
        </SectionCard>

        {/* AEPS Wallet */}
        <SectionCard title="AEPS Wallet" accent="#a855f7">
          <div className="space-y-0.5">
            {[
              { key: "aepsBob", label: "BOB" },
              { key: "aepsFino", label: "Fino" },
              { key: "aepsPayworld", label: "Payworld" },
              { key: "aepsDigipay", label: "Digipay" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 py-1.5">
                <span className="flex-1 text-slate-300 text-sm">{label}</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    data-testid={`input-${key}`}
                    type="number"
                    value={fields[key as keyof typeof fields] || ""}
                    onChange={(e) => updateField(key as keyof typeof fields, parseFloat(e.target.value) || 0)}
                    disabled={!editUnlocked}
                    placeholder="0"
                    className="w-36 bg-transparent text-white text-right rounded-lg px-2 pl-5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: "1px solid rgba(168,85,247,0.2)" }}>
            <span className="text-purple-400 text-sm font-semibold">AEPS Total</span>
            <span className="text-purple-400 text-lg font-bold font-mono">₹{fmt(aepsTotal)}</span>
          </div>
        </SectionCard>

        {/* System Balance Summary */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))", border: "1px solid rgba(212,175,55,0.2)" }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-emerald-400 mb-1">Cash</p>
              <p className="text-sm font-bold text-white font-mono">₹{fmt(cashTotal)}</p>
            </div>
            <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-blue-400 mb-1">Banks</p>
              <p className="text-sm font-bold text-white font-mono">₹{fmt(bankTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-purple-400 mb-1">AEPS</p>
              <p className="text-sm font-bold text-white font-mono">₹{fmt(aepsTotal)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }}>
            <span className="text-yellow-400 font-bold">System Balance</span>
            <span className="text-yellow-400 text-2xl font-bold font-mono">₹{fmt(systemBalance)}</span>
          </div>
        </div>

        {/* Transactions */}
        <SectionCard title="Transactions" accent="#f97316">
          {editUnlocked && (
            <div className="mb-4 p-3 rounded-xl space-y-3" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex gap-2">
                <button
                  data-testid="button-type-income"
                  onClick={() => setTxType("income")}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: txType === "income" ? "rgba(16,185,129,0.2)" : "transparent", border: `1px solid ${txType === "income" ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`, color: txType === "income" ? "#10b981" : "#94a3b8" }}
                >
                  + Income
                </button>
                <button
                  data-testid="button-type-expense"
                  onClick={() => setTxType("expense")}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: txType === "expense" ? "rgba(239,68,68,0.2)" : "transparent", border: `1px solid ${txType === "expense" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, color: txType === "expense" ? "#ef4444" : "#94a3b8" }}
                >
                  − Expense
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    data-testid="input-tx-amount"
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full bg-transparent text-white rounded-lg px-3 pl-7 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <input
                  data-testid="input-tx-note"
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder="Note"
                  className="flex-1 bg-transparent text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button
                  data-testid="button-add-tx"
                  onClick={() => addTxMutation.mutate()}
                  disabled={!txAmount || addTxMutation.isPending}
                  className="p-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}
                >
                  {addTxMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
            </div>
          )}

          {txLoading ? (
            <div className="text-center py-4"><Loader2 size={20} className="animate-spin text-slate-500 mx-auto" /></div>
          ) : txArray.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">No transactions for this date</p>
          ) : (
            <div className="space-y-2">
              {txArray.map((tx: any) => (
                <div key={tx.id} data-testid={`tx-item-${tx.id}`} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.type === "income" ? "bg-emerald-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{tx.note || (tx.type === "income" ? "Income" : "Expense")}</p>
                    <p className="text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <span className={`text-sm font-bold font-mono ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "−"}₹{fmt(tx.amount)}
                  </span>
                  {editUnlocked && (
                    <button data-testid={`button-delete-tx-${tx.id}`} onClick={() => deleteTxMutation.mutate(tx.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: "1px solid rgba(249,115,22,0.15)" }}>
                <span className="text-emerald-400 text-sm">Income: ₹{fmt(incomeTotal)}</span>
                <span className="text-red-400 text-sm">Expense: ₹{fmt(expenseTotal)}</span>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Sticky Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-4" style={{ background: "rgba(8,12,24,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-slate-400 mb-1">Expected Balance</p>
              <p className="text-base font-bold text-white font-mono">₹{fmt(expectedBalance)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Open + Income − Expense</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-slate-400 mb-1">System Balance</p>
              <p className="text-base font-bold text-yellow-400 font-mono">₹{fmt(systemBalance)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Cash + Banks + AEPS</p>
            </div>
          </div>
          <div className={`rounded-xl p-3 flex items-center justify-between ${isBalanced ? "" : ""}`}
            style={{ background: isBalanced ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${isBalanced ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Difference</p>
              <p className={`text-lg font-bold font-mono ${isBalanced ? "text-emerald-400" : "text-red-400"}`}>
                {difference >= 0 ? "+" : ""}₹{fmt(difference)}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isBalanced ? "text-emerald-400" : "text-red-400"}`}
              style={{ background: isBalanced ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
              {isBalanced ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span className="font-bold text-sm">{isBalanced ? "BALANCED" : "MISMATCH"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Unlock Modal */}
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
