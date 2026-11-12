import "server-only";

/**
 * Sends a transactional email through Resend (https://resend.com, free tier: 3,000 emails a month).
 *
 * Off until EMAIL_ENABLED=true and RESEND_API_KEY are set; until then every call is logged and skipped.
 * Resend only delivers to any recipient once the sending domain (smilecars.net) is verified
 * in the Resend dashboard, so set EMAIL_FROM to an address on that domain.
 *
 * API: POST https://api.resend.com/emails  { from, to, subject, html, text, reply_to }
 */
export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Prevents duplicate sends if the same event is retried (kept 24 h by Resend). */
  idempotencyKey?: string;
}

export type EmailResult =
  | { status: "sent"; id?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const to = msg.to.map((t) => t.trim()).filter((t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t));
  if (to.length === 0) return { status: "skipped", reason: "no valid recipients" };
  if (process.env.EMAIL_ENABLED !== "true" || !process.env.RESEND_API_KEY) {
    console.info(`[email disabled] "${msg.subject}" -> ${to.join(", ")}`);
    return { status: "skipped", reason: "EMAIL_ENABLED is not true or RESEND_API_KEY is missing" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(msg.idempotencyKey ? { "Idempotency-Key": msg.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Smile Cars Website <bookings@smilecars.net>",
        to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      const error = body.message ?? `HTTP ${res.status}`;
      console.error(`[email] "${msg.subject}" failed: ${error}`);
      return { status: "failed", error };
    }
    return { status: "sent", id: body.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[email] "${msg.subject}" failed: ${error}`);
    return { status: "failed", error };
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Simple, email-client-safe HTML: a heading, a table of label/value rows and an optional button. */
export function emailLayout(opts: {
  heading: string;
  intro?: string;
  rows: [string, string][];
  button?: { label: string; url: string };
}): { html: string; text: string } {
  const rows = opts.rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#1e293b;font-weight:600">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
<div style="background:#1b7d6a;color:#fff;padding:16px 20px;font-size:18px;font-weight:bold">${esc(opts.heading)}</div>
<div style="padding:20px">${opts.intro ? `<p style="margin:0 0 12px;color:#334155">${esc(opts.intro)}</p>` : ""}
<table style="border-collapse:collapse;font-size:14px">${rows}</table>
${opts.button ? `<p style="margin:20px 0 0"><a href="${esc(opts.button.url)}" style="display:inline-block;background:#facc15;color:#1e293b;padding:10px 18px;border-radius:8px;font-weight:bold;text-decoration:none">${esc(opts.button.label)}</a></p>` : ""}
</div></div></body></html>`;
  const text = [
    opts.heading,
    opts.intro ?? "",
    ...opts.rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    opts.button ? `${opts.button.label}: ${opts.button.url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { html, text };
}
