import React, { useState } from "react";
import { TeamEvent, UserProfile, AttendanceRecord } from "../types";
import {
  Check,
  X,
  HelpCircle,
  Save,
  Clock,
  Users,
  Calendar,
  Sparkles,
  ClipboardList,
  Edit3,
  MessageSquare,
} from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { formatLocalTime, formatFullDate, isRaceEvent } from "../dateUtils";

interface AsistenciaProps {
  events: TeamEvent[];
  attendance: AttendanceRecord[];
  currentUserProfile: UserProfile | null;
  isLoading: boolean;
  pilots: UserProfile[];
  dbReadOnly?: boolean;
}

export default function Asistencia({
  events,
  attendance,
  currentUserProfile,
  isLoading,
  pilots,
  dbReadOnly = false,
}: AsistenciaProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<"yes" | "no" | "maybe">("yes");
  const [comments, setComments] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [strategyText, setStrategyText] = useState("");
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | "yes" | "maybe" | "no" | "pending">("all");

  const activeEvents = events.filter((e) => e.status === "scheduled" && isRaceEvent(e));

  // Automatically select the first event if none is selected
  const activeEventId = selectedEventId || (activeEvents.length > 0 ? activeEvents[0].id : null);
  const currentEvent = activeEvents.find((e) => e.id === activeEventId);

  const handleSaveRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !activeEventId || dbReadOnly) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const docId = `${activeEventId}_${currentUserProfile.uid}`;
    const payload: AttendanceRecord = {
      id: docId,
      eventId: activeEventId,
      userId: currentUserProfile.uid,
      userName: currentUserProfile.displayName,
      userPhoto: currentUserProfile.photoURL || "",
      status: rsvpStatus,
      comments: comments,
      updatedAt: new Date().toISOString(),
    };

    const path = `attendance/${docId}`;
    try {
      await setDoc(doc(db, "attendance", docId), payload);
      setSaveSuccess(true);
      setComments("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const getMyRSVP = (evtId: string) => {
    if (!currentUserProfile) return null;
    return attendance.find(
      (a) => a.eventId === evtId && a.userId === currentUserProfile.uid
    );
  };

  const getEventRSVPs = (evtId: string) => {
    return attendance.filter((a) => a.eventId === evtId);
  };

  const handleSaveStrategy = async () => {
    if (!activeEventId || currentUserProfile?.role !== "admin" || dbReadOnly) return;
    setIsSavingStrategy(true);
    const path = `events/${activeEventId}`;
    try {
      await updateDoc(doc(db, "events", activeEventId), {
        strategyNotes: strategyText,
      });
      setIsEditingStrategy(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsSavingStrategy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          Disponibilidad y Asistencia Oficial
        </h2>
        <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
          Planificación de parrillas y turnos de resistencia (RSVP)
        </p>
      </div>

      {isLoading ? (
        <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
      ) : activeEvents.length === 0 ? (
        <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2 max-w-xl">
          <Clock className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-bold text-stone-400 font-mono">SIN SESIONES PROGRAMADAS</h3>
          <p className="text-stone-500 text-xs">
            No hay carreras ni prácticas oficiales planificadas para declarar asistencia en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: SELECT SESION / CALENDAR GP LIST */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-xs font-bold font-mono text-stone-400 uppercase tracking-widest pb-1 border-b border-stone-800/60 mb-2">
              SELECCIONE GP O SESIÓN
            </h3>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {activeEvents.map((ev) => {
                const isSelected = ev.id === activeEventId;
                const myResponse = getMyRSVP(ev.id);
                const confirmations = getEventRSVPs(ev.id).filter(a => a.status === "yes").length;

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      if (myResponse) {
                        setRsvpStatus(myResponse.status);
                        setComments(myResponse.comments || "");
                      } else {
                        setRsvpStatus("yes");
                        setComments("");
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? "bg-[#161d19] border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                        : "bg-[#111113]/90 hover:bg-stone-900 border-stone-800/80"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[7.5px] font-mono bg-stone-800 border border-stone-700 text-stone-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          {ev.type}
                        </span>
                        <h4 className="font-extrabold text-sm text-white tracking-tight mt-1.5">{ev.title}</h4>
                        <p className="text-[10px] text-stone-500 font-mono uppercase mt-0.5">{ev.track}</p>
                      </div>

                      {/* My status indicator */}
                      {myResponse && (
                        <div className={`p-1.5 rounded-full ${
                          myResponse.status === "yes"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50"
                            : myResponse.status === "no"
                            ? "bg-red-950/40 text-red-400 border border-red-900/50"
                            : "bg-amber-950/40 text-amber-500 border border-amber-900/50"
                        }`}>
                          {myResponse.status === "yes" && <Check className="w-3 h-3" />}
                          {myResponse.status === "no" && <X className="w-3 h-3" />}
                          {myResponse.status === "maybe" && <HelpCircle className="w-3 h-3" />}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-stone-800/50 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-stone-500">CONFIRMADOS:</span>
                      <span className="text-white bg-stone-900 px-1.5 py-0.5 rounded font-bold">
                        {confirmations} pilotos
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2 & 3: DETAILS, SUBMIT RSVP, AND WHO IS ATTENDING MATRIX */}
          {currentEvent && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Event Detailed Briefing & Submit RSVP */}
              <div className="bg-[#111113] border border-stone-800 rounded-xl p-5 md:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-stone-800/60 pb-3">
                  <div>
                    <span className="text-[8px] font-mono uppercase bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      SESIÓN SELECCIONADA • {currentEvent.type}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-1">{currentEvent.title}</h3>
                    <p className="text-stone-400 text-xs font-mono">{currentEvent.track} • {currentEvent.car}</p>
                  </div>

                  <div className="text-xs bg-stone-900 border border-stone-800 p-2 rounded-lg text-right font-mono">
                    <p className="text-[9px] text-stone-500 uppercase">Largada</p>
                    <p className="text-cyan-400 font-bold mt-0.5">
                      {formatFullDate(currentEvent.date)} • {formatLocalTime(currentEvent.date)}
                    </p>
                  </div>
                </div>

                {/* RSVP Declaration Form */}
                {currentUserProfile?.role === "postulante" ? (
                  <p className="text-amber-500 font-mono text-xs bg-amber-950/10 p-3 rounded-lg border border-amber-900/30">
                    ⚠️ Solo los Pilotos Oficiales homologados pueden declarar asistencia en las planificaciones de boxeo de temporada.
                  </p>
                ) : (
                  <form onSubmit={handleSaveRSVP} className="space-y-4">
                    <h4 className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">DECLARAR MI DISPONIBILIDAD</h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setRsvpStatus("yes")}
                        className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          rsvpStatus === "yes"
                            ? "bg-emerald-950/30 border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                            : "bg-stone-900/60 hover:bg-stone-900 border-stone-800 text-stone-400"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        Asistiré
                      </button>

                      <button
                        type="button"
                        onClick={() => setRsvpStatus("maybe")}
                        className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          rsvpStatus === "maybe"
                            ? "bg-amber-950/30 border-amber-400 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                            : "bg-stone-900/60 hover:bg-stone-900 border-stone-800 text-stone-400"
                        }`}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Es Duda / Tarde
                      </button>

                      <button
                        type="button"
                        onClick={() => setRsvpStatus("no")}
                        className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          rsvpStatus === "no"
                            ? "bg-red-950/30 border-red-400 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                            : "bg-stone-900/60 hover:bg-stone-900 border-stone-800 text-stone-400"
                        }`}
                      >
                        <X className="w-4 h-4" />
                        Ausente
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <label htmlFor="rsvp_comments" className="text-[9.51px] font-mono text-stone-400 uppercase tracking-widest">
                        Comentarios / Acotaciones / Turnos Grales (Opcional)
                      </label>
                      <input
                        id="rsvp_comments"
                        type="text"
                        placeholder="Ej: Solo puedo correr el primer stint de la carrera de resistencia"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full bg-[#18181b] border border-stone-800 rounded-lg p-3 text-xs text-stone-200 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {dbReadOnly && (
                      <p className="p-2 bg-amber-950/25 border border-amber-900/35 rounded-lg text-amber-400 text-[11px] font-mono flex items-center gap-2">
                        ⚠️ La base de datos está en modo de solo lectura. No puedes enviar confirmaciones de asistencia.
                      </p>
                    )}

                    {saveSuccess && (
                      <p className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-emerald-400 text-[11.51px] font-mono flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Respuesta RSVP registrada y sincronizada con éxito.
                      </p>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSaving || dbReadOnly}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all select-none cursor-pointer disabled:opacity-40"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {dbReadOnly ? "Solo Lectura" : isSaving ? "Guardando..." : "Guardar Disponibilidad"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Event Strategy / Planning Block */}
              <div className="bg-[#111113] border border-stone-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/60 pb-2">
                  <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                    ESTRATEGIA Y ORDEN DE PILOTOS
                  </h4>
                  {currentUserProfile?.role === "admin" && (
                    <button 
                      onClick={() => {
                        setIsEditingStrategy(!isEditingStrategy);
                        if (!isEditingStrategy) {
                          setStrategyText(currentEvent.strategyNotes || "");
                        }
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono tracking-wider flex items-center gap-1 uppercase"
                    >
                      <Edit3 className="w-3 h-3" />
                      {isEditingStrategy ? "Cancelar" : "Editar"}
                    </button>
                  )}
                </div>

                {isEditingStrategy ? (
                  <div className="space-y-3">
                    <textarea
                      value={strategyText}
                      onChange={(e) => setStrategyText(e.target.value)}
                      placeholder={"Ej: \nStint 1 -> Juan (Medios)\nStint 2 -> Pedro (Duros)\nNotas: Mantener ritmo constante, cuidar neumáticos."}
                      className="w-full h-32 bg-[#18181b] border border-stone-800 rounded-lg p-3 text-xs text-stone-300 focus:outline-none focus:border-cyan-400 font-mono resize-none leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveStrategy}
                        disabled={isSavingStrategy}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 select-none"
                      >
                        <Save className="w-3 h-3" />
                        {isSavingStrategy ? "Guardando..." : "Guardar Estrategia"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-900/40 p-4 rounded-lg min-h-[80px] border border-stone-800/50">
                    {currentEvent.strategyNotes ? (
                      <pre className="text-xs text-stone-300 font-mono whitespace-pre-wrap font-medium leading-relaxed">
                        {currentEvent.strategyNotes}
                      </pre>
                    ) : (
                      <p className="text-stone-500 text-xs font-mono text-center mt-3">
                        Aún no se ha definido el plan ni el orden para esta sesión.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Grid / List of RSVP Responses Grouped by Vehicle */}
              {(() => {
                const approvedPilots = pilots.filter(
                  (u) => (u.role === "piloto" || u.role === "admin") && u.status === "aprobado"
                );

                const eventRsvps = getEventRSVPs(currentEvent.id);

                const rosterAttendance = approvedPilots.map((p) => {
                  const rsvp = eventRsvps.find((r) => r.userId === p.uid);
                  return {
                    uid: p.uid,
                    userName: p.displayName,
                    userPhoto: p.photoURL || "",
                    raceNumber: p.raceNumber || "",
                    status: (rsvp?.status || "pending") as "yes" | "maybe" | "no" | "pending",
                    comments: rsvp?.comments || "",
                    updatedAt: rsvp?.updatedAt || "",
                  };
                });

                const totalCount = rosterAttendance.length;
                const yesCount = rosterAttendance.filter((r) => r.status === "yes").length;
                const maybeCount = rosterAttendance.filter((r) => r.status === "maybe").length;
                const noCount = rosterAttendance.filter((r) => r.status === "no").length;
                const pendingCount = rosterAttendance.filter((r) => r.status === "pending").length;

                // Group by Vehicle and Dorsals
                const ferrariList = rosterAttendance.filter(
                  (r) => r.raceNumber === "05" || r.raceNumber === "08"
                );
                const orecaList = rosterAttendance.filter(
                  (r) => r.raceNumber === "32" || r.raceNumber === "43"
                );
                const reserveList = rosterAttendance.filter(
                  (r) =>
                    r.raceNumber !== "05" &&
                    r.raceNumber !== "08" &&
                    r.raceNumber !== "32" &&
                    r.raceNumber !== "43"
                );

                const vehicleGroups = [
                  {
                    id: "lexus",
                    title: "Lexus RC F | GT3",
                    dorsals: ["05", "08"],
                    badgeColor: "border-red-800/40 text-red-400 bg-red-950/40",
                    headerBg: "border-red-900/40 bg-red-950/20 text-red-400",
                    pilots: ferrariList,
                  },
                  {
                    id: "oreca",
                    title: "Oreca 07 LMP2",
                    dorsals: ["32", "43"],
                    badgeColor: "border-fuchsia-800/40 text-fuchsia-400 bg-fuchsia-950/40",
                    headerBg: "border-fuchsia-900/40 bg-fuchsia-950/20 text-fuchsia-400",
                    pilots: orecaList,
                  },
                  {
                    id: "reserves",
                    title: "Pilotos de Reserva / Plantel Libre",
                    dorsals: [],
                    badgeColor: "border-stone-800 text-stone-400 bg-stone-900",
                    headerBg: "border-stone-800 bg-stone-900/60 text-stone-300",
                    pilots: reserveList,
                  },
                ];

                const filterPilot = (item: typeof rosterAttendance[0]) => {
                  if (statusFilter === "all") return true;
                  return item.status === statusFilter;
                };

                return (
                  <div className="bg-[#111113] border border-stone-800 rounded-xl p-4 sm:p-5 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                          Respuestas de Asistencia por Vehículo y Dorsal
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-0.5 rounded-full font-bold">
                        {yesCount}/{totalCount} Pilotos Confirmados
                      </span>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "all", label: "Todos", count: totalCount, badgeColor: "bg-stone-800 text-stone-300" },
                        { id: "yes", label: "Confirmados", count: yesCount, badgeColor: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" },
                        { id: "maybe", label: "Duda / Tarde", count: maybeCount, badgeColor: "bg-amber-950/60 text-amber-400 border border-amber-800/40" },
                        { id: "no", label: "Ausentes", count: noCount, badgeColor: "bg-red-950/60 text-red-400 border border-red-800/40" },
                        { id: "pending", label: "Sin Responder", count: pendingCount, badgeColor: "bg-stone-900 text-stone-400 border border-stone-800" },
                      ].map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isActive
                                ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                                : "bg-stone-900/60 text-stone-400 border border-stone-800/80 hover:bg-stone-900 hover:text-stone-300"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${tab.badgeColor}`}>
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Vehicles Breakdown */}
                    <div className="space-y-6 pt-1">
                      {vehicleGroups.map((group) => {
                        const groupFiltered = group.pilots.filter(filterPilot);
                        if (groupFiltered.length === 0 && statusFilter !== "all") {
                          return null;
                        }

                        const groupConfirmed = group.pilots.filter((p) => p.status === "yes").length;

                        // Create Dorsal Subgroups (3 pilots per dorsal standard)
                        const dorsalMap: { [key: string]: typeof rosterAttendance } = {};
                        
                        if (group.dorsals.length > 0) {
                          group.dorsals.forEach((d) => {
                            dorsalMap[d] = [];
                          });
                        }

                        group.pilots.forEach((p) => {
                          const key = p.raceNumber || "Sin Dorsal";
                          if (!dorsalMap[key]) {
                            dorsalMap[key] = [];
                          }
                          dorsalMap[key].push(p);
                        });

                        const dorsalKeys = Object.keys(dorsalMap);

                        return (
                          <div key={group.id} className="space-y-3 bg-[#0d0d0f] border border-stone-800/80 rounded-xl p-3.5 sm:p-4">
                            {/* Main Vehicle Header */}
                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono font-bold ${group.headerBg}`}>
                              <div className="flex items-center gap-2">
                                <span className="uppercase tracking-wider">{group.title}</span>
                              </div>
                              <span className="text-[10px] bg-black/50 px-2 py-0.5 rounded border border-white/10">
                                {groupConfirmed}/{group.pilots.length} Confirmados Total
                              </span>
                            </div>

                            {/* Subgroups by Dorsal (Trios de Pilotos) */}
                            {groupFiltered.length === 0 ? (
                              <p className="text-[11px] text-stone-500 font-mono italic px-2 py-2">
                                Sin pilotos con este filtro en este vehículo.
                              </p>
                            ) : (
                              <div className="space-y-4 pt-1">
                                {dorsalKeys.map((dorsalKey) => {
                                  const dorsalPilots = (dorsalMap[dorsalKey] || []).filter(filterPilot);
                                  if (dorsalPilots.length === 0 && statusFilter !== "all") {
                                    return null;
                                  }

                                  const dorsalConfirmed = (dorsalMap[dorsalKey] || []).filter((p) => p.status === "yes").length;
                                  const totalInDorsal = (dorsalMap[dorsalKey] || []).length;

                                  return (
                                    <div key={dorsalKey} className="bg-[#141416] border border-stone-800/70 rounded-xl p-3 space-y-2.5">
                                      {/* Dorsal Trio Title Header */}
                                      <div className="flex items-center justify-between border-b border-stone-800/60 pb-2 px-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                                            {dorsalKey === "Sin Dorsal" ? dorsalKey : `DORSAL #${dorsalKey}`}
                                          </span>
                                          <span className="text-[10px] font-mono text-stone-400">
                                            (Equipo de 3 Pilotos)
                                          </span>
                                        </div>
                                        <span className="text-[9.5px] font-mono text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-full">
                                          {dorsalConfirmed}/{totalInDorsal} Confirmados
                                        </span>
                                      </div>

                                      {/* Pilot Cards for this Dorsal Trio */}
                                      {dorsalPilots.length === 0 ? (
                                        <p className="text-[10px] text-stone-500 font-mono italic px-1 py-1">
                                          Sin pilotos en este dorsal con el filtro activo.
                                        </p>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                          {dorsalPilots.map((item) => (
                                            <div
                                              key={item.uid}
                                              className="bg-[#18181b] border border-stone-800/90 hover:border-stone-700/90 p-2.5 rounded-xl flex flex-col justify-between gap-2.5 transition-all shadow-sm"
                                            >
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                  {item.userPhoto ? (
                                                    <img
                                                      src={item.userPhoto}
                                                      alt={item.userName}
                                                      referrerPolicy="no-referrer"
                                                      className="w-7 h-7 rounded-full border border-stone-800 object-cover shrink-0"
                                                    />
                                                  ) : (
                                                    <div className="w-7 h-7 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-[10px] font-black text-cyan-400 shrink-0">
                                                      {item.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                  )}

                                                  <div className="min-w-0 flex-1">
                                                    <p className="font-extrabold text-white text-xs truncate" title={item.userName}>
                                                      {item.userName}
                                                    </p>
                                                    <span className="text-[9px] font-mono text-stone-400">
                                                      Dorsal #{item.raceNumber || "--"}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Attendance Badge */}
                                                <span
                                                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                                                    item.status === "yes"
                                                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                                                      : item.status === "no"
                                                      ? "bg-red-950/40 text-red-400 border-red-800/50"
                                                      : item.status === "maybe"
                                                      ? "bg-amber-950/40 text-amber-400 border-amber-800/50"
                                                      : "bg-stone-900/80 text-stone-500 border-stone-800"
                                                  }`}
                                                >
                                                  {item.status === "yes" && "Confirmado"}
                                                  {item.status === "maybe" && "Duda"}
                                                  {item.status === "no" && "Ausente"}
                                                  {item.status === "pending" && "Pendiente"}
                                                </span>
                                              </div>

                                              {/* Dedicated Space for Important Notes */}
                                              {item.comments ? (
                                                <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 text-[10.5px] text-amber-200/90 flex items-start gap-2 shadow-inner">
                                                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                                  <div className="min-w-0 flex-1 leading-snug">
                                                    <span className="font-mono text-[9px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                                                      Nota Importante:
                                                    </span>
                                                    <p className="whitespace-pre-wrap break-words">{item.comments}</p>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
