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
  CheckCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    company_name: "",
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
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    axios
      .get("/api/settings")
      .then(r => {
        setForm(r.data);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put("/api/settings", form);
      toast.success(data.message || "Settings updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save settings");
    } finally {
      setLoading(false);
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
    { symbol: "$", label: "USD / Standard ($)" },
    { symbol: "€", label: "Euro (€)" },
    { symbol: "£", label: "British Pound (£)" },
    { symbol: "Rs", label: "Rupees (Rs)" },
    { symbol: "AED", label: "UAE Dirham (AED)" },
    { symbol: "CAD$", label: "Canadian Dollar (CAD$)" },
    { symbol: "AUD$", label: "Australian Dollar (AUD$)" },
    { symbol: "¥", label: "Yen / Yuan (¥)" }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System & Company Settings</h1>
        <p className="text-slate-500 text-sm">Customize your organization identity, currency, and invoice presets</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Company Information</h2>
              <p className="text-xs text-slate-400">Printed on all generated quotes, invoices, and PDF receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Company / Organization Name *</label>
              <input
                className="input"
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                required
                placeholder="e.g. Allied School & Education System"
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

            <div>
              <label className="label">TAX / VAT / Registration Number</label>
              <input
                className="input"
                value={form.tax_number}
                onChange={e => setForm({ ...form, tax_number: e.target.value })}
                placeholder="VAT-987654321"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Presets */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Financial & Invoicing Presets</h2>
              <p className="text-xs text-slate-400">Configure currency symbol and standard calculation parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Currency Symbol</label>
              <select
                className="input"
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
                  className="input pr-8"
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
                className="input"
                value={form.invoice_prefix}
                onChange={e => setForm({ ...form, invoice_prefix: e.target.value })}
                placeholder="INV-"
              />
            </div>

            <div>
              <label className="label">Quotation Number Prefix</label>
              <input
                className="input"
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

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 text-base shadow-md">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save System Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}