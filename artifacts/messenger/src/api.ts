const BASE = "/api";

async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface Me {
  id: string;
  name: string;
  avatar_url: string;
  role: "admin" | "user";
}

export const api = {
  auth: {
    me: ()                 => apiFetch<Me>("/auth/me"),
    validateCode: (code: string) =>
      apiFetch<{ valid: boolean; grants_admin: boolean }>("/auth/validate-code", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    setupProfile: (data: { code: string; name: string; avatar_url: string }) =>
      apiFetch<Me>("/auth/setup-profile", { method: "POST", body: JSON.stringify(data) }),
    updateProfile: (data: { name: string; avatar_url: string }) =>
      apiFetch<Me>("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
    logout: () => apiFetch("/auth/logout", { method: "POST" }),
  },

  chats: {
    list: () =>
      apiFetch<{
        group: { id: string; name: string; last_msg: string | null; last_time: string | null };
        personal: { id: string; name: string; avatar_url: string; last_msg: string | null; last_time: string | null }[];
      }>("/chats"),
    messages: (chatId: string) =>
      apiFetch<{
        id: string; content: string; content_type: string; is_deleted: boolean;
        created_at: string; sender_id: string; sender_name: string;
        sender_avatar: string; outgoing: boolean;
      }[]>(`/chats/${chatId}/messages`),
    sendMessage: (chatId: string, content: string, content_type = "text") =>
      apiFetch(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, content_type }),
      }),
    deleteMessage: (msgId: string) =>
      apiFetch(`/messages/${msgId}`, { method: "DELETE" }),
  },

  members: {
    list: () =>
      apiFetch<{ id: string; name: string; avatar_url: string; role: string; created_at: string }[]>(
        "/members"
      ),
  },

  admin: {
    codes: () =>
      apiFetch<{ id: string; code: string; grants_admin: boolean; is_used: boolean; created_at: string }[]>(
        "/admin/codes"
      ),
    generateCode: () =>
      apiFetch<{ id: string; code: string }>("/admin/codes", { method: "POST" }),
    stats: () =>
      apiFetch<{ total_users: number; total_codes: number; used_codes: number; online_users: number }>(
        "/admin/stats"
      ),
    members: () =>
      apiFetch<{ id: string; name: string; avatar_url: string; role: string }[]>("/admin/members"),
    removeMember: (id: string) => apiFetch(`/admin/members/${id}`, { method: "DELETE" }),
    setRole: (id: string, role: "admin" | "user") =>
      apiFetch(`/admin/members/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  },
};
