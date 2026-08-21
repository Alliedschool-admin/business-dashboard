import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users as UsersIcon,
  X,
  Shield,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Sparkles,
  Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = ["admin", "manager", "staff"];
const ROLE_BADGES = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  staff: "bg-green-100 text-green-700 border-green-200"
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

export default function Users() {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | "form" | "password"
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff", is_active: 1 });
  const [pwdForm, setPwdForm] = useState({ userId: null, userName: "", new_password: "" });
  const [editId, setEditId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => {
    axios
      .get("/api/users")
      .then(r => setUsersList(r.data))
      .catch(() => toast.error("Failed to load users list"));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = usersList.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "active" && u.is_active === 1) ||
      (roleFilter === "inactive" && u.is_active === 0) ||
      u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const openAdd = () => {
    setForm({ name: "", email: "", password: "", role: "staff", is_active: 1 });
    setEditId(null);
    setShowPassword(false);
    setModal("form");
  };

  const openEdit = u => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role, is_active: u.is_active });
    setEditId(u.id);
    setShowPassword(false);
    setModal("form");
  };

  const openResetPassword = u => {
    setPwdForm({ userId: u.id, userName: u.name, new_password: "" });
    setShowPassword(false);
    setModal("password");
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/users/${editId}`, form);
        toast.success("User updated successfully!");
      } else {
        if (!form.password) {
          toast.error("Password is required for new accounts");
          setLoading(false);
          return;
        }
        await axios.post("/api/users", form);
        toast.success("User created successfully!");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async e => {
    e.preventDefault();
    if (!pwdForm.new_password || pwdForm.new_password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`/api/users/${pwdForm.userId}/password`, { new_password: pwdForm.new_password });
      toast.success(`Password for ${pwdForm.userName} reset successfully!`);
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async u => {
    const newStatus = u.is_active ? 0 : 1;
    const action = newStatus ? "activate" : "deactivate";
    if (u.id === currentUser?.id) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    if (!confirm(`Are you sure you want to ${action} ${u.name}'s account?`)) return;

    try {
      await axios.put(`/api/users/${u.id}`, { is_active: newStatus });
      toast.success(`User ${newStatus ? "activated" : "deactivated"}`);
      load();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // KPIs
  const totalUsers = usersList.length;
  const activeUsers = usersList.filter(u => u.is_active === 1).length;
  const adminCount = usersList.filter(u => u.role === "admin").length;
  const staffCount = usersList.filter(u => u.role === "staff").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User & Password Management</h1>
          <p className="text-slate-500 text-sm">Control accounts, assign roles, and update credentials</p>
        </div>
        <button onClick={openAdd} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-primary-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsers}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeUsers}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrators</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{adminCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Members</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{staffCount}</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 flex-wrap w-full md:w-auto">
          {[
            { key: "all", label: "All Users" },
            { key: "admin", label: "Admins" },
            { key: "manager", label: "Managers" },
            { key: "staff", label: "Staff" },
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                roleFilter === f.key
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">User Profile</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="bg-primary-50 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">ID: #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-slate-600 font-medium">{u.email}</td>
                  <td className="table-td">
                    <span className={`badge border capitalize ${ROLE_BADGES[u.role] || "bg-slate-100 text-slate-600"}`}>
                      <Shield className="w-3 h-3 mr-1 inline" /> {u.role}
                    </span>
                  </td>
                  <td className="table-td">
                    {u.is_active ? (
                      <span className="badge bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-500 border border-slate-200">Inactive</span>
                    )}
                  </td>
                  <td className="table-td text-slate-500 text-xs">{u.created_at?.slice(0, 10) || "—"}</td>
                  <td className="table-td text-right">
                    <div className="flex gap-1.5 justify-end items-center">
                      {/* Change Password Button */}
                      <button
                        onClick={() => openResetPassword(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Change / Reset Password"
                      >
                        <Key className="w-3.5 h-3.5" /> Password
                      </button>

                      {/* Edit Details Button */}
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Edit User Info"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Toggle Active Status */}
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.is_active
                              ? "hover:bg-red-50 text-red-500"
                              : "hover:bg-emerald-50 text-emerald-600"
                          }`}
                          title={u.is_active ? "Deactivate Account" : "Activate Account"}
                        >
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
                    <p className="font-medium text-slate-600">No users match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {modal === "form" && (
        <Modal title={editId ? `Edit User: ${form.name}` : "Create New User Account"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full Name / Username *</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Alexander Smith"
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

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">
                  {editId ? "Change Password (leave empty to keep current)" : "Password *"}
                </label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, password: generateRandomPassword() })}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editId}
                  placeholder={editId ? "Enter new password if changing..." : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Role Permission *</label>
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
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : editId ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Password Reset Modal */}
      {modal === "password" && (
        <Modal title={`Reset Password for ${pwdForm.userName}`} onClose={() => setModal(null)}>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                As an Admin, you can set a new password directly for this user. The user will be able to log in immediately with the new password.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">New Password *</label>
                <button
                  type="button"
                  onClick={() => setPwdForm({ ...pwdForm, new_password: generateRandomPassword() })}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  value={pwdForm.new_password}
                  onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  required
                  placeholder="Enter new password (min 4 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}