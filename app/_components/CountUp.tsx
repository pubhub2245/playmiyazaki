"use client";

import { useEffect, useState } from "react";

export function CountUp({ target, duration = 600 }: { target: number; duration?: number }) {
  // Initialize to `target` so SSR HTML — and the first client render before
  // hydration completes — shows the real number. Search engines and users with
  // JS disabled see the correct count.
  const [value, setValue] = useState(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Leave value at `target`; no animation.
      return;
    }
    // Restart the count from 0 and animate up to target.
    setValue(0);
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <>{value}</>;
}
