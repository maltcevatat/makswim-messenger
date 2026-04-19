import { Router } from "express";
import { db, inviteCodesTable, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

const SESSION_DAYS = 30;

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
  await db.insert(sessionsTable).values({ user_id: userId, token, expires_at: expiresAt });
  return { token, expiresAt };
}

function validateInviteCode(invite: {
  is_revoked: boolean;
  expires_at: Date | null;
}): { valid: boolean; error?: string } {
  if (invite.is_revoked) {
    return { valid: false, error: "Этот код был отозван" };
  }
  if (invite.expires_at && invite.expires_at < new Date()) {
    return { valid: false, error: "Срок действия кода истёк" };
  }
  return { valid: true };
}

// POST /api/auth/validate-code
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

  if (rows.length === 0) {
    res.status(400).json({ error: "Неверный код приглашения" });
    return;
  }

  const invite = rows[0];

  const check = validateInviteCode(invite);
  if (!check.valid) {
    res.status(400).json({ error: check.error });
    return;
  }

  if (!invite.is_used) {
    res.json({ valid: true, grants_admin: invite.grants_admin, is_new: true });
  } else {
    res.json({ valid: true, grants_admin: invite.grants_admin, is_new: false });
  }
});

// POST /api/auth/setup-profile
router.post("/auth/setup-profile", async (req, res) => {
  const { code, name, avatar_url } = req.body;
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }
  const upper = code.trim().toUpperCase();

  const codeRows = await db
    .select()
    .from(inviteCodesTable)
    .where(eq(inviteCodesTable.code, upper))
    .limit(1);

  if (codeRows.length === 0) {
    res.status(400).json({ error: "Недействительный код" });
    return;
  }
  const inviteCode = codeRows[0];

  // Check if revoked (block even returning users)
  if (inviteCode.is_revoked) {
    res.status(403).json({ error: "Доступ отозван. Обратитесь к администратору." });
    return;
  }

  // Check expiry only for unused codes (returning users can still log in)
  if (!inviteCode.is_used && inviteCode.expires_at && inviteCode.expires_at < new Date()) {
    res.status(400).json({ error: "Срок действия кода истёк" });
    return;
  }

  // RETURNING USER
  if (inviteCode.is_used && inviteCode.used_by) {
    const userRows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, inviteCode.used_by))
      .limit(1);

    if (userRows.length === 0) {
      res.status(400).json({ error: "Пользователь не найден" });
      return;
    }
    const user = userRows[0];
    const { token, expiresAt } = await createSession(user.id);

    res.cookie("makswim_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    res.json({ id: user.id, name: user.name, avatar_url: user.avatar_url, role: user.role });
    return;
  }

  // NEW USER
  if (!name) {
    res.status(400).json({ error: "name is required for new registration" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      avatar_url: avatar_url || "",
      role: inviteCode.grants_admin ? "admin" : "user",
      invite_code_id: inviteCode.id,
    })
    .returning();

  await db
    .update(inviteCodesTable)
    .set({ is_used: true, used_by: user.id, used_at: new Date() })
    .where(eq(inviteCodesTable.id, inviteCode.id));

  const { token, expiresAt } = await createSession(user.id);

  res.cookie("makswim_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  res.json({ id: user.id, name: user.name, avatar_url: user.avatar_url, role: user.role });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile
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
