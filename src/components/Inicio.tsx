import React, { useState } from "react";
import ALRLogo from "./ALRLogo";
import { UserProfile, NewsItem, TeamEvent, CarSetup } from "../types";
import { 
  Users, 
  MapPin, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  UserPlus, 
  FileText,
  Compass,
  ArrowRight,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { COUNTRIES } from "../presets";

interface InicioProps {
  currentUserProfile: UserProfile | null;
  news: NewsItem[];
  events: TeamEvent[];
  setups: CarSetup[];
  onNavigate: (view: any) => void;
  pilotsCount: number;
  dbReadOnly?: boolean;
}

export default function Inicio({
  currentUserProfile,
  news,
  events,
  setups,
  onNavigate,
  pilotsCount,
  dbReadOnly = false,
}: InicioProps) {
  const [carPref, setCarPref] = useState(currentUserProfile?.carPreference || "");
  const [prefGame, setPrefGame] = useState(currentUserProfile?.preferredGame || "");
  const [steamIdStr, setSteamIdStr] = useState(currentUserProfile?.steamId || "");
  const [instagram, setInstagram] = useState(currentUserProfile?.instagram || "");
  const [exp, setExp] = useState(currentUserProfile?.experience || "");
  const [msg, setMsg] = useState(currentUserProfile?.message || "");
  const [country, setCountry] = useState(currentUserProfile?.country || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFichaSuccessModal, setShowFichaSuccessModal] = useState(false);

  React.useEffect(() => {
    if (currentUserProfile) {
      setCarPref(currentUserProfile.carPreference || "");
      setPrefGame(currentUserProfile.preferredGame || "");
      setSteamIdStr(currentUserProfile.steamId || "");
      setInstagram(currentUserProfile.instagram || "");
      setExp(currentUserProfile.experience || "");
      setMsg(currentUserProfile.message || "");
      setCountry(currentUserProfile.country || "");
    }
  }, [
    currentUserProfile?.uid,
    currentUserProfile?.carPreference,
    currentUserProfile?.preferredGame,
    currentUserProfile?.steamId,
    currentUserProfile?.instagram,
    currentUserProfile?.experience,
    currentUserProfile?.message,
    currentUserProfile?.country
  ]);


  const isRecent24h = (dateStr?: string) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr).getTime();
    const now = new Date().getTime();
    // 24 hours in milliseconds
    const msIn24h = 24 * 60 * 60 * 1000;
    return (now - itemDate) <= msIn24h;
  };

  const upcomingEvent = events
    .filter((e) => e.status === "scheduled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const pinnedNewsList = news.filter((n) => n.pinnable);
  const pinnedEventsList = events.filter((e) => e.pinnable && e.status === "scheduled");
  const dbCompletedEvents = events
    .filter((e) => e.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const completedEvents = dbCompletedEvents.slice(0, 1);

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || dbReadOnly) return;
    setIsUpdatingProfile(true);
    setSaveSuccess(false);

    const path = `users/${currentUserProfile.uid}`;
    let autoRaceNumber = currentUserProfile.raceNumber || "";
    if (!autoRaceNumber || currentUserProfile.carPreference !== carPref) {
      if (carPref === "Ferrari 296 | GT3") {
        if (autoRaceNumber !== "05" && autoRaceNumber !== "08") {
          autoRaceNumber = "05";
        }
      } else if (carPref === "Oreca 07 | LMP2") {
        if (autoRaceNumber !== "32" && autoRaceNumber !== "43") {
          autoRaceNumber = "32";
        }
      }
    }

    try {
      await updateDoc(doc(db, path), {
        carPreference: carPref,
        raceNumber: autoRaceNumber,
        preferredGame: prefGame,
        steamId: steamIdStr,
        instagram: instagram,
        experience: exp,
        message: msg,
        country: country,
        appliedAt: new Date().toISOString(),
        status: "pendiente",
        rejectionReason: "" // clear any previous rejection reason
      });
      setSaveSuccess(true);
      setShowFichaSuccessModal(true);

      // Enviar notificación a Discord Webhook
      try {
        const webhookUrl = "https://discord.com/api/webhooks/1502181375732617378/9lHyVTWLJwYY7XWU14f6Z2oo87n6MpTJetQdgUjcv1ub123YcfPAw3bs1AOMC4ViYw8n";
        const matchedCountry = COUNTRIES.find((c) => c.code === country?.toLowerCase());
        const countryText = matchedCountry ? `${matchedCountry.flagEmoji} ${matchedCountry.name}` : country || "No especificado";
        
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: "Comisariado ALR",
            avatar_url: currentUserProfile.photoURL || "https://img.icons8.com/color/96/formula-one.png",
            embeds: [
              {
                title: "📝 Nueva Postulación de Piloto",
                description: `El usuario **${currentUserProfile.displayName || "Sin Nombre"}** ha enviado una postulación para unirse a ALR Simracing.`,
                color: 61947, // Hex #00F1FB in decimal
                fields: [
                  { name: "👤 Piloto", value: currentUserProfile.displayName || "No especificado", inline: true },
                  { name: "📧 Correo", value: currentUserProfile.email || "No especificado", inline: true },
                  { name: "🏎️ Vehículo de Competición", value: carPref || "No especificado", inline: true },
                  { name: "🎮 Simulador Preferido", value: prefGame || "No especificado", inline: true },
                  { name: "📸 Instagram", value: instagram || "No especificado", inline: true },
                  { name: "🏳️ País / Nacionalidad", value: countryText, inline: true },
                  { name: "🆔 Steam ID", value: steamIdStr || "No especificado", inline: true },
                  { name: "📊 Experiencia Simracing", value: exp || "No especificado", inline: true },
                  { name: "💬 Mensaje a los Comisarios", value: msg || "Sin mensaje." }
                ],
                footer: {
                   text: `UID: ${currentUserProfile.uid}`
                },
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (webhookErr) {
        console.error("Error al enviar el webhook de Discord:", webhookErr);
      }

      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getRoleLabel = () => {
    if (!currentUserProfile) return "Invitado";
    switch (currentUserProfile.role) {
      case "admin":
        return "Director de Escudería";
      case "piloto":
        return "Piloto Oficial";
      case "postulante":
        return "Postulante";
      default:
        return "Piloto de Pruebas";
    }
  };

  const getStatusLabel = () => {
    if (!currentUserProfile) return "";
    switch (currentUserProfile.status) {
      case "aprobado":
        return "Contrato Firmado • Activo";
      case "pendiente":
        return "Solicitud en Revisión";
      case "rechazado":
        return "Solicitud Rechazada / Archivo";
      default:
        return "Pendiente de Completar";
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header Card */}
      <div className="bg-radial from-[#131d25] to-[#0d0d0f] border border-stone-800 rounded-2xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-5 flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 bg-[#0284c7]/10 border border-[#0284c7]/30 text-[#38bdf8] font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
            Portal Oficial de Pilotos
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-display">
            ALR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4fc] to-[#10B981]">SIMRACING</span>
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-xl font-sans leading-relaxed">
            Plataforma centralizada de gestión y planificación deportiva de la escudería 
            <strong className="text-white"> ALR (Apex Latam Racing)</strong>. 
            Coordinación de eventos y base de datos de setups para nuestros pilotos.
          </p>

          {currentUserProfile && (
            <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
              <div className="bg-[#161619] border border-stone-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
                {currentUserProfile.photoURL ? (
                  <img src={currentUserProfile.photoURL} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 bg-[#38bdf8] text-white rounded-full flex items-center justify-center text-[9px] font-black">
                    {currentUserProfile.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-stone-300 font-bold leading-none">{currentUserProfile.displayName}</p>
                  <p className="text-[10px] text-stone-500 font-mono leading-none mt-1">{getRoleLabel()}</p>
                </div>
              </div>

              <div className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border ${
                currentUserProfile.status === "aprobado"
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20"
                  : currentUserProfile.status === "pendiente"
                  ? "bg-amber-950/20 text-amber-400 border-amber-500/20 animate-pulse"
                  : "bg-red-950/20 text-red-400 border-red-500/20"
              }`}>
                {getStatusLabel()}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center flex-shrink-0 z-10 scale-90 md:scale-100">
          <ALRLogo size={290} className="drop-shadow-[0_0_25px_rgba(40,180,252,0.15)]" />
        </div>
      </div>

      {/* Grid of operational stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => currentUserProfile?.role !== "postulante" && onNavigate("roster")} 
          className={`bg-[#111113] border border-stone-800 rounded-xl p-4 transition-all ${
            currentUserProfile?.role !== "postulante" ? "hover:bg-[#161619] cursor-pointer" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              currentUserProfile?.role !== "postulante" ? "bg-blue-950/30 text-blue-400 border-blue-900/50" : "bg-stone-900/50 text-stone-400 border-stone-800/50"
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">Pilotos Oficiales</p>
              <p className="text-xl font-bold text-white mt-1">{pilotsCount}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => currentUserProfile?.role !== "postulante" && onNavigate("garaje")} 
          className={`bg-[#111113] border border-stone-800 rounded-xl p-4 transition-all ${
            currentUserProfile?.role !== "postulante" ? "hover:bg-[#161619] cursor-pointer" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              currentUserProfile?.role !== "postulante" ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-stone-900/50 text-stone-400 border-stone-800/50"
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">Setups</p>
              <p className="text-xl font-bold text-white mt-1">{setups.length}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => currentUserProfile?.role !== "postulante" && onNavigate("temporada")} 
          className={`bg-[#111113] border border-stone-800 rounded-xl p-4 transition-all ${
            currentUserProfile?.role !== "postulante" ? "hover:bg-[#161619] cursor-pointer" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              currentUserProfile?.role !== "postulante" ? "bg-amber-950/30 text-amber-500 border-amber-900/50" : "bg-stone-900/50 text-stone-400 border-stone-800/50"
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">Próximas Carreras</p>
              <p className="text-xl font-bold text-white mt-1">
                {events.filter(e => e.status === "scheduled").length}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => currentUserProfile?.role !== "postulante" && onNavigate("noticias")} 
          className={`bg-[#111113] border border-stone-800 rounded-xl p-4 transition-all ${
            currentUserProfile?.role !== "postulante" ? "hover:bg-[#161619] cursor-pointer" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              currentUserProfile?.role !== "postulante" ? "bg-[#66FCF1]/10 text-[#66FCF1] border-[#66FCF1]/30" : "bg-stone-900/50 text-stone-400 border-stone-800/50"
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">Noticias</p>
              <p className="text-xl font-bold text-white mt-1">{news.length}</p>
            </div>
          </div>
        </div>
      </div>





      {/* Conditional Dashboard based on registration role */}
      {currentUserProfile?.role === "postulante" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Postulant instructions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111113] border border-stone-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <span className="p-1.5 bg-yellow-900/20 text-yellow-500 rounded border border-yellow-800/30">
                  <UserPlus className="w-4 h-4" />
                </span>
                Proceso de Selección de Pilotos ALR
              </h2>

              <div className="space-y-4 text-xs text-stone-400 leading-relaxed font-sans">
                <p>
                  Para incorporarte al plantel oficial de pilotos de <strong className="text-white">ALR Simracing</strong>, 
                  es necesario que los comisarios del equipo conozcan tu experiencia e ID Steam / perfil de LFM, 
                  así como tu vehículo preferido de competición.
                </p>

                <p className="text-emerald-400/90 bg-[#10B981]/5 p-3 rounded-lg border border-emerald-900/20">
                  ⚡ Tu perfil actual tiene el rol de <strong className="text-white">Postulante</strong>. En cuanto completes 
                  y envíes el formulario de la derecha, un administrador evaluará tu postulación y podrá promoverte a 
                  <strong className="text-white"> Piloto Oficial</strong> para darte acceso completo al Garaje de reglajes, 
                  asistencia a entrenamientos, y calendario de la escudería.
                </p>

                <div className="border-t border-stone-800 pt-4 space-y-2">
                  <p className="font-bold text-stone-300">¿Qué obtienes como Piloto Oficial ALR?</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-500">
                    <li>Acceso al <strong className="text-stone-400">Garaje de Reglajes Colectivos</strong>.</li>
                    <li>Centralización de estrategias y análisis de carrera de la comunidad.</li>
                    <li>RSVP de <strong className="text-stone-400">Asistencia</strong> para programar entrenos y tandas de resistencia.</li>
                    <li>Inscripción coordinada en ligas de primer nivel (Assetto Corsa, LFM, LMU).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Form to submit details */}
          <div className="bg-[#111113] border border-stone-800 rounded-xl p-5 shadow-lg relative h-fit flex flex-col">
            <h3 className="text-sm font-extrabold text-white tracking-widest uppercase font-mono mb-4 text-[#66FCF1]">
              FICHA DEL POSTULANTE
            </h3>
            
            {currentUserProfile?.status === "pendiente" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 border border-dashed border-stone-700/50 rounded-xl bg-stone-900/20">
                <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center border border-cyan-500/20">
                  <UserPlus className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-cyan-400 font-bold font-mono tracking-widest uppercase mb-2">En Revisión</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Hemos recibido correctamente tus datos de postulación. Los comisarios están revisando tu perfil. 
                    Por favor, mantente a la espera de una resolución.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateApplication} className="space-y-4">
                {currentUserProfile?.status === "rechazado" && (
                  <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 space-y-2 mb-4">
                     <h4 className="text-red-400 font-bold font-mono tracking-widest uppercase text-xs">Postulación Rechazada</h4>
                     <p className="text-stone-300 text-[11px] leading-relaxed">
                       Lamentablemente tu solicitud no ha sido aceptada en esta ocasión. Puedes revisar el motivo a continuación y volver a enviar tu postulación si lo deseas.
                     </p>
                     {currentUserProfile.rejectionReason && (
                       <div className="p-2.5 bg-red-950/40 rounded border border-red-900/30">
                         <p className="text-red-200 text-xs italic">
                           "{currentUserProfile.rejectionReason}"
                         </p>
                       </div>
                     )}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                    Simulador(es) *
                  </label>
                  <select
                    required
                    disabled={dbReadOnly}
                    className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={prefGame || ""}
                    onChange={(e) => setPrefGame(e.target.value)}
                  >
                    <option value="">-- Selecciona --</option>
                    <option value="Assetto Corsa">Assetto Corsa</option>
                    <option value="Le Mans Ultimate">Le Mans Ultimate</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>
                <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Vehículo de Competición *
                </label>
                <select
                  required
                  disabled={dbReadOnly}
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={carPref || ""}
                  onChange={(e) => setCarPref(e.target.value)}
                >
                  <option value="">-- Selecciona --</option>
                  <option value="Ferrari 296 | GT3">Ferrari 296 | GT3</option>
                  <option value="Oreca 07 | LMP2">Oreca 07 | LMP2</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Nacionalidad / País *
                </label>
                <select
                  required
                  disabled={dbReadOnly}
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={country || ""}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">-- Selecciona País --</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flagEmoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  ID de Steam *
                </label>
                <input
                  type="text"
                  required
                  disabled={dbReadOnly}
                  placeholder="Ej: 76561198..."
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={steamIdStr || ""}
                  onChange={(e) => setSteamIdStr(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Usuario de Instagram
                </label>
                <input
                  type="text"
                  disabled={dbReadOnly}
                  placeholder="Ej: @tu_usuario"
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={instagram || ""}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Experiencia Simracing *
                </label>
                <select
                  required
                  disabled={dbReadOnly}
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={exp || ""}
                  onChange={(e) => setExp(e.target.value)}
                >
                  <option value="">-- Selecciona --</option>
                  <option value="Iniciado">Iniciado / Principiante</option>
                  <option value="Intermedio">Intermedio (Ligas Club)</option>
                  <option value="Avanzado">Avanzado (Ligas Privadas / LFM)</option>
                  <option value="Elite">Élite / Profesional</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Mensaje a los Comisarios *
                </label>
                <textarea
                  required
                  disabled={dbReadOnly}
                  rows={2}
                  placeholder="Háblanos un poco de ti o de tus objetivos..."
                  className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={msg || ""}
                  onChange={(e) => setMsg(e.target.value)}
                />
              </div>

              {dbReadOnly && (
                <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 text-amber-400 rounded-lg text-[11px] font-mono leading-relaxed">
                  ⚠️ El portal se encuentra temporalmente en modo de solo lectura. No es posible enviar o actualizar postulaciones en este momento.
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400 text-[11px] font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Datos de postulación enviados con éxito.
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingProfile || dbReadOnly}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                {dbReadOnly ? "Modo Solo Lectura" : isUpdatingProfile ? "Enviando..." : "Enviar / Actualizar Ficha"}
              </button>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Official pilot or admin dashboard summary */}
      {currentUserProfile && (currentUserProfile.role?.toLowerCase() === "piloto" || currentUserProfile.role?.toLowerCase() === "admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main briefings / Pinnable item */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold tracking-tight text-white uppercase font-mono flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              Tablón de la Escudería
            </h2>

            <div className="space-y-4">
              {pinnedNewsList.length > 0 || pinnedEventsList.length > 0 ? (
                <>
                  {pinnedNewsList.map(newsItem => (
                    <div key={newsItem.id} className="bg-gradient-to-r from-[#17171a] to-[#0D0D0F] border-l-4 border-l-cyan-500 border-y border-r border-[#1F1F23]/80 rounded-r-xl p-5 relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          AVISO OFICIAL
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(newsItem.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white relative z-10">{newsItem.title}</h3>
                      <p className="text-xs text-stone-400 mt-2 leading-relaxed relative z-10">
                        {newsItem.content}
                      </p>
                      <button
                        onClick={() => onNavigate("noticias")}
                        className="mt-3 flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:text-cyan-400 transition-colors"
                      >
                        Leer en Noticias <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {pinnedEventsList.map(event => (
                    <div key={event.id} className="bg-gradient-to-r from-[#1a1411] to-[#0D0D0F] border-l-4 border-l-amber-500 border-y border-r border-[#1F1F23]/80 rounded-r-xl p-5 relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          EVENTO DESTACADO
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white relative z-10">{event.title}</h3>
                      <div className="text-xs text-stone-400 mt-1 flex items-center gap-1 relative z-10">
                        <MapPin className="w-3 h-3 text-stone-500" /> {event.track}
                      </div>
                      {event.description && (
                        <p className="text-xs text-stone-400 mt-2 leading-relaxed line-clamp-2 relative z-10">
                          {event.description}
                        </p>
                      )}
                      <button
                        onClick={() => onNavigate("temporada")}
                        className="mt-3 flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:text-amber-500 transition-colors"
                      >
                        Ver Detalles <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="bg-[#111113] border border-dashed border-stone-800/50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[160px] text-center">
                  <FileText className="w-6 h-6 text-stone-700 mb-2" />
                  <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">Sin Anuncios Recientes</p>
                  <p className="text-[10px] text-stone-600 mt-2 max-w-xs">
                    El centro de control no reporta avisos destacados por el momento.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resultados Recientes lado derecho */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Sesiones Completadas
            </h2>
            {completedEvents.length > 0 ? (
              <div className="space-y-4">
                {completedEvents.map((event) => (
                  <div key={event.id} className="bg-[#111113] border border-stone-800 rounded-xl p-5 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                    
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded">
                        COMPLETADO
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer relative z-10" onClick={() => onNavigate("temporada")}>
                      {event.title}
                    </h3>
                    <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-500" /> {event.track}
                    </div>

                    {event.results && event.results.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-stone-800/60 relative z-10">
                        <p className="text-[10px] text-stone-500 font-mono uppercase mb-2 tracking-wider">Top Resultados</p>
                        <div className="space-y-1">
                          {event.results.slice(0, 3).map((res, i) => {
                            const isP1 = String(res.position) === "1";
                            const isP2 = String(res.position) === "2";
                            const isP3 = String(res.position) === "3";

                            let displayPos = "Resultado";
                            if (isP1) displayPos = "Podio | P1";
                            else if (isP2) displayPos = "Podio | P2";
                            else if (isP3) displayPos = "Podio | P3";
                            else if (res.position?.toUpperCase() === "DNF") displayPos = "Abandono (DNF)";
                            else if (res.position?.toUpperCase() === "DSQ") displayPos = "Descalificado (DSQ)";
                            else if (res.position) displayPos = `Puesto | P${res.position}`;

                            return (
                              <div key={i} className="flex items-center justify-between text-xs bg-[#18181B] px-2 py-1.5 rounded">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  {isP1 ? <Trophy className="w-3 h-3 text-amber-400" /> : 
                                   isP2 ? <Trophy className="w-3 h-3 text-stone-300" /> :
                                   isP3 ? <Trophy className="w-3 h-3 text-amber-700" /> :
                                   <span className="w-3.5 h-3.5 flex items-center justify-center font-mono text-[9px] text-stone-500 font-bold bg-stone-900 border border-stone-800 rounded">{res.position}</span>}
                                  <span className="text-stone-300 font-medium truncate">{res.name || displayPos}</span>
                                  {res.category && (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono select-none ${
                                      res.category === "LMP2" 
                                        ? "bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-500/25" 
                                        : "bg-cyan-950/20 text-cyan-400 border border-cyan-400/20"
                                    }`}>
                                      {res.category}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-emerald-400 font-bold text-[10px] whitespace-nowrap">+{res.points} pts</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {event.strategyNotes && (
                      <div className="mt-3 pt-3 border-t border-stone-800/60 relative z-10">
                        <p className="text-[10px] text-stone-500 font-mono uppercase mb-1.5 tracking-wider">Notas de Estrategia</p>
                        <p className="text-[11px] text-stone-400 font-mono leading-relaxed line-clamp-3">
                          {event.strategyNotes}
                        </p>
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            ) : (
              <div className="min-h-[200px] border border-dashed border-stone-800/30 rounded-xl flex items-center justify-center text-center p-6">
                <div className="space-y-2">
                  <CheckCircle className="w-6 h-6 text-stone-700 mx-auto" />
                  <p className="text-xs font-mono text-stone-500">Aún no hay carreras completadas.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Celebration Modal for Ficha Submission */}
      <AnimatePresence>
        {showFichaSuccessModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111113] border border-stone-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="space-y-5 relative z-10">
                <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-bounce">
                  🏆
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white uppercase tracking-tight font-display">
                    ¡Ficha de Piloto Enviada!
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">Postulación Sincronizada con Éxito</p>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  ¡Felicidades! Tu postulación ha sido guardada en nuestra base de datos en la nube. Hemos alertado inmediatamente a la Junta de Comisarios mediante una notificación directa en Discord.
                </p>

                <div className="bg-[#0b0b0d] p-3 rounded-xl border border-stone-850 text-left space-y-2">
                  <span className="text-[9px] text-stone-500 uppercase tracking-wider font-mono block">Próximos pasos recomendados:</span>
                  <div className="space-y-1.5 text-[11px] text-stone-300">
                    <div className="flex items-start gap-1.5">
                      <span className="text-cyan-400 shrink-0 font-bold">•</span>
                      <span>Mantente atento a tus notificaciones de correo e Instagram.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-cyan-400 shrink-0 font-bold">•</span>
                      <span>Tu estado actual en el portal ALR figura como <strong className="text-cyan-400 font-medium">Pendiente</strong>.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-cyan-400 shrink-0 font-bold">•</span>
                      <span>Una vez aprobada, tendrás acceso completo al garaje técnico de setups.</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowFichaSuccessModal(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                >
                  Entendido, Ir a Boxes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
