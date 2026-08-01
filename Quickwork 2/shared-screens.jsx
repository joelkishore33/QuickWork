// ============================================================
// QuickWork — screens shared across roles
// ============================================================
const { useState: hS, useRef: hR, useEffect: hEff } = React;

// ---------- Student profile (full) ----------
function StudentProfileView({ student, compact }) {
  const s = student;
  return (
    <div className="sp">
      <div className="sp-head">
        <Avatar name={s.name} color={s.color} photo={s.photo} size={compact ? 64 : 84} ring="#fff" />
        <div style={{ flex: 1 }}>
          <div className="qw-row" style={{ gap: 8 }}>
            <h3 className="sp-name">{s.name}</h3>
            {s.verified && <Badge tone="green" soft><Icon name="check" size={12} stroke={2.6} />Verified</Badge>}
          </div>
          <div className="qw-muted" style={{ fontWeight: 600, marginTop: 2 }}>{s.year} · {s.email}</div>
          <div style={{ marginTop: 8 }}><Stars value={s.rating} showNum count={s.ratingCount} size={15} /></div>
        </div>
      </div>
      <p className="sp-bio">{s.bio}</p>
      <div className="sp-skills">
        {s.skills.map((sk) => <Pill key={sk}>{sk}</Pill>)}
      </div>

      <div className="sp-sec-label">Previous work</div>
      <div className="sp-photos">
        {s.workPhotos.map((w, i) => (
          <div className="sp-photo" key={i}>
            <div className="sp-photo-ph"><span>photo</span></div>
            <span className="sp-photo-cap">{w}</span>
          </div>
        ))}
      </div>

      <div className="sp-sec-label">Reviews ({s.reviews.length})</div>
      <div className="sp-reviews">
        {s.reviews.map((r, i) => (
          <div className="sp-review" key={i}>
            <div className="qw-row" style={{ justifyContent: "space-between" }}>
              <b style={{ fontSize: 13.5 }}>{r.by}</b>
              <Stars value={r.stars} size={12} />
            </div>
            <p>{r.text}</p>
            <span className="qw-muted" style={{ fontSize: 11.5 }}>{ago(r.t)}</span>
          </div>
        ))}
        {s.reviews.length === 0 && <div className="qw-muted" style={{ fontSize: 13 }}>No reviews yet.</div>}
      </div>
    </div>
  );
}

function StudentProfileModal({ studentId, onClose, footer }) {
  const { state } = useStore();
  const s = state.students.find((x) => x.id === studentId);
  return (
    <Modal open={!!studentId} onClose={onClose} width={560} label="Student profile">
      {s && (
        <div className="qw-modal-pad">
          <StudentProfileView student={s} />
          {footer && <div className="sp-foot">{footer(s)}</div>}
        </div>
      )}
    </Modal>
  );
}

// ---------- Chat thread ----------
function ChatThread({ threadKey, me, other, onSend }) {
  const { state } = useStore();
  const msgs = state.threads[threadKey] || [];
  const [text, setText] = hS("");
  const scrollRef = hR(null);
  hEff(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs.length]);
  const send = () => { if (!text.trim()) return; onSend(text.trim()); setText(""); };
  return (
    <div className="chat">
      <div className="chat-body" ref={scrollRef}>
        {msgs.length === 0 && <div className="chat-empty">Start the conversation.</div>}
        {msgs.map((m, i) => (
          <div key={i} className={`chat-row ${m.from === me ? "mine" : "theirs"}`}>
            <div className="chat-bubble">{m.text}</div>
            <span className="chat-time">{ago(m.t)}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input className="qw-input" placeholder="Type a message…" value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <Button variant="navy" onClick={send} icon={<Icon name="send" size={15} />} size="md">Send</Button>
      </div>
    </div>
  );
}

// ---------- Notification bell + dropdown ----------
function NotifBell({ role }) {
  const { state, dispatch } = useStore();
  const [open, setOpen] = hS(false);
  const list = state.notifications.filter((n) => n.role === role);
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="notif-wrap">
      <IconBtn active={open} badge={unread} title="Notifications"
        onClick={() => { setOpen((o) => !o); if (!open) dispatch({ type: "MARK_NOTIFS_READ", role }); }}><Icon name="bell" size={19} /></IconBtn>
      {open && (
        <>
          <div className="notif-scrim" onClick={() => setOpen(false)} />
          <div className="notif-pop">
            <div className="notif-head">Notifications</div>
            <div className="notif-list">
              {list.length === 0 && <div className="qw-empty-text" style={{ padding: "20px 16px" }}>You're all caught up.</div>}
              {list.map((n) => (
                <div key={n.id} className={`notif-item${!n.read ? " is-unread" : ""}`}>
                  <span className="notif-dot" />
                  <div><div className="notif-text">{n.text}</div><span className="qw-muted" style={{ fontSize: 11.5 }}>{ago(n.t)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Star picker ----------
function StarPicker({ value, onChange, size = 30 }) {
  const [hover, setHover] = hS(0);
  return (
    <div className="star-pick" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="star-pick-s" style={{ color: n <= (hover || value) ? "#E57200" : "#D8D2C6" }}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}>★</span>
      ))}
    </div>
  );
}

// ---------- generic status chip for a job ----------
function JobStatusChip({ status }) {
  const map = {
    pending: ["yellow", "hourglass", "Pending approval"], approved: ["green", "live", "Live on map"],
    rejected: ["red", "x", "Rejected"], hired: ["navy", "cap", "Student hired"],
    completed: ["green", "check", "Completed & paid"], disputed: ["red", "alert", "In dispute"],
    cancelled: ["gray", "arrowLeft", "Cancelled & refunded"],
  };
  const [tone, icon, label] = map[status] || ["gray", null, status];
  return <Badge tone={tone} soft>{icon && <Icon name={icon} size={12} stroke={2.4} />}{label}</Badge>;
}

// ---------- Help desk / feedback (students & listers) ----------
function HelpDesk({ role, name }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [subject, setSubject] = hS("");
  const [text, setText] = hS("");
  const mine = state.feedback.filter((f) => f.fromName === name);
  const submit = () => {
    if (!subject.trim() || !text.trim()) return;
    dispatch({ type: "SUBMIT_FEEDBACK", role, name, subject: subject.trim(), text: text.trim() });
    setSubject(""); setText(""); toast("Feedback sent to QuickWork — thanks!");
  };
  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Help Desk</h1><div className="qw-page-sub">Questions or issues? The QuickWork team reads every message.</div></div></div>
      <div className="prof-layout">
        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Send feedback</div>
          <Field label="Subject"><input className="qw-input" placeholder="What's this about?" value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
          <Field label="Message"><textarea className="qw-textarea" placeholder="Tell us what's going on…" value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <Button variant="primary" icon={<Icon name="mail" size={15} />} onClick={submit}>Send to QuickWork</Button>
        </Card>
        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Your messages</div>
          {mine.length === 0 ? <div className="qw-muted" style={{ fontSize: 13.5 }}>No messages yet.</div>
            : <div className="fb-list">{mine.map((f) => (
              <div key={f.id} className="fb-thread">
                <div className="fb-q"><b>{f.subject}</b><p>{f.text}</p><span className="qw-muted" style={{ fontSize: 11.5 }}>{ago(f.t)}</span></div>
                {f.reply ? <div className="fb-a"><span className="fb-a-tag">QuickWork replied</span><p>{f.reply}</p></div>
                  : <div className="fb-pending"><Icon name="hourglass" size={13} /> Awaiting reply</div>}
              </div>
            ))}</div>}
        </Card>
      </div>
    </div>
  );
}

// ---------- Back bar for full-page views ----------
function BackBar({ onBack, label = "Back", right }) {
  return (
    <div className="page-back-bar">
      <button className="page-back" onClick={onBack}><Icon name="arrowLeft" size={17} /> {label}</button>
      {right}
    </div>
  );
}

// ---------- Full-page student profile (lister view) ----------
function StudentProfilePage({ ctx, me, onBack }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const s = state.students.find((x) => x.id === ctx.studentId);
  const job = ctx.jobId ? state.jobs.find((j) => j.id === ctx.jobId) : null;
  if (!s) return null;
  const canDecide = job && job.status === "approved" && !job.hiredId && job.applicants.includes(s.id);
  const hire = () => { dispatch({ type: "HIRE_STUDENT", jobId: job.id, studentId: s.id, title: job.title }); toast(`Hired ${s.name} — they've been notified.`); onBack(); };
  const deny = () => { dispatch({ type: "DENY_STUDENT", jobId: job.id, studentId: s.id }); toast(`${s.name} was declined.`, "info"); onBack(); };

  return (
    <div className="fadein detail-page">
      <BackBar onBack={onBack} label={job ? `Back to “${job.title}”` : "Back"} />
      <Card className="detail-card">
        <div className="detail-body qw-modal-pad">
          <StudentProfileView student={s} />
        </div>
      </Card>
      {canDecide && (
        <div className="detail-actionbar">
          <div className="detail-actionbar-info">Reviewing for <b>{job.title}</b></div>
          <div className="qw-row" style={{ gap: 10 }}>
            <Button variant="ghost" onClick={deny}>Deny</Button>
            <Button variant="primary" icon={<Icon name="check" size={16} />} onClick={hire}>Hire {s.name.split(" ")[0]}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- My disputes (student + lister view) ----------
function MyDisputes({ role, meId }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [note, setNote] = hS("");
  const [activeId, setActiveId] = hS(null);

  const mine = state.disputes.filter((d) => {
    const job = state.jobs.find((j) => j.id === d.jobId);
    if (!job) return false;
    return role === "student" ? job.hiredId === meId : job.listerId === meId;
  });

  if (mine.length === 0) {
    return <EmptyState icon="scale" title="No open cases" text={role === "student"
      ? "If a job goes wrong, open a case from the job page and it'll appear here."
      : "If something goes wrong with a job, report it and the case will show up here."} />;
  }

  const addNote = (d) => {
    if (!note.trim()) return;
    dispatch({ type: "ADD_EVIDENCE", disputeId: d.id, by: role, kind: "note", note: note.trim() });
    setNote(""); toast("Your response was added to the case.");
  };
  const addFile = (d) => pickImage((src, name) => {
    dispatch({ type: "ADD_EVIDENCE", disputeId: d.id, by: role, kind: "file", note: name || "photo.jpg", src });
    toast("Photo added to the case.");
  });

  return (
    <div className="disputes-scroll">
      {mine.map((d) => {
        const job = state.jobs.find((j) => j.id === d.jobId);
        const stu = state.students.find((s) => s.id === job?.hiredId);
        const lst = state.listers.find((l) => l.id === job?.listerId);
        const nameFor = (by) => (by === "student" ? stu?.name : by === "lister" ? lst?.name : "QuickWork admin");
        const other = role === "student" ? lst : stu;
        const open = activeId === d.id;
        const resolvedForMe = d.status === "resolved" &&
          ((role === "student" && d.decision === "pay") || (role === "lister" && d.decision === "refund"));
        return (
          <Card className="prof-card" key={d.id} style={{ marginBottom: 14 }}>
            <div className="qw-row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="qw-row" style={{ gap: 8 }}>
                  <h3 className="job-card-title">{job?.title}</h3>
                  {d.status === "resolved"
                    ? <Badge tone={resolvedForMe ? "green" : "gray"} soft><Icon name="check" size={12} stroke={2.6} />{d.decision === "pay" ? "Paid to student" : "Refunded to lister"}</Badge>
                    : <Badge tone="yellow" soft><Icon name="hourglass" size={12} /> Under review</Badge>}
                </div>
                <div className="job-card-meta" style={{ marginTop: 4 }}>
                  <span>With {other?.name}</span><span>{fmt$(job?.price)} held</span><span>Opened {ago(d.t)}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setActiveId(open ? null : d.id)}>{open ? "Hide" : "View case"}</Button>
            </div>

            {d.status === "open" && (
              <div className="dispute-banner">
                <Icon name="lock" size={15} />
                <span>QuickWork is reviewing this case. The {fmt$(job?.price)} stays held until it's decided.</span>
              </div>
            )}

            {open && (
              <div className="fadein" style={{ marginTop: 14 }}>
                <div className="sp-sec-label" style={{ marginTop: 0 }}>Case file ({d.evidence.length})</div>
                <div className="evidence-list">
                  {d.evidence.map((e, i) => (
                    <div className={`evidence-item${e.by === role ? " is-mine" : ""}`} key={i}>
                      <span className="evidence-ico"><Icon name={e.type === "file" ? "camera" : "note"} size={15} /></span>
                      <div style={{ flex: 1 }}>
                        <b>{e.by === role ? "You" : nameFor(e.by) || e.by}<span className="evidence-role">{e.by}</span></b>
                        <p>{e.note}</p>
                        {e.src && <img className="evidence-thumb" src={e.src} alt="evidence" />}
                      </div>
                      <span className="qw-muted" style={{ fontSize: 11, marginLeft: "auto" }}>{ago(e.t)}</span>
                    </div>
                  ))}
                </div>
                {d.status === "open" && (
                  <div className="qw-row" style={{ marginTop: 12 }}>
                    <input className="qw-input" placeholder="Add your side of the story…" value={note}
                      onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote(d)} />
                    <Button variant="ghost" icon={<Icon name="camera" size={15} />} onClick={() => addFile(d)}>Photo</Button>
                    <Button variant="navy" onClick={() => addNote(d)}>Send</Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ---------- Read-only job detail modal (admin) ----------
function JobInfoModal({ jobId, onClose }) {
  const { state } = useStore();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const lister = state.listers.find((l) => l.id === job.listerId);
  const student = state.students.find((s) => s.id === job.hiredId);
  const applicants = job.applicants.map((id) => state.students.find((s) => s.id === id)).filter(Boolean);
  const meta = TIER_META[tierOf(job.price)];
  return (
    <Modal open={!!jobId} onClose={onClose} width={580} label="Job listing">
      <div className="jd-hero" style={{ background: meta.bg }}>
        <Badge tone="gray" soft>{job.category}</Badge>
        <div className="jd-price" style={{ color: meta.c }}>{fmt$(job.price)}</div>
      </div>
      <div className="qw-modal-pad" style={{ paddingTop: 18 }}>
        <div className="qw-row qw-modal-head-row" style={{ marginBottom: 8 }}><JobStatusChip status={job.status} /></div>
        <h2 className="jd-title">{job.title}</h2>
        <div className="jd-metas">
          <div className="jd-meta"><span><Icon name="pin" size={13} /> Location</span><b>{job.building}</b></div>
          <div className="jd-meta"><span><Icon name="clock" size={13} /> When</span><b>{job.when}</b></div>
          <div className="jd-meta"><span><Icon name="duration" size={13} /> Duration</span><b>{job.duration}</b></div>
          <div className="jd-meta"><span><Icon name="card" size={13} /> Posted</span><b>{ago(job.createdAt)}</b></div>
        </div>
        <div className="sp-sec-label" style={{ marginTop: 4 }}>Description</div>
        <p className="jd-desc">{job.desc}</p>

        <div className="sp-sec-label">People</div>
        <div className="ledger-parties-grid">
          <div className="ledger-party-card">
            <Avatar name={lister?.name} color={lister?.color} size={42} />
            <div><span className="ledger-party-role">Lister</span><b>{lister?.name || "—"}</b><small>{lister?.org}</small></div>
          </div>
          {student ? (
            <div className="ledger-party-card">
              <Avatar name={student.name} color={student.color} photo={student.photo} size={42} />
              <div><span className="ledger-party-role">Hired student</span><b>{student.name}</b><small>{student.year}</small></div>
            </div>
          ) : <div className="ledger-party-card is-empty"><span>No student hired</span></div>}
        </div>

        {applicants.length > 0 && (
          <>
            <div className="sp-sec-label">Applicants ({applicants.length})</div>
            <div className="ledger-parties">
              {applicants.map((s) => (
                <span className="ledger-party" key={s.id}><Avatar name={s.name} color={s.color} photo={s.photo} size={22} />{s.name}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

Object.assign(window, { StudentProfileView, StudentProfileModal, ChatThread, NotifBell, StarPicker, JobStatusChip, HelpDesk, BackBar, StudentProfilePage, MyDisputes, JobInfoModal });
