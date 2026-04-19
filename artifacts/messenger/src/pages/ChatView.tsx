import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";

const EMOJIS = [
  "😀","😂","😍","🥰","😎","😢","😡","🤔","😴","🤯",
  "👍","👎","👋","🙏","💪","🤝","🫂","✌️","🤞","👏",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💯",
  "🔥","⭐","✨","💥","🌊","🎯","🏆","🥇","🎉","🎊",
  "🏊","🚴","🏃","🧘","🤽","🚣","⚽","🏋️","🎽","🥤",
  "✅","❌","⚠️","💬","📢","🔑","🗝️","📅","⏰","📍",
];

type MsgStatus = "sending" | "sent" | "error";

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
  client_message_id?: string;
  status?: MsgStatus;
  _localBlob?: string;
}

interface VoicePreview {
  blob: Blob;
  dataUrl: string;
  durationSec: number;
}

interface ChatViewProps { id: string; forceGroup?: boolean; }

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

function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || "";
}

function getDraftKey(chatId: string) { return `makswim_draft:${chatId}`; }

function saveDraft(chatId: string, text: string) {
  try {
    if (text) { localStorage.setItem(getDraftKey(chatId), text); }
    else { localStorage.removeItem(getDraftKey(chatId)); }
  } catch {}
}

function loadDraft(chatId: string): string {
  try { return localStorage.getItem(getDraftKey(chatId)) || ""; } catch { return ""; }
}

export default function ChatView({ id, forceGroup }: ChatViewProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isGroup = forceGroup || false;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState(() => loadDraft(id));
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [chatName, setChatName] = useState(isGroup ? "Группа" : "");
  const [chatAvatar, setChatAvatar] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voicePreview, setVoicePreview] = useState<VoicePreview | null>(null);
  const [toast, setToast] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sseConnected, setSseConnected] = useState(false);

  // Manage members (group + admin only)
  const [showManage, setShowManage] = useState(false);
  const [manageTab, setManageTab] = useState<"members" | "add">("members");
  const [chatMembers, setChatMembers] = useState<{ id: string; name: string; avatar_url: string; role: string }[]>([]);
  const [addCandidates, setAddCandidates] = useState<{ id: string; name: string; avatar_url: string; role: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
  const [addingMembers, setAddingMembers] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const messagesRef = useRef<Message[]>([]);

  messagesRef.current = messages;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Draft auto-save
  useEffect(() => {
    saveDraft(id, inputText);
  }, [id, inputText]);

  const PAGE_SIZE = 60;

  const loadMessages = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const msgs = await api.chats.messages(id, { limit: PAGE_SIZE });
      setHasMore(msgs.length === PAGE_SIZE);

      setMessages(prev => {
        // Merge: keep optimistic messages, add server messages
        const serverIds = new Set(msgs.map(m => m.id));
        const optimistic = prev.filter(m => m.status === "sending" && !serverIds.has(m.id));
        return [...msgs.map(m => ({ ...m, status: "sent" as MsgStatus })), ...optimistic];
      });

      if (!isGroup && msgs.length > 0) {
        const other = msgs.find(m => !m.outgoing);
        if (other) { setChatName(other.sender_name); setChatAvatar(other.sender_avatar); }
      }
    } catch {}
    finally { if (!opts?.silent) setLoading(false); }
  }, [id, isGroup]);

  const loadOlderMessages = async () => {
    const oldest = messages[0];
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const older = await api.chats.messages(id, { limit: PAGE_SIZE, before: oldest.created_at });
      setHasMore(older.length === PAGE_SIZE);
      if (older.length > 0) {
        setMessages(prev => [
          ...older.map(m => ({ ...m, status: "sent" as MsgStatus })),
          ...prev,
        ]);
      }
    } catch {}
    finally { setLoadingOlder(false); }
  };

  // SSE real-time connection
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setSseConnected(false);
    loadMessages();

    // Connect SSE
    const es = new EventSource(`/api/chats/${id}/stream`);
    sseRef.current = es;

    es.addEventListener("connected", () => {
      setSseConnected(true);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    });

    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data) as (Message & { type?: string });
        if (data.type === "delete") {
          setMessages(prev => prev.map(m =>
            m.id === (data as any).message_id
              ? { ...m, content: "Сообщение удалено", is_deleted: true }
              : m
          ));
          return;
        }
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          if (data.client_message_id && prev.some(m => m.client_message_id === data.client_message_id)) return prev;
          return [...prev, { ...data, status: "sent" as MsgStatus }];
        });
      } catch {}
    });

    es.addEventListener("error", () => {
      setSseConnected(false);
      // Fall back to polling every 2s
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => loadMessages({ silent: true }), 2000);
      }
    });

    es.addEventListener("ping", () => {});

    return () => {
      es.close();
      sseRef.current = null;
      setSseConnected(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [id]);


  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].status !== "sending") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isGroup && !chatName && !loading) {
      api.members.list().then(members => {
        const m = members.find(m => m.id === id);
        if (m) { setChatName(m.name); setChatAvatar(m.avatar_url); }
      }).catch(() => {});
    }
  }, [id, isGroup, chatName, loading]);

  useEffect(() => () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    if (pollingRef.current) clearInterval(pollingRef.current);
    sseRef.current?.close();
  }, []);

  async function sendMessage(content = inputText.trim(), type = "text") {
    if (!content || sending) return;
    if (!isOnline) { showToast("Нет соединения"); return; }

    const clientMsgId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: `opt-${clientMsgId}`,
      content,
      content_type: type,
      is_deleted: false,
      created_at: new Date().toISOString(),
      sender_id: user!.id,
      sender_name: user!.name,
      sender_avatar: user!.avatar_url,
      outgoing: true,
      client_message_id: clientMsgId,
      status: "sending",
    };

    if (type === "text") setInputText("");
    setMessages(prev => [...prev, optimisticMsg]);
    setSending(true);

    try {
      const msg = await api.chats.sendMessage(id, content, type, clientMsgId);
      setMessages(prev => prev.map(m =>
        m.client_message_id === clientMsgId
          ? { ...msg, status: "sent" as MsgStatus }
          : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.client_message_id === clientMsgId ? { ...m, status: "error" as MsgStatus } : m
      ));
      if (type === "text") setInputText(content);
    } finally {
      setSending(false);
    }
  }

  async function retrySend(msg: Message) {
    setMessages(prev => prev.map(m =>
      m.client_message_id === msg.client_message_id ? { ...m, status: "sending" } : m
    ));
    try {
      const sent = await api.chats.sendMessage(id, msg.content, msg.content_type, msg.client_message_id);
      setMessages(prev => prev.map(m =>
        m.client_message_id === msg.client_message_id ? { ...sent, status: "sent" as MsgStatus } : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.client_message_id === msg.client_message_id ? { ...m, status: "error" } : m
      ));
    }
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
    if (file.size > 15 * 1024 * 1024) { showToast("Файл слишком большой (макс. 15MB)"); return; }
    try {
      setSending(true);
      const compressed = await compressImage(file);
      await sendMessage(compressed, "image");
    } catch { showToast("Ошибка загрузки фото"); setSending(false); }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { showToast("Нет доступа к микрофону"); }
  }

  function cancelRecording() {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    setIsRecording(false);
    setRecordingTime(0);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
  }

  async function stopRecordingForPreview() {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    const duration = recordingTime;
    setIsRecording(false);
    setRecordingTime(0);

    await new Promise<void>(resolve => {
      const recorder = mediaRecorderRef.current!;
      const mimeType = recorder.mimeType || "audio/webm";
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        recorder.stream.getTracks().forEach(t => t.stop());
        mediaRecorderRef.current = null;

        const reader = new FileReader();
        reader.onload = () => {
          setVoicePreview({ blob, dataUrl: reader.result as string, durationSec: duration });
          resolve();
        };
        reader.onerror = () => { showToast("Ошибка обработки записи"); resolve(); };
        reader.readAsDataURL(blob);
      };
      recorder.stop();
    });
  }

  async function sendVoicePreview() {
    if (!voicePreview) return;
    const { dataUrl } = voicePreview;
    setVoicePreview(null);
    await sendMessage(dataUrl, "voice");
  }

  function discardVoicePreview() {
    setVoicePreview(null);
    audioChunksRef.current = [];
  }

  async function openManageMembers() {
    setShowManage(true);
    setManageTab("members");
    setAddSelected(new Set());
    setMembersLoading(true);
    try {
      const [members, allUsers] = await Promise.all([
        api.chats.groupMembers(id),
        api.members.list(),
      ]);
      setChatMembers(members);
      const memberIds = new Set(members.map(m => m.id));
      setAddCandidates(allUsers.filter(u => !memberIds.has(u.id)));
    } catch { showToast("Не удалось загрузить участников"); }
    finally { setMembersLoading(false); }
  }

  async function removeMember(userId: string) {
    setRemovingMemberId(userId);
    try {
      await api.chats.removeGroupMember(id, userId);
      const removed = chatMembers.find(m => m.id === userId);
      setChatMembers(prev => prev.filter(m => m.id !== userId));
      if (removed) setAddCandidates(prev => [...prev, removed].sort((a, b) => a.name.localeCompare(b.name)));
      showToast("Участник удалён");
    } catch { showToast("Ошибка"); }
    finally { setRemovingMemberId(null); }
  }

  async function addSelectedMembers() {
    if (addSelected.size === 0) return;
    setAddingMembers(true);
    try {
      await api.chats.addGroupMembers(id, [...addSelected]);
      const added = addCandidates.filter(u => addSelected.has(u.id));
      setChatMembers(prev => [...prev, ...added].sort((a, b) => a.name.localeCompare(b.name)));
      setAddCandidates(prev => prev.filter(u => !addSelected.has(u.id)));
      setAddSelected(new Set());
      setManageTab("members");
      showToast(`Добавлено: ${added.length}`);
    } catch { showToast("Ошибка добавления"); }
    finally { setAddingMembers(false); }
  }

  function toggleAddSelect(uid: string) {
    setAddSelected(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
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
    } catch { showToast("Ошибка удаления"); }
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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl font-bold text-[13px] text-[#003732] shadow-xl"
          style={{ background: "#46eedd" }}>{toast}</div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 py-2 text-[13px] font-bold"
          style={{ background: "#ff4444", color: "#fff" }}>
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          Нет соединения
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

      {/* Manage Members Modal */}
      {showManage && isGroup && user?.role === "admin" && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowManage(false)}>
          <div className="w-full max-w-lg rounded-[2rem] flex flex-col"
            style={{ background: "#1d2026", maxHeight: "80vh" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center gap-3 p-5 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(70,238,221,0.1)" }}>
                <span className="material-symbols-outlined text-[#46eedd] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[16px] text-[#e1e2eb] truncate">{chatName}</h3>
                <p className="text-[12px] text-[#bacac6]/50">
                  {membersLoading ? "Загрузка..." : `${chatMembers.length} участников`}
                </p>
              </div>
              <button onClick={() => setShowManage(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#bacac6]/50 hover:text-[#e1e2eb] transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-3 border-b border-white/5">
              <button onClick={() => setManageTab("members")}
                className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all"
                style={manageTab === "members"
                  ? { background: "rgba(70,238,221,0.15)", color: "#46eedd" }
                  : { color: "#bacac6" }}>
                Участники
              </button>
              <button onClick={() => setManageTab("add")}
                className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1"
                style={manageTab === "add"
                  ? { background: "rgba(70,238,221,0.15)", color: "#46eedd" }
                  : { color: "#bacac6" }}>
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Добавить
                {addCandidates.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(70,238,221,0.2)" }}>
                    {addCandidates.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
                </div>
              ) : manageTab === "members" ? (
                chatMembers.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-center">
                    <span className="material-symbols-outlined text-[36px] text-[#bacac6]/20">group_off</span>
                    <p className="text-[13px] text-[#bacac6]/40">Нет участников</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#10131a" }}>
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#272a31] shrink-0 flex items-center justify-center">
                          {m.avatar_url
                            ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <span className="font-bold text-[#bacac6]/50 text-[13px]">{m.name.charAt(0)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] text-[#e1e2eb] truncate">{m.name}</p>
                          {m.role === "admin" && <p className="text-[11px] text-[#46eedd]/70">Администратор</p>}
                        </div>
                        <button onClick={() => removeMember(m.id)} disabled={removingMemberId === m.id}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-[#bacac6]/30 hover:text-red-400 hover:bg-[#ffb4ab]/10 transition-all disabled:opacity-40"
                          title="Удалить из чата">
                          {removingMemberId === m.id
                            ? <div className="w-3 h-3 border border-[#bacac6]/30 border-t-[#bacac6] rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-[18px]">person_remove</span>}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                addCandidates.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-center">
                    <span className="material-symbols-outlined text-[36px] text-[#bacac6]/20">done_all</span>
                    <p className="text-[13px] text-[#bacac6]/40">Все пользователи уже в чате</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-bold text-[#bacac6]/50 uppercase tracking-wider mb-3 px-1">
                      {addSelected.size > 0 ? `${addSelected.size} выбрано` : "Выберите участников"}
                    </p>
                    <div className="space-y-1">
                      {addCandidates.map(m => {
                        const sel = addSelected.has(m.id);
                        return (
                          <button key={m.id} onClick={() => toggleAddSelect(m.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                            style={{ background: sel ? "rgba(70,238,221,0.1)" : "#10131a" }}>
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#272a31] shrink-0 flex items-center justify-center">
                              {m.avatar_url
                                ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                                : <span className="font-bold text-[#bacac6]/50 text-[13px]">{m.name.charAt(0)}</span>}
                            </div>
                            <span className="flex-1 text-[14px] font-medium text-[#e1e2eb] truncate">{m.name}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${sel ? "border-[#46eedd] bg-[#46eedd]" : "border-[#bacac6]/30"}`}>
                              {sel && <span className="material-symbols-outlined text-[12px] text-[#003732]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>

            {/* Add button */}
            {manageTab === "add" && addSelected.size > 0 && (
              <div className="p-4 pt-2 border-t border-white/5">
                <button onClick={addSelectedMembers} disabled={addingMembers}
                  className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-[#003732] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
                  {addingMembers
                    ? <><div className="w-4 h-4 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" /> Добавляю...</>
                    : <><span className="material-symbols-outlined text-[18px]">person_add</span> Добавить {addSelected.size}</>}
                </button>
              </div>
            )}
          </div>
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
                      style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  </div>
                ) : chatAvatar ? (
                  <img alt={chatName} className="w-10 h-10 rounded-full object-cover border border-white/10" src={chatAvatar} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#272a31] flex items-center justify-center">
                    <span className="text-[16px] font-black text-[#bacac6]/50">{chatName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#10131a] ${isOnline ? "bg-[#46eedd]" : "bg-[#bacac6]/30"}`} />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-[#e1e2eb] leading-tight">{chatName || "..."}</h1>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${sseConnected ? "text-[#46eedd]" : "text-[#bacac6]/40"}`}>
                  {sseConnected ? "В сети" : "Обновление..."}
                </span>
              </div>
            </div>
          </div>

          {/* Admin manage button — only in group chats */}
          {isGroup && user?.role === "admin" && (
            <button
              onClick={() => openManageMembers()}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#bacac6]/50 hover:text-[#46eedd] hover:bg-[#1d2026] transition-all active:scale-95"
              title="Управление участниками">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 px-4 max-w-lg mx-auto w-full overflow-y-auto chat-scroll flex flex-col gap-4 pt-4 mt-20 mb-36">

        {/* Load older button */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-2">
            <button
              onClick={loadOlderMessages}
              disabled={loadingOlder}
              className="px-4 py-2 rounded-2xl text-[12px] font-bold text-[#46eedd] transition-all disabled:opacity-50"
              style={{ background: "rgba(70,238,221,0.08)" }}>
              {loadingOlder
                ? <span className="flex items-center gap-2"><div className="w-3 h-3 border border-[#46eedd]/30 border-t-[#46eedd] rounded-full animate-spin" /> Загрузка...</span>
                : "↑ Загрузить старые сообщения"}
            </button>
          </div>
        )}

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
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showDateSep = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex justify-center my-2">
                      <span className="px-4 py-1 rounded-full text-[#bacac6] text-[11px] font-bold uppercase tracking-widest"
                        style={{ background: "rgba(39,42,49,0.5)", backdropFilter: "blur(8px)" }}>
                        {new Date(msg.created_at).toLocaleDateString("ru", { day: "numeric", month: "long" })}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex flex-col max-w-[88%] group relative ${msg.outgoing ? "items-end self-end ml-auto" : "items-start"}`}>
                    {isGroup && !msg.outgoing && (
                      <span className="text-[11px] text-[#46eedd] font-semibold ml-1 mb-1">{msg.sender_name}</span>
                    )}

                    {msg.content_type === "image" && !msg.is_deleted ? (
                      <div className={`rounded-2xl overflow-hidden cursor-pointer shadow-lg ${msg.outgoing ? "rounded-br-none" : "rounded-bl-none"} ${msg.status === "sending" ? "opacity-70" : ""}`}
                        style={{ maxWidth: 240 }}
                        onClick={e => msg.outgoing && showContextMenu(e, msg.id)}>
                        <img src={msg.content} alt="фото" className="w-full h-auto block" style={{ maxWidth: 240 }} />
                      </div>
                    ) : msg.content_type === "voice" && !msg.is_deleted ? (
                      <div className={`p-3 rounded-2xl shadow-lg ${msg.outgoing ? "rounded-br-none" : "rounded-bl-none bg-[#272a31]"} ${msg.status === "sending" ? "opacity-70" : ""}`}
                        style={msg.outgoing ? { background: "linear-gradient(135deg, #46eedd, #00d1c1)" } : {}}
                        onClick={e => msg.outgoing && showContextMenu(e, msg.id)}>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]"
                            style={{ color: msg.outgoing ? "#003732" : "#46eedd", fontVariationSettings: "'FILL' 1" }}>mic</span>
                          <audio controls src={msg.content} className="h-8" style={{ maxWidth: 180 }} />
                        </div>
                      </div>
                    ) : msg.outgoing ? (
                      <div className={`message-bubble p-3.5 rounded-2xl rounded-br-none shadow-lg cursor-pointer ${msg.is_deleted ? "opacity-50" : ""} ${msg.status === "sending" ? "opacity-70" : ""}`}
                        style={{ background: msg.is_deleted ? "#272a31" : "linear-gradient(135deg, #46eedd, #00d1c1)" }}
                        onClick={e => !msg.is_deleted && msg.status !== "sending" && showContextMenu(e, msg.id)}>
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
                      {msg.outgoing && (
                        <>
                          {msg.status === "sending" && (
                            <div className="w-3 h-3 border border-[#bacac6]/30 border-t-[#bacac6]/70 rounded-full animate-spin" />
                          )}
                          {msg.status === "sent" && (
                            <span className="material-symbols-outlined text-[12px] text-[#46eedd]/60" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                          )}
                          {msg.status === "error" && (
                            <button onClick={() => retrySend(msg)} title="Нажмите для повторной отправки">
                              <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">error</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

          {/* Voice Preview */}
          {voicePreview && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl"
              style={{ background: "rgba(70,238,221,0.08)", border: "1px solid rgba(70,238,221,0.2)" }}>
              <span className="material-symbols-outlined text-[#46eedd] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              <audio controls src={voicePreview.dataUrl} className="flex-1 h-8" />
              <button onClick={discardVoicePreview}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
              <button onClick={sendVoicePreview} disabled={sending}
                className="w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-50"
                style={{ background: "#46eedd" }}>
                <span className="material-symbols-outlined text-[#003732] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center justify-between px-3 py-2.5 mb-2 rounded-2xl"
              style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-[13px] font-bold">REC {formatRecordingTime(recordingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cancelRecording}
                  className="flex items-center gap-1 text-[#bacac6]/50 text-[12px] font-bold px-2.5 py-1.5 rounded-full"
                  style={{ background: "rgba(186,202,198,0.1)" }}>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  Отмена
                </button>
                <button onClick={stopRecordingForPreview}
                  className="flex items-center gap-1 text-[#46eedd] text-[12px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(70,238,221,0.15)" }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>stop_circle</span>
                  Стоп
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); setShowEmojiPicker(v => !v); }}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] active:bg-[#1d2026] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[22px]">emoji_emotions</span>
            </button>

            <button onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] active:bg-[#1d2026] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[22px]">image</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            <div className="flex-1 relative">
              <input
                className="w-full bg-[#1d2026] text-[#e1e2eb] rounded-2xl px-4 py-3.5 text-[15px] outline-none"
                placeholder={isOnline ? "Сообщение..." : "Нет соединения..."}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ caretColor: "#46eedd" }}
                disabled={!isOnline || isRecording || !!voicePreview}
              />
            </div>

            {inputText.trim() ? (
              <button onClick={() => sendMessage()} disabled={sending || !isOnline}
                className="w-12 h-12 flex items-center justify-center bg-[#46eedd] text-[#003732] rounded-2xl active:scale-90 transition-all disabled:opacity-40 shrink-0"
                style={{ boxShadow: "0 4px 16px rgba(70,238,221,0.3)" }}>
                {sending
                  ? <div className="w-5 h-5 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>}
              </button>
            ) : !isRecording && !voicePreview ? (
              <button onClick={startRecording} disabled={!isOnline}
                className="w-12 h-12 flex items-center justify-center rounded-2xl active:scale-90 transition-all disabled:opacity-40 shrink-0"
                style={{ background: "#272a31" }}>
                <span className="material-symbols-outlined text-[22px] text-[#bacac6]">mic</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
