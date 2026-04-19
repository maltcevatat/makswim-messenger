import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import BottomNav from "@/components/BottomNav";

type AdminCode = {
  id: string;
  code: string;
  grants_admin: boolean;
  is_used: boolean;
  is_revoked: boolean;
  expires_at: string | null;
  created_at: string;
};

function formatExpiry(expires_at: string | null): string {
  if (!expires_at) return "";
  const d = new Date(expires_at);
  const now = new Date();
  if (d < now) return "Истёк";
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  return `${diff}д`;
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [stats, setStats] = useState({ total_users: 0, total_codes: 0, used_codes: 0, online_users: 0 });
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showGenModal, setShowGenModal] = useState(false);
  const [genAdmin, setGenAdmin] = useState(false);
  const [genExpireDays, setGenExpireDays] = useState<number | "">(30);
  const [confirmRevoke, setConfirmRevoke] = useState<AdminCode | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadData = () =>
    Promise.all([api.admin.codes(), api.admin.stats()])
      .then(([c, s]) => { setCodes(c); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { loadData(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleGenerate() {
    setGenerating(true);
    setShowGenModal(false);
    try {
      const newCode = await api.admin.generateCode({
        grants_admin: genAdmin,
        expires_days: genExpireDays ? Number(genExpireDays) : undefined,
      });
      setCodes(prev => [newCode, ...prev]);
      setStats(s => ({ ...s, total_codes: s.total_codes + 1 }));
      showToast("Новый код создан");
    } catch { showToast("Ошибка генерации кода"); }
    finally { setGenerating(false); }
  }

  async function handleRevoke(code: AdminCode) {
    setConfirmRevoke(null);
    setRevoking(code.id);
    try {
      await api.admin.revokeCode(code.id);
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, is_revoked: true } : c));
      showToast("Код отозван");
    } catch { showToast("Ошибка отзыва кода"); }
    finally { setRevoking(null); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const activeCodes = codes.filter(c => !c.is_revoked && !c.is_used);
  const usedCodes  = codes.filter(c => c.is_used && !c.is_revoked);
  const revokedCodes = codes.filter(c => c.is_revoked);

  const statCards = [
    { label: "Всего участников",     value: String(stats.total_users), icon: "group",        color: "#46eedd" },
    { label: "Активны сейчас",       value: String(stats.online_users), icon: "person_check", color: "#46eedd" },
    { label: "Кодов создано",        value: String(stats.total_codes), icon: "key",           color: "#bdc2ff" },
    { label: "Кодов использовано",   value: String(stats.used_codes), icon: "lock",           color: "#bdc2ff" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#10131a", color: "#e1e2eb" }}>
      <div className="fixed top-0 right-0 w-[60%] h-[40%] pointer-events-none -z-10"
        style={{ background: "rgba(70,238,221,0.04)", filter: "blur(100px)" }} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl font-bold text-[13px] text-[#003732] shadow-xl"
          style={{ background: "#46eedd" }}>
          {toast}
        </div>
      )}

      {/* Revoke Confirm Modal */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-[2rem] p-6 flex flex-col gap-4"
            style={{ background: "#1d2026" }}>
            <h3 className="font-bold text-[17px] text-center">Отозвать код?</h3>
            <p className="text-[14px] text-[#bacac6]/70 text-center">
              Код <span className="font-mono font-bold text-[#e1e2eb]">{confirmRevoke.code}</span> будет деактивирован.
              {confirmRevoke.is_used && " Сессия пользователя будет завершена."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRevoke(null)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] text-[#e1e2eb]"
                style={{ background: "#272a31" }}>
                Отмена
              </button>
              <button onClick={() => handleRevoke(confirmRevoke)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] text-white"
                style={{ background: "rgba(255,80,80,0.85)" }}>
                Отозвать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowGenModal(false)}>
          <div className="w-full max-w-sm rounded-[2rem] p-6 flex flex-col gap-5 mb-4"
            style={{ background: "#1d2026" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-[17px]">Создать код</h3>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#bacac6]/50 block mb-2">
                Срок действия
              </label>
              <div className="flex gap-2 flex-wrap">
                {[7, 14, 30, 90].map(d => (
                  <button key={d}
                    onClick={() => setGenExpireDays(d)}
                    className="px-3 py-2 rounded-xl text-[13px] font-bold transition-all"
                    style={{
                      background: genExpireDays === d ? "#46eedd" : "rgba(70,238,221,0.08)",
                      color: genExpireDays === d ? "#003732" : "#46eedd",
                    }}>
                    {d}д
                  </button>
                ))}
                <button
                  onClick={() => setGenExpireDays("")}
                  className="px-3 py-2 rounded-xl text-[13px] font-bold transition-all"
                  style={{
                    background: genExpireDays === "" ? "#46eedd" : "rgba(70,238,221,0.08)",
                    color: genExpireDays === "" ? "#003732" : "#46eedd",
                  }}>
                  Без срока
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#bacac6]/50 block mb-2">
                Роль
              </label>
              <button
                onClick={() => setGenAdmin(v => !v)}
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all"
                style={{ background: genAdmin ? "rgba(70,238,221,0.12)" : "#10131a" }}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${genAdmin ? "border-[#46eedd] bg-[#46eedd]" : "border-[#bacac6]/30"}`}>
                  {genAdmin && <span className="material-symbols-outlined text-[12px] text-[#003732]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                </div>
                <span className="text-[14px] font-medium">Предоставить права администратора</span>
              </button>
            </div>

            <button onClick={handleGenerate} disabled={generating}
              className="w-full py-4 rounded-2xl font-bold text-[16px] text-[#003732] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)" }}>
              {generating ? "Создаю..." : "Создать код"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: "rgba(16,19,26,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="flex items-center px-5 py-3.5 max-w-lg mx-auto gap-3">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#bacac6] hover:text-[#46eedd] transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] font-extrabold text-[#e1e2eb]">Панель управления</h1>
            <p className="text-[11px] text-[#46eedd] font-bold tracking-wider uppercase">Администратор</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(70,238,221,0.1)" }}>
            <span className="material-symbols-outlined text-[#46eedd]">shield</span>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-lg mx-auto">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
          {statCards.map(s => (
            <div key={s.label} className="p-4 rounded-[1.5rem] flex flex-col gap-2" style={{ background: "#1d2026" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15` }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-[1.8rem] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-[#bacac6]/50 font-semibold leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Invite codes */}
        <div className="rounded-[1.5rem] p-5 mb-5" style={{ background: "#1d2026" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#e1e2eb]">Коды приглашений</h2>
              <p className="text-[12px] text-[#bacac6]/50 mt-0.5">{activeCodes.length} активных</p>
            </div>
            <button
              onClick={() => setShowGenModal(true)}
              disabled={generating}
              className="px-4 py-2.5 rounded-xl font-bold text-[13px] text-[#003732] flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #46eedd, #00d1c1)", boxShadow: "0 4px 16px rgba(70,238,221,0.25)" }}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Создать
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {codes.length === 0 && (
                <div className="py-6 flex flex-col items-center gap-2 text-center">
                  <span className="material-symbols-outlined text-[36px] text-[#bacac6]/20">key_off</span>
                  <p className="text-[#bacac6]/40 text-[13px]">Нажмите «Создать» чтобы выдать первый код</p>
                </div>
              )}
              {codes.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const invalid = c.is_revoked || (expired && !c.is_used);
                return (
                  <div key={c.id} className={`flex items-center gap-3 p-3.5 rounded-xl ${invalid ? "opacity-40" : ""}`}
                    style={{ background: "#10131a" }}>
                    <span className="material-symbols-outlined text-[18px]"
                      style={{ color: c.is_revoked ? "#ff4444" : c.is_used ? "#bacac6" : "#46eedd" }}>
                      {c.is_revoked ? "key_off" : c.is_used ? "lock" : "key"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[14px] font-bold text-[#e1e2eb] tracking-widest">{c.code}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-[#bacac6]/40">
                          {c.is_revoked ? "Отозван" : c.is_used ? "Использован" : c.grants_admin ? "Администратор" : "Пользователь"}
                        </p>
                        {c.expires_at && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${expired ? "text-[#ffb4ab] bg-[#ffb4ab]/10" : "text-[#46eedd]/70 bg-[#46eedd]/10"}`}>
                            {formatExpiry(c.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!c.is_used && !c.is_revoked && (
                        <button
                          onClick={() => copyCode(c.code)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copied === c.code ? "text-[#003732]" : "text-[#46eedd]"}`}
                          style={{ background: copied === c.code ? "#46eedd" : "rgba(70,238,221,0.1)" }}>
                          {copied === c.code ? "✓" : "Копировать"}
                        </button>
                      )}
                      {!c.is_revoked && (
                        <button
                          onClick={() => setConfirmRevoke(c)}
                          disabled={revoking === c.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#bacac6]/30 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all"
                          title="Отозвать код">
                          {revoking === c.id
                            ? <div className="w-3 h-3 border border-[#bacac6]/30 border-t-[#bacac6]/70 rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-[16px]">block</span>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members link */}
        <button
          onClick={() => navigate("/members")}
          className="w-full p-5 rounded-[1.5rem] flex items-center gap-4 text-left hover:bg-[#272a31] transition-colors active:scale-[0.98]"
          style={{ background: "#1d2026" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(70,238,221,0.1)" }}>
            <span className="material-symbols-outlined text-[#46eedd]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[15px] text-[#e1e2eb]">Список участников</h3>
            <p className="text-[12px] text-[#bacac6]/50">{stats.total_users} пользователей</p>
          </div>
          <span className="material-symbols-outlined text-[#bacac6]/30">chevron_right</span>
        </button>
      </main>

      <BottomNav active="admin" />
    </div>
  );
}
