import { Router } from "express";
import { db, inviteCodesTable, usersTable, sessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

const SESSION_DAYS = 30;

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// POST /api/auth/validate-code
// Just checks the code is valid + unused (doesn't consume it)
router.post("/auth/validate-code", async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "code is required" });
    return;
  }
  const upper = code.trim().toUpperCase();
  const rows = await db
    .select()
    .from(inviteCodesTable)
    .where(eq(inviteCodesTable.code, upper))
    .limit(1);

  if (rows.length === 0 || rows[0].is_used) {
    res.status(400).json({ error: "Неверный или уже использованный код" });
    return;
  }
  res.json({ valid: true, grants_admin: rows[0].grants_admin });
});

// POST /api/auth/setup-profile
// Consumes the code, creates user + session
router.post("/auth/setup-profile", async (req, res) => {
  const { code, name, avatar_url } = req.body;
  if (!code || !name) {
    res.status(400).json({ error: "code and name are required" });
    return;
  }
  const upper = code.trim().toUpperCase();

  // Re-validate code (prevent race conditions)
  const codeRows = await db
    .select()
    .from(inviteCodesTable)
    .where(and(eq(inviteCodesTable.code, upper), eq(inviteCodesTable.is_used, false)))
    .limit(1);

  if (codeRows.length === 0) {
    res.status(400).json({ error: "Код уже использован или недействителен" });
    return;
  }
  const inviteCode = codeRows[0];

  // Create user
  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      avatar_url: avatar_url || "",
      role: inviteCode.grants_admin ? "admin" : "user",
      invite_code_id: inviteCode.id,
    })
    .returning();

  // Mark code as used
  await db
    .update(inviteCodesTable)
    .set({ is_used: true, used_by: user.id, used_at: new Date() })
    .where(eq(inviteCodesTable.id, inviteCode.id));

  // Create session
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
  await db.insert(sessionsTable).values({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  // Set cookie
  res.cookie("makswim_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  res.json({
    id:         user.id,
    name:       user.name,
    avatar_url: user.avatar_url,
    role:       user.role,
  });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile  — update own profile
router.put("/auth/profile", requireAuth, async (req: AuthRequest, res) => {
  const { name, avatar_url } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ name: name.trim(), avatar_url: avatar_url || "" })
    .where(eq(usersTable.id, req.user!.id))
    .returning();
  res.json({ id: updated.id, name: updated.name, avatar_url: updated.avatar_url, role: updated.role });
});

// POST /api/auth/logout
router.post("/auth/logout", requireAuth, async (req: AuthRequest, res) => {
  const token = req.cookies?.makswim_session;
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.clearCookie("makswim_session", { path: "/" });
  res.json({ ok: true });
});

export default router;
