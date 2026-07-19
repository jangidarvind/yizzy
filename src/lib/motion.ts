import { useEffect, useRef, useState } from 'react';

/**
 * Motion primitives shared by the hero, journey diagram and stats row.
 *
 * Everything here is opt-out: when `prefers-reduced-motion: reduce` is set,
 * hooks resolve immediately to their finished state so the page renders fully
 * visible and static rather than animating.
 */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** Fires once when the element scrolls into view. Reduced motion → true immediately. */
export function useInView<T extends HTMLElement>(rootMargin = '-12% 0px -12% 0px') {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); io.disconnect(); }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, rootMargin]);

  return { ref, inView };
}

/**
 * Counts 0 → target once `active` is true. Reduced motion jumps straight to the
 * target. Uses an eased rAF loop rather than an interval so it stays smooth.
 */
export function useCountUp(target: number, active: boolean, durationMs = 1400): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduced || durationMs <= 0) { setValue(target); return; }

    let raf = 0;
    const start = performance.now();
    // easeOutCubic — fast start, settles gently on the final figure.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      setValue(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs, reduced]);

  return value;
}

/**
 * 0 → 1 progress of an element through the viewport, for scroll-linked motion.
 * Read on a rAF-throttled scroll listener; consumers apply it via transform
 * only, so nothing here triggers layout.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) { setProgress(1); return; }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      // Track the viewport's vertical middle against the element's span.
      const marker = window.innerHeight * 0.55;
      const p = (marker - rect.top) / Math.max(rect.height, 1);
      setProgress(Math.min(Math.max(p, 0), 1));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  return { ref, progress };
}
