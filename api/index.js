const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", require("../server/routes/auth"));
app.use("/api/clients", require("../server/routes/clients"));
app.use("/api/products", require("../server/routes/products"));
app.use("/api/quotations", require("../server/routes/quotations"));
app.use("/api/invoices", require("../server/routes/invoices"));
app.use("/api/expenses", require("../server/routes/expenses"));
app.use("/api/users", require("../server/routes/users"));
app.use("/api/dashboard", require("../server/routes/dashboard"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

module.exports = app;