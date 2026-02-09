export const prerender = false;

type ContactType = "sales" | "software" | "support" | "procurement" | "partnership" | "media";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort in-memory protection (resets on restart/serverless cold start).
// This is not a replacement for edge/WAF rate limiting, but stops most basic spam.
const RATE_BY_IP: Map<string, number[]> = new Map();
const RATE_BY_EMAIL: Map<string, number[]> = new Map();
const FINGERPRINTS: Map<string, number> = new Map();

function getEnv(locals: any, key: string): string | undefined {
  // Cloudflare adapter: locals.runtime.env
  const cf = locals?.runtime?.env?.[key];
  if (typeof cf === "string" && cf) return cf;

  // Node adapter / general
  // @ts-ignore
  const v = import.meta?.env?.[key];
  if (typeof v === "string" && v) return v;
  return undefined;
}

function nowMs() {
  return Date.now();
}

function pushWithinWindow(map: Map<string, number[]>, key: string, windowMs: number) {
  const t = nowMs();
  const arr = map.get(key) ?? [];
  const filtered = arr.filter((x) => t - x < windowMs);
  filtered.push(t);
  map.set(key, filtered);
  return filtered;
}

function rateLimit(map: Map<string, number[]>, key: string, limit: number, windowMs: number) {
  const arr = pushWithinWindow(map, key, windowMs);
  return arr.length <= limit;
}

function normalizeContactType(t: string): ContactType | null {
  const v = (t || "").trim();
  if (v === "sales" || v === "software" || v === "support" || v === "procurement" || v === "partnership" || v === "media") return v as ContactType;
  return null;
}

function typeLabel(t: ContactType) {
  return t === "sales"
    ? "Sales"
    : t === "software"
      ? "Software"
      : t === "support"
        ? "Support"
        : t === "procurement"
          ? "Procurement"
          : t === "partnership"
            ? "Partnership"
            : "Media";
}

function makeRequestId() {
  // short, non-guessable enough for client UX (not a security token)
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const t = new Date();
  const y = String(t.getUTCFullYear()).slice(-2);
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return `C${y}${m}${d}-${rand}`;
}

async function sha256Hex(input: string) {
  // Prefer Web Crypto if available
  const enc = new TextEncoder();
  // @ts-ignore
  const subtle = globalThis?.crypto?.subtle;
  if (subtle) {
    const buf = await subtle.digest("SHA-256", enc.encode(input));
    const bytes = new Uint8Array(buf);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(input).digest("hex");
}

async function verifyTurnstile(opts: {
  secret: string;
  token: string;
  ip?: string;
}): Promise<boolean> {
  const form = new URLSearchParams();
  form.set("secret", opts.secret);
  form.set("response", opts.token);
  if (opts.ip && opts.ip !== "unknown") form.set("remoteip", opts.ip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!r.ok) return false;
  const j = await r.json().catch(() => ({}));
  return Boolean(j?.success);
}

async function sendViaResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${text}`);
  }
}

export async function POST({ request, locals, clientAddress }: any) {
  const ip = (clientAddress || "unknown").toString();
  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";
  const acceptLang = request.headers.get("accept-language") || "";

  // Limits: IP (per hour) + Email (per 10 min)
  if (!rateLimit(RATE_BY_IP, ip, 8, 60 * 60 * 1000)) {
    return new Response(JSON.stringify({ error: "Too many requests", code: "RATE_LIMIT" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const org = String(body?.organization ?? "").trim();
  const type = normalizeContactType(String(body?.type ?? "procurement"));
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const consent = Boolean(body?.consent);
  const website = String(body?.website ?? "").trim();
  const ts = Number(body?.ts ?? 0);
  const turnstileToken = String(body?.turnstileToken ?? "").trim();

  // Honeypot
  if (website) {
    // Do not reveal to bots.
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // Time-gate: require a minimum time on page (3s) and a sane maximum (1h)
  if (ts) {
    const dt = nowMs() - ts;
    if (dt < 3000 || dt > 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Suspicious submission", code: "SUSPICIOUS" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Optional Turnstile (only enforced when TURNSTILE_SECRET_KEY is set)
  const turnstileSecret = getEnv(locals, "TURNSTILE_SECRET_KEY");
  if (turnstileSecret) {
    if (!turnstileToken) {
      return new Response(JSON.stringify({ error: "Verification required", code: "TURNSTILE_REQUIRED" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const ok = await verifyTurnstile({ secret: turnstileSecret, token: turnstileToken, ip });
    if (!ok) {
      return new Response(JSON.stringify({ error: "Verification failed", code: "TURNSTILE_FAILED" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Validation
  if (!type) {
    return new Response(JSON.stringify({ error: "Invalid type", code: "INVALID_TYPE" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (name.length < 2 || name.length > 40) {
    return new Response(JSON.stringify({ error: "Invalid name", code: "INVALID_NAME" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!emailRe.test(email) || email.length > 120) {
    return new Response(JSON.stringify({ error: "Invalid email", code: "INVALID_EMAIL" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (org && (org.length < 2 || org.length > 80)) {
    return new Response(JSON.stringify({ error: "Invalid organization", code: "INVALID_ORG" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (subject.length < 4 || subject.length > 80) {
    return new Response(JSON.stringify({ error: "Invalid subject", code: "INVALID_SUBJECT" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (message.length < 20 || message.length > 2000) {
    return new Response(JSON.stringify({ error: "Invalid message", code: "INVALID_MESSAGE" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!consent) {
    return new Response(JSON.stringify({ error: "Consent required", code: "CONSENT_REQUIRED" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Email rate limit (per 10 min)
  if (!rateLimit(RATE_BY_EMAIL, email.toLowerCase(), 3, 10 * 60 * 1000)) {
    return new Response(JSON.stringify({ error: "Too many requests", code: "EMAIL_RATE_LIMIT" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  // Fingerprint de-duplication (same email+subject+message within 10 min)
  const fp = await sha256Hex(`${email.toLowerCase()}\n${subject.toLowerCase()}\n${message}`);
  const prev = FINGERPRINTS.get(fp);
  const t = nowMs();
  if (prev && t - prev < 10 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Duplicate submission", code: "DUPLICATE" }), {
      status: 409,
      headers: { "content-type": "application/json" },
    });
  }
  FINGERPRINTS.set(fp, t);

  const reqId = makeRequestId();
  const tLabel = typeLabel(type);
  const subjectLine = `ORDO Contact | ${tLabel} | ${subject} | ${reqId}`;
  const text = [
    `RequestId: ${reqId}`,
    `Type: ${tLabel}`,
    `Name: ${name}`,
    org ? `Organization: ${org}` : null,
    `Email: ${email}`,
    `IP: ${ip}`,
    ua ? `UA: ${ua}` : null,
    referer ? `Referer: ${referer}` : null,
    acceptLang ? `Accept-Language: ${acceptLang}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  // Future-proof: send notification email when configured
  const resendKey = getEnv(locals, "RESEND_API_KEY");
  const from = getEnv(locals, "CONTACT_FROM") || "ORDO <no-reply@ordoinc.com>";
  const toByType = {
    sales: getEnv(locals, "CONTACT_TO_SALES"),
    software: getEnv(locals, "CONTACT_TO_SOFTWARE"),
    support: getEnv(locals, "CONTACT_TO_SUPPORT"),
    procurement: getEnv(locals, "CONTACT_TO_PROCUREMENT"),
    partnership: getEnv(locals, "CONTACT_TO_PARTNERSHIP"),
    media: getEnv(locals, "CONTACT_TO_MEDIA"),
  } as const;
  const to = toByType[type] || getEnv(locals, "CONTACT_NOTIFY_TO");

  try {
    if (resendKey && to) {
      await sendViaResend({ apiKey: resendKey, from, to, subject: subjectLine, text });
    }
  } catch {
    // Don't expose provider failure details.
    return new Response(JSON.stringify({ error: "Notification failed", code: "NOTIFY_FAILED" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, requestId: reqId }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
