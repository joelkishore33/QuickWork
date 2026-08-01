// ============================================================
// QuickWork — Admin app
// ============================================================
const { useState: adS } = React;

function AdminApp({ shell }) {
  const { state } = useStore();
  const pending = state.jobs.filter((j) => j.status === "pending").length;
  const openDisputes = state.disputes.filter((d) => d.status === "open").length;
  const openFb = state.feedback.filter((f) => f.status === "open").length;
  const [tab, setTab] = adS("overview");

  const nav = [
    { id: "overview", icon: "grid", label: "Overview" },
    { id: "queue", icon: "check", label: "Approval Queue", count: pending || null },
    { id: "completions", icon: "clock", label: "Completions" },
    { id: "disputes", icon: "scale", label: "Disputes", count: openDisputes || null },
    { id: "ledger", icon: "receipt", label: "Payment Ledger" },
    { id: "feedback", icon: "inbox", label: "Feedback", count: openFb || null },
    { id: "audit", icon: "file", label: "Audit Log" },
  ];

  return shell({
    roleIcon: "shield", roleLabel: "QuickWork Admin", roleSub: "Staff console", roleColor: "#232D4B",
    nav, tab, setTab,
    content: (
      <>
        {tab === "overview" && <AdminOverview setTab={setTab} />}
        {tab === "queue" && <AdminQueue />}
        {tab === "completions" && <AdminCompletions />}
        {tab === "disputes" && <AdminDisputes />}
        {tab === "ledger" && <AdminLedger />}
        {tab === "feedback" && <AdminFeedback />}
        {tab === "audit" && <AdminAudit />}
      </>
    ),
  });
}

// ---------- Overview ----------
function AdminOverview({ setTab }) {
  const { state } = useStore();
  const pending = state.jobs.filter((j) => j.status === "pending");
  const held = state.ledger.filter((l) => l.status === "held").reduce((a, l) => a + l.amount, 0);
  const disputes = state.disputes.filter((d) => d.status === "open");
  const fb = state.feedback.filter((f) => f.status === "open");
  const live = state.jobs.filter((j) => j.status === "approved" || j.status === "hired").length;

  const attention = [
    pending.length && { icon: "check", text: `${pending.length} listing${pending.length > 1 ? "s" : ""} awaiting approval`, to: "queue", tone: "orange" },
    disputes.length && { icon: "scale", text: `${disputes.length} open dispute${disputes.length > 1 ? "s" : ""}`, to: "disputes", tone: "red" },
    fb.length && { icon: "inbox", text: `${fb.length} feedback message${fb.length > 1 ? "s" : ""} to answer`, to: "feedback", tone: "navy" },
  ].filter(Boolean);

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Admin Overview</h1><div className="qw-page-sub">Keep the marketplace fair, funded, and flowing.</div></div></div>
      <div className="qw-stat-grid" style={{ marginBottom: 24 }}>
        <div className="qw-stat"><div className="qw-stat-val" style={{ color: "var(--orange)" }}><CountUp value={held} prefix="$" /></div><div className="qw-stat-label">Funds held in escrow</div></div>
        <div className="qw-stat"><div className="qw-stat-val"><CountUp value={live} /></div><div className="qw-stat-label">Live jobs on map</div></div>
        <div className="qw-stat"><div className="qw-stat-val"><CountUp value={pending.length} /></div><div className="qw-stat-label">Pending approval</div></div>
        <div className="qw-stat"><div className="qw-stat-val"><CountUp value={state.students.length} /></div><div className="qw-stat-label">Verified students</div></div>
      </div>
      <div className="sp-sec-label" style={{ marginTop: 0 }}>Needs your attention</div>
      {attention.length === 0 ? <Card className="prof-card"><div className="qw-row" style={{ gap: 12 }}><span className="attn-ico attn-navy"><Icon name="sun" size={20} /></span><div><b>All clear.</b><div className="qw-muted" style={{ fontSize: 13.5 }}>No pending approvals, disputes, or feedback.</div></div></div></Card>
        : <div className="attn-grid">{attention.map((a, i) => (
          <button key={i} className="attn-card" onClick={() => setTab(a.to)}>
            <span className={`attn-ico attn-${a.tone}`}><Icon name={a.icon} size={20} /></span>
            <span className="attn-text">{a.text}</span>
            <span className="attn-arrow"><Icon name="arrowRight" size={17} /></span>
          </button>
        ))}</div>}
    </div>
  );
}

// ---------- Approval Queue ----------
function AdminQueue() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const pending = state.jobs.filter((j) => j.status === "pending");
  const approve = (j) => { dispatch({ type: "APPROVE_JOB", id: j.id, title: j.title }); toast(`Approved “${j.title}” — now live on the map.`); };
  const reject = (j) => { dispatch({ type: "REJECT_JOB", id: j.id, title: j.title }); toast(`Rejected & refunded “${j.title}”`, "warn"); };
  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Approval Queue</h1><div className="qw-page-sub">Review new listings before they appear on the campus map.</div></div></div>
      {pending.length === 0 ? <EmptyState icon="check" title="Queue is empty" text="Every listing has been reviewed. Nice work." />
        : <div className="qw-grid" style={{ maxWidth: 760 }}>{pending.map((j) => {
          const lister = state.listers.find((l) => l.id === j.listerId);
          return (
            <Card className="queue-card" key={j.id}>
              <div className="queue-main">
                <div className="qw-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <Badge tone="gray" soft>{j.category}</Badge>
                  <span className="job-card-price" style={{ color: TIER_META[tierOf(j.price)].c }}>{fmt$(j.price)} · held</span>
                </div>
                <h3 className="job-card-title">{j.title}</h3>
                <p className="jd-desc" style={{ margin: "6px 0 10px" }}>{j.desc}</p>
                <div className="job-card-meta"><span><Icon name="pin" size={14} /> {j.building}</span><span><Icon name="clock" size={14} /> {j.when}</span><span><Icon name="users" size={14} /> {lister?.name}</span></div>
              </div>
              <div className="queue-actions">
                <Button variant="danger" icon={<Icon name="x" size={15} stroke={2.6} />} onClick={() => reject(j)}>Reject</Button>
                <Button variant="primary" icon={<Icon name="check" size={15} />} onClick={() => approve(j)}>Approve</Button>
              </div>
            </Card>
          );
        })}</div>}
    </div>
  );
}

// ---------- Completions / reminders / auto-approve ----------
function AdminCompletions() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const jobs = state.jobs.filter((j) => j.status === "hired");
  const remind = (j) => { dispatch({ type: "SEND_REMINDER", jobId: j.id, title: j.title }); toast(`Reminder sent to lister for “${j.title}”`, "info"); };
  const fastForward = (j) => { dispatch({ type: "FF_REMIND", jobId: j.id }); };
  const autoApprove = (j) => { dispatch({ type: "APPROVE_COMPLETION", jobId: j.id, by: "admin" }); toast(`Auto-approved payout for “${j.title}”.`); };

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Completions</h1><div className="qw-page-sub">Reminders fire automatically once a job's scheduled time passes — nudge again or auto-release after 48 hours.</div></div></div>
      {jobs.length === 0 ? <EmptyState icon="clock" title="Nothing to chase" text="No hired jobs are waiting on completion confirmation." />
        : <div className="qw-grid" style={{ maxWidth: 760 }}>{jobs.map((j) => {
          const lister = state.listers.find((l) => l.id === j.listerId);
          const stu = state.students.find((s) => s.id === j.hiredId);
          const reminded = j.completion?.remindedAt;
          const hrsSince = reminded ? (now() - reminded) / 3600000 : 0;
          const windowPassed = reminded && hrsSince >= 48;
          return (
            <Card className="comp-card" key={j.id}>
              <div className="qw-row" style={{ justifyContent: "space-between" }}>
                <div><h3 className="job-card-title">{j.title}</h3><div className="job-card-meta" style={{ marginTop: 4 }}><span><Icon name="users" size={14} /> Lister: {lister?.name}</span><span><Icon name="cap" size={14} /> Hired: {stu?.name}</span></div></div>
                <span className="job-card-price" style={{ color: TIER_META[tierOf(j.price)].c }}>{fmt$(j.price)}</span>
              </div>
              <div className="comp-status">
                {j.completion?.autoSent && <Badge tone="navy" soft><Icon name="clock" size={12} /> Auto-reminded · job time passed</Badge>}
                {j.completion?.markedAt && <Badge tone="orange" soft><Icon name="check" size={12} /> Student marked complete</Badge>}
                {!reminded && <Badge tone="gray" soft>Job not finished yet</Badge>}
                {reminded && !windowPassed && <Badge tone="yellow" soft><Icon name="hourglass" size={12} /> Reminded · {Math.max(0, Math.ceil(48 - hrsSince))}h left in window</Badge>}
                {windowPassed && <Badge tone="red" soft><Icon name="alert" size={12} /> Lister unresponsive · window passed</Badge>}
              </div>
              <div className="qw-row" style={{ gap: 9, marginTop: 12, flexWrap: "wrap" }}>
                {!windowPassed && <Button size="sm" variant="navy" icon={<Icon name="bell" size={14} />} onClick={() => remind(j)}>{reminded ? "Re-send reminder" : "Send reminder"}</Button>}
                {reminded && !windowPassed && <Button size="sm" variant="ghost" icon={<Icon name="clock" size={14} />} onClick={() => fastForward(j)}>Simulate 48h</Button>}
                {windowPassed && <Button size="sm" variant="primary" icon={<Icon name="wallet" size={14} />} onClick={() => autoApprove(j)}>Auto-approve payout</Button>}
              </div>
            </Card>
          );
        })}</div>}
    </div>
  );
}

// ---------- Disputes ----------
function AdminDisputes() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [note, setNote] = adS("");
  const [activeId, setActiveId] = adS(null);
  const [jobInfo, setJobInfo] = adS(null);
  const disputes = state.disputes;
  const resolve = (d, decision) => { dispatch({ type: "RESOLVE_DISPUTE", disputeId: d.id, decision }); toast(decision === "pay" ? "Resolved — student paid." : "Resolved — lister refunded."); };
  const addEvidence = (d) => { if (!note.trim()) return; dispatch({ type: "ADD_EVIDENCE", disputeId: d.id, by: "admin", kind: "note", note: note.trim() }); setNote(""); toast("Evidence added to case file"); };
  const addFile = (d) => pickImage((url, name) => { dispatch({ type: "ADD_EVIDENCE", disputeId: d.id, by: "admin", kind: "file", note: name || "evidence.jpg", src: url }); toast("File attached to case"); });

  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Disputes</h1><div className="qw-page-sub">Review evidence and decide payout or refund.</div></div></div>
      {disputes.length === 0 ? <EmptyState icon="scale" title="No disputes" text="When a lister or student opens a dispute, the case lands here." />
        : <div className="qw-grid" style={{ maxWidth: 720 }}>{disputes.map((d) => {
          const job = state.jobs.find((j) => j.id === d.jobId);
          const stu = state.students.find((s) => s.id === job?.hiredId);
          const lst = state.listers.find((l) => l.id === job?.listerId);
          const nameFor = (by) => (by === "student" ? stu?.name : by === "lister" ? lst?.name : "QuickWork admin");
          const open = activeId === d.id;
          return (
            <Card className="prof-card" key={d.id}>
              <div className="qw-row" style={{ justifyContent: "space-between" }}>
                <div><div className="qw-row" style={{ gap: 8 }}><button className="job-title-link" onClick={() => setJobInfo(d.jobId)}>{job?.title}<Icon name="arrowRight" size={13} /></button>{d.status === "resolved" ? <Badge tone="green" soft><Icon name="check" size={12} stroke={2.6} />Resolved · {d.decision === "pay" ? "paid student" : "refunded"}</Badge> : <Badge tone="red" soft><span className="live-dot" />Open</Badge>}</div>
                  <div className="job-card-meta" style={{ marginTop: 4 }}><span>Opened by {nameFor(d.openedBy) || d.openedBy}</span><span>{fmt$(job?.price)} in escrow</span><span>{ago(d.t)}</span></div></div>
                <Button size="sm" variant="ghost" onClick={() => setActiveId(open ? null : d.id)}>{open ? "Hide" : "Review"}</Button>
              </div>
              <div className="dispute-parties">
                <div className="dispute-party">
                  <Avatar name={lst?.name} color={lst?.color} size={34} />
                  <div><span>Lister</span><b>{lst?.name || "—"}</b></div>
                </div>
                <Icon name="scale" size={16} style={{ color: "var(--muted)" }} />
                <div className="dispute-party">
                  <Avatar name={stu?.name} color={stu?.color} photo={stu?.photo} size={34} />
                  <div><span>Student</span><b>{stu?.name || "—"}</b></div>
                </div>
              </div>
              {open && (
                <div className="fadein" style={{ marginTop: 14 }}>
                  <div className="sp-sec-label" style={{ marginTop: 0 }}>Evidence ({d.evidence.length})</div>
                  <div className="evidence-list">
                    {d.evidence.length === 0 && <div className="qw-muted" style={{ fontSize: 13 }}>No evidence submitted yet.</div>}
                    {d.evidence.map((e, i) => (
                      <div className="evidence-item" key={i}>
                        <span className="evidence-ico"><Icon name={e.type === "file" ? "camera" : "note"} size={15} /></span>
                        <div style={{ flex: 1 }}><b>{nameFor(e.by) || e.by}<span className="evidence-role">{e.by}</span></b><p>{e.note}</p>{e.src && <img className="evidence-thumb" src={e.src} alt="evidence" />}</div>
                        <span className="qw-muted" style={{ fontSize: 11 }}>{ago(e.t)}</span>
                      </div>
                    ))}
                  </div>
                  {d.status === "open" && <>
                    <div className="qw-row" style={{ marginTop: 12 }}>
                      <input className="qw-input" placeholder="Add an admin note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEvidence(d)} />
                      <Button variant="ghost" icon={<Icon name="camera" size={15} />} onClick={() => addFile(d)}>File</Button>
                      <Button variant="navy" onClick={() => addEvidence(d)}>Add</Button>
                    </div>
                    <div className="qw-divider" />
                    <div className="qw-row" style={{ gap: 10, justifyContent: "flex-end" }}>
                      <Button variant="danger" icon={<Icon name="arrowLeft" size={15} />} onClick={() => resolve(d, "refund")}>Refund {lst?.name?.split(" ")[0] || "lister"}</Button>
                      <Button variant="primary" icon={<Icon name="wallet" size={15} />} onClick={() => resolve(d, "pay")}>Pay {stu?.name?.split(" ")[0] || "student"}</Button>
                    </div>
                  </>}
                </div>
              )}
            </Card>
          );
        })}</div>}
      <JobInfoModal jobId={jobInfo} onClose={() => setJobInfo(null)} />
    </div>
  );
}

// ---------- Ledger ----------
const LEDGER_META = {
  hold: ["Held", "lock"], payout: ["Paid out", "wallet"], refund: ["Refunded", "arrowLeft"], release: ["Released", "check"],
};
const LEDGER_TONE = { held: "yellow", paid: "green", refunded: "navy", released: "gray" };

function AdminLedger() {
  const { state } = useStore();
  const [view, setView] = adS("active");
  const [q, setQ] = adS("");
  const [detail, setDetail] = adS(null);
  const [jobInfo, setJobInfo] = adS(null);

  const partiesFor = (l) => {
    const job = state.jobs.find((j) => j.id === l.jobId);
    const lister = job && state.listers.find((x) => x.id === job.listerId);
    const student = state.students.find((s) => s.id === (job?.hiredId || l.to));
    return { job, lister, student };
  };

  const isActive = (l) => l.status === "held";
  const base = state.ledger.filter((l) => (view === "active" ? isActive(l) : !isActive(l)));
  const needle = q.trim().toLowerCase();
  const rows = base.filter((l) => {
    if (!needle) return true;
    const { job, lister, student } = partiesFor(l);
    return [job?.title, lister?.name, student?.name, l.type, l.status, String(l.amount)]
      .some((v) => v && String(v).toLowerCase().includes(needle));
  });

  const activeTotal = state.ledger.filter(isActive).reduce((a, l) => a + l.amount, 0);
  const settledTotal = state.ledger.filter((l) => !isActive(l)).reduce((a, l) => a + l.amount, 0);

  return (
    <div className="fadein">
      <div className="qw-page-head">
        <div><h1 className="qw-page-title">Payment Ledger</h1><div className="qw-page-sub">Every hold, release, payout, and refund.</div></div>
      </div>

      <div className="ledger-bar">
        <Segmented value={view} onChange={setView} options={[
          { value: "active", icon: <Icon name="lock" size={14} />, label: `In escrow (${state.ledger.filter(isActive).length})` },
          { value: "settled", icon: <Icon name="check" size={14} />, label: `Settled (${state.ledger.filter((l) => !isActive(l)).length})` },
        ]} />
        <div className="ledger-search">
          <Icon name="search" size={15} />
          <input className="qw-input" placeholder="Search job, lister, or student…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="ledger-clear" onClick={() => setQ("")}><Icon name="x" size={13} stroke={2.4} /></button>}
        </div>
        <div className="ledger-total">
          <span>{view === "active" ? "Held" : "Settled"}</span><b>{fmt$(view === "active" ? activeTotal : settledTotal)}</b>
        </div>
      </div>

      <Card className="prof-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="ledger-table">
          <thead><tr><th>Type</th><th>Job</th><th>Parties</th><th>Amount</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((l) => {
              const { job, lister, student } = partiesFor(l);
              const m = LEDGER_META[l.type] || ["—", "receipt"];
              return (
                <tr key={l.id} className="ledger-row-click" onClick={() => setDetail(l)}>
                  <td><span className="qw-row" style={{ gap: 7 }}><Icon name={m[1]} size={15} style={{ color: "var(--muted)" }} />{m[0]}</span></td>
                  <td className="ledger-job">{job
                    ? <button className="ledger-job-link" onClick={(e) => { e.stopPropagation(); setJobInfo(job.id); }}>{job.title}</button>
                    : "Archived job"}</td>
                  <td>
                    <div className="ledger-parties">
                      {lister && <span className="ledger-party"><Avatar name={lister.name} color={lister.color} size={20} />{lister.name.split(" ")[0]}</span>}
                      {student && <><Icon name="arrowRight" size={12} style={{ color: "var(--muted)" }} /><span className="ledger-party"><Avatar name={student.name} color={student.color} photo={student.photo} size={20} />{student.name.split(" ")[0]}</span></>}
                      {!student && <span className="qw-muted" style={{ fontSize: 12.5 }}>no student yet</span>}
                    </div>
                  </td>
                  <td><b>{fmt$(l.amount)}</b></td>
                  <td><Badge tone={LEDGER_TONE[l.status] || "gray"} soft>{l.status}</Badge></td>
                  <td className="qw-muted">{ago(l.t)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6}><div className="qw-empty" style={{ padding: "38px 20px" }}>
                <div className="qw-empty-title">{needle ? "No matching entries" : view === "active" ? "Nothing in escrow" : "Nothing settled yet"}</div>
                <div className="qw-empty-text">{needle ? "Try a different job, lister, or student name." : "Entries will appear here as money moves."}</div>
              </div></td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <LedgerDetailModal entry={detail} onClose={() => setDetail(null)}
        onOpenJob={(id) => { setDetail(null); setJobInfo(id); }} />
      <JobInfoModal jobId={jobInfo} onClose={() => setJobInfo(null)} />
    </div>
  );
}

function LedgerDetailModal({ entry, onClose, onOpenJob }) {
  const { state } = useStore();
  if (!entry) return null;
  const job = state.jobs.find((j) => j.id === entry.jobId);
  const lister = job && state.listers.find((x) => x.id === job.listerId);
  const student = state.students.find((s) => s.id === (job?.hiredId || entry.to));
  const m = LEDGER_META[entry.type] || ["—", "receipt"];
  const related = state.ledger.filter((l) => l.jobId === entry.jobId).sort((a, b) => a.t - b.t);

  const Party = ({ who, role, color, photo }) => (
    <div className="ledger-party-card">
      <Avatar name={who?.name} color={color} photo={photo} size={42} />
      <div><span className="ledger-party-role">{role}</span><b>{who?.name || "—"}</b>
        <small>{who?.org || who?.year || ""}</small></div>
    </div>
  );

  return (
    <Modal open={!!entry} onClose={onClose} width={560} label="Ledger entry">
      <div className="qw-modal-pad">
        <div className="qw-row qw-modal-head-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Badge tone={LEDGER_TONE[entry.status] || "gray"} soft><Icon name={m[1]} size={12} />{m[0]}</Badge>
          <span className="jd-price" style={{ fontSize: 26 }}>{fmt$(entry.amount)}</span>
        </div>
        {job
          ? <button className="job-title-link is-lg" onClick={() => onOpenJob(job.id)}>{job.title}<Icon name="arrowRight" size={15} /></button>
          : <h2 className="jd-title">Archived job</h2>}
        {job && <div className="job-card-meta" style={{ marginBottom: 16 }}>
          <span><Icon name="pin" size={14} /> {job.building}</span><span><Icon name="clock" size={14} /> {job.when}</span>
        </div>}

        <div className="sp-sec-label" style={{ marginTop: 0 }}>Parties</div>
        <div className="ledger-parties-grid">
          <Party who={lister} role="Lister (paying)" color={lister?.color} />
          {student ? <Party who={student} role="Student (earning)" color={student.color} photo={student.photo} />
            : <div className="ledger-party-card is-empty"><span>No student hired yet</span></div>}
        </div>

        <div className="sp-sec-label">Money trail for this job</div>
        <div className="ledger-trail">
          {related.map((l) => {
            const lm = LEDGER_META[l.type] || ["—", "receipt"];
            return (
              <div key={l.id} className={`ledger-trail-row${l.id === entry.id ? " is-current" : ""}`}>
                <span className="ledger-trail-ico"><Icon name={lm[1]} size={14} /></span>
                <div><b>{lm[0]}</b><small>{ago(l.t)}</small></div>
                <Badge tone={LEDGER_TONE[l.status] || "gray"} soft style={{ marginLeft: "auto" }}>{l.status}</Badge>
                <b style={{ minWidth: 56, textAlign: "right" }}>{fmt$(l.amount)}</b>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Feedback inbox ----------
function AdminFeedback() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [drafts, setDrafts] = adS({});
  const reply = (f) => { const r = (drafts[f.id] || "").trim(); if (!r) return; dispatch({ type: "REPLY_FEEDBACK", id: f.id, subject: f.subject, reply: r }); setDrafts((d) => ({ ...d, [f.id]: "" })); toast("Reply sent."); };
  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Feedback Inbox</h1><div className="qw-page-sub">Respond to students and listers.</div></div></div>
      <div className="qw-grid" style={{ maxWidth: 720 }}>
        {state.feedback.map((f) => (
          <Card className="prof-card" key={f.id}>
            <div className="qw-row" style={{ justifyContent: "space-between" }}>
              <div className="qw-row" style={{ gap: 9 }}><Badge tone={f.fromRole === "student" ? "orange" : "purple"} soft>{f.fromRole}</Badge><b>{f.fromName}</b></div>
              {f.status === "answered" ? <Badge tone="green" soft><Icon name="check" size={12} stroke={2.6} />Answered</Badge> : <Badge tone="yellow" soft><span className="live-dot" />Open</Badge>}
            </div>
            <h3 className="job-card-title" style={{ marginTop: 10 }}>{f.subject}</h3>
            <p className="jd-desc" style={{ margin: "5px 0 0" }}>{f.text}</p>
            {f.reply ? <div className="fb-a" style={{ marginTop: 12 }}><span className="fb-a-tag">Your reply</span><p>{f.reply}</p></div>
              : <div className="qw-row" style={{ marginTop: 12 }}>
                <input className="qw-input" placeholder="Write a reply…" value={drafts[f.id] || ""} onChange={(e) => setDrafts((d) => ({ ...d, [f.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && reply(f)} />
                <Button variant="navy" icon={<Icon name="send" size={15} />} onClick={() => reply(f)}>Reply</Button>
              </div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- Audit log ----------
function AdminAudit() {
  const { state } = useStore();
  const actorMeta = { admin: ["shield", "navy"], system: ["live", "gray"], lister: ["home", "purple"], student: ["cap", "orange"] };
  return (
    <div className="fadein">
      <div className="qw-page-head"><div><h1 className="qw-page-title">Audit Log</h1><div className="qw-page-sub">A timeline of major actions across QuickWork.</div></div></div>
      <Card className="prof-card" style={{ maxWidth: 700 }}>
        <div className="audit-list">
          {state.audit.map((a) => {
            const m = actorMeta[a.actor] || ["receipt", "gray"];
            return (
              <div className="audit-row" key={a.id}>
                <span className="audit-ico"><Icon name={m[0]} size={16} /></span>
                <div className="audit-body"><span className="audit-action">{a.action}</span><span className="qw-muted" style={{ fontSize: 12 }}>{ago(a.t)}</span></div>
                <Badge tone={m[1]} soft>{a.actor}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { AdminApp });
