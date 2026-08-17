export default function SectionHeadingComponent({
  eyebrow = "",
  title,
  description = "",
  align = "center",
  light = false,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  eyebrowClassName = "",
}) {
  const alignmentClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";
  const titleTone = light ? "text-[var(--site-cream)]" : "text-[var(--site-ink)]";
  const descriptionTone = light
    ? "text-[rgba(246,241,232,0.82)]"
    : "text-[var(--site-ink-soft)]";
  const eyebrowTone = light
    ? "text-[rgba(246,241,232,0.7)]"
    : "text-[var(--site-orange-deep)]";

  return (
    <div className={`flex flex-col ${alignmentClass} ${className}`.trim()}>
      {eyebrow ? (
        <p
          className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${eyebrowTone} ${eyebrowClassName}`.trim()}
        >
          {eyebrow}
        </p>
      ) : null}

      <h2
        className={`yeseva-one-regular max-w-[12ch] text-balance text-[44px] leading-[0.9] tablet:text-[58px] desktop:text-[72px] ${titleTone} ${titleClassName}`.trim()}
      >
        {title}
      </h2>

      {description ? (
        <p
          className={`mt-5 max-w-[760px] text-[16px] leading-[1.85] tablet:text-[17px] ${descriptionTone} ${descriptionClassName}`.trim()}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
