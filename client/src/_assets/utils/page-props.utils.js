import axios from "axios";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

let cachedSeoRestaurantPromise = null;

function normalizeEnvUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
}

function isLocalApiUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/.*)?$/i.test(value);
}

export async function fetchRestaurantSeoData() {
  if (cachedSeoRestaurantPromise) {
    return cachedSeoRestaurantPromise;
  }

  cachedSeoRestaurantPromise = (async () => {
    const apiUrl = normalizeEnvUrl(process.env.NEXT_PUBLIC_API_URL);
    const restaurantId = String(process.env.NEXT_PUBLIC_RESTAURANT_ID || "").trim();

    if (!apiUrl || !restaurantId) {
      return null;
    }

    if (isLocalApiUrl(apiUrl)) {
      return null;
    }

    try {
      const response = await axios.get(
        `${apiUrl}/restaurants/${restaurantId}`,
        { timeout: 3500 },
      );

      return response?.data?.restaurant || null;
    } catch (error) {
      console.warn(
        `SEO restaurant data could not be fetched during page generation: ${
          error?.message || "unknown error"
        }`,
      );
      return null;
    }
  })();

  return cachedSeoRestaurantPromise;
}

export async function buildStaticPageProps(
  locale,
  namespaces = ["common"],
) {
  const normalizedNamespaces = Array.from(
    new Set(["common", ...(Array.isArray(namespaces) ? namespaces : [])]),
  );

  const [translations, seoRestaurantData] = await Promise.all([
    serverSideTranslations(locale, normalizedNamespaces),
    fetchRestaurantSeoData(),
  ]);

  return {
    props: {
      ...translations,
      seoRestaurantData,
    },
  };
}
