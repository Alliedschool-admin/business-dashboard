const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = (db.data.invoices || [])
    .map(inv => {
      const c = (db.data.clients || []).find(x => x.id === inv.client_id);
      const u = (db.data.users || []).find(x => x.id === inv.created_by);
      return {
        ...inv,
        client_name: c ? c.name : "Unknown",
        client_company: c ? c.company : "",
        created_by_name: u ? u.name : "System"
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const inv = (db.data.invoices || []).find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  const c = (db.data.clients || []).find(x => x.id === inv.client_id);
  const items = (db.data.invoice_items || []).filter(it => it.invoice_id === inv.id);
  res.json({
    ...inv,
    client_name: c ? c.name : "Unknown",
    client_email: c ? c.email : "",
    address: c ? c.address : "",
    items
  });
});

router.post("/", async (req, res) => {
  const { client_id, quotation_id, date, due_date, notes, items = [], discount = 0, status = "draft" } = req.body;
  if (!client_id || !items.length) return res.status(400).json({ error: "Client and items are required" });

  const invId = db.nextId("invoices");
  const prefix = (db.data.settings && db.data.settings.invoice_prefix) || "INV-";
  const invoice_number = `${prefix}${String(2000 + invId).slice(-4)}`;

  let subtotal = 0;
  let tax_amount = 0;
  const processedItems = items.map((it, idx) => {
    const qty = parseFloat(it.quantity) || 1;
    const price = parseFloat(it.unit_price) || 0;
    const taxRate = parseFloat(it.tax_rate) || 0;
    const itemSub = qty * price;
    const itemTax = itemSub * (taxRate / 100);
    subtotal += itemSub;
    tax_amount += itemTax;
    return {
      id: (db.data.invoice_items ? db.data.invoice_items.length : 0) + idx + 1,
      invoice_id: invId,
      product_id: it.product_id ? parseInt(it.product_id) : null,
      description: it.description,
      quantity: qty,
      unit_price: price,
      tax_rate: taxRate,
      total: itemSub + itemTax
    };
  });

  const disc = parseFloat(discount) || 0;
  const total = subtotal + tax_amount - disc;

  const newInv = {
    id: invId,
    invoice_number,
    client_id: parseInt(client_id),
    quotation_id: quotation_id ? parseInt(quotation_id) : null,
    date: date || new Date().toISOString().slice(0, 10),
    due_date: due_date || null,
    status,
    notes: notes || null,
    subtotal,
    tax_amount,
    discount: disc,
    total,
    paid_amount: 0,
    payment_date: null,
    payment_method: null,
    created_by: req.user.id,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  if (!db.data.invoices) db.data.invoices = [];
  if (!db.data.invoice_items) db.data.invoice_items = [];
  db.data.invoices.push(newInv);
  db.data.invoice_items.push(...processedItems);
  await db.save();

  res.json({ id: invId, invoice_number, message: "Invoice created" });
});

router.put("/:id", async (req, res) => {
  const inv = (db.data.invoices || []).find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });

  const { client_id, date, due_date, status, notes, items = [], discount = 0 } = req.body;
  inv.client_id = client_id ? parseInt(client_id) : inv.client_id;
  inv.date = date || inv.date;
  inv.due_date = due_date !== undefined ? due_date : inv.due_date;
  inv.status = status || inv.status;
  inv.notes = notes !== undefined ? notes : inv.notes;
  inv.discount = discount !== undefined ? parseFloat(discount) : inv.discount;

  if (items.length > 0) {
    db.data.invoice_items = (db.data.invoice_items || []).filter(it => it.invoice_id !== inv.id);
    let subtotal = 0;
    let tax_amount = 0;
    const processedItems = items.map((it, idx) => {
      const qty = parseFloat(it.quantity) || 1;
      const price = parseFloat(it.unit_price) || 0;
      const taxRate = parseFloat(it.tax_rate) || 0;
      const itemSub = qty * price;
      const itemTax = itemSub * (taxRate / 100);
      subtotal += itemSub;
      tax_amount += itemTax;
      return {
        id: db.data.invoice_items.length + idx + 1,
        invoice_id: inv.id,
        product_id: it.product_id ? parseInt(it.product_id) : null,
        description: it.description,
        quantity: qty,
        unit_price: price,
        tax_rate: taxRate,
        total: itemSub + itemTax
      };
    });
    db.data.invoice_items.push(...processedItems);
    inv.subtotal = subtotal;
    inv.tax_amount = tax_amount;
    inv.total = subtotal + tax_amount - inv.discount;
  }

  await db.save();
  res.json({ message: "Invoice updated" });
});

router.post("/:id/pay", async (req, res) => {
  const inv = (db.data.invoices || []).find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });

  const { paid_amount, payment_date, payment_method } = req.body;
  const amt = parseFloat(paid_amount) || 0;
  inv.paid_amount = (inv.paid_amount || 0) + amt;
  inv.payment_date = payment_date || new Date().toISOString().slice(0, 10);
  inv.payment_method = payment_method || "bank_transfer";
  if (inv.paid_amount >= inv.total) {
    inv.status = "paid";
  }

  await db.save();
  res.json({ message: "Payment recorded", paid_amount: inv.paid_amount, status: inv.status });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const inv = (db.data.invoices || []).find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  inv.status = "cancelled";
  await db.save();
  res.json({ message: "Invoice cancelled" });
});

module.exports = router;