import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Wallet, Eye, EyeOff, Lock, User, RefreshCw, KeyRound, ShieldAlert } from "lucide-react";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("admin@bizflow.com");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(emailOrUsername, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid email/username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyReset = async () => {
    if (!window.confirm("Restore Admin credentials to default (admin@bizflow.com / admin123)?")) return;
    setResetting(true);
    try {
      const { data } = await axios.post("/api/auth/emergency-reset");
      toast.success(data.message || "Admin restored to admin@bizflow.com / admin123", { duration: 6000 });
      setEmailOrUsername("admin@bizflow.com");
      setPassword("admin123");
    } catch (err) {
      toast.error("Failed to reset admin access");
    } finally {
      setResetting(false);
    }
  };

  const demoAccounts = [
    { label: "Admin", email: "admin@bizflow.com", password: "admin123", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    { label: "Manager", email: "manager@bizflow.com", password: "manager123", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { label: "Staff", email: "staff@bizflow.com", password: "staff123", color: "bg-green-100 text-green-700 hover:bg-green-200" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl shadow-xl shadow-primary-500/20 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">BizFlow</h1>
          <p className="text-slate-400 text-sm mt-1">Enterprise Business Suite</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email or Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-10"
                  type="text"
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  required
                  placeholder="admin@bizflow.com or Admin User"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-10 pr-10"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base shadow-lg mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Quick presets */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Auto-Fill Credentials</p>
            <div className="flex gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => {
                    setEmailOrUsername(acc.email);
                    setPassword(acc.password);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Admin Access Recovery */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleEmergencyReset}
              disabled={resetting}
              className="text-xs text-slate-500 hover:text-primary-600 font-semibold inline-flex items-center gap-1.5 transition-colors p-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {resetting ? "Restoring Admin..." : "Locked out? Restore Admin Account (admin123)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}