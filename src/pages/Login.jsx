import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Wallet, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@bizflow.com");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const demoAccounts = [
    { label: "Admin", email: "admin@bizflow.com", password: "admin123", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    { label: "Manager", email: "manager@bizflow.com", password: "manager123", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { label: "Staff", email: "staff@bizflow.com", password: "staff123", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-xl mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">BizFlow</h1>
          <p className="text-slate-400 mt-1">Business Management Suite</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="input pl-10" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="input pl-10 pr-10" type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "Sign In"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Demo Login</p>
            <div className="flex gap-2">
              {demoAccounts.map(acc => (
                <button key={acc.label} onClick={()=>{ setEmail(acc.email); setPassword(acc.password); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${acc.color}`}>
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Click a role to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
