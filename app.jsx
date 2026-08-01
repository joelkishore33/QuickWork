// ============================================================
// QuickWork — app shell + root
// ============================================================
const { useState: apS } = React;

function Shell({ role, nav, tab, setTab, content, roleIcon, roleLabel, roleSub, roleColor, avatar, onLogout, onRoleClick }) {
  const active = nav.find((n) => n.id === tab);
  return (
    <div className="qw-app">
      <div className="qw-body">
        {/* sidebar */}
        <aside className="qw-side">
          <div className="qw-side-brand"><Logo size={30} light /></div>
          <div className={`qw-side-role${onRoleClick ? " is-clickable" : ""}`} onClick={onRoleClick} title={onRoleClick ? "View your profile" : undefined}>
            {avatar ? <Avatar name={avatar.name} color={avatar.color} photo={avatar.photo} size={38} />
              : <span className="role-emoji" style={{ background: roleColor }}><Icon name={roleIcon} size={20} /></span>}
            <div style={{ minWidth: 0 }}><b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{roleLabel}</b><small>{roleSub}</small></div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nav.map((n) => (
              <button key={n.id} className={`qw-nav-item${tab === n.id ? " is-active" : ""}`} onClick={() => setTab(n.id)}>
                <span className="qw-nav-ico"><Icon name={n.icon} size={19} /></span>{n.label}
                {n.count ? <span className="qw-nav-count">{n.count}</span> : null}
              </button>
            ))}
          </nav>
          <div className="qw-side-foot">
            <button className="qw-nav-item" onClick={onLogout}><span className="qw-nav-ico"><Icon name="switch" size={18} /></span>Switch role</button>
          </div>
        </aside>

        {/* main */}
        <div className="qw-main-wrap">
          <header className="qw-topbar">
            <div className="topbar-crumb"><span>{roleLabel.split(" ")[0]}</span> <span className="topbar-sep">/</span> <b>{active?.label}</b></div>
            <div className="qw-topbar-spacer" />
            <Pill tone="navy"><Icon name="live" size={14} style={{ color: "var(--green)" }} /> {role === "admin" ? "Staff mode" : "Live · UVA"}</Pill>
            <NotifBell role={role} />
            <button className="topbar-switch" onClick={onLogout}>Switch role</button>
          </header>
          <main className="qw-main">
            <div className="qw-main-pad fadein" key={tab}>{content}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

// watches for hired jobs whose scheduled time has passed and auto-sends the completion reminder
function AutoReminder() {
  const { state, dispatch } = useStore();
  React.useEffect(() => {
    const sweep = () => {
      state.jobs.forEach((j) => {
        if (j.status === "hired" && j.endsAt && Date.now() >= j.endsAt && !j.completion?.remindedAt) {
          dispatch({ type: "AUTO_REMIND", jobId: j.id, title: j.title });
        }
      });
    };
    sweep();
    const t = setInterval(sweep, 15000);
    return () => clearInterval(t);
  }, [state.jobs, dispatch]);
  return null;
}

function Root() {
  const { state, dispatch } = useStore();
  if (!state.session.role) return <AuthScreen />;
  const shell = (cfg) => <Shell {...cfg} role={state.session.role} onLogout={() => dispatch({ type: "LOGOUT" })} />;
  return (
    <>
      <AutoReminder />
      {state.session.role === "student" ? <StudentApp shell={shell} />
        : state.session.role === "lister" ? <ListerApp shell={shell} />
          : <AdminApp shell={shell} />}
    </>
  );
}

function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <CelebrationProvider>
          <Root />
        </CelebrationProvider>
      </ToastProvider>
    </StoreProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
