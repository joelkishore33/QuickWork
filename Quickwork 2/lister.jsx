// ============================================================
// QuickWork — Lister app
// ============================================================
const { useState: lsS } = React;

function ListerApp({ shell }) {
  const { state } = useStore();
  const me = state.listers.find((l) => l.id === state.session.userId);
  const [tab, setTabRaw] = lsS("listings");
  const [stuView, setStuView] = lsS(null); // { studentId, jobId }
  const [msgFocus, setMsgFocus] = lsS(null); // jobId to open in messages

  const myJobs = state.jobs.filter((j) => j.listerId === me.id);
  const needsAction = myJobs.filter((j) => j.applicants.length > 0 && !j.hiredId && j.status === "approved").length;

  const nav = [
    { id: "listings", icon: "list", label: "My Listings", count: myJobs.length || null },
    { id: "post", icon: "plus", label: "Post a Job" },
    { id: "applicants", icon: "users", label: "Applicants", count: needsAction || null },
    { id: "messages", icon: "chat", label: "Messages", count: state.disputes.filter((d) => {
      const job = state.jobs.find((j) => j.id === d.jobId);
      return job && job.listerId === me.id && d.status === "open";
    }).length || null },
    { id: "help", icon: "help", label: "Help Desk" },
  ];

  const setTab = (t) => { setStuView(null); setTabRaw(t); };
  const openStudent = (studentId, jobId) => setStuView({ studentId, jobId });
  const openMessages = (jobId) => { setStuView(null); setMsgFocus(jobId); setTabRaw("messages"); };

  return shell({
    roleIcon: "list", roleLabel: me.name, roleSub: "Lister · " + me.org, roleColor: me.color,
    nav, tab, setTab,
    content: stuView ? (
      <StudentProfilePage ctx={stuView} me={me} onBack={() => setStuView(null)} />
    ) : (
      <>
        {tab === "listings" && <ListerListings me={me} setTab={setTab} openStudent={openStudent} openMessages={openMessages} />}
        {tab === "post" && <ListerPost me={me} setTab={setTab} />}
        {tab === "applicants" && <ListerApplicants me={me} setTab={setTab} openStudent={openStudent} openMessages={openMessages} />}
        {tab === "messages" && <ListerMessages me={me} focusJobId={msgFocus} />}
        {tab === "help" && <HelpDesk role="lister" name={me.name} />}
      </>
    ),
  });
}

// ---------- Listings ----------
function ListerListings({ me, setTab, openStudent, openMessages }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [manage, setManage] = lsS(null);
  const jobs = state.jobs.filter((j) => j.listerId === me.id);
  const totalHeld = state.ledger.filter((l) => l.status === "held" && jobs.some((j) => j.id === l.jobId)).reduce((a, l) => a + l.amount, 0);

  return (
    <div className="fadein">
      <div className="qw-page-head">
        <div><h1 className="qw-page-title">My Listings</h1><div className="qw-page-sub">Manage your jobs, applicants, and payouts.</div></div>
        <Button variant="primary" icon={<Icon name="plus" size={16} />} onClick={() => setTab("post")}>Post a Job</Button>
      </div>
      <div className="qw-stat-grid" style={{ marginBottom: 22 }}>
        <div className="qw-stat"><div className="qw-stat-val"><CountUp value={jobs.length} /></div><div className="qw-stat-label">Total listings</div></div>
        <div className="qw-stat"><div className="qw-stat-val" style={{ color: "var(--orange)" }}><CountUp value={totalHeld} prefix="$" /></div><div className="qw-stat-label">Held in escrow</div></div>
        <div className="qw-stat"><div className="qw-stat-val"><CountUp value={jobs.filter((j) => j.hiredId).length} /></div><div className="qw-stat-label">Students hired</div></div>
      </div>
      {jobs.length === 0 ? <EmptyState icon="list" title="No listings yet" text="Post your first job and students nearby can apply." action={<Button variant="primary" onClick={() => setTab("post")}>Post a Job</Button>} />
        : <div className="job-grid">{jobs.map((j) => <ListingCard key={j.id} job={j} onManage={() => setManage(j.id)} />)}</div>}
      <ManageJobModal jobId={manage} onClose={() => setManage(null)} me={me} setTab={setTab} openStudent={(sid, jid) => { setManage(null); openStudent(sid, jid); }} openMessages={(jid) => { setManage(null); openMessages(jid); }} />
    </div>
  );
}

function ListingCard({ job, onManage }) {
  return (
    <Card hover onClick={onManage} className="job-card">
      <div className="job-card-top"><JobStatusChip status={job.status} /><span className="job-card-price" style={{ color: TIER_META[tierOf(job.price)].c }}>{fmt$(job.price)}</span></div>
      <h3 className="job-card-title">{job.title}</h3>
      <div className="job-card-meta"><span><Icon name="pin" size={14} /> {job.building}</span><span><Icon name="clock" size={14} /> {job.when}</span></div>
      <div className="job-card-foot">
        <span className="qw-pill"><Icon name="users" size={14} /> {job.applicants.length} applicant{job.applicants.length === 1 ? "" : "s"}</span>
        <span className="job-card-cta">Manage <Icon name="arrowRight" size={13} /></span>
      </div>
    </Card>
  );
}

// ---------- Manage modal ----------
function ManageJobModal({ jobId, onClose, me, setTab, openStudent, openMessages }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const celebrate = useCelebrate();
  const [reviewing, setReviewing] = lsS(false);
  const [reporting, setReporting] = lsS(false);
  const [confirmCancel, setConfirmCancel] = lsS(false);
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const hired = state.students.find((s) => s.id === job.hiredId);
  const applicants = job.applicants.map((id) => state.students.find((s) => s.id === id)).filter(Boolean);
  const viewProfile = (sid) => openStudent(sid, job.id);

  const hire = (s) => { dispatch({ type: "HIRE_STUDENT", jobId: job.id, studentId: s.id, title: job.title }); toast(`Hired ${s.name} — they've been notified.`); };
  const deny = (s) => { dispatch({ type: "DENY_STUDENT", jobId: job.id, studentId: s.id }); toast(`${s.name} was declined.`, "info"); };
  const approveDone = () => {
    dispatch({ type: "APPROVE_COMPLETION", jobId: job.id, by: "lister" });
    onClose();
    celebrate("Payment sent!", `${fmt$(job.price)} released to ${hired?.name}`);
  };
  const cancelJob = () => {
    dispatch({ type: "CANCEL_JOB", jobId: job.id, title: job.title, amount: job.price });
    onClose();
    toast(`Listing cancelled — ${fmt$(job.price)} refunded to you.`, "info");
  };

  return (
    <Modal open={!!jobId} onClose={onClose} width={680} label="Manage listing" className="qw-modal-manage">
      <div className="qw-modal-pad">
        <div className="qw-row qw-modal-head-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <JobStatusChip status={job.status} />
          <span className="job-card-price" style={{ color: TIER_META[tierOf(job.price)].c, fontSize: 22 }}>{fmt$(job.price)}</span>
        </div>
        <h2 className="jd-title" style={{ marginTop: 8 }}>{job.title}</h2>
        <div className="job-card-meta" style={{ marginBottom: 14 }}><span><Icon name="pin" size={14} /> {job.building}</span><span><Icon name="clock" size={14} /> {job.when}</span><span><Icon name="duration" size={14} /> {job.duration}</span></div>

        {job.status === "pending" && <div className="mg-banner"><Icon name="hourglass" size={16} /> This listing is awaiting QuickWork admin approval. <b>{fmt$(job.price)}</b> is held safely until it goes live.</div>}

        {/* hired student & completion */}
        {hired && (
          <div className="mg-block">
            <div className="sp-sec-label" style={{ marginTop: 0 }}>Hired student</div>
            <div className="applicant-row" onClick={() => viewProfile(hired.id)} style={{ cursor: "pointer" }}>
              <Avatar name={hired.name} color={hired.color} photo={hired.photo} size={44} />
              <div className="applicant-info"><b>{hired.name}</b><Stars value={hired.rating} size={12} count={hired.ratingCount} /></div>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); viewProfile(hired.id); }}>View profile</Button>
            </div>
            {job.status === "hired" && (
              <>
                <div className="mg-complete">
                  <div className="mg-complete-txt"><b>Job done?</b><small>Approve to release {fmt$(job.price)} from escrow to {hired.name.split(" ")[0]}.</small></div>
                </div>
                <div className="qw-row" style={{ gap: 9, marginTop: 4 }}>
                  <Button variant="primary" icon={<Icon name="check" size={16} />} onClick={approveDone}>Approve & pay</Button>
                  <Button variant="navy" icon={<Icon name="chat" size={16} />} onClick={() => openMessages(job.id)}>Message</Button>
                  <Button variant="danger" icon={<Icon name="alert" size={16} />} onClick={() => setReporting(true)}>Report issue</Button>
                </div>
              </>
            )}
            {job.status === "completed" && (
              <div className="mg-done">
                <span className="mg-done-txt"><span className="mg-done-check"><Icon name="check" size={13} stroke={3} /></span>Completed — {hired.name} was paid {fmt$(job.price)}.</span>
                {!reviewing && !job.reviewed && <Button size="sm" variant="soft" icon={<Icon name="star" size={14} />} onClick={() => setReviewing(true)}>Leave a review</Button>}
              </div>
            )}
            {reviewing && <ReviewForm student={hired} by={me.name} onDone={() => { setReviewing(false); toast("Review posted."); }} />}
          </div>
        )}

        {/* applicants */}
        {!hired && job.status === "approved" && (
          <div className="mg-block">
            <div className="sp-sec-label" style={{ marginTop: 0 }}>Applicants ({applicants.length})</div>
            {applicants.length === 0 ? <div className="qw-muted" style={{ fontSize: 13.5 }}>No applicants yet. Hang tight — your job is live on the map.</div>
              : applicants.map((s) => (
                <div className="applicant-row" key={s.id}>
                  <Avatar name={s.name} color={s.color} photo={s.photo} size={44} />
                  <div className="applicant-info" onClick={() => viewProfile(s.id)} style={{ cursor: "pointer" }}><b>{s.name} {s.verified && <span title="Verified" style={{ color: "var(--green)", display: "inline-flex", verticalAlign: "middle" }}><Icon name="check" size={13} stroke={2.6} /></span>}</b><Stars value={s.rating} size={12} count={s.ratingCount} /></div>
                  <div className="qw-row" style={{ gap: 7 }}>
                    <Button size="sm" variant="ghost" onClick={() => viewProfile(s.id)}>Profile</Button>
                    <Button size="sm" variant="quiet" onClick={() => deny(s)}>Deny</Button>
                    <Button size="sm" variant="primary" onClick={() => hire(s)}>Hire</Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* cancel & refund — only before a student is hired */}
        {!hired && (job.status === "approved" || job.status === "pending") && (
          confirmCancel ? (
            <div className="mg-cancel fadein">
              <div><b>Cancel this listing?</b><small>{fmt$(job.price)} goes back to your payment method and the job leaves the map.</small></div>
              <div className="qw-row" style={{ gap: 8 }}>
                <Button size="sm" variant="quiet" onClick={() => setConfirmCancel(false)}>Keep it</Button>
                <Button size="sm" variant="danger" icon={<Icon name="arrowLeft" size={14} />} onClick={cancelJob}>Cancel & refund</Button>
              </div>
            </div>
          ) : (
            <button className="mg-cancel-link" onClick={() => setConfirmCancel(true)}>Cancel listing & get refunded</button>
          )
        )}
      </div>
      <ReportIssueModal open={reporting} onClose={() => setReporting(false)} job={job} hired={hired}
        onSubmitted={() => { setReporting(false); onClose(); }} />
    </Modal>
  );
}

// ---------- Report an issue (dispute) ----------
function ReportIssueModal({ open, onClose, job, hired, onSubmitted }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [text, setText] = lsS("");
  const [photos, setPhotos] = lsS([]); // {src, name}
  if (!open) return null;
  const addPhoto = () => pickImage((src, name) => setPhotos((p) => [...p, { src, name: name || "photo.jpg" }]));
  const rmPhoto = (i) => setPhotos((p) => p.filter((_, k) => k !== i));
  const submit = () => {
    if (!text.trim()) return;
    const evidence = [{ by: "lister", type: "note", note: text.trim(), t: now() },
      ...photos.map((p) => ({ by: "lister", type: "file", note: p.name, src: p.src, t: now() }))];
    dispatch({ type: "OPEN_DISPUTE", jobId: job.id, openedBy: "lister", title: job.title, evidence });
    toast("Issue reported — QuickWork admin will review.", "warn");
    onSubmitted();
  };
  return (
    <Modal open={open} onClose={onClose} width={500} label="Report an issue">
      <div className="qw-modal-pad">
        <div className="ri-head"><span className="ri-ico"><Icon name="alert" size={22} /></span>
          <div><h2 className="jd-title" style={{ margin: 0, fontSize: 20 }}>Report an issue</h2>
            <div className="qw-muted" style={{ fontSize: 13.5 }}>About “{job.title}”{hired ? ` with ${hired.name}` : ""}</div></div></div>
        <p className="ri-note">Tell us what went wrong. Your {fmt$(job.price)} stays held in escrow while QuickWork reviews — no money moves until it's resolved.</p>
        <Field label="What happened?">
          <textarea className="qw-textarea" placeholder="Describe the issue — e.g. the work wasn't completed, or didn't match what was agreed…" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 110 }} />
        </Field>
        <div className="qw-field-label" style={{ marginBottom: 7 }}>Add photos (optional)</div>
        <div className="ri-photos">
          {photos.map((p, i) => (
            <div className="ri-photo" key={i} style={{ backgroundImage: `url(${p.src})` }}>
              <button className="ri-photo-x" onClick={() => rmPhoto(i)} title="Remove"><Icon name="x" size={12} stroke={3} /></button>
            </div>
          ))}
          <button className="ri-photo-add" onClick={addPhoto}><Icon name="camera" size={20} /><small>Add photo</small></button>
        </div>
        <div className="sp-foot" style={{ borderTop: "none", paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" icon={<Icon name="alert" size={15} />} disabled={!text.trim()} onClick={submit}>Submit report</Button>
        </div>
      </div>
    </Modal>
  );
}

function ReviewForm({ student, by, onDone }) {
  const { dispatch } = useStore();
  const [stars, setStars] = lsS(5);
  const [text, setText] = lsS("");
  return (
    <div className="review-form fadein">
      <div className="sp-sec-label" style={{ marginTop: 6 }}>Review {student.name.split(" ")[0]}</div>
      <StarPicker value={stars} onChange={setStars} />
      <textarea className="qw-textarea" placeholder="How did it go?" value={text} onChange={(e) => setText(e.target.value)} style={{ margin: "10px 0" }} />
      <Button variant="primary" disabled={!text.trim()} onClick={() => { dispatch({ type: "ADD_REVIEW", studentId: student.id, by, stars, text: text.trim() }); onDone(); }}>Post review</Button>
    </div>
  );
}

// ---------- Post a job ----------
const CATEGORIES = ["Moving", "Pet Care", "Tutoring", "Events", "Design", "Photography", "Cleaning", "Tech Help", "Other"];
function ListerPost({ me, setTab }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [f, setF] = lsS({ title: "", category: "Moving", price: "", building: "", when: "", duration: "", desc: "" });
  const [paid, setPaid] = lsS(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.title && f.price && f.building && f.when && f.desc;

  const submit = () => {
    const price = Number(f.price);
    const job = {
      id: uid("job"), title: f.title, listerId: me.id, price, category: f.category,
      x: 30 + Math.random() * 45, y: 25 + Math.random() * 45, building: f.building,
      when: f.when, duration: f.duration || "Flexible", desc: f.desc,
      endsAt: now() + 3600000 * 24,
      status: "pending", applicants: [], hiredId: null, escrow: price, completion: null, createdAt: now(),
    };
    dispatch({ type: "CREATE_JOB", job });
    toast(`Listing posted! ${fmt$(price)} held — pending admin approval.`);
    setTab("listings");
  };

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Post a Job</h1><div className="qw-page-sub">Pay upfront — QuickWork holds the funds until the work's done.</div></div></div>
      <div className="post-layout">
        <Card className="prof-card">
          <Field label="Job title"><input className="qw-input" placeholder="e.g. Help move a couch up 3 flights" value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <div className="post-2col">
            <Field label="Category"><select className="qw-select" value={f.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Pay ($)" hint={f.price ? TIER_META[tierOf(Number(f.price))].label + " tier" : "Sets the pin color"}><input className="qw-input" type="number" placeholder="45" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
          </div>
          <div className="post-2col">
            <Field label="Location"><input className="qw-input" placeholder="e.g. Rugby Road" value={f.building} onChange={(e) => set("building", e.target.value)} /></Field>
            <Field label="When"><input className="qw-input" placeholder="e.g. Sat Jun 14 · 10 AM" value={f.when} onChange={(e) => set("when", e.target.value)} /></Field>
          </div>
          <Field label="Estimated duration"><input className="qw-input" placeholder="e.g. ~2 hrs" value={f.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
          <Field label="Description"><textarea className="qw-textarea" placeholder="Describe the job, what to bring, and any details…" value={f.desc} onChange={(e) => set("desc", e.target.value)} /></Field>
        </Card>

        <div>
          <Card className="prof-card pay-card">
            <div className="sp-sec-label" style={{ marginTop: 0 }}>Preview</div>
            <Card className="job-card" style={{ marginBottom: 18 }}>
              <div className="job-card-top"><Badge tone="gray" soft>{f.category}</Badge><span className="job-card-price" style={{ color: f.price ? TIER_META[tierOf(Number(f.price))].c : "var(--muted)" }}>{f.price ? fmt$(Number(f.price)) : "$—"}</span></div>
              <h3 className="job-card-title">{f.title || "Your job title"}</h3>
              <div className="job-card-meta"><span><Icon name="pin" size={14} /> {f.building || "Location"}</span><span><Icon name="clock" size={14} /> {f.when || "When"}</span></div>
            </Card>
            <div className="pay-summary">
              <div className="pay-row"><span>Job payment</span><b>{f.price ? fmt$(Number(f.price)) : "$0"}</b></div>
              <div className="pay-row"><span>QuickWork fee (10%)</span><b>{f.price ? fmt$(Number(f.price) * 0.1) : "$0"}</b></div>
              <div className="pay-row total"><span>Charged today</span><b>{f.price ? fmt$(Number(f.price) * 1.1) : "$0"}</b></div>
            </div>
            <label className={`pay-method${paid ? " is-set" : ""}`} onClick={() => setPaid(true)}>
              <Icon name="card" size={20} />{paid ? <div><b>Visa ····4242</b><small>Ready to charge</small></div> : <div><b>Add payment method</b><small>Mock · Stripe in production</small></div>}
              {paid && <span style={{ marginLeft: "auto", color: "var(--green)", display: "inline-flex" }}><Icon name="check" size={16} stroke={2.6} /></span>}
            </label>
            <Button variant="primary" full size="lg" disabled={!valid || !paid} onClick={submit}>{valid && paid ? `Pay ${fmt$(Number(f.price) * 1.1)} & post` : "Complete the form to post"}</Button>
            <div className="payout-note" style={{ marginTop: 12 }}><Icon name="lock" size={13} /> Funds are held in escrow and only released when you approve completion.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Applicants overview ----------
function ListerApplicants({ me, setTab, openStudent, openMessages }) {
  const { state } = useStore();
  const [manage, setManage] = lsS(null);
  const jobs = state.jobs.filter((j) => j.listerId === me.id && j.status === "approved" && !j.hiredId && j.applicants.length > 0);
  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Applicants</h1><div className="qw-page-sub">Students waiting on your decision.</div></div></div>
      {jobs.length === 0 ? <EmptyState icon="users" title="No pending applicants" text="When students apply to your live jobs, they'll show up here." />
        : <div className="job-grid">{jobs.map((j) => <ListingCard key={j.id} job={j} onManage={() => setManage(j.id)} />)}</div>}
      <ManageJobModal jobId={manage} onClose={() => setManage(null)} me={me} setTab={setTab} openStudent={(sid, jid) => { setManage(null); openStudent(sid, jid); }} openMessages={(jid) => { setManage(null); openMessages(jid); }} />
    </div>
  );
}

// ---------- Messages ----------
function ListerMessages({ me, focusJobId }) {
  const { state } = useStore();
  const [pane, setPane] = lsS("chats");
  const openCases = state.disputes.filter((d) => {
    const job = state.jobs.find((j) => j.id === d.jobId);
    return job && job.listerId === me.id && d.status === "open";
  }).length;
  return (
    <div className="fadein">
      <div className="qw-page-head">
        <div><h1 className="qw-page-title">Messages</h1><div className="qw-page-sub">Talk to students and follow any open cases.</div></div>
        <Segmented value={pane} onChange={setPane} options={[
          { value: "chats", icon: <Icon name="chat" size={15} />, label: "Conversations" },
          { value: "disputes", icon: <Icon name="scale" size={15} />, label: openCases ? `Disputes (${openCases})` : "Disputes" },
        ]} />
      </div>
      {pane === "chats" ? <ListerChats me={me} focusJobId={focusJobId} /> : <MyDisputes role="lister" meId={me.id} />}
    </div>
  );
}

function ListerChats({ me, focusJobId }) {
  const { state, dispatch } = useStore();
  const threads = state.jobs.filter((j) => j.listerId === me.id && j.hiredId);
  const [active, setActive] = lsS(focusJobId || threads[0]?.id || null);
  React.useEffect(() => { if (focusJobId) setActive(focusJobId); }, [focusJobId]);
  const job = threads.find((t) => t.id === active);
  const stu = job && state.students.find((s) => s.id === job.hiredId);
  if (threads.length === 0) return <EmptyState icon="chat" title="No conversations yet" text="Hire a student and you can message them here." />;
  return (
    <div className="msg-layout">
      <div className="msg-list">
        <div className="msg-list-head">Conversations</div>
        {threads.map((t) => {
          const s = state.students.find((x) => x.id === t.hiredId);
          return <button key={t.id} className={`msg-item${active === t.id ? " is-active" : ""}`} onClick={() => setActive(t.id)}><Avatar name={s?.name} color={s?.color} photo={s?.photo} size={40} /><div className="msg-item-txt"><b>{s?.name}</b><small>{t.title}</small></div></button>;
        })}
      </div>
      <div className="msg-panel">
        {job ? <>
          <div className="msg-panel-head"><Avatar name={stu?.name} color={stu?.color} photo={stu?.photo} size={36} /><div><b>{stu?.name}</b><small>{job.title}</small></div></div>
          <ChatThread threadKey={`${job.id}__${stu.id}`} me={me.id} other={stu.id} onSend={(text) => dispatch({ type: "SEND_MSG", threadKey: `${job.id}__${stu.id}`, from: me.id, text })} />
        </> : <EmptyState title="Select a conversation" />}
      </div>
    </div>
  );
}

Object.assign(window, { ListerApp });
