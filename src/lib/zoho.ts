import "server-only";

/**
 * Sends a lead to the client's Zoho CRM through the same "Web-to-Lead" form the old
 * smilecars.net home page used (form id 1258036000000449333, Zoho India data centre).
 *
 * Off until ZOHO_ENABLED=true. The two form tokens are not secret (they are in the old
 * site's public HTML) but are kept in env vars so a new form can be swapped in without code.
 */
export interface Lead {
  name: string;
  phone: string;
  email?: string;
}

export async function sendZohoLead(lead: Lead): Promise<{ status: "sent" | "skipped" | "failed"; detail?: string }> {
  const xnQsjsdp = process.env.ZOHO_WEBFORM_XNQSJSDP;
  const xmIwtLD = process.env.ZOHO_WEBFORM_XMIWTLD;
  if (process.env.ZOHO_ENABLED !== "true" || !xnQsjsdp || !xmIwtLD) {
    console.info(`[zoho disabled] lead ${lead.name} ${lead.phone}`);
    return { status: "skipped" };
  }
  const form = new URLSearchParams({
    xnQsjsdp,
    zc_gad: "",
    xmIwtLD,
    actionType: "TGVhZHM=", // base64 "Leads"
    returnURL: "null",
    "Last Name": lead.name.slice(0, 80),
    Email: lead.email ?? "",
    Phone: lead.phone,
    aG9uZXlwb3Q: "", // Zoho's honeypot field, must stay empty
  });
  try {
    const res = await fetch(process.env.ZOHO_WEBFORM_URL || "https://crm.zoho.in/crm/WebToLeadForm", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    // Zoho answers a successful submission with a redirect or a 200 HTML page.
    if (res.status >= 400) {
      console.error(`[zoho] lead failed: HTTP ${res.status}`);
      return { status: "failed", detail: `HTTP ${res.status}` };
    }
    return { status: "sent", detail: `HTTP ${res.status}` };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[zoho] lead failed: ${detail}`);
    return { status: "failed", detail };
  }
}
