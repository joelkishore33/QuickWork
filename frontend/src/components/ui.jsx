import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";

export function Avatar({ name, color = "#232D4B", photo, size = 40, ring }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="qw-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: photo ? "#eee" : color,
        backgroundImage: photo ? `url(${photo})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontSize: size * 0.38,
        boxShadow: ring ? `0 0 0 3px ${ring}` : "none",
      }}
    >
      {!photo && initials}
    </div>
  );
}

export function Stars({ value = 0, size = 14, showNumber = false, count }) {
  const filled = Math.round(value);
  return (
    <span className="qw-stars" style={{ fontSize: size }}>
      <span className="qw-stars-track">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ color: i < filled ? "#E57200" : "#D8D2C6" }}>
            ★
          </span>
        ))}
      </span>
      {showNumber && <b style={{ fontSize: size, marginLeft: 5 }}>{Number(value).toFixed(1)}</b>}
      {count != null && (
        <span className="qw-muted" style={{ fontSize: size - 1, marginLeft: 4 }}>
          ({count})
        </span>
      )}
    </span>
  );
}

const BADGE_TONES = {
  navy: ["#232D4B", "#E7EAF2"],
  orange: ["#B85A00", "#FCEBDB"],
  green: ["#147A45", "#E2F4E9"],
  yellow: ["#9A6A00", "#FBF1D6"],
  red: ["#B33C25", "#FBE3DD"],
  gray: ["#5C5A52", "#ECEAE3"],
  purple: ["#6A3FA0", "#EFE7F9"],
};

export function Badge({ children, tone = "navy", soft = true, style }) {
  const [fg, bg] = BADGE_TONES[tone] || BADGE_TONES.navy;
  return (
    <span className="qw-badge" style={{ color: soft ? fg : "#fff", background: soft ? bg : fg, ...style }}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  disabled,
  type = "button",
  style,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`qw-btn qw-btn-${variant} qw-btn-${size}${full ? " qw-btn-full" : ""}`}
      style={style}
    >
      {icon && <span className="qw-btn-ico">{icon}</span>}
      {children}
      {iconRight && <span className="qw-btn-ico">{iconRight}</span>}
    </button>
  );
}

export function IconButton({ children, onClick, active, title, badge }) {
  return (
    <button className={`qw-iconbtn${active ? " is-active" : ""}`} onClick={onClick} title={title}>
      {children}
      {badge ? <span className="qw-iconbtn-dot">{badge > 9 ? "9+" : badge}</span> : null}
    </button>
  );
}

export function Card({ children, className = "", onClick, hover, style }) {
  return (
    <div className={`qw-card ${hover ? "qw-card-hover " : ""}${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

/**
 * Rendered through a portal so the backdrop always covers the viewport —
 * ancestors with transforms would otherwise trap a position:fixed child.
 */
export function Modal({ open, onClose, children, width = 540, label, className = "" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="qw-modal-scrim" onClick={onClose}>
      <div
        className={`qw-modal ${className}`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={label}
      >
        <button className="qw-modal-x" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} stroke={2.4} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="qw-field">
      <span className="qw-field-label">{label}</span>
      {children}
      {hint && <span className="qw-field-hint">{hint}</span>}
    </label>
  );
}

export function Segmented({ options, value, onChange, full }) {
  return (
    <div className={`qw-seg${full ? " qw-seg-full" : ""}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`qw-seg-item${value === option.value ? " is-active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <span style={{ marginRight: 6 }}>{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon = "search", title, text, action }) {
  return (
    <div className="qw-empty">
      <div className="qw-empty-ico">
        <Icon name={icon} size={34} />
      </div>
      <div className="qw-empty-title">{title}</div>
      {text && <div className="qw-empty-text">{text}</div>}
      {action}
    </div>
  );
}

export function Pill({ children, tone }) {
  return <span className={`qw-pill${tone ? " qw-pill-" + tone : ""}`}>{children}</span>;
}

export function Spinner({ label = "Loading…" }) {
  return <div className="qw-muted" style={{ padding: 32, fontSize: 14 }}>{label}</div>;
}

export function ErrorNote({ message, onRetry }) {
  return (
    <div className="qw-error-note">
      <Icon name="alert" size={16} />
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Logo({ size = 34, light }) {
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
