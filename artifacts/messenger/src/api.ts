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
    me: () => apiFetch<Me>("/auth/me"),
    validateCode: (code: string) =>
      apiFetch<{ valid: boolean; grants_admin: boolean; is_new: boolean }>("/auth/validate-code", {
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
        custom_groups: { id: string; name: string; last_msg: string | null; last_time: string | null }[];
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
    createGroup: (data: { name: string; member_ids: string[] }) =>
      apiFetch<{ id: string; name: string; type: string }>("/group-chats", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteGroup: (chatId: string) =>
      apiFetch(`/group-chats/${chatId}`, { method: "DELETE" }),
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

  training: {
    list: (month: string) =>
      apiFetch<{
        events: {
          id: string; date: string; title: string; description: string; icon: string;
          time_start: string; time_end: string; color: string; count: number;
        }[];
        my_registrations: string[];
      }>(`/training?month=${month}`),
    create: (data: { date: string; title: string; description: string; icon: string; time_start: string; time_end: string; color: string }) =>
      apiFetch("/training", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { date: string; title: string; description: string; icon: string; time_start: string; time_end: string; color: string }) =>
      apiFetch(`/training/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`/training/${id}`, { method: "DELETE" }),
    register: (id: string) =>
      apiFetch<{ registered: boolean }>(`/training/${id}/register`, { method: "POST" }),
    registrations: (id: string) =>
      apiFetch<{ user_id: string; name: string; avatar_url: string }[]>(`/training/${id}/registrations`),
  },

  push: {
    vapidKey: () => apiFetch<{ publicKey: string }>("/push/vapid-key"),
    subscribe: (sub: PushSubscriptionJSON) =>
      apiFetch("/push/subscribe", { method: "POST", body: JSON.stringify(sub) }),
    unsubscribe: (endpoint: string) =>
      apiFetch("/push/unsubscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) }),
  },
};
