import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";

interface Member {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  created_at: string;
}

export default function Members() {
  const [, navigate] = useLocation();
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.members.list().then(setMembers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  async function handleAction(action: string, memberId: string) {
    setMenuOpen(null);
    if (action === "message") {
      navigate(`/chat/${memberId}`);
    } else if (action === "call") {
      navigate("/calls");
    } else if (action === "remove" && me?.role === "admin") {
      try {
        await api.admin.removeMember(memberId);
        setMembers(prev => prev.filter(m => m.id !== memberId));
        showToast("Участник удалён");
      } catch (e: any) { showToast(e.message || "Ошибка"); }
    } else if (action === "makeAdmin" && me?.role === "admin") {
      try {
        await api.admin.setRole(memberId, "admin");
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: "admin" } : m));
        showToast("Права администратора выданы");
      } catch (e: any) { showToast(e.message || "Ошибка"); }
    }
  }

  const onlineCount = Math.min(members.length, Math.floor(members.length * 0.7));

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}
      onClick={() => setMenuOpen(null)}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.03)", filter: "blur(100px)" }} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl font-bold text-[13px] text-[#003732] shadow-xl"
          style={{ background: "#46eedd" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex items-center px-5 py-3.5 max-w-lg mx-auto gap-3">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="flex-1 text-[18px] font-extrabold text-[#e1e2eb]">Участники группы</h1>
          <button
            onClick={() => showToast("Пригласительная ссылка скопирована")}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#46eedd] hover:bg-[#1d2026] transition-colors active:scale-90">
            <span className="material-symbols-outlined">person_add</span>
          </button>
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
            placeholder="Поиск участников..."
            className="flex-1 bg-transparent text-[#e1e2eb] text-[15px] outline-none placeholder:text-[#bacac6]/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[#bacac6]/50 hover:text-[#bacac6]">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-[1.5rem] border-l-2 border-[#46eedd]" style={{ background: "#1d2026" }}>
            <p className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#bacac6]/50 mb-1">Всего участников</p>
            <p className="text-[2rem] font-black text-[#e1e2eb] leading-none">{members.length}</p>
          </div>
          <div className="p-4 rounded-[1.5rem] border-l-2 border-[#46eedd]" style={{ background: "#1d2026" }}>
            <p className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#bacac6]/50 mb-1">Сейчас в сети</p>
            <p className="text-[2rem] font-black text-[#46eedd] leading-none">{onlineCount}</p>
          </div>
        </div>

        {/* Member list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(m => (
              <div key={m.id} className="relative">
                <div className="flex items-center gap-4 p-4 rounded-[1.4rem] transition-colors hover:bg-[#272a31]"
                  style={{ background: "#191c22" }}>
                  <button onClick={() => m.id !== me?.id && navigate(`/chat/${m.id}`)} className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#272a31] flex items-center justify-center">
                      {m.avatar_url ? (
                        <img alt={m.name} src={m.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[18px] font-black text-[#bacac6]/50">
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                  <button onClick={() => m.id !== me?.id && navigate(`/chat/${m.id}`)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-[15px] text-[#e1e2eb] truncate">{m.name}</h4>
                      {m.role === "admin" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shrink-0"
                          style={{ background: "rgba(70,238,221,0.12)", color: "#46eedd", border: "1px solid rgba(70,238,221,0.2)" }}>
                          Админ
                        </span>
                      )}
                      {m.id === me?.id && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shrink-0"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#bacac6" }}>
                          Вы
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#bacac6]/50">
                      Участник с {new Date(m.created_at).toLocaleDateString("ru", { day: "numeric", month: "long" })}
                    </p>
                  </button>
                  {m.id !== me?.id && (
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === m.id ? null : m.id); }}
                      className="w-8 h-8 flex items-center justify-center text-[#bacac6]/30 hover:text-[#bacac6] transition-colors active:scale-90 rounded-xl hover:bg-[#32353c]">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  )}
                </div>

                {/* Context menu */}
                {menuOpen === m.id && (
                  <div className="absolute right-2 top-14 z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[180px]"
                    style={{ background: "#272a31", border: "1px solid rgba(255,255,255,0.08)" }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleAction("message", m.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#e1e2eb] hover:bg-[#32353c] transition-colors text-left">
                      <span className="material-symbols-outlined text-[18px] text-[#46eedd]">chat_bubble</span>
                      Написать
                    </button>
                    {me?.role === "admin" && m.role !== "admin" && (
                      <button onClick={() => handleAction("makeAdmin", m.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#e1e2eb] hover:bg-[#32353c] transition-colors text-left">
                        <span className="material-symbols-outlined text-[18px] text-[#bdc2ff]">shield</span>
                        Сделать админом
                      </button>
                    )}
                    {me?.role === "admin" && (
                      <button onClick={() => handleAction("remove", m.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors text-left">
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        Удалить
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="members" />
    </div>
  );
}
