import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  DollarSign,
  FileText,
  Save,
  Globe,
  Receipt,
  Percent,
  Upload,
  Link,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Cloud,
  Server,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    company_name: "",
    logo_url: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "USA",
    tax_number: "",
    currency_symbol: "$",
    default_tax_rate: 10,
    invoice_prefix: "INV-",
    quotation_prefix: "QUO-",
    footer_notes: ""
  });
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadMode, setUploadMode] = useState("url"); // "url" | "upload"

  const checkDb = async () => {
    setCheckingDb(true);
    try {
      const { data } = await axios.get("/api/settings/db-status");
      setDbStatus(data);
    } catch (e) {
      setDbStatus({ connected: false, error: "Failed to query database status" });
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    axios
      .get("/api/settings")
      .then(r => setForm(r.data))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setFetching(false));
    checkDb();
  }, []);

  const handleFileUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(prev => ({ ...prev, logo_url: ev.target.result }));
      toast.success("Logo loaded from file!");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put("/api/settings", form);
      toast.success(data.message || "Company settings & logo saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleClearDemoData = async () => {
    const confirmed = window.confirm(
      "⚠️ ARE YOU SURE?\n\nThis will permanently delete all demo Clients, Products, Quotations, Invoices, and Expenses so you can start with a fresh database for real business data.\n\nYour Admin account and login will be kept intact."
    );
    if (!confirmed) return;

    setClearingData(true);
    try {
      const { data } = await axios.post("/api/settings/clear-data");
      toast.success(data.message || "Demo data cleared successfully!", { duration: 5000 });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to clear demo data");
    } finally {
      setClearingData(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const CURRENCIES = [
    { symbol: "$", label: "USD / Dollar ($)" },
    { symbol: "€", label: "Euro (€)" },
    { symbol: "£", label: "British Pound (£)" },
    { symbol: "Rs", label: "Rupees (Rs)" },
    { symbol: "AED", label: "UAE Dirham (AED)" },
    { symbol: "CAD$", label: "Canadian Dollar (CAD$)" },
    { symbol: "AUD$", label: "Australian Dollar (AUD$)" },
    { symbol: "¥", label: "Yen / Yuan (¥)" }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Company & Database Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure company branding, currency, and verify permanent cloud database connection</p>
        </div>
      </div>

      {/* Cloud Database Live Status Card */}
      <div className={`card p-6 border-2 transition-all ${
        dbStatus?.connected
          ? "border-emerald-200 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/20"
          : "border-amber-200 bg-gradient-to-r from-amber-50/40 via-white to-orange-50/20"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${
              dbStatus?.connected ? "bg-emerald-600 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
            }`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900">Cloud Database Status:</h3>
                {dbStatus?.connected ? (
                  <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    🟢 Connected to MongoDB Atlas (Permanent 24/7)
                  </span>
                ) : (
                  <span className="badge bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    🟡 Local / Temporary Memory Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {dbStatus?.connected
                  ? "All invoices, clients, products, quotes, expenses, and settings are saved permanently in your MongoDB Atlas cloud database."
                  : dbStatus?.has_env
                  ? "MONGODB_URI detected, but connection was not completed. Check error diagnostics below."
                  : "Running on temporary storage. Add MONGODB_URI to Vercel Environment Variables to make data permanent."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkDb}
            disabled={checkingDb}
            className="btn-secondary whitespace-nowrap text-xs self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingDb ? "animate-spin" : ""}`} />
            {checkingDb ? "Checking..." : "Re-Check Status"}
          </button>
        </div>

        {/* Diagnostic Guide if not connected */}
        {!dbStatus?.connected && (
          <div className="mt-4 pt-4 border-t border-amber-200/70 text-xs text-slate-700 space-y-2">
            {dbStatus?.error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 font-mono text-[11px]">
                <strong>Connection Error:</strong> {dbStatus.error}
              </div>
            )}
            <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 space-y-1.5">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> How to fix & make data permanent:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>
                  In <strong>MongoDB Atlas</strong> ➔ <strong>Network Access</strong> ➔ Click <strong>Add IP Address</strong> ➔ Choose <strong>Allow Access from Anywhere (`0.0.0.0/0`)</strong>.
                </li>
                <li>
                  In <strong>Vercel Dashboard</strong> ➔ <strong>Settings</strong> ➔ <strong>Environment Variables</strong> ➔ Add <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">MONGODB_URI</code>.
                </li>
                <li>
                  Go to <strong>Deployments</strong> tab in Vercel ➔ Click the 3 dots on the latest deployment ➔ Click <strong>Redeploy</strong>.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Logo & Brand Identity */}
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Company Logo & Branding</h2>
              <p className="text-xs text-slate-400">This logo will automatically appear on all Invoices, Quotations, and PDF documents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    uploadMode === "url"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Link className="w-3.5 h-3.5" /> Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("upload")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    uploadMode === "upload"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File (from PC)
                </button>
              </div>

              {uploadMode === "url" ? (
                <div>
                  <label className="label">Logo Image URL</label>
                  <div className="relative">
                    <input
                      className="input pl-9"
                      type="url"
                      value={form.logo_url}
                      onChange={e => setForm({ ...form, logo_url: e.target.value })}
                      placeholder="https://example.com/your-logo.png"
                    />
                    <Link className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Paste any direct web link to a PNG, JPG, or SVG image</p>
                </div>
              ) : (
                <div>
                  <label className="label">Select Image File</label>
                  <label className="border-2 border-dashed border-slate-200 hover:border-primary-400 bg-slate-50 hover:bg-primary-50/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <Upload className="w-8 h-8 text-primary-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Click to choose image file</span>
                    <span className="text-xs text-slate-400 mt-0.5">Supports PNG, JPG, WebP, SVG (Max 2MB)</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {form.logo_url && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_url: "" })}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Logo
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[190px]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Header Preview</p>
              {form.logo_url ? (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm max-w-[220px] max-h-[100px] flex items-center justify-center overflow-hidden">
                  <img
                    src={form.logo_url}
                    alt="Company Logo"
                    className="max-h-16 max-w-full object-contain"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/180x60/e2e8f0/475569?text=Invalid+Image+URL";
                    }}
                  />
                </div>
              ) : (
                <div className="w-28 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-medium">
                  No Logo Set
                </div>
              )}
              <p className="text-[11px] text-slate-500 font-semibold mt-3 truncate max-w-full">
                {form.company_name || "Your Company Name"}
              </p>
            </div>
          </div>
        </div>

        {/* Company Identity */}
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Company Information</h2>
              <p className="text-xs text-slate-400">Official contact & tax details displayed on invoices and quotes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Company / Organization Name *</label>
              <input
                className="input text-base font-semibold"
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                required
                placeholder="e.g. Allied School System"
              />
            </div>

            <div>
              <label className="label">Official Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="billing@company.com"
              />
            </div>

            <div>
              <label className="label">Official Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Street Address</label>
              <input
                className="input"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="123 Business Avenue, Suite 100"
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                className="input"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="San Francisco / Lahore / London"
              />
            </div>

            <div>
              <label className="label">Country</label>
              <input
                className="input"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                placeholder="USA / Pakistan / UK"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">TAX / VAT / Registration Number</label>
              <input
                className="input"
                value={form.tax_number}
                onChange={e => setForm({ ...form, tax_number: e.target.value })}
                placeholder="VAT-987654321 / NTN-123456"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Presets */}
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Financial & Invoicing Presets</h2>
              <p className="text-xs text-slate-400">Configure currency symbol and standard calculation parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Currency Symbol</label>
              <select
                className="input font-semibold"
                value={form.currency_symbol}
                onChange={e => setForm({ ...form, currency_symbol: e.target.value })}
              >
                {CURRENCIES.map(c => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Default Tax Rate (%)</label>
              <div className="relative">
                <input
                  className="input pr-8 font-semibold"
                  type="number"
                  step="0.1"
                  value={form.default_tax_rate}
                  onChange={e => setForm({ ...form, default_tax_rate: parseFloat(e.target.value) || 0 })}
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="label">Invoice Number Prefix</label>
              <input
                className="input font-mono font-semibold"
                value={form.invoice_prefix}
                onChange={e => setForm({ ...form, invoice_prefix: e.target.value })}
                placeholder="INV-"
              />
            </div>

            <div>
              <label className="label">Quotation Number Prefix</label>
              <input
                className="input font-mono font-semibold"
                value={form.quotation_prefix}
                onChange={e => setForm({ ...form, quotation_prefix: e.target.value })}
                placeholder="QUO-"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Standard Invoice & Quotation Footer Terms</label>
              <textarea
                className="input"
                rows={3}
                value={form.footer_notes}
                onChange={e => setForm({ ...form, footer_notes: e.target.value })}
                placeholder="Payment terms, bank account transfer details, or thank you note..."
              />
            </div>
          </div>
        </div>

        {/* Save Action */}
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-base shadow-lg hover:shadow-xl">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Company & Branding Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* 1-Click Clear Demo Data Card */}
      {user?.role === "admin" && (
        <div className="card p-6 md:p-8 border-red-200/80 bg-gradient-to-b from-white to-red-50/20">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-100">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-900">Database & Demo Data Management</h2>
              <p className="text-xs text-slate-500">Clear sample records to begin entering your real business data</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-slate-600 max-w-xl">
              <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 inline" /> Ready to use this for your real business?
              </p>
              <p className="text-xs text-slate-500">
                Clicking this button will wipe all sample clients, products, quotations, invoices, and expenses. Your
                current Admin login credentials and company settings will be preserved.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearDemoData}
              disabled={clearingData}
              className="btn-danger px-6 py-2.5 whitespace-nowrap shadow-md"
            >
              {clearingData ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Clear All Demo Data (Start Fresh)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}