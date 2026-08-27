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
  Star,
  Share2,
  Sparkles,
  Heart,
  QrCode,
  ShieldAlert,
  Download,
  LogIn,
  LogOut,
  Mail,
  Lock,
  MapPinned,
  Bot,
  Send,
  SlidersHorizontal,
  CalendarClock,
  Clock,
  Eye,
  Bell,
  Truck,
  Zap,
  Video,
  Scale,
} from "lucide-react";
import QRCode from "qrcode";
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
const AVATAR_BUCKET = "avatars";
const FAVORITES_KEY = "jjk_favorites_v1";
const LANG_KEY = "jjk_lang_v1";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

const STRINGS = {
  en: {
    tagline: "Rooms, houses & warehouses, straight from the landlord. No middlemen, no fake numbers.",
    hunting: "I'm house hunting",
    renting: "I'm renting out",
    filterArea: "Filter by area (e.g. Kilimani)",
    maxPrice: "Max price",
    saved: "Saved",
    nearMeOn: "Vacancies near me: ON",
    nearMe: "Vacancies near me",
    findingYou: "Finding you…",
    nearMeHint: "Uses your device location to sort rooms by distance. Nothing is shared with landlords.",
    noVacant: "No vacant rooms match right now. Check back later, or widen your filters.",
    interested: "I'm interested",
    postRoom: "Post a vacant room",
    yourListings: "Your listings",
    signIn: "Sign in",
    signUp: "Create account",
    email: "Email",
    password: "Password",
    needAccount: "Need an account? Sign up",
    haveAccount: "Already have an account? Sign in",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    loginIntro: "Sign in to post rooms and manage your listings — each landlord only sees their own.",
    checkEmail: "Check your email to confirm your account, then sign in.",
    footerDisclaimer:
      "Only pay any money after you've personally met the landlord and viewed the room in person. Qwetu Surveys does not collect payments and is not responsible for any transaction made outside the platform.",
    footerCopyright: "All rights reserved.",
  },
  sw: {
    tagline: "Vyumba, nyumba na maghala, moja kwa moja kutoka kwa mwenye nyumba. Hakuna madalali, hakuna namba za uongo.",
    hunting: "Ninatafuta nyumba",
    renting: "Ninaweka nyumba kwa kupangisha",
    filterArea: "Chuja kwa eneo (mf. Kilimani)",
    maxPrice: "Bei ya juu",
    saved: "Zilizohifadhiwa",
    nearMeOn: "Nyumba karibu nami: INAFANYA KAZI",
    nearMe: "Nyumba karibu nami",
    findingYou: "Tunakutafuta…",
    nearMeHint: "Inatumia mahali ulipo kupanga vyumba kwa umbali. Hakuna taarifa inayoshirikiwa na wenye nyumba.",
    noVacant: "Hakuna vyumba wazi kwa sasa. Rudi baadaye, au panua vichujio vyako.",
    interested: "Nina nia",
    postRoom: "Weka chumba wazi",
    yourListings: "Nyumba zako",
    signIn: "Ingia",
    signUp: "Fungua akaunti",
    email: "Barua pepe",
    password: "Nywila",
    needAccount: "Huna akaunti? Fungua akaunti",
    haveAccount: "Una akaunti tayari? Ingia",
    signOut: "Toka",
    signedInAs: "Umeingia kama",
    loginIntro: "Ingia ili kuweka vyumba na kusimamia nyumba zako — kila mwenye nyumba anaona zake tu.",
    checkEmail: "Angalia barua pepe yako kuthibitisha akaunti, kisha ingia.",
    footerDisclaimer:
      "Lipa pesa tu baada ya kukutana na mwenye nyumba mwenyewe na kuona chumba. Qwetu Surveys haikusanyi malipo na haiwajibiki kwa muamala wowote unaofanyika nje ya jukwaa hili.",
    footerCopyright: "Haki zote zimehifadhiwa.",
  },
};

const AMENITIES = [
  { key: "water", label: "Reliable water", icon: Droplet },
  { key: "balcony", label: "Balcony", icon: Wind },
  { key: "parking", label: "Parking", icon: Car },
  { key: "wifi", label: "Wifi ready", icon: Wifi },
  { key: "furnished", label: "Furnished", icon: Sofa },
  { key: "security", label: "Gated / security", icon: ShieldCheck },
  { key: "loading_dock", label: "Loading dock", icon: Truck },
  { key: "three_phase", label: "Three-phase power", icon: Zap },
  { key: "cctv", label: "CCTV", icon: Video },
];

const CATEGORIES = [
  { key: "room", label: "Room" },
  { key: "house", label: "House for lease" },
  { key: "warehouse", label: "Warehouse" },
];

const ROOM_TYPES = [
  { key: "bedsitter", label: "Bedsitter", matches: ["bedsitter", "bed sitter", "studio"] },
  { key: "single", label: "Single room", matches: ["single room", "single", "shared"] },
  { key: "1br", label: "1 bedroom", matches: ["one bedroom", "1 bedroom", "1br", "1 br"] },
  { key: "2br", label: "2 bedroom", matches: ["two bedroom", "2 bedroom", "2br", "2 br"] },
  { key: "3br", label: "3+ bedroom", matches: ["three bedroom", "3 bedroom", "3br", "3 br", "four bedroom", "4 bedroom"] },
  { key: "other", label: "Other", matches: [] },
];

const HOUSE_TYPES = [
  { key: "bungalow", label: "Bungalow", matches: ["bungalow"] },
  { key: "maisonette", label: "Maisonette", matches: ["maisonette"] },
  { key: "townhouse", label: "Townhouse", matches: ["townhouse", "town house"] },
  { key: "flat_house", label: "Apartment / flat", matches: ["apartment", "flat"] },
  { key: "villa", label: "Villa", matches: ["villa"] },
  { key: "other_house", label: "Other house", matches: [] },
];

const WAREHOUSE_TYPES = [
  { key: "warehouse", label: "Warehouse", matches: ["warehouse"] },
  { key: "godown", label: "Godown", matches: ["godown"] },
  { key: "industrial", label: "Industrial unit", matches: ["industrial", "factory"] },
  { key: "storage", label: "Storage space", matches: ["storage", "store"] },
  { key: "other_warehouse", label: "Other warehouse", matches: [] },
];

const TYPES_BY_CATEGORY = {
  room: ROOM_TYPES,
  house: HOUSE_TYPES,
  warehouse: WAREHOUSE_TYPES,
};

const ALL_TYPES = [...ROOM_TYPES, ...HOUSE_TYPES, ...WAREHOUSE_TYPES];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function minutesAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

function timeUntil(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "happening now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hr${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

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

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return digits;
}

function whatsappLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? "254" + digits.slice(1) : digits.startsWith("254") ? digits : "254" + digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function mapsLink(listing) {
  if (listing.latitude && listing.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.building_name}, ${listing.location}`)}`;
}

// Shared filtering logic — used by the manual filter controls AND the
// search assistant, so both always agree on what "matches" means and
// always read live from the same `listings` data fed by landlords.
function filterListings(listings, criteria = {}) {
  const { location, maxPrice, amenities = [], roomType, category, favoritesOnly, favorites = [], near, coords, radius = 5 } = criteria;
  let list = listings
    .filter((l) => l.status === "vacant" && !l.hidden_for_review)
    .filter((l) => !location || l.location.toLowerCase().includes(location.toLowerCase()))
    .filter((l) => !maxPrice || Number(l.price) <= Number(maxPrice))
    .filter((l) => amenities.every((a) => (l.amenities || []).includes(a)))
    .filter((l) => !roomType || l.room_type === roomType)
    .filter((l) => !category || category === "all" || (l.category || "room") === category)
    .filter((l) => !favoritesOnly || favorites.includes(l.id));

  if (near && coords) {
    list = list
      .map((l) => ({ l, d: distanceKm(coords.lat, coords.lng, l.latitude, l.longitude) }))
      .filter((x) => x.d !== null && x.d <= radius)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.l);
  }
  return list;
}

function SearchAssistant({ open, onClose, listings, favorites, onApply }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Tell me what you're looking for — for example \"bedsitter in Kilimani under 15k with water\" — or tap the location button below to find rooms near you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [locating, setLocating] = useState(false);
  const bottomRef = React.useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const parse = (text) => {
    const lower = text.toLowerCase();
    const criteria = {};

    const kMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
    const plainMatch = lower.match(/\b(\d{4,6})\b/);
    if (kMatch) criteria.maxPrice = Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1000);
    else if (plainMatch) criteria.maxPrice = Number(plainMatch[1]);

    if (/warehouse|godown|industrial|storage space/.test(lower)) {
      criteria.category = "warehouse";
    } else if (/\bhouse\b|bungalow|maisonette|townhouse|villa|lease/.test(lower)) {
      criteria.category = "house";
    } else if (/\broom\b|bedsitter/.test(lower)) {
      criteria.category = "room";
    }

    for (const rt of ALL_TYPES) {
      if (rt.matches.some((m) => lower.includes(m))) {
        criteria.roomType = rt.key;
        break;
      }
    }

    const foundAmenities = AMENITIES.filter((a) => lower.includes(a.key) || lower.includes(a.label.toLowerCase())).map((a) => a.key);
    if (foundAmenities.length) criteria.amenities = foundAmenities;

    const knownLocations = [...new Set(listings.map((l) => l.location).filter(Boolean))];
    for (const loc of knownLocations) {
      const words = loc.toLowerCase().split(/[,\s]+/).filter((w) => w.length > 2);
      if (words.some((w) => lower.includes(w))) {
        criteria.location = loc;
        break;
      }
    }

    return criteria;
  };

  const summarize = (results) => {
    if (results.length === 0) {
      return "I couldn't find any vacant rooms matching that right now — try a different area, a higher budget, or fewer filters.";
    }
    const top = results
      .slice(0, 3)
      .map((l) => `• ${l.building_name} (${l.location}) — KES ${Number(l.price).toLocaleString()}/mo`)
      .join("\n");
    const more = results.length > 3 ? `\n…and ${results.length - 3} more below.` : "";
    return `Found ${results.length} room${results.length === 1 ? "" : "s"} matching that:\n${top}${more}`;
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const criteria = parse(text);
      const results = filterListings(listings, { ...criteria, favorites });
      onApply(criteria);
      setMessages((m) => [...m, { role: "assistant", text: summarize(results) }]);
      setThinking(false);
    }, 400);
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setMessages((m) => [...m, { role: "assistant", text: "Your browser doesn't support location — try typing an area instead." }]);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocating(false);
        const results = filterListings(listings, { near: true, coords, radius: 5, favorites });
        onApply({ near: true, coords, radius: 5 });
        const reply =
          results.length > 0
            ? `Found ${results.length} room${results.length === 1 ? "" : "s"} within 5 km of you. Closest: ${results[0].building_name} — KES ${Number(results[0].price).toLocaleString()}/mo.`
            : "No vacant rooms within 5 km right now — try widening the search below or type an area instead.";
        setMessages((m) => [...m, { role: "user", text: "📍 Find rooms near me" }, { role: "assistant", text: reply }]);
      },
      () => {
        setLocating(false);
        setMessages((m) => [...m, { role: "assistant", text: "Couldn't get your location — check your browser's location permission and try again." }]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        left: 0,
        maxWidth: 380,
        margin: "0 auto",
        background: COLORS.card,
        borderRadius: "12px 12px 0 0",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.18)",
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        maxHeight: "72vh",
      }}
    >
      <div
        style={{
          background: COLORS.blue,
          color: "#fff",
          padding: "12px 14px",
          borderRadius: "12px 12px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14 }}>
          <Bot size={16} /> Room Finder Assistant
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? COLORS.blue : "#F0F0EC",
              color: m.role === "user" ? "#fff" : COLORS.ink,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 13,
              maxWidth: "85%",
              whiteSpace: "pre-line",
              lineHeight: 1.5,
            }}
          >
            {m.text}
          </div>
        ))}
        {thinking ? (
          <div style={{ alignSelf: "flex-start", color: COLORS.gray }}>
            <Dots />
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={useLocation}
          disabled={locating}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            background: COLORS.greenBg,
            border: `1px solid ${COLORS.green}`,
            color: COLORS.green,
            borderRadius: 6,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          {locating ? <Dots /> : <Navigation size={13} />}
          {locating ? "" : "Find rooms near me"}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type what you're looking for…"
            style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
          />
          <button
            onClick={send}
            style={{
              background: COLORS.blue,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Splash({ onDone }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: COLORS.blue,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: COLORS.mustard,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <Home size={32} color={COLORS.blueDark} />
      </div>
      <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase" }}>
        Qwetu Surveys
      </div>
      <div style={{ color: "#CFE0F0", fontSize: 14, marginTop: 8, maxWidth: 280 }}>
        Rooms, houses & warehouses, straight from the landlord. No middlemen, no fake numbers.
      </div>
      <button
        onClick={onDone}
        style={{
          marginTop: 28,
          background: COLORS.mustard,
          color: COLORS.blueDark,
          border: "none",
          borderRadius: 8,
          padding: "11px 28px",
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Enter
      </button>
    </div>
  );
}

function QRModal({ listing, onClose }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [error, setError] = useState("");
  const link = `${window.location.origin}${window.location.pathname}?listing=${listing.id}`;

  useEffect(() => {
    QRCode.toDataURL(link, { width: 320, margin: 2, color: { dark: COLORS.blueDark, light: "#FFFFFF" } })
      .then(setDataUrl)
      .catch(() => setError("Could not generate the QR code."));
  }, [link]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `to-let-${listing.building_name.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,20,20,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.card, borderRadius: 10, padding: 22, width: "100%", maxWidth: 360, textAlign: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Printable TO-LET sign</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 16 }}>
          Print this and paste it at the gate. Anyone who scans it opens this exact listing.
        </div>
        {error ? (
          <div style={{ color: COLORS.rust, fontSize: 12 }}>{error}</div>
        ) : dataUrl ? (
          <img src={dataUrl} alt="QR code" style={{ width: 200, height: 200, margin: "0 auto", borderRadius: 6 }} />
        ) : (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.gray, fontSize: 12 }}>
            Generating…
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 13, marginTop: 12 }}>{listing.building_name}</div>
        <div style={{ fontSize: 11, color: COLORS.gray }}>{listing.room_label} · KES {Number(listing.price).toLocaleString()}/mo</div>
        <button
          onClick={download}
          disabled={!dataUrl}
          style={{
            marginTop: 16,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: COLORS.blue,
            border: "none",
            color: "#fff",
            borderRadius: 6,
            padding: "9px 0",
            fontSize: 13,
            fontWeight: 700,
            cursor: dataUrl ? "pointer" : "default",
          }}
        >
          <Download size={14} /> Download to print
        </button>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
            display: "inline-block",
            animation: `qwetu-bounce 0.9s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

function LoginForm({ t, onAuthed }) {
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    if (authMode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        onAuthed();
      } else {
        setInfo(t.checkEmail);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      onAuthed();
    }
  };

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
        {authMode === "signup" ? t.signUp : t.signIn}
      </div>
      <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14 }}>{t.loginIntro}</div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>
          {t.email}
          <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px" }}>
            <Mail size={14} color={COLORS.gray} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent" }}
            />
          </div>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>
          {t.password}
          <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px" }}>
            <Lock size={14} color={COLORS.gray} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent" }}
            />
          </div>
        </label>
        {error ? <div style={{ color: COLORS.rust, fontSize: 12 }}>{error}</div> : null}
        {info ? <div style={{ color: COLORS.green, fontSize: 12 }}>{info}</div> : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: COLORS.blue,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 0",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? <Dots /> : <LogIn size={14} />}
          {loading ? "" : authMode === "signup" ? t.signUp : t.signIn}
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode((m) => (m === "signin" ? "signup" : "signin"));
            setError("");
            setInfo("");
          }}
          style={{ background: "none", border: "none", color: COLORS.blue, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          {authMode === "signup" ? t.haveAccount : t.needAccount}
        </button>
      </form>
    </div>
  );
}

function Footer({ t }) {
  return (
    <div style={{ maxWidth: 1180, margin: "24px auto 0", padding: "16px 20px", borderTop: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 11, color: COLORS.gray, lineHeight: 1.6, display: "flex", gap: 6 }}>
        <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{t.footerDisclaimer}</span>
      </div>
      <div style={{ fontSize: 11, color: COLORS.gray, marginTop: 10 }}>
        © {new Date().getFullYear()} Qwetu Surveys. {t.footerCopyright}
      </div>
    </div>
  );
}

function AdminPanel({ onClose, authed, passwordInput, setPasswordInput, adminError, onLogin, listings, loadListings }) {
  const flagged = listings.filter((l) => (l.report_count || 0) > 0);

  const reinstate = async (id) => {
    await supabase.rpc("admin_reinstate_listing", { p_listing_id: id });
    loadListings();
  };

  const removeForGood = async (id) => {
    await supabase.rpc("admin_delete_listing", { p_listing_id: id });
    loadListings();
  };

  if (!authed) {
    return (
      <div style={{ background: COLORS.paper, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: COLORS.card, borderRadius: 10, padding: 24, width: "100%", maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ShieldAlert size={18} color={COLORS.blue} />
            <div style={{ fontWeight: 800, fontSize: 15 }}>Admin review</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14 }}>
            This page lists reported listings so you can review before they're removed for good.
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onLogin()}
            placeholder="Admin password"
            style={{ width: "100%", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 14, marginBottom: 10 }}
          />
          {adminError ? <div style={{ color: COLORS.rust, fontSize: 12, marginBottom: 10 }}>{adminError}</div> : null}
          <button
            onClick={onLogin}
            style={{ width: "100%", background: COLORS.blue, color: "#fff", border: "none", borderRadius: 6, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}
          >
            Enter
          </button>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "none", color: COLORS.gray, border: "none", fontSize: 12, cursor: "pointer" }}
          >
            Back to site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.paper, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ background: COLORS.blue, padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
          <ShieldAlert size={20} />
          <span style={{ fontWeight: 900, fontSize: 16 }}>Admin — Reported listings</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 16 }}>
          Note: this password only hides this page in the browser — it doesn't restrict who can edit the database directly.
          For real protection later, we'd add proper Supabase login (ask me when you're ready).
        </div>
        {flagged.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.gray }}>No reported listings right now.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {flagged.map((l) => (
              <div key={l.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{l.building_name} — {l.room_label}</div>
                <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                  {l.location} · KES {Number(l.price).toLocaleString()}/mo · Landlord: {l.landlord_name} ({l.landlord_phone})
                </div>
                <div style={{ fontSize: 12, color: COLORS.rust, fontWeight: 700, marginTop: 6 }}>
                  Reported {l.report_count} time{l.report_count === 1 ? "" : "s"}
                  {l.hidden_for_review ? " · currently hidden from hunters" : ""}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => reinstate(l.id)}
                    style={{ flex: 1, background: COLORS.green, color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Reinstate (clear reports)
                  </button>
                  <button
                    onClick={() => removeForGood(l.id)}
                    style={{ flex: 1, background: COLORS.rust, color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

function Lightbox({ photos, index, onClose, onNav }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,10,0.92)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", cursor: "pointer" }}
        aria-label="Close"
      >
        <X size={26} />
      </button>
      {photos.length > 1 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNav((index - 1 + photos.length) % photos.length);
          }}
          style={{
            position: "absolute",
            left: 12,
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: 40,
            height: 40,
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          ‹
        </button>
      ) : null}
      <img
        src={photos[index]}
        alt="Room, full view"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "92%", maxHeight: "85vh", borderRadius: 6, objectFit: "contain" }}
      />
      {photos.length > 1 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNav((index + 1) % photos.length);
          }}
          style={{
            position: "absolute",
            right: 12,
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: 40,
            height: 40,
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          ›
        </button>
      ) : null}
      {photos.length > 1 ? (
        <div style={{ position: "absolute", bottom: 20, color: "#fff", fontSize: 12 }}>
          {index + 1} / {photos.length}
        </div>
      ) : null}
    </div>
  );
}

function PhotoStrip({ photos }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  if (!photos || photos.length === 0) {
    return (
      <div
        style={{
          height: 190,
          background: "linear-gradient(135deg, #EFECE3, #E4E1D6)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.gray,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        <Camera size={18} style={{ marginRight: 6 }} /> No photos yet
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12, position: "relative", borderRadius: 10, overflow: "hidden" }}>
      <img
        src={photos[active]}
        alt="Room"
        onClick={() => setLightboxOpen(true)}
        style={{ width: "100%", height: 210, objectFit: "cover", display: "block", cursor: "zoom-in" }}
      />
      {photos.length > 1 ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0) 40%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Camera size={11} /> {active + 1}/{photos.length}
          </div>
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
            {photos.map((p, i) => (
              <button
                key={p + i}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(i);
                }}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  background: i === active ? "#fff" : "rgba(255,255,255,0.3)",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </>
      ) : null}
      {lightboxOpen ? (
        <Lightbox photos={photos} index={active} onClose={() => setLightboxOpen(false)} onNav={setActive} />
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

function ListingCard({ listing, rightAction, rotateSeed, distance, onReport, isFavorite, onToggleFavorite, onShowQR, landlordBio, trackView, isOwnerView, isComparing, onToggleCompare }) {
  const rot = rotateSeed % 2 === 0 ? "-0.6deg" : "0.6deg";
  const isNew = listing.created_at && Date.now() - new Date(listing.created_at).getTime() < 48 * 60 * 60 * 1000;

  useEffect(() => {
    if (!trackView) return;
    const key = `qwetu_viewed_${listing.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment_view_count", { p_listing_id: listing.id }).then(
      () => {},
      () => {}
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackView, listing.id]);

  const shareListing = async () => {
    const shareText = `${listing.building_name} — ${listing.room_label}, KES ${Number(listing.price).toLocaleString()}/month in ${listing.location}. Found on Qwetu Surveys.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.building_name, text: shareText, url: window.location.href });
      } catch (e) {
        // user cancelled share — no action needed
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
    }
  };

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
      {onToggleFavorite ? (
        <button
          onClick={() => onToggleFavorite(listing.id)}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
          aria-label="Save listing"
        >
          <Heart size={14} color={COLORS.rust} fill={isFavorite ? COLORS.rust : "none"} />
        </button>
      ) : null}
      {onToggleCompare ? (
        <button
          onClick={() => onToggleCompare(listing.id)}
          style={{
            position: "absolute",
            top: 14,
            left: onToggleFavorite ? 48 : 14,
            background: isComparing ? COLORS.blue : "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
          aria-label="Add to compare"
        >
          <Scale size={14} color={isComparing ? "#fff" : COLORS.blue} />
        </button>
      ) : null}
      <PhotoStrip photos={listing.photos} />

      <div style={{ paddingRight: 70 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.ink }}>{listing.building_name}</div>
          {isNew ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: 10,
                fontWeight: 800,
                color: COLORS.mustard,
                border: `1px solid ${COLORS.mustard}`,
                borderRadius: 20,
                padding: "1px 6px",
              }}
            >
              <Sparkles size={10} /> NEW
            </span>
          ) : null}
        </div>
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

      {listing.deposit_amount ? (
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>
          Deposit KES {Number(listing.deposit_amount).toLocaleString()} · move in with roughly{" "}
          <span style={{ fontWeight: 800, color: COLORS.ink }}>
            KES {(Number(listing.price) + Number(listing.deposit_amount)).toLocaleString()}
          </span>
        </div>
      ) : null}

      <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 8, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700 }}>{listing.room_label}: </span>
        {listing.description || "No extra details provided."}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {listing.category && listing.category !== "room" ? (
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              background: COLORS.blue,
              borderRadius: 4,
              padding: "2px 6px",
              textTransform: "uppercase",
            }}
          >
            {CATEGORIES.find((c) => c.key === listing.category)?.label}
          </span>
        ) : null}
        {listing.room_type ? (
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 800,
              color: COLORS.blue,
              border: `1px solid ${COLORS.blue}`,
              borderRadius: 4,
              padding: "2px 6px",
              textTransform: "uppercase",
            }}
          >
            {ALL_TYPES.find((r) => r.key === listing.room_type)?.label || listing.room_type}
          </span>
        ) : null}
      </div>

      {listing.category === "house" && (listing.bedrooms || listing.bathrooms) ? (
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>
          {listing.bedrooms ? `${listing.bedrooms} bed` : ""}
          {listing.bedrooms && listing.bathrooms ? " · " : ""}
          {listing.bathrooms ? `${listing.bathrooms} bath` : ""}
        </div>
      ) : null}

      {listing.category === "warehouse" && listing.size_value ? (
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>
          {Number(listing.size_value).toLocaleString()} {listing.size_unit === "sqm" ? "sq m" : "sq ft"}
        </div>
      ) : null}

      {listing.lease_term ? (
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>Lease: {listing.lease_term}</div>
      ) : null}

      <AmenityTags amenities={listing.amenities} />

      {(listing.viewing_slots || []).filter((s) => !s.taken).length > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 5,
            fontSize: 11,
            color: COLORS.blue,
            fontWeight: 600,
            marginTop: 10,
          }}
        >
          <CalendarClock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Viewing available: {listing.viewing_slots.filter((s) => !s.taken).map((s) => s.label).slice(0, 2).join(", ")}
            {listing.viewing_slots.filter((s) => !s.taken).length > 2
              ? ` +${listing.viewing_slots.filter((s) => !s.taken).length - 2} more`
              : ""}
            {(() => {
              const soonest = listing.viewing_slots.filter((s) => !s.taken && s.datetime).sort((a, b) => new Date(a.datetime) - new Date(b.datetime))[0];
              return soonest ? <span style={{ color: COLORS.mustard, fontWeight: 800 }}> · {timeUntil(soonest.datetime)}</span> : null;
            })()}
          </span>
        </div>
      ) : null}

      {landlordBio ? (
        <div
          style={{
            fontSize: 11,
            color: COLORS.gray,
            fontStyle: "italic",
            marginTop: 10,
            paddingTop: 8,
            borderTop: `1px dashed ${COLORS.border}`,
          }}
        >
          "{landlordBio}" — {listing.landlord_name}
        </div>
      ) : null}

      {listing.status === "taken" && listing.hunter_name ? (
        <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 8 }}>Reserved by {listing.hunter_name}</div>
      ) : listing.interested_count > 0 ? (
        <div style={{ fontSize: 12, color: COLORS.mustard, fontWeight: 700, marginTop: 8 }}>
          {listing.interested_count} {listing.interested_count === 1 ? "person is" : "people are"} interested
        </div>
      ) : null}

      {isOwnerView ? (
        <div style={{ fontSize: 11, color: COLORS.gray, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <Eye size={12} /> Viewed {listing.view_count || 0} time{listing.view_count === 1 ? "" : "s"}
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
          <a
            href={mapsLink(listing)}
            target="_blank"
            rel="noreferrer"
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
            <MapPinned size={13} /> Map
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
          <button
            onClick={shareListing}
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
            <Share2 size={11} /> Share
          </button>
          {onShowQR ? (
            <button
              onClick={() => onShowQR(listing)}
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
              <QrCode size={11} /> TO-LET sign
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
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState("hunt");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [qrTarget, setQrTarget] = useState(null);
  const [focusedListing, setFocusedListing] = useState(null);
  const [focusedNotFound, setFocusedNotFound] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [logoTapCount, setLogoTapCount] = useState(0);

  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const user = session?.user || null;

  const [lang, setLang] = useState(localStorage.getItem(LANG_KEY) || "en");
  const t = STRINGS[lang];

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showGenericHint, setShowGenericHint] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || "");

  const [profile, setProfile] = useState({ name: "", phone: "" });

  const emptyRoom = () => ({
    category: "room",
    roomLabel: "",
    roomType: "",
    price: "",
    depositAmount: "",
    description: "",
    amenities: [],
    photos: [],
    bedrooms: "",
    bathrooms: "",
    sizeValue: "",
    sizeUnit: "sqft",
    leaseTerm: "",
  });

  const [buildingInfo, setBuildingInfo] = useState({
    buildingName: "",
    location: "",
    latitude: null,
    longitude: null,
  });
  const [rooms, setRooms] = useState([emptyRoom()]);
  const [locatingForm, setLocatingForm] = useState(false);

  const [claimTarget, setClaimTarget] = useState(null);
  const [claimForm, setClaimForm] = useState({ name: "", phone: "", slotId: "" });
  const [claimError, setClaimError] = useState("");
  const [viewingConfirmation, setViewingConfirmation] = useState(null);

  const [interestsByListing, setInterestsByListing] = useState({});
  const [markTakenTarget, setMarkTakenTarget] = useState(null);

  const [slotManagerTarget, setSlotManagerTarget] = useState(null);
  const [newSlotDateTime, setNewSlotDateTime] = useState("");
  const [slotSaving, setSlotSaving] = useState(false);

  const [filterLocation, setFilterLocation] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterAmenities, setFilterAmenities] = useState([]);
  const [filterRoomType, setFilterRoomType] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [assistantOpen, setAssistantOpen] = useState(false);

  const [landlordBio, setLandlordBio] = useState("");
  const [landlordBioSaved, setLandlordBioSaved] = useState(false);
  const [landlordBios, setLandlordBios] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [interestNotifications, setInterestNotifications] = useState([]);

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

      const ids = [...new Set((data || []).map((l) => l.landlord_id).filter(Boolean))];
      if (ids.length > 0) {
        const { data: bios } = await supabase.from("landlord_profiles").select("id, bio").in("id", ids);
        const map = {};
        (bios || []).forEach((b) => {
          if (b.bio) map[b.id] = b.bio;
        });
        setLandlordBios(map);
      }
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

    const savedFavs = localStorage.getItem(FAVORITES_KEY);
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        // ignore corrupt local favorites
      }
    }

    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listing");
    if (listingId) {
      setShowSplash(false);
      supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single()
        .then(({ data }) => {
          if (data) setFocusedListing(data);
          else setFocusedNotFound(true);
        });
    }
    if (params.get("admin")) {
      setAdminOpen(true);
      setShowSplash(false);
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

  // Keep a live snapshot of listings for the notification listener below,
  // without needing to resubscribe its realtime channel every time
  // listings change.
  const listingsRef = React.useRef(listings);
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  // Load interests from the last hour on sign-in, so the notification
  // list survives page refreshes — not just live pushes while watching.
  useEffect(() => {
    if (!user) {
      setInterestNotifications([]);
      return;
    }
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    supabase
      .from("interests")
      .select("id, hunter_name, created_at, listings!inner(building_name, room_label, landlord_id)")
      .eq("listings.landlord_id", user.id)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setInterestNotifications(
          (data || []).map((row) => ({
            id: row.id,
            hunterName: row.hunter_name,
            roomLabel: row.listings.room_label,
            buildingName: row.listings.building_name,
            createdAt: row.created_at,
          }))
        );
      });
  }, [user]);

  // Push new ones the moment they happen, and quietly drop any that have
  // aged past an hour so the list doesn't grow forever.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`interest-alerts-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "interests" }, (payload) => {
        const row = payload.new;
        const listing = listingsRef.current.find((l) => l.id === row.listing_id);
        if (listing && listing.landlord_id === user.id) {
          setInterestNotifications((prev) => [
            {
              id: row.id,
              hunterName: row.hunter_name,
              roomLabel: listing.room_label,
              buildingName: listing.building_name,
              createdAt: row.created_at,
            },
            ...prev,
          ]);
        }
      })
      .subscribe();

    const expiryTimer = setInterval(() => {
      const cutoff = Date.now() - 60 * 60 * 1000;
      setInterestNotifications((prev) => prev.filter((n) => new Date(n.createdAt).getTime() > cutoff));
    }, 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(expiryTimer);
    };
  }, [user]);

  // Capture the browser's "Add to Home Screen" prompt so we can trigger
  // it from our own button instead of relying on the browser's menu.
  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);

    // main.jsx grabs this the instant it fires, in case it arrives before
    // this component even mounts — pick it up here if so.
    if (window.__qwetuInstallPrompt) {
      setInstallPrompt(window.__qwetuInstallPrompt);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.__qwetuInstallPrompt = e;
      setInstallPrompt(e);
    };
    const handleInstalled = () => {
      window.__qwetuInstallPrompt = null;
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      window.__qwetuInstallPrompt = null;
      setInstallPrompt(null);
      return;
    }
    if (isIOS) {
      setShowIOSHint(true);
    } else {
      setShowGenericHint(true);
    }
  };

  // Auth session — keeps landlords signed in across visits, and separates
  // each landlord's listings properly (fixes name/phone collisions).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // One-time migration helper: when a landlord signs in, adopt any older
  // listings that were posted (pre-login) with a matching phone number.
  useEffect(() => {
    if (user && profile.phone) {
      supabase.rpc("claim_my_listings", { my_phone: profile.phone }).then(() => loadListings());
    }
  }, [user, profile.phone, loadListings]);

  // Load this landlord's own profile (name, phone, bio, photo) when they
  // sign in — stored on their account, so it's remembered without asking again.
  useEffect(() => {
    if (user) {
      supabase
        .from("landlord_profiles")
        .select("name, phone, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setLandlordBio(data?.bio || "");
          setAvatarUrl(data?.avatar_url || "");
          if (data?.name && data?.phone) {
            setProfile({ name: data.name, phone: data.phone });
            setEditingProfile(false);
          } else {
            setEditingProfile(true);
          }
        });
    } else {
      setLandlordBio("");
      setAvatarUrl("");
    }
  }, [user]);

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = `${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true });
    if (uploadError) {
      setError("Could not upload photo. Make sure the 'avatars' storage bucket exists and is public.");
      setUploadingAvatar(false);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = publicUrlData?.publicUrl || "";
    setAvatarUrl(url);
    await supabase.from("landlord_profiles").upsert({ id: user.id, avatar_url: url, updated_at: new Date().toISOString() });
    setUploadingAvatar(false);
    loadListings();
  };

  const saveLandlordProfile = async () => {
    if (!user) return;
    if (!profile.name.trim() || !profile.phone.trim()) {
      setError("Enter your name and phone number.");
      return;
    }
    await supabase.from("landlord_profiles").upsert({
      id: user.id,
      name: profile.name,
      phone: profile.phone,
      bio: landlordBio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setEditingProfile(false);
    setLandlordBioSaved(true);
    setTimeout(() => setLandlordBioSaved(false), 2000);
    loadListings();
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const changeLang = (next) => {
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
  };

  const clearFocusedListing = () => {
    setFocusedListing(null);
    setFocusedNotFound(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("listing");
    window.history.replaceState({}, "", url);
  };

  const updateProfile = (next) => {
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  };

  const updateRoom = (index, patch) => {
    setRooms((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const toggleRoomAmenity = (index, key) => {
    setRooms((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, amenities: r.amenities.includes(key) ? r.amenities.filter((k) => k !== key) : [...r.amenities, key] }
          : r
      )
    );
  };

  const addRoom = () => setRooms((prev) => [...prev, emptyRoom()]);

  const removeRoom = (index) => setRooms((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const toggleFilterAmenity = (key) => {
    setFilterAmenities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handlePhotoSelect = async (index, e) => {
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
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, photos: [...r.photos, ...uploadedUrls].slice(0, 5) } : r))
    );
    setUploadingPhotos(false);
  };

  const removeRoomPhoto = (index, url) => {
    setRooms((prev) => prev.map((r, i) => (i === index ? { ...r, photos: r.photos.filter((p) => p !== url) } : r)));
  };

  const useMyLocationForForm = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location. You can still post without it.");
      return;
    }
    setLocatingForm(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuildingInfo((b) => ({ ...b, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
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
    if (!user) {
      setError("Sign in first — only your own account can post and manage rooms.");
      return;
    }
    if (!profile.name || !profile.phone) {
      setError("Enter your name and phone number above before posting.");
      return;
    }
    if (!buildingInfo.buildingName || !buildingInfo.location) {
      setError("Fill in the building name and location.");
      return;
    }
    const incomplete = rooms.some((r) => !r.roomLabel || !r.price);
    if (incomplete) {
      setError("Every room needs at least a room label and a price.");
      return;
    }
    setSaving(true);
    const rows = rooms.map((r) => ({
      building_name: buildingInfo.buildingName,
      location: buildingInfo.location,
      category: r.category || "room",
      room_label: r.roomLabel,
      room_type: r.roomType || null,
      price: r.price,
      deposit_amount: r.depositAmount || null,
      description: r.description,
      landlord_name: profile.name,
      landlord_phone: profile.phone,
      landlord_id: user.id,
      status: "vacant",
      amenities: r.amenities,
      photos: r.photos,
      latitude: buildingInfo.latitude,
      longitude: buildingInfo.longitude,
      bedrooms: r.bedrooms || null,
      bathrooms: r.bathrooms || null,
      size_value: r.sizeValue || null,
      size_unit: r.sizeValue ? r.sizeUnit : null,
      lease_term: r.leaseTerm || null,
    }));
    const { error: insertError } = await supabase.from("listings").insert(rows);
    setSaving(false);
    if (insertError) {
      setError("Could not post the room(s). Try again.");
      return;
    }
    setBuildingInfo({ buildingName: "", location: "", latitude: null, longitude: null });
    setRooms([emptyRoom()]);
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

  const openSlotManager = (listing) => {
    setSlotManagerTarget(listing);
    setNewSlotDateTime("");
  };

  const addSlot = async () => {
    if (!newSlotDateTime || !slotManagerTarget) return;
    setSlotSaving(true);
    const dt = new Date(newSlotDateTime);
    const label = dt.toLocaleString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    const nextSlots = [
      ...(slotManagerTarget.viewing_slots || []),
      { id: uid(), label, datetime: dt.toISOString(), taken: false },
    ];
    const { error: slotErr } = await supabase.from("listings").update({ viewing_slots: nextSlots }).eq("id", slotManagerTarget.id);
    setSlotSaving(false);
    if (!slotErr) {
      setSlotManagerTarget({ ...slotManagerTarget, viewing_slots: nextSlots });
      setNewSlotDateTime("");
      loadListings();
    }
  };

  const removeSlot = async (slotId) => {
    if (!slotManagerTarget) return;
    const nextSlots = (slotManagerTarget.viewing_slots || []).filter((s) => s.id !== slotId);
    const { error: slotErr } = await supabase.from("listings").update({ viewing_slots: nextSlots }).eq("id", slotManagerTarget.id);
    if (!slotErr) {
      setSlotManagerTarget({ ...slotManagerTarget, viewing_slots: nextSlots });
      loadListings();
    }
  };

  const openClaim = (listing) => {
    setClaimTarget(listing);
    setClaimForm({ name: "", phone: "", slotId: "" });
    setClaimError("");
  };

  // Hunters no longer mark a room taken directly — they register interest.
  // Only the landlord (in "Your listings") can mark a room as taken.
  const confirmClaim = async () => {
    if (!claimForm.name.trim() || !claimForm.phone.trim()) {
      setClaimError("Enter your name and phone number so the landlord can reach you.");
      return;
    }
    const chosenSlot = (claimTarget.viewing_slots || []).find((s) => s.id === claimForm.slotId);
    const { error: interestErr } = await supabase.rpc("register_interest", {
      p_listing_id: claimTarget.id,
      p_hunter_name: claimForm.name,
      p_hunter_phone: claimForm.phone,
      p_slot_id: chosenSlot ? chosenSlot.id : null,
      p_slot_label: chosenSlot ? chosenSlot.label : null,
    });
    if (interestErr) {
      setClaimError("Could not send your interest. Try again.");
      return;
    }

    // Text the landlord too, in case they're not actively checking the site.
    // Also confirms the hunter's own viewing time back to them, if they
    // picked one — their only real reminder, since we have no account to
    // notify them through later. Fire-and-forget either way.
    fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: claimTarget.id,
        hunterName: claimForm.name,
        hunterPhone: claimForm.phone,
        slotLabel: chosenSlot ? chosenSlot.label : null,
      }),
    }).catch(() => {});

    // Also email the landlord — free, unlike SMS, since it just uses
    // their existing account email.
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: claimTarget.id, hunterName: claimForm.name }),
    }).catch(() => {});

    if (chosenSlot) {
      setViewingConfirmation({ label: chosenSlot.label, datetime: chosenSlot.datetime, buildingName: claimTarget.building_name });
      setTimeout(() => setViewingConfirmation(null), 15000);
    }

    setClaimTarget(null);
    loadListings();
    setFeedbackRating(0);
    setShowFeedback(true);
  };

  const submitFeedback = async () => {
    if (feedbackRating === 0) {
      setShowFeedback(false);
      return;
    }
    setFeedbackSubmitting(true);
    await supabase.from("site_feedback").insert({ rating: feedbackRating });
    setFeedbackSubmitting(false);
    setShowFeedback(false);
  };

  // Landlord-only: mark a room taken, picking from who expressed interest (or manually).
  // Works via direct table update because RLS now checks landlord_id = auth.uid().
  const handleMarkTaken = async (listing, hunterName, hunterPhone) => {
    await supabase
      .from("listings")
      .update({ status: "taken", hunter_name: hunterName || "", hunter_phone: hunterPhone || "" })
      .eq("id", listing.id);
    loadListings();
  };

  const handleReport = async (listing) => {
    await supabase.rpc("report_listing", { p_listing_id: listing.id });
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

  const myListings = listings.filter((l) => user && l.landlord_id === user.id);

  const applyAssistantCriteria = (criteria) => {
    if (criteria.location) setFilterLocation(criteria.location);
    if (criteria.maxPrice) setFilterMaxPrice(String(criteria.maxPrice));
    if (criteria.amenities) setFilterAmenities(criteria.amenities);
    if (criteria.roomType) setFilterRoomType(criteria.roomType);
    if (criteria.category) setFilterCategory(criteria.category);
    if (criteria.near) {
      setNearMeOn(true);
      setMyCoords(criteria.coords);
      setNearMeRadius(criteria.radius || 5);
    }
    setMode("hunt");
  };

  const vacantListings = useMemo(() => {
    let list = filterListings(listings, {
      location: filterLocation,
      maxPrice: filterMaxPrice,
      amenities: filterAmenities,
      roomType: filterRoomType,
      category: filterCategory,
      favoritesOnly: showFavoritesOnly,
      favorites,
      near: nearMeOn,
      coords: myCoords,
      radius: nearMeRadius,
    });

    if (!(nearMeOn && myCoords)) {
      if (sortOrder === "oldest") {
        list = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else if (sortOrder === "price_low") {
        list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortOrder === "price_high") {
        list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
      } else {
        list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    }
    return list;
  }, [
    listings,
    filterLocation,
    filterMaxPrice,
    filterAmenities,
    filterRoomType,
    filterCategory,
    nearMeOn,
    myCoords,
    nearMeRadius,
    showFavoritesOnly,
    favorites,
    sortOrder,
  ]);

  const distanceFor = (listing) => {
    if (!nearMeOn || !myCoords) return null;
    return distanceKm(myCoords.lat, myCoords.lng, listing.latitude, listing.longitude);
  };

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />;
  }

  if (adminOpen) {
    return (
      <AdminPanel
        onClose={() => setAdminOpen(false)}
        authed={adminAuthed}
        passwordInput={adminPasswordInput}
        setPasswordInput={setAdminPasswordInput}
        adminError={adminError}
        onLogin={() => {
          if (ADMIN_PASSWORD && adminPasswordInput === ADMIN_PASSWORD) {
            setAdminAuthed(true);
            setAdminError("");
          } else {
            setAdminError(
              ADMIN_PASSWORD
                ? "Wrong password."
                : "No admin password is set. Add VITE_ADMIN_PASSWORD to your .env / Vercel environment variables."
            );
          }
        }}
        listings={listings}
        loadListings={loadListings}
      />
    );
  }

  if (focusedListing || focusedNotFound) {
    return (
      <div style={{ background: COLORS.paper, minHeight: "100vh", fontFamily: "sans-serif", color: COLORS.ink }}>
        <div style={{ background: COLORS.blue, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
            <Home size={20} />
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              Qwetu Surveys
            </span>
          </div>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
          <button
            onClick={clearFocusedListing}
            style={{
              background: "none",
              border: "none",
              color: COLORS.blue,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              marginBottom: 16,
              padding: 0,
            }}
          >
            ← Browse all listings
          </button>
          {focusedNotFound ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.gray }}>
              This listing isn't available anymore — it may have been taken or removed.
            </div>
          ) : (
            <ListingCard
              listing={focusedListing}
              rotateSeed={0}
              onShowQR={setQrTarget}
              trackView
              rightAction={
                focusedListing.status === "vacant" ? (
                  <button
                    onClick={() => {
                      clearFocusedListing();
                      setShowSplash(false);
                      openClaim(focusedListing);
                    }}
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
                    {t.interested}
                  </button>
                ) : null
              }
            />
          )}
        </div>
        <Footer t={t} />
        {qrTarget ? <QRModal listing={qrTarget} onClose={() => setQrTarget(null)} /> : null}
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.paper, minHeight: "100vh", fontFamily: "sans-serif", color: COLORS.ink }}>
      <div style={{ background: COLORS.blue, padding: "28px 20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", cursor: "default", userSelect: "none" }}
            onClick={() => {
              const next = logoTapCount + 1;
              setLogoTapCount(next);
              if (next >= 5) {
                setAdminOpen(true);
                setLogoTapCount(0);
              }
            }}
          >
            <Home size={22} />
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              Qwetu Surveys
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {user ? (
              <button
                onClick={() => setMode("landlord")}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: avatarUrl ? `url(${avatarUrl})` : COLORS.mustard,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: COLORS.blueDark,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  flexShrink: 0,
                  padding: 0,
                }}
                aria-label="Your account"
              >
                {!avatarUrl ? (profile.name || user.email || "?").trim().charAt(0).toUpperCase() : null}
              </button>
            ) : null}
            {!isStandalone ? (
              isIOS ? (
                <button
                  onClick={() => setShowIOSHint(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    background: COLORS.mustard,
                    color: COLORS.blueDark,
                  }}
                  aria-label="Add to Home Screen"
                >
                  <Download size={13} /> Get app
                </button>
              ) : (
                <a
                  href="/qwetu-surveys.apk"
                  download
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    background: COLORS.mustard,
                    color: COLORS.blueDark,
                    textDecoration: "none",
                  }}
                  aria-label="Download app"
                >
                  <Download size={13} /> Download app
                </a>
              )
            ) : null}
            <div style={{ display: "flex", gap: 4 }}>
              {["en", "sw"].map((code) => (
                <button
                  key={code}
                  onClick={() => changeLang(code)}
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    background: lang === code ? COLORS.mustard : "rgba(255,255,255,0.15)",
                    color: lang === code ? COLORS.blueDark : "#fff",
                  }}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ color: "#CFE0F0", fontSize: 13, marginTop: 4 }}>{t.tagline}</div>

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
            <Search size={14} /> {t.hunting}
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
            <Home size={14} /> {t.renting}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 20px 40px" }}>
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
            {viewingConfirmation ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: COLORS.greenBg,
                  border: `1px solid ${COLORS.green}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 13,
                }}
              >
                <CalendarClock size={16} color={COLORS.green} />
                <span style={{ color: COLORS.green, fontWeight: 700 }}>
                  Viewing booked at {viewingConfirmation.buildingName}: {viewingConfirmation.label} (
                  {timeUntil(viewingConfirmation.datetime)}). Save this — it's your reminder, since we can't send
                  you notifications without an account.
                </span>
                <button
                  onClick={() => setViewingConfirmation(null)}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: COLORS.green, cursor: "pointer" }}
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setFilterCategory("all")}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 20,
                  cursor: "pointer",
                  border: `1px solid ${filterCategory === "all" ? COLORS.blue : COLORS.border}`,
                  background: filterCategory === "all" ? COLORS.blue : "#fff",
                  color: filterCategory === "all" ? "#fff" : COLORS.ink,
                }}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilterCategory(c.key)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: 20,
                    cursor: "pointer",
                    border: `1px solid ${filterCategory === c.key ? COLORS.blue : COLORS.border}`,
                    background: filterCategory === c.key ? COLORS.blue : "#fff",
                    color: filterCategory === c.key ? "#fff" : COLORS.ink,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                placeholder={t.filterArea}
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{ flex: 1, minWidth: 160, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
              <input
                placeholder={t.maxPrice}
                type="number"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                style={{ width: 120, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
              <select
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value)}
                style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              >
                <option value="">All types</option>
                {ALL_TYPES.map((rt) => (
                  <option key={rt.key} value={rt.key}>{rt.label}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
              </select>
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
              <button
                onClick={() => setShowFavoritesOnly((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 20,
                  cursor: "pointer",
                  border: `1px solid ${showFavoritesOnly ? COLORS.rust : COLORS.border}`,
                  background: showFavoritesOnly ? COLORS.rust : "#fff",
                  color: showFavoritesOnly ? "#fff" : COLORS.ink,
                }}
              >
                <Heart size={12} fill={showFavoritesOnly ? "#fff" : "none"} /> {t.saved} ({favorites.length})
              </button>
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
                {locatingMe ? t.findingYou : nearMeOn ? t.nearMeOn : t.nearMe}
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
                <span style={{ fontSize: 12, color: COLORS.gray }}>{t.nearMeHint}</span>
              )}
            </div>
            {locateError ? <div style={{ color: COLORS.rust, fontSize: 12, marginBottom: 12 }}>{locateError}</div> : null}

            <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 700, marginBottom: 10 }}>
              {vacantListings.length} room{vacantListings.length === 1 ? "" : "s"} found
            </div>

            {vacantListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: COLORS.gray, fontSize: 14 }}>
                {t.noVacant}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                {vacantListings.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    rotateSeed={i}
                    distance={distanceFor(l)}
                    onReport={handleReport}
                    isFavorite={favorites.includes(l.id)}
                    onToggleFavorite={toggleFavorite}
                    onShowQR={setQrTarget}
                    landlordBio={landlordBios[l.landlord_id]}
                    trackView
                    isComparing={compareIds.includes(l.id)}
                    onToggleCompare={toggleCompare}
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
                        {t.interested}
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : !authChecked ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.gray }}>
            <Dots />
          </div>
        ) : !user ? (
          <LoginForm t={t} onAuthed={() => {}} />
        ) : (
          <div>
            {interestNotifications.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, display: "flex", alignItems: "center", gap: 4 }}>
                  <Bell size={13} /> Recent interest (last hour)
                </div>
                {interestNotifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: COLORS.mustard,
                      color: COLORS.blueDark,
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}
                  >
                    <Bell size={16} />
                    <span>
                      {n.hunterName} is interested in your {n.roomLabel} at {n.buildingName}!
                      <span style={{ fontWeight: 600, opacity: 0.75, marginLeft: 6 }}>{minutesAgo(n.createdAt)}</span>
                    </span>
                    <button
                      onClick={() => setInterestNotifications((prev) => prev.filter((x) => x.id !== n.id))}
                      style={{ marginLeft: "auto", background: "none", border: "none", color: COLORS.blueDark, cursor: "pointer" }}
                      aria-label="Dismiss"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: COLORS.greenBg,
                border: `1px solid ${COLORS.green}`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 12,
              }}
            >
              <span style={{ color: COLORS.green, fontWeight: 700 }}>
                {t.signedInAs} {user.email}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  color: COLORS.rust,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <LogOut size={13} /> {t.signOut}
              </button>
            </div>

            <div
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDark})`,
                borderRadius: 10,
                padding: 18,
                marginBottom: 24,
                color: "#fff",
              }}
            >
              {editingProfile ? (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Set up your profile</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: avatarUrl ? `url(${avatarUrl})` : COLORS.mustard,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        color: COLORS.blueDark,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 22,
                        flexShrink: 0,
                      }}
                    >
                      {!avatarUrl ? (profile.name || "?").trim().charAt(0).toUpperCase() : null}
                    </div>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px dashed rgba(255,255,255,0.6)",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {uploadingAvatar ? <Loader2 size={13} className="spin" /> : <Camera size={13} />}
                      {uploadingAvatar ? "Uploading…" : avatarUrl ? "Change photo" : "Add profile photo"}
                      <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: "none" }} disabled={uploadingAvatar} />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                      Your name
                      <input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="e.g. Mama Njeri"
                        style={{ border: "none", borderRadius: 6, padding: "9px 10px", fontSize: 14, color: COLORS.ink }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                      Phone number
                      <input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="07XX XXX XXX"
                        style={{ border: "none", borderRadius: 6, padding: "9px 10px", fontSize: 14, color: COLORS.ink }}
                      />
                    </label>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      Market yourself — shown on every room you post
                    </div>
                    <textarea
                      value={landlordBio}
                      onChange={(e) => setLandlordBio(e.target.value)}
                      placeholder="e.g. Been renting out clean, secure rooms in Kilimani for 6 years. Fast response, fair deposit terms."
                      maxLength={220}
                      rows={3}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: 6,
                        padding: "9px 10px",
                        fontSize: 13,
                        fontFamily: "inherit",
                        resize: "vertical",
                        color: COLORS.ink,
                      }}
                    />
                  </div>
                  {error ? <div style={{ color: "#FFD3C7", fontSize: 12, marginTop: 8 }}>{error}</div> : null}
                  <button
                    type="button"
                    onClick={saveLandlordProfile}
                    style={{
                      marginTop: 12,
                      background: COLORS.mustard,
                      color: COLORS.blueDark,
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Save profile
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: avatarUrl ? `url(${avatarUrl})` : COLORS.mustard,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: COLORS.blueDark,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {!avatarUrl ? (profile.name || "?").trim().charAt(0).toUpperCase() : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{profile.name}</div>
                    <div style={{ fontSize: 12, color: "#CFE0F0", marginTop: 2 }}>{profile.phone}</div>
                    {landlordBio ? (
                      <div style={{ fontSize: 12, color: "#EAF1F8", marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>
                        "{landlordBio}"
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#fff",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={handleAddListing}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 28 }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>{t.postRoom}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <TextField label="Apartment / building name" value={buildingInfo.buildingName} onChange={(v) => setBuildingInfo({ ...buildingInfo, buildingName: v })} placeholder="e.g. Sunrise Apartments" />
                <TextField label="Location / area" value={buildingInfo.location} onChange={(v) => setBuildingInfo({ ...buildingInfo, location: v })} placeholder="e.g. Kilimani, Nairobi" />
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
                    background: buildingInfo.latitude ? COLORS.greenBg : "#fff",
                    color: buildingInfo.latitude ? COLORS.green : COLORS.blue,
                    cursor: "pointer",
                  }}
                >
                  {locatingForm ? <Loader2 size={13} className="spin" /> : <Navigation size={13} />}
                  {buildingInfo.latitude ? "Location pinned \u2713" : "Use my current location"}
                </button>
                <span style={{ fontSize: 11, color: COLORS.gray }}>
                  Lets hunters find this building with "Vacancies near me". Pin from inside the building for best accuracy.
                </span>
              </div>

              <div style={{ marginTop: 18, fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>
                Rooms in this building
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {rooms.map((r, index) => (
                  <div
                    key={index}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      padding: 12,
                      background: "#FCFBF8",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.blue }}>Listing {index + 1}</div>
                      {rooms.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeRoom(index)}
                          style={{ background: "none", border: "none", color: COLORS.rust, cursor: "pointer" }}
                          aria-label="Remove this listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {CATEGORIES.map((c) => (
                        <button
                          type="button"
                          key={c.key}
                          onClick={() => updateRoom(index, { category: c.key, roomType: "" })}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "6px 12px",
                            borderRadius: 20,
                            cursor: "pointer",
                            border: `1px solid ${r.category === c.key ? COLORS.blue : COLORS.border}`,
                            background: r.category === c.key ? COLORS.blue : "#fff",
                            color: r.category === c.key ? "#fff" : COLORS.ink,
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <TextField
                        label={r.category === "warehouse" ? "Unit name / label" : r.category === "house" ? "Property name / label" : "Room"}
                        value={r.roomLabel}
                        onChange={(v) => updateRoom(index, { roomLabel: v })}
                        placeholder={r.category === "warehouse" ? "e.g. Unit B, Industrial Area" : r.category === "house" ? "e.g. 4BR house, gated compound" : "e.g. Bedsitter, 1st floor"}
                      />
                      <TextField
                        label={r.category === "room" ? "Rent (KES / month)" : "Rent / lease price (KES / month)"}
                        type="number"
                        value={r.price}
                        onChange={(v) => updateRoom(index, { price: v })}
                        placeholder="e.g. 12000"
                      />
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>
                        Type
                        <select
                          value={r.roomType}
                          onChange={(e) => updateRoom(index, { roomType: e.target.value })}
                          style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 14, background: "#fff" }}
                        >
                          <option value="">Select type...</option>
                          {TYPES_BY_CATEGORY[r.category].map((rt) => (
                            <option key={rt.key} value={rt.key}>{rt.label}</option>
                          ))}
                        </select>
                      </label>
                      <TextField
                        label="Deposit (KES, optional)"
                        type="number"
                        value={r.depositAmount}
                        onChange={(v) => updateRoom(index, { depositAmount: v })}
                        placeholder="e.g. 12000"
                      />
                    </div>

                    {r.category === "house" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                        <TextField label="Bedrooms" type="number" value={r.bedrooms} onChange={(v) => updateRoom(index, { bedrooms: v })} placeholder="e.g. 4" />
                        <TextField label="Bathrooms" type="number" value={r.bathrooms} onChange={(v) => updateRoom(index, { bathrooms: v })} placeholder="e.g. 3" />
                      </div>
                    ) : null}

                    {r.category === "warehouse" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 }}>
                        <TextField label="Size" type="number" value={r.sizeValue} onChange={(v) => updateRoom(index, { sizeValue: v })} placeholder="e.g. 2500" />
                        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>
                          Unit
                          <select
                            value={r.sizeUnit}
                            onChange={(e) => updateRoom(index, { sizeUnit: e.target.value })}
                            style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 14, background: "#fff" }}
                          >
                            <option value="sqft">sq ft</option>
                            <option value="sqm">sq m</option>
                          </select>
                        </label>
                      </div>
                    ) : null}

                    {r.category === "house" || r.category === "warehouse" ? (
                      <div style={{ marginTop: 12 }}>
                        <TextField
                          label="Lease term (optional)"
                          value={r.leaseTerm}
                          onChange={(v) => updateRoom(index, { leaseTerm: v })}
                          placeholder="e.g. 1 year minimum, negotiable"
                        />
                      </div>
                    ) : null}

                    <div style={{ marginTop: 12 }}>
                      <TextField label="Extra details (optional)" value={r.description} onChange={(v) => updateRoom(index, { description: v })} placeholder="Deposit terms, nearby matatu stage..." />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600, marginBottom: 6 }}>Amenities</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {AMENITIES.map((a) => {
                          const Icon = a.icon;
                          const active = r.amenities.includes(a.key);
                          return (
                            <button
                              type="button"
                              key={a.key}
                              onClick={() => toggleRoomAmenity(index, a.key)}
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

                    <div style={{ marginTop: 12 }}>
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
                        {uploadingPhotos ? "Uploading\u2026" : "Add photos"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handlePhotoSelect(index, e)}
                          style={{ display: "none" }}
                          disabled={uploadingPhotos}
                        />
                      </label>
                      {r.photos.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          {r.photos.map((p) => (
                            <div key={p} style={{ position: "relative" }}>
                              <img src={p} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
                              <button
                                type="button"
                                onClick={() => removeRoomPhoto(index, p)}
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
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRoom}
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: `1px dashed ${COLORS.blue}`,
                  color: COLORS.blue,
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={13} /> Add another room
              </button>

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
                <Plus size={14} /> {saving ? "Posting\u2026" : rooms.length > 1 ? `Post ${rooms.length} rooms` : "Post room"}
              </button>
            </form>

            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>{t.yourListings} ({myListings.length})</div>
            {!profile.phone ? (
              <div style={{ color: COLORS.gray, fontSize: 13 }}>Enter your phone number above to see your posted rooms.</div>
            ) : myListings.length === 0 ? (
              <div style={{ color: COLORS.gray, fontSize: 13 }}>You haven't posted any rooms yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                {myListings.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    rotateSeed={i}
                    isOwnerView
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
                          onClick={() => openSlotManager(l)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "transparent",
                            border: `1px solid ${COLORS.mustard}`,
                            color: COLORS.blueDark,
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <CalendarClock size={12} /> Viewing times
                        </button>
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

      <Footer t={t} />

      {compareIds.length === 2 ? (
        <button
          onClick={() => setShowCompare(true)}
          style={{
            position: "fixed",
            bottom: 20,
            left: 20,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: COLORS.blue,
            color: "#fff",
            border: "none",
            borderRadius: 24,
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            cursor: "pointer",
            zIndex: 65,
          }}
        >
          <Scale size={16} /> Compare (2)
        </button>
      ) : null}

      {!assistantOpen ? (
        <button
          onClick={() => setAssistantOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: COLORS.mustard,
            border: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 65,
          }}
          aria-label="Open room finder assistant"
        >
          <Bot size={24} color={COLORS.blueDark} />
        </button>
      ) : null}

      <SearchAssistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        listings={listings}
        favorites={favorites}
        onApply={applyAssistantCriteria}
      />

      {showCompare && compareIds.length === 2 ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,20,20,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 75,
          }}
          onClick={() => setShowCompare(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.card, borderRadius: 10, padding: 18, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                <Scale size={16} /> Compare
              </div>
              <button onClick={() => setShowCompare(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>

            {(() => {
              const items = compareIds.map((id) => listings.find((l) => l.id === id)).filter(Boolean);
              if (items.length < 2) {
                return <div style={{ color: COLORS.gray, fontSize: 13 }}>One of these listings is no longer available.</div>;
              }
              const rows = [
                { label: "Building", render: (l) => l.building_name },
                { label: "Area", render: (l) => l.location },
                { label: "Category", render: (l) => CATEGORIES.find((c) => c.key === (l.category || "room"))?.label || "Room" },
                { label: "Type", render: (l) => ALL_TYPES.find((t) => t.key === l.room_type)?.label || "—" },
                { label: "Price", render: (l) => `KES ${Number(l.price).toLocaleString()}/mo` },
                { label: "Deposit", render: (l) => (l.deposit_amount ? `KES ${Number(l.deposit_amount).toLocaleString()}` : "—") },
                {
                  label: "Bed/Bath",
                  render: (l) => (l.bedrooms || l.bathrooms ? `${l.bedrooms || "-"} bed / ${l.bathrooms || "-"} bath` : "—"),
                },
                {
                  label: "Size",
                  render: (l) => (l.size_value ? `${Number(l.size_value).toLocaleString()} ${l.size_unit === "sqm" ? "sq m" : "sq ft"}` : "—"),
                },
                {
                  label: "Amenities",
                  render: (l) => ((l.amenities || []).length ? (l.amenities || []).map((k) => AMENITIES.find((a) => a.key === k)?.label || k).join(", ") : "—"),
                },
                { label: "Landlord", render: (l) => l.landlord_name },
              ];
              return (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: COLORS.gray, fontWeight: 700 }}></th>
                        {items.map((l) => (
                          <th key={l.id} style={{ textAlign: "left", padding: "6px 8px", minWidth: 140 }}>
                            {l.photos && l.photos[0] ? (
                              <img src={l.photos[0]} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
                            ) : null}
                            <div style={{ fontWeight: 800, fontSize: 13 }}>{l.room_label}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.label} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: "8px", fontWeight: 700, color: COLORS.gray, verticalAlign: "top" }}>{row.label}</td>
                          {items.map((l) => (
                            <td key={l.id} style={{ padding: "8px", verticalAlign: "top" }}>
                              {row.render(l)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <button
              onClick={() => {
                setCompareIds([]);
                setShowCompare(false);
              }}
              style={{
                marginTop: 16,
                width: "100%",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.gray,
                borderRadius: 6,
                padding: "9px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear comparison
            </button>
          </div>
        </div>
      ) : null}

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

            {(claimTarget.viewing_slots || []).filter((s) => !s.taken).length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600, marginBottom: 6 }}>
                  Pick a viewing time (optional)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {claimTarget.viewing_slots
                    .filter((s) => !s.taken)
                    .map((s) => (
                      <label
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          border: `1px solid ${claimForm.slotId === s.id ? COLORS.blue : COLORS.border}`,
                          borderRadius: 6,
                          padding: "7px 10px",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="viewing_slot"
                          checked={claimForm.slotId === s.id}
                          onChange={() => setClaimForm({ ...claimForm, slotId: s.id })}
                        />
                        <span style={{ flex: 1 }}>{s.label}</span>
                        {s.datetime ? (
                          <span style={{ fontSize: 11, color: COLORS.mustard, fontWeight: 800 }}>{timeUntil(s.datetime)}</span>
                        ) : null}
                      </label>
                    ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.gray, padding: "4px 10px" }}>
                    <input
                      type="radio"
                      name="viewing_slot"
                      checked={claimForm.slotId === ""}
                      onChange={() => setClaimForm({ ...claimForm, slotId: "" })}
                    />
                    No preference / I'll arrange separately
                  </label>
                </div>
              </div>
            ) : null}

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
                      {i.chosen_slot ? (
                        <span style={{ display: "block", color: COLORS.blue, fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                          <Clock size={10} style={{ verticalAlign: "-1px" }} /> {i.chosen_slot}
                        </span>
                      ) : null}
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

      {slotManagerTarget ? (
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
          onClick={() => setSlotManagerTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.card, borderRadius: 10, padding: 20, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Viewing times</div>
              <button onClick={() => setSlotManagerTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14 }}>
              {slotManagerTarget.building_name} — {slotManagerTarget.room_label}. Hunters can pick one of these when
              they express interest, instead of you having to arrange every viewing by call.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {(slotManagerTarget.viewing_slots || []).length === 0 ? (
                <div style={{ fontSize: 12, color: COLORS.gray }}>No viewing times added yet.</div>
              ) : (
                slotManagerTarget.viewing_slots.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 6,
                      padding: "7px 10px",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={13} color={COLORS.gray} />
                      {s.label}
                      {s.taken ? (
                        <span style={{ fontSize: 10, color: COLORS.rust, fontWeight: 800, marginLeft: 4 }}>TAKEN</span>
                      ) : null}
                    </span>
                    <button
                      onClick={() => removeSlot(s.id)}
                      style={{ background: "none", border: "none", color: COLORS.rust, cursor: "pointer" }}
                      aria-label="Remove slot"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="datetime-local"
                value={newSlotDateTime}
                onChange={(e) => setNewSlotDateTime(e.target.value)}
                style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              />
              <button
                onClick={addSlot}
                disabled={slotSaving || !newSlotDateTime}
                style={{
                  background: COLORS.blue,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "0 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {qrTarget ? <QRModal listing={qrTarget} onClose={() => setQrTarget(null)} /> : null}

      {showIOSHint ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,20,20,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 70,
          }}
          onClick={() => setShowIOSHint(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.card, borderRadius: 10, padding: 22, width: "100%", maxWidth: 320, textAlign: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Add to Home Screen</div>
              <button onClick={() => setShowIOSHint(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.7, textAlign: "left" }}>
              1. Tap the <strong>Share</strong> icon at the bottom of Safari (the square with an arrow).
              <br />
              2. Scroll down and tap <strong>"Add to Home Screen."</strong>
              <br />
              3. Tap <strong>Add</strong> — Qwetu Surveys now opens like a normal app from your home screen.
            </div>
          </div>
        </div>
      ) : null}

      {showGenericHint ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,20,20,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 70,
          }}
          onClick={() => setShowGenericHint(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.card, borderRadius: 10, padding: 22, width: "100%", maxWidth: 340, textAlign: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Add to Home Screen</div>
              <button onClick={() => setShowGenericHint(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.7, textAlign: "left" }}>
              Your browser hasn't offered the one-tap install yet — that timing is controlled by the browser itself, not
              this site. You can still add it manually:
              <br />
              <br />
              1. Tap your browser's menu button (usually <strong>⋮</strong> top-right, or <strong>≡</strong>).
              <br />
              2. Look for <strong>"Add to Home Screen"</strong> or <strong>"Install app."</strong>
              <br />
              3. Confirm — Qwetu Surveys will appear as its own app icon.
              <br />
              <br />
              <span style={{ color: COLORS.gray, fontSize: 12 }}>
                Tip: this tends to appear after you've browsed the site a little and are on Chrome, Edge, or Samsung
                Internet on Android.
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {showFeedback ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,20,20,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 60,
          }}
          onClick={() => setShowFeedback(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.card, borderRadius: 10, padding: 22, width: "100%", maxWidth: 340, textAlign: "center" }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Was this website helpful?</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 16 }}>Please rate us — totally optional.</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFeedbackRating(n)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  aria-label={`${n} star`}
                >
                  <Star
                    size={28}
                    color={COLORS.mustard}
                    fill={n <= feedbackRating ? COLORS.mustard : "none"}
                  />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowFeedback(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.gray,
                  borderRadius: 6,
                  padding: "9px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Skip
              </button>
              <button
                onClick={submitFeedback}
                disabled={feedbackRating === 0 || feedbackSubmitting}
                style={{
                  flex: 1,
                  background: COLORS.blue,
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "9px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: feedbackRating === 0 ? "default" : "pointer",
                  opacity: feedbackRating === 0 ? 0.5 : 1,
                }}
              >
                {feedbackSubmitting ? "Sending…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .spin { animation: qwetu-spin 1s linear infinite; }
        @keyframes qwetu-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes qwetu-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
