import { getRestaurantDisplayName, getSocialLinks } from "./site-display.utils";

export const DEFAULT_SITE_NAME = "L’Ambassade";
export const DEFAULT_SITE_URL = "http://localhost:8003";
export const DEFAULT_SOCIAL_IMAGE = "/img/home/header.png";
export const DEFAULT_LOGO_IMAGE = "/img/_shared/logo-bg-white.png";

const schemaDayByKey = {
  lundi: "Monday",
  monday: "Monday",
  mardi: "Tuesday",
  tuesday: "Tuesday",
  mercredi: "Wednesday",
  wednesday: "Wednesday",
  jeudi: "Thursday",
  thursday: "Thursday",
  vendredi: "Friday",
  friday: "Friday",
  samedi: "Saturday",
  saturday: "Saturday",
  dimanche: "Sunday",
  sunday: "Sunday",
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeDayKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeBaseUrl(value) {
  const sanitizedValue = String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");

  if (!sanitizedValue) {
    return DEFAULT_SITE_URL;
  }

  const normalizedValue = sanitizedValue.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return normalizedValue;
}

export function buildAbsoluteUrl(baseUrl, path) {
  if (!path) {
    return baseUrl;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function toSchemaPostalAddress(address) {
  if (!address || typeof address !== "object") {
    return null;
  }

  const streetAddress = normalizeText(address.line1);
  const postalCode = normalizeText(address.zipCode);
  const addressLocality = normalizeText(address.city);
  const addressCountry = normalizeText(address.country) || "FR";
  const addressRegion = normalizeText(address.region || address.state);

  if (!streetAddress && !postalCode && !addressLocality) {
    return null;
  }

  return {
    "@type": "PostalAddress",
    streetAddress: streetAddress || undefined,
    postalCode: postalCode || undefined,
    addressLocality: addressLocality || undefined,
    addressRegion: addressRegion || undefined,
    addressCountry,
  };
}

function toMapUrl(address, businessName) {
  const query = [
    normalizeText(address?.line1),
    normalizeText(address?.zipCode),
    normalizeText(address?.city),
    normalizeText(address?.country),
  ]
    .filter(Boolean)
    .join(", ");

  const searchQuery = query || normalizeText(businessName);

  if (!searchQuery) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
}

function toAreaServed(address) {
  const city = normalizeText(address?.city);
  const region = normalizeText(address?.region || address?.state);
  const country = normalizeText(address?.country) || "France";

  return compactObject([
    city
      ? {
          "@type": "City",
          name: city,
        }
      : null,
    region
      ? {
          "@type": "AdministrativeArea",
          name: region,
        }
      : null,
    country
      ? {
          "@type": "Country",
          name: country,
        }
      : null,
  ]);
}

function toContactPoint({ phone, email, baseUrl }) {
  const telephone = normalizeText(phone);
  const contactEmail = normalizeText(email);

  if (!telephone && !contactEmail) {
    return null;
  }

  return compactObject({
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: telephone || undefined,
    email: contactEmail || undefined,
    availableLanguage: ["fr", "en"],
    url: buildAbsoluteUrl(baseUrl, "/contact"),
  });
}

function toOpeningHoursSpecification(openingHours) {
  if (!Array.isArray(openingHours)) {
    return [];
  }

  return openingHours.flatMap((dayData) => {
    const dayOfWeek = schemaDayByKey[normalizeDayKey(dayData?.day)];

    if (!dayOfWeek) {
      return [];
    }

    if (
      dayData?.isClosed ||
      !Array.isArray(dayData?.hours) ||
      dayData.hours.length === 0
    ) {
      return [];
    }

    return dayData.hours
      .map((range) => {
        const opens = normalizeText(range?.open);
        const closes = normalizeText(range?.close);

        if (!opens || !closes) {
          return null;
        }

        return {
          "@type": "OpeningHoursSpecification",
          dayOfWeek,
          opens,
          closes,
        };
      })
      .filter(Boolean);
  });
}

function compactObject(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => compactObject(item))
      .filter((item) => item !== null && item !== undefined && item !== "");
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entryValue]) => [key, compactObject(entryValue)])
      .filter(([, entryValue]) => {
        if (Array.isArray(entryValue)) {
          return entryValue.length > 0;
        }

        return entryValue !== null && entryValue !== undefined && entryValue !== "";
      }),
  );
}

export function getSeoRouteEntries(baseUrl) {
  const routes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/menus", priority: "0.9", changefreq: "weekly" },
    { path: "/reservations", priority: "0.9", changefreq: "weekly" },
    { path: "/contact", priority: "0.8", changefreq: "monthly" },
    { path: "/news", priority: "0.7", changefreq: "weekly" },
    { path: "/legales", priority: "0.3", changefreq: "yearly" },
    { path: "/policy", priority: "0.3", changefreq: "yearly" },
  ];

  return routes.map((route) => ({
    ...route,
    url: buildAbsoluteUrl(baseUrl, route.path),
  }));
}

export function buildSeoSchemas({
  baseUrl,
  restaurant,
  title,
  description,
  canonicalUrl,
  imageUrl,
  breadcrumbs = [],
}) {
  const siteName = getRestaurantDisplayName();
  const socialLinks = getSocialLinks(restaurant).map((item) => item.href);
  const websiteId = `${baseUrl}/#website`;
  const organizationId = `${baseUrl}/#organization`;
  const restaurantId = `${baseUrl}/#restaurant`;
  const address = toSchemaPostalAddress(restaurant?.address);
  const logoUrl = buildAbsoluteUrl(baseUrl, DEFAULT_LOGO_IMAGE);
  const contactPoint = toContactPoint({
    phone: restaurant?.phone,
    email: restaurant?.email,
    baseUrl,
  });
  const hasMap = toMapUrl(restaurant?.address, siteName);
  const areaServed = toAreaServed(restaurant?.address);

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationId,
      name: siteName,
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
      image: logoUrl,
      sameAs: socialLinks,
      contactPoint,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      name: siteName,
      url: baseUrl,
      inLanguage: "fr-FR",
      publisher: {
        "@id": organizationId,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      inLanguage: "fr-FR",
      isPartOf: {
        "@id": websiteId,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: imageUrl,
      },
      about: {
        "@id": restaurantId,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": restaurantId,
      name: siteName,
      url: baseUrl,
      image: imageUrl,
      logo: logoUrl,
      servesCuisine: [
        "Cuisine méditerranéenne",
        "Tapas",
        "Vins",
        "Restaurant",
      ],
      acceptsReservations: true,
      menu: buildAbsoluteUrl(baseUrl, "/menus"),
      telephone: normalizeText(restaurant?.phone) || undefined,
      email: normalizeText(restaurant?.email) || undefined,
      address,
      openingHoursSpecification: toOpeningHoursSpecification(
        restaurant?.opening_hours,
      ),
      hasMap: hasMap || undefined,
      areaServed: areaServed.length ? areaServed : undefined,
      currenciesAccepted: "EUR",
      sameAs: socialLinks,
      mainEntityOfPage: canonicalUrl,
      parentOrganization: {
        "@id": organizationId,
      },
    },
  ];

  if (breadcrumbs.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: buildAbsoluteUrl(baseUrl, item.path),
      })),
    });
  }

  return schemas.map((schema) => compactObject(schema));
}
