import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";
import { ColumnEmblem, StarOrnament } from "../ornament.home.component";

export default function IntroductionHomeSection() {
  return (
    <section id="la-maison" className="ambassade-intro" aria-labelledby="intro-title">
      <div className="ambassade-container ambassade-intro__grid">
        <RevealOnScrollComponent className="ambassade-intro__copy">
          <ColumnEmblem />
          <h2 id="intro-title" className="ambassade-display ambassade-intro__title">
            Une maison où
            <br />
            le repas se prolonge.
          </h2>
          <StarOrnament />
        </RevealOnScrollComponent>

        <RevealOnScrollComponent variant="right" className="ambassade-intro__text">
          <p>
            À L’Ambassade, nous cultivons une cuisine généreuse et sincère, portée par
            le feu, les saisons et le plaisir de partager une belle table.
          </p>
          <p>
            Nous privilégions une cuisine réalisée sur place à partir de produits
            bruts et de produits artisanaux soigneusement sélectionnés. Inspirée de
            différents horizons, elle puise dans les traditions, les rencontres et
            les souvenirs qui donnent du sens aux bons repas.
          </p>
          <p>
            Chaque assiette reflète l’engagement de toute notre équipe, avec l’envie
            de vous accueillir chaleureusement et de partager un moment de convivialité.
          </p>
          <p>Bienvenue à notre table.</p>
        </RevealOnScrollComponent>
      </div>
    </section>
  );
}
