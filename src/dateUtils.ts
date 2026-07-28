/**
 * Utility functions for robust date and time handling across timezones.
 * Fixes timezone shift bugs caused by stripping 'Z' or improperly converting ISO strings.
 */

export const parseEventDate = (isoString?: string | null): Date | null => {
  if (!isoString) return null;
  try {
    let str = isoString.trim();
    // Check if string lacks a timezone offset (Z or +HH:MM or -HH:MM)
    const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/i.test(str);
    if (!hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/i.test(str)) {
      // Append 'Z' so it's correctly interpreted as UTC ISO string
      str = str + "Z";
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export const formatForDateTimeInput = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? parseEventDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return "";

  const pad = (n: number) => (n < 10 ? "0" + n : String(n));
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatLocalTime = (isoString?: string | null): string => {
  const d = parseEventDate(isoString);
  if (!d) return "Hora no disp.";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + " hrs";
};

export const formatFullDate = (isoString?: string | null): string => {
  const d = parseEventDate(isoString);
  if (!d) return isoString || "";
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

export const formatShortDate = (isoString?: string | null): string => {
  const d = parseEventDate(isoString);
  if (!d) return isoString || "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

export const toISOStringFromInput = (inputVal: string): string => {
  if (!inputVal) return new Date().toISOString();
  const d = new Date(inputVal);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
};

/**
 * Checks whether an event is considered a competitive race (Sprint, Resistencia, Carrera de Club, etc.)
 * Non-race events (Entrenamiento, Qualy, Reunión, Práctica, Test) will return false.
 */
export const isRaceEvent = (event: { type?: string } | null | undefined): boolean => {
  if (!event || !event.type) return false;
  const nonRaceTypes = ["entrenamiento", "qualy", "reunión", "reunion", "práctica", "practica", "test", "pruebas", "entreno"];
  const t = event.type.trim().toLowerCase();
  return !nonRaceTypes.includes(t);
};
