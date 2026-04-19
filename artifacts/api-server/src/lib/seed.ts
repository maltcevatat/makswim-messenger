import { db, inviteCodesTable, chatsTable } from "@workspace/db";
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
      id: "00000000-0000-0000-0000-000000000001",
      type: "group",
      name: "Общий чат",
    });
  }
}
