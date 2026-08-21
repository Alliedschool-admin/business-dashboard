const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = (db.data.quotations || [])
    .map(q => {
      const c = (db.data.clients || []).find(x => x.id === q.client_id);
      const u = (db.data.users || []).find(x => x.id === q.created_by);
      return {
        ...q,
        client_name: c ? c.name : "Unknown",
        client_company: c ? c.company : "",
        created_by_name: u ? u.name : "System"
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const q = (db.data.quotations || []).find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const c = (db.data.clients || []).find(x => x.id === q.client_id);
  const items = (db.data.quotation_items || []).filter(it => it.quotation_id === q.id);
  res.json({ ...q, client_name: c ? c.name : "Unknown", client_company: c ? c.company : "", items });
});

router.post("/", async (req, res) => {
  const { client_id, date, valid_until, notes, items = [], discount = 0 } = req.body;
  if (!client_id || !items.length) return res.status(400).json({ error: "Client and items are required" });

  const qId = db.nextId("quotations");
  const prefix = (db.data.settings && db.data.settings.quotation_prefix) || "QUO-";
  const quotation_number = `${prefix}${String(1000 + qId).slice(-4)}`;

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
      id: (db.data.quotation_items ? db.data.quotation_items.length : 0) + idx + 1,
      quotation_id: qId,
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

  const newQ = {
    id: qId,
    quotation_number,
    client_id: parseInt(client_id),
    date: date || new Date().toISOString().slice(0, 10),
    valid_until: valid_until || null,
    status: "draft",
    notes: notes || null,
    subtotal,
    tax_amount,
    discount: disc,
    total,
    created_by: req.user.id,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  if (!db.data.quotations) db.data.quotations = [];
  if (!db.data.quotation_items) db.data.quotation_items = [];
  db.data.quotations.push(newQ);
  db.data.quotation_items.push(...processedItems);
  await db.save();

  res.json({ id: qId, quotation_number, message: "Quotation created" });
});

router.put("/:id", async (req, res) => {
  const q = (db.data.quotations || []).find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: "Quotation not found" });

  const { client_id, date, valid_until, status, notes, items = [], discount = 0 } = req.body;
  q.client_id = client_id ? parseInt(client_id) : q.client_id;
  q.date = date || q.date;
  q.valid_until = valid_until !== undefined ? valid_until : q.valid_until;
  q.status = status || q.status;
  q.notes = notes !== undefined ? notes : q.notes;
  q.discount = discount !== undefined ? parseFloat(discount) : q.discount;

  if (items.length > 0) {
    db.data.quotation_items = (db.data.quotation_items || []).filter(it => it.quotation_id !== q.id);
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
        id: db.data.quotation_items.length + idx + 1,
        quotation_id: q.id,
        product_id: it.product_id ? parseInt(it.product_id) : null,
        description: it.description,
        quantity: qty,
        unit_price: price,
        tax_rate: taxRate,
        total: itemSub + itemTax
      };
    });
    db.data.quotation_items.push(...processedItems);
    q.subtotal = subtotal;
    q.tax_amount = tax_amount;
    q.total = subtotal + tax_amount - q.discount;
  }

  await db.save();
  res.json({ message: "Quotation updated" });
});

router.post("/:id/convert", async (req, res) => {
  const q = (db.data.quotations || []).find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: "Quotation not found" });

  const qItems = (db.data.quotation_items || []).filter(it => it.quotation_id === q.id);
  const invId = db.nextId("invoices");
  const prefix = (db.data.settings && db.data.settings.invoice_prefix) || "INV-";
  const invoice_number = `${prefix}${String(2000 + invId).slice(-4)}`;

  const newInv = {
    id: invId,
    invoice_number,
    client_id: q.client_id,
    quotation_id: q.id,
    date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
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

  const invItems = qItems.map((it, idx) => ({
    id: (db.data.invoice_items ? db.data.invoice_items.length : 0) + idx + 1,
    invoice_id: invId,
    product_id: it.product_id,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    tax_rate: it.tax_rate,
    total: it.total
  }));

  if (!db.data.invoices) db.data.invoices = [];
  if (!db.data.invoice_items) db.data.invoice_items = [];
  db.data.invoices.push(newInv);
  db.data.invoice_items.push(...invItems);
  q.status = "accepted";
  await db.save();

  res.json({ invoice_id: invId, invoice_number, message: "Quotation converted to Invoice" });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  db.data.quotations = (db.data.quotations || []).filter(q => q.id !== id);
  db.data.quotation_items = (db.data.quotation_items || []).filter(it => it.quotation_id !== id);
  await db.save();
  res.json({ message: "Quotation deleted" });
});

module.exports = router;