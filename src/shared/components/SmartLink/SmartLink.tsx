"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type AnchorHTMLAttributes, type ReactNode } from "react";

/**
 * SmartLink - drop-in replacement for next/link that:
 *  - schedules `router.prefetch(href)` on `mouseenter` after a small debounce
 *    (default 80 ms), so a quick mouse pass over a card does not trigger N
 *    prefetches;
 *  - cancels the prefetch on `mouseleave`;
 *  - fires an immediate `router.prefetch` on `touchstart`, since mobile users
 *    cannot hover - the tap is usually within ~100 ms of the touch.
 *
 * Why a wrapper instead of using next/link's `prefetch={true}` (its default):
 *  Next prefetches in-viewport links anyway; this component layers an
 *  intent-based prefetch on top so PDPs that the user is about to click
 *  are warm even when they were below the fold. The added JS is < 1 KB.
 *
 * SRP: this component owns intent prefetching. Nothing else.
 */

type SmartLinkProps = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    prefetchDelay?: number;
    children: ReactNode;
  };

export function SmartLink({
  href,
  prefetchDelay = 80,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  children,
  ...rest
}: SmartLinkProps) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.prefetch(href), prefetchDelay);
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
      }}
      onTouchStart={(e) => {
        onTouchStart?.(e);
        router.prefetch(href);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
