import Link from "next/link";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";

export default function NotFoundPage() {
  return <><SeoHeadComponent title="Page introuvable | L’Ambassade" description="La page demandée est introuvable." path="/404" image="/img/home/header.png" noIndex />
    <main className="ambassade-inner-page"><NavComponent /><InnerPageHeroComponent image="/img/home/header.png" title="Page introuvable" tagline="Cette page n’est plus à la carte." />
      <section className="ambassade-not-found"><span>404</span><h2 className="ambassade-display">Reprenons le bon chemin.</h2><p>L’adresse demandée est introuvable ou a changé.</p><div><Link href="/" className="ambassade-button ambassade-button--copper">Retour à l’accueil</Link><Link href="/menus" className="ambassade-button ambassade-button--outline">Voir la carte</Link></div></section>
    </main><FooterComponent /></>;
}
