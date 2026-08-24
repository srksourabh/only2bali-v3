"use client";

import * as React from "react";
import Link from "next/link";

type Item = {
  value: string;
  label: string;
  href?: string;
};

type NotchNavProps = {
  items: Item[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

export function NotchNav({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel = "Primary",
  className,
}: NotchNavProps) {
  const isControlled = value !== undefined;
  const [active, setActive] = React.useState<string>(value ?? defaultValue ?? items[0]?.value ?? "");
  const [ready, setReady] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (isControlled && value !== undefined) setActive(value);
  }, [isControlled, value]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLElement | null>>([]);
  const [notchRect, setNotchRect] = React.useState<{ left: number; width: number } | null>(null);

  const activeIndex = React.useMemo(() => items.findIndex((i) => i.value === active), [items, active]);
  const rovingIndex = activeIndex >= 0 ? activeIndex : 0;

  const updateNotch = React.useCallback(() => {
    const c = containerRef.current;
    const el = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;
    if (!c || !el) {
      if (activeIndex < 0) setNotchRect(null);
      return;
    }
    const cRect = c.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const left = eRect.left - cRect.left;
    const width = eRect.width;
    setNotchRect({ left, width });
    setReady(true);
  }, [activeIndex]);

  React.useLayoutEffect(() => {
    updateNotch();
    const onResize = () => updateNotch();
    window.addEventListener("resize", onResize);
    const c = containerRef.current;
    c?.addEventListener("scroll", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      c?.removeEventListener("scroll", onResize);
    };
  }, [updateNotch]);

  const focusItem = (index: number) => {
    const el = itemRefs.current[Math.max(0, Math.min(items.length - 1, index))];
    el?.focus();
  };

  const commitChange = (next: string) => {
    if (!isControlled) setActive(next);
    onValueChange?.(next);
  };

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return (
    <nav aria-label={ariaLabel} className={["notch-nav", "w-fit mx-auto max-w-full", className].filter(Boolean).join(" ")}>
      <div
        ref={containerRef}
        className="notch-nav-track relative rounded-lg border border-border bg-secondary text-foreground"
      >
        <ul
          role="menubar"
          className="flex items-center justify-center gap-1 p-1"
          onKeyDown={(e) => {
            const key = e.key;
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
            e.preventDefault();
            if (key === "ArrowRight") focusItem(rovingIndex + 1);
            if (key === "ArrowLeft") focusItem(rovingIndex - 1);
            if (key === "Home") focusItem(0);
            if (key === "End") focusItem(items.length - 1);
          }}
        >
          {items.map((item, idx) => {
            const isActive = item.value === active;
            const itemClass = [
              "relative rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "text-primary" : "text-foreground/70 hover:text-foreground",
            ].join(" ");

            const assignRef = (el: HTMLElement | null) => {
              itemRefs.current[idx] = el;
            };

            return (
              <li key={item.value} role="none">
                {item.href ? (
                  <Link
                    href={item.href}
                    ref={assignRef}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={idx === rovingIndex ? 0 : -1}
                    onClick={() => commitChange(item.value)}
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                        commitChange(item.value);
                        e.currentTarget.click();
                      }
                    }}
                    className={itemClass}
                  >
                    <span className="text-pretty whitespace-nowrap">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    ref={assignRef}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    aria-pressed={isActive || undefined}
                    tabIndex={idx === rovingIndex ? 0 : -1}
                    onClick={() => commitChange(item.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        commitChange(item.value);
                      }
                    }}
                    className={itemClass}
                  >
                    <span className="text-pretty whitespace-nowrap">{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {notchRect && (
          <div
            aria-hidden="true"
            className={[
              "pointer-events-none absolute",
              "overflow-hidden rounded-sm",
              "transition-all",
              reducedMotion ? "duration-0" : "duration-300",
              "ease-[cubic-bezier(0.22,1,0.36,1)]",
              ready ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{
              transform: `translate3d(${notchRect.left}px, 0, 0)`,
              width: notchRect.width,
              bottom: -4,
              height: 10,
              willChange: "transform, width, opacity",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              className="block text-primary"
            >
              <path
                d="
                  M 2 1
                  H 98
                  Q 99 1 99 2
                  V 10
                  H 88
                  Q 87.2 10 86.6 11.4
                  L 84.8 18
                  H 15.2
                  L 13.4 11.4
                  Q 12.8 10 12 10
                  H 2
                  Q 1 10 1 9
                  V 2
                  Q 1 1 2 1
                  Z
                "
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>
    </nav>
  );
}
