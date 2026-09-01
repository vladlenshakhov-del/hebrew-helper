import { useEffect } from 'react';

/**
 * Блокирует нативный Pull-to-Refresh на мобильных,
 * не мешая обычному скроллу внутренних контейнеров.
 */
export function usePreventPullToRefresh() {
  useEffect(() => {
    let startY = 0;
    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };

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

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !e.cancelable) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      // Свайп вниз в самой верхней точке и без внутреннего скролла — это Pull-to-Refresh.
      if (dy > 0 && Math.abs(dy) > Math.abs(dx) && !canScrollUp(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    // passive: false КРИТИЧНО для preventDefault
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}
