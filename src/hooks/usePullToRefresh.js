import { useEffect, useRef, useState } from 'react';

export default function usePullToRefresh(onRefresh) {
  const startY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let pulling = false;

    function onTouchStart(e) {
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        pulling = true;
      }
    }

    async function onTouchEnd(e) {
      if (!pulling) return;
      pulling = false;
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 80) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return { refreshing };
}