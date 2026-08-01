export const money = (value) => {
  const n = Number(value ?? 0);
  return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
};

export const timeAgo = (iso) => {
  if (!iso) return "";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/** Price tier drives the colour coding used throughout the UI. */
export const priceTier = (price) => {
  const n = Number(price ?? 0);
  return n <= 20 ? "green" : n <= 49 ? "yellow" : "red";
};

export const TIER_META = {
  green: { color: "#1B9E5A", background: "#E6F6EC", label: "$0–20" },
  yellow: { color: "#D99100", background: "#FCF3DC", label: "$21–49" },
  red: { color: "#D6452B", background: "#FBE7E2", label: "$50+" },
};

export const JOB_STATUS_META = {
  PENDING_APPROVAL: { tone: "yellow", label: "Pending approval" },
  OPEN: { tone: "green", label: "Live" },
  HIRED: { tone: "navy", label: "Student hired" },
  COMPLETED: { tone: "green", label: "Completed & paid" },
  DISPUTED: { tone: "red", label: "In dispute" },
  CANCELLED: { tone: "gray", label: "Cancelled & refunded" },
  REJECTED: { tone: "red", label: "Rejected" },
};

/** Reads a File into a base64 data URL for the JSON API. */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
