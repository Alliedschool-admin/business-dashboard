const router = require("express").Router();
const db = require("../db");
const { authenticate } = require("../auth");

router.use(authenticate);

router.get("/stats", (req, res) => {
  const invoices = db.data.invoices || [];
  const expenses = db.data.expenses || [];
  const clients = db.data.clients || [];
  const products = db.data.products || [];
  const quotations = db.data.quotations || [];

  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const pendingInvoices = invoices.filter(i => ["sent", "draft"].includes(i.status)).length;

  const outstandingAmount = invoices
    .filter(i => ["sent", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + ((i.total || 0) - (i.paid_amount || 0)), 0);

  const totalExpenses = expenses
    .filter(e => ["approved", "paid"].includes(e.status))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const pendingExpenses = expenses.filter(e => e.status === "pending").length;
  const totalClients = clients.filter(c => c.is_active === 1).length;
  const totalProducts = products.filter(p => p.is_active === 1).length;
  const totalQuotations = quotations.length;

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    pendingInvoices,
    outstandingAmount: Math.round(outstandingAmount * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    pendingExpenses,
    totalClients,
    totalProducts,
    totalQuotations
  });
});

router.get("/revenue-chart", (req, res) => {
  const invoices = db.data.invoices || [];
  const monthMap = {};

  // Setup last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    monthMap[key] = { month: key, revenue: 0, invoiced: 0 };
  }

  invoices.forEach(inv => {
    const m = (inv.date || "").slice(0, 7);
    if (monthMap[m]) {
      monthMap[m].invoiced += inv.total || 0;
      if (inv.status === "paid") {
        monthMap[m].revenue += inv.total || 0;
      }
    }
  });

  const chart = Object.values(monthMap);
  res.json(chart);
});

router.get("/expense-chart", (req, res) => {
  const expenses = db.data.expenses || [];
  const catMap = {};

  expenses
    .filter(e => ["approved", "paid"].includes(e.status))
    .forEach(e => {
      const cat = e.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + (e.amount || 0);
    });

  const result = Object.entries(catMap)
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  res.json(result);
});

router.get("/recent-invoices", (req, res) => {
  const list = (db.data.invoices || [])
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8)
    .map(inv => {
      const c = db.data.clients.find(x => x.id === inv.client_id);
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        total: inv.total,
        status: inv.status,
        due_date: inv.due_date,
        client_name: c ? c.name : "Unknown"
      };
    });
  res.json(list);
});

router.get("/recent-expenses", (req, res) => {
  const list = (db.data.expenses || [])
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);
  res.json(list);
});

module.exports = router;
