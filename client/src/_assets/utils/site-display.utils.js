import { getVisibleNews } from "./news.utils";

const RESTAURANT_DISPLAY_NAME = "L’Ambassade";

function normalizeText(value) {
  return String(value || "").trim();
}

function toFiniteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatEuroPrice(value) {
  const numericValue = toFiniteNumber(value);

  if (numericValue === null) {
    return value ? String(value) : "";
  }

  if (numericValue <= 0) {
    return "";
  }

  return `${numericValue.toFixed(2).replace(".", ",")} €`;
}

export function getRestaurantDisplayName() {
  return RESTAURANT_DISPLAY_NAME;
}

export function getRestaurantBrandParts() {
  return {
    main: "L’",
    accent: "Ambassade",
    full: RESTAURANT_DISPLAY_NAME,
  };
}

export function getRestaurantLocationLabel(restaurant) {
  const city = normalizeText(restaurant?.address?.city);
  const country = normalizeText(restaurant?.address?.country);

  if (city && country && country.toLowerCase() !== "france") {
    return `${city}, ${country}`;
  }

  return city || country || "Montauban";
}

function isMenuLikeText(value) {
  return /\b(menu|menus|formule|formules|midi|soir)\b/i.test(
    normalizeText(value),
  );
}

function isMenuLikeCategory(category) {
  return (
    isMenuLikeText(category?.name) || isMenuLikeText(category?.description)
  );
}

function mapDishCategory(category, categoryIndex) {
  const mapDishes = (dishes = []) =>
    dishes
      .filter((dish) => dish?.showOnWebsite)
      .map((dish, itemIndex) => ({
        id: dish?._id || `${dish?.name || "dish"}-${itemIndex}`,
        name: normalizeText(dish?.name) || "Plat",
        description: normalizeText(dish?.description),
        price: formatEuroPrice(dish?.price),
      }));

  return {
    id: category?._id || `${category?.name || "category"}-${categoryIndex}`,
    title: normalizeText(category?.name) || "Suggestion",
    description: normalizeText(category?.description),
    items: mapDishes(category?.dishes),
    subCategories: (category?.subCategories || [])
      .filter(
        (subCategory) =>
          subCategory?.visible !== false &&
          (subCategory?.dishes || []).some((dish) => dish?.showOnWebsite),
      )
      .map((subCategory, subCategoryIndex) => ({
        id: subCategory?._id || `subcategory-${subCategoryIndex}`,
        title: normalizeText(subCategory?.name) || "Suggestion",
        items: mapDishes(subCategory?.dishes),
      })),
  };
}

export function getVisibleDishCategories(restaurantData) {
  return (restaurantData?.dish_categories || [])
    .filter(
      (category) =>
        category?.visible &&
        !isMenuLikeCategory(category) &&
        ((category?.dishes || []).some((dish) => dish?.showOnWebsite) ||
          (category?.subCategories || []).some(
            (subCategory) =>
              subCategory?.visible !== false &&
              (subCategory?.dishes || []).some((dish) => dish?.showOnWebsite),
          )),
    )
    .map(mapDishCategory)
    .filter(
      (category) =>
        category.title &&
        (category.items.length > 0 || category.subCategories.length > 0),
    );
}

export function getVisibleMenuCategories(restaurantData) {
  return (restaurantData?.dish_categories || [])
    .filter(
      (category) =>
        category?.visible &&
        isMenuLikeCategory(category) &&
        ((category?.dishes || []).some((dish) => dish?.showOnWebsite) ||
          (category?.subCategories || []).some(
            (subCategory) =>
              subCategory?.visible !== false &&
              (subCategory?.dishes || []).some((dish) => dish?.showOnWebsite),
          )),
    )
    .map(mapDishCategory)
    .filter(
      (category) =>
        category.title &&
        (category.items.length > 0 || category.subCategories.length > 0),
    );
}

export function getHomeMenuPreview(restaurantData, options = {}) {
  const { limitCategories = 3, limitItems = 4 } = options;

  return getVisibleDishCategories(restaurantData)
    .slice(0, limitCategories)
    .map((category) => ({
      ...category,
      items: [
        ...category.items,
        ...(category.subCategories || []).flatMap((subCategory) => [
          {
            id: `subcategory-${subCategory.id}`,
            name: subCategory.title,
            isSubCategoryHeading: true,
          },
          ...subCategory.items,
        ]),
      ].slice(0, limitItems),
    }));
}

export function getNewsPreviewItems(restaurantData, limit = 3) {
  return getVisibleNews(restaurantData).slice(0, limit);
}

function normalizeExternalHref(value) {
  const href = normalizeText(value);

  if (!href) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(href) || href.startsWith("mailto:")) {
    return href;
  }

  return `https://${href}`;
}

export function getSocialLinks(restaurantData) {
  const socialMedia = restaurantData?.social_media || {};

  return [
    {
      label: "Facebook",
      href: normalizeExternalHref(socialMedia?.facebook),
      icon: "facebook",
    },
    {
      label: "Instagram",
      href: normalizeExternalHref(socialMedia?.instagram),
      icon: "instagram",
    },
    {
      label: "TikTok",
      href: normalizeExternalHref(socialMedia?.tiktok),
      icon: "tiktok",
    },
    {
      label: "YouTube",
      href: normalizeExternalHref(socialMedia?.youtube),
      icon: "youtube",
    },
    {
      label: "LinkedIn",
      href: normalizeExternalHref(socialMedia?.linkedIn),
      icon: "linkedin",
    },
  ].filter((item) => item.href);
}
