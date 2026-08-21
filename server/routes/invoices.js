const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = db.data.invoices
    .map(inv => {
      const c = db.data.clients.find(x => x.id === inv.client_id);
      const u = db.data.users.find(x => x.id === inv.created_by);
      return {
        ...inv,
        client_name: c ? c.name : "Unknown Client",
        client_email: c ? c.email : null,
        created_by_name: u ? u.name : "System"
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const inv = db.data.invoices.find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  const c = db.data.clients.find(x => x.id === inv.client_id) || {};
  const items = db.data.invoice_items
    .filter(it => it.invoice_id === inv.id)
    .map(it => {
      const p = db.data.products.find(x => x.id === it.product_id);
      return { ...it, product_name: p ? p.name : null };
    });
  res.json({
    ...inv,
    client_name: c.name,
    client_email: c.email,
    address: c.address,
    city: c.city,
    country: c.country,
    phone: c.phone,
    tax_number: c.tax_number,
    items
  });
});

router.post("/", (req, res) => {
  const { client_id, date, due_date, status, notes, items = [], discount = 0 } = req.body;
  if (!client_id) return res.status(400).json({ error: "Client is required" });

  let subtotal = 0;
  let tax_amount = 0;
  items.forEach(it => {
    const q = parseFloat(it.quantity) || 1;
    const p = parseFloat(it.unit_price) || 0;
    const t = parseFloat(it.tax_rate) || 0;
    subtotal += q * p;
    tax_amount += q * p * (t / 100);
  });
  const disc = parseFloat(discount) || 0;
  const total = subtotal + tax_amount - disc;

  const count = (db.data.invoices.length || 0) + 2001;
  const ino = `INV-${count}`;

  const newInvoice = {
    id: db.nextId("invoices"),
    invoice_number: ino,
    client_id: parseInt(client_id),
    quotation_id: null,
    date: date || new Date().toISOString().slice(0, 10),
    due_date: due_date || null,
    status: status || "draft",
    notes: notes || null,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax_amount * 100) / 100,
    discount: disc,
    total: Math.round(total * 100) / 100,
    paid_amount: status === "paid" ? Math.round(total * 100) / 100 : 0,
    payment_date: status === "paid" ? date : null,
    payment_method: status === "paid" ? "bank_transfer" : null,
    created_by: req.user.id,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  db.data.invoices.push(newInvoice);

  items.forEach(it => {
    const q = parseFloat(it.quantity) || 1;
    const p = parseFloat(it.unit_price) || 0;
    const t = parseFloat(it.tax_rate) || 0;
    const rowTotal = q * p * (1 + t / 100);
    db.data.invoice_items.push({
      id: db.nextId("invoice_items"),
      invoice_id: newInvoice.id,
      product_id: it.product_id ? parseInt(it.product_id) : null,
      description: it.description || "Line item",
      quantity: q,
      unit_price: p,
      tax_rate: t,
      total: Math.round(rowTotal * 100) / 100
    });
  });

  db.save();
  res.json({ id: newInvoice.id, invoice_number: ino });
});

router.put("/:id", (req, res) => {
  const inv = db.data.invoices.find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });

  const { client_id, date, due_date, status, notes, items = [], discount = 0 } = req.body;
  let subtotal = 0;
  let tax_amount = 0;
  items.forEach(it => {
    const qty = parseFloat(it.quantity) || 1;
    const price = parseFloat(it.unit_price) || 0;
    const tax = parseFloat(it.tax_rate) || 0;
    subtotal += qty * price;
    tax_amount += qty * price * (tax / 100);
  });
  const disc = parseFloat(discount) || 0;
  const total = subtotal + tax_amount - disc;

  inv.client_id = parseInt(client_id) || inv.client_id;
  inv.date = date || inv.date;
  inv.due_date = due_date !== undefined ? due_date : inv.due_date;
  inv.status = status || inv.status;
  inv.notes = notes !== undefined ? notes : inv.notes;
  inv.subtotal = Math.round(subtotal * 100) / 100;
  inv.tax_amount = Math.round(tax_amount * 100) / 100;
  inv.discount = disc;
  inv.total = Math.round(total * 100) / 100;

  // Replace line items
  db.data.invoice_items = db.data.invoice_items.filter(it => it.invoice_id !== inv.id);
  items.forEach(it => {
    const qty = parseFloat(it.quantity) || 1;
    const price = parseFloat(it.unit_price) || 0;
    const tax = parseFloat(it.tax_rate) || 0;
    const rowTotal = qty * price * (1 + tax / 100);
    db.data.invoice_items.push({
      id: db.nextId("invoice_items"),
      invoice_id: inv.id,
      product_id: it.product_id ? parseInt(it.product_id) : null,
      description: it.description || "Line item",
      quantity: qty,
      unit_price: price,
      tax_rate: tax,
      total: Math.round(rowTotal * 100) / 100
    });
  });

  db.save();
  res.json({ message: "Invoice updated" });
});

router.post("/:id/pay", (req, res) => {
  const inv = db.data.invoices.find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });

  const { paid_amount, payment_date, payment_method } = req.body;
  const added = parseFloat(paid_amount) || 0;
  const newPaid = (inv.paid_amount || 0) + added;
  const newStatus = newPaid >= inv.total ? "paid" : "sent";

  inv.paid_amount = Math.round(newPaid * 100) / 100;
  inv.payment_date = payment_date || new Date().toISOString().slice(0, 10);
  inv.payment_method = payment_method || "bank_transfer";
  inv.status = newStatus;

  db.save();
  res.json({ message: "Payment recorded", status: newStatus, paid_amount: inv.paid_amount });
});

router.delete("/:id", requireRole("admin", "manager"), (req, res) => {
  const inv = db.data.invoices.find(x => x.id === parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  inv.status = "cancelled";
  db.save();
  res.json({ message: "Invoice cancelled" });
});

module.exports = router;
