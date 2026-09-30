import { useState } from "react";
import { ArrowLeft, Calendar, TrendingDown, TrendingUp } from "lucide-react";
import "./_group.css";
import { calcSystemBalance, fmt, formatDate, previewHistory, previewTransactions } from "./_shared/previewData";

export function Current() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedEntry = previewHistory.find((entry) => entry.id === selectedId);
  const selectedTransactions = selectedEntry
    ? previewTransactions.filter((transaction) => transaction.date === selectedEntry.date)
    : [];

  return (
    <div className="daily-history-preview min-h-screen">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4"
        style={{
          background: "rgba(10,14,26,0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          type="button"
          aria-label="Back to reconciliation"
          className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white">History</h1>
          <p className="text-xs text-slate-500">{previewHistory.length} entries</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        {previewHistory.map((entry) => {
          const { cash, bank, aeps, total } = calcSystemBalance(entry);
          const expanded = selectedId === entry.id;
          const banks = [
            ["BOB Saving", entry.bobSaving], ["BOB Current", entry.bobCurrent],
            ["HDFC", entry.hdfc], ["Kotak", entry.kotak], ["AU", entry.au], ["SBI", entry.sbi],
          ];
          const aepsAccounts = [
            ["BOB", entry.aepsBob], ["Fino", entry.aepsFino],
            ["Payworld", entry.aepsPayworld], ["Digipay", entry.aepsDigipay],
          ];
          const denominations = [
            [500, entry.notes500], [200, entry.notes200], [100, entry.notes100],
            [50, entry.notes50], [20, entry.notes20], [10, entry.notes10],
          ];

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSelectedId(expanded ? null : entry.id)}
              className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
              style={{
                background: expanded ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${expanded ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{formatDate(entry.date)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Opening: ₹{fmt(entry.openingBalance)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base font-bold text-yellow-400">₹{fmt(total)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">System Balance</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Cash", amount: cash, color: "#34d399", wash: "rgba(16,185,129,.08)" },
                  { label: "Banks", amount: bank, color: "#60a5fa", wash: "rgba(59,130,246,.08)" },
                  { label: "AEPS", amount: aeps, color: "#c084fc", wash: "rgba(168,85,247,.08)" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg py-1.5 text-center"
                    style={{ background: metric.wash, border: `1px solid ${metric.color}30` }}
                  >
                    <p className="font-mono text-xs font-semibold" style={{ color: metric.color }}>₹{fmt(metric.amount)}</p>
                    <p className="text-xs text-slate-500">{metric.label}</p>
                  </div>
                ))}
              </div>

              {expanded && (
                <div className="mt-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                  <div className="h-px bg-white/10" />
                  {[
                    { title: "Bank Breakdown", rows: banks },
                    { title: "AEPS Breakdown", rows: aepsAccounts },
                  ].map((group) => (
                    <section key={group.title}>
                      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</h2>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.rows.map(([label, amount]) => (
                          <div key={label} className="flex justify-between rounded-lg bg-black/20 px-2 py-1">
                            <span className="text-xs text-slate-400">{label}</span>
                            <span className="font-mono text-xs text-white">₹{fmt(Number(amount))}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                  <section>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Cash Breakdown</h2>
                    <div className="grid grid-cols-3 gap-1.5">
                      {denominations.map(([denomination, count]) => (
                        <div key={denomination} className="rounded-lg bg-black/20 py-1.5 text-center">
                          <p className="text-xs text-slate-500">₹{denomination}</p>
                          <p className="font-mono text-xs text-white">×{count}</p>
                          <p className="font-mono text-xs text-yellow-400">₹{fmt(Number(denomination) * Number(count))}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  {selectedTransactions.length > 0 && (
                    <section>
                      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Transactions</h2>
                      <div className="space-y-1.5">
                        {selectedTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                            {transaction.type === "income"
                              ? <TrendingUp size={12} className="shrink-0 text-emerald-400" />
                              : <TrendingDown size={12} className="shrink-0 text-red-400" />}
                            <span className="flex-1 truncate text-xs text-slate-300">{transaction.note}</span>
                            <span className={`font-mono text-xs font-semibold ${transaction.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                              {transaction.type === "income" ? "+" : "−"}₹{fmt(transaction.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  <div
                    className="w-full rounded-xl py-2 text-center text-sm font-medium text-yellow-400"
                    style={{ border: "1px solid rgba(212,175,55,0.3)" }}
                  >
                    Open &amp; Edit This Entry
                  </div>
                </div>
              )}
              <span className="sr-only"><Calendar size={1} /></span>
            </button>
          );
        })}
      </main>
    </div>
  );
}