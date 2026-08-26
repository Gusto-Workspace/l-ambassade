const fallbackLabels = ["À table", "Au jardin", "La soirée", "L’Ambassade"];

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function stripNewsHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNewsLabel(item, index = 0) {
  return String(
    item?.label ||
      item?.category ||
      item?.tag ||
      item?.type ||
      fallbackLabels[index % fallbackLabels.length],
  );
}

export function getNewsImage(item, fallback = "/img/news/header.webp") {
  return String(item?.image || fallback);
}

export function getNewsExcerpt(value, maxLength = 180) {
  const plainText = stripNewsHtml(value);

  return plainText.length > maxLength
    ? `${plainText.slice(0, maxLength).trim()}…`
    : plainText;
}

export function getVisibleNews(restaurantData) {
  return [...(restaurantData?.news || [])]
    .filter((item) => item?.visible !== false)
    .sort((a, b) => {
      const dateA = normalizeDate(a?.published_at)?.getTime() || 0;
      const dateB = normalizeDate(b?.published_at)?.getTime() || 0;
      return dateB - dateA;
    });
}

export function hasVisibleNews(restaurantData) {
  return getVisibleNews(restaurantData).length > 0;
}

export function formatNewsDate(value) {
  const parsedDate = normalizeDate(value);

  if (!parsedDate) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}
