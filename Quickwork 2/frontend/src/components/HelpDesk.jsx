import React, { useState } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useToast } from "../state/ToastContext.jsx";
import { Button, Card, Field, Spinner } from "./ui.jsx";
import Icon from "./Icon.jsx";
import { timeAgo } from "../utils/format.js";

export default function HelpDesk() {
  const toast = useToast();
  const { data, loading, reload } = useApi(() => api.myFeedback(), []);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await api.submitFeedback(subject.trim(), body.trim());
      setSubject("");
      setBody("");
      toast("Sent to QuickWork — thanks!");
      reload();
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
          <h1 className="qw-page-title">Help Desk</h1>
          <div className="qw-page-sub">Questions or issues? The QuickWork team reads every message.</div>
        </div>
      </div>

      <div className="prof-layout">
        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Send a message</div>
          <Field label="Subject">
            <input
              className="qw-input"
              placeholder="What's this about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <Field label="Message">
            <textarea
              className="qw-textarea"
              placeholder="Tell us what's going on…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <Button variant="primary" disabled={busy} onClick={submit}>
            Send to QuickWork
          </Button>
        </Card>

        <Card className="prof-card">
          <div className="sp-sec-label" style={{ marginTop: 0 }}>Your messages</div>
          {loading && <Spinner />}
          {!loading && (data || []).length === 0 && (
            <div className="qw-muted" style={{ fontSize: 13.5 }}>No messages yet.</div>
          )}
          <div className="fb-list">
            {(data || []).map((item) => (
              <div className="fb-thread" key={item.id}>
                <div className="fb-q">
                  <b>{item.subject}</b>
                  <p>{item.body}</p>
                  <span className="qw-muted" style={{ fontSize: 11.5 }}>{timeAgo(item.createdAt)}</span>
                </div>
                {item.reply ? (
                  <div className="fb-a">
                    <span className="fb-a-tag">QuickWork replied</span>
                    <p>{item.reply}</p>
                  </div>
                ) : (
                  <div className="fb-pending">
                    <Icon name="hourglass" size={12} /> Awaiting reply
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
