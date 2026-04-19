import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/members — all users (visible to all authenticated users)
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

export default router;
