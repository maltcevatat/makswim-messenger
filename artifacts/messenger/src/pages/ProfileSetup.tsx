import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";

async function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = url;
  });
}

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressAvatar(file);
    setAvatar(compressed);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Введите ваше имя"); return; }
    const code = sessionStorage.getItem("makswim_pending_code");
    if (!code) { setError("Код приглашения не найден. Вернитесь и введите код снова."); return; }
    setLoading(true);
    try {
      await api.auth.setupProfile({ code, name: name.trim(), avatar_url: avatar });
      sessionStorage.removeItem("makswim_pending_code");
      await refresh();
      navigate("/");
    } catch (err: any) {
      const msg: string = err.message || "";
      if (msg.includes("413") || msg.toLowerCase().includes("too large") || msg.toLowerCase().includes("payload")) {
        setError("Фото слишком большое. Выберите другое или попробуйте уменьшить размер.");
      } else {
        setError(msg || "Ошибка при создании профиля");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10"
      style={{ background: "linear-gradient(160deg, #0d1018 0%, #10131a 60%, #0a1520 100%)" }}>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] pointer-events-none -z-0"
        style={{ background: "radial-gradient(ellipse at bottom, rgba(70,238,221,0.06) 0%, transparent 70%)" }} />

      <div className="mt-8 mb-10 z-10">
        <span className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase border border-[#46eedd]/20 text-[#bacac6]"
          style={{ background: "rgba(70,238,221,0.06)" }}>
          Шаг 1 из 1
        </span>
      </div>

      <div className="text-center mb-8 z-10">
        <h1 className="text-[2rem] font-black tracking-tight leading-tight mb-2">
          Создайте свой{" "}
          <span style={{ color: "#46eedd" }}>профиль</span>
        </h1>
        <p className="text-[#bacac6] text-[15px]">в безопасном пространстве MAKSWIM</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm z-10 flex flex-col gap-6">
        <div className="rounded-[2rem] p-6 flex flex-col gap-6"
          style={{ background: "#1d2026", boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}>

          <div className="flex flex-col items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all active:scale-95"
                style={{ background: "#10131a", border: "2px dashed rgba(70,238,221,0.2)" }}>
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[#46eedd] text-[36px] mb-1"
                      style={{ fontVariationSettings: "'FILL' 0" }}>add_a_photo</span>
                    <span className="text-[11px] font-bold text-[#bacac6]/60 tracking-widest uppercase">Фото</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#46eedd] text-[#003732] flex items-center justify-center shadow-lg active:scale-90 transition-all">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#e1e2eb]">
              Ваше имя
            </label>
            <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-colors ${error ? "border-[#ffb4ab]/50" : "border-transparent"}`}
              style={{ background: "#10131a" }}>
              <span className="material-symbols-outlined text-[#bacac6]/50 text-[20px]">person</span>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                placeholder="Как вас называть?"
                className="flex-1 bg-transparent text-[#e1e2eb] text-[16px] outline-none placeholder:text-[#bacac6]/30"
              />
            </div>
            {error ? (
              <p className="text-[#ffb4ab] text-[12px] font-medium px-1">{error}</p>
            ) : (
              <p className="text-[#bacac6]/40 text-[12px] px-1">Это имя будет видно вашим контактам.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 rounded-2xl font-bold text-[19px] text-[#003732] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 4px 24px rgba(70,238,221,0.3)" }}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" />
          ) : "Начать"}
        </button>
      </form>

      <p className="text-center text-[12px] text-[#bacac6]/30 mt-8 z-10">
        Создавая профиль, вы соглашаетесь с нашей{" "}
        <a href="#" className="text-[#46eedd]/60 underline">Политикой конфиденциальности</a>
      </p>
    </div>
  );
}
