import HeroHomeSection from "./sections/hero.home.section";
import IntroductionHomeSection from "./sections/introduction.home.section";
import CuisineHomeSection from "./sections/cuisine.home.section";
import GardenHomeSection from "./sections/garden.home.section";
import TableeHomeSection from "./sections/tablee.home.section";
import EveningHomeSection from "./sections/evening.home.section";
import ReservationHomeSection from "./sections/reservation.home.section";

export default function HomePageComponent({ heroRef = null }) {
  return (
    <main className="ambassade-home overflow-x-hidden">
      <HeroHomeSection heroRef={heroRef} />
      <IntroductionHomeSection />
      <CuisineHomeSection />
      <GardenHomeSection />
      <TableeHomeSection />
      <EveningHomeSection />
      <ReservationHomeSection />
    </main>
  );
}
