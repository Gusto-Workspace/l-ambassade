import { useEffect, useRef, useState } from "react";

export default function RevealOnScrollComponent({
  as: Component = "div",
  children,
  className = "",
  variant = "up",
  delay = 0,
  duration = 700,
  threshold = 0.16,
  once = true,
  style = {},
  ...props
}) {
  const nodeRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;

    if (!node || typeof window === "undefined") {
      return undefined;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);

          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -6% 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Component
      ref={nodeRef}
      className={`site-reveal site-reveal--${variant} ${
        visible ? "is-visible" : ""
      } ${className}`.trim()}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: visible ? `${delay}ms` : "0ms",
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
