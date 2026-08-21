const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "bizflow_data.json");

function getDefaultData() {
  const hashAdmin = bcrypt.hashSync("admin123", 10);
  const hashManager = bcrypt.hashSync("manager123", 10);
  const hashStaff = bcrypt.hashSync("staff123", 10);

  const users = [
    { id: 1, name: "Admin User", email: "admin@bizflow.com", password: hashAdmin, role: "admin", is_active: 1, created_at: "2026-01-01 10:00:00" },
    { id: 2, name: "Sarah Manager", email: "manager@bizflow.com", password: hashManager, role: "manager", is_active: 1, created_at: "2026-01-05 10:00:00" },
    { id: 3, name: "John Staff", email: "staff@bizflow.com", password: hashStaff, role: "staff", is_active: 1, created_at: "2026-01-10 10:00:00" },
  ];

  const clients = [
    { id: 1, name: "Acme Corporation", email: "contact@acme.com", phone: "+1 555-0199", company: "Acme Corp", address: "123 Market St, Suite 400", city: "San Francisco", country: "USA", tax_number: "US-987654321", payment_terms: 30, notes: "Enterprise client. Net 30.", is_active: 1, created_by: 1, created_at: "2026-01-15 09:30:00" },
    { id: 2, name: "Tech Innovations Ltd", email: "info@techinno.com", phone: "+1 555-0245", company: "Tech Innovations", address: "456 Silicon Ave", city: "Austin", country: "USA", tax_number: "US-123456789", payment_terms: 15, notes: "Fast growing SaaS client.", is_active: 1, created_by: 1, created_at: "2026-02-01 11:15:00" },
    { id: 3, name: "Global Logistics Group", email: "procurement@globallog.com", phone: "+1 555-0378", company: "Global Logistics", address: "789 Freight Way", city: "Chicago", country: "USA", tax_number: "US-456789123", payment_terms: 45, notes: "International shipping partner.", is_active: 1, created_by: 2, created_at: "2026-02-10 14:00:00" },
    { id: 4, name: "Apex Retailers", email: "billing@apexretail.com", phone: "+1 555-0482", company: "Apex Retail Inc", address: "321 Commerce Blvd", city: "New York", country: "USA", tax_number: "US-654321987", payment_terms: 30, notes: "Quarterly invoice reconciliation.", is_active: 1, created_by: 1, created_at: "2026-03-01 16:20:00" },
    { id: 5, name: "Horizon Digital Media", email: "finance@horizondigital.io", phone: "+1 555-0591", company: "Horizon Digital", address: "654 Creative Loop", city: "Seattle", country: "USA", tax_number: "US-789123456", payment_terms: 15, notes: "Agency client.", is_active: 1, created_by: 2, created_at: "2026-03-12 10:45:00" },
  ];

  const products = [
    { id: 1, name: "Web Application Development", sku: "DEV-WEB-01", description: "Full-stack custom web application development", category: "Development", unit_price: 3500.00, tax_rate: 10, unit: "project", stock_quantity: 100, is_active: 1, created_at: "2026-01-01 00:00:00" },
    { id: 2, name: "Monthly SEO & Growth Retainer", sku: "MKT-SEO-01", description: "Organic search optimization, technical SEO & content", category: "Marketing", unit_price: 1200.00, tax_rate: 10, unit: "month", stock_quantity: 50, is_active: 1, created_at: "2026-01-01 00:00:00" },
    { id: 3, name: "UI/UX Brand Design Package", sku: "DSG-UI-01", description: "Comprehensive brand identity, design system & mockups", category: "Design", unit_price: 1800.00, tax_rate: 10, unit: "package", stock_quantity: 40, is_active: 1, created_at: "2026-01-01 00:00:00" },
    { id: 4, name: "Cloud Infrastructure & DevOps", sku: "OPS-CLD-01", description: "AWS/GCP architecture setup, CI/CD pipelines & monitoring", category: "Hosting", unit_price: 2400.00, tax_rate: 10, unit: "month", stock_quantity: 30, is_active: 1, created_at: "2026-01-01 00:00:00" },
    { id: 5, name: "Enterprise Architecture Consulting", sku: "CNS-ENT-01", description: "Strategic technology advisory per hour", category: "Consulting", unit_price: 250.00, tax_rate: 10, unit: "hour", stock_quantity: 200, is_active: 1, created_at: "2026-01-01 00:00:00" },
    { id: 6, name: "Copywriting & Content Strategy", sku: "CNT-CPY-01", description: "High-conversion landing page copy & articles", category: "Content", unit_price: 450.00, tax_rate: 10, unit: "article", stock_quantity: 150, is_active: 1, created_at: "2026-01-01 00:00:00" },
  ];

  const quotations = [
    { id: 1, quotation_number: "QUO-1001", client_id: 1, date: "2026-07-01", valid_until: "2026-07-31", status: "accepted", notes: "Annual website revamp and continuous maintenance.", subtotal: 5300.00, tax_amount: 530.00, discount: 300.00, total: 5530.00, created_by: 1, created_at: "2026-07-01 10:00:00" },
    { id: 2, quotation_number: "QUO-1002", client_id: 2, date: "2026-07-15", valid_until: "2026-08-15", status: "accepted", notes: "SaaS UI/UX overhaul and mobile responsive screens.", subtotal: 3600.00, tax_amount: 360.00, discount: 0, total: 3960.00, created_by: 2, created_at: "2026-07-15 14:30:00" },
    { id: 3, quotation_number: "QUO-1003", client_id: 3, date: "2026-08-01", valid_until: "2026-08-31", status: "sent", notes: "Cloud migration and DevOps workflow setup.", subtotal: 4800.00, tax_amount: 480.00, discount: 200.00, total: 5080.00, created_by: 1, created_at: "2026-08-01 09:15:00" },
    { id: 4, quotation_number: "QUO-1004", client_id: 4, date: "2026-08-10", valid_until: "2026-09-10", status: "draft", notes: "Growth marketing campaign & SEO audit.", subtotal: 2400.00, tax_amount: 240.00, discount: 0, total: 2640.00, created_by: 3, created_at: "2026-08-10 16:00:00" },
  ];

  const quotation_items = [
    { id: 1, quotation_id: 1, product_id: 1, description: "Web Application Development", quantity: 1, unit_price: 3500.00, tax_rate: 10, total: 3850.00 },
    { id: 2, quotation_id: 1, product_id: 3, description: "UI/UX Brand Design Package", quantity: 1, unit_price: 1800.00, tax_rate: 10, total: 1980.00 },
    { id: 3, quotation_id: 2, product_id: 3, description: "UI/UX Brand Design Package (2 Sprints)", quantity: 2, unit_price: 1800.00, tax_rate: 10, total: 3960.00 },
    { id: 4, quotation_id: 3, product_id: 4, description: "Cloud Infrastructure & DevOps", quantity: 2, unit_price: 2400.00, tax_rate: 10, total: 5280.00 },
    { id: 5, quotation_id: 4, product_id: 2, description: "Monthly SEO & Growth Retainer", quantity: 2, unit_price: 1200.00, tax_rate: 10, total: 2640.00 },
  ];

  const invoices = [
    { id: 1, invoice_number: "INV-2001", client_id: 1, quotation_id: 1, date: "2026-07-02", due_date: "2026-08-01", status: "paid", notes: "Thank you for your business!", subtotal: 5300.00, tax_amount: 530.00, discount: 300.00, total: 5530.00, paid_amount: 5530.00, payment_date: "2026-07-28", payment_method: "bank_transfer", created_by: 1, created_at: "2026-07-02 10:00:00" },
    { id: 2, invoice_number: "INV-2002", client_id: 2, quotation_id: 2, date: "2026-07-20", due_date: "2026-08-04", status: "paid", notes: "Milestone 1 completed.", subtotal: 3600.00, tax_amount: 360.00, discount: 0, total: 3960.00, paid_amount: 3960.00, payment_date: "2026-08-02", payment_method: "credit_card", created_by: 2, created_at: "2026-07-20 11:30:00" },
    { id: 3, invoice_number: "INV-2003", client_id: 3, quotation_id: null, date: "2026-08-05", due_date: "2026-09-05", status: "sent", notes: "Consulting hours billed.", subtotal: 2500.00, tax_amount: 250.00, discount: 0, total: 2750.00, paid_amount: 0, payment_date: null, payment_method: null, created_by: 1, created_at: "2026-08-05 15:00:00" },
    { id: 4, invoice_number: "INV-2004", client_id: 5, quotation_id: null, date: "2026-08-12", due_date: "2026-08-27", status: "draft", notes: "Draft invoice for review.", subtotal: 1800.00, tax_amount: 180.00, discount: 100.00, total: 1880.00, paid_amount: 0, payment_date: null, payment_method: null, created_by: 3, created_at: "2026-08-12 17:00:00" },
  ];

  const invoice_items = [
    { id: 1, invoice_id: 1, product_id: 1, description: "Web Application Development", quantity: 1, unit_price: 3500.00, tax_rate: 10, total: 3850.00 },
    { id: 2, invoice_id: 1, product_id: 3, description: "UI/UX Brand Design Package", quantity: 1, unit_price: 1800.00, tax_rate: 10, total: 1980.00 },
    { id: 3, invoice_id: 2, product_id: 3, description: "UI/UX Brand Design Package (2 Sprints)", quantity: 2, unit_price: 1800.00, tax_rate: 10, total: 3960.00 },
    { id: 4, invoice_id: 3, product_id: 5, description: "Enterprise Architecture Consulting (10 hrs)", quantity: 10, unit_price: 250.00, tax_rate: 10, total: 2750.00 },
    { id: 5, invoice_id: 4, product_id: 3, description: "UI/UX Brand Design Package", quantity: 1, unit_price: 1800.00, tax_rate: 10, total: 1980.00 },
  ];

  const expenses = [
    { id: 1, title: "AWS Cloud & Database Servers", amount: 485.50, category: "Hosting", date: "2026-08-01", description: "Monthly cloud infrastructure hosting", status: "paid", receipt_notes: "Auto-charged to corporate card", created_by: 1, approved_by: 1, approved_at: "2026-08-01 12:00:00", created_at: "2026-08-01 10:00:00" },
    { id: 2, title: "SaaS Team Licenses (Figma, GitHub, Slack)", amount: 320.00, category: "Software", date: "2026-08-03", description: "Design and developer software tools", status: "approved", receipt_notes: "INV-SLACK-2026-08", created_by: 2, approved_by: 1, approved_at: "2026-08-04 09:30:00", created_at: "2026-08-03 14:20:00" },
    { id: 3, title: "Client Strategy Lunch", amount: 142.75, category: "Meals", date: "2026-08-08", description: "Lunch with Acme Corp stakeholders", status: "pending", receipt_notes: "Bistro Receipt #8841", created_by: 3, approved_by: null, approved_at: null, created_at: "2026-08-08 16:45:00" },
    { id: 4, title: "Google Ads Acquisition Campaign", amount: 750.00, category: "Marketing", date: "2026-08-11", description: "Q3 inbound lead generation search campaign", status: "approved", receipt_notes: "Google Ads Account 482-192", created_by: 2, approved_by: 1, approved_at: "2026-08-12 11:00:00", created_at: "2026-08-11 09:00:00" },
    { id: 5, title: "Ergonomic Office Chairs & Monitors", amount: 890.00, category: "Equipment", date: "2026-08-14", description: "Equipment upgrade for workstations", status: "pending", receipt_notes: "Office Depot order #99214", created_by: 3, approved_by: null, approved_at: null, created_at: "2026-08-14 13:10:00" },
  ];

  return { users, clients, products, quotations, quotation_items, invoices, invoice_items, expenses };
}

class BizflowDB {
  constructor() {
    this.data = this.load();
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(raw);
      } catch (e) {
        console.error("Error reading db file, regenerating defaults:", e);
      }
    }
    const def = getDefaultData();
    this.saveData(def);
    return def;
  }

  save() {
    this.saveData(this.data);
  }

  saveData(d) {
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2), "utf-8");
  }

  nextId(table) {
    const list = this.data[table] || [];
    const max = list.reduce((m, item) => (item.id > m ? item.id : m), 0);
    return max + 1;
  }
}

const db = new BizflowDB();
console.log("✅ BizFlow JSON Database loaded & ready");
module.exports = db;
