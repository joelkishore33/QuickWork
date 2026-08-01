import React, { useState } from "react";
import { useSession } from "../state/SessionContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { api } from "../api/client.js";
import Icon from "./Icon.jsx";
import { Avatar, Badge, IconButton, Logo, Pill } from "./ui.jsx";
import { timeAgo } from "../utils/format.js";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, reload } = useApi(() => api.notifications(), []);
  const items = data || [];
  const unread = items.filter((n) => !n.read).length;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await api.markNotificationsRead();
      reload();
    }
  };

  return (
    <div className="notif-wrap">
      <IconButton active={open} badge={unread} title="Notifications" onClick={toggle}>
        <Icon name="bell" size={19} />
      </IconButton>
      {open && (
        <>
          <div className="notif-scrim" onClick={() => setOpen(false)} />
          <div className="notif-pop">
            <div className="notif-head">Notifications</div>
            <div className="notif-list">
              {items.length === 0 && (
                <div className="qw-empty-text" style={{ padding: "20px 16px" }}>
                  You're all caught up.
                </div>
              )}
              {items.map((n) => (
                <div key={n.id} className={`notif-item${!n.read ? " is-unread" : ""}`}>
                  <span className="notif-dot" />
                  <div>
                    <div className="notif-text">{n.body}</div>
                    <span className="qw-muted" style={{ fontSize: 11.5 }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Sidebar + top bar chrome shared by all three roles. */
export default function AppShell({ nav, tab, onTabChange, roleLabel, roleSub, roleIcon, children, onRoleClick }) {
  const { user, signOut } = useSession();
  const active = nav.find((n) => n.id === tab);

  return (
    <div className="qw-app">
      <div className="qw-body">
        <aside className="qw-side">
          <div className="qw-side-brand">
            <Logo size={30} light />
          </div>

          <div
            className={`qw-side-role${onRoleClick ? " is-clickable" : ""}`}
            onClick={onRoleClick}
            title={onRoleClick ? "View your profile" : undefined}
          >
            {user?.role === "STUDENT" ? (
              <Avatar name={user.name} color={user.color} photo={user.photo} size={38} />
            ) : (
              <span className="role-emoji" style={{ background: user?.color || "#232D4B" }}>
                <Icon name={roleIcon} size={20} />
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {roleLabel}
              </b>
              <small>{roleSub}</small>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nav.map((item) => (
              <button
                key={item.id}
                className={`qw-nav-item${tab === item.id ? " is-active" : ""}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="qw-nav-ico">
                  <Icon name={item.icon} size={19} />
                </span>
                {item.label}
                {item.count ? <span className="qw-nav-count">{item.count}</span> : null}
              </button>
            ))}
          </nav>

          <div className="qw-side-foot">
            <button className="qw-nav-item" onClick={signOut}>
              <span className="qw-nav-ico">
                <Icon name="switch" size={18} />
              </span>
              Switch account
            </button>
          </div>
        </aside>

        <div className="qw-main-wrap">
          <header className="qw-topbar">
            <div className="topbar-crumb">
              <span>{(user?.name || "").split(" ")[0]}</span> <span className="topbar-sep">/</span>{" "}
              <b>{active?.label}</b>
            </div>
            <div className="qw-topbar-spacer" />
            <Pill tone="navy">
              <Icon name="live" size={14} style={{ color: "var(--green)" }} /> Live · UVA
            </Pill>
            <NotificationBell />
            <button className="topbar-switch" onClick={signOut}>
              Switch account
            </button>
          </header>

          <main className="qw-main">
            <div className="qw-main-pad fadein" key={tab}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
