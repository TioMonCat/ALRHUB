import React, { useState } from "react";
import { TeamEvent, UserProfile, AttendanceRecord } from "../types";
import { Check, X, HelpCircle, Save, Clock, Users, Calendar, Sparkles, ClipboardList, Edit3 } from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";

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

  const activeEvents = events.filter((e) => e.status === "scheduled");

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
                      {new Date(currentEvent.date).toLocaleDateString()} {new Date(currentEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

              {/* Grid of RSVP Responses (Who is doing what) */}
              <div className="bg-[#111113] border border-stone-800 rounded-xl p-5 space-y-4">
                <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest border-b border-stone-800/60 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  RESPUESTAS REGISTRADAS DEL PLANTEL DE PILOTOS
                </h4>

                {getEventRSVPs(currentEvent.id).length === 0 ? (
                  <p className="text-center py-6 text-stone-500 font-mono text-xs">
                    Ningún piloto ha declarado asistencia todavía. ¡Sé el primero!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {getEventRSVPs(currentEvent.id)
                      .map((record) => {
                        const pilot = pilots.find((p) => p.uid === record.userId);
                        return {
                          ...record,
                          raceNumber: pilot?.raceNumber || "",
                        };
                      })
                      .sort((a, b) => {
                        const numA = parseInt(a.raceNumber, 10);
                        const numB = parseInt(b.raceNumber, 10);
                        const valA = isNaN(numA) ? 999 : numA;
                        const valB = isNaN(numB) ? 999 : numB;
                        if (valA === valB) {
                          return a.userName.localeCompare(b.userName);
                        }
                        return valA - valB;
                      })
                      .map((record) => (
                        <div
                          key={record.id}
                          className="bg-[#18181A] border border-stone-800/80 p-3 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {record.userPhoto ? (
                              <img src={record.userPhoto} alt={record.userName} className="w-6.5 h-6.5 rounded-full border border-stone-800" />
                            ) : (
                              <div className="w-6.5 h-6.5 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-[10px] font-black text-white">
                                {record.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-extrabold px-1 py-0.5 rounded leading-none shrink-0 border ${
                                  record.raceNumber === "32" || record.raceNumber === "43"
                                    ? "bg-amber-950/30 text-amber-400 border-amber-500/20"
                                    : "bg-[#1d1f27] text-cyan-400 border border-cyan-500/20"
                                }`} title="Dorsal">
                                  #{record.raceNumber || "—"}
                                </span>
                                <p className="font-extrabold text-white text-xs truncate max-w-[120px]">{record.userName}</p>
                              </div>
                              {record.comments && (
                                <p className="text-[9.5px] text-stone-400 italic truncate mt-0.5 max-w-[150px]" title={record.comments}>
                                  "{record.comments}"
                                </p>
                              )}
                            </div>
                          </div>

                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded border shadow-inner ${
                          record.status === "yes"
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                            : record.status === "no"
                            ? "bg-red-950/20 text-red-000 text-red-400 border-red-900/30"
                            : "bg-amber-950/20 text-amber-500 border-amber-900/30"
                        }`}>
                          {record.status === "yes" && "Confirmado"}
                          {record.status === "maybe" && "Duda"}
                          {record.status === "no" && "Ausente"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
