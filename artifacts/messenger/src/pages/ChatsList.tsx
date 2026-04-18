import { useState } from "react";
import { useLocation } from "wouter";
import { getProfile } from "@/auth";

const CHATS = [
  {
    id: "maria",
    name: "Мария Волкова",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m",
    lastMsg: "Договорились, скину отчет через ча...",
    time: "14:22",
    unread: 3,
    online: true,
    verified: false,
  },
  {
    id: "dmitry",
    name: "Дмитрий Соколов",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvHomBzFiUJaqwnOl1kKiH35-BFiakGFqU9Pxp5HIzjgSVCmFNTW_AM_9bAl9shr66Fz3lvuyakoShvQtXw-V7_LrfKuRW-XG2cI5SIqnnh-NllR4fdRJDc3PfyfsWf5hjAAG_9FRtiINqSGlklXOhkOFnXXKuRapR51N708sy6i6g4ys_k1RTbn-idgwWwxwPhBTfG61zxROM01JosehjahnjdZZyGCb5ruu8f3BaekEFzBKIfsdi0RMC0FVaVEXi39rdkqnVQ7fK",
    lastMsg: "Проект одобрен руководством. Начи...",
    time: "Вчера",
    unread: 0,
    online: false,
    verified: true,
  },
  {
    id: "elena",
    name: "Елена Кузнецова",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn23xiqMIp93GJzp7Sd6-gC8QoYrq1PfYnLROIh8dWXAt_WY7tUvp6XuUhmYHnKtpGzYiKViWA8WMLfO8rfkc8muDV_Gq-XTxHtAPk2hud8n0EJ9hdOaOkEyHJzgsPjLrNENRytAhhuJ1dJfr1jZhM13dhicZGvIxpXcfJJK2oem16XPqzXkWzSfzWVe-cdUjRJdpqcHTRt8zIv72gSQm2xAT6Sk5Lt9EWM8DQnK1CruiqP_C3HayTkj4Nr9LQ3ksGcdMBXyEKS7pw",
    lastMsg: "🎙 Голосовое сообщение (0:45)",
    time: "Суббота",
    unread: 0,
    online: true,
    voice: true,
  },
  {
    id: "artem",
    name: "Артем Белов",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVuH-h8usX1oEMwD0dy2q8qpyQZDpxizl684KF8m0khFG5vk-jL1GL_WjhOL-CSTeC7vei2vAKT3h803jFxZ7nc2WC2GEF5YgQV7O77SZjFM40ZDg4DaG1N3Hfj95wPBZnDJ-8eWUFBBpwx3M5RWkQRfvCkmv6xo4zUjkUxyb2kwrkEPkyxUGTahm82dGQ7XTNScy_tIOZvD0ifUYoizsaNr8rZbUxMglxa2xCjNMIYgiXB8Zg1Fzqi7Vu5mO4qZ26ekpEJJcTzI_w",
    lastMsg: "Ты видел новые макеты в Фигме?",
    time: "Пятница",
    unread: 0,
    online: false,
  },
];

export default function ChatsList() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const profile = getProfile();

  const filtered = CHATS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      {/* Glow */}
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(100px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-5 py-3.5 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20 shrink-0">
              {profile?.avatar ? (
                <img alt="me" src={profile.avatar} className="w-full h-full object-cover" />
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
        <div className="my-4 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: "#1d2026" }}>
          <span className="material-symbols-outlined text-[#bacac6]/50 text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск диалогов..."
            className="flex-1 bg-transparent text-[#e1e2eb] text-[15px] outline-none placeholder:text-[#bacac6]/40"
          />
          <button className="text-[#bacac6]/50 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
        </div>

        {/* Group Chat */}
        {!search && (
          <button
            onClick={() => navigate("/chat/group")}
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
              <p className="text-[13px] text-[#bacac6]/70 truncate">Алексей: Всем привет! Кт...</p>
            </div>
            <div className="bg-[#46eedd] w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(70,238,221,0.3)" }}>
              <span className="text-[11px] font-black text-[#003732]">12</span>
            </div>
          </button>
        )}

        {/* Personal Messages */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#bacac6]/50">
            Личные сообщения
          </h2>
          <span className="text-[11px] font-bold text-[#46eedd]">
            {CHATS.reduce((a, c) => a + c.unread, 0)} непрочитанных
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {filtered.map(chat => (
            <button
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center gap-4 p-3 -mx-2 w-full text-left rounded-3xl hover:bg-[#1d2026] transition-all cursor-pointer active:bg-[#272a31]/50"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md">
                  <img alt={chat.name} className="w-full h-full object-cover" src={chat.avatar} />
                </div>
                {chat.online && (
                  <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#46eedd] rounded-full border-2 border-[#10131a]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-bold text-[#e1e2eb] truncate text-[15px]">{chat.name}</h4>
                  <span className="text-[11px] text-[#bacac6]/50 font-medium ml-2 shrink-0">{chat.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(chat as any).verified && (
                    <span className="material-symbols-outlined text-[13px] text-[#46eedd] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>done_all</span>
                  )}
                  {(chat as any).voice ? (
                    <p className="text-[13px] truncate flex items-center gap-1" style={{ color: "#46eedd" }}>
                      <span className="material-symbols-outlined text-[14px]">mic</span>
                      Голосовое сообщение (0:45)
                    </p>
                  ) : (
                    <p className="text-[13px] text-[#bacac6]/70 truncate">{chat.lastMsg}</p>
                  )}
                </div>
              </div>
              {chat.unread > 0 && (
                <div className="bg-[#46eedd] min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center shrink-0"
                  style={{ boxShadow: "0 2px 8px rgba(70,238,221,0.25)" }}>
                  <span className="text-[10px] font-black text-[#003732]">{chat.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate("/chat/alex")}
        className="fixed right-5 bottom-28 w-14 h-14 rounded-2xl flex items-center justify-center text-[#003732] z-40 active:scale-90 hover:scale-105 transition-all"
        style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 8px 24px rgba(70,238,221,0.3)" }}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 500" }}>edit_square</span>
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5"
        style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-around items-center px-6 pt-3 pb-7 max-w-lg mx-auto">
          {/* Чаты - active */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Чаты</span>
          </div>
          {/* Админ */}
          <button onClick={() => navigate("/admin")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[24px]">shield</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Админ</span>
          </button>
          {/* Профиль */}
          <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Профиль</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
