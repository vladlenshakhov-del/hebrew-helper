import { useEffect } from 'react';

/**
 * Блокирует нативный Pull-to-Refresh на мобильных,
 * не мешая обычному скроллу внутренних контейнеров.
 */
export function usePreventPullToRefresh() {
  useEffect(() => {
    let startY = 0;
    let startX = 0;
    let activeScroller: HTMLElement | null = null;

    const findScroller = (target: EventTarget | null) => {
      let el = target instanceof HTMLElement ? target : null;
      while (el) {
        const style = getComputedStyle(el);
        const scrollable = /(auto|scroll|overlay)/.test(style.overflowY);
        if (scrollable && el.scrollHeight > el.clientHeight) return el;
        el = el.parentElement;
      }
      return document.getElementById('root');
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      activeScroller = findScroller(e.target);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !e.cancelable) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      // Блокируем только вытягивание вниз за верхнюю границу активной области.
      // Свайп вверх и обычная прокрутка в обе стороны остаются нативными.
      if (dy > 0 && Math.abs(dy) > Math.abs(dx) && (activeScroller?.scrollTop ?? 0) <= 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      activeScroller = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);
}
