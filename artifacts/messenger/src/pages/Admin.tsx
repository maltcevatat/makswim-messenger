import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import BottomNav from "@/components/BottomNav";

export default function Admin() {
  const [, navigate] = useLocation();
  const [codes, setCodes] = useState<{ id: string; code: string; grants_admin: boolean; is_used: boolean; created_at: string }[]>([]);
  const [stats, setStats] = useState({ total_users: 0, total_codes: 0, used_codes: 0, online_users: 0 });
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([api.admin.codes(), api.admin.stats()])
      .then(([c, s]) => { setCodes(c); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newCode = await api.admin.generateCode();
      setCodes(prev => [{ ...newCode, grants_admin: false, is_used: false, created_at: new Date().toISOString() }, ...prev]);
      showToast("Новый код создан");
    } catch { showToast("Ошибка генерации кода"); }
    finally { setGenerating(false); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const statCards = [
    { label: "Всего участников", value: String(stats.total_users), icon: "group", color: "#46eedd" },
    { label: "Активны сейчас", value: String(stats.online_users), icon: "person_check", color: "#46eedd" },
    { label: "Кодов создано", value: String(stats.total_codes), icon: "key", color: "#bdc2ff" },
    { label: "Кодов использовано", value: String(stats.used_codes), icon: "lock", color: "#bdc2ff" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(100px)" }} />

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
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] font-extrabold text-[#e1e2eb]">Панель управления</h1>
            <p className="text-[11px] text-[#46eedd] font-bold tracking-wider uppercase">Администратор</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(70,238,221,0.1)" }}>
            <span className="material-symbols-outlined text-[#46eedd]">shield</span>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-lg mx-auto">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
          {statCards.map(s => (
            <div key={s.label} className="p-4 rounded-[1.5rem] flex flex-col gap-2" style={{ background: "#1d2026" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15` }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-[1.8rem] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-[#bacac6]/50 font-semibold leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Generate codes */}
        <div className="rounded-[1.5rem] p-5 mb-5" style={{ background: "#1d2026" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#e1e2eb]">Коды приглашений</h2>
              <p className="text-[12px] text-[#bacac6]/50 mt-0.5">Одноразовые коды доступа</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2.5 rounded-xl font-bold text-[13px] text-[#003732] flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
              {generating
                ? <div className="w-4 h-4 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" />
                : <><span className="material-symbols-outlined text-[18px]">add</span>Создать</>}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#bacac6]/20">key_off</span>
              <p className="text-[#bacac6]/40 text-[13px]">Нажмите «Создать» чтобы выдать первый код</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {codes.map((c) => (
                <div key={c.id} className={`flex items-center gap-3 p-3.5 rounded-xl ${c.is_used ? "opacity-40" : ""}`}
                  style={{ background: "#10131a" }}>
                  <span className="material-symbols-outlined text-[#46eedd] text-[18px]">key</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[14px] font-bold text-[#e1e2eb] tracking-widest">{c.code}</p>
                    <p className="text-[11px] text-[#bacac6]/40">
                      {c.is_used ? "Использован" : c.grants_admin ? "Администратор" : "Пользователь"}
                    </p>
                  </div>
                  {!c.is_used && (
                    <button
                      onClick={() => copyCode(c.code)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copied === c.code ? "text-[#003732]" : "text-[#46eedd]"}`}
                      style={{ background: copied === c.code ? "#46eedd" : "rgba(70,238,221,0.1)" }}>
                      {copied === c.code ? "Скопировано" : "Копировать"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members link */}
        <button
          onClick={() => navigate("/members")}
          className="w-full p-5 rounded-[1.5rem] flex items-center gap-4 text-left hover:bg-[#272a31] transition-colors active:scale-[0.98]"
          style={{ background: "#1d2026" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(70,238,221,0.1)" }}>
            <span className="material-symbols-outlined text-[#46eedd]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[15px] text-[#e1e2eb]">Список участников</h3>
            <p className="text-[12px] text-[#bacac6]/50">{stats.total_users} пользователей</p>
          </div>
          <span className="material-symbols-outlined text-[#bacac6]/30">chevron_right</span>
        </button>
      </main>

      <BottomNav active="admin" />
    </div>
  );
}
