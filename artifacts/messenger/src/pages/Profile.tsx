import { useState } from "react";
import BottomNav from "./BottomNav";

export default function Profile() {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#10131a", color: "#e1e2eb" }}>
      {/* Background glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(52,61,150,0.08)", filter: "blur(100px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.85)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20">
              <img
                alt="User avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m"
              />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              MAKSWIM
            </h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#191c22] text-[#46eedd] hover:bg-[#272a31] transition-all active:scale-95">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-28 pb-36">
        {/* Profile Hero */}
        <section className="mb-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-36 h-36 rounded-[3rem] overflow-hidden bg-[#1d2026] shadow-2xl"
              style={{ boxShadow: "0 0 0 4px rgba(70,238,221,0.1)" }}>
              <img
                alt="Avatar large"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1w2dRctOyJv-MjEIDAiefLVahpBwOqdag3i6WbRgG0FUB20F6LhO7G4_NBMAC-kEjy5MCNQ0o172VYrAfDtSvqkIkfAHoitcUisBUit1ZMB6kbnQ7FeuHOemCOBV8VspuM3PYdbFlS6wQ8FFLibc0SxdH99jvnDxj2pw3js_WwBUkmWbBzX4nYIePv1_QusKuxu2Kr37aDRUkyhg_qnZd7pWBATv10a0nOzDOY1dmniZyeaho4czwFLmEUbrc6VkZmczeZ09GVH9x"
              />
            </div>
            <button className="absolute bottom-1 -right-1 w-10 h-10 bg-[#46eedd] text-[#003732] flex items-center justify-center rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#e1e2eb]">Александр Альфа</h2>
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

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Notifications */}
          <div className="p-5 rounded-[2rem] bg-[#191c22] flex items-center justify-between hover:bg-[#1d2026] transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#46eedd]"
                style={{ background: "rgba(70,238,221,0.1)" }}>
                <span className="material-symbols-outlined">notifications</span>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#e1e2eb] leading-tight">Уведомления</h3>
                <p className="text-xs text-[#bacac6]">Push, звук и предпросмотр</p>
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
          <button className="p-5 rounded-[2rem] bg-[#191c22] flex items-center justify-between hover:bg-[#1d2026] transition-colors duration-300 text-left w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#58e8ff]"
                style={{ background: "rgba(88,232,255,0.1)" }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#e1e2eb] leading-tight">Приватность</h3>
                <p className="text-xs text-[#bacac6]">Шифрование, 2FA защита</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#bacac6]/50">chevron_right</span>
          </button>

          {/* Public profile */}
          <div className="p-5 rounded-[2rem] bg-[#191c22] flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#bdc2ff]"
                style={{ background: "rgba(52,61,150,0.2)" }}>
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#e1e2eb] leading-tight">Публичный профиль</h3>
                <p className="text-xs text-[#bacac6]">Настройка видимости данных</p>
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
          <div className="pt-4">
            <button className="w-full py-5 rounded-[2rem] border font-bold flex items-center justify-center gap-2 hover:bg-[#ffb4ab]/10 transition-all active:scale-[0.98] duration-200"
              style={{ background: "rgba(147,0,10,0.06)", borderColor: "rgba(255,180,171,0.1)", color: "#ffb4ab" }}>
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
