const express = require("express");
const cors = require("cors");
const db = require("../server/db");

const app = express();
app.use(cors());
app.use(express.json());

// Sync Cloud Database on every request
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && (!db.mongoConnected || !db.isLoaded)) {
    try {
      await db.ensureConnected();
    } catch (e) {}
  }
  next();
});

// API Routes
app.use("/api/auth", require("../server/routes/auth"));
app.use("/api/clients", require("../server/routes/clients"));
app.use("/api/products", require("../server/routes/products"));
app.use("/api/quotations", require("../server/routes/quotations"));
app.use("/api/invoices", require("../server/routes/invoices"));
app.use("/api/expenses", require("../server/routes/expenses"));
app.use("/api/users", require("../server/routes/users"));
app.use("/api/dashboard", require("../server/routes/dashboard"));
app.use("/api/settings", require("../server/routes/settings"));

app.get("/api/health", async (req, res) => {
  if (process.env.MONGODB_URI) {
    await db.ensureConnected().catch(() => {});
  }
  res.json({
    status: "ok",
    cloud_database: db.mongoConnected ? "Connected (MongoDB Atlas)" : "Local/Memory Storage",
    error: db.lastError || null,
    has_mongodb_uri: !!process.env.MONGODB_URI,
    time: new Date()
  });
});

module.exports = app;