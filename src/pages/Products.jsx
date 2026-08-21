import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, Package, X, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { exportToCSV } from "../utils/exportCsv";

const emptyForm = { name: "", sku: "", description: "", category: "", unit_price: 0, tax_rate: 10, unit: "pcs", stock_quantity: 0 };
const CATEGORIES = ["Services", "Design", "Marketing", "Development", "Hosting", "Content", "Consulting", "Media", "Other"];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
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

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get("/api/products").then(r => setProducts(r.data));
  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const canManage = ["admin", "manager"].includes(user?.role);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal("form");
  };

  const openEdit = p => {
    setForm({
      name: p.name,
      sku: p.sku || "",
      description: p.description || "",
      category: p.category || "",
      unit_price: p.unit_price,
      tax_rate: p.tax_rate,
      unit: p.unit || "pcs",
      stock_quantity: p.stock_quantity
    });
    setEditId(p.id);
    setModal("form");
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/products/${editId}`, form);
        toast.success("Product updated successfully!");
      } else {
        await axios.post("/api/products", form);
        toast.success("Product created successfully!");
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
    if (!confirm("Archive this product?")) return;
    await axios.delete(`/api/products/${id}`);
    toast.success("Product archived");
    load();
  };

  const handleExportCSV = () => {
    const dataToExport = filtered.map(p => ({
      ID: p.id,
      Name: p.name,
      SKU: p.sku || "",
      Category: p.category || "",
      Unit_Price: p.unit_price,
      Tax_Rate: `${p.tax_rate}%`,
      Unit: p.unit,
      Stock_Quantity: p.stock_quantity,
      Description: p.description || ""
    }));
    exportToCSV(`Products_Catalog_${new Date().toISOString().slice(0, 10)}`, dataToExport);
    toast.success("Products exported to CSV!");
  };

  const categoryBadge = cat => {
    const colors = {
      Services: "bg-blue-100 text-blue-700",
      Design: "bg-purple-100 text-purple-700",
      Marketing: "bg-pink-100 text-pink-700",
      Development: "bg-indigo-100 text-indigo-700",
      Hosting: "bg-cyan-100 text-cyan-700",
      Content: "bg-green-100 text-green-700",
      Consulting: "bg-orange-100 text-orange-700",
      Media: "bg-red-100 text-red-700"
    };
    return colors[cat] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products & Services</h1>
          <p className="text-slate-500 text-sm">{products.length} items in catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          {canManage && (
            <button onClick={openAdd} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search products by title, SKU, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Product / SKU</th>
                <th className="table-th">Category</th>
                <th className="table-th">Unit Price</th>
                <th className="table-th">Tax</th>
                <th className="table-th">Unit</th>
                <th className="table-th">Stock</th>
                {canManage && <th className="table-th text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    {p.sku && <div className="text-xs text-slate-400 font-mono">{p.sku}</div>}
                  </td>
                  <td className="table-td">
                    <span className={`badge ${categoryBadge(p.category)}`}>{p.category || "—"}</span>
                  </td>
                  <td className="table-td font-semibold text-slate-800">
                    ${Number(p.unit_price).toLocaleString("en", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-td">{p.tax_rate}%</td>
                  <td className="table-td text-slate-500">{p.unit}</td>
                  <td className="table-td font-medium">{p.stock_quantity}</td>
                  {canManage && (
                    <td className="table-td text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "form" && (
        <Modal title={editId ? "Edit Product" : "Add New Product"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">SKU Code</label>
                <input
                  className="input font-mono"
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value })}
                  placeholder="PROD-001"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
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
                <label className="label">Unit Price ($) *</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.unit_price}
                  onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <label className="label">Tax Rate (%)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={form.tax_rate}
                  onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">Unit Measure</label>
                <input
                  className="input"
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  placeholder="pcs / month / hour"
                />
              </div>
              <div>
                <label className="label">Stock Quantity</label>
                <input
                  className="input"
                  type="number"
                  value={form.stock_quantity}
                  onChange={e => setForm({ ...form, stock_quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Product Description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}