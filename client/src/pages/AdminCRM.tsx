import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CrmClient, CrmWork } from "@shared/schema";

const LS_KEY = "crm_auth";

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();
    let next = new Date(thisYear, d.getMonth(), d.getDate());
    next.setHours(0, 0, 0, 0);
    if (next < today) next = new Date(thisYear + 1, d.getMonth(), d.getDate());
    return Math.round((next.getTime() - today.getTime()) / 86400000);
  } catch {
    return null;
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatCurrency(n: number): string {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function exportToCSV(works: CrmWork[]) {
  const done = works.filter(w => w.status === "done");
  const headers = ["Client", "Description", "Total (₹)", "Advance (₹)", "Balance (₹)", "Work Date", "Status"];
  const rows = done.map(w => [
    w.clientName,
    w.description,
    w.totalPrice,
    w.advancePaid,
    (w.totalPrice - w.advancePaid),
    w.workDate,
    w.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dream-pictures-completed-work.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        localStorage.setItem(LS_KEY, "true");
        onLogin();
      } else {
        setError("Invalid admin credentials");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">DREAM PICTURES</h1>
          <p className="text-zinc-400 text-sm mt-1">CRM Admin Access</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs mb-1 uppercase tracking-wider">Username</label>
            <input
              data-testid="input-crm-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs mb-1 uppercase tracking-wider">Password</label>
            <input
              data-testid="input-crm-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>
          {error && (
            <p data-testid="text-crm-login-error" className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            data-testid="button-crm-login"
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Client Form ──────────────────────────────────────────────────────────────
function ClientForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: CrmClient | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: initial?.phone || "",
    dob: initial?.dob || "",
    anniversary: initial?.anniversary || "",
    address: initial?.address || "",
    notes: initial?.notes || "",
  });

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
      <h3 className="text-white font-semibold mb-4">{initial ? "Edit Client" : "Add New Client"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Client Name *</label>
          <input data-testid="input-client-name" value={form.name} onChange={e => set("name", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Phone *</label>
          <input data-testid="input-client-phone" value={form.phone} onChange={e => set("phone", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Date of Birth</label>
          <input data-testid="input-client-dob" type="date" value={form.dob} onChange={e => set("dob", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Marriage Anniversary</label>
          <input data-testid="input-client-anniversary" type="date" value={form.anniversary} onChange={e => set("anniversary", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Address</label>
          <input data-testid="input-client-address" value={form.address} onChange={e => set("address", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Notes</label>
          <textarea data-testid="input-client-notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button data-testid="button-save-client" onClick={() => onSave(form)} disabled={loading || !form.name || !form.phone}
          className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg px-5 py-2 disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : initial ? "Update Client" : "Save Client"}
        </button>
        <button data-testid="button-cancel-client" onClick={onCancel}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg px-4 py-2 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Work Form ────────────────────────────────────────────────────────────────
function WorkForm({
  clients,
  initial,
  onSave,
  onCancel,
  loading,
}: {
  clients: CrmClient[];
  initial?: CrmWork | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    clientId: initial?.clientId?.toString() || "",
    clientName: initial?.clientName || "",
    description: initial?.description || "",
    totalPrice: initial?.totalPrice?.toString() || "",
    advancePaid: initial?.advancePaid?.toString() || "",
    workDate: initial?.workDate || "",
    status: initial?.status || "pending",
  });

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  const balance = (parseFloat(form.totalPrice) || 0) - (parseFloat(form.advancePaid) || 0);

  function handleClientChange(id: string) {
    const client = clients.find(c => c.id.toString() === id);
    setForm(f => ({ ...f, clientId: id, clientName: client?.name || f.clientName }));
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
      <h3 className="text-white font-semibold mb-4">{initial ? "Edit Work" : "Add New Work"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Client *</label>
          <select data-testid="select-work-client" value={form.clientId} onChange={e => handleClientChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
            <option value="">— Select Client —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Client Name (if not in list)</label>
          <input data-testid="input-work-clientname" value={form.clientName} onChange={e => set("clientName", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Work Description *</label>
          <input data-testid="input-work-description" value={form.description} onChange={e => set("description", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Total Price (₹) *</label>
          <input data-testid="input-work-total" type="number" value={form.totalPrice} onChange={e => set("totalPrice", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Advance Paid (₹)</label>
          <input data-testid="input-work-advance" type="number" value={form.advancePaid} onChange={e => set("advancePaid", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Balance (Auto)</label>
          <div data-testid="text-work-balance" className={`px-3 py-2 rounded-lg text-sm font-semibold ${balance > 0 ? "bg-red-900/30 text-red-400 border border-red-800" : "bg-green-900/30 text-green-400 border border-green-800"}`}>
            ₹{balance.toLocaleString("en-IN")}
          </div>
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Work Date *</label>
          <input data-testid="input-work-date" type="date" value={form.workDate} onChange={e => set("workDate", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1">Status</label>
          <select data-testid="select-work-status" value={form.status} onChange={e => set("status", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button data-testid="button-save-work" onClick={() => onSave(form)} disabled={loading || !form.clientName || !form.description || !form.workDate}
          className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg px-5 py-2 disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : initial ? "Update Work" : "Save Work"}
        </button>
        <button data-testid="button-cancel-work" onClick={onCancel}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg px-4 py-2 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main CRM Component ───────────────────────────────────────────────────────
export default function AdminCRM() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(LS_KEY) === "true");
  const [tab, setTab] = useState<"dashboard" | "clients" | "works">("dashboard");
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClient, setEditClient] = useState<CrmClient | null>(null);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [editWork, setEditWork] = useState<CrmWork | null>(null);

  const qc = useQueryClient();

  const { data: clients = [], isLoading: loadingClients } = useQuery<CrmClient[]>({
    queryKey: ["/api/crm/clients"],
    enabled: authed,
  });

  const { data: works = [], isLoading: loadingWorks } = useQuery<CrmWork[]>({
    queryKey: ["/api/crm/works"],
    enabled: authed,
  });

  const createClientMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/crm/clients", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/crm/clients"] }); setShowClientForm(false); },
  });
  const updateClientMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/crm/clients/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/crm/clients"] }); setEditClient(null); },
  });
  const deleteClientMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/crm/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/crm/clients"] }),
  });

  const createWorkMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/crm/works", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/crm/works"] }); setShowWorkForm(false); },
  });
  const updateWorkMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/crm/works/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/crm/works"] }); setEditWork(null); },
  });
  const deleteWorkMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/crm/works/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/crm/works"] }),
  });

  function markDone(work: CrmWork) {
    updateWorkMut.mutate({ id: work.id, data: { ...work, status: "done" } });
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const pendingWorks = works.filter(w => w.status === "pending");
  const doneWorks = works.filter(w => w.status === "done");
  const pendingPayments = works.filter(w => (w.totalPrice - w.advancePaid) > 0);
  const upcomingBirthdays = clients.filter(c => { const d = daysUntil(c.dob); return d !== null && d <= 30; })
    .sort((a, b) => (daysUntil(a.dob) ?? 999) - (daysUntil(b.dob) ?? 999));
  const upcomingAnniversaries = clients.filter(c => { const d = daysUntil(c.anniversary); return d !== null && d <= 30; })
    .sort((a, b) => (daysUntil(a.anniversary) ?? 999) - (daysUntil(b.anniversary) ?? 999));

  const totalBalance = pendingPayments.reduce((sum, w) => sum + (w.totalPrice - w.advancePaid), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="text-amber-500 font-bold text-lg tracking-wide">DREAM PICTURES</span>
          <span className="text-zinc-500 text-sm ml-2">CRM</span>
        </div>
        <button data-testid="button-crm-logout"
          onClick={() => { localStorage.removeItem(LS_KEY); setAuthed(false); }}
          className="text-zinc-500 hover:text-red-400 text-xs transition-colors">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900">
        {(["dashboard", "clients", "works"] as const).map(t => (
          <button key={t} data-testid={`tab-crm-${t}`}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-400 hover:text-white"}`}>
            {t === "dashboard" ? "Dashboard" : t === "clients" ? "Clients" : "Work"}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto p-4">

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div data-testid="card-pending-work" className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{pendingWorks.length}</div>
                <div className="text-red-300 text-xs mt-1 uppercase tracking-wider">Pending Work</div>
              </div>
              <div data-testid="card-pending-payments" className="bg-orange-950/50 border border-orange-800 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-orange-400">{formatCurrency(totalBalance)}</div>
                <div className="text-orange-300 text-xs mt-1 uppercase tracking-wider">Balance Due</div>
              </div>
              <div data-testid="card-birthdays" className="bg-blue-950/50 border border-blue-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{upcomingBirthdays.length}</div>
                <div className="text-blue-300 text-xs mt-1 uppercase tracking-wider">Birthdays (30d)</div>
              </div>
              <div data-testid="card-anniversaries" className="bg-pink-950/50 border border-pink-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-pink-400">{upcomingAnniversaries.length}</div>
                <div className="text-pink-300 text-xs mt-1 uppercase tracking-wider">Anniv. (30d)</div>
              </div>
            </div>

            {/* Pending Work Alert */}
            {pendingWorks.length > 0 && (
              <div>
                <h2 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block"></span>
                  Pending Work Alert
                </h2>
                <div className="space-y-2">
                  {pendingWorks.map(w => (
                    <div key={w.id} data-testid={`card-pending-work-${w.id}`} className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-white font-semibold">{w.clientName}</div>
                        <div className="text-zinc-400 text-sm">{w.description}</div>
                        <div className="text-zinc-500 text-xs mt-1">{formatDate(w.workDate)}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {(w.totalPrice - w.advancePaid) > 0 && (
                          <span className="text-red-400 text-sm font-semibold">{formatCurrency(w.totalPrice - w.advancePaid)} due</span>
                        )}
                        <button data-testid={`button-markdone-${w.id}`} onClick={() => markDone(w)}
                          className="bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">
                          Mark Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Payments */}
            {pendingPayments.length > 0 && (
              <div>
                <h2 className="text-orange-400 font-bold text-sm uppercase tracking-wider mb-3">Pending Payments</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                        <th className="text-left pb-2">Client</th>
                        <th className="text-left pb-2">Work</th>
                        <th className="text-right pb-2">Total</th>
                        <th className="text-right pb-2">Advance</th>
                        <th className="text-right pb-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map(w => (
                        <tr key={w.id} data-testid={`row-payment-${w.id}`} className="border-b border-zinc-800/50">
                          <td className="py-2 text-white">{w.clientName}</td>
                          <td className="py-2 text-zinc-400">{w.description}</td>
                          <td className="py-2 text-right text-zinc-300">{formatCurrency(w.totalPrice)}</td>
                          <td className="py-2 text-right text-zinc-300">{formatCurrency(w.advancePaid)}</td>
                          <td className="py-2 text-right font-bold text-red-400">{formatCurrency(w.totalPrice - w.advancePaid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div>
                <h2 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-3">Upcoming Birthdays</h2>
                <div className="space-y-2">
                  {upcomingBirthdays.map(c => {
                    const d = daysUntil(c.dob);
                    return (
                      <div key={c.id} data-testid={`card-birthday-${c.id}`} className="bg-blue-950/30 border border-blue-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold">{c.name}</div>
                          <div className="text-zinc-400 text-xs">{c.phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-bold">{d === 0 ? "Today!" : `${d} day${d === 1 ? "" : "s"}`}</div>
                          <div className="text-zinc-500 text-xs">{formatDate(c.dob)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Anniversaries */}
            {upcomingAnniversaries.length > 0 && (
              <div>
                <h2 className="text-pink-400 font-bold text-sm uppercase tracking-wider mb-3">Upcoming Anniversaries</h2>
                <div className="space-y-2">
                  {upcomingAnniversaries.map(c => {
                    const d = daysUntil(c.anniversary);
                    return (
                      <div key={c.id} data-testid={`card-anniversary-${c.id}`} className="bg-pink-950/30 border border-pink-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold">{c.name}</div>
                          <div className="text-zinc-400 text-xs">{c.phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-pink-400 font-bold">{d === 0 ? "Today!" : `${d} day${d === 1 ? "" : "s"}`}</div>
                          <div className="text-zinc-500 text-xs">{formatDate(c.anniversary)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pendingWorks.length === 0 && pendingPayments.length === 0 && upcomingBirthdays.length === 0 && upcomingAnniversaries.length === 0 && (
              <div className="text-center py-12 text-zinc-600">All clear — no alerts right now.</div>
            )}
          </div>
        )}

        {/* ── CLIENTS TAB ───────────────────────────────────── */}
        {tab === "clients" && (
          <div className="mt-4">
            {!showClientForm && !editClient && (
              <button data-testid="button-add-client" onClick={() => setShowClientForm(true)}
                className="mb-4 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg px-5 py-2 transition-colors">
                + Add Client
              </button>
            )}
            {showClientForm && (
              <ClientForm
                onSave={d => createClientMut.mutate(d)}
                onCancel={() => setShowClientForm(false)}
                loading={createClientMut.isPending}
              />
            )}
            {editClient && (
              <ClientForm
                initial={editClient}
                onSave={d => updateClientMut.mutate({ id: editClient.id, data: d })}
                onCancel={() => setEditClient(null)}
                loading={updateClientMut.isPending}
              />
            )}
            {loadingClients ? (
              <div className="text-zinc-500 text-center py-8">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="text-zinc-600 text-center py-8">No clients yet. Add your first client above.</div>
            ) : (
              <div className="space-y-2">
                {clients.map(c => (
                  <div key={c.id} data-testid={`card-client-${c.id}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold">{c.name}</div>
                      <div className="text-zinc-400 text-sm">{c.phone}</div>
                      {c.address && <div className="text-zinc-500 text-xs mt-0.5">{c.address}</div>}
                      <div className="flex gap-4 mt-1">
                        {c.dob && <span className="text-blue-400 text-xs">🎂 {formatDate(c.dob)}</span>}
                        {c.anniversary && <span className="text-pink-400 text-xs">💍 {formatDate(c.anniversary)}</span>}
                      </div>
                      {c.notes && <div className="text-zinc-500 text-xs mt-1 italic">{c.notes}</div>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button data-testid={`button-edit-client-${c.id}`} onClick={() => { setEditClient(c); setShowClientForm(false); }}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">
                        Edit
                      </button>
                      <button data-testid={`button-delete-client-${c.id}`}
                        onClick={() => { if (confirm(`Delete ${c.name}? This will also delete their work records.`)) deleteClientMut.mutate(c.id); }}
                        className="bg-red-900/60 hover:bg-red-800 text-red-300 text-xs rounded-lg px-3 py-1.5 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WORKS TAB ─────────────────────────────────────── */}
        {tab === "works" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              {!showWorkForm && !editWork && (
                <button data-testid="button-add-work" onClick={() => setShowWorkForm(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg px-5 py-2 transition-colors">
                  + Add Work
                </button>
              )}
              {doneWorks.length > 0 && (
                <button data-testid="button-export-csv" onClick={() => exportToCSV(works)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg px-4 py-2 transition-colors">
                  Export CSV
                </button>
              )}
            </div>

            {showWorkForm && (
              <WorkForm
                clients={clients}
                onSave={d => createWorkMut.mutate(d)}
                onCancel={() => setShowWorkForm(false)}
                loading={createWorkMut.isPending}
              />
            )}
            {editWork && (
              <WorkForm
                clients={clients}
                initial={editWork}
                onSave={d => updateWorkMut.mutate({ id: editWork.id, data: d })}
                onCancel={() => setEditWork(null)}
                loading={updateWorkMut.isPending}
              />
            )}

            {loadingWorks ? (
              <div className="text-zinc-500 text-center py-8">Loading works...</div>
            ) : (
              <>
                {/* Pending Works */}
                <div className="mb-6">
                  <h2 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block"></span>
                    Pending Work ({pendingWorks.length})
                  </h2>
                  {pendingWorks.length === 0 ? (
                    <div className="text-zinc-600 text-sm py-4 text-center">No pending work</div>
                  ) : (
                    <div className="space-y-2">
                      {pendingWorks.map(w => (
                        <div key={w.id} data-testid={`card-work-pending-${w.id}`} className="bg-red-950/20 border border-red-800/40 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{w.clientName}</span>
                                <span className="text-xs bg-red-800 text-red-200 rounded px-2 py-0.5">Pending</span>
                              </div>
                              <div className="text-zinc-400 text-sm mt-0.5">{w.description}</div>
                              <div className="flex gap-4 mt-2 text-xs">
                                <span className="text-zinc-400">Total: <span className="text-white">{formatCurrency(w.totalPrice)}</span></span>
                                <span className="text-zinc-400">Advance: <span className="text-green-400">{formatCurrency(w.advancePaid)}</span></span>
                                <span className="text-zinc-400">Balance: <span className="text-red-400 font-semibold">{formatCurrency(w.totalPrice - w.advancePaid)}</span></span>
                              </div>
                              <div className="text-zinc-500 text-xs mt-1">{formatDate(w.workDate)}</div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button data-testid={`button-markdone-work-${w.id}`} onClick={() => markDone(w)}
                                className="bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">
                                Mark Done
                              </button>
                              <button data-testid={`button-edit-work-${w.id}`} onClick={() => { setEditWork(w); setShowWorkForm(false); }}
                                className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">
                                Edit
                              </button>
                              <button data-testid={`button-delete-work-${w.id}`}
                                onClick={() => { if (confirm("Delete this work record?")) deleteWorkMut.mutate(w.id); }}
                                className="bg-red-900/60 hover:bg-red-800 text-red-300 text-xs rounded-lg px-2 py-1.5 transition-colors">
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed Works */}
                <div>
                  <h2 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-3">Completed Work History ({doneWorks.length})</h2>
                  {doneWorks.length === 0 ? (
                    <div className="text-zinc-600 text-sm py-4 text-center">No completed work yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                            <th className="text-left pb-2">Client</th>
                            <th className="text-left pb-2">Work</th>
                            <th className="text-right pb-2">Total</th>
                            <th className="text-right pb-2">Advance</th>
                            <th className="text-right pb-2">Balance</th>
                            <th className="text-left pb-2">Date</th>
                            <th className="text-left pb-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {doneWorks.map(w => (
                            <tr key={w.id} data-testid={`row-done-work-${w.id}`} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                              <td className="py-2 text-white">{w.clientName}</td>
                              <td className="py-2 text-zinc-400">{w.description}</td>
                              <td className="py-2 text-right text-zinc-300">{formatCurrency(w.totalPrice)}</td>
                              <td className="py-2 text-right text-green-400">{formatCurrency(w.advancePaid)}</td>
                              <td className="py-2 text-right text-zinc-400">{formatCurrency(w.totalPrice - w.advancePaid)}</td>
                              <td className="py-2 text-zinc-500 text-xs">{formatDate(w.workDate)}</td>
                              <td className="py-2">
                                <button data-testid={`button-delete-done-${w.id}`}
                                  onClick={() => { if (confirm("Delete this record?")) deleteWorkMut.mutate(w.id); }}
                                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors">✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
