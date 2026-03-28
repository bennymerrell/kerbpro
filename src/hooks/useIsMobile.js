import { useState, useEffect } from 'react';

function detectMobileOrTablet() {
  const ua = navigator.userAgent;
  return /android|iphone|ipad|ipod|tablet|mobile|touch/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /mac/i.test(ua)); // iPadOS 13+ reports as Mac
}

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => detectMobileOrTablet());

  useEffect(() => {
    const handler = () => setIsMobile(detectMobileOrTablet());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}