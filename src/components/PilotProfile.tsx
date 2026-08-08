import React, { useState, useEffect } from "react";
import { UserProfile, AttendanceRecord, SimEvent } from "../types";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "../firebase";
import {
  ArrowLeft,
  Shield,
  Award,
  Flag,
  Star,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calendar,
  Activity,
  Gauge,
  History,
  User,
  Camera,
  Upload,
} from "lucide-react";
import { COUNTRIES } from "../presets";
import { getLFMEloLicense, getSRLicenseTier, categorizeSimEvent, CategoryKey } from "../utils/lfm";

interface PilotProfileProps {
  pilot: UserProfile | null;
  attendance: AttendanceRecord[];
  onBack: () => void;
}

export default function PilotProfile({ pilot, attendance, onBack }: PilotProfileProps) {
  const [selectedCar, setSelectedCar] = useState<string>("all");
  const [simEvents, setSimEvents] = useState<SimEvent[]>([]);
  const [localPhoto, setLocalPhoto] = useState<string | null>(pilot?.photoURL || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    setLocalPhoto(pilot?.photoURL || null);
  }, [pilot?.photoURL]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pilot?.uid) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen excede los 3MB. Por favor selecciona una imagen más pequeña.");
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLocalPhoto(base64);
      try {
        const userRef = doc(db, "users", pilot.uid);
        await updateDoc(userRef, { photoURL: base64 });
      } catch (err) {
        console.error("Error al actualizar la foto de perfil:", err);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!pilot?.uid) return;

    let fsList: SimEvent[] = [];
    let rtdbList: SimEvent[] = [];

    const mergeAndSet = () => {
      const combined = [...fsList, ...rtdbList];
      const seen = new Set<string>();
      const unique = combined.filter((e) => {
        const key = e.id || `${e.sessionTimestamp}_${e.trackName}_${e.simulator}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      unique.sort(
        (a, b) => new Date(b.sessionTimestamp || 0).getTime() - new Date(a.sessionTimestamp || 0).getTime()
      );
      setSimEvents(unique);
    };

    // 1. Listen to Firestore users/{uid}/simEvents
    const eventsRef = collection(db, "users", pilot.uid, "simEvents");
    const unsubscribeFs = onSnapshot(
      eventsRef,
      (snapshot) => {
        const list: SimEvent[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as SimEvent);
        });
        fsList = list;
        mergeAndSet();
      },
      (err) => {
        console.warn("Firestore simEvents snapshot note:", err);
      }
    );

    // 2. Listen to Realtime Database users/{uid}/simEvents
    const rtdbRef = ref(rtdb, `users/${pilot.uid}/simEvents`);
    const unsubscribeRtdb = onValue(
      rtdbRef,
      (snapshot) => {
        const list: SimEvent[] = [];
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (typeof val === "object" && val !== null) {
            Object.entries(val).forEach(([id, item]: [string, any]) => {
              if (item && typeof item === "object") {
                list.push({ id, ...item } as SimEvent);
              }
            });
          }
        }
        rtdbList = list;
        mergeAndSet();
      },
      (err) => {
        console.warn("RTDB simEvents listener note:", err);
      }
    );

    return () => {
      unsubscribeFs();
      unsubscribeRtdb();
    };
  }, [pilot?.uid]);

  if (!pilot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-500 font-mono" id="pilot-not-found">
        <p>Piloto no encontrado.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 hover:underline text-xs cursor-pointer">
          ← Volver al Roster
        </button>
      </div>
    );
  }

  // Read stats from Firestore profile document. Default to 0 / "—" if absent.
  const s = pilot.stats ?? {};
  const races       = s.races       ?? 0;
  const wins        = s.wins        ?? 0;
  const podiums     = s.podiums     ?? 0;
  const poles       = s.poles       ?? 0;
  const fastestLaps = s.fastestLaps ?? 0;
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
  const isBMW     = pilot.carPreference?.includes("BMW") || pilot.raceNumber === "23";
  const isPorsche = pilot.carPreference?.includes("Porsche") || pilot.carPreference?.includes("Porshe") || pilot.carPreference?.includes("992") || pilot.raceNumber === "91";
  const isLexus   = pilot.carPreference?.includes("Lexus") || pilot.raceNumber === "5" || pilot.raceNumber === "8" || pilot.raceNumber === "05" || pilot.raceNumber === "08";
  const isGt3     = isBMW || isPorsche || isLexus || pilot.carPreference?.includes("GT3");
  const isOreca   = pilot.carPreference?.includes("Oreca") || pilot.carPreference?.includes("LMP2") || pilot.raceNumber === "32" || pilot.raceNumber === "43";

  const accentColor = isBMW ? "blue" : isPorsche ? "emerald" : isGt3 ? "red" : isOreca ? "fuchsia" : "amber";

  const accent = {
    red:     { border: "border-red-500/30",     glow: "shadow-[0_0_40px_rgba(239,68,68,0.07)]",     text: "text-red-400",     bg: "bg-red-950/30",     dot: "bg-red-500",     badge: "bg-red-950/50 border-red-500/30 text-red-400",     bar: "bg-red-500" },
    blue:    { border: "border-blue-500/30",    glow: "shadow-[0_0_40px_rgba(59,130,246,0.07)]",    text: "text-blue-400",    bg: "bg-blue-950/30",    dot: "bg-blue-500",    badge: "bg-blue-950/50 border-blue-500/30 text-blue-400",    bar: "bg-blue-500" },
    emerald: { border: "border-emerald-500/30", glow: "shadow-[0_0_40px_rgba(16,185,129,0.07)]",   text: "text-emerald-400", bg: "bg-emerald-950/30", dot: "bg-emerald-500", badge: "bg-emerald-950/50 border-emerald-500/30 text-emerald-400", bar: "bg-emerald-500" },
    fuchsia: { border: "border-fuchsia-500/30", glow: "shadow-[0_0_40px_rgba(217,70,239,0.07)]",   text: "text-fuchsia-400", bg: "bg-fuchsia-950/30", dot: "bg-fuchsia-500", badge: "bg-fuchsia-950/50 border-fuchsia-500/30 text-fuchsia-400", bar: "bg-fuchsia-500" },
    amber:   { border: "border-amber-500/30",   glow: "shadow-[0_0_40px_rgba(245,158,11,0.07)]",   text: "text-amber-400",   bg: "bg-amber-950/30",   dot: "bg-amber-500",   badge: "bg-amber-950/50 border-amber-500/30 text-amber-400",   bar: "bg-amber-500" },
  }[accentColor];

  // Dynamically calculate specialized telemetry from real simEvents if available
  const hasRealEvents = simEvents.length > 0;

  let displayRaces = races;
  let displayWins = wins;
  let displayPodiums = podiums;
  let displayPoles = poles;
  let displayFastestLaps = fastestLaps;
  let displayPoints = totalPoints;
  let displayBestLap = bestLap;
  let displayAvgPos = avgPos;
  let displayConsistency = consistency;

  if (hasRealEvents) {
    const filteredEvents = selectedCar === "gt3"
      ? simEvents.filter(e => categorizeSimEvent(e) === "GT")
      : selectedCar === "lmp2"
      ? simEvents.filter(e => categorizeSimEvent(e) === "Prototipos")
      : selectedCar === "formulas"
      ? simEvents.filter(e => categorizeSimEvent(e) === "Fórmulas")
      : simEvents;

    displayRaces = filteredEvents.length;
    displayWins = filteredEvents.filter(e => (e.racePosition ?? e.position) === 1).length;
    displayPodiums = filteredEvents.filter(e => {
      const p = e.racePosition ?? e.position;
      return p && p >= 1 && p <= 3;
    }).length;
    displayPoles = filteredEvents.filter(e => e.qualyPosition === 1).length;

    let minSec = Infinity;
    let minFormatted = "—:——.———";
    let sumPos = 0;
    let sumLaps = 0;
    let sumIncidents = 0;

    filteredEvents.forEach((e) => {
      const pos = e.racePosition ?? e.position ?? 0;
      sumPos += pos;
      sumLaps += e.lapsCompleted || 0;
      sumIncidents += e.incidentsCount || 0;

      const sec = e.bestLapTimeSeconds || e.raceBestLapTime || 0;
      if (sec > 0 && sec < minSec) {
        minSec = sec;
        minFormatted = e.bestLapTimeFormatted || `${sec.toFixed(3)}s`;
      }
    });

    displayBestLap = minSec < Infinity ? minFormatted : "—:——.———";
    displayAvgPos = displayRaces > 0 ? parseFloat((sumPos / displayRaces).toFixed(1)) : 0;
    displayPoints = displayWins * 25 + displayPodiums * 15 + displayRaces * 5;

    if (displayRaces > 0 && sumLaps > 0) {
      const avgIncPerLap = sumIncidents / sumLaps;
      displayConsistency = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, avgIncPerLap)) * 100)));
    } else {
      displayConsistency = sumIncidents === 0 ? 100 : Math.max(0, 100 - sumIncidents * 10);
    }
  }

  const winRate    = displayRaces > 0 ? ((displayWins / displayRaces) * 100).toFixed(1) : "0.0";
  const podiumRate = displayRaces > 0 ? ((displayPodiums / displayRaces) * 100).toFixed(1) : "0.0";

  // LFM Elo and SR system: base Elo starts at 1000
  const skillRating = pilot.skillRating ?? (displayRaces > 0 ? 1000 + displayWins * 150 + displayPodiums * 60 + displayRaces * 15 : 1000);
  const rawSR = pilot.safetyRating ?? 0.00;
  const safetyRating = rawSR.toFixed(2);

  const lfmGlobal = getLFMEloLicense(skillRating, displayRaces);
  const licenseClass = lfmGlobal.grade;
  const licenseColor = lfmGlobal.badgeBg;

  // Racecraft Progression (Starting vs Finishing)
  const recentRaces = hasRealEvents
    ? simEvents.map((e) => {
        const qPos = e.qualyPosition ?? e.position ?? 0;
        const rPos = e.racePosition ?? e.position ?? 0;
        const qualyVal = qPos > 0 ? qPos : 10;
        const raceVal = rPos > 0 ? rPos : 10;
        const diff = qualyVal - raceVal;

        return {
          track: e.trackName || "Circuito",
          qualy: qualyVal,
          race: raceVal,
          diff,
          game: e.simulator || "Simulador",
          carModel: e.carModel || "",
          bestLap: e.bestLapTimeFormatted || (e.bestLapTimeSeconds ? `${e.bestLapTimeSeconds.toFixed(3)}s` : "—"),
          sessionType: e.sessionType || "Qualy + Race",
          incidents: e.incidentsCount ?? 0,
          distanceKm: e.totalDistanceKm ? e.totalDistanceKm.toFixed(1) : "0",
          sessionTimestamp: e.sessionTimestamp,
          skrChange: diff >= 0 ? `+${diff * 35}` : `${diff * 35}`,
          srChange: (e.incidentsCount ?? 0) === 0 ? "+0.15" : (e.incidentsCount ?? 0) > 4 ? "-0.10" : "+0.02",
        };
      })
    : [];

  const avgStart = recentRaces.length > 0
    ? recentRaces.reduce((acc, r) => acc + r.qualy, 0) / recentRaces.length
    : (displayRaces > 0 ? 5.2 : 0);
  const avgFinish = recentRaces.length > 0
    ? recentRaces.reduce((acc, r) => acc + r.race, 0) / recentRaces.length
    : (displayAvgPos > 0 ? displayAvgPos : 0);
  const posGained = (avgStart - avgFinish).toFixed(1);
  const isPositive = parseFloat(posGained) >= 0;

  const maxPosVal = Math.max(20, ...recentRaces.map(r => Math.max(r.qualy, r.race)));

  const statCards = [
    { icon: Flag,   label: "Carreras",        value: displayRaces,       color: "text-cyan-400"    },
    { icon: Award,  label: "Victorias",        value: displayWins,        color: "text-yellow-400"  },
    { icon: Star,   label: "Podios",           value: displayPodiums,     color: accent.text        },
    { icon: Zap,    label: "Poles",            value: displayPoles,       color: "text-purple-400"  },
    { icon: Target, label: "Vueltas Rápidas",  value: displayFastestLaps, color: "text-green-400"   },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="pilot-profile-container">
      {/* Back and Vehicle Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-xs font-mono group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Roster
        </button>

        {/* Categoria Filter Toggle */}
        <div className="flex bg-[#111113] p-1 rounded-xl border border-stone-800 text-xs font-mono">
          <button
            onClick={() => setSelectedCar("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedCar === "all"
                ? "bg-stone-800 text-white font-bold shadow"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Todas las Categorías
          </button>
          <button
            onClick={() => setSelectedCar("gt3")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedCar === "gt3"
                ? "bg-red-950/60 text-red-400 border border-red-500/30 font-bold shadow"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            GT
          </button>
          <button
            onClick={() => setSelectedCar("lmp2")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedCar === "lmp2"
                ? "bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-500/30 font-bold shadow"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Prototipos
          </button>
          <button
            onClick={() => setSelectedCar("formulas")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedCar === "formulas"
                ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-bold shadow"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Fórmulas
          </button>
        </div>
      </div>

      {/* ── Header Banner Card ── */}
      <div className={`relative overflow-hidden bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-6 md:p-8 ${accent.glow}`} id="pilot-header-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-emerald-500 opacity-40" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar Container with Photo Upload */}
            <div className="relative group w-20 h-20 md:w-24 md:h-24 shrink-0">
              <label className="block w-full h-full rounded-2xl overflow-hidden border-2 border-stone-800 bg-stone-900 shadow-xl relative cursor-pointer group-hover:border-cyan-500/50 transition-all">
                {localPhoto ? (
                  <img
                    src={localPhoto}
                    alt={pilot.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-2 text-center bg-stone-950/80">
                    <Upload className="w-6 h-6 text-cyan-400 mb-1 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-stone-300 leading-none">Subir Foto</span>
                    <span className="text-[7.5px] font-mono text-stone-500 mt-0.5">(300x300 px)</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-1.5 z-10">
                  <Camera className="w-5 h-5 text-cyan-400 mb-0.5" />
                  <span className="text-[9px] font-mono font-bold text-white leading-tight">
                    {isUploadingPhoto ? "Subiendo..." : "Cambiar Foto"}
                  </span>
                  <span className="text-[7.5px] font-mono text-cyan-300 font-semibold mt-0.5">
                    (300x300 px)
                  </span>
                </div>

                {/* Small indicator camera icon badge at top right */}
                <div className="absolute top-1.5 right-1.5 bg-stone-900/90 text-cyan-400 p-1 rounded-md border border-stone-700/80 shadow z-15 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                  <Camera className="w-3 h-3" />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
              </label>

              {/* Dorsal Badge */}
              <div className={`absolute -bottom-2 -right-2 ${accent.dot} text-black font-black font-mono text-[10px] px-2 py-0.5 rounded-md shadow border border-stone-900 uppercase z-20`}>
                #{pilot.raceNumber || "—"}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{pilot.displayName}</h1>
                {isAdmin && (
                  <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-widest bg-red-950/60 border border-red-500/40 text-red-400 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3" /> Comisario
                  </span>
                )}
                {/* Licencia ALR Badge */}
                <span className={`flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-widest border px-2 py-0.5 rounded ${licenseColor}`}>
                  <Activity className="w-3 h-3" /> Licencia {licenseClass}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {country && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-stone-300">
                    <img src={`https://flagcdn.com/w40/${country.code}.png`} alt={country.name} className="w-5 h-3.5 object-cover rounded border border-stone-800" />
                    {country.name}
                  </span>
                )}
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${accent.badge}`}>
                  {selectedCar === "all"
                    ? pilot.carPreference || "GT3 / Prototipos"
                    : selectedCar === "gt3"
                    ? "GT (GT3/GT4)"
                    : "Prototipos (LMP2)"}
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
                  <p className="text-xl font-black font-mono text-white">{displayAvgPos > 0 ? `P${Math.round(displayAvgPos)}` : "—"}</p>
                  <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest">Posición Media</p>
                </div>
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

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" id="pilot-stats-cards">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 md:p-6 flex flex-col items-center text-center space-y-2.5 hover:border-stone-700/80 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-cyan-500/5">
              <Icon className={`w-6 h-6 ${s.color}`} />
              <p className={`text-3xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] md:text-xs text-stone-400 font-mono uppercase tracking-widest font-semibold">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Analytical Core Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="analytical-core-row">
        
        {/* LEFT COLUMN: License System & Event Attendance */}
        <div className="space-y-4">
          
          {/* ALR License System Widget with Category Breakdown */}
          <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-4" id="alr-license-widget">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Sistema de Licencias ALR por Categoría
              </h3>
              <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded ${licenseColor}`}>
                Global: {licenseClass}
              </span>
            </div>

            {/* General License Badges */}
            <div className="grid grid-cols-2 gap-3 bg-stone-950/60 p-3 rounded-xl border border-stone-800/60">
              <div className="space-y-1">
                <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">Skill Rating (SkR)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black font-mono text-cyan-400">{skillRating}</p>
                  <span className="text-[9px] font-mono text-stone-400 uppercase">Elo Base 1000</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">Safety Rating (SR)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black font-mono text-emerald-400">{safetyRating}</p>
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${getSRLicenseTier(rawSR).badgeBg}`}>
                    Tier {getSRLicenseTier(rawSR).grade}
                  </span>
                </div>
              </div>
            </div>

            {/* Category License Cards */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                Categorías de Competición
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: "GT" as CategoryKey, name: "GT", badgeColor: "text-red-400 border-red-500/30 bg-red-950/40" },
                  { key: "Prototipos" as CategoryKey, name: "Prototipos", badgeColor: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/40" },
                  { key: "Fórmulas" as CategoryKey, name: "Fórmulas", badgeColor: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40" },
                ].map((cat) => {
                  const storedLic = pilot.categoryLicenses?.[cat.key];
                  const catEvents = simEvents.filter(e => categorizeSimEvent(e) === cat.key);
                  const catRaces = storedLic?.racesCompleted ?? catEvents.length;
                  const catSkR = storedLic?.skillRating ?? (catRaces > 0 ? 1000 + catEvents.filter(e => (e.racePosition ?? e.position) === 1).length * 150 + catRaces * 15 : 1000);
                  const catSR = storedLic?.safetyRating ?? 0.00;
                  const lfm = getLFMEloLicense(catSkR, catRaces);

                  return (
                    <div key={cat.key} className="bg-stone-900/40 border border-stone-800/80 rounded-xl p-3 flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-mono font-bold text-white">{cat.name}</p>
                          <p className="text-[9px] text-stone-500 font-mono">{catRaces} carreras registradas</p>
                        </div>
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${lfm.badgeBg}`}>
                          {lfm.grade}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-stone-800/40">
                        <span className="text-stone-400">SkR: <strong className="text-cyan-400 font-extrabold">{catSkR}</strong></span>
                        <span className="text-stone-400">SR: <strong className="text-green-400 font-extrabold">{catSR.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Attendance (from RSVP system) */}
          <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-4" id="attendance-tracking-widget">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              Asistencia a Eventos ALR
            </h3>

            {totalRSVP === 0 ? (
              <p className="text-xs text-stone-600 font-mono italic">Sin registros de asistencia aún.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: CheckCircle, label: "Confirmó",  value: attendedCount, color: "text-green-400"  },
                    { icon: XCircle,     label: "No asistió", value: absentCount,   color: "text-red-400"   },
                    { icon: HelpCircle,  label: "Duda",       value: maybeCount,    color: "text-amber-400" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="bg-stone-900/40 border border-stone-800/60 rounded-xl p-3 text-center space-y-1">
                        <Icon className={`w-4 h-4 ${item.color} mx-auto`} />
                        <p className={`text-xl font-black font-mono ${item.color}`}>{item.value}</p>
                        <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest">{item.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-stone-400">Ratio de Asistencia</span>
                    <span className="font-bold text-white">{attendanceRate}%</span>
                  </div>
                  <div className="h-2 bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Racecraft Progression & History */}
        <div className="space-y-4">

          {/* Racecraft Progression Widget */}
          <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-4" id="racecraft-progression-widget">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Métricas de Progresión (Racecraft)
              </h3>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
                isPositive 
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30" 
                  : "bg-red-950/60 text-red-400 border-red-500/30"
              }`}>
                {isPositive ? `+${posGained} Pos. Ganadas Prom.` : `${posGained} Pos. Perdidas Prom.`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-stone-800/40">
              <div className="text-center bg-stone-900/20 p-2.5 rounded-xl border border-stone-800/40">
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">Qualy Salida Media</p>
                <p className="text-xl font-mono font-black text-white">P{Math.round(avgStart)}</p>
              </div>
              <div className="text-center bg-stone-900/20 p-2.5 rounded-xl border border-stone-800/40">
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">Carrera Pos. Final Media</p>
                <p className="text-xl font-mono font-black text-cyan-400">P{Math.round(avgFinish)}</p>
              </div>
            </div>

            {/* Custom Visual Track Slope representation of Gained positions */}
            <div className="space-y-2.5">
              <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">Análisis de Sesiones Recientes (Salida vs Llegada):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentRaces.length === 0 ? (
                  <div className="text-center py-10 bg-stone-950/20 rounded-xl border border-stone-900/50 text-stone-500 font-mono text-[11px] italic">
                    Sin carreras disputadas aún en esta categoría.
                  </div>
                ) : (
                  recentRaces.map((race, idx) => {
                    const gained = race.qualy - race.race;
                    const posChangePositive = gained >= 0;
                    
                    const qualyPercent = Math.max(6, Math.min(94, (race.qualy / maxPosVal) * 100));
                    const racePercent = Math.max(6, Math.min(94, (race.race / maxPosVal) * 100));
                    
                    return (
                      <div key={idx} className="bg-stone-950/40 p-2 rounded-xl border border-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="min-w-[120px]">
                          <p className="font-mono font-black text-stone-200">{race.track}</p>
                          <p className="text-[9px] text-stone-500 font-mono">Qualy: P{race.qualy} • Carrera: P{race.race}</p>
                          <p className="text-[8px] text-cyan-400/80 font-mono uppercase tracking-wider mt-0.5">{race.game}</p>
                        </div>
                        
                        {/* Slope/Line segment with overflow-hidden and padded range */}
                        <div className="flex-1 h-6 relative bg-stone-900/50 rounded-lg mx-2 hidden sm:block overflow-hidden px-1">
                          <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[1px] bg-stone-800" />
                          
                          {/* Connection path line */}
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 h-[2px] rounded ${posChangePositive ? "bg-emerald-500/40" : "bg-red-500/40"}`}
                            style={{
                              left: `${Math.min(qualyPercent, racePercent)}%`,
                              width: `${Math.abs(qualyPercent - racePercent)}%`
                            }}
                          />

                          {/* Starting/Qualy dot */}
                          <div 
                            className="absolute w-2.5 h-2.5 rounded-full bg-purple-500 border border-stone-950 top-1/2 -translate-y-1/2 z-10"
                            style={{ left: `calc(${qualyPercent}% - 5px)` }}
                            title={`Qualy: P${race.qualy}`}
                          />

                          {/* Finishing/Race dot */}
                          <div 
                            className={`absolute w-3 h-3 rounded-full border border-stone-950 top-1/2 -translate-y-1/2 z-20 ${
                              posChangePositive ? "bg-emerald-400" : "bg-red-400"
                            }`}
                            style={{ left: `calc(${racePercent}% - 6px)` }}
                            title={`Carrera: P${race.race}`}
                          />
                        </div>

                        <span className={`font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-center shrink-0 min-w-[50px] ${
                          posChangePositive ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" : "bg-red-950/40 text-red-400 border border-red-900/30"
                        }`}>
                          {posChangePositive ? `+${gained}` : gained}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Historial de Carreras Widget */}
          <div className="bg-[#111113]/90 border border-stone-800/80 rounded-2xl p-5 space-y-4" id="pace-consistency-widget">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Historial de Carreras
            </h3>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentRaces.length === 0 ? (
                <div className="text-center py-12 bg-stone-950/20 rounded-xl border border-stone-900/50 text-stone-500 font-mono text-[11px] italic">
                  Sin carreras registradas en el historial.
                </div>
              ) : (
                recentRaces.map((race, idx) => {
                  const gained = race.qualy - race.race;
                  const posChangePositive = gained >= 0;
                  
                  return (
                    <div key={idx} className="bg-stone-900/40 border border-stone-800/30 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-stone-700/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-white">{race.track}</span>
                          <span className="text-[8px] font-mono bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded border border-stone-700/50 uppercase tracking-wider">
                            {race.game}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-stone-500 font-mono">
                          <span>Qualy: <strong className="text-purple-400">P{race.qualy}</strong></span>
                          <span className="text-stone-700">•</span>
                          <span>Carrera: <strong className="text-cyan-400">P{race.race}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5 font-mono text-[9px] flex-wrap">
                          <span className="text-stone-500 uppercase tracking-wider text-[8px]">Delta:</span>
                          <span className={`font-black px-1.5 py-0.5 rounded bg-stone-950/60 border ${
                            race.skrChange.startsWith("+") 
                              ? "text-cyan-400 border-cyan-500/10" 
                              : "text-red-400 border-red-500/10"
                          }`}>
                            SkR {race.skrChange}
                          </span>
                          <span className={`font-black px-1.5 py-0.5 rounded bg-stone-950/60 border ${
                            race.srChange.startsWith("+") 
                              ? "text-emerald-400 border-emerald-500/10" 
                              : "text-red-400 border-red-500/10"
                          }`}>
                            SR {race.srChange}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block font-mono text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded border ${
                          posChangePositive 
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/30" 
                            : "bg-red-950/40 text-red-400 border-red-900/30"
                        }`}>
                          {posChangePositive ? `+${gained} Pos` : `${gained} Pos`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
