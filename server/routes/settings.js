const router = require("express").Router();
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

// Default settings if not already present
function getSettings() {
  if (!db.data.settings) {
    db.data.settings = {
      company_name: "BizFlow Technologies Inc.",
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

module.exports = router;