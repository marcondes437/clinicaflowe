"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ScrollReveal.module.css";

/** Enhances server-rendered content only after the observer is available. */
export default function ScrollReveal({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!container || motion.matches || !("IntersectionObserver" in window)) return;

    const targets = Array.from(container.querySelectorAll<HTMLElement>("section > .cx-container > *"));
    const reveal = (element: HTMLElement) => {
      if (!element.classList.contains(styles.pending)) return;
      element.classList.remove(styles.pending);
      element.classList.add(styles.visible);
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      });
    }, { threshold: 0, rootMargin: "0px 0px -32px 0px" });

    targets.forEach((element) => {
      // Keep content already on screen visible, including restored scroll positions.
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add(styles.pending);
      observer.observe(element);
    });

    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(`.${styles.pending}`);
      if (target) reveal(target);
    };
    const reset = () => {
      observer.disconnect();
      targets.forEach((element) => element.classList.remove(styles.pending, styles.visible));
    };
    const onMotionChange = () => { if (motion.matches) reset(); };
    container.addEventListener("focusin", onFocus);
    motion.addEventListener("change", onMotionChange);
    return () => {
      reset();
      container.removeEventListener("focusin", onFocus);
      motion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <div ref={root} className={styles.root}>{children}</div>;
}
