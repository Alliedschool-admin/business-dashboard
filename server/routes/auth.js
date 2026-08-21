const router = require("express").Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { SECRET, authenticate } = require("../auth");

router.post("/login", async (req, res) => {
  if (process.env.MONGODB_URI) {
    await db.ensureConnected().catch(() => {});
  }

  const { email, password } = req.body;
  const query = (email || "").trim().toLowerCase();

  // Search by Email OR by Name/Username
  let user = (db.data.users || []).find(
    u => (u.email.toLowerCase() === query || u.name.toLowerCase() === query) && u.is_active === 1
  );

  // If no users in DB, auto-seed default admin
  if ((!db.data.users || db.data.users.length === 0) && (query === "admin@bizflow.com" || query === "admin")) {
    const newAdmin = {
      id: 1,
      name: "Admin User",
      email: "admin@bizflow.com",
      password: bcrypt.hashSync("admin123", 10),
      role: "admin",
      is_active: 1,
      created_at: new Date().toISOString()
    };
    db.data.users = [newAdmin];
    await db.save();
    user = newAdmin;
  }

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email/username or password" });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Emergency Admin Recovery Endpoint
router.post("/emergency-reset", async (req, res) => {
  if (process.env.MONGODB_URI) {
    await db.ensureConnected().catch(() => {});
  }

  const defaultAdmin = {
    id: 1,
    name: "Admin User",
    email: "admin@bizflow.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
    is_active: 1,
    created_at: new Date().toISOString()
  };

  if (!db.data.users) db.data.users = [];
  const existingAdminIndex = db.data.users.findIndex(u => u.role === "admin" || u.id === 1);
  if (existingAdminIndex >= 0) {
    db.data.users[existingAdminIndex] = defaultAdmin;
  } else {
    db.data.users.unshift(defaultAdmin);
  }

  await db.save();
  res.json({
    message: "Admin credentials restored successfully! Email: admin@bizflow.com / Password: admin123"
  });
});

router.get("/me", authenticate, (req, res) => {
  const user = (db.data.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;