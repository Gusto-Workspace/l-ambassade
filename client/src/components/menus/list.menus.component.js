import Image from "next/image";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import EditorialHeadingComponent from "../_shared/editorial-heading/editorial-heading.component";
import { getVisibleDishCategories } from "@/_assets/utils/site-display.utils";
import {
  buildMenuBlocks,
  getMenuPriceLabel,
  getMenuTitle,
  getVisibleMenus,
  isMenuBlankLine,
  isMenuSeparatorLabel,
} from "@/_assets/utils/menu-display.utils";

function MenuList({ items }) {
  return (
    <div className="ambassade-menu-list">
      {items.map((item) => (
        <article key={item.id || item.name} className="ambassade-menu-item">
          <div>
            <h3>{item.name}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </div>
          {item.price ? <strong>{item.price}</strong> : null}
        </article>
      ))}
    </div>
  );
}

function MenuTitle({ children }) {
  return (
    <div className="ambassade-menu-title ambassade-menu-title--copper">
      <h2 className="ambassade-display">{children}</h2>
      <span aria-hidden="true">✦</span>
    </div>
  );
}

function buildCategoryBlocks(categories) {
  return categories.flatMap((category) => {
    const blocks = [];

    if (category.items.length > 0) {
      blocks.push({
        id: `category-${category.id}`,
        title: category.title,
        description: category.description,
        items: category.items,
        parentTitle: "",
      });
    }

    for (const subCategory of category.subCategories) {
      blocks.push({
        id: `subcategory-${subCategory.id}`,
        title: subCategory.title,
        description: "",
        items: subCategory.items,
        parentTitle: category.title,
      });
    }

    return blocks;
  });
}

function buildRows(items, size = 2) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function CategoryBlock({ block, index }) {
  return (
    <RevealOnScrollComponent
      id={block.id}
      variant={index % 2 ? "right" : "up"}
      className="ambassade-menu-block"
    >
      {block.parentTitle ? (
        <p className="ambassade-menu-parent-label">{block.parentTitle}</p>
      ) : null}
      <MenuTitle>{block.title}</MenuTitle>
      {block.description ? (
        <p className="ambassade-menu-intro">{block.description}</p>
      ) : null}
      <MenuList items={block.items} />
    </RevealOnScrollComponent>
  );
}

function MenuOffer({ menu, index }) {
  const blocks = buildMenuBlocks(menu);
  const price = getMenuPriceLabel(menu);

  return (
    <RevealOnScrollComponent
      variant="up"
      delay={index * 80}
      className="ambassade-menu-offer"
    >
      <div className="ambassade-menu-offer__heading">
        <MenuTitle>{getMenuTitle(menu, index)}</MenuTitle>
        {price ? <strong>{price}</strong> : null}
      </div>
      {menu.description ? (
        <p className="ambassade-menu-intro">{menu.description}</p>
      ) : null}
      <div className="ambassade-menu-offer__blocks">
        {blocks.map((block) => (
          <section key={block.id} className="ambassade-menu-offer__block">
            <div className="ambassade-menu-offer__block-heading">
              {block.title ? <h3>{block.title}</h3> : null}
              {block.price ? <strong>{block.price}</strong> : null}
            </div>
            {(block.lines || []).map((line, lineIndex) =>
              isMenuBlankLine(line) ? (
                <div key={`${block.id}-blank-${lineIndex}`} className="h-3" />
              ) : isMenuSeparatorLabel(line) ? (
                <p
                  key={`${block.id}-separator-${lineIndex}`}
                  className="ambassade-menu-offer__separator"
                >
                  {line}
                </p>
              ) : (
                <p key={`${block.id}-line-${lineIndex}`}>{line}</p>
              ),
            )}
          </section>
        ))}
      </div>
    </RevealOnScrollComponent>
  );
}

export default function ListMenusComponent({ restaurantData }) {
  const categories = getVisibleDishCategories(restaurantData);
  const categoryBlocks = buildCategoryBlocks(categories);
  const [firstRow = [], ...remainingRows] = buildRows(categoryBlocks);
  const menus = getVisibleMenus(restaurantData);
  const navigationItems = [
    ...categoryBlocks.map((block) => ({ id: block.id, label: block.title })),
    ...(menus.length > 0 ? [{ id: "menus", label: "Menus" }] : []),
  ];

  return (
    <section id="menu-content" className="ambassade-menu-page">
      <EditorialHeadingComponent
        emblem
        title="Au rythme des saisons et des envies."
        description="Notre carte évolue au fil des produits, des rencontres et de l’inspiration de la Cheffe."
      />

      {navigationItems.length > 0 ? (
        <nav
          className="ambassade-menu-tabs"
          aria-label="Catégories de la carte"
        >
          {navigationItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      {categoryBlocks.length > 0 ? (
        <>
          <div className="ambassade-menu-shell">
            <div className="ambassade-menu-content">
              <div className="ambassade-menu-columns">
                {firstRow.map((block, index) => (
                  <CategoryBlock key={block.id} block={block} index={index} />
                ))}
              </div>
            </div>
          </div>

          <RevealOnScrollComponent className="ambassade-menu-separator">
            <Image
              src="/img/menu/separation.webp"
              alt="Cuisine de L’Ambassade"
              fill
              sizes="100vw"
              className="object-cover object-[center_62%]"
            />
            <span>La cuisine de L’Ambassade&nbsp;&nbsp; ✦</span>
          </RevealOnScrollComponent>

          {remainingRows.length > 0 ? (
            <div className="ambassade-menu-shell ambassade-menu-shell--continuation">
              <div className="ambassade-menu-content ambassade-menu-rows">
                {remainingRows.map((row, rowIndex) => (
                  <div
                    key={`category-row-${rowIndex}`}
                    className="ambassade-menu-columns ambassade-menu-columns--dynamic-row"
                  >
                    {row.map((block, index) => (
                      <CategoryBlock
                        key={block.id}
                        block={block}
                        index={index}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {menus.length > 0 ? (
        <div
          id="menus"
          className="ambassade-menu-shell ambassade-menu-shell--menus"
        >
          <div className="ambassade-menu-content">
            <div className="ambassade-menu-menu-heading">
              <p>Formules</p>
              <h2 className="ambassade-display">Les menus</h2>
            </div>
            <div className="ambassade-menu-offers">
              {menus.map((menu, index) => (
                <MenuOffer key={menu._id || index} menu={menu} index={index} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!categoryBlocks.length && !menus.length ? (
        <div className="ambassade-menu-shell">
          <div className="ambassade-menu-content">
            <p className="ambassade-menu-note">
              La carte du moment sera disponible prochainement.
            </p>
          </div>
        </div>
      ) : (
        <p className="ambassade-menu-note">
          La carte évolue selon les saisons et les arrivages. La liste des
          allergènes est disponible sur simple demande.
        </p>
      )}
    </section>
  );
}
