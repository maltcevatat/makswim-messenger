import { useState } from "react";
import BottomNav from "./BottomNav";

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const calendarDays = [
  { n: 26, prev: true },
  { n: 27, prev: true },
  { n: 28, prev: true },
  { n: 29, prev: true },
  { n: 30, prev: true },
  { n: 31, prev: true },
  { n: 1, dot: true, border: true },
  { n: 2 },
  { n: 3, active: true },
  { n: 4, dot: true },
  { n: 5 },
  { n: 6, dot: true },
  { n: 7 },
  { n: 8 },
  { n: 9, dot: true },
  { n: 10 },
  { n: 11, dot: true },
  { n: 12 },
  { n: 13 },
  { n: 14, dot: true },
  { n: 15 },
];

const events = [
  {
    id: 1,
    icon: "pool",
    title: "Командный заплыв",
    time: "7:00 — 8:30",
    status: "joined",
    color: "primary",
  },
  {
    id: 2,
    icon: "pedal_bike",
    title: "Велотренировка",
    time: "18:00 — 19:30",
    status: "confirmed",
    color: "secondary",
  },
  {
    id: 3,
    icon: "fitness_center",
    title: "Силовая сессия",
    time: "20:00 — 21:00",
    status: "joined",
    color: "muted",
  },
];

export default function Calendar() {
  const [selectedDay, setSelectedDay] = useState(3);

  return (
    <div className="min-h-screen pb-28" style={{ background: "#10131a", color: "#e1e2eb" }}>
      {/* Background glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.85)", backdropFilter: "blur(24px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img
              alt="профиль"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAX9Xtyw8FhNUBg9DLIPNO7uvK9tYvBVjVv7n2vWHp3SHQ-3-rL4FCHmwUcuCTYLgOu_L-iK-2KxtO_-H0hsi5xknxokPZk-4gz1yQsj0gSWenpUdDDIGJZwEzuJtvNFsUMtnUF2rg9HlDUFpA_x872PF1UL7N0yaMhcffDCueUUY6PVz-docPp2sWa5dSf2MaLo0PkrabRSad6ZirSV3XTvuxZoh3S_j9C8NwG8L6s3eE-AlTdEfE5y28X1UpGfQFJyOLg09YfFEBk"
            />
          </div>
          <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
            MAKSWIM
          </span>
        </div>
        <button className="p-2 rounded-full hover:bg-[#272a31] transition-colors">
          <span className="material-symbols-outlined text-[#46eedd]">search</span>
        </button>
      </header>

      <main className="pt-20 px-5 max-w-lg mx-auto">
        {/* Calendar Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-5 px-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Сентябрь 2024</h1>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center bg-[#191c22] rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center bg-[#191c22] rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-[#191c22] p-5 rounded-[2rem] shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-widest font-bold text-[#859491]">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => !day.prev && setSelectedDay(day.n)}
                  className={`aspect-square flex flex-col items-center justify-center text-sm font-medium rounded-2xl transition-all
                    ${day.prev ? "opacity-20 cursor-default" : "cursor-pointer"}
                    ${day.active || selectedDay === day.n
                      ? "bg-[#46eedd] text-[#003732] font-bold"
                      : day.border
                        ? "bg-[#272a31] border border-[#46eedd]/20"
                        : !day.prev
                          ? "bg-[#272a31] hover:bg-[#32353c]"
                          : ""
                    }
                  `}
                  style={day.active || selectedDay === day.n
                    ? { boxShadow: "0 8px 20px rgba(70,238,221,0.25)" }
                    : {}}
                >
                  {day.n}
                  {day.dot && !(day.active || selectedDay === day.n) && (
                    <span className="absolute bottom-2 w-1 h-1 bg-[#46eedd] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Events */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5 px-1">
            <div>
              <h2 className="text-xl font-bold">Выбранный день</h2>
              <p className="text-[#bacac6] text-xs mt-0.5">Вторник, {selectedDay} сентября</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{ background: "rgba(70,238,221,0.1)", color: "#46eedd" }}>
              {events.length} События
            </span>
          </div>

          <div className="space-y-4">
            {events.map(ev => (
              <div key={ev.id} className="bg-[#272a31] p-4 rounded-3xl flex items-center gap-4">
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${
                  ev.color === "primary"
                    ? "text-[#003732]"
                    : ev.color === "secondary"
                      ? "text-[#a8afff]"
                      : "text-[#859491]"
                }`}
                  style={{
                    background: ev.color === "primary"
                      ? "linear-gradient(135deg, #46eedd, #00d1c1)"
                      : ev.color === "secondary"
                        ? "rgba(52,61,150,0.5)"
                        : "#32353c"
                  }}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{ev.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] truncate text-[#e1e2eb]">{ev.title}</h3>
                  <div className="flex items-center gap-1.5 text-[#bacac6] text-[12px] mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{ev.time}</span>
                  </div>
                </div>
                {ev.status === "joined" ? (
                  <button className="shrink-0 bg-[#46eedd] px-4 py-2 rounded-full text-[#003732] text-[11px] font-bold whitespace-nowrap active:scale-95 transition-transform">
                    Участвую
                  </button>
                ) : (
                  <button className="shrink-0 bg-[#32353c] px-4 py-2 rounded-full text-[#bacac6] text-[11px] font-bold whitespace-nowrap opacity-60">
                    Подтверждено
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Coach note */}
        <section className="mb-10">
          <div className="bg-[#272a31] rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
              style={{ background: "rgba(70,238,221,0.05)", filter: "blur(48px)" }} />
            <div className="flex flex-col items-center text-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-full p-1 border-2 border-[#46eedd]/20 overflow-hidden">
                <img
                  alt="тренер"
                  className="w-full h-full rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvHomBzFiUJaqwnOl1kKiH35-BFiakGFqU9Pxp5HIzjgSVCmFNTW_AM_9bAl9shr66Fz3lvuyakoShvQtXw-V7_LrfKuRW-XG2cI5SIqnnh-NllR4fdRJDc3PfyfsWf5hjAAG_9FRtiINqSGlklXOhkOFnXXKuRapR51N708sy6i6g4ys_k1RTbn-idgwWwxwPhBTfG61zxROM01JosehjahnjdZZyGCb5ruu8f3BaekEFzBKIfsdi0RMC0FVaVEXi39rdkqnVQ7fK"
                />
              </div>
              <div>
                <h4 className="text-[#46eedd] text-[10px] font-extrabold tracking-[0.2em] uppercase mb-3">Брифинг тренера</h4>
                <p className="text-[#e1e2eb] text-[17px] font-medium leading-relaxed italic px-2">
                  "Не забывайте фокусироваться на вращении корпуса во время утренней тренировки. Восстановление — залог успеха."
                </p>
              </div>
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#363940] text-[#46eedd] shadow-lg hover:bg-[#46eedd] hover:text-[#003732] transition-all">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <BottomNav active="calendar" />
    </div>
  );
}
