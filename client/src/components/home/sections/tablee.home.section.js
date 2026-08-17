import Image from "next/image";
import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";

export default function TableeHomeSection() {
  return (
    <section className="ambassade-tablee" aria-labelledby="tablee-title">
      <div className="ambassade-container ambassade-tablee__layout">
        <RevealOnScrollComponent
          variant="left"
          className="ambassade-tablee__copy ambassade-descriptive-panel"
        >
          <h2 id="tablee-title" className="ambassade-display ambassade-tablee__title">
            La Tablée
          </h2>
          <span className="ambassade-section-rule" aria-hidden="true">✦</span>
          <p className="ambassade-section-tagline">
            Des assiettes à partager,
            <br />
            des moments à prolonger.
          </p>
          <p className="ambassade-hover-description">
            Des assiettes généreuses à poser au centre, pour goûter, partager et
            laisser la conversation durer.
          </p>
        </RevealOnScrollComponent>

        <RevealOnScrollComponent variant="right" className="ambassade-tablee__media site-media-zoom">
          <Image
            src="/img/home/la-tablee.jpg"
            alt="Grande table dressée dans la verrière de L’Ambassade"
            fill
            sizes="(max-width: 767px) 100vw, 58vw"
            className="object-cover object-center"
          />
        </RevealOnScrollComponent>
      </div>
    </section>
  );
}
