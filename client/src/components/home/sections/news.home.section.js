import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RevealOnScrollComponent from "@/components/_shared/motion/reveal-on-scroll.component";
import EditorialHeadingComponent from "@/components/_shared/editorial-heading/editorial-heading.component";
import NewsMediaComponent from "@/components/news/news-media.component";
import {
  formatNewsDate,
  getNewsLabel,
  getVisibleNews,
} from "@/_assets/utils/news.utils";

export default function NewsHomeSection({ restaurantData }) {
  const articles = getVisibleNews(restaurantData).slice(0, 3);

  if (!articles.length) {
    return null;
  }

  const layout = articles.length === 1 ? "single" : articles.length === 2 ? "double" : "multiple";

  return (
    <section className={`ambassade-home-news ambassade-home-news--${layout}`} aria-labelledby="home-news-title">
      <div className="ambassade-container">
        <EditorialHeadingComponent
          titleId="home-news-title"
          title="Les nouvelles de L’Ambassade."
          description="Les rendez-vous, les nouveautés et les histoires qui font vivre la maison."
        />

        <div className="ambassade-home-news__list">
          {articles.map((article, index) => (
            <HomeNewsCard
              key={article._id || `${article.title}-${index}`}
              item={article}
              index={index}
              featured={layout === "single" || (layout === "multiple" && index === 0)}
              dark={index % 2 === 1}
            />
          ))}
        </div>

        <div className="ambassade-home-news__all">
          <Link href="/news" className="ambassade-button ambassade-button--outline">
            Voir toutes les actualités
            <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomeNewsCard({ item, index, featured = false, dark = false }) {
  const articleHref = item?._id
    ? { pathname: "/news", query: { article: String(item._id) } }
    : "/news";

  return (
    <RevealOnScrollComponent
      as="article"
      className={`ambassade-home-news__card${featured ? " ambassade-home-news__card--featured" : ""}${dark ? " ambassade-home-news__card--dark" : ""}`}
      delay={index * 90}
    >
      <NewsMediaComponent item={item} className="ambassade-home-news__media" />
      <div className="ambassade-home-news__body">
        <p className="ambassade-news-meta">{getNewsLabel(item, index)}</p>
        <time dateTime={item.published_at ? String(item.published_at) : undefined}>
          {formatNewsDate(item.published_at) || "Actualité"}
        </time>
        <h3 className="ambassade-display">{item.title}</h3>
        {item.description ? <RichNewsExcerpt html={item.description} /> : null}
        <Link href={articleHref} className="ambassade-news-link">
          Lire l’actualité
          <ArrowRight size={20} strokeWidth={1.4} aria-hidden="true" />
        </Link>
      </div>
    </RevealOnScrollComponent>
  );
}

function RichNewsExcerpt({ html }) {
  const excerptRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const excerpt = excerptRef.current;

    if (!excerpt) {
      return undefined;
    }

    const measureOverflow = () => {
      setIsTruncated(excerpt.scrollHeight > excerpt.clientHeight + 1);
    };

    const frame = window.requestAnimationFrame(measureOverflow);
    window.addEventListener("resize", measureOverflow);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureOverflow);
    };
  }, [html]);

  return (
    <div ref={excerptRef} className="ambassade-home-news__excerpt">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {isTruncated ? <span className="ambassade-home-news__ellipsis" aria-hidden="true">…</span> : null}
    </div>
  );
}
