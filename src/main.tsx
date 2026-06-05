import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global pull-to-refresh blocker (mobile browsers)
let touchStartStartY = 0;

window.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 1) {
      touchStartStartY = e.touches[0].clientY;
    }
  },
  { passive: false }
);

window.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length !== 1) return;
    const touchY = e.touches[0].clientY;
    const touchScrollDelta = touchY - touchStartStartY;

    // If user pulls down at the very top of the page, block pull-to-refresh.
    if (window.pageYOffset === 0 && touchScrollDelta > 0) {
      e.preventDefault();
    }
  },
  { passive: false }
);

createRoot(document.getElementById("root")!).render(<App />);
