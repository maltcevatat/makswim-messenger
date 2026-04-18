export interface UserProfile {
  name: string;
  avatar: string;
  inviteCode: string;
}

const VALID_CODES: Record<string, boolean> = {
  "SNC-ALPHA-2024": true,
  "SNC-TEAM-0001": true,
  "SNC-SWIM-8888": true,
  "SNC-MAKS-7777": true,
  "SNC-TEST-1234": true,
};

const EXTRA_CODES_KEY = "makswim_extra_codes";
const USED_CODES_KEY = "makswim_used_codes";
const PROFILE_KEY = "makswim_profile";
const AUTH_KEY = "makswim_authed";

export function getExtraCodes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_CODES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addExtraCode(code: string) {
  const codes = getExtraCodes();
  if (!codes.includes(code)) codes.push(code);
  localStorage.setItem(EXTRA_CODES_KEY, JSON.stringify(codes));
}

export function getUsedCodes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(USED_CODES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function validateCode(code: string): boolean {
  const used = getUsedCodes();
  const upper = code.toUpperCase().trim();
  if (used.includes(upper)) return false;
  if (VALID_CODES[upper]) return true;
  const extra = getExtraCodes();
  return extra.includes(upper);
}

export function markCodeUsed(code: string) {
  const used = getUsedCodes();
  const upper = code.toUpperCase().trim();
  if (!used.includes(upper)) {
    used.push(upper);
    localStorage.setItem(USED_CODES_KEY, JSON.stringify(used));
  }
}

export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(AUTH_KEY, "1");
}

export function isAuthed(): boolean {
  return localStorage.getItem(AUTH_KEY) === "1" && getProfile() !== null;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SNC-${part(4)}-${part(4)}`;
}
