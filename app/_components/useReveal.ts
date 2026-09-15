"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useReveal — returns a className string that starts empty (rows fully visible
 * on the server-rendered HTML and before hydration), then on mount:
 *   1. Adds "js-anim" so CSS can hide the rows briefly for the fade-in.
 *   2. If the list is already in the viewport, adds "in" on the next paint so
 *      rows appear immediately (no observer wait).
 *   3. Otherwise, sets up an IntersectionObserver that adds "in" on first
 *      intersection.
 *   4. Regardless, a 800 ms fallback timer force-adds "in" so rows never stay
 *      hidden if the observer misfires or is unavailable.
 *   5. Under prefers-reduced-motion, skips the animation entirely — the
 *      returned className stays "" so rows keep the default visible state.
 */
export function useReveal<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  className: string;
} {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"" | "js-anim" | "js-anim in">("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Rows stay visible with no animation.
      return;
    }

    // Step 1: mark the container so CSS hides the rows.
    setState("js-anim");

    // Determine if the list is already in the viewport when we mount.
    const rect = el.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    const inViewport = rect.top < viewportH && rect.bottom > 0;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setState("js-anim in");
    };

    let io: IntersectionObserver | null = null;
    let raf = 0;

    if (inViewport) {
      // Wait one paint so the browser sees the "hidden" state first, then
      // reveal so the transition actually plays. Two RAFs give the layout
      // engine time to apply the .js-anim styles before we flip to .in.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(reveal);
      });
    } else if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              reveal();
              io?.disconnect();
              break;
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
      );
      io.observe(el);
    } else {
      // No IO support at all — just reveal.
      reveal();
    }

    // Safety net: if 800 ms pass and nothing has revealed the list, force it.
    const fallback = window.setTimeout(reveal, 800);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return { ref, className: state };
}
