import { Router } from "express";
import { db, trainingEventsTable, trainingRegistrationsTable, usersTable } from "@workspace/db";
import { eq, and, like, asc, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/training?month=YYYY-MM
router.get("/training", async (req: AuthRequest, res) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const userId = req.user!.id;

  const events = await db
    .select()
    .from(trainingEventsTable)
    .where(like(trainingEventsTable.date, `${month}%`))
    .orderBy(asc(trainingEventsTable.date), asc(trainingEventsTable.time_start));

  if (events.length === 0) {
    res.json({ events: [], my_registrations: [] });
    return;
  }

  const eventIds = events.map(e => e.id);
  const regs = await db
    .select({ event_id: trainingRegistrationsTable.event_id, user_id: trainingRegistrationsTable.user_id })
    .from(trainingRegistrationsTable)
    .where(inArray(trainingRegistrationsTable.event_id, eventIds));

  const countMap: Record<string, number> = {};
  const mySet = new Set<string>();
  for (const r of regs) {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
    if (r.user_id === userId) mySet.add(r.event_id);
  }

  res.json({
    events: events.map(e => ({ ...e, count: countMap[e.id] || 0 })),
    my_registrations: [...mySet],
  });
});

// POST /api/training  (admin only)
router.post("/training", requireAdmin, async (req: AuthRequest, res) => {
  const { date, title, icon = "fitness_center", time_start, time_end, color = "primary" } = req.body;
  if (!date || !title || !time_start || !time_end) {
    res.status(400).json({ error: "date, title, time_start, time_end are required" });
    return;
  }
  const [event] = await db
    .insert(trainingEventsTable)
    .values({ date, title, icon, time_start, time_end, color, created_by: req.user!.id })
    .returning();
  res.json({ ...event, count: 0 });
});

// PUT /api/training/:id  (admin only)
router.put("/training/:id", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { date, title, icon, time_start, time_end, color } = req.body;
  const [event] = await db
    .update(trainingEventsTable)
    .set({ date, title, icon, time_start, time_end, color })
    .where(eq(trainingEventsTable.id, id))
    .returning();
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(event);
});

// DELETE /api/training/:id  (admin only)
router.delete("/training/:id", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  await db.delete(trainingRegistrationsTable).where(eq(trainingRegistrationsTable.event_id, id));
  await db.delete(trainingEventsTable).where(eq(trainingEventsTable.id, id));
  res.json({ ok: true });
});

// POST /api/training/:id/register  (toggle)
router.post("/training/:id/register", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await db
    .select()
    .from(trainingRegistrationsTable)
    .where(and(eq(trainingRegistrationsTable.event_id, id), eq(trainingRegistrationsTable.user_id, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(trainingRegistrationsTable)
      .where(and(eq(trainingRegistrationsTable.event_id, id), eq(trainingRegistrationsTable.user_id, userId)));
    res.json({ registered: false });
  } else {
    await db.insert(trainingRegistrationsTable).values({ event_id: id, user_id: userId });
    res.json({ registered: true });
  }
});

// GET /api/training/:id/registrations  (admin: see who registered)
router.get("/training/:id/registrations", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const regs = await db
    .select({ user_id: trainingRegistrationsTable.user_id, name: usersTable.name, avatar_url: usersTable.avatar_url })
    .from(trainingRegistrationsTable)
    .innerJoin(usersTable, eq(trainingRegistrationsTable.user_id, usersTable.id))
    .where(eq(trainingRegistrationsTable.event_id, id));
  res.json(regs);
});

export default router;
