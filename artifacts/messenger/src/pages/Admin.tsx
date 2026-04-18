import { useState } from "react";
import { useLocation } from "wouter";
import { generateCode, addExtraCode, getExtraCodes } from "@/auth";

export default function Admin() {
  const [, navigate] = useLocation();
  const [codes, setCodes] = useState<{ code: string; created: string; used: boolean }[]>(() => {
    const extra = getExtraCodes();
    return extra.map(c => ({ code: c, created: "Только что", used: false }));
  });
  const [copied, setCopied] = useState<string | null>(null);

  function handleGenerate() {
    const code = generateCode();
    addExtraCode(code);
    setCodes(prev => [{ code, created: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), used: false }, ...prev]);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const stats = [
    { label: "Всего участников", value: "128", icon: "group", color: "#46eedd" },
    { label: "Активны сегодня", value: "42", icon: "person_check", color: "#46eedd" },
    { label: "Кодов создано", value: String(codes.length + 5), icon: "key", color: "#bdc2ff" },
    { label: "Кодов использовано", value: "5", icon: "lock", color: "#bdc2ff" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(100px)" }} />

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
          {stats.map(s => (
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
              className="px-4 py-2.5 rounded-xl font-bold text-[13px] text-[#003732] flex items-center gap-1.5 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Создать
            </button>
          </div>

          {codes.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#bacac6]/20">key_off</span>
              <p className="text-[#bacac6]/40 text-[13px]">Нажмите «Создать» чтобы выдать первый код</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {codes.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: "#10131a" }}>
                  <span className="material-symbols-outlined text-[#46eedd] text-[18px]">key</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[14px] font-bold text-[#e1e2eb] tracking-widest">{c.code}</p>
                    <p className="text-[11px] text-[#bacac6]/40">{c.created}</p>
                  </div>
                  <button
                    onClick={() => copyCode(c.code)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copied === c.code ? "text-[#003732]" : "text-[#46eedd]"}`}
                    style={{ background: copied === c.code ? "#46eedd" : "rgba(70,238,221,0.1)" }}>
                    {copied === c.code ? "Скопировано" : "Копировать"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members quick view */}
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
            <p className="text-[12px] text-[#bacac6]/50">128 пользователей</p>
          </div>
          <span className="material-symbols-outlined text-[#bacac6]/30">chevron_right</span>
        </button>

        {/* Activity */}
        <div className="mt-4 rounded-[1.5rem] p-5" style={{ background: "#1d2026" }}>
          <h2 className="text-[16px] font-bold text-[#e1e2eb] mb-4">Активность сети</h2>
          <div className="space-y-3">
            {[
              { action: "Новый участник", detail: "Иван Карелин присоединился", time: "14:55", icon: "person_add", color: "#46eedd" },
              { action: "Код использован", detail: "SNC-TEAM-0001 активирован", time: "14:32", icon: "key", color: "#bdc2ff" },
              { action: "Сообщение удалено", detail: "В Общем чате", time: "13:10", icon: "delete", color: "#ffb4ab" },
              { action: "Новый код", detail: "SNC-MAKS-7777 создан", time: "12:00", icon: "add_circle", color: "#46eedd" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${a.color}15` }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: a.color }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#e1e2eb]">{a.action}</p>
                  <p className="text-[11px] text-[#bacac6]/50 truncate">{a.detail}</p>
                </div>
                <span className="text-[10px] text-[#bacac6]/30 font-medium shrink-0 mt-0.5">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5"
        style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-around items-center px-6 pt-3 pb-7 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Чаты</span>
          </button>
          {/* Админ — active */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Админ</span>
          </div>
          <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Профиль</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
