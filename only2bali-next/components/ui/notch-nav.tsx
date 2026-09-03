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

  React.useEffect(() => {
    if (isControlled && value !== undefined) setActive(value);
  }, [isControlled, value]);

  const itemRefs = React.useRef<Array<HTMLElement | null>>([]);
  const activeIndex = React.useMemo(() => items.findIndex((i) => i.value === active), [items, active]);
  const rovingIndex = activeIndex >= 0 ? activeIndex : 0;

  const focusItem = (index: number) => {
    const el = itemRefs.current[Math.max(0, Math.min(items.length - 1, index))];
    el?.focus();
  };

  const commitChange = (next: string) => {
    if (!isControlled) setActive(next);
    onValueChange?.(next);
  };

  return (
    <nav aria-label={ariaLabel} className={["notch-nav", "w-fit mx-auto max-w-full", className].filter(Boolean).join(" ")}>
      <div className="notch-nav-track relative rounded-lg border border-border bg-secondary text-foreground">
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
              "relative rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors no-underline",
              "focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "text-primary" : "text-foreground/70 hover:text-foreground",
            ].join(" ");

            const assignRef = (el: HTMLElement | null) => {
              itemRefs.current[idx] = el;
            };

            return (
              <li key={item.value} role="none" data-active={isActive ? "true" : undefined}>
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
      </div>
    </nav>
  );
}
