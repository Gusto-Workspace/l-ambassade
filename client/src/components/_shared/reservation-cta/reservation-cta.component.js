import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import RevealOnScrollComponent from "../motion/reveal-on-scroll.component";

function buildTelHref(phone) {
  const formatted = String(phone || "").replace(/[^\d+]/g, "");
  return formatted ? `tel:${formatted}` : "/contact";
}

function formatPhoneNumber(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("+")) {
    return digits;
  }

  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export default function ReservationCtaComponent({
  phone = "",
  phoneLabel = "",
  subtitle = "Réservez dès maintenant !",
  className = "",
}) {
  const displayedPhone = phoneLabel || formatPhoneNumber(phone) || "Nous contacter";

  return (
    <section
      className={`relative isolate overflow-hidden bg-black px-5 py-10 text-white tablet:px-8 desktop:px-12 desktop:py-16 ${className}`}
    >
      <div className="absolute inset-0">
        <Image
          src="/img/home/header.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-72"
        />
      </div>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.54)]" />

      <div className="relative mx-auto flex max-w-[1680px] flex-col gap-8 desktop:flex-row desktop:items-center desktop:justify-between">
        <RevealOnScrollComponent variant="left">
          <h2 className="yeseva-one-regular max-w-[18ch] text-[54px] uppercase leading-[0.84] text-white tablet:text-[52px] desktop:text-[66px]">
            Une table
            <br />
            vous attend.
          </h2>
          <svg
            className="mt-4 h-[22px] w-[240px] tablet:w-[280px]"
            viewBox="0 0 280 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 18C73 9 146 7 276 12"
              stroke="#1D633F"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          {subtitle ? (
            <p className="kalam-font mt-2 text-[24px] leading-[1.2] text-white">
              {subtitle}
            </p>
          ) : null}
        </RevealOnScrollComponent>

        <RevealOnScrollComponent
          delay={120}
          variant="right"
          className="flex flex-col gap-4 tablet:flex-row"
        >
          <Link
            href="/reservations"
            className="inline-flex min-h-[64px] min-w-[220px] items-center justify-center bg-[var(--site-orange)] px-8 text-[15px] font-semibold uppercase tracking-[0.12em] text-white"
          >
            Réserver
          </Link>
          <a
            href={buildTelHref(phone)}
            className="inline-flex min-h-[64px] min-w-[280px] items-center justify-center gap-3 border border-white/80 bg-[rgba(0,0,0,0.24)] px-8 text-[16px] font-semibold tracking-[0.03em] text-white"
          >
            <Phone size={18} strokeWidth={2} />
            {displayedPhone}
          </a>
        </RevealOnScrollComponent>
      </div>
    </section>
  );
}
