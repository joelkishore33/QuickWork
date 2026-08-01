# QuickWork

A campus gig marketplace for UVA. Listers post small jobs, students apply, and
QuickWork holds the money in escrow until the work is confirmed done.

Monorepo: **`/backend`** is a Spring Boot API in Java, **`/frontend`** is a Vite + React app.

---

## Running it

### Option A — H2, no install (fastest)

```bash
cd backend
./mvnw spring-boot:run        # or: mvn spring-boot:run
```

API comes up on `http://localhost:8080` with an in-memory database and a full
demo dataset. Browse the tables at `http://localhost:8080/h2-console`
(JDBC URL `jdbc:h2:mem:quickwork`, user `sa`, no password).

Then, in a second terminal:

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### Option B — Postgres via Docker

```bash
docker compose up --build
```

Brings up Postgres + the API together. Same data model, but it survives a
restart — this is what production looks like.

---

## How the money works

This is the part worth understanding before changing anything.

| Step | What happens | Ledger effect |
|---|---|---|
| Lister posts a job | Card charged for price + 10% fee | `HOLD` (held) + `FEE` (collected) |
| Admin approves | Listing goes live | none |
| Admin rejects | Lister made whole | hold → `refunded`, `REFUND` row |
| Lister cancels (pre-hire) | Lister made whole | hold → `refunded`, `REFUND` row |
| Lister hires a student | Job moves to `HIRED` | none — money still held |
| Job's scheduled end passes | Scheduler nudges the lister automatically, starting a 48h clock | none |
| Lister confirms completion | Student paid | hold → `released`, `PAYOUT` row |
| Lister goes silent for 48h | Scheduler releases the payout anyway | hold → `released`, `PAYOUT` row |
| Either party reports a problem | Job frozen as `DISPUTED`, funds stay held | none |
| Admin resolves | Pay student, refund lister, or split | `PAYOUT` and/or `REFUND` rows |

Two invariants hold everything together:

1. **A job has at most one `HOLD` row in `HELD` state.** Releasing always flips
   that row and writes the matching payout/refund in the same transaction, so
   escrow can't be paid out twice. Attempting it throws.
2. **`LedgerService` is the only class that writes to the ledger.** Everything
   else delegates. If you need new money behaviour, add it there.

The ledger is append-only — rows are never deleted, only closed out.

---

## Layout

```
backend/src/main/java/edu/virginia/quickwork/
├── domain/        JPA entities + enums (the state machine lives in JobStatus)
├── repository/    Spring Data interfaces
├── service/       Business rules — LedgerService, JobService, DisputeService,
│                  MessagingService, NotificationService, CompletionScheduler
├── web/           REST controllers, DTOs, error handling, CurrentUser
├── config/        CORS + tunable properties
└── bootstrap/     Demo data loader

frontend/src/
├── api/client.js       every endpoint, one place
├── state/              session + toasts
├── components/         design system, app shell, shared panes
├── pages/              SignIn, StudentApp, ListerApp, AdminApp
└── styles/app.css      design tokens and component styles
```

---

## Deliberately not built yet

You asked to skip these; here's where each one plugs in.

**Authentication.** The client sends `X-User-Id` and the server trusts it.
`web/CurrentUser.java` is the *only* place that reads it — swap that header for
a decoded JWT subject and every controller keeps working unchanged. On the
client, replace `authHeaders()` in `api/client.js`. Obviously not safe for
production: anyone can claim to be anyone.

**Payments.** No real money moves. `LedgerService` records intent — where a
Stripe integration would go is at the four call sites: `captureForNewJob`
(PaymentIntent), `releaseToStudent` (Transfer to a connected account),
`refundLister` (Refund), and `split` (partial transfer + partial refund). The
10% fee is already tracked as its own ledger row.

**Map.** Jobs carry `locationName` plus nullable `latitude`/`longitude`, so
adding a map is a UI change and a geocoding step — no migration needed.

---

## Tests

```bash
cd backend && ./mvnw test
```

Focused on the logic that must not be wrong:

- `EscrowFlowTest` — capture on post, single release, refund on reject/cancel,
  no double payout, permission checks, application rules
- `DisputeFlowTest` — freezing funds, pay/refund/split resolutions, split
  bounds, no double resolution
- `CompletionSchedulerTest` — auto-reminder when a job's window passes,
  auto-release after 48h, and *not* releasing early

---

## Configuration

Set in `backend/src/main/resources/application.yml`:

| Key | Default | Meaning |
|---|---|---|
| `quickwork.platform-fee-rate` | `0.10` | Commission charged to the lister |
| `quickwork.auto-release-hours` | `48` | Confirmation window before auto-payout |
| `quickwork.scheduler-interval-ms` | `60000` | How often the sweep runs |
| `quickwork.seed-demo-data` | `true` | Load the demo dataset on an empty DB |

---

## Demo accounts

Sign-in lists every seeded account. Useful starting points:

- **Maya Patel** (student) — completed jobs with real payout history
- **Marcus Webb** (student) — has an open dispute against Dana
- **Tom Reedy** (lister) — a hired job to approve, plus cancelled and completed listings
- **Dana Alvarez** (lister) — the other side of the dispute, plus a job awaiting approval
- **QuickWork Admin** — approval queue, disputes, ledger, audit log

One seeded job ends in the past, so the scheduler fires an automatic reminder
shortly after boot — visible in the admin audit log.
