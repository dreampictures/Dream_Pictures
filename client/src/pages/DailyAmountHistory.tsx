import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  History as HistoryIcon,
  Landmark,
  Loader2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

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

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatEntryTime(value: string | Date | null | undefined) {
  if (!value) return "Time unavailable";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function downloadHistoryCsv(records: any[], filename: string) {
  const headers = [
    "Date",
    "Updated At",
    "Opening Balance (INR)",
    "Cash Total (INR)",
    "Bank Total (INR)",
    "AEPS Total (INR)",
    "System Balance (INR)",
    "₹500 Notes",
    "₹200 Notes",
    "₹100 Notes",
    "₹50 Notes",
    "₹20 Notes",
    "₹10 Notes",
    "Coins (INR)",
    "BOB Saving (INR)",
    "BOB Current (INR)",
    "HDFC (INR)",
    "Kotak (INR)",
    "AU (INR)",
    "SBI (INR)",
    "AEPS BOB (INR)",
    "AEPS Fino (INR)",
    "AEPS Payworld (INR)",
    "AEPS Digipay (INR)",
  ];
  const rows = records.map((entry) => {
    const { cash, bank, aeps, total } = calcSystemBalance(entry);
    return [
      entry.date,
      entry.updatedAt && !Number.isNaN(new Date(entry.updatedAt).getTime())
        ? new Date(entry.updatedAt).toISOString()
        : "",
      entry.openingBalance,
      cash,
      bank,
      aeps,
      total,
      entry.notes500,
      entry.notes200,
      entry.notes100,
      entry.notes50,
      entry.notes20,
      entry.notes10,
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
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);
  const [appliedRange, setAppliedRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeError, setRangeError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

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

  const { data: selectedTxs = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/dailyamount/transactions", selected?.date],
    queryFn: async () => {
      if (!pin || !selected) return [];
      const res = await fetch(`/api/dailyamount/transactions/${selected.date}`, { headers: { "x-da-pin": pin } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!pin && !!selected,
  });

  const dateBounds = useMemo(() => {
    const dates = history
      .map((entry: any) => String(entry.date || ""))
      .filter((date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort();
    return { start: dates[0] || "", end: dates[dates.length - 1] || "" };
  }, [history]);
  const startInputValue = draftStart ?? dateBounds.start;
  const endInputValue = draftEnd ?? dateBounds.end;
  const activeStart = appliedRange?.start ?? dateBounds.start;
  const activeEnd = appliedRange?.end ?? dateBounds.end;
  const filteredHistory = useMemo(
    () => history.filter((entry: any) =>
      (!activeStart || entry.date >= activeStart) &&
      (!activeEnd || entry.date <= activeEnd)),
    [history, activeStart, activeEnd],
  );
  const totals = useMemo(
    () => filteredHistory.reduce(
      (acc: { cash: number; bank: number; aeps: number }, entry: any) => {
        const balance = calcSystemBalance(entry);
        acc.cash += balance.cash;
        acc.bank += balance.bank;
        acc.aeps += balance.aeps;
        return acc;
      },
      { cash: 0, bank: 0, aeps: 0 },
    ),
    [filteredHistory],
  );
  const today = localDateKey();

  if (!pin) {
    return <PinGate onSuccess={(p) => setPin(p)} />;
  }

  function applyDateRange() {
    const start = draftStart ?? dateBounds.start;
    const end = draftEnd ?? dateBounds.end;
    if (start && end && start > end) {
      setRangeError("Start date must be on or before the end date.");
      return;
    }
    setRangeError("");
    setAppliedRange({ start, end });
    setSelected(null);
  }

  function exportFilteredHistory() {
    const filename = `dailyamount-history-${activeStart || "all"}-to-${activeEnd || "all"}.csv`;
    downloadHistoryCsv(filteredHistory, filename);
    setExportOpen(false);
  }

  function exportAllHistory() {
    downloadHistoryCsv(history, "dailyamount-history-all-records.csv");
    setExportOpen(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100" style={{ background: "linear-gradient(135deg, #070d19 0%, #0b1425 48%, #090d1a 100%)" }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse at 14% 2%, rgba(37,99,235,.12), transparent 34%), radial-gradient(ellipse at 88% 34%, rgba(124,58,237,.10), transparent 32%), radial-gradient(ellipse at 70% 100%, rgba(212,175,55,.045), transparent 40%)",
        }}
      />

      <header
        className="sticky top-0 z-30 border-b border-sky-900/40 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8"
        style={{ background: "rgba(7,13,25,.88)" }}
      >
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              data-testid="button-back"
              onClick={() => navigate("/dailyamount")}
              aria-label="Back to DailyAmount"
              className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-2.5 text-slate-400 transition hover:border-sky-700/60 hover:bg-slate-800/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(59,130,246,0.09)]">
              <HistoryIcon size={21} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">History</h1>
              <p className="mt-0.5 truncate text-xs text-slate-400 sm:text-sm">
                {isLoading ? "Loading daily records…" : `${filteredHistory.length} ${filteredHistory.length === 1 ? "entry" : "entries"} • Daily system balance history`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-900/60 bg-slate-950/55 p-2 shadow-[0_8px_30px_rgba(2,8,23,0.22)]">
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/65 px-2.5 text-slate-400 focus-within:border-sky-500/70">
                <CalendarDays size={15} className="shrink-0 text-sky-300" />
                <span className="sr-only">Start date</span>
                <input
                  aria-label="Start date"
                  data-testid="history-start-date"
                  type="date"
                  value={startInputValue}
                  min={dateBounds.start || undefined}
                  max={dateBounds.end || undefined}
                  onChange={(event) => setDraftStart(event.target.value)}
                  disabled={!dateBounds.start || isLoading}
                  className="w-[132px] bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark] disabled:opacity-50"
                />
              </label>
              <span className="px-0.5 text-xs text-slate-500">to</span>
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/65 px-2.5 text-slate-400 focus-within:border-sky-500/70">
                <CalendarDays size={15} className="shrink-0 text-sky-300" />
                <span className="sr-only">End date</span>
                <input
                  aria-label="End date"
                  data-testid="history-end-date"
                  type="date"
                  value={endInputValue}
                  min={dateBounds.start || undefined}
                  max={dateBounds.end || undefined}
                  onChange={(event) => setDraftEnd(event.target.value)}
                  disabled={!dateBounds.start || isLoading}
                  className="w-[132px] bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark] disabled:opacity-50"
                />
              </label>
              <button
                data-testid="button-apply-history-range"
                onClick={applyDateRange}
                disabled={!dateBounds.start || isLoading}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 text-xs font-semibold text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply
              </button>
            </div>

            <div className="relative">
              <button
                data-testid="button-export-history"
                type="button"
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                onClick={() => setExportOpen((open) => !open)}
                disabled={history.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-sky-900/70 bg-slate-950/60 px-4 text-sm font-semibold text-slate-200 shadow-[0_8px_30px_rgba(2,8,23,0.22)] transition hover:border-sky-600/60 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <Download size={16} className="text-sky-300" />
                Export
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
              </button>
              {exportOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 overflow-hidden rounded-2xl border border-sky-900/70 bg-[#0b1424] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
                >
                  <button
                    role="menuitem"
                    onClick={exportFilteredHistory}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sky-500/10"
                  >
                    <Download size={15} className="mt-0.5 text-sky-300" />
                    <span>
                      <span className="block text-sm font-medium text-slate-100">Export selected range</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{filteredHistory.length} entries · CSV</span>
                    </span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={exportAllHistory}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sky-500/10"
                  >
                    <HistoryIcon size={15} className="mt-0.5 text-slate-400" />
                    <span>
                      <span className="block text-sm font-medium text-slate-100">Export all history</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{history.length} entries · CSV</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {rangeError && (
          <p role="alert" className="mx-auto mt-2 max-w-[1480px] text-right text-xs text-rose-300">
            {rangeError}
          </p>
        )}
      </header>

      <main className="relative mx-auto max-w-[1480px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <section
          aria-label="History totals"
          className="relative mb-7 overflow-hidden rounded-[22px] border border-sky-900/55 bg-slate-900/55 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-5 lg:p-6"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{ background: "linear-gradient(110deg, rgba(37,99,235,.07), transparent 36%, rgba(124,58,237,.045) 100%)" }}
          />
          <div className="relative grid grid-cols-2 divide-x divide-y divide-slate-700/60 md:grid-cols-4 md:divide-y-0">
            {[
              {
                label: "Total Entries",
                value: new Intl.NumberFormat("en-IN").format(filteredHistory.length),
                supporting: "Daily records in this range",
                icon: HistoryIcon,
                color: "#7dd3fc",
                wash: "rgba(56,189,248,.10)",
              },
              {
                label: "Total Cash",
                value: `₹${fmt(totals.cash)}`,
                supporting: "Across selected records",
                icon: Banknote,
                color: "#6ee7b7",
                wash: "rgba(16,185,129,.10)",
              },
              {
                label: "Total Banks",
                value: `₹${fmt(totals.bank)}`,
                supporting: "Across selected records",
                icon: Landmark,
                color: "#93c5fd",
                wash: "rgba(59,130,246,.11)",
              },
              {
                label: "Total AEPS",
                value: `₹${fmt(totals.aeps)}`,
                supporting: "Across selected records",
                icon: WalletCards,
                color: "#d8b4fe",
                wash: "rgba(168,85,247,.11)",
              },
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className={`min-w-0 p-3 sm:p-4 lg:px-5 ${index % 2 === 0 ? "pr-4" : "pl-4"} ${index >= 2 ? "pt-4" : "pb-4"} md:px-4 md:py-2 lg:px-6`}
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ color: metric.color, background: metric.wash, border: `1px solid ${metric.color}30` }}
                    >
                      <Icon size={17} />
                    </span>
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{metric.label}</p>
                  </div>
                  <p className="truncate font-mono text-lg font-bold tracking-tight text-white sm:text-xl lg:text-[22px]">{metric.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{metric.supporting}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">Daily reconciliation</p>
            <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">History records</h2>
          </div>
          <p className="text-xs text-slate-500">
            {filteredHistory.length} of {history.length} {history.length === 1 ? "record" : "records"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-sky-950/70 bg-slate-900/35">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 size={20} className="animate-spin text-sky-300" />
              Loading history…
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-sky-950/70 bg-slate-900/35 px-6 py-16 text-center shadow-[0_14px_42px_rgba(0,0,0,0.16)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-900/60 bg-sky-500/10 text-sky-300">
              <CalendarDays size={22} />
            </span>
            <p className="mt-4 font-semibold text-slate-200">No history entries yet</p>
            <p className="mt-1 text-sm text-slate-500">Completed daily reconciliations will appear here.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-sky-950/70 bg-slate-900/35 px-6 py-16 text-center shadow-[0_14px_42px_rgba(0,0,0,0.16)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-900/60 bg-sky-500/10 text-sky-300">
              <CalendarDays size={22} />
            </span>
            <p className="mt-4 font-semibold text-slate-200">No entries in this date range</p>
            <p className="mt-1 text-sm text-slate-500">Choose a wider date range to see more daily records.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((entry: any) => {
              const { cash, bank, aeps, total } = calcSystemBalance(entry);
              const expanded = selected?.id === entry.id;
              const banks = [
                { label: "BOB Saving", value: entry.bobSaving },
                { label: "BOB Current", value: entry.bobCurrent },
                { label: "HDFC", value: entry.hdfc },
                { label: "Kotak", value: entry.kotak },
                { label: "AU", value: entry.au },
                { label: "SBI", value: entry.sbi },
              ];
              const aepsWallets = [
                { label: "BOB", value: entry.aepsBob },
                { label: "Fino", value: entry.aepsFino },
                { label: "Payworld", value: entry.aepsPayworld },
                { label: "Digipay", value: entry.aepsDigipay },
              ];
              const cashDenominations = [
                { denomination: 500, count: entry.notes500 },
                { denomination: 200, count: entry.notes200 },
                { denomination: 100, count: entry.notes100 },
                { denomination: 50, count: entry.notes50 },
                { denomination: 20, count: entry.notes20 },
                { denomination: 10, count: entry.notes10 },
              ];
              const incomeTotal = selectedTxs
                .filter((transaction: any) => transaction.type === "income")
                .reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
              const expenseTotal = selectedTxs
                .filter((transaction: any) => transaction.type === "expense")
                .reduce((sum: number, transaction: any) => sum + transaction.amount, 0);

              return (
                <article
                  key={entry.id}
                  data-testid={`history-entry-${entry.id}`}
                  className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-200 ${expanded ? "border-sky-700/60 bg-slate-900/75 shadow-[0_16px_42px_rgba(2,8,23,.34)]" : "border-sky-950/70 bg-slate-900/48 shadow-[0_10px_32px_rgba(2,8,23,.18)] hover:-translate-y-0.5 hover:border-sky-800/80 hover:bg-slate-900/65"}`}
                >
                  <div className="p-3.5 sm:p-4 lg:px-5 lg:py-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(158px,1.4fr)_minmax(128px,1fr)_repeat(3,minmax(105px,.82fr))_minmax(168px,1.25fr)_minmax(114px,auto)] xl:items-center xl:gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <CalendarDays size={15} className="shrink-0 text-sky-300" />
                          <p className="text-sm font-semibold text-slate-100">{formatDate(entry.date)}</p>
                          {entry.date === today && (
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 pl-[21px] text-xs text-slate-500">
                          <Clock3 size={12} className="text-slate-500" />
                          {formatEntryTime(entry.updatedAt)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-slate-700/50 bg-slate-950/35 px-3 py-2 xl:border-0 xl:bg-transparent xl:px-0 xl:py-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">Opening Balance</p>
                        <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-200">₹{fmt(entry.openingBalance)}</p>
                      </div>

                      {[
                        { label: "Cash", amount: cash, color: "#6ee7b7", wash: "rgba(16,185,129,.085)", border: "rgba(16,185,129,.19)", icon: Banknote },
                        { label: "Banks", amount: bank, color: "#93c5fd", wash: "rgba(59,130,246,.09)", border: "rgba(59,130,246,.20)", icon: Landmark },
                        { label: "AEPS", amount: aeps, color: "#d8b4fe", wash: "rgba(168,85,247,.09)", border: "rgba(168,85,247,.20)", icon: WalletCards },
                      ].map((metric) => {
                        const Icon = metric.icon;
                        return (
                          <div
                            key={metric.label}
                            className="min-w-0 rounded-xl px-2.5 py-2 xl:px-2"
                            style={{ background: metric.wash, border: `1px solid ${metric.border}` }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon size={13} className="shrink-0" style={{ color: metric.color }} />
                              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">{metric.label}</p>
                            </div>
                            <p className="mt-1 truncate font-mono text-sm font-semibold" style={{ color: metric.color }}>₹{fmt(metric.amount)}</p>
                          </div>
                        );
                      })}

                      <div
                        className="col-span-1 min-w-0 rounded-xl px-3 py-2 lg:col-span-1"
                        style={{
                          background: "linear-gradient(115deg, rgba(212,175,55,.13), rgba(212,175,55,.045))",
                          border: "1px solid rgba(212,175,55,.34)",
                          boxShadow: "0 0 24px rgba(212,175,55,.055)",
                        }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/75">System Balance</p>
                        <p className="mt-1 truncate font-mono text-base font-bold tracking-tight text-amber-300 sm:text-lg">₹{fmt(total)}</p>
                      </div>

                      <button
                        type="button"
                        data-testid={`button-view-details-${entry.id}`}
                        aria-expanded={expanded}
                        onClick={() => setSelected(expanded ? null : entry)}
                        className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-800/65 bg-sky-500/[0.07] px-3 text-xs font-semibold text-sky-200 transition hover:border-sky-500/70 hover:bg-sky-500/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:col-span-1 xl:col-span-1"
                      >
                        {expanded ? "Hide Details" : "View Details"}
                        {expanded ? <ChevronRight size={15} className="rotate-90" /> : <ArrowRight size={15} />}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-sky-950/70 bg-slate-950/25 px-4 py-5 sm:px-5">
                      <div className="grid gap-5 xl:grid-cols-[1.1fr_.85fr_1.15fr]">
                        <section>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-sky-200/80">Bank Breakdown</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {banks.map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/55 px-3 py-2">
                                <span className="text-xs text-slate-400">{label}</span>
                                <span className="font-mono text-xs font-semibold text-slate-200">₹{fmt(value)}</span>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-purple-200/80">AEPS Breakdown</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {aepsWallets.map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/55 px-3 py-2">
                                <span className="text-xs text-slate-400">{label}</span>
                                <span className="font-mono text-xs font-semibold text-slate-200">₹{fmt(value)}</span>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200/80">Cash Breakdown</h3>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {cashDenominations.map(({ denomination, count }) => (
                              <div key={denomination} className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-2 py-2 text-center">
                                <p className="text-[10px] text-slate-500">₹{denomination}</p>
                                <p className="mt-0.5 font-mono text-xs text-slate-200">×{count || 0}</p>
                                <p className="mt-0.5 font-mono text-[10px] text-emerald-300">₹{fmt((count || 0) * denomination)}</p>
                              </div>
                            ))}
                            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-2 py-2 text-center">
                              <p className="text-[10px] text-slate-500">Coins</p>
                              <p className="mt-0.5 font-mono text-xs text-slate-200">—</p>
                              <p className="mt-0.5 font-mono text-[10px] text-emerald-300">₹{fmt(entry.coins)}</p>
                            </div>
                          </div>
                        </section>
                      </div>

                      <section className="mt-5 border-t border-slate-800/80 pt-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">Transactions</h3>
                          {transactionsLoading && <Loader2 size={14} className="animate-spin text-sky-300" />}
                        </div>
                        {transactionsLoading ? (
                          <p className="text-xs text-slate-500">Loading transactions…</p>
                        ) : selectedTxs.length === 0 ? (
                          <p className="rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-3 text-xs text-slate-500">No transactions recorded for this date.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {selectedTxs.map((transaction: any) => (
                              <div key={transaction.id} className="flex items-center gap-2 rounded-xl border border-slate-800/70 bg-slate-900/45 px-3 py-2">
                                {transaction.type === "income"
                                  ? <TrendingUp size={14} className="shrink-0 text-emerald-400" />
                                  : <TrendingDown size={14} className="shrink-0 text-rose-400" />}
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{transaction.note || transaction.type}</span>
                                <span className={`shrink-0 font-mono text-xs font-semibold ${transaction.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                                  {transaction.type === "income" ? "+" : "−"}₹{fmt(transaction.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="flex flex-wrap justify-end gap-x-5 gap-y-1 pt-1 text-xs">
                              <span className="text-emerald-300">Income: ₹{fmt(incomeTotal)}</span>
                              <span className="text-rose-300">Expense: ₹{fmt(expenseTotal)}</span>
                            </div>
                          </div>
                        )}
                      </section>

                      <button
                        type="button"
                        data-testid={`button-edit-entry-${entry.id}`}
                        onClick={() => navigate(`/dailyamount?date=${entry.date}`)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] py-2.5 text-sm font-semibold text-amber-300 transition hover:border-amber-300/55 hover:bg-amber-400/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:ml-auto sm:w-auto sm:px-5"
                      >
                        Open &amp; Edit This Entry
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
