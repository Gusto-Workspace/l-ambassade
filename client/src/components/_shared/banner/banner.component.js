import Image from "next/image";
import { useMemo, useState } from "react";
import RevealOnScrollComponent from "../motion/reveal-on-scroll.component";

const FALLBACK_BANNER = "/img/home/header.webp";

function normalizeBannerSrc(imgUrl) {
  if (!imgUrl) {
    return FALLBACK_BANNER;
  }

  if (imgUrl.startsWith("/")) {
    return imgUrl;
  }

  if (imgUrl.startsWith("img/")) {
    return `/${imgUrl}`;
  }

  return `/img/${imgUrl}`;
}

export default function BannerComponent({
  title,
  eyebrow = "",
  description = "",
  imgUrl = "",
}) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = useMemo(() => normalizeBannerSrc(imgUrl), [imgUrl]);

  return (
    <section className="site-noise relative isolate min-h-[90svh] overflow-hidden px-5 pb-24 pt-32 text-[var(--site-cream)] tablet:px-8 tablet:pb-28 tablet:pt-36 desktop:px-[90px] desktop:pb-32 desktop:pt-40">
      <div className="absolute inset-0">
        <Image
          src={hasError ? FALLBACK_BANNER : imageSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="site-ken-burns object-cover"
          onError={() => setHasError(true)}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,16,13,0.78),rgba(20,72,47,0.52))]" />
      <div className="absolute inset-0 site-grid-glow opacity-50" />

      <div className="relative mx-auto flex min-h-[calc(90svh-8rem)] max-w-[1400px] flex-col justify-end tablet:min-h-[calc(90svh-9rem)] desktop:min-h-[calc(90svh-10rem)]">
        <RevealOnScrollComponent as="p" className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[rgba(246,241,232,0.72)]">
          {eyebrow}
        </RevealOnScrollComponent>
        <RevealOnScrollComponent
          as="h1"
          delay={80}
          className="yeseva-one-regular mt-4 max-w-[10ch] text-balance text-[50px] leading-[0.9] tablet:text-[74px] desktop:text-[92px]"
        >
          {title}
        </RevealOnScrollComponent>
        {description ? (
          <RevealOnScrollComponent
            as="p"
            delay={160}
            variant="soft"
            className="mt-6 max-w-[700px] text-[17px] leading-[1.9] text-[rgba(246,241,232,0.82)] tablet:text-[18px]"
          >
            {description}
          </RevealOnScrollComponent>
        ) : null}
      </div>
    </section>
  );
}
