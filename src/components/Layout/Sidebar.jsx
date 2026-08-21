import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  CreditCard,
  LogOut,
  Building2,
  ChevronRight,
  Wallet,
  Settings,
  Key,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/clients", icon: Building2, label: "Clients" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/quotations", icon: FileText, label: "Quotations" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
  { to: "/expenses", icon: CreditCard, label: "Expenses" },
  { to: "/users", icon: Users, label: "User Management", roles: ["admin"] }
];

const roleColors = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700"
};

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth();
  const [profileModal, setProfileModal] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const openProfile = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setProfileModal(true);
  };

  const handleUpdateProfile = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put("/api/users/profile/me", {
        name,
        email,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined
      });
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Profile & Password updated successfully!");
      setProfileModal(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={clsx("flex flex-col h-full bg-slate-900 text-white", mobile ? "w-full" : "w-64")}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">BizFlow</h1>
            <p className="text-xs text-slate-400">Business Suite</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          {navItems.map(item => {
            if (item.roles && !item.roles.includes(user?.role)) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {({ isActive }) => isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-800 bg-slate-950/40">
          <div
            onClick={openProfile}
            className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors group"
            title="Click to edit profile & password"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-sm font-bold shadow">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-primary-300 transition-colors">
                {user?.name}
              </p>
              <span className={clsx("badge text-[10px] mt-0.5", roleColors[user?.role])}>{user?.role}</span>
            </div>
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={openProfile}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Key className="w-3.5 h-3.5" /> Password
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-slate-800 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Profile & Change Password Modal */}
      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Account Settings</h2>
                <p className="text-xs text-slate-400">Update your username, email, or password</p>
              </div>
              <button
                onClick={() => setProfileModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="label">Your Name / Username</label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-3">Change Password (Optional)</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Current Password</label>
                    <div className="relative">
                      <input
                        className="input text-sm pr-10"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">New Password</label>
                    <div className="relative">
                      <input
                        className="input text-sm pr-10"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="New password (min 4 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button type="button" onClick={() => setProfileModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}