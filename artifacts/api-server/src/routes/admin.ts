import { Router } from "express";
import { db, inviteCodesTable, usersTable, sessionsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// All admin routes require auth + admin role
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
      used_at:      inviteCodesTable.used_at,
      created_at:   inviteCodesTable.created_at,
    })
    .from(inviteCodesTable)
    .orderBy(desc(inviteCodesTable.created_at));
  res.json(codes);
});

// POST /api/admin/codes
router.post("/codes", async (req: AuthRequest, res) => {
  let code: string;
  while (true) {
    code = generateCode();
    const existing = await db
      .select({ id: inviteCodesTable.id })
      .from(inviteCodesTable)
      .where(eq(inviteCodesTable.code, code));
    if (existing.length === 0) break;
  }
  const [created] = await db
    .insert(inviteCodesTable)
    .values({ code: code!, grants_admin: false, created_by: req.user!.id })
    .returning();
  res.json(created);
});

// GET /api/admin/stats
router.get("/stats", async (_req, res) => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [codeCount] = await db.select({ count: count() }).from(inviteCodesTable);
  const [usedCount] = await db
    .select({ count: count() })
    .from(inviteCodesTable)
    .where(eq(inviteCodesTable.is_used, true));

  res.json({
    total_users:   userCount.count,
    total_codes:   codeCount.count,
    used_codes:    usedCount.count,
    online_users:  42,
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
