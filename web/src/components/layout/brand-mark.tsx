import Image from "next/image";
import { clsx } from "clsx";

/** The institutional JBIT logo (public/assets/jbit-logo-512.png). */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/assets/jbit-logo-512.png"
      alt="JBIT logo"
      width={size}
      height={size}
      priority
      className={clsx("shrink-0 object-contain", className)}
    />
  );
}
