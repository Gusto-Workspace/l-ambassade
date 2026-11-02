import Head from "next/head";

// Each entry lists the actual pixel widths of the checked-in WebP files.
const PHOTO_WIDTHS = {
  "/img/home/header.webp": [768, 1440, 1920, 2172],
  "/img/home/le-feu.webp": [768, 1170],
  "/img/home/la-tablee.webp": [768, 1440, 2400],
  "/img/home/le-jardin.webp": [768, 1440, 2400],
  "/img/home/leaf.webp": [256, 512, 836],
  "/img/home/la-nuit.webp": [768, 1086],
  "/img/contact/header.webp": [768, 1440, 2400],
  "/img/contact/calm.webp": [768, 1200, 1440, 1920, 2400],
  "/img/news/header.webp": [768, 1440, 2400],
  "/img/menu/header.webp": [768, 1170],
  "/img/menu/separation.webp": [768, 1440, 2400],
};

export function hasStaticPhoto(src) {
  return Object.prototype.hasOwnProperty.call(PHOTO_WIDTHS, src);
}

export default function StaticPhoto({ src, alt, sizes, priority = false, className, style }) {
  const widths = PHOTO_WIDTHS[src];
  const path = (width) => width === widths[widths.length - 1] ? src : src.replace(/\.webp$/, `-${width}.webp`);
  const srcSet = widths.map((width) => `${path(width)} ${width}w`).join(", ");
  const fallback = path(widths[widths.length - 1]);

  return (
    <>
      {priority && <Head><link rel="preload" as="image" imageSrcSet={srcSet} imageSizes={sizes} fetchpriority="high" /></Head>}
      <img
        src={fallback}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
        style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent", ...style }}
      />
    </>
  );
}
