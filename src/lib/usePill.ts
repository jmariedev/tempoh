"use client";

import { useLayoutEffect, useRef } from "react";

// Changes this soon after the page opens (like a saved tab loading) jump into place instead of sliding.
const SETTLE_MS = 1500;

/**
 * Slides a highlight pill under the active button in a group. The group gets --pill-x and
 * --pill-w, and its .pill element moves with them. Buttons that take part carry data-pill.
 */
export function usePill<T extends HTMLElement>(active: string | number, remount?: unknown) {
  const ref = useRef<T>(null);
  const openedAt = useRef(0);

  useLayoutEffect(() => {
    const group = ref.current;
    if (!group) return;
    if (!openedAt.current) openedAt.current = performance.now();
    const place = () => {
      const items = [...group.querySelectorAll<HTMLElement>("[data-pill]")];
      const current = items.find((el) => el.dataset.pill === String(active));
      if (!current) return;
      group.style.setProperty("--pill-x", `${current.offsetLeft}px`);
      group.style.setProperty("--pill-w", `${current.offsetWidth}px`);
    };
    const snap = performance.now() - openedAt.current < SETTLE_MS || group.dataset.ready !== "true";
    if (snap) {
      // Place it without the slide, then turn the slide on for later changes.
      group.dataset.ready = "false";
      place();
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => (group.dataset.ready = "true")));
      const watch = new ResizeObserver(place);
      watch.observe(group);
      return () => {
        cancelAnimationFrame(frame);
        watch.disconnect();
      };
    }
    place();
    const watch = new ResizeObserver(place);
    watch.observe(group);
    return () => watch.disconnect();
  }, [active, remount]);

  return ref;
}
