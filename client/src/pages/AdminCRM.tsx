import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CrmClient, CrmWork, CrmPayment, CrmExpense } from "@shared/schema";

const LS_KEY = "crm_auth";
const WORK_TYPES = ["Album", "Shoot", "Editing", "Other"];
const WORK_STAGES = ["Shoot Done", "Editing", "Album Designing", "Ready", "Delivered"];
const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"];
const EXPENSE_CATEGORIES = ["Studio Expense", "Album Printing", "Travel", "Electricity", "Internet", "Cyber Cafe Supplies", "Other"];

// ─── Utility ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function thisMonthStr() {
  return new Date().toISOString().slice(0, 7);
}
function daysUntil(ds: string | null | undefined): number | null {
  if (!ds) return null;
  try {
    const d = new Date(ds);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const yr = now.getFullYear();
    let next = new Date(yr, d.getMonth(), d.getDate());
    next.setHours(0, 0, 0, 0);
    if (next < now) next = new Date(yr + 1, d.getMonth(), d.getDate());
    return Math.round((next.getTime() - now.getTime()) / 86400000);
  } catch { return null; }
}
function fmtDate(ds: string | null | undefined) {
  if (!ds) return "—";
  try { return new Date(ds).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ds; }
}
function fmtCur(n: number | null | undefined) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function waLink(phone: string, msg: string) {
  const num = phone.replace(/\D/g, "");
  const p = num.startsWith("91") ? num : `91${num}`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}
function safeName(name: string | null | undefined) {
  const n = (name || "").trim();
  return n.length > 0 ? n : "Dear Client";
}
function birthdayMsg(name: string | null | undefined) {
  return `🎉Happy Birthday ${safeName(name)}! 
Wishing you success, happiness & a great year ahead.
Thanks for your trust! 🙏 
From: Dream Pictures`;
}
function anniversaryMsg(name: string | null | undefined) {
  return `💐Happy Anniversary ${safeName(name)}! 
Wishing you love, joy & many beautiful years together.
Thanks for your trust! 🙏 
From: Dream Pictures`;
}
function dlCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: filename });
  a.click();
}

function getWorkBalance(work: CrmWork, payments: CrmPayment[]): number {
  const linked = payments.filter(p => p.workId === work.id).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, work.totalPrice - work.advancePaid - linked);
}

function thisWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function exportClients(clients: CrmClient[]) {
  dlCSV(
    [["Client Name", "Phone Number", "Date of Birth", "Marriage Anniversary", "Address", "Notes"],
    ...clients.map(c => [c.name, c.phone, c.dob || "", c.anniversary || "", c.address || "", c.notes || ""])],
    "clients_export.csv"
  );
}

function exportWorkHistory(works: CrmWork[]) {
  const done = works.filter(w => w.status === "done");
  dlCSV(
    [["Client Name", "Work Description", "Total Price", "Advance Paid", "Balance", "Completion Date"],
    ...done.map(w => [w.clientName, w.description, w.totalPrice, w.advancePaid, w.totalPrice - w.advancePaid, w.workDate])],
    "work_history_export.csv"
  );
}

function exportPayments(payments: CrmPayment[]) {
  dlCSV(
    [["Client Name", "Payment Amount", "Payment Date", "Payment Method", "Notes"],
    ...payments.map(p => [p.clientName, p.amount, p.paymentDate, p.paymentMethod, p.notes || ""])],
    "payments_export.csv"
  );
}

function exportIncomeReport(payments: CrmPayment[], expenses: CrmExpense[]) {
  const dates = new Set([...payments.map(p => p.paymentDate), ...expenses.map(e => e.date)]);
  const rows = Array.from(dates).sort().map(date => {
    const inc = payments.filter(p => p.paymentDate === date).reduce((s, p) => s + p.amount, 0);
    const exp = expenses.filter(e => e.date === date).reduce((s, e) => s + e.amount, 0);
    return [date, inc, exp, inc - exp];
  });
  dlCSV(
    [["Date", "Income (₹)", "Expenses (₹)", "Net Profit (₹)"], ...rows],
    "income_report.csv"
  );
}

function exportExpenses(expenses: CrmExpense[]) {
  dlCSV(
    [["Date", "Category", "Description", "Amount (₹)", "Payment Method", "Notes"],
    ...expenses.map(e => [e.date, e.category, e.description, e.amount, e.paymentMethod, e.notes || ""])],
    "expenses_export.csv"
  );
}

function exportAllData(clients: CrmClient[], works: CrmWork[], payments: CrmPayment[], expenses: CrmExpense[]) {
  setTimeout(() => exportClients(clients), 0);
  setTimeout(() => exportWorkHistory(works), 300);
  setTimeout(() => exportPayments(payments), 600);
  setTimeout(() => exportExpenses(expenses), 900);
}

// ─── Input Helpers ──────────────────────────────────────────────────────────

const inp = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors";
const sel = inp;
const lbl = "block text-zinc-400 text-xs uppercase tracking-wider mb-1";
const btn = (color: string) => `${color} text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50`;

// ─── Date Filter ─────────────────────────────────────────────────────────────

type DatePreset = "all" | "today" | "week" | "month" | "custom";
interface DateFilterState { preset: DatePreset; from: string; to: string; }
function useDateFilter(): [DateFilterState, (s: DateFilterState) => void] {
  const [f, setF] = useState<DateFilterState>({ preset: "all", from: "", to: "" });
  return [f, setF];
}
function applyDateFilter<T>(items: T[], getDate: (item: T) => string, f: DateFilterState): T[] {
  if (f.preset === "all") return items;
  const today = todayStr();
  const weekStart = thisWeekStart();
  const month = thisMonthStr();
  return items.filter(item => {
    const d = getDate(item);
    if (f.preset === "today") return d === today;
    if (f.preset === "week") return d >= weekStart && d <= today;
    if (f.preset === "month") return d.startsWith(month);
    if (f.preset === "custom") return (!f.from || d >= f.from) && (!f.to || d <= f.to);
    return true;
  });
}
function DateFilter({ value, onChange, label }: { value: DateFilterState; onChange: (s: DateFilterState) => void; label?: string }) {
  const presets: { id: DatePreset; label: string }[] = [
    { id: "all", label: "All" }, { id: "today", label: "Today" },
    { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "custom", label: "Custom" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {label && <span className="text-zinc-500 text-xs uppercase tracking-wider">{label}:</span>}
      {presets.map(p => (
        <button key={p.id} onClick={() => onChange({ ...value, preset: p.id })}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${value.preset === p.id ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
          {p.label}
        </button>
      ))}
      {value.preset === "custom" && (
        <>
          <input type="date" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500" />
          <span className="text-zinc-600 text-xs">to</span>
          <input type="date" value={value.to} onChange={e => onChange({ ...value, to: e.target.value })} className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500" />
        </>
      )}
    </div>
  );
}

// ─── Quick Payment Modal ──────────────────────────────────────────────────────

function QuickPaymentModal({ work, balance, onSave, onClose, saving }: {
  work: CrmWork; balance: number;
  onSave: (d: any) => void; onClose: () => void; saving: boolean;
}) {
  const [amount, setAmount] = useState(balance.toString());
  const [date, setDate] = useState(todayStr());
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const numAmount = parseFloat(amount) || 0;

  function submit() {
    if (!amount || numAmount <= 0) { setErr("Enter a valid amount"); return; }
    if (numAmount > balance + 0.01) { setErr(`Max allowed: ${fmtCur(balance)}`); return; }
    onSave({ workId: work.id, clientId: work.clientId, clientName: work.clientName, amount: numAmount, paymentDate: date, paymentMethod: method, notes });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold mb-1">Record Payment</h3>
        <p className="text-zinc-400 text-sm mb-4">{work.clientName} · {work.description}</p>
        <div className="space-y-3">
          <div>
            <label className={lbl}>Amount (₹) * <span className="text-zinc-600 normal-case">max {fmtCur(balance)}</span></label>
            <input data-testid="input-quickpay-amount" type="number" min="1" max={balance} className={inp} value={amount} onChange={e => { setAmount(e.target.value); setErr(""); }} />
          </div>
          <div>
            <label className={lbl}>Date *</label>
            <input data-testid="input-quickpay-date" type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Method</label>
            <select data-testid="select-quickpay-method" className={sel} value={method} onChange={e => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          {numAmount >= balance - 0.01 && balance > 0 && (
            <div className="bg-green-950/40 border border-green-800/40 rounded-lg px-3 py-2 text-green-400 text-xs">
              Full balance paid — work will be marked as Done automatically
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button data-testid="button-confirm-quickpay" onClick={submit} disabled={saving} className={btn("bg-green-700 hover:bg-green-600 flex-1")}>{saving ? "Saving…" : "Confirm Payment"}</button>
          <button onClick={onClose} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
      if (r.ok) { localStorage.setItem(LS_KEY, "true"); onLogin(); }
      else setErr("Invalid admin credentials");
    } catch { setErr("Connection error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-amber-500 text-2xl font-bold tracking-widest">DREAM PICTURES</div>
          <div className="text-zinc-500 text-sm mt-1">CRM Admin Access</div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className={lbl}>Username</label><input data-testid="input-crm-username" className={inp} value={u} onChange={e => setU(e.target.value)} required /></div>
          <div><label className={lbl}>Password</label><input data-testid="input-crm-password" type="password" className={inp} value={p} onChange={e => setP(e.target.value)} required /></div>
          {err && <p className="text-red-400 text-sm text-center">{err}</p>}
          <button data-testid="button-crm-login" type="submit" disabled={loading} className={`w-full ${btn("bg-amber-600 hover:bg-amber-500")}`}>{loading ? "Verifying..." : "Login"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Client Form ─────────────────────────────────────────────────────────────

function ClientForm({ init, existingClients, onSave, onCancel, saving }: { init?: CrmClient | null; existingClients?: CrmClient[]; onSave: (d: any) => void; onCancel: () => void; saving: boolean }) {
  const [f, setF] = useState({ name: init?.name || "", phone: init?.phone || "", address: init?.address || "", dob: init?.dob || "", anniversary: init?.anniversary || "", notes: init?.notes || "" });
  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const phoneConflict = !init && existingClients?.find(c => c.phone.replace(/\D/g, "") === f.phone.replace(/\D/g, "") && f.phone.length > 5);
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-4">
      <h3 className="text-white font-semibold mb-4 text-sm">{init ? "Edit Client" : "New Client"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={lbl}>Name *</label><input data-testid="input-client-name" className={inp} value={f.name} onChange={e => s("name", e.target.value)} /></div>
        <div>
          <label className={lbl}>Phone *</label>
          <input data-testid="input-client-phone" className={inp + (phoneConflict ? " border-red-500" : "")} value={f.phone} onChange={e => s("phone", e.target.value)} />
          {phoneConflict && <p className="text-red-400 text-xs mt-1">Phone already used by: {phoneConflict.name}</p>}
        </div>
        <div className="sm:col-span-2"><label className={lbl}>Address</label><input data-testid="input-client-address" className={inp} value={f.address} onChange={e => s("address", e.target.value)} /></div>
        <div><label className={lbl}>Date of Birth</label><input data-testid="input-client-dob" type="date" className={inp} value={f.dob} onChange={e => s("dob", e.target.value)} /></div>
        <div><label className={lbl}>Anniversary</label><input data-testid="input-client-anniversary" type="date" className={inp} value={f.anniversary} onChange={e => s("anniversary", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={lbl}>Notes</label><textarea data-testid="input-client-notes" className={inp + " resize-none"} rows={2} value={f.notes} onChange={e => s("notes", e.target.value)} /></div>
      </div>
      <div className="flex gap-2 mt-4">
        <button data-testid="button-save-client" onClick={() => onSave(f)} disabled={saving || !f.name || !f.phone || !!phoneConflict} className={btn("bg-amber-600 hover:bg-amber-500")}>{saving ? "Saving…" : init ? "Update" : "Save Client"}</button>
        <button onClick={onCancel} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Work Form ───────────────────────────────────────────────────────────────

function WorkForm({ clients, init, onSave, onCancel, saving }: { clients: CrmClient[]; init?: CrmWork | null; onSave: (d: any) => void; onCancel: () => void; saving: boolean }) {
  const [f, setF] = useState({
    clientId: init?.clientId?.toString() || "",
    clientName: init?.clientName || "",
    description: init?.description || "",
    workType: init?.workType || "Album",
    workStage: init?.workStage || "Shoot Done",
    totalPrice: init?.totalPrice?.toString() || "",
    advancePaid: init?.advancePaid?.toString() || "",
    workDate: init?.workDate || todayStr(),
    status: init?.status || "pending",
  });
  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const balance = (parseFloat(f.totalPrice) || 0) - (parseFloat(f.advancePaid) || 0);

  function pickClient(id: string) {
    const c = clients.find(c => c.id.toString() === id);
    setF(x => ({ ...x, clientId: id, clientName: c?.name || x.clientName }));
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-4">
      <h3 className="text-white font-semibold mb-4 text-sm">{init ? "Edit Work" : "New Work"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Client (from list)</label>
          <select data-testid="select-work-client" className={sel} value={f.clientId} onChange={e => pickClient(e.target.value)}>
            <option value="">— Select —</option>
            {clients.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Client Name *</label><input data-testid="input-work-clientname" className={inp} value={f.clientName} onChange={e => s("clientName", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={lbl}>Work Description *</label><input data-testid="input-work-description" className={inp} value={f.description} onChange={e => s("description", e.target.value)} /></div>
        <div>
          <label className={lbl}>Work Type</label>
          <select data-testid="select-work-type" className={sel} value={f.workType} onChange={e => s("workType", e.target.value)}>
            {WORK_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Work Stage</label>
          <select data-testid="select-work-stage" className={sel} value={f.workStage} onChange={e => s("workStage", e.target.value)}>
            {WORK_STAGES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Total Price (₹)</label><input data-testid="input-work-total" type="number" className={inp} value={f.totalPrice} onChange={e => s("totalPrice", e.target.value)} /></div>
        <div><label className={lbl}>Advance Paid (₹)</label><input data-testid="input-work-advance" type="number" className={inp} value={f.advancePaid} onChange={e => s("advancePaid", e.target.value)} /></div>
        <div>
          <label className={lbl}>Balance (Auto)</label>
          <div data-testid="text-work-balance" className={`px-3 py-2 rounded-lg text-sm font-bold border ${balance > 0 ? "bg-red-950/40 text-red-400 border-red-800" : "bg-green-950/40 text-green-400 border-green-800"}`}>{fmtCur(balance)}</div>
        </div>
        <div><label className={lbl}>Work Date *</label><input data-testid="input-work-date" type="date" className={inp} value={f.workDate} onChange={e => s("workDate", e.target.value)} /></div>
        <div>
          <label className={lbl}>Status</label>
          <select data-testid="select-work-status" className={sel} value={f.status} onChange={e => s("status", e.target.value)}>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button data-testid="button-save-work" onClick={() => onSave(f)} disabled={saving || !f.clientName || !f.description || !f.workDate} className={btn("bg-amber-600 hover:bg-amber-500")}>{saving ? "Saving…" : init ? "Update Work" : "Save Work"}</button>
        <button onClick={onCancel} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Payment Form ─────────────────────────────────────────────────────────────

function PaymentForm({ clients, onSave, onCancel, saving }: { clients: CrmClient[]; onSave: (d: any) => void; onCancel: () => void; saving: boolean }) {
  const [f, setF] = useState({ clientId: "", clientName: "", amount: "", paymentDate: todayStr(), paymentMethod: "Cash", notes: "" });
  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  function pickClient(id: string) {
    const c = clients.find(c => c.id.toString() === id);
    setF(x => ({ ...x, clientId: id, clientName: c?.name || x.clientName }));
  }
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-4">
      <h3 className="text-white font-semibold mb-4 text-sm">Record Payment</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Client (from list)</label>
          <select className={sel} value={f.clientId} onChange={e => pickClient(e.target.value)}>
            <option value="">— Select —</option>
            {clients.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Client Name *</label><input data-testid="input-payment-clientname" className={inp} value={f.clientName} onChange={e => s("clientName", e.target.value)} /></div>
        <div><label className={lbl}>Amount (₹) *</label><input data-testid="input-payment-amount" type="number" className={inp} value={f.amount} onChange={e => s("amount", e.target.value)} /></div>
        <div><label className={lbl}>Payment Date *</label><input data-testid="input-payment-date" type="date" className={inp} value={f.paymentDate} onChange={e => s("paymentDate", e.target.value)} /></div>
        <div>
          <label className={lbl}>Method</label>
          <select data-testid="select-payment-method" className={sel} value={f.paymentMethod} onChange={e => s("paymentMethod", e.target.value)}>
            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Notes</label><input data-testid="input-payment-notes" className={inp} value={f.notes} onChange={e => s("notes", e.target.value)} /></div>
      </div>
      <div className="flex gap-2 mt-4">
        <button data-testid="button-save-payment" onClick={() => onSave(f)} disabled={saving || !f.clientName || !f.amount || !f.paymentDate} className={btn("bg-green-700 hover:bg-green-600")}>{saving ? "Saving…" : "Record Payment"}</button>
        <button onClick={onCancel} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

function ExpenseForm({ onSave, onCancel, saving, initial, editMode }: {
  onSave: (d: any) => void; onCancel: () => void; saving: boolean;
  initial?: { date?: string; category?: string; description?: string; amount?: number | string; notes?: string | null };
  editMode?: boolean;
}) {
  const [f, setF] = useState({
    date: initial?.date ?? todayStr(),
    category: initial?.category ?? EXPENSE_CATEGORIES[0],
    description: initial?.description ?? "",
    amount: initial?.amount?.toString() ?? "",
    notes: initial?.notes ?? "",
    pin: "",
  });
  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const canSave = !!f.date && !!f.description && !!f.amount && (!editMode || !!f.pin);
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-4">
      <h3 className="text-white font-semibold mb-4 text-sm">{editMode ? "Edit Expense" : "Add Expense"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={lbl}>Date *</label><input data-testid="input-expense-date" type="date" className={inp} value={f.date} onChange={e => s("date", e.target.value)} /></div>
        <div>
          <label className={lbl}>Category</label>
          <select data-testid="select-expense-category" className={sel} value={f.category} onChange={e => s("category", e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><label className={lbl}>Expense Type *</label><input data-testid="input-expense-description" className={inp} placeholder="e.g. Monthly rent payment" value={f.description} onChange={e => s("description", e.target.value)} /></div>
        <div><label className={lbl}>Amount (₹) *</label><input data-testid="input-expense-amount" type="number" min="0" className={inp} value={f.amount} onChange={e => s("amount", e.target.value)} /></div>
        <div><label className={lbl}>Notes</label><input data-testid="input-expense-notes" className={inp} placeholder="Optional notes" value={f.notes} onChange={e => s("notes", e.target.value)} /></div>
        {editMode && (
          <div className="sm:col-span-2">
            <label className={lbl}>Admin PIN * <span className="normal-case text-zinc-600">(required to edit)</span></label>
            <input data-testid="input-expense-edit-pin" type="password" inputMode="numeric" placeholder="Enter PIN" className={inp} value={f.pin} onChange={e => s("pin", e.target.value)} />
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button data-testid="button-save-expense" onClick={() => onSave(editMode ? { ...f, adminPin: f.pin } : f)} disabled={saving || !canSave} className={btn("bg-amber-700 hover:bg-amber-600")}>{saving ? "Saving…" : editMode ? "Update Expense" : "Add Expense"}</button>
        <button onClick={onCancel} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

function FinanceTab({ payments, expenses, onCreateExpense, onUpdateExpense, onDeleteExpense, saving }: {
  payments: CrmPayment[]; expenses: CrmExpense[];
  onCreateExpense: (d: any) => void;
  onUpdateExpense: (id: number, d: any) => void;
  onDeleteExpense: (id: number, pin: string) => void;
  saving: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CrmExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<CrmExpense | null>(null);
  const [expFilter, setExpFilter] = useDateFilter();
  const today = todayStr();
  const month = thisMonthStr();

  const todayIncome = payments.filter(p => p.paymentDate === today).reduce((s, p) => s + p.amount, 0);
  const todayExpenses = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const todayProfit = todayIncome - todayExpenses;

  const monthIncome = payments.filter(p => p.paymentDate.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const monthExpenses = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const monthProfit = monthIncome - monthExpenses;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Expenses by category
  const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const topCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  function statCard(label: string, value: number, colorClass: string, borderClass: string, textClass: string) {
    return (
      <div className={`${colorClass} ${borderClass} border rounded-xl p-3 text-center`}>
        <div className={`text-base font-bold leading-tight ${textClass}`}>{fmtCur(value)}</div>
        <div className={`text-xs mt-0.5 uppercase tracking-wider opacity-80 ${textClass}`}>{label}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {deletingExpense && (
        <PinDeleteModal
          prompt={`Delete expense "${deletingExpense.description}" (${fmtCur(deletingExpense.amount)})?`}
          onConfirm={pin => { onDeleteExpense(deletingExpense.id, pin); setDeletingExpense(null); }}
          onClose={() => setDeletingExpense(null)}
          saving={saving}
        />
      )}

      {/* Today */}
      <div>
        <h3 className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Today</h3>
        <div className="grid grid-cols-3 gap-2">
          {statCard("Income", todayIncome, "bg-green-950/40", "border-green-800/40", "text-green-400")}
          {statCard("Expense", todayExpenses, "bg-red-950/40", "border-red-800/40", "text-red-400")}
          {statCard("Profit", todayProfit, todayProfit >= 0 ? "bg-teal-950/40" : "bg-red-950/40", todayProfit >= 0 ? "border-teal-800/40" : "border-red-800/40", todayProfit >= 0 ? "text-teal-400" : "text-red-400")}
        </div>
      </div>

      {/* This Month */}
      <div>
        <h3 className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">This Month</h3>
        <div className="grid grid-cols-3 gap-2">
          {statCard("Income", monthIncome, "bg-green-950/40", "border-green-800/40", "text-green-400")}
          {statCard("Expense", monthExpenses, "bg-red-950/40", "border-red-800/40", "text-red-400")}
          {statCard("Profit", monthProfit, monthProfit >= 0 ? "bg-teal-950/40" : "bg-red-950/40", monthProfit >= 0 ? "border-teal-800/40" : "border-red-800/40", monthProfit >= 0 ? "text-teal-400" : "text-red-400")}
        </div>
      </div>

      {/* Category breakdown */}
      {topCategories.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-bold">By Category</h3>
            <span className="text-zinc-600 text-xs">Total: {fmtCur(totalExpenses)}</span>
          </div>
          <div className="space-y-2">
            {topCategories.map(([cat, total]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">{cat}</span>
                <span className="text-red-400 font-semibold text-sm">{fmtCur(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2">
        {!showForm && !editingExpense && (
          <button data-testid="button-add-expense" onClick={() => setShowForm(true)} className={btn("bg-amber-700 hover:bg-amber-600")}>+ Add Expense</button>
        )}
        {expenses.length > 0 && (
          <button data-testid="button-export-expenses" onClick={() => exportExpenses(expenses)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg px-3 py-2 transition-colors">↓ Export Expenses</button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <ExpenseForm
          onSave={d => { onCreateExpense(d); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {/* Edit form */}
      {editingExpense && (
        <ExpenseForm
          editMode
          initial={editingExpense}
          onSave={d => { onUpdateExpense(editingExpense.id, d); setEditingExpense(null); }}
          onCancel={() => setEditingExpense(null)}
          saving={saving}
        />
      )}

      {/* Expense list */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Expense History</h3>
        <span className="text-zinc-600 text-xs">{expenses.length} record{expenses.length !== 1 ? "s" : ""}</span>
      </div>
      <DateFilter value={expFilter} onChange={setExpFilter} />
      {(() => {
        const filtered = applyDateFilter(expenses, e => e.date, expFilter).slice().sort((a, b) => b.date.localeCompare(a.date));
        return filtered.length === 0 ? (
          <div className="text-zinc-600 text-sm text-center py-8 bg-zinc-900/50 rounded-xl border border-zinc-800">No expenses for this period.</div>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                  <th className="text-left p-3">Expense Type</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3 hidden sm:table-cell">Date</th>
                  <th className="text-left p-3 hidden md:table-cell">Notes</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                <tr key={e.id} data-testid={`row-expense-${e.id}`} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-3">
                    <div className="text-white font-medium">{e.description}</div>
                    <div className="text-zinc-500 text-xs sm:hidden">{fmtDate(e.date)}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-amber-900/40 text-amber-300 text-xs px-2 py-0.5 rounded">{e.category}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-red-400 whitespace-nowrap">{fmtCur(e.amount)}</td>
                  <td className="p-3 text-zinc-400 text-xs hidden sm:table-cell whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="p-3 text-zinc-500 text-xs hidden md:table-cell">{e.notes || "—"}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button data-testid={`button-edit-expense-${e.id}`} onClick={() => { setEditingExpense(e); setShowForm(false); }} className="text-zinc-500 hover:text-amber-400 text-xs transition-colors">Edit</button>
                      <button data-testid={`button-delete-expense-${e.id}`} onClick={() => setDeletingExpense(e)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Stage Badge ──────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    "Shoot Done": "bg-blue-900/50 text-blue-300",
    "Editing": "bg-yellow-900/50 text-yellow-300",
    "Album Designing": "bg-purple-900/50 text-purple-300",
    "Ready": "bg-teal-900/50 text-teal-300",
    "Delivered": "bg-green-900/50 text-green-300",
  };
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[stage] || "bg-zinc-800 text-zinc-400"}`}>{stage}</span>;
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ clients, works, payments, expenses, onMarkDone, onQuickAction, onRecordPayment }: {
  clients: CrmClient[]; works: CrmWork[]; payments: CrmPayment[]; expenses: CrmExpense[];
  onMarkDone: (w: CrmWork) => void;
  onQuickAction: (tab: string) => void;
  onRecordPayment: (d: any) => void;
}) {
  const [payingWork, setPayingWork] = useState<CrmWork | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const pending = works.filter(w => w.status === "pending");
  const pendingPay = works.filter(w => getWorkBalance(w, payments) > 0);
  const totalBalance = pendingPay.reduce((s, w) => s + getWorkBalance(w, payments), 0);
  const today = todayStr();
  const month = thisMonthStr();
  const todayIncome = payments.filter(p => p.paymentDate === today).reduce((s, p) => s + p.amount, 0);
  const monthIncome = payments.filter(p => p.paymentDate.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const todayExpense = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const monthExpense = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const monthProfit = monthIncome - monthExpense;
  const year = new Date().getFullYear().toString();
  const yearIncome = payments.filter(p => p.paymentDate.startsWith(year)).reduce((s, p) => s + p.amount, 0);
  const yearExpense = expenses.filter(e => e.date.startsWith(year)).reduce((s, e) => s + e.amount, 0);
  const yearProfit = yearIncome - yearExpense;
  const birthdays = clients.filter(c => { const d = daysUntil(c.dob); return d !== null && d <= 30; }).sort((a, b) => (daysUntil(a.dob) ?? 99) - (daysUntil(b.dob) ?? 99));
  const anniversaries = clients.filter(c => { const d = daysUntil(c.anniversary); return d !== null && d <= 30; }).sort((a, b) => (daysUntil(a.anniversary) ?? 99) - (daysUntil(b.anniversary) ?? 99));

  // Top clients by total work value
  const topClients = Object.values(
    works.reduce((acc: Record<string, { name: string; total: number }>, w) => {
      if (!acc[w.clientName]) acc[w.clientName] = { name: w.clientName, total: 0 };
      acc[w.clientName].total += w.totalPrice;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="space-y-6">
      {payingWork && (
        <QuickPaymentModal
          work={payingWork}
          balance={getWorkBalance(payingWork, payments)}
          onSave={d => {
            const bal = getWorkBalance(payingWork, payments);
            onRecordPayment(d);
            // Auto-mark as done when full balance is cleared and work is still pending
            if (d.amount >= bal - 0.01 && payingWork.status === "pending") {
              onMarkDone(payingWork);
            }
            setPayingWork(null);
            setSavingPayment(false);
          }}
          onClose={() => setPayingWork(null)}
          saving={savingPayment}
        />
      )}
      {/* Work & Business Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div data-testid="card-stat-pending" className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{pending.length}</div>
          <div className="text-red-300 text-xs mt-1 uppercase tracking-wider">Pending Work</div>
        </div>
        <div data-testid="card-stat-balance" className="bg-orange-950/40 border border-orange-800/50 rounded-xl p-4 text-center">
          <div className="text-base font-bold text-orange-400 leading-tight">{fmtCur(totalBalance)}</div>
          <div className="text-orange-300 text-xs mt-1 uppercase tracking-wider">Pending Pay</div>
        </div>
        <div data-testid="card-stat-birthdays" className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{birthdays.length}</div>
          <div className="text-blue-300 text-xs mt-1 uppercase tracking-wider">Birthdays 30d</div>
        </div>
        <div data-testid="card-stat-anniversaries" className="bg-pink-950/40 border border-pink-800/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-pink-400">{anniversaries.length}</div>
          <div className="text-pink-300 text-xs mt-1 uppercase tracking-wider">Anniv. 30d</div>
        </div>
      </div>

      {/* Finance Cards */}
      <div>
        <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Today's Finance</h2>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div data-testid="card-stat-today-income" className="bg-green-950/40 border border-green-800/40 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-green-400">{fmtCur(todayIncome)}</div>
            <div className="text-green-300 text-xs mt-0.5 uppercase tracking-wider">Income</div>
          </div>
          <div data-testid="card-stat-today-expense" className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-red-400">{fmtCur(todayExpense)}</div>
            <div className="text-red-300 text-xs mt-0.5 uppercase tracking-wider">Expense</div>
          </div>
          <div data-testid="card-stat-today-profit" className={`border rounded-xl p-3 text-center ${(todayIncome - todayExpense) >= 0 ? "bg-teal-950/40 border-teal-800/40" : "bg-red-950/40 border-red-800/40"}`}>
            <div className={`text-base font-bold ${(todayIncome - todayExpense) >= 0 ? "text-teal-400" : "text-red-400"}`}>{fmtCur(todayIncome - todayExpense)}</div>
            <div className={`text-xs mt-0.5 uppercase tracking-wider ${(todayIncome - todayExpense) >= 0 ? "text-teal-300" : "text-red-300"}`}>Profit</div>
          </div>
        </div>
        <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Monthly Finance</h2>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div data-testid="card-stat-monthly-income" className="bg-green-950/40 border border-green-800/40 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-green-400">{fmtCur(monthIncome)}</div>
            <div className="text-green-300 text-xs mt-0.5 uppercase tracking-wider">Income</div>
          </div>
          <div data-testid="card-stat-monthly-expense" className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-red-400">{fmtCur(monthExpense)}</div>
            <div className="text-red-300 text-xs mt-0.5 uppercase tracking-wider">Expense</div>
          </div>
          <div data-testid="card-stat-monthly-profit" className={`border rounded-xl p-3 text-center ${monthProfit >= 0 ? "bg-teal-950/40 border-teal-800/40" : "bg-red-950/40 border-red-800/40"}`}>
            <div className={`text-base font-bold ${monthProfit >= 0 ? "text-teal-400" : "text-red-400"}`}>{fmtCur(monthProfit)}</div>
            <div className={`text-xs mt-0.5 uppercase tracking-wider ${monthProfit >= 0 ? "text-teal-300" : "text-red-300"}`}>Profit</div>
          </div>
        </div>
        <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Yearly Finance ({year})</h2>
        <div className="grid grid-cols-3 gap-2">
          <div data-testid="card-stat-yearly-income" className="bg-green-950/60 border border-green-700/50 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-green-300">{fmtCur(yearIncome)}</div>
            <div className="text-green-400 text-xs mt-0.5 uppercase tracking-wider">Income</div>
          </div>
          <div data-testid="card-stat-yearly-expense" className="bg-red-950/60 border border-red-700/50 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-red-300">{fmtCur(yearExpense)}</div>
            <div className="text-red-400 text-xs mt-0.5 uppercase tracking-wider">Expense</div>
          </div>
          <div data-testid="card-stat-yearly-profit" className={`border rounded-xl p-3 text-center ${yearProfit >= 0 ? "bg-teal-950/60 border-teal-700/50" : "bg-red-950/60 border-red-700/50"}`}>
            <div className={`text-base font-bold ${yearProfit >= 0 ? "text-teal-300" : "text-red-300"}`}>{fmtCur(yearProfit)}</div>
            <div className={`text-xs mt-0.5 uppercase tracking-wider ${yearProfit >= 0 ? "text-teal-400" : "text-red-400"}`}>Profit</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button data-testid="button-quick-add-client" onClick={() => onQuickAction("clients")} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl px-4 py-2 border border-zinc-700 transition-colors">+ Add Client</button>
        <button data-testid="button-quick-add-work" onClick={() => onQuickAction("work")} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl px-4 py-2 border border-zinc-700 transition-colors">+ Add Work</button>
        <button data-testid="button-quick-record-payment" onClick={() => onQuickAction("payments")} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl px-4 py-2 border border-zinc-700 transition-colors">+ Record Payment</button>
        <button data-testid="button-quick-add-expense" onClick={() => onQuickAction("expenses")} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl px-4 py-2 border border-zinc-700 transition-colors">+ Add Expense</button>
        {payments.length > 0 && (
          <button data-testid="button-export-income" onClick={() => exportIncomeReport(payments, expenses)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2 border border-zinc-700 transition-colors">↓ Income Report</button>
        )}
      </div>

      {/* Pending Work */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
            Pending Work ({pending.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3 hidden sm:table-cell">Work</th>
                <th className="text-left p-3 hidden sm:table-cell">Stage</th>
                <th className="text-left p-3">Date</th>
                <th className="p-3">Action</th>
              </tr></thead>
              <tbody>
                {pending.map(w => (
                  <tr key={w.id} data-testid={`row-pending-${w.id}`} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                    <td className="p-3">
                      <div className="text-white font-medium">{w.clientName}</div>
                      <div className="text-zinc-500 text-xs sm:hidden">{w.description}</div>
                    </td>
                    <td className="p-3 text-zinc-400 hidden sm:table-cell">{w.description}</td>
                    <td className="p-3 hidden sm:table-cell"><StageBadge stage={w.workStage} /></td>
                    <td className="p-3 text-zinc-500 text-xs">{fmtDate(w.workDate)}</td>
                    <td className="p-3 text-center">
                      <button data-testid={`button-markdone-${w.id}`} onClick={() => onMarkDone(w)} className="bg-green-800 hover:bg-green-700 text-white text-xs rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">Mark Done</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pending Payments */}
      {pendingPay.length > 0 && (
        <section>
          <h2 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-3">Pending Payments</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                <th className="text-left p-3">Client</th>
                <th className="text-right p-3 hidden sm:table-cell">Total</th>
                <th className="text-right p-3">Balance</th>
                <th className="p-3 text-center">Action</th>
              </tr></thead>
              <tbody>
                {pendingPay.map(w => {
                  const bal = getWorkBalance(w, payments);
                  const client = clients.find(c => c.id === w.clientId);
                  const phone = client?.phone || "";
                  const msg = `Hello,\nYour pending balance for Dream Pictures work is ${fmtCur(bal)}.\nKindly clear the payment.\nThank you.`;
                  return (
                    <tr key={w.id} data-testid={`row-payment-pending-${w.id}`} className="border-t border-zinc-800">
                      <td className="p-3">
                        <div className="text-white font-medium">{w.clientName}</div>
                        <div className="text-zinc-500 text-xs">{w.description}</div>
                      </td>
                      <td className="p-3 text-right text-zinc-400 hidden sm:table-cell">{fmtCur(w.totalPrice)}</td>
                      <td className="p-3 text-right font-bold text-orange-400">{fmtCur(bal)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button data-testid={`button-pay-pending-${w.id}`} onClick={() => setPayingWork(w)} className="bg-orange-700 hover:bg-orange-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors font-semibold">💰 Pay</button>
                          {phone && (
                            <a href={waLink(phone, msg)} target="_blank" rel="noreferrer" data-testid={`button-wa-payment-${w.id}`} className="bg-green-800 hover:bg-green-700 text-white text-xs rounded-lg px-2 py-1.5 inline-block transition-colors">WA</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Birthdays */}
      {birthdays.length > 0 && (
        <section>
          <h2 className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-3">Upcoming Birthdays</h2>
          <div className="space-y-2">
            {birthdays.map(c => {
              const d = daysUntil(c.dob);
              return (
                <div key={c.id} data-testid={`card-birthday-${c.id}`} className="bg-blue-950/20 border border-blue-800/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{c.name}</div>
                    <div className="text-zinc-400 text-xs">{c.phone} · {fmtDate(c.dob)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-blue-400 font-bold text-sm">{d === 0 ? "Today!" : `${d}d`}</div>
                    <a href={waLink(c.phone, birthdayMsg(c.name))} target="_blank" rel="noreferrer" data-testid={`button-wa-birthday-${c.id}`} className="bg-green-800 hover:bg-green-700 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">Wish</a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Anniversaries */}
      {anniversaries.length > 0 && (
        <section>
          <h2 className="text-pink-400 font-bold text-xs uppercase tracking-wider mb-3">Upcoming Anniversaries</h2>
          <div className="space-y-2">
            {anniversaries.map(c => {
              const d = daysUntil(c.anniversary);
              return (
                <div key={c.id} data-testid={`card-anniversary-${c.id}`} className="bg-pink-950/20 border border-pink-800/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{c.name}</div>
                    <div className="text-zinc-400 text-xs">{c.phone} · {fmtDate(c.anniversary)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-pink-400 font-bold text-sm">{d === 0 ? "Today!" : `${d}d`}</div>
                    <a href={waLink(c.phone, anniversaryMsg(c.name))} target="_blank" rel="noreferrer" data-testid={`button-wa-anniversary-${c.id}`} className="bg-green-800 hover:bg-green-700 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">Wish</a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Clients */}
      {topClients.length > 0 && (
        <section>
          <h2 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">Top Clients by Business Value</h2>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Client</th>
                <th className="text-right p-3">Total Value</th>
              </tr></thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr key={c.name} className="border-t border-zinc-800">
                    <td className="p-3 text-zinc-500">{i + 1}</td>
                    <td className="p-3 text-white font-medium">{c.name}</td>
                    <td className="p-3 text-right text-amber-400 font-semibold">{fmtCur(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pending.length === 0 && pendingPay.length === 0 && birthdays.length === 0 && anniversaries.length === 0 && (
        <div className="text-center py-12 text-zinc-600">All clear — no alerts today.</div>
      )}
    </div>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────

function ClientsTab({ clients, works, onCreateClient, onUpdateClient, onDeleteClient, saving }: {
  clients: CrmClient[]; works: CrmWork[];
  onCreateClient: (d: any) => void; onUpdateClient: (id: number, d: any) => void; onDeleteClient: (id: number) => void;
  saving: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CrmClient | null>(null);
  const [search, setSearch] = useState("");

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {!showForm && !editing && (
          <button data-testid="button-add-client" onClick={() => setShowForm(true)} className={btn("bg-amber-600 hover:bg-amber-500")}>+ Add Client</button>
        )}
        <input placeholder="Search clients…" className={inp + " max-w-xs flex-1"} value={search} onChange={e => setSearch(e.target.value)} />
        {clients.length > 0 && (
          <button data-testid="button-export-clients" onClick={() => exportClients(clients)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg px-3 py-2 transition-colors whitespace-nowrap">↓ Export Clients</button>
        )}
      </div>
      {showForm && <ClientForm existingClients={clients} onSave={d => { onCreateClient(d); setShowForm(false); }} onCancel={() => setShowForm(false)} saving={saving} />}
      {editing && <ClientForm init={editing} existingClients={clients} onSave={d => { onUpdateClient(editing.id, d); setEditing(null); }} onCancel={() => setEditing(null)} saving={saving} />}
      {filtered.length === 0 ? (
        <div className="text-zinc-600 text-sm text-center py-10">No clients found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const clientWorks = works.filter(w => w.clientId === c.id);
            const totalBusiness = clientWorks.reduce((s, w) => s + w.totalPrice, 0);
            return (
              <div key={c.id} data-testid={`card-client-${c.id}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{c.name}</span>
                      {totalBusiness > 0 && <span className="text-amber-400 text-xs font-medium">{fmtCur(totalBusiness)}</span>}
                    </div>
                    <div className="text-zinc-400 text-sm mt-0.5">{c.phone}</div>
                    {c.address && <div className="text-zinc-500 text-xs mt-0.5">{c.address}</div>}
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {c.dob && <span className="text-blue-400 text-xs">🎂 {fmtDate(c.dob)}</span>}
                      {c.anniversary && <span className="text-pink-400 text-xs">💍 {fmtDate(c.anniversary)}</span>}
                    </div>
                    {c.notes && <div className="text-zinc-500 text-xs mt-1 italic">{c.notes}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${c.phone}`} data-testid={`button-call-${c.id}`} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">Call</a>
                    <a href={waLink(c.phone, `Hello ${c.name}, greetings from Dream Pictures!`)} target="_blank" rel="noreferrer" data-testid={`button-wa-client-${c.id}`} className="bg-green-800 hover:bg-green-700 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">WhatsApp</a>
                    <button data-testid={`button-edit-client-${c.id}`} onClick={() => { setEditing(c); setShowForm(false); }} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">Edit</button>
                    <button data-testid={`button-delete-client-${c.id}`} onClick={() => { if (confirm(`Delete ${c.name}? This will also delete their work records.`)) onDeleteClient(c.id); }} className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded-lg px-3 py-1.5 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Work Tab ─────────────────────────────────────────────────────────────────

function WorkTab({ clients, works, payments, onCreateWork, onUpdateWork, onDeleteWork, onRecordPayment, saving }: {
  clients: CrmClient[]; works: CrmWork[]; payments: CrmPayment[];
  onCreateWork: (d: any) => void; onUpdateWork: (id: number, d: any) => void; onDeleteWork: (id: number) => void;
  onRecordPayment: (d: any) => void;
  saving: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CrmWork | null>(null);
  const [payingWork, setPayingWork] = useState<CrmWork | null>(null);
  const [dateFilter, setDateFilter] = useDateFilter();
  const pending = works.filter(w => w.status === "pending");
  const filtered = applyDateFilter(works.filter(w => w.status === "pending"), w => w.workDate, dateFilter);

  return (
    <div>
      {payingWork && (
        <QuickPaymentModal
          work={payingWork}
          balance={getWorkBalance(payingWork, payments)}
          onSave={d => { onRecordPayment(d); setPayingWork(null); }}
          onClose={() => setPayingWork(null)}
          saving={saving}
        />
      )}
      {!showForm && !editing && (
        <button data-testid="button-add-work" onClick={() => setShowForm(true)} className={`${btn("bg-amber-600 hover:bg-amber-500")} mb-4`}>+ Add Work</button>
      )}
      {showForm && <WorkForm clients={clients} onSave={d => { onCreateWork(d); setShowForm(false); }} onCancel={() => setShowForm(false)} saving={saving} />}
      {editing && <WorkForm clients={clients} init={editing} onSave={d => { onUpdateWork(editing.id, d); setEditing(null); }} onCancel={() => setEditing(null)} saving={saving} />}

      <div className="flex items-center gap-2 mb-3 mt-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
        <h2 className="text-red-400 font-bold text-xs uppercase tracking-wider">Pending Work ({pending.length})</h2>
      </div>
      <DateFilter value={dateFilter} onChange={setDateFilter} label="Date" />
      {filtered.length === 0 ? (
        <div className="text-zinc-600 text-sm text-center py-6">No pending work for this period.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => {
            const bal = getWorkBalance(w, payments);
            return (
              <div key={w.id} data-testid={`card-work-${w.id}`} className="bg-red-950/20 border border-red-800/30 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{w.clientName}</span>
                      <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded">{w.workType}</span>
                      <StageBadge stage={w.workStage} />
                    </div>
                    <div className="text-zinc-400 text-sm mt-1">{w.description}</div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      <span>Total: <span className="text-white font-medium">{fmtCur(w.totalPrice)}</span></span>
                      <span>Advance: <span className="text-green-400 font-medium">{fmtCur(w.advancePaid)}</span></span>
                      <span>Balance: <span className={`font-bold ${bal > 0 ? "text-orange-400" : "text-green-400"}`}>{fmtCur(bal)}</span></span>
                      <span className="text-zinc-500">{fmtDate(w.workDate)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bal > 0 && (
                      <button data-testid={`button-pay-work-${w.id}`} onClick={() => { setPayingWork(w); setShowForm(false); setEditing(null); }} className="bg-orange-700 hover:bg-orange-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors font-semibold">💰 Pay</button>
                    )}
                    <button data-testid={`button-markdone-work-${w.id}`} onClick={() => onUpdateWork(w.id, { ...w, status: "done" })} className="bg-green-800 hover:bg-green-700 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">Mark Done</button>
                    <button data-testid={`button-edit-work-${w.id}`} onClick={() => { setEditing(w); setShowForm(false); setPayingWork(null); }} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">Edit</button>
                    <button data-testid={`button-delete-work-${w.id}`} onClick={() => { if (confirm("Delete this work?")) onDeleteWork(w.id); }} className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded-lg px-2 py-1.5 transition-colors">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PIN Components ──────────────────────────────────────────────────────────

function PinDeleteModal({ prompt, onConfirm, onClose, saving }: {
  prompt: string;
  onConfirm: (pin: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  function submit() {
    if (!pin) { setError("Enter PIN"); return; }
    setError("");
    onConfirm(pin);
  }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl">
        <h3 className="text-white font-bold mb-1">Admin PIN Required</h3>
        <p className="text-zinc-400 text-sm mb-4">{prompt}</p>
        <input
          data-testid="input-pin-delete"
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="Enter PIN"
          className={inp}
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button data-testid="button-pin-confirm" onClick={submit} disabled={saving}
            className={btn("bg-red-700 hover:bg-red-600 flex-1")}>{saving ? "…" : "Confirm"}</button>
          <button onClick={onClose} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function PaymentEditModal({ payment, onSave, onClose, saving }: {
  payment: CrmPayment;
  onSave: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState({
    amount: payment.amount.toString(),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes || "",
    pin: "",
  });
  const [error, setError] = useState("");
  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));

  function submit() {
    if (!f.amount || !f.paymentDate) { setError("Amount and date are required"); return; }
    if (!f.pin) { setError("Enter Admin PIN"); return; }
    setError("");
    onSave({ amount: Number(f.amount), paymentDate: f.paymentDate, paymentMethod: f.paymentMethod, notes: f.notes || null, adminPin: f.pin });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold mb-1">Edit Payment</h3>
        <p className="text-zinc-400 text-sm mb-4">{payment.clientName}</p>
        <div className="space-y-3">
          <div><label className={lbl}>Amount (₹) *</label><input data-testid="input-edit-pay-amount" type="number" className={inp} value={f.amount} onChange={e => s("amount", e.target.value)} /></div>
          <div><label className={lbl}>Date *</label><input data-testid="input-edit-pay-date" type="date" className={inp} value={f.paymentDate} onChange={e => s("paymentDate", e.target.value)} /></div>
          <div><label className={lbl}>Method</label>
            <select data-testid="select-edit-pay-method" className={sel} value={f.paymentMethod} onChange={e => s("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Notes</label><input className={inp} value={f.notes} onChange={e => s("notes", e.target.value)} /></div>
          <div><label className={lbl}>Admin PIN *</label>
            <input data-testid="input-edit-pay-pin" type="password" inputMode="numeric" placeholder="Enter PIN" className={inp} value={f.pin} onChange={e => s("pin", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button data-testid="button-save-edit-payment" onClick={submit} disabled={saving} className={btn("bg-amber-600 hover:bg-amber-500 flex-1")}>{saving ? "Saving…" : "Save Changes"}</button>
          <button onClick={onClose} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function HistoryEditModal({ work, onSave, onClose, saving }: {
  work: CrmWork;
  onSave: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState({
    description: work.description,
    totalPrice: work.totalPrice.toString(),
    advancePaid: work.advancePaid.toString(),
    pin: "",
  });
  const [error, setError] = useState("");
  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const balance = Math.max(0, (parseFloat(f.totalPrice) || 0) - (parseFloat(f.advancePaid) || 0));

  function submit() {
    if (!f.description) { setError("Description is required"); return; }
    if (!f.pin) { setError("Enter Admin PIN"); return; }
    setError("");
    onSave({ description: f.description, totalPrice: parseFloat(f.totalPrice) || 0, advancePaid: parseFloat(f.advancePaid) || 0, adminPin: f.pin });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold mb-1">Edit Completed Work</h3>
        <p className="text-zinc-400 text-sm mb-1">{work.clientName}</p>
        <p className="text-zinc-600 text-xs mb-4">Client name cannot be changed here</p>
        <div className="space-y-3">
          <div><label className={lbl}>Description *</label><input data-testid="input-edit-hist-desc" className={inp} value={f.description} onChange={e => s("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Total Price (₹)</label><input data-testid="input-edit-hist-total" type="number" className={inp} value={f.totalPrice} onChange={e => s("totalPrice", e.target.value)} /></div>
            <div><label className={lbl}>Advance Paid (₹)</label><input data-testid="input-edit-hist-advance" type="number" className={inp} value={f.advancePaid} onChange={e => s("advancePaid", e.target.value)} /></div>
          </div>
          <div className="bg-zinc-800 rounded-lg px-3 py-2 flex justify-between items-center">
            <span className="text-zinc-400 text-xs">Balance</span>
            <span className={`font-bold text-sm ${balance > 0 ? "text-orange-400" : "text-green-400"}`}>{fmtCur(balance)}</span>
          </div>
          <div><label className={lbl}>Admin PIN *</label>
            <input data-testid="input-edit-hist-pin" type="password" inputMode="numeric" placeholder="Enter PIN" className={inp} value={f.pin} onChange={e => s("pin", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button data-testid="button-save-hist-edit" onClick={submit} disabled={saving} className={btn("bg-amber-600 hover:bg-amber-500 flex-1")}>{saving ? "Saving…" : "Save Changes"}</button>
          <button onClick={onClose} className={btn("bg-zinc-700 hover:bg-zinc-600")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab({ clients, works, payments, onCreatePayment, onUpdatePayment, onDeletePayment, saving }: {
  clients: CrmClient[]; works: CrmWork[]; payments: CrmPayment[];
  onCreatePayment: (d: any) => void;
  onUpdatePayment: (id: number, data: any) => void;
  onDeletePayment: (id: number, pin: string) => void;
  saving: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CrmPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<CrmPayment | null>(null);
  const [pinError, setPinError] = useState("");
  const [dateFilter, setDateFilter] = useDateFilter();
  const today = todayStr();
  const month = thisMonthStr();
  const todayIncome = payments.filter(p => p.paymentDate === today).reduce((s, p) => s + p.amount, 0);
  const monthIncome = payments.filter(p => p.paymentDate.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const filtered = applyDateFilter(payments, p => p.paymentDate, dateFilter).slice().sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  return (
    <div>
      {editingPayment && (
        <PaymentEditModal
          payment={editingPayment}
          onSave={data => { onUpdatePayment(editingPayment.id, data); setEditingPayment(null); setPinError(""); }}
          onClose={() => { setEditingPayment(null); setPinError(""); }}
          saving={saving}
        />
      )}
      {deletingPayment && (
        <PinDeleteModal
          prompt={`Delete payment of ${fmtCur(deletingPayment.amount)} from ${deletingPayment.clientName}?`}
          onConfirm={pin => { onDeletePayment(deletingPayment.id, pin); setDeletingPayment(null); setPinError(""); }}
          onClose={() => { setDeletingPayment(null); setPinError(""); }}
          saving={saving}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        {!showForm && (
          <button data-testid="button-record-payment" onClick={() => setShowForm(true)} className={btn("bg-green-700 hover:bg-green-600")}>+ Record Payment</button>
        )}
        {payments.length > 0 && (
          <button data-testid="button-export-payments" onClick={() => exportPayments(payments)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg px-3 py-2 transition-colors ml-auto">↓ Export Payments</button>
        )}
      </div>
      {showForm && <PaymentForm clients={clients} onSave={d => { onCreatePayment(d); setShowForm(false); }} onCancel={() => setShowForm(false)} saving={saving} />}

      {/* Income Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-950/40 border border-green-800/40 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-400">{fmtCur(todayIncome)}</div>
          <div className="text-green-300 text-xs mt-0.5">Today</div>
        </div>
        <div className="bg-teal-950/40 border border-teal-800/40 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-teal-400">{fmtCur(monthIncome)}</div>
          <div className="text-teal-300 text-xs mt-0.5">This Month</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{fmtCur(totalIncome)}</div>
          <div className="text-zinc-400 text-xs mt-0.5">All Time</div>
        </div>
      </div>

      <h2 className="text-zinc-300 font-bold text-xs uppercase tracking-wider mb-3">Payment History</h2>
      <DateFilter value={dateFilter} onChange={setDateFilter} />
      {filtered.length === 0 ? (
        <div className="text-zinc-600 text-sm text-center py-8">No payments for this period.</div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-900 text-zinc-400 text-xs uppercase">
              <th className="text-left p-3">Client</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-left p-3 hidden sm:table-cell">Method</th>
              <th className="text-left p-3">Date</th>
              <th className="p-3" />
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} data-testid={`row-payment-${p.id}`} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-3">
                    <div className="text-white">{p.clientName}</div>
                    {p.workId && <div className="text-amber-600 text-xs">Work #{p.workId}</div>}
                    {p.notes && <div className="text-zinc-500 text-xs">{p.notes}</div>}
                  </td>
                  <td className="p-3 text-right font-semibold text-green-400">{fmtCur(p.amount)}</td>
                  <td className="p-3 text-zinc-400 hidden sm:table-cell">{p.paymentMethod}</td>
                  <td className="p-3 text-zinc-500 text-xs">{fmtDate(p.paymentDate)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button data-testid={`button-edit-payment-${p.id}`} onClick={() => { setEditingPayment(p); setShowForm(false); }} className="text-zinc-500 hover:text-amber-400 text-xs transition-colors">Edit</button>
                      <button data-testid={`button-delete-payment-${p.id}`} onClick={() => setDeletingPayment(p)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ works, payments, onDeleteWork, onUpdateWork, saving }: {
  works: CrmWork[];
  payments: CrmPayment[];
  onDeleteWork: (id: number) => void;
  onUpdateWork: (id: number, data: any) => void;
  saving: boolean;
}) {
  const done = works.filter(w => w.status === "done");
  const totalRevenue = done.reduce((s, w) => s + w.totalPrice, 0);
  const [editingWork, setEditingWork] = useState<CrmWork | null>(null);

  return (
    <div>
      {editingWork && (
        <HistoryEditModal
          work={editingWork}
          onSave={data => { onUpdateWork(editingWork.id, data); setEditingWork(null); }}
          onClose={() => setEditingWork(null)}
          saving={saving}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-green-400 font-bold text-xs uppercase tracking-wider">Completed Work ({done.length})</h2>
        {done.length > 0 && (
          <button data-testid="button-export-work-history" onClick={() => exportWorkHistory(works)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg px-4 py-2 transition-colors">↓ Export Completed Work</button>
        )}
      </div>
      {done.length > 0 && (
        <div className="bg-green-950/20 border border-green-800/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-zinc-400 text-sm">Total Revenue from Completed Work</span>
          <span className="text-green-400 font-bold">{fmtCur(totalRevenue)}</span>
        </div>
      )}
      {done.length === 0 ? (
        <div className="text-zinc-600 text-sm text-center py-10">No completed work yet.</div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-900 text-zinc-400 text-xs uppercase">
              <th className="text-left p-3">Client</th>
              <th className="text-left p-3">Work</th>
              <th className="text-left p-3 hidden sm:table-cell">Stage</th>
              <th className="text-right p-3">Total</th>
              <th className="text-right p-3 hidden sm:table-cell">Advance</th>
              <th className="text-right p-3 hidden sm:table-cell">Balance</th>
              <th className="text-left p-3">Date</th>
              <th className="p-3 text-center">Actions</th>
            </tr></thead>
            <tbody>
              {done.map(w => (
                <tr key={w.id} data-testid={`row-history-${w.id}`} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-3 text-white font-medium">{w.clientName}</td>
                  <td className="p-3 text-zinc-400">{w.description}</td>
                  <td className="p-3 hidden sm:table-cell"><StageBadge stage={w.workStage} /></td>
                  <td className="p-3 text-right text-zinc-200">{fmtCur(w.totalPrice)}</td>
                  <td className="p-3 text-right text-green-400 hidden sm:table-cell">{fmtCur(w.advancePaid)}</td>
                  <td className="p-3 text-right hidden sm:table-cell">
                    {(() => {
                      const bal = getWorkBalance(w, payments);
                      return bal === 0
                        ? <span className="text-green-500 font-semibold text-xs">✓ Cleared</span>
                        : <span className="text-orange-400 font-semibold">{fmtCur(bal)}</span>;
                    })()}
                  </td>
                  <td className="p-3 text-zinc-500 text-xs">{fmtDate(w.workDate)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button data-testid={`button-edit-history-${w.id}`} onClick={() => setEditingWork(w)} className="text-zinc-500 hover:text-amber-400 text-xs transition-colors">Edit</button>
                      <button data-testid={`button-delete-history-${w.id}`} onClick={() => { if (confirm("Delete this record?")) onDeleteWork(w.id); }} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "dashboard" | "clients" | "work" | "payments" | "finance" | "history";
const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "clients", label: "Clients" },
  { id: "work", label: "Work" },
  { id: "payments", label: "Payments" },
  { id: "finance", label: "Expenses" },
  { id: "history", label: "History" },
];

export default function AdminCRM() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(LS_KEY) === "true");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [searchQ, setSearchQ] = useState("");
  const [searchRes, setSearchRes] = useState<{ clients: CrmClient[]; works: CrmWork[] } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (searchQ.length < 2) { setSearchRes(null); setShowSearch(false); return; }
    const t = setTimeout(() => {
      fetch(`/api/crm/search?q=${encodeURIComponent(searchQ)}`, { credentials: "include" })
        .then(r => r.json()).then(d => { setSearchRes(d); setShowSearch(true); });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const { data: clients = [] } = useQuery<CrmClient[]>({ queryKey: ["/api/crm/clients"], enabled: authed });
  const { data: works = [] } = useQuery<CrmWork[]>({ queryKey: ["/api/crm/works"], enabled: authed });
  const { data: payments = [] } = useQuery<CrmPayment[]>({ queryKey: ["/api/crm/payments"], enabled: authed });
  const { data: expenses = [] } = useQuery<CrmExpense[]>({ queryKey: ["/api/crm/expenses"], enabled: authed });

  const inv = (keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const createClient = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/crm/clients", d), onSuccess: () => inv(["/api/crm/clients"]) });
  const updateClient = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiRequest("PUT", `/api/crm/clients/${id}`, d), onSuccess: () => inv(["/api/crm/clients"]) });
  const deleteClient = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/crm/clients/${id}`), onSuccess: () => inv(["/api/crm/clients", "/api/crm/works"]) });

  const createWork = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/crm/works", d), onSuccess: () => inv(["/api/crm/works"]) });
  const updateWork = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiRequest("PUT", `/api/crm/works/${id}`, d), onSuccess: () => inv(["/api/crm/works"]) });
  const deleteWork = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/crm/works/${id}`), onSuccess: () => inv(["/api/crm/works"]) });

  const createPayment = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/crm/payments", d), onSuccess: () => inv(["/api/crm/payments", "/api/crm/works"]) });
  const deletePayment = useMutation({ mutationFn: ({ id, adminPin }: { id: number; adminPin: string }) => apiRequest("DELETE", `/api/crm/payments/${id}`, { adminPin }), onSuccess: () => inv(["/api/crm/payments"]) });
  const updatePayment = useMutation({ mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/crm/payments/${id}`, data), onSuccess: () => { inv(["/api/crm/payments"]); inv(["/api/crm/works"]); } });

  const createExpense = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/crm/expenses", d), onSuccess: () => inv(["/api/crm/expenses"]) });
  const updateExpense = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiRequest("PUT", `/api/crm/expenses/${id}`, d), onSuccess: () => inv(["/api/crm/expenses"]) });
  const deleteExpense = useMutation({ mutationFn: ({ id, adminPin }: { id: number; adminPin: string }) => apiRequest("DELETE", `/api/crm/expenses/${id}`, { adminPin }), onSuccess: () => inv(["/api/crm/expenses"]) });
  const updateHistoryWork = useMutation({ mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/crm/works/${id}/history-edit`, data), onSuccess: () => inv(["/api/crm/works"]) });

  const anyMutSaving = createClient.isPending || updateClient.isPending || deleteClient.isPending || createWork.isPending || updateWork.isPending || deleteWork.isPending || createPayment.isPending || deletePayment.isPending || updatePayment.isPending || createExpense.isPending || updateExpense.isPending || deleteExpense.isPending || updateHistoryWork.isPending;

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-amber-500 font-bold text-base tracking-widest">DREAM</span>
            <span className="text-zinc-600 text-xs hidden sm:inline">CRM</span>
          </div>
          <div className="flex-1 relative mx-2" ref={searchRef}>
            <input
              data-testid="input-global-search"
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onFocus={() => searchRes && setShowSearch(true)}
              placeholder="Search clients, work…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-zinc-600"
            />
            {showSearch && searchRes && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                {searchRes.clients.length === 0 && searchRes.works.length === 0 && (
                  <div className="text-zinc-500 text-sm p-4 text-center">No results found</div>
                )}
                {searchRes.clients.length > 0 && (
                  <div>
                    <div className="text-zinc-600 text-xs uppercase px-3 pt-2 pb-1">Clients</div>
                    {searchRes.clients.map(c => (
                      <button key={c.id} onClick={() => { setTab("clients"); setShowSearch(false); setSearchQ(""); }} className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors">
                        <div className="text-white text-sm">{c.name}</div>
                        <div className="text-zinc-500 text-xs">{c.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                {searchRes.works.length > 0 && (
                  <div>
                    <div className="text-zinc-600 text-xs uppercase px-3 pt-2 pb-1">Works</div>
                    {searchRes.works.map(w => (
                      <button key={w.id} onClick={() => { setTab(w.status === "pending" ? "work" : "history"); setShowSearch(false); setSearchQ(""); }} className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors">
                        <div className="text-white text-sm">{w.clientName} – {w.description}</div>
                        <div className="text-zinc-500 text-xs">{w.workType} · {fmtDate(w.workDate)}</div>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowSearch(false)} className="w-full text-zinc-600 text-xs py-2 hover:text-zinc-400 transition-colors">Close</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button data-testid="button-export-all" onClick={() => exportAllData(clients, works, payments, expenses)} className="hidden sm:block text-zinc-500 hover:text-amber-400 text-xs transition-colors px-2 py-1 whitespace-nowrap">↓ All</button>
            <button data-testid="button-crm-logout" onClick={() => { localStorage.removeItem(LS_KEY); setAuthed(false); }} className="text-zinc-500 hover:text-red-400 text-xs transition-colors px-2 py-1">Logout</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-12 z-10 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(t => (
            <button key={t.id} data-testid={`tab-crm-${t.id}`} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${tab === t.id ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 pb-8">
        {tab === "dashboard" && (
          <DashboardTab
            clients={clients} works={works} payments={payments} expenses={expenses}
            onMarkDone={w => updateWork.mutate({ id: w.id, d: { ...w, status: "done" } })}
            onQuickAction={t => setTab(t as Tab)}
            onRecordPayment={d => createPayment.mutate(d)}
          />
        )}
        {tab === "clients" && (
          <ClientsTab
            clients={clients} works={works}
            onCreateClient={d => createClient.mutate(d)}
            onUpdateClient={(id, d) => updateClient.mutate({ id, d })}
            onDeleteClient={id => deleteClient.mutate(id)}
            saving={anyMutSaving}
          />
        )}
        {tab === "work" && (
          <WorkTab
            clients={clients} works={works} payments={payments}
            onCreateWork={d => createWork.mutate(d)}
            onUpdateWork={(id, d) => updateWork.mutate({ id, d })}
            onDeleteWork={id => deleteWork.mutate(id)}
            onRecordPayment={d => createPayment.mutate(d)}
            saving={anyMutSaving}
          />
        )}
        {tab === "payments" && (
          <PaymentsTab
            clients={clients} works={works} payments={payments}
            onCreatePayment={d => createPayment.mutate(d)}
            onUpdatePayment={(id, data) => updatePayment.mutate({ id, data })}
            onDeletePayment={(id, adminPin) => deletePayment.mutate({ id, adminPin })}
            saving={anyMutSaving}
          />
        )}
        {tab === "finance" && (
          <FinanceTab
            payments={payments} expenses={expenses}
            onCreateExpense={d => createExpense.mutate(d)}
            onUpdateExpense={(id, d) => updateExpense.mutate({ id, d })}
            onDeleteExpense={(id, adminPin) => deleteExpense.mutate({ id, adminPin })}
            saving={anyMutSaving}
          />
        )}
        {tab === "history" && (
          <HistoryTab
            works={works}
            payments={payments}
            onDeleteWork={id => deleteWork.mutate(id)}
            onUpdateWork={(id, data) => updateHistoryWork.mutate({ id, data })}
            saving={anyMutSaving}
          />
        )}
      </div>
    </div>
  );
}
