import { Router } from "express";
import {
  db, messagesTable, usersTable, chatsTable, chatMembersTable, pushSubscriptionsTable
} from "@workspace/db";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import crypto from "crypto";
import webpush from "web-push";

const router = Router();
router.use(requireAuth);

const GROUP_CHAT_ID = "00000000-0000-0000-0000-000000000001";

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

async function resolveActualChatId(chatId: string, userId: string): Promise<{ actualId: string; type: "main_group" | "custom_group" | "personal"; partnerUserId?: string }> {
  if (chatId === GROUP_CHAT_ID) return { actualId: chatId, type: "main_group" };

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

// GET /api/chats
router.get("/chats", async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [groupLastMsg] = await db
    .select({ content: messagesTable.content, content_type: messagesTable.content_type, created_at: messagesTable.created_at })
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
        .select({ content: messagesTable.content, content_type: messagesTable.content_type, created_at: messagesTable.created_at })
        .from(messagesTable)
        .where(eq(messagesTable.chat_id, chatId))
        .orderBy(desc(messagesTable.created_at))
        .limit(1);

      const preview = lastMsg
        ? lastMsg.content_type === "image" ? "📷 Фото"
          : lastMsg.content_type === "voice" ? "🎤 Голосовое"
          : lastMsg.content
        : null;

      return {
        id:         u.id,
        name:       u.name,
        avatar_url: u.avatar_url,
        last_msg:   preview,
        last_time:  lastMsg?.created_at || null,
      };
    })
  );

  // Custom group chats where user is a member
  const userGroups = await db
    .select({ id: chatsTable.id, name: chatsTable.name })
    .from(chatsTable)
    .innerJoin(chatMembersTable, eq(chatMembersTable.chat_id, chatsTable.id))
    .where(and(eq(chatMembersTable.user_id, userId), eq(chatsTable.type, "group")));

  const customGroupsWithMsgs = await Promise.all(
    userGroups.map(async (g) => {
      const [lastMsg] = await db
        .select({ content: messagesTable.content, content_type: messagesTable.content_type, created_at: messagesTable.created_at })
        .from(messagesTable)
        .where(eq(messagesTable.chat_id, g.id))
        .orderBy(desc(messagesTable.created_at))
        .limit(1);

      const preview = lastMsg
        ? lastMsg.content_type === "image" ? "📷 Фото"
          : lastMsg.content_type === "voice" ? "🎤 Голосовое"
          : lastMsg.content
        : null;

      return { id: g.id, name: g.name || "Группа", last_msg: preview, last_time: lastMsg?.created_at || null };
    })
  );

  const groupPreview = groupLastMsg
    ? groupLastMsg.content_type === "image" ? "📷 Фото"
      : groupLastMsg.content_type === "voice" ? "🎤 Голосовое"
      : groupLastMsg.content
    : null;

  res.json({
    group: {
      id:        GROUP_CHAT_ID,
      name:      "Общий чат",
      last_msg:  groupPreview,
      last_time: groupLastMsg?.created_at || null,
    },
    custom_groups: customGroupsWithMsgs,
    personal: personalChats,
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

// GET /api/chats/:chatId/messages
router.get("/chats/:chatId/messages", async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const userId = req.user!.id;

  const { actualId } = await resolveActualChatId(chatId, userId);

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
    .where(eq(messagesTable.chat_id, actualId))
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

  const { actualId, type, partnerUserId } = await resolveActualChatId(chatId, userId);

  const [msg] = await db
    .insert(messagesTable)
    .values({
      chat_id:      actualId,
      sender_id:    userId,
      content,
      content_type: content_type as "text" | "image" | "voice",
    })
    .returning();

  const response = {
    ...msg,
    outgoing:      true,
    sender_name:   req.user!.name,
    sender_avatar: req.user!.avatar_url,
  };

  res.json(response);

  // Send push notifications asynchronously
  const notifContent = content_type === "image" ? "📷 Фото"
    : content_type === "voice" ? "🎤 Голосовое сообщение"
    : content.length > 80 ? content.slice(0, 80) + "…" : content;

  const payload = {
    title: req.user!.name,
    body: notifContent,
    icon: "/favicon.svg",
    data: { chatId: chatId },
  };

  if (type === "personal" && partnerUserId) {
    sendPushToUsers([partnerUserId], payload).catch(() => {});
  } else if (type === "main_group") {
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
    const others = allUsers.map(u => u.id).filter(id => id !== userId);
    sendPushToUsers(others, payload).catch(() => {});
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

  res.json({ ok: true });
});

export default router;
