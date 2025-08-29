// Bhav_GPT/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// ---- Tiny in-page error overlay (shows runtime errors visibly) ----
function installErrorOverlay() {
  const style = document.createElement("style");
  style.textContent = `
  #__err {
    position: fixed; inset: 0; background: rgba(0,0,0,.85);
    color: #fff; font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    padding: 16px; overflow: auto; z-index: 99999; display:none;
  }
  #__err pre{white-space:pre-wrap}
  `;
  document.head.appendChild(style);
  const box = document.createElement("div");
  box.id = "__err";
  const pre = document.createElement("pre");
  box.appendChild(pre);
  document.body.appendChild(box);
  const show = (msg: string) => {
    pre.textContent = msg;
    box.style.display = "block";
  };
  window.addEventListener("error", (e) => show(String(e?.error?.stack || e?.message || e)));
  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) =>
    show("Unhandled rejection:\n" + String((e.reason && (e.reason.stack || e.reason)) || e))
  );
}
installErrorOverlay();
// -------------------------------------------------------------------

function ensureRoot(): HTMLElement {
  const el = document.getElementById("root");
  if (el) return el;
  const d = document.createElement("div");
  d.id = "root";
  document.body.appendChild(d);
  return d;
}

try {
  const container = ensureRoot();
  const root = createRoot(container);
  root.render(<App />);
} catch (err: any) {
  const box = document.getElementById("__err");
  if (box) {
    const pre = box.querySelector("pre");
    if (pre) pre.textContent = String(err?.stack || err);
    (box as HTMLElement).style.display = "block";
  } else {
    // last resort
    document.body.innerHTML =
      '<pre style="white-space:pre-wrap;color:#fff;background:#000;padding:16px;">' +
      String(err?.stack || err) +
      "</pre>";
  }
}
