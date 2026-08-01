// ============================================================
// QuickWork — Student app
// ============================================================
const { useState: stuS, useMemo: stuM } = React;

function StudentApp({ shell }) {
  const { state, dispatch } = useStore();
  const me = state.students.find((s) => s.id === state.session.userId);
  const [tab, setTab] = stuS("browse");
  const [jobView, setJobView] = stuS(null);

  const myApplied = state.jobs.filter((j) => j.applicants.includes(me.id) || j.hiredId === me.id);
  const hiredJobs = state.jobs.filter((j) => j.hiredId === me.id);
  const myOpenCases = state.disputes.filter((d) => {
    const job = state.jobs.find((j) => j.id === d.jobId);
    return job && job.hiredId === me.id && d.status === "open";
  }).length;

  const nav = [
    { id: "browse", icon: "map", label: "Browse Map" },
    { id: "jobs", icon: "briefcase", label: "My Jobs", count: myApplied.length || null },
    { id: "messages", icon: "chat", label: "Messages", count: (hiredJobs.length + myOpenCases) || null },
    { id: "profile", icon: "cap", label: "My Profile" },
    { id: "payouts", icon: "wallet", label: "Payouts" },
    { id: "help", icon: "help", label: "Help Desk" },
  ];

  const openJob = (id) => setJobView(id);

  return shell({
    roleIcon: "cap", roleLabel: me.name, roleSub: "Student · " + me.year, roleColor: me.color, avatar: me,
    nav, tab, setTab: (t) => { setJobView(null); setTab(t); },
    onRoleClick: () => { setJobView(null); setTab("profile"); },
    content: jobView ? (
      <JobDetailPage jobId={jobView} me={me} onBack={() => setJobView(null)} setTab={(t) => { setJobView(null); setTab(t); }} />
    ) : (
      <>
        {tab === "browse" && <StudentBrowse me={me} openJob={openJob} />}
        {tab === "jobs" && <StudentMyJobs me={me} setTab={setTab} openJob={openJob} />}
        {tab === "messages" && <StudentMessages me={me} />}
        {tab === "profile" && <StudentProfileEdit me={me} />}
        {tab === "payouts" && <StudentPayouts me={me} />}
        {tab === "help" && <HelpDesk role="student" name={me.name} />}
      </>
    ),
  });
}

// ---------- Browse (map + list) ----------
function StudentBrowse({ me, openJob }) {
  const { state, dispatch } = useStore();
  const [tiers, setTiers] = stuS(["green", "yellow", "red"]);
  const [view, setView] = stuS("map");

  const jobs = state.jobs.filter((j) => j.status === "approved" && !(j.endsAt && Date.now() >= j.endsAt));
  const filtered = jobs.filter((j) => tiers.includes(tierOf(j.price)));
  const toggleTier = (t) => setTiers((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="browse">
      <div className="qw-page-head" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="qw-page-title">Jobs around Grounds</h1>
          <div className="qw-page-sub">{filtered.length} open near UVA · tap a pin to see details</div>
        </div>
        <Segmented value={view} onChange={setView} options={[{ value: "map", icon: <Icon name="map" size={15} />, label: "Map" }, { value: "list", icon: <Icon name="list" size={15} />, label: "List" }]} />
      </div>

      <div className="browse-filters">
        <span className="browse-filter-label">Price filter</span>
        {Object.entries(TIER_META).map(([k, m]) => (
          <button key={k} className={`tier-chip${tiers.includes(k) ? " is-on" : ""}`} onClick={() => toggleTier(k)}
            style={{ "--tc": m.c }}>
            <span className="tier-dot" /> {m.label}
          </button>
        ))}
      </div>

      {view === "map" ? (
        <div className="browse-map">
          <CampusMap jobs={state.jobs} listers={state.listers} onPick={(j) => openJob(j.id)} filterTiers={tiers} />
        </div>
      ) : (
        <div className="job-grid">
          {filtered.map((j) => <JobCard key={j.id} job={j} lister={state.listers.find((l) => l.id === j.listerId)} onClick={() => openJob(j.id)} me={me} />)}
          {filtered.length === 0 && <EmptyState icon="search" title="No jobs match" text="Try turning a price filter back on." />}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, lister, onClick, me }) {
  const meta = TIER_META[tierOf(job.price)];
  const applied = me && job.applicants.includes(me.id);
  const hired = me && job.hiredId === me.id;
  return (
    <Card hover onClick={onClick} className="job-card">
      <div className="job-card-top">
        <Badge tone="gray" soft>{job.category}</Badge>
        <span className="job-card-price" style={{ color: meta.c }}>{fmt$(job.price)}</span>
      </div>
      <h3 className="job-card-title">{job.title}</h3>
      <div className="job-card-meta">
        <span><Icon name="pin" size={14} /> {job.building}</span><span><Icon name="clock" size={14} /> {job.when}</span>
      </div>
      <div className="job-card-foot">
        <div className="qw-row" style={{ gap: 8 }}>
          <Avatar name={lister?.name} color={lister?.color} size={26} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{lister?.name}</span>
        </div>
        {hired ? <Badge tone="green" soft><Icon name="check" size={12} stroke={2.6} />Hired</Badge> : applied ? <Badge tone="orange" soft>Applied</Badge> : <span className="job-card-cta">View <Icon name="arrowRight" size={13} /></span>}
      </div>
    </Card>
  );
}

function JobDetailPage({ jobId, me, onBack, setTab }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [reporting, setReporting] = stuS(false);
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return <div className="fadein detail-page"><BackBar onBack={onBack} /><EmptyState icon="search" title="Job no longer available" /></div>;
  const lister = state.listers.find((l) => l.id === job.listerId);
  const meta = TIER_META[tierOf(job.price)];
  const applied = job.applicants.includes(me.id);
  const hired = job.hiredId === me.id;
  const marked = !!job.completion?.markedAt;
  const apply = () => { dispatch({ type: "APPLY_JOB", jobId: job.id, studentId: me.id, title: job.title }); toast("Applied to “" + job.title + "” — good luck!"); };
  const markDone = () => { dispatch({ type: "STUDENT_MARK_DONE", jobId: job.id, title: job.title, studentName: me.name }); toast("Lister notified — 48-hour confirmation window started."); };

  return (
    <div className="fadein detail-page">
      <BackBar onBack={onBack} label="Back to jobs" />
      <Card className="detail-card">
        <div className="jd-hero" style={{ background: meta.bg }}>
          <Badge tone="gray" soft>{job.category}</Badge>
          <div className="jd-price" style={{ color: meta.c }}>{fmt$(job.price)}</div>
        </div>
        <div className="qw-modal-pad" style={{ paddingTop: 20 }}>
          <h2 className="jd-title">{job.title}</h2>
          <div className="jd-metas">
            <div className="jd-meta"><span><Icon name="pin" size={13} /> Location</span><b>{job.building}</b></div>
            <div className="jd-meta"><span><Icon name="clock" size={13} /> When</span><b>{job.when}</b></div>
            <div className="jd-meta"><span><Icon name="duration" size={13} /> Duration</span><b>{job.duration}</b></div>
            <div className="jd-meta"><span><Icon name="card" size={13} /> Payout</span><b>Held in escrow</b></div>
          </div>
          <div className="sp-sec-label" style={{ marginTop: 4 }}>About this job</div>
          <p className="jd-desc">{job.desc}</p>
          <div className="jd-lister">
            <Avatar name={lister?.name} color={lister?.color} size={44} />
            <div><b>{lister?.name}</b><small>{lister?.org}</small></div>
            <Badge tone="green" soft style={{ marginLeft: "auto" }}><Icon name="check" size={12} stroke={2.6} />Funds secured</Badge>
          </div>
        </div>
      </Card>
      {hired && job.status === "hired" && (
        <Card className="stu-work-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Your work</div>
          {marked ? (
            <div className="stu-work-done">
              <span className="mg-done-check"><Icon name="check" size={13} stroke={3} /></span>
              <div><b>Marked complete — waiting on {lister?.name?.split(" ")[0]}</b>
                <small>If they don't confirm within 48 hours, QuickWork releases your {fmt$(job.price)} automatically.</small></div>
            </div>
          ) : (
            <div className="stu-work-prompt">
              <div><b>Finished the job?</b><small>Let the lister know so they can release your payment.</small></div>
              <Button variant="primary" icon={<Icon name="check" size={16} />} onClick={markDone}>I finished this work</Button>
            </div>
          )}
          <div className="qw-divider" />
          <div className="stu-work-prompt">
            <div><b>Something go wrong?</b><small>Not paid, or the job wasn't what was described? Open a case with QuickWork.</small></div>
            <Button variant="danger" icon={<Icon name="alert" size={15} />} onClick={() => setReporting(true)}>Report a problem</Button>
          </div>
        </Card>
      )}
      <div className="detail-actionbar">
        <div className="detail-actionbar-info">{hired ? "You're hired for this job." : applied ? "Your application is in — the lister will be in touch." : "Like this gig? Send an application."}</div>
        {hired ? <Button variant="navy" icon={<Icon name="chat" size={16} />} onClick={() => setTab("messages")}>Message lister</Button>
          : applied ? <Button variant="soft" disabled icon={<Icon name="check" size={15} />}>Application sent</Button>
            : <Button variant="primary" size="lg" icon={<Icon name="hand" size={16} />} onClick={apply}>Apply now</Button>}
      </div>
      <StudentReportModal open={reporting} onClose={() => setReporting(false)} job={job} me={me}
        onSubmitted={() => { setReporting(false); onBack(); }} />
    </div>
  );
}

function StudentReportModal({ open, onClose, job, me, onSubmitted }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [text, setText] = stuS("");
  const [photos, setPhotos] = stuS([]);
  if (!open) return null;
  const submit = () => {
    if (!text.trim()) return;
    dispatch({ type: "OPEN_DISPUTE", jobId: job.id, openedBy: "student", title: job.title, note: text.trim(), photos });
    toast("Case opened — QuickWork will review it.", "info");
    setText(""); setPhotos([]);
    onSubmitted();
  };
  return (
    <Modal open={open} onClose={onClose} width={520} label="Report a problem">
      <div className="qw-modal-pad">
        <div className="ri-head">
          <span className="ri-ico"><Icon name="alert" size={22} /></span>
          <div><h2 className="jd-title" style={{ margin: 0 }}>Report a problem</h2>
            <div className="qw-muted" style={{ fontSize: 13.5 }}>{job.title}</div></div>
        </div>
        <p className="ri-note">The {fmt$(job.price)} stays held while we review. Tell us what happened and add photos if they help.</p>
        <Field label="What went wrong?">
          <textarea className="qw-textarea" placeholder="e.g. I completed the work on Saturday but haven't been paid…" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="sp-sec-label" style={{ marginTop: 0 }}>Photos (optional)</div>
        <div className="ri-photos">
          {photos.map((p, i) => (
            <div className="ri-photo" key={i} style={{ backgroundImage: `url(${p.src})` }}>
              <button className="ri-photo-x" onClick={() => setPhotos(photos.filter((_, n) => n !== i))}><Icon name="x" size={11} stroke={2.6} /></button>
            </div>
          ))}
          <button className="ri-photo-add" onClick={() => pickImage((src, name) => setPhotos((p) => [...p, { src, name }]))}>
            <Icon name="plus" size={18} /><small>Add photo</small>
          </button>
        </div>
        <div className="sp-foot" style={{ borderTop: "none", paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Never mind</Button>
          <Button variant="danger" disabled={!text.trim()} onClick={submit}>Submit report</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- My Jobs ----------
function StudentMyJobs({ me, setTab, openJob }) {
  const { state } = useStore();
  const expired = (j) => j.endsAt && Date.now() >= j.endsAt;
  const appliedAll = state.jobs.filter((j) => j.applicants.includes(me.id) && j.hiredId !== me.id && j.status !== "completed");
  const applied = appliedAll.filter((j) => !expired(j) && j.status !== "cancelled");
  const closed = appliedAll.filter((j) => expired(j) || j.status === "cancelled");
  const hired = state.jobs.filter((j) => j.hiredId === me.id && j.status !== "completed");
  const done = state.jobs.filter((j) => j.hiredId === me.id && j.status === "completed");

  const Section = ({ title, icon, list, empty, muted }) => (
    <div style={{ marginBottom: 26 }}>
      <div className="myjobs-sec"><Icon name={icon} size={18} style={{ color: muted ? "var(--muted)" : "var(--orange)" }} />{title} <span className="myjobs-count">{list.length}</span></div>
      {list.length === 0 ? <div className="qw-muted" style={{ fontSize: 13.5, padding: "6px 2px" }}>{empty}</div>
        : <div className={`job-grid${muted ? " is-muted" : ""}`}>{list.map((j) => <MyJobCard key={j.id} job={j} me={me} setTab={setTab} openJob={openJob} closed={muted} />)}</div>}
    </div>
  );

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">My Jobs</h1><div className="qw-page-sub">Track applications, hired gigs, and completed work.</div></div></div>
      <Section icon="check" title="Hired — in progress" list={hired} empty="No active jobs yet. Get hired and they'll show here." />
      <Section icon="hourglass" title="Awaiting decision" list={applied} empty="You haven't applied to anything yet — browse the map!" />
      {closed.length > 0 && <Section icon="x" title="Closed — not selected" list={closed} muted empty="" />}
      <Section icon="trophy" title="Completed" list={done} empty="Finished jobs and payouts will appear here." />
    </div>
  );
}

function MyJobCard({ job, me, setTab, openJob, closed }) {
  const { state } = useStore();
  const lister = state.listers.find((l) => l.id === job.listerId);
  return (
    <Card hover className="job-card" onClick={() => openJob(job.id)}>
      <div className="job-card-top">
        {closed ? <Badge tone="gray" soft>{job.status === "cancelled" ? "Listing cancelled" : "Time slot passed"}</Badge>
          : job.hiredId === me.id ? <JobStatusChip status={job.status === "completed" ? "completed" : "hired"} />
            : <Badge tone="orange" soft><Icon name="hourglass" size={12} /> Awaiting decision</Badge>}
        <span className="job-card-price" style={{ color: TIER_META[tierOf(job.price)].c }}>{fmt$(job.price)}</span>
      </div>
      <h3 className="job-card-title">{job.title}</h3>
      <div className="job-card-meta"><span><Icon name="pin" size={14} /> {job.building}</span><span><Icon name="clock" size={14} /> {job.when}</span></div>
      <div className="job-card-foot">
        <div className="qw-row" style={{ gap: 8 }}><Avatar name={lister?.name} color={lister?.color} size={26} /><span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{lister?.name}</span></div>
        {job.hiredId === me.id && job.status !== "completed" && <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); setTab("messages"); }}>Message</Button>}
        {job.status === "completed" && <Badge tone="green" soft>Paid {fmt$(job.price)}</Badge>}
      </div>
    </Card>
  );
}

// ---------- Messages ----------
function StudentMessages({ me }) {
  const { state } = useStore();
  const [pane, setPane] = stuS("chats");
  const openCases = state.disputes.filter((d) => {
    const job = state.jobs.find((j) => j.id === d.jobId);
    return job && job.hiredId === me.id && d.status === "open";
  }).length;
  return (
    <div className="fadein">
      <div className="qw-page-head">
        <div><h1 className="qw-page-title">Messages</h1><div className="qw-page-sub">Talk to listers and follow any open cases.</div></div>
        <Segmented value={pane} onChange={setPane} options={[
          { value: "chats", icon: <Icon name="chat" size={15} />, label: "Conversations" },
          { value: "disputes", icon: <Icon name="scale" size={15} />, label: openCases ? `Disputes (${openCases})` : "Disputes" },
        ]} />
      </div>
      {pane === "chats" ? <StudentChats me={me} /> : <MyDisputes role="student" meId={me.id} />}
    </div>
  );
}

function StudentChats({ me }) {
  const { state, dispatch } = useStore();
  const threads = state.jobs.filter((j) => j.hiredId === me.id);
  const [active, setActive] = stuS(threads[0]?.id || null);
  const job = threads.find((t) => t.id === active);
  const lister = job && state.listers.find((l) => l.id === job.listerId);

  if (threads.length === 0) return <EmptyState icon="chat" title="No conversations yet" text="Once a lister hires you, you can message them here." />;

  return (
    <div className="msg-layout">
      <div className="msg-list">
        <div className="msg-list-head">Conversations</div>
        {threads.map((t) => {
          const l = state.listers.find((x) => x.id === t.listerId);
          return (
            <button key={t.id} className={`msg-item${active === t.id ? " is-active" : ""}`} onClick={() => setActive(t.id)}>
              <Avatar name={l?.name} color={l?.color} size={40} />
              <div className="msg-item-txt"><b>{l?.name}</b><small>{t.title}</small></div>
            </button>
          );
        })}
      </div>
      <div className="msg-panel">
        {job ? <>
          <div className="msg-panel-head"><Avatar name={lister?.name} color={lister?.color} size={36} /><div><b>{lister?.name}</b><small>{job.title}</small></div></div>
          <ChatThread threadKey={`${job.id}__${me.id}`} me={me.id} other={lister?.id}
            onSend={(text) => dispatch({ type: "SEND_MSG", threadKey: `${job.id}__${me.id}`, from: me.id, text })} />
        </> : <EmptyState title="Select a conversation" />}
      </div>
    </div>
  );
}

// ---------- Profile edit ----------
function StudentProfileEdit({ me }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [skill, setSkill] = stuS("");

  const setPhoto = () => pickImage((url) => { dispatch({ type: "PATCH_STUDENT", id: me.id, patch: { photo: url } }); toast("Profile photo updated."); });
  const addSkill = () => { if (!skill.trim()) return; dispatch({ type: "PATCH_STUDENT", id: me.id, patch: { skills: [...me.skills, skill.trim()] } }); setSkill(""); };
  const rmSkill = (s) => dispatch({ type: "PATCH_STUDENT", id: me.id, patch: { skills: me.skills.filter((x) => x !== s) } });
  const setBio = (bio) => dispatch({ type: "PATCH_STUDENT", id: me.id, patch: { bio } });
  const addWork = () => pickImage(() => { dispatch({ type: "PATCH_STUDENT", id: me.id, patch: { workPhotos: [...me.workPhotos, "New upload"] } }); toast("Work photo added."); });

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">My Profile</h1><div className="qw-page-sub">This is what listers see when you apply.</div></div></div>
      <div className="prof-layout">
        <div>
          <Card className="prof-card">
            <div className="prof-photo-row">
              <div className="prof-photo" onClick={setPhoto}>
                <Avatar name={me.name} color={me.color} photo={me.photo} size={92} />
                <span className="prof-photo-edit"><Icon name="camera" size={15} /></span>
              </div>
              <div>
                <div className="qw-row" style={{ gap: 8 }}><h2 className="sp-name">{me.name}</h2>{me.verified && <Badge tone="green" soft><Icon name="check" size={12} stroke={2.6} />Verified</Badge>}</div>
                <div className="qw-muted" style={{ fontWeight: 600 }}>{me.year}</div>
                <div style={{ marginTop: 7 }}><Stars value={me.rating} showNum count={me.ratingCount} size={15} /></div>
              </div>
            </div>
            <Field label="Bio"><textarea className="qw-textarea" value={me.bio} onChange={(e) => setBio(e.target.value)} /></Field>
            <Field label="Skills" hint="Add what you're great at — listers filter by these.">
              <div className="skill-edit">
                {me.skills.map((s) => <span key={s} className="skill-tag">{s}<button onClick={() => rmSkill(s)}><Icon name="x" size={10} stroke={3} /></button></span>)}
              </div>
              <div className="qw-row" style={{ marginTop: 9 }}>
                <input className="qw-input" placeholder="e.g. Bartending" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                <Button variant="navy" onClick={addSkill}>Add</Button>
              </div>
            </Field>
          </Card>
        </div>
        <div>
          <Card className="prof-card">
            <div className="sp-sec-label" style={{ marginTop: 0 }}>Previous work</div>
            <div className="sp-photos">
              {me.workPhotos.map((w, i) => <div className="sp-photo" key={i}><div className="sp-photo-ph"><span>photo</span></div><span className="sp-photo-cap">{w}</span></div>)}
              <button className="work-add" onClick={addWork}>＋<small>Add photo</small></button>
            </div>
            <div className="sp-sec-label">Reviews ({me.reviews.length})</div>
            <div className="sp-reviews">
              {me.reviews.map((r, i) => <div className="sp-review" key={i}><div className="qw-row" style={{ justifyContent: "space-between" }}><b style={{ fontSize: 13.5 }}>{r.by}</b><Stars value={r.stars} size={12} /></div><p>{r.text}</p></div>)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Payouts ----------
function StudentPayouts({ me }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const payouts = state.ledger.filter((l) => l.to === me.id && l.type === "payout");
  const totalPaid = payouts.reduce((a, l) => a + l.amount, 0);
  const inEscrow = state.jobs
    .filter((j) => j.hiredId === me.id && (j.status === "hired" || j.status === "disputed"))
    .reduce((a, j) => a + j.price, 0);
  const completedCount = state.jobs.filter((j) => j.hiredId === me.id && j.status === "completed").length;
  const setup = () => dispatch({ type: "PATCH_STUDENT", id: me.id, patch: { payoutSet: true, payoutLast4: String(Math.floor(1000 + Math.random() * 9000)) } });

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Payouts</h1><div className="qw-page-sub">Track earnings and where your money lands.</div></div></div>
      <div className="qw-stat-grid" style={{ marginBottom: 20 }}>
        <div className="qw-stat"><div className="qw-stat-val" style={{ color: "var(--green)" }}><CountUp value={totalPaid} prefix="$" /></div><div className="qw-stat-label">Paid out</div></div>
        <div className="qw-stat"><div className="qw-stat-val" style={{ color: "var(--orange)" }}><CountUp value={inEscrow} prefix="$" /></div><div className="qw-stat-label">Pending (in escrow)</div></div>
        <div className="qw-stat"><div className="qw-stat-val"><CountUp value={completedCount} /></div><div className="qw-stat-label">Jobs completed</div></div>
      </div>
      <div className="prof-layout">
        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Payout method</div>
          {me.payoutSet ? (
            <div className="payout-method">
              <span className="payout-bank"><Icon name="bank" size={20} /></span>
              <div><b>Bank account ····{me.payoutLast4}</b><small>Stripe Connect · instant transfer</small></div>
              <Badge tone="green" soft style={{ marginLeft: "auto" }}>Active</Badge>
            </div>
          ) : (
            <div>
              <p className="qw-muted" style={{ fontSize: 14, marginTop: 0 }}>Add a payout method to get paid when you complete jobs.</p>
              <Button variant="primary" icon={<Icon name="link" size={15} />} onClick={() => { setup(); toast("Payout method connected."); }}>Set up payouts</Button>
            </div>
          )}
          <div className="qw-divider" />
          <div className="payout-note"><Icon name="lock" size={13} /> QuickWork never holds your bank details — payouts run through Stripe Connect in production.</div>
        </Card>
        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Recent payouts</div>
          {payouts.length === 0 ? <div className="qw-muted" style={{ fontSize: 13.5 }}>No payouts yet — finish a job to get paid.</div>
            : <div className="ledger-list">{payouts.map((p) => {
              const job = state.jobs.find((j) => j.id === p.jobId);
              return <div key={p.id} className="ledger-row"><div><b>{job?.title || "Job"}</b><small>{ago(p.t)}</small></div><b style={{ color: "var(--green)" }}>+{fmt$(p.amount)}</b></div>;
            })}</div>}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { StudentApp });
