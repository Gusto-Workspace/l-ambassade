import { ColumnEmblem, StarOrnament } from "../../home/ornament.home.component";

export default function EditorialHeadingComponent({
  title,
  description = "",
  emblem = false,
  as: Heading = "h2",
  className = "",
}) {
  return (
    <div className={`ambassade-editorial-heading ${className}`.trim()}>
      {emblem ? <ColumnEmblem /> : null}
      <Heading className="ambassade-display">{title}</Heading>
      <StarOrnament />
      {description ? <p>{description}</p> : null}
    </div>
  );
}
