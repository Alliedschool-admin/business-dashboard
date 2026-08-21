const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", (req, res) => {
  const list = db.data.clients
    .filter(c => c.is_active === 1)
    .map(c => {
      const u = db.data.users.find(x => x.id === c.created_by);
      return { ...c, created_by_name: u ? u.name : "System" };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const c = db.data.clients.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: "Client not found" });
  res.json(c);
});

router.post("/", (req, res) => {
  const { name, email, phone, company, address, city, country, tax_number, payment_terms, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Client name is required" });
  const newClient = {
    id: db.nextId("clients"),
    name,
    email: email || null,
    phone: phone || null,
    company: company || null,
    address: address || null,
    city: city || null,
    country: country || "USA",
    tax_number: tax_number || null,
    payment_terms: parseInt(payment_terms) || 30,
    notes: notes || null,
    is_active: 1,
    created_by: req.user.id,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };
  db.data.clients.push(newClient);
  db.save();
  res.json({ id: newClient.id, message: "Client created" });
});

router.put("/:id", (req, res) => {
  const c = db.data.clients.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: "Client not found" });
  const { name, email, phone, company, address, city, country, tax_number, payment_terms, notes } = req.body;
  c.name = name || c.name;
  c.email = email !== undefined ? email : c.email;
  c.phone = phone !== undefined ? phone : c.phone;
  c.company = company !== undefined ? company : c.company;
  c.address = address !== undefined ? address : c.address;
  c.city = city !== undefined ? city : c.city;
  c.country = country !== undefined ? country : c.country;
  c.tax_number = tax_number !== undefined ? tax_number : c.tax_number;
  c.payment_terms = payment_terms !== undefined ? parseInt(payment_terms) : c.payment_terms;
  c.notes = notes !== undefined ? notes : c.notes;
  db.save();
  res.json({ message: "Client updated" });
});

router.delete("/:id", requireRole("admin", "manager"), (req, res) => {
  const c = db.data.clients.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: "Client not found" });
  c.is_active = 0;
  db.save();
  res.json({ message: "Client deleted" });
});

module.exports = router;
