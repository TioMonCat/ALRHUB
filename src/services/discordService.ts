import { TeamEvent } from "../types";
import { formatFullDate, formatLocalTime, parseEventDate } from "../dateUtils";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * DEFAULT DISCORD WEBHOOK URL
 * Set your Discord Webhook URL directly here or via VITE_DISCORD_WEBHOOK_URL environment variable.
 */
export const DEFAULT_DISCORD_WEBHOOK_URL =
  import.meta.env.VITE_DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1502446014496374814/cYRrHJQ4FTSG7lpk7R3rAbXc5JXxhaxAevoEVxBLQp0xot4jpjZJwvKyZmQUU52SmdTc";

const DISCORD_WEBHOOK_KEY = "alr_discord_webhook_url";

/**
 * Bot Identity
 */
export const DEFAULT_BOT_USERNAME = "ALR Bot";
export const BOT_AVATAR_KEY = "alr_discord_bot_avatar_url";
export const OFFICIAL_PUBLIC_LOGO_URL = "https://apexlatamracing.it.com/img/LogoAlrCircular.png";
export const SHARED_APP_LOGO_URL = "https://ais-pre-uy2cffiolqr6eitjpanviu-387400197805.us-west1.run.app/img/LogoAlrCircular.png";

export function getBotAvatarUrl(): string {
  // 1. Check local storage override if user configured a custom image URL
  if (typeof window !== "undefined") {
    try {
      const custom = localStorage.getItem(BOT_AVATAR_KEY);
      if (custom && custom.trim().length > 0) return custom.trim();
    } catch {}
  }

  // 2. If running on public domain or accessible host
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    const origin = window.location.origin;
    // If running in development or sandbox where external Discord servers cannot fetch internal URLs,
    // point to the public domain or shared app URL so Discord can reliably fetch the PNG image
    if (origin.includes("localhost") || origin.includes("ais-dev-") || origin.includes("127.0.0.1")) {
      return OFFICIAL_PUBLIC_LOGO_URL;
    }
    return `${origin}/img/LogoAlrCircular.png`;
  }

  return OFFICIAL_PUBLIC_LOGO_URL;
}

export function saveBotAvatarUrl(url: string) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BOT_AVATAR_KEY, url.trim());
    } catch {}
  }
}

/**
 * Retrieve the Discord Webhook URL (from hardcoded default, localStorage, or Firestore)
 */
export async function getDiscordWebhookUrl(): Promise<string> {
  // 1. Check default hardcoded in code or env
  if (DEFAULT_DISCORD_WEBHOOK_URL && DEFAULT_DISCORD_WEBHOOK_URL.trim().length > 0) {
    return DEFAULT_DISCORD_WEBHOOK_URL.trim();
  }

  // 2. Check localStorage
  const localUrl = localStorage.getItem(DISCORD_WEBHOOK_KEY);
  if (localUrl && localUrl.trim().length > 0) {
    return localUrl.trim();
  }

  // 3. Fallback to Firestore settings document if available
  try {
    const docRef = doc(db, "settings", "discord");
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.webhookUrl) {
      const url = snap.data().webhookUrl.trim();
      localStorage.setItem(DISCORD_WEBHOOK_KEY, url);
      return url;
    }
  } catch (e) {
    console.warn("Could not load Discord webhook from Firestore:", e);
  }

  return "";
}

/**
 * Save the Discord Webhook URL to localStorage and Firestore
 */
export async function saveDiscordWebhookUrl(url: string): Promise<void> {
  const cleanUrl = url.trim();
  localStorage.setItem(DISCORD_WEBHOOK_KEY, cleanUrl);

  try {
    const docRef = doc(db, "settings", "discord");
    await setDoc(docRef, { webhookUrl: cleanUrl, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("Could not save Discord webhook to Firestore:", e);
  }
}

/**
 * Send a test notification to verify the Webhook connection
 */
export async function sendTestWebhookNotification(webhookUrl?: string): Promise<{ success: boolean; error?: string }> {
  const avatarUrl = getBotAvatarUrl();
  const payload = {
    username: DEFAULT_BOT_USERNAME,
    avatar_url: avatarUrl,
    embeds: [
      {
        author: {
          name: DEFAULT_BOT_USERNAME,
          icon_url: avatarUrl
        },
        title: "✅ Conexión con Discord Establecida Exitosamente",
        description: "El bot de avisos de **ALR Racing Team** ha sido verificado correctamente. Todo evento en el calendario enviará notificaciones y avisos automáticos a este canal.",
        color: 3447003,
        thumbnail: {
          url: avatarUrl
        },
        fields: [
          { name: "Estado", value: "🟢 Activo & Conectado", inline: true },
          { name: "Sistema", value: "Calendario Global ALR", inline: true },
          { name: "Eventos Soportados", value: "Carreras, Qualys, Prácticas, Briefings y Reuniones", inline: false }
        ],
        footer: {
          text: "ALR Racing Team • Sistema Oficial de Notificaciones",
          icon_url: avatarUrl
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  return await sendDiscordPayload(webhookUrl || "", payload);
}

/**
 * Send a generic embed payload to a Discord Webhook
 */
export async function sendDiscordPayload(webhookUrl: string, payload: any): Promise<{ success: boolean; error?: string }> {
  const targetUrl = webhookUrl || (await getDiscordWebhookUrl());

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return { 
      success: false, 
      error: "No se ha configurado la URL del Webhook de Discord en el código." 
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 204) {
      return { success: true };
    } else {
      const text = await response.text();
      return { success: false, error: `Error ${response.status}: ${text || "Respuesta fallida de Discord"}` };
    }
  } catch (err: any) {
    console.error("Error sending to Discord Webhook:", err);
    return { success: false, error: err.message || "Error de red al conectar con Discord." };
  }
}

/**
 * Helper to get appropriate icon and theme color for ANY event type in the calendar
 */
function getEventTypeMeta(eventType?: string) {
  const typeLower = (eventType || "").toLowerCase();
  if (typeLower.includes("carrera") || typeLower.includes("race")) {
    return { icon: "🏁", label: "Carrera Oficial", color: 16738816 }; // Orange/Amber
  } else if (typeLower.includes("qualy") || typeLower.includes("clasificación") || typeLower.includes("qualyfying")) {
    return { icon: "⏱️", label: "Sesión de Clasificación", color: 3447003 }; // Cyan/Blue
  } else if (typeLower.includes("práctica") || typeLower.includes("practica") || typeLower.includes("entrenamientos")) {
    return { icon: "🏎️", label: "Sesión de Entrenamientos", color: 5763719 }; // Green
  } else if (typeLower.includes("reunión") || typeLower.includes("briefing") || typeLower.includes("reunion")) {
    return { icon: "📢", label: "Briefing / Reunión de Equipo", color: 10181046 }; // Purple
  } else {
    return { icon: "📅", label: eventType || "Evento de Calendario", color: 15105570 }; // Yellow
  }
}

/**
 * Send an event announcement (24h reminder or custom announcement) for ANY event type from the calendar
 */
export async function sendCalendarEventAnnouncement(
  webhookUrl: string,
  event: TeamEvent,
  is24hAlert: boolean = true,
  customMention: string = "@everyone"
): Promise<{ success: boolean; error?: string }> {
  const parsedDate = parseEventDate(event.date);
  const formattedDateStr = formatFullDate(event.date);
  const formattedTimeStr = formatLocalTime(event.date);
  const meta = getEventTypeMeta(event.type);

  const headerTitle = is24hAlert
    ? `${customMention} 🚨 **AVISO DEL CALENDARIO: FALTAN 24 HORAS** 🚨`
    : `${customMention} 📢 **NUEVO ANUNCIO DE EVENTO EN CALENDARIO** 📢`;

  const descriptionText = is24hAlert
    ? `¡Atención equipo! Mañana tiene lugar en el calendario el evento **${event.title}** (${meta.label}). Prepara tu simulación y confirma tu asistencia en la web.`
    : `Se ha publicado/actualizado en el calendario el evento **${event.title}** (${meta.label}). Revisa los detalles y confirma tu asistencia en la plataforma web.`;

  const avatarUrl = getBotAvatarUrl();
  const payload = {
    content: headerTitle,
    username: DEFAULT_BOT_USERNAME,
    avatar_url: avatarUrl,
    embeds: [
      {
        author: {
          name: DEFAULT_BOT_USERNAME,
          icon_url: avatarUrl
        },
        title: `${meta.icon} ${event.title}`,
        description: descriptionText,
        color: meta.color,
        thumbnail: {
          url: avatarUrl
        },
        fields: [
          {
            name: "📋 Tipo de Evento",
            value: event.type || meta.label,
            inline: true
          },
          {
            name: "📍 Circuito / Pista",
            value: event.track || "Ver detalles",
            inline: true
          },
          {
            name: "🏎️ Vehículo / Coche",
            value: event.car || "Oficial",
            inline: true
          },
          {
            name: "📅 Fecha",
            value: formattedDateStr,
            inline: true
          },
          {
            name: "⏰ Hora",
            value: formattedTimeStr || "Consultar Calendario",
            inline: true
          },
          {
            name: "✅ Asistencia de Pilotos",
            value: "Ingresa a la sección **Asistencia** de ALR Racing Team para marcar si asistes o no.",
            inline: false
          }
        ],
        footer: {
          text: `ALR Racing Team • Notificador del Calendario (${is24hAlert ? "Aviso 24 Horas" : "Evento de Calendario"})`,
          icon_url: avatarUrl
        },
        timestamp: parsedDate ? parsedDate.toISOString() : new Date().toISOString()
      }
    ]
  };

  return await sendDiscordPayload(webhookUrl, payload);
}

/**
 * Backward compatible alias for 24-hour event reminder
 */
export async function send24HourEventReminder(
  webhookUrl: string,
  event: TeamEvent,
  customMention: string = "@everyone"
): Promise<{ success: boolean; error?: string }> {
  return sendCalendarEventAnnouncement(webhookUrl, event, true, customMention);
}

const SENT_24H_STORAGE_KEY = "alr_sent_24h_reminders";

export function getSent24hReminderIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(SENT_24H_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

export function mark24hReminderAsSent(eventId: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getSent24hReminderIds();
    ids.add(eventId);
    localStorage.setItem(SENT_24H_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

/**
 * Check if an event is in the upcoming 24-hour window (between 0 and 26 hours from now)
 */
export function isEvent24hAway(eventDateStr: string): boolean {
  const eventDate = parseEventDate(eventDateStr);
  if (!eventDate) return false;

  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Future event occurring within the next 26 hours
  return diffHours > 0 && diffHours <= 26;
}

// In-flight sending lock to prevent race conditions during rapid re-renders
const inFlightReminderIds = new Set<string>();

/**
 * Automatically inspects the calendar events and dispatches 24h reminders via ALR Bot
 * when any event enters the 24-hour window.
 */
export async function checkAndAutoSend24hReminders(
  events: TeamEvent[],
  onNotified?: (eventId: string) => Promise<void> | void
): Promise<{ sentCount: number; errors: string[] }> {
  const webhookUrl = await getDiscordWebhookUrl();
  if (!webhookUrl) return { sentCount: 0, errors: ["No webhook URL configured"] };

  const alreadySentLocal = getSent24hReminderIds();
  const eligibleEvents = events.filter((e) => {
    if (!e.id || e.status === "completed") return false;
    if (e.discordNotified24h) return false;
    if (alreadySentLocal.has(e.id)) return false;
    if (inFlightReminderIds.has(e.id)) return false;
    return isEvent24hAway(e.date);
  });

  if (eligibleEvents.length === 0) {
    return { sentCount: 0, errors: [] };
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const ev of eligibleEvents) {
    inFlightReminderIds.add(ev.id);
    try {
      console.log(`[ALR Bot] Enviando aviso automático de 24h para evento: ${ev.title} (${ev.date})`);
      const res = await send24HourEventReminder(webhookUrl, ev);
      if (res.success) {
        mark24hReminderAsSent(ev.id);
        sentCount++;
        if (onNotified) {
          await onNotified(ev.id);
        }
      } else {
        errors.push(`Error en ${ev.title}: ${res.error}`);
        inFlightReminderIds.delete(ev.id);
      }
    } catch (err: any) {
      errors.push(`Excepción en ${ev.title}: ${err?.message || err}`);
      inFlightReminderIds.delete(ev.id);
    }
  }

  return { sentCount, errors };
}

