import { useState } from "react";
import { useLocation } from "wouter";
import { getProfile } from "@/auth";

const RECENT_CALLS = [
  { id: "alex", name: "Алекс", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuABnmny1DA7S9r8U6aT7MxugMb-Cj6-lvPCs66jWHaydjSMUu8NkSR7jp0F5_-xb8yyVNwKOtW89Ys0xdUBgwexa8qdN_kVGZieUjpMc3KZjlDv-kk_obXwj-hpUtZ6ti9Pk43TcM-W6T-zcmTT9EjW-Vzxt2izMrx8TSNsoFl-BoruA3JDj1S5EnFpKpHYlfgiacGb2IzQK_hmSFxQOfs-a4p5RrWyodgXG240NggzFBxHjtL1YckL_hIqZJvuC0kfDakPEVbKwE7x", type: "incoming", time: "Сегодня, 14:20", missed: false },
  { id: "maria", name: "Мария Волкова", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m", type: "outgoing", time: "Вчера, 18:45", missed: false },
  { id: "dmitry", name: "Дмитрий Соколов", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvHomBzFiUJaqwnOl1kKiH35-BFiakGFqU9Pxp5HIzjgSVCmFNTW_AM_9bAl9shr66Fz3lvuyakoShvQtXw-V7_LrfKuRW-XG2cI5SIqnnh-NllR4fdRJDc3PfyfsWf5hjAAG_9FRtiINqSGlklXOhkOFnXXKuRapR51N708sy6i6g4ys_k1RTbn-idgwWwxwPhBTfG61zxROM01JosehjahnjdZZyGCb5ruu8f3BaekEFzBKIfsdi0RMC0FVaVEXi39rdkqnVQ7fK", type: "missed", time: "Суббота, 10:00", missed: true },
  { id: "elena", name: "Елена Кузнецова", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn23xiqMIp93GJzp7Sd6-gC8QoYrq1PfYnLROIh8dWXAt_WY7tUvp6XuUhmYHnKtpGzYiKViWA8WMLfO8rfkc8muDV_Gq-XTxHtAPk2hud8n0EJ9hdOaOkEyHJzgsPjLrNENRytAhhuJ1dJfr1jZhM13dhicZGvIxpXcfJJK2oem16XPqzXkWzSfzWVe-cdUjRJdpqcHTRt8zIv72gSQm2xAT6Sk5Lt9EWM8DQnK1CruiqP_C3HayTkj4Nr9LQ3ksGcdMBXyEKS7pw", type: "incoming", time: "Пятница, 21:15", missed: false },
];

export default function Calls() {
  const [, navigate] = useLocation();
  const [calling, setCalling] = useState<string | null>(null);
  const profile = getProfile();

  function startCall(id: string) {
    setCalling(id);
    setTimeout(() => setCalling(null), 3000);
  }

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Incoming call overlay */}
      {calling && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
          style={{ background: "rgba(10,13,20,0.97)" }}>
          <div className="w-28 h-28 rounded-full overflow-hidden mb-6 ring-4 ring-[#46eedd]/30 animate-pulse">
            <img src={RECENT_CALLS.find(c => c.id === calling)?.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-[22px] font-bold mb-2">{RECENT_CALLS.find(c => c.id === calling)?.name}</h2>
          <p className="text-[#46eedd] text-[14px] mb-16 animate-pulse">Звоним...</p>
          <button onClick={() => setCalling(null)}
            className="w-16 h-16 bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 rounded-full flex items-center justify-center text-[#ffb4ab] active:scale-90 transition-all">
            <span className="material-symbols-outlined text-[28px]">call_end</span>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-5 py-3.5 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20 shrink-0">
              {profile?.avatar
                ? <img alt="me" src={profile.avatar} className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-[#bacac6] text-[18px] flex items-center justify-center w-full h-full">person</span>}
            </button>
            <span className="text-[1.2rem] font-extrabold tracking-tighter text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>MAKSWIM</span>
          </div>
          <button className="p-2 rounded-full hover:bg-[#272a31] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[#46eedd]">add_call</span>
          </button>
        </div>
      </header>

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto">
        <h1 className="text-[1.6rem] font-extrabold mt-5 mb-6">Звонки</h1>

        {/* Quick call bar */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {RECENT_CALLS.map(c => (
            <button key={c.id} onClick={() => startCall(c.id)}
              className="flex flex-col items-center gap-2 shrink-0 active:scale-90 transition-all">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden">
                  <img alt={c.name} src={c.avatar} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#46eedd] flex items-center justify-center"
                  style={{ boxShadow: "0 2px 8px rgba(70,238,221,0.4)" }}>
                  <span className="material-symbols-outlined text-[#003732] text-[12px]">call</span>
                </div>
              </div>
              <span className="text-[11px] text-[#bacac6]/70 max-w-[64px] text-center truncate">{c.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Recent calls */}
        <h2 className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#bacac6]/50 mb-3">Недавние</h2>
        <div className="flex flex-col gap-2">
          {RECENT_CALLS.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-[1.4rem] hover:bg-[#1d2026] transition-colors"
              style={{ background: "#191c22" }}>
              <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0">
                <img alt={c.name} src={c.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[15px] ${c.missed ? "text-[#ffb4ab]" : "text-[#e1e2eb]"}`}>{c.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]"
                    style={{ color: c.missed ? "#ffb4ab" : "#46eedd" }}>
                    {c.type === "incoming" ? "call_received" : c.type === "outgoing" ? "call_made" : "call_missed"}
                  </span>
                  <span className="text-[11px] text-[#bacac6]/50">{c.time}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startCall(c.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#46eedd] hover:bg-[#46eedd]/10 transition-colors active:scale-90">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
                <button onClick={() => navigate(`/chat/${c.id}`)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#bacac6]/50 hover:bg-[#32353c] transition-colors active:scale-90">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                </button>
              </div>
            </div>
          ))}
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
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Звонки</span>
          </div>
          <button onClick={() => navigate("/calendar")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[22px]">calendar_today</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Календарь</span>
          </button>
          <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Настройки</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
