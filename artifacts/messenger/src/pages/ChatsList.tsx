import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Вчера";
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

interface ChatsData {
  custom_groups: { id: string; name: string; last_msg: string | null; last_time: string | null }[];
  personal: { id: string; name: string; avatar_url: string; last_msg: string | null; last_time: string | null }[];
}

export default function ChatsList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [chatsData, setChatsData] = useState<ChatsData>({ custom_groups: [], personal: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [allMembers, setAllMembers] = useState<{ id: string; name: string; avatar_url: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const loadChats = () =>
    api.chats.list()
      .then(d => setChatsData(d))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    loadChats();
    const iv = setInterval(loadChats, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (showCreateGroup && allMembers.length === 0) {
      api.members.list().then(m => setAllMembers(m.filter(u => u.id !== user?.id))).catch(() => {});
    }
  }, [showCreateGroup]);

  async function createGroup() {
    if (!groupName.trim()) return;
    if (selectedIds.size === 0) return;
    setCreating(true);
    try {
      const chat = await api.chats.createGroup({ name: groupName.trim(), member_ids: [...selectedIds] });
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedIds(new Set());
      navigate(`/group-chat/${chat.id}`);
    } catch {}
    finally { setCreating(false); }
  }

  async function deleteGroup(chatId: string) {
    setDeletingId(chatId);
    try {
      await api.chats.deleteGroup(chatId);
      setChatsData(prev => ({
        ...prev,
        custom_groups: prev.custom_groups.filter(g => g.id !== chatId),
      }));
    } catch {}
    finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  function toggleMember(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = chatsData.personal.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(100px)" }} />

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-[2rem] p-6 flex flex-col gap-4"
            style={{ background: "#1d2026" }}>
            <h3 className="font-bold text-[17px] text-center">Удалить чат?</h3>
            <p className="text-[14px] text-[#bacac6]/70 text-center">
              «{confirmDelete.name}» и все сообщения в нём будут удалены.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] text-[#e1e2eb]"
                style={{ background: "#272a31" }}>
                Отмена
              </button>
              <button
                onClick={() => deleteGroup(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-50"
                style={{ background: "rgba(255,80,80,0.85)" }}>
                {deletingId === confirmDelete.id ? "..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowCreateGroup(false)}>
          <div className="w-full max-w-lg rounded-[2rem] p-6 flex flex-col gap-4"
            style={{ background: "#1d2026" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[18px]">Новая группа</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-[#bacac6]/50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <input
              className="bg-[#10131a] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[15px] outline-none"
              style={{ caretColor: "#46eedd" }}
              placeholder="Название группы"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />

            <div>
              <p className="text-[11px] font-bold text-[#bacac6]/50 uppercase tracking-wider mb-3">
                Участники ({selectedIds.size} выбрано)
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {allMembers.map(m => {
                  const sel = selectedIds.has(m.id);
                  return (
                    <button key={m.id}
                      onClick={() => toggleMember(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${sel ? "" : "hover:bg-[#10131a]"}`}
                      style={sel ? { background: "rgba(70,238,221,0.12)" } : {}}>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#272a31] shrink-0">
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <span className="font-bold text-[#bacac6]/50">{m.name.charAt(0)}</span>
                            </div>}
                      </div>
                      <span className="flex-1 text-left text-[14px] font-medium">{m.name}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${sel ? "border-[#46eedd] bg-[#46eedd]" : "border-[#bacac6]/30"}`}>
                        {sel && <span className="material-symbols-outlined text-[12px] text-[#003732]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={createGroup} disabled={creating || !groupName.trim() || selectedIds.size === 0}
              className="w-full py-4 rounded-2xl font-bold text-[16px] text-[#003732] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              {creating ? "Создаю..." : "Создать группу"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-5 py-3.5 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20 shrink-0">
              {user?.avatar_url ? (
                <img alt="me" src={user.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[#bacac6] flex items-center justify-center w-full h-full text-[22px]">person</span>
              )}
            </button>
            <h1 className="text-[1.3rem] font-extrabold tracking-tighter text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              MAKSWIM
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button onClick={() => setShowCreateGroup(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors"
                title="Создать группу">
                <span className="material-symbols-outlined">group_add</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-lg mx-auto">
        {/* Search */}
        <div className="my-4 flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background: "#1d2026" }}>
          <span className="material-symbols-outlined text-[#bacac6]/50 text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск диалогов..."
            className="flex-1 bg-transparent text-[#e1e2eb] text-[15px] outline-none placeholder:text-[#bacac6]/40"
          />
        </div>

        {/* Custom Group Chats */}
        {!search && chatsData.custom_groups.length > 0 && (
          <>
            <h2 className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#bacac6]/50 mb-3 mt-2">
              Групповые чаты
            </h2>
            <div className="flex flex-col gap-1 mb-4">
              {chatsData.custom_groups.map(g => (
                <div key={g.id} className="relative group/item">
                  <button
                    onClick={() => navigate(`/group-chat/${g.id}`)}
                    className="flex items-center gap-4 p-3 -mx-2 w-full text-left rounded-3xl hover:bg-[#1d2026] transition-all active:bg-[#272a31]/50">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(70,238,221,0.1)" }}>
                      <span className="material-symbols-outlined text-[#46eedd] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-bold text-[#e1e2eb] truncate text-[15px]">{g.name}</h4>
                        <span className="text-[11px] text-[#bacac6]/50 ml-2 shrink-0">{formatTime(g.last_time)}</span>
                      </div>
                      <p className="text-[13px] text-[#bacac6]/70 truncate">{g.last_msg || "Нет сообщений"}</p>
                    </div>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmDelete({ id: g.id, name: g.name })}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-[#bacac6]/30 hover:text-red-400 hover:bg-[#272a31] transition-all opacity-0 group-hover/item:opacity-100"
                      title="Удалить чат">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Personal Messages */}
        <h2 className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#bacac6]/50 mb-3">
          Личные сообщения
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <span className="material-symbols-outlined text-[40px] text-[#bacac6]/20">chat</span>
            <p className="text-[#bacac6]/40 text-[14px]">
              {search ? "Ничего не найдено" : "Другие участники появятся здесь"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map(chat => (
              <button
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="flex items-center gap-4 p-3 -mx-2 w-full text-left rounded-3xl hover:bg-[#1d2026] transition-all cursor-pointer active:bg-[#272a31]/50">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md bg-[#272a31] flex items-center justify-center">
                    {chat.avatar_url ? (
                      <img alt={chat.name} className="w-full h-full object-cover" src={chat.avatar_url} />
                    ) : (
                      <span className="text-[22px] font-black text-[#bacac6]/50">
                        {chat.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold text-[#e1e2eb] truncate text-[15px]">{chat.name}</h4>
                    <span className="text-[11px] text-[#bacac6]/50 font-medium ml-2 shrink-0">
                      {formatTime(chat.last_time)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#bacac6]/70 truncate">
                    {chat.last_msg || "Нет сообщений"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="chats" />
    </div>
  );
}
