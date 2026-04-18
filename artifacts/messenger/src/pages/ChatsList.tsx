import { useLocation } from "wouter";
import BottomNav from "./BottomNav";

const chats = [
  {
    id: "alex",
    name: "Алекс",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuABnmny1DA7S9r8U6aT7MxugMb-Cj6-lvPCs66jWHaydjSMUu8NkSR7jp0F5_-xb8yyVNwKOtW89Ys0xdUBgwexa8qdN_kVGZieUjpMc3KZjlDv-kk_obXwj-hpUtZ6ti9Pk43TcM-W6T-zcmTT9EjW-Vzxt2izMrx8TSNsoFl-BoruA3JDj1S5EnFpKpHYlfgiacGb2IzQK_hmSFxQOfs-a4p5RrWyodgXG240NggzFBxHjtL1YckL_hIqZJvuC0kfDakPEVbKwE7x",
    lastMsg: "Вот основной мудборд. Ориентируемся на...",
    time: "14:25",
    unread: 2,
    online: true,
  },
  {
    id: "marina",
    name: "Марина Соколова",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m",
    lastMsg: "Ты видел новые макеты в Figma?",
    time: "13:58",
    unread: 0,
    online: true,
  },
  {
    id: "dmitry",
    name: "Дмитрий Игорев",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvHomBzFiUJaqwnOl1kKiH35-BFiakGFqU9Pxp5HIzjgSVCmFNTW_AM_9bAl9shr66Fz3lvuyakoShvQtXw-V7_LrfKuRW-XG2cI5SIqnnh-NllR4fdRJDc3PfyfsWf5hjAAG_9FRtiINqSGlklXOhkOFnXXKuRapR51N708sy6i6g4ys_k1RTbn-idgwWwxwPhBTfG61zxROM01JosehjahnjdZZyGCb5ruu8f3BaekEFzBKIfsdi0RMC0FVaVEXi39rdkqnVQ7fK",
    lastMsg: "Отличная работа сегодня, команда!",
    time: "12:10",
    unread: 0,
    online: false,
  },
  {
    id: "artem",
    name: "Артем Белов",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVuH-h8usX1oEMwD0dy2q8qpyQZDpxizl684KF8m0khFG5vk-jL1GL_WjhOL-CSTeC7vei2vAKT3h803jFxZ7nc2WC2GEF5YgQV7O77SZjFM40ZDg4DaG1N3Hfj95wPBZnDJ-8eWUFBBpwx3M5RWkQRfvCkmv6xo4zUjkUxyb2kwrkEPkyxUGTahm82dGQ7XTNScy_tIOZvD0ifUYoizsaNr8rZbUxMglxa2xCjNMIYgiXB8Zg1Fzqi7Vu5mO4qZ26ekpEJJcTzI_w",
    lastMsg: "Ты видел новые макеты в Фигме?",
    time: "Пятница",
    unread: 1,
    online: false,
  },
];

export default function ChatsList() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      {/* Fixed background glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(120px)" }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(52,61,150,0.08)", filter: "blur(100px)" }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.85)", backdropFilter: "blur(24px)" }}>
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#272a31] ring-2 ring-[#46eedd]/20">
              <img
                alt="User avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcueFjTeLysVx9byEKIsbBAi6RY3T1fNK1wchb1jfMrRciUjcNmZjpBNeiXUERERR6VHm8v6DD14R1TuBDj2jYW5T0-wpk5GjjFmS80wRnuPdrqAd1BoSDCzctAQRkc2Kmp9MW2vkuoBa3--5MJUiQK4nJvswLzAo1hAe6Lr1uu7cW8246TqbyXc8RfSHYwvEpuoGjMt-eVZatmX66t_Jabu3rN5o9gZ6RefculesuDW1oIMcKVTLE92AGs9CvTMpqGZOrzrJSxt-m"
              />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              MAKSWIM
            </h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#191c22] text-[#46eedd] hover:bg-[#272a31] transition-all active:scale-95">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 pt-28 pb-36">
        {/* Pinned / Story Bar */}
        <section className="mb-8">
          <div className="flex gap-4 overflow-x-auto chat-scroll pb-2">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden shadow-md ${c.online ? "ring-2 ring-[#46eedd]/60" : ""}`}>
                    <img alt={c.name} src={c.avatar} className="w-full h-full object-cover" />
                  </div>
                  {c.online && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#46eedd] rounded-full border-2 border-[#10131a]" />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#e1e2eb]/70 truncate max-w-[56px]">
                  {c.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Chats Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold tracking-tight">Сообщения</h2>
            <span className="bg-[#46eedd]/10 text-[#46eedd] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#46eedd]/20">
              {chats.filter(c => c.unread > 0).length} новых
            </span>
          </div>

          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="flex items-center gap-4 p-3 -mx-3 w-full text-left rounded-3xl hover:bg-[#191c22] transition-all cursor-pointer group active:bg-[#272a31]/50"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md">
                    <img alt={chat.name} className="w-full h-full object-cover" src={chat.avatar} />
                  </div>
                  {chat.online && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#46eedd] rounded-full border-2 border-[#10131a]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-[#e1e2eb] truncate">{chat.name}</h4>
                    <span className="text-[11px] text-[#bacac6]/70 font-medium ml-2 shrink-0">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-[14px] text-[#bacac6] truncate">{chat.lastMsg}</p>
                    {chat.unread > 0 && (
                      <div className="bg-[#46eedd] min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ boxShadow: "0 2px 8px rgba(70,238,221,0.2)" }}>
                        <span className="text-[10px] font-black text-[#003732]">{chat.unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate("/chat/alex")}
        className="fixed right-6 bottom-32 w-16 h-16 rounded-2xl flex items-center justify-center text-[#003732] shadow-2xl z-40 active:scale-90 hover:scale-105 transition-all"
        style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 8px 30px rgba(70,238,221,0.3)" }}>
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'wght' 500" }}>edit_square</span>
      </button>

      <BottomNav active="chats" />
    </div>
  );
}
