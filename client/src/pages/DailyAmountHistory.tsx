import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, Calendar, TrendingUp, TrendingDown } from "lucide-react";

const PIN_KEY = "da_auth_pin";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n || 0);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function calcSystemBalance(e: any) {
  const cash = (e.notes10 * 10) + (e.notes20 * 20) + (e.notes50 * 50) + (e.notes100 * 100) + (e.notes200 * 200) + (e.notes500 * 500) + e.coins;
  const bank = e.bobSaving + e.bobCurrent + e.hdfc + e.kotak + e.au + e.sbi;
  const aeps = e.aepsBob + e.aepsFino + e.aepsPayworld + e.aepsDigipay;
  return { cash, bank, aeps, total: cash + bank + aeps };
}

function PinGate({ onSuccess }: { onSuccess: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        setError("Incorrect PIN");
        setPin("");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #0f172a 100%)" }}>
      <form onSubmit={handleSubmit} className="w-80 rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="text-white font-bold text-center">Enter PIN</h2>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="w-full bg-transparent text-white text-center text-2xl tracking-widest rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500"
          style={{ border: "1px solid rgba(255,255,255,0.12)", letterSpacing: "0.4em" }}
          autoFocus
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading || !pin} className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}>
          {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default function DailyAmountHistory() {
  const [, navigate] = useLocation();
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem(PIN_KEY));
  const [selected, setSelected] = useState<any | null>(null);

  const { data: history = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/dailyamount/history"],
    queryFn: async () => {
      if (!pin) return [];
      const res = await fetch("/api/dailyamount/history", { headers: { "x-da-pin": pin } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!pin,
  });

  const { data: selectedTxs = [] } = useQuery<any[]>({
    queryKey: ["/api/dailyamount/transactions", selected?.date],
    queryFn: async () => {
      if (!pin || !selected) return [];
      const res = await fetch(`/api/dailyamount/transactions/${selected.date}`, { headers: { "x-da-pin": pin } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!pin && !!selected,
  });

  if (!pin) {
    return <PinGate onSuccess={(p) => setPin(p)} />;
  }

  const bg = "linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #080c18 100%)";

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center gap-3" style={{ background: "rgba(10,14,26,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button data-testid="button-back" onClick={() => navigate("/dailyamount")} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-bold text-base">History</h1>
          <p className="text-slate-500 text-xs">{(history as any[]).length} entries</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-yellow-400" />
          </div>
        ) : (history as any[]).length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>No entries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(history as any[]).map((entry: any) => {
              const { cash, bank, aeps, total } = calcSystemBalance(entry);
              return (
                <button
                  key={entry.id}
                  data-testid={`history-entry-${entry.id}`}
                  onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                  className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                  style={{
                    background: selected?.id === entry.id ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selected?.id === entry.id ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{formatDate(entry.date)}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Opening: ₹{fmt(entry.openingBalance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold font-mono text-base">₹{fmt(total)}</p>
                      <p className="text-slate-500 text-xs mt-0.5">System Balance</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center rounded-lg py-1.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      <p className="text-emerald-400 text-xs font-mono font-semibold">₹{fmt(cash)}</p>
                      <p className="text-slate-500 text-xs">Cash</p>
                    </div>
                    <div className="text-center rounded-lg py-1.5" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                      <p className="text-blue-400 text-xs font-mono font-semibold">₹{fmt(bank)}</p>
                      <p className="text-slate-500 text-xs">Banks</p>
                    </div>
                    <div className="text-center rounded-lg py-1.5" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
                      <p className="text-purple-400 text-xs font-mono font-semibold">₹{fmt(aeps)}</p>
                      <p className="text-slate-500 text-xs">AEPS</p>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selected?.id === entry.id && (
                    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                      {/* Bank details */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Bank Breakdown</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: "BOB Saving", val: entry.bobSaving },
                            { label: "BOB Current", val: entry.bobCurrent },
                            { label: "HDFC", val: entry.hdfc },
                            { label: "Kotak", val: entry.kotak },
                            { label: "AU", val: entry.au },
                            { label: "SBI", val: entry.sbi },
                          ].map(({ label, val }) => (
                            <div key={label} className="flex justify-between px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                              <span className="text-slate-400 text-xs">{label}</span>
                              <span className="text-white text-xs font-mono">₹{fmt(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AEPS details */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">AEPS Breakdown</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: "BOB", val: entry.aepsBob },
                            { label: "Fino", val: entry.aepsFino },
                            { label: "Payworld", val: entry.aepsPayworld },
                            { label: "Digipay", val: entry.aepsDigipay },
                          ].map(({ label, val }) => (
                            <div key={label} className="flex justify-between px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                              <span className="text-slate-400 text-xs">{label}</span>
                              <span className="text-white text-xs font-mono">₹{fmt(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cash breakdown */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Cash Breakdown</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { denom: 500, count: entry.notes500 },
                            { denom: 200, count: entry.notes200 },
                            { denom: 100, count: entry.notes100 },
                            { denom: 50, count: entry.notes50 },
                            { denom: 20, count: entry.notes20 },
                            { denom: 10, count: entry.notes10 },
                          ].map(({ denom, count }) => (
                            <div key={denom} className="text-center py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                              <p className="text-slate-500 text-xs">₹{denom}</p>
                              <p className="text-white text-xs font-mono">×{count || 0}</p>
                              <p className="text-yellow-400 text-xs font-mono">₹{fmt(count * denom)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transactions for this date */}
                      {selectedTxs.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Transactions</p>
                          <div className="space-y-1.5">
                            {selectedTxs.map((tx: any) => (
                              <div key={tx.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                                {tx.type === "income" ? <TrendingUp size={12} className="text-emerald-400 flex-shrink-0" /> : <TrendingDown size={12} className="text-red-400 flex-shrink-0" />}
                                <span className="flex-1 text-slate-300 text-xs truncate">{tx.note || tx.type}</span>
                                <span className={`text-xs font-mono font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                                  {tx.type === "income" ? "+" : "−"}₹{fmt(tx.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between px-3 pt-1">
                              <span className="text-emerald-400 text-xs">
                                Income: ₹{fmt(selectedTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0))}
                              </span>
                              <span className="text-red-400 text-xs">
                                Expense: ₹{fmt(selectedTxs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        data-testid={`button-edit-entry-${entry.id}`}
                        onClick={() => navigate(`/dailyamount?date=${entry.date}`)}
                        className="w-full py-2 rounded-xl text-yellow-400 text-sm font-medium transition-all hover:bg-yellow-500/10"
                        style={{ border: "1px solid rgba(212,175,55,0.3)" }}
                      >
                        Open & Edit This Entry
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
