import Image from "next/image";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import FormContactCompnent from "./form.contact.component";

export default function InfosContactComponent() {
  return (
    <section
      id="contact-form"
      className="bg-[var(--site-cream)] px-5 pb-0  tablet:px-8 tablet:pb-0  desktop:px-12 desktop:pb-0 "
    >
      <div className="mx-auto max-w-[1680px]">
        <div className="grid gap-10 desktop:grid-cols-[0.4fr_0.6fr] desktop:items-center">
          <RevealOnScrollComponent variant="left" className="relative">
            <div className="">
              <div className="flex items-center gap-3">
                <h2 className="yeseva-one-regular text-[48px] uppercase leading-[0.94] tracking-[-0.04em] text-[var(--site-ink)] tablet:text-[64px]">
                  Écrivez-nous
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

              <div className="mt-8 space-y-2 text-[18px] leading-[1.8] text-[var(--site-ink)] tablet:text-[20px]">
                <p>Une question, une demande particulière,</p>
                <p>un événement à organiser ?</p>
                <p>Remplissez le formulaire, on vous répondra</p>
                <p>dans les plus brefs délais.</p>
              </div>
            </div>

            <div className="relative mt-14 h-16 w-16">
              <Image
                src="/img/home/leaf.webp"
                alt=""
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
          </RevealOnScrollComponent>

          <RevealOnScrollComponent delay={120} variant="right">
            <FormContactCompnent />
          </RevealOnScrollComponent>
        </div>
      </div>
    </section>
  );
}
