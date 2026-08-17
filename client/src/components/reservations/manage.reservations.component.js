import Link from "next/link";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  TriangleAlert,
  Users,
} from "lucide-react";

import { GlobalContext } from "@/contexts/global.context";
import { buildContactInfos } from "@/_assets/utils/contact.utils";
import FooterComponent from "@/components/_shared/footer/footer.component";
import BannerComponent from "@/components/_shared/banner/banner.component";
import NavComponent from "@/components/_shared/nav/nav.component";
import SectionHeadingComponent from "@/components/_shared/section-heading.component";
import { parseReservationDateValue } from "@/utils/reservations";

export default function ManageReservationsComponent({
  reservationId,
  apiBaseUrl,
}) {
  const { restaurantContext } = useContext(GlobalContext);
  const restaurant = restaurantContext?.restaurantData;
  const restaurantLoading = restaurantContext?.dataLoading;
  const heroRef = useRef(null);
  const [showScrolledNav, setShowScrolledNav] = useState(false);

  const [reservation, setReservation] = useState(null);
  const [management, setManagement] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const contactInfos = useMemo(
    () => buildContactInfos(restaurant),
    [restaurant],
  );
  const phoneInfo = contactInfos.find((item) => item.key === "phone");
  const emailInfo = contactInfos.find((item) => item.key === "email");
  const contactHref = phoneInfo?.href || emailInfo?.href || "/contact";

  const reservationRestaurantId = useMemo(
    () =>
      String(
        reservation?.restaurant_id?._id || reservation?.restaurant_id || "",
      ),
    [reservation],
  );

  const restaurantMismatch = useMemo(() => {
    if (!reservationRestaurantId || !restaurant?._id || restaurantLoading) {
      return false;
    }

    return String(restaurant._id) !== reservationRestaurantId;
  }, [reservationRestaurantId, restaurant?._id, restaurantLoading]);

  const reservationStatusLabel = getReservationStatusLabel(reservation?.status);
  const isAwaitingBankHold =
    String(reservation?.status || "") === "AwaitingBankHold" &&
    management?.reasonCode !== "BANK_HOLD_EXPIRED";
  const isCanceled = String(reservation?.status || "") === "Canceled";
  const canCancel = management?.canCancel === true && !restaurantMismatch;

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrolledNav(entry.intersectionRatio <= 0.1);
      },
      {
        threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    observer.observe(heroEl);

    return () => observer.disconnect();
  }, []);

  const fetchReservation = useCallback(async () => {
    if (!reservationId || !apiBaseUrl) {
      setLoadError("Ce lien de réservation est invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError("");

      const response = await fetch(
        `${apiBaseUrl}/reservations/${reservationId}`,
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getReservationApiErrorMessage({
            payload: data,
            status: response.status,
            fallbackMessage: "Impossible de retrouver cette réservation.",
          }),
        );
      }

      if (!data?.reservation) {
        throw new Error("Impossible de retrouver cette réservation.");
      }

      setReservation(data.reservation);
      setManagement(data.management || null);
      setShowCancelConfirm(false);
    } catch (fetchError) {
      setLoadError(
        fetchError?.message || "Impossible de retrouver cette réservation.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, reservationId]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  async function handleCancelReservation() {
    if (!reservation?._id || !apiBaseUrl) return;

    try {
      setIsCanceling(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${apiBaseUrl}/reservations/${reservation._id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getReservationApiErrorMessage({
            payload: data,
            status: response.status,
            fallbackMessage: "Impossible d’annuler la réservation.",
          }),
        );
      }

      setReservation(data.reservation || null);
      setManagement(data.management || null);
      setShowCancelConfirm(false);
      setSuccessMessage(
        data?.message || "Votre réservation a bien été annulée.",
      );
    } catch (cancelError) {
      setError(cancelError?.message || "Impossible d’annuler la réservation.");
    } finally {
      setIsCanceling(false);
    }
  }

  return (
    <div className="relative bg-[var(--site-cream)]">
      <NavComponent
        isVisible={!showScrolledNav}
        scrolled={false}
      />

      <NavComponent
        isVisible={showScrolledNav}
        scrolled
      />

      <main>
        <div ref={heroRef}>
          <BannerComponent
            title="Annuler ma réservation"
            eyebrow="Gestion en ligne"
            description="Retrouvez ici le détail de votre réservation et, si nécessaire, annulez-la en quelques instants. Pour toute modification, contactez directement le restaurant."
            imgUrl="home/art.webp"
          />
        </div>

        <section className="relative overflow-hidden px-5 pb-16 pt-4 tablet:px-8 tablet:pb-20 desktop:px-[90px]">
          <div className="relative z-10 mx-auto max-w-[1500px]">
            {isLoading || (reservation && restaurantLoading) ? (
              <StateCard
                eyebrow="Réservation"
                title="Chargement en cours"
                description="Nous retrouvons votre réservation pour préparer son annulation si nécessaire."
                loading
              />
            ) : null}

            {!isLoading && loadError ? (
              <StateCard
                eyebrow="Lien invalide"
                title="Réservation introuvable"
                description={loadError}
                actions={[
                  {
                    href: "/reservations",
                    label: "Réserver une table",
                  },
                  {
                    href: contactHref,
                    label: "Contacter le restaurant",
                    variant: "outline",
                  },
                ]}
              />
            ) : null}

            {!isLoading && !loadError && restaurantMismatch ? (
              <StateCard
                eyebrow="Lien invalide"
                title="Ce lien ne correspond pas à ce restaurant"
                description="La réservation associée à ce lien n’est pas rattachée au site L’Ambassade."
                actions={[
                  {
                    href: "/reservations",
                    label: "Retour aux réservations",
                  },
                  {
                    href: contactHref,
                    label: "Contacter le restaurant",
                    variant: "outline",
                  },
                ]}
              />
            ) : null}

            {!isLoading && !loadError && !restaurantMismatch && !restaurant ? (
              <StateCard
                eyebrow="Indisponible"
                title="Le restaurant n’a pas pu être chargé"
                description="Nous n’avons pas réussi à charger les informations du restaurant pour vérifier ce lien."
                actions={[
                  {
                    href: contactHref,
                    label: "Contacter le restaurant",
                  },
                  {
                    href: "/reservations",
                    label: "Retour aux réservations",
                    variant: "outline",
                  },
                ]}
              />
            ) : null}

            {!isLoading && !loadError && !restaurantMismatch && restaurant ? (
              <div className="grid gap-8 desktop:grid-cols-[1.02fr_0.98fr] desktop:items-start">
                <div className="site-card relative overflow-hidden rounded-[34px] p-6 tablet:p-8 desktop:p-10">
                  <div className="absolute right-[-34px] top-[-30px] h-[120px] w-[120px] rounded-full border border-[rgba(223,160,132,0.22)] bg-[rgba(223,160,132,0.08)]" />

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <StatusPill status={reservation?.status} />
                    {reservation?.reservationTime ? (
                      <span className="rounded-full border border-[var(--site-line)] bg-white/70 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink-soft)]">
                        {formatTimeLabel(reservation?.reservationTime)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8">
                    {renderPrimaryContent({
                      brand,
                      reservation,
                      management,
                      isAwaitingBankHold,
                      isCanceled,
                      canCancel,
                      error,
                      successMessage,
                      isCanceling,
                      showCancelConfirm,
                      setShowCancelConfirm,
                      handleCancelReservation,
                      contactHref,
                      reservationId,
                    })}
                  </div>
                </div>

                <aside className="site-card rounded-[34px] p-6 tablet:p-8 desktop:p-10">
                  <p className="script-font text-[36px] leading-none text-[var(--site-orange)] tablet:text-[42px]">
                    {brand.main}
                  </p>
                  <h2 className="yeseva-one-regular mt-2 text-[42px] leading-[0.92] text-[var(--site-ink)] tablet:text-[52px]">
                    {brand.accent}
                  </h2>
                  <p className="mt-5 text-[16px] leading-[1.8] text-[var(--site-ink-soft)]">
                    Vérifiez le détail de votre venue avant toute action. Pour
                    un changement de date, d’horaire ou de nombre de couverts,
                    contactez directement le restaurant.
                  </p>

                  <div className="mt-8 space-y-5">
                    <SummaryItem
                      icon={CalendarDays}
                      label="Date"
                      value={formatReservationDateLabel(
                        reservation?.reservationDate,
                      )}
                    />
                    <SummaryItem
                      icon={Clock3}
                      label="Horaire"
                      value={formatTimeLabel(reservation?.reservationTime)}
                    />
                    <SummaryItem
                      icon={Users}
                      label="Convives"
                      value={formatGuestsLabel(reservation?.numberOfGuests)}
                    />
                    <SummaryItem
                      icon={Phone}
                      label="Téléphone"
                      value={reservation?.customerPhone || "Non renseigné"}
                    />
                    <SummaryItem
                      icon={Mail}
                      label="E-mail"
                      value={reservation?.customerEmail || "Non renseigné"}
                    />
                    <SummaryItem
                      icon={TriangleAlert}
                      label="Statut"
                      value={reservationStatusLabel}
                    />
                    <SummaryItem
                      icon={MessageSquare}
                      label="Nom"
                      value={getCustomerFullName(reservation)}
                    />
                    {reservation?.commentary ? (
                      <SummaryItem
                        icon={MessageSquare}
                        label="Commentaire"
                        value={reservation.commentary}
                      />
                    ) : null}
                  </div>

                  <div className="mt-8 rounded-[26px] border border-[rgba(223,160,132,0.24)] bg-[rgba(246,229,218,0.62)] p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--site-orange-deep)]">
                      Besoin d’aide
                    </p>
                    <p className="mt-3 text-[15px] leading-[1.8] text-[var(--site-ink-soft)]">
                      Une modification doit être traitée directement avec
                      l’équipe du restaurant.
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                      {phoneInfo?.value && phoneInfo.value !== "-" ? (
                        <ContactRow
                          href={phoneInfo.href}
                          icon={Phone}
                          label="Téléphone"
                          value={phoneInfo.value}
                        />
                      ) : null}
                      {emailInfo?.value && emailInfo.value !== "-" ? (
                        <ContactRow
                          href={emailInfo.href}
                          icon={Mail}
                          label="E-mail"
                          value={emailInfo.value}
                        />
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <FooterComponent />
    </div>
  );
}

function StateCard({
  eyebrow,
  title,
  description,
  actions = [],
  loading = false,
}) {
  return (
    <div className="site-card mx-auto max-w-[820px] rounded-[34px] px-6 py-10 text-center tablet:px-10 tablet:py-12">
      <SectionHeadingComponent
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      {loading ? (
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[var(--site-line)] bg-white/75 px-5 py-3 text-[15px] text-[var(--site-ink-soft)]">
          <Loader2 size={18} className="animate-spin" />
          Chargement...
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-4 tablet:flex-row">
          {actions.map((action) => (
            <ButtonLink
              key={`${action.href}-${action.label}`}
              href={action.href}
              variant={action.variant}
            >
              {action.label}
            </ButtonLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderPrimaryContent({
  brand,
  reservation,
  management,
  isAwaitingBankHold,
  isCanceled,
  canCancel,
  error,
  successMessage,
  isCanceling,
  showCancelConfirm,
  setShowCancelConfirm,
  handleCancelReservation,
  contactHref,
  reservationId,
}) {
  if (isAwaitingBankHold) {
    return (
      <div>
        <SectionHeadingComponent
          eyebrow="Validation requise"
          title="Votre réservation attend encore la carte"
          description="Finalisez l’empreinte bancaire pour confirmer définitivement votre venue. Pour toute modification, contactez directement le restaurant."
          align="left"
          className="mx-0 max-w-none"
        />

        <div className="mt-8 rounded-[26px] border border-[rgba(223,160,132,0.24)] bg-[rgba(246,229,218,0.62)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-[var(--site-orange-deep)]">
              <CreditCard size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-[var(--site-ink)]">
                Réservation en attente de validation
              </p>
              <p className="mt-2 text-[15px] leading-[1.8] text-[var(--site-ink-soft)]">
                Tant que cette étape n’est pas finalisée, la réservation ne peut
                pas être considérée comme confirmée.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 tablet:flex-row">
          <ButtonLink
            href={`/reservations/${reservationId}/bank-hold`}
            className="tablet:min-w-[240px]"
          >
            Finaliser la validation
          </ButtonLink>
          <ButtonLink
            href={contactHref}
            variant="outline"
            className="tablet:min-w-[220px]"
          >
            Contacter le restaurant
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (isCanceled) {
    return (
      <div>
        <SectionHeadingComponent
          eyebrow="Réservation annulée"
          title="Votre table a bien été libérée"
          description={`Cette réservation chez ${brand.full} est désormais annulée. Vous pouvez réserver un nouveau créneau à tout moment.`}
          align="left"
          className="mx-0 max-w-none"
        />

        {successMessage ? (
          <InlineAlert variant="success" className="mt-8">
            {successMessage}
          </InlineAlert>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 tablet:flex-row">
          <ButtonLink href="/reservations" className="tablet:min-w-[220px]">
            Réserver à nouveau
          </ButtonLink>
          <ButtonLink
            href={contactHref}
            variant="outline"
            className="tablet:min-w-[220px]"
          >
            Contacter le restaurant
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeadingComponent
        eyebrow="Annulation"
        title="Annuler cette réservation"
        description={`Cette page permet uniquement d’annuler votre réservation chez ${brand.full}. Pour tout ajustement, merci de contacter directement le restaurant.`}
        align="left"
        className="mx-0 max-w-none"
      />

      {error ? (
        <InlineAlert variant="error" className="mt-8">
          {error}
        </InlineAlert>
      ) : null}

      {successMessage ? (
        <InlineAlert variant="success" className="mt-8">
          {successMessage}
        </InlineAlert>
      ) : null}

      {canCancel ? (
        <>
          <div className="mt-8 rounded-[26px] border border-[rgba(176,94,77,0.16)] bg-[rgba(255,255,255,0.6)] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(223,160,132,0.18)] text-[var(--site-orange-deep)]">
                <TriangleAlert size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[var(--site-ink)]">
                  Confirmation requise
                </p>
                <p className="mt-2 text-[15px] leading-[1.8] text-[var(--site-ink-soft)]">
                  En confirmant l’annulation, votre réservation sera annulée
                  immédiatement et le créneau pourra redevenir disponible.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 tablet:flex-row">
            <button
              type="button"
              onClick={() => setShowCancelConfirm((prev) => !prev)}
              className="site-button tablet:min-w-[240px]"
            >
              Annuler la réservation
            </button>
            <ButtonLink
              href={contactHref}
              variant="outline"
              className="tablet:min-w-[220px]"
            >
              Contacter le restaurant
            </ButtonLink>
          </div>
        </>
      ) : (
        <InlineAlert variant="info" className="mt-8">
          {management?.reasonMessage ||
            "Cette réservation ne peut plus être annulée en ligne."}
        </InlineAlert>
      )}

      {showCancelConfirm ? (
        <div className="mt-8 rounded-[26px] border border-[rgba(176,94,77,0.22)] bg-[rgba(255,242,239,0.92)] p-5">
          <p className="text-[16px] font-semibold text-[var(--site-ink)]">
            Confirmez-vous l’annulation de votre réservation ?
          </p>
          <p className="mt-2 text-[15px] leading-[1.8] text-[var(--site-ink-soft)]">
            Cette action est immédiate. Si vous souhaitez simplement modifier
            votre venue, contactez le restaurant à la place.
          </p>

          <div className="mt-5 flex flex-col gap-3 tablet:flex-row">
            <button
              type="button"
              onClick={handleCancelReservation}
              disabled={isCanceling}
              className="site-button min-w-[220px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCanceling ? "Annulation..." : "Oui, annuler"}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(false)}
              className="site-button site-button--outline min-w-[220px]"
            >
              Garder ma réservation
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-4 tablet:grid-cols-3">
        <HighlightItem
          label="Date"
          value={formatReservationDateLabel(reservation?.reservationDate)}
        />
        <HighlightItem
          label="Horaire"
          value={formatTimeLabel(reservation?.reservationTime)}
        />
        <HighlightItem
          label="Convives"
          value={formatGuestsLabel(reservation?.numberOfGuests)}
        />
      </div>
    </div>
  );
}

function HighlightItem({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[rgba(223,160,132,0.24)] bg-white/55 px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-orange-deep)]">
        {label}
      </p>
      <p className="mt-3 text-[18px] leading-[1.45] text-[var(--site-ink)]">
        {value}
      </p>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4 border-b border-[rgba(223,160,132,0.18)] pb-5 last:border-b-0 last:pb-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(223,160,132,0.14)] text-[var(--site-orange-deep)]">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-orange-deep)]">
          {label}
        </p>
        <p className="mt-2 text-[16px] leading-[1.8] text-[var(--site-ink)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ContactRow({ href, icon: Icon, label, value }) {
  return (
    <a
      href={href}
      className="flex items-start gap-3 rounded-[18px] border border-[rgba(223,160,132,0.22)] bg-white/72 px-4 py-4 transition hover:opacity-85"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(223,160,132,0.14)] text-[var(--site-orange-deep)]">
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-orange-deep)]">
          {label}
        </p>
        <p className="mt-1 text-[15px] leading-[1.7] text-[var(--site-ink)]">
          {value}
        </p>
      </div>
    </a>
  );
}

function InlineAlert({ children, variant = "info", className = "" }) {
  const paletteByVariant = {
    info: "border-[rgba(223,160,132,0.24)] bg-[rgba(246,229,218,0.62)] text-[var(--site-ink)]",
    success:
      "border-[rgba(115,158,117,0.24)] bg-[rgba(236,247,236,0.88)] text-[#33543a]",
    error:
      "border-[rgba(176,94,77,0.22)] bg-[rgba(255,242,239,0.92)] text-[#8a4336]",
  };

  return (
    <div
      className={`rounded-[24px] border px-5 py-4 text-[15px] leading-[1.8] ${paletteByVariant[variant] || paletteByVariant.info} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const label = getReservationStatusLabel(status);
  const paletteByStatus = {
    Confirmed:
      "border-[rgba(115,158,117,0.25)] bg-[rgba(236,247,236,0.88)] text-[#33543a]",
    Pending:
      "border-[rgba(223,160,132,0.26)] bg-[rgba(246,229,218,0.7)] text-[var(--site-orange-deep)]",
    AwaitingBankHold:
      "border-[rgba(223,160,132,0.26)] bg-[rgba(246,229,218,0.7)] text-[var(--site-orange-deep)]",
    Canceled:
      "border-[rgba(176,94,77,0.22)] bg-[rgba(255,242,239,0.92)] text-[#8a4336]",
    Rejected:
      "border-[rgba(176,94,77,0.22)] bg-[rgba(255,242,239,0.92)] text-[#8a4336]",
    Finished:
      "border-[rgba(95,82,76,0.16)] bg-[rgba(255,255,255,0.65)] text-[var(--site-ink-soft)]",
    Active:
      "border-[rgba(95,82,76,0.16)] bg-[rgba(255,255,255,0.65)] text-[var(--site-ink-soft)]",
    Late: "border-[rgba(95,82,76,0.16)] bg-[rgba(255,255,255,0.65)] text-[var(--site-ink-soft)]",
    NoShow:
      "border-[rgba(95,82,76,0.16)] bg-[rgba(255,255,255,0.65)] text-[var(--site-ink-soft)]",
  };

  return (
    <span
      className={`rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${paletteByStatus[status] || "border-[var(--site-line)] bg-white/70 text-[var(--site-ink-soft)]"}`.trim()}
    >
      {label}
    </span>
  );
}

function ButtonLink({ href, children, variant = "primary", className = "" }) {
  const classes =
    `${variant === "outline" ? "site-button site-button--outline" : "site-button"} ${className}`.trim();
  const isExternal = /^(https?:|mailto:|tel:)/.test(String(href || ""));

  if (!href) return null;

  if (isExternal) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

function getCustomerFullName(reservation) {
  return (
    String(reservation?.customerName || "").trim() ||
    `${String(reservation?.customerFirstName || "").trim()} ${String(reservation?.customerLastName || "").trim()}`.trim() ||
    "Client"
  );
}

function formatReservationDateLabel(value) {
  const parsedDate = parseReservationDateValue(value);
  if (!parsedDate) {
    return value ? String(value) : "Date à confirmer";
  }

  return format(parsedDate, "EEEE d MMMM yyyy", { locale: fr });
}

function formatTimeLabel(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 5) : "Horaire à confirmer";
}

function formatGuestsLabel(value) {
  const guests = Number(value || 0);
  if (!guests) return "Nombre de convives à confirmer";
  return `${guests} ${guests > 1 ? "convives" : "convive"}`;
}

function getReservationStatusLabel(status) {
  const labels = {
    Pending: "En attente",
    Confirmed: "Confirmée",
    AwaitingBankHold: "Validation carte requise",
    Canceled: "Annulée",
    Rejected: "Refusée",
    Finished: "Terminée",
    Active: "En cours",
    Late: "En retard",
    NoShow: "Non honorée",
  };

  return labels[String(status || "").trim()] || "Réservation";
}

function getReservationApiErrorMessage({ payload, status, fallbackMessage }) {
  const code = String(payload?.code || "").trim();
  const message = String(payload?.message || "").trim();
  const normalizedMessage = message.toLowerCase();

  if (status === 404) {
    return "Cette réservation est introuvable ou ce lien n’est plus valide.";
  }

  if (code === "NOT_MODIFIABLE") {
    return message || "Cette réservation ne peut plus être annulée en ligne.";
  }

  if (normalizedMessage.includes("déjà annul")) {
    return "Cette réservation est déjà annulée.";
  }

  if (normalizedMessage.includes("ne peut plus être annul")) {
    return "Cette réservation ne peut plus être annulée en ligne.";
  }

  if (normalizedMessage.includes("introuvable")) {
    return "Cette réservation est introuvable ou ce lien n’est plus valide.";
  }

  return message || fallbackMessage;
}
