import { useContext, useEffect, useRef, useState } from "react";
import { GlobalContext } from "@/contexts/global.context";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import ListGiftCardsComponent from "@/components/gift-cards/list.gift-cards.component";
import { cleanStaleGiftCheckouts } from "@/_assets/utils/gift-cards.utils";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

export default function GiftCardsPage({ seoRestaurantData = null }) {
  const { restaurantContext } = useContext(GlobalContext);
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    cleanStaleGiftCheckouts(process.env.NEXT_PUBLIC_RESTAURANT_ID);
  }, []);

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
        title="Cartes cadeaux | L’Ambassade"
        description="Offrez une expérience à L’Ambassade, restaurant, bar et lounge à Montauban."
        path="/gift-cards"
        image="/img/home/la-tablee.webp"
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Cartes cadeaux", path: "/gift-cards" },
        ]}
        restaurantData={seoRestaurantData}
      />
      <div className="ambassade-inner-page">
        <NavComponent scrolled={scrolled} />
        <main>
          <InnerPageHeroComponent
            heroRef={heroRef}
            image="/img/home/la-tablee.webp"
            imagePosition="center 58%"
            title="Cartes cadeaux"
            tagline="Offrez bien plus qu’un dîner."
          />
          <ListGiftCardsComponent
            restaurant={restaurantContext?.restaurantData}
            dataLoading={restaurantContext?.dataLoading}
          />
        </main>
        <FooterComponent />
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return buildStaticPageProps(locale, ["common", "gifts"]);
}
