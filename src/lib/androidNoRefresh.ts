import { Capacitor } from '@capacitor/core';

/**
 * Android-оболочки APK (SwipeRefreshLayout) запускают «обновление», когда
 * WebView сообщает, что страница в самом верху (scrollY === 0).
 * Держим страницу минимум на 1px ниже верха — тогда оболочка всегда считает,
 * что «есть куда прокручивать вверх», и рефреш не срабатывает никогда.
 * На обычном сайте (не Android WebView) ничего не делаем.
 */
export function installAndroidNoRefresh() {
  if (typeof window === 'undefined') return;
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/i.test(ua) && (/; wv\)/.test(ua) || /Version\/[\d.]+ Chrome/.test(ua));
  if (!isAndroidWebView && !Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('android-webview');

  const nudge = () => {
    if (window.scrollY < 1 && document.documentElement.style.overflow !== 'hidden') {
      window.scrollTo(0, 1);
    }
  };

  window.addEventListener('touchstart', nudge, { passive: true, capture: true });
  let t: number | undefined;
  window.addEventListener('scroll', () => {
    window.clearTimeout(t);
    t = window.setTimeout(nudge, 80);
  }, { passive: true });
  window.addEventListener('load', nudge);
  requestAnimationFrame(nudge);
}
