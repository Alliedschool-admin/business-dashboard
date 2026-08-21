import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, Package, FileText, Receipt,
  CreditCard, LogOut, Building2, ChevronRight, Wallet
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/clients", icon: Building2, label: "Clients" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/quotations", icon: FileText, label: "Quotations" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
  { to: "/expenses", icon: CreditCard, label: "Expenses" },
  { to: "/users", icon: Users, label: "Users", roles: ["admin"] },
];

const roleColors = { admin: "bg-purple-100 text-purple-700", manager: "bg-blue-100 text-blue-700", staff: "bg-green-100 text-green-700" };

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth();

  return (
    <div className={clsx("flex flex-col h-full bg-slate-900 text-white", mobile ? "w-full" : "w-64")}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
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
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {({ isActive }) => isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <span className={clsx("badge text-xs", roleColors[user?.role])}>{user?.role}</span>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
