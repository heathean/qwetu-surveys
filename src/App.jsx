import React, { useState, useEffect, useCallback } from "react";
import { Home, MapPin, Phone, Plus, Trash2, RotateCcw, Search, X, Check, AlertCircle } from "lucide-react";
import { supabase } from "./supabaseClient";

const COLORS = {
  ink: "#22262B",
  paper: "#F7F6F2",
  card: "#FFFFFF",
  blue: "#1B3A5C",
  blueDark: "#12283F",
  mustard: "#D9A404",
  green: "#2F7A4D",
  greenBg: "#E8F3EC",
  rust: "#A6432C",
  rustBg: "#F6E9E6",
  gray: "#8B8B85",
  border: "#E4E1D6",
};

const PROFILE_KEY = "jjk_profile_v1";

function StampBadge({ status }) {
  const taken = status === "taken";
  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        border: `2px solid ${taken ? COLORS.rust : COLORS.green}`,
        color: taken ? COLORS.rust : COLORS.green,
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.12em",
        transform: "rotate(-6deg)",
        textTransform: "uppercase",
        background: taken ? COLORS.rustBg : COLORS.greenBg,
      }}
    >
      {taken ? "Taken" : "Vacant"}
    </div>
  );
}

function ListingCard({ listing, rightAction, rotateSeed }) {
  const rot = rotateSeed % 2 === 0 ? "-0.6deg" : "0.6deg";
  return (
    <div
      style={{
        position: "relative",
        background: COLORS.card,
        borderLeft: `6px solid ${COLORS.blue}`,
        borderTop: `1px solid ${COLORS.border}`,
        borderRight: `1px solid ${COLORS.border}`,
        borderBottom: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        padding: "18px 18px 16px",
        transform: `rotate(${rot})`,
        boxShadow: "2px 3px 0 rgba(27,58,92,0.06)",
      }}
    >
      <StampBadge status={listing.status} />
      <div style={{ paddingRight: 70 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.ink }}>{listing.building_name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.gray, fontSize: 13, marginTop: 2 }}>
          <MapPin size={13} />
          {listing.location}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 20,
            color: COLORS.blue,
            background: "#EEF3F8",
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          KES {Number(listing.price).toLocaleString()}
        </span>
        <span style={{ fontSize: 12, color: COLORS.gray }}>/ month</span>
      </div>

      <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 8, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700 }}>{listing.room_label}: </span>
        {listing.description || "No extra details provided."}
      </div>

      {listing.status === "taken" && listing.hunter_name ? (
        <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 8 }}>Reserved by {listing.hunter_name}</div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.gray }}>
          <Phone size={12} />
          {listing.landlord_phone}
        </div>
        {rightAction}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          padding: "9px 10px",
          fontSize: 14,
          color: COLORS.ink,
          background: "#FCFBF8",
        }}
      />
    </label>
  );
}

export default function App() {
  const [mode, setMode] = useState("hunt");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ name: "", phone: "" });

  const [form, setForm] = useState({
    buildingName: "",
    location: "",
    roomLabel: "",
    price: "",
    description: "",
  });

  const [claimTarget, setClaimTarget] = useState(null);
  const [claimForm, setClaimForm] = useState({ name: "", phone: "" });
  const [claimError, setClaimError] = useState("");

  const [filterLocation, setFilterLocation] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError("Could not load listings. Check your Supabase setup.");
    } else {
      setListings(data || []);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();

    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        // ignore corrupt local profile
      }
    }

    const channel = supabase
      .channel("listings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        loadListings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadListings]);

  const updateProfile = (next) => {
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  };

  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!profile.name || !profile.phone) {
      setError("Enter your name and phone number above before posting.");
      return;
    }
    if (!form.buildingName || !form.location || !form.roomLabel || !form.price) {
      setError("Fill in building, location, room, and price.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("listings").insert({
      building_name: form.buildingName,
      location: form.location,
      room_label: form.roomLabel,
      price: form.price,
      description: form.description,
      landlord_name: profile.name,
      landlord_phone: profile.phone,
      status: "vacant",
    });
    setSaving(false);
    if (insertError) {
      setError("Could not post the room. Try again.");
      return;
    }
    setForm({ buildingName: "", location: "", roomLabel: "", price: "", description: "" });
    loadListings();
  };

  const handleDelete = async (id) => {
    await supabase.from("listings").delete().eq("id", id);
    loadListings();
  };

  const handleRelease = async (id) => {
    await supabase.from("listings").update({ status: "vacant", hunter_name: null, hunter_phone: null }).eq("id", id);
    loadListings();
  };

  const openClaim = (listing) => {
    setClaimTarget(listing);
    setClaimForm({ name: "", phone: "" });
    setClaimError("");
  };

  const confirmClaim = async () => {
    if (!claimForm.name.trim() || !claimForm.phone.trim()) {
      setClaimError("Enter your name and phone number so the landlord can reach you.");
      return;
    }
    const { error: claimErr } = await supabase
      .from("listings")
      .update({ status: "taken", hunter_name: claimForm.name, hunter_phone: claimForm.phone })
      .eq("id", claimTarget.id)
      .eq("status", "vacant");
    if (claimErr) {
      setClaimError("Could not reserve this room. It may have just been taken — refresh and try another.");
      return;
    }
    setClaimTarget(null);
    loadListings();
  };

  const myListings = listings.filter((l) => l.landlord_phone === profile.phone && profile.phone);
  const vacantListings = listings
    .filter((l) => l.status === "vacant")
    .filter((l) => !filterLocation || l.location.toLowerCase().includes(filterLocation.toLowerCase()))
    .filter((l) => !filterMaxPrice || Number(l.price) <= Number(filterMaxPrice));

  return (
    <div style={{ background: COLORS.paper, minHeight: "100vh", fontFamily: "sans-serif", color: COLORS.ink }}>
      <div style={{ background: COLORS.blue, padding: "28px 20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
          <Home size={22} />
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            QWETU SURVEYS Movers Ltd
          </span>
        </div>
        <div style={{ color: "#CFE0F0", fontSize: 13, marginTop: 4 }}>
          Vacant rooms, straight from the landlord. No middlemen, no fake numbers.
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={() => setMode("hunt")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: mode === "hunt" ? COLORS.mustard : "rgba(255,255,255,0.12)",
              color: mode === "hunt" ? COLORS.blueDark : "#fff",
            }}
          >
            <Search size={14} /> I'm house hunting
          </button>
          <button
            onClick={() => setMode("landlord")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: mode === "landlord" ? COLORS.mustard : "rgba(255,255,255,0.12)",
              color: mode === "landlord" ? COLORS.blueDark : "#fff",
            }}
          >
            <Home size={14} /> I'm renting out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 40px" }}>
        {error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.rustBg,
              color: COLORS.rust,
              border: `1px solid ${COLORS.rust}`,
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={15} />
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.gray }}>Loading listings…</div>
        ) : mode === "hunt" ? (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                placeholder="Filter by area (e.g. Kilimani)"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
              <input
                placeholder="Max price"
                type="number"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                style={{ width: 120, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
            </div>

            {vacantListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: COLORS.gray, fontSize: 14 }}>
                No vacant rooms match right now. Check back later, or widen your filters.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {vacantListings.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    rotateSeed={i}
                    rightAction={
                      <button
                        onClick={() => openClaim(l)}
                        style={{
                          background: COLORS.green,
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "7px 14px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        I want this room
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Your landlord details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <TextField label="Your name" value={profile.name} onChange={(v) => updateProfile({ ...profile, name: v })} placeholder="e.g. Mama Njeri" />
                <TextField label="Phone number" value={profile.phone} onChange={(v) => updateProfile({ ...profile, phone: v })} placeholder="07XX XXX XXX" />
              </div>
            </div>

            <form
              onSubmit={handleAddListing}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 28 }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Post a vacant room</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <TextField label="Apartment / building name" value={form.buildingName} onChange={(v) => setForm({ ...form, buildingName: v })} placeholder="e.g. Sunrise Apartments" />
                <TextField label="Location / area" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Kilimani, Nairobi" />
                <TextField label="Room" value={form.roomLabel} onChange={(v) => setForm({ ...form, roomLabel: v })} placeholder="e.g. Bedsitter, 1st floor" />
                <TextField label="Rent (KES / month)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="e.g. 12000" />
              </div>
              <div style={{ marginTop: 12 }}>
                <TextField label="Extra details (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Water, parking, deposit terms..." />
              </div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: COLORS.blue,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Plus size={14} /> {saving ? "Posting…" : "Post room"}
              </button>
            </form>

            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Your listings {profile.phone ? `(${myListings.length})` : ""}</div>
            {!profile.phone ? (
              <div style={{ color: COLORS.gray, fontSize: 13 }}>Enter your phone number above to see your posted rooms.</div>
            ) : myListings.length === 0 ? (
              <div style={{ color: COLORS.gray, fontSize: 13 }}>You haven't posted any rooms yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {myListings.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    rotateSeed={i}
                    rightAction={
                      <div style={{ display: "flex", gap: 8 }}>
                        {l.status === "taken" ? (
                          <button
                            onClick={() => handleRelease(l.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "transparent",
                              border: `1px solid ${COLORS.blue}`,
                              color: COLORS.blue,
                              borderRadius: 6,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <RotateCcw size={12} /> Mark vacant
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(l.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "transparent",
                            border: `1px solid ${COLORS.rust}`,
                            color: COLORS.rust,
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {claimTarget ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,20,20,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setClaimTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.card, borderRadius: 10, padding: 20, width: "100%", maxWidth: 360 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Reserve this room</div>
              <button onClick={() => setClaimTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 14 }}>
              {claimTarget.building_name} — {claimTarget.room_label}. Your details go straight to the landlord so they can confirm with you.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <TextField label="Your name" value={claimForm.name} onChange={(v) => setClaimForm({ ...claimForm, name: v })} placeholder="Full name" />
              <TextField label="Your phone number" value={claimForm.phone} onChange={(v) => setClaimForm({ ...claimForm, phone: v })} placeholder="07XX XXX XXX" />
            </div>
            {claimError ? <div style={{ color: COLORS.rust, fontSize: 12, marginTop: 8 }}>{claimError}</div> : null}
            <button
              onClick={confirmClaim}
              style={{
                marginTop: 16,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: COLORS.green,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Check size={14} /> Confirm reservation
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
