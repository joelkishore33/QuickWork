import React, { useState } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useSession } from "../state/SessionContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import Icon from "./Icon.jsx";
import { Avatar, Badge, Button, Card, EmptyState, Segmented, Spinner } from "./ui.jsx";
import { money, timeAgo } from "../utils/format.js";

/**
 * Two panes: job conversations and any dispute cases the caller is party to.
 * Shared by students and listers — the only difference is who sits on the
 * other side of the thread.
 */
export default function MessagesPane({ role, openCases = 0 }) {
  const [pane, setPane] = useState("chats");

  return (
    <div>
      <div className="qw-page-head">
        <div>
          <h1 className="qw-page-title">Messages</h1>
          <div className="qw-page-sub">
            {role === "student" ? "Talk to listers and follow any open cases." : "Talk to students and follow any open cases."}
          </div>
        </div>
        <Segmented
          value={pane}
          onChange={setPane}
          options={[
            { value: "chats", icon: <Icon name="chat" size={15} />, label: "Conversations" },
            {
              value: "disputes",
              icon: <Icon name="scale" size={15} />,
              label: openCases ? `Disputes (${openCases})` : "Disputes",
            },
          ]}
        />
      </div>

      {pane === "chats" ? <Conversations role={role} /> : <MyDisputes role={role} />}
    </div>
  );
}

function Conversations({ role }) {
  const { user } = useSession();
  const source = role === "student" ? () => api.studentDashboard() : () => api.myListings();
  const { data, loading } = useApi(source, [role]);
  const [activeId, setActiveId] = useState(null);

  if (loading) return <Spinner />;

  const jobs =
    role === "student"
      ? (data?.hiredJobs || [])
      : (data || []).filter((job) => job.hiredStudent);

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="chat"
        title="No conversations yet"
        text={role === "student" ? "Once a lister hires you, you can message them here." : "Hire a student and you can message them here."}
      />
    );
  }

  const active = jobs.find((j) => j.id === activeId) || jobs[0];
  const other = role === "student" ? active.lister : active.hiredStudent;

  return (
    <div className="msg-layout">
      <div className="msg-list">
        <div className="msg-list-head">Conversations</div>
        {jobs.map((job) => {
          const person = role === "student" ? job.lister : job.hiredStudent;
          return (
            <button
              key={job.id}
              className={`msg-item${active.id === job.id ? " is-active" : ""}`}
              onClick={() => setActiveId(job.id)}
            >
              <Avatar name={person?.name} color={person?.color} photo={person?.photo} size={40} />
              <div className="msg-item-txt">
                <b>{person?.name}</b>
                <small>{job.title}</small>
              </div>
            </button>
          );
        })}
      </div>

      <div className="msg-panel">
        <div className="msg-panel-head">
          <Avatar name={other?.name} color={other?.color} photo={other?.photo} size={36} />
          <div>
            <b>{other?.name}</b>
            <small>{active.title}</small>
          </div>
        </div>
        <Thread jobId={active.id} meId={user.id} />
      </div>
    </div>
  );
}

function Thread({ jobId, meId }) {
  const { data, loading, reload } = useApi(() => api.messages(jobId), [jobId]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api.sendMessage(jobId, draft.trim());
      setDraft("");
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-body">
        {loading && <Spinner label="Loading messages…" />}
        {!loading && (data || []).length === 0 && <div className="chat-empty">Start the conversation.</div>}
        {(data || []).map((message) => (
          <div key={message.id} className={`chat-row ${message.sender?.id === meId ? "mine" : "theirs"}`}>
            <div className="chat-bubble">{message.body}</div>
            <span className="chat-time">{timeAgo(message.createdAt)}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          className="qw-input"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button variant="navy" onClick={send} disabled={busy}>
          Send
        </Button>
      </div>
    </div>
  );
}

function MyDisputes({ role }) {
  const { user } = useSession();
  const toast = useToast();
  const { data, loading, reload } = useApi(() => api.myDisputes(), []);
  const [expanded, setExpanded] = useState(null);
  const [note, setNote] = useState("");

  if (loading) return <Spinner />;
  const disputes = data || [];

  if (disputes.length === 0) {
    return (
      <EmptyState
        icon="scale"
        title="No open cases"
        text="If a job goes wrong, open a case and it will appear here."
      />
    );
  }

  return (
    <div className="disputes-scroll">
      {disputes.map((dispute) => {
        const job = dispute.job;
        const other = role === "student" ? job.lister : job.hiredStudent;
        const isOpen = expanded === dispute.id;

        return (
          <Card className="prof-card" key={dispute.id} style={{ marginBottom: 14 }}>
            <div className="qw-row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="qw-row" style={{ gap: 8 }}>
                  <h3 className="job-card-title">{job.title}</h3>
                  {dispute.status === "RESOLVED" ? (
                    <Badge tone="green">
                      <Icon name="check" size={12} stroke={2.6} />{" "}
                      {dispute.decision === "PAY_STUDENT"
                        ? "Paid to student"
                        : dispute.decision === "SPLIT"
                        ? "Split"
                        : "Refunded to lister"}
                    </Badge>
                  ) : (
                    <Badge tone="yellow">
                      <Icon name="hourglass" size={12} /> Under review
                    </Badge>
                  )}
                </div>
                <div className="job-card-meta" style={{ marginTop: 4 }}>
                  <span>With {other?.name}</span>
                  <span>{money(job.price)} held</span>
                  <span>Opened {timeAgo(dispute.createdAt)}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : dispute.id)}>
                {isOpen ? "Hide" : "View case"}
              </Button>
            </div>

            {dispute.status === "OPEN" && (
              <div className="dispute-banner">
                <Icon name="lock" size={15} />
                <span>QuickWork is reviewing. The {money(job.price)} stays held until it's decided.</span>
              </div>
            )}

            {isOpen && (
              <div className="fadein" style={{ marginTop: 14 }}>
                <div className="sp-sec-label" style={{ marginTop: 0 }}>
                  Case file ({dispute.evidence.length})
                </div>
                <div className="evidence-list">
                  {dispute.evidence.map((item) => (
                    <div
                      key={item.id}
                      className={`evidence-item${item.author?.id === user.id ? " is-mine" : ""}`}
                    >
                      <span className="evidence-ico">
                        <Icon name={item.imageData ? "camera" : "note"} size={15} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <b>
                          {item.author?.id === user.id ? "You" : item.author?.name}
                          <span className="evidence-role">{item.authorRole?.toLowerCase()}</span>
                        </b>
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
                  <div className="qw-row" style={{ marginTop: 12 }}>
                    <input
                      className="qw-input"
                      placeholder="Add your side of the story…"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <Button
                      variant="navy"
                      onClick={async () => {
                        if (!note.trim()) return;
                        toast("Response added to the case.");
                        setNote("");
                        reload();
                      }}
                    >
                      Send
                    </Button>
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
