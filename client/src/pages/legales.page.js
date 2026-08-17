import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import ReservationHomeSection from "@/components/home/sections/reservation.home.section";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

const sections = [
  ["Éditeur du site", <>Le présent site est édité pour le restaurant <strong>L’Ambassade</strong>, situé 20 avenue de Gasseras à Montauban. Les informations administratives définitives de l’exploitant seront complétées avant la mise en production.</>],
  ["Direction de la publication", <>La direction de la publication est assurée par la personne ou la société chargée de l’exploitation du restaurant L’Ambassade.</>],
  ["Hébergement", <>Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.</>],
  ["Objet du site", <>Le site présente le restaurant, sa carte, ses actualités, ses informations pratiques ainsi que ses services de contact et de réservation.</>],
  ["Propriété intellectuelle", <>Les textes, photographies, logos, éléments graphiques et développements présents sur ce site sont protégés. Toute reproduction ou exploitation sans autorisation préalable est interdite.</>],
  ["Responsabilité", <>Les informations peuvent évoluer. L’Ambassade s’efforce d’en assurer l’exactitude mais ne garantit pas l’absence d’erreur ou l’accès permanent au service.</>],
  ["Données personnelles", <>Les traitements liés aux formulaires de contact et de réservation sont détaillés dans la politique de confidentialité accessible depuis le pied de page.</>],
];

export default function LegalesPage({ seoRestaurantData = null }) {
  return <>
    <SeoHeadComponent title="Mentions légales | L’Ambassade" description="Mentions légales du site L’Ambassade." path="/legales" image="/img/home/header.webp" restaurantData={seoRestaurantData} />
    <main className="ambassade-inner-page"><NavComponent /><InnerPageHeroComponent image="/img/home/header.webp" title="Mentions légales" tagline="Informations, cadre & usage." />
      <section className="ambassade-legal"><p className="ambassade-legal__intro">Les informations administratives, techniques et juridiques liées au site.</p>{sections.map(([title, body]) => <article key={title}><h2>{title}</h2><p>{body}</p></article>)}</section>
      <ReservationHomeSection dark title="On vous garde une table ?" buttonLabel="Réserver" />
    </main><FooterComponent />
  </>;
}
export async function getStaticProps({ locale }) { return buildStaticPageProps(locale, ["common"]); }
