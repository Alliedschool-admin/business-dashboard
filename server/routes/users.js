const router = require("express").Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", requireRole("admin"), (req, res) => {
  const list = db.data.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at
  }));
  res.json(list);
});

router.post("/", requireRole("admin"), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  const existing = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: db.nextId("users"),
    name,
    email,
    password: hash,
    role: role || "staff",
    is_active: 1,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  db.data.users.push(newUser);
  db.save();
  res.json({ id: newUser.id, message: "User created" });
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const u = db.data.users.find(x => x.id === parseInt(req.params.id));
  if (!u) return res.status(404).json({ error: "User not found" });

  const { name, email, role, is_active } = req.body;
  u.name = name || u.name;
  u.email = email || u.email;
  u.role = role || u.role;
  if (is_active !== undefined) u.is_active = parseInt(is_active);

  db.save();
  res.json({ message: "User updated" });
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  const uId = parseInt(req.params.id);
  if (uId === req.user.id) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }
  const u = db.data.users.find(x => x.id === uId);
  if (!u) return res.status(404).json({ error: "User not found" });

  u.is_active = 0;
  db.save();
  res.json({ message: "User deactivated" });
});

module.exports = router;
