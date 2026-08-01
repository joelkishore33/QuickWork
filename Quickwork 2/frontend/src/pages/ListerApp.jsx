import React, { useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useSession } from "../state/SessionContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import AppShell from "../components/AppShell.jsx";
import Icon from "../components/Icon.jsx";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Field, Modal, Spinner, Stars } from "../components/ui.jsx";
import { JOB_STATUS_META, money, priceTier, TIER_META, timeAgo } from "../utils/format.js";
import MessagesPane from "../components/MessagesPane.jsx";
import HelpDesk from "../components/HelpDesk.jsx";

const CATEGORIES = ["Moving", "Pet Care", "Tutoring", "Events", "Design", "Photography", "Cleaning", "Yard Work", "Tech Help", "Other"];

export default function ListerApp() {
  const { user } = useSession();
  const [tab, setTab] = useState("listings");
  const [manageId, setManageId] = useState(null);

  const listings = useApi(() => api.myListings(), []);
  const disputes = useApi(() => api.myDisputes(), []);

  const jobs = listings.data || [];
  const needsDecision = jobs.filter((j) => j.status === "OPEN" && (j.applicantCount || 0) > 0).length;
  const openCases = (disputes.data || []).filter((d) => d.status === "OPEN").length;

  const nav = [
    { id: "listings", icon: "list", label: "My Listings", count: jobs.length || null },
    { id: "post", icon: "plus", label: "Post a Job" },
    { id: "applicants", icon: "users", label: "Applicants", count: needsDecision || null },
    { id: "messages", icon: "chat", label: "Messages", count: openCases || null },
    { id: "help", icon: "help", label: "Help Desk" },
  ];

  const refresh = () => {
    listings.reload();
    disputes.reload();
  };

  return (
    <AppShell
      nav={nav}
      tab={tab}
      onTabChange={setTab}
      roleIcon="home"
      roleLabel={user.name}
      roleSub={`Lister · ${user.organization || ""}`}
    >
      {tab === "listings" && <Listings state={listings} onManage={setManageId} goPost={() => setTab("post")} />}
      {tab === "post" && <PostJob onPosted={() => { refresh(); setTab("listings"); }} />}
      {tab === "applicants" && <ApplicantsView state={listings} onManage={setManageId} />}
      {tab === "messages" && <MessagesPane role="lister" openCases={openCases} />}
      {tab === "help" && <HelpDesk />}

      <ManageJobModal
        jobId={manageId}
        onClose={() => setManageId(null)}
        onChanged={refresh}
        goToMessages={() => { setManageId(null); setTab("messages"); }}
      />
    </AppShell>
  );
}

function Listings({ state, onManage, goPost }) {
  const { data, loading, error, reload } = state;
  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const jobs = data || [];
  const held = jobs
    .filter((j) => ["PENDING_APPROVAL", "OPEN", "HIRED", "DISPUTED"].includes(j.status))
    .reduce((sum, j) => sum + Number(j.price), 0);

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">My Listings</h1>
          <div className="qw-page-sub">Manage your jobs, applicants, and payouts.</div>
        </div>
        <Button variant="primary" icon={<Icon name="plus" size={16} />} onClick={goPost}>
          Post a Job
        </Button>
      </div>

      <div className="qw-stat-grid" style={{ marginBottom: 22 }}>
        <div className="qw-stat">
          <div className="qw-stat-val">{jobs.length}</div>
          <div className="qw-stat-label">Total listings</div>
        </div>
        <div className="qw-stat">
          <div className="qw-stat-val" style={{ color: "var(--orange)" }}>{money(held)}</div>
          <div className="qw-stat-label">Held in escrow</div>
        </div>
        <div className="qw-stat">
          <div className="qw-stat-val">{jobs.filter((j) => j.hiredStudent).length}</div>
          <div className="qw-stat-label">Students hired</div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon="list"
          title="No listings yet"
          text="Post your first job and students nearby can apply."
          action={<Button variant="primary" onClick={goPost}>Post a Job</Button>}
        />
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <ListingCard key={job.id} job={job} onClick={() => onManage(job.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ job, onClick }) {
  const meta = JOB_STATUS_META[job.status] || { tone: "gray", label: job.status };
  return (
    <Card hover onClick={onClick} className="job-card">
      <div className="job-card-top">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span className="job-card-price" style={{ color: TIER_META[priceTier(job.price)].color }}>
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
        <span className="qw-pill">
          <Icon name="users" size={14} /> {job.applicantCount || 0} applicant{job.applicantCount === 1 ? "" : "s"}
        </span>
        <span className="job-card-cta">
          Manage <Icon name="arrowRight" size={13} />
        </span>
      </div>
    </Card>
  );
}

function ApplicantsView({ state, onManage }) {
  const jobs = (state.data || []).filter((j) => j.status === "OPEN" && (j.applicantCount || 0) > 0);
  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Applicants</h1>
          <div className="qw-page-sub">Students waiting on your decision.</div>
        </div>
      </div>
      {jobs.length === 0 ? (
        <EmptyState icon="users" title="No pending applicants" text="Applications to your live jobs land here." />
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <ListingCard key={job.id} job={job} onClick={() => onManage(job.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostJob({ onPosted }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: "", category: "Moving", price: "", locationName: "",
    scheduleLabel: "", durationLabel: "", description: "", endsAt: "",
  });
  const [paymentAdded, setPaymentAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const price = Number(form.price || 0);
  const fee = price * 0.1;
  const valid = form.title && price > 0 && form.locationName && form.scheduleLabel && form.description;

  const submit = async () => {
    setBusy(true);
    try {
      await api.createJob({
        ...form,
        price,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      });
      toast(`Listing posted — ${money(price)} held pending approval.`);
      onPosted();
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Post a Job</h1>
          <div className="qw-page-sub">Pay upfront — QuickWork holds the funds until the work's done.</div>
        </div>
      </div>

      <div className="post-layout">
        <Card className="prof-card">
          <Field label="Job title">
            <input className="qw-input" placeholder="e.g. Help move a couch up 3 flights"
              value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="post-2col">
            <Field label="Category">
              <select className="qw-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Pay ($)" hint={price > 0 ? `${TIER_META[priceTier(price)].label} tier` : "What the student earns"}>
              <input className="qw-input" type="number" placeholder="45"
                value={form.price} onChange={(e) => set("price", e.target.value)} />
            </Field>
          </div>
          <div className="post-2col">
            <Field label="Location">
              <input className="qw-input" placeholder="e.g. Rugby Road"
                value={form.locationName} onChange={(e) => set("locationName", e.target.value)} />
            </Field>
            <Field label="When (label)">
              <input className="qw-input" placeholder="e.g. Sat Jun 14 · 10 AM"
                value={form.scheduleLabel} onChange={(e) => set("scheduleLabel", e.target.value)} />
            </Field>
          </div>
          <div className="post-2col">
            <Field label="Ends at" hint="Drives reminders and expiry.">
              <input className="qw-input" type="datetime-local"
                value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
            <Field label="Estimated duration">
              <input className="qw-input" placeholder="e.g. ~2 hrs"
                value={form.durationLabel} onChange={(e) => set("durationLabel", e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="qw-textarea" placeholder="Describe the job, what to bring, and any details…"
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </Card>

        <Card className="prof-card pay-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Payment</div>
          <div className="pay-summary">
            <div className="pay-row"><span>Job payment</span><b>{money(price)}</b></div>
            <div className="pay-row"><span>QuickWork fee (10%)</span><b>{money(fee)}</b></div>
            <div className="pay-row total"><span>Charged today</span><b>{money(price + fee)}</b></div>
          </div>
          <label className={`pay-method${paymentAdded ? " is-set" : ""}`} onClick={() => setPaymentAdded(true)}>
            <Icon name="card" size={20} />
            {paymentAdded
              ? <div><b>Card ····4242</b><small>Ready to charge</small></div>
              : <div><b>Add payment method</b><small>Payment provider plugs in here</small></div>}
            {paymentAdded && <Icon name="check" size={16} style={{ marginLeft: "auto", color: "var(--green)" }} />}
          </label>
          <Button variant="primary" full size="lg" disabled={!valid || !paymentAdded || busy} onClick={submit}>
            {valid && paymentAdded ? `Pay ${money(price + fee)} & post` : "Complete the form to post"}
          </Button>
          <div className="payout-note" style={{ marginTop: 12 }}>
            <Icon name="lock" size={12} /> Funds are held in escrow and only released when you approve completion.
          </div>
        </Card>
      </div>
    </div>
  );
}

function ManageJobModal({ jobId, onClose, onChanged, goToMessages }) {
  const toast = useToast();
  const { data: job, loading, reload } = useApi(() => (jobId ? api.job(jobId) : Promise.resolve(null)), [jobId]);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reporting, setReporting] = useState(false);

  if (!jobId) return null;

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

  const statusMeta = job ? JOB_STATUS_META[job.status] : null;

  return (
    <Modal open={Boolean(jobId)} onClose={onClose} width={680} label="Manage listing" className="qw-modal-manage">
      <div className="qw-modal-pad">
        {loading || !job ? (
          <Spinner />
        ) : (
          <>
            <div className="qw-row qw-modal-head-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <Badge tone={statusMeta?.tone}>{statusMeta?.label}</Badge>
              <span className="job-card-price" style={{ color: TIER_META[priceTier(job.price)].color, fontSize: 22 }}>
                {money(job.price)}
              </span>
            </div>
            <h2 className="jd-title" style={{ marginTop: 8 }}>{job.title}</h2>
            <div className="job-card-meta" style={{ marginBottom: 14 }}>
              <span><Icon name="pin" size={14} /> {job.locationName}</span>
              <span><Icon name="clock" size={14} /> {job.scheduleLabel}</span>
              <span><Icon name="duration" size={14} /> {job.durationLabel || "Flexible"}</span>
            </div>

            {job.status === "PENDING_APPROVAL" && (
              <div className="mg-banner">
                Awaiting QuickWork review. <b>{money(job.price)}</b> is held safely until it goes live.
              </div>
            )}

            {job.hiredStudent && (
              <div className="mg-block">
                <div className="sp-sec-label" style={{ marginTop: 0 }}>Hired student</div>
                <div className="applicant-row">
                  <Avatar name={job.hiredStudent.name} color={job.hiredStudent.color} photo={job.hiredStudent.photo} size={44} />
                  <div className="applicant-info">
                    <b>{job.hiredStudent.name}</b>
                    <span className="qw-muted" style={{ fontSize: 12.5 }}>{job.hiredStudent.year}</span>
                  </div>
                </div>

                {job.status === "HIRED" && (
                  <>
                    <div className="mg-complete">
                      <div className="mg-complete-txt">
                        <b>{job.markedDoneAt ? "Student says the work is done" : "Job done?"}</b>
                        <small>Approve to release {money(job.price)} to {job.hiredStudent.name.split(" ")[0]}.</small>
                      </div>
                    </div>
                    <div className="qw-row" style={{ gap: 9, marginTop: 12, flexWrap: "wrap" }}>
                      <Button variant="primary" disabled={busy} icon={<Icon name="check" size={16} />}
                        onClick={() => run(() => api.confirmCompletion(job.id), `Payment sent to ${job.hiredStudent.name}.`)}>
                        Approve &amp; pay
                      </Button>
                      <Button variant="navy" icon={<Icon name="chat" size={16} />} onClick={goToMessages}>Message</Button>
                      <Button variant="danger" icon={<Icon name="alert" size={16} />} onClick={() => setReporting(true)}>
                        Report issue
                      </Button>
                    </div>
                  </>
                )}

                {job.status === "COMPLETED" && (
                  <div className="mg-done">
                    <span className="mg-done-txt">
                      <span className="mg-done-check"><Icon name="check" size={13} stroke={3} /></span>
                      Completed — {job.hiredStudent.name} was paid {money(job.price)}.
                    </span>
                    {!reviewing && (
                      <Button size="sm" variant="soft" icon={<Icon name="star" size={14} />} onClick={() => setReviewing(true)}>
                        Leave a review
                      </Button>
                    )}
                  </div>
                )}

                {reviewing && (
                  <ReviewForm job={job} onDone={() => { setReviewing(false); reload(); toast("Review posted."); }} />
                )}
              </div>
            )}

            {!job.hiredStudent && job.status === "OPEN" && (
              <div className="mg-block">
                <div className="sp-sec-label" style={{ marginTop: 0 }}>
                  Applicants ({(job.applications || []).length})
                </div>
                {(job.applications || []).length === 0 ? (
                  <div className="qw-muted" style={{ fontSize: 13.5 }}>
                    No applicants yet — your job is live.
                  </div>
                ) : (
                  job.applications
                    .filter((a) => a.status === "PENDING")
                    .map((application) => (
                      <div className="applicant-row" key={application.id}>
                        <Avatar name={application.student.name} color={application.student.color} photo={application.student.photo} size={44} />
                        <div className="applicant-info">
                          <b>{application.student.name}</b>
                          <span className="qw-muted" style={{ fontSize: 12.5 }}>{application.student.year}</span>
                        </div>
                        <div className="qw-row" style={{ gap: 7 }}>
                          <Button size="sm" variant="quiet" disabled={busy}
                            onClick={() => run(() => api.declineApplication(application.id), "Applicant declined.")}>
                            Deny
                          </Button>
                          <Button size="sm" variant="primary" disabled={busy}
                            onClick={() => run(() => api.hire(job.id, application.id), `Hired ${application.student.name}.`)}>
                            Hire
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {!job.hiredStudent && ["OPEN", "PENDING_APPROVAL"].includes(job.status) && (
              confirmCancel ? (
                <div className="mg-cancel fadein">
                  <div>
                    <b>Cancel this listing?</b>
                    <small>{money(job.price)} goes back to your payment method.</small>
                  </div>
                  <div className="qw-row" style={{ gap: 8 }}>
                    <Button size="sm" variant="quiet" onClick={() => setConfirmCancel(false)}>Keep it</Button>
                    <Button size="sm" variant="danger" disabled={busy}
                      onClick={() => run(async () => { await api.cancelJob(job.id); onClose(); }, "Listing cancelled and refunded.")}>
                      Cancel &amp; refund
                    </Button>
                  </div>
                </div>
              ) : (
                <button className="mg-cancel-link" onClick={() => setConfirmCancel(true)}>
                  Cancel listing &amp; get refunded
                </button>
              )
            )}

            <ReportIssueModal
              open={reporting}
              job={job}
              onClose={() => setReporting(false)}
              onSubmitted={() => { setReporting(false); onClose(); onChanged?.(); }}
            />
          </>
        )}
      </div>
    </Modal>
  );
}

function ReviewForm({ job, onDone }) {
  const toast = useToast();
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="review-form fadein">
      <div className="sp-sec-label" style={{ marginTop: 6 }}>
        Review {job.hiredStudent.name.split(" ")[0]}
      </div>
      <div className="star-pick" style={{ fontSize: 28 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="star-pick-s" style={{ color: n <= stars ? "#E57200" : "#D8D2C6" }}
            onClick={() => setStars(n)}>★</span>
        ))}
      </div>
      <textarea className="qw-textarea" placeholder="How did it go?" value={body}
        onChange={(e) => setBody(e.target.value)} style={{ margin: "10px 0" }} />
      <Button variant="primary" disabled={!body.trim() || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api.leaveReview(job.id, stars, body.trim());
            onDone();
          } catch (err) {
            toast(err.message, "warn");
          } finally {
            setBusy(false);
          }
        }}>
        Post review
      </Button>
    </div>
  );
}

function ReportIssueModal({ open, job, onClose, onSubmitted }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} width={520} label="Report an issue">
      <div className="qw-modal-pad">
        <div className="ri-head">
          <span className="ri-ico"><Icon name="alert" size={22} /></span>
          <div>
            <h2 className="jd-title" style={{ margin: 0 }}>Report an issue</h2>
            <div className="qw-muted" style={{ fontSize: 13.5 }}>{job?.title}</div>
          </div>
        </div>
        <p className="ri-note">
          The {money(job?.price)} stays held while QuickWork reviews. Tell us what happened.
        </p>
        <Field label="What went wrong?">
          <textarea className="qw-textarea" placeholder="Describe the problem…" value={note}
            onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="sp-foot" style={{ borderTop: "none", paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Never mind</Button>
          <Button variant="danger" disabled={!note.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.openDispute(job.id, { note: note.trim() });
                toast("Issue reported — QuickWork will review.");
                onSubmitted();
              } catch (err) {
                toast(err.message, "warn");
              } finally {
                setBusy(false);
              }
            }}>
            Submit report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
