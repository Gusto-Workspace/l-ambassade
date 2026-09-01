import Link from "next/link";
import { Gift, Loader2 } from "lucide-react";
import EditorialHeadingComponent from "@/components/_shared/editorial-heading/editorial-heading.component";
import {
  buildGiftCardValidityLabel,
  getVisibleGiftCards,
} from "@/_assets/utils/gift-cards.utils";
import GiftCardVisualPreview from "./visual-preview.gift-cards.component";

export default function ListGiftCardsComponent({
  restaurant,
  dataLoading = false,
}) {
  const giftCards = getVisibleGiftCards(restaurant);
  const valueGiftCards = giftCards.filter(
    (giftCard) => !String(giftCard?.description || "").trim(),
  );
  const menuGiftCards = giftCards.filter((giftCard) =>
    String(giftCard?.description || "").trim(),
  );

  return (
    <section className="ambassade-gifts-catalog" aria-labelledby="gift-cards-title">
      <EditorialHeadingComponent
        titleId="gift-cards-title"
        title="Choisissez votre attention."
        description="Une table, un moment, un souvenir : sélectionnez la carte cadeau que vous souhaitez offrir."
      />

      {dataLoading ? (
        <div className="ambassade-gifts-state" role="status">
          <Loader2 className="animate-spin" aria-hidden="true" />
          <p>Chargement des cartes cadeaux…</p>
        </div>
      ) : giftCards.length ? (
        <div className="ambassade-gifts-groups">
          <GiftCardsGroup
            title="Cartes cadeaux — Valeur"
            description="Offrez un montant à utiliser librement lors d’une prochaine venue à L’Ambassade."
            giftCards={valueGiftCards}
            restaurant={restaurant}
          />
          <GiftCardsGroup
            title="Cartes cadeaux — Menus"
            description="Offrez une expérience précise parmi les menus et formules proposés par le restaurant."
            giftCards={menuGiftCards}
            restaurant={restaurant}
          />
        </div>
      ) : (
        <div className="ambassade-gifts-state">
          <Gift aria-hidden="true" />
          <h2>Les cartes cadeaux arrivent bientôt.</h2>
          <p>Contactez directement le restaurant pour préparer votre cadeau.</p>
          <Link href="/contact" className="ambassade-button ambassade-button--outline">
            Contacter L’Ambassade
          </Link>
        </div>
      )}
    </section>
  );
}

function GiftCardsGroup({ title, description, giftCards, restaurant }) {
  if (!giftCards.length) return null;

  return (
    <section className="ambassade-gifts-group">
      <div className="ambassade-gifts-group__heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="ambassade-gifts-grid">
        {giftCards.map((giftCard) => (
          <article className="ambassade-gift-card" key={giftCard._id}>
            <GiftCardVisualPreview
              giftCard={giftCard}
              giftCardSettings={restaurant?.giftCardSettings}
              restaurantName={restaurant?.name}
            />
            <div className="ambassade-gift-card__content">
              <strong>{giftCard.value} €</strong>
              <small>
                {buildGiftCardValidityLabel(
                  giftCard,
                  restaurant?.giftCardSettings,
                )}
              </small>
              <Link
                href={{ pathname: "/gift-cards/buy", query: { id: giftCard._id } }}
                className="ambassade-button ambassade-button--copper"
              >
                Choisir cette carte
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
