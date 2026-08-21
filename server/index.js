const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("./db"); // Init DB

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/products", require("./routes/products"));
app.use("/api/quotations", require("./routes/quotations"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/users", require("./routes/users"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// Serve frontend build in production
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 BizFlow Server running on http://localhost:${PORT}`);
});
