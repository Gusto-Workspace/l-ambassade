import Image from "next/image";
import NavComponent from "@/components/_shared/nav/nav.component";
import FooterComponent from "@/components/_shared/footer/footer.component";

export default function ReservationFlowShell({ eyebrow, title, children }) {
  return (
    <div className="ambassade-flow-page">
      <NavComponent scrolled />
      <main className="ambassade-flow-main">
        <Image src="/img/reservations/header.jpg" alt="" fill priority sizes="100vw" className="ambassade-flow-main__image" />
        <div className="ambassade-flow-main__veil" />
        <section className="ambassade-flow-panel">
          <p className="ambassade-flow-panel__eyebrow">{eyebrow}</p>
          <h1 className="ambassade-display">{title}</h1>
          <span className="ambassade-flow-panel__ornament" aria-hidden="true"><i />✦<i /></span>
          {children}
        </section>
      </main>
      <FooterComponent />
    </div>
  );
}
