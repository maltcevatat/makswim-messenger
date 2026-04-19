import {
  pgTable, text, boolean, timestamp, uuid, pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ── Enums ──────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const chatTypeEnum = pgEnum("chat_type", ["group", "personal"]);
export const msgTypeEnum  = pgEnum("msg_type",  ["text", "image", "voice"]);

// ── invite_codes ──────────────────────────────────────────────────────────
export const inviteCodesTable = pgTable("invite_codes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  code:         text("code").notNull().unique(),
  grants_admin: boolean("grants_admin").notNull().default(false),
  is_used:      boolean("is_used").notNull().default(false),
  used_by:      uuid("used_by"),
  used_at:      timestamp("used_at"),
  created_by:   uuid("created_by"),
  created_at:   timestamp("created_at").notNull().defaultNow(),
});

// ── users ─────────────────────────────────────────────────────────────────
export const usersTable = pgTable("users", {
  id:             uuid("id").primaryKey().defaultRandom(),
  name:           text("name").notNull(),
  avatar_url:     text("avatar_url").notNull().default(""),
  role:           userRoleEnum("role").notNull().default("user"),
  invite_code_id: uuid("invite_code_id"),
  created_at:     timestamp("created_at").notNull().defaultNow(),
});

// ── sessions ──────────────────────────────────────────────────────────────
export const sessionsTable = pgTable("sessions", {
  id:         uuid("id").primaryKey().defaultRandom(),
  user_id:    uuid("user_id").notNull(),
  token:      text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ── chats ─────────────────────────────────────────────────────────────────
export const chatsTable = pgTable("chats", {
  id:         uuid("id").primaryKey().defaultRandom(),
  type:       chatTypeEnum("type").notNull().default("group"),
  name:       text("name"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ── chat_members ──────────────────────────────────────────────────────────
export const chatMembersTable = pgTable("chat_members", {
  id:        uuid("id").primaryKey().defaultRandom(),
  chat_id:   uuid("chat_id").notNull(),
  user_id:   uuid("user_id").notNull(),
  joined_at: timestamp("joined_at").notNull().defaultNow(),
});

// ── messages ──────────────────────────────────────────────────────────────
export const messagesTable = pgTable("messages", {
  id:           uuid("id").primaryKey().defaultRandom(),
  chat_id:      text("chat_id").notNull(),
  sender_id:    uuid("sender_id").notNull(),
  content:      text("content").notNull(),
  content_type: msgTypeEnum("content_type").notNull().default("text"),
  is_deleted:   boolean("is_deleted").notNull().default(false),
  edited_at:    timestamp("edited_at"),
  created_at:   timestamp("created_at").notNull().defaultNow(),
});

// ── training_events ───────────────────────────────────────────────────────
export const trainingEventsTable = pgTable("training_events", {
  id:          uuid("id").primaryKey().defaultRandom(),
  date:        text("date").notNull(),        // YYYY-MM-DD
  title:       text("title").notNull(),
  icon:        text("icon").notNull().default("fitness_center"),
  time_start:  text("time_start").notNull(),  // HH:MM
  time_end:    text("time_end").notNull(),    // HH:MM
  color:       text("color").notNull().default("primary"),
  created_by:  uuid("created_by").notNull(),
  created_at:  timestamp("created_at").notNull().defaultNow(),
});

// ── training_registrations ────────────────────────────────────────────────
export const trainingRegistrationsTable = pgTable("training_registrations", {
  id:         uuid("id").primaryKey().defaultRandom(),
  event_id:   uuid("event_id").notNull(),
  user_id:    uuid("user_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ── insert schemas ────────────────────────────────────────────────────────
export const insertUserSchema        = createInsertSchema(usersTable).omit({ id: true, created_at: true });
export const insertInviteCodeSchema  = createInsertSchema(inviteCodesTable).omit({ id: true, created_at: true });
export const insertMessageSchema     = createInsertSchema(messagesTable).omit({ id: true, created_at: true });

// ── types ─────────────────────────────────────────────────────────────────
export type User                   = typeof usersTable.$inferSelect;
export type InviteCode             = typeof inviteCodesTable.$inferSelect;
export type Session                = typeof sessionsTable.$inferSelect;
export type Chat                   = typeof chatsTable.$inferSelect;
export type Message                = typeof messagesTable.$inferSelect;
export type ChatMember             = typeof chatMembersTable.$inferSelect;
export type TrainingEvent          = typeof trainingEventsTable.$inferSelect;
export type TrainingRegistration   = typeof trainingRegistrationsTable.$inferSelect;
