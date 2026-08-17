import { useEffect, useRef, useState } from "react";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import ListNewsComponent from "@/components/news/list.news.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

export default function NewsPage({ seoRestaurantData = null }) {
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
        title="Actualités | L’Ambassade"
        description="Les rendez-vous et les nouveautés de L’Ambassade."
        path="/news"
        image="/img/news/header.jpg"
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Actualités", path: "/news" },
        ]}
        restaurantData={seoRestaurantData}
      />
      <div className="ambassade-inner-page">
        <NavComponent scrolled={scrolled} />
        <main>
          <InnerPageHeroComponent
            heroRef={heroRef}
            image="/img/news/header.jpg"
            imagePosition="center 60%"
            title="Actualités"
            tagline="À table, au jardin, au fil des saisons."
          />
          <ListNewsComponent />
        </main>
        <FooterComponent />
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return buildStaticPageProps(locale, ["common"]);
}
