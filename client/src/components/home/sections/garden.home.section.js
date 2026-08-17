import Image from "next/image";
import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";

export default function GardenHomeSection() {
  return (
    <section className="ambassade-garden" aria-labelledby="garden-title">
      <div className="ambassade-container ambassade-garden__layout">
        <RevealOnScrollComponent variant="left" className="ambassade-garden__photo ambassade-garden__photo--veranda site-media-zoom">
          <Image
            src="/img/home/le-jardin.webp"
            alt="Salle sous la verrière entourée de plantes"
            fill
            sizes="(max-width: 767px) 100vw, 48vw"
            className="object-cover object-[center_44%]"
          />
        </RevealOnScrollComponent>

        <RevealOnScrollComponent variant="soft" className="ambassade-garden__photo ambassade-garden__photo--leaf site-media-zoom" aria-hidden="true">
          <Image src="/img/home/leaf.webp" alt="" fill sizes="(max-width: 767px) 100vw, 12vw" className="object-cover" />
        </RevealOnScrollComponent>

        <RevealOnScrollComponent
          variant="right"
          className="ambassade-garden__heading ambassade-descriptive-panel"
        >
          <h2 id="garden-title" className="ambassade-display ambassade-garden__title">
            Le Jardin
          </h2>
          <span className="ambassade-section-rule" aria-hidden="true">✦</span>
          <p className="ambassade-section-tagline">
            Une maison ouverte
            <br />
            sur le jardin.
          </p>
          <p className="ambassade-hover-description">
            À l’abri de la verrière ou au bord de la piscine, le jardin accompagne
            les déjeuners qui s’attardent.
          </p>
        </RevealOnScrollComponent>
      </div>
    </section>
  );
}
