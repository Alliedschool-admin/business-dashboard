const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = (db.data.products || [])
    .filter(p => p.is_active === 1)
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const p = (db.data.products || []).find(x => x.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

router.post("/", requireRole("admin", "manager"), async (req, res) => {
  const { name, sku, description, category, unit_price, tax_rate, unit, stock_quantity } = req.body;
  if (!name || unit_price === undefined) return res.status(400).json({ error: "Name and unit price are required" });

  const newProduct = {
    id: db.nextId("products"),
    name,
    sku: sku || null,
    description: description || null,
    category: category || "General",
    unit_price: parseFloat(unit_price) || 0,
    tax_rate: tax_rate !== undefined ? parseFloat(tax_rate) : 10,
    unit: unit || "unit",
    stock_quantity: parseInt(stock_quantity) || 0,
    is_active: 1,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };
  if (!db.data.products) db.data.products = [];
  db.data.products.push(newProduct);
  await db.save();
  res.json({ id: newProduct.id, message: "Product created" });
});

router.put("/:id", requireRole("admin", "manager"), async (req, res) => {
  const p = (db.data.products || []).find(x => x.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ error: "Product not found" });
  const { name, sku, description, category, unit_price, tax_rate, unit, stock_quantity } = req.body;
  p.name = name || p.name;
  p.sku = sku !== undefined ? sku : p.sku;
  p.description = description !== undefined ? description : p.description;
  p.category = category !== undefined ? category : p.category;
  p.unit_price = unit_price !== undefined ? parseFloat(unit_price) : p.unit_price;
  p.tax_rate = tax_rate !== undefined ? parseFloat(tax_rate) : p.tax_rate;
  p.unit = unit !== undefined ? unit : p.unit;
  p.stock_quantity = stock_quantity !== undefined ? parseInt(stock_quantity) : p.stock_quantity;
  await db.save();
  res.json({ message: "Product updated" });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const p = (db.data.products || []).find(x => x.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ error: "Product not found" });
  p.is_active = 0;
  await db.save();
  res.json({ message: "Product deleted" });
});

module.exports = router;