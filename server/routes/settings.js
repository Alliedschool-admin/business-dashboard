const router = require("express").Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

// Default settings if not already present
function getSettings() {
  if (!db.data.settings) {
    db.data.settings = {
      company_name: "BizFlow Technologies Inc.",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      email: "billing@bizflow.com",
      phone: "+1 (555) 019-2834",
      address: "100 Innovation Way, Suite 500",
      city: "San Francisco",
      country: "USA",
      tax_number: "US-987654321",
      currency_symbol: "$",
      default_tax_rate: 10,
      invoice_prefix: "INV-",
      quotation_prefix: "QUO-",
      footer_notes: "Thank you for doing business with us! Payment is due according to standard terms."
    };
    db.save();
  }
  return db.data.settings;
}

router.get("/", (req, res) => {
  res.json(getSettings());
});

router.put("/", requireRole("admin"), (req, res) => {
  const current = getSettings();
  const {
    company_name,
    logo_url,
    email,
    phone,
    address,
    city,
    country,
    tax_number,
    currency_symbol,
    default_tax_rate,
    invoice_prefix,
    quotation_prefix,
    footer_notes
  } = req.body;

  db.data.settings = {
    ...current,
    company_name: company_name || current.company_name,
    logo_url: logo_url !== undefined ? logo_url : current.logo_url,
    email: email !== undefined ? email : current.email,
    phone: phone !== undefined ? phone : current.phone,
    address: address !== undefined ? address : current.address,
    city: city !== undefined ? city : current.city,
    country: country !== undefined ? country : current.country,
    tax_number: tax_number !== undefined ? tax_number : current.tax_number,
    currency_symbol: currency_symbol || current.currency_symbol,
    default_tax_rate: default_tax_rate !== undefined ? parseFloat(default_tax_rate) : current.default_tax_rate,
    invoice_prefix: invoice_prefix || current.invoice_prefix,
    quotation_prefix: quotation_prefix || current.quotation_prefix,
    footer_notes: footer_notes !== undefined ? footer_notes : current.footer_notes
  };

  db.save();
  res.json({ message: "Company settings updated successfully", settings: db.data.settings });
});

// 1-Click Clear All Demo Data (Keeps Admin logged in)
router.post("/clear-data", requireRole("admin"), (req, res) => {
  // Keep admin user
  const adminUser = db.data.users.find(u => u.id === req.user.id) || {
    id: 1,
    name: req.user.name || "Admin User",
    email: req.user.email || "admin@bizflow.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
    is_active: 1,
    created_at: new Date().toISOString()
  };

  db.data.clients = [];
  db.data.products = [];
  db.data.quotations = [];
  db.data.quotation_items = [];
  db.data.invoices = [];
  db.data.invoice_items = [];
  db.data.expenses = [];
  db.data.users = [adminUser];

  db.save();
  res.json({
    message: "All demo data cleared successfully! Your database is now completely clean and ready for real records."
  });
});

module.exports = router;