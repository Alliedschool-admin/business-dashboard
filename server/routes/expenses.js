const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = (db.data.expenses || [])
    .map(e => {
      const u = (db.data.users || []).find(x => x.id === e.created_by);
      const app = (db.data.users || []).find(x => x.id === e.approved_by);
      return {
        ...e,
        created_by_name: u ? u.name : "System",
        approved_by_name: app ? app.name : null
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.post("/", async (req, res) => {
  const { title, amount, category, date, description, receipt_notes } = req.body;
  if (!title || !amount) return res.status(400).json({ error: "Title and amount are required" });

  const newExp = {
    id: db.nextId("expenses"),
    title,
    amount: parseFloat(amount) || 0,
    category: category || "General",
    date: date || new Date().toISOString().slice(0, 10),
    description: description || null,
    status: ["admin", "manager"].includes(req.user.role) ? "approved" : "pending",
    receipt_notes: receipt_notes || null,
    created_by: req.user.id,
    approved_by: ["admin", "manager"].includes(req.user.role) ? req.user.id : null,
    approved_at: ["admin", "manager"].includes(req.user.role)
      ? new Date().toISOString().replace("T", " ").slice(0, 19)
      : null,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  if (!db.data.expenses) db.data.expenses = [];
  db.data.expenses.push(newExp);
  await db.save();
  res.json({ id: newExp.id, message: "Expense created" });
});

router.put("/:id/approve", requireRole("admin", "manager"), async (req, res) => {
  const exp = (db.data.expenses || []).find(x => x.id === parseInt(req.params.id));
  if (!exp) return res.status(404).json({ error: "Expense not found" });

  exp.status = "approved";
  exp.approved_by = req.user.id;
  exp.approved_at = new Date().toISOString().replace("T", " ").slice(0, 19);
  await db.save();
  res.json({ message: "Expense approved" });
});

router.put("/:id/reject", requireRole("admin", "manager"), async (req, res) => {
  const exp = (db.data.expenses || []).find(x => x.id === parseInt(req.params.id));
  if (!exp) return res.status(404).json({ error: "Expense not found" });

  exp.status = "rejected";
  exp.approved_by = req.user.id;
  exp.approved_at = new Date().toISOString().replace("T", " ").slice(0, 19);
  await db.save();
  res.json({ message: "Expense rejected" });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  db.data.expenses = (db.data.expenses || []).filter(x => x.id !== id);
  await db.save();
  res.json({ message: "Expense deleted" });
});

module.exports = router;