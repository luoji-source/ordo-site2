import type { APIRoute } from 'astro';

export const prerender = false;

type LocalsWithEnv = {
  runtime?: { env?: Record<string, string | undefined> };
  env?: Record<string, string | undefined>;
};

function getEnv(locals: unknown, key: string): string {
  const l = (locals ?? {}) as LocalsWithEnv;
  // Astro Cloudflare adapter provides env here
  const vRuntime = l.runtime?.env?.[key];
  if (typeof vRuntime === 'string') return vRuntime;

  // Some runtimes (or future adapters) may expose env directly
  const vDirect = l.env?.[key];
  if (typeof vDirect === 'string') return vDirect;

  // Node build/runtime fallback (local dev)
  const vProcess = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  return typeof vProcess === 'string' ? vProcess : '';
}

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function safeClientIp(headers: Headers): string {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    headers.get('x-real-ip'),
  ];
  return (candidates.find(Boolean) ?? '').toString();
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(len = 16): string {
  // Worker-safe random string (base32-ish)
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  const bytes = new Uint8Array(len);
  // @ts-ignore - crypto exists in Workers
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function sha256Hex(input: string): Promise<string | null> {
  try {
    // @ts-ignore - crypto exists in Workers
    if (!crypto?.subtle) return null;
    const enc = new TextEncoder();
    // @ts-ignore
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function validateEmail(email: string): boolean {
  // Simple, pragmatic validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstile(secret: string, token: string, remoteip?: string) {
  try {
    const form = new URLSearchParams();
    form.set('secret', secret);
    form.set('response', token);
    if (remoteip) form.set('remoteip', remoteip);

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    const data = (await resp.json()) as { success?: boolean; [k: string]: unknown };
    return { ok: !!data.success, raw: data };
  } catch (e) {
    return { ok: false, raw: { error: 'turnstile_verify_failed', detail: String(e) } };
  }
}

async function sendMailChannels(args: {
  to: string;
  cc?: string;
  from: string;
  replyTo?: string;
  subject: string;
  contentText: string;
}) {
  const payload = {
    personalizations: [
      {
        to: [{ email: args.to }],
        ...(args.cc ? { cc: [{ email: args.cc }] } : {}),
      },
    ],
    from: { email: args.from, name: 'ORDO Support' },
    ...(args.replyTo ? { reply_to: { email: args.replyTo } } : {}),
    subject: args.subject,
    content: [{ type: 'text/plain', value: args.contentText }],
  };

  const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await resp.text().catch(() => '');
  return { ok: resp.ok, status: resp.status, body: text };
}

function buildTextEmail(params: {
  name: string;
  email: string;
  org?: string;
  topic: string;
  subject: string;
  message: string;
  lang: string;
  page: string;
  requestId: string;
  ip: string;
  ua: string;
}) {
  const lines = [
    `ORDO Support Form (${params.lang})`,
    `Time: ${nowIso()}`,
    `Request ID: ${params.requestId}`,
    `Page: ${params.page}`,
    '',
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    `Organization: ${params.org ?? ''}`,
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    '',
    'Message:',
    params.message,
    '',
    '---',
    `IP: ${params.ip}`,
    `UA: ${params.ua}`,
  ];
  return lines.join('\n');
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  // IMPORTANT: Never let an exception bubble up, or Cloudflare will show a 502 HTML page.
  try {
    if (request.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return json(415, { ok: false, error: 'unsupported_media_type' });
    }

    const body = (await request.json().catch(() => null)) as any;
    if (!body) return json(400, { ok: false, error: 'invalid_json' });

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const org = String(body.organization ?? '').trim();
    const topic = String(body.topic ?? '').trim();
    const subject = String(body.subject ?? '').trim();
    const message = String(body.message ?? '').trim();
    const agree = body.agree === true;
    const turnstileToken = String(body.turnstileToken ?? '').trim();

    if (!agree) return json(400, { ok: false, error: 'agree_required' });
    if (!name) return json(400, { ok: false, error: 'name_required' });
    if (!email || !validateEmail(email)) return json(400, { ok: false, error: 'invalid_email' });
    if (!topic) return json(400, { ok: false, error: 'topic_required' });
    if (!subject) return json(400, { ok: false, error: 'subject_required' });
    if (!message) return json(400, { ok: false, error: 'message_required' });
    if (subject.length > 180) return json(400, { ok: false, error: 'subject_too_long' });
    if (message.length > 5000) return json(400, { ok: false, error: 'message_too_long' });

    const ip = safeClientIp(request.headers);
    const ua = request.headers.get('user-agent') || '';
    const acceptLang = request.headers.get('accept-language') || '';
    const lang = url.pathname.startsWith('/zh') ? 'zh' : 'en';
    const requestId = randomId(18);

    // Anti-abuse: basic duplicate detection (best-effort, can be disabled by setting SUPPORT_FINGERPRINT_WINDOW_SEC=0)
    const windowSec = Number(getEnv(locals, 'SUPPORT_FINGERPRINT_WINDOW_SEC') || '45');
    const fpRaw = `${ip}|${ua}|${name.toLowerCase()}|${email.toLowerCase()}|${topic}|${subject.toLowerCase()}|${message.slice(0, 200).toLowerCase()}`;
    const fp = await sha256Hex(fpRaw);

    if (windowSec > 0 && fp) {
      // Store in a cookie-less in-memory map is not possible in Workers (stateless).
      // So we only *check* for an incoming client-provided requestId (optional) as a soft gate.
      // (Keeps code future-proof: if you later re-enable D1, this is where you'd write.)
      const clientRid = request.headers.get('x-ordo-request-id') || '';
      if (clientRid && clientRid === fp) {
        return json(429, { ok: false, error: 'duplicate_submission' });
      }
    }

    // Turnstile verification (optional but recommended)
    const turnstileSecret = getEnv(locals, 'TURNSTILE_SECRET_KEY');
    if (turnstileSecret) {
      if (!turnstileToken) return json(400, { ok: false, error: 'turnstile_required' });
      const verify = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
      if (!verify.ok) return json(400, { ok: false, error: 'turnstile_failed', detail: verify.raw });
    }

    const to = getEnv(locals, 'CONTACT_TO_SUPPORT') || 'haochiwang@163.com';
    const cc = getEnv(locals, 'CONTACT_CC_SUPPORT') || 'haochiwang@163.com';
    const from = getEnv(locals, 'CONTACT_FROM_EMAIL') || `support@${url.hostname}`;

    const mail = buildTextEmail({
      name,
      email,
      org,
      topic,
      subject,
      message,
      lang: `${lang};${acceptLang}`,
      page: url.href,
      requestId,
      ip,
      ua,
    });

    // NOTE: MailChannels requires a valid "from" domain with proper DNS (SPF/DKIM) for best delivery.
    const res = await sendMailChannels({
      to,
      cc,
      from,
      replyTo: email,
      subject: `[ORDO] ${topic} — ${subject}`,
      contentText: mail,
    });

    if (!res.ok) {
      // Return a JSON error (do NOT throw) so the browser sees a controlled message.
      return json(res.status >= 500 ? 502 : 400, {
        ok: false,
        error: 'mail_send_failed',
        status: res.status,
        detail: res.body?.slice(0, 2000),
      });
    }

    return json(200, { ok: true, requestId });
  } catch (e) {
    return json(500, { ok: false, error: 'internal_error', detail: String(e) });
  }
};
