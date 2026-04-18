import { useState } from "react";
import { useLocation } from "wouter";
import { getProfile, logout } from "@/auth";

export default function Settings() {
  const [, navigate] = useLocation();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [previewOn, setPreviewOn] = useState(true);
  const [darkMode] = useState(true);
  const [toast, setToast] = useState("");
  const profile = getProfile();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#10131a", color: "#e1e2eb" }}>
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
          <button onClick={() => navigate(-1 as any)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="flex-1 text-[18px] font-extrabold text-[#e1e2eb]">Настройки</h1>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-lg mx-auto">
        {/* Profile mini */}
        <button onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] mt-4 mb-6 text-left hover:bg-[#272a31] transition-all active:scale-[0.98]"
          style={{ background: "#1d2026" }}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 ring-2 ring-[#46eedd]/20">
            {profile?.avatar
              ? <img alt="me" src={profile.avatar} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-[#272a31] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#bacac6] text-[28px]">person</span>
                </div>}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-[#e1e2eb]">{profile?.name || "Мой профиль"}</h2>
            <p className="text-[12px] text-[#46eedd]">Редактировать профиль</p>
          </div>
          <span className="material-symbols-outlined text-[#bacac6]/30">chevron_right</span>
        </button>

        {/* Sections */}
        <div className="flex flex-col gap-4">
          {/* Notifications */}
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: "#1d2026" }}>
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#46eedd]">Уведомления</p>
            </div>
            {[
              { label: "Push-уведомления", sub: "Оповещения на устройстве", val: notificationsOn, set: setNotificationsOn },
              { label: "Звук", sub: "Звуки сообщений и звонков", val: soundOn, set: setSoundOn },
              { label: "Предпросмотр", sub: "Текст в уведомлениях", val: previewOn, set: setPreviewOn },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-none">
                <div>
                  <p className="text-[14px] font-semibold text-[#e1e2eb]">{item.label}</p>
                  <p className="text-[11px] text-[#bacac6]/50">{item.sub}</p>
                </div>
                <button
                  onClick={() => item.set(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${item.val ? "bg-[#00d1c1]" : "bg-[#32353c]"}`}>
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${item.val ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Appearance */}
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: "#1d2026" }}>
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#46eedd]">Оформление</p>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <p className="text-[14px] font-semibold text-[#e1e2eb]">Тёмная тема</p>
                <p className="text-[11px] text-[#bacac6]/50">Caspian Cipher</p>
              </div>
              <div className="relative w-11 h-6 rounded-full bg-[#00d1c1]">
                <div className="absolute top-[2px] translate-x-[22px] w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
            <button onClick={() => showToast("Акцентный цвет — #46eedd (Teal)")}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#272a31] transition-colors active:scale-[0.98]">
              <div>
                <p className="text-[14px] font-semibold text-[#e1e2eb]">Акцентный цвет</p>
                <p className="text-[11px] text-[#bacac6]/50">Бирюзовый (TEAM ALPHA)</p>
              </div>
              <div className="w-6 h-6 rounded-full" style={{ background: "#46eedd", boxShadow: "0 2px 8px rgba(70,238,221,0.4)" }} />
            </button>
          </div>

          {/* Privacy */}
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: "#1d2026" }}>
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#46eedd]">Конфиденциальность</p>
            </div>
            {[
              { label: "Сквозное шифрование", icon: "lock", sub: "Все сообщения зашифрованы" },
              { label: "Двухфакторная защита", icon: "security", sub: "Дополнительный уровень безопасности" },
              { label: "Журнал сессий", icon: "devices", sub: "Управление активными сессиями" },
            ].map(item => (
              <button key={item.label}
                onClick={() => showToast(`${item.label} — активно`)}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-none hover:bg-[#272a31] transition-colors text-left active:scale-[0.98]">
                <span className="material-symbols-outlined text-[#46eedd] text-[20px]">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#e1e2eb]">{item.label}</p>
                  <p className="text-[11px] text-[#bacac6]/50">{item.sub}</p>
                </div>
                <span className="material-symbols-outlined text-[#bacac6]/30">chevron_right</span>
              </button>
            ))}
          </div>

          {/* About */}
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: "#1d2026" }}>
            <button onClick={() => showToast("MAKSWIM Triathlon Team v1.0")}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#272a31] transition-colors active:scale-[0.98]">
              <p className="text-[14px] font-semibold text-[#e1e2eb]">О приложении</p>
              <span className="text-[12px] text-[#bacac6]/40">v1.0</span>
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full py-4 rounded-[1.5rem] border font-bold flex items-center justify-center gap-2 hover:bg-[#ffb4ab]/10 transition-all active:scale-[0.98]"
            style={{ background: "rgba(147,0,10,0.08)", borderColor: "rgba(255,180,171,0.15)", color: "#ffb4ab" }}>
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Выйти из аккаунта
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5"
        style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-around items-center px-4 pt-3 pb-7 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Чаты</span>
          </button>
          <button onClick={() => navigate("/calls")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[22px]">call</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Звонки</span>
          </button>
          <button onClick={() => navigate("/calendar")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[22px]">calendar_today</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Календарь</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Настройки</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
