// ============================================================
// QuickWork — shared UI primitives
// ============================================================
const { useState: uS, useEffect: uE, useRef: uR } = React;

function Avatar({ name, color = "#232D4B", photo, size = 40, ring }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="qw-avatar" style={{
      width: size, height: size, borderRadius: size,
      background: photo ? `#eee` : color,
      backgroundImage: photo ? `url(${photo})` : "none",
      backgroundSize: "cover", backgroundPosition: "center",
      fontSize: size * 0.38, boxShadow: ring ? `0 0 0 3px ${ring}` : "none",
    }}>
      {!photo && initials}
    </div>
  );
}

function Stars({ value = 0, size = 14, showNum = false, count }) {
  const full = Math.round(value);
  return (
    <span className="qw-stars" style={{ fontSize: size }}>
      <span className="qw-stars-track">
        {"★★★★★".split("").map((_, i) => (
          <span key={i} style={{ color: i < full ? "#E57200" : "#D8D2C6" }}>★</span>
        ))}
      </span>
      {showNum && <b style={{ fontSize: size, marginLeft: 5 }}>{value}</b>}
      {count != null && <span className="qw-muted" style={{ fontSize: size - 1, marginLeft: 4 }}>({count})</span>}
    </span>
  );
}

const TIER_META = {
  green: { c: "#1B9E5A", bg: "#E6F6EC", label: "$0–20" },
  yellow: { c: "#D99100", bg: "#FCF3DC", label: "$21–49" },
  red: { c: "#D6452B", bg: "#FBE7E2", label: "$50+" },
};

function Badge({ children, tone = "navy", soft, style }) {
  const tones = {
    navy: ["#232D4B", "#E7EAF2"], orange: ["#B85A00", "#FCEBDB"],
    green: ["#147A45", "#E2F4E9"], yellow: ["#9A6A00", "#FBF1D6"],
    red: ["#B33C25", "#FBE3DD"], gray: ["#5C5A52", "#ECEAE3"], purple: ["#6A3FA0", "#EFE7F9"],
  };
  const [fg, bg] = tones[tone] || tones.navy;
  return <span className="qw-badge" style={{ color: soft ? fg : "#fff", background: soft ? bg : fg, ...style }}>{children}</span>;
}

function Button({ children, onClick, variant = "primary", size = "md", icon, iconRight, full, disabled, type = "button", style }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`qw-btn qw-btn-${variant} qw-btn-${size}${full ? " qw-btn-full" : ""}`} style={style}>
      {icon && <span className="qw-btn-ico">{icon}</span>}
      {children}
      {iconRight && <span className="qw-btn-ico">{iconRight}</span>}
    </button>
  );
}

function IconBtn({ children, onClick, active, title, badge }) {
  return (
    <button className={`qw-iconbtn${active ? " is-active" : ""}`} onClick={onClick} title={title}>
      {children}
      {badge ? <span className="qw-iconbtn-dot">{badge > 9 ? "9+" : badge}</span> : null}
    </button>
  );
}

function Card({ children, className = "", onClick, hover, style }) {
  return <div className={`qw-card ${hover ? "qw-card-hover " : ""}${className}`} onClick={onClick} style={style}>{children}</div>;
}

function Modal({ open, onClose, children, width = 540, label, className = "" }) {
  uE(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="qw-modal-scrim" onClick={onClose}>
      <div className={`qw-modal ${className}`} style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={label}>
        <button className="qw-modal-x" onClick={onClose} aria-label="Close"><Icon name="x" size={15} stroke={2.4} /></button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="qw-field">
      <span className="qw-field-label">{label}</span>
      {children}
      {hint && <span className="qw-field-hint">{hint}</span>}
    </label>
  );
}

function Segmented({ options, value, onChange, full }) {
  return (
    <div className={`qw-seg${full ? " qw-seg-full" : ""}`}>
      {options.map((o) => (
        <button key={o.value} className={`qw-seg-item${value === o.value ? " is-active" : ""}`} onClick={() => onChange(o.value)}>
          {o.icon && <span style={{ marginRight: 6 }}>{o.icon}</span>}{o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon = "sun", title, text, action }) {
  return (
    <div className="qw-empty">
      <div className="qw-empty-ico">{ICONS[icon] ? <Icon name={icon} size={34} stroke={1.6} /> : icon}</div>
      <div className="qw-empty-title">{title}</div>
      {text && <div className="qw-empty-text">{text}</div>}
      {action}
    </div>
  );
}

function Pill({ children, tone }) {
  return <span className={`qw-pill${tone ? " qw-pill-" + tone : ""}`}>{children}</span>;
}

// ---- toast system ----
const ToastCtx = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = uS([]);
  const push = (msg, kind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="qw-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`qw-toast qw-toast-${t.kind}`}>
            <span className="qw-toast-ico"><Icon name={t.kind === "ok" ? "check" : t.kind === "info" ? "bell" : "alert"} size={13} stroke={2.6} /></span>
            <span>{t.msg}</span>
            <span className="toast-bar" />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => React.useContext(ToastCtx);

// ---- file -> dataURL helper for uploads ----
function pickImage(cb) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const f = input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(r.result, f.name);
    r.readAsDataURL(f);
  };
  input.click();
}

// ---- QuickWork brand mark (original, UVA palette) ----
function Logo({ size = 34, light }) {
  return (
    <div className="qw-logo" style={{ gap: size * 0.32 }}>
      <div className="qw-logo-badge" style={{ width: size, height: size, borderRadius: size * 0.28 }}>
        <span style={{ fontSize: size * 0.6 }}>Q</span>
        <i className="qw-logo-spark" style={{ width: size * 0.2, height: size * 0.2 }} />
      </div>
      <span className="qw-logo-word" style={{ fontSize: size * 0.62, color: light ? "#fff" : "#232D4B" }}>
        Quick<span style={{ color: "#E57200" }}>Work</span>
      </span>
    </div>
  );
}

// ---- clean line-icon set (Feather-style, currentColor) ----
const ICONS = {
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="2" y1="13" x2="22" y2="13"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5"/><line x1="22" y1="10" x2="22" y2="15"/>',
  wallet: '<path d="M21 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M21 12h-5a2 2 0 0 0 0 4h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="5" y1="5" x2="9.2" y2="9.2"/><line x1="14.8" y1="14.8" x2="19" y2="19"/><line x1="14.8" y1="9.2" x2="19" y2="5"/><line x1="5" y1="19" x2="9.2" y2="14.8"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16.2" y1="16.2" x2="21" y2="21"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.6" cy="6" r="1.1"/><circle cx="3.6" cy="12" r="1.1"/><circle cx="3.6" cy="18" r="1.1"/>',
  plus: '<rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  scale: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M7 7l-3 6a3 3 0 0 0 6 0z"/><path d="M17 7l-3 6a3 3 0 0 0 6 0z"/><path d="M8 21h8"/>',
  receipt: '<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  live: '<circle cx="12" cy="12" r="2.5"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><line x1="2" y1="10" x2="22" y2="10"/>',
  hourglass: '<path d="M6 3h12"/><path d="M6 21h12"/><path d="M6 3c0 4 3 6 6 9 3-3 6-5 6-9"/><path d="M6 21c0-4 3-6 6-9 3 3 6 5 6 9"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3"/><path d="M17 6h3v1a3 3 0 0 1-3 3"/>',
  hand: '<path d="M11 11V6a1.5 1.5 0 0 1 3 0v5"/><path d="M14 10V5a1.5 1.5 0 0 1 3 0v6"/><path d="M17 11V7a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-2.3-4a1.5 1.5 0 0 1 2.6-1.5L9 13V4.5a1.5 1.5 0 0 1 3 0V11"/>',
  hourglassEnd: '<path d="M6 3h12"/><path d="M6 21h12"/><path d="M6 3c0 4 3 6 6 9 3-3 6-5 6-9"/><path d="M6 21c0-4 3-6 6-9 3 3 6 5 6 9"/>',
  duration: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/>',
  arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  bank: '<line x1="3" y1="21" x2="21" y2="21"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><line x1="4" y1="10" x2="4" y2="21"/><line x1="20" y1="10" x2="20" y2="21"/><line x1="8" y1="10" x2="8" y2="21"/><line x1="12" y1="10" x2="12" y2="21"/><line x1="16" y1="10" x2="16" y2="21"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/>',
  id: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><circle cx="9" cy="10" r="2.4"/><path d="M5.5 16a3.5 3.5 0 0 1 7 0"/><line x1="15" y1="9" x2="19" y2="9"/><line x1="15" y1="13" x2="19" y2="13"/>',
  paw: '<circle cx="6" cy="11" r="2"/><circle cx="10" cy="6.5" r="2"/><circle cx="14" cy="6.5" r="2"/><circle cx="18" cy="11" r="2"/><path d="M8.5 14.5c1-1.8 2-3 3.5-3s2.5 1.2 3.5 3c.8 1.4 2 2.3 2 3.8a2.2 2.2 0 0 1-2.2 2.2c-1.3 0-2-.7-3.3-.7s-2 .7-3.3.7A2.2 2.2 0 0 1 6.5 18.3c0-1.5 1.2-2.4 2-3.8z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
  backpack: '<path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M9 9a3 3 0 0 1 6 0"/><path d="M8 14h8"/><rect x="10" y="14" width="4" height="4" rx="1"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  switch: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="4.6" y1="4.6" x2="6.4" y2="6.4"/><line x1="17.6" y1="17.6" x2="19.4" y2="19.4"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/><line x1="4.6" y1="19.4" x2="6.4" y2="17.6"/><line x1="17.6" y1="6.4" x2="19.4" y2="4.6"/>',
};
function Icon({ name, size = 20, stroke = 2, style }) {
  const path = ICONS[name];
  if (!path) return <span style={style}>{name}</span>;
  return <svg className="qw-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}
    dangerouslySetInnerHTML={{ __html: path }} />;
}

// ---- celebration / confetti burst ----
// ---- animated count-up number ----
function CountUp({ value, prefix = "", suffix = "", duration = 850 }) {
  const [display, setDisplay] = uS(value);
  const prev = uR(null);
  uE(() => {
    const from = prev.current == null ? 0 : prev.current;
    const to = Number(value) || 0;
    prev.current = to;
    if (from === to) { setDisplay(to); return; }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{Math.round(display)}{suffix}</>;
}

const CelebrateCtx = React.createContext(null);
function Celebration({ message, sub }) {
  const colors = ["#232D4B", "#E57200", "#1B9E5A", "#F2C14E", "#2E86C1", "#ffffff"];
  const pieces = React.useMemo(() => Array.from({ length: 110 }, (_, i) => ({
    id: i, left: Math.random() * 100, bg: colors[i % colors.length],
    delay: Math.random() * 0.45, dur: 1.9 + Math.random() * 1.5,
    rot: (Math.random() * 720 - 360), size: 7 + Math.random() * 9,
    drift: (Math.random() - 0.5) * 200, round: Math.random() > 0.5,
  })), []);
  return (
    <div className="celebrate">
      <div className="celebrate-confetti">
        {pieces.map((p) => (
          <span key={p.id} className="confetti" style={{
            left: p.left + "%", background: p.bg, width: p.size, height: p.size * (p.round ? 1 : 0.45),
            borderRadius: p.round ? "50%" : 2, animationDelay: p.delay + "s", animationDuration: p.dur + "s",
            "--drift": p.drift + "px", "--rot": p.rot + "deg",
          }} />
        ))}
      </div>
      <div className="celebrate-card">
        <div className="celebrate-badge"><span className="celebrate-ring" /><Icon name="check" size={42} stroke={2.8} /></div>
        <div className="celebrate-title">{message}</div>
        {sub && <div className="celebrate-sub">{sub}</div>}
      </div>
    </div>
  );
}
function CelebrationProvider({ children }) {
  const [burst, setBurst] = uS(null);
  const celebrate = (message, sub) => setBurst({ message, sub, key: Math.random().toString(36).slice(2) });
  uE(() => { if (!burst) return; const t = setTimeout(() => setBurst(null), 3000); return () => clearTimeout(t); }, [burst]);
  return (
    <CelebrateCtx.Provider value={celebrate}>
      {children}
      {burst && <Celebration key={burst.key} message={burst.message} sub={burst.sub} />}
    </CelebrateCtx.Provider>
  );
}
const useCelebrate = () => React.useContext(CelebrateCtx);

Object.assign(window, {
  Avatar, Stars, TIER_META, Badge, Button, IconBtn, Card, Modal, Field,
  Segmented, EmptyState, Pill, ToastProvider, useToast, pickImage, Logo, Icon, ICONS,
  CelebrationProvider, useCelebrate, CountUp,
});
