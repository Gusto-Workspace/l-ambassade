import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Loader2,
  ChevronDown,
  CalendarDays,
  Clock3,
  Users,
  User,
  Phone,
  Mail,
  PencilLine,
  Check,
} from "lucide-react";
import Image from "next/image";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import {
  formatReservationDateForApi,
  getAvailableReservationTimes,
  getReservationTimeOptions,
  isReservationDateClosed,
  parseReservationDateValue,
} from "@/utils/reservations";
export default function FormReservationComponent({
  apiBaseUrl,
  restaurant,
  onBooked,
  dataLoading,
}) {
  const router = useRouter();
  const [reservationData, setReservationData] = useState({
    reservationDate: new Date(),
    reservationTime: "",
    numberOfGuests: "2",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    commentary: "",
    table: "",
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timeOptions, setTimeOptions] = useState([]);
  const [
    resolvedAvailabilitySelectionKey,
    setResolvedAvailabilitySelectionKey,
  ] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState({});
  const [reservationsList, setReservationsList] = useState([]);
  const [slotCoverUsage, setSlotCoverUsage] = useState([]);
  const [reservationsListLoading, setReservationsListLoading] = useState(false);
  const [hasAppliedQueryPrefill, setHasAppliedQueryPrefill] = useState(false);
  const [pendingPrefilledTime, setPendingPrefilledTime] = useState("");
  const parameters =
    restaurant?.reservationsSettings ||
    restaurant?.reservations?.parameters ||
    {};
  const manage = !!parameters.manage_disponibilities;
  const [idempotencyKey] = useState(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `resa_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  });
  const PENDING_BANK_HOLD_STORAGE_KEY = "gm_pending_bank_hold";
  const [pendingBankHoldReservation, setPendingBankHoldReservation] =
    useState(null);
  const [showPendingBankHoldModal, setShowPendingBankHoldModal] =
    useState(false);
  const [isCancelingPendingBankHold, setIsCancelingPendingBankHold] =
    useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const datePickerRef = useRef(null);
  const fetchReservationsList = useCallback(async () => {
    if (!apiBaseUrl || !restaurant?._id) {
      setReservationsList([]);
      setSlotCoverUsage([]);
      return [];
    }
    try {
      setReservationsListLoading(true);
      const res = await fetch(
        `${apiBaseUrl}/public/restaurants/${restaurant._id}/reservations`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || "Impossible de charger les réservations.",
        );
      }
      const nextReservations = Array.isArray(data?.reservations)
        ? data.reservations
        : [];
      const nextSlotCoverUsage = Array.isArray(data?.slotCoverUsage)
        ? data.slotCoverUsage
        : [];
      setReservationsList(nextReservations);
      setSlotCoverUsage(nextSlotCoverUsage);
      return nextReservations;
    } catch (error) {
      console.error("[fetchReservationsList]", error);
      setReservationsList([]);
      setSlotCoverUsage([]);
      return [];
    } finally {
      setReservationsListLoading(false);
    }
  }, [apiBaseUrl, restaurant?._id]);
  useEffect(() => {
    setReservationData((prev) => ({ ...prev, table: manage ? "auto" : "" }));
  }, [manage]);

  useEffect(() => {
    fetchReservationsList();
  }, [fetchReservationsList]);

  useEffect(() => {
    if (!router.isReady || hasAppliedQueryPrefill) return;

    const nextDate = parseReservationDateValue(router.query.reservationDate);
    const nextTime = normalizeReservationTimeValue(
      router.query.reservationTime,
    );
    const nextGuests = normalizeGuestsValue(router.query.numberOfGuests);

    if (!nextDate && !nextTime && !nextGuests) {
      setHasAppliedQueryPrefill(true);
      return;
    }

    setReservationData((prev) => ({
      ...prev,
      reservationDate: nextDate || prev.reservationDate,
      reservationTime: nextTime || "",
      numberOfGuests: nextGuests || prev.numberOfGuests,
    }));
    setPendingPrefilledTime(nextTime || "");
    setHasAppliedQueryPrefill(true);
  }, [
    hasAppliedQueryPrefill,
    router.isReady,
    router.query.numberOfGuests,
    router.query.reservationDate,
    router.query.reservationTime,
  ]);

  useEffect(() => {
    async function restorePendingBankHold() {
      try {
        const raw = localStorage.getItem(PENDING_BANK_HOLD_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.reservationId || !parsed?.restaurantId) {
          localStorage.removeItem(PENDING_BANK_HOLD_STORAGE_KEY);
          return;
        }
        if (String(parsed.restaurantId) !== String(restaurant?._id)) {
          return;
        }
        const res = await fetch(
          `${apiBaseUrl}/reservations/${parsed.reservationId}`,
        );
        if (!res.ok) {
          localStorage.removeItem(PENDING_BANK_HOLD_STORAGE_KEY);
          return;
        }
        const data = await res.json();
        const reservation = data?.reservation;
        if (!reservation) {
          localStorage.removeItem(PENDING_BANK_HOLD_STORAGE_KEY);
          return;
        }
        const isAwaiting =
          String(reservation.status) === "AwaitingBankHold" &&
          Boolean(reservation?.bankHold?.enabled);
        const isExpired =
          reservation?.bankHold?.expiresAt &&
          new Date(reservation.bankHold.expiresAt).getTime() <= Date.now();
        if (!isAwaiting || isExpired) {
          localStorage.removeItem(PENDING_BANK_HOLD_STORAGE_KEY);
          return;
        }
        setPendingBankHoldReservation({
          reservationId: String(reservation._id),
          restaurantId: String(reservation.restaurant_id),
          customerFirstName: reservation.customerFirstName || "",
          reservationDate: reservation.reservationDate,
          reservationTime: reservation.reservationTime,
          numberOfGuests: reservation.numberOfGuests,
          expiresAt: reservation?.bankHold?.expiresAt || null,
        });
        setShowPendingBankHoldModal(true);
      } catch (error) {
        console.error("[restorePendingBankHold]", error);
        localStorage.removeItem(PENDING_BANK_HOLD_STORAGE_KEY);
      }
    }
    if (restaurant?._id && apiBaseUrl) {
      restorePendingBankHold();
    }
  }, [apiBaseUrl, restaurant?._id]);
  useEffect(() => {
    if (!restaurant?._id || !reservationData.reservationDate || dataLoading) {
      setAvailableTimes([]);
      setTimeOptions([]);
      setResolvedAvailabilitySelectionKey("");
      setIsLoading(Boolean(dataLoading));
      return;
    }
    if (reservationsListLoading) {
      setIsLoading(true);
      return;
    }

    const nextSelectionKey = getAvailabilitySelectionKey({
      reservationDate: reservationData.reservationDate,
      numberOfGuests: reservationData.numberOfGuests,
    });

    setIsLoading(true);
    const nextAvailableTimes = getAvailableReservationTimes({
      reservationDate: reservationData.reservationDate,
      numberOfGuests: reservationData.numberOfGuests,
      restaurant,
      reservationsList,
      slotCoverUsage,
    });
    setAvailableTimes(nextAvailableTimes);
    setTimeOptions(
      getReservationTimeOptions({
        reservationDate: reservationData.reservationDate,
        numberOfGuests: reservationData.numberOfGuests,
        restaurant,
        reservationsList,
        slotCoverUsage,
      }),
    );
    setResolvedAvailabilitySelectionKey(nextSelectionKey);
    setIsLoading(false);
  }, [
    dataLoading,
    restaurant,
    reservationData.reservationDate,
    reservationData.numberOfGuests,
    reservationsList,
    slotCoverUsage,
    reservationsListLoading,
  ]);
  useEffect(() => {
    if (
      !pendingPrefilledTime ||
      !restaurant?._id ||
      dataLoading ||
      reservationsListLoading ||
      isLoading ||
      resolvedAvailabilitySelectionKey !==
        getAvailabilitySelectionKey({
          reservationDate: reservationData.reservationDate,
          numberOfGuests: reservationData.numberOfGuests,
        })
    ) {
      return;
    }

    if (reservationData.reservationTime !== pendingPrefilledTime) {
      setPendingPrefilledTime("");
      return;
    }
    if (timeOptions.some((option) => option.time === pendingPrefilledTime)) {
      setInvalidFields((prev) => {
        if (!prev.reservationTime) return prev;

        const nextInvalidFields = { ...prev };
        delete nextInvalidFields.reservationTime;
        return nextInvalidFields;
      });
      setPendingPrefilledTime("");
      return;
    }

    setReservationData((prev) => ({
      ...prev,
      reservationTime: "",
    }));
    setInvalidFields((prev) => ({
      ...prev,
      reservationTime: true,
    }));
    setError(
      "Le créneau transmis par la booking bar n’est plus disponible. Merci d’en choisir un autre.",
    );
    setPendingPrefilledTime("");
  }, [
    timeOptions,
    dataLoading,
    isLoading,
    pendingPrefilledTime,
    reservationsListLoading,
    resolvedAvailabilitySelectionKey,
    restaurant?._id,
    reservationData.numberOfGuests,
    reservationData.reservationDate,
    reservationData.reservationTime,
  ]);
  useEffect(() => {
    if (!showCalendar) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!datePickerRef.current) {
        return;
      }

      if (!datePickerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showCalendar]);
  function formatTimeDisplay(time) {
    const [h, m] = time.split(":");
    return `${h}h${m}`;
  }
  function handleInputChange(e) {
    const { name, value } = e.target;
    setError(null);
    setSuccessMessage("");
    setReservationData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "numberOfGuests" ? { reservationTime: "" } : {}),
    }));
    setInvalidFields((prev) => {
      if (!prev[name] && !(name === "numberOfGuests" && prev.reservationTime)) {
        return prev;
      }

      const nextInvalidFields = { ...prev };
      delete nextInvalidFields[name];

      if (name === "numberOfGuests") {
        delete nextInvalidFields.reservationTime;
      }

      return nextInvalidFields;
    });
  }
  function handleDateChange(d) {
    setError(null);
    setSuccessMessage("");
    setShowCalendar(false);
    setReservationData((prev) => ({
      ...prev,
      reservationDate: d,
      reservationTime: "",
    }));
    setInvalidFields((prev) => {
      if (!prev.reservationTime) return prev;

      const nextInvalidFields = { ...prev };
      delete nextInvalidFields.reservationTime;
      return nextInvalidFields;
    });
  }
  function disableClosedDays({ date, view }) {
    if (view !== "month") return false;
    return isReservationDateClosed({ reservationDate: date, restaurant });
  }
  function handleResumePendingBankHold() {
    if (!pendingBankHoldReservation?.reservationId) return;
    window.location.href = `/reservations/${pendingBankHoldReservation.reservationId}/bank-hold`;
  }
  async function handleCancelPendingBankHold() {
    if (!pendingBankHoldReservation?.reservationId) return;
    try {
      setIsCancelingPendingBankHold(true);
      const res = await fetch(
        `${apiBaseUrl}/reservations/${pendingBankHoldReservation.reservationId}/cancel-pending-bank-hold`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || "Impossible d’annuler la réservation en attente.",
        );
      }
      localStorage.removeItem(PENDING_BANK_HOLD_STORAGE_KEY);
      setPendingBankHoldReservation(null);
      setShowPendingBankHoldModal(false);
      await fetchReservationsList();
    } catch (err) {
      setError(
        err?.message || "Impossible d’annuler la réservation en attente.",
      );
    } finally {
      setIsCancelingPendingBankHold(false);
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");
    const nextInvalidFields =
      getMissingRequiredReservationFields(reservationData);

    if (Object.keys(nextInvalidFields).length > 0) {
      setInvalidFields((prev) => ({
        ...prev,
        ...nextInvalidFields,
      }));
      return;
    }
    const selectedTimeOption = timeOptions.find(
      (option) => option.time === reservationData.reservationTime,
    );
    const isWaitlistRequest = selectedTimeOption?.type === "waitlist";

    if (!selectedTimeOption) {
      setInvalidFields((prev) => ({
        ...prev,
        reservationTime: true,
      }));
      setError("Veuillez sélectionner un horaire proposé.");
      return;
    }

    setInvalidFields({});
    setIsSubmitting(true);
    let tablePayload = null;
    if (manage) {
      if (reservationData.table && reservationData.table !== "auto") {
        tablePayload = reservationData.table;
      }
    } else {
      tablePayload = reservationData.table || null;
    }
    const payload = {
      reservationDate: formatReservationDateForApi(
        reservationData.reservationDate,
      ),
      reservationTime: reservationData.reservationTime,
      numberOfGuests: reservationData.numberOfGuests,
      customerFirstName: reservationData.customerFirstName.trim(),
      customerLastName: reservationData.customerLastName.trim(),
      customerEmail: reservationData.customerEmail.trim(),
      customerPhone: reservationData.customerPhone.trim(),
      commentary: reservationData.commentary,
      table: tablePayload || undefined,
      returnUrl: `${window.location.origin}/reservations`,
      idempotencyKey,
    };
    try {
      const endpoint = isWaitlistRequest
        ? `${apiBaseUrl}/restaurants/${restaurant._id}/reservations/waitlist`
        : `${apiBaseUrl}/restaurants/${restaurant._id}/reservations`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Erreur lors de la réservation");
      }
      const data = await res.json();
      if (data?.requiresAction && data?.redirectUrl && data?.reservationId) {
        localStorage.setItem(
          PENDING_BANK_HOLD_STORAGE_KEY,
          JSON.stringify({
            reservationId: String(data.reservationId),
            restaurantId: String(restaurant._id),
            customerFirstName: reservationData.customerFirstName.trim(),
            reservationDate: formatReservationDateForApi(
              reservationData.reservationDate,
            ),
            reservationTime: reservationData.reservationTime,
            numberOfGuests: reservationData.numberOfGuests,
          }),
        );
        window.location.href = data.redirectUrl;
        return;
      }
      await fetchReservationsList();
      onBooked?.(data.restaurant || restaurant);
      setReservationData((prev) => ({
        ...prev,
        reservationTime: "",
        customerFirstName: "",
        customerLastName: "",
        customerEmail: "",
        customerPhone: "",
        commentary: "",
        table: manage ? "auto" : "",
      }));
      setInvalidFields({});
      setSuccessMessage(
        isWaitlistRequest
          ? "Votre demande a été ajoutée à la liste d’attente. Vous recevrez un email si une place se libère."
          : "Votre réservation a bien été effectuée. Nous avons bien reçu votre demande.",
      );
      if (router.query.reservationDate || router.query.reservationTime) {
        await router.replace("/reservations", undefined, { shallow: true });
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }
  const peopleOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => String(i + 1));
  }, []);
  const isReservationFormComplete = useMemo(() => {
    return (
      Boolean(reservationData.numberOfGuests) &&
      Boolean(reservationData.reservationTime) &&
      Boolean(reservationData.customerFirstName.trim()) &&
      Boolean(reservationData.customerLastName.trim()) &&
      Boolean(reservationData.customerEmail.trim()) &&
      Boolean(reservationData.customerPhone.trim())
    );
  }, [
    reservationData.customerEmail,
    reservationData.customerFirstName,
    reservationData.customerLastName,
    reservationData.customerPhone,
    reservationData.numberOfGuests,
    reservationData.reservationTime,
  ]);
  const selectedTimeOption = timeOptions.find(
    (option) => option.time === reservationData.reservationTime,
  );
  const isWaitlistSelection = selectedTimeOption?.type === "waitlist";
  const formattedDateLabel = format(
    reservationData.reservationDate,
    "dd/MM/yyyy",
  );
  return (
    <>
      {showPendingBankHoldModal && pendingBankHoldReservation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(39,20,12,0.55)] px-4">
          <div className="site-card w-full max-w-[620px] rounded-[30px] p-6 tablet:p-8">
            <p className="script-font text-[38px] leading-none text-[var(--site-orange-deep)]">
              Paiement
            </p>
            <h3 className="yeseva-one-regular -mt-1 text-[42px] leading-[0.9] text-[var(--site-ink)] tablet:text-[50px]">
              Réservation en attente
            </h3>
            <p className="mt-4 text-[15px] leading-[1.8] text-[var(--site-ink-soft)] tablet:text-[17px]">
              {pendingBankHoldReservation.customerFirstName
                ? `${pendingBankHoldReservation.customerFirstName}, `
                : ""}
              vous avez une réservation en attente de validation d’empreinte
              bancaire.
            </p>
            <div className="mt-6 rounded-[22px] border border-[var(--site-line)] bg-white/80 p-4 tablet:p-5">
              <div className="grid gap-4 text-[14px] text-[var(--site-ink-soft)] tablet:text-[15px] desktop:grid-cols-3">
                <p>
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-[var(--site-orange-deep)] tablet:text-[12px] tablet:tracking-[0.28em]">
                    Date
                  </span>
                  {format(
                    new Date(pendingBankHoldReservation.reservationDate),
                    "dd/MM/yyyy",
                  )}
                </p>
                <p>
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-[var(--site-orange-deep)] tablet:text-[12px] tablet:tracking-[0.28em]">
                    Heure
                  </span>
                  {pendingBankHoldReservation.reservationTime}
                </p>
                <p>
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-[var(--site-orange-deep)] tablet:text-[12px] tablet:tracking-[0.28em]">
                    Personnes
                  </span>
                  {pendingBankHoldReservation.numberOfGuests}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 tablet:flex-row tablet:justify-end">
              <button
                type="button"
                onClick={handleCancelPendingBankHold}
                disabled={isCancelingPendingBankHold}
                className="flex h-[52px] items-center justify-center rounded-[14px] border border-[var(--site-line)] px-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink)] transition hover:opacity-80 disabled:opacity-50 tablet:px-6 tablet:text-[13px] tablet:tracking-[0.22em]"
              >
                {isCancelingPendingBankHold
                  ? "Annulation..."
                  : "Annuler la réservation"}
              </button>
              <button
                type="button"
                onClick={handleResumePendingBankHold}
                className="site-button tablet:text-[13px] tablet:tracking-[0.22em]"
              >
                Finaliser
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="ambassade-reservation-form site-shell px-5 py-16 tablet:px-8 tablet:py-20 desktop:px-[44px] desktop:py-24">
        <div className="mx-auto max-w-[1500px]">
          <RevealOnScrollComponent className="flex items-center justify-center gap-3 text-center">
            <div className="relative h-6 w-10 rotate-[215deg]">
              <Image
                src="/img/_shared/logo-bg-white.png"
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <h2 className="yeseva-one-regular text-[42px] uppercase leading-[0.95] text-[var(--site-ink)] tablet:text-[54px] desktop:text-[62px]">
              Votre table vous attend
            </h2>
            <div className="relative h-6 w-10 rotate-[30deg]">
              <Image
                src="/img/_shared/logo-bg-white.png"
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          </RevealOnScrollComponent>

          <p className="mx-auto mt-5 max-w-[620px] text-center text-[22px] leading-[1.6] text-[var(--site-ink-soft)] tablet:text-[26px]">
            Sélectionnez le nombre de convives, la date et l’horaire de votre venue.
          </p>

          <div className="mx-auto mt-14 max-w-[1380px]">
            {!dataLoading ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 tablet:gap-6">
                <div className="grid overflow-visible gap-5 tablet:grid-cols-2 tablet:gap-6">
                  <div ref={datePickerRef} className="relative z-30">
                    <RevealOnScrollComponent variant="left">
                      <button
                        type="button"
                        onClick={() => setShowCalendar((prev) => !prev)}
                        className={`flex h-[90.5px] w-full items-center justify-between rounded-[10px] border bg-white px-5 py-4 text-left shadow-[0_12px_30px_rgba(19,24,20,0.06)] transition ${
                          invalidFields.reservationDate
                            ? "border-[#c55050]"
                            : "border-[rgba(20,72,47,0.18)]"
                        }`}
                      >
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink)]">
                            Date
                          </p>
                          <p className="mt-1 text-[18px] text-[var(--site-ink-soft)] tablet:text-[20px]">
                            {formattedDateLabel}
                          </p>
                        </div>
                        <CalendarDays size={24} strokeWidth={1.8} className="text-[var(--site-ink)]" />
                      </button>
                    </RevealOnScrollComponent>

                    {showCalendar ? (
                      <div className="absolute left-0 top-[calc(100%+12px)] z-[80] w-full rounded-[16px] border border-[rgba(20,72,47,0.14)] bg-white px-4 pb-4 pt-8 shadow-[0_24px_60px_rgba(19,24,20,0.14)]">
                        <div className="reservation-calendar-wrapper overflow-visible">
                          <Calendar
                            onChange={handleDateChange}
                            value={reservationData.reservationDate}
                            view="month"
                            locale="fr-FR"
                            tileDisabled={disableClosedDays}
                            minDate={new Date()}
                            className="reservation-calendar w-full border-none bg-transparent"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <RevealOnScrollComponent variant="right">
                    <SelectField
                      label="Nombre de personnes"
                      name="numberOfGuests"
                      value={reservationData.numberOfGuests}
                      onChange={handleInputChange}
                      invalid={invalidFields.numberOfGuests}
                      icon={Users}
                    >
                      {peopleOptions.map((value) => (
                        <option key={value} value={value}>
                          {value} {Number(value) > 1 ? "personnes" : "personne"}
                        </option>
                      ))}
                    </SelectField>
                  </RevealOnScrollComponent>

                  <RevealOnScrollComponent variant="left">
                    <div
                      className={`min-h-[82px] rounded-[10px] border bg-white px-5 py-4 shadow-[0_12px_30px_rgba(19,24,20,0.06)] ${
                        invalidFields.reservationTime
                          ? "border-[#c55050]"
                          : "border-[rgba(20,72,47,0.18)]"
                      }`}
                    >
                      <div className="flex min-h-[52px] items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink)]">
                            Heure
                          </p>
                          <div className="relative mt-2">
                            <select
                              name="reservationTime"
                              value={reservationData.reservationTime}
                              onChange={handleInputChange}
                              aria-invalid={invalidFields.reservationTime}
                              className="h-[32px] w-full appearance-none bg-white pr-10 text-[18px] leading-[32px] text-[var(--site-ink-soft)] outline-none tablet:text-[20px]"
                            >
                              <option value="">Sélectionnez une heure</option>
                              {timeOptions.map((option) => (
                                <option key={option.time} value={option.time}>
                                  {formatTimeDisplay(option.time)}
                                  {option.type === "waitlist" ? " • liste d’attente" : ""}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={18}
                              strokeWidth={1.4}
                              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[var(--site-ink-soft)]"
                            />
                          </div>
                        </div>
                        <Clock3 size={24} strokeWidth={1.8} className="shrink-0 text-[var(--site-ink)]" />
                      </div>
                      {isLoading ? (
                        <p className="mt-2 flex items-center gap-2 text-[13px] text-[var(--site-ink-soft)]">
                          <Loader2 size={14} className="animate-spin" />
                          Chargement...
                        </p>
                      ) : null}
                    </div>
                  </RevealOnScrollComponent>

                  <RevealOnScrollComponent variant="right">
                    <Field
                      label="Téléphone*"
                      fieldId="reservation-customer-phone"
                      name="customerPhone"
                      value={reservationData.customerPhone}
                      onChange={handleInputChange}
                      type="tel"
                      placeholder="Votre numéro"
                      invalid={invalidFields.customerPhone}
                      icon={Phone}
                    />
                  </RevealOnScrollComponent>

                  <RevealOnScrollComponent variant="left">
                    <Field
                      label="Prénom*"
                      fieldId="reservation-customer-first-name"
                      name="customerFirstName"
                      value={reservationData.customerFirstName}
                      onChange={handleInputChange}
                      placeholder="Votre prénom"
                      invalid={invalidFields.customerFirstName}
                      icon={User}
                    />
                  </RevealOnScrollComponent>

                  <RevealOnScrollComponent variant="right">
                    <Field
                      label="Nom*"
                      fieldId="reservation-customer-last-name"
                      name="customerLastName"
                      value={reservationData.customerLastName}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                      invalid={invalidFields.customerLastName}
                      icon={User}
                    />
                  </RevealOnScrollComponent>

                  <div className="tablet:col-span-2">
                    <RevealOnScrollComponent variant="up">
                      <Field
                        label="Email*"
                        fieldId="reservation-customer-email"
                        name="customerEmail"
                        value={reservationData.customerEmail}
                        onChange={handleInputChange}
                        type="email"
                        placeholder="Votre email"
                        invalid={invalidFields.customerEmail}
                        icon={Mail}
                      />
                    </RevealOnScrollComponent>
                  </div>

                  <div className="tablet:col-span-2">
                    <RevealOnScrollComponent variant="up">
                      <label
                        htmlFor="reservation-commentary"
                        className="block rounded-[10px] border border-[rgba(20,72,47,0.18)] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(19,24,20,0.06)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink)]">
                              Demande particulière (optionnelle)
                            </p>
                            <textarea
                              id="reservation-commentary"
                              name="commentary"
                              value={reservationData.commentary}
                              onChange={handleInputChange}
                              rows={4}
                              className="mt-2 w-full resize-none border-none bg-transparent text-[18px] text-[var(--site-ink-soft)] outline-none tablet:text-[20px]"
                              placeholder="Anniversaire, allergie, placement en terrasse..."
                            />
                          </div>
                          <PencilLine
                            size={22}
                            strokeWidth={1.8}
                            className="mt-6 shrink-0 text-[var(--site-ink)]"
                          />
                        </div>
                      </label>
                    </RevealOnScrollComponent>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700 tablet:text-[15px]">
                    {error}
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="rounded-[18px] border border-[var(--site-line)] bg-[#edf4e8] px-4 py-3 text-[14px] text-[#2f5c1a] tablet:text-[15px]">
                    {successMessage}
                  </div>
                ) : null}

                {isWaitlistSelection ? (
                  <p className="text-center text-[15px] leading-[1.7] text-[var(--site-ink-soft)] tablet:text-[16px]">
                    Ce créneau est complet. Vous pouvez vous inscrire en liste
                    d’attente et nous vous préviendrons si une place se libère.
                  </p>
                ) : null}

                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    disabled={
                      !isReservationFormComplete || isLoading || isSubmitting
                    }
                    className="inline-flex min-h-[64px] min-w-[320px] items-center justify-center bg-[var(--site-orange)] px-10 text-[15px] font-semibold uppercase tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        {isWaitlistSelection ? "Inscription..." : "Envoi..."}
                      </span>
                    ) : isWaitlistSelection ? (
                      "Liste d’attente"
                    ) : (
                      "Envoyer ma demande"
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-[16px] text-[var(--site-ink)]">
                  <Check size={20} strokeWidth={2.1} className="text-[var(--site-orange)]" />
                  <p>Vous recevrez un email de confirmation.</p>
                </div>
              </form>
            ) : (
              <p className="flex h-[320px] w-full items-center justify-center gap-2 text-[var(--site-ink-soft)] tablet:h-[400px]">
                Chargement <Loader2 size={18} className="animate-spin" />
              </p>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
function Field({
  label,
  fieldId,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  invalid = false,
  icon: Icon = null,
}) {
  return (
    <div>
      <label
        htmlFor={fieldId}
        className={`flex min-h-[82px] items-center justify-between gap-4 rounded-[10px] border bg-white px-5 py-4 shadow-[0_12px_30px_rgba(19,24,20,0.06)] ${
          invalid ? "border-[#c55050]" : "border-[rgba(20,72,47,0.18)]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink)]">
            {label}
          </p>
          <input
            id={fieldId}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            aria-invalid={invalid}
            placeholder={placeholder}
            className="mt-2 h-[32px] w-full border-none bg-transparent text-[18px] text-[var(--site-ink-soft)] outline-none tablet:text-[20px]"
          />
        </div>
        {Icon ? (
          <Icon size={24} strokeWidth={1.8} className="shrink-0 text-[var(--site-ink)]" />
        ) : null}
      </label>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  invalid = false,
  icon: Icon = null,
  children,
}) {
  return (
    <label
      className={`flex min-h-[82px] items-center justify-between gap-4 rounded-[10px] border bg-white px-5 py-4 shadow-[0_12px_30px_rgba(19,24,20,0.06)] ${
        invalid ? "border-[#c55050]" : "border-[rgba(20,72,47,0.18)]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-ink)]">
          {label}
        </p>
        <div className="relative mt-2">
          <select
            name={name}
            value={value}
            onChange={onChange}
            aria-invalid={invalid}
            className="h-[32px] w-full appearance-none bg-white pr-10 text-[18px] leading-[32px] text-[var(--site-ink-soft)] outline-none tablet:text-[20px]"
          >
            {children}
          </select>
          <ChevronDown
            size={18}
            strokeWidth={1.4}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[var(--site-ink-soft)]"
          />
        </div>
      </div>
      {Icon ? (
        <Icon size={24} strokeWidth={1.8} className="shrink-0 text-[var(--site-ink)]" />
      ) : null}
    </label>
  );
}

function getMissingRequiredReservationFields(reservationData) {
  const nextInvalidFields = {};

  if (!reservationData.numberOfGuests) {
    nextInvalidFields.numberOfGuests = true;
  }

  if (!reservationData.reservationTime) {
    nextInvalidFields.reservationTime = true;
  }

  if (!reservationData.customerFirstName.trim()) {
    nextInvalidFields.customerFirstName = true;
  }

  if (!reservationData.customerLastName.trim()) {
    nextInvalidFields.customerLastName = true;
  }

  if (!reservationData.customerEmail.trim()) {
    nextInvalidFields.customerEmail = true;
  }

  if (!reservationData.customerPhone.trim()) {
    nextInvalidFields.customerPhone = true;
  }

  return nextInvalidFields;
}

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeGuestsValue(value) {
  const normalizedValue = String(getSingleQueryValue(value) || "").trim();
  if (!/^\d+$/.test(normalizedValue)) return "";
  return Number(normalizedValue) > 0 ? normalizedValue : "";
}

function normalizeReservationTimeValue(value) {
  const normalizedValue = String(getSingleQueryValue(value) || "").trim();
  const match = normalizedValue.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function getAvailabilitySelectionKey({ reservationDate, numberOfGuests }) {
  return `${formatReservationDateForApi(reservationDate)}|${String(numberOfGuests || "").trim()}`;
}
