// ============================================================
// QuickWork — login / role select
// ============================================================
const { useState: aS } = React;

const ROLE_CARDS = [
  { role: "student", icon: "backpack", title: "Student", blurb: "Find quick paid gigs around Grounds.", who: "Demo: Maya Patel", color: "#E57200", id: "stu_1" },
  { role: "lister", icon: "home", title: "Lister", blurb: "Post a job, hire a student, pay securely.", who: "Demo: Tom Reedy", color: "#2E86C1", id: "lst_3" },
  { role: "admin", icon: "shield", title: "Admin", blurb: "Approve listings, hold funds, resolve disputes.", who: "QuickWork staff", color: "#232D4B", id: "admin" },
];

function AuthScreen() {
  const { state, dispatch } = useStore();
  const [picked, setPicked] = aS(null);
  const [step, setStep] = aS("pick"); // pick | account | verify
  const go = (card) => {
    if (card.role === "admin") return dispatch({ type: "LOGIN", role: "admin", userId: "admin" });
    setPicked(card); setStep("account");
  };
  const chooseAccount = (id) => {
    const next = { ...picked, id };
    setPicked(next);
    if (next.role === "student") setStep("verify");
    else dispatch({ type: "LOGIN", role: "lister", userId: id });
  };

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="auth-art-inner">
          <Logo size={46} light />
          <h1 className="auth-hl">Campus gigs,<br /><span>sorted in minutes.</span></h1>
          <p className="auth-sub">QuickWork connects UVA students with paid jobs around town — moving, tutoring, pet-sitting, events and more. Funds held safely until the work's done.</p>
          <div className="auth-tiers">
            {Object.entries(TIER_META).map(([k, m]) => (
              <div className="auth-tier" key={k}><span style={{ background: m.c }} /><b>{m.label}</b></div>
            ))}
          </div>
          {/* floating mini-pins decoration */}
          <div className="auth-deco">
            <span className="auth-chip" style={{ "--c": "#1B9E5A" }}>$15 · Dog walk</span>
            <span className="auth-chip" style={{ "--c": "#D99100" }}>$45 · Move couch</span>
            <span className="auth-chip" style={{ "--c": "#D6452B" }}>$80 · Event crew</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        {step === "pick" && (
          <div className="auth-form fadein">
            <div className="auth-eyebrow">Welcome back</div>
            <h2 className="auth-title">Sign in to QuickWork</h2>
            <p className="auth-note">Pick a demo role to explore the full prototype.</p>
            <div className="auth-roles">
              {ROLE_CARDS.map((c) => (
                <button key={c.role} className="auth-role" onClick={() => go(c)}>
                  <span className="auth-role-ico" style={{ background: c.color }}><Icon name={c.icon} size={22} /></span>
                  <span className="auth-role-txt">
                    <b>{c.title}</b>
                    <small>{c.blurb}</small>
                    <span className="auth-role-who">{c.role === "admin" ? c.who : "Choose an account"}</span>
                  </span>
                  <span className="auth-role-arrow"><Icon name="arrowRight" size={17} /></span>
                </button>
              ))}
            </div>
            <div className="auth-foot"><Icon name="lock" size={13} /> Mock auth · production would use school-email SSO</div>
          </div>
        )}

        {step === "account" && (
          <div className="auth-form fadein">
            <button className="auth-back" onClick={() => setStep("pick")}><Icon name="arrowLeft" size={14} /> back</button>
            <h2 className="auth-title">Choose a {picked.role} account</h2>
            <p className="auth-note">Each demo account is in a different state, so you can try every flow.</p>
            <div className="auth-roles">
              {(picked.role === "student" ? state.students : state.listers).map((a) => {
                const jobs = picked.role === "student"
                  ? state.jobs.filter((j) => j.hiredId === a.id || j.applicants.includes(a.id))
                  : state.jobs.filter((j) => j.listerId === a.id);
                const note = picked.role === "student"
                  ? `${a.year} · ${jobs.length} job${jobs.length === 1 ? "" : "s"} in play`
                  : `${a.org} · ${jobs.length} listing${jobs.length === 1 ? "" : "s"}`;
                return (
                  <button key={a.id} className="auth-role" onClick={() => chooseAccount(a.id)}>
                    <Avatar name={a.name} color={a.color} photo={a.photo} size={44} />
                    <span className="auth-role-txt">
                      <b>{a.name}</b>
                      <small>{note}</small>
                    </span>
                    <span className="auth-role-arrow"><Icon name="arrowRight" size={17} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "verify" && <StudentVerify card={picked} onBack={() => setStep("account")}
          onDone={() => dispatch({ type: "LOGIN", role: "student", userId: picked.id })} />}
      </div>
    </div>
  );
}

function StudentVerify({ card, onBack, onDone }) {
  const [stage, setStage] = aS(0); // 0 email, 1 code, 2 id
  const [email, setEmail] = aS("");
  const [code, setCode] = aS(["", "", "", ""]);
  const [idUp, setIdUp] = aS(false);

  return (
    <div className="auth-form fadein">
      <button className="auth-back" onClick={onBack}><Icon name="arrowLeft" size={14} /> back</button>
      <div className="auth-steps">
        {["School email", "Verify code", "ID check"].map((s, i) => (
          <div key={s} className={`auth-step${i === stage ? " is-active" : ""}${i < stage ? " is-done" : ""}`}>
            <span>{i < stage ? <Icon name="check" size={12} stroke={2.6} /> : i + 1}</span>{s}
          </div>
        ))}
      </div>

      {stage === 0 && (
        <div className="fadein">
          <h2 className="auth-title" style={{ marginTop: 6 }}>Verify you're a student</h2>
          <p className="auth-note">We send a code to your <b>@virginia.edu</b> email.</p>
          <Field label="School email">
            <input className="qw-input" placeholder="computingID@virginia.edu" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button variant="primary" full size="lg" onClick={() => setStage(1)}>Send code</Button>
        </div>
      )}

      {stage === 1 && (
        <div className="fadein">
          <h2 className="auth-title" style={{ marginTop: 6 }}>Enter your code</h2>
          <p className="auth-note">We sent a 4-digit code to <b>{email || "your inbox"}</b>. (Demo: type anything)</p>
          <div className="code-row">
            {code.map((c, i) => (
              <input key={i} className="code-box" maxLength={1} value={c}
                onChange={(e) => {
                  const next = [...code]; next[i] = e.target.value.slice(-1); setCode(next);
                  if (e.target.value && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                }} />
            ))}
          </div>
          <Button variant="primary" full size="lg" onClick={() => setStage(2)}>Verify</Button>
        </div>
      )}

      {stage === 2 && (
        <div className="fadein">
          <h2 className="auth-title" style={{ marginTop: 6 }}>Quick ID check</h2>
          <p className="auth-note">Upload a photo ID so listers know you're you. Stored privately.</p>
          <button className={`id-drop${idUp ? " is-done" : ""}`} onClick={() => setIdUp(true)}>
            {idUp ? <><span className="id-check"><Icon name="check" size={22} stroke={2.6} /></span><b>ID uploaded</b><small>front_of_id.jpg · verified</small></>
              : <><span className="id-ico"><Icon name="id" size={32} /></span><b>Tap to upload ID</b><small>Stripe Identity / Persona in production</small></>}
          </button>
          <Button variant="primary" full size="lg" disabled={!idUp} onClick={onDone} iconRight={<Icon name="arrowRight" size={16} />}>Enter QuickWork</Button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AuthScreen });
