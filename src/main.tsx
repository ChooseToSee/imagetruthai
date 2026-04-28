import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker only in production (not in iframes/preview)
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && !isInIframe && !isPreviewHost) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("SW registered:", reg);

        // Check for updates every time the app regains focus / comes back online.
        const checkForUpdate = () => reg.update().catch(() => {});
        window.addEventListener("focus", checkForUpdate);
        window.addEventListener("online", checkForUpdate);

        const promptUpdate = (worker: ServiceWorker) => {
          // Show a lightweight, dismissible toast prompting reload.
          const existing = document.getElementById("sw-update-toast");
          if (existing) return;

          const toast = document.createElement("div");
          toast.id = "sw-update-toast";
          toast.style.cssText = [
            "position:fixed",
            "bottom:20px",
            "left:50%",
            "transform:translateX(-50%)",
            "z-index:99999",
            "background:hsl(222 47% 11%)",
            "color:hsl(210 40% 98%)",
            "border:1px solid hsl(217 33% 24%)",
            "border-radius:12px",
            "padding:12px 16px",
            "display:flex",
            "gap:12px",
            "align-items:center",
            "font-family:system-ui,-apple-system,sans-serif",
            "font-size:14px",
            "box-shadow:0 10px 30px rgba(0,0,0,0.4)",
            "max-width:90vw",
          ].join(";");
          toast.innerHTML = `
            <span>A new version is available.</span>
            <button id="sw-update-reload" style="background:hsl(217 91% 60%);color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Refresh</button>
            <button id="sw-update-dismiss" style="background:transparent;color:hsl(215 20% 65%);border:none;cursor:pointer;font-size:13px;">Later</button>
          `;
          document.body.appendChild(toast);

          document.getElementById("sw-update-reload")?.addEventListener("click", () => {
            worker.postMessage("SKIP_WAITING");
          });
          document.getElementById("sw-update-dismiss")?.addEventListener("click", () => {
            toast.remove();
          });
        };

        // If an update is already waiting at load time, prompt now.
        if (reg.waiting) promptUpdate(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              promptUpdate(newWorker);
            }
          });
        });
      })
      .catch((err) => console.log("SW registration failed:", err));

    // When the new SW takes control (after SKIP_WAITING), reload once.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
} else if (isPreviewHost || isInIframe) {
  // Unregister any existing service workers in preview/iframe contexts
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}
