import React, { useState } from "react";
import { NewsItem, UserProfile, Poll } from "../types";
import { 
  Plus, 
  Trash, 
  AlertTriangle, 
  FileText, 
  BarChart3, 
  Check, 
  Users, 
  Lock, 
  Unlock, 
  Clock, 
  RefreshCw, 
  MessageSquare, 
  CheckSquare, 
  Square, 
  ListFilter, 
  ShieldAlert,
  ChevronRight,
  Shield,
  HelpCircle,
  Eye
} from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { collection, addDoc, deleteDoc, doc, updateDoc, deleteField } from "firebase/firestore";

interface NoticiasProps {
  news: NewsItem[];
  polls?: Poll[];
  currentUserProfile: UserProfile | null;
  isLoading: boolean;
  dbReadOnly?: boolean;
}

// Helper to determine pilot category
function getUserCategory(profile: UserProfile | null): "GT3" | "LMP2" | "Reserva" | "Postulante" | "Invitado" {
  if (!profile) return "Invitado";
  if (profile.role === "postulante") return "Postulante";
  if (profile.role === "admin") return "GT3"; // Admin defaults to allow class representation, or handles override
  
  const raceNumber = profile.raceNumber;
  if (raceNumber === "05" || raceNumber === "08") {
    return "GT3";
  } else if (raceNumber === "32" || raceNumber === "43") {
    return "LMP2";
  } else {
    return "Reserva";
  }
}

// Helper to validate eligibility
function checkEligibility(poll: Poll, profile: UserProfile | null): { eligible: boolean; reason: string } {
  if (!profile) {
    return { eligible: false, reason: "Inicia sesión para votar" };
  }
  
  // Admins always have access to vote/see
  if (profile.role === "admin") {
    return { eligible: true, reason: "" };
  }

  // Check roles
  if (poll.allowedRoles && poll.allowedRoles.length > 0) {
    if (!poll.allowedRoles.includes(profile.role)) {
      const displayRoles = poll.allowedRoles.map((r) => {
        if (r === "piloto") return "Pilotos";
        if (r === "postulante") return "Postulantes";
        if (r === "admin") return "Admins";
        return r;
      });
      return { 
        eligible: false, 
        reason: `Exclusivo para: ${displayRoles.join(", ")}` 
      };
    }
  }

  // Check simulators
  if (poll.allowedSimulators && poll.allowedSimulators.length > 0) {
    const userGame = profile.preferredGame || "";
    if (userGame !== "Ambos") {
      const hasSim = poll.allowedSimulators.some(sim => sim === userGame || sim === "Ambos");
      if (!hasSim && poll.allowedSimulators.length > 0) {
        return { 
          eligible: false, 
          reason: `Exclusivo para pilotos de: ${poll.allowedSimulators.join(" / ")}` 
        };
      }
    }
  }

  // Check driver class
  if (poll.allowedClasses && poll.allowedClasses.length > 0) {
    const userClass = getUserCategory(profile);
    if (!poll.allowedClasses.includes(userClass)) {
      const displayClasses = poll.allowedClasses.map(c => {
        if (c === "GT3") return "GT3 (Ferrari)";
        if (c === "LMP2") return "LMP2 (Oreca)";
        return c;
      });
      return { 
        eligible: false, 
        reason: `Exclusivo para categoría: ${displayClasses.join(", ")}` 
      };
    }
  }

  return { eligible: true, reason: "" };
}

export default function Noticias({
  news,
  polls = [],
  currentUserProfile,
  isLoading,
  dbReadOnly = false,
}: NoticiasProps) {
  // Announcements form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsItem["category"]>("Comunicado");
  const [pinnable, setPinnable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Polls form state
  const [showAddPollForm, setShowAddPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollType, setPollType] = useState<"single" | "multiple" | "text">("single");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // Segmentations / Targeting state
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetSimulators, setTargetSimulators] = useState<string[]>([]);
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  const isAdmin = currentUserProfile?.role === "admin";

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentUserProfile || dbReadOnly) return;
    setIsSubmitting(true);

    const newBulletin: Omit<NewsItem, "id"> = {
      title,
      content,
      category,
      pinnable,
      date: new Date().toISOString(),
      author: currentUserProfile.displayName,
      authorPhoto: currentUserProfile.photoURL,
    };

    const path = "news";
    try {
      await addDoc(collection(db, path), newBulletin);
      setTitle("");
      setContent("");
      setPinnable(false);
      setCategory("Comunicado");
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!isAdmin || dbReadOnly) return;

    const path = `news/${id}`;
    try {
      await deleteDoc(doc(db, "news", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentUserProfile || dbReadOnly) return;

    let validOptions: string[] = [];
    if (pollType !== "text") {
      validOptions = pollOptions.map((opt) => opt.trim()).filter((opt) => opt !== "");
      if (validOptions.length < 2) {
        alert("Por favor ingresa al menos 2 opciones de respuesta válidas.");
        return;
      }
    }

    setIsSubmittingPoll(true);
    const path = "polls";
    try {
      await addDoc(collection(db, "polls"), {
        question: pollQuestion.trim(),
        description: pollDescription.trim(),
        type: pollType,
        options: pollType !== "text" ? validOptions : [],
        votes: {},
        allowedRoles: targetRoles,
        allowedSimulators: targetSimulators,
        allowedClasses: targetClasses,
        createdAt: new Date().toISOString(),
        creatorId: currentUserProfile.uid,
        creatorName: currentUserProfile.displayName,
        isClosed: false,
      });
      
      // Reset form
      setPollQuestion("");
      setPollDescription("");
      setPollType("single");
      setPollOptions(["", ""]);
      setTargetRoles([]);
      setTargetSimulators([]);
      setTargetClasses([]);
      setShowAddPollForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleVote = async (pollId: string, voteValue: any) => {
    if (!currentUserProfile || dbReadOnly) return;
    const path = `polls/${pollId}`;
    try {
      await updateDoc(doc(db, "polls", pollId), {
        [`votes.${currentUserProfile.uid}`]: voteValue,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteVote = async (pollId: string) => {
    if (!currentUserProfile || dbReadOnly) return;
    const path = `polls/${pollId}`;
    try {
      await updateDoc(doc(db, "polls", pollId), {
        [`votes.${currentUserProfile.uid}`]: deleteField(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleTogglePollClosed = async (pollId: string, currentStatus: boolean) => {
    if (!isAdmin || dbReadOnly) return;
    const path = `polls/${pollId}`;
    try {
      await updateDoc(doc(db, "polls", pollId), {
        isClosed: !currentStatus,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!isAdmin || dbReadOnly) return;
    const path = `polls/${pollId}`;
    try {
      await deleteDoc(doc(db, "polls", pollId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const getCategoryColor = (cat: NewsItem["category"]) => {
    switch (cat) {
      case "Comunicado":
        return "bg-cyan-950/40 text-cyan-400 border border-cyan-900/40";
      case "Carreras":
        return "bg-rose-950/40 text-rose-400 border border-rose-900/40";
      case "Técnico":
        return "bg-amber-950/40 text-amber-400 border border-amber-900/40";
      case "Anuncio":
        return "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40";
      default:
        return "bg-stone-900 text-stone-400 border border-stone-800";
    }
  };

  // Toggles for targeting filters
  const toggleRoleFilter = (role: string) => {
    setTargetRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleSimFilter = (sim: string) => {
    setTargetSimulators(prev => 
      prev.includes(sim) ? prev.filter(s => s !== sim) : [...prev, sim]
    );
  };

  const toggleClassFilter = (cls: string) => {
    setTargetClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Noticias y Anuncios
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Comunicados de boxes • Paddock Informativo ALR
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowAddPollForm(false);
              }}
              className="flex items-center gap-1.5 bg-[#18181B] hover:bg-stone-800 text-cyan-400 border border-cyan-900/45 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              id="btn_publish_announcement"
            >
              {showAddForm ? "Cancelar" : "Publicar Anuncio"}
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowAddPollForm(!showAddPollForm);
                setShowAddForm(false);
              }}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-600/10"
              id="btn_create_poll"
            >
              {showAddPollForm ? "Cancelar" : "Crear Encuesta"}
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add News Form */}
      {showAddForm && isAdmin && (
        <form onSubmit={handleCreateNews} className="bg-[#111113] border border-stone-800 p-5 rounded-xl space-y-4 max-w-2xl" id="news_form">
          <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-widest">
            NUEVA PUBLICACIÓN EN BOXES
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Título del Comunicado *
              </label>
              <input
                type="text"
                required
                placeholder="Título impactante..."
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Categoría *
              </label>
              <select
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsItem["category"])}
              >
                <option value="Comunicado">Comunicado (General)</option>
                <option value="Carreras">Carreras (Eventos / GP)</option>
                <option value="Técnico">Técnico (Ingeniería / Setups)</option>
                <option value="Anuncio">Anuncio (Reglamento / Admin)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              Contenido del Mensaje (Markdown o Texto Plano) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detalles del anuncio para los pilotos..."
              className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-sans"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinnable"
              checked={pinnable}
              onChange={(e) => setPinnable(e.target.checked)}
              className="rounded bg-[#18181B] border-stone-800 text-cyan-400 focus:ring-0"
            />
            <label htmlFor="pinnable" className="text-xs text-stone-400 font-mono cursor-pointer selection:bg-transparent select-none">
              Fijar publicación en cabecera principal (Anuncio Destacado)
            </label>
          </div>

          {dbReadOnly && (
            <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 text-amber-400 rounded-lg text-[11px] font-mono leading-relaxed">
              ⚠️ La base de datos está en modo de solo lectura. No puedes publicar anuncios en este momento.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || dbReadOnly}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
          >
            {dbReadOnly ? "Solo Lectura" : isSubmitting ? "Publicando..." : "Publicar Ahora"}
          </button>
        </form>
      )}

      {/* Add Poll Form */}
      {showAddPollForm && isAdmin && (
        <form onSubmit={handleCreatePoll} className="bg-[#111113] border border-stone-850 p-5 rounded-xl space-y-5 max-w-2xl" id="poll_form">
          <h3 className="text-sm font-bold font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 animate-pulse" /> CONFIGURACIÓN DE NUEVA ENCUESTA
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Pregunta Principal *
              </label>
              <input
                type="text"
                required
                placeholder="¿Qué circuito prefieren para la carrera oficial?"
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Descripción / Notas Explicativas (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Se requiere el voto de todos para planificar la siguiente temporada oficial..."
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 resize-none font-sans"
                value={pollDescription}
                onChange={(e) => setPollDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Tipo de Respuesta / Votación *
              </label>
              <select
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                value={pollType}
                onChange={(e) => setPollType(e.target.value as any)}
              >
                <option value="single">Selección Única (Un voto)</option>
                <option value="multiple">Selección Múltiple (Varios votos)</option>
                <option value="text">Pregunta Abierta (Respuesta escrita / Feedback)</option>
              </select>
            </div>
          </div>

          {/* Options list for Single / Multiple Choice polls */}
          {pollType !== "text" && (
            <div className="space-y-3 bg-[#18181B]/50 p-4 rounded-lg border border-stone-800/80">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                Opciones de Respuesta
              </label>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder={`Ingresa la opción ${idx + 1}`}
                    className="flex-1 bg-[#18181B] border border-stone-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-400"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...pollOptions];
                      newOpts[idx] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = pollOptions.filter((_, oIdx) => oIdx !== idx);
                        setPollOptions(newOpts);
                      }}
                      className="p-1.5 bg-stone-900 hover:bg-red-950/30 text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-900/45 rounded-lg text-xs cursor-pointer font-mono"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 8 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-mono mt-1 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 px-2.5 py-1 rounded cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Añadir opción
                </button>
              )}
            </div>
          )}

          {/* ADVANCED TARGETING & SEGMENTATION FILTERS */}
          <div className="bg-[#18181B]/50 p-4 rounded-lg border border-stone-800/80 space-y-4">
            <h4 className="text-[10px] font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" /> Segmentación y Restricciones de Voto (Opcional)
            </h4>
            <p className="text-[10px] text-stone-500 font-mono leading-normal">
              Si no seleccionas ninguna opción en una sección, todos los usuarios de ese grupo podrán votar por defecto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Roles Target */}
              <div className="space-y-2">
                <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                  Roles Autorizados
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: "piloto", label: "Piloto Oficial" },
                    { id: "admin", label: "Administrador" },
                    { id: "postulante", label: "Postulante" }
                  ].map((role) => (
                    <label key={role.id} className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={targetRoles.includes(role.id)}
                        onChange={() => toggleRoleFilter(role.id)}
                        className="rounded bg-stone-900 border-stone-800 text-purple-500 focus:ring-0"
                      />
                      <span>{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Simulators Target */}
              <div className="space-y-2">
                <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                  Simulador Principal
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: "Assetto Corsa", label: "Assetto Corsa" },
                    { id: "Le Mans Ultimate", label: "Le Mans Ultimate" },
                    { id: "Ambos", label: "Ambos" }
                  ].map((sim) => (
                    <label key={sim.id} className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={targetSimulators.includes(sim.id)}
                        onChange={() => toggleSimFilter(sim.id)}
                        className="rounded bg-stone-900 border-stone-800 text-purple-500 focus:ring-0"
                      />
                      <span>{sim.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Driver Classes Target */}
              <div className="space-y-2">
                <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                  Categoría de Piloto
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: "GT3", label: "GT3 (Ferrari)" },
                    { id: "LMP2", label: "LMP2 (Oreca)" },
                    { id: "Reserva", label: "Reserva / Banca" }
                  ].map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={targetClasses.includes(cls.id)}
                        onChange={() => toggleClassFilter(cls.id)}
                        className="rounded bg-stone-900 border-stone-800 text-purple-500 focus:ring-0"
                      />
                      <span>{cls.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {dbReadOnly && (
            <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 text-amber-400 rounded-lg text-[11px] font-mono leading-relaxed">
              ⚠️ La base de datos está en modo de solo lectura. No puedes crear encuestas en este momento.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmittingPoll || dbReadOnly}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-purple-600/15"
          >
            {dbReadOnly ? "Solo Lectura" : isSubmittingPoll ? "Creando..." : "Crear Encuesta"}
          </button>
        </form>
      )}

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: News Listings Feed (Span 7/8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-28 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
              <div className="h-28 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
            </div>
          ) : news.length === 0 ? (
            <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2 bg-[#111113]/40">
              <AlertTriangle className="w-8 h-8 text-stone-600 mx-auto" />
              <h3 className="font-bold text-stone-400 font-mono">SIN ANUNCIOS DISPONIBLES</h3>
              <p className="text-stone-500 text-xs">No se han registrado anuncios oficiales por el momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {news.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#111113]/90 relative border border-stone-800 hover:border-stone-700 transition-all p-5 md:p-6 rounded-xl space-y-4 shadow-md ${
                    item.pinnable ? "ring-1 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : ""
                  }`}
                  id={`news_item_${item.id}`}
                >
                  {item.pinnable && (
                    <div className="absolute top-0 right-12 transform -translate-y-1/2 bg-amber-500 text-black text-[8px] font-black tracking-widest font-mono uppercase px-2 py-0.5 rounded-full shadow-md z-10">
                      FIJADO
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] uppercase font-mono tracking-widest font-bold px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => !dbReadOnly && handleDeleteNews(item.id)}
                        disabled={dbReadOnly}
                        className={`p-1.5 rounded border transition-all ${
                          dbReadOnly 
                            ? "text-stone-700 bg-stone-950 border-stone-900 cursor-not-allowed opacity-40" 
                            : "text-stone-500 hover:text-red-400 bg-stone-900 hover:bg-red-950/20 border-stone-800 hover:border-red-900/50 cursor-pointer"
                        }`}
                        title={dbReadOnly ? "No es posible eliminar en modo de solo lectura" : "Eliminar Noticia"}
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-white font-display">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-300 font-sans leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>

                  <div className="border-t border-stone-800/60 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.authorPhoto ? (
                        <img src={item.authorPhoto} alt="Author avatar" className="w-5.5 h-5.5 rounded-full border border-stone-800" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-5.5 h-5.5 bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                          {item.author.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-stone-400 font-mono">
                        Publicado por: <strong className="text-stone-300 font-bold">{item.author}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Polls Sidebar (Span 5/4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="border-b border-stone-800 pb-3">
            <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-400" /> ENCUESTAS DEL CLUB
            </h3>
            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-1 leading-relaxed">
              Vota y participa de las decisiones de ALR
            </p>
          </div>

          {polls.length === 0 ? (
            <div className="border border-stone-800 border-dashed rounded-xl p-8 text-center space-y-2 bg-[#111113]/20">
              <Users className="w-6 h-6 text-stone-600 mx-auto" />
              <h4 className="font-bold text-xs text-stone-500 font-mono">SIN ENCUESTAS ACTIVAS</h4>
              <p className="text-stone-600 text-[10px]">No se han registrado encuestas en este momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  currentUserProfile={currentUserProfile}
                  isAdmin={isAdmin}
                  dbReadOnly={dbReadOnly}
                  onVote={handleVote}
                  onDeleteVote={handleDeleteVote}
                  onToggleClosed={handleTogglePollClosed}
                  onDelete={handleDeletePoll}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PollCardProps {
  key?: string;
  poll: Poll;
  currentUserProfile: UserProfile | null;
  isAdmin: boolean;
  dbReadOnly: boolean;
  onVote: (pollId: string, voteValue: any) => Promise<void> | void;
  onDeleteVote: (pollId: string) => Promise<void> | void;
  onToggleClosed: (pollId: string, isClosed: boolean) => Promise<void> | void;
  onDelete: (pollId: string) => Promise<void> | void;
}

function PollCard({
  poll,
  currentUserProfile,
  isAdmin,
  dbReadOnly,
  onVote,
  onDeleteVote,
  onToggleClosed,
  onDelete,
}: PollCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingVote, setIsEditingVote] = useState(false);
  const [isCastingVote, setIsCastingVote] = useState<boolean>(false);
  
  // Local state for text input response
  const [textVoteValue, setTextVoteValue] = useState("");
  
  // Local state for multiple selections
  const [multiSelectedIndices, setMultiSelectedIndices] = useState<number[]>([]);

  const totalVotes = Object.keys(poll.votes || {}).length;
  const userVoteValue = currentUserProfile ? poll.votes?.[currentUserProfile.uid] : undefined;
  
  // Check if voter has already voted
  const hasVoted = userVoteValue !== undefined && !isEditingVote;

  // Verify eligibility based on target segmentations
  const eligibility = checkEligibility(poll, currentUserProfile);

  // Initialize multiple selection when editing starts
  React.useEffect(() => {
    if (poll.type === "multiple" && Array.isArray(userVoteValue)) {
      setMultiSelectedIndices(userVoteValue);
    } else {
      setMultiSelectedIndices([]);
    }
    
    if (poll.type === "text" && userVoteValue && typeof userVoteValue === "object") {
      setTextVoteValue(userVoteValue.text || "");
    } else {
      setTextVoteValue("");
    }
  }, [userVoteValue, isEditingVote, poll.type]);

  // Calculate votes counts per option (only relevant for single / multiple)
  const votesCount = (poll.options || []).map((_, idx) => {
    return Object.values(poll.votes || {}).filter((val) => {
      if (poll.type === "single" && val === idx) return true;
      if (poll.type === "multiple" && Array.isArray(val) && val.includes(idx)) return true;
      return false;
    }).length;
  });

  const handleDeleteVoteClick = async () => {
    if (dbReadOnly || !currentUserProfile) return;
    setIsCastingVote(true);
    try {
      await onDeleteVote(poll.id);
      setIsEditingVote(false);
      setTextVoteValue("");
      setMultiSelectedIndices([]);
    } finally {
      setIsCastingVote(false);
    }
  };

  const handleSingleVoteClick = async (idx: number) => {
    if (dbReadOnly || !currentUserProfile || !eligibility.eligible) return;
    setIsCastingVote(true);
    try {
      await onVote(poll.id, idx);
      setIsEditingVote(false);
    } finally {
      setIsCastingVote(false);
    }
  };

  const handleMultipleVoteSubmit = async () => {
    if (dbReadOnly || !currentUserProfile || !eligibility.eligible) return;
    if (multiSelectedIndices.length === 0) {
      alert("Por favor selecciona al menos una opción para votar.");
      return;
    }
    setIsCastingVote(true);
    try {
      await onVote(poll.id, multiSelectedIndices);
      setIsEditingVote(false);
    } finally {
      setIsCastingVote(false);
    }
  };

  const handleTextVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dbReadOnly || !currentUserProfile || !eligibility.eligible) return;
    if (!textVoteValue.trim()) return;

    setIsCastingVote(true);
    try {
      const payload = {
        text: textVoteValue.trim(),
        userName: currentUserProfile.displayName,
        userPhoto: currentUserProfile.photoURL || "",
        votedAt: new Date().toISOString(),
      };
      await onVote(poll.id, payload);
      setIsEditingVote(false);
    } finally {
      setIsCastingVote(false);
    }
  };

  const handleToggleMultiOption = (idx: number) => {
    setMultiSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div
      className={`bg-[#111113]/90 relative border rounded-xl p-5 space-y-4 shadow-md transition-all duration-300 ${
        poll.isClosed
          ? "border-stone-850 opacity-85 shadow-none"
          : "border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.03)] hover:border-purple-500/35"
      }`}
      id={`poll_card_${poll.id}`}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
          <Clock className="w-3 h-3 text-stone-600 shrink-0" />
          <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span className="text-stone-400 font-bold max-w-[80px] truncate" title={poll.creatorName}>
            {poll.creatorName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge */}
          <span
            className={`text-[8px] font-black tracking-widest font-mono uppercase px-2 py-0.5 rounded-full ${
              poll.isClosed
                ? "bg-stone-900 text-stone-500 border border-stone-800/60"
                : "bg-purple-950/40 text-purple-400 border border-purple-900/40 animate-pulse"
            }`}
          >
            {poll.isClosed ? "Cerrada" : "Abierta"}
          </span>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => !dbReadOnly && onToggleClosed(poll.id, !!poll.isClosed)}
                disabled={dbReadOnly}
                className="p-1 rounded bg-stone-900 hover:bg-stone-850 border border-stone-800/80 text-stone-400 hover:text-white transition-all cursor-pointer"
                title={poll.isClosed ? "Reabrir Encuesta" : "Cerrar Encuesta"}
              >
                {poll.isClosed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </button>

              {isDeleting ? (
                <div className="flex items-center gap-1 bg-red-950/20 border border-red-900/50 rounded px-1.5 py-0.5">
                  <button
                    onClick={() => !dbReadOnly && onDelete(poll.id)}
                    className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase font-mono cursor-pointer"
                  >
                    Sí
                  </button>
                  <span className="text-[9px] text-stone-600 font-mono">/</span>
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="text-[9px] font-black text-stone-400 hover:text-stone-300 uppercase font-mono cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsDeleting(true)}
                  disabled={dbReadOnly}
                  className="p-1 rounded bg-stone-900 hover:bg-red-950/20 border border-stone-800/80 hover:border-red-900/30 text-stone-500 hover:text-red-400 transition-all cursor-pointer"
                  title="Eliminar Encuesta"
                >
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question & Description */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          {poll.type === "text" ? (
            <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          ) : (
            <BarChart3 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          )}
          <h4 className="text-sm font-bold text-white tracking-tight font-display leading-snug">
            {poll.question}
          </h4>
        </div>
        {poll.description && (
          <p className="text-xs text-stone-400 font-sans leading-relaxed whitespace-pre-wrap">
            {poll.description}
          </p>
        )}
      </div>

      {/* SEGMENTATION REQUIREMENTS DISPLAY */}
      {((poll.allowedRoles && poll.allowedRoles.length > 0) ||
        (poll.allowedSimulators && poll.allowedSimulators.length > 0) ||
        (poll.allowedClasses && poll.allowedClasses.length > 0)) && (
        <div className="bg-[#18181B]/40 p-2.5 rounded-lg border border-stone-800/40 text-[9px] font-mono text-stone-400 flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-stone-300 font-bold">RESTRICCIÓN DE AUDIENCIA:</span>
            {poll.allowedRoles && poll.allowedRoles.length > 0 && (
              <span className="block mt-0.5">
                • Roles: {poll.allowedRoles.map((r) => r === "piloto" ? "Piloto" : r).join(", ")}
              </span>
            )}
            {poll.allowedSimulators && poll.allowedSimulators.length > 0 && (
              <span className="block">
                • Simuladores: {poll.allowedSimulators.join(" / ")}
              </span>
            )}
            {poll.allowedClasses && poll.allowedClasses.length > 0 && (
              <span className="block">
                • Categoría: {poll.allowedClasses.map(c => c === "GT3" ? "GT3 (Ferrari)" : c === "LMP2" ? "LMP2 (Oreca)" : c).join(" / ")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actionable / Interactive Body */}
      <div className="space-y-3 pt-1">
        {/* Scenario 1: User is not eligible to participate */}
        {!eligibility.eligible ? (
          <div className="bg-amber-950/15 border border-amber-900/40 rounded-lg p-3 text-center space-y-1.5 text-amber-400">
            <Lock className="w-4 h-4 mx-auto" />
            <h5 className="text-[11px] font-bold font-mono uppercase tracking-wider">Voto Restringido</h5>
            <p className="text-[10px] leading-relaxed font-sans text-amber-500/90">{eligibility.reason}</p>
            {poll.type === "text" && totalVotes > 0 && (
              <div className="pt-2 text-left">
                <span className="text-[9px] font-mono text-stone-500 block mb-2 uppercase">Respuestas registradas ({totalVotes}):</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {Object.values(poll.votes || {}).map((voteObj: any, idx) => (
                    <div key={idx} className="bg-stone-900/40 p-2 rounded border border-stone-800 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-stone-500 font-mono">
                        <span className="text-stone-300 font-bold">{voteObj.userName}</span>
                      </div>
                      <p className="text-stone-400 leading-normal italic font-sans">"{voteObj.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : !hasVoted && !poll.isClosed ? (
          /* Scenario 2: Active voting mode */
          <div className="space-y-3">
            {poll.type === "single" ? (
              /* Choice A: Single Choice Response */
              <div className="space-y-2">
                {(poll.options || []).map((opt, idx) => (
                  <button
                    key={idx}
                    disabled={dbReadOnly || isCastingVote}
                    onClick={() => handleSingleVoteClick(idx)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between border cursor-pointer ${
                      isCastingVote
                        ? "bg-purple-950/20 border-purple-900/30 text-stone-500"
                        : "bg-[#18181B] hover:bg-purple-950/15 border-stone-850 hover:border-purple-500/25 text-stone-300 hover:text-white"
                    }`}
                  >
                    <span className="truncate pr-3">{opt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                  </button>
                ))}
              </div>
            ) : poll.type === "multiple" ? (
              /* Choice B: Multiple Choice Response */
              <div className="space-y-3 bg-[#18181B]/40 p-3 rounded-lg border border-stone-850">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-1">
                  Puedes seleccionar varias opciones:
                </span>
                <div className="space-y-2">
                  {(poll.options || []).map((opt, idx) => {
                    const isChecked = multiSelectedIndices.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={dbReadOnly || isCastingVote}
                        onClick={() => handleToggleMultiOption(idx)}
                        className="w-full text-left p-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 hover:border-purple-500/20 text-stone-300 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-600 shrink-0" />
                        )}
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleMultipleVoteSubmit}
                  disabled={dbReadOnly || isCastingVote || multiSelectedIndices.length === 0}
                  className="w-full mt-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCastingVote ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Confirmar Selección ({multiSelectedIndices.length})
                </button>
              </div>
            ) : (
              /* Choice C: Text / Open Written Response */
              <form onSubmit={handleTextVoteSubmit} className="space-y-2.5">
                <label className="block text-[9px] font-mono text-stone-500 uppercase tracking-wider">
                  Escribe tu opinión / propuesta:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Escribe tu comentario aquí..."
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 resize-none font-sans"
                  value={textVoteValue}
                  onChange={(e) => setTextVoteValue(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={dbReadOnly || isCastingVote || !textVoteValue.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCastingVote ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  Enviar Respuesta Escrita
                </button>
              </form>
            )}

            {isEditingVote && (
              <div className="flex items-center justify-between mt-1 pt-2.5 border-t border-stone-800/40">
                <button
                  type="button"
                  onClick={() => setIsEditingVote(false)}
                  className="text-[10px] text-stone-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer"
                >
                  ← Volver a resultados
                </button>
                <button
                  type="button"
                  disabled={dbReadOnly || isCastingVote}
                  onClick={handleDeleteVoteClick}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash className="w-3.5 h-3.5" /> Borrar mi respuesta
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Scenario 3: Results Mode (Voted or Closed) */
          <div className="space-y-3.5">
            {poll.type !== "text" ? (
              /* Bar charts for Single and Multiple choice polls */
              <div className="space-y-3">
                {(poll.options || []).map((opt, idx) => {
                  const count = votesCount[idx] || 0;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  
                  // Evaluate if user chose this option
                  const isUserChoice = poll.type === "single" 
                    ? userVoteValue === idx 
                    : Array.isArray(userVoteValue) && userVoteValue.includes(idx);

                  return (
                    <div key={idx} className="space-y-1 relative">
                      {/* Option Label and Percentage Bar Row */}
                      <div className="flex items-center justify-between text-[11px] font-medium z-10 relative px-0.5">
                        <span className="text-stone-200 flex items-center gap-1.5 truncate pr-2">
                          <span className="truncate">{opt}</span>
                          {isUserChoice && (
                            <span className="flex items-center gap-0.5 bg-purple-950/70 text-purple-400 border border-purple-900/40 text-[7px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase shrink-0">
                              <Check className="w-2.5 h-2.5" /> Votado
                            </span>
                          )}
                        </span>
                        <span className="text-stone-400 font-mono font-bold flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-stone-500 font-normal">
                            ({count} {count === 1 ? "voto" : "votos"})
                          </span>
                          <span className="text-white bg-stone-900/80 px-1 py-0.5 rounded border border-stone-800/40 text-[9px] min-w-[28px] text-center">
                            {pct}%
                          </span>
                        </span>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="h-2 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-900">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUserChoice
                              ? "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                              : "bg-stone-700"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Written Responses Feed for Text polls */
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-2">
                  Respuestas de Pilotos ({totalVotes}):
                </span>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(poll.votes || {}).map(([voterUid, voteObj]: [string, any]) => {
                    const isOwnText = currentUserProfile?.uid === voterUid;
                    return (
                      <div 
                        key={voterUid} 
                        className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 leading-relaxed ${
                          isOwnText 
                            ? "bg-purple-950/10 border-purple-900/30" 
                            : "bg-stone-900/40 border-stone-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {voteObj.userPhoto ? (
                              <img src={voteObj.userPhoto} alt="" className="w-4.5 h-4.5 rounded-full shrink-0 border border-stone-800" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-4.5 h-4.5 bg-purple-950/60 text-purple-400 border border-purple-900/40 rounded-full text-[8px] font-bold flex items-center justify-center font-mono">
                                {voteObj.userName ? voteObj.userName.charAt(0).toUpperCase() : "?"}
                              </div>
                            )}
                            <span className="text-stone-300 font-bold font-mono">{voteObj.userName}</span>
                          </div>
                          {isOwnText && (
                            <span className="bg-purple-950/60 text-purple-400 border border-purple-900/30 text-[7px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-stone-300 font-sans pl-0.5 whitespace-pre-wrap">
                          {voteObj.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Change or Delete vote button if poll is still open and not closed */}
            {!poll.isClosed && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-stone-800/40">
                <button
                  type="button"
                  disabled={dbReadOnly || isCastingVote}
                  onClick={handleDeleteVoteClick}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:underline disabled:opacity-50"
                  title="Eliminar mi voto de esta encuesta por completo"
                >
                  <Trash className="w-3.5 h-3.5" /> Borrar mi respuesta
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingVote(true)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Cambiar mi respuesta
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer statistics */}
      <div className="pt-2.5 border-t border-stone-800/50 flex items-center justify-between text-[10px] text-stone-500 font-mono">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-stone-600 animate-none shrink-0" />
          <span>{totalVotes} {totalVotes === 1 ? "voto registrado" : "votos registrados"}</span>
        </span>
        {poll.isClosed && (
          <span className="text-stone-600 flex items-center gap-1 font-bold shrink-0">
            <Lock className="w-3 h-3 text-stone-600" /> Encuesta Finalizada
          </span>
        )}
      </div>
    </div>
  );
}
