import { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    avatar_url: string;
    role: "admin" | "user";
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.makswim_session;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const now = new Date();
  const rows = await db
    .select({
      id:         usersTable.id,
      name:       usersTable.name,
      avatar_url: usersTable.avatar_url,
      role:       usersTable.role,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.user_id, usersTable.id))
    .where(
      and(
        eq(sessionsTable.token, token),
        gt(sessionsTable.expires_at, now)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }
  req.user = rows[0];
  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
