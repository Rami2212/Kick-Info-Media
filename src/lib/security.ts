import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type GlobalRateLimitStore = Map<string, RateLimitBucket>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JAVASCRIPT_URL_REGEX = /javascript:/i;
const DATA_HTML_REGEX = /data:\s*text\/html/i;
const EVENT_HANDLER_ATTR_REGEX = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const DANGEROUS_TAG_REGEX = /<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)[^>]*>/gi;
const DANGEROUS_ATTR_REGEX = /\s(href|src)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;

function getRateLimitStore(): GlobalRateLimitStore {
  const globalScope = globalThis as typeof globalThis & {
    __kimRateLimitStore?: GlobalRateLimitStore;
  };
  if (!globalScope.__kimRateLimitStore) {
    globalScope.__kimRateLimitStore = new Map<string, RateLimitBucket>();
  }
  return globalScope.__kimRateLimitStore;
}

function getRequestHost(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedHost) return forwardedHost.split(",")[0].trim();
  const host = req.headers.get("host");
  if (host) return host.trim();
  try {
    return new URL(req.url).host;
  } catch {
    return "";
  }
}

function getRequestProtocol(req: Request): "http" | "https" {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto?.toLowerCase().includes("https")) return "https";
  if (forwardedProto?.toLowerCase().includes("http")) return "http";
  try {
    return new URL(req.url).protocol === "https:" ? "https" : "http";
  } catch {
    return "https";
  }
}

function expectedOrigin(req: Request): string {
  const host = getRequestHost(req);
  const proto = getRequestProtocol(req);
  return host ? `${proto}://${host}` : "";
}

function normalizeOrigin(raw: string): string {
  try {
    const parsed = new URL(raw);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

export function enforceSameOrigin(req: Request): NextResponse | null {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");
  const expected = expectedOrigin(req);
  if (!expected) {
    return NextResponse.json({ error: "Unable to verify request origin." }, { status: 403 });
  }

  if (originHeader) {
    const incoming = normalizeOrigin(originHeader);
    if (incoming !== expected) {
      return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
    }
    return null;
  }

  if (refererHeader) {
    const incoming = normalizeOrigin(refererHeader);
    if (incoming !== expected) {
      return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
    }
    return null;
  }

  return NextResponse.json({ error: "Request origin is required." }, { status: 403 });
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function cleanupExpiredBuckets(store: GlobalRateLimitStore, now: number) {
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  req: Request,
  keyPrefix: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const store = getRateLimitStore();
  const now = Date.now();
  cleanupExpiredBuckets(store, now);

  const key = `${keyPrefix}:${getClientIp(req)}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length <= 254 && EMAIL_REGEX.test(normalized);
}

export function sanitizeRichHtml(input: string): string {
  if (!input) return "";

  // Remove clearly dangerous tags.
  let safe = input.replace(DANGEROUS_TAG_REGEX, "");
  // Remove inline event handlers (onclick, onload, ...).
  safe = safe.replace(EVENT_HANDLER_ATTR_REGEX, "");
  // Remove javascript: and data:text/html payloads from URL-like attrs.
  safe = safe.replace(DANGEROUS_ATTR_REGEX, (full, attrName: string, attrValue: string) => {
    const unwrapped = attrValue.replace(/^['"]|['"]$/g, "").trim().toLowerCase();
    if (JAVASCRIPT_URL_REGEX.test(unwrapped) || DATA_HTML_REGEX.test(unwrapped)) {
      return "";
    }
    return ` ${attrName}=${attrValue}`;
  });

  return safe;
}
