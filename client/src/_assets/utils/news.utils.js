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
