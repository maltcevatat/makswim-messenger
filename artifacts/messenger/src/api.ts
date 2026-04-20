const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

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
    throw new ApiError(body.error || `HTTP ${res.status}`, res.status);
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
    userAvatar: (userId: string) =>
      apiFetch<{ avatar_url: string | null }>(`/users/${userId}/avatar`),
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
    messages: (chatId: string, params?: { limit?: number; before?: string }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.before) qs.set("before", params.before);
      const query = qs.toString() ? `?${qs}` : "";
      return apiFetch<{
        id: string; content: string; content_type: string; is_deleted: boolean;
        created_at: string; sender_id: string; sender_name: string;
        outgoing: boolean; client_message_id?: string;
      }[]>(`/chats/${chatId}/messages${query}`);
    },
    sendMessage: (chatId: string, content: string, content_type = "text", client_message_id?: string) =>
      apiFetch<{
        id: string; content: string; content_type: string; is_deleted: boolean;
        created_at: string; sender_id: string; sender_name: string;
        outgoing: boolean; client_message_id?: string;
      }>(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, content_type, client_message_id }),
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
    groupMembers: (chatId: string) =>
      apiFetch<{ id: string; name: string; avatar_url: string; role: string }[]>(
        `/group-chats/${chatId}/members`
      ),
    addGroupMembers: (chatId: string, user_ids: string[]) =>
      apiFetch<{ added: number }>(`/group-chats/${chatId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_ids }),
      }),
    removeGroupMember: (chatId: string, userId: string) =>
      apiFetch(`/group-chats/${chatId}/members/${userId}`, { method: "DELETE" }),
  },

  members: {
    list: () =>
      apiFetch<{ id: string; name: string; avatar_url: string; role: string; created_at: string }[]>(
        "/members"
      ),
  },

  admin: {
    codes: () =>
      apiFetch<{
        id: string; code: string; grants_admin: boolean; is_used: boolean;
        is_revoked: boolean; expires_at: string | null; created_at: string;
      }[]>("/admin/codes"),
    generateCode: (opts?: { grants_admin?: boolean; expires_days?: number }) =>
      apiFetch<{ id: string; code: string; grants_admin: boolean; is_used: boolean; is_revoked: boolean; expires_at: string | null; created_at: string }>(
        "/admin/codes",
        { method: "POST", body: JSON.stringify(opts || {}) }
      ),
    revokeCode: (id: string) =>
      apiFetch(`/admin/codes/${id}`, { method: "DELETE" }),
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
          time_start: string; time_end: string; color: string; category: string; count: number;
        }[];
        my_registrations: string[];
      }>(`/training?month=${month}`),
    create: (data: { date: string; title: string; description: string; icon: string; time_start: string; time_end: string; color: string; category: string }) =>
      apiFetch("/training", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { date: string; title: string; description: string; icon: string; time_start: string; time_end: string; color: string; category: string }) =>
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
