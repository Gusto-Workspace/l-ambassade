import { useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Feather, MessageCircle, Users } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import AmbassadeBookingComponent from "@/components/reservations/ambassade-booking.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";

export default function ReservationsPage({ seoRestaurantData = null }) {
  const { restaurantContext } = useContext(GlobalContext);
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
  return <>
    <SeoHeadComponent title="Réserver | L’Ambassade" description="Réservez votre table à L’Ambassade à Montauban." path="/reservations" image="/img/reservations/header.jpg" restaurantData={seoRestaurantData} />
    <main className="ambassade-inner-page">
      <NavComponent scrolled={scrolled} />
      <InnerPageHeroComponent heroRef={heroRef} image="/img/reservations/header.jpg" imagePosition="center 48%" title="Réserver une table" tagline="Choisissez votre moment, nous nous occupons du reste." />
      <AmbassadeBookingComponent apiBaseUrl={process.env.NEXT_PUBLIC_API_URL} restaurant={restaurantContext.restaurantData} dataLoading={restaurantContext.dataLoading} />
      <section className="ambassade-booking-notes">
        <BookingNote icon={Users} title="Groupes">Pour les tables de plus de 10 personnes, contactez-nous directement.</BookingNote>
        <BookingNote icon={Feather} title="Demande particulière">Allergies, accessibilité ou occasion spéciale : précisez-le lors de votre réservation.</BookingNote>
        <BookingNote icon={Clock3} title="Retard">En cas de retard, pensez à prévenir notre équipe.</BookingNote>
      </section>
      <section className="ambassade-booking-discover">
        <div><Image src="/img/reservations/discover.jpg" alt="Le jardin et la piscine de L’Ambassade" fill sizes="(max-width: 767px) 100vw, 52vw" className="object-cover" /></div>
        <article><h2 className="ambassade-display">Une table, un jardin,<br />et le temps de rester.</h2><p>Déjeuner sous la verrière, dîner dans le jardin ou prolonger la soirée autour d’un verre : choisissez simplement votre moment.</p><Link href="/" className="ambassade-button ambassade-button--outline">Découvrir le lieu →</Link></article>
      </section>
      <section className="ambassade-booking-question"><MessageCircle size={50} strokeWidth={1.15} /><div><h2 className="ambassade-display">Une question avant de réserver ?</h2><p>Notre équipe reste à votre disposition.</p><Link href="/contact" className="ambassade-button ambassade-button--light">Nous contacter</Link></div></section>
    </main>
    <FooterComponent />
  </>;
}

function BookingNote({ icon: Icon, title, children }) { return <article><Icon size={40} strokeWidth={1.2} /><h3>{title}</h3><p>{children}</p></article>; }

export async function getStaticProps({ locale }) { return buildStaticPageProps(locale, ["common"]); }
