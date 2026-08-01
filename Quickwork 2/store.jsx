// ============================================================
// QuickWork — central store: seed data + actions + context
// ============================================================
const { createContext, useContext, useReducer, useState, useEffect, useRef, useMemo, useCallback } = React;

const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 8);
const now = () => Date.now();
const fmt$ = (n) => "$" + Number(n).toFixed(Number.isInteger(n) ? 0 : 2);
const tierOf = (price) => (price <= 20 ? "green" : price <= 49 ? "yellow" : "red");
const ago = (t) => {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  return d + "d ago";
};

// ---- seed students ----
const SEED_STUDENTS = [
  {
    id: "stu_1", name: "Maya Patel", email: "mp4ge@virginia.edu", year: "3rd Year",
    color: "#E57200", photo: null, verified: true,
    skills: ["Moving & Lifting", "Photography", "Tutoring (Calc)", "Dog Walking"],
    bio: "Third-year Econ major. Reliable, strong, and weirdly good at parallel parking. I bring my own dolly.",
    rating: 4.9, ratingCount: 27,
    earnings: { paid: 165, pending: 75 }, payoutSet: true, payoutLast4: "4291",
    workPhotos: ["Moved a 3-BR apt", "Furniture assembly", "Event photos"],
    reviews: [
      { by: "Karen Whitfield", stars: 5, text: "Maya moved my whole study in two hours. Polite and careful.", t: now() - 86400000 * 4 },
      { by: "Tom Reedy", stars: 5, text: "Showed up early, great with our golden retriever.", t: now() - 86400000 * 12 },
    ],
    history: [{ title: "Help move couch up 3 flights", pay: 45 }, { title: "Weekend dog sitting", pay: 75 }],
  },
  {
    id: "stu_2", name: "Devon Brooks", email: "db8xk@virginia.edu", year: "2nd Year",
    color: "#232D4B", photo: null, verified: true,
    skills: ["Web Design", "Flyer Design", "Tech Setup", "Tutoring (CS)"],
    bio: "CS + Studio Art double major. I build websites and fix the wifi your dad gave up on.",
    rating: 4.7, ratingCount: 14,
    earnings: { paid: 320, pending: 0 }, payoutSet: false, payoutLast4: null,
    workPhotos: ["Cafe website", "Band poster set"],
    reviews: [{ by: "Lucia Romano", stars: 5, text: "Designed our menu in a day. Total pro.", t: now() - 86400000 * 8 }],
    history: [{ title: "Design a cafe menu", pay: 60 }],
  },
  {
    id: "stu_3", name: "Aisha Khan", email: "ak2mn@virginia.edu", year: "4th Year",
    color: "#1B7F5C", photo: null, verified: true,
    skills: ["Catering Help", "Bartending (cert)", "Event Setup", "Spanish Tutoring"],
    bio: "Fourth-year, hospitality minor. I've worked 40+ campus events. Calm under pressure, never drops a tray.",
    rating: 5.0, ratingCount: 31,
    earnings: { paid: 910, pending: 120 }, payoutSet: true, payoutLast4: "7732",
    workPhotos: ["Faculty dinner", "Tailgate setup", "Wedding service"],
    reviews: [{ by: "Dean's Office", stars: 5, text: "Aisha ran our reception flawlessly.", t: now() - 86400000 * 2 }],
    history: [{ title: "Serve at faculty dinner", pay: 80 }, { title: "Tailgate setup crew", pay: 40 }],
  },
  {
    id: "stu_4", name: "Marcus Webb", email: "mw7pq@virginia.edu", year: "1st Year",
    color: "#B8860B", photo: null, verified: true,
    skills: ["Moving & Lifting", "Yard Work", "Car Washing"],
    bio: "First-year, played varsity football in high school. Happy to do the heavy stuff nobody else wants.",
    rating: 4.5, ratingCount: 6,
    earnings: { paid: 145, pending: 0 }, payoutSet: true, payoutLast4: "1180",
    workPhotos: ["Cleared a garage"],
    reviews: [{ by: "Karen Whitfield", stars: 4, text: "Strong and fast. Ran a little late but got it done.", t: now() - 86400000 * 9 }],
    history: [{ title: "Garage cleanout", pay: 55 }],
  },
  {
    id: "stu_5", name: "Priya Raman", email: "pr3vs@virginia.edu", year: "Grad Student",
    color: "#0F766E", photo: null, verified: true,
    skills: ["Tutoring (Stats)", "Data Entry", "Editing", "Research Help"],
    bio: "Stats PhD student. I tutor, clean up messy spreadsheets, and proofread anything you throw at me.",
    rating: 4.8, ratingCount: 19,
    earnings: { paid: 505, pending: 35 }, payoutSet: true, payoutLast4: "6034",
    workPhotos: ["Thesis edit", "Dashboard build"],
    reviews: [{ by: "Grit Coffee", stars: 5, text: "Rebuilt our sales spreadsheet in an afternoon.", t: now() - 86400000 * 5 }],
    history: [{ title: "Clean up sales data", pay: 70 }],
  },
];

// ---- seed listers ----
const SEED_LISTERS = [
  { id: "lst_1", name: "Karen Whitfield", org: "Belmont resident", color: "#7A4FB0" },
  { id: "lst_2", name: "Lucia Romano", org: "Grit Coffee — owner", color: "#C0392B" },
  { id: "lst_3", name: "Tom Reedy", org: "Rugby Rd. resident", color: "#2E86C1" },
  { id: "lst_4", name: "Dana Alvarez", org: "Fry's Spring resident", color: "#B8543F" },
];

// ---- seed jobs (positions are % within the map world) ----
const SEED_JOBS = [
  {
    id: "job_1", title: "Help move a couch up 3 flights", listerId: "lst_3", price: 45,
    category: "Moving", x: 28, y: 38, building: "Rugby Road",
    when: "Sat Jun 14 · 10:00 AM", endsAt: now() + 3600000 * 26, duration: "~2 hrs",
    desc: "Need 1–2 strong students to carry a sleeper couch up to a 3rd-floor walkup. I'll have water and snacks. Dolly available.",
    status: "approved", applicants: ["stu_2", "stu_4"], hiredId: null, escrow: 45, completion: null, createdAt: now() - 3600000 * 30,
  },
  {
    id: "job_2", title: "Dog sitting — golden retriever, 2 nights", listerId: "lst_3", price: 75,
    category: "Pet Care", x: 62, y: 30, building: "Lewis Mountain",
    when: "Jun 20–22", endsAt: now() - 3600000 * 3, duration: "2 nights",
    desc: "Friendly 4-yr-old golden named Biscuit. Two walks a day, lots of belly rubs. Stay over preferred.",
    status: "hired", applicants: ["stu_1"], hiredId: "stu_1", escrow: 75,
    completion: { remindedAt: null, reported: false }, createdAt: now() - 3600000 * 50,
  },
  {
    id: "job_3", title: "Design a new menu for our cafe", listerId: "lst_2", price: 60,
    category: "Design", x: 48, y: 64, building: "The Corner",
    when: "Flexible this week", endsAt: now() + 3600000 * 60, duration: "1–2 days",
    desc: "Grit Coffee needs a fresh printable menu. Have our logo + colors. Looking for clean, modern layout.",
    status: "approved", applicants: ["stu_2", "stu_1", "stu_5"], hiredId: null, escrow: 60, completion: null, createdAt: now() - 3600000 * 20,
  },
  {
    id: "job_4", title: "Tailgate setup + teardown crew", listerId: "lst_1", price: 40,
    category: "Events", x: 74, y: 52, building: "Scott Stadium",
    when: "Sat Jun 14 · 8:00 AM", endsAt: now() + 3600000 * 24, duration: "3 hrs",
    desc: "Help set up tents, tables, and coolers before the game and pack up after. Coffee provided!",
    status: "approved", applicants: ["stu_3", "stu_4"], hiredId: null, escrow: 40, completion: null, createdAt: now() - 3600000 * 8,
  },
  {
    id: "job_5", title: "Calc 2 tutoring before finals", listerId: "lst_1", price: 25,
    category: "Tutoring", x: 38, y: 22, building: "Clark Hall",
    when: "Sun afternoon", endsAt: now() + 3600000 * 40, duration: "1.5 hrs",
    desc: "My nephew is a first-year struggling with integrals. Patient tutor wanted.",
    status: "approved", applicants: ["stu_5"], hiredId: null, escrow: 25, completion: null, createdAt: now() - 3600000 * 5,
  },
  // pending admin approval
  {
    id: "job_6", title: "Photograph our porch sale", listerId: "lst_2", price: 35,
    category: "Photography", x: 55, y: 45, building: "Wertland St.",
    when: "Sun Jun 15 · 9:00 AM", endsAt: now() + 3600000 * 44, duration: "2 hrs",
    desc: "Want crisp photos of items for an online sale. Bring your own camera.",
    status: "pending", applicants: [], hiredId: null, escrow: 35, completion: null, createdAt: now() - 3600000 * 2,
  },
  // completed history (already paid out)
  {
    id: "old_1", title: "Serve at faculty dinner", listerId: "lst_1", price: 80,
    category: "Events", x: 44, y: 34, building: "Newcomb Hall",
    when: "Fri May 30 · 5:00 PM", endsAt: now() - 86400000 * 3, duration: "4 hrs",
    desc: "Plated dinner service for 60 guests at a faculty reception.",
    status: "completed", applicants: ["stu_3"], hiredId: "stu_3", escrow: 80, completion: null, createdAt: now() - 86400000 * 3,
  },
  // hired + student marked complete, waiting on lister
  {
    id: "job_7", title: "Deep clean a 2-bedroom apartment", listerId: "lst_4", price: 90,
    category: "Cleaning", x: 22, y: 62, building: "Fry's Spring",
    when: "Thu Jun 12 · 1:00 PM", endsAt: now() - 3600000 * 20, duration: "3 hrs",
    desc: "Move-out clean: kitchen, two baths, floors. Supplies provided.",
    status: "hired", applicants: ["stu_4", "stu_5"], hiredId: "stu_4", escrow: 90,
    completion: { markedAt: now() - 3600000 * 18, remindedAt: now() - 3600000 * 18, reported: false },
    createdAt: now() - 86400000 * 2,
  },
  // hired, job time passed → auto-reminder fires on load
  {
    id: "job_8", title: "Stats tutoring — regression review", listerId: "lst_1", price: 35,
    category: "Tutoring", x: 66, y: 20, building: "Alderman Library",
    when: "Wed Jun 11 · 4:00 PM", endsAt: now() - 3600000 * 5, duration: "1 hr",
    desc: "Need a walkthrough of multiple regression before an exam.",
    status: "hired", applicants: ["stu_5"], hiredId: "stu_5", escrow: 35, completion: null,
    createdAt: now() - 86400000,
  },
  // disputed — student says they weren't paid
  {
    id: "job_9", title: "Haul yard waste to the dump", listerId: "lst_4", price: 55,
    category: "Yard Work", x: 84, y: 68, building: "Fry's Spring",
    when: "Sun Jun 8 · 9:00 AM", endsAt: now() - 86400000 * 4, duration: "2 hrs",
    desc: "Two truckloads of branches and clippings. Truck provided.",
    status: "disputed", applicants: ["stu_4"], hiredId: "stu_4", escrow: 55,
    completion: { markedAt: now() - 86400000 * 4, remindedAt: now() - 86400000 * 4, reported: true },
    createdAt: now() - 86400000 * 5,
  },
  // second pending listing for the approval queue
  {
    id: "job_10", title: "Bartend a graduation party", listerId: "lst_4", price: 120,
    category: "Events", x: 36, y: 74, building: "Belmont",
    when: "Sat Jun 21 · 7:00 PM", endsAt: now() + 3600000 * 80, duration: "4 hrs",
    desc: "Certified bartender needed for ~40 guests. Beer and wine only.",
    status: "pending", applicants: [], hiredId: null, escrow: 120, completion: null, createdAt: now() - 3600000,
  },
  // cancelled & refunded
  {
    id: "job_11", title: "Assemble two IKEA bookshelves", listerId: "lst_3", price: 50,
    category: "Moving", x: 58, y: 78, building: "Wertland St.",
    when: "Mon Jun 9 · 6:00 PM", endsAt: now() - 86400000 * 2, duration: "2 hrs",
    desc: "Changed plans — handled it myself.",
    status: "cancelled", applicants: [], hiredId: null, escrow: 50, completion: null, createdAt: now() - 86400000 * 3,
  },
  // completed for the demo student — backs her payout history
  {
    id: "job_13", title: "Help move a couch up 3 flights", listerId: "lst_1", price: 45,
    category: "Moving", x: 30, y: 44, building: "Belmont",
    when: "Sat May 24 · 11:00 AM", endsAt: now() - 86400000 * 10, duration: "2 hrs",
    desc: "Second-floor walkup, one couch and a coffee table.",
    status: "completed", applicants: ["stu_1"], hiredId: "stu_1", escrow: 45, completion: null, createdAt: now() - 86400000 * 12,
  },
  {
    id: "job_14", title: "Weekend dog sitting — two corgis", listerId: "lst_4", price: 120,
    category: "Pet Care", x: 18, y: 30, building: "Fry's Spring",
    when: "Fri May 16 – Sun May 18", endsAt: now() - 86400000 * 16, duration: "2 nights",
    desc: "Two corgis, three walks a day. Stay-over preferred.",
    status: "completed", applicants: ["stu_1"], hiredId: "stu_1", escrow: 120, completion: null, createdAt: now() - 86400000 * 19,
  },
  // completed, awaiting review from lister
  {
    id: "job_12", title: "Photograph a sorority formal", listerId: "lst_3", price: 110,
    category: "Photography", x: 76, y: 36, building: "Boar's Head",
    when: "Sat Jun 7 · 8:00 PM", endsAt: now() - 86400000 * 5, duration: "3 hrs",
    desc: "Candids and group shots, edited delivery within a week.",
    status: "completed", applicants: ["stu_2"], hiredId: "stu_2", escrow: 110, completion: null, createdAt: now() - 86400000 * 7,
  },
];

const SEED = {
  session: { role: null, userId: null },
  students: SEED_STUDENTS,
  listers: SEED_LISTERS,
  jobs: SEED_JOBS,
  threads: {
    // key: jobId__studentId
    "job_2__stu_1": [
      { from: "lst_3", text: "Hi Maya! Thanks for taking Biscuit. He eats at 8 & 6.", t: now() - 3600000 * 40 },
      { from: "stu_1", text: "Got it! I'll send photos each day.", t: now() - 3600000 * 39 },
      { from: "lst_3", text: "Perfect. Key is under the blue pot.", t: now() - 3600000 * 38 },
    ],
    "job_7__stu_4": [
      { from: "lst_4", text: "Supplies are under the kitchen sink. Door code 4417.", t: now() - 3600000 * 22 },
      { from: "stu_4", text: "All done — kitchen and both baths finished. Left the keys inside.", t: now() - 3600000 * 18 },
    ],
    "job_8__stu_5": [
      { from: "stu_5", text: "Hi! I can meet at Alderman, 3rd floor study room.", t: now() - 3600000 * 7 },
      { from: "lst_1", text: "See you there. Thank you!", t: now() - 3600000 * 6 },
    ],
    "job_9__stu_4": [
      { from: "stu_4", text: "Finished both loads and sent the dump receipt.", t: now() - 86400000 * 4 },
      { from: "stu_4", text: "Following up — still hasn't been marked complete.", t: now() - 86400000 * 2 },
    ],
  },
  feedback: [
    { id: "fb_1", fromRole: "student", fromName: "Devon Brooks", subject: "Map pin overlap", text: "When two jobs are close the pins overlap and I can't tap the back one.", status: "open", reply: null, t: now() - 3600000 * 6 },
    { id: "fb_2", fromRole: "lister", fromName: "Lucia Romano", subject: "Refund question", text: "If no one applies, do I get my hold back automatically?", status: "open", reply: null, t: now() - 3600000 * 3 },
    { id: "fb_3", fromRole: "student", fromName: "Priya Raman", subject: "Payout timing", text: "How long after a lister approves does the money actually land in my account?", status: "answered", reply: "Transfers land in 1–2 business days once the lister approves completion.", t: now() - 86400000 * 2 },
    { id: "fb_4", fromRole: "lister", fromName: "Dana Alvarez", subject: "Can I rebook someone?", text: "I'd love to hire the same student again without reposting. Possible?", status: "open", reply: null, t: now() - 3600000 * 10 },
  ],
  ledger: [
    { id: "lg_1", type: "hold", jobId: "job_2", amount: 75, status: "held", t: now() - 3600000 * 50 },
    { id: "lg_2", type: "hold", jobId: "job_1", amount: 45, status: "held", t: now() - 3600000 * 30 },
    { id: "lg_3", type: "hold", jobId: "job_3", amount: 60, status: "held", t: now() - 3600000 * 20 },
    { id: "lg_4", type: "hold", jobId: "job_4", amount: 40, status: "held", t: now() - 3600000 * 8 },
    { id: "lg_6", type: "hold", jobId: "job_5", amount: 25, status: "held", t: now() - 3600000 * 5 },
    { id: "lg_7", type: "hold", jobId: "job_6", amount: 35, status: "held", t: now() - 3600000 * 2 },
    { id: "lg_8", type: "hold", jobId: "job_7", amount: 90, status: "held", t: now() - 86400000 * 2 },
    { id: "lg_9", type: "hold", jobId: "job_8", amount: 35, status: "held", t: now() - 86400000 },
    { id: "lg_10", type: "hold", jobId: "job_9", amount: 55, status: "held", t: now() - 86400000 * 5 },
    { id: "lg_11", type: "hold", jobId: "job_10", amount: 120, status: "held", t: now() - 3600000 },
    { id: "lg_12", type: "hold", jobId: "job_11", amount: 50, status: "refunded", t: now() - 86400000 * 3 },
    { id: "lg_13", type: "refund", jobId: "job_11", amount: 50, status: "refunded", to: "lister", t: now() - 86400000 * 2 },
    { id: "lg_14", type: "hold", jobId: "job_12", amount: 110, status: "released", t: now() - 86400000 * 7 },
    { id: "lg_15", type: "payout", jobId: "job_12", amount: 110, status: "paid", to: "stu_2", t: now() - 86400000 * 4 },
    { id: "lg_17", type: "hold", jobId: "job_13", amount: 45, status: "released", t: now() - 86400000 * 12 },
    { id: "lg_18", type: "payout", jobId: "job_13", amount: 45, status: "paid", to: "stu_1", t: now() - 86400000 * 9 },
    { id: "lg_19", type: "hold", jobId: "job_14", amount: 120, status: "released", t: now() - 86400000 * 19 },
    { id: "lg_20", type: "payout", jobId: "job_14", amount: 120, status: "paid", to: "stu_1", t: now() - 86400000 * 15 },
    { id: "lg_16", type: "hold", jobId: "old_1", amount: 80, status: "released", t: now() - 86400000 * 4 },
    { id: "lg_5", type: "payout", jobId: "old_1", amount: 80, status: "paid", t: now() - 86400000 * 2, to: "stu_3" },
  ],
  disputes: [
    {
      id: "ds_1", jobId: "job_9", openedBy: "student", status: "open",
      evidence: [
        { by: "student", type: "note", note: "I hauled both loads on Sunday morning and sent the dump receipt, but the job was never marked complete and I haven't been paid.", t: now() - 86400000 * 2 },
        { by: "lister", type: "note", note: "Only one load went out as far as I could tell. Happy to split the difference.", t: now() - 86400000 },
      ],
      decision: null, t: now() - 86400000 * 2,
    },
  ],
  audit: [
    { id: "au_1", actor: "admin", action: "Approved listing “Tailgate setup + teardown crew”", t: now() - 3600000 * 7 },
    { id: "au_2", actor: "system", action: "Held $75 for “Dog sitting — golden retriever”", t: now() - 3600000 * 50 },
    { id: "au_3", actor: "lister", action: "Approved payout $110 for “Photograph a sorority formal”", t: now() - 86400000 * 4 },
    { id: "au_4", actor: "student", action: "Opened a dispute on “Haul yard waste to the dump”", t: now() - 86400000 * 2 },
    { id: "au_5", actor: "lister", action: "Cancelled “Assemble two IKEA bookshelves” — $50 refunded", t: now() - 86400000 * 2 },
    { id: "au_6", actor: "student", action: "Marked “Deep clean a 2-bedroom apartment” as complete — 48h confirmation window started", t: now() - 3600000 * 18 },
  ],
  notifications: [
    { id: "nt_1", role: "admin", text: "2 new listings awaiting approval", read: false, t: now() - 3600000 * 2 },
    { id: "nt_2", role: "student", text: "You were hired for “Dog sitting — golden retriever”", read: false, t: now() - 3600000 * 40 },
    { id: "nt_3", role: "lister", text: "New applicant for “Design a new menu”", read: false, t: now() - 3600000 * 18 },
    { id: "nt_4", role: "admin", text: "Dispute opened on “Haul yard waste to the dump”", read: false, t: now() - 86400000 * 2 },
    { id: "nt_5", role: "lister", text: "Marcus Webb marked “Deep clean a 2-bedroom apartment” complete", read: false, t: now() - 3600000 * 18 },
  ],
};

// ------------------------------------------------------------
// reducer
// ------------------------------------------------------------
function reducer(state, a) {
  switch (a.type) {
    case "LOGIN":
      return { ...state, session: { role: a.role, userId: a.userId } };
    case "LOGOUT":
      return { ...state, session: { role: null, userId: null } };

    case "PATCH_STUDENT":
      return { ...state, students: state.students.map((s) => (s.id === a.id ? { ...s, ...a.patch } : s)) };

    case "CREATE_JOB": {
      const job = a.job;
      return {
        ...state,
        jobs: [job, ...state.jobs],
        ledger: [{ id: uid("lg"), type: "hold", jobId: job.id, amount: job.price, status: "held", t: now() }, ...state.ledger],
        audit: [{ id: uid("au"), actor: "system", action: `Held ${fmt$(job.price)} for “${job.title}”`, t: now() }, ...state.audit],
        notifications: [{ id: uid("nt"), role: "admin", text: `New listing “${job.title}” awaiting approval`, read: false, t: now() }, ...state.notifications],
      };
    }

    case "APPROVE_JOB":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.id ? { ...j, status: "approved" } : j)),
        audit: [{ id: uid("au"), actor: "admin", action: `Approved listing “${a.title}”`, t: now() }, ...state.audit],
        notifications: [{ id: uid("nt"), role: "lister", text: `Your listing “${a.title}” is live on the map`, read: false, t: now() }, ...state.notifications],
      };

    case "REJECT_JOB":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.id ? { ...j, status: "rejected" } : j)),
        ledger: state.ledger.map((l) => (l.jobId === a.id && l.status === "held" ? { ...l, status: "refunded" } : l)),
        audit: [{ id: uid("au"), actor: "admin", action: `Rejected & refunded “${a.title}”`, t: now() }, ...state.audit],
      };

    case "APPLY_JOB":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId && !j.applicants.includes(a.studentId) ? { ...j, applicants: [...j.applicants, a.studentId] } : j)),
        notifications: [{ id: uid("nt"), role: "lister", text: `New applicant for “${a.title}”`, read: false, t: now() }, ...state.notifications],
      };

    case "HIRE_STUDENT":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, hiredId: a.studentId, status: "hired" } : j)),
        notifications: [{ id: uid("nt"), role: "student", text: `You were hired for “${a.title}”`, read: false, t: now() }, ...state.notifications],
        audit: [{ id: uid("au"), actor: "lister", action: `Hired a student for “${a.title}”`, t: now() }, ...state.audit],
      };

    case "DENY_STUDENT":
      return { ...state, jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, applicants: j.applicants.filter((s) => s !== a.studentId) } : j)) };

    case "CANCEL_JOB":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, status: "cancelled" } : j)),
        ledger: [{ id: uid("lg"), type: "refund", jobId: a.jobId, amount: a.amount, status: "refunded", to: "lister", t: now() },
          ...state.ledger.map((l) => (l.jobId === a.jobId && l.status === "held" ? { ...l, status: "refunded" } : l))],
        audit: [{ id: uid("au"), actor: "lister", action: `Cancelled “${a.title}” — ${fmt$(a.amount)} refunded`, t: now() }, ...state.audit],
        notifications: [{ id: uid("nt"), role: "admin", text: `Listing “${a.title}” was cancelled and refunded`, read: false, t: now() }, ...state.notifications],
      };

    case "STUDENT_MARK_DONE":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, completion: { ...(j.completion || {}), markedAt: now(), remindedAt: now(), reported: false } } : j)),
        notifications: [{ id: uid("nt"), role: "lister", text: `${a.studentName} marked “${a.title}” complete — confirm to release payment`, read: false, t: now() },
          { id: uid("nt"), role: "admin", text: `“${a.title}” marked complete by student — 48h window started`, read: false, t: now() }, ...state.notifications],
        audit: [{ id: uid("au"), actor: "student", action: `Marked “${a.title}” as complete — 48h confirmation window started`, t: now() }, ...state.audit],
      };

    case "AUTO_REMIND":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, completion: { ...(j.completion || {}), remindedAt: now(), autoSent: true, reported: false } } : j)),
        notifications: [{ id: uid("nt"), role: "lister", text: `“${a.title}” has wrapped up — confirm completion to release payment`, read: false, t: now() },
          { id: uid("nt"), role: "student", text: `Job time passed for “${a.title}” — we asked the lister to confirm`, read: false, t: now() }, ...state.notifications],
        audit: [{ id: uid("au"), actor: "system", action: `Auto-sent completion reminder for “${a.title}” (scheduled time passed)`, t: now() }, ...state.audit],
      };

    case "SEND_REMINDER":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, completion: { ...(j.completion || {}), remindedAt: now(), reported: false } } : j)),
        notifications: [{ id: uid("nt"), role: "lister", text: `Reminder: please confirm completion for “${a.title}”`, read: false, t: now() }, ...state.notifications],
        audit: [{ id: uid("au"), actor: "admin", action: `Sent completion reminder for “${a.title}”`, t: now() }, ...state.audit],
      };

    case "FF_REMIND": // demo helper: pretend the 48h window has elapsed
      return { ...state, jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, completion: { ...(j.completion || {}), remindedAt: now() - 3600000 * 49 } } : j)) };

    case "APPROVE_COMPLETION": {
      const job = state.jobs.find((j) => j.id === a.jobId);
      const stu = state.students.find((s) => s.id === job.hiredId);
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, status: "completed" } : j)),
        students: state.students.map((s) => (s.id === job.hiredId ? { ...s, earnings: { paid: s.earnings.paid + job.price, pending: Math.max(0, s.earnings.pending) } } : s)),
        ledger: [{ id: uid("lg"), type: "payout", jobId: job.id, amount: job.price, status: "paid", to: job.hiredId, t: now() }, ...state.ledger.map((l) => (l.jobId === job.id && l.status === "held" ? { ...l, status: "released" } : l))],
        notifications: [{ id: uid("nt"), role: "student", text: `You were paid ${fmt$(job.price)} for “${job.title}”`, read: false, t: now() }, ...state.notifications],
        audit: [{ id: uid("au"), actor: a.by || "lister", action: `${a.by === "admin" ? "Auto-approved" : "Approved"} payout ${fmt$(job.price)} for “${job.title}”`, t: now() }, ...state.audit],
      };
    }

    case "ADD_REVIEW": {
      return {
        ...state,
        students: state.students.map((s) => {
          if (s.id !== a.studentId) return s;
          const reviews = [{ by: a.by, stars: a.stars, text: a.text, t: now() }, ...s.reviews];
          const rating = reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length;
          return { ...s, reviews, rating: Math.round(rating * 10) / 10, ratingCount: s.ratingCount + 1 };
        }),
      };
    }

    case "OPEN_DISPUTE":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, status: "disputed" } : j)),
        disputes: [{ id: uid("ds"), jobId: a.jobId, openedBy: a.openedBy, status: "open", evidence: a.evidence || [
          ...(a.note ? [{ by: a.openedBy, type: "note", note: a.note, t: now() }] : []),
          ...((a.photos || []).map((p) => ({ by: a.openedBy, type: "file", note: p.name || "photo.jpg", src: p.src, t: now() }))),
        ], decision: null, t: now() }, ...state.disputes],
        audit: [{ id: uid("au"), actor: a.openedBy, action: `Opened a dispute on “${a.title}”`, t: now() }, ...state.audit],
        notifications: [{ id: uid("nt"), role: "admin", text: `Dispute opened on “${a.title}”`, read: false, t: now() }, ...state.notifications],
      };

    case "ADD_EVIDENCE":
      return { ...state, disputes: state.disputes.map((d) => (d.id === a.disputeId ? { ...d, evidence: [...d.evidence, { by: a.by, type: a.kind, note: a.note, src: a.src || null, t: now() }] } : d)) };

    case "RESOLVE_DISPUTE": {
      const d = state.disputes.find((x) => x.id === a.disputeId);
      const job = state.jobs.find((j) => j.id === d.jobId);
      const payout = a.decision === "pay";
      return {
        ...state,
        disputes: state.disputes.map((x) => (x.id === a.disputeId ? { ...x, status: "resolved", decision: a.decision } : x)),
        jobs: state.jobs.map((j) => (j.id === d.jobId ? { ...j, status: "completed" } : j)),
        students: payout ? state.students.map((s) => (s.id === job.hiredId ? { ...s, earnings: { ...s.earnings, paid: s.earnings.paid + job.price } } : s)) : state.students,
        ledger: [{ id: uid("lg"), type: payout ? "payout" : "refund", jobId: job.id, amount: job.price, status: payout ? "paid" : "refunded", to: payout ? job.hiredId : "lister", t: now() }, ...state.ledger],
        audit: [{ id: uid("au"), actor: "admin", action: `Resolved dispute on “${job.title}” → ${payout ? "paid student" : "refunded lister"}`, t: now() }, ...state.audit],
      };
    }

    case "SEND_MSG": {
      const key = a.threadKey;
      const thread = state.threads[key] || [];
      return { ...state, threads: { ...state.threads, [key]: [...thread, { from: a.from, text: a.text, t: now() }] } };
    }

    case "REPLY_FEEDBACK":
      return {
        ...state,
        feedback: state.feedback.map((f) => (f.id === a.id ? { ...f, reply: a.reply, status: "answered" } : f)),
        audit: [{ id: uid("au"), actor: "admin", action: `Replied to feedback “${a.subject}”`, t: now() }, ...state.audit],
      };

    case "SUBMIT_FEEDBACK":
      return {
        ...state,
        feedback: [{ id: uid("fb"), fromRole: a.role, fromName: a.name, subject: a.subject, text: a.text, status: "open", reply: null, t: now() }, ...state.feedback],
        notifications: [{ id: uid("nt"), role: "admin", text: `New feedback: “${a.subject}”`, read: false, t: now() }, ...state.notifications],
      };

    case "MARK_NOTIFS_READ":
      return { ...state, notifications: state.notifications.map((n) => (n.role === a.role ? { ...n, read: true } : n)) };

    case "FORCE_PAYOUT":
    case "VOID_PAYMENT": {
      const job = state.jobs.find((j) => j.id === a.jobId);
      const pay = a.type === "FORCE_PAYOUT";
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, status: "completed" } : j)),
        students: pay && job.hiredId ? state.students.map((s) => (s.id === job.hiredId ? { ...s, earnings: { ...s.earnings, paid: s.earnings.paid + job.price } } : s)) : state.students,
        ledger: [{ id: uid("lg"), type: pay ? "payout" : "refund", jobId: job.id, amount: job.price, status: pay ? "paid" : "refunded", to: pay ? job.hiredId : "lister", t: now() }, ...state.ledger],
        audit: [{ id: uid("au"), actor: "admin", action: `${pay ? "Force-paid student" : "Voided & refunded"} for “${job.title}”`, t: now() }, ...state.audit],
      };
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);
function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, SEED);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return React.createElement(StoreContext.Provider, { value }, children);
}
const useStore = () => useContext(StoreContext);

Object.assign(window, {
  uid, now, fmt$, tierOf, ago,
  StoreContext, StoreProvider, useStore,
  SEED,
});
