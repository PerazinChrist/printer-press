import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Boutons de la plateforme.
 *
 * Trois variantes seulement. La principale est magenta : c'est la couleur la
 * plus saturée du logo, et elle n'est employée nulle part ailleurs — sur chaque
 * écran, l'action qui fait avancer se trouve donc sans réfléchir.
 */

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-magenta text-white shadow-[0_10px_30px_-12px_rgba(236,0,140,0.8)] hover:bg-magenta-dark",
  secondary: "bg-ink text-white hover:bg-ink-700",
  ghost: "border border-line bg-white text-ink hover:border-ink-300",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

function classes(variant: Variant, size: Size, extra = ""): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(" ");
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classes(variant, size, className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
