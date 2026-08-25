import React, { useState, useMemo } from "react";
import { TeamEvent, UserProfile } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { 
  parseEventDate, 
  formatForDateTimeInput, 
  formatLocalTime, 
  formatFullDate, 
  toISOStringFromInput 
} from "../dateUtils";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Car, 
  Trophy, 
  CheckCircle, 
  ArrowRight,
  Filter,
  Grid,
  List as ListIcon,
  Flag,
  Plus,
  Trash2,
  Edit3,
  Users,
  Radio,
  X,
  Send,
  MessageSquare,
  Bell,
  Check,
  AlertTriangle,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getDiscordWebhookUrl, 
  saveDiscordWebhookUrl, 
  send24HourEventReminder, 
  sendTestWebhookNotification,
  isEvent24hAway,
  mark24hReminderAsSent 
} from "../services/discordService";

interface CalendarioProps {
  events: TeamEvent[];
  currentUserProfile?: UserProfile | null;
  dbReadOnly?: boolean;
  onNavigate?: (view: string) => void;
}

export default function Calendario({ events, currentUserProfile, dbReadOnly, onNavigate }: CalendarioProps) {
  const isAdmin = currentUserProfile?.role === "admin";

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "upcoming" | "completed">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);

  // Discord Bot & Webhook Integration State
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [showDiscordModal, setShowDiscordModal] = useState<boolean>(false);
  const [isSavingWebhook, setIsSavingWebhook] = useState<boolean>(false);
  const [isSendingDiscord, setIsSendingDiscord] = useState<string | null>(null);
  const [discordFeedback, setDiscordFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifyOnCreate, setNotifyOnCreate] = useState<boolean>(true);

  // Load saved Discord webhook URL on mount
  React.useEffect(() => {
    getDiscordWebhookUrl().then((url) => setWebhookUrl(url));
  }, []);

  const handleSaveDiscordWebhook = async () => {
    setIsSavingWebhook(true);
    setDiscordFeedback(null);
    try {
      await saveDiscordWebhookUrl(webhookUrl);
      setDiscordFeedback({ type: "success", text: "URL de Webhook de Discord guardada correctamente." });
    } catch (err) {
      setDiscordFeedback({ type: "error", text: "Error al guardar la URL del Webhook." });
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleSendTestDiscord = async () => {
    if (!webhookUrl) {
      setDiscordFeedback({ type: "error", text: "Ingresa primero una URL válida de Webhook de Discord." });
      return;
    }
    setIsSendingDiscord("test");
    setDiscordFeedback(null);
    const result = await sendTestWebhookNotification(webhookUrl);
    setIsSendingDiscord(null);
    if (result.success) {
      setDiscordFeedback({ type: "success", text: "¡Mensaje de prueba enviado con éxito a Discord!" });
    } else {
      setDiscordFeedback({ type: "error", text: result.error || "Fallo al enviar notificación a Discord." });
    }
  };

  const handleSend24hReminder = async (event: TeamEvent) => {
    let targetWebhook = webhookUrl;
    if (!targetWebhook) {
      targetWebhook = await getDiscordWebhookUrl();
    }
    if (!targetWebhook) {
      setDiscordFeedback({ 
        type: "error", 
        text: "Para enviar avisos a Discord, inyecta la URL del Webhook en src/services/discordService.ts." 
      });
      return;
    }

    setIsSendingDiscord(event.id);
    setDiscordFeedback(null);
    const result = await send24HourEventReminder(targetWebhook, event);
    setIsSendingDiscord(null);

    if (result.success) {
      mark24hReminderAsSent(event.id);
      if (isAdmin && !dbReadOnly) {
        try {
          await updateDoc(doc(db, "events", event.id), {
            discordNotified24h: true,
            discordNotified24hAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Could not update discordNotified24h flag in Firestore:", e);
        }
      }
      setDiscordFeedback({ type: "success", text: `¡Aviso del evento "${event.title}" enviado exitosamente a Discord!` });
    } else {
      setDiscordFeedback({ type: "error", text: result.error || "No se pudo enviar el aviso a Discord." });
    }
  };

  // Find upcoming events that occur in ~24h
  const upcoming24hEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.status === "completed") return false;
      return isEvent24hAway(e.date);
    });
  }, [events]);
  // Admin Event Creation / Edit Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TeamEvent | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState<string>("Qualy");
  const [createTrack, setCreateTrack] = useState("");
  const [createCar, setCreateCar] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const resetForm = () => {
    setCreateTitle("");
    setCreateType("Qualy");
    setCreateTrack("");
    setCreateCar("");
    setCreateDate("");
    setCreateDescription("");
  };

  const handleStartEdit = (event: TeamEvent) => {
    setEditingEvent(event);
    setCreateTitle(event.title || "");
    setCreateType(event.type || "Qualy");
    setCreateTrack(event.track || "");
    setCreateCar(event.car || "");
    setCreateDescription(event.description || "");

    if (event.date) {
      setCreateDate(formatForDateTimeInput(event.date));
    } else {
      setCreateDate("");
    }
    setShowCreateModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || dbReadOnly) return;
    setIsSubmitting(true);

    try {
      const formattedDate = createDate 
        ? toISOStringFromInput(createDate)
        : new Date().toISOString();

      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), {
          title: createTitle,
          type: createType,
          track: createTrack || "Por Definir",
          car: createCar || "Variado / Libre",
          date: formattedDate,
          description: createDescription,
        });
        if (selectedEvent?.id === editingEvent.id) {
          setSelectedEvent({
            ...selectedEvent,
            title: createTitle,
            type: createType,
            track: createTrack || "Por Definir",
            car: createCar || "Variado / Libre",
            date: formattedDate,
            description: createDescription,
          });
        }
      } else {
        await addDoc(collection(db, "events"), {
          title: createTitle,
          type: createType,
          track: createTrack || "Por Definir",
          car: createCar || "Variado / Libre",
          date: formattedDate,
          status: "scheduled",
          description: createDescription,
          createdAt: new Date().toISOString()
        });
      }

      setShowCreateModal(false);
      setEditingEvent(null);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, editingEvent ? OperationType.UPDATE : OperationType.CREATE, "events");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!isAdmin || dbReadOnly) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta fecha o sesión del calendario?")) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "events", eventId));
      setSelectedEvent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${eventId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter events by selected category and status
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Category filter
      if (selectedCategory !== "all") {
        const cat = (e.car || "").toLowerCase();
        if (!cat.includes(selectedCategory.toLowerCase())) return false;
      }
      // Status filter
      const eDate = parseEventDate(e.date);
      const isPast = e.status === "completed" || (eDate ? eDate < new Date() : false);
      if (selectedStatus === "upcoming" && isPast) return false;
      if (selectedStatus === "completed" && !isPast) return false;

      return true;
    });
  }, [events, selectedCategory, selectedStatus]);

  // Extract unique categories from events for filter pills
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    events.forEach(e => {
      if (e.car) cats.add(e.car);
    });
    return Array.from(cats);
  }, [events]);

  // Generate calendar grid days for current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Adjust first day to Monday-based (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: TeamEvent[];
    }> = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: prevDate,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    // Current month days
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const isToday = 
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === d;

      // Find events matching this specific date
      const dayEvents = filteredEvents.filter(e => {
        if (!e.date) return false;
        const eDate = parseEventDate(e.date);
        if (!eDate) return false;
        return (
          eDate.getFullYear() === year &&
          eDate.getMonth() === month &&
          eDate.getDate() === d
        );
      });

      days.push({
        date: thisDate,
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        events: dayEvents
      });
    }

    // Next month padding days to complete 35 or 42 cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    return days;
  }, [year, month, filteredEvents]);

  // Helper for type badges
  const getTypeBadge = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("qualy") || t.includes("clasif")) {
      return {
        bg: "bg-amber-950/80 text-amber-300 border-amber-500/40",
        label: "Qualy / Clasificación",
        icon: Flag
      };
    }
    if (t.includes("entrena") || t.includes("prácti") || t.includes("practi")) {
      return {
        bg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
        label: "Entrenamiento",
        icon: Clock
      };
    }
    if (t.includes("reun") || t.includes("junta") || t.includes("discord")) {
      return {
        bg: "bg-purple-950/80 text-purple-300 border-purple-500/40",
        label: "Reunión",
        icon: Users
      };
    }
    if (t.includes("test") || t.includes("ensayo")) {
      return {
        bg: "bg-sky-950/80 text-sky-300 border-sky-500/40",
        label: "Test / Ensayo",
        icon: Radio
      };
    }
    return {
      bg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
      label: type || "Carrera",
      icon: Trophy
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Standard Header matching other tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
            <CalendarIcon className="w-4.5 h-4.5 text-cyan-400" />
            Calendario de Eventos y Sesiones
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Fechas oficiales, qualys, entrenamientos y reuniones (Hora Local)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isAdmin && (
            <button
              onClick={() => {
                setEditingEvent(null);
                resetForm();
                setShowCreateModal(true);
              }}
              disabled={dbReadOnly}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Evento / Sesión</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="bg-[#18181B] border border-stone-800 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-cyan-950 text-[#66FCF1] border border-cyan-500/30 shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-cyan-950 text-[#66FCF1] border border-cyan-500/30 shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* DISCORD FEEDBACK TOAST / ALERT */}
      {discordFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono font-bold transition-all ${
            discordFeedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-lg"
              : "bg-red-950/80 border-red-500/50 text-red-300 shadow-lg"
          }`}
        >
          <div className="flex items-center gap-2">
            {discordFeedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{discordFeedback.text}</span>
          </div>
          <button
            onClick={() => setDiscordFeedback(null)}
            className="p-1 hover:bg-black/30 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 24-HOUR EVENT NOTIFICATION BANNER */}
      {upcoming24hEvents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/40 to-[#121214] border border-amber-500/60 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10">
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce text-amber-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500 text-black font-mono font-black text-[10px] uppercase rounded tracking-wider">
                  ⚠️ ALERTA 24 HORAS
                </span>
                <span className="text-xs text-amber-300 font-mono font-extrabold">
                  {upcoming24hEvents.length} evento(s) aproximándose
                </span>
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                {upcoming24hEvents.map((e) => e.title).join(" • ")}
              </h4>
              <p className="text-xs text-stone-300 font-mono">
                Presiona el botón para notificar inmediatamente por Discord a todos los pilotos de la escudería.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 relative z-10">
            {upcoming24hEvents.map((ev) => {
              const isSent = ev.discordNotified24h;
              return (
                <button
                  key={ev.id}
                  onClick={() => handleSend24hReminder(ev)}
                  disabled={isSendingDiscord === ev.id}
                  className={`px-3.5 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isSent 
                      ? "bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300"
                      : "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  }`}
                  title={isSent ? "Aviso enviado automáticamente. Haz clic para reenviar si lo deseas." : "Enviar aviso ahora"}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSendingDiscord === ev.id 
                      ? "Enviando..." 
                      : isSent 
                        ? `Aviso 24h Enviado (Reenviar)` 
                        : `Avisar en Discord 24h`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Month Navigation Control, Status Filter & Category Filters */}
      <div className="bg-[#111113] border border-stone-850 p-4 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Month Selector */}
        <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[170px]">
            <h3 className="text-lg font-bold font-display uppercase text-white tracking-wider">
              {monthNames[month]} <span className="text-cyan-400">{year}</span>
            </h3>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-[#66FCF1] text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ml-1"
          >
            Hoy
          </button>
        </div>

        {/* Filters and Legend Bar */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-[#18181B] border border-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedStatus === "all"
                  ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedStatus("upcoming")}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === "upcoming"
                  ? "bg-cyan-950 text-[#66FCF1] border border-cyan-500/40 shadow-sm"
                  : "text-stone-400 hover:text-cyan-300"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Próximas
            </button>
            <button
              onClick={() => setSelectedStatus("completed")}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === "completed"
                  ? "bg-stone-900 text-stone-300 border border-stone-700 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <CheckCircle className="w-3 h-3 text-stone-400" />
              Finalizadas
            </button>
          </div>

          {/* Category filter pills */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
              <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider shrink-0 hidden sm:inline-flex items-center gap-1">
                <Filter className="w-3 h-3" /> Categoría:
              </span>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-stone-800 text-white border border-stone-700"
                    : "bg-stone-900/50 text-stone-400 border border-stone-850 hover:text-stone-200"
                }`}
              >
                Todas
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-cyan-950 text-[#66FCF1] border border-cyan-500/30"
                      : "bg-stone-900/50 text-stone-400 border border-stone-850 hover:text-stone-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: MONTHLY GRID */}
      {viewMode === "grid" && (
        <div className="bg-[#111113] border border-stone-850 rounded-2xl p-3 md:p-5 shadow-2xl space-y-2 overflow-hidden">
          
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center">
            {weekDays.map((day, idx) => (
              <div 
                key={day} 
                className={`py-2 text-[11px] md:text-xs font-mono font-extrabold uppercase tracking-widest rounded-lg ${
                  idx >= 5 ? "text-amber-400 bg-amber-950/10 border border-amber-900/20" : "text-stone-400 bg-stone-900/40 border border-stone-850/40"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-fr">
            {calendarDays.map((cell, idx) => {
              const hasEvents = cell.events.length > 0;

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] md:min-h-[140px] p-2 md:p-2.5 rounded-xl border flex flex-col justify-between transition-all relative group/cell ${
                    cell.isToday
                      ? "bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                      : cell.isCurrentMonth
                      ? "bg-[#141416]/90 border-stone-850 hover:border-stone-750"
                      : "bg-[#0c0c0e]/40 border-stone-900/50 opacity-40"
                  }`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span 
                      className={`text-xs md:text-sm font-mono font-extrabold ${
                        cell.isToday
                          ? "bg-cyan-400 text-black px-1.5 py-0.5 rounded-md font-black shadow-sm"
                          : cell.isCurrentMonth
                          ? "text-stone-300"
                          : "text-stone-600"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {cell.isToday && (
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider hidden sm:inline-block">
                          HOY
                        </span>
                      )}

                      {/* Admin quick add button on cell hover */}
                      {isAdmin && cell.isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(null);
                            const d = new Date(cell.date);
                            d.setHours(20, 0, 0, 0);
                            setCreateDate(formatForDateTimeInput(d));
                            setShowCreateModal(true);
                          }}
                          className="opacity-0 group-hover/cell:opacity-100 p-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white rounded text-[10px] transition-all cursor-pointer"
                          title="Añadir evento en este día"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}

                      {hasEvents && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      )}
                    </div>
                  </div>

                  {/* Events Container Inside Day Cell */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar max-h-[120px]">
                    {cell.events.map((event) => {
                      const eDate = parseEventDate(event.date);
                      const isPast = event.status === "completed" || (eDate ? eDate < new Date() : false);
                      const badge = getTypeBadge(event.type);

                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer group shadow-md relative overflow-hidden ${
                            isPast
                              ? "bg-[#18181b]/80 border-stone-800 text-stone-400 hover:border-stone-700 opacity-75 hover:opacity-100"
                              : "bg-[#09222c] hover:bg-[#0e2f3d] border-cyan-500/50 hover:border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-500/20"
                          }`}
                        >
                          {/* Top Status & Type Tag */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`px-1.5 py-0.5 border font-mono font-extrabold text-[8px] uppercase rounded flex items-center gap-1 ${badge.bg}`}>
                              {event.type || "Carrera"}
                            </span>

                            {isPast ? (
                              <span className="text-[8px] text-stone-500 font-mono font-bold">Finalizada</span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            )}
                          </div>

                          {/* Event Name */}
                          <p className={`text-[11px] md:text-xs font-black leading-snug line-clamp-2 ${
                            isPast ? "text-stone-300 group-hover:text-white" : "text-white group-hover:text-cyan-300"
                          }`}>
                            {event.title}
                          </p>

                          {/* Circuito / Lugar */}
                          <div className="flex items-center gap-1 text-[10px] text-stone-300 mt-1 truncate">
                            <MapPin className={`w-3 h-3 shrink-0 ${isPast ? "text-stone-500" : "text-cyan-400"}`} />
                            <span className="truncate">{event.track}</span>
                          </div>

                          {/* Hora Local */}
                          <div className={`flex items-center gap-1 text-[10px] font-mono font-bold mt-0.5 ${
                            isPast ? "text-stone-400" : "text-emerald-400"
                          }`}>
                            <Clock className={`w-3 h-3 shrink-0 ${isPast ? "text-stone-500" : "text-emerald-400"}`} />
                            <span>{formatLocalTime(event.date)}</span>
                          </div>

                          {/* Categoría */}
                          {event.car && (
                            <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight uppercase ${
                              isPast ? "bg-stone-900 border border-stone-800 text-stone-400" : "bg-cyan-950/90 border border-cyan-500/30 text-cyan-200"
                            }`}>
                              <Car className={`w-2.5 h-2.5 shrink-0 ${isPast ? "text-stone-500" : "text-amber-400"}`} />
                              <span className="truncate">{event.car}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!hasEvents && cell.isCurrentMonth && (
                    <div className="text-[10px] text-stone-800 font-mono text-center my-auto pointer-events-none select-none">
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: LIST / AGENDA */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-[#111113] border border-stone-850 rounded-2xl p-12 text-center text-stone-500 font-mono text-xs">
              No hay eventos o carreras programadas con el filtro seleccionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents
                .sort((a, b) => (parseEventDate(a.date)?.getTime() || 0) - (parseEventDate(b.date)?.getTime() || 0))
                .map((event) => {
                  const eDate = parseEventDate(event.date);
                  const isPast = event.status === "completed" || (eDate ? eDate < new Date() : false);
                  const badge = getTypeBadge(event.type);

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-5 rounded-2xl transition-all cursor-pointer space-y-3 relative group shadow-xl border ${
                        isPast
                          ? "bg-[#121214] hover:bg-[#161619] border-stone-850 hover:border-stone-750 opacity-80 hover:opacity-100"
                          : "bg-[#0d1c24] hover:bg-[#112530] border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.12)] ring-1 ring-cyan-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-stone-850/80 pb-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border flex items-center gap-1.5 ${badge.bg}`}>
                          {isPast ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              {event.type || "Sesión"} (Finalizada)
                            </>
                          ) : (
                            <>
                              <Flag className="w-3 h-3" />
                              {event.type || "Sesión"} (Próxima)
                            </>
                          )}
                        </span>

                        <span className={`text-xs font-mono font-bold ${isPast ? "text-stone-500" : "text-cyan-300"}`}>
                          {formatFullDate(event.date)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className={`text-base font-extrabold font-display uppercase tracking-tight transition-colors ${
                          isPast ? "text-stone-200 group-hover:text-white" : "text-white group-hover:text-cyan-300"
                        }`}>
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed font-sans">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-stone-850/60 font-mono text-xs">
                        {/* Circuito */}
                        <div className="flex items-center gap-2 text-stone-300">
                          <MapPin className={`w-4 h-4 shrink-0 ${isPast ? "text-stone-500" : "text-cyan-400"}`} />
                          <span className="font-semibold">{event.track}</span>
                        </div>

                        {/* Hora Local */}
                        <div className={`flex items-center gap-2 font-bold ${isPast ? "text-stone-400" : "text-emerald-400"}`}>
                          <Clock className={`w-4 h-4 shrink-0 ${isPast ? "text-stone-500" : "text-emerald-400"}`} />
                          <span>Hora Local: {formatLocalTime(event.date)}</span>
                        </div>

                        {/* Categoría */}
                        {event.car && (
                          <div className="flex items-center gap-2 text-stone-300 pt-1">
                            <Car className={`w-4 h-4 shrink-0 ${isPast ? "text-stone-500" : "text-amber-400"}`} />
                            <span>Categoría: <strong className={isPast ? "text-stone-300" : "text-white"}>{event.car}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111113] border border-stone-800 rounded-2xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between border-b border-stone-850 pb-4">
                <div className="space-y-1.5 pr-4">
                  {(() => {
                    const eDate = parseEventDate(selectedEvent.date);
                    const isPast = selectedEvent.status === "completed" || (eDate ? eDate < new Date() : false);
                    const badge = getTypeBadge(selectedEvent.type);
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-black uppercase rounded-full tracking-wider border flex items-center gap-1 ${badge.bg}`}>
                          {selectedEvent.type || "Sesión"}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${
                          isPast ? "bg-stone-900 text-stone-400 border-stone-800" : "bg-cyan-950 text-cyan-300 border-cyan-500/40"
                        }`}>
                          {isPast ? "Finalizada" : "Próxima"}
                        </span>
                      </div>
                    );
                  })()}
                  <h3 className="text-xl md:text-2xl font-black text-white font-display uppercase tracking-tight">
                    {selectedEvent.title}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 text-stone-400 hover:text-white bg-stone-900 rounded-lg border border-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Race details fields */}
              <div className="space-y-4 bg-[#161618] border border-stone-850 p-5 rounded-xl font-mono text-sm">
                
                {/* Circuito */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Circuito / Lugar</p>
                    <p className="text-white font-bold text-base">{selectedEvent.track}</p>
                  </div>
                </div>

                {/* Hora Local y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-800/80">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Hora Local</p>
                      <p className="text-emerald-400 font-extrabold text-base">{formatLocalTime(selectedEvent.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Fecha</p>
                      <p className="text-stone-200 font-bold text-xs">{formatFullDate(selectedEvent.date)}</p>
                    </div>
                  </div>
                </div>

                {/* Categoría */}
                {selectedEvent.car && (
                  <div className="flex items-start gap-3 pt-3 border-t border-stone-800/80">
                    <Car className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Categoría / Vehículo</p>
                      <p className="text-white font-bold text-sm">{selectedEvent.car}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="space-y-1.5">
                  <p className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">Detalles de la prueba:</p>
                  <p className="text-xs text-stone-300 leading-relaxed bg-[#0e0e10] p-4 rounded-xl border border-stone-850 font-sans">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-850">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const ev = selectedEvent;
                        setSelectedEvent(null);
                        handleStartEdit(ev);
                      }}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-mono uppercase font-bold transition-all cursor-pointer border border-stone-700 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      disabled={isSubmitting}
                      className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-xl text-xs font-mono uppercase font-bold transition-all cursor-pointer border border-red-800/50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                ) : <div />}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSend24hReminder(selectedEvent)}
                    disabled={isSendingDiscord === selectedEvent.id}
                    className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/50 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    title="Enviar ficha con aviso de 24h a Discord"
                  >
                    <Send className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isSendingDiscord === selectedEvent.id ? "Enviando..." : "Avisar en Discord 24h"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-mono uppercase font-bold transition-all cursor-pointer border border-stone-800"
                  >
                    Cerrar
                  </button>
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setSelectedEvent(null);
                        onNavigate("asistencia");
                      }}
                      className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-[#66FCF1] border border-cyan-500/40 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                    >
                      <span>RSVP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN CREATE / EDIT CUSTOM EVENT MODAL */}
      <AnimatePresence>
        {showCreateModal && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111113] border border-stone-800 rounded-2xl p-6 md:p-8 max-w-xl w-full space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-cyan-400" />
                    {editingEvent ? "Editar Evento o Sesión" : "Crear Fecha / Sesión Personalizada"}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono">
                    Qualys, entrenamientos libres, reuniones o eventos no oficiales
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="p-1.5 text-stone-400 hover:text-white bg-stone-900 rounded-lg border border-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1 font-bold">
                    Título del Evento / Sesión *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Qualy LMU Spa, Entrenamiento Libre, Reunión de Pilotos..."
                    className="w-full bg-[#18181B] border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1 font-bold">
                      Tipo de Evento *
                    </label>
                    <select
                      value={createType}
                      onChange={(e) => setCreateType(e.target.value)}
                      className="w-full bg-[#18181B] border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Qualy">Qualy / Clasificación</option>
                      <option value="Entrenamiento">Entrenamiento Libre</option>
                      <option value="Reunión">Reunión de Pilotos</option>
                      <option value="Práctica">Práctica Oficial</option>
                      <option value="Test">Test / Ensayo</option>
                      <option value="Sprint">Carrera Sprint</option>
                      <option value="Resistencia">Carrera Resistencia</option>
                      <option value="Otro">Otro Evento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1 font-bold">
                      Fecha y Hora (Hora Local) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full bg-[#18181B] border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1 font-bold">
                      Circuito / Servidor / Lugar
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Spa-Francorchamps, Servidor Discord, LMU..."
                      className="w-full bg-[#18181B] border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      value={createTrack}
                      onChange={(e) => setCreateTrack(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1 font-bold">
                      Categoría / Vehículo (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: GT3 / LMP2, Libre..."
                      className="w-full bg-[#18181B] border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      value={createCar}
                      onChange={(e) => setCreateCar(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1 font-bold">
                    Descripción / Notas de la Sesión
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Agrega instrucciones, contraseña del servidor, orden del día de la reunión..."
                    className="w-full bg-[#18181B] border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-mono uppercase font-bold transition-all cursor-pointer border border-stone-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || dbReadOnly}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : editingEvent ? "Guardar Cambios" : "Publicar Evento"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
