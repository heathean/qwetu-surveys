import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Home,
  MapPin,
  Phone,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  X,
  Check,
  AlertCircle,
  Camera,
  Navigation,
  MessageCircle,
  Droplet,
  Wind,
  Car,
  Wifi,
  Sofa,
  ShieldCheck,
  Loader2,
  Flag,
  Users,
} from "lucide-react";
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
const PHOTO_BUCKET = "listing-photos";

const AMENITIES = [
  { key: "water", label: "Reliable water", icon: Droplet },
  { key: "balcony", label: "Balcony", icon: Wind },
  { key: "parking", label: "Parking", icon: Car },
  { key: "wifi", label: "Wifi ready", icon: Wifi },
  { key: "furnished", label: "Furnished", icon: Sofa },
  { key: "security", label: "Gated / security", icon: ShieldCheck },
];

// --- distance helper (haversine, returns km) ---
function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined || Number.isNaN(Number(v)))) {
    return null;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function whatsappLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? "254" + digits.slice(1) : digits.startsWith("254") ? digits : "254" + digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

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
        zIndex: 2,
      }}
    >
      {taken ? "Taken" : "Vacant"}
    </div>
  );
}

function PhotoStrip({ photos }) {
  const [active, setActive] = useState(0);
  if (!photos || photos.length === 0) {
    return (
      <div
        style={{
          height: 160,
          background: "#EFECE3",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.gray,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        <Camera size={16} style={{ marginRight: 6 }} /> No photos yet
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <img
        src={photos[active]}
        alt="Room"
        style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 4, display: "block" }}
      />
      {photos.length > 1 ? (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {photos.map((p, i) => (
            <button
              key={p + i}
              onClick={() => setActive(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: i === active ? COLORS.blue : COLORS.border,
                padding: 0,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AmenityTags({ amenities }) {
  if (!amenities || amenities.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {amenities.map((key) => {
        const found = AMENITIES.find((a) => a.key === key);
        if (!found) return null;
        const Icon = found.icon;
        return (
          <span
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.blue,
              background: "#EEF3F8",
              padding: "3px 8px",
              borderRadius: 20,
            }}
          >
            <Icon size={11} /> {found.label}
          </span>
        );
      })}
    </div>
  );
}

function ListingCard({ listing, rightAction, rotateSeed, distance, onReport }) {
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
      <PhotoStrip photos={listing.photos} />

      <div style={{ paddingRight: 70 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.ink }}>{listing.building_name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.gray, fontSize: 13, marginTop: 2 }}>
          <MapPin size={13} />
          {listing.location}
          {distance !== null && distance !== undefined ? (
            <span style={{ color: COLORS.blue, fontWeight: 700 }}>· {distance.toFixed(1)} km away</span>
          ) : null}
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

      <AmenityTags amenities={listing.amenities} />

      {listing.status === "taken" && listing.hunter_name ? (
        <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 8 }}>Reserved by {listing.hunter_name}</div>
      ) : listing.interested_count > 0 ? (
        <div style={{ fontSize: 12, color: COLORS.mustard, fontWeight: 700, marginTop: 8 }}>
          {listing.interested_count} {listing.interested_count === 1 ? "person is" : "people are"} interested
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <a
            href={`tel:${listing.landlord_phone}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.blue,
              textDecoration: "none",
            }}
          >
            <Phone size={12} /> {listing.landlord_phone}
          </a>
          <a
            href={whatsappLink(listing.landlord_phone, `Hi, I'm interested in the ${listing.room_label} at ${listing.building_name} listed on Qwetu Surveys.`)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.green,
              textDecoration: "none",
            }}
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
          {onReport ? (
            <button
              onClick={() => onReport(listing)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: COLORS.gray,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              <Flag size={11} /> Report
            </button>
          ) : null}
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
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [profile, setProfile] = useState({ name: "", phone: "" });

  const [form, setForm] = useState({
    buildingName: "",
    location: "",
    roomLabel: "",
    price: "",
    description: "",
    amenities: [],
    photos: [],
    latitude: null,
    longitude: null,
  });
  const [locatingForm, setLocatingForm] = useState(false);

  const [claimTarget, setClaimTarget] = useState(null);
  const [claimForm, setClaimForm] = useState({ name: "", phone: "" });
  const [claimError, setClaimError] = useState("");

  const [interestsByListing, setInterestsByListing] = useState({});
  const [markTakenTarget, setMarkTakenTarget] = useState(null);

  const [filterLocation, setFilterLocation] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterAmenities, setFilterAmenities] = useState([]);

  const [nearMeOn, setNearMeOn] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(5);
  const [myCoords, setMyCoords] = useState(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const [locateError, setLocateError] = useState("");

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

  const toggleFormAmenity = (key) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((k) => k !== key) : [...f.amenities, key],
    }));
  };

  const toggleFilterAmenity = (key) => {
    setFilterAmenities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhotos(true);
    setError("");
    const uploadedUrls = [];
    for (const file of files.slice(0, 5)) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
      if (uploadError) {
        setError(
          "Could not upload photos. Make sure the 'listing-photos' storage bucket exists and is public (see supabase_schema.sql)."
        );
        continue;
      }
      const { data: publicUrlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      if (publicUrlData?.publicUrl) uploadedUrls.push(publicUrlData.publicUrl);
    }
    setForm((f) => ({ ...f, photos: [...f.photos, ...uploadedUrls].slice(0, 5) }));
    setUploadingPhotos(false);
  };

  const removeFormPhoto = (url) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p !== url) }));
  };

  const useMyLocationForForm = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location. You can still post without it.");
      return;
    }
    setLocatingForm(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocatingForm(false);
      },
      () => {
        setError("Could not get your location. Check your browser's location permission and try again.");
        setLocatingForm(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      amenities: form.amenities,
      photos: form.photos,
      latitude: form.latitude,
      longitude: form.longitude,
    });
    setSaving(false);
    if (insertError) {
      setError("Could not post the room. Try again.");
      return;
    }
    setForm({
      buildingName: "",
      location: "",
      roomLabel: "",
      price: "",
      description: "",
      amenities: [],
      photos: [],
      latitude: null,
      longitude: null,
    });
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

  const openMarkTaken = async (listing) => {
    const { data } = await supabase
      .from("interests")
      .select("*")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false });
    setInterestsByListing((prev) => ({ ...prev, [listing.id]: data || [] }));
    setMarkTakenTarget(listing);
  };

  const openClaim = (listing) => {
    setClaimTarget(listing);
    setClaimForm({ name: "", phone: "" });
    setClaimError("");
  };

  // Hunters no longer mark a room taken directly — they register interest.
  // Only the landlord (in "Your listings") can mark a room as taken.
  const confirmClaim = async () => {
    if (!claimForm.name.trim() || !claimForm.phone.trim()) {
      setClaimError("Enter your name and phone number so the landlord can reach you.");
      return;
    }
    const { error: interestErr } = await supabase.from("interests").insert({
      listing_id: claimTarget.id,
      hunter_name: claimForm.name,
      hunter_phone: claimForm.phone,
    });
    if (interestErr) {
      setClaimError("Could not send your interest. Try again.");
      return;
    }
    await supabase
      .from("listings")
      .update({ interested_count: (claimTarget.interested_count || 0) + 1 })
      .eq("id", claimTarget.id);
    setClaimTarget(null);
    loadListings();
  };

  // Landlord-only: mark a room taken, picking from who expressed interest (or manually).
  const handleMarkTaken = async (listing, hunterName, hunterPhone) => {
    await supabase
      .from("listings")
      .update({ status: "taken", hunter_name: hunterName || "", hunter_phone: hunterPhone || "" })
      .eq("id", listing.id);
    loadListings();
  };

  const handleReport = async (listing) => {
    const nextCount = (listing.report_count || 0) + 1;
    await supabase
      .from("listings")
      .update({ report_count: nextCount, hidden_for_review: nextCount >= 3 })
      .eq("id", listing.id);
    loadListings();
  };

  const toggleNearMe = () => {
    if (nearMeOn) {
      setNearMeOn(false);
      return;
    }
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location.");
      return;
    }
    setLocatingMe(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeOn(true);
        setLocatingMe(false);
      },
      () => {
        setLocateError("Could not get your location. Check your browser's location permission.");
        setLocatingMe(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const myListings = listings.filter((l) => l.landlord_phone === profile.phone && profile.phone);

  const vacantListings = useMemo(() => {
    let list = listings
      .filter((l) => l.status === "vacant" && !l.hidden_for_review)
      .filter((l) => !filterLocation || l.location.toLowerCase().includes(filterLocation.toLowerCase()))
      .filter((l) => !filterMaxPrice || Number(l.price) <= Number(filterMaxPrice))
      .filter((l) => filterAmenities.every((a) => (l.amenities || []).includes(a)));

    if (nearMeOn && myCoords) {
      list = list
        .map((l) => ({ l, d: distanceKm(myCoords.lat, myCoords.lng, l.latitude, l.longitude) }))
        .filter((x) => x.d !== null && x.d <= nearMeRadius)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.l);
    }
    return list;
  }, [listings, filterLocation, filterMaxPrice, filterAmenities, nearMeOn, myCoords, nearMeRadius]);

  const distanceFor = (listing) => {
    if (!nearMeOn || !myCoords) return null;
    return distanceKm(myCoords.lat, myCoords.lng, listing.latitude, listing.longitude);
  };

  return (
    <div style={{ background: COLORS.paper, minHeight: "100vh", fontFamily: "sans-serif", color: COLORS.ink }}>
      <div style={{ background: COLORS.blue, padding: "28px 20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
          <Home size={22} />
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            Qwetu Surveys
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
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                placeholder="Filter by area (e.g. Kilimani)"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{ flex: 1, minWidth: 160, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
              <input
                placeholder="Max price"
                type="number"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                style={{ width: 120, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {AMENITIES.map((a) => {
                const Icon = a.icon;
                const active = filterAmenities.includes(a.key);
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleFilterAmenity(a.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 20,
                      cursor: "pointer",
                      border: `1px solid ${active ? COLORS.blue : COLORS.border}`,
                      background: active ? COLORS.blue : "#fff",
                      color: active ? "#fff" : COLORS.ink,
                    }}
                  >
                    <Icon size={12} /> {a.label}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                background: "#EEF3F8",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 16,
              }}
            >
              <button
                onClick={toggleNearMe}
                disabled={locatingMe}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: nearMeOn ? COLORS.blue : "#fff",
                  color: nearMeOn ? "#fff" : COLORS.blue,
                }}
              >
                {locatingMe ? <Loader2 size={13} className="spin" /> : <Navigation size={13} />}
                {locatingMe ? "Finding you…" : nearMeOn ? "Vacancies near me: ON" : "Vacancies near me"}
              </button>
              {nearMeOn ? (
                <select
                  value={nearMeRadius}
                  onChange={(e) => setNearMeRadius(Number(e.target.value))}
                  style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}` }}
                >
                  <option value={1}>within 1 km</option>
                  <option value={3}>within 3 km</option>
                  <option value={5}>within 5 km</option>
                  <option value={10}>within 10 km</option>
                  <option value={25}>within 25 km</option>
                </select>
              ) : (
                <span style={{ fontSize: 12, color: COLORS.gray }}>
                  Uses your device location to sort rooms by distance. Nothing is shared with landlords.
                </span>
              )}
            </div>
            {locateError ? <div style={{ color: COLORS.rust, fontSize: 12, marginBottom: 12 }}>{locateError}</div> : null}

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
                    distance={distanceFor(l)}
                    onReport={handleReport}
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
                        I'm interested
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
                <TextField label="Extra details (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Deposit terms, nearby matatu stage..." />
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600, marginBottom: 6 }}>Amenities</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {AMENITIES.map((a) => {
                    const Icon = a.icon;
                    const active = form.amenities.includes(a.key);
                    return (
                      <button
                        type="button"
                        key={a.key}
                        onClick={() => toggleFormAmenity(a.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "5px 10px",
                          borderRadius: 20,
                          cursor: "pointer",
                          border: `1px solid ${active ? COLORS.blue : COLORS.border}`,
                          background: active ? COLORS.blue : "#fff",
                          color: active ? "#fff" : COLORS.ink,
                        }}
                      >
                        <Icon size={12} /> {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600, marginBottom: 6 }}>Photos (up to 5)</div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: `1px dashed ${COLORS.blue}`,
                    color: COLORS.blue,
                    cursor: "pointer",
                  }}
                >
                  {uploadingPhotos ? <Loader2 size={13} className="spin" /> : <Camera size={13} />}
                  {uploadingPhotos ? "Uploading…" : "Add photos"}
                  <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: "none" }} disabled={uploadingPhotos} />
                </label>
                {form.photos.length > 0 ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {form.photos.map((p) => (
                      <div key={p} style={{ position: "relative" }}>
                        <img src={p} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
                        <button
                          type="button"
                          onClick={() => removeFormPhoto(p)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: COLORS.rust,
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            cursor: "pointer",
                            fontSize: 11,
                            lineHeight: "18px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={useMyLocationForForm}
                  disabled={locatingForm}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: `1px solid ${COLORS.blue}`,
                    background: form.latitude ? COLORS.greenBg : "#fff",
                    color: form.latitude ? COLORS.green : COLORS.blue,
                    cursor: "pointer",
                  }}
                >
                  {locatingForm ? <Loader2 size={13} className="spin" /> : <Navigation size={13} />}
                  {form.latitude ? "Location pinned ✓" : "Use my current location"}
                </button>
                <span style={{ fontSize: 11, color: COLORS.gray }}>
                  Lets hunters find this room with "Vacancies near me". Pin from inside the building for best accuracy.
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 16,
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
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                        ) : (
                          <button
                            onClick={() => openMarkTaken(l)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: COLORS.green,
                              border: "none",
                              color: "#fff",
                              borderRadius: 6,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Check size={12} /> Mark taken
                          </button>
                        )}
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
              <div style={{ fontWeight: 800, fontSize: 15 }}>Express interest</div>
              <button onClick={() => setClaimTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 14 }}>
              {claimTarget.building_name} — {claimTarget.room_label}. This doesn't reserve the room automatically —
              your details go to the landlord, and they'll confirm with you directly (call or WhatsApp them too for
              the fastest response).
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
              <Check size={14} /> Send interest
            </button>
          </div>
        </div>
      ) : null}

      {markTakenTarget ? (
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
          onClick={() => setMarkTakenTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.card, borderRadius: 10, padding: 20, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Mark this room taken</div>
              <button onClick={() => setMarkTakenTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 14 }}>
              {markTakenTarget.building_name} — {markTakenTarget.room_label}. Only you can do this — it's how we stop
              one accidental tap from hiding a room from everyone else.
            </div>

            {(interestsByListing[markTakenTarget.id] || []).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink, display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={13} /> People who showed interest
                </div>
                {(interestsByListing[markTakenTarget.id] || []).map((i) => (
                  <button
                    key={i.id}
                    onClick={async () => {
                      await handleMarkTaken(markTakenTarget, i.hunter_name, i.hunter_phone);
                      setMarkTakenTarget(null);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 6,
                      padding: "8px 10px",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                    }}
                  >
                    <span>
                      {i.hunter_name} <span style={{ color: COLORS.gray, fontSize: 11 }}>({i.hunter_phone})</span>
                    </span>
                    <span style={{ color: COLORS.green, fontWeight: 700, fontSize: 12 }}>Select</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14 }}>
                No one has expressed interest through the site yet — that's fine, you can still mark it taken below.
              </div>
            )}

            <button
              onClick={async () => {
                await handleMarkTaken(markTakenTarget, "", "");
                setMarkTakenTarget(null);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${COLORS.blue}`,
                color: COLORS.blue,
                borderRadius: 6,
                padding: "9px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Mark taken without picking someone
            </button>
          </div>
        </div>
      ) : null}

      <style>{`
        .spin { animation: qwetu-spin 1s linear infinite; }
        @keyframes qwetu-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
