import Image from "next/image";

interface GameLogoProps {
  /** Container dimensions and positioning classes. */
  className?: string;
  /** Additional classes applied to the Image element. */
  imageClassName?: string;
  /** Responsive sizes hint for Next.js Image optimization. */
  sizes?: string;
  alt?: string;
  priority?: boolean;
}

/** Renders the official Valkyria of Veyra logo inside a relative container. */
export default function GameLogo({
  className = "w-10 h-10",
  imageClassName = "",
  sizes = "96px",
  alt = "Valkyria of Veyra Logo",
  priority = false,
}: GameLogoProps) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <Image
        src="/images/logo_vov.png"
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain ${imageClassName}`}
      />
    </div>
  );
}
