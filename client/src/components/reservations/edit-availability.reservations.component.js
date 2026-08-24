import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Loader2, Minus, Plus } from "lucide-react";
import {
  formatReservationDateForApi,
  getServiceBucketFromTime,
  getReservationTimeOptions,
  isReservationDateClosed,
  parseReservationDateValue,
} from "@/utils/reservations";

export default function EditReservationAvailability({
  apiBaseUrl,
  manageToken,
  restaurant,
  reservation,
  editData,
  setEditData,
}) {
  const [meal, setMeal] = useState(() =>
    getServiceBucketFromTime(reservation?.reservationTime),
  );
  const [reservationsList, setReservationsList] = useState([]);
  const [slotCoverUsage, setSlotCoverUsage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadAvailability() {
      if (!apiBaseUrl || !manageToken || !restaurant?._id || !reservation?._id) {
        if (isCurrent) {
          setReservationsList([]);
          setSlotCoverUsage([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setAvailabilityError("");

        const query = new URLSearchParams({
          excludeReservationId: String(reservation._id),
          token: manageToken,
        });
        const response = await fetch(
          `${apiBaseUrl}/public/restaurants/${restaurant._id}/reservations?${query.toString()}`,
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message || "Impossible de charger les créneaux disponibles.",
          );
        }

        if (isCurrent) {
          setReservationsList(
            Array.isArray(data?.reservations) ? data.reservations : [],
          );
          setSlotCoverUsage(
            Array.isArray(data?.slotCoverUsage) ? data.slotCoverUsage : [],
          );
        }
      } catch (error) {
        if (isCurrent) {
          setReservationsList([]);
          setSlotCoverUsage([]);
          setAvailabilityError(
            error?.message || "Impossible de charger les créneaux disponibles.",
          );
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadAvailability();

    return () => {
      isCurrent = false;
    };
  }, [apiBaseUrl, manageToken, restaurant?._id, reservation?._id]);

  const timeOptions = useMemo(
    () =>
      getReservationTimeOptions({
        reservationDate: editData.reservationDate,
        numberOfGuests: editData.numberOfGuests,
        restaurant,
        reservationsList,
        slotCoverUsage,
        excludeReservationId: reservation?._id,
      }).filter((option) => option.type === "available"),
    [
      editData.reservationDate,
      editData.numberOfGuests,
      restaurant,
      reservationsList,
      slotCoverUsage,
      reservation?._id,
    ],
  );
  const visibleTimeOptions = useMemo(
    () =>
      timeOptions.filter(
        (option) => getServiceBucketFromTime(option.time) === meal,
      ),
    [meal, timeOptions],
  );
  const selectedDate =
    parseReservationDateValue(editData.reservationDate) || new Date();

  function handleDateChange(value) {
    const nextDate = Array.isArray(value) ? value[0] : value;
    if (!(nextDate instanceof Date) || Number.isNaN(nextDate.getTime())) return;

    setEditData((current) => ({
      ...current,
      reservationDate: formatReservationDateForApi(nextDate),
      reservationTime: "",
    }));
  }

  function adjustGuests(delta) {
    const nextGuests = Math.min(
      12,
      Math.max(1, Number(editData.numberOfGuests || 1) + delta),
    );
    setEditData((current) => ({
      ...current,
      numberOfGuests: String(nextGuests),
      reservationTime: "",
    }));
  }

  function handleMealChange(nextMeal) {
    setMeal(nextMeal);
    setEditData((current) => ({ ...current, reservationTime: "" }));
  }

  return (
    <div className="ambassade-edit-availability mt-5">
      <div className="ambassade-guest-picker">
        <label>Nombre de convives</label>
        <div>
          <button
            type="button"
            aria-label="Retirer une personne"
            onClick={() => adjustGuests(-1)}
          >
            <Minus />
          </button>
          <strong>
            {editData.numberOfGuests} {Number(editData.numberOfGuests) > 1 ? "personnes" : "personne"}
          </strong>
          <button
            type="button"
            aria-label="Ajouter une personne"
            onClick={() => adjustGuests(1)}
          >
            <Plus />
          </button>
        </div>
      </div>

      <div className="ambassade-calendar">
        <label>Choisissez une date</label>
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          minDate={new Date()}
          locale="fr-FR"
          tileDisabled={({ date, view }) =>
            view === "month" &&
            isReservationDateClosed({ reservationDate: date, restaurant })
          }
        />
      </div>

      <div className="ambassade-meal-toggle">
        <button
          type="button"
          className={meal === "lunch" ? "is-active" : ""}
          aria-pressed={meal === "lunch"}
          onClick={() => handleMealChange("lunch")}
        >
          Déjeuner
        </button>
        <button
          type="button"
          className={meal === "dinner" ? "is-active" : ""}
          aria-pressed={meal === "dinner"}
          onClick={() => handleMealChange("dinner")}
        >
          Dîner
        </button>
      </div>

      <div className="ambassade-time-picker">
        <label>Horaires disponibles</label>
        <div>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : visibleTimeOptions.length ? (
            visibleTimeOptions.map((option) => (
              <button
                key={option.time}
                type="button"
                className={editData.reservationTime === option.time ? "is-active" : ""}
                onClick={() =>
                  setEditData((current) => ({
                    ...current,
                    reservationTime: option.time,
                  }))
                }
              >
                {formatTimeDisplay(option.time)}
              </button>
            ))
          ) : (
            <p>Aucun horaire disponible pour ce service.</p>
          )}
        </div>
      </div>

      {availabilityError ? (
        <p className="ambassade-edit-availability__empty mt-5">{availabilityError}</p>
      ) : null}

    </div>
  );
}

function formatTimeDisplay(value) {
  const [hour, minute] = String(value || "").slice(0, 5).split(":");
  return `${hour}h${minute}`;
}
