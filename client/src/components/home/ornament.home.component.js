import Image from "next/image";

export function ColumnEmblem({ light = false }) {
  return (
    <span
      className={`ambassade-column-emblem${light ? " ambassade-column-emblem--light" : ""}`}
      aria-hidden="true"
    >
      <Image
        src="/img/_shared/logo-bg-transparent.webp"
        alt=""
        fill
        sizes="48px"
        className="object-contain"
      />
    </span>
  );
}

export function StarOrnament({ light = false }) {
  return (
    <span
      className={`ambassade-star-ornament${light ? " ambassade-star-ornament--light" : ""}`}
      aria-hidden="true"
    >
      <span />
      <b>✦</b>
      <span />
    </span>
  );
}
