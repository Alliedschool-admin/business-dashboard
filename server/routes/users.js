const router = require("express").Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

// Get all users (Admin only)
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

// Create new user (Admin only)
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
  res.json({ id: newUser.id, message: "User created successfully" });
});

// Update user details, username/name, email, role, status, and optional password (Admin only)
router.put("/:id", requireRole("admin"), (req, res) => {
  const uId = parseInt(req.params.id);
  const u = db.data.users.find(x => x.id === uId);
  if (!u) return res.status(404).json({ error: "User not found" });

  const { name, email, role, is_active, password } = req.body;

  if (email && email.toLowerCase() !== u.email.toLowerCase()) {
    const existing = db.data.users.find(x => x.id !== uId && x.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(400).json({ error: "Email already taken by another user" });
    u.email = email;
  }

  if (name) u.name = name;
  if (role) u.role = role;
  if (is_active !== undefined) u.is_active = parseInt(is_active);
  if (password && password.trim().length > 0) {
    u.password = bcrypt.hashSync(password.trim(), 10);
  }

  db.save();
  res.json({ message: "User updated successfully" });
});

// Admin direct reset password for any user
router.put("/:id/password", requireRole("admin"), (req, res) => {
  const uId = parseInt(req.params.id);
  const u = db.data.users.find(x => x.id === uId);
  if (!u) return res.status(404).json({ error: "User not found" });

  const { new_password } = req.body;
  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }

  u.password = bcrypt.hashSync(new_password.trim(), 10);
  db.save();
  res.json({ message: `Password for ${u.name} updated successfully` });
});

// Self-service: update own profile & password
router.put("/profile/me", (req, res) => {
  const u = db.data.users.find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({ error: "User not found" });

  const { name, email, current_password, new_password } = req.body;

  if (email && email.toLowerCase() !== u.email.toLowerCase()) {
    const existing = db.data.users.find(x => x.id !== u.id && x.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(400).json({ error: "Email already taken" });
    u.email = email;
  }

  if (name) u.name = name;

  if (new_password && new_password.trim().length > 0) {
    if (!current_password || !bcrypt.compareSync(current_password, u.password)) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    u.password = bcrypt.hashSync(new_password.trim(), 10);
  }

  db.save();
  res.json({
    message: "Profile updated successfully",
    user: { id: u.id, name: u.name, email: u.email, role: u.role }
  });
});

// Deactivate user (Admin only)
router.delete("/:id", requireRole("admin"), (req, res) => {
  const uId = parseInt(req.params.id);
  if (uId === req.user.id) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }
  const u = db.data.users.find(x => x.id === uId);
  if (!u) return res.status(404).json({ error: "User not found" });

  u.is_active = 0;
  db.save();
  res.json({ message: `User ${u.name} deactivated` });
});

module.exports = router;