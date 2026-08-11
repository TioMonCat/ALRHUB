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
  const payload = {
    username: "ALR Racing Bot",
    avatar_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=150&auto=format&fit=crop&q=80",
    embeds: [
      {
        title: "✅ Conexión con Discord Establecida Exitosamente",
        description: "El bot de avisos de **ALR Racing Team** ha sido verificado correctamente. Todo evento en el calendario enviará notificaciones y avisos automáticos a este canal.",
        color: 3447003,
        fields: [
          { name: "Estado", value: "🟢 Activo & Conectado", inline: true },
          { name: "Sistema", value: "Calendario Global ALR", inline: true },
          { name: "Eventos Soportados", value: "Carreras, Qualys, Prácticas, Briefings y Reuniones", inline: false }
        ],
        footer: {
          text: "ALR Racing Team • Sistema Oficial de Notificaciones"
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

  const payload = {
    content: headerTitle,
    username: "ALR Racing Bot",
    avatar_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=150&auto=format&fit=crop&q=80",
    embeds: [
      {
        title: `${meta.icon} ${event.title}`,
        description: descriptionText,
        color: meta.color,
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
            name: "⏱️ Duración",
            value: (event as any).duration || "Seguimiento oficial",
            inline: true
          },
          {
            name: "📝 Información & Notas",
            value: event.description || event.strategyNotes || "Revisa la pestaña del calendario en la web para más detalles.",
            inline: false
          },
          {
            name: "✅ Asistencia de Pilotos",
            value: "Ingresa a la sección **Asistencia** de ALR Racing Team para marcar si asistes o no.",
            inline: false
          }
        ],
        footer: {
          text: `ALR Racing Team • Notificador del Calendario (${is24hAlert ? "Aviso 24 Horas" : "Evento de Calendario"})`
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

/**
 * Check if an event is approximately 24 hours away (between 12 and 36 hours from now)
 */
export function isEvent24hAway(eventDateStr: string): boolean {
  const eventDate = parseEventDate(eventDateStr);
  if (!eventDate) return false;

  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= 12 && diffHours <= 36;
}
