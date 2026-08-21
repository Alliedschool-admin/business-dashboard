import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, Receipt, X, Download, Eye, CreditCard, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { exportToCSV } from "../utils/exportCsv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  sent: "bg-blue-100 text-blue-700 border border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  overdue: "bg-red-100 text-red-700 border border-red-200",
  cancelled: "bg-slate-100 text-slate-400 border border-slate-200"
};
const PAYMENT_METHODS = ["bank_transfer", "credit_card", "cash", "paypal", "check", "other"];

function Modal({ title, onClose, size = "max-w-3xl", children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const fmt = v => `$${Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({
    client_id: "",
    date: new Date().toISOString().slice(0, 10),
    due_date: "",
    status: "draft",
    notes: "",
    discount: 0,
    items: []
  });
  const [payForm, setPayForm] = useState({
    paid_amount: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank_transfer"
  });
  const [payInvoice, setPayInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get("/api/invoices").then(r => setInvoices(r.data));
  useEffect(() => {
    load();
    axios.get("/api/clients").then(r => setClients(r.data));
    axios.get("/api/products").then(r => setProducts(r.data));
  }, []);

  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setForm({
      client_id: "",
      date: new Date().toISOString().slice(0, 10),
      due_date: "",
      status: "draft",
      notes: "",
      discount: 0,
      items: [{ product_id: "", description: "", quantity: 1, unit_price: 0, tax_rate: 10, total: 0 }]
    });
    setEditId(null);
    setModal("form");
  };

  const openEdit = async id => {
    const { data } = await axios.get(`/api/invoices/${id}`);
    setForm({
      client_id: data.client_id,
      date: data.date,
      due_date: data.due_date || "",
      status: data.status,
      notes: data.notes || "",
      discount: data.discount || 0,
      items: data.items.map(it => ({ ...it }))
    });
    setEditId(id);
    setModal("form");
  };

  const openView = async id => {
    const { data } = await axios.get(`/api/invoices/${id}`);
    setViewData(data);
    setModal("view");
  };

  const openPay = inv => {
    setPayInvoice(inv);
    setPayForm({
      paid_amount: inv.total - (inv.paid_amount || 0),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "bank_transfer"
    });
    setModal("pay");
  };

  const addItem = () =>
    setForm(f => ({
      ...f,
      items: [...f.items, { product_id: "", description: "", quantity: 1, unit_price: 0, tax_rate: 10, total: 0 }]
    }));

  const removeItem = i =>
    setForm(f => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i)
    }));

  const updateItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === "product_id" && val) {
        const p = products.find(x => x.id === parseInt(val));
        if (p) {
          items[i].description = p.name;
          items[i].unit_price = p.unit_price;
          items[i].tax_rate = p.tax_rate;
        }
      }
      items[i].total = items[i].quantity * items[i].unit_price * (1 + items[i].tax_rate / 100);
      return { ...f, items };
    });
  };

  const calcTotals = () => {
    const subtotal = form.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
    const tax = form.items.reduce((s, it) => s + it.quantity * it.unit_price * (it.tax_rate / 100), 0);
    return { subtotal, tax, total: subtotal + tax - (form.discount || 0) };
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/invoices/${editId}`, form);
        toast.success("Invoice updated successfully!");
      } else {
        await axios.post("/api/invoices", form);
        toast.success("Invoice created successfully!");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Error saving invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/invoices/${payInvoice.id}/pay`, payForm);
      toast.success(`Payment recorded! Status: ${data.status}`);
      setModal(null);
      load();
    } catch {
      toast.error("Payment recording error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async id => {
    if (!confirm("Cancel this invoice?")) return;
    await axios.delete(`/api/invoices/${id}`);
    toast.success("Invoice cancelled");
    load();
  };

  const exportPDF = inv => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("INVOICE", 14, 20);
    doc.setFontSize(11);
    doc.text(`${inv.invoice_number}`, 14, 30);
    doc.text(`Date: ${inv.date}`, 14, 38);
    doc.text(`Due: ${inv.due_date || "—"}`, 14, 46);
    doc.text(`Client: ${inv.client_name}`, 14, 54);
    doc.text(`Status: ${inv.status?.toUpperCase()}`, 14, 62);
    autoTable(doc, {
      startY: 72,
      head: [["Description", "Qty", "Unit Price", "Tax%", "Total"]],
      body: (inv.items || []).map(it => [
        it.description,
        it.quantity,
        fmt(it.unit_price),
        `${it.tax_rate}%`,
        fmt(it.total)
      ]),
      foot: [
        ["", "", "", "Subtotal", fmt(inv.subtotal)],
        ["", "", "", "Tax", fmt(inv.tax_amount)],
        ["", "", "", "TOTAL", fmt(inv.total)],
        inv.paid_amount > 0 ? ["", "", "", "Paid", fmt(inv.paid_amount)] : null
      ].filter(Boolean)
    });
    doc.save(`${inv.invoice_number}.pdf`);
  };

  const handleExportCSV = () => {
    const dataToExport = filtered.map(i => ({
      Invoice_Number: i.invoice_number,
      Client: i.client_name,
      Date: i.date,
      Due_Date: i.due_date || "",
      Subtotal: i.subtotal,
      Tax: i.tax_amount,
      Total: i.total,
      Paid_Amount: i.paid_amount || 0,
      Status: i.status,
      Payment_Method: i.payment_method || ""
    }));
    exportToCSV(`Invoices_Report_${new Date().toISOString().slice(0, 10)}`, dataToExport);
    toast.success("Invoices exported to CSV!");
  };

  const { subtotal, tax, total } = calcTotals();
  const canManage = ["admin", "manager"].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices & Billing</h1>
          <p className="text-slate-500 text-sm">{invoices.length} total invoices issued</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      <div className="card p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search invoices by number or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(s => (
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
                <th className="table-th">Invoice</th>
                <th className="table-th">Client</th>
                <th className="table-th">Issue Date</th>
                <th className="table-th">Due Date</th>
                <th className="table-th">Total Amount</th>
                <th className="table-th">Amount Paid</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-semibold text-primary-600">{inv.invoice_number}</td>
                  <td className="table-td font-medium text-slate-800">{inv.client_name}</td>
                  <td className="table-td text-slate-500">{inv.date}</td>
                  <td className="table-td text-slate-500">{inv.due_date || "—"}</td>
                  <td className="table-td font-semibold">{fmt(inv.total)}</td>
                  <td className="table-td font-semibold text-emerald-600">{fmt(inv.paid_amount)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="table-td text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openView(inv.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => exportPDF(inv)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <button
                          onClick={() => openPay(inv)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Record Payment"
                        >
                          <CreditCard className="w-3 h-3" /> Pay
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(inv.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {canManage && inv.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="Cancel Invoice"
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
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No invoices found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "form" && (
        <Modal title={editId ? "Edit Invoice" : "Create New Invoice"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Client *</label>
                <select
                  className="input"
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  required
                >
                  <option value="">— Select Client —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Issue Date *</label>
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  className="input"
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  {["draft", "sent", "paid", "overdue", "cancelled"].map(s => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Discount ($)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.discount}
                  onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Line Items</h3>
                <button type="button" onClick={addItem} className="btn-secondary py-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-lg p-2">
                    <div className="col-span-4">
                      <select
                        className="input text-xs py-1.5"
                        value={it.product_id}
                        onChange={e => updateItem(i, "product_id", e.target.value)}
                      >
                        <option value="">Custom Item</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input
                        className="input text-xs py-1.5"
                        placeholder="Description"
                        value={it.description}
                        onChange={e => updateItem(i, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        className="input text-xs py-1.5"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={it.quantity}
                        onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        className="input text-xs py-1.5"
                        type="number"
                        step="0.01"
                        value={it.unit_price}
                        onChange={e => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 flex items-start pt-1">
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-60 space-y-1 text-sm bg-slate-50 p-3 rounded-lg">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount</span>
                  <span>{fmt(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1 text-slate-900">
                  <span>Total Due</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Notes / Payment Terms</label>
              <textarea
                className="input"
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Invoice"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "pay" && payInvoice && (
        <Modal title={`Record Payment: ${payInvoice.invoice_number}`} onClose={() => setModal(null)} size="max-w-md">
          <form onSubmit={handlePay} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Total</span>
                <strong>{fmt(payInvoice.total)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Paid</span>
                <span className="text-emerald-600 font-semibold">{fmt(payInvoice.paid_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-slate-500 font-medium">Outstanding Balance</span>
                <strong className="text-red-600 font-bold">{fmt(payInvoice.total - (payInvoice.paid_amount || 0))}</strong>
              </div>
            </div>

            <div>
              <label className="label">Payment Amount ($) *</label>
              <input
                className="input font-semibold text-base"
                type="number"
                step="0.01"
                value={payForm.paid_amount}
                onChange={e => setPayForm({ ...payForm, paid_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label className="label">Payment Date</label>
              <input
                className="input"
                type="date"
                value={payForm.payment_date}
                onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Payment Method</label>
              <select
                className="input capitalize"
                value={payForm.payment_method}
                onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>
                    {m.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-success">
                <CreditCard className="w-4 h-4" /> Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "view" && viewData && (
        <Modal title={viewData.invoice_number} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-slate-500 text-xs block">Billed To</span>
                <strong className="text-base text-slate-800">{viewData.client_name}</strong>
                {viewData.client_email && <div className="text-xs text-slate-500">{viewData.client_email}</div>}
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Invoice Status</span>
                <span className={`badge mt-1 ${STATUS_STYLES[viewData.status]}`}>{viewData.status}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Date Issued</span>
                <span className="font-medium text-slate-700">{viewData.date}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Due Date</span>
                <span className="font-medium text-slate-700">{viewData.due_date || "—"}</span>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="table-th">Description</th>
                  <th className="table-th">Qty</th>
                  <th className="table-th">Unit Price</th>
                  <th className="table-th text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(viewData.items || []).map((it, i) => (
                  <tr key={i} className="border-b">
                    <td className="table-td">{it.description}</td>
                    <td className="table-td">{it.quantity}</td>
                    <td className="table-td">{fmt(it.unit_price)}</td>
                    <td className="table-td text-right font-semibold">{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm bg-slate-50 p-3 rounded-lg">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{fmt(viewData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount</span>
                  <span>{fmt(viewData.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total</span>
                  <span>{fmt(viewData.total)}</span>
                </div>
                {viewData.paid_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Paid to Date</span>
                    <span>{fmt(viewData.paid_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button onClick={() => exportPDF(viewData)} className="btn-secondary">
                <Download className="w-4 h-4" /> Export PDF
              </button>
              {viewData.status !== "paid" && viewData.status !== "cancelled" && (
                <button
                  onClick={() => {
                    setModal(null);
                    openPay(viewData);
                  }}
                  className="btn-success"
                >
                  <CreditCard className="w-4 h-4" /> Record Payment
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}