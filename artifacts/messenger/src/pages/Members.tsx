import { useState } from "react";
import { useLocation } from "wouter";

const MEMBERS = [
  {
    id: "alex",
    name: "Александр Альфа",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1w2dRctOyJv-MjEIDAiefLVahpBwOqdag3i6WbRgG0FUB20F6LhO7G4_NBMAC-kEjy5MCNQ0o172VYrAfDtSvqkIkfAHoitcUisBUit1ZMB6kbnQ7FeuHOemCOBV8VspuM3PYdbFlS6wQ8FFLibc0SxdH99jvnDxj2pw3js_WwBUkmWbBzX4nYIePv1_QusKuxu2Kr37aDRUkyhg_qnZd7pWBATv10a0nOzDOY1dmniZyeaho4czwFLmEUbrc6VkZmczeZ09GVH9x",
    status: "В сети",
    online: true,
    admin: true,
  },
  {
    id: "maria",
    name: "Мария Волкова",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m",
    status: "Печатает...",
    online: true,
    admin: false,
    typing: true,
  },
  {
    id: "dmitry",
    name: "Дмитрий Соколов",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvHomBzFiUJaqwnOl1kKiH35-BFiakGFqU9Pxp5HIzjgSVCmFNTW_AM_9bAl9shr66Fz3lvuyakoShvQtXw-V7_LrfKuRW-XG2cI5SIqnnh-NllR4fdRJDc3PfyfsWf5hjAAG_9FRtiINqSGlklXOhkOFnXXKuRapR51N708sy6i6g4ys_k1RTbn-idgwWwxwPhBTfG61zxROM01JosehjahnjdZZyGCb5ruu8f3BaekEFzBKIfsdi0RMC0FVaVEXi39rdkqnVQ7fK",
    status: "Был(а) в 14:32",
    online: false,
    admin: false,
  },
  {
    id: "elena",
    name: "Елена Громова",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn23xiqMIp93GJzp7Sd6-gC8QoYrq1PfYnLROIh8dWXAt_WY7tUvp6XuUhmYHnKtpGzYiKViWA8WMLfO8rfkc8muDV_Gq-XTxHtAPk2hud8n0EJ9hdOaOkEyHJzgsPjLrNENRytAhhuJ1dJfr1jZhM13dhicZGvIxpXcfJJK2oem16XPqzXkWzSfzWVe-cdUjRJdpqcHTRt8zIv72gSQm2xAT6Sk5Lt9EWM8DQnK1CruiqP_C3HayTkj4Nr9LQ3ksGcdMBXyEKS7pw",
    status: "В сети",
    online: true,
    admin: false,
  },
  {
    id: "ivan",
    name: "Иван Карелин",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVuH-h8usX1oEMwD0dy2q8qpyQZDpxizl684KF8m0khFG5vk-jL1GL_WjhOL-CSTeC7vei2vAKT3h803jFxZ7nc2WC2GEF5YgQV7O77SZjFM40ZDg4DaG1N3Hfj95wPBZnDJ-8eWUFBBpwx3M5RWkQRfvCkmv6xo4zUjkUxyb2kwrkEPkyxUGTahm82dGQ7XTNScy_tIOZvD0ifUYoizsaNr8rZbUxMglxa2xCjNMIYgiXB8Zg1Fzqi7Vu5mO4qZ26ekpEJJcTzI_w",
    status: "Был(а) вчера",
    online: false,
    admin: false,
  },
];

export default function Members() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const filtered = MEMBERS.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.03)", filter: "blur(100px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex items-center px-5 py-3.5 max-w-lg mx-auto gap-3">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="flex-1 text-[18px] font-extrabold text-[#e1e2eb]">Участники группы</h1>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#46eedd] hover:bg-[#1d2026] transition-colors">
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-[1.5rem] border-l-2 border-[#46eedd]" style={{ background: "#1d2026" }}>
            <p className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#bacac6]/50 mb-1">Всего участников</p>
            <p className="text-[2rem] font-black text-[#e1e2eb] leading-none">128</p>
          </div>
          <div className="p-4 rounded-[1.5rem] border-l-2 border-[#46eedd]" style={{ background: "#1d2026" }}>
            <p className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#bacac6]/50 mb-1">Сейчас в сети</p>
            <p className="text-[2rem] font-black text-[#46eedd] leading-none">42</p>
          </div>
        </div>

        {/* Member list */}
        <div className="flex flex-col gap-2">
          {filtered.map(m => (
            <div key={m.id}
              className="flex items-center gap-4 p-4 rounded-[1.4rem] transition-colors hover:bg-[#1d2026]"
              style={{ background: "#191c22" }}>
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden">
                  <img alt={m.name} src={m.avatar} className="w-full h-full object-cover" />
                </div>
                {m.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#46eedd] rounded-full border-2 border-[#191c22]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-bold text-[15px] text-[#e1e2eb] truncate">{m.name}</h4>
                  {m.admin && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shrink-0"
                      style={{ background: "rgba(70,238,221,0.12)", color: "#46eedd", border: "1px solid rgba(70,238,221,0.2)" }}>
                      Админ
                    </span>
                  )}
                </div>
                <p className={`text-[12px] ${m.typing ? "text-[#46eedd]" : "text-[#bacac6]/50"}`}>{m.status}</p>
              </div>
              <button className="w-8 h-8 flex items-center justify-center text-[#bacac6]/30 hover:text-[#bacac6] transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Nav (4-tab group nav) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5"
        style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-around items-center px-4 pt-3 pb-7 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Чаты</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">call</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Звонки</span>
          </button>
          {/* Участники - active */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Участники</span>
          </div>
          <button className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Настройки</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
