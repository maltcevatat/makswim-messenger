import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface BottomNavProps {
  active?: "chats" | "members" | "calendar" | "calls" | "settings" | "admin" | "profile";
}

export default function BottomNav({ active }: BottomNavProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const items = [
    { id: "chats",   icon: "chat_bubble",  label: "Чаты",    path: "/" },
    { id: "members", icon: "group",        label: "Участники", path: "/members" },
    { id: "calls",   icon: "call",         label: "Звонки",   path: "/calls" },
    ...(user?.role === "admin"
      ? [{ id: "admin", icon: "shield", label: "Админ", path: "/admin" }]
      : []),
    { id: "profile", icon: "person",       label: "Профиль",  path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5"
      style={{ background: "rgba(16,19,26,0.96)", backdropFilter: "blur(24px)" }}>
      <div className="flex justify-around items-center px-2 pt-2 pb-7 max-w-lg mx-auto">
        {items.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 transition-colors"
              style={{ color: isActive ? "#46eedd" : "rgba(186,202,198,0.4)" }}>
              {isActive ? (
                <div className="w-14 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#46eedd" }}>
                  <span className="material-symbols-outlined text-[#003732] text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {item.icon}
                  </span>
                </div>
              ) : (
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              )}
              <span className="text-[9px] font-extrabold tracking-widest uppercase">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
