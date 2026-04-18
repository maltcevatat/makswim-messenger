import { useState } from "react";
import { useLocation } from "wouter";
import { getProfile } from "@/auth";

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const calendarDays = [
  { n: 26, prev: true }, { n: 27, prev: true }, { n: 28, prev: true },
  { n: 29, prev: true }, { n: 30, prev: true }, { n: 31, prev: true },
  { n: 1, dot: true, border: true },
  { n: 2 }, { n: 3, active: true }, { n: 4, dot: true },
  { n: 5 }, { n: 6, dot: true }, { n: 7 }, { n: 8 },
  { n: 9, dot: true }, { n: 10 }, { n: 11, dot: true },
  { n: 12 }, { n: 13 }, { n: 14, dot: true }, { n: 15 },
];

const events = [
  { id: 1, icon: "pool", title: "Командный заплыв", time: "7:00 — 8:30", status: "joined", color: "primary" },
  { id: 2, icon: "pedal_bike", title: "Велотренировка", time: "18:00 — 19:30", status: "confirmed", color: "secondary" },
  { id: 3, icon: "fitness_center", title: "Силовая сессия", time: "20:00 — 21:00", status: "joined", color: "muted" },
];

export default function Calendar() {
  const [, navigate] = useLocation();
  const [selectedDay, setSelectedDay] = useState(3);
  const profile = getProfile();

  return (
    <div className="min-h-screen pb-28" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-5 py-3.5 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20 shrink-0">
              {profile?.avatar ? (
                <img alt="me" src={profile.avatar} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#bacac6] text-[18px]">person</span>
                </div>
              )}
            </button>
            <span className="text-[1.2rem] font-extrabold tracking-tighter text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              MAKSWIM
            </span>
          </div>
          <button className="p-2 rounded-full hover:bg-[#272a31] transition-colors">
            <span className="material-symbols-outlined text-[#46eedd]">search</span>
          </button>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-lg mx-auto">
        {/* Month header */}
        <div className="flex items-center justify-between my-5 px-1">
          <h1 className="text-[1.5rem] font-extrabold tracking-tight">Сентябрь 2024</h1>
          <div className="flex gap-2">
            <button className="w-9 h-9 flex items-center justify-center bg-[#1d2026] rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center bg-[#1d2026] rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-[#191c22] p-4 rounded-[2rem] shadow-sm mb-8">
          <div className="grid grid-cols-7 gap-1 mb-3">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-[9px] uppercase tracking-widest font-bold text-[#859491]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => !day.prev && setSelectedDay(day.n)}
                className={`aspect-square flex flex-col items-center justify-center text-[13px] font-medium rounded-2xl transition-all relative
                  ${day.prev ? "opacity-20 cursor-default" : "cursor-pointer"}
                  ${!day.prev && (day.active || selectedDay === day.n)
                    ? "font-bold"
                    : day.border && selectedDay !== day.n
                      ? "border border-[#46eedd]/20 bg-[#272a31]"
                      : !day.prev
                        ? "bg-[#272a31] hover:bg-[#32353c]"
                        : ""
                  }
                `}
                style={!day.prev && (day.active || selectedDay === day.n)
                  ? { background: "#46eedd", color: "#003732", boxShadow: "0 6px 18px rgba(70,238,221,0.3)" }
                  : {}}
              >
                {day.n}
                {day.dot && !(day.active || selectedDay === day.n) && !day.prev && (
                  <span className="absolute bottom-1.5 w-1 h-1 bg-[#46eedd] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-[1.2rem] font-bold">Выбранный день</h2>
              <p className="text-[#bacac6]/60 text-xs mt-0.5">Вторник, {selectedDay} сентября</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{ background: "rgba(70,238,221,0.1)", color: "#46eedd" }}>
              {events.length} события
            </span>
          </div>
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="bg-[#1d2026] p-4 rounded-3xl flex items-center gap-4">
                <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center`}
                  style={{
                    background: ev.color === "primary"
                      ? "linear-gradient(135deg, #46eedd, #00d1c1)"
                      : ev.color === "secondary"
                        ? "rgba(52,61,150,0.6)"
                        : "#32353c",
                    color: ev.color === "primary" ? "#003732" : ev.color === "secondary" ? "#a8afff" : "#859491"
                  }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ev.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] text-[#e1e2eb]">{ev.title}</h3>
                  <div className="flex items-center gap-1 text-[#bacac6]/60 text-[11px] mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    <span>{ev.time}</span>
                  </div>
                </div>
                {ev.status === "joined" ? (
                  <button className="shrink-0 bg-[#46eedd] px-4 py-2 rounded-full text-[#003732] text-[11px] font-bold active:scale-95 transition-transform">
                    Участвую
                  </button>
                ) : (
                  <span className="shrink-0 text-[#bacac6]/50 text-[11px] font-bold">Подтверждено</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Coach note */}
        <section className="mb-10">
          <div className="bg-[#1d2026] rounded-[2rem] p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
              style={{ background: "rgba(70,238,221,0.05)", filter: "blur(48px)" }} />
            <div className="flex flex-col items-center text-center gap-5 relative z-10">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#46eedd]/20">
                <img
                  alt="тренер"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvHomBzFiUJaqwnOl1kKiH35-BFiakGFqU9Pxp5HIzjgSVCmFNTW_AM_9bAl9shr66Fz3lvuyakoShvQtXw-V7_LrfKuRW-XG2cI5SIqnnh-NllR4fdRJDc3PfyfsWf5hjAAG_9FRtiINqSGlklXOhkOFnXXKuRapR51N708sy6i6g4ys_k1RTbn-idgwWwxwPhBTfG61zxROM01JosehjahnjdZZyGCb5ruu8f3BaekEFzBKIfsdi0RMC0FVaVEXi39rdkqnVQ7fK"
                />
              </div>
              <div>
                <h4 className="text-[#46eedd] text-[9px] font-extrabold tracking-[0.2em] uppercase mb-3">Брифинг тренера</h4>
                <p className="text-[#e1e2eb] text-[16px] font-medium leading-relaxed italic px-2">
                  "Не забывайте фокусироваться на вращении корпуса во время утренней тренировки. Восстановление — залог успеха."
                </p>
              </div>
              <button className="w-11 h-11 flex items-center justify-center rounded-full bg-[#272a31] text-[#46eedd] hover:bg-[#46eedd] hover:text-[#003732] transition-all">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Nav (4-tab) */}
      <nav className="fixed bottom-0 w-full z-50 border-t border-white/5"
        style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-around items-center px-4 pt-3 pb-7 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Чаты</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#bacac6]/40 hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[22px]">videocam</span>
            <span className="text-[9px] font-extrabold tracking-widest uppercase">Звонки</span>
          </button>
          {/* Календарь — active */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#46eedd" }}>
              <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#46eedd]">Календарь</span>
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
