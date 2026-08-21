import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, Users as UsersIcon, X, Shield, Check, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = ["admin", "manager", "staff"];
const ROLE_BADGES = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  staff: "bg-green-100 text-green-700 border-green-200"
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff", is_active: 1 });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get("/api/users").then(r => setUsersList(r.data)).catch(err => toast.error("Failed to load users"));
  useEffect(() => { load(); }, []);

  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ name: "", email: "", password: "", role: "staff", is_active: 1 });
    setEditId(null);
    setModal("form");
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role, is_active: u.is_active });
    setEditId(u.id);
    setModal("form");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/users/${editId}`, form);
        toast.success("User updated successfully");
      } else {
        if (!form.password) {
          toast.error("Password is required for new user");
          setLoading(false);
          return;
        }
        await axios.post("/api/users", form);
        toast.success("User created successfully");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success("User deactivated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to deactivate");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm">Manage team accounts, permissions, and roles</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Role permission info banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-xs text-primary-900 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <strong className="block text-primary-950 font-semibold mb-0.5">Admin</strong>
          Full access: Create/edit/delete all records, manage users, approve expenses.
        </div>
        <div>
          <strong className="block text-primary-950 font-semibold mb-0.5">Manager</strong>
          Full business operations, approve expenses, create quotes & invoices, view reports.
        </div>
        <div>
          <strong className="block text-primary-950 font-semibold mb-0.5">Staff</strong>
          Create quotations & invoices, view clients/products, submit own expenses.
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search users by name, email, or role..."
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
                <th className="table-th">User</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Joined Date</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-primary-600 font-semibold">(You)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-slate-600">{u.email}</td>
                  <td className="table-td">
                    <span className={`badge border capitalize ${ROLE_BADGES[u.role] || "bg-slate-100 text-slate-600"}`}>
                      <Shield className="w-3 h-3 mr-1 inline" /> {u.role}
                    </span>
                  </td>
                  <td className="table-td">
                    {u.is_active ? (
                      <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Inactive</span>
                    )}
                  </td>
                  <td className="table-td text-slate-500 text-xs">{u.created_at?.slice(0, 10) || "—"}</td>
                  <td className="table-td text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id && u.is_active === 1 && (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="Deactivate"
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
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "form" && (
        <Modal title={editId ? "Edit User" : "Add New User"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Alex Johnson"
              />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                placeholder="user@bizflow.com"
              />
            </div>
            {!editId && (
              <div>
                <label className="label">Password *</label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}
            <div>
              <label className="label">Role *</label>
              <select
                className="input capitalize"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="capitalize">
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {editId && (
              <div>
                <label className="label">Account Status</label>
                <select
                  className="input"
                  value={form.is_active}
                  onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive / Deactivated</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-3">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
