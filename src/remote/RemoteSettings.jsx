// remote/RemoteSettings.jsx — Phone-side full settings editor.
//
// Renders dedicated, compact mobile forms for every TV settings section
// (except Remote). Edits are applied live: each change calls `patch(partial)`,
// which the parent sends to the TV as a SETTINGS_PATCH and merges into the
// local mirror so the UI updates instantly.
//
// Field semantics (keys, options, conditional visibility) mirror the TV's
// SettingsModal sections one-to-one.

import React, { useState } from "react";
import profiles from "../data/profiles.json";

// ── Mobile field primitives ────────────────────────────────────────────────
// Visual language mirrors the TV SettingsModal: emerald accents, rounded glass
// cards, bold uppercase labels — scaled for a phone.

function Card({ children }) {
  return <div style={s.card}>{children}</div>;
}

function FieldHead({ label, hint }) {
  return (
    <div style={s.fieldHead}>
      <div style={s.fieldLabel}>{label}</div>
      {hint && <div style={s.fieldHint}>{hint}</div>}
    </div>
  );
}

function Toggle({ label, hint, value, onChange, onText = "Aktiv", offText = "Jo Aktiv" }) {
  return (
    <Card>
      <FieldHead label={label} hint={hint} />
      <div style={s.segWrap}>
        <button style={{ ...s.seg, ...(value ? s.segOff : s.segNeutral) }} onClick={() => onChange(false)}>{offText}</button>
        <button style={{ ...s.seg, ...(value ? s.segActive : s.segOff) }} onClick={() => onChange(true)}>{onText}</button>
      </div>
    </Card>
  );
}

function Segmented({ label, hint, value, options, onChange }) {
  return (
    <Card>
      <FieldHead label={label} hint={hint} />
      <div style={s.segWrap}>
        {options.map((opt) => (
          <button
            key={opt.value}
            style={{ ...s.seg, ...(value === opt.value ? s.segActive : s.segOff) }}
            onClick={() => onChange(opt.value)}
          >{opt.label}</button>
        ))}
      </div>
    </Card>
  );
}

function TextField({ label, hint, value, onChange, placeholder, mono }) {
  return (
    <Card>
      <FieldHead label={label} hint={hint} />
      <input
        style={{ ...s.input, ...(mono ? { fontFamily: "monospace", textAlign: "center" } : {}) }}
        value={value ?? ""}
        spellCheck={false}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  );
}

function TextArea({ label, hint, value, onChange, placeholder }) {
  return (
    <Card>
      <FieldHead label={label} hint={hint} />
      <textarea
        style={s.textarea}
        rows={5}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  );
}

function TimeField({ label, hint, value, onChange }) {
  return (
    <Card>
      <FieldHead label={label} hint={hint} />
      <input
        type="time"
        style={{ ...s.input, textAlign: "center", letterSpacing: "0.1em" }}
        value={value && value !== "" ? value : "00:00"}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  );
}

function NumberField({ label, hint, value, unit, min = 0, onChange }) {
  const v = Number(value) || 0;
  const set = (n) => onChange(Math.max(min, n));
  return (
    <Card>
      <FieldHead label={label} hint={hint} />
      <div style={s.stepRow}>
        <button style={s.stepBtn} onClick={() => set(v - 1)}>−</button>
        <div style={s.stepVal}>
          {v}{unit && <span style={s.stepUnit}>{unit}</span>}
        </div>
        <button style={s.stepBtn} onClick={() => set(v + 1)}>+</button>
      </div>
    </Card>
  );
}

// durations may be stored in ms (legacy) or minutes; normalise to minutes.
const toMin = (raw) => (raw > 1000 ? Math.round(raw / 60000) : (raw || 0));

// ── Section forms ──────────────────────────────────────────────────────────
function IdentityForm({ st, patch }) {
  if (st.appMode !== "mosque") {
    return <div style={s.note}>Mënyra "Shtëpi" është aktive — të dhënat e xhamisë fshihen automatikisht.</div>;
  }
  const profileEntries = Object.entries(profiles || {});
  return (
    <>
      {profileEntries.length > 0 && (
        <Card>
          <FieldHead label="Zgjidh nga lista" hint="Plotëso automatikisht nga profilet." />
          <select
            style={s.input}
            value=""
            onChange={(e) => {
              const p = profiles[e.target.value];
              if (!p) return;
              // Send only the keys this profile actually defines, so missing
              // fields keep their current TV value (mirrors the TV's `?? p.x`).
              const allowed = [
                "name", "address", "imamName", "location",
                "manualDreka", "manualXhuma1", "manualXhuma2", "xhuma2Active",
                "appMode", "showQr", "qrUrl", "showFooter",
                "showSilenceWarning", "showQuranRadio",
                "durations", "iqamah", "ramazan",
              ];
              const patchObj = {};
              for (const k of allowed) {
                if (p[k] !== undefined) patchObj[k] = p[k];
              }
              patch(patchObj);
            }}
          >
            <option value="" disabled>-- Zgjidh profilin --</option>
            {profileEntries.map(([k, p]) => (
              <option key={k} value={k}>{p.name} ({p.address})</option>
            ))}
          </select>
        </Card>
      )}
      <TextField label="Emri i Xhamisë" value={st.name} onChange={(v) => patch({ name: v })} />
      <TextField label="Vendndodhja / Adresa" value={st.address} onChange={(v) => patch({ address: v })} />
      <TextField label="Emri i Imamit" value={st.imamName} onChange={(v) => patch({ imamName: v })} />
    </>
  );
}

function DisplayForm({ st, patch }) {
  return (
    <>
      <Segmented
        label="Mënyra e Përdorimit" hint="Profili i përshtatshëm për nevojat tuaja."
        value={st.appMode}
        options={[{ value: "mosque", label: "Xhami" }, { value: "home", label: "Shtëpi" }]}
        onChange={(v) =>
          v === "mosque"
            ? patch({ appMode: "mosque", showSilenceWarning: true, showQr: st.showQr ?? false })
            : patch({ appMode: "home", showSilenceWarning: false, showQr: false })
        }
      />
      {st.appMode === "home" && (
        <Toggle label="Radio Kurani" hint="Dëgjoni Kuran LIVE nga ekrani."
          value={!!st.showQuranRadio} onChange={(v) => patch({ showQuranRadio: v })} />
      )}
      {st.appMode === "mosque" && (
        <>
          <Toggle label="Vërejtja e Heshtjes" hint='Thirrja "FIKNI TELEFONAT" gjatë namazit.'
            value={!!st.showSilenceWarning} onChange={(v) => patch({ showSilenceWarning: v })} />
          <Toggle label="QR Code" hint="Shfaq kodin QR në ekran?"
            value={!!st.showQr} onChange={(v) => patch({ showQr: v })} />
          {st.showQr && (
            <TextField label="URL e QR Kodit" mono placeholder="https://..."
              value={st.qrUrl} onChange={(v) => patch({ qrUrl: v })} />
          )}
        </>
      )}
    </>
  );
}

function LocationForm({ st, patch }) {
  const iq = st.iqamah || {};
  return (
    <>
      <Segmented
        label="Shteti / Kalendari" hint="Kalendari zyrtar vjetor."
        value={st.location === "al" ? "al" : "ks"}
        options={[{ value: "ks", label: "Kosovë" }, { value: "al", label: "Shqipëri" }]}
        onChange={(v) => patch({ location: v })}
      />
      {st.appMode === "mosque" && (
        <>
          <div style={s.groupTitle}>Konfigurimi i Namazeve</div>
          <NumberField label="Sabahu (min para Lindjes)" unit="min" min={0}
            value={st.durations?.sabahuOffset ?? 35}
            onChange={(v) => patch({ durations: { sabahuOffset: v } })} />
          <TimeField label="Dreka" hint="00:00 = automatik (12:55)."
            value={st.manualDreka} onChange={(v) => patch({ manualDreka: v === "00:00" ? "" : v })} />
          <TimeField label="Xhumaja I" hint="00:00 = përdoret Dreka."
            value={st.manualXhuma1} onChange={(v) => patch({ manualXhuma1: v === "00:00" ? "" : v })} />

          <Toggle label="Namazi i dytë i Xhumasë" hint="Nëse xhamia ka dy seanca."
            value={!!st.xhuma2Active} onChange={(v) => patch({ xhuma2Active: v })}
            onText="Po" offText="Jo" />
          {st.xhuma2Active && (
            <TimeField label="Ora e Xhumasë II" hint="Vetëm të Premteve."
              value={st.manualXhuma2} onChange={(v) => patch({ manualXhuma2: v })} />
          )}

          <div style={s.groupTitle}>Koha e Ikametit (Xhematit)</div>
          <Toggle label="Aktivizo Ikametin" hint="Shton +minuta pas Ezanit."
            value={!!iq.active} onChange={(v) => patch({ iqamah: { active: v } })}
            onText="Po" offText="Jo" />
          {iq.active && (
            <>
              <NumberField label="Sabahu" unit="min" value={iq.sabahu ?? 30} onChange={(v) => patch({ iqamah: { sabahu: v } })} />
              <NumberField label="Dreka" unit="min" value={iq.dreka ?? 15} onChange={(v) => patch({ iqamah: { dreka: v } })} />
              <NumberField label="Ikindia" unit="min" value={iq.ikindia ?? 15} onChange={(v) => patch({ iqamah: { ikindia: v } })} />
              <NumberField label="Akshami" unit="min" value={iq.akshami ?? 5} onChange={(v) => patch({ iqamah: { akshami: v } })} />
              <NumberField label="Jacia" unit="min" value={iq.jacia ?? 10} onChange={(v) => patch({ iqamah: { jacia: v } })} />
            </>
          )}
        </>
      )}
    </>
  );
}

function DurationsForm({ st, patch }) {
  const d = st.durations || {};
  const fields = [
    { id: "hadithRefresh", label: "Rifreskimi i Hadithit / Ajetit" },
    { id: "hadith", label: "Hadithi / Ajeti" },
    { id: "esmaul", label: "Esmaul Husna" },
    { id: "qr", label: "QR Kodi", mosqueOnly: true },
    { id: "notification", label: "Njoftimi Special", mosqueOnly: true },
    { id: "announcement", label: "Festat / Shënimet" },
  ].filter((f) => !f.mosqueOnly || st.appMode === "mosque");

  return (
    <>
      {fields.map((f) => (
        <NumberField
          key={f.id} label={f.label} unit="sek/min" min={0}
          value={toMin(d[f.id])}
          onChange={(val) => {
            let v = Math.max(0, val);
            if (f.id === "hadithRefresh") v = Math.max(Math.max(1, toMin(d.hadith)), v);
            patch({ durations: { [f.id]: v } });
          }}
        />
      ))}
    </>
  );
}

function RamazanForm({ st, patch }) {
  const r = st.ramazan || {};
  const nn = r.namazNate || {};
  return (
    <>
      <Toggle label="Statusi i Ramazanit" hint="Gjendja aktuale e shfaqjes."
        value={!!r.active} onChange={(v) => patch({ ramazan: { active: v } })} />
      {r.active && st.appMode !== "home" && (
        <>
          <TimeField label="Koha e Teravisë" hint="00:00 për ta ndjekur Jacinë."
            value={r.kohaTeravise || ""}
            onChange={(v) => patch({ ramazan: { kohaTeravise: v === "00:00" ? "" : v } })} />

          <div style={s.groupTitle}>Namaz i Natës (Tahajjud)</div>
          <Toggle label="Statusi i Namazit" hint="Aktivizoni namazin e natës."
            value={!!nn.active} onChange={(v) => patch({ ramazan: { namazNate: { active: v } } })} />
          {nn.active && (
            <TimeField label="Koha e Namazit" value={nn.koha || "00:30"}
              onChange={(v) => patch({ ramazan: { namazNate: { koha: v } } })} />
          )}
        </>
      )}
    </>
  );
}

function MessageForm({ st, patch }) {
  return (
    <>
      <TextArea label="Njoftimi" hint="Shfaqet sipas kohës së caktuar."
        placeholder="Shkruani këtu njoftimin…"
        value={st.customMsg} onChange={(v) => patch({ customMsg: v })} />
      {!!st.customMsg && (
        <button style={s.clearBtn} onClick={() => patch({ customMsg: "" })}>
          Fshi njoftimin
        </button>
      )}
    </>
  );
}

// ── Main editor ─────────────────────────────────────────────────────────────
// title/description mirror each TV section's SectionHeader; resetConfirm mirrors
// the TV's triggerConfirm message; resetLabel matches the TV's button text.
const SECTIONS = [
  {
    id: "identity", label: "Të dhënat", Form: IdentityForm, mosqueOnly: true,
    title: "Identiteti", description: "Informacionet kryesore të xhamisë dhe imamit.",
    resetLabel: "Rikthe", resetConfirm: "A dëshironi t'i ktheni të dhënat e identitetit në vlerat fillestare?",
  },
  {
    id: "display", label: "Ekrani", Form: DisplayForm,
    title: "Ekrani", description: "Konfiguroni elementet vizuale dhe modalitetin e shfaqjes.",
    resetLabel: "Rikthe", resetConfirm: "A dëshironi t'i ktheni opsionet e ekranit në vlerat fillestare?",
  },
  {
    id: "location", label: "Vaktet", Form: LocationForm,
    title: "Vaktet & Namazet", description: "Kalendari zyrtar dhe kohët e namazeve & Ikametit.",
    resetLabel: "Rikthe", resetConfirm: "A dëshironi t'i ktheni të gjitha kohët dhe parametrat e vaktit në vlerat fillestare?",
  },
  {
    id: "durations", label: "Kohëzgjatja", Form: DurationsForm, mosqueOnly: true,
    title: "Timerat", description: "Menaxhimi i kohës për çdo element në ciklin e shfaqjes.",
    resetLabel: "Rikthe", resetConfirm: "A dëshironi të ktheni të gjitha kohëzgjatjet në vlerat fillestare?",
  },
  {
    id: "ramazan", label: "Ramazani", Form: RamazanForm,
    title: "Ramazani", description: "Aktivizimi i Ramazanit dhe koha e Teravisë.",
    resetLabel: "Rikthe", resetConfirm: "A dëshironi t'i ktheni opsionet e Ramazanit në vlerat fillestare?",
  },
  {
    id: "message", label: "Njoftimet", Form: MessageForm, mosqueOnly: true,
    title: "Njoftimi", description: "Mesazhi personal për ekranin.",
    resetLabel: "Fshi", resetConfirm: "A dëshironi të fshini plotësisht mesazhin e shënuar?",
  },
];

export default function RemoteSettings({ settings, patch, sendReset }) {
  const tabs = SECTIONS.filter((t) => !t.mosqueOnly || settings.appMode === "mosque");
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) || tabs[0];
  const Form = current.Form;

  const onReset = () => {
    if (window.confirm(current.resetConfirm)) sendReset(current.id);
  };
  const onFactory = () => {
    if (window.confirm("A dëshironi t'i ktheni TË GJITHA cilësimet në vlerat e fabrikës?")) {
      sendReset("factory");
    }
  };

  return (
    <div>
      <div style={s.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            style={{ ...s.tab, ...(active === t.id ? s.tabActive : {}) }}
            onClick={() => setActive(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {/* Section header (mirrors the TV's SectionHeader) */}
      <div style={s.headerRow}>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitle}>{current.title}</div>
          <div style={s.headerDesc}>{current.description}</div>
        </div>
        <button style={s.resetBtn} onClick={onReset}>↺ {current.resetLabel}</button>
      </div>

      <div style={s.formArea}>
        <Form st={settings} patch={patch} />
      </div>

      <button style={s.factoryBtn} onClick={onFactory}>↺ Konfigurimi Bazik</button>

      <div style={s.liveHint}>
        <span style={s.liveDot} /> Ndryshimet ruhen menjëherë në TV
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
// Emerald glass aesthetic matching the TV SettingsModal.
const EMERALD = "#10b981";

const s = {
  tabBar: {
    display: "flex", gap: 8, overflowX: "auto",
    paddingBottom: 6, marginBottom: 18,
    WebkitOverflowScrolling: "touch",
  },
  tab: {
    flex: "0 0 auto", padding: "10px 16px", borderRadius: 999,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8", fontSize: 12, fontWeight: 800, cursor: "pointer",
    whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em",
  },
  tabActive: {
    background: EMERALD, borderColor: EMERALD, color: "#04140d",
    boxShadow: "0 0 24px rgba(16,185,129,0.35)",
  },
  headerRow: {
    display: "flex", alignItems: "flex-start", gap: 12,
    marginBottom: 16, paddingBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  headerTitle: {
    fontSize: 20, fontWeight: 900, color: "#fff",
    textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1,
  },
  headerDesc: { fontSize: 12.5, color: "#64748b", marginTop: 4, lineHeight: 1.4, fontStyle: "italic" },
  resetBtn: {
    flex: "0 0 auto", padding: "9px 14px", borderRadius: 12,
    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
    color: "#fbbf24", fontSize: 12, fontWeight: 800, cursor: "pointer",
    textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
  },
  factoryBtn: {
    width: "100%", marginTop: 18, padding: "15px", borderRadius: 16,
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    color: "#fca5a5", fontSize: 14, fontWeight: 800, cursor: "pointer",
    textTransform: "uppercase", letterSpacing: "0.06em",
  },
  formArea: { display: "flex", flexDirection: "column", gap: 14 },

  card: {
    display: "flex", flexDirection: "column", gap: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: 18,
  },
  fieldHead: { display: "flex", flexDirection: "column", gap: 3 },
  fieldLabel: {
    fontSize: 15, fontWeight: 800, color: "#f1f5f9",
    textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.2,
  },
  fieldHint: { fontSize: 12.5, color: "#64748b", lineHeight: 1.45, fontStyle: "italic" },

  segWrap: {
    display: "flex", gap: 5, background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 5,
  },
  seg: {
    flex: 1, padding: "13px 8px", borderRadius: 12, border: "none",
    fontSize: 13, fontWeight: 800, cursor: "pointer",
    textTransform: "uppercase", letterSpacing: "0.05em",
    transition: "background 0.2s, color 0.2s",
  },
  segActive: { background: EMERALD, color: "#04140d", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" },
  segNeutral: { background: "rgba(255,255,255,0.06)", color: "#cbd5e1" },
  segOff: { background: "transparent", color: "#64748b" },

  input: {
    width: "100%", background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "15px 16px", color: "#f1f5f9",
    fontSize: 17, fontWeight: 700, outline: "none", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "15px 16px", color: "#f1f5f9",
    fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box",
    resize: "vertical", fontFamily: "inherit", lineHeight: 1.4,
  },

  stepRow: { display: "flex", alignItems: "stretch", gap: 10 },
  stepBtn: {
    width: 60, background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
    color: EMERALD, fontSize: 28, fontWeight: 800, cursor: "pointer", lineHeight: 1,
  },
  stepVal: {
    flex: 1, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 5,
    background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, color: "#f1f5f9", fontSize: 22, fontWeight: 900,
  },
  stepUnit: { fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" },

  groupTitle: {
    fontSize: 12, fontWeight: 900, letterSpacing: "0.12em",
    textTransform: "uppercase", color: EMERALD,
    borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 18, marginTop: 6,
  },
  note: {
    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
    color: "#86efac", borderRadius: 20, padding: "18px 20px",
    fontSize: 14.5, lineHeight: 1.5, fontWeight: 600,
  },
  clearBtn: {
    width: "100%", padding: "14px", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 16, background: "rgba(239,68,68,0.1)", color: "#fca5a5",
    fontSize: 14, fontWeight: 800, cursor: "pointer",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  liveHint: {
    marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, fontSize: 12.5, color: "#86efac", fontWeight: 700,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: "50%", background: EMERALD,
    display: "inline-block", boxShadow: "0 0 8px rgba(16,185,129,0.8)",
  },
};
