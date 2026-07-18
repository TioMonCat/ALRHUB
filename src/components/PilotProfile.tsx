import React from "react";
import { UserProfile, AttendanceRecord } from "../types";
import {
  ArrowLeft,
  Shield,
  Award,
  Flag,
  Instagram,
  Star,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { COUNTRIES } from "../presets";

interface PilotProfileProps {
  pilot: UserProfile | null;
  attendance: AttendanceRecord[];
  onBack: () => void;
}

export default function PilotProfile({ pilot, attendance, onBack }: PilotProfileProps) {
  if (!pilot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-500 font-mono">
        <p>Piloto no encontrado.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 hover:underline text-xs cursor-pointer">
          ← Volver al Roster
        </button>
      </div>
    );
  }

  // Read stats from Firestore (written by the external app). Default to 0 / "—" if absent.
  const s = pilot.stats ?? {};
  const races       = s.races       ?? 0;
  const wins        = s.wins        ?? 0;
  const podiums     = s.podiums     ?? 0;
  const poles       = s.poles       ?? 0;
  const fastestLaps = s.fastestLaps ?? 0;
  const dnfs        = s.dnfs        ?? 0;
  const totalPoints = s.totalPoints ?? 0;
  const bestLap     = s.bestLap     ?? "—:——.———";
  const avgPos      = s.avgPosition ?? 0;
  const consistency = s.consistency ?? 0;

  // Attendance: count events where pilot marked "yes"
  const pilotAttendance = attendance.filter(a => a.userId === pilot.uid);
  const attendedCount   = pilotAttendance.filter(a => a.status === "yes").length;
  const absentCount     = pilotAttendance.filter(a => a.status === "no").length;
  const maybeCount      = pilotAttendance.filter(a => a.status === "maybe").length;
  const totalRSVP       = pilotAttendance.length;
  const attendanceRate  = totalRSVP > 0 ? Math.round((attendedCount / totalRSVP) * 100) : 0;

  // UI helpers
  const country    = COUNTRIES.find(c => c.code === pilot.country?.toLowerCase());
  const isAdmin    = pilot.role === "admin";
  const isFerrari  = pilot.raceNumber === "05" || pilot.raceNumber === "08";
  const isOreca    = pilot.raceNumber === "32" || pilot.raceNumber === "43";
  const accentColor = isFerrari ? "red" : isOreca ? "fuchsia" : "amber";

  const accent = {
    red:     { border: "border-red-500/30",     glow: "shadow-[0_0_40px_rgba(239,68,68,0.07)]",     text: "text-red-400",     bg: "bg-red-950/30",     dot: "bg-red-500",     badge: "bg-red-950/50 border-red-500/30 text-red-400",     bar: "bg-red-500" },
    fuchsia: { border: "border-fuchsia-500/30", glow: "shadow-[0_0_40px_rgba(217,70,239,0.07)]",   text: "text-fuchsia-400", bg: "bg-fuchsia-950/30", dot: "bg-fuchsia-500", badge: "bg-fuchsia-950/50 border-fuchsia-500/30 text-fuchsia-400", bar: "bg-fuchsia-500" },
    amber:   { border: "border-amber-500/30",   glow: "shadow-[0_0_40px_rgba(245,158,11,0.07)]",   text: "text-amber-400",   bg: "bg-amber-950/30",   dot: "bg-amber-500",   badge: "bg-amber-950/50 border-amber-500/30 text-amber-400",   bar: "bg-amber-500" },
  }[accentColor];

  const winRate    = races > 0 ? ((wins / races) * 100).toFixed(1) : "0.0";
  const podiumRate = races > 0 ? ((podiums / races) * 100).toFixed(1) : "0.0";

  const statCards = [
    { icon: Flag,   label: "Carreras",        value: races,       color: "text-cyan-400"    },
    { icon: Award,  label: "Victorias",        value: wins,        color: "text-yellow-400"  },
    { icon: Star,   label: "Podios",           value: podiums,     color: accent.text        },
    { icon: Zap,    label: "Poles",            value: poles,       color: "text-purple-400"  },
    { icon: Target, label: "Vueltas Rápidas",  value: fastestLaps, color: "text-green-400"   },
    { icon: TrendingUp, label: "Puntos Totales", value: totalPoints, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-mono text-stone-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Volver al Roster Oficial
      </button>

      {/* ── Hero Card ── */}
      <div className={`relative rounded-2xl border ${accent.border} ${accent.glow} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#111113] via-[#0d0d10] to-[#111113]" />
        {/* Dorsal watermark */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none select-none">
          <span className={`text-[120px] font-black font-mono leading-none opacity-[0.04] ${accent.text}`}>
            {pilot.raceNumber || "00"}
          </span>
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {pilot.photoURL ? (
              <img
                src={pilot.photoURL}
                alt={pilot.displayName}
                referrerPolicy="no-referrer"
                className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 ${accent.border} object-cover shadow-2xl`}
              />
            ) : (
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 ${accent.border} bg-[#1a1a1e] flex items-center justify-center`}>
                <span className={`text-3xl font-black font-mono ${accent.text}`}>
                  {pilot.displayName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1a1a1e] border border-stone-800 flex items-center justify-center">
              <span className={`w-2.5 h-2.5 rounded-full ${accent.dot} animate-pulse`} />
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{pilot.displayName}</h1>
              {isAdmin && (
                <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-widest bg-red-950/60 border border-red-500/40 text-red-400 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3" /> Comisario
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {country && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-stone-300">
                  <img src={`https://flagcdn.com/w40/${country.code}.png`} alt={country.name} className="w-5 h-3.5 object-cover rounded border border-stone-800" />
                  {country.name}
                </span>
              )}
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${accent.badge}`}>
                {pilot.carPreference || (isFerrari ? "Ferrari 296 GT3" : isOreca ? "Oreca 07 LMP2" : "Sin Coche Asignado")}
              </span>
              {pilot.preferredGame && (
                <span className="text-xs font-mono text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">
                  {pilot.preferredGame}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="text-center">
                <p className={`text-3xl font-black font-mono ${accent.text}`}>#{pilot.raceNumber || "—"}</p>
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest">Dorsal</p>
              </div>
              <div className="w-px h-10 bg-stone-800" />
              <div className="text-center">
                <p className="text-xl font-black font-mono text-white">{winRate}%</p>
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest">Win Rate</p>
              </div>
              <div className="w-px h-10 bg-stone-800" />
              <div className="text-center">
                <p className="text-xl font-black font-mono text-white">{avgPos > 0 ? `P${avgPos}` : "—"}</p>
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest">Posición Media</p>
              </div>
            </div>
          </div>

          {/* Dorsal Badge */}
          <div className={`hidden md:flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 ${accent.border} ${accent.bg} flex-shrink-0`}>
            <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">Nº</span>
            <span className={`text-4xl font-black font-mono ${accent.text} leading-none`}>{pilot.raceNumber || "—"}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid (from external app) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-[#111113]/90 border border-stone-800/80 rounded-xl p-4 flex flex-col items-center text-center space-y-1.5 hover:border-stone-700 transition-colors">
              <Icon className={`w-5 h-5 ${s.color}`} />
              <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Bottom 2-col ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Performance Bars */}
        <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Índice de Rendimiento
          </h3>
          {[
            { label: "Consistencia",     value: consistency,                         color: accent.bar       },
            { label: "Tasa de Podio",    value: Math.round(parseFloat(podiumRate)),  color: "bg-purple-500"  },
            { label: "Tasa de Victoria", value: Math.round(parseFloat(winRate)),     color: "bg-yellow-500"  },
            { label: "Clasificación",    value: races > 0 ? Math.min(100, Math.round((poles / races) * 100)) : 0, color: "bg-green-500" },
          ].map((bar, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-stone-400 uppercase tracking-wider">{bar.label}</span>
                <span className="text-white font-bold">{bar.value}%</span>
              </div>
              <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
                <div className={`h-full ${bar.color} rounded-full transition-all duration-700`} style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Ficha Técnica */}
        <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Ficha Técnica
          </h3>
          {[
            { label: "Vuelta Rápida Record", value: bestLap,                           highlight: true  },
            { label: "DNFs",                 value: dnfs.toString(),                    highlight: false },
            { label: "Experiencia",          value: pilot.experience || "—",            highlight: false },
            { label: "Steam ID",             value: pilot.steamId    || "—",            highlight: false },
            { label: "Simulador principal",  value: pilot.preferredGame || "—",         highlight: false },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-stone-800/50 last:border-0">
              <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{row.label}</span>
              <span className={`text-xs font-mono font-bold ${row.highlight ? "text-cyan-400" : "text-stone-300"}`}>{row.value}</span>
            </div>
          ))}
          {pilot.instagram && (
            <a
              href={`https://instagram.com/${pilot.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors text-xs font-mono pt-1"
            >
              <Instagram className="w-3.5 h-3.5" />
              @{pilot.instagram.replace("@", "")}
            </a>
          )}
        </div>
      </div>

      {/* ── Attendance (from RSVP system) ── */}
      <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400" />
          Asistencia a Eventos ALR
        </h3>

        {totalRSVP === 0 ? (
          <p className="text-xs text-stone-600 font-mono italic">Sin registros de asistencia aún.</p>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: CheckCircle, label: "Confirmó",  value: attendedCount, color: "text-green-400"  },
                { icon: XCircle,     label: "No asistió", value: absentCount,   color: "text-red-400"   },
                { icon: HelpCircle,  label: "Tal vez",   value: maybeCount,    color: "text-amber-400" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-stone-900/50 border border-stone-800/50 rounded-xl p-3 flex flex-col items-center text-center gap-1">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <p className={`text-xl font-black font-mono ${item.color}`}>{item.value}</p>
                    <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Attendance rate bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-stone-400 uppercase tracking-wider">Tasa de Asistencia</span>
                <span className="text-white font-bold">{attendedCount}/{totalRSVP} eventos ({attendanceRate}%)</span>
              </div>
              <div className="h-2 bg-stone-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
