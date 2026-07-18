import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Route changes should land at the top, not mid-page from the previous scroll. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
