import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/api";
import BottomNav from "@/components/BottomNav";

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WEEKDAY_NAMES = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];

const ICONS = [
  { value: "pool",              label: "Плавание" },
  { value: "directions_run",    label: "Бег" },
  { value: "pedal_bike",        label: "Велосипед" },
  { value: "fitness_center",    label: "Силовая" },
  { value: "sports_gymnastics", label: "Гимнастика" },
  { value: "self_improvement",  label: "Йога" },
];

const COLORS = [
  { value: "primary",   label: "Бирюзовый" },
  { value: "secondary", label: "Синий" },
  { value: "muted",     label: "Серый" },
];

interface TrainingEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: string;
  time_start: string;
  time_end: string;
  color: string;
  count: number;
}

interface EventForm {
  title: string;
  description: string;
  icon: string;
  time_start: string;
  time_end: string;
  color: string;
}

function getDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthStr(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function generateCalendarDays(year: number, month: number, events: TrainingEvent[]) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay + 6) % 7;
  const today = new Date();
  const days: { n: number; prev?: boolean; next?: boolean; dot?: boolean; isToday?: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ n: daysInPrevMonth - i, prev: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = getDateStr(year, month, i);
    const hasEvents = events.some(e => e.date === dateStr);
    const isToday = year === today.getFullYear() && month === today.getMonth() && i === today.getDate();
    days.push({ n: i, dot: hasEvents, isToday });
  }
  let nextDay = 1;
  while (days.length < 35) days.push({ n: nextDay++, next: true });
  return days;
}

export default function Calendar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [myRegs, setMyRegs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null);
  const [form, setForm] = useState<EventForm>({ title: "", description: "", icon: "fitness_center", time_start: "07:00", time_end: "08:30", color: "primary" });
  const [saving, setSaving] = useState(false);

  const [regsModal, setRegsModal] = useState<{ event: TrainingEvent; users: { name: string; avatar_url: string }[] } | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.training.list(getMonthStr(viewYear, viewMonth));
      setEvents(data.events);
      setMyRegs(new Set(data.my_registrations));
    } catch {}
    finally { setLoading(false); }
  }, [viewYear, viewMonth]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(1);
  }

  const calendarDays = generateCalendarDays(viewYear, viewMonth, events);
  const selectedDateStr = getDateStr(viewYear, viewMonth, selectedDay);
  const dayEvents = events.filter(e => e.date === selectedDateStr);
  const selectedWeekDay = WEEKDAY_NAMES[new Date(viewYear, viewMonth, selectedDay).getDay()];

  async function toggleReg(eventId: string) {
    try {
      const result = await api.training.register(eventId);
      setMyRegs(prev => {
        const next = new Set(prev);
        if (result.registered) { next.add(eventId); showToast("Участие подтверждено!"); }
        else { next.delete(eventId); showToast("Отменено участие"); }
        return next;
      });
      setEvents(prev => prev.map(e => e.id === eventId
        ? { ...e, count: result.registered ? e.count + 1 : Math.max(0, e.count - 1) }
        : e
      ));
    } catch { showToast("Ошибка"); }
  }

  function openAddModal() {
    setEditingEvent(null);
    setForm({ title: "", description: "", icon: "fitness_center", time_start: "07:00", time_end: "08:30", color: "primary" });
    setModalOpen(true);
  }

  function openEditModal(ev: TrainingEvent) {
    setEditingEvent(ev);
    setForm({ title: ev.title, description: ev.description || "", icon: ev.icon, time_start: ev.time_start, time_end: ev.time_end, color: ev.color });
    setModalOpen(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) { showToast("Введите название"); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        await api.training.update(editingEvent.id, { ...form, date: editingEvent.date });
        showToast("Тренировка обновлена");
      } else {
        await api.training.create({ ...form, date: selectedDateStr });
        showToast("Тренировка добавлена");
      }
      setModalOpen(false);
      await loadEvents();
    } catch { showToast("Ошибка сохранения"); }
    finally { setSaving(false); }
  }

  async function deleteEvent(id: string) {
    try {
      await api.training.remove(id);
      showToast("Тренировка удалена");
      await loadEvents();
    } catch { showToast("Ошибка удаления"); }
  }

  async function showRegistrations(ev: TrainingEvent) {
    try {
      const users = await api.training.registrations(ev.id);
      setRegsModal({ event: ev, users });
    } catch {}
  }

  function eventBg(color: string) {
    if (color === "primary") return "linear-gradient(135deg, #46eedd, #00d1c1)";
    if (color === "secondary") return "rgba(52,61,150,0.6)";
    return "#32353c";
  }
  function eventIconColor(color: string) {
    if (color === "primary") return "#003732";
    if (color === "secondary") return "#a8afff";
    return "#859491";
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl font-bold text-[13px] text-[#003732] shadow-xl"
          style={{ background: "#46eedd" }}>{toast}</div>
      )}

      {/* Registrations modal */}
      {regsModal && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setRegsModal(null)}>
          <div className="w-full max-w-lg rounded-[2rem] p-6"
            style={{ background: "#1d2026" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[16px]">{regsModal.event.title} — участники</h3>
              <button onClick={() => setRegsModal(null)} className="text-[#bacac6]/50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {regsModal.users.length === 0 ? (
              <p className="text-[#bacac6]/40 text-center py-6">Никто не записался</p>
            ) : (
              <div className="space-y-3">
                {regsModal.users.map((u, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#272a31] shrink-0">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#bacac6] text-[16px]">person</span>
                          </div>}
                    </div>
                    <span className="text-[14px] font-medium">{u.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-[2rem] p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
            style={{ background: "#1d2026" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[18px]">{editingEvent ? "Редактировать" : "Новая тренировка"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-[#bacac6]/50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="text-[12px] font-bold text-[#46eedd] uppercase tracking-wider">
              {selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()} {viewYear}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#bacac6]/60 uppercase tracking-wider">Название</label>
              <input
                className="bg-[#10131a] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[15px] outline-none"
                style={{ caretColor: "#46eedd" }}
                placeholder="Например: Командный заплыв"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#bacac6]/60 uppercase tracking-wider">Описание тренировки</label>
              <textarea
                className="bg-[#10131a] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[14px] outline-none resize-none"
                style={{ caretColor: "#46eedd", minHeight: 90 }}
                placeholder="Опишите программу, цели, особенности тренировки..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Time */}
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#bacac6]/60 uppercase tracking-wider">Начало</label>
                <input type="time" value={form.time_start}
                  onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))}
                  className="bg-[#10131a] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[15px] outline-none" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#bacac6]/60 uppercase tracking-wider">Конец</label>
                <input type="time" value={form.time_end}
                  onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))}
                  className="bg-[#10131a] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[15px] outline-none" />
              </div>
            </div>

            {/* Icon */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#bacac6]/60 uppercase tracking-wider">Тип</label>
              <div className="grid grid-cols-3 gap-2">
                {ICONS.map(ic => (
                  <button key={ic.value}
                    onClick={() => setForm(f => ({ ...f, icon: ic.value }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${form.icon === ic.value ? "text-[#003732]" : "text-[#bacac6]/70 bg-[#10131a]"}`}
                    style={form.icon === ic.value ? { background: "#46eedd" } : {}}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ic.value}</span>
                    {ic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#bacac6]/60 uppercase tracking-wider">Цвет</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c.value}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all border ${form.color === c.value ? "border-[#46eedd] text-[#46eedd]" : "border-[#272a31] text-[#bacac6]/50"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveEvent} disabled={saving}
              className="w-full py-4 rounded-2xl font-bold text-[16px] text-[#003732] mt-1 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              {saving ? "Сохраняю..." : editingEvent ? "Сохранить" : "Создать тренировку"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-5 py-3.5 max-w-lg mx-auto">
          <span className="text-[1.2rem] font-extrabold tracking-tighter text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
            MAKSWIM
          </span>
          {isAdmin && (
            <button onClick={openAddModal}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#46eedd] hover:bg-[#272a31] transition-colors active:scale-90"
              style={{ background: "rgba(70,238,221,0.1)" }}>
              <span className="material-symbols-outlined text-[22px]">add</span>
            </button>
          )}
        </div>
      </header>

      <main className="pt-20 px-5 max-w-lg mx-auto">
        {/* Month header */}
        <div className="flex items-center justify-between my-5 px-1">
          <h1 className="text-[1.5rem] font-extrabold tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h1>
          <div className="flex gap-2">
            <button onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center bg-[#1d2026] rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors active:scale-90">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center bg-[#1d2026] rounded-xl text-[#46eedd] hover:bg-[#272a31] transition-colors active:scale-90">
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
              <button key={i}
                onClick={() => !day.prev && !day.next && setSelectedDay(day.n)}
                disabled={!!day.prev || !!day.next}
                className={`aspect-square flex flex-col items-center justify-center text-[13px] font-medium rounded-2xl transition-all relative
                  ${day.prev || day.next ? "opacity-20 cursor-default" : "cursor-pointer active:scale-90"}
                  ${!day.prev && !day.next && selectedDay === day.n ? "font-bold" : !day.prev && !day.next ? "bg-[#272a31] hover:bg-[#32353c]" : ""}
                `}
                style={!day.prev && !day.next && selectedDay === day.n
                  ? { background: "#46eedd", color: "#003732", boxShadow: "0 6px 18px rgba(70,238,221,0.3)" }
                  : {}}>
                {day.isToday && selectedDay !== day.n && (
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-[#46eedd]/40 pointer-events-none" />
                )}
                {day.n}
                {day.dot && selectedDay !== day.n && !day.prev && !day.next && (
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
              <p className="text-[#bacac6]/60 text-xs mt-0.5">
                {selectedWeekDay}, {selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {dayEvents.length > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                  style={{ background: "rgba(70,238,221,0.1)", color: "#46eedd" }}>
                  {dayEvents.length} {dayEvents.length === 1 ? "событие" : dayEvents.length < 5 ? "события" : "событий"}
                </span>
              )}
              {isAdmin && (
                <button onClick={openAddModal}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-[#46eedd] hover:bg-[#272a31] transition-colors"
                  style={{ background: "rgba(70,238,221,0.1)" }}>
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Добавить
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
            </div>
          ) : dayEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#bacac6]/20">event_busy</span>
              <p className="text-[#bacac6]/40 text-[14px]">На этот день тренировок нет</p>
              {isAdmin && (
                <button onClick={openAddModal}
                  className="mt-2 px-6 py-2.5 rounded-full text-[13px] font-bold text-[#003732]"
                  style={{ background: "#46eedd" }}>
                  Добавить тренировку
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {dayEvents.map(ev => {
                const isJoined = myRegs.has(ev.id);
                return (
                  <div key={ev.id} className="bg-[#1d2026] rounded-3xl overflow-hidden">
                    {/* Event header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center"
                        style={{ background: eventBg(ev.color), color: eventIconColor(ev.color) }}>
                        <span className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>{ev.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[14px] text-[#e1e2eb]">{ev.title}</h3>
                        <div className="flex items-center gap-1 text-[#bacac6]/60 text-[11px] mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          <span>{ev.time_start} — {ev.time_end}</span>
                          {ev.count > 0 && (
                            <span className="ml-2 text-[#46eedd]/70">· {ev.count} чел.</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAdmin && (
                          <>
                            <button onClick={() => showRegistrations(ev)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-[#46eedd]/50 hover:text-[#46eedd] hover:bg-[#272a31] transition-all"
                              title="Участники">
                              <span className="material-symbols-outlined text-[18px]">group</span>
                            </button>
                            <button onClick={() => openEditModal(ev)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-[#bacac6]/50 hover:text-[#46eedd] hover:bg-[#272a31] transition-all">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => deleteEvent(ev.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-[#bacac6]/30 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toggleReg(ev.id)}
                          className={`ml-1 px-4 py-2 rounded-full text-[11px] font-bold transition-all active:scale-90 ${
                            isJoined ? "text-[#003732]" : "text-[#bacac6]/60 border border-[#bacac6]/20 hover:border-[#46eedd]/30"
                          }`}
                          style={isJoined ? { background: "#46eedd" } : {}}>
                          {isJoined ? "Участвую" : "Записаться"}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {ev.description && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-[#10131a] rounded-2xl px-4 py-3">
                          <p className="text-[13px] text-[#bacac6]/70 leading-relaxed">{ev.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav active="calendar" />
    </div>
  );
}
