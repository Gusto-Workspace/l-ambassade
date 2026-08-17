import { useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CarFront,
  GlassWater,
  MapPin,
  Sparkles,
  Users,
  Wine,
} from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import { buildContactInfos, getMapEmbedSrc } from "../../_assets/utils/contact.utils";

export default function MapContactComponent() {
  const { restaurantContext } = useContext(GlobalContext);
  const restaurantData = restaurantContext?.restaurantData;
  const dataLoading = restaurantContext?.dataLoading;
  const infos = buildContactInfos(restaurantData);
  const mapSrc = getMapEmbedSrc(restaurantData);
  const addressInfo = infos.find((item) => item.key === "address");

  return (
    <section className="bg-[var(--site-cream)] px-0 pb-0 pt-10 tablet:pt-12 desktop:pt-14">
      <div className="grid gap-0 desktop:grid-cols-[1fr_0.88fr] desktop:items-stretch">
        <RevealOnScrollComponent
          variant="left"
          className="relative overflow-hidden border-t border-[rgba(20,72,47,0.12)] bg-[#ebe4d7] desktop:h-full"
        >
          <div className="relative h-[340px] tablet:h-[420px] desktop:h-full desktop:min-h-[580px]">
            <div className="absolute inset-0 bg-[#ebe4d7]" />
              {dataLoading ? (
                <div className="h-full animate-pulse bg-[rgba(20,72,47,0.08)]" />
              ) : mapSrc ? (
                <>
                  <iframe
                    title="map"
                    src={mapSrc}
                    className="h-full w-full border-0 [filter:grayscale(1)_sepia(0.2)_hue-rotate(-10deg)_saturate(0.8)_brightness(1.04)]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,241,232,0.12)_0%,rgba(29,99,63,0.06)_100%)]" />
                  <div className="absolute left-[52%] top-[45%] flex h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[999px] bg-[var(--site-orange-deep)] shadow-[0_18px_40px_rgba(20,72,47,0.34)]">
                    <div className="relative h-[52px] w-[42px]">
                      <Image
                        src="/img/_shared/logo-bg-black.webp"
                        alt="L’Ambassade"
                        fill
                        sizes="42px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-[15px] text-[var(--site-ink-soft)]">
                  Carte indisponible pour le moment.
                </div>
              )}
          </div>
        </RevealOnScrollComponent>

        <RevealOnScrollComponent
          delay={120}
          variant="right"
          className="relative border-t border-[rgba(20,72,47,0.12)] bg-[var(--site-cream)] px-5 py-12 tablet:px-8 desktop:px-12 desktop:py-16"
        >
          <div className="flex items-center gap-3">
            <h2 className="yeseva-one-regular text-[48px] uppercase leading-[0.94] tracking-[-0.04em] text-[var(--site-ink)] tablet:text-[64px]">
              Nous trouver
            </h2>
            <div className="relative h-6 w-10 rotate-[30deg]">
              <Image
                src="/img/_shared/logo-bg-white.webp"
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-8 space-y-7">
            <FindingItem
              icon={MapPin}
              title="Accès facile"
              text={`Situé en plein centre-ville de Montauban, à deux pas des lieux de vie du quartier.${addressInfo?.value ? ` ${addressInfo.value}.` : ""}`}
            />
            <FindingItem
              icon={CarFront}
              title="Parking à proximité"
              text="Plusieurs solutions de stationnement sont accessibles à quelques minutes à pied pour rejoindre le restaurant sereinement."
            />
            <FindingItem
              icon={GlassWater}
              title="Terrasse & ambiance"
              text="Profitez de la terrasse, de l’esprit tapas et d’une atmosphère conviviale du midi jusqu’au soir."
            />
          </div>
        </RevealOnScrollComponent>
      </div>

      <RevealOnScrollComponent delay={180} className="overflow-hidden">
        <div className="grid desktop:grid-cols-[1fr_2fr]">
          <div className="relative min-h-[280px] desktop:min-h-[360px]">
              <Image
                src="/img/home/la-tablee.webp"
                alt="Groupes et événements à L’Ambassade"
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
          </div>

          <div className="relative bg-[var(--site-orange-deep)] px-7 py-10 text-white tablet:px-10 tablet:py-12 desktop:px-10 desktop:py-12">
            <div className="grid gap-10 desktop:grid-cols-[1.05fr_0.95fr] desktop:items-start">
              <div className="max-w-[520px]">
                <h2 className="yeseva-one-regular text-[34px] uppercase leading-[0.96] tracking-[-0.03em] text-[var(--site-cream)] tablet:text-[42px] desktop:text-[40px]">
                  Groupes & événements privés
                </h2>
                <p className="mt-4 max-w-[460px] text-[17px] leading-[1.7] text-white/90 tablet:text-[19px] desktop:text-[18px]">
                  Anniversaire, afterwork, repas d’entreprise ou soirée entre
                  amis ? Nous proposons des formules sur mesure pour tous vos
                  événements.
                </p>

                <Link
                  href="#contact-form"
                  className="site-button mt-7 inline-flex desktop:min-h-[54px] desktop:px-8 desktop:text-[12px]"
                >
                  Nous contacter
                </Link>
              </div>

              <div className="grid gap-5 desktop:w-[320px]">
                <GroupItem icon={Users} title="Groupes" text="De 8 à 40 personnes" />
                <GroupItem
                  icon={Sparkles}
                  title="Privatisation"
                  text="Partielle ou totale du restaurant"
                />
                <GroupItem
                  icon={Wine}
                  title="Apéros & afterwork"
                  text="Tapas, vins & cocktails"
                />
                <GroupItem
                  icon={GlassWater}
                  title="Soirées à thème"
                  text="Tapas nights, dégustations, événements..."
                />
              </div>

              <div className="pointer-events-none absolute bottom-7 right-7 hidden h-16 w-16 desktop:block">
                <Image
                  src="/img/home/leaf.webp"
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </RevealOnScrollComponent>
    </section>
  );
}

function FindingItem({ icon: Icon, title, text }) {
  return (
    <div className="grid grid-cols-[34px_1fr] items-start gap-4">
      <Icon
        size={24}
        strokeWidth={1.8}
        className="mt-1 text-[var(--site-orange-deep)]"
      />
      <div>
        <h3 className="text-[22px] font-extrabold uppercase tracking-[0.04em] text-[var(--site-ink)]">
          {title}
        </h3>
        <p className="mt-2 text-[18px] leading-[1.8] text-[var(--site-ink-soft)]">
          {text}
        </p>
      </div>
    </div>
  );
}

function GroupItem({ icon: Icon, title, text }) {
  return (
    <div className="grid grid-cols-[30px_1fr] items-start gap-4 desktop:grid-cols-[24px_1fr] desktop:gap-3">
      <Icon
        size={22}
        strokeWidth={1.8}
        className="mt-1 text-white desktop:h-[20px] desktop:w-[20px]"
      />
      <div>
        <h3 className="text-[18px] font-bold uppercase tracking-[0.08em] text-white desktop:text-[16px]">
          {title}
        </h3>
        <p className="mt-1 text-[16px] leading-[1.7] text-white/86 desktop:text-[15px] desktop:leading-[1.5]">
          {text}
        </p>
      </div>
    </div>
  );
}
