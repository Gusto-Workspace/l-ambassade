export const GIFT_CHECKOUT_PREFIX = "gm_gift_checkout";
export const GIFT_CHECKOUT_TTL = 24 * 60 * 60 * 1000;
export const PAID_GIFT_CHECKOUT_TTL = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_GIFT_CARD_SETTINGS = {
  validity_mode: "fixed_duration",
  validity_fixed_months: 6,
  validity_until_day: 25,
  validity_until_month: 6,
};

const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function hasValidityConfig(source) {
  return (
    source?.validity_mode !== undefined ||
    source?.validity_fixed_months !== undefined ||
    source?.validity_until_day !== undefined ||
    source?.validity_until_month !== undefined
  );
}

export function normalizeGiftCardSettings(giftCard, fallbackSettings) {
  const source = hasValidityConfig(giftCard) ? giftCard : fallbackSettings;

  return {
    validity_mode:
      source?.validity_mode === "until_date"
        ? "until_date"
        : DEFAULT_GIFT_CARD_SETTINGS.validity_mode,
    validity_fixed_months: clampInteger(
      source?.validity_fixed_months,
      DEFAULT_GIFT_CARD_SETTINGS.validity_fixed_months,
      1,
      60,
    ),
    validity_until_day: clampInteger(
      source?.validity_until_day,
      DEFAULT_GIFT_CARD_SETTINGS.validity_until_day,
      1,
      31,
    ),
    validity_until_month: clampInteger(
      source?.validity_until_month,
      DEFAULT_GIFT_CARD_SETTINGS.validity_until_month,
      1,
      12,
    ),
  };
}

export function buildGiftCardValidityLabel(giftCard, fallbackSettings) {
  const settings = normalizeGiftCardSettings(giftCard, fallbackSettings);

  if (settings.validity_mode === "until_date") {
    const month = MONTH_LABELS[settings.validity_until_month - 1];
    return `Valable jusqu’au ${settings.validity_until_day} ${month}`;
  }

  return `Valable ${settings.validity_fixed_months} mois à compter de l’achat`;
}

export function getVisibleGiftCards(restaurant) {
  if (restaurant?.options?.gift_card !== true) return [];
  return Array.isArray(restaurant?.giftCards)
    ? restaurant.giftCards.filter((giftCard) => giftCard?.visible === true)
    : [];
}

export function hasGiftCardShop(restaurant) {
  return getVisibleGiftCards(restaurant).length > 0;
}

export function getGiftCardAmountCents(giftCard) {
  const amount = Math.round(Number(giftCard?.value) * 100);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function makeGiftCheckoutId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `chk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getGiftCheckoutKey(restaurantId, giftId) {
  return `${GIFT_CHECKOUT_PREFIX}:${restaurantId}:${giftId}`;
}

export function cleanStaleGiftCheckouts(restaurantId) {
  if (typeof window === "undefined" || !restaurantId) return;

  const prefix = `${GIFT_CHECKOUT_PREFIX}:${restaurantId}:`;
  const now = Date.now();
  const keysToRemove = [];

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;

      const checkout = safeJsonParse(localStorage.getItem(key));
      const createdAt = Number(checkout?.createdAt);
      const age = Number.isFinite(createdAt) ? now - createdAt : Infinity;
      const ttl = ["confirming", "paid"].includes(checkout?.state)
        ? PAID_GIFT_CHECKOUT_TTL
        : GIFT_CHECKOUT_TTL;

      if (age > ttl) keysToRemove.push(key);
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Le stockage peut être indisponible en navigation privée stricte.
  }
}
