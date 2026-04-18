import { useState } from "react";
import { useLocation } from "wouter";
import { validateCode, markCodeUsed } from "@/auth";

export default function Login() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        setError("Введите код приглашения");
        setLoading(false);
        return;
      }
      if (validateCode(trimmed)) {
        markCodeUsed(trimmed);
        localStorage.setItem("makswim_invite_code", trimmed);
        navigate("/setup");
      } else {
        setError("Неверный или уже использованный код");
        setLoading(false);
      }
    }, 800);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12"
      style={{ background: "linear-gradient(160deg, #0d1018 0%, #10131a 50%, #0a1520 100%)" }}>

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] pointer-events-none -z-0"
        style={{ background: "radial-gradient(ellipse at top, rgba(70,238,221,0.08) 0%, transparent 70%)" }} />

      {/* Logo + Title */}
      <div className="flex flex-col items-center gap-5 mt-12 z-10">
        <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-white shadow-2xl flex items-center justify-center"
          style={{ boxShadow: "0 8px 40px rgba(70,238,221,0.2)" }}>
          <img src="/makswim-logo.jpeg" alt="MAKSWIM" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-[2.2rem] font-black tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
          MAKSWIM
        </h1>
      </div>

      {/* Card */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm z-10">
        <div className="rounded-[2rem] p-6 flex flex-col gap-4"
          style={{ background: "#1d2026", boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}>
          <label className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-[#46eedd]">
            Ваш код приглашения
          </label>

          <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-colors ${error ? "border-[#ffb4ab]/50" : "border-transparent"}`}
            style={{ background: "#10131a" }}>
            <span className="material-symbols-outlined text-[#bacac6] text-[22px]">key</span>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="SNC-XXXX-XXXX"
              className="flex-1 bg-transparent text-[#e1e2eb] text-[16px] outline-none placeholder:text-[#bacac6]/30 font-mono tracking-widest"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="text-[#ffb4ab] text-[13px] font-medium -mt-1 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-[17px] text-[#003732] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 4px 24px rgba(70,238,221,0.3)" }}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#003732]/30 border-t-[#003732] rounded-full animate-spin" />
            ) : (
              <>Войти в MAKSWIM <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
            )}
          </button>

          <p className="text-center text-[13px] text-[#bacac6]/60">
            Нет кода?{" "}
            <a href="#" className="text-[#46eedd] font-semibold hover:underline">
              Запросить доступ
            </a>
          </p>
        </div>
      </form>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 z-10 mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-[#bacac6]/40 text-[11px] font-bold tracking-widest uppercase">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            END-TO-END
          </div>
          <div className="flex items-center gap-1.5 text-[#bacac6]/40 text-[11px] font-bold tracking-widest uppercase">
            <span className="material-symbols-outlined text-[14px]">visibility_off</span>
            NO LOGS
          </div>
        </div>
        <p className="text-center text-[11px] text-[#bacac6]/25 max-w-[260px] leading-relaxed">
          Ваша безопасность — наш главный приоритет. Входя в систему, вы соглашаетесь с принципами суверенности данных.
        </p>
        {/* Dots */}
        <div className="flex gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#bacac6]/20" />
          <div className="w-5 h-1.5 rounded-full bg-[#46eedd]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#bacac6]/20" />
        </div>
      </div>
    </div>
  );
}
