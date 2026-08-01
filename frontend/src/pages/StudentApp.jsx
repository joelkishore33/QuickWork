import React, { useState } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useSession } from "../state/SessionContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import AppShell from "../components/AppShell.jsx";
import Icon from "../components/Icon.jsx";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Field, Segmented, Spinner, Stars } from "../components/ui.jsx";
import { JOB_STATUS_META, money, priceTier, TIER_META, timeAgo } from "../utils/format.js";
import MessagesPane from "../components/MessagesPane.jsx";
import HelpDesk from "../components/HelpDesk.jsx";

export default function StudentApp() {
  const { user } = useSession();
  const [tab, setTab] = useState("browse");
  const [jobId, setJobId] = useState(null);

  const dashboard = useApi(() => api.studentDashboard(), []);
  const disputes = useApi(() => api.myDisputes(), []);

  const openCases = (disputes.data || []).filter((d) => d.status === "OPEN").length;
  const activeJobs = (dashboard.data?.hiredJobs || []).filter((j) => j.status === "HIRED").length;

  const nav = [
    { id: "browse", icon: "search", label: "Find Work" },
    { id: "jobs", icon: "briefcase", label: "My Jobs", count: (dashboard.data?.applications || []).length || null },
    { id: "messages", icon: "chat", label: "Messages", count: activeJobs + openCases || null },
    { id: "profile", icon: "cap", label: "My Profile" },
    { id: "payouts", icon: "wallet", label: "Payouts" },
    { id: "help", icon: "help", label: "Help Desk" },
  ];

  const openJob = (id) => setJobId(id);
  const changeTab = (next) => {
    setJobId(null);
    setTab(next);
  };
  const refreshAll = () => {
    dashboard.reload();
    disputes.reload();
  };

  return (
    <AppShell
      nav={nav}
      tab={tab}
      onTabChange={changeTab}
      roleIcon="cap"
      roleLabel={user.name}
      roleSub={`Student · ${user.year || ""}`}
      onRoleClick={() => changeTab("profile")}
    >
      {jobId ? (
        <JobDetail jobId={jobId} onBack={() => setJobId(null)} onChanged={refreshAll} goToMessages={() => changeTab("messages")} />
      ) : (
        <>
          {tab === "browse" && <BrowseJobs openJob={openJob} />}
          {tab === "jobs" && <MyJobs dashboard={dashboard} openJob={openJob} />}
          {tab === "messages" && <MessagesPane role="student" openCases={openCases} />}
          {tab === "profile" && <StudentProfile />}
          {tab === "payouts" && <Payouts dashboard={dashboard} />}
          {tab === "help" && <HelpDesk />}
        </>
      )}
    </AppShell>
  );
}

function BrowseJobs({ openJob }) {
  const { data, loading, error, reload } = useApi(() => api.openJobs(), []);
  const [tiers, setTiers] = useState(["green", "yellow", "red"]);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const jobs = (data || []).filter((job) => tiers.includes(priceTier(job.price)));
  const toggle = (tier) =>
    setTiers((current) => (current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier]));

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Find Work</h1>
          <div className="qw-page-sub">{jobs.length} open near Grounds</div>
        </div>
      </div>

      <div className="browse-filters">
        <span className="browse-filter-label">Price</span>
        {Object.entries(TIER_META).map(([key, meta]) => (
          <button
            key={key}
            className={`tier-chip${tiers.includes(key) ? " is-on" : ""}`}
            onClick={() => toggle(key)}
            style={{ "--tc": meta.color }}
          >
            <span className="tier-dot" /> {meta.label}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="Nothing matches" text="Try turning a price filter back on." />
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => openJob(job.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, onClick, chip }) {
  const meta = TIER_META[priceTier(job.price)];
  return (
    <Card hover onClick={onClick} className="job-card">
      <div className="job-card-top">
        {chip || <Badge tone="gray">{job.category}</Badge>}
        <span className="job-card-price" style={{ color: meta.color }}>
          {money(job.price)}
        </span>
      </div>
      <h3 className="job-card-title">{job.title}</h3>
      <div className="job-card-meta">
        <span>
          <Icon name="pin" size={14} /> {job.locationName}
        </span>
        <span>
          <Icon name="clock" size={14} /> {job.scheduleLabel}
        </span>
      </div>
      <div className="job-card-foot">
        <div className="qw-row" style={{ gap: 8 }}>
          <Avatar name={job.lister?.name} color={job.lister?.color} size={26} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{job.lister?.name}</span>
        </div>
        <span className="job-card-cta">
          View <Icon name="arrowRight" size={13} />
        </span>
      </div>
    </Card>
  );
}

function JobDetail({ jobId, onBack, onChanged, goToMessages }) {
  const { user } = useSession();
  const toast = useToast();
  const { data: job, loading, error, reload } = useApi(() => api.job(jobId), [jobId]);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!job) return null;

  const meta = TIER_META[priceTier(job.price)];
  const applied = (job.applications || []).some((a) => a.student?.id === user.id);
  const hired = job.hiredStudent?.id === user.id;
  const marked = Boolean(job.markedDoneAt);

  const run = async (fn, message) => {
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

  return (
    <div className="detail-page">
      <div className="page-back-bar">
        <button className="page-back" onClick={onBack}>
          <Icon name="arrowLeft" size={17} /> Back
        </button>
      </div>

      <Card className="detail-card">
        <div className="jd-hero" style={{ background: meta.background }}>
          <Badge tone="gray">{job.category}</Badge>
          <div className="jd-price" style={{ color: meta.color }}>
            {money(job.price)}
          </div>
        </div>
        <div className="qw-modal-pad" style={{ paddingTop: 20 }}>
          <h2 className="jd-title">{job.title}</h2>
          <div className="jd-metas">
            <div className="jd-meta">
              <span>
                <Icon name="pin" size={13} /> Location
              </span>
              <b>{job.locationName}</b>
            </div>
            <div className="jd-meta">
              <span>
                <Icon name="clock" size={13} /> When
              </span>
              <b>{job.scheduleLabel}</b>
            </div>
            <div className="jd-meta">
              <span>
                <Icon name="duration" size={13} /> Duration
              </span>
              <b>{job.durationLabel || "Flexible"}</b>
            </div>
            <div className="jd-meta">
              <span>
                <Icon name="card" size={13} /> Payout
              </span>
              <b>Held in escrow</b>
            </div>
          </div>
          <div className="sp-sec-label" style={{ marginTop: 4 }}>
            About this job
          </div>
          <p className="jd-desc">{job.description}</p>
          <div className="jd-lister">
            <Avatar name={job.lister?.name} color={job.lister?.color} size={44} />
            <div>
              <b>{job.lister?.name}</b>
              <small>{job.lister?.organization}</small>
            </div>
            <Badge tone="green" style={{ marginLeft: "auto" }}>
              <Icon name="check" size={12} stroke={2.6} /> Funds secured
            </Badge>
          </div>
        </div>
      </Card>

      {hired && job.status === "HIRED" && (
        <Card className="stu-work-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>
            Your work
          </div>
          {marked ? (
            <div className="stu-work-done">
              <span className="mg-done-check">
                <Icon name="check" size={13} stroke={3} />
              </span>
              <div>
                <b>Marked complete — waiting on {job.lister?.name?.split(" ")[0]}</b>
                <small>If they don't confirm within 48 hours, your {money(job.price)} releases automatically.</small>
              </div>
            </div>
          ) : (
            <div className="stu-work-prompt">
              <div>
                <b>Finished the job?</b>
                <small>Let the lister know so they can release your payment.</small>
              </div>
              <Button
                variant="primary"
                disabled={busy}
                icon={<Icon name="check" size={16} />}
                onClick={() => run(() => api.markDone(job.id), "Lister notified — 48-hour window started.")}
              >
                I finished this work
              </Button>
            </div>
          )}
          <div className="qw-divider" />
          <div className="stu-work-prompt">
            <div>
              <b>Something go wrong?</b>
              <small>Not paid, or the job wasn't as described? Open a case with QuickWork.</small>
            </div>
            <Button variant="danger" icon={<Icon name="alert" size={15} />} onClick={() => setReporting(true)}>
              Report a problem
            </Button>
          </div>
        </Card>
      )}

      <div className="detail-actionbar">
        <div className="detail-actionbar-info">
          {hired
            ? "You're hired for this job."
            : applied
            ? "Your application is in — the lister will be in touch."
            : "Like this gig? Send an application."}
        </div>
        {hired ? (
          <Button variant="navy" icon={<Icon name="chat" size={16} />} onClick={goToMessages}>
            Message lister
          </Button>
        ) : applied ? (
          <Button variant="soft" disabled icon={<Icon name="check" size={15} />}>
            Application sent
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={busy}
            icon={<Icon name="hand" size={16} />}
            onClick={() => run(() => api.applyToJob(job.id), "Application sent — good luck!")}
          >
            Apply now
          </Button>
        )}
      </div>

      <ReportProblemModal
        open={reporting}
        job={job}
        onClose={() => setReporting(false)}
        onSubmitted={() => {
          setReporting(false);
          reload();
          onChanged?.();
        }}
      />
    </div>
  );
}

function ReportProblemModal({ open, job, onClose, onSubmitted }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await api.openDispute(job.id, { note });
      toast("Case opened — QuickWork will review it.");
      onSubmitted();
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qw-modal-scrim" onClick={onClose}>
      <div className="qw-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <button className="qw-modal-x" onClick={onClose}>
          <Icon name="x" size={15} stroke={2.4} />
        </button>
        <div className="qw-modal-pad">
          <div className="ri-head">
            <span className="ri-ico">
              <Icon name="alert" size={22} />
            </span>
            <div>
              <h2 className="jd-title" style={{ margin: 0 }}>
                Report a problem
              </h2>
              <div className="qw-muted" style={{ fontSize: 13.5 }}>
                {job.title}
              </div>
            </div>
          </div>
          <p className="ri-note">The {money(job.price)} stays held while we review.</p>
          <Field label="What went wrong?">
            <textarea
              className="qw-textarea"
              placeholder="e.g. I completed the work on Saturday but haven't been paid…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <div className="sp-foot" style={{ borderTop: "none", paddingTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>
              Never mind
            </Button>
            <Button variant="danger" disabled={!note.trim() || busy} onClick={submit}>
              Submit report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyJobs({ dashboard, openJob }) {
  const { data, loading, error, reload } = dashboard;
  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const applications = data?.applications || [];
  const hiredJobs = data?.hiredJobs || [];

  const active = hiredJobs.filter((j) => j.status === "HIRED" || j.status === "DISPUTED");
  const completed = hiredJobs.filter((j) => j.status === "COMPLETED");
  const pending = applications.filter((a) => a.status === "PENDING" && !a.jobEnded);
  const closed = applications.filter((a) => a.status === "DECLINED" || a.status === "WITHDRAWN");

  const Section = ({ title, icon, children, count, muted }) => (
    <div style={{ marginBottom: 26 }}>
      <div className="myjobs-sec">
        <Icon name={icon} size={18} style={{ color: muted ? "var(--muted)" : "var(--orange)" }} />
        {title} <span className="myjobs-count">{count}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">My Jobs</h1>
          <div className="qw-page-sub">Applications, active work, and completed gigs.</div>
        </div>
      </div>

      <Section title="Hired — in progress" icon="check" count={active.length}>
        {active.length === 0 ? (
          <div className="qw-muted" style={{ fontSize: 13.5 }}>No active jobs yet.</div>
        ) : (
          <div className="job-grid">
            {active.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJob(job.id)}
                chip={<Badge tone={JOB_STATUS_META[job.status]?.tone}>{JOB_STATUS_META[job.status]?.label}</Badge>}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Awaiting decision" icon="hourglass" count={pending.length}>
        {pending.length === 0 ? (
          <div className="qw-muted" style={{ fontSize: 13.5 }}>Nothing pending — go find some work.</div>
        ) : (
          <div className="job-grid">
            {pending.map((application) => (
              <Card key={application.id} hover className="job-card" onClick={() => openJob(application.jobId)}>
                <div className="job-card-top">
                  <Badge tone="orange">
                    <Icon name="hourglass" size={12} /> Awaiting decision
                  </Badge>
                </div>
                <h3 className="job-card-title">{application.jobTitle}</h3>
                <div className="qw-muted" style={{ fontSize: 12.5 }}>Applied {timeAgo(application.createdAt)}</div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {closed.length > 0 && (
        <Section title="Closed — not selected" icon="x" count={closed.length} muted>
          <div className="job-grid is-muted">
            {closed.map((application) => (
              <Card key={application.id} className="job-card">
                <div className="job-card-top">
                  <Badge tone="gray">Not selected</Badge>
                </div>
                <h3 className="job-card-title">{application.jobTitle}</h3>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section title="Completed" icon="trophy" count={completed.length}>
        {completed.length === 0 ? (
          <div className="qw-muted" style={{ fontSize: 13.5 }}>Finished jobs will appear here.</div>
        ) : (
          <div className="job-grid">
            {completed.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJob(job.id)}
                chip={<Badge tone="green">Paid {money(job.price)}</Badge>}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function StudentProfile() {
  const { user, refresh } = useSession();
  const toast = useToast();
  const reviews = useApi(() => api.userReviews(user.id), [user.id]);
  const [bio, setBio] = useState(user.bio || "");
  const [skills, setSkills] = useState(user.skills || []);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ bio, skills });
      await refresh();
      toast("Profile updated.");
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">My Profile</h1>
          <div className="qw-page-sub">This is what listers see when you apply.</div>
        </div>
        <Button variant="primary" disabled={saving} onClick={save}>
          Save changes
        </Button>
      </div>

      <div className="prof-layout">
        <Card className="prof-card">
          <div className="prof-photo-row">
            <Avatar name={user.name} color={user.color} photo={user.photo} size={92} />
            <div>
              <div className="qw-row" style={{ gap: 8 }}>
                <h2 className="sp-name">{user.name}</h2>
                {user.verified && (
                  <Badge tone="green">
                    <Icon name="check" size={12} stroke={2.6} /> Verified
                  </Badge>
                )}
              </div>
              <div className="qw-muted" style={{ fontWeight: 600 }}>{user.year}</div>
              <div style={{ marginTop: 7 }}>
                <Stars value={user.rating || 0} showNumber count={user.reviewCount || 0} size={15} />
              </div>
            </div>
          </div>

          <Field label="Bio">
            <textarea className="qw-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>

          <Field label="Skills" hint="Listers scan these first.">
            <div className="skill-edit">
              {skills.map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))}>
                    <Icon name="x" size={10} stroke={3} />
                  </button>
                </span>
              ))}
            </div>
            <div className="qw-row" style={{ marginTop: 9 }}>
              <input
                className="qw-input"
                placeholder="e.g. Bartending"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    setSkills([...skills, draft.trim()]);
                    setDraft("");
                  }
                }}
              />
              <Button
                variant="navy"
                onClick={() => {
                  if (!draft.trim()) return;
                  setSkills([...skills, draft.trim()]);
                  setDraft("");
                }}
              >
                Add
              </Button>
            </div>
          </Field>
        </Card>

        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>
            Reviews ({reviews.data?.length || 0})
          </div>
          <div className="sp-reviews">
            {(reviews.data || []).map((review) => (
              <div className="sp-review" key={review.id}>
                <div className="qw-row" style={{ justifyContent: "space-between" }}>
                  <b style={{ fontSize: 13.5 }}>{review.author?.name}</b>
                  <Stars value={review.stars} size={12} />
                </div>
                <p>{review.body}</p>
                <span className="qw-muted" style={{ fontSize: 11.5 }}>{timeAgo(review.createdAt)}</span>
              </div>
            ))}
            {(reviews.data || []).length === 0 && (
              <div className="qw-muted" style={{ fontSize: 13 }}>No reviews yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Payouts({ dashboard }) {
  const { user, refresh } = useSession();
  const toast = useToast();
  const { data, loading, error, reload } = dashboard;

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const setupPayout = async () => {
    try {
      await api.configurePayout(String(Math.floor(1000 + Math.random() * 9000)));
      await refresh();
      toast("Payout method connected.");
    } catch (err) {
      toast(err.message, "warn");
    }
  };

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Payouts</h1>
          <div className="qw-page-sub">Earnings and where the money lands.</div>
        </div>
      </div>

      <div className="qw-stat-grid" style={{ marginBottom: 20 }}>
        <div className="qw-stat">
          <div className="qw-stat-val" style={{ color: "var(--green)" }}>{money(data.totalPaid)}</div>
          <div className="qw-stat-label">Paid out</div>
        </div>
        <div className="qw-stat">
          <div className="qw-stat-val" style={{ color: "var(--orange)" }}>{money(data.inEscrow)}</div>
          <div className="qw-stat-label">Pending (in escrow)</div>
        </div>
        <div className="qw-stat">
          <div className="qw-stat-val">{data.completedCount}</div>
          <div className="qw-stat-label">Jobs completed</div>
        </div>
      </div>

      <div className="prof-layout">
        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Payout method</div>
          {user.payoutConfigured ? (
            <div className="payout-method">
              <span className="payout-bank">
                <Icon name="wallet" size={20} />
              </span>
              <div>
                <b>Bank account ····{user.payoutLast4}</b>
                <small>Payment provider connects here</small>
              </div>
              <Badge tone="green" style={{ marginLeft: "auto" }}>Active</Badge>
            </div>
          ) : (
            <div>
              <p className="qw-muted" style={{ fontSize: 14, marginTop: 0 }}>
                Add a payout method to get paid when you complete jobs.
              </p>
              <Button variant="primary" onClick={setupPayout}>Set up payouts</Button>
            </div>
          )}
        </Card>

        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Recent payouts</div>
          {(data.payouts || []).length === 0 ? (
            <div className="qw-muted" style={{ fontSize: 13.5 }}>No payouts yet.</div>
          ) : (
            <div className="ledger-list">
              {data.payouts.map((entry) => (
                <div key={entry.id} className="ledger-row">
                  <div>
                    <b>{entry.jobTitle}</b>
                    <small>{timeAgo(entry.createdAt)}</small>
                  </div>
                  <b style={{ color: "var(--green)" }}>+{money(entry.amount)}</b>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
