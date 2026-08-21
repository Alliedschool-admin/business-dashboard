const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticate, requireRole } = require("../auth");

router.use(authenticate);

router.get("/", requireRole("admin"), (req, res) => {
  const users = (db.data.users || []).map(({ password, ...u }) => u);
  res.json(users);
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const existing = (db.data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "A user with this email already exists" });
  }

  const newUser = {
    id: db.nextId("users"),
    name,
    email: email.toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    role: role || "staff",
    is_active: 1,
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  if (!db.data.users) db.data.users = [];
  db.data.users.push(newUser);
  await db.save();

  const { password: _, ...userWithoutPass } = newUser;
  res.json({ user: userWithoutPass, message: "User created successfully" });
});

router.put("/profile/me", async (req, res) => {
  const { name, email, current_password, new_password } = req.body;
  const user = (db.data.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (name) user.name = name;
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = (db.data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
    if (existing) return res.status(400).json({ error: "Email is already in use by another account" });
    user.email = email.toLowerCase();
  }

  if (new_password) {
    if (!current_password) return res.status(400).json({ error: "Current password is required to set a new password" });
    const isMatch = bcrypt.compareSync(current_password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
    user.password = bcrypt.hashSync(new_password, 10);
  }

  await db.save();
  const { password: _, ...userWithoutPass } = user;
  res.json({ message: "Profile updated successfully", user: userWithoutPass });
});

router.put("/:id", requireRole("admin"), async (req, res) => {
  const { name, email, role, is_active } = req.body;
  const targetId = parseInt(req.params.id);
  const user = (db.data.users || []).find(u => u.id === targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (targetId === req.user.id && is_active === 0) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }

  if (name) user.name = name;
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = (db.data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
    if (existing) return res.status(400).json({ error: "Email is already in use by another account" });
    user.email = email.toLowerCase();
  }
  if (role) user.role = role;
  if (is_active !== undefined) user.is_active = is_active ? 1 : 0;

  await db.save();
  const { password: _, ...userWithoutPass } = user;
  res.json({ message: "User updated successfully", user: userWithoutPass });
});

router.put("/:id/password", requireRole("admin"), async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters long" });
  }

  const targetId = parseInt(req.params.id);
  const user = (db.data.users || []).find(u => u.id === targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.password = bcrypt.hashSync(new_password, 10);
  await db.save();
  res.json({ message: `Password for ${user.name} was successfully reset` });
});

module.exports = router;