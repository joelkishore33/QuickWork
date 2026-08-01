import React, { useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useSession } from "../state/SessionContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import AppShell from "../components/AppShell.jsx";
import Icon from "../components/Icon.jsx";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Modal, Segmented, Spinner } from "../components/ui.jsx";
import { JOB_STATUS_META, money, priceTier, TIER_META, timeAgo } from "../utils/format.js";

export default function AdminApp() {
  const [tab, setTab] = useState("overview");
  const overview = useApi(() => api.adminOverview(), []);
  const stats = overview.data || {};

  const nav = [
    { id: "overview", icon: "grid", label: "Overview" },
    { id: "queue", icon: "check", label: "Approval Queue", count: stats.pendingApproval || null },
    { id: "completions", icon: "clock", label: "Completions" },
    { id: "disputes", icon: "scale", label: "Disputes", count: stats.openDisputes || null },
    { id: "ledger", icon: "receipt", label: "Payment Ledger" },
    { id: "feedback", icon: "inbox", label: "Feedback", count: stats.unansweredFeedback || null },
    { id: "audit", icon: "file", label: "Audit Log" },
  ];

  return (
    <AppShell nav={nav} tab={tab} onTabChange={setTab} roleIcon="shield" roleLabel="QuickWork Admin" roleSub="Staff console">
      {tab === "overview" && <Overview state={overview} onJump={setTab} />}
      {tab === "queue" && <ApprovalQueue onChanged={overview.reload} />}
      {tab === "completions" && <Completions onChanged={overview.reload} />}
      {tab === "disputes" && <Disputes onChanged={overview.reload} />}
      {tab === "ledger" && <Ledger />}
      {tab === "feedback" && <FeedbackInbox onChanged={overview.reload} />}
      {tab === "audit" && <AuditLog />}
    </AppShell>
  );
}

function Overview({ state, onJump }) {
  const { data, loading, error, reload } = state;
  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const attention = [
    data.pendingApproval && { icon: "check", label: `${data.pendingApproval} listing(s) awaiting approval`, to: "queue", tone: "orange" },
    data.openDisputes && { icon: "scale", label: `${data.openDisputes} open dispute(s)`, to: "disputes", tone: "red" },
    data.unansweredFeedback && { icon: "inbox", label: `${data.unansweredFeedback} message(s) to answer`, to: "feedback", tone: "navy" },
  ].filter(Boolean);

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Admin Overview</h1>
          <div className="qw-page-sub">Keep the marketplace fair, funded, and flowing.</div>
        </div>
      </div>

      <div className="qw-stat-grid" style={{ marginBottom: 24 }}>
        <div className="qw-stat">
          <div className="qw-stat-val" style={{ color: "var(--orange)" }}>{money(data.heldTotal)}</div>
          <div className="qw-stat-label">Funds held in escrow</div>
        </div>
        <div className="qw-stat"><div className="qw-stat-val">{data.liveJobs}</div><div className="qw-stat-label">Live jobs</div></div>
        <div className="qw-stat"><div className="qw-stat-val">{data.pendingApproval}</div><div className="qw-stat-label">Pending approval</div></div>
        <div className="qw-stat"><div className="qw-stat-val">{data.studentCount}</div><div className="qw-stat-label">Verified students</div></div>
      </div>

      <div className="sp-sec-label" style={{ marginTop: 0 }}>Needs your attention</div>
      {attention.length === 0 ? (
        <Card className="prof-card"><b>All clear.</b></Card>
      ) : (
        <div className="attn-grid">
          {attention.map((item) => (
            <button key={item.to} className="attn-card" onClick={() => onJump(item.to)}>
              <span className={`attn-ico attn-${item.tone}`}><Icon name={item.icon} size={20} /></span>
              <span className="attn-text">{item.label}</span>
              <span className="attn-arrow"><Icon name="arrowRight" size={17} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalQueue({ onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.adminQueue(), []);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const act = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast(message);
      reload();
      onChanged?.();
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  const jobs = data || [];

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Approval Queue</h1>
          <div className="qw-page-sub">Review new listings before students see them.</div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon="check" title="Queue is empty" text="Every listing has been reviewed." />
      ) : (
        <div className="qw-grid" style={{ maxWidth: 760 }}>
          {jobs.map((job) => (
            <Card className="queue-card" key={job.id}>
              <div className="queue-main">
                <div className="qw-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <Badge tone="gray">{job.category}</Badge>
                  <span className="job-card-price" style={{ color: TIER_META[priceTier(job.price)].color }}>
                    {money(job.price)} · held
                  </span>
                </div>
                <h3 className="job-card-title">{job.title}</h3>
                <p className="jd-desc" style={{ margin: "6px 0 10px" }}>{job.description}</p>
                <div className="job-card-meta">
                  <span><Icon name="pin" size={14} /> {job.locationName}</span>
                  <span><Icon name="clock" size={14} /> {job.scheduleLabel}</span>
                  <span><Icon name="users" size={14} /> {job.lister?.name}</span>
                </div>
              </div>
              <div className="queue-actions">
                <Button variant="danger" disabled={busy} icon={<Icon name="x" size={15} />}
                  onClick={() => act(() => api.rejectJob(job.id, "Not a fit"), "Rejected and refunded.")}>
                  Reject
                </Button>
                <Button variant="primary" disabled={busy} icon={<Icon name="check" size={15} />}
                  onClick={() => act(() => api.approveJob(job.id), "Approved — now live.")}>
                  Approve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Completions({ onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.adminCompletions(), []);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const act = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast(message);
      reload();
      onChanged?.();
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  const jobs = data || [];

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Completions</h1>
          <div className="qw-page-sub">
            Reminders fire automatically once a job's window passes; payouts auto-release after 48 hours.
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon="clock" title="Nothing to chase" text="No jobs are waiting on confirmation." />
      ) : (
        <div className="qw-grid" style={{ maxWidth: 760 }}>
          {jobs.map((job) => {
            const remindedAt = job.reminderSentAt ? new Date(job.reminderSentAt).getTime() : null;
            const hoursSince = remindedAt ? (Date.now() - remindedAt) / 3600000 : 0;
            const lapsed = remindedAt && hoursSince >= 48;

            return (
              <Card className="comp-card" key={job.id}>
                <div className="qw-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <h3 className="job-card-title">{job.title}</h3>
                    <div className="job-card-meta" style={{ marginTop: 4 }}>
                      <span>Lister: {job.lister?.name}</span>
                      <span>Hired: {job.hiredStudent?.name}</span>
                    </div>
                  </div>
                  <span className="job-card-price" style={{ color: TIER_META[priceTier(job.price)].color }}>
                    {money(job.price)}
                  </span>
                </div>

                <div className="comp-status">
                  {job.reminderAutomatic && (
                    <Badge tone="navy"><Icon name="clock" size={12} /> Auto-reminded</Badge>
                  )}
                  {job.markedDoneAt && (
                    <Badge tone="orange"><Icon name="check" size={12} /> Student marked complete</Badge>
                  )}
                  {!remindedAt && <Badge tone="gray">Job not finished yet</Badge>}
                  {remindedAt && !lapsed && (
                    <Badge tone="yellow">
                      <Icon name="hourglass" size={12} /> {Math.max(0, Math.ceil(48 - hoursSince))}h left in window
                    </Badge>
                  )}
                  {lapsed && <Badge tone="red"><Icon name="alert" size={12} /> Window passed</Badge>}
                </div>

                <div className="qw-row" style={{ gap: 9, marginTop: 12, flexWrap: "wrap" }}>
                  <Button size="sm" variant="navy" disabled={busy} icon={<Icon name="bell" size={14} />}
                    onClick={() => act(() => api.remindLister(job.id), "Reminder sent.")}>
                    {remindedAt ? "Re-send reminder" : "Send reminder"}
                  </Button>
                  {lapsed && (
                    <Button size="sm" variant="primary" disabled={busy} icon={<Icon name="wallet" size={14} />}
                      onClick={() => act(() => api.forcePayout(job.id), "Payout released.")}>
                      Release payout now
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Disputes({ onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.adminDisputes(), []);
  const [expanded, setExpanded] = useState(null);
  const [note, setNote] = useState("");
  const [splitFor, setSplitFor] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const act = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast(message);
      reload();
      onChanged?.();
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  const disputes = data || [];

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Disputes</h1>
          <div className="qw-page-sub">Review evidence and decide payout, refund, or split.</div>
        </div>
      </div>

      {disputes.length === 0 ? (
        <EmptyState icon="scale" title="No disputes" text="Cases raised by either party land here." />
      ) : (
        <div className="qw-grid" style={{ maxWidth: 760 }}>
          {disputes.map((dispute) => {
            const job = dispute.job;
            const student = job.hiredStudent;
            const lister = job.lister;
            const isOpen = expanded === dispute.id;

            return (
              <Card className="prof-card" key={dispute.id}>
                <div className="qw-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="qw-row" style={{ gap: 8 }}>
                      <h3 className="job-card-title">{job.title}</h3>
                      {dispute.status === "RESOLVED" ? (
                        <Badge tone="green"><Icon name="check" size={12} stroke={2.6} /> Resolved</Badge>
                      ) : (
                        <Badge tone="red">Open</Badge>
                      )}
                    </div>
                    <div className="job-card-meta" style={{ marginTop: 4 }}>
                      <span>Opened by {dispute.openedBy?.name}</span>
                      <span>{money(job.price)} held</span>
                      <span>{timeAgo(dispute.createdAt)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : dispute.id)}>
                    {isOpen ? "Hide" : "Review"}
                  </Button>
                </div>

                <div className="dispute-parties">
                  <div className="dispute-party">
                    <Avatar name={lister?.name} color={lister?.color} size={34} />
                    <div><span>Lister</span><b>{lister?.name}</b></div>
                  </div>
                  <Icon name="scale" size={16} style={{ color: "var(--muted)" }} />
                  <div className="dispute-party">
                    <Avatar name={student?.name} color={student?.color} photo={student?.photo} size={34} />
                    <div><span>Student</span><b>{student?.name || "—"}</b></div>
                  </div>
                </div>

                {isOpen && (
                  <div className="fadein" style={{ marginTop: 14 }}>
                    <div className="sp-sec-label" style={{ marginTop: 0 }}>Evidence ({dispute.evidence.length})</div>
                    <div className="evidence-list">
                      {dispute.evidence.map((item) => (
                        <div className="evidence-item" key={item.id}>
                          <span className="evidence-ico">
                            <Icon name={item.imageData ? "camera" : "note"} size={15} />
                          </span>
                          <div style={{ flex: 1 }}>
                            <b>{item.author?.name}<span className="evidence-role">{item.authorRole?.toLowerCase()}</span></b>
                            <p>{item.note}</p>
                            {item.imageData && <img className="evidence-thumb" src={item.imageData} alt="evidence" />}
                          </div>
                          <span className="qw-muted" style={{ fontSize: 11, marginLeft: "auto" }}>
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {dispute.status === "OPEN" && (
                      <>
                        <div className="qw-row" style={{ marginTop: 12 }}>
                          <input className="qw-input" placeholder="Add an admin note…" value={note}
                            onChange={(e) => setNote(e.target.value)} />
                          <Button variant="navy" disabled={!note.trim() || busy}
                            onClick={() => act(async () => {
                              await api.addDisputeEvidence(dispute.id, { note: note.trim() });
                              setNote("");
                            }, "Note added to the case.")}>
                            Add
                          </Button>
                        </div>

                        <div className="qw-divider" />

                        {splitFor === dispute.id ? (
                          <SplitDecision
                            total={Number(job.price)}
                            busy={busy}
                            onCancel={() => setSplitFor(null)}
                            onConfirm={(amount) =>
                              act(() => api.resolveDispute(dispute.id, {
                                decision: "SPLIT", studentAmount: amount, note: "Split by admin",
                              }), "Case settled with a split.")
                            }
                          />
                        ) : (
                          <div className="qw-row" style={{ gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <Button variant="ghost" onClick={() => setSplitFor(dispute.id)}>Split…</Button>
                            <Button variant="danger" disabled={busy} icon={<Icon name="arrowLeft" size={15} />}
                              onClick={() => act(() => api.resolveDispute(dispute.id, { decision: "REFUND_LISTER" }),
                                "Refunded the lister.")}>
                              Refund {lister?.name?.split(" ")[0]}
                            </Button>
                            <Button variant="primary" disabled={busy} icon={<Icon name="wallet" size={15} />}
                              onClick={() => act(() => api.resolveDispute(dispute.id, { decision: "PAY_STUDENT" }),
                                "Paid the student.")}>
                              Pay {student?.name?.split(" ")[0]}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SplitDecision({ total, onCancel, onConfirm, busy }) {
  const [amount, setAmount] = useState(total / 2);
  return (
    <div className="mg-cancel fadein" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      <div>
        <b>Split {money(total)}</b>
        <small>Student gets {money(amount)}, lister gets {money(total - amount)}.</small>
      </div>
      <div className="qw-row" style={{ gap: 8 }}>
        <input className="qw-input" type="number" min={0} max={total} value={amount}
          style={{ width: 110 }} onChange={(e) => setAmount(Number(e.target.value))} />
        <Button size="sm" variant="quiet" onClick={onCancel}>Cancel</Button>
        <Button size="sm" variant="primary" disabled={busy} onClick={() => onConfirm(amount)}>Confirm split</Button>
      </div>
    </div>
  );
}

function Ledger() {
  const { data, loading, error, reload } = useApi(() => api.adminLedger(), []);
  const [view, setView] = useState("active");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const entries = data || [];
    const scoped = entries.filter((e) => (view === "active" ? e.status === "HELD" : e.status !== "HELD"));
    const needle = query.trim().toLowerCase();
    if (!needle) return scoped;
    return scoped.filter((e) =>
      [e.jobTitle, e.lister?.name, e.hiredStudent?.name, e.type, e.status, String(e.amount)]
        .some((v) => v && String(v).toLowerCase().includes(needle))
    );
  }, [data, view, query]);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const entries = data || [];
  const heldCount = entries.filter((e) => e.status === "HELD").length;
  const total = rows.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Payment Ledger</h1>
          <div className="qw-page-sub">Every hold, fee, payout, and refund.</div>
        </div>
      </div>

      <div className="ledger-bar">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "active", icon: <Icon name="lock" size={14} />, label: `In escrow (${heldCount})` },
            { value: "settled", icon: <Icon name="check" size={14} />, label: `Settled (${entries.length - heldCount})` },
          ]}
        />
        <div className="ledger-search">
          <Icon name="search" size={15} />
          <input className="qw-input" placeholder="Search job, lister, or student…" value={query}
            onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="ledger-total">
          <span>{view === "active" ? "Held" : "Settled"}</span>
          <b>{money(total)}</b>
        </div>
      </div>

      <Card className="prof-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="ledger-table">
          <thead>
            <tr><th>Type</th><th>Job</th><th>Parties</th><th>Amount</th><th>Status</th><th>When</th></tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.type}</td>
                <td className="ledger-job">{entry.jobTitle}</td>
                <td>
                  <div className="ledger-parties">
                    {entry.lister && (
                      <span className="ledger-party">
                        <Avatar name={entry.lister.name} color={entry.lister.color} size={20} />
                        {entry.lister.name.split(" ")[0]}
                      </span>
                    )}
                    {entry.hiredStudent && (
                      <>
                        <Icon name="arrowRight" size={12} style={{ color: "var(--muted)" }} />
                        <span className="ledger-party">
                          <Avatar name={entry.hiredStudent.name} color={entry.hiredStudent.color} size={20} />
                          {entry.hiredStudent.name.split(" ")[0]}
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td><b>{money(entry.amount)}</b></td>
                <td><Badge tone={entry.status === "HELD" ? "yellow" : entry.status === "PAID" ? "green" : "gray"}>
                  {entry.status.toLowerCase()}
                </Badge></td>
                <td className="qw-muted">{timeAgo(entry.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6}>
                <div className="qw-empty" style={{ padding: "38px 20px" }}>
                  <div className="qw-empty-title">Nothing here</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FeedbackInbox({ onChanged }) {
  const toast = useToast();
  const { data, loading, reload } = useApi(() => api.adminFeedback(), []);
  const [drafts, setDrafts] = useState({});

  if (loading) return <Spinner />;

  const reply = async (item) => {
    const text = (drafts[item.id] || "").trim();
    if (!text) return;
    try {
      await api.replyToFeedback(item.id, text);
      setDrafts((d) => ({ ...d, [item.id]: "" }));
      toast("Reply sent.");
      reload();
      onChanged?.();
    } catch (err) {
      toast(err.message, "warn");
    }
  };

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Feedback Inbox</h1>
          <div className="qw-page-sub">Respond to students and listers.</div>
        </div>
      </div>

      <div className="qw-grid" style={{ maxWidth: 720 }}>
        {(data || []).map((item) => (
          <Card className="prof-card" key={item.id}>
            <div className="qw-row" style={{ justifyContent: "space-between" }}>
              <div className="qw-row" style={{ gap: 9 }}>
                <Badge tone={item.authorRole === "STUDENT" ? "orange" : "purple"}>
                  {item.authorRole?.toLowerCase()}
                </Badge>
                <b>{item.author?.name}</b>
              </div>
              {item.answered
                ? <Badge tone="green"><Icon name="check" size={12} stroke={2.6} /> Answered</Badge>
                : <Badge tone="yellow">Open</Badge>}
            </div>
            <h3 className="job-card-title" style={{ marginTop: 10 }}>{item.subject}</h3>
            <p className="jd-desc" style={{ margin: "5px 0 0" }}>{item.body}</p>

            {item.reply ? (
              <div className="fb-a" style={{ marginTop: 12 }}>
                <span className="fb-a-tag">Your reply</span>
                <p>{item.reply}</p>
              </div>
            ) : (
              <div className="qw-row" style={{ marginTop: 12 }}>
                <input className="qw-input" placeholder="Write a reply…" value={drafts[item.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && reply(item)} />
                <Button variant="navy" onClick={() => reply(item)}>Reply</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuditLog() {
  const { data, loading } = useApi(() => api.adminAudit(), []);
  if (loading) return <Spinner />;

  const iconFor = (actor) =>
    ({ ADMIN: "shield", SYSTEM: "clock", LISTER: "home", STUDENT: "cap" }[actor] || "file");

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Audit Log</h1>
          <div className="qw-page-sub">A timeline of significant actions.</div>
        </div>
      </div>

      <Card className="prof-card" style={{ maxWidth: 720 }}>
        <div className="audit-list">
          {(data || []).map((event) => (
            <div className="audit-row" key={event.id}>
              <span className="audit-ico"><Icon name={iconFor(event.actor)} size={16} /></span>
              <div className="audit-body">
                <span className="audit-action">{event.action}</span>
                <span className="qw-muted" style={{ fontSize: 12 }}>{timeAgo(event.createdAt)}</span>
              </div>
              <Badge tone={event.actor === "SYSTEM" ? "gray" : "navy"}>{event.actor.toLowerCase()}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
