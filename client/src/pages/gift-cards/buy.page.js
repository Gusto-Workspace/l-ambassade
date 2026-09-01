import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import BuyGiftCardsComponent from "@/components/gift-cards/buy.gift-cards.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

export default function BuyGiftCardsPage({ seoRestaurantData = null }) {
  return (
    <>
      <SeoHeadComponent
        title="Commander une carte cadeau | L’Ambassade"
        description="Personnalisez et réglez votre carte cadeau L’Ambassade en ligne."
        path="/gift-cards/buy"
        image="/img/home/la-tablee.webp"
        noIndex
        restaurantData={seoRestaurantData}
      />
      <div className="ambassade-inner-page ambassade-gift-buy-page">
        <NavComponent scrolled />
        <main>
          <BuyGiftCardsComponent />
        </main>
        <FooterComponent />
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return buildStaticPageProps(locale, ["common", "gifts"]);
}
