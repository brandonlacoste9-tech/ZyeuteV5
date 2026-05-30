/**
 * Resolves imports of `@/components/ui/avatar` on case-sensitive filesystems (e.g. Vercel/Linux).
 * shadcn-style compound API backed by {@link Avatar} from `./Avatar`.
 */
import React from "react";
import {
  Avatar as ZyeuteAvatar,
  AvatarGroup,
} from "./Avatar";
import type { AvatarProps } from "./Avatar";

export { AvatarGroup };
export type { AvatarProps };

export function AvatarImage(_props: { src?: string; className?: string }) {
  return null;
}

export function AvatarFallback(_props: {
  className?: string;
  children?: React.ReactNode;
}) {
  return null;
}

export function Avatar({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  let src: string | undefined;
  let fallbackLabel = "User";

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === AvatarImage) {
      src = (child.props as { src?: string }).src ?? undefined;
    }
    if (child.type === AvatarFallback) {
      const ch = (child.props as { children?: React.ReactNode }).children;
      if (typeof ch === "string" && ch.trim()) fallbackLabel = ch.trim();
    }
  });

  return (
    <ZyeuteAvatar
      src={src}
      alt={fallbackLabel}
      size="sm"
      className={className}
    />
  );
}
