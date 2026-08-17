import { useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, MapPin, Phone, Users } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";
import InnerPageHeroComponent from "@/components/_shared/inner-page-hero/inner-page-hero.component";
import EditorialHeadingComponent from "@/components/_shared/editorial-heading/editorial-heading.component";
import FormContactCompnent from "@/components/contact/form.contact.component";
import ReservationHomeSection from "@/components/home/sections/reservation.home.section";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import { buildStaticPageProps } from "@/_assets/utils/page-props.utils";
import { buildContactInfos, getMapEmbedSrc } from "@/_assets/utils/contact.utils";

export default function ContactPage({ seoRestaurantData = null }) {
  const { restaurantContext } = useContext(GlobalContext);
  const restaurant = restaurantContext?.restaurantData;
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const infos = buildContactInfos(restaurant);
  const address = infos.find((item) => item.key === "address");
  const phone = infos.find((item) => item.key === "phone");
  const email = infos.find((item) => item.key === "email");
  const mapSrc = getMapEmbedSrc(restaurant);

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
    <SeoHeadComponent title="Contact | L’Ambassade" description="Contactez L’Ambassade et préparez votre venue à Montauban." path="/contact" image="/img/contact/header.jpg" restaurantData={seoRestaurantData} />
    <main className="ambassade-inner-page">
      <NavComponent scrolled={scrolled} />
      <InnerPageHeroComponent heroRef={heroRef} image="/img/contact/header.jpg" imagePosition="center 48%" title="Contact & accès" tagline="Une question, une envie ? Écrivez-nous." />
      <section className="ambassade-contact-intro">
        <EditorialHeadingComponent title="Parlons de votre venue." description="Notre équipe vous répond pour toute question, demande particulière ou projet de groupe." />
        <div className="ambassade-contact-grid">
          <div><h2 className="ambassade-contact-small-title">Nous écrire</h2><FormContactCompnent /></div>
          <aside className="ambassade-contact-card">
            <h2 className="ambassade-contact-small-title">Nous trouver</h2>
            <ContactLine icon={MapPin} title="L’Ambassade" text={address?.value} />
            <ContactLine icon={Phone} title="Nous appeler" href={phone?.href} text={phone?.value} />
            <ContactLine icon={Mail} title="Nous écrire" href={email?.href} text={email?.value} />
            <ContactLine icon={Clock3} title="Horaires" text="Du mardi au dimanche · Horaires à venir" />
            <div className="ambassade-contact-divider" />
            <ContactLine icon={Users} title="Groupes & privatisation" text="Pour vos grandes tables et événements, contactez directement notre équipe." />
          </aside>
        </div>
      </section>
      <section className="ambassade-contact-map">
        <div className="ambassade-contact-map__frame">{mapSrc ? <iframe title="Plan d’accès à L’Ambassade" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <span>Montauban</span>}</div>
        <div className="ambassade-contact-map__visit">
          <div className="ambassade-contact-map__image"><Image src="/img/contact/calm.jpg" alt="Les extérieurs de L’Ambassade" fill sizes="(max-width: 767px) 100vw, 55vw" className="object-cover" /></div>
          <EditorialHeadingComponent title="Au calme, à Montauban." description="Un lieu à part, à quelques minutes du centre-ville." />
          <div className="ambassade-contact-map__actions"><a className="ambassade-button ambassade-button--outline" href={mapSrc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address?.value || "L'Ambassade Montauban")}` : "#"} target="_blank" rel="noreferrer">Ouvrir l’itinéraire</a><Link className="ambassade-button ambassade-button--outline" href="/reservations">Réserver une table</Link></div>
        </div>
      </section>
      <ReservationHomeSection title="On vous garde une table ?" buttonLabel="Réserver" dark />
    </main>
    <FooterComponent />
  </>;
}

function ContactLine({ icon: Icon, title, text, href }) {
  const content = <><strong>{title}</strong><span>{text || "À venir"}</span></>;
  return <div className="ambassade-contact-line"><Icon size={30} strokeWidth={1.25} />{href ? <a href={href}>{content}</a> : <div>{content}</div>}</div>;
}

export async function getStaticProps({ locale }) { return buildStaticPageProps(locale, ["common"]); }
