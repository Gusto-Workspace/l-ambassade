import { getNewsImage } from "@/_assets/utils/news.utils";

export default function NewsMediaComponent({
  item,
  className = "",
  detail = false,
  loading = "lazy",
}) {
  const src = getNewsImage(item);
  const alt = item?.title || "Actualité de L’Ambassade";

  return (
    <div
      className={`${className} ambassade-news-media${detail ? " ambassade-news-media--detail" : ""}`.trim()}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={loading}
        className="ambassade-news-media__backdrop"
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        className="ambassade-news-media__image"
      />
    </div>
  );
}
