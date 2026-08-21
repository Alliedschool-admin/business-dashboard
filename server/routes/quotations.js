const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = db.data.quotations
    .map(q => {
      const c = db.data.clients.find(x => x.id === q.client_id);
      const u = db.data.users.find(x => x.id === q.created_by);
      return {
        ...q,
        client_name: c ? c.name : "Unknown Client",
        client_email: c ? c.email : null,
        created_by_name: u ? u.name : "System"
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const q = db.data.quotations.find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const c = db.data.clients.find(x => x.id === q.client_id) || {};
  const items = db.data.quotation_items
    .filter(it => it.quotation_id === q.id)
    .map(it => {
      const p = db.data.products.find(x => x.id === it.product_id);
      return { ...it, product_name: p ? p.name : null };
    });
  res.json({
    ...q,
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
  const { client_id, date, valid_until, status, notes, items = [], discount = 0 } = req.body;
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

  const count = (db.data.quotations.length || 0) + 1001;
  const qno = `QUO-${count}`;

  const newQuotation = {
    id: db.nextId("quotations"),
    quotation_number: qno,
    client_id: parseInt(client_id),
    date: date || new Date().toISOString().slice(0, 10),
    valid_until: valid_until || null,
    status: status || "draft",
    notes: notes || null,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax_amount * 100) / 100,
    discount: disc,
    total: Math.round(total * 100) / 100,
    created_by: req.user.id,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  db.data.quotations.push(newQuotation);

  items.forEach(it => {
    const q = parseFloat(it.quantity) || 1;
    const p = parseFloat(it.unit_price) || 0;
    const t = parseFloat(it.tax_rate) || 0;
    const rowTotal = q * p * (1 + t / 100);
    db.data.quotation_items.push({
      id: db.nextId("quotation_items"),
      quotation_id: newQuotation.id,
      product_id: it.product_id ? parseInt(it.product_id) : null,
      description: it.description || "Line item",
      quantity: q,
      unit_price: p,
      tax_rate: t,
      total: Math.round(rowTotal * 100) / 100
    });
  });

  db.save();
  res.json({ id: newQuotation.id, quotation_number: qno });
});

router.put("/:id", (req, res) => {
  const q = db.data.quotations.find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: "Quotation not found" });

  const { client_id, date, valid_until, status, notes, items = [], discount = 0 } = req.body;
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

  q.client_id = parseInt(client_id) || q.client_id;
  q.date = date || q.date;
  q.valid_until = valid_until !== undefined ? valid_until : q.valid_until;
  q.status = status || q.status;
  q.notes = notes !== undefined ? notes : q.notes;
  q.subtotal = Math.round(subtotal * 100) / 100;
  q.tax_amount = Math.round(tax_amount * 100) / 100;
  q.discount = disc;
  q.total = Math.round(total * 100) / 100;

  // Replace quotation items
  db.data.quotation_items = db.data.quotation_items.filter(it => it.quotation_id !== q.id);
  items.forEach(it => {
    const qty = parseFloat(it.quantity) || 1;
    const price = parseFloat(it.unit_price) || 0;
    const tax = parseFloat(it.tax_rate) || 0;
    const rowTotal = qty * price * (1 + tax / 100);
    db.data.quotation_items.push({
      id: db.nextId("quotation_items"),
      quotation_id: q.id,
      product_id: it.product_id ? parseInt(it.product_id) : null,
      description: it.description || "Line item",
      quantity: qty,
      unit_price: price,
      tax_rate: tax,
      total: Math.round(rowTotal * 100) / 100
    });
  });

  db.save();
  res.json({ message: "Quotation updated" });
});

router.post("/:id/convert", (req, res) => {
  const q = db.data.quotations.find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: "Quotation not found" });

  const qItems = db.data.quotation_items.filter(it => it.quotation_id === q.id);
  const count = (db.data.invoices.length || 0) + 2001;
  const ino = `INV-${count}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const newInvoice = {
    id: db.nextId("invoices"),
    invoice_number: ino,
    client_id: q.client_id,
    quotation_id: q.id,
    date: new Date().toISOString().slice(0, 10),
    due_date: dueDate.toISOString().slice(0, 10),
    status: "draft",
    notes: q.notes,
    subtotal: q.subtotal,
    tax_amount: q.tax_amount,
    discount: q.discount,
    total: q.total,
    paid_amount: 0,
    payment_date: null,
    payment_method: null,
    created_by: req.user.id,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  db.data.invoices.push(newInvoice);

  qItems.forEach(it => {
    db.data.invoice_items.push({
      id: db.nextId("invoice_items"),
      invoice_id: newInvoice.id,
      product_id: it.product_id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate,
      total: it.total
    });
  });

  q.status = "accepted";
  db.save();
  res.json({ id: newInvoice.id, invoice_number: ino });
});

router.delete("/:id", requireRole("admin", "manager"), (req, res) => {
  const qId = parseInt(req.params.id);
  db.data.quotations = db.data.quotations.filter(x => x.id !== qId);
  db.data.quotation_items = db.data.quotation_items.filter(x => x.quotation_id !== qId);
  db.save();
  res.json({ message: "Quotation deleted" });
});

module.exports = router;
