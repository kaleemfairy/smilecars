import "server-only";

/**
 * Sends a WhatsApp template message through the WhatsApp Business Cloud API (Meta).
 *
 * Business-initiated messages must use templates approved in WhatsApp Manager.
 * Set WHATSAPP_ENABLED=true only after the templates are approved; until then every
 * call is logged and skipped, so bookings keep working while Meta verification is pending.
 *
 * Endpoint: POST https://graph.facebook.com/{version}/{phone-number-id}/messages
 */
export interface WhatsAppMessage {
  /** Recipient number with country code, any format (e.g. +91 98400 12345). */
  to: string;
  /** Approved template name. */
  template: string;
  /** Values for {{1}}, {{2}}, ... in the template body, in order. */
  params: string[];
  language?: string;
}

export type WhatsAppResult =
  | { status: "sent"; id?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export async function sendWhatsApp(msg: WhatsAppMessage): Promise<WhatsAppResult> {
  const to = msg.to.replace(/\D/g, "");
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.info(`[whatsapp disabled] ${msg.template} -> ${to}: ${msg.params.join(" | ")}`);
    return { status: "skipped", reason: "WHATSAPP_ENABLED is not true" };
  }
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  if (!token || !phoneNumberId) return { status: "skipped", reason: "WhatsApp credentials missing" };
  if (to.length < 10) return { status: "failed", error: "Invalid recipient number" };

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: msg.template,
          language: { code: msg.language || process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
          components: [
            {
              type: "body",
              // WhatsApp rejects parameters with newlines, tabs or 4+ spaces.
              parameters: msg.params.map((text) => ({
                type: "text",
                text: text.replace(/[\n\t]+/g, " ").replace(/ {4,}/g, " ").slice(0, 1000) || "-",
              })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      const error = body.error?.message ?? `HTTP ${res.status}`;
      console.error(`[whatsapp] ${msg.template} -> ${to} failed: ${error}`);
      return { status: "failed", error };
    }
    return { status: "sent", id: body.messages?.[0]?.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp] ${msg.template} -> ${to} failed: ${error}`);
    return { status: "failed", error };
  }
}
