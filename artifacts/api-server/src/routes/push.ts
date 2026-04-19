import { Router } from "express";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/push/vapid-key
router.get("/push/vapid-key", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
});

// POST /api/push/subscribe
router.post("/push/subscribe", async (req: AuthRequest, res) => {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription" });
    return;
  }

  await db
    .insert(pushSubscriptionsTable)
    .values({
      user_id:  req.user!.id,
      endpoint,
      p256dh:   keys.p256dh,
      auth:     keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { user_id: req.user!.id, p256dh: keys.p256dh, auth: keys.auth },
    });

  res.json({ ok: true });
});

// DELETE /api/push/unsubscribe
router.delete("/push/unsubscribe", async (req: AuthRequest, res) => {
  const { endpoint } = req.body as { endpoint: string };
  if (endpoint) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  }
  res.json({ ok: true });
});

export default router;
