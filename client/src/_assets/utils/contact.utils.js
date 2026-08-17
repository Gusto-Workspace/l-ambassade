const orderedDays = [
  { label: "Lundi", index: 0 },
  { label: "Mardi", index: 1 },
  { label: "Mercredi", index: 2 },
  { label: "Jeudi", index: 3 },
  { label: "Vendredi", index: 4 },
  { label: "Samedi", index: 5 },
  { label: "Dimanche", index: 6 },
];

const dayIndexByKey = {
  lundi: 0,
  monday: 0,
  mon: 0,
  lun: 0,
  mardi: 1,
  tuesday: 1,
  tue: 1,
  tues: 1,
  mar: 1,
  mercredi: 2,
  wednesday: 2,
  wed: 2,
  mer: 2,
  jeudi: 3,
  thursday: 3,
  thu: 3,
  thur: 3,
  thurs: 3,
  jeu: 3,
  vendredi: 4,
  friday: 4,
  fri: 4,
  ven: 4,
  samedi: 5,
  saturday: 5,
  sat: 5,
  sam: 5,
  dimanche: 6,
  sunday: 6,
  sun: 6,
  dim: 6,
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

function getDayIndex(value) {
  return dayIndexByKey[normalizeDayKey(value)];
}

function formatAddress(address) {
  if (!address || typeof address !== "object") {
    return "";
  }

  const line1 = normalizeText(address.line1);
  const locality = [normalizeText(address.zipCode), normalizeText(address.city)]
    .filter(Boolean)
    .join(" ");
  const country = normalizeText(address.country);
  const parts = [line1, locality];

  if (country && normalizeDayKey(country) !== "france") {
    parts.push(country);
  }

  return parts.filter(Boolean).join(", ");
}

function formatDayRanges(dayData) {
  if (!dayData) {
    return "-";
  }

  if (
    dayData.isClosed ||
    !Array.isArray(dayData.hours) ||
    dayData.hours.length === 0
  ) {
    return "Fermé";
  }

  const ranges = dayData.hours
    .map((range) => {
      const open = normalizeText(range?.open);
      const close = normalizeText(range?.close);

      if (!open || !close) {
        return "";
      }

      return `${open} – ${close}`;
    })
    .filter(Boolean);

  return ranges.length ? ranges.join(" • ") : "Fermé";
}

function buildTelHref(phone) {
  const normalizedPhone = normalizeText(phone);

  if (!normalizedPhone) {
    return "";
  }

  const compactPhone = normalizedPhone.replace(/[^\d+]/g, "");

  if (compactPhone.startsWith("+")) {
    return `tel:${compactPhone}`;
  }

  return `tel:${compactPhone.replace(/\+/g, "")}`;
}

export function buildContactInfos(restaurant) {
  const address = formatAddress(restaurant?.address);
  const phone = normalizeText(restaurant?.phone);
  const email = normalizeText(restaurant?.email);

  return [
    {
      key: "address",
      label: "Adresse",
      value: address || "-",
    },
    {
      key: "phone",
      label: "Téléphone",
      value: phone || "-",
      href: phone ? buildTelHref(phone) : "",
    },
    {
      key: "email",
      label: "Email",
      value: email || "-",
      href: email ? `mailto:${email}` : "",
    },
  ];
}

export function buildContactSchedules(restaurant) {
  if (!restaurant) {
    return orderedDays.map((day) => ({
      day: day.label,
      hours: "-",
    }));
  }

  const openingHours = Array.isArray(restaurant.opening_hours)
    ? restaurant.opening_hours
    : [];

  if (!openingHours.length) {
    return orderedDays.map((day) => ({
      day: day.label,
      hours: "-",
    }));
  }

  const schedulesByIndex = Array(7).fill(null);

  openingHours.forEach((dayData, index) => {
    const mappedIndex = getDayIndex(dayData?.day);
    const targetIndex =
      typeof mappedIndex === "number" ? mappedIndex : index < 7 ? index : null;

    if (
      typeof targetIndex === "number" &&
      targetIndex >= 0 &&
      targetIndex < 7 &&
      !schedulesByIndex[targetIndex]
    ) {
      schedulesByIndex[targetIndex] = dayData;
    }
  });

  return orderedDays.map((day) => ({
    day: day.label,
    hours: formatDayRanges(schedulesByIndex[day.index]),
  }));
}

export function getMapEmbedSrc(restaurant) {
  const address = formatAddress(restaurant?.address);
  const query = address || normalizeText(restaurant?.name);

  if (!query) {
    return "";
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
