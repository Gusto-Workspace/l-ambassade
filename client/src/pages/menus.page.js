import { useEffect, useRef, useState } from "react";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import ListMenusComponent from "@/components/menus/list.menus.component";
import ReservationHomeSection from "@/components/home/sections/reservation.home.section";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

export default function MenusPage({ seoRestaurantData = null }) {
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(entry.intersectionRatio <= 0.1),
      { threshold: [0, 0.1, 0.5, 1] },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SeoHeadComponent
        title="Carte & menus | L’Ambassade"
        description="Découvrez la carte actuelle de L’Ambassade à Montauban."
        path="/menus"
        image="/img/menu/header.webp"
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Carte & menus", path: "/menus" },
        ]}
        restaurantData={seoRestaurantData}
      />

      <div className="ambassade-inner-page">
        <NavComponent scrolled={scrolled} />
        <main>
          <InnerPageHeroComponent
            heroRef={heroRef}
            image="/img/menu/header.webp"
            imagePosition="center 66%"
            title="Carte & menus"
            tagline="Une cuisine vivante, généreuse et faite sur place."
            actionLabel="Découvrir la carte"
            actionHref="#menu-content"
          />
          <ListMenusComponent />
          <ReservationHomeSection />
        </main>
        <FooterComponent />
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return buildStaticPageProps(locale, ["common"]);
}
