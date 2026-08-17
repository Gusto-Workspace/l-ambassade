import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import EditorialHeadingComponent from "../_shared/editorial-heading/editorial-heading.component";
import ReservationHomeSection from "../home/sections/reservation.home.section";

const fakeNews = [
  {
    id: "summer-menu",
    category: "À table",
    date: "12 août 2026",
    title: "La carte prend des couleurs d’été.",
    excerpt:
      "Une cuisine vivante, des produits de saison et de nouvelles assiettes imaginées pour être partagées.",
    body:
      "La carte estivale s’installe à L’Ambassade. Elle fait la part belle aux produits frais, aux assiettes généreuses et aux cuissons qui accompagnent les longues journées dans le jardin.",
    image: "/img/home/le-jardin.jpg",
  },
  {
    id: "garden-evenings",
    category: "Au jardin",
    date: "7 août 2026",
    title: "Les soirées du jardin.",
    excerpt:
      "Chaque vendredi, les grandes tablées se prolongent sous les arbres, entre cuisine, musique et lumière douce.",
    body:
      "À la tombée du jour, le jardin change de rythme. Les tables se rapprochent, les planches se partagent et la soirée se poursuit autour d’un verre.",
    image: "/img/reservations/discover.jpg",
    dark: true,
  },
  {
    id: "one-more-drink",
    category: "La soirée",
    date: "24 juillet 2026",
    title: "Un verre, une table, et le temps de rester.",
    excerpt:
      "Le bar lounge accompagne les fins de journée et les moments partagés.",
    body:
      "Cocktails, vins et assiettes à partager composent une soirée sans programme imposé : simplement le plaisir de rester un peu plus longtemps.",
    image: "/img/news/header.jpg",
  },
];

function NewsButton({ onClick, children = "En savoir plus" }) {
  return (
    <button type="button" onClick={onClick} className="ambassade-news-link">
      {children} <ArrowRight size={20} strokeWidth={1.4} />
    </button>
  );
}

export default function ListNewsComponent() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!selected) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  return (
    <>
      <section className="ambassade-news-page">
        <EditorialHeadingComponent
          title="Les nouvelles de L’Ambassade."
          description="Découvrez les rendez-vous, les nouveautés et les histoires qui font vivre la maison."
        />

        <div className="ambassade-news-feed">
          <RevealOnScrollComponent className="ambassade-news-feature">
            <div className="ambassade-news-feature__media">
              <Image
                src={fakeNews[0].image}
                alt="La verrière de L’Ambassade"
                fill
                sizes="(max-width: 767px) 100vw, 58vw"
                className="object-cover object-center"
              />
            </div>
            <div className="ambassade-news-copy">
              <p className="ambassade-news-meta">{fakeNews[0].category}</p>
              <time>{fakeNews[0].date}</time>
              <h2 className="ambassade-display">{fakeNews[0].title}</h2>
              <p>{fakeNews[0].excerpt}</p>
              <NewsButton onClick={() => setSelected(fakeNews[0])}>Lire l’actualité</NewsButton>
            </div>
          </RevealOnScrollComponent>

          <EditorialHeadingComponent title="Les actualités précédentes." />

          <div className="ambassade-news-previous">
            {fakeNews.slice(1).map((item, index) => (
              <RevealOnScrollComponent
                key={item.id}
                className={`ambassade-news-row${item.dark ? " ambassade-news-row--dark" : ""}`}
              >
                <div className="ambassade-news-copy">
                  <p className="ambassade-news-meta">{item.category}</p>
                  <time>{item.date}</time>
                  <h2 className="ambassade-display">{item.title}</h2>
                  <p>{item.excerpt}</p>
                  <NewsButton onClick={() => setSelected(item)} />
                </div>
                <div className="ambassade-news-row__media">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, 55vw"
                    className="object-cover object-center"
                  />
                </div>
              </RevealOnScrollComponent>
            ))}
          </div>

          <div className="ambassade-news-all">
            <EditorialHeadingComponent emblem title="Toutes les actualités" />
            <button type="button" className="ambassade-button ambassade-button--outline">
              Voir les publications précédentes
            </button>
          </div>
        </div>
      </section>

      <ReservationHomeSection title="On vous garde une table ?" buttonLabel="Réserver" dark />

      {selected ? (
        <div className="ambassade-news-modal" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
          <button
            type="button"
            className="ambassade-news-modal__backdrop"
            onClick={() => setSelected(null)}
            aria-label="Fermer"
          />
          <article>
            <button type="button" onClick={() => setSelected(null)} aria-label="Fermer l’actualité">
              <X size={24} />
            </button>
            <p className="ambassade-news-meta">{selected.category} · {selected.date}</p>
            <h2 id="news-modal-title" className="ambassade-display">{selected.title}</h2>
            <div className="ambassade-news-modal__image">
              <Image src={selected.image} alt="" fill sizes="800px" className="object-cover" />
            </div>
            <p>{selected.body}</p>
          </article>
        </div>
      ) : null}
    </>
  );
}
