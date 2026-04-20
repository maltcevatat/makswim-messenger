import { db, inviteCodesTable, chatsTable, chatMembersTable } from "@workspace/db";
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

  // Cleanup: remove all members from the seeded group chat so it stays invisible.
  // The seeded group (00000000-...) was created as a technical placeholder and
  // should not appear in any user's chat list. Group chats are managed by admins via the UI.
  const seededGroup = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .where(eq(chatsTable.id, SEEDED_GROUP_ID))
    .limit(1);

  if (seededGroup.length > 0) {
    await db
      .delete(chatMembersTable)
      .where(eq(chatMembersTable.chat_id, SEEDED_GROUP_ID));
  }
}
