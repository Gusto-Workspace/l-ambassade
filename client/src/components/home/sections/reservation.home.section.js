import Link from "next/link";
import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";

export default function ReservationHomeSection({
  title = "Prenez place à L’Ambassade",
  buttonLabel = "Réserver une table",
  dark = false,
}) {
  return (
    <section className={`ambassade-reservation${dark ? " ambassade-reservation--dark" : ""}`} aria-labelledby="reservation-title">
      <RevealOnScrollComponent className="ambassade-reservation__content">
        <h2 id="reservation-title" className="ambassade-display ambassade-reservation__title">
          {title}
        </h2>
        <Link href="/reservations" className="ambassade-button ambassade-button--outline">
          {buttonLabel}
        </Link>
      </RevealOnScrollComponent>
    </section>
  );
}
