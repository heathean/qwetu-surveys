// Vercel serverless function — server-only, keeps secrets private.
//
// Emails the landlord when a hunter expresses interest. Uses Resend
// (a free-tier email service — no business verification needed, unlike
// the SMS provider) and Supabase's admin API to look up the landlord's
// email address from their account.
//
// SUPABASE_SERVICE_ROLE_KEY is a powerful, sensitive credential — it
// bypasses all database access rules. It must ONLY ever be pasted into
// Vercel's Environment Variables, never committed to a file or shared.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { listingId, hunterName } = req.body || {};
  if (!listingId) {
    res.status(400).json({ error: "Missing listingId" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceKey || !resendKey) {
    // Not configured yet — fail quietly, the interest is still saved either way.
    res.status(200).json({ ok: false, reason: "Email not configured" });
    return;
  }

  try {
    const listingRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=landlord_id,building_name,room_label`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const rows = await listingRes.json();
    const listing = Array.isArray(rows) ? rows[0] : null;
    if (!listing || !listing.landlord_id) {
      res.status(404).json({ ok: false, reason: "Listing or landlord not found" });
      return;
    }

    const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${listing.landlord_id}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const userData = await userRes.json();
    const email = userData?.email;
    if (!email) {
      res.status(404).json({ ok: false, reason: "Landlord email not found" });
      return;
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Qwetu Surveys <onboarding@resend.dev>",
        to: [email],
        subject: `Someone's interested in your ${listing.room_label}`,
        html: `<p><strong>${hunterName || "Someone"}</strong> is interested in your <strong>${listing.room_label}</strong> at <strong>${listing.building_name}</strong>.</p><p>Open Qwetu Surveys and go to "Your listings" to see their contact details.</p>`,
      }),
    });
    const emailData = await emailRes.json();
    res.status(200).json({ ok: true, emailData });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
