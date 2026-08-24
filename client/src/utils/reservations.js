import { format } from "date-fns";

const DINNER_START_MINUTES = 17 * 60;
const NIGHT_SERVICE_END_MINUTES = 6 * 60;

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
  const minutes = minutesFromHHmm(reservationTime);
  return minutes >= DINNER_START_MINUTES || minutes < NIGHT_SERVICE_END_MINUTES
    ? "dinner"
    : "lunch";
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

  const reservationDateTime = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    Number(hour) || 0,
    Number(minute) || 0,
    0,
    0,
  );

  if (hour * 60 + minute < NIGHT_SERVICE_END_MINUTES) {
    reservationDateTime.setDate(reservationDateTime.getDate() + 1);
  }

  return reservationDateTime;
}

function isBlockedRangeOverlapping({ range, candidateStart, candidateEnd }) {
  if (!range) return false;

  const rangeStart = new Date(range.startAt).getTime();
  const rangeEnd = new Date(range.endAt).getTime();

  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) return false;

  return (
    candidateStart.getTime() < rangeEnd && candidateEnd.getTime() > rangeStart
  );
}

export function isDateTimeBlocked(parameters, candidateDateTime) {
  if (!(candidateDateTime instanceof Date)) return false;
  if (Number.isNaN(candidateDateTime.getTime())) return false;
  // Une pause bloque le départ du créneau, pas sa durée d'occupation.

  const ranges = Array.isArray(parameters?.blocked_ranges)
    ? parameters.blocked_ranges
    : [];
  const candidateStart = new Date(candidateDateTime);
  const candidateEnd = new Date(candidateDateTime.getTime() + 1);

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

function minutesFromServiceTime(timeStr) {
  const minutes = minutesFromHHmm(timeStr);
  return minutes < NIGHT_SERVICE_END_MINUTES ? minutes + 24 * 60 : minutes;
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

function normalizeTableIds(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

function getEnabledCatalogTables(parameters = {}) {
  const disabledIds = new Set();
  const rooms = Array.isArray(parameters?.floorplan?.rooms)
    ? parameters.floorplan.rooms
    : [];

  rooms.forEach((room) => {
    if (room?.enabled !== false) return;
    (Array.isArray(room?.objects) ? room.objects : []).forEach((object) => {
      if (object?.type === "table" && object?.tableRefId) {
        disabledIds.add(String(object.tableRefId));
      }
    });
  });

  const tables = Array.isArray(parameters?.tables) ? parameters.tables : [];
  return tables.filter(
    (table) => !disabledIds.has(String(table?._id || "").trim()),
  );
}

function getReservationTableIds(table) {
  const ids = normalizeTableIds(table?.tableIds);
  if (ids.length) return ids;
  return table?._id ? [String(table._id)] : [];
}

function getCombinedTableOptions(tables, requiredSeats) {
  const byId = new Map(
    tables.map((table) => [String(table?._id || "").trim(), table]),
  );
  const seen = new Set();
  const options = [];

  tables.forEach((table) => {
    const tableId = String(table?._id || "").trim();
    if (!tableId) return;

    normalizeTableIds(table?.combinableWith).forEach((relatedId) => {
      const other = byId.get(relatedId);
      if (!other?._id || relatedId === tableId) return;
      if (!normalizeTableIds(other.combinableWith).includes(tableId)) return;

      const pairIds = [tableId, relatedId].sort();
      const pairKey = pairIds.join("+");
      if (seen.has(pairKey)) return;
      seen.add(pairKey);

      if (
        Number(table?.seats || 0) + Number(other?.seats || 0) !==
          requiredSeats ||
        table?.onlineBookable === false ||
        other?.onlineBookable === false
      ) {
        return;
      }

      options.push({
        tableIds: pairIds,
        name: `${String(table?.name || "")} + ${String(other?.name || "")}`,
        seats: requiredSeats,
      });
    });
  });

  return options;
}

function isConfiguredTableOptionFree({
  option,
  blockingReservations,
  overlaps,
  blockedTableIds,
}) {
  const optionIds = getReservationTableIds(option);
  if (!optionIds.length) return false;
  if (optionIds.some((id) => blockedTableIds.has(id))) return false;

  return !blockingReservations.some((reservation) => {
    if (!reservation?.table || !overlaps(reservation)) return false;
    const reservationIds = getReservationTableIds(reservation.table);
    if (reservationIds.some((id) => optionIds.includes(id))) return true;
    return (
      reservationIds.length === 0 &&
      String(reservation.table.name || "") === String(option.name || "")
    );
  });
}

function hasAvailableConfiguredTable({
  parameters,
  tablesCatalog,
  dayReservations,
  numberOfGuests,
  candidateTime,
  candidateDateTime,
}) {
  const requiredSeats = requiredTableSizeFromGuests(numberOfGuests);
  const allowedSingleSeats =
    Number(numberOfGuests) === 1 ? new Set([1, 2]) : new Set([requiredSeats]);
  const singleOptions = tablesCatalog.filter(
    (table) =>
      allowedSingleSeats.has(Number(table?.seats || 0)) &&
      table?.onlineBookable !== false,
  );
  const candidateDuration = getOccupancyMinutes(parameters, candidateTime);
  const candidateStart = minutesFromServiceTime(candidateTime);
  const candidateEnd = candidateStart + candidateDuration;
  const blockedTableIds = getBlockedTableIdsForDateTime(
    parameters,
    candidateDateTime,
    Math.max(1, candidateDuration * 60 * 1000),
  );
  const overlaps = (reservation) => {
    const reservationTime = String(reservation?.reservationTime || "").slice(
      0,
      5,
    );
    const reservationStart = minutesFromServiceTime(reservationTime);
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
    return reservationTime === candidateTime;
  };
  const freeSingleOptions = singleOptions.filter((option) =>
    isConfiguredTableOptionFree({
      option,
      blockingReservations: dayReservations,
      overlaps,
      blockedTableIds,
    }),
  );
  const eligibleIds = new Set(
    singleOptions.map((table) => String(table?._id || "").trim()),
  );
  const eligibleNames = new Map(
    singleOptions.map((table) => [
      String(table?.name || "").trim().toLowerCase(),
      String(table?._id || "").trim(),
    ]),
  );
  const eligibleSeatSizes = new Set(
    singleOptions.map((table) => Number(table?.seats || 0)),
  );
  const reservedIds = new Set(Array.from(blockedTableIds));
  let unassignedCount = 0;

  dayReservations.forEach((reservation) => {
    if (!reservation?.table || !overlaps(reservation)) return;
    const tableIds = getReservationTableIds(reservation.table);

    if (reservation.table.source === "configured") {
      const selectionKey =
        tableIds.length > 1 ? `combo:${[...tableIds].sort().join("+")}` : tableIds[0];
      if (selectionKey && eligibleIds.has(selectionKey)) {
        reservedIds.add(selectionKey);
        return;
      }
      const mappedId = eligibleNames.get(
        String(reservation.table.name || "").trim().toLowerCase(),
      );
      if (mappedId) {
        reservedIds.add(mappedId);
        return;
      }
      if (
        eligibleSeatSizes.has(Number(reservation.table.seats)) &&
        tableIds.length <= 1
      ) {
        unassignedCount += 1;
      }
      return;
    }

    if (
      reservation.table.source === "manual" &&
      String(reservation.table.name || "").trim() &&
      eligibleSeatSizes.has(Number(reservation.table.seats))
    ) {
      unassignedCount += 1;
    }
  });

  if (
    singleOptions.length > 0 &&
    reservedIds.size + unassignedCount < singleOptions.length &&
    freeSingleOptions.length > 0
  ) {
    return true;
  }
  if (unassignedCount > 0 || Number(numberOfGuests) <= 1) return false;

  return getCombinedTableOptions(tablesCatalog, requiredSeats).some((option) =>
    isConfiguredTableOptionFree({
      option,
      blockingReservations: dayReservations,
      overlaps,
      blockedTableIds,
    }),
  );
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
  let end = closeHour * 60 + closeMinute;
  const step = parseInt(String(interval), 10);

  if (Number.isNaN(step) || step <= 0) return times;

  if (end < start) end += 24 * 60;

  for (let minutes = start; minutes <= end; minutes += step) {
    const hour = String(Math.floor((minutes % (24 * 60)) / 60)).padStart(2, "0");
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
  excludeReservationId = null,
}) {
  const parsedDate = parseReservationDateValue(reservationDate);
  if (!restaurant?._id || !parsedDate) return [];

  const parameters = getReservationParameters(restaurant);
  const tablesCatalog = getEnabledCatalogTables(parameters);
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
    times = times.filter(
      (time) => minutesFromServiceTime(time) > currentMinutes,
    );
  }

  times = times.filter((time) => {
    const candidateDateTime = buildReservationDateTime(parsedDate, time);

    return !isDateTimeBlocked(parameters, candidateDateTime);
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

  if (requiredTableSizeFromGuests(numberOfGuests) <= 0) return times;

  const formattedSelectedDate = formatReservationDateForApi(parsedDate);
  const dayReservations = reservationsList.filter((reservation) => {
    if (
      excludeReservationId &&
      String(reservation?._id || "") === String(excludeReservationId)
    ) {
      return false;
    }

    return (
      formatReservationDateForApi(reservation?.reservationDate) ===
        formattedSelectedDate && isBlockingReservation(reservation)
    );
  });

  return times.filter((time) => {
    const candidateDateTime = buildReservationDateTime(parsedDate, time);
    return hasAvailableConfiguredTable({
      parameters,
      tablesCatalog,
      dayReservations,
      numberOfGuests,
      candidateTime: time,
      candidateDateTime,
    });
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
  excludeReservationId = null,
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
    candidateTimes = candidateTimes.filter(
      (time) => minutesFromServiceTime(time) > currentMinutes,
    );
  }

  candidateTimes = candidateTimes.filter((time) => {
    const candidateDateTime = buildReservationDateTime(parsedDate, time);

    return !isDateTimeBlocked(parameters, candidateDateTime);
  });

  const availableTimes = getAvailableReservationTimes({
    reservationDate,
    numberOfGuests,
    restaurant,
    reservationsList,
    slotCoverUsage,
    excludeReservationId,
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
