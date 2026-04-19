import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";

const GROUP_CHAT_ID = "00000000-0000-0000-0000-000000000001";

interface Message {
  id: string;
  content: string;
  content_type: string;
  is_deleted: boolean;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  outgoing: boolean;
}

interface ChatViewProps {
  id: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatView({ id }: ChatViewProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isGroup = id === GROUP_CHAT_ID;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatName, setChatName] = useState(isGroup ? "Общий чат" : "");
  const [chatAvatar, setChatAvatar] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await api.chats.messages(id);
      setMessages(msgs);
      if (!isGroup && msgs.length > 0) {
        const other = msgs.find(m => !m.outgoing);
        if (other) { setChatName(other.sender_name); setChatAvatar(other.sender_avatar); }
      }
    } catch {}
    finally { setLoading(false); }
  }, [id, isGroup]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
    // Poll every 3s
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Resolve chat name for personal chats from members
  useEffect(() => {
    if (!isGroup && !chatName && !loading) {
      api.members.list().then(members => {
        const m = members.find(m => m.id === id);
        if (m) { setChatName(m.name); setChatAvatar(m.avatar_url); }
      }).catch(() => {});
    }
  }, [id, isGroup, chatName, loading]);

  async function sendMessage() {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      const msg = await api.chats.sendMessage(id, text) as Message;
      setMessages(prev => [...prev, msg]);
    } catch {}
    finally { setSending(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function showContextMenu(e: React.MouseEvent, msgId: string) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY - 100, msgId });
  }

  async function deleteMessage() {
    if (!contextMenu) return;
    try {
      await api.chats.deleteMessage(contextMenu.msgId);
      setMessages(prev => prev.map(m =>
        m.id === contextMenu.msgId ? { ...m, content: "Сообщение удалено", is_deleted: true } : m
      ));
    } catch {}
    setContextMenu(null);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#10131a", color: "#e1e2eb" }}
      onClick={() => setContextMenu(null)}>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu active p-1.5 fixed z-[999]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}>
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
                {isGroup ? (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
                    <span className="material-symbols-outlined text-[#003732] text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                  </div>
                ) : chatAvatar ? (
                  <img alt={chatName} className="w-10 h-10 rounded-full object-cover border border-white/10" src={chatAvatar} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#272a31] flex items-center justify-center">
                    <span className="text-[16px] font-black text-[#bacac6]/50">
                      {chatName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#46eedd] rounded-full border-2 border-[#10131a]" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-[#e1e2eb] leading-tight">
                  {chatName || (isGroup ? "Общий чат" : "...")}
                </h1>
                <span className="text-[11px] text-[#46eedd] font-semibold uppercase tracking-wider">В сети</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/calls")}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] active:bg-[#1d2026] transition-colors">
              <span className="material-symbols-outlined">call</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 px-4 max-w-lg mx-auto w-full overflow-y-auto chat-scroll flex flex-col gap-4 pt-4 mt-20 mb-24">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#bacac6]/20">chat</span>
            <p className="text-[#bacac6]/40 text-[14px]">Начните общение</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center my-2">
              <span className="px-4 py-1 rounded-full text-[#bacac6] text-[11px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(39,42,49,0.5)", backdropFilter: "blur(8px)" }}>
                Сегодня
              </span>
            </div>

            {messages.map(msg => (
              <div key={msg.id}
                className={`flex flex-col max-w-[88%] group relative ${msg.outgoing ? "items-end self-end" : "items-start"}`}>
                {isGroup && !msg.outgoing && (
                  <span className="text-[11px] text-[#46eedd] font-semibold ml-1 mb-1">{msg.sender_name}</span>
                )}
                {msg.outgoing ? (
                  <div className={`message-bubble p-3.5 rounded-2xl rounded-br-none shadow-lg cursor-pointer ${msg.is_deleted ? "opacity-50" : ""}`}
                    style={{ background: msg.is_deleted ? "#272a31" : "linear-gradient(135deg, #46eedd, #00d1c1)" }}
                    onClick={e => !msg.is_deleted && showContextMenu(e, msg.id)}>
                    <p className={`text-[15px] leading-[1.4] font-medium ${msg.is_deleted ? "italic text-[#bacac6]/60" : "text-[#003732]"}`}>
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div className={`message-bubble bg-[#272a31] p-3.5 rounded-2xl rounded-bl-none shadow-sm cursor-pointer ${msg.is_deleted ? "opacity-50" : ""}`}
                    onClick={e => !msg.is_deleted && (user?.role === "admin") && showContextMenu(e, msg.id)}>
                    <p className={`text-[15px] leading-[1.4] ${msg.is_deleted ? "italic text-[#bacac6]/40" : "text-[#e1e2eb]"}`}>
                      {msg.content}
                    </p>
                  </div>
                )}
                <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${msg.outgoing ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-[#bacac6]/50 font-medium">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 px-4 pt-3 pb-8 z-50"
        style={{ background: "rgba(16,19,26,0.95)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <div className="flex-1 relative flex items-center">
            <input
              className="w-full bg-[#1d2026] text-[#e1e2eb] rounded-2xl px-5 py-3.5 text-[15px] outline-none"
              placeholder="Сообщение..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ caretColor: "#46eedd" }}
            />
          </div>
          <button onClick={sendMessage} disabled={sending || !inputText.trim()}
            className="w-12 h-12 flex items-center justify-center bg-[#46eedd] text-[#003732] rounded-2xl active:scale-90 transition-all disabled:opacity-40"
            style={{ boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
            {sending
              ? <div className="w-5 h-5 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" />
              : <span className="material-symbols-outlined font-bold text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>send</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
