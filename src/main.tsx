import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Отключаем pull-to-refresh на мобильных (iOS Safari игнорирует overscroll-behavior).
// Блокируем ТОЛЬКО жест «вниз», когда ни один родительский контейнер не может прокрутиться вверх.
let startY = 0;
let startX = 0;

const canScrollUp = (target: EventTarget | null) => {
  let el = target as HTMLElement | null;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = getComputedStyle(el);
    const scrollable = /(auto|scroll|overlay)/.test(style.overflowY);
    if (scrollable && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return true;
    el = el.parentElement;
  }
  const doc = document.scrollingElement || document.documentElement;
  return doc.scrollTop > 0;
};

document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
  },
  { passive: true }
);

document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length !== 1 || !e.cancelable) return;
    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;
    // только вертикальный свайп вниз в самом верху страницы
    if (dy > 0 && Math.abs(dy) > Math.abs(dx) && !canScrollUp(e.target)) {
      e.preventDefault();
    }
  },
  { passive: false }
);

createRoot(document.getElementById("root")!).render(<App />);
