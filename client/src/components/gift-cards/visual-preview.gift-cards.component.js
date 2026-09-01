const DEFAULT_VISUAL = {
  visualId: "",
  imageUrl: "/img/home/la-tablee.webp",
  textColor: "#fffdf8",
  textLayout: "right",
};

export function normalizeGiftCardVisual(visual) {
  if (!visual) return DEFAULT_VISUAL;

  return {
    visualId: String(visual._id || visual.visualId || ""),
    imageUrl: visual.imageUrl || DEFAULT_VISUAL.imageUrl,
    textColor: /^#[0-9a-fA-F]{6}$/.test(visual.textColor || "")
      ? visual.textColor
      : DEFAULT_VISUAL.textColor,
    textLayout: ["left", "center", "right"].includes(visual.textLayout)
      ? visual.textLayout
      : DEFAULT_VISUAL.textLayout,
  };
}

export function resolveGiftCardVisual(giftCard, giftCardSettings) {
  const visuals = Array.isArray(giftCardSettings?.visuals)
    ? giftCardSettings.visuals
    : [];
  const selected = visuals.find(
    (visual) => String(visual?._id) === String(giftCard?.visualId || ""),
  );
  const defaultVisual = visuals.find(
    (visual) =>
      String(visual?._id) === String(giftCardSettings?.defaultVisualId || ""),
  );

  return normalizeGiftCardVisual(selected || defaultVisual || visuals[0]);
}

function getPositionClass(layout) {
  if (layout === "left") return "ambassade-gift-visual__copy--left";
  if (layout === "center") return "ambassade-gift-visual__copy--center";
  return "ambassade-gift-visual__copy--right";
}

export default function GiftCardVisualPreview({
  giftCard,
  giftCardSettings,
  restaurantName,
  formData = {},
  hidePrice = false,
  className = "",
}) {
  const visual = resolveGiftCardVisual(giftCard, giftCardSettings);
  const beneficiary = [
    formData.beneficiaryFirstName,
    formData.beneficiaryLastName,
  ]
    .filter(Boolean)
    .join(" ");
  const showPrice = !hidePrice && giftCard?.value !== undefined;

  return (
    <div
      className={`ambassade-gift-visual ${className}`.trim()}
      style={{ backgroundImage: `url(${visual.imageUrl})` }}
      role="img"
      aria-label={`Aperçu de la carte cadeau${
        giftCard?.description ? ` ${giftCard.description}` : ""
      }`}
    >
      <div
        className={`ambassade-gift-visual__copy ${getPositionClass(
          visual.textLayout,
        )}`}
        style={{ color: visual.textColor }}
      >
        <small>{restaurantName || "L’Ambassade"}</small>
        <h2>Carte cadeau</h2>
        {showPrice ? <strong>{giftCard.value} €</strong> : null}
        {giftCard?.description ? <p>{giftCard.description}</p> : null}
        {beneficiary ? <p>Pour {beneficiary}</p> : null}
        {formData.comment ? <em>« {formData.comment} »</em> : null}
        {formData.sender ? <p>De la part de {formData.sender}</p> : null}
      </div>
    </div>
  );
}
