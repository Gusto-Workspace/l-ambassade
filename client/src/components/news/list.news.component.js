import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowRight, Loader2, X } from "lucide-react";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import EditorialHeadingComponent from "../_shared/editorial-heading/editorial-heading.component";
import ReservationHomeSection from "../home/sections/reservation.home.section";
import NewsMediaComponent from "./news-media.component";
import {
  formatNewsDate,
  getNewsExcerpt,
  getNewsLabel,
  getVisibleNews,
} from "@/_assets/utils/news.utils";

function NewsButton({ onClick, children = "En savoir plus" }) {
  return <button type="button" onClick={onClick} className="ambassade-news-link">{children}<ArrowRight size={20} strokeWidth={1.4} /></button>;
}

export default function ListNewsComponent({ restaurantData, dataLoading = false }) {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const visibleNews = useMemo(
    () => getVisibleNews(restaurantData),
    [restaurantData],
  );
  const previousNews = visibleNews.slice(1);
  const requestedArticleId = Array.isArray(router.query.article)
    ? router.query.article[0]
    : router.query.article;

  useEffect(() => {
    if (!router.isReady || dataLoading || !requestedArticleId) return;

    const requestedArticle = visibleNews.find(
      (item) => String(item?._id) === String(requestedArticleId),
    );

    if (requestedArticle) {
      setSelected(requestedArticle);
    }
  }, [dataLoading, requestedArticleId, router.isReady, visibleNews]);

  function closeSelectedArticle() {
    setSelected(null);

    if (!requestedArticleId) return;

    const query = { ...router.query };
    delete query.article;
    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });
  }

  useEffect(() => {
    if (!selected) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [selected]);

  return <>
    <section className="ambassade-news-page">
      <EditorialHeadingComponent title="Les nouvelles de L’Ambassade." description="Découvrez les rendez-vous, les nouveautés et les histoires qui font vivre la maison." />

      {dataLoading ? <div className="ambassade-news-state"><Loader2 className="animate-spin" /><p>Chargement des actualités…</p></div> : null}
      {!dataLoading && !visibleNews.length ? <div className="ambassade-news-state"><p>Aucune actualité n’est publiée pour le moment.</p></div> : null}

      {!dataLoading && visibleNews.length ? <div className="ambassade-news-feed">
        <RevealOnScrollComponent className="ambassade-news-feature">
          <NewsMediaComponent item={visibleNews[0]} className="ambassade-news-feature__media" />
          <NewsCopy item={visibleNews[0]} index={0} onOpen={() => setSelected(visibleNews[0])} lead />
        </RevealOnScrollComponent>

        {visibleNews.length > 1 ? <>
          <EditorialHeadingComponent title="Les actualités précédentes." />
          <div className="ambassade-news-previous">
            {previousNews.map((item, index) => <RevealOnScrollComponent key={item._id || `${item.title}-${index}`} className={`ambassade-news-row${index % 2 === 0 ? " ambassade-news-row--dark" : ""}`}>
              <NewsCopy item={item} index={index + 1} onOpen={() => setSelected(item)} />
              <NewsMediaComponent item={item} className="ambassade-news-row__media" />
            </RevealOnScrollComponent>)}
          </div>
        </> : null}

      </div> : null}
    </section>

    <ReservationHomeSection title="On vous garde une table ?" buttonLabel="Réserver" dark />

    {selected ? <div className="ambassade-news-modal" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
      <button type="button" className="ambassade-news-modal__backdrop" onClick={closeSelectedArticle} aria-label="Fermer" />
      <article><button type="button" onClick={closeSelectedArticle} aria-label="Fermer l’actualité"><X size={24} /></button><p className="ambassade-news-meta">{getNewsLabel(selected, 0)} · {formatNewsDate(selected.published_at) || "Actualité"}</p><h2 id="news-modal-title" className="ambassade-display">{selected.title}</h2><NewsMediaComponent item={selected} className="ambassade-news-modal__image" detail loading="eager" />{selected.description ? <div className="ambassade-news-modal__body" dangerouslySetInnerHTML={{ __html: selected.description }} /> : null}</article>
    </div> : null}
  </>;
}

function NewsCopy({ item, index, onOpen, lead = false }) {
  const excerpt = getNewsExcerpt(item.description);
  return <div className="ambassade-news-copy"><p className="ambassade-news-meta">{getNewsLabel(item, index)}</p><time>{formatNewsDate(item.published_at) || "Actualité"}</time><h2 className="ambassade-display">{item.title}</h2>{excerpt ? <p>{excerpt}</p> : null}<NewsButton onClick={onOpen}>{lead ? "Lire l’actualité" : "En savoir plus"}</NewsButton></div>;
}
