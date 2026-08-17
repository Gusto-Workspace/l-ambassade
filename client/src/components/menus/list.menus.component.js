import Image from "next/image";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import EditorialHeadingComponent from "../_shared/editorial-heading/editorial-heading.component";

const sections = [
  { id: "tablee", label: "La tablée" },
  { id: "partager", label: "À partager" },
  { id: "feu", label: "Le feu" },
  { id: "mer", label: "La mer" },
  { id: "assiettes", label: "Les assiettes" },
  { id: "desserts", label: "Les desserts" },
];

const planches = [
  {
    name: "Planche L’Ambassade",
    price: "39€",
    description:
      "Cœurs d’artichauts rôtis & stracciatella · Poivrons grillés & purée d’olives noires confites · Houmous & tartare de betterave · Accras de morue de Jo · Brochette de mortadelle IGP grillée & sauce mojo · Focaccia maison grillée.",
    note: "Pour 3 à 4 personnes.",
  },
  {
    name: "Planche Soleil",
    price: "28€",
    description:
      "Poivrons grillés & purée d’olives noires confites · Cœurs d’artichauts rôtis & stracciatella · Focaccia maison grillée.",
    note: "Pour 2 à 3 personnes.",
  },
  {
    name: "Planche Terroir",
    price: "28€",
    description:
      "Terrine de poulet au basilic · Charcuteries artisanales de la Ferme des Chênes · Mortadelle IGP · Pickles maison · Focaccia maison grillée.",
    note: "Pour 2 à 3 personnes.",
  },
];

const sharing = [
  ["Houmous & tartare de betterave", "Panko citronné.", "12€"],
  [
    "Terrine de poulet au basilic en gelée",
    "Recette exclusive réalisée pour L’Ambassade, cornichons, persil plat & zestes de citron.",
    "13€",
  ],
  ["Brochette de mortadelle IGP grillée", "Sauce mojo.", "14€"],
  ["Accras de morue de Jo", "Sauce créole.", "14€"],
  ["Calamars frits", "Sauce tartare.", "16€"],
  ["Cœurs d’artichauts rôtis & stracciatella", "Pickles maison.", "15€"],
];

const fire = [
  ["Pluma ibérique grillée", "Beurre de sauge. Origine Espagne.", "24€"],
  ["Magret de canard au feu de bois", "Demi magret 17€ · Magret entier 29€.", "17€ / 29€"],
  ["Entrecôte grillée", "Environ 500 g. Origine France.", "34€"],
  [
    "Larme de L’Ambassade",
    "Onglet grillé au feu de bois, salade croquante et sauce signature aux agrumes.",
    "27€",
  ],
  ["Brochettes de cœurs de canard", "Beurre persillée. Origine France.", "21€"],
  ["Brochette XXL de L’Ambassade", "Magret de canard · Bœuf mariné · Gremolata.", "79€"],
];

const sea = [
  [
    "Gambas lardées à la ventrèche de porc noir",
    "Sauce verte, condiment de céleri au citron & aneth, légumes rôtis & focaccia grillée.",
    "17€ / 29€",
  ],
  ["Tentacule de poulpe grillée", "Écrasé de pommes de terre aux olives taggiasche & mojo verde.", "29€"],
  ["Langoustines snackées au beurre citronné", "Légumes rôtis.", "36€"],
  ["Ravioli del plin aux herbes", "Beurre de sauge & Parmigiano Reggiano DOP.", "19€"],
];

const summer = [
  ["Salade tiède de Porchetta IGP", "Pommes grenailles rôties, pickles d’oignon rouge & herbes fraîches.", "20€"],
  ["Tartare de bœuf façon “cruda”", "Frites maison. Origine France.", "22€"],
  ["Salade de poulpe grillé", "Pommes grenailles, herbes fraîches & vinaigrette citronnée.", "22€"],
  ["Melon du Quercy", "Coppa Ferme des Chênes & Cabécou.", "20€"],
];

const desserts = [
  ["Les Desserts de L’Ambassade", "Nos créations maison évoluent chaque semaine.", "9€"],
  ["La Pâtisserie de Chez Lucien", "La création de la semaine de notre artisan pâtissier.", "11€"],
  ["Assiette de fromages", "Sélection du moment.", "8€"],
  ["Glaces artisanales « Glaces des Alpes »", "Maître Artisan, la boule.", "3€"],
];

function MenuList({ items }) {
  return (
    <div className="ambassade-menu-list">
      {items.map(([name, description, price]) => (
        <article key={name} className="ambassade-menu-item">
          <div>
            <h3>{name}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <strong>{price}</strong>
        </article>
      ))}
    </div>
  );
}

function MenuTitle({ children, tone = "copper" }) {
  return (
    <div className={`ambassade-menu-title ambassade-menu-title--${tone}`}>
      <h2 className="ambassade-display">{children}</h2>
      <span aria-hidden="true">✦</span>
    </div>
  );
}

export default function ListMenusComponent() {
  return (
    <section id="menu-content" className="ambassade-menu-page">
      <EditorialHeadingComponent
        emblem
        title="Au rythme des saisons et des envies."
        description="Notre carte évolue au fil des produits, des rencontres et de l’inspiration de la Cheffe."
      />

      <nav className="ambassade-menu-tabs" aria-label="Catégories de la carte">
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.label}
          </a>
        ))}
      </nav>

      <div className="ambassade-menu-shell">
        <aside className="ambassade-menu-sidebar">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </aside>

        <div className="ambassade-menu-content">
          <div className="ambassade-menu-columns ambassade-menu-columns--top">
            <RevealOnScrollComponent id="tablee" className="ambassade-menu-block">
              <MenuTitle>La Tablée</MenuTitle>
              <p className="ambassade-menu-intro">L’esprit de L’Ambassade autour d’un verre.</p>
              <div className="ambassade-menu-list">
                {planches.map((item) => (
                  <article key={item.name} className="ambassade-menu-item ambassade-menu-item--planche">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <em>{item.note}</em>
                    </div>
                    <strong>{item.price}</strong>
                  </article>
                ))}
              </div>
            </RevealOnScrollComponent>

            <RevealOnScrollComponent id="partager" variant="right" className="ambassade-menu-block">
              <MenuTitle>À partager… ou pas</MenuTitle>
              <MenuList items={sharing} />
            </RevealOnScrollComponent>
          </div>
        </div>
      </div>

      <RevealOnScrollComponent className="ambassade-menu-separator">
        <Image
          src="/img/menu/separation.webp"
          alt="Brochettes de mortadelle servies à partager"
          fill
          sizes="100vw"
          className="object-cover object-[center_62%]"
        />
        <span>La cuisine de L’Ambassade&nbsp;&nbsp; ✦</span>
      </RevealOnScrollComponent>

      <div className="ambassade-menu-shell ambassade-menu-shell--continuation">
        <div className="ambassade-menu-content">
          <div className="ambassade-menu-columns">
            <RevealOnScrollComponent id="feu" className="ambassade-menu-block">
              <MenuTitle>Le Feu</MenuTitle>
              <p className="ambassade-menu-intro">Le goût des braises et des belles cuissons.</p>
              <MenuList items={fire} />
            </RevealOnScrollComponent>

            <RevealOnScrollComponent id="mer" variant="right" className="ambassade-menu-block">
              <MenuTitle tone="navy">La Mer</MenuTitle>
              <p className="ambassade-menu-intro">L’iode et les braises.</p>
              <MenuList items={sea} />
            </RevealOnScrollComponent>
          </div>

          <div className="ambassade-menu-columns ambassade-menu-columns--bottom">
            <RevealOnScrollComponent id="assiettes" className="ambassade-menu-block">
              <MenuTitle tone="forest">Les assiettes estivales</MenuTitle>
              <MenuList items={summer} />
            </RevealOnScrollComponent>

            <RevealOnScrollComponent id="desserts" className="ambassade-menu-block">
              <MenuTitle>On a gardé de la place pour…</MenuTitle>
              <MenuList items={desserts} />
            </RevealOnScrollComponent>

            <RevealOnScrollComponent className="ambassade-menu-block ambassade-menu-kids">
              <div className="ambassade-menu-kids__face" aria-hidden="true">☺</div>
              <MenuTitle>Les petits ambassadeurs</MenuTitle>
              <p>Un sirop</p>
              <p>Ravioli del plin aux herbes</p>
              <p>ou</p>
              <p>Steak haché & frites maison</p>
              <p>Une boule de glace artisanale</p>
              <strong>12€</strong>
            </RevealOnScrollComponent>
          </div>

          <p className="ambassade-menu-note">
            La carte évolue selon les saisons et les arrivages. La liste des allergènes
            est disponible sur simple demande.
          </p>
        </div>
      </div>
    </section>
  );
}
