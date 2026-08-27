// Vercel serverless function — runs on the server, never in the browser,
// so the SMS provider's API key stays private here.
//
// Called after a hunter expresses interest, to text the landlord.
// We look the listing up ourselves (using the listing id only) instead
// of trusting a phone number sent from the browser, so this can't be
// used to text arbitrary numbers.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { listingId, hunterName, hunterPhone, slotLabel } = req.body || {};
  if (!listingId) {
    res.status(400).json({ error: "Missing listingId" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const atUsername = process.env.AT_USERNAME;
  const atApiKey = process.env.AT_API_KEY;
  const atSandbox = process.env.AT_SANDBOX === "true";

  if (!supabaseUrl || !supabaseAnonKey || !atUsername || !atApiKey) {
    // SMS isn't configured yet — fail quietly so the site keeps working
    // without texts rather than breaking the interest flow.
    res.status(200).json({ ok: false, reason: "SMS not configured" });
    return;
  }

  try {
    const listingRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=landlord_phone,building_name,room_label`,
      { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } }
    );
    const rows = await listingRes.json();
    const listing = Array.isArray(rows) ? rows[0] : null;
    if (!listing) {
      res.status(404).json({ ok: false, reason: "Listing not found" });
      return;
    }

    let landlordPhone = (listing.landlord_phone || "").replace(/\D/g, "");
    if (landlordPhone.startsWith("0")) landlordPhone = "254" + landlordPhone.slice(1);
    else if (!landlordPhone.startsWith("254")) landlordPhone = "254" + landlordPhone;
    landlordPhone = "+" + landlordPhone;

    const message = `Qwetu Surveys: ${hunterName || "Someone"} is interested in your ${listing.room_label} at ${listing.building_name}. Open the app to see their contact details.`;

    const base = atSandbox ? "https://api.sandbox.africastalking.com" : "https://api.africastalking.com";
    const smsRes = await fetch(`${base}/version1/messaging`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        apiKey: atApiKey,
      },
      body: new URLSearchParams({ username: atUsername, to: landlordPhone, message }),
    });
    const smsData = await smsRes.json();

    // If the hunter picked a viewing slot, text them a confirmation too —
    // this is their only real "reminder", since we have no hunter account
    // to push a notification to later.
    let hunterSmsData = null;
    if (hunterPhone && slotLabel) {
      let hPhone = hunterPhone.replace(/\D/g, "");
      if (hPhone.startsWith("0")) hPhone = "254" + hPhone.slice(1);
      else if (!hPhone.startsWith("254")) hPhone = "254" + hPhone;
      hPhone = "+" + hPhone;

      const hunterMessage = `Qwetu Surveys: your viewing at ${listing.building_name} (${listing.room_label}) is set for ${slotLabel}. Contact the landlord on ${listing.landlord_phone || ""} for any changes.`;

      const hunterSmsRes = await fetch(`${base}/version1/messaging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          apiKey: atApiKey,
        },
        body: new URLSearchParams({ username: atUsername, to: hPhone, message: hunterMessage }),
      });
      hunterSmsData = await hunterSmsRes.json();
    }

    res.status(200).json({ ok: true, smsData, hunterSmsData });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
