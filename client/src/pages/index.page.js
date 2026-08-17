import { useEffect, useRef, useState } from "react";

// COMPONENTS
import NavComponent from "@/components/_shared/nav/nav.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import HomePageComponent from "@/components/home/home.page.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

export default function HomePage({ seoRestaurantData = null }) {
  const heroRef = useRef(null);

  const [showScrolledNav, setShowScrolledNav] = useState(false);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // quand le hero est visible à moins de 5%
        setShowScrolledNav(entry.intersectionRatio <= 0.1);
      },
      {
        threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    observer.observe(heroEl);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SeoHeadComponent
        title="L’Ambassade | Restaurant, bar & lounge à Montauban"
        description="Découvrez L’Ambassade à Montauban : une cuisine généreuse, un jardin avec piscine et une atmosphère vivante du déjeuner à la soirée."
        path="/"
        image="/img/home/header.webp"
        breadcrumbs={[{ name: "Accueil", path: "/" }]}
        restaurantData={seoRestaurantData}
      />

      <div className="relative">
        <NavComponent scrolled={showScrolledNav} />

        <HomePageComponent heroRef={heroRef} />
        <FooterComponent />
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return buildStaticPageProps(locale, ["common"]);
}
