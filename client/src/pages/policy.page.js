import Link from "next/link";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

const sections = [
  ["Responsable du traitement", <>Le responsable du traitement est l’exploitant du restaurant L’Ambassade. Vous pouvez exercer vos droits depuis la <Link href="/contact">page contact</Link>.</>],
  ["Données collectées", <>Le formulaire de contact peut recueillir vos nom, e-mail, téléphone, objet et message. La réservation recueille les informations nécessaires à la gestion de votre table : identité, coordonnées, date, horaire, convives et commentaire éventuel.</>],
  ["Finalités", <>Ces données servent uniquement à répondre aux demandes, gérer et confirmer les réservations, sécuriser le parcours et assurer le fonctionnement technique du site.</>],
  ["Base juridique", <>Les traitements reposent selon le cas sur l’exécution de mesures précontractuelles, l’exécution du service demandé, le respect d’obligations légales ou l’intérêt légitime de l’établissement.</>],
  ["Destinataires et conservation", <>Les données sont accessibles aux équipes habilitées et aux prestataires techniques strictement nécessaires. Elles sont conservées pendant une durée proportionnée à leur finalité et aux obligations légales.</>],
  ["Vos droits", <>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou l’opposition au traitement de vos données, ainsi que leur portabilité lorsque ce droit s’applique.</>],
  ["Cookies", <>Le site utilise uniquement les traceurs nécessaires à son fonctionnement, sauf activation explicite de services complémentaires nécessitant votre accord.</>],
];

export default function PolicyPage({ seoRestaurantData = null }) {
  return <><SeoHeadComponent title="Politique de confidentialité | L’Ambassade" description="Politique de confidentialité du site L’Ambassade." path="/policy" image="/img/home/header.png" restaurantData={seoRestaurantData} />
    <main className="ambassade-inner-page"><NavComponent /><InnerPageHeroComponent image="/img/home/header.png" title="Confidentialité" tagline="Données, transparence & droits." />
      <section className="ambassade-legal"><p className="ambassade-legal__intro">Les traitements décrits correspondent aux fonctionnalités actuellement proposées sur le site.</p>{sections.map(([title, body]) => <article key={title}><h2>{title}</h2><p>{body}</p></article>)}</section>
    </main><FooterComponent /></>;
}
export async function getStaticProps({ locale }) { return buildStaticPageProps(locale, ["common"]); }
