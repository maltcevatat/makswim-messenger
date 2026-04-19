import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";

const GROUP_CHAT_ID = "00000000-0000-0000-0000-000000000001";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Вчера";
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

export default function ChatsList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [chatsData, setChatsData] = useState<{
    group: { id: string; name: string; last_msg: string | null; last_time: string | null } | null;
    personal: { id: string; name: string; avatar_url: string; last_msg: string | null; last_time: string | null }[];
  }>({ group: null, personal: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.chats.list().then(setChatsData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = chatsData.personal.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(100px)" }} />

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
            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-[#bacac6] hover:text-[#46eedd] transition-colors">
              <span className="material-symbols-outlined">person_add</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-[#bacac6] hover:text-[#46eedd] transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
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

        {/* Group Chat */}
        {!search && chatsData.group && (
          <button
            onClick={() => navigate(`/chat/${GROUP_CHAT_ID}`)}
            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] mb-6 text-left transition-all active:scale-[0.98]"
            style={{ background: "#1d2026", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
            <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              <span className="material-symbols-outlined text-[#003732] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-[16px] text-[#e1e2eb]">Общий чат</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-1"
                  style={{ background: "rgba(70,238,221,0.12)", color: "#46eedd" }}>
                  <span className="w-1.5 h-1.5 bg-[#46eedd] rounded-full animate-pulse inline-block" />
                  В ЭФИРЕ
                </span>
              </div>
              <p className="text-[13px] text-[#bacac6]/70 truncate">
                {chatsData.group.last_msg || "Начните общение"}
              </p>
            </div>
            {chatsData.group.last_time && (
              <span className="text-[11px] text-[#bacac6]/50 shrink-0">{formatTime(chatsData.group.last_time)}</span>
            )}
          </button>
        )}

        {/* Personal Messages */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#bacac6]/50">
            Личные сообщения
          </h2>
        </div>

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
