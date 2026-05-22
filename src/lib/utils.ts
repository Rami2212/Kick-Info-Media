export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MESSAGE_URL_REGEX = /((https?:\/\/|www\.)[^\s<]+)/gi;

export interface MessageTextPart {
  type: "text" | "link";
  value: string;
  href?: string;
}

function sanitizeHref(raw: string): string | null {
  const prefixed = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(prefixed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function splitMessageTextWithLinks(text: string): MessageTextPart[] {
  if (!text) return [{ type: "text", value: "" }];

  const parts: MessageTextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MESSAGE_URL_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const rawMatch = match[0];

    let cleanUrl = rawMatch;
    let trailing = "";
    while (/[),.!?]$/.test(cleanUrl)) {
      trailing = cleanUrl.slice(-1) + trailing;
      cleanUrl = cleanUrl.slice(0, -1);
    }

    if (matchStart > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, matchStart) });
    }

    const href = sanitizeHref(cleanUrl);
    if (href) {
      parts.push({ type: "link", value: cleanUrl, href });
    } else {
      parts.push({ type: "text", value: rawMatch });
    }

    if (trailing) {
      parts.push({ type: "text", value: trailing });
    }

    lastIndex = matchStart + rawMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", value: text }];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
