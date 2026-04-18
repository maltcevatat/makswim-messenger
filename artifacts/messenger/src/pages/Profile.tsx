import { useState } from "react";
import { useLocation } from "wouter";
import { getProfile, logout } from "@/auth";

export default function Profile() {
  const [, navigate] = useLocation();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const profile = getProfile();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-5 py-3.5 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20">
              {profile?.avatar ? (
                <img alt="me" src={profile.avatar} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#bacac6] text-[22px]">person</span>
                </div>
              )}
            </div>
            <h1 className="text-[1.3rem] font-extrabold tracking-tighter text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              MAKSWIM
            </h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#191c22] text-[#46eedd] hover:bg-[#272a31] transition-all active:scale-95">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-5 pt-24 pb-36">
        {/* Profile Hero */}
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-2xl"
              style={{ boxShadow: "0 0 0 4px rgba(70,238,221,0.12)" }}>
              {profile?.avatar ? (
                <img alt="avatar" className="w-full h-full object-cover" src={profile.avatar} />
              ) : (
                <img
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1w2dRctOyJv-MjEIDAiefLVahpBwOqdag3i6WbRgG0FUB20F6LhO7G4_NBMAC-kEjy5MCNQ0o172VYrAfDtSvqkIkfAHoitcUisBUit1ZMB6kbnQ7FeuHOemCOBV8VspuM3PYdbFlS6wQ8FFLibc0SxdH99jvnDxj2pw3js_WwBUkmWbBzX4nYIePv1_QusKuxu2Kr37aDRUkyhg_qnZd7pWBATv10a0nOzDOY1dmniZyeaho4czwFLmEUbrc6VkZmczeZ09GVH9x"
                />
              )}
            </div>
            <button className="absolute bottom-1 -right-1 w-9 h-9 bg-[#46eedd] text-[#003732] flex items-center justify-center rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <div className="space-y-2">
            <h2 className="text-[1.8rem] font-extrabold tracking-tight text-[#e1e2eb]">
              {profile?.name || "Александр Альфа"}
            </h2>
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#46eedd]/20"
                style={{ background: "rgba(70,238,221,0.1)", color: "#46eedd" }}>
                Премиум
              </span>
              <span className="px-3 py-1 bg-[#272a31] text-[#bacac6] text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5">
                Online
              </span>
            </div>
          </div>
        </section>

        {/* Settings */}
        <div className="flex flex-col gap-3">
          {/* Notifications */}
          <div className="p-5 rounded-[1.5rem] flex items-center justify-between hover:bg-[#1d2026] transition-colors"
            style={{ background: "#191c22" }}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(70,238,221,0.1)" }}>
                <span className="material-symbols-outlined text-[#46eedd]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#e1e2eb] leading-tight">Уведомления</h3>
                <p className="text-xs text-[#bacac6]/60">Push, звук и предпросмотр</p>
              </div>
            </div>
            <button
              onClick={() => setNotificationsOn(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${notificationsOn ? "bg-[#00d1c1]" : "bg-[#32353c]"}`}
            >
              <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${notificationsOn ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
            </button>
          </div>

          {/* Privacy */}
          <button className="p-5 rounded-[1.5rem] flex items-center justify-between hover:bg-[#1d2026] transition-colors text-left w-full"
            style={{ background: "#191c22" }}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(88,232,255,0.1)" }}>
                <span className="material-symbols-outlined text-[#58e8ff]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#e1e2eb] leading-tight">Приватность</h3>
                <p className="text-xs text-[#bacac6]/60">Шифрование, 2FA защита</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#bacac6]/30">chevron_right</span>
          </button>

          {/* Public profile */}
          <div className="p-5 rounded-[1.5rem] flex flex-col gap-4" style={{ background: "#191c22" }}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(52,61,150,0.25)" }}>
                <span className="material-symbols-outlined text-[#bdc2ff]">visibility</span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#e1e2eb] leading-tight">Публичный профиль</h3>
                <p className="text-xs text-[#bacac6]/60">Настройка видимости данных</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(11,14,20,0.5)" }}>
                <span className="text-sm font-medium text-[#e1e2eb]">Статус в сети</span>
                <button
                  onClick={() => setOnlineStatus(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${onlineStatus ? "bg-[#00d1c1]" : "bg-[#32353c]"}`}
                >
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${onlineStatus ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(11,14,20,0.5)" }}>
                <span className="text-sm font-medium text-[#e1e2eb]">Номер телефона</span>
                <button
                  onClick={() => setPhoneVisible(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${phoneVisible ? "bg-[#00d1c1]" : "bg-[#32353c]"}`}
                >
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${phoneVisible ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full py-5 rounded-[1.5rem] border font-bold flex items-center justify-center gap-2 hover:bg-[#ffb4ab]/10 transition-all active:scale-[0.98]"
              style={{ background: "rgba(147,0,10,0.08)", borderColor: "rgba(255,180,171,0.15)", color: "#ffb4ab" }}>
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Выйти из аккаунта</span>
            </button>
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
          <button onClick={() => navigate("/admin")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">shield</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Админ</span>
          </button>
          {/* Профиль — active */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Профиль</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
