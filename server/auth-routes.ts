import express from "express";

const router = express.Router();

// Simple auth endpoints for guest mode
router.get("/user", (req, res) => {
  res.status(401).json({ authenticated: false });
});

router.post("/login", (req, res) => {
  res.status(401).json({ authenticated: false, message: "Guest mode active" });
});

router.post("/logout", (req, res) => {
  res.json({ success: true });
});

router.post("/register", (req, res) => {
  res.status(401).json({ authenticated: false, message: "Registration disabled in guest mode" });
});

export default router;