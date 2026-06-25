// src/components/SettingsModal/sections/RemoteSection.jsx
// Settings tab for the Remote Control feature.

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { HiDeviceMobile, HiLockClosed, HiLockOpen, HiEye, HiEyeOff, HiCheckCircle, HiX } from "react-icons/hi";
import { SectionHeader } from "./shared";
import { hasPasscode, savePasscode, clearPasscode, verifyPasscode } from "../../../remote/passcodeUtils";

const TOKEN_TTL_MS = 5 * 60 * 1000;

// ── QR panel with ref-driven timer bar (no React re-renders in the animation loop) ──
function QRPanel({ remoteUrl }) {
  const barRef  = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => {
    if (!remoteUrl) return;
    let id;
    const tick = () => {
      const raw = localStorage.getItem("mosque_room_token");
      if (!raw) return;
      const { expiresAt } = JSON.parse(raw);
      const remaining = Math.max(0, expiresAt - Date.now());
      const pct   = remaining / TOKEN_TTL_MS;
      const color = pct > 0.5 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
      if (barRef.current) {
        barRef.current.style.width      = `${pct * 100}%`;
        barRef.current.style.background = color;
      }
      if (timeRef.current) {
        const mm = Math.floor(remaining / 60000);
        const ss = Math.floor((remaining % 60000) / 1000);
        timeRef.current.textContent  = `${mm}:${String(ss).padStart(2, "0")}`;
        timeRef.current.style.color  = color;
      }
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [remoteUrl]);

  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(remoteUrl ?? "");

  return (
    <div className="flex flex-col gap-6">
      {isLocalhost && (
        <div className="flex items-start gap-4 px-6 py-5 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xl font-bold leading-relaxed">
          ⚠ TV po ekzekutohet nga <strong>localhost</strong>. Telefoni nuk e hap dot këtë QR. Hape me adresën IP të rrjetit (p.sh. <strong>192.168.x.x:5173</strong>) ose me adresën e hostuar (Vercel).
        </div>
      )}
      <div className="flex gap-10 items-center">
        <div className="shrink-0 p-3 bg-white rounded-[1.5rem] shadow-[0_0_40px_rgba(16,185,129,0.15)]">
          <QRCodeSVG value={remoteUrl} size={148} bgColor="#ffffff" fgColor="#0f172a" />
        </div>
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <div className="text-4xl font-black text-white uppercase leading-none mb-3">
              Skanoni QR Kodin
            </div>
            <div className="text-xl text-zinc-500 font-medium leading-relaxed">
              Hapni kamerën e telefonit dhe skanoni kodin për t'u lidhur me telekomandën.
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-zinc-600 uppercase tracking-widest">Koha e mbetur</span>
              <span ref={timeRef} className="text-2xl font-black tabular-nums" style={{ fontFamily: "monospace" }} />
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div ref={barRef} className="h-full rounded-full" style={{ width: "100%", transition: "width 1s linear, background 0.5s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Strength rules ─────────────────────────────────────────────────────────────
const RULES = [
  { label: "Minimum 8 karaktere",          test: (p) => p.length >= 8 },
  { label: "Të paktën 1 numër",            test: (p) => /\d/.test(p) },
  { label: "Të paktën 1 shkronjë e madhe", test: (p) => /[A-Z]/.test(p) },
  { label: "Të paktën 1 karakter special", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

// ── Password input (TV-friendly, large text) ───────────────────────────────────
function PasswordField({ label, value, onChange, placeholder = "••••••••" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-6">
      <label className="text-emerald-500 font-black uppercase text-2xl tracking-[0.2em] px-4 leading-none">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          spellCheck={false}
          className="w-full bg-black/40 border-2 border-white/5 py-9 px-10 text-white text-4xl font-black outline-none focus:border-emerald-500/50 hover:border-emerald-500/30 transition-all rounded-[2.5rem] shadow-inner pr-28"
        />
        <button
          onClick={() => setShow(!show)}
          tabIndex={-1}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-3 text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          {show
            ? <HiEyeOff className="text-4xl" />
            : <HiEye    className="text-4xl" />}
        </button>
      </div>
    </div>
  );
}

// ── Strength bar ───────────────────────────────────────────────────────────────
function StrengthBar({ password }) {
  if (!password) return null;
  const score  = RULES.filter((r) => r.test(password)).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#10b981"];
  const labels = ["Shumë dobët", "Dobët", "Mirë", "Fortë"];
  return (
    <div className="mt-6 px-4">
      <div className="flex gap-2 mb-4">
        {[0,1,2,3].map((i) => (
          <div key={i} className="h-2 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score-1] : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      {score > 0 && (
        <div className="text-lg font-black uppercase tracking-widest mb-4"
          style={{ color: colors[score-1] }}>
          {labels[score-1]}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {RULES.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-xl font-bold"
            style={{ color: r.test(password) ? "#10b981" : "rgba(255,255,255,0.2)" }}>
            {r.test(password)
              ? <HiCheckCircle className="text-2xl shrink-0" />
              : <div className="w-5 h-5 rounded-full border-2 border-white/10 shrink-0" />}
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feedback banner ────────────────────────────────────────────────────────────
function Banner({ type, msg }) {
  if (!msg) return null;
  const ok = type === "success";
  return (
    <div className={`flex items-center gap-4 px-8 py-6 rounded-[2rem] text-2xl font-black ${
      ok
        ? "bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400"
        : "bg-red-500/10 border-2 border-red-500/20 text-red-400"
    }`}>
      {ok ? <HiCheckCircle className="text-4xl shrink-0" /> : <HiX className="text-4xl shrink-0" />}
      {msg}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RemoteSection({ remoteUrl, connected, remoteName }) {
  const [mode, setMode]             = useState("idle"); // idle | set | change | remove
  const [passcodeExists, setPasscodeExists] = useState(false);
  const [currentVal, setCurrentVal] = useState("");
  const [newVal, setNewVal]         = useState("");
  const [confirmVal, setConfirmVal] = useState("");
  const [loading, setLoading]       = useState(false);
  const [feedback, setFeedback]     = useState(null); // { type, msg }

  useEffect(() => { setPasscodeExists(hasPasscode()); }, []);

  function resetForm() {
    setCurrentVal(""); setNewVal(""); setConfirmVal("");
    setFeedback(null); setMode("idle");
  }

  function showFeedback(type, msg) {
    setFeedback({ type, msg });
    if (type === "success") setTimeout(resetForm, 2500);
  }

  async function handleSave() {
    if (newVal.length < 8)        return showFeedback("error", "Minimum 8 karaktere.");
    if (newVal !== confirmVal)     return showFeedback("error", "Fjalëkalimet nuk përputhen.");
    setLoading(true);
    if (mode === "change") {
      const ok = await verifyPasscode(currentVal);
      if (!ok) { setLoading(false); return showFeedback("error", "Fjalëkalimi aktual është i gabuar."); }
    }
    await savePasscode(newVal);
    setPasscodeExists(true);
    showFeedback("success", mode === "change" ? "Fjalëkalimi u ndryshua." : "Fjalëkalimi u vendos me sukses.");
    setLoading(false);
  }

  async function handleRemove() {
    setLoading(true);
    const ok = await verifyPasscode(currentVal);
    if (!ok) { setLoading(false); return showFeedback("error", "Fjalëkalimi është i gabuar."); }
    clearPasscode();
    setPasscodeExists(false);
    showFeedback("success", "Fjalëkalimi u hoq. Tani vetëm QR kodi lejohet.");
    setLoading(false);
  }

  // ── IDLE ───────────────────────────────────────────────────────────────────
  if (mode === "idle") return (
    <div>
      <SectionHeader
        icon={HiDeviceMobile}
        title="Remote"
        description="Telekomanda dhe siguria e lidhjes."
      />

      {/* QR / Connection panel */}
      <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 mb-10">
        <div className="text-emerald-500 font-black uppercase text-xl tracking-[0.2em] mb-8">
          Lidhja me Remote
        </div>

        {connected ? (
          <div className="flex items-center gap-8 py-2">
            <div className="p-6 rounded-[2rem] bg-emerald-500/15">
              <HiDeviceMobile className="text-5xl text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-black text-emerald-400 uppercase leading-none mb-2">
                {remoteName || "Remote"} i lidhur
              </div>
              <div className="text-xl text-zinc-500 font-medium">Lidhja është aktive</div>
            </div>
            <div className="px-6 py-3 rounded-full bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/20 text-xl font-black uppercase tracking-widest">
              AKTIV
            </div>
          </div>
        ) : remoteUrl ? (
          <QRPanel remoteUrl={remoteUrl} />
        ) : (
          <div className="text-xl text-zinc-500 font-medium animate-pulse py-4">
            Duke inicializuar lidhjen…
          </div>
        )}
      </div>

      {/* Status card */}
      <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 mb-10">
        <div className="flex items-center gap-8 mb-8 pb-8 border-b border-white/5">
          <div className={`p-6 rounded-[2rem] ${passcodeExists ? "bg-emerald-500/15" : "bg-white/5"}`}>
            {passcodeExists
              ? <HiLockClosed className="text-5xl text-emerald-400" />
              : <HiLockOpen   className="text-5xl text-zinc-500" />}
          </div>
          <div className="flex-1">
            <div className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">
              {passcodeExists ? "Fjalëkalimi është aktiv" : "Nuk ka fjalëkalim"}
            </div>
            <div className="text-xl text-zinc-500 font-medium">
              {passcodeExists
                ? "Stafi mund të lidhet nga çdo rrjet në çdo kohë"
                : "Vetëm QR kodi lejohet (duhet të jesh në rrjetin e xhamisë)"}
            </div>
          </div>
          <div className={`px-6 py-3 rounded-full text-xl font-black uppercase tracking-widest ${
            passcodeExists
              ? "bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/20"
              : "bg-white/5 text-zinc-500 border-2 border-white/5"
          }`}>
            {passcodeExists ? "AKTIV" : "JOAKTIV"}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[
            "QR kodi skadet çdo 5 minuta — kërkon prani fizike në xhami",
            "Fjalëkalimi lejon lidhje nga shtëpia ose çdo rrjet tjetër",
            "Nëse QR skadeton, stafi mund të hyjë me fjalëkalim",
          ].map((t) => (
            <div key={t} className="flex items-start gap-4 text-xl text-zinc-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50 mt-3 shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4">
        {!passcodeExists ? (
          <button
            onClick={() => setMode("set")}
            className="flex items-center justify-center gap-5 py-8 bg-gradient-to-br from-emerald-400 to-emerald-600 text-black rounded-[2rem] font-black text-2xl uppercase tracking-[0.15em] hover:brightness-110 hover:scale-[1.01] transition-all active:scale-95 shadow-lg"
          >
            <HiLockClosed className="text-3xl" />
            Vendos Fjalëkalim
          </button>
        ) : (
          <>
            <button
              onClick={() => setMode("change")}
              className="flex items-center justify-center gap-5 py-8 bg-gradient-to-br from-emerald-400 to-emerald-600 text-black rounded-[2rem] font-black text-2xl uppercase tracking-[0.15em] hover:brightness-110 transition-all active:scale-95 shadow-lg"
            >
              <HiLockClosed className="text-3xl" />
              Ndrysho Fjalëkalimin
            </button>
            <button
              onClick={() => setMode("remove")}
              className="flex items-center justify-center gap-5 py-8 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-[2rem] font-black text-2xl uppercase tracking-[0.15em] border-2 border-red-500/20 hover:border-red-500 transition-all active:scale-95"
            >
              <HiLockOpen className="text-3xl" />
              Hiq Fjalëkalimin
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── REMOVE ─────────────────────────────────────────────────────────────────
  if (mode === "remove") return (
    <div>
      <SectionHeader icon={HiLockOpen} title="Hiq Fjalëkalimin" description="Pas heqjes, vetëm QR kodi do të lejohet." />
      <div className="space-y-10">
        <PasswordField label="Fjalëkalimi aktual" value={currentVal} onChange={setCurrentVal} />
        <Banner {...(feedback ?? {})} />
        <div className="flex gap-6">
          <button onClick={resetForm}
            className="flex-1 py-8 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-[2rem] font-black text-2xl uppercase tracking-widest transition-all active:scale-95">
            Anulo
          </button>
          <button onClick={handleRemove} disabled={!currentVal || loading}
            className={`flex-1 py-8 rounded-[2rem] font-black text-2xl uppercase tracking-widest transition-all active:scale-95 ${
              currentVal && !loading
                ? "bg-red-500 hover:bg-red-400 text-white"
                : "bg-red-500/10 text-red-500/30 cursor-not-allowed"
            }`}>
            {loading ? "Duke hequr…" : "Hiq"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── SET / CHANGE ────────────────────────────────────────────────────────────
  const canSave = !loading && newVal && newVal === confirmVal && (mode === "set" || currentVal);
  return (
    <div>
      <SectionHeader
        icon={HiLockClosed}
        title={mode === "set" ? "Vendos Fjalëkalim" : "Ndrysho Fjalëkalimin"}
        description={mode === "set"
          ? "Cakto fjalëkalimin për lidhje nga rrjetet e jashtme."
          : "Fut fjalëkalimin aktual, pastaj cakto të riun."}
      />

      <div className="space-y-10">
        {mode === "change" && (
          <PasswordField label="Fjalëkalimi aktual" value={currentVal} onChange={setCurrentVal} />
        )}

        <PasswordField label="Fjalëkalimi i ri" value={newVal} onChange={setNewVal} />
        <StrengthBar password={newVal} />

        <PasswordField label="Konfirmo fjalëkalimin" value={confirmVal} onChange={setConfirmVal} />
        {confirmVal && confirmVal !== newVal && (
          <div className="text-2xl font-black text-red-400 px-4">⚠ Fjalëkalimet nuk përputhen</div>
        )}

        <Banner {...(feedback ?? {})} />

        <div className="flex gap-6">
          <button onClick={resetForm}
            className="flex-1 py-8 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-[2rem] font-black text-2xl uppercase tracking-widest transition-all active:scale-95">
            Anulo
          </button>
          <button onClick={handleSave} disabled={!canSave}
            className={`flex-1 flex items-center justify-center gap-4 py-8 rounded-[2rem] font-black text-2xl uppercase tracking-[0.15em] transition-all active:scale-95 ${
              canSave
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-black hover:brightness-110"
                : "bg-emerald-500/10 text-emerald-500/20 cursor-not-allowed"
            }`}>
            <HiCheckCircle className="text-3xl" />
            {loading ? "Duke ruajtur…" : "Ruaj"}
          </button>
        </div>
      </div>
    </div>
  );
}
