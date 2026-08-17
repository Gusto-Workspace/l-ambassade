import { format } from "date-fns";

export function getReservationParameters(restaurant) {
  return (
    restaurant?.reservationsSettings ||
    restaurant?.reservations?.parameters ||
    {}
  );
}

export function getOpeningHours(restaurant) {
  return Array.isArray(restaurant?.opening_hours)
    ? restaurant.opening_hours
    : [];
}

function getExceptionalOpeningForDate({ reservationDate, parameters }) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!parsedDate) return null;

  const dateKey = formatReservationDateForApi(parsedDate);
  const openings = Array.isArray(parameters?.exceptional_openings)
    ? parameters.exceptional_openings
    : [];

  const opening = openings.find(
    (item) => String(item?.date || "").slice(0, 10) === dateKey,
  );

  if (!opening || !Array.isArray(opening.hours) || opening.hours.length === 0) {
    return null;
  }

  return { day: "exceptional", isClosed: false, hours: opening.hours };
}

export function parseReservationDateValue(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const normalizedValue = Array.isArray(value) ? value[0] : value;
  if (!normalizedValue) return null;

  const stringValue = String(normalizedValue).trim();
  const dateMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(parsedDate.getTime())) return null;
    return parsedDate;
  }

  const parsedDate = new Date(stringValue);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
  );
}

export function formatReservationDateForApi(value) {
  const parsedDate = parseReservationDateValue(value);
  if (!parsedDate) return "";
  return format(parsedDate, "yyyy-MM-dd");
}

export function getDayHoursForDate({ reservationDate, restaurant }) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!parsedDate) return null;

  const parameters = getReservationParameters(restaurant);
  const openingHours = getOpeningHours(restaurant);
  const selectedDay = parsedDate.getDay();
  const dayIndex = selectedDay === 0 ? 6 : selectedDay - 1;
  const exceptionalOpening = getExceptionalOpeningForDate({
    reservationDate: parsedDate,
    parameters,
  });

  if (exceptionalOpening) return exceptionalOpening;

  return parameters.same_hours_as_restaurant
    ? openingHours[dayIndex]
    : parameters.reservation_hours?.[dayIndex];
}

export function isReservationDateClosed({ reservationDate, restaurant }) {
  const dayHours = getDayHoursForDate({ reservationDate, restaurant });
  return !dayHours || !!dayHours.isClosed;
}

export function isToday(date) {
  const parsedDate = parseReservationDateValue(date);
  if (!parsedDate) return false;

  const today = new Date();

  return (
    parsedDate.getDate() === today.getDate() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getFullYear() === today.getFullYear()
  );
}

export function getServiceBucketFromTime(reservationTime) {
  const [hour = "0"] = String(reservationTime || "00:00").split(":");
  return Number(hour) < 16 ? "lunch" : "dinner";
}

export function getOccupancyMinutes(parameters, reservationTime) {
  const bucket = getServiceBucketFromTime(reservationTime);
  const value =
    bucket === "lunch"
      ? parameters?.table_occupancy_lunch_minutes
      : parameters?.table_occupancy_dinner_minutes;
  const parsed = Number(value || 0);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function buildReservationDateTime(reservationDate, reservationTime) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!parsedDate) return null;

  const [hour = "00", minute = "00"] = String(reservationTime || "00:00")
    .split(":")
    .map(Number);

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    Number(hour) || 0,
    Number(minute) || 0,
    0,
    0,
  );
}

function isBlockedRangeOverlapping({ range, candidateStart, candidateEnd }) {
  if (!range) return false;

  const rangeStart = new Date(range.startAt).getTime();
  const rangeEnd = new Date(range.endAt).getTime();

  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) return false;

  return (
    candidateStart.getTime() <= rangeEnd && candidateEnd.getTime() > rangeStart
  );
}

export function isDateTimeBlocked(parameters, candidateDateTime, occupancyMs) {
  if (!(candidateDateTime instanceof Date)) return false;
  if (Number.isNaN(candidateDateTime.getTime())) return false;

  const ranges = Array.isArray(parameters?.blocked_ranges)
    ? parameters.blocked_ranges
    : [];
  const candidateStart = new Date(candidateDateTime);
  const candidateEnd = new Date(
    candidateDateTime.getTime() + Math.max(1, Number(occupancyMs) || 0),
  );

  return ranges.some((range) =>
    isBlockedRangeOverlapping({
      range,
      candidateStart,
      candidateEnd,
    }),
  );
}

function getReservationDayIndex(reservationDate) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!parsedDate) return null;
  const jsDay = parsedDate.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function hasSlotCoverLimitDay(limit) {
  return (
    Number.isInteger(limit?.day) &&
    Number(limit.day) >= 0 &&
    Number(limit.day) <= 6
  );
}

function getActiveSlotCoverLimit(parameters, reservationTime, reservationDate) {
  const time = String(reservationTime || "").slice(0, 5);
  const limits = Array.isArray(parameters?.slot_cover_limits)
    ? parameters.slot_cover_limits
    : [];
  const dayIndex = getReservationDayIndex(reservationDate);
  const matchingTimeLimits = limits.filter(
    (entry) =>
      String(entry?.time || "").slice(0, 5) === time,
  );
  const exactDayLimit =
    Number.isInteger(dayIndex) &&
    matchingTimeLimits.find(
      (entry) => hasSlotCoverLimitDay(entry) && Number(entry.day) === dayIndex,
    );
  const fallbackLimit = matchingTimeLimits.find(
    (entry) => !hasSlotCoverLimitDay(entry),
  );
  const limit = exactDayLimit || fallbackLimit;

  if (exactDayLimit && exactDayLimit.active === false) return null;

  const maxCovers = Math.floor(Number(limit?.maxCovers || 0));

  if (
    !limit ||
    limit.active === false ||
    !/^\d{2}:\d{2}$/.test(time) ||
    maxCovers <= 0
  ) {
    return null;
  }
  return { time, maxCovers };
}

function hasActiveSlotCoverLimits(parameters) {
  return Array.isArray(parameters?.slot_cover_limits)
    ? parameters.slot_cover_limits.some(
        (limit) =>
          limit?.active !== false &&
          /^\d{2}:\d{2}$/.test(String(limit?.time || "").slice(0, 5)) &&
          Number(limit?.maxCovers || 0) > 0,
      )
    : false;
}

function isSlotCoverCapacityAvailable({
  parameters,
  slotCoverUsage = [],
  reservationDate,
  reservationTime,
  numberOfGuests,
}) {
  const limit = getActiveSlotCoverLimit(
    parameters,
    reservationTime,
    reservationDate,
  );
  if (!limit) return true;

  const dateKey = formatReservationDateForApi(reservationDate);
  const usage = Array.isArray(slotCoverUsage)
    ? slotCoverUsage.find(
        (item) =>
          String(item?.date || "").slice(0, 10) === dateKey &&
          String(item?.time || "").slice(0, 5) === limit.time,
      )
    : null;
  const usedCovers = Math.max(0, Number(usage?.covers || 0));
  const requestedCovers = Math.max(0, Number(numberOfGuests || 0));

  return usedCovers + requestedCovers <= limit.maxCovers;
}

function getBlockedTableIdsForDateTime(
  parameters,
  candidateDateTime,
  occupancyMs,
) {
  if (!(candidateDateTime instanceof Date)) return new Set();
  if (Number.isNaN(candidateDateTime.getTime())) return new Set();

  const ranges = Array.isArray(parameters?.table_blocked_ranges)
    ? parameters.table_blocked_ranges
    : [];
  const candidateStart = new Date(candidateDateTime);
  const candidateEnd = new Date(
    candidateDateTime.getTime() + Math.max(1, Number(occupancyMs) || 0),
  );
  const blockedIds = new Set();

  ranges.forEach((range) => {
    if (
      !isBlockedRangeOverlapping({
        range,
        candidateStart,
        candidateEnd,
      })
    ) {
      return;
    }

    const blockedId = String(range?.tableId || "");
    if (blockedId) {
      blockedIds.add(blockedId);
    }
  });

  return blockedIds;
}

export function minutesFromHHmm(timeStr) {
  const [hour, minute] = String(timeStr || "00:00")
    .split(":")
    .map(Number);
  return (Number(hour) || 0) * 60 + (Number(minute) || 0);
}

export function isBlockingReservation(reservation) {
  if (!reservation) return false;

  if (reservation.status === "Waitlist") {
    const state = String(reservation?.waitlistOffer?.state || "").trim();
    const expiresAt = reservation?.waitlistOffer?.offerExpiresAt
      ? new Date(reservation.waitlistOffer.offerExpiresAt).getTime()
      : null;

    return (
      state === "offered" &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now()
    );
  }

  if (
    !["AwaitingBankHold", "Pending", "Confirmed", "Active", "Late"].includes(
      reservation.status,
    )
  ) {
    return false;
  }

  if (reservation.status === "AwaitingBankHold") {
    const bankHoldEnabled = Boolean(reservation?.bankHold?.enabled);
    const bankHoldExpiresAt = reservation?.bankHold?.expiresAt
      ? new Date(reservation.bankHold.expiresAt).getTime()
      : null;

    if (
      bankHoldEnabled &&
      Number.isFinite(bankHoldExpiresAt) &&
      bankHoldExpiresAt <= Date.now()
    ) {
      return false;
    }

    return true;
  }

  if (reservation.status !== "Pending") return true;

  const bankHoldEnabled = Boolean(reservation?.bankHold?.enabled);
  const bankHoldExpiresAt = reservation?.bankHold?.expiresAt
    ? new Date(reservation.bankHold.expiresAt).getTime()
    : null;

  if (
    bankHoldEnabled &&
    Number.isFinite(bankHoldExpiresAt) &&
    bankHoldExpiresAt <= Date.now()
  ) {
    return false;
  }

  if (!reservation.pendingExpiresAt) return true;

  return new Date(reservation.pendingExpiresAt).getTime() > Date.now();
}

export function requiredTableSizeFromGuests(value) {
  const guests = Number(value || 0);
  if (guests <= 0) return 0;
  if (guests === 1) return 1;
  return guests % 2 === 0 ? guests : guests + 1;
}

export function generateTimeOptions(openTime, closeTime, interval) {
  const times = [];
  const [openHour, openMinute] = String(openTime || "00:00")
    .split(":")
    .map(Number);
  const [closeHour, closeMinute] = String(closeTime || "00:00")
    .split(":")
    .map(Number);
  const start = openHour * 60 + openMinute;
  const end = closeHour * 60 + closeMinute;
  const step = parseInt(String(interval), 10);

  if (Number.isNaN(step) || step <= 0) return times;

  for (let minutes = start; minutes <= end; minutes += step) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    times.push(`${hour}:${minute}`);
  }

  return times;
}

export function getAvailableReservationTimes({
  reservationDate,
  numberOfGuests,
  restaurant,
  reservationsList = [],
  slotCoverUsage = [],
}) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!restaurant?._id || !parsedDate) return [];

  const parameters = getReservationParameters(restaurant);
  const tablesCatalog = Array.isArray(parameters.tables)
    ? parameters.tables
    : [];
  const manage = !!parameters.manage_disponibilities;
  const dayHours = getDayHoursForDate({
    reservationDate: parsedDate,
    restaurant,
  });

  if (
    !dayHours ||
    dayHours.isClosed ||
    !Array.isArray(dayHours.hours) ||
    dayHours.hours.length === 0
  ) {
    return [];
  }

  const interval = parameters.interval || 30;
  let times = dayHours.hours.flatMap(({ open, close }) =>
    generateTimeOptions(open, close, interval),
  );

  if (isToday(parsedDate)) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    times = times.filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      return hour * 60 + minute > currentMinutes;
    });
  }

  times = times.filter((time) => {
    const candidateDurationMs = Math.max(
      1,
      getOccupancyMinutes(parameters, time) * 60 * 1000,
    );
    const candidateDateTime = buildReservationDateTime(parsedDate, time);

    return !isDateTimeBlocked(
      parameters,
      candidateDateTime,
      candidateDurationMs,
    );
  });

  times = times.filter((time) =>
    isSlotCoverCapacityAvailable({
      parameters,
      slotCoverUsage,
      reservationDate: parsedDate,
      reservationTime: time,
      numberOfGuests,
    }),
  );

  if (!manage || !numberOfGuests) {
    return times;
  }

  const required = requiredTableSizeFromGuests(numberOfGuests);
  if (required <= 0) return times;

  const eligibleTables = tablesCatalog.filter(
    (table) =>
      Number(table?.seats || 0) === required && table?.onlineBookable !== false,
  );

  if (!eligibleTables.length) return [];

  const formattedSelectedDate = formatReservationDateForApi(parsedDate);
  const dayReservations = reservationsList.filter((reservation) => {
    return (
      formatReservationDateForApi(reservation?.reservationDate) ===
        formattedSelectedDate && isBlockingReservation(reservation)
    );
  });

  return times.filter((time) => {
    const candidateStart = minutesFromHHmm(time);
    const candidateDuration = getOccupancyMinutes(parameters, time);
    const candidateEnd = candidateStart + candidateDuration;
    const candidateDurationMs = Math.max(1, candidateDuration * 60 * 1000);
    const candidateDateTime = buildReservationDateTime(parsedDate, time);
    const blockedTableIds = getBlockedTableIdsForDateTime(
      parameters,
      candidateDateTime,
      candidateDurationMs,
    );
    const availableEligibleTables = eligibleTables.filter((table) => {
      const tableId = String(table?._id || "");
      if (!tableId) return true;
      return !blockedTableIds.has(tableId);
    });

    if (!availableEligibleTables.length) return false;

    const conflicts = dayReservations.filter((reservation) => {
      if (!reservation?.table) return false;

      const reservationTableId = reservation?.table?._id
        ? String(reservation.table._id)
        : null;
      const reservationTableName = String(reservation?.table?.name || "");

      const matchesEligibleTable = availableEligibleTables.some((table) => {
        const tableId = table?._id ? String(table._id) : null;

        if (tableId && reservationTableId) {
          return tableId === reservationTableId;
        }

        return String(table?.name || "") === reservationTableName;
      });

      if (!matchesEligibleTable) return false;

      const reservationTime = String(reservation.reservationTime || "").slice(
        0,
        5,
      );
      const reservationStart = minutesFromHHmm(reservationTime);
      const reservationDuration = getOccupancyMinutes(
        parameters,
        reservationTime,
      );
      const reservationEnd = reservationStart + reservationDuration;

      if (candidateDuration > 0 && reservationDuration > 0) {
        return (
          candidateStart < reservationEnd && candidateEnd > reservationStart
        );
      }

      return reservationTime === String(time).slice(0, 5);
    });

    return conflicts.length < availableEligibleTables.length;
  });
}

export function isPublicWaitlistEnabled(restaurant) {
  const waitlist = getReservationParameters(restaurant)?.waitlist || {};
  return Boolean(waitlist.enabled && waitlist.public_enabled);
}

export function getReservationTimeOptions({
  reservationDate,
  numberOfGuests,
  restaurant,
  reservationsList = [],
  slotCoverUsage = [],
}) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!restaurant?._id || !parsedDate) return [];

  const parameters = getReservationParameters(restaurant);
  const dayHours = getDayHoursForDate({
    reservationDate: parsedDate,
    restaurant,
  });

  if (
    !dayHours ||
    dayHours.isClosed ||
    !Array.isArray(dayHours.hours) ||
    dayHours.hours.length === 0
  ) {
    return [];
  }

  const interval = parameters.interval || 30;
  let candidateTimes = dayHours.hours.flatMap(({ open, close }) =>
    generateTimeOptions(open, close, interval),
  );

  if (isToday(parsedDate)) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    candidateTimes = candidateTimes.filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      return hour * 60 + minute > currentMinutes;
    });
  }

  candidateTimes = candidateTimes.filter((time) => {
    const candidateDurationMs = Math.max(
      1,
      getOccupancyMinutes(parameters, time) * 60 * 1000,
    );
    const candidateDateTime = buildReservationDateTime(parsedDate, time);

    return !isDateTimeBlocked(
      parameters,
      candidateDateTime,
      candidateDurationMs,
    );
  });

  const availableTimes = getAvailableReservationTimes({
    reservationDate,
    numberOfGuests,
    restaurant,
    reservationsList,
    slotCoverUsage,
  });
  const availableSet = new Set(availableTimes);

  if (
    (!parameters.manage_disponibilities &&
      !hasActiveSlotCoverLimits(parameters)) ||
    !numberOfGuests ||
    !isPublicWaitlistEnabled(restaurant)
  ) {
    return availableTimes.map((time) => ({ time, type: "available" }));
  }

  return candidateTimes.map((time) => ({
    time,
    type: availableSet.has(time) ? "available" : "waitlist",
  }));
}
