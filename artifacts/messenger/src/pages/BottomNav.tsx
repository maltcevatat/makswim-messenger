import { useLocation } from "wouter";

type NavTab = "chats" | "calendar" | "profile";

interface BottomNavProps {
  active: NavTab;
}

export default function BottomNav({ active }: BottomNavProps) {
  const [, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5 rounded-t-[2.5rem] shadow-2xl"
      style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
      <div className="flex justify-around items-center w-full px-8 pt-4 pb-8 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center transition-all duration-300 ${active === "chats" ? "" : "text-[#bacac6]/40 hover:text-[#46eedd]"}`}
        >
          {active === "chats" ? (
            <>
              <div className="bg-[#46eedd] rounded-2xl w-14 h-10 flex items-center justify-center shadow-lg mb-1"
                style={{ boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
                <span className="material-symbols-outlined text-[#003732] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#46eedd]">Чаты</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl mb-1">chat_bubble</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Чаты</span>
            </>
          )}
        </button>

        <button
          onClick={() => navigate("/calendar")}
          className={`flex flex-col items-center justify-center transition-all duration-300 group ${active === "calendar" ? "text-[#46eedd]" : "text-[#bacac6]/40 hover:text-[#46eedd]"}`}
        >
          <span className={`material-symbols-outlined text-2xl mb-1 ${active === "calendar" ? "" : "group-hover:scale-110"}`}
            style={active === "calendar" ? { fontVariationSettings: "'FILL' 1" } : {}}>
            calendar_today
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Календарь</span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center justify-center transition-all duration-300 group ${active === "profile" ? "" : "text-[#bacac6]/40 hover:text-[#46eedd]"}`}
        >
          {active === "profile" ? (
            <>
              <div className="bg-gradient-to-br from-[#46eedd] to-[#00d1c1] rounded-2xl px-6 py-2 mb-0 shadow-[0_4px_20px_rgba(70,238,221,0.3)] flex flex-col items-center">
                <span className="material-symbols-outlined text-[#003732] text-2xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#003732]">Профиль</span>
              </div>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl mb-1 group-hover:scale-110">person</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Профиль</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
