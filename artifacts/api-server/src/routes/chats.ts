import { Router } from "express";
import {
  db, messagesTable, usersTable, chatsTable, chatMembersTable, pushSubscriptionsTable
} from "@workspace/db";
import { eq, desc, asc, and, inArray, lt } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import { chatEmitter } from "../lib/events.js";
import crypto from "crypto";
import webpush from "web-push";

const router = Router();
router.use(requireAuth);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@makswim.app",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

function personalChatId(a: string, b: string): string {
  const sorted = [a, b].sort().join(":");
  const hash = crypto.createHash("sha1").update("makswim-personal:" + sorted).digest("hex");
  return [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20, 32)].join("-");
}

async function resolveActualChatId(chatId: string, userId: string): Promise<{ actualId: string; type: "custom_group" | "personal"; partnerUserId?: string }> {
  const customGroup = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .where(and(eq(chatsTable.id, chatId), eq(chatsTable.type, "group")))
    .limit(1);

  if (customGroup.length > 0) {
    return { actualId: chatId, type: "custom_group" };
  }

  return { actualId: personalChatId(userId, chatId), type: "personal", partnerUserId: chatId };
}

async function sendPushToUsers(userIds: string[], payload: object) {
  if (userIds.length === 0) return;
  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(inArray(pushSubscriptionsTable.user_id, userIds));

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(() => {})
    )
  );
}

function msgPreview(content: string | null, contentType: string | null): string | null {
  if (!content) return null;
  if (contentType === "image") return "📷 Фото";
  if (contentType === "voice") return "🎤 Голосовое";
  return content;
}

// GET /api/chats
router.get("/chats", async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [allUsers, userGroups] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, avatar_url: usersTable.avatar_url })
      .from(usersTable)
      .orderBy(usersTable.name),
    db.select({ id: chatsTable.id, name: chatsTable.name })
      .from(chatsTable)
      .innerJoin(chatMembersTable, eq(chatMembersTable.chat_id, chatsTable.id))
      .where(and(eq(chatMembersTable.user_id, userId), eq(chatsTable.type, "group"))),
  ]);

  const otherUsers = allUsers.filter(u => u.id !== userId);
  const personalChatIds = otherUsers.map(u => personalChatId(userId, u.id));
  const groupChatIds = userGroups.map(g => g.id);
  const allChatIds = [...personalChatIds, ...groupChatIds];

  let lastMsgMap: Record<string, { content: string; content_type: string; created_at: Date }> = {};
  if (allChatIds.length > 0) {
    const allMsgs = await db
      .select({
        chat_id:      messagesTable.chat_id,
        content:      messagesTable.content,
        content_type: messagesTable.content_type,
        created_at:   messagesTable.created_at,
      })
      .from(messagesTable)
      .where(inArray(messagesTable.chat_id, allChatIds))
      .orderBy(desc(messagesTable.created_at));

    for (const row of allMsgs) {
      if (!lastMsgMap[row.chat_id]) {
        lastMsgMap[row.chat_id] = {
          content: row.content,
          content_type: row.content_type,
          created_at: row.created_at,
        };
      }
    }
  }

  const sortByTime = (a: { last_time: Date | null }, b: { last_time: Date | null }) => {
    if (!a.last_time && !b.last_time) return 0;
    if (!a.last_time) return 1;
    if (!b.last_time) return -1;
    return b.last_time.getTime() - a.last_time.getTime();
  };

  const personalChats = otherUsers.map(u => {
    const cid = personalChatId(userId, u.id);
    const lm = lastMsgMap[cid] ?? null;
    return {
      id:         u.id,
      name:       u.name,
      avatar_url: u.avatar_url,
      last_msg:   lm ? msgPreview(lm.content, lm.content_type) : null,
      last_time:  lm?.created_at ?? null,
    };
  }).sort(sortByTime);

  const customGroupsWithMsgs = userGroups.map(g => {
    const lm = lastMsgMap[g.id] ?? null;
    return {
      id:        g.id,
      name:      g.name || "Группа",
      last_msg:  lm ? msgPreview(lm.content, lm.content_type) : null,
      last_time: lm?.created_at ?? null,
    };
  }).sort(sortByTime);

  res.json({ custom_groups: customGroupsWithMsgs, personal: personalChats });
});

// GET /api/group-chats/:id/members (admin only)
router.get("/group-chats/:id/members", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;

  const chat = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .where(and(eq(chatsTable.id, id), eq(chatsTable.type, "group")))
    .limit(1);

  if (chat.length === 0) { res.status(404).json({ error: "Group not found" }); return; }

  const members = await db
    .select({
      id:         usersTable.id,
      name:       usersTable.name,
      avatar_url: usersTable.avatar_url,
      role:       usersTable.role,
    })
    .from(chatMembersTable)
    .innerJoin(usersTable, eq(chatMembersTable.user_id, usersTable.id))
    .where(eq(chatMembersTable.chat_id, id));

  res.json(members);
});

// POST /api/group-chats/:id/members — add members (admin only)
router.post("/group-chats/:id/members", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { user_ids } = req.body as { user_ids: string[] };

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    res.status(400).json({ error: "user_ids must be non-empty array" }); return;
  }

  const chat = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .where(and(eq(chatsTable.id, id), eq(chatsTable.type, "group")))
    .limit(1);

  if (chat.length === 0) { res.status(404).json({ error: "Group not found" }); return; }

  // Find which users are already members to avoid duplicates
  const existing = await db
    .select({ user_id: chatMembersTable.user_id })
    .from(chatMembersTable)
    .where(and(eq(chatMembersTable.chat_id, id), inArray(chatMembersTable.user_id, user_ids)));

  const existingIds = new Set(existing.map(e => e.user_id));
  const toAdd = user_ids.filter(uid => !existingIds.has(uid));

  if (toAdd.length > 0) {
    await db.insert(chatMembersTable).values(
      toAdd.map(uid => ({ chat_id: id, user_id: uid }))
    );
  }

  res.json({ added: toAdd.length });
});

// DELETE /api/group-chats/:id/members/:userId — remove member (admin only)
router.delete("/group-chats/:id/members/:userId", requireAdmin, async (req: AuthRequest, res) => {
  const { id, userId } = req.params;

  const chat = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .where(and(eq(chatsTable.id, id), eq(chatsTable.type, "group")))
    .limit(1);

  if (chat.length === 0) { res.status(404).json({ error: "Group not found" }); return; }

  await db.delete(chatMembersTable).where(
    and(eq(chatMembersTable.chat_id, id), eq(chatMembersTable.user_id, userId))
  );

  res.json({ ok: true });
});

// GET /api/chats/:chatId/stream — SSE real-time stream
router.get("/chats/:chatId/stream", async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const userId = req.user!.id;

  const { actualId } = await resolveActualChatId(chatId, userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write("event: connected\ndata: {}\n\n");

  const pingInterval = setInterval(() => {
    res.write("event: ping\ndata: {}\n\n");
  }, 25000);

  const onMessage = (msg: object) => {
    try {
      res.write(`event: message\ndata: ${JSON.stringify(msg)}\n\n`);
    } catch {}
  };

  chatEmitter.on(`chat:${actualId}`, onMessage);

  req.on("close", () => {
    clearInterval(pingInterval);
    chatEmitter.off(`chat:${actualId}`, onMessage);
  });
});

// POST /api/group-chats (admin only)
router.post("/group-chats", requireAdmin, async (req: AuthRequest, res) => {
  const { name, member_ids } = req.body as { name: string; member_ids: string[] };
  if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }
  if (!Array.isArray(member_ids) || member_ids.length === 0) {
    res.status(400).json({ error: "member_ids must be non-empty array" }); return;
  }

  const [chat] = await db
    .insert(chatsTable)
    .values({ type: "group", name: name.trim(), created_by: req.user!.id })
    .returning();

  const allMemberIds = Array.from(new Set([req.user!.id, ...member_ids]));
  await db.insert(chatMembersTable).values(
    allMemberIds.map(uid => ({ chat_id: chat.id, user_id: uid }))
  );

  res.json({ id: chat.id, name: chat.name, type: "group" });
});

// DELETE /api/group-chats/:id (admin only)
router.delete("/group-chats/:id", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;

  const [chat] = await db
    .select()
    .from(chatsTable)
    .where(and(eq(chatsTable.id, id), eq(chatsTable.type, "group")))
    .limit(1);

  if (!chat) { res.status(404).json({ error: "Group not found" }); return; }

  await db.delete(messagesTable).where(eq(messagesTable.chat_id, id));
  await db.delete(chatMembersTable).where(eq(chatMembersTable.chat_id, id));
  await db.delete(chatsTable).where(eq(chatsTable.id, id));

  res.json({ ok: true });
});

// GET /api/chats/:chatId/messages — supports ?limit=&before= for pagination
router.get("/chats/:chatId/messages", async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const before = req.query.before as string | undefined;

  const { actualId } = await resolveActualChatId(chatId, userId);

  const whereClause = before
    ? and(eq(messagesTable.chat_id, actualId), lt(messagesTable.created_at, new Date(before)))
    : eq(messagesTable.chat_id, actualId);

  const messages = await db
    .select({
      id:                messagesTable.id,
      content:           messagesTable.content,
      content_type:      messagesTable.content_type,
      is_deleted:        messagesTable.is_deleted,
      created_at:        messagesTable.created_at,
      edited_at:         messagesTable.edited_at,
      sender_id:         messagesTable.sender_id,
      client_message_id: messagesTable.client_message_id,
      sender_name:       usersTable.name,
      sender_avatar:     usersTable.avatar_url,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.sender_id, usersTable.id))
    .where(whereClause)
    .orderBy(before ? desc(messagesTable.created_at) : asc(messagesTable.created_at))
    .limit(limit);

  const result = before ? messages.reverse() : messages;
  res.json(result.map(m => ({ ...m, outgoing: m.sender_id === userId })));
});

// POST /api/chats/:chatId/messages
router.post("/chats/:chatId/messages", async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const { content, content_type = "text", client_message_id } = req.body;
  const userId = req.user!.id;

  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const { actualId, type, partnerUserId } = await resolveActualChatId(chatId, userId);

  // Idempotency: return existing message if client_message_id already seen
  if (client_message_id) {
    const existing = await db
      .select({
        id:                messagesTable.id,
        content:           messagesTable.content,
        content_type:      messagesTable.content_type,
        is_deleted:        messagesTable.is_deleted,
        created_at:        messagesTable.created_at,
        sender_id:         messagesTable.sender_id,
        client_message_id: messagesTable.client_message_id,
      })
      .from(messagesTable)
      .where(eq(messagesTable.client_message_id, client_message_id))
      .limit(1);

    if (existing.length > 0) {
      const m = existing[0];
      return res.json({
        ...m,
        outgoing:      true,
        sender_name:   req.user!.name,
        sender_avatar: req.user!.avatar_url,
      });
    }
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      chat_id:           actualId,
      sender_id:         userId,
      content,
      content_type:      content_type as "text" | "image" | "voice",
      client_message_id: client_message_id || null,
    })
    .returning();

  const response = {
    ...msg,
    outgoing:      true,
    sender_name:   req.user!.name,
    sender_avatar: req.user!.avatar_url,
  };

  res.json(response);

  // Broadcast via SSE to all clients in this chat
  const ssePayload = { ...response, outgoing: false };
  chatEmitter.emit(`chat:${actualId}`, ssePayload);

  // Push notifications
  const notifContent = content_type === "image" ? "📷 Фото"
    : content_type === "voice" ? "🎤 Голосовое сообщение"
    : content.length > 80 ? content.slice(0, 80) + "…" : content;

  const payload = {
    title: req.user!.name,
    body: notifContent,
    data: { chatId: chatId },
  };

  if (type === "personal" && partnerUserId) {
    sendPushToUsers([partnerUserId], payload).catch(() => {});
  } else if (type === "custom_group") {
    const members = await db
      .select({ user_id: chatMembersTable.user_id })
      .from(chatMembersTable)
      .where(eq(chatMembersTable.chat_id, actualId));
    const others = members.map(m => m.user_id).filter(id => id !== userId);
    sendPushToUsers(others, payload).catch(() => {});
  }
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

  // Notify SSE clients about deletion
  chatEmitter.emit(`chat:${msg.chat_id}`, {
    type:       "delete",
    message_id: id,
  });

  res.json({ ok: true });
});

export default router;
