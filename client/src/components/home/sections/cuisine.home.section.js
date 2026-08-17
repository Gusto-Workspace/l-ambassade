import Image from "next/image";
import Link from "next/link";
import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";

export default function CuisineHomeSection() {
  return (
    <section className="ambassade-cuisine" aria-labelledby="cuisine-title">
      <div className="ambassade-container ambassade-cuisine__layout">
        <RevealOnScrollComponent className="ambassade-cuisine__copy">
          <h2 id="cuisine-title" className="ambassade-display ambassade-cuisine__title">
            Le Feu
          </h2>
          <span className="ambassade-section-rule" aria-hidden="true">✦</span>
          <p className="ambassade-section-tagline">
            Une cuisine vivante,
            <br />
            au rythme des braises.
          </p>
          <Link href="/menus" className="ambassade-arrow-link">
            Découvrir la carte <span aria-hidden="true">→</span>
          </Link>
        </RevealOnScrollComponent>

        <RevealOnScrollComponent variant="soft" className="ambassade-cuisine__media site-media-zoom">
          <Image
            src="/img/home/le-feu.webp"
            alt="Assiette de saison servie au bord de la piscine"
            fill
            sizes="(max-width: 767px) 100vw, 58vw"
            className="object-cover object-[center_56%]"
          />
        </RevealOnScrollComponent>

      </div>
    </section>
  );
}
