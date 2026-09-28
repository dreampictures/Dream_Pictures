import "./_group.css";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  Landmark,
  LockKeyhole,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Unlock,
  WalletCards,
  X,
} from "lucide-react";

type FieldKey =
  | "openingBalance"
  | "notes10"
  | "notes20"
  | "notes50"
  | "notes100"
  | "notes200"
  | "notes500"
  | "coins"
  | "bobSaving"
  | "bobCurrent"
  | "hdfc"
  | "kotak"
  | "au"
  | "sbi"
  | "aepsBob"
  | "aepsFino"
  | "aepsPayworld"
  | "aepsDigipay";

type Fields = Record<FieldKey, number>;
type Transaction = {
  id: number;
  type: "income" | "expense";
  amount: number;
  note: string;
  createdAt: string;
};
type DayRecord = { fields: Fields; transactions: Transaction[] };

const DEMO_DATE = "2025-05-16";
const seedFields: Fields = {
  openingBalance: 22400,
  notes10: 8,
  notes20: 5,
  notes50: 6,
  notes100: 10,
  notes200: 4,
  notes500: 12,
  coins: 280,
  bobSaving: 18400,
  bobCurrent: 9200,
  hdfc: 12750,
  kotak: 6800,
  au: 4350,
  sbi: 8900,
  aepsBob: 5200,
  aepsFino: 3450,
  aepsPayworld: 2750,
  aepsDigipay: 1800,
};
const seedTransactions: Transaction[] = [
  { id: 1, type: "income", amount: 4500, note: "Cash deposit", createdAt: "2025-05-16T09:42:00" },
  { id: 2, type: "income", amount: 2200, note: "AEPS commission", createdAt: "2025-05-16T12:18:00" },
  { id: 3, type: "expense", amount: 1200, note: "Office supplies", createdAt: "2025-05-16T15:07:00" },
];
const denominations = [500, 200, 100, 50, 20, 10] as const;
const bankAccounts: { key: FieldKey; label: string; short: string; color: string }[] = [
  { key: "bobSaving", label: "BOB Saving", short: "BS", color: "coral" },
  { key: "bobCurrent", label: "BOB Current", short: "BC", color: "rose" },
  { key: "hdfc", label: "HDFC", short: "H", color: "amber" },
  { key: "kotak", label: "Kotak", short: "K", color: "mint" },
  { key: "au", label: "AU", short: "A", color: "rose" },
  { key: "sbi", label: "SBI", short: "S", color: "blue" },
];
const walletAccounts: { key: FieldKey; label: string; short: string; color: string }[] = [
  { key: "aepsBob", label: "BOB", short: "B", color: "coral" },
  { key: "aepsFino", label: "Fino", short: "F", color: "blue" },
  { key: "aepsPayworld", label: "Payworld", short: "P", color: "mint" },
  { key: "aepsDigipay", label: "Digipay", short: "D", color: "amber" },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value || 0);
const parseAmount = (value: string) => Number.parseFloat(value.replace(/,/g, "")) || 0;
const emptyFields = (): Fields => ({
  openingBalance: 0,
  notes10: 0,
  notes20: 0,
  notes50: 0,
  notes100: 0,
  notes200: 0,
  notes500: 0,
  coins: 0,
  bobSaving: 0,
  bobCurrent: 0,
  hdfc: 0,
  kotak: 0,
  au: 0,
  sbi: 0,
  aepsBob: 0,
  aepsFino: 0,
  aepsPayworld: 0,
  aepsDigipay: 0,
});

function Metric({
  label,
  value,
  icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  sub?: string;
}) {
  return (
    <div className={`da-metric ${tone}`}>
      <div className="da-metric-icon">{icon}</div>
      <div className="da-metric-copy">
        <span className="da-eyebrow">{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

export function ReferenceRedesign() {
  const [date, setDate] = useState(DEMO_DATE);
  const [records, setRecords] = useState<Record<string, DayRecord>>({
    [DEMO_DATE]: { fields: seedFields, transactions: seedTransactions },
  });
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const record = records[date] ?? { fields: emptyFields(), transactions: [] };
  const { fields, transactions } = record;
  const cashTotal =
    fields.notes500 * 500 +
    fields.notes200 * 200 +
    fields.notes100 * 100 +
    fields.notes50 * 50 +
    fields.notes20 * 20 +
    fields.notes10 * 10 +
    fields.coins;
  const bankTotal = bankAccounts.reduce((total, account) => total + fields[account.key], 0);
  const aepsTotal = walletAccounts.reduce((total, account) => total + fields[account.key], 0);
  const systemBalance = cashTotal + bankTotal + aepsTotal;
  const incomeTotal = transactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = transactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
  const expectedBalance = fields.openingBalance + incomeTotal - expenseTotal;
  const difference = systemBalance - expectedBalance;
  const balanced = Math.abs(difference) < 0.01;
  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return transactions;
    return transactions.filter(
      (tx) =>
        tx.note.toLowerCase().includes(term) ||
        tx.type.includes(term) ||
        String(tx.amount).includes(term),
    );
  }, [transactions, search]);

  const updateField = (key: FieldKey, value: number) => {
    if (!editing) return;
    setRecords((current) => ({
      ...current,
      [date]: {
        ...record,
        fields: { ...fields, [key]: Math.max(0, value) },
      },
    }));
    setNotice("Changes updated");
  };

  const chooseDate = (nextDate: string) => {
    if (!nextDate) return;
    setRecords((current) => {
      if (current[nextDate]) return current;
      const nextOpening = nextDate > date ? systemBalance : 0;
      return {
        ...current,
        [nextDate]: { fields: { ...emptyFields(), openingBalance: nextOpening }, transactions: [] },
      };
    });
    setDate(nextDate);
    setEditing(false);
    setSearch("");
    setNotice("");
  };

  const shiftDate = (delta: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + delta);
    chooseDate(next.toISOString().slice(0, 10));
  };

  const addTransaction = () => {
    const amount = parseAmount(txAmount);
    if (!amount || amount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    if (!txNote.trim()) {
      setFormError("Add a short description to continue.");
      return;
    }
    const newTransaction: Transaction = {
      id: Date.now(),
      type: txType,
      amount,
      note: txNote.trim(),
      createdAt: new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
    };
    setRecords((current) => ({
      ...current,
      [date]: { ...record, transactions: [newTransaction, ...transactions] },
    }));
    setTxAmount("");
    setTxNote("");
    setFormError("");
    setNotice("Transaction added");
  };

  const deleteTransaction = (id: number) => {
    setRecords((current) => ({
      ...current,
      [date]: { ...record, transactions: transactions.filter((tx) => tx.id !== id) },
    }));
    setNotice("Transaction removed");
  };

  const resetDemo = () => {
    setRecords({ [DEMO_DATE]: { fields: { ...seedFields }, transactions: [...seedTransactions] } });
    setDate(DEMO_DATE);
    setEditing(false);
    setSearch("");
    setNotice("Demo values restored");
  };

  const exportCsv = () => {
    const rows = [
      ["Daily reconciliation", date],
      ["Category", "Name", "Amount"],
      ["Opening", "Opening balance", fields.openingBalance],
      ...denominations.map((denom) => [`Cash · ₹${denom}`, "Note count", fields[`notes${denom}` as FieldKey]]),
      ["Cash", "Coins", fields.coins],
      ...bankAccounts.map((account) => ["Bank", account.label, fields[account.key]]),
      ...walletAccounts.map((account) => ["AEPS", account.label, fields[account.key]]),
      ...transactions.map((tx) => [tx.type, tx.note, tx.amount]),
      ["Summary", "Cash total", cashTotal],
      ["Summary", "Bank total", bankTotal],
      ["Summary", "AEPS total", aepsTotal],
      ["Summary", "Expected balance", expectedBalance],
      ["Summary", "System balance", systemBalance],
      ["Summary", "Difference", difference],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reconciliation-${date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Reconciliation exported");
  };

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="daily-amount-preview da-redesign">
      <style>{`
        .da-redesign {
          --ink: #e8eef5;
          --muted: #8da0b5;
          --faint: #62758a;
          --line: #213954;
          --panel: #0c1d33;
          --panel-raised: #102541;
          --navy: #07172b;
          --gold: #e7bf56;
          --mint: #47d3a1;
          min-height: 100dvh;
          height: 100dvh;
          overflow: hidden;
          color: var(--ink);
          background:
            radial-gradient(ellipse at 50% -32%, rgba(30, 78, 125, .42), transparent 60%),
            linear-gradient(135deg, #07172b 0%, #091b32 55%, #071529 100%);
          font-family: "DM Sans", "Trebuchet MS", sans-serif;
          font-size: 13px;
          color-scheme: dark;
        }
        .da-redesign * { box-sizing: border-box; }
        .da-redesign button, .da-redesign input { font: inherit; }
        .da-redesign button { color: inherit; }
        .da-shell { height: 100%; display: flex; flex-direction: column; max-width: 1760px; margin: 0 auto; padding: 0 17px 15px; }
        .da-header { min-height: 58px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(123, 158, 192, .17); }
        .da-brand { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
        .da-brand-mark { width: 30px; height: 30px; display: grid; place-items: center; color: #f3c75c; border-radius: 9px; background: linear-gradient(145deg, #1d4771, #133355); border: 1px solid #35638e; }
        .da-brand-title { font-weight: 700; font-size: 15px; letter-spacing: -.3px; }
        .da-brand-kicker { display: block; color: var(--muted); font-size: 9px; letter-spacing: 1.25px; text-transform: uppercase; margin-top: 1px; }
        .da-date-nav { display: flex; align-items: center; border: 1px solid #294766; background: #0c2039; border-radius: 9px; padding: 3px; gap: 2px; }
        .da-icon-button { display: inline-grid; place-items: center; width: 29px; height: 28px; border: 0; border-radius: 6px; background: transparent; color: #a9bbce; cursor: pointer; transition: background .16s, color .16s, transform .16s; }
        .da-icon-button:hover { color: #fff; background: rgba(123, 165, 206, .14); }
        .da-icon-button:active { transform: scale(.94); }
        .da-date-input { border: 0; color: #e8eef5; background: transparent; width: 124px; text-align: center; outline: none; font-weight: 650 !important; font-size: 12px !important; }
        .da-date-input::-webkit-calendar-picker-indicator { opacity: .7; cursor: pointer; }
        .da-header-spacer { flex: 1; }
        .da-demo-pill { display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(71, 211, 161, .25); color: #90e5c5; background: rgba(28, 122, 94, .12); border-radius: 20px; padding: 6px 9px; font-size: 10px; white-space: nowrap; }
        .da-demo-dot { width: 6px; height: 6px; border-radius: 99px; background: var(--mint); box-shadow: 0 0 0 3px rgba(71, 211, 161, .1); }
        .da-actions { display: flex; gap: 6px; align-items: center; }
        .da-action { height: 31px; padding: 0 10px; display: inline-flex; gap: 6px; align-items: center; justify-content: center; border: 1px solid #294766; color: #b9c8d7; background: #0c2039; border-radius: 8px; font-size: 11px; cursor: pointer; transition: border-color .16s, background .16s, transform .16s; }
        .da-action:hover { background: #143252; border-color: #42698d; color: #fff; }
        .da-action:active { transform: translateY(1px); }
        .da-action.primary { background: linear-gradient(180deg, #f2ca64, #dba93c); color: #16243a; border-color: #f5d77f; font-weight: 700; }
        .da-action.primary:hover { background: #f6d37a; }
        .da-action.editing { border-color: rgba(71, 211, 161, .42); background: rgba(27, 112, 88, .2); color: #9ceacb; }
        .da-icon-only { width: 31px; padding: 0; }
        .da-notice { min-height: 20px; color: #8fd8b7; font-size: 10px; display: flex; align-items: center; justify-content: flex-end; opacity: .9; }
        .da-metrics { flex: 0 0 auto; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px; padding: 13px 0 12px; }
        .da-metric { min-width: 0; display: flex; gap: 10px; align-items: center; padding: 10px 11px; border: 1px solid rgba(79, 120, 163, .42); background: linear-gradient(140deg, rgba(17, 42, 71, .97), rgba(11, 30, 52, .92)); border-radius: 11px; box-shadow: inset 0 1px rgba(255,255,255,.025), 0 4px 12px rgba(0,0,0,.12); }
        .da-metric-icon { width: 33px; height: 33px; flex: 0 0 33px; display: grid; place-items: center; border-radius: 9px; background: rgba(89, 149, 207, .16); border: 1px solid rgba(113, 173, 224, .21); color: #9dc7ef; }
        .da-metric.gold .da-metric-icon { color: #f0ca61; background: rgba(219, 172, 65, .14); border-color: rgba(219, 172, 65, .22); }
        .da-metric.green .da-metric-icon { color: #66ddb4; background: rgba(52, 179, 137, .14); border-color: rgba(52, 179, 137, .22); }
        .da-metric.violet .da-metric-icon { color: #c29bff; background: rgba(139, 90, 206, .16); border-color: rgba(165, 123, 227, .23); }
        .da-metric.orange .da-metric-icon { color: #ffb45f; background: rgba(212, 119, 44, .16); border-color: rgba(232, 145, 73, .24); }
        .da-metric.red { border-color: rgba(173, 76, 88, .5); background: linear-gradient(140deg, rgba(68, 31, 49, .82), rgba(32, 27, 48, .88)); }
        .da-metric.red.good { border-color: rgba(52, 161, 121, .43); background: linear-gradient(140deg, rgba(19, 58, 60, .84), rgba(13, 38, 54, .9)); }
        .da-metric.red .da-metric-icon { color: #f58b93; background: rgba(213, 79, 92, .17); border-color: rgba(230, 105, 116, .24); }
        .da-metric.red.good .da-metric-icon { color: #72dfb6; background: rgba(47, 171, 128, .15); border-color: rgba(71, 211, 161, .24); }
        .da-metric-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .da-eyebrow { color: #9aacc0; font-size: 9px; font-weight: 600; letter-spacing: .28px; white-space: nowrap; }
        .da-metric strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: clamp(13px, 1.25vw, 16px); letter-spacing: -.2px; font-variant-numeric: tabular-nums; }
        .da-metric small { color: #7e92a9; font-size: 9px; }
        .da-metric.red strong { color: #ff9499; }
        .da-metric.red.good strong { color: #79e0b7; }
        .da-metric.gold strong { color: #f3cd68; }
        .da-workspace { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(300px, 1.08fr) minmax(300px, .95fr) minmax(350px, 1.16fr); gap: 10px; }
        .da-column { min-width: 0; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
        .da-card { min-width: 0; overflow: hidden; border: 1px solid rgba(78, 117, 158, .42); border-radius: 11px; background: linear-gradient(155deg, rgba(13, 32, 55, .97), rgba(9, 26, 47, .97)); box-shadow: inset 0 1px rgba(255,255,255,.025), 0 8px 22px rgba(1,9,20,.13); }
        .da-card.cash-card, .da-card.tx-card { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .da-card-head { min-height: 41px; display: flex; align-items: center; gap: 8px; padding: 0 12px; border-bottom: 1px solid rgba(104, 143, 182, .2); background: linear-gradient(90deg, rgba(19, 48, 79, .7), rgba(11, 32, 56, .44)); }
        .da-section-icon { color: var(--mint); display: inline-flex; align-items: center; justify-content: center; }
        .da-card-head h2 { font-size: 12px; margin: 0; font-weight: 700; letter-spacing: .15px; }
        .da-card-head .da-head-note { color: #7f96ae; font-size: 9px; margin-left: 1px; }
        .da-head-spacer { flex: 1; }
        .da-count { color: #93a9bf; font-size: 10px; }
        .da-subtle-button { display: inline-flex; align-items: center; gap: 5px; border: 1px solid rgba(108, 154, 199, .28); border-radius: 6px; padding: 4px 7px; background: rgba(36, 80, 123, .18); color: #9fc8ee; font-size: 9px; cursor: pointer; }
        .da-subtle-button:hover { background: rgba(43, 105, 163, .32); }
        .da-card-body { padding: 11px 12px; min-height: 0; }
        .da-cash-table { display: flex; flex-direction: column; min-height: 0; height: 100%; }
        .da-table-head, .da-denom-row { display: grid; grid-template-columns: minmax(72px, 1fr) minmax(100px, 1.05fr) minmax(75px, .9fr); align-items: center; gap: 7px; }
        .da-table-head { padding: 2px 8px 8px; color: #8299b2; font-size: 9px; border-bottom: 1px solid rgba(106, 143, 179, .17); }
        .da-table-head span:nth-child(2) { text-align: center; }
        .da-table-head span:last-child { text-align: right; }
        .da-denom-row { padding: 5px 7px; min-height: 37px; border-bottom: 1px solid rgba(104, 141, 177, .1); transition: background .15s; }
        .da-denom-row:hover { background: rgba(77, 127, 174, .08); }
        .da-denom-chip { display: inline-flex; align-items: center; width: max-content; max-width: 100%; border: 1px solid rgba(93, 136, 178, .24); border-radius: 6px; padding: 4px 7px; color: #d9e5ef; background: rgba(36, 69, 101, .47); font-size: 10px; font-weight: 700; }
        .da-denom-chip.coin-chip { color: #f0c65c; border-color: rgba(226, 185, 76, .28); }
        .da-count-control { display: flex; gap: 4px; align-items: center; }
        .da-stepper { width: 24px; height: 25px; display: grid; place-items: center; padding: 0; background: #112a46; color: #8fa8c1; border: 1px solid #294663; border-radius: 6px; cursor: pointer; }
        .da-stepper:hover:not(:disabled) { color: #fff; background: #1a3b5e; }
        .da-stepper:disabled { opacity: .33; cursor: not-allowed; }
        .da-input { color: #edf3f8; background: rgba(4, 17, 32, .66); border: 1px solid #2a4763; border-radius: 6px; outline: none; transition: border-color .15s, background .15s; }
        .da-input:focus { border-color: #d3ab4e; background: rgba(8, 25, 44, .95); }
        .da-count-input { width: 100%; min-width: 0; height: 25px; text-align: center; padding: 0 3px; font-variant-numeric: tabular-nums; }
        .da-count-input:disabled, .da-amount-input:disabled { color: #e7eef6; opacity: .86; background: rgba(26, 50, 74, .39); border-color: transparent; }
        .da-cash-result { text-align: right; color: #f0c65c; font-variant-numeric: tabular-nums; font-size: 10px; font-weight: 650; white-space: nowrap; }
        .da-cash-total { margin-top: auto; padding-top: 12px; }
        .da-total-band { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid rgba(62, 204, 151, .32); border-radius: 8px; background: linear-gradient(100deg, rgba(25, 103, 86, .25), rgba(15, 62, 61, .22)); }
        .da-total-band span { font-size: 11px; font-weight: 700; color: #67dfb5; }
        .da-total-band strong { color: #9af0d2; font: 700 16px "IBM Plex Mono", "Courier New", monospace; font-variant-numeric: tabular-nums; }
        .da-account-card { flex: 0 0 auto; min-height: 0; }
        .da-account-card .da-card-body { padding: 6px 11px 8px; }
        .da-account-card.wallet-card { flex: .79 1 auto; }
        .da-account-line { display: grid; grid-template-columns: minmax(0, 1fr) 125px; min-height: 32px; align-items: center; gap: 8px; border-bottom: 1px solid rgba(104, 141, 177, .1); }
        .da-account-name { display: flex; gap: 8px; align-items: center; min-width: 0; color: #d4dfeb; font-size: 10px; }
        .da-account-name > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .da-bank-glyph { width: 19px; height: 19px; flex: 0 0 19px; display: grid; place-items: center; border: 1px solid rgba(180, 199, 217, .2); border-radius: 5px; background: #183958; color: #d9ecfb; font-size: 8px; font-weight: 800; }
        .da-bank-glyph.coral { background: #713f36; color: #ffc096; }
        .da-bank-glyph.rose { background: #623542; color: #ffabc0; }
        .da-bank-glyph.amber { background: #69502f; color: #ffda8a; }
        .da-bank-glyph.mint { background: #235a53; color: #8ce5cb; }
        .da-bank-glyph.blue { background: #244b76; color: #a9d1ff; }
        .da-money-field { position: relative; min-width: 0; }
        .da-rupee { position: absolute; top: 50%; left: 7px; transform: translateY(-50%); color: #7d91a5; font-size: 9px; pointer-events: none; }
        .da-amount-input { width: 100%; height: 25px; padding: 0 7px 0 18px; text-align: right; font-size: 10px !important; font-variant-numeric: tabular-nums; }
        .da-section-total { display: flex; justify-content: space-between; align-items: center; padding: 8px 2px 1px; }
        .da-section-total span { color: #87a4c1; font-size: 10px; font-weight: 650; }
        .da-section-total strong { color: #9dc8f0; font: 700 12px "IBM Plex Mono", "Courier New", monospace; }
        .wallet-card .da-section-total span, .wallet-card .da-section-total strong { color: #c6a3fa; }
        .da-opening { flex: 0 0 auto; }
        .da-opening .da-card-head { min-height: 36px; }
        .da-opening .da-card-body { padding: 10px 12px; }
        .da-opening-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .da-opening-title { display: flex; align-items: center; gap: 7px; color: #e8d292; font-size: 10px; font-weight: 700; }
        .da-opening-title small { color: #8498ae; font-size: 9px; font-weight: 400; }
        .da-open-input { max-width: 142px; height: 29px; padding: 0 8px 0 20px; font-size: 12px !important; font-weight: 700; color: #f1cb65; }
        .da-mid-total { flex: 0 0 auto; padding: 9px 11px; border: 1px solid rgba(228, 188, 82, .33); border-radius: 9px; background: linear-gradient(115deg, rgba(105, 81, 36, .27), rgba(38, 43, 47, .3)); }
        .da-mid-components { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 7px; }
        .da-mid-components > div { text-align: center; border-right: 1px solid rgba(181, 160, 107, .16); }
        .da-mid-components > div:last-child { border: 0; }
        .da-mid-components span { display: block; font-size: 9px; color: #89a0b7; margin-bottom: 3px; }
        .da-mid-components strong { font: 600 10px "IBM Plex Mono", "Courier New", monospace; color: #dce6ed; }
        .da-system-line { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(228, 188, 82, .2); padding-top: 7px; }
        .da-system-line span { display: flex; align-items: center; gap: 6px; color: #efca62; font-size: 10px; font-weight: 700; }
        .da-system-line strong { color: #f3ce65; font: 700 16px "IBM Plex Mono", "Courier New", monospace; font-variant-numeric: tabular-nums; }
        .da-transactions-head { gap: 8px; }
        .da-tx-totals { display: flex; align-items: center; gap: 8px; font: 600 10px "IBM Plex Mono", "Courier New", monospace; white-space: nowrap; }
        .da-income { color: #5ed5aa; }
        .da-expense { color: #f07b82; }
        .da-tx-tools { display: flex; gap: 6px; padding: 10px 11px 8px; border-bottom: 1px solid rgba(104, 141, 177, .12); }
        .da-search-wrap { position: relative; flex: 1; min-width: 105px; }
        .da-search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #7890a8; pointer-events: none; }
        .da-search { width: 100%; height: 30px; padding: 0 9px 0 29px; font-size: 10px !important; }
        .da-add-open { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 9px; border: 1px solid rgba(230, 155, 77, .37); border-radius: 7px; color: #ffc07b; background: rgba(163, 93, 37, .17); font-size: 10px; cursor: pointer; }
        .da-add-open:hover { background: rgba(190, 111, 43, .28); }
        .da-form { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 11px; background: rgba(7, 21, 37, .58); border-bottom: 1px solid rgba(104, 141, 177, .12); }
        .da-form-type { display: flex; gap: 4px; }
        .da-type-button { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 8px; border: 1px solid #294561; border-radius: 6px; color: #9aacc0; background: #10243c; font-size: 9px; cursor: pointer; }
        .da-type-button.active-income { color: #69dcaf; border-color: rgba(71,211,161,.43); background: rgba(35,131,98,.2); }
        .da-type-button.active-expense { color: #ff9195; border-color: rgba(232,105,116,.43); background: rgba(137,53,66,.22); }
        .da-tx-amount { width: 103px; height: 28px; padding: 0 8px; font-size: 10px !important; }
        .da-tx-note { flex: 1 1 95px; min-width: 75px; height: 28px; padding: 0 8px; font-size: 10px !important; }
        .da-submit-tx { width: 29px; height: 28px; display: grid; place-items: center; border: 1px solid rgba(239, 162, 78, .45); border-radius: 6px; color: #ffc078; background: rgba(162, 91, 36, .22); cursor: pointer; }
        .da-submit-tx:hover:not(:disabled) { background: rgba(196, 116, 47, .38); }
        .da-submit-tx:disabled { opacity: .38; cursor: not-allowed; }
        .da-form-error { flex: 1 0 100%; color: #ff9a9e; font-size: 9px; padding-left: 2px; }
        .da-locked-hint { padding: 8px 11px; display: flex; align-items: center; gap: 7px; border-bottom: 1px solid rgba(104,141,177,.12); color: #8296aa; font-size: 9px; }
        .da-tx-list { flex: 1; min-height: 100px; overflow-y: auto; padding: 6px 8px; scrollbar-color: #31516f transparent; scrollbar-width: thin; }
        .da-tx-row { display: flex; align-items: center; gap: 9px; min-height: 49px; padding: 6px 8px; border-bottom: 1px solid rgba(99, 135, 170, .13); border-radius: 6px; transition: background .15s; }
        .da-tx-row:hover { background: rgba(47, 83, 117, .17); }
        .da-tx-symbol { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; color: #9ab5cf; border: 1px solid rgba(107, 150, 190, .23); background: rgba(53, 93, 132, .26); border-radius: 8px; }
        .da-tx-symbol.income { color: #7de3be; border-color: rgba(71, 211, 161, .23); background: rgba(42, 135, 104, .18); }
        .da-tx-symbol.expense { color: #ff9ca1; border-color: rgba(220, 103, 113, .24); background: rgba(136, 58, 69, .2); }
        .da-tx-meta { flex: 1; min-width: 0; }
        .da-tx-meta strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #e0e9f1; font-size: 10px; font-weight: 600; }
        .da-tx-meta span { display: block; color: #7d92a8; font-size: 9px; margin-top: 3px; }
        .da-tx-value { font: 700 10px "IBM Plex Mono", "Courier New", monospace; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .da-delete { border: 0; width: 25px; height: 25px; display: grid; place-items: center; border-radius: 5px; background: transparent; color: #7489a0; cursor: pointer; }
        .da-delete:hover { color: #ff9298; background: rgba(175, 58, 68, .18); }
        .da-empty { min-height: 110px; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 6px; color: #8aa0b6; text-align: center; }
        .da-empty strong { color: #c3d0de; font-size: 10px; }
        .da-empty span { color: #7890a8; font-size: 9px; }
        .da-reconcile { flex: 0 0 auto; overflow: hidden; border: 1px solid rgba(77, 117, 159, .43); border-radius: 10px; background: linear-gradient(150deg, rgba(13, 32, 55, .96), rgba(9, 25, 45, .96)); }
        .da-reconcile-title { display: flex; gap: 7px; align-items: center; padding: 8px 11px; color: #dce7f1; font-size: 10px; font-weight: 700; border-bottom: 1px solid rgba(104,141,177,.14); }
        .da-reconcile-title svg { color: #edc95d; }
        .da-reconcile-values { display: grid; grid-template-columns: 1fr 1fr; }
        .da-reconcile-value { padding: 8px 11px; }
        .da-reconcile-value + .da-reconcile-value { border-left: 1px solid rgba(104,141,177,.16); }
        .da-reconcile-value span { display: block; color: #91a3b6; font-size: 9px; margin-bottom: 3px; }
        .da-reconcile-value strong { display: block; font: 700 13px "IBM Plex Mono", "Courier New", monospace; font-variant-numeric: tabular-nums; }
        .da-reconcile-value small { display: block; color: #71859a; font-size: 8px; margin-top: 3px; }
        .da-difference { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 11px; background: rgba(151, 55, 65, .16); border-top: 1px solid rgba(213, 94, 103, .17); }
        .da-difference.good { background: rgba(25, 118, 87, .18); border-color: rgba(74, 204, 155, .18); }
        .da-diff-label { color: #8fa2b5; font-size: 9px; }
        .da-diff-amount { color: #ff9298; display: block; font: 700 15px "IBM Plex Mono", "Courier New", monospace; margin-top: 2px; font-variant-numeric: tabular-nums; }
        .da-difference.good .da-diff-amount { color: #7de0b8; }
        .da-status { display: inline-flex; align-items: center; gap: 5px; border: 1px solid rgba(232, 105, 116, .35); border-radius: 6px; padding: 5px 7px; color: #ff9ba0; font-size: 9px; font-weight: 750; letter-spacing: .35px; white-space: nowrap; }
        .da-difference.good .da-status { color: #7de0b8; border-color: rgba(74, 204, 155, .34); }
        @media (min-width: 1400px) {
          .da-shell { padding-left: 22px; padding-right: 22px; }
          .da-workspace { gap: 12px; }
          .da-column { gap: 12px; }
          .da-denom-row { min-height: 40px; }
          .da-account-line { min-height: 34px; }
          .da-tx-row { min-height: 53px; }
        }
        @media (max-height: 800px) and (min-width: 1121px) {
          .da-opening .da-card-head, .da-account-card .da-card-head { min-height: 32px; }
          .da-opening .da-card-body { padding: 6px 10px; }
          .da-open-input { height: 25px; }
          .da-account-card .da-card-body { padding: 4px 9px 5px; }
          .da-account-line { min-height: 24px; }
          .da-amount-input { height: 21px; }
          .da-section-total { padding-top: 4px; }
          .da-mid-total { padding: 7px 9px; }
          .da-mid-components { margin-bottom: 4px; }
          .da-system-line { padding-top: 5px; }
        }
        @media (max-width: 1120px) {
          .da-redesign { height: auto; min-height: 100dvh; overflow: auto; }
          .da-shell { height: auto; min-height: 100dvh; padding-bottom: 20px; }
          .da-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .da-workspace { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 900px; }
          .da-column:last-child { grid-column: 1 / -1; min-height: 560px; }
          .da-column:nth-child(2) { min-height: 620px; }
          .da-column:first-child { min-height: 620px; }
          .da-card.cash-card { min-height: 620px; }
        }
        @media (max-width: 700px) {
          .da-shell { padding: 0 10px 14px; }
          .da-header { flex-wrap: wrap; gap: 8px; padding: 9px 0; }
          .da-brand { flex: 1; }
          .da-brand-kicker, .da-demo-pill { display: none; }
          .da-date-nav { order: 3; }
          .da-header-spacer { display: none; }
          .da-actions { margin-left: auto; gap: 4px; }
          .da-action { width: 31px; padding: 0; font-size: 0; gap: 0; }
          .da-action svg { width: 14px; height: 14px; }
          .da-action.editing { width: auto; padding: 0 8px; font-size: 10px; gap: 5px; }
          .da-action.editing svg { width: 12px; height: 12px; }
          .da-notice { order: 4; min-height: 0; width: 100%; justify-content: flex-start; }
          .da-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 10px 0; }
          .da-metric { padding: 8px; gap: 8px; border-radius: 9px; }
          .da-metric-icon { width: 29px; height: 29px; flex-basis: 29px; }
          .da-metric strong { font-size: 12px; }
          .da-eyebrow { font-size: 8px; }
          .da-workspace { display: flex; flex-direction: column; min-height: 0; gap: 9px; }
          .da-column { gap: 9px; }
          .da-column:first-child { min-height: 0; }
          .da-card.cash-card { min-height: 0; }
          .da-cash-table { height: auto; }
          .da-denom-row { grid-template-columns: minmax(74px, 1fr) minmax(98px, .9fr) minmax(70px, .9fr); }
          .da-table-head { grid-template-columns: minmax(74px, 1fr) minmax(98px, .9fr) minmax(70px, .9fr); }
          .da-table-head span:nth-child(2) { text-align: left; }
          .da-cash-total { padding-top: 10px; }
          .da-column:nth-child(2) { min-height: 0; }
          .da-account-card, .da-account-card.wallet-card { flex: initial; min-height: 0; }
          .da-account-line { min-height: 35px; grid-template-columns: minmax(0, 1fr) minmax(130px, 42%); }
          .da-opening .da-card-body { padding: 9px 10px; }
          .da-mid-total { padding: 10px; }
          .da-column:last-child { grid-column: auto; min-height: 0; }
          .da-card.tx-card { min-height: 390px; flex: initial; }
          .da-tx-list { min-height: 130px; }
          .da-tx-totals { font-size: 9px; gap: 5px; }
          .da-card-head { padding: 0 10px; }
        }
        @media print {
          .da-redesign { height: auto; min-height: 0; overflow: visible; background: #fff; color: #17283b; }
          .da-shell { height: auto; padding: 0; }
          .da-header, .da-metrics, .da-card, .da-reconcile, .da-mid-total { break-inside: avoid; }
          .da-workspace { min-height: 0; }
          .da-actions, .da-notice, .da-form, .da-add-open, .da-delete, .da-stepper { display: none !important; }
        }
      `}</style>
      <div className="da-shell">
        <header className="da-header">
          <div className="da-brand">
            <div className="da-brand-mark"><Banknote size={17} /></div>
            <div>
              <div className="da-brand-title">Daily Reconciliation</div>
              <span className="da-brand-kicker">Office close · {dateLabel}</span>
            </div>
          </div>
          <div className="da-date-nav" aria-label="Choose reconciliation date">
            <button className="da-icon-button" onClick={() => shiftDate(-1)} aria-label="Previous day"><ChevronLeft size={16} /></button>
            <CalendarDays size={14} color="#a8bfd6" />
            <input className="da-date-input" type="date" value={date} onChange={(event) => chooseDate(event.target.value)} aria-label="Reconciliation date" />
            <button className="da-icon-button" onClick={() => shiftDate(1)} aria-label="Next day"><ChevronRight size={16} /></button>
          </div>
          <span className="da-demo-pill"><i className="da-demo-dot" />Local demo · {date === DEMO_DATE ? "sample day" : "new day"}</span>
          <div className="da-header-spacer" />
          <div className="da-notice" role="status">{notice}</div>
          <div className="da-actions">
            <button className="da-action da-icon-only" onClick={resetDemo} title="Restore sample data" aria-label="Restore sample data"><RefreshCw size={13} /></button>
            <button className={`da-action ${editing ? "editing" : ""}`} onClick={() => { setEditing((current) => !current); setNotice(editing ? "Editing locked" : "Editing enabled"); }}>
              {editing ? <><Unlock size={12} /> Editing</> : <><LockKeyhole size={12} /> Edit</>}
            </button>
            <button className="da-action da-icon-only" onClick={() => window.print()} title="Print reconciliation" aria-label="Print reconciliation"><Printer size={13} /></button>
            <button className="da-action primary" onClick={exportCsv} title="Export as CSV"><Download size={13} /> Export</button>
          </div>
        </header>

        <section className="da-metrics" aria-label="Daily balance summary">
          <Metric label="Opening balance" value={`₹${money(fields.openingBalance)}`} icon={<WalletCards size={17} />} tone="gold" sub="Carry-in" />
          <Metric label="Cash total" value={`₹${money(cashTotal)}`} icon={<Banknote size={17} />} tone="green" sub="Counted notes + coins" />
          <Metric label="Bank total" value={`₹${money(bankTotal)}`} icon={<Landmark size={17} />} tone="blue" sub="6 accounts" />
          <Metric label="AEPS wallet" value={`₹${money(aepsTotal)}`} icon={<WalletCards size={17} />} tone="violet" sub="4 sources" />
          <Metric label="Expected balance" value={`₹${money(expectedBalance)}`} icon={<CircleCheck size={17} />} tone="orange" sub="Opening + net transactions" />
          <Metric label="Difference" value={`${difference >= 0 ? "+" : "−"}₹${money(Math.abs(difference))}`} icon={balanced ? <Check size={18} /> : <AlertTriangle size={17} />} tone={`red ${balanced ? "good" : ""}`} sub={balanced ? "Accounts agree" : "Needs review"} />
        </section>

        <main className="da-workspace">
          <section className="da-column">
            <article className="da-card cash-card">
              <div className="da-card-head">
                <span className="da-section-icon"><Banknote size={17} /></span>
                <h2>Cash counting</h2>
                <span className="da-head-note">Denomination count for today</span>
                <span className="da-head-spacer" />
                {editing && <button className="da-subtle-button" onClick={() => {
                  const cleared = { ...fields, notes10: 0, notes20: 0, notes50: 0, notes100: 0, notes200: 0, notes500: 0, coins: 0 };
                  setRecords((current) => ({ ...current, [date]: { ...record, fields: cleared } }));
                  setNotice("Cash counts cleared");
                }}><X size={11} /> Clear counts</button>}
              </div>
              <div className="da-card-body da-cash-table">
                <div className="da-table-head">
                  <span>Denomination</span><span>Count</span><span>Amount</span>
                </div>
                {denominations.map((denom) => {
                  const key = `notes${denom}` as FieldKey;
                  const count = fields[key];
                  return (
                    <div className="da-denom-row" key={denom}>
                      <span className="da-denom-chip">₹{denom}</span>
                      <div className="da-count-control">
                        <button className="da-stepper" disabled={!editing || count <= 0} onClick={() => updateField(key, count - 1)} aria-label={`Remove one ₹${denom} note`}>−</button>
                        <input className="da-input da-count-input" type="number" min="0" value={count || ""} disabled={!editing} onChange={(event) => updateField(key, parseAmount(event.target.value))} aria-label={`${denom} rupee note count`} />
                        <button className="da-stepper" disabled={!editing} onClick={() => updateField(key, count + 1)} aria-label={`Add one ₹${denom} note`}>+</button>
                      </div>
                      <span className="da-cash-result">₹{money(count * denom)}</span>
                    </div>
                  );
                })}
                <div className="da-denom-row">
                  <span className="da-denom-chip coin-chip">Coins</span>
                  <div className="da-count-control">
                    <span className="da-stepper" aria-hidden="true" style={{ cursor: "default" }}>₹</span>
                    <input className="da-input da-count-input" type="number" min="0" value={fields.coins || ""} disabled={!editing} onChange={(event) => updateField("coins", parseAmount(event.target.value))} aria-label="Coin value" />
                    <span className="da-stepper" aria-hidden="true" style={{ cursor: "default" }}>·</span>
                  </div>
                  <span className="da-cash-result">₹{money(fields.coins)}</span>
                </div>
                <div className="da-cash-total">
                  <div className="da-total-band"><span>Cash total</span><strong>₹{money(cashTotal)}</strong></div>
                </div>
              </div>
            </article>
          </section>

          <section className="da-column">
            <article className="da-card da-opening">
              <div className="da-card-head">
                <span className="da-section-icon" style={{ color: "#e6bd56" }}><WalletCards size={15} /></span>
                <h2>Opening balance</h2>
                <span className="da-head-spacer" />
                <span className="da-count">Carry forward</span>
              </div>
              <div className="da-card-body">
                <div className="da-opening-line">
                  <div className="da-opening-title"><span>₹</span><small>Starting funds</small></div>
                  <div className="da-money-field">
                    <span className="da-rupee">₹</span>
                    <input className="da-input da-amount-input da-open-input" type="number" min="0" value={fields.openingBalance || ""} disabled={!editing} onChange={(event) => updateField("openingBalance", parseAmount(event.target.value))} aria-label="Opening balance" />
                  </div>
                </div>
              </div>
            </article>

            <article className="da-card da-account-card">
              <div className="da-card-head">
                <span className="da-section-icon" style={{ color: "#7db6ea" }}><Landmark size={16} /></span>
                <h2>Bank balances</h2>
                <span className="da-head-spacer" />
                <span className="da-count">6 accounts</span>
              </div>
              <div className="da-card-body">
                {bankAccounts.map((account) => (
                  <div className="da-account-line" key={account.key}>
                    <div className="da-account-name"><span className={`da-bank-glyph ${account.color}`}>{account.short}</span><span>{account.label}</span></div>
                    <div className="da-money-field"><span className="da-rupee">₹</span><input className="da-input da-amount-input" type="number" min="0" value={fields[account.key] || ""} disabled={!editing} onChange={(event) => updateField(account.key, parseAmount(event.target.value))} aria-label={`${account.label} balance`} /></div>
                  </div>
                ))}
                <div className="da-section-total"><span>Bank total</span><strong>₹{money(bankTotal)}</strong></div>
              </div>
            </article>

            <article className="da-card da-account-card wallet-card">
              <div className="da-card-head">
                <span className="da-section-icon" style={{ color: "#c09af2" }}><WalletCards size={16} /></span>
                <h2>AEPS wallet</h2>
                <span className="da-head-spacer" />
                <span className="da-count">4 sources</span>
              </div>
              <div className="da-card-body">
                {walletAccounts.map((account) => (
                  <div className="da-account-line" key={account.key}>
                    <div className="da-account-name"><span className={`da-bank-glyph ${account.color}`}>{account.short}</span><span>{account.label}</span></div>
                    <div className="da-money-field"><span className="da-rupee">₹</span><input className="da-input da-amount-input" type="number" min="0" value={fields[account.key] || ""} disabled={!editing} onChange={(event) => updateField(account.key, parseAmount(event.target.value))} aria-label={`${account.label} AEPS balance`} /></div>
                  </div>
                ))}
                <div className="da-section-total"><span>AEPS total</span><strong>₹{money(aepsTotal)}</strong></div>
              </div>
            </article>

            <div className="da-mid-total">
              <div className="da-mid-components">
                <div><span>Cash</span><strong>₹{money(cashTotal)}</strong></div>
                <div><span>Banks</span><strong>₹{money(bankTotal)}</strong></div>
                <div><span>AEPS</span><strong>₹{money(aepsTotal)}</strong></div>
              </div>
              <div className="da-system-line"><span><Landmark size={14} /> System balance</span><strong>₹{money(systemBalance)}</strong></div>
            </div>
          </section>

          <section className="da-column">
            <article className="da-card tx-card">
              <div className="da-card-head da-transactions-head">
                <span className="da-section-icon" style={{ color: "#75dfbd" }}><ArrowUpRight size={17} /></span>
                <h2>Transactions</h2>
                <span className="da-head-spacer" />
                <div className="da-tx-totals"><span className="da-income">+₹{money(incomeTotal)}</span><span style={{ color: "#657e96" }}>·</span><span className="da-expense">−₹{money(expenseTotal)}</span></div>
              </div>
              <div className="da-tx-tools">
                <div className="da-search-wrap"><Search size={13} className="da-search-icon" /><input className="da-input da-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search description or amount…" aria-label="Search transactions" /></div>
                {editing && <button className="da-add-open" onClick={() => { setFormError(""); document.getElementById("da-new-tx-amount")?.focus(); }}><Plus size={13} /> Add</button>}
              </div>
              {editing ? (
                <form className="da-form" onSubmit={(event) => { event.preventDefault(); addTransaction(); }}>
                  <div className="da-form-type">
                    <button type="button" className={`da-type-button ${txType === "income" ? "active-income" : ""}`} onClick={() => setTxType("income")}><ArrowDownLeft size={12} /> Income</button>
                    <button type="button" className={`da-type-button ${txType === "expense" ? "active-expense" : ""}`} onClick={() => setTxType("expense")}><ArrowUpRight size={12} /> Expense</button>
                  </div>
                  <input id="da-new-tx-amount" className="da-input da-tx-amount" inputMode="decimal" type="number" min="0.01" step="0.01" value={txAmount} onChange={(event) => setTxAmount(event.target.value)} placeholder="₹ Amount" aria-label="Transaction amount" />
                  <input className="da-input da-tx-note" value={txNote} onChange={(event) => setTxNote(event.target.value)} placeholder="Description" aria-label="Transaction description" />
                  <button className="da-submit-tx" type="submit" disabled={!txAmount || !txNote.trim()} aria-label="Add transaction"><Plus size={15} /></button>
                  {formError && <span className="da-form-error">{formError}</span>}
                </form>
              ) : (
                <div className="da-locked-hint"><LockKeyhole size={12} /> Unlock editing to add or remove transactions</div>
              )}
              <div className="da-tx-list">
                {filteredTransactions.length ? filteredTransactions.map((tx) => (
                  <div className="da-tx-row" key={tx.id}>
                    <div className={`da-tx-symbol ${tx.type}`}>{tx.type === "income" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}</div>
                    <div className="da-tx-meta"><strong>{tx.note}</strong><span>{new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {tx.type === "income" ? "Money in" : "Money out"}</span></div>
                    <span className={`da-tx-value ${tx.type === "income" ? "da-income" : "da-expense"}`}>{tx.type === "income" ? "+" : "−"}₹{money(tx.amount)}</span>
                    {editing && <button className="da-delete" onClick={() => deleteTransaction(tx.id)} aria-label={`Remove ${tx.note}`}><Trash2 size={13} /></button>}
                  </div>
                )) : (
                  <div className="da-empty">
                    <Search size={17} />
                    <strong>{search ? "No matching transactions" : "No transactions for this date"}</strong>
                    <span>{search ? "Try a different description or amount." : editing ? "Add the first income or expense above." : "Unlock editing when you are ready to record activity."}</span>
                  </div>
                )}
              </div>
            </article>

            <article className="da-reconcile">
              <div className="da-reconcile-title"><CircleCheck size={14} /> Reconciliation</div>
              <div className="da-reconcile-values">
                <div className="da-reconcile-value"><span>Expected balance</span><strong>₹{money(expectedBalance)}</strong><small>Opening + income − expense</small></div>
                <div className="da-reconcile-value"><span>System balance</span><strong style={{ color: "#efca62" }}>₹{money(systemBalance)}</strong><small>Cash + banks + AEPS</small></div>
              </div>
              <div className={`da-difference ${balanced ? "good" : ""}`}>
                <div><span className="da-diff-label">Difference</span><strong className="da-diff-amount">{difference >= 0 ? "+" : "−"}₹{money(Math.abs(difference))}</strong></div>
                <span className="da-status">{balanced ? <Check size={12} /> : <AlertTriangle size={12} />}{balanced ? "BALANCED" : "MISMATCH"}</span>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}