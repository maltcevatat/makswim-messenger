import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

interface Message {
  id: number;
  text: string;
  outgoing: boolean;
  time: string;
  status?: "read" | "sent";
  reaction?: string;
  reactionCount?: number;
  image?: string;
}

interface ChatViewProps {
  id: string;
}

const CONTACTS: Record<string, { name: string; avatar: string; online: boolean }> = {
  alex: {
    name: "Алекс",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuABnmny1DA7S9r8U6aT7MxugMb-Cj6-lvPCs66jWHaydjSMUu8NkSR7jp0F5_-xb8yyVNwKOtW89Ys0xdUBgwexa8qdN_kVGZieUjpMc3KZjlDv-kk_obXwj-hpUtZ6ti9Pk43TcM-W6T-zcmTT9EjW-Vzxt2izMrx8TSNsoFl-BoruA3JDj1S5EnFpKpHYlfgiacGb2IzQK_hmSFxQOfs-a4p5RrWyodgXG240NggzFBxHjtL1YckL_hIqZJvuC0kfDakPEVbKwE7x",
    online: true,
  },
  maria: {
    name: "Мария Волкова",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m",
    online: true,
  },
  group: {
    name: "Общий чат",
    avatar: "",
    online: true,
  },
};

const INITIAL_MESSAGES: Record<string, Message[]> = {
  alex: [
    { id: 1, text: "Привет! Слушай, я тут подготовил концепты для нового проекта Alpha. Ты просил скинуть референсы по освещению.", outgoing: false, time: "14:20", reaction: "🔥" },
    { id: 2, text: "Отлично! Скидывай всё сюда, я как раз сейчас в студии, посмотрим на большом экране.", outgoing: true, time: "14:22", status: "read", reaction: "👍", reactionCount: 1 },
    { id: 3, text: "Вот основной мудборд. Ориентируемся на этот градиент и мягкое свечение. Что думаешь?", outgoing: false, time: "14:25", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn23xiqMIp93GJzp7Sd6-gC8QoYrq1PfYnLROIh8dWXAt_WY7tUvp6XuUhmYHnKtpGzYiKViWA8WMLfO8rfkc8muDV_Gq-XTxHtAPk2hud8n0EJ9hdOaOkEyHJzgsPjLrNENRytAhhuJ1dJfr1jZhM13dhicZGvIxpXcfJJK2oem16XPqzXkWzSfzWVe-cdUjRJdpqcHTRt8zIv72gSQm2xAT6Sk5Lt9EWM8DQnK1CruiqP_C3HayTkj4Nr9LQ3ksGcdMBXyEKS7pw", reaction: "❤️" },
    { id: 4, text: "Кстати, суббота в силе?", outgoing: true, time: "14:26", status: "sent" },
  ],
  maria: [
    { id: 1, text: "Договорились, скину отчет через час!", outgoing: false, time: "14:22" },
  ],
  group: [
    { id: 1, text: "Всем привет! Кто идет на тренировку в пятницу?", outgoing: false, time: "10:15" },
    { id: 2, text: "Я буду!", outgoing: true, time: "10:20", status: "read" },
    { id: 3, text: "Также буду. Во сколько сбор?", outgoing: false, time: "10:22" },
  ],
};

export default function ChatView({ id }: ChatViewProps) {
  const [, navigate] = useLocation();
  const contact = CONTACTS[id] || { name: id, avatar: "", online: false };
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES[id] || []);
  const [inputText, setInputText] = useState("");
  const [pinnedVisible, setPinnedVisible] = useState(id === "alex");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: number } | null>(null);
  const [isTyping, setIsTyping] = useState(id === "alex");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      text: inputText.trim(),
      outgoing: true,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Принял! Буду в 10:00 на месте.",
        outgoing: false,
        time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      }]);
      setIsTyping(false);
    }, 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function showContextMenu(e: React.MouseEvent, msgId: number) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY - 100, msgId });
  }

  function deleteMessage() {
    if (!contextMenu) return;
    setMessages(prev => prev.filter(m => m.id !== contextMenu.msgId));
    setContextMenu(null);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#10131a", color: "#e1e2eb" }}
      onClick={() => setContextMenu(null)}
    >
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(52,61,150,0.08)", filter: "blur(100px)" }} />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu active p-1.5"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#e1e2eb] hover:bg-[#32353c] rounded-lg transition-colors group">
            <span className="material-symbols-outlined text-[20px] text-[#bacac6] group-hover:text-[#46eedd]">edit</span>
            Редактировать
          </button>
          <button onClick={deleteMessage}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Удалить
          </button>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] active:bg-[#1d2026] transition-colors">
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                {contact.avatar ? (
                  <img alt={contact.name} className="w-10 h-10 rounded-full object-cover border border-white/10" src={contact.avatar} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
                    <span className="material-symbols-outlined text-[#003732] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                  </div>
                )}
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#46eedd] rounded-full border-2 border-[#10131a]" />
                )}
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-[#e1e2eb] leading-tight">{contact.name}</h1>
                <span className="text-[11px] text-[#46eedd] font-semibold uppercase tracking-wider">
                  {contact.online ? "В сети" : "Не в сети"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] active:bg-[#1d2026] transition-colors">
              <span className="material-symbols-outlined">videocam</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] active:bg-[#1d2026] transition-colors">
              <span className="material-symbols-outlined">call</span>
            </button>
          </div>
        </div>
        {pinnedVisible && (
          <div className="px-4 py-2 flex items-center justify-between border-t border-[#46eedd]/10"
            style={{ background: "rgba(70,238,221,0.04)" }}>
            <div className="flex items-center gap-3 overflow-hidden max-w-[85%]">
              <span className="material-symbols-outlined text-[#46eedd] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
              <span className="text-[12px] font-medium text-[#46eedd]/90 truncate">Закреплено: Сбор команды в субботу в 10:00</span>
            </div>
            <button onClick={() => setPinnedVisible(false)} className="text-[#46eedd]/40 hover:text-[#46eedd]">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </header>

      {/* Messages */}
      <main
        className={`flex-1 px-4 max-w-lg mx-auto w-full overflow-y-auto chat-scroll flex flex-col gap-6 pt-4 ${pinnedVisible ? "mt-36" : "mt-24"} mb-28`}
      >
        <div className="flex justify-center my-2">
          <span className="px-4 py-1 rounded-full text-[#bacac6] text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(39,42,49,0.5)", backdropFilter: "blur(8px)" }}>
            Сегодня
          </span>
        </div>

        {messages.map(msg => (
          <div key={msg.id}
            className={`flex flex-col max-w-[88%] group relative ${msg.outgoing ? "items-end self-end" : "items-start"}`}>
            {msg.image ? (
              <div className="message-bubble bg-[#272a31] p-1.5 rounded-3xl rounded-bl-none shadow-sm cursor-pointer"
                onClick={e => showContextMenu(e, msg.id)}>
                <div className="relative overflow-hidden rounded-[1.25rem]">
                  <img alt="Медиа" className="w-full h-52 object-cover" src={msg.image} />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[15px] leading-[1.4] text-[#e1e2eb]">{msg.text}</p>
                </div>
              </div>
            ) : msg.outgoing ? (
              <div className="message-bubble p-3.5 rounded-2xl rounded-br-none shadow-lg cursor-pointer"
                style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}
                onClick={e => showContextMenu(e, msg.id)}>
                <p className="text-[15px] leading-[1.4] text-[#003732] font-medium">{msg.text}</p>
              </div>
            ) : (
              <div className="message-bubble bg-[#272a31] p-3.5 rounded-2xl rounded-bl-none shadow-sm cursor-pointer"
                onClick={e => showContextMenu(e, msg.id)}>
                <p className="text-[15px] leading-[1.4] text-[#e1e2eb]">{msg.text}</p>
              </div>
            )}
            <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${msg.outgoing ? "flex-row-reverse" : ""}`}>
              <span className="text-[10px] text-[#bacac6]/50 font-medium">{msg.time}</span>
              {msg.outgoing && msg.status && (
                <span className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'wght' 600", color: msg.status === "read" ? "#46eedd" : "rgba(186,202,198,0.4)" }}>
                  done_all
                </span>
              )}
            </div>
            {msg.reaction && (
              <div className={`absolute -bottom-2.5 ${msg.outgoing ? "left-0 -translate-x-1/4" : "right-0 translate-x-1/4"}`}>
                <div className="bg-[#32353c] px-2 py-0.5 rounded-full border border-white/5 text-[12px] flex items-center gap-1 shadow-lg">
                  <span>{msg.reaction}</span>
                  {msg.reactionCount && <span className="text-[10px] text-[#bacac6]/80 font-bold">{msg.reactionCount}</span>}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex gap-1.5 bg-[#191c22] px-4 py-3 rounded-full">
              <div className="w-1.5 h-1.5 bg-[#46eedd]/70 rounded-full dot-bounce-1" />
              <div className="w-1.5 h-1.5 bg-[#46eedd]/70 rounded-full dot-bounce-2" />
              <div className="w-1.5 h-1.5 bg-[#46eedd]/70 rounded-full dot-bounce-3" />
            </div>
            <span className="text-[12px] text-[#bacac6] font-medium">{contact.name} печатает...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 px-4 pt-3 pb-8 z-50"
        style={{ background: "rgba(16,19,26,0.95)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <button className="w-12 h-12 flex items-center justify-center bg-[#1d2026] rounded-2xl text-[#bacac6] hover:text-[#46eedd] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
          <div className="flex-1 relative flex items-center">
            <input
              className="w-full bg-[#1d2026] text-[#e1e2eb] rounded-2xl px-5 py-3.5 text-[15px] outline-none"
              placeholder="Сообщение..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ caretColor: "#46eedd" }}
            />
            <button className="absolute right-3 text-[#bacac6] hover:text-[#46eedd] transition-colors">
              <span className="material-symbols-outlined">sentiment_satisfied</span>
            </button>
          </div>
          <button className="w-12 h-12 flex items-center justify-center bg-[#1d2026] rounded-2xl text-[#bacac6] hover:text-[#46eedd] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[24px]">mic</span>
          </button>
          <button onClick={sendMessage}
            className="w-12 h-12 flex items-center justify-center bg-[#46eedd] text-[#003732] rounded-2xl active:scale-90 transition-all"
            style={{ boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
            <span className="material-symbols-outlined font-bold text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
