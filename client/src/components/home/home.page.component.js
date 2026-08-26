import { useContext } from "react";
import { GlobalContext } from "@/contexts/global.context";
import HeroHomeSection from "./sections/hero.home.section";
import IntroductionHomeSection from "./sections/introduction.home.section";
import CuisineHomeSection from "./sections/cuisine.home.section";
import GardenHomeSection from "./sections/garden.home.section";
import TableeHomeSection from "./sections/tablee.home.section";
import EveningHomeSection from "./sections/evening.home.section";
import NewsHomeSection from "./sections/news.home.section";
import ReservationHomeSection from "./sections/reservation.home.section";

export default function HomePageComponent({ heroRef = null }) {
  const { restaurantContext } = useContext(GlobalContext);

  return (
    <main className="ambassade-home overflow-x-hidden">
      <HeroHomeSection heroRef={heroRef} />
      <IntroductionHomeSection />
      <NewsHomeSection restaurantData={restaurantContext?.restaurantData} />
      <CuisineHomeSection />
      <GardenHomeSection />
      <TableeHomeSection />
      <EveningHomeSection />
      <ReservationHomeSection />
    </main>
  );
}
