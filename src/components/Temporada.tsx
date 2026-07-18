import React, { useState } from "react";
import { TeamEvent, UserProfile } from "../types";
import { Plus, Trash, Award, Calendar, CheckSquare, Clock, MapPin, Trophy, Star, Edit3 } from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

interface TemporadaProps {
  events: TeamEvent[];
  currentUserProfile: UserProfile | null;
  isLoading: boolean;
  pilots: UserProfile[];
  dbReadOnly?: boolean;
}

export default function Temporada({
  events,
  currentUserProfile,
  isLoading,
  pilots,
  dbReadOnly = false,
}: TemporadaProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [track, setTrack] = useState("");
  const [car, setCar] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<TeamEvent["type"]>("Sprint");
  const [description, setDescription] = useState("");
  const [pinnable, setPinnable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results registration and edit
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingStrategyNotes, setEditingStrategyNotes] = useState("");
  const [resultsRows, setResultsRows] = useState<Array<{
    position: string;
    points: number;
    category: "GT3" | "LMP2";
  }>>([]);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const isAdmin = currentUserProfile?.role === "admin";

  const handleCreateGeneralTraining = async () => {
    if (!isAdmin || dbReadOnly) return;
    setIsSubmitting(true);
    const newEvent: Omit<TeamEvent, "id"> = {
      title: "Entrenamiento Libre Oficial",
      track: "Circuito a Definir",
      car: "Multiclase / Abierto",
      date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
      type: "Entrenamiento",
      description: "Entrenamiento libre general. Abierto a todos los pilotos para practicar o ajustar setups.",
      status: "scheduled",
      results: [],
      pinnable: false,
      createdAt: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, "events"), newEvent);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "events");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || dbReadOnly) return;
    setIsSubmitting(true);

    const newEvent: Omit<TeamEvent, "id"> = {
      title,
      track,
      car,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      type,
      description,
      status: "scheduled",
      results: [],
      pinnable,
      createdAt: new Date().toISOString(),
    };

    const path = "events";
    try {
      await addDoc(collection(db, path), newEvent);
      setTitle("");
      setTrack("");
      setCar("");
      setDate("");
      setType("Sprint");
      setDescription("");
      setPinnable(false);
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!isAdmin || dbReadOnly) return;

    const path = `events/${id}`;
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleOpenResultsForm = (ev: TeamEvent) => {
    setRegisteringEventId(ev.id);
    setResultsRows([
      {
        position: "1",
        points: 25,
        category: "GT3",
      },
    ]);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEventId || !isAdmin || dbReadOnly) return;

    const sortedResults = [...resultsRows].sort((a, b) => {
      const numA = parseInt(a.position, 10);
      const numB = parseInt(b.position, 10);
      const isNumA = !isNaN(numA);
      const isNumB = !isNaN(numB);

      if (isNumA && isNumB) {
        return numA - numB;
      }
      if (isNumA && !isNumB) return -1;
      if (!isNumA && isNumB) return 1;

      return a.position.localeCompare(b.position);
    });

    const path = `events/${registeringEventId}`;
    try {
      await updateDoc(doc(db, "events", registeringEventId), {
        status: "completed",
        results: sortedResults,
      });
      setRegisteringEventId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const addResultRow = () => {
    setResultsRows([
      ...resultsRows,
      {
        position: String(resultsRows.length + 1),
        points: 0,
        category: "GT3",
      },
    ]);
  };

  const removeResultRow = (idx: number) => {
    setResultsRows(resultsRows.filter((_, i) => i !== idx));
  };

  const updateRowField = (idx: number, field: string, val: any) => {
    setResultsRows(
      resultsRows.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleStartEdit = (ev: TeamEvent) => {
    setRegisteringEventId(null);
    setShowAddForm(false);
    
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setTrack(ev.track);
    setCar(ev.car);
    if (ev.date) {
      try {
        const d = new Date(ev.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      } catch (e) {
        setDate("");
      }
    } else {
      setDate("");
    }
    setType(ev.type);
    setDescription(ev.description || "");
    setPinnable(ev.pinnable || false);
    
    if (ev.status === "completed") {
      setEditingStrategyNotes(ev.strategyNotes || "");
      setResultsRows(
        (ev.results || []).map(r => ({
          position: r.position || "1",
          points: r.points || 0,
          category: (r.category || "GT3") as "GT3" | "LMP2"
        }))
      );
    } else {
      setEditingStrategyNotes("");
      setResultsRows([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditingStrategyNotes("");
    setResultsRows([]);
    setTitle("");
    setTrack("");
    setCar("");
    setDate("");
    setType("Sprint");
    setDescription("");
    setPinnable(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId || !isAdmin || dbReadOnly) return;
    setIsSubmitting(true);

    const path = `events/${editingEventId}`;
    try {
      const eventRef = doc(db, "events", editingEventId);
      
      const originalEvent = events.find(ev => ev.id === editingEventId);
      const isCompleted = originalEvent?.status === "completed";

      const updatedFields: Partial<TeamEvent> = {
        title,
        track,
        car,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        type,
        description,
        pinnable,
      };

      if (isCompleted) {
        const sortedResults = [...resultsRows].sort((a, b) => {
          const numA = parseInt(a.position, 10);
          const numB = parseInt(b.position, 10);
          const isNumA = !isNaN(numA);
          const isNumB = !isNaN(numB);

          if (isNumA && isNumB) return numA - numB;
          if (isNumA && !isNumB) return -1;
          if (!isNumA && isNumB) return 1;
          return a.position.localeCompare(b.position);
        });

        updatedFields.strategyNotes = editingStrategyNotes;
        updatedFields.results = sortedResults;
      }

      await updateDoc(eventRef, updatedFields);

      setEditingEventId(null);
      setEditingStrategyNotes("");
      setResultsRows([]);
      
      setTitle("");
      setTrack("");
      setCar("");
      setDate("");
      setType("Sprint");
      setDescription("");
      setPinnable(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort events: Scheduled events first (ordered by nearest date), then Completed events (ordered by latest completed)
  const scheduledEvents = events
    .filter((e) => e.status === "scheduled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dbCompletedEvents = events
    .filter((e) => e.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const completedEvents = dbCompletedEvents;
  const visibleCompletedEvents = showAllCompleted ? completedEvents : completedEvents.slice(0, 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Calendario de Temporada y Campeonato
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Fechas oficiales, clasificaciones del campeonato e historial de podios
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={handleCreateGeneralTraining}
              disabled={isSubmitting || dbReadOnly}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Entrenamiento Libre
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setRegisteringEventId(null);
              }}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              {showAddForm ? "Cancelar" : "Programar Carrera"}
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add event form */}
      {showAddForm && isAdmin && (
        <form onSubmit={handleCreateEvent} className="bg-[#111113] border border-stone-800 p-5 rounded-xl space-y-4 max-w-3xl">
          <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-widest">
            Ficha para Programar un Evento Competitivo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Título de la Carrera / Sesión *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 6 Horas de Spa-Francorchamps"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Tipo Evento *
              </label>
              <select
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={type}
                onChange={(e) => setType(e.target.value as TeamEvent["type"])}
              >
                <option value="Sprint">Carrera Sprint (Corta)</option>
                <option value="Resistencia">Carrera de Resistencia (Endurance)</option>
                <option value="Entrenamiento">Entrenamiento Oficial</option>
                <option value="Carrera de Club">Carrera de Club / Fun Race</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Pista / Circuito *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Circuit de la Sarthe, Spa"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Coche / Categoría Autorizada *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ferrari 499P (Hypercar)"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={car}
                onChange={(e) => setCar(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Fecha y Hora de la Sesión *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              Breve Descripción / Detalles del Servidor (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre temperatura de pista, contraseñas, condiciones meteorológicas..."
              className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="pinnable"
              checked={pinnable}
              onChange={(e) => setPinnable(e.target.checked)}
              className="accent-cyan-500 w-4 h-4"
            />
            <label htmlFor="pinnable" className="text-xs text-stone-300 font-mono">
              Marcar como carrera principal o próxima a correr
            </label>
          </div>

          {dbReadOnly && (
            <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 text-amber-400 rounded-lg text-[11px] font-mono leading-relaxed">
              ⚠️ La base de datos está en modo de solo lectura. No puedes programar eventos en este momento.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || dbReadOnly}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
          >
            {dbReadOnly ? "Solo Lectura" : isSubmitting ? "Guardando..." : "Programar GP"}
          </button>
        </form>
      )}

      {/* Results Registration Form */}
      {registeringEventId && isAdmin && (
        <form onSubmit={handleSaveResults} className="bg-[#111113] border border-emerald-500/30 p-5 rounded-xl space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              REGISTRAR RESULTADOS DE CARRERA
            </h3>
            <button
              type="button"
              onClick={() => setRegisteringEventId(null)}
              className="text-stone-500 hover:text-white text-xs font-mono font-bold cursor-pointer"
            >
              Cerrar Formulario
            </button>
          </div>

          <div className="space-y-2.5 border-y border-stone-800 py-4 max-h-[450px] overflow-y-auto">
            {/* Header labels for Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-3 text-[10px] font-mono text-stone-500 uppercase tracking-widest px-2 pb-2 border-b border-stone-800/60 font-bold">
              <div className="col-span-3 text-center">Posición</div>
              <div className="col-span-5 text-center">Categoría</div>
              <div className="col-span-3 text-center">Pts Ganados</div>
              <div className="col-span-1 text-center font-bold"></div>
            </div>

            {resultsRows.map((row, idx) => (
              <div key={idx} className="relative grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-stone-900/20 md:bg-transparent p-4 md:p-0 rounded-lg md:rounded-none border border-stone-800/40 md:border-none">
                {/* POS */}
                <div className="col-span-3">
                  <label className="block md:hidden text-[9px] text-stone-500 font-mono mb-1">POSICIÓN (Nº o Letras, ej: 1, DNF, DSQ)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1, DNF, DSQ..."
                    className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                    value={row.position}
                    onChange={(e) => updateRowField(idx, "position", e.target.value)}
                  />
                </div>

                {/* CATEGORY */}
                <div className="col-span-5">
                  <label className="block md:hidden text-[9px] text-stone-500 font-mono mb-1">CATEGORÍA</label>
                  <select
                    required
                    className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-stone-300 font-mono focus:outline-none focus:border-emerald-500"
                    value={row.category || "GT3"}
                    onChange={(e) => updateRowField(idx, "category", e.target.value as "GT3" | "LMP2")}
                  >
                    <option value="GT3">🏎️ GT3</option>
                    <option value="LMP2">🚀 LMP2</option>
                  </select>
                </div>

                {/* POINTS */}
                <div className="col-span-3">
                  <label className="block md:hidden text-[9px] text-stone-500 font-mono mb-1">PUNTOS</label>
                  <input
                    type="number"
                    required
                    placeholder="Pts"
                    className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                    value={row.points}
                    onChange={(e) => updateRowField(idx, "points", Number(e.target.value))}
                  />
                </div>

                {/* DELETE BUTTON */}
                <div className="absolute top-4 right-4 md:relative md:top-auto md:right-auto col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeResultRow(idx)}
                    className="text-stone-500 hover:text-red-400 text-xs font-bold p-1 bg-stone-900 md:bg-transparent rounded border border-stone-850 md:border-none cursor-pointer"
                    title="Eliminar fila"
                  >
                    <Trash className="w-3.5 h-3.5 md:hidden mx-auto" />
                    <span className="hidden md:inline">✕</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-between items-center">
            <button
              type="button"
              onClick={addResultRow}
              className="px-3.5 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 bg-stone-900 text-stone-300 text-xs font-mono uppercase cursor-pointer"
            >
              + Añadir Categoría
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Archivar Resultados y Completar Carrera
            </button>
          </div>
        </form>
      )}

      {/* Edit Event Form */}
      {editingEventId && isAdmin && (
        <form onSubmit={handleSaveEdit} className="bg-[#111113] border border-cyan-500/30 p-5 rounded-xl space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              MODIFICAR CARRERA O EVENTO
            </h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-stone-500 hover:text-white text-xs font-mono font-bold cursor-pointer"
            >
              ✕ CANCELAR
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Título de la Carrera / Sesión *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 6 Horas de Spa-Francorchamps"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Tipo Evento *
              </label>
              <select
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={type}
                onChange={(e) => setType(e.target.value as TeamEvent["type"])}
              >
                <option value="Sprint">Carrera Sprint (Corta)</option>
                <option value="Resistencia">Carrera de Resistencia (Endurance)</option>
                <option value="Entrenamiento">Entrenamiento Oficial</option>
                <option value="Carrera de Club">Carrera de Club / Fun Race</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Pista / Circuito *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Circuit de la Sarthe, Spa"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Coche / Categoría Autorizada *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ferrari 499P (Hypercar)"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={car}
                onChange={(e) => setCar(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Fecha y Hora de la Sesión *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              Breve Descripción / Detalles del Servidor (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre temperatura de pista, contraseñas, condiciones meteorológicas..."
              className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="edit-pinnable"
              checked={pinnable}
              onChange={(e) => setPinnable(e.target.checked)}
              className="accent-cyan-500 w-4 h-4"
            />
            <label htmlFor="edit-pinnable" className="text-xs text-stone-200 font-mono">
              Marcar como carrera principal o próxima a correr
            </label>
          </div>

          {/* Results Editor inside the edit form if event is completed */}
          {resultsRows.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                  Resultados de Carrera (Por Categoría)
                </h4>
                <button
                  type="button"
                  onClick={addResultRow}
                  className="text-[10px] font-mono bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  + AGREGAR FILA
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {/* Headers */}
                <div className="hidden md:grid grid-cols-12 gap-3 text-[9px] font-mono text-stone-500 uppercase tracking-widest px-2 pb-1 border-b border-stone-800/60 font-bold">
                  <div className="col-span-3 text-center">Posición</div>
                  <div className="col-span-5 text-center">Categoría</div>
                  <div className="col-span-3 text-center">Pts Ganados</div>
                  <div className="col-span-1 text-center font-bold"></div>
                </div>

                {resultsRows.map((row, idx) => (
                  <div key={idx} className="relative grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-stone-900/10 md:bg-transparent p-3 md:p-0 rounded border border-stone-800/40 md:border-none">
                    <div className="col-span-3">
                      <label className="block md:hidden text-[9px] text-stone-500 font-mono mb-1">POSICIÓN</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1, DNF"
                        className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                        value={row.position}
                        onChange={(e) => updateRowField(idx, "position", e.target.value)}
                      />
                    </div>

                    <div className="col-span-5">
                      <label className="block md:hidden text-[9px] text-stone-500 font-mono mb-1">CATEGORÍA</label>
                      <select
                        required
                        className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-stone-300 font-mono focus:outline-none focus:border-cyan-400"
                        value={row.category || "GT3"}
                        onChange={(e) => updateRowField(idx, "category", e.target.value as "GT3" | "LMP2")}
                      >
                        <option value="GT3">🏎️ GT3</option>
                        <option value="LMP2">🚀 LMP2</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block md:hidden text-[9px] text-stone-500 font-mono mb-1">PUNTOS</label>
                      <input
                        type="number"
                        required
                        placeholder="Pts"
                        className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                        value={row.points}
                        onChange={(e) => updateRowField(idx, "points", Number(e.target.value))}
                      />
                    </div>

                    <div className="absolute top-3 right-3 md:relative md:top-auto md:right-auto col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeResultRow(idx)}
                        className="text-stone-500 hover:text-red-400 text-xs font-bold p-1 bg-stone-900 md:bg-transparent rounded border border-stone-850 md:border-none cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Notas de Estrategia / Incidencias (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles del podio, incidentes o penalizaciones aplicadas..."
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-mono"
                  value={editingStrategyNotes}
                  onChange={(e) => setEditingStrategyNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-stone-800/80">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? "Sincronizando..." : "Guardar Cambios"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-stone-850 hover:bg-stone-800 text-stone-400 border border-stone-800 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Events Listings and Standings split views */}
      {isLoading ? (
        <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: SCHEDULED EVENTS CALENDAR */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-widest font-mono uppercase border-b border-stone-800/80 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              PRÓXIMOS EVENTOS DE TEMPORADA
            </h3>

            {scheduledEvents.length === 0 ? (
              <div className="bg-[#111113]/40 border border-stone-800 border-dashed p-8 rounded-xl text-center">
                <Clock className="w-6 h-6 text-stone-600 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-bold font-mono">SIN CARRERAS PLANIFICADAS</p>
                <p className="text-[10px] text-stone-500/80 mt-1">Vuelve más tarde para el próximo comunicado de boxes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledEvents.map((ev) => (
                  <div key={ev.id} className="bg-[#111113]/90 border border-stone-800/85 rounded-xl p-4.5 space-y-3 shadow-inner hover:border-stone-700 transition-all relative">
                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-1.5 select-none text-[8px] items-center">
                        <button
                          onClick={() => !dbReadOnly && handleOpenResultsForm(ev)}
                          disabled={dbReadOnly}
                          className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 hover:bg-[#10B981]/20 px-2 py-1 rounded font-bold font-mono uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={dbReadOnly ? "Modo solo lectura" : "Cargar Podio"}
                        >
                          Cargar Podio
                        </button>
                        <button
                          onClick={() => !dbReadOnly && handleStartEdit(ev)}
                          disabled={dbReadOnly}
                          className="bg-stone-900 text-stone-400 hover:text-[#06B6D4] border border-stone-800 hover:border-[#0891B2]/30 p-1.5 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={dbReadOnly ? "Modo solo lectura" : "Editar evento"}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => !dbReadOnly && handleDeleteEvent(ev.id)}
                          disabled={dbReadOnly}
                          className="bg-stone-900 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-950/40 p-1.5 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={dbReadOnly ? "Modo solo lectura" : "Eliminar evento"}
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700/50 px-2 py-0.5 rounded-full">
                        {ev.type}
                      </span>
                      <h4 className="font-bold text-white text-base tracking-tight pt-1">{ev.title}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono py-1">
                      <div className="flex items-center gap-1.5 text-stone-400">
                        <MapPin className="w-3.5 h-3.5 text-stone-500" />
                        <span className="truncate">{ev.track}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-400">
                        <Trophy className="w-3.5 h-3.5 text-stone-500" />
                        <span className="truncate">{ev.car}</span>
                      </div>
                    </div>

                    {ev.description && (
                      <p className="text-[11px] text-stone-400 bg-stone-950/40 p-2.5 rounded border border-stone-900/60 leading-normal font-sans">
                        {ev.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 font-mono">FECHA DE LARGADA:</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-cyan-400 font-bold font-mono bg-cyan-950/15 px-2 py-0.5 rounded border border-cyan-900/30">
                          {(() => {
                            try {
                              return new Date(ev.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                            } catch (e) {
                              return ev.date;
                            }
                          })()}
                        </span>
                        <span className="text-[9px] text-[#88888C] font-mono tracking-wider uppercase scale-90 origin-right">
                          {(() => {
                            try {
                              const formatter = new Intl.DateTimeFormat([], { timeZoneName: "short" });
                              const parts = formatter.formatToParts(new Date(ev.date));
                              const tzPart = parts.find(p => p.type === "timeZoneName");
                              return tzPart ? `Zona: ${tzPart.value}` : "Hora Local";
                            } catch (e) {
                              return "Hora Local";
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: COMPLETED EVENTS RESULTS */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-widest font-mono uppercase border-b border-stone-800/80 pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              RESULTADOS DEL CAMPEONATO
            </h3>

            {completedEvents.length === 0 ? (
              <div className="bg-[#111113]/40 border border-stone-800 border-dashed p-8 rounded-xl text-center">
                <Trophy className="w-6 h-6 text-stone-600 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-bold font-mono">SIN HISTORIAL ARCHIVADO</p>
                <p className="text-[10px] text-stone-500/80 mt-1">Los resultados se archivan en cuanto concluyen las carreras oficiales.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleCompletedEvents.map((ev) => (
                  <div key={ev.id} className="bg-[#111113] border border-stone-800 rounded-xl p-4.5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[8px] font-mono font-bold uppercase bg-stone-800 text-stone-400 border border-stone-700/60 px-2 py-0.5 rounded-full">
                          {ev.type} • CONCLUIDO
                        </span>
                        <h4 className="font-bold text-white text-base tracking-tight pt-1">{ev.title}</h4>
                        <p className="text-[10px] text-stone-500 font-mono uppercase mt-0.5">{ev.track} • {ev.car}</p>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-1.5 items-center">
                          <button
                            onClick={() => !dbReadOnly && handleStartEdit(ev)}
                            disabled={dbReadOnly}
                            className="bg-stone-900 text-stone-400 hover:text-[#06B6D4] border border-stone-800 hover:border-[#0891B2]/30 p-1.5 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={dbReadOnly ? "Modo solo lectura" : "Editar carrera y resultados"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => !dbReadOnly && handleDeleteEvent(ev.id)}
                            disabled={dbReadOnly}
                            className="bg-stone-900 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-950/40 p-1.5 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={dbReadOnly ? "Modo solo lectura" : "Eliminar evento"}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Results classification chart table */}
                    <div className="bg-[#0D0D0F] border border-stone-800/60 rounded-lg overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs min-w-[280px]">
                        <thead>
                          <tr className="bg-stone-900/60 text-stone-500 font-mono text-[9px] uppercase tracking-wider border-b border-stone-800/60 font-bold">
                            <th className="py-2.5 px-3 text-center w-14">Posición</th>
                            <th className="py-2.5 px-3 text-center w-24">Categoría</th>
                            <th className="py-2.5 px-3 text-right pr-6">Pts Ganados</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/40">
                          {ev.results?.map((res, index) => (
                            <tr key={index} className="hover:bg-stone-900/20 font-mono text-stone-300">
                              <td className="py-2.5 px-3 text-center text-[11px]">
                                {(() => {
                                  const numericPos = parseInt(res.position, 10);
                                  if (numericPos === 1) {
                                    return (
                                      <span className="inline-flex h-5 w-5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 items-center justify-center font-bold text-[10px]">
                                        P1
                                      </span>
                                    );
                                  } else if (numericPos === 2) {
                                    return (
                                      <span className="inline-flex h-5 w-5 rounded bg-stone-300/10 text-stone-300 border border-stone-300/20 items-center justify-center font-bold text-[10px]">
                                        P2
                                      </span>
                                    );
                                  } else if (numericPos === 3) {
                                    return (
                                      <span className="inline-flex h-5 w-5 rounded bg-amber-700/10 text-amber-600 border border-amber-700/20 items-center justify-center font-bold text-[10px]">
                                        P3
                                      </span>
                                    );
                                  } else if (isNaN(numericPos)) {
                                    return (
                                      <span className="inline-flex px-1.5 py-0.5 rounded bg-red-950/30 text-red-500 border border-red-500/10 font-bold text-[9px] uppercase tracking-wider font-mono">
                                        {res.position || "—"}
                                      </span>
                                    );
                                  } else {
                                    return res.position;
                                  }
                                })()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {res.category === "LMP2" ? (
                                  <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-500/25 font-mono">
                                    LMP2
                                  </span>
                                ) : (
                                  <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 font-mono">
                                    GT3
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right pr-6 font-black text-emerald-400 font-mono">+{res.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {ev.strategyNotes && (
                      <div className="mt-4 pt-4 border-t border-stone-800/60 text-xs">
                        <p className="text-[10px] text-stone-500 font-mono uppercase mb-2 tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3 h-3 text-cyan-400" />
                          Notas de Estrategia
                        </p>
                        <pre className="text-[11px] text-stone-400 font-mono whitespace-pre-wrap leading-relaxed bg-[#18181B] p-3 rounded-lg border border-stone-800/50 max-h-32 overflow-y-auto">
                          {ev.strategyNotes}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}

                {completedEvents.length > 1 && (
                  <button
                    onClick={() => setShowAllCompleted(!showAllCompleted)}
                    className="w-full text-center p-3 border border-stone-800 border-dashed rounded-xl text-stone-400 hover:text-white hover:border-stone-600 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {showAllCompleted ? "Ocultar Anteriores" : `Ver ${completedEvents.length - 1} Carreras Anteriores`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
