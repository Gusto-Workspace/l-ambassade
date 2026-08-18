import Image from "next/image";
import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";

export default function EveningHomeSection() {
  return (
    <section className="ambassade-evening" aria-labelledby="evening-title">
      <div className="ambassade-container ambassade-evening__layout">
        <RevealOnScrollComponent variant="left" className="ambassade-evening__media site-media-zoom">
          <Image
            src="/img/home/la-nuit.webp"
            alt="Verres et planche à partager dans le jardin en soirée"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover object-[center_54%]"
          />
        </RevealOnScrollComponent>

        <RevealOnScrollComponent
          variant="right"
          className="ambassade-evening__copy ambassade-descriptive-panel"
        >
          <h2 id="evening-title" className="ambassade-display ambassade-evening__title">
            La Nuit
          </h2>
          <span className="ambassade-section-rule" aria-hidden="true">✦</span>
          <p className="ambassade-section-tagline">
            Quand la table laisse
            <br />
            place à la soirée.
          </p>
          <p className="ambassade-hover-description">
            À la nuit tombée, L’Ambassade devient un bar à cocktails animé par
            des DJ sets, où l’on vient aussi pour danser. La soirée est ouverte
            à tous, sans réservation et sans être client du restaurant. Tenue
            correcte exigée.
          </p>
        </RevealOnScrollComponent>
      </div>
    </section>
  );
}
