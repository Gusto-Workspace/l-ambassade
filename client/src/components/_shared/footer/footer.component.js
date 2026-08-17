import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import { Instagram } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import { getSocialLinks } from "@/_assets/utils/site-display.utils";
import {
  buildContactInfos,
  buildContactSchedules,
  formatContactDayRange,
  groupContactSchedules,
} from "@/_assets/utils/contact.utils";

export default function FooterComponent() {
  const { restaurantContext } = useContext(GlobalContext);
  const restaurantData = restaurantContext?.restaurantData;
  const instagram = getSocialLinks(restaurantData).find(
    (item) => item.icon === "instagram" && item.href,
  );
  const address = buildContactInfos(restaurantData).find((item) => item.key === "address");
  const scheduleGroups = groupContactSchedules(buildContactSchedules(restaurantData));

  return (
    <footer className="ambassade-footer">
      <div className="ambassade-container ambassade-footer__grid">
        <div className="ambassade-footer__brand">
          <Link href="/" aria-label="Accueil — L’Ambassade">
            <span className="ambassade-footer__mark">
              <Image
                src="/img/_shared/logo-bg-transparent.webp"
                alt=""
                fill
                sizes="72px"
                className="object-contain"
              />
            </span>
            <span>
              <strong>L’Ambassade</strong>
              <small>Restaurant · Bar · Lounge</small>
            </span>
          </Link>
          <p>{address?.value || "20 avenue de Gasseras — Montauban"}</p>
        </div>

        <nav className="ambassade-footer__links" aria-label="Navigation de pied de page">
          <Link href="/">Accueil</Link>
          <Link href="/menus">Carte & menus</Link>
          <Link href="/news">Actualités</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="ambassade-footer__social">
          <p>Suivez-nous</p>
          {instagram ? (
            <a href={instagram.href} target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram size={22} strokeWidth={1.5} />
            </a>
          ) : (
            <span aria-label="Instagram">
              <Instagram size={22} strokeWidth={1.5} />
            </span>
          )}
        </div>

        <div className="ambassade-footer__hours">
          <p>Horaires</p>
          {scheduleGroups.length ? scheduleGroups.map((group) => (
            <div key={`${group.days[0]}-${group.hours}`} className="ambassade-footer__schedule">
              <strong>{formatContactDayRange(group.days)}</strong>
              <span>{group.hours}</span>
            </div>
          )) : <span>Horaires à venir</span>}
        </div>
      </div>

      <div className="ambassade-footer__bottom">
        <div className="ambassade-container">
          <p>© {new Date().getFullYear()} L’Ambassade</p>
          <div>
            <Link href="/legales">Mentions légales</Link>
            <Link href="/policy">Confidentialité</Link>
            <a href="https://gusto-manager.com" target="_blank" rel="noreferrer">
              Propulsé par Gusto Manager
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
