import Image from "next/image";
import Link from "next/link";
import { StarOrnament } from "../ornament.home.component";

export default function HeroHomeSection({ heroRef = null }) {
  return (
    <section ref={heroRef} className="ambassade-hero" aria-labelledby="home-hero-title">
      <Image
        src="/img/home/header.png"
        alt="Jardin, piscine et maison de L’Ambassade à Montauban"
        fill
        priority
        sizes="100vw"
        className="ambassade-hero__image"
      />
      <div className="ambassade-hero__veil" />

      <div className="ambassade-container ambassade-hero__content">
        <h1 id="home-hero-title" className="ambassade-display ambassade-hero__title">
          L’Ambassade
        </h1>
        <p className="ambassade-hero__signature">Restaurant · Bar · Lounge</p>
        <StarOrnament light />
        <p className="ambassade-display ambassade-hero__promise">
          À table, au jardin,
          <br />
          jusqu’à la nuit.
        </p>
        <div className="ambassade-hero__actions">
          <Link href="/reservations" className="ambassade-button ambassade-button--copper">
            Réserver une table
          </Link>
          <Link href="/menus" className="ambassade-button ambassade-button--light">
            Découvrir la carte
          </Link>
        </div>
      </div>
    </section>
  );
}
