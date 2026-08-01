/**
 * Thin wrapper around fetch.
 *
 * Auth is a placeholder: we send the selected demo user's id in X-User-Id.
 * When real auth lands, swap `authHeaders()` for an Authorization bearer token
 * and nothing else in the app needs to change.
 */

const BASE = "/api";
const USER_KEY = "quickwork.userId";

export function getCurrentUserId() {
  return localStorage.getItem(USER_KEY);
}

export function setCurrentUserId(id) {
  if (id) localStorage.setItem(USER_KEY, id);
  else localStorage.removeItem(USER_KEY);
}

function authHeaders() {
  const id = getCurrentUserId();
  return id ? { "X-User-Id": id } : {};
}

async function request(method, path, body) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return null;

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  del: (path) => request("DELETE", path),

  // --- accounts ---
  usersByRole: (role) => request("GET", `/users?role=${role}`),
  me: () => request("GET", "/users/me"),
  user: (id) => request("GET", `/users/${id}`),
  userReviews: (id) => request("GET", `/users/${id}/reviews`),
  updateProfile: (patch) => request("PATCH", "/users/me", patch),
  configurePayout: (last4) => request("POST", "/users/me/payout-method", { last4 }),
  studentDashboard: () => request("GET", "/users/me/dashboard"),

  // --- jobs ---
  openJobs: () => request("GET", "/jobs"),
  job: (id) => request("GET", `/jobs/${id}`),
  myListings: () => request("GET", "/jobs/mine"),
  createJob: (job) => request("POST", "/jobs", job),
  cancelJob: (id) => request("POST", `/jobs/${id}/cancel`),
  applyToJob: (id, message) => request("POST", `/jobs/${id}/apply`, { message }),
  applications: (id) => request("GET", `/jobs/${id}/applications`),
  hire: (id, applicationId) => request("POST", `/jobs/${id}/hire`, { applicationId }),
  declineApplication: (applicationId) => request("POST", `/jobs/applications/${applicationId}/decline`),
  markDone: (id) => request("POST", `/jobs/${id}/mark-done`),
  confirmCompletion: (id) => request("POST", `/jobs/${id}/confirm`),
  leaveReview: (id, stars, body) => request("POST", `/jobs/${id}/review`, { stars, body }),
  openDispute: (id, payload) => request("POST", `/jobs/${id}/dispute`, payload),

  // --- messaging ---
  messages: (jobId) => request("GET", `/jobs/${jobId}/messages`),
  sendMessage: (jobId, body) => request("POST", `/jobs/${jobId}/messages`, { body }),

  // --- notifications & cases ---
  notifications: () => request("GET", "/users/me/notifications"),
  markNotificationsRead: () => request("POST", "/users/me/notifications/read"),
  myDisputes: () => request("GET", "/users/me/disputes"),

  // --- help desk ---
  myFeedback: () => request("GET", "/users/me/feedback"),
  submitFeedback: (subject, body) => request("POST", "/users/me/feedback", { subject, body }),

  // --- admin ---
  adminOverview: () => request("GET", "/admin/overview"),
  adminQueue: () => request("GET", "/admin/queue"),
  approveJob: (id) => request("POST", `/admin/jobs/${id}/approve`),
  rejectJob: (id, reason) => request("POST", `/admin/jobs/${id}/reject`, { reason }),
  adminCompletions: () => request("GET", "/admin/completions"),
  remindLister: (id) => request("POST", `/admin/jobs/${id}/remind`),
  forcePayout: (id) => request("POST", `/admin/jobs/${id}/force-payout`),
  adminDisputes: () => request("GET", "/admin/disputes"),
  addDisputeEvidence: (id, payload) => request("POST", `/admin/disputes/${id}/evidence`, payload),
  resolveDispute: (id, payload) => request("POST", `/admin/disputes/${id}/resolve`, payload),
  adminLedger: () => request("GET", "/admin/ledger"),
  adminFeedback: () => request("GET", "/admin/feedback"),
  replyToFeedback: (id, reply) => request("POST", `/admin/feedback/${id}/reply`, { reply }),
  adminAudit: () => request("GET", "/admin/audit"),
};
