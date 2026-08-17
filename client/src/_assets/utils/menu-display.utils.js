const MENU_BLANK_LINE_TOKEN = "__MENU_BLANK_LINE__";

function toFiniteNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatMenuPrice(value) {
  const numericValue = toFiniteNumber(value);

  if (numericValue === null || numericValue <= 0) {
    return "";
  }

  return `${numericValue.toFixed(2).replace(".", ",")} €`;
}

export function splitMenuText(value) {
  if (!String(value || "").trim()) {
    return [];
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((line) => {
      const trimmedLine = line.trim();
      return trimmedLine || MENU_BLANK_LINE_TOKEN;
    });
}

export function isMenuBlankLine(value) {
  return String(value || "") === MENU_BLANK_LINE_TOKEN;
}

export function isMenuSeparatorLabel(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  return normalizedValue === "ou" || normalizedValue === "et";
}

export function getVisibleMenus(restaurantData) {
  return (restaurantData?.menus || []).filter(
    (menu) => menu?.visible !== false,
  );
}

export function getPrimaryMenu(restaurantData) {
  return getVisibleMenus(restaurantData)[0] || null;
}

export function getSecondaryMenus(restaurantData) {
  return getVisibleMenus(restaurantData).slice(1);
}

export function getMenuTitle(menu, index = 0) {
  return String(menu?.name || "").trim() || `Menu ${index + 1}`;
}

export function getMenuPriceLabel(menu) {
  const directPrice = toFiniteNumber(menu?.price);

  if (directPrice !== null && directPrice > 0) {
    return formatMenuPrice(directPrice);
  }

  const combinationPrices = (menu?.combinations || [])
    .map((combination) => toFiniteNumber(combination?.price))
    .filter((price) => price !== null && price > 0);

  if (!combinationPrices.length) {
    return "";
  }

  const uniquePrices = [
    ...new Set(combinationPrices.map((price) => price.toFixed(2))),
  ];

  if (uniquePrices.length === 1) {
    return formatMenuPrice(combinationPrices[0]);
  }

  return "";
}

const singularCategoryLabels = {
  entrées: "Entrée",
  entrees: "Entrée",
  plats: "Plat",
  desserts: "Dessert",
  boissons: "Boisson",
  vins: "Vin",
  cocktails: "Cocktail",
  menus: "Menu",
  formules: "Formule",
};

function getSingularCategoryLabel(value) {
  const label = String(value || "").trim();

  if (!label) {
    return "";
  }

  const normalizedLabel = label.toLowerCase();

  if (singularCategoryLabels[normalizedLabel]) {
    return singularCategoryLabels[normalizedLabel];
  }

  if (
    !label.includes(" ") &&
    normalizedLabel.endsWith("s") &&
    normalizedLabel.length > 2 &&
    !/(as|is|os|us|ss)$/.test(normalizedLabel)
  ) {
    return label.slice(0, -1);
  }

  return label;
}

function buildCustomGroupLines(group) {
  const dishes = Array.isArray(group?.dishes) ? group.dishes : [];
  const relations = Array.isArray(group?.relations) ? group.relations : [];

  return dishes.reduce((lines, dish, index) => {
    const dishName = String(dish?.name || dish || "").trim();

    if (dishName) {
      lines.push(dishName);
    }

    if (index < dishes.length - 1) {
      lines.push(relations[index] === "and" ? "Et" : "Ou");
    }

    return lines;
  }, []);
}

function buildFixedBlocks(menu) {
  return (menu?.combinations || []).map((combination, index) => ({
    id: combination?._id || `${menu?._id || "menu"}-combination-${index}`,
    title:
      (combination?.categories || [])
        .map((category) => getSingularCategoryLabel(category))
        .filter(Boolean)
        .join(" + ") || `Option ${index + 1}`,
    price: formatMenuPrice(combination?.price),
    lines: splitMenuText(combination?.description),
  }));
}

function buildCustomBlocks(menu) {
  const customGroups = Array.isArray(menu?.customGroups)
    ? menu.customGroups
    : [];

  if (customGroups.length > 0) {
    return customGroups
      .map((group, index) => ({
        id: `${menu?._id || "menu"}-group-${index}`,
        title: String(group?.categoryName || "").trim() || `Choix ${index + 1}`,
        lines: buildCustomGroupLines(group),
      }))
      .filter((group) => group.title);
  }

  const fallbackLines = (menu?.dishes || [])
    .map((dish) => String(dish?.name || dish || "").trim())
    .filter(Boolean);

  if (!fallbackLines.length) {
    return [];
  }

  return [
    {
      id: `${menu?._id || "menu"}-selection`,
      title: "Sélection",
      lines: fallbackLines,
    },
  ];
}

export function buildMenuBlocks(menu) {
  if (!menu) {
    return [];
  }

  return menu?.type === "custom"
    ? buildCustomBlocks(menu)
    : buildFixedBlocks(menu);
}
