import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, FileText, AlertCircle, TrendingUp, Users, Package, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { paid:"bg-emerald-100 text-emerald-700", sent:"bg-blue-100 text-blue-700", draft:"bg-slate-100 text-slate-600", overdue:"bg-red-100 text-red-700", cancelled:"bg-slate-100 text-slate-400", pending:"bg-amber-100 text-amber-700", approved:"bg-emerald-100 text-emerald-700", rejected:"bg-red-100 text-red-700" };
const PIE_COLORS = ["#0ea5e9","#a855f7","#f97316","#22c55e","#f43f5e","#eab308","#14b8a6","#8b5cf6"];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [expensePie, setExpensePie] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("/api/dashboard/stats"),
      axios.get("/api/dashboard/revenue-chart"),
      axios.get("/api/dashboard/expense-chart"),
      axios.get("/api/dashboard/recent-invoices"),
      axios.get("/api/dashboard/recent-expenses"),
    ]).then(([s,r,e,ri,re]) => {
      setStats(s.data);
      setRevenue(r.data.map(d => ({ ...d, month: d.month?.slice(0,7) })));
      setExpensePie(e.data);
      setRecentInvoices(ri.data);
      setRecentExpenses(re.data);
    });
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const fmt = v => `$${Number(v||0).toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back! Here is your business overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={fmt(stats.totalRevenue)} sub="From paid invoices" color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={AlertCircle} label="Outstanding" value={fmt(stats.outstandingAmount)} sub={`${stats.pendingInvoices} pending invoices`} color="bg-amber-100 text-amber-600" />
        <StatCard icon={TrendingUp} label="Total Expenses" value={fmt(stats.totalExpenses)} sub={`${stats.pendingExpenses} awaiting approval`} color="bg-red-100 text-red-600" />
        <StatCard icon={FileText} label="Quotations" value={stats.totalQuotations} sub={`${stats.totalClients} active clients`} color="bg-primary-100 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Clients" value={stats.totalClients} color="bg-purple-100 text-purple-600" />
        <StatCard icon={Package} label="Products" value={stats.totalProducts} color="bg-cyan-100 text-cyan-600" />
        <StatCard icon={Clock} label="Pending Approvals" value={stats.pendingExpenses} color="bg-orange-100 text-orange-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-base font-bold text-slate-800 mb-4">Revenue Overview (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:12}} stroke="#cbd5e1"/>
              <YAxis tick={{fontSize:12}} stroke="#cbd5e1" tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v,n)=>[`$${Number(v).toLocaleString()}`,n==="revenue"?"Collected":"Invoiced"]}/>
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#gRev)" strokeWidth={2} name="revenue"/>
              <Area type="monotone" dataKey="invoiced" stroke="#a855f7" fill="url(#gInv)" strokeWidth={2} name="invoiced"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-4">Expenses by Category</h2>
          {expensePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expensePie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="total" nameKey="category" paddingAngle={3}>
                  {expensePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v=>`$${Number(v).toLocaleString()}`}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"11px"}}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-16">No expense data</p>}
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-4">Recent Invoices</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100"><th className="table-th pl-0">Invoice</th><th className="table-th">Client</th><th className="table-th">Amount</th><th className="table-th">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td pl-0 font-medium text-primary-600">{inv.invoice_number}</td>
                    <td className="table-td text-slate-500 truncate max-w-[100px]">{inv.client_name}</td>
                    <td className="table-td font-medium">{fmt(inv.total)}</td>
                    <td className="table-td"><span className={`badge ${STATUS_COLORS[inv.status]||"badge-gray"}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-4">Recent Expenses</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100"><th className="table-th pl-0">Title</th><th className="table-th">Category</th><th className="table-th">Amount</th><th className="table-th">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {recentExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td pl-0 font-medium">{exp.title}</td>
                    <td className="table-td text-slate-500">{exp.category}</td>
                    <td className="table-td font-medium">{fmt(exp.amount)}</td>
                    <td className="table-td"><span className={`badge ${STATUS_COLORS[exp.status]||""}`}>{exp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
