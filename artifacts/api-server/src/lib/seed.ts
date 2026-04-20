import { db, inviteCodesTable, chatsTable, chatMembersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_CODES = [
  { code: "SNC-ALPHA-2024", grants_admin: true },
  { code: "SNC-ADMIN-0001", grants_admin: true },
];

const USER_CODES = [
  "SNC-TEAM-0001",
  "SNC-SWIM-8888",
  "SNC-MAKS-7777",
  "SNC-TEST-1234",
  "SNC-USER-AAAA",
];

const SEEDED_GROUP_ID = "00000000-0000-0000-0000-000000000001";

export async function seedDatabase() {
  // Seed admin invite codes (idempotent)
  for (const { code, grants_admin } of ADMIN_CODES) {
    const existing = await db
      .select({ id: inviteCodesTable.id })
      .from(inviteCodesTable)
      .where(eq(inviteCodesTable.code, code));
    if (existing.length === 0) {
      await db.insert(inviteCodesTable).values({ code, grants_admin });
    }
  }

  // Seed regular user codes
  for (const code of USER_CODES) {
    const existing = await db
      .select({ id: inviteCodesTable.id })
      .from(inviteCodesTable)
      .where(eq(inviteCodesTable.code, code));
    if (existing.length === 0) {
      await db.insert(inviteCodesTable).values({ code, grants_admin: false });
    }
  }

  // Seed global group chat
  const existingChats = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .limit(1);

  if (existingChats.length === 0) {
    await db.insert(chatsTable).values({
      id: SEEDED_GROUP_ID,
      type: "group",
      name: "Общий чат",
    });

    // Add all existing users as members
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
    if (allUsers.length > 0) {
      await db.insert(chatMembersTable).values(
        allUsers.map(u => ({ chat_id: SEEDED_GROUP_ID, user_id: u.id }))
      );
    }
  } else {
    // Group chat exists — ensure all current users are members
    // This handles newly registered users who might not be in any group
    const seededGroup = await db
      .select({ id: chatsTable.id })
      .from(chatsTable)
      .where(eq(chatsTable.id, SEEDED_GROUP_ID))
      .limit(1);

    if (seededGroup.length > 0) {
      const existingMembers = await db
        .select({ user_id: chatMembersTable.user_id })
        .from(chatMembersTable)
        .where(eq(chatMembersTable.chat_id, SEEDED_GROUP_ID));

      const memberSet = new Set(existingMembers.map(m => m.user_id.toString()));
      const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
      const missing = allUsers.filter(u => !memberSet.has(u.id.toString()));

      if (missing.length > 0) {
        await db.insert(chatMembersTable).values(
          missing.map(u => ({ chat_id: SEEDED_GROUP_ID, user_id: u.id }))
        );
      }
    }
  }
}
