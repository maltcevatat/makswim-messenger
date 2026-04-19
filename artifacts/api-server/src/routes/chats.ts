import { Router } from "express";
import {
  db, messagesTable, usersTable
} from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import crypto from "crypto";

const router = Router();
router.use(requireAuth);

const GROUP_CHAT_ID = "00000000-0000-0000-0000-000000000001";

// Deterministic UUID from two user IDs (valid UUID format)
function personalChatId(a: string, b: string): string {
  const sorted = [a, b].sort().join(":");
  const hash = crypto.createHash("sha1").update("makswim-personal:" + sorted).digest("hex");
  return [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20, 32)].join("-");
}

// GET /api/chats
router.get("/chats", async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [groupLastMsg] = await db
    .select({ content: messagesTable.content, created_at: messagesTable.created_at })
    .from(messagesTable)
    .where(eq(messagesTable.chat_id, GROUP_CHAT_ID))
    .orderBy(desc(messagesTable.created_at))
    .limit(1);

  const allUsers = await db
    .select({ id: usersTable.id, name: usersTable.name, avatar_url: usersTable.avatar_url })
    .from(usersTable)
    .orderBy(usersTable.created_at);

  const otherUsers = allUsers.filter(u => u.id !== userId);

  const personalChats = await Promise.all(
    otherUsers.map(async (u) => {
      const chatId = personalChatId(userId, u.id);
      const [lastMsg] = await db
        .select({ content: messagesTable.content, created_at: messagesTable.created_at })
        .from(messagesTable)
        .where(eq(messagesTable.chat_id, chatId))
        .orderBy(desc(messagesTable.created_at))
        .limit(1);

      return {
        id:         u.id,
        name:       u.name,
        avatar_url: u.avatar_url,
        last_msg:   lastMsg?.content || null,
        last_time:  lastMsg?.created_at || null,
      };
    })
  );

  res.json({
    group: {
      id:        GROUP_CHAT_ID,
      name:      "Общий чат",
      last_msg:  groupLastMsg?.content || null,
      last_time: groupLastMsg?.created_at || null,
    },
    personal: personalChats,
  });
});

// GET /api/chats/:chatId/messages
router.get("/chats/:chatId/messages", async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const userId = req.user!.id;

  // Resolve personal chat ID from user ID
  const actualChatId = chatId === GROUP_CHAT_ID ? chatId : personalChatId(userId, chatId);

  const messages = await db
    .select({
      id:            messagesTable.id,
      content:       messagesTable.content,
      content_type:  messagesTable.content_type,
      is_deleted:    messagesTable.is_deleted,
      created_at:    messagesTable.created_at,
      edited_at:     messagesTable.edited_at,
      sender_id:     messagesTable.sender_id,
      sender_name:   usersTable.name,
      sender_avatar: usersTable.avatar_url,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.sender_id, usersTable.id))
    .where(eq(messagesTable.chat_id, actualChatId))
    .orderBy(asc(messagesTable.created_at))
    .limit(200);

  res.json(messages.map(m => ({ ...m, outgoing: m.sender_id === userId })));
});

// POST /api/chats/:chatId/messages
router.post("/chats/:chatId/messages", async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const { content, content_type = "text" } = req.body;
  const userId = req.user!.id;

  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const actualChatId = chatId === GROUP_CHAT_ID ? chatId : personalChatId(userId, chatId);

  const [msg] = await db
    .insert(messagesTable)
    .values({
      chat_id:      actualChatId,
      sender_id:    userId,
      content,
      content_type: content_type as "text" | "image" | "voice",
    })
    .returning();

  res.json({
    ...msg,
    outgoing:      true,
    sender_name:   req.user!.name,
    sender_avatar: req.user!.avatar_url,
  });
});

// DELETE /api/messages/:id
router.delete("/messages/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, id)).limit(1);

  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
  if (msg.sender_id !== userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.update(messagesTable)
    .set({ is_deleted: true, content: "Сообщение удалено" })
    .where(eq(messagesTable.id, id));

  res.json({ ok: true });
});

export default router;
