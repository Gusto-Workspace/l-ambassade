import Image from "next/image";
import RevealOnScrollComponent from "../motion/reveal-on-scroll.component";
import { StarOrnament } from "../../home/ornament.home.component";

export default function InnerPageHeroComponent({
  heroRef = null,
  image,
  title,
  location = "L’Ambassade — Montauban",
  tagline,
  actionLabel = "",
  actionHref = "",
  imagePosition = "center",
  compact = false,
}) {
  return (
    <section
      ref={heroRef}
      className={`ambassade-subhero${compact ? " ambassade-subhero--compact" : ""}`}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="ambassade-subhero__image"
        style={{ objectPosition: imagePosition }}
      />
      <div className="ambassade-subhero__veil" />

      <RevealOnScrollComponent className="ambassade-subhero__content">
        <h1 className="ambassade-display ambassade-subhero__title">{title}</h1>
        <p className="ambassade-subhero__location">{location}</p>
        <StarOrnament light />
        {tagline ? <p className="ambassade-subhero__tagline">{tagline}</p> : null}
        {actionLabel && actionHref ? (
          <a href={actionHref} className="ambassade-subhero__action">
            {actionLabel}
          </a>
        ) : null}
      </RevealOnScrollComponent>
    </section>
  );
}
