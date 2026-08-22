import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Capture this immediately, before React mounts — beforeinstallprompt
// fires only once, and can arrive before the app finishes loading.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__qwetuInstallPrompt = e;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline caching just won't be available — the site still works normally.
    });
  });
}
