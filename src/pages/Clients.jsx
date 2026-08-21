import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, Building2, Mail, Phone, MapPin, X, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { exportToCSV } from "../utils/exportCsv";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  country: "USA",
  tax_number: "",
  payment_terms: 30,
  notes: ""
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get("/api/clients").then(r => setClients(r.data));
  useEffect(() => {
    load();
  }, []);

  const filtered = clients.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal("form");
  };

  const openEdit = c => {
    setForm({
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      company: c.company || "",
      address: c.address || "",
      city: c.city || "",
      country: c.country || "USA",
      tax_number: c.tax_number || "",
      payment_terms: c.payment_terms || 30,
      notes: c.notes || ""
    });
    setEditId(c.id);
    setModal("form");
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/clients/${editId}`, form);
        toast.success("Client updated successfully!");
      } else {
        await axios.post("/api/clients", form);
        toast.success("Client created successfully!");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!confirm("Delete this client?")) return;
    await axios.delete(`/api/clients/${id}`);
    toast.success("Client deleted");
    load();
  };

  const handleExportCSV = () => {
    const dataToExport = filtered.map(c => ({
      ID: c.id,
      Name: c.name,
      Company: c.company || "",
      Email: c.email || "",
      Phone: c.phone || "",
      Address: c.address || "",
      City: c.city || "",
      Country: c.country || "",
      Tax_Number: c.tax_number || "",
      Payment_Terms_Days: c.payment_terms || 30
    }));
    exportToCSV(`Clients_Directory_${new Date().toISOString().slice(0, 10)}`, dataToExport);
    toast.success("Clients exported to CSV!");
  };

  const canManage = ["admin", "manager"].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Client Directory</h1>
          <p className="text-slate-500 text-sm">{clients.length} registered business clients</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search clients by name, company, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="card hover:shadow-md transition-shadow group relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.company || "Individual Client"}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {canManage && (
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {c.email && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span>{c.phone}</span>
                </div>
              )}
              {(c.city || c.country) && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span>{[c.city, c.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Terms: Net {c.payment_terms} days</span>
              {c.tax_number && <span className="text-slate-400 font-mono">TAX: {c.tax_number}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No clients found</p>
          </div>
        )}
      </div>

      {modal === "form" && (
        <Modal title={editId ? "Edit Client Profile" : "Add New Client"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Company / Organization</label>
                <input
                  className="input"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Street Address</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  className="input"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Tax / VAT ID</label>
                <input
                  className="input"
                  value={form.tax_number}
                  onChange={e => setForm({ ...form, tax_number: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Payment Terms (days)</label>
                <input
                  className="input"
                  type="number"
                  value={form.payment_terms}
                  onChange={e => setForm({ ...form, payment_terms: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Client Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Client"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}