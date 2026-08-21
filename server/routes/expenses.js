const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = db.data.expenses
    .map(e => {
      const creator = db.data.users.find(x => x.id === e.created_by);
      const approver = db.data.users.find(x => x.id === e.approved_by);
      return {
        ...e,
        created_by_name: creator ? creator.name : "System",
        approved_by_name: approver ? approver.name : null
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.post("/", (req, res) => {
  const { title, amount, category, date, description, receipt_notes } = req.body;
  if (!title || !amount) return res.status(400).json({ error: "Title and amount are required" });

  const newExpense = {
    id: db.nextId("expenses"),
    title,
    amount: parseFloat(amount) || 0,
    category: category || "Other",
    date: date || new Date().toISOString().slice(0, 10),
    description: description || null,
    status: req.user.role === "admin" ? "approved" : "pending",
    receipt_notes: receipt_notes || null,
    created_by: req.user.id,
    approved_by: req.user.role === "admin" ? req.user.id : null,
    approved_at: req.user.role === "admin" ? new Date().toISOString().replace("T", " ").slice(0, 19) : null,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  db.data.expenses.push(newExpense);
  db.save();
  res.json({ id: newExpense.id, message: "Expense created" });
});

router.put("/:id", (req, res) => {
  const e = db.data.expenses.find(x => x.id === parseInt(req.params.id));
  if (!e) return res.status(404).json({ error: "Expense not found" });

  const { title, amount, category, date, description, receipt_notes } = req.body;
  e.title = title || e.title;
  e.amount = amount !== undefined ? parseFloat(amount) : e.amount;
  e.category = category || e.category;
  e.date = date || e.date;
  e.description = description !== undefined ? description : e.description;
  e.receipt_notes = receipt_notes !== undefined ? receipt_notes : e.receipt_notes;

  db.save();
  res.json({ message: "Expense updated" });
});

router.post("/:id/approve", requireRole("admin", "manager"), (req, res) => {
  const e = db.data.expenses.find(x => x.id === parseInt(req.params.id));
  if (!e) return res.status(404).json({ error: "Expense not found" });

  e.status = "approved";
  e.approved_by = req.user.id;
  e.approved_at = new Date().toISOString().replace("T", " ").slice(0, 19);

  db.save();
  res.json({ message: "Expense approved" });
});

router.post("/:id/reject", requireRole("admin", "manager"), (req, res) => {
  const e = db.data.expenses.find(x => x.id === parseInt(req.params.id));
  if (!e) return res.status(404).json({ error: "Expense not found" });

  e.status = "rejected";
  e.approved_by = req.user.id;
  e.approved_at = new Date().toISOString().replace("T", " ").slice(0, 19);

  db.save();
  res.json({ message: "Expense rejected" });
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  const eId = parseInt(req.params.id);
  db.data.expenses = db.data.expenses.filter(x => x.id !== eId);
  db.save();
  res.json({ message: "Expense deleted" });
});

module.exports = router;
