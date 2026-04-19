import { Router } from "express";
import { db, inviteCodesTable, usersTable, sessionsTable } from "@workspace/db";
import { eq, desc, count, gt } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SNC-${part(4)}-${part(4)}`;
}

// GET /api/admin/codes
router.get("/codes", async (_req, res) => {
  const codes = await db
    .select({
      id:           inviteCodesTable.id,
      code:         inviteCodesTable.code,
      grants_admin: inviteCodesTable.grants_admin,
      is_used:      inviteCodesTable.is_used,
      is_revoked:   inviteCodesTable.is_revoked,
      used_at:      inviteCodesTable.used_at,
      expires_at:   inviteCodesTable.expires_at,
      created_at:   inviteCodesTable.created_at,
    })
    .from(inviteCodesTable)
    .orderBy(desc(inviteCodesTable.created_at));
  res.json(codes);
});

// POST /api/admin/codes
router.post("/codes", async (req: AuthRequest, res) => {
  const { grants_admin = false, expires_days } = req.body || {};

  let code: string;
  while (true) {
    code = generateCode();
    const existing = await db
      .select({ id: inviteCodesTable.id })
      .from(inviteCodesTable)
      .where(eq(inviteCodesTable.code, code));
    if (existing.length === 0) break;
  }

  const expires_at = expires_days
    ? new Date(Date.now() + Number(expires_days) * 86400 * 1000)
    : null;

  const [created] = await db
    .insert(inviteCodesTable)
    .values({
      code: code!,
      grants_admin: Boolean(grants_admin),
      created_by: req.user!.id,
      expires_at,
    })
    .returning();

  res.json(created);
});

// DELETE /api/admin/codes/:id — revoke a code
router.delete("/codes/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const [code] = await db
    .select()
    .from(inviteCodesTable)
    .where(eq(inviteCodesTable.id, id))
    .limit(1);

  if (!code) {
    res.status(404).json({ error: "Code not found" });
    return;
  }

  const [updated] = await db
    .update(inviteCodesTable)
    .set({ is_revoked: true, revoked_at: new Date() })
    .where(eq(inviteCodesTable.id, id))
    .returning();

  // If the code was used (user exists), invalidate their sessions
  if (code.used_by) {
    await db.delete(sessionsTable).where(eq(sessionsTable.user_id, code.used_by));
  }

  res.json({ ok: true, code: updated });
});

// GET /api/admin/stats
router.get("/stats", async (_req, res) => {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [codeCount] = await db.select({ count: count() }).from(inviteCodesTable);
  const [usedCount] = await db
    .select({ count: count() })
    .from(inviteCodesTable)
    .where(eq(inviteCodesTable.is_used, true));

  const [onlineCount] = await db
    .select({ count: count() })
    .from(sessionsTable)
    .where(gt(sessionsTable.expires_at, fifteenMinutesAgo));

  res.json({
    total_users:   userCount.count,
    total_codes:   codeCount.count,
    used_codes:    usedCount.count,
    online_users:  onlineCount.count,
  });
});

// GET /api/admin/members
router.get("/members", async (_req, res) => {
  const members = await db
    .select({
      id:         usersTable.id,
      name:       usersTable.name,
      avatar_url: usersTable.avatar_url,
      role:       usersTable.role,
      created_at: usersTable.created_at,
    })
    .from(usersTable)
    .orderBy(usersTable.created_at);
  res.json(members);
});

// DELETE /api/admin/members/:id
router.delete("/members/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    res.status(400).json({ error: "Cannot remove yourself" });
    return;
  }
  await db.delete(sessionsTable).where(eq(sessionsTable.user_id, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// PUT /api/admin/members/:id/role
router.put("/members/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, role: usersTable.role });
  res.json(updated);
});

export default router;
