import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, CreditCard, X, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { exportToCSV } from "../utils/exportCsv";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  paid: "bg-blue-100 text-blue-700 border border-blue-200"
};
const CATEGORIES = ["Rent", "Software", "Meals", "Marketing", "Supplies", "Travel", "Equipment", "Training", "Utilities", "Salary", "Other"];

function Modal({ title, onClose, size = "max-w-lg", children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const fmt = v => `$${Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
const emptyForm = { title: "", amount: "", category: "", date: new Date().toISOString().slice(0, 10), description: "", receipt_notes: "" };

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get("/api/expenses").then(r => setExpenses(r.data));
  useEffect(() => {
    load();
  }, []);

  const filtered = expenses.filter(e => {
    const ms = e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || e.status === statusFilter;
    return ms && mst;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal("form");
  };

  const openEdit = e => {
    setForm({
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date,
      description: e.description || "",
      receipt_notes: e.receipt_notes || ""
    });
    setEditId(e.id);
    setModal("form");
  };

  const handleSave = async ev => {
    ev.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/expenses/${editId}`, form);
        toast.success("Expense updated successfully!");
      } else {
        await axios.post("/api/expenses", form);
        toast.success("Expense submitted successfully!");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Error saving expense");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async id => {
    await axios.post(`/api/expenses/${id}/approve`);
    toast.success("Expense approved!");
    load();
  };

  const handleReject = async id => {
    await axios.post(`/api/expenses/${id}/reject`);
    toast.success("Expense rejected");
    load();
  };

  const handleDelete = async id => {
    if (!confirm("Delete this expense?")) return;
    await axios.delete(`/api/expenses/${id}`);
    toast.success("Expense deleted");
    load();
  };

  const handleExportCSV = () => {
    const dataToExport = filtered.map(e => ({
      ID: e.id,
      Title: e.title,
      Category: e.category,
      Amount: e.amount,
      Date: e.date,
      Submitted_By: e.created_by_name || "",
      Status: e.status,
      Receipt_Notes: e.receipt_notes || "",
      Description: e.description || ""
    }));
    exportToCSV(`Expenses_Report_${new Date().toISOString().slice(0, 10)}`, dataToExport);
    toast.success("Expenses exported to CSV!");
  };

  const canApprove = ["admin", "manager"].includes(user?.role);
  const totalApproved = expenses.filter(e => ["approved", "paid"].includes(e.status)).reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expense Tracking</h1>
          <p className="text-slate-500 text-sm">{expenses.length} recorded operational expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Approved", value: fmt(totalApproved), color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700" },
          { label: "Pending Approvals", value: fmt(totalPending), color: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
          { label: "Pending Claims", value: expenses.filter(e => e.status === "pending").length, color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
          {
            label: "This Month",
            value: fmt(
              expenses
                .filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7)))
                .reduce((s, e) => s + e.amount, 0)
            ),
            color: "bg-purple-50 border-purple-200",
            textColor: "text-purple-700"
          }
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search expenses by title or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "pending", "approved", "paid", "rejected"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? "bg-primary-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Expense Title</th>
                <th className="table-th">Category</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Date</th>
                <th className="table-th">Submitted By</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium text-slate-800">
                    <div>{e.title}</div>
                    {e.description && <div className="text-xs text-slate-400 mt-0.5">{e.description}</div>}
                  </td>
                  <td className="table-td">
                    <span className="badge bg-slate-100 text-slate-700 border border-slate-200">{e.category}</span>
                  </td>
                  <td className="table-td font-semibold text-slate-900">{fmt(e.amount)}</td>
                  <td className="table-td text-slate-500">{e.date}</td>
                  <td className="table-td text-slate-600 font-medium">{e.created_by_name}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="table-td text-right">
                    <div className="flex gap-1 justify-end items-center">
                      {(e.status === "pending" && (user?.id === e.created_by || canApprove)) && (
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canApprove && e.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(e.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(e.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No expenses found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "form" && (
        <Modal title={editId ? "Edit Expense Claim" : "Record New Expense"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Expense Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g. Office Stationery / Client Dinner"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount ($) *</label>
                <input
                  className="input font-semibold"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Expense Date *</label>
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">— Select Category —</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description / Purpose</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Reason or project breakdown..."
              />
            </div>
            <div>
              <label className="label">Receipt / Reference Notes</label>
              <input
                className="input"
                value={form.receipt_notes}
                onChange={e => setForm({ ...form, receipt_notes: e.target.value })}
                placeholder="Receipt # / Card slip info"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Submit Expense"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}