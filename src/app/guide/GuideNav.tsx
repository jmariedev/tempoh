"use client";

import { useEffect, useRef, useState } from "react";

/** The guide's step list. It follows along as you scroll and highlights where you are. */
export default function GuideNav({ steps }: { steps: [string, string][] }) {
  const [active, setActive] = useState(steps[0][0]);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const sections = steps.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const watch = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    sections.forEach((s) => watch.observe(s));
    // Opening the guide at a step, like /guide#calendar, starts there.
    const fromLink = window.location.hash.slice(1);
    if (steps.some(([id]) => id === fromLink)) requestAnimationFrame(() => setActive(fromLink));
    return () => watch.disconnect();
  }, [steps]);

  // When the steps are a sideways row (on phones), keep the current one in view.
  useEffect(() => {
    const row = list.current;
    const link = row?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!row || !link || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: link.offsetLeft - row.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  const index = steps.findIndex(([id]) => id === active);

  return (
    <nav className="g-nav" aria-label="Guide steps">
      <div className="g-progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <ol ref={list}>
        {steps.map(([id, label], i) => (
          <li key={id}>
            <a href={`#${id}`} aria-current={active === id ? "step" : undefined} className={i < index ? "done" : ""}>
              <span className="g-nav-num">{i + 1}</span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
