import React, { useState } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useSession } from "../state/SessionContext.jsx";
import { Avatar, Button, Field, Logo, Spinner } from "../components/ui.jsx";
import Icon from "../components/Icon.jsx";
import { TIER_META } from "../utils/format.js";

const ROLES = [
  { role: "STUDENT", icon: "backpack", title: "Student", blurb: "Find quick paid gigs around Grounds.", color: "#E57200" },
  { role: "LISTER", icon: "home", title: "Lister", blurb: "Post a job, hire a student, pay securely.", color: "#2E86C1" },
  { role: "ADMIN", icon: "shield", title: "Admin", blurb: "Approve listings, hold funds, resolve disputes.", color: "#232D4B" },
];

/**
 * Account chooser standing in for real sign-in. Students still walk the
 * verification steps so the flow is representative.
 */
export default function SignIn() {
  const { signIn } = useSession();
  const [role, setRole] = useState(null);
  const [step, setStep] = useState("role");
  const [pendingId, setPendingId] = useState(null);

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="auth-art-inner">
          <Logo size={46} light />
          <h1 className="auth-hl">
            Campus gigs,
            <br />
            <span>sorted in minutes.</span>
          </h1>
          <p className="auth-sub">
            QuickWork connects UVA students with paid jobs around town — moving, tutoring, pet-sitting, events and
            more. Funds are held safely until the work's done.
          </p>
          <div className="auth-tiers">
            {Object.entries(TIER_META).map(([key, meta]) => (
              <div className="auth-tier" key={key}>
                <span style={{ background: meta.color }} />
                <b>{meta.label}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        {step === "role" && (
          <div className="auth-form fadein">
            <div className="auth-eyebrow">Welcome back</div>
            <h2 className="auth-title">Sign in to QuickWork</h2>
            <p className="auth-note">Pick a role to continue.</p>
            <div className="auth-roles">
              {ROLES.map((option) => (
                <button
                  key={option.role}
                  className="auth-role"
                  onClick={() => {
                    setRole(option);
                    setStep("account");
                  }}
                >
                  <span className="auth-role-ico" style={{ background: option.color }}>
                    <Icon name={option.icon} size={22} />
                  </span>
                  <span className="auth-role-txt">
                    <b>{option.title}</b>
                    <small>{option.blurb}</small>
                  </span>
                  <span className="auth-role-arrow">
                    <Icon name="arrowRight" size={17} />
                  </span>
                </button>
              ))}
            </div>
            <div className="auth-foot">
              <Icon name="lock" size={13} /> Placeholder auth · real sign-in comes later
            </div>
          </div>
        )}

        {step === "account" && (
          <AccountPicker
            role={role}
            onBack={() => setStep("role")}
            onPick={(id) => {
              if (role.role === "STUDENT") {
                setPendingId(id);
                setStep("verify");
              } else {
                signIn(id);
              }
            }}
          />
        )}

        {step === "verify" && (
          <StudentVerification onBack={() => setStep("account")} onDone={() => signIn(pendingId)} />
        )}
      </div>
    </div>
  );
}

function AccountPicker({ role, onBack, onPick }) {
  const { data, loading, error } = useApi(() => api.usersByRole(role.role), [role.role]);

  return (
    <div className="auth-form fadein">
      <button className="auth-back" onClick={onBack}>
        <Icon name="arrowLeft" size={14} /> back
      </button>
      <h2 className="auth-title">Choose a {role.title.toLowerCase()} account</h2>
      <p className="auth-note">Seeded accounts sit in different states so every flow is reachable.</p>

      {loading && <Spinner />}
      {error && <div className="qw-error-note">{error}</div>}

      <div className="auth-roles">
        {(data || []).map((account) => (
          <button key={account.id} className="auth-role" onClick={() => onPick(account.id)}>
            <Avatar name={account.name} color={account.color} photo={account.photo} size={44} />
            <span className="auth-role-txt">
              <b>{account.name}</b>
              <small>{account.organization || account.year || account.email}</small>
            </span>
            <span className="auth-role-arrow">
              <Icon name="arrowRight" size={17} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StudentVerification({ onBack, onDone }) {
  const [stage, setStage] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [idUploaded, setIdUploaded] = useState(false);

  return (
    <div className="auth-form fadein">
      <button className="auth-back" onClick={onBack}>
        <Icon name="arrowLeft" size={14} /> back
      </button>

      <div className="auth-steps">
        {["School email", "Verify code", "ID check"].map((label, i) => (
          <div key={label} className={`auth-step${i === stage ? " is-active" : ""}${i < stage ? " is-done" : ""}`}>
            <span>{i < stage ? <Icon name="check" size={11} stroke={3} /> : i + 1}</span>
            {label}
          </div>
        ))}
      </div>

      {stage === 0 && (
        <div className="fadein">
          <h2 className="auth-title" style={{ marginTop: 6 }}>Verify you're a student</h2>
          <p className="auth-note">
            We send a code to your <b>@virginia.edu</b> address.
          </p>
          <Field label="School email">
            <input
              className="qw-input"
              placeholder="computingID@virginia.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button variant="primary" full size="lg" onClick={() => setStage(1)}>
            Send code
          </Button>
        </div>
      )}

      {stage === 1 && (
        <div className="fadein">
          <h2 className="auth-title" style={{ marginTop: 6 }}>Enter your code</h2>
          <p className="auth-note">Demo build — any four digits will do.</p>
          <div className="code-row">
            {code.map((digit, i) => (
              <input
                key={i}
                className="code-box"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const next = [...code];
                  next[i] = e.target.value.slice(-1);
                  setCode(next);
                  if (e.target.value && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                }}
              />
            ))}
          </div>
          <Button variant="primary" full size="lg" onClick={() => setStage(2)}>
            Verify
          </Button>
        </div>
      )}

      {stage === 2 && (
        <div className="fadein">
          <h2 className="auth-title" style={{ marginTop: 6 }}>Quick ID check</h2>
          <p className="auth-note">Upload a photo ID so listers know you're you.</p>
          <button className={`id-drop${idUploaded ? " is-done" : ""}`} onClick={() => setIdUploaded(true)}>
            {idUploaded ? (
              <>
                <span className="id-check">
                  <Icon name="check" size={22} stroke={3} />
                </span>
                <b>ID uploaded</b>
                <small>front_of_id.jpg</small>
              </>
            ) : (
              <>
                <span className="id-ico">
                  <Icon name="card" size={30} />
                </span>
                <b>Tap to upload ID</b>
                <small>Identity provider plugs in here</small>
              </>
            )}
          </button>
          <Button
            variant="primary"
            full
            size="lg"
            disabled={!idUploaded}
            onClick={onDone}
            iconRight={<Icon name="arrowRight" size={16} />}
          >
            Enter QuickWork
          </Button>
        </div>
      )}
    </div>
  );
}
