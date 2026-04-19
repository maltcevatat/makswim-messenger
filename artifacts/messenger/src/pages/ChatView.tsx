import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";

const GROUP_CHAT_ID = "00000000-0000-0000-0000-000000000001";

const EMOJIS = [
  "😀","😂","😍","🥰","😎","😢","😡","🤔","😴","🤯",
  "👍","👎","👋","🙏","💪","🤝","🫂","✌️","🤞","👏",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💯",
  "🔥","⭐","✨","💥","🌊","🎯","🏆","🥇","🎉","🎊",
  "🏊","🚴","🏃","🧘","🤽","🚣","⚽","🏋️","🎽","🥤",
  "✅","❌","⚠️","💬","📢","🔑","🗝️","📅","⏰","📍",
];

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

interface ChatViewProps { id: string; }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

async function compressImage(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [toast, setToast] = useState("");
  const [showCallOverlay, setShowCallOverlay] = useState<"audio" | "video" | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

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
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isGroup && !chatName && !loading) {
      api.members.list().then(members => {
        const m = members.find(m => m.id === id);
        if (m) { setChatName(m.name); setChatAvatar(m.avatar_url); }
      }).catch(() => {});
    }
  }, [id, isGroup, chatName, loading]);

  async function sendMessage(content = inputText.trim(), type = "text") {
    if (!content || sending) return;
    if (type === "text") setInputText("");
    setSending(true);
    try {
      const msg = await api.chats.sendMessage(id, content, type) as Message;
      setMessages(prev => [...prev, msg]);
    } catch { showToast("Ошибка отправки"); }
    finally { setSending(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function insertEmoji(emoji: string) {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      setSending(true);
      const compressed = await compressImage(file);
      await sendMessage(compressed, "image");
    } catch { showToast("Ошибка загрузки фото"); setSending(false); }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { showToast("Нет доступа к микрофону"); }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    return new Promise<void>(resolve => {
      mediaRecorderRef.current!.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
        const reader = new FileReader();
        reader.onload = async () => {
          await sendMessage(reader.result as string, "voice");
          resolve();
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current!.stop();
    });
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

  function formatRecordingTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#10131a", color: "#e1e2eb" }}
      onClick={() => { setContextMenu(null); setShowEmojiPicker(false); }}>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl font-bold text-[13px] text-[#003732] shadow-xl"
          style={{ background: "#46eedd" }}>{toast}</div>
      )}

      {/* Call overlay */}
      {showCallOverlay && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-8"
          style={{ background: "rgba(16,19,26,0.97)", backdropFilter: "blur(24px)" }}>
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#46eedd]/30">
            {chatAvatar
              ? <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-[#272a31] flex items-center justify-center">
                  <span className="text-[40px] font-black text-[#bacac6]/30">{chatName.charAt(0)}</span>
                </div>}
          </div>
          <div className="text-center">
            <h2 className="text-[22px] font-bold text-[#e1e2eb]">{chatName}</h2>
            <p className="text-[#46eedd] text-[14px] mt-1 animate-pulse">
              {showCallOverlay === "video" ? "Видеозвонок..." : "Голосовой звонок..."}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => { setShowCallOverlay(null); showToast("Звонок завершён"); }}
              className="w-16 h-16 rounded-full bg-[#ff4444] flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>call_end</span>
            </button>
          </div>
        </div>
      )}

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
                    <span className="text-[16px] font-black text-[#bacac6]/50">{chatName.charAt(0).toUpperCase()}</span>
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
            {!isGroup && (
              <>
                <button onClick={() => setShowCallOverlay("audio")}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] active:bg-[#1d2026] transition-colors">
                  <span className="material-symbols-outlined text-[22px]">call</span>
                </button>
                <button onClick={() => setShowCallOverlay("video")}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] active:bg-[#1d2026] transition-colors">
                  <span className="material-symbols-outlined text-[22px]">videocam</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 px-4 max-w-lg mx-auto w-full overflow-y-auto chat-scroll flex flex-col gap-4 pt-4 mt-20 mb-28">
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

                {msg.content_type === "image" && !msg.is_deleted ? (
                  <div className={`rounded-2xl overflow-hidden cursor-pointer shadow-lg ${msg.outgoing ? "rounded-br-none" : "rounded-bl-none"}`}
                    style={{ maxWidth: 240 }}
                    onClick={e => msg.outgoing && showContextMenu(e, msg.id)}>
                    <img src={msg.content} alt="фото" className="w-full h-auto block" style={{ maxWidth: 240 }} />
                  </div>
                ) : msg.content_type === "voice" && !msg.is_deleted ? (
                  <div className={`p-3 rounded-2xl shadow-lg ${msg.outgoing ? "rounded-br-none" : "rounded-bl-none bg-[#272a31]"}`}
                    style={msg.outgoing ? { background: "linear-gradient(135deg, #46eedd, #00d1c1)" } : {}}
                    onClick={e => msg.outgoing && showContextMenu(e, msg.id)}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: msg.outgoing ? "#003732" : "#46eedd", fontVariationSettings: "'FILL' 1" }}>mic</span>
                      <audio controls src={msg.content} className="h-8" style={{ maxWidth: 180 }} />
                    </div>
                  </div>
                ) : msg.outgoing ? (
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

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="fixed bottom-28 left-4 right-4 z-50 max-w-lg mx-auto rounded-3xl p-4 grid grid-cols-10 gap-2"
          style={{ background: "#1d2026", boxShadow: "0 -4px 32px rgba(0,0,0,0.5)" }}
          onClick={e => e.stopPropagation()}>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={() => insertEmoji(emoji)}
              className="text-[22px] flex items-center justify-center aspect-square rounded-xl hover:bg-[#272a31] active:scale-90 transition-all">
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 px-4 pt-3 pb-8 z-40"
        style={{ background: "rgba(16,19,26,0.95)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-lg mx-auto">

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center justify-between px-2 py-2 mb-2 rounded-2xl"
              style={{ background: "rgba(255,68,68,0.1)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-[13px] font-bold">Запись {formatRecordingTime(recordingTime)}</span>
              </div>
              <button onClick={stopRecording}
                className="text-red-400 text-[12px] font-bold px-3 py-1 rounded-full border border-red-400/30">
                Отправить
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Emoji button */}
            <button onClick={e => { e.stopPropagation(); setShowEmojiPicker(v => !v); }}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] active:bg-[#1d2026] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[22px]">emoji_emotions</span>
            </button>

            {/* Image upload */}
            <button onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] active:bg-[#1d2026] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[22px]">image</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                className="w-full bg-[#1d2026] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[15px] outline-none"
                placeholder="Сообщение..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ caretColor: "#46eedd" }}
              />
            </div>

            {/* Voice / Send */}
            {inputText.trim() ? (
              <button onClick={() => sendMessage()} disabled={sending}
                className="w-12 h-12 flex items-center justify-center bg-[#46eedd] text-[#003732] rounded-2xl active:scale-90 transition-all disabled:opacity-40 shrink-0"
                style={{ boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
                {sending
                  ? <div className="w-5 h-5 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" />
                  : <span className="material-symbols-outlined font-bold text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>send</span>}
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onTouchStart={startRecording}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shrink-0 ${
                  isRecording
                    ? "bg-red-500 animate-pulse"
                    : "bg-[#1d2026] text-[#bacac6] hover:text-[#46eedd]"
                }`}>
                <span className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: isRecording ? "'FILL' 1" : "normal" }}>
                  {isRecording ? "stop" : "mic"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
