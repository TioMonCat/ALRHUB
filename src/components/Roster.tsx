import React, { useState } from "react";
import { UserProfile } from "../types";
import {
  COUNTRIES,
  OFFICIAL_VEHICLES,
  OFFICIAL_LEAGUES,
  OfficialVehicle,
  OfficialLeague,
} from "../presets";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Shield,
  Award,
  RefreshCw,
  Instagram,
  Car,
  Users,
  Settings,
  X,
  Check,
  Edit3,
  Layers,
  Hash,
  Trophy,
  Filter,
} from "lucide-react";

interface RosterProps {
  users: UserProfile[];
  isLoading: boolean;
  onViewPilot: (uid: string) => void;
  currentUserProfile?: UserProfile | null;
}

export default function Roster({
  users,
  isLoading,
  onViewPilot,
  currentUserProfile,
}: RosterProps) {
  const [filterSimulator, setFilterSimulator] = useState<string>("Todos");
  const [filterLeague, setFilterLeague] = useState<string>("Todas las Ligas");

  // State for vehicle / dorsal / leagues assignment edit modal
  const [editingPilot, setEditingPilot] = useState<UserProfile | null>(null);
  const [editLeagues, setEditLeagues] = useState<string[]>([]);
  const [editVehicles, setEditVehicles] = useState<string[]>([]);
  const [editRaceNumber, setEditRaceNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Filter roster: anyone whose role is "piloto" or "admin" and whose status is "aprobado"
  const pilots = users.filter(
    (u) => (u.role === "piloto" || u.role === "admin") && u.status === "aprobado"
  );

  // Helper to get pilot's participating leagues
  const getPilotLeagues = (pilot: UserProfile): string[] => {
    if (pilot.leagues && pilot.leagues.length > 0) {
      return pilot.leagues;
    }
    // Fallback inference based on carPreference
    const pref = pilot.carPreference || "";
    if (pref.includes("Ferrari") || pref.includes("296") || pref.includes("499P")) {
      return ["Ferrari GT3-Hypercar"];
    }
    if (pref.includes("Hypercar") || pref.includes("963") || pref.includes("EMKA")) {
      return ["ERC: Hypercar"];
    }
    return ["ERC NG"];
  };

  // Helper to resolve which vehicles a pilot belongs to
  const getPilotVehicles = (pilot: UserProfile): string[] => {
    if (pilot.assignedVehicles && pilot.assignedVehicles.length > 0) {
      return pilot.assignedVehicles;
    }
    if (pilot.vehicles && pilot.vehicles.length > 0) {
      return pilot.vehicles;
    }
    const pref = pilot.carPreference || "";
    if (pref.includes(",")) {
      const parts = pref.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return [getPilotVehicle(pilot)];
  };

  // Helper to resolve single default vehicle string
  const getPilotVehicle = (pilot: UserProfile): string => {
    const pref = pilot.carPreference || "";
    if (pref.includes("963") || pref.includes("EMKA") || pref.includes("Porsche 963"))
      return "Porsche 963 LMDh | Hypercar";
    if (pref.includes("296")) return "Ferrari 296 GT3";
    if (pref.includes("499P")) return "Ferrari 499P LMH";
    if (pref.includes("Hypercar")) return "Hypercar | ERC";
    if (pref.includes("BMW")) return "BMW M4 2021 | GT3";
    if (
      pref.includes("Porsche") ||
      pref.includes("Porshe") ||
      pref.includes("992")
    )
      return "Porsche 992 R 2023 | GT3";
    if (pref.includes("Lexus")) return "Lexus RC F | GT3";
    if (pref.includes("Oreca") || pref.includes("LMP2"))
      return "Oreca 07 | LMP2";

    // Legacy fallback based on initial dorsals
    if (
      pilot.raceNumber === "5" ||
      pilot.raceNumber === "8" ||
      pilot.raceNumber === "05" ||
      pilot.raceNumber === "08"
    )
      return "Lexus RC F | GT3";
    if (pilot.raceNumber === "23") return "BMW M4 2021 | GT3";
    if (pilot.raceNumber === "91") return "Porsche 992 R 2023 | GT3";
    if (pilot.raceNumber === "32" || pilot.raceNumber === "43")
      return "Oreca 07 | LMP2";
    if (pilot.raceNumber === "29" || pilot.raceNumber === "51")
      return "Ferrari 296 GT3";

    return "Reserva";
  };

  // Simulators list for filtering
  const simulators = ["Todos", "Assetto Corsa", "Le Mans Ultimate"];

  // Leagues list for filtering
  const leagueFilterOptions = ["Todas las Ligas", ...OFFICIAL_LEAGUES.map((l) => l.name)];

  // Filter pilots by simulator
  const filterByGame = (list: UserProfile[]) => {
    return list.filter((p) => {
      if (filterSimulator === "Todos") return true;
      return (
        p.preferredGame === filterSimulator || p.preferredGame === "Ambos"
      );
    });
  };

  const filteredPilots = filterByGame(pilots);

  // Open edit modal for a pilot
  const openEditModal = (pilot: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPilot(pilot);
    const pLeagues = getPilotLeagues(pilot);
    const pVehicles = getPilotVehicles(pilot);

    setEditLeagues(pLeagues);

    // Prune vehicles to only keep those matching pLeagues
    const validVehicles = pVehicles.filter((vId) => {
      const found = OFFICIAL_VEHICLES.find((v) => v.id === vId);
      return !found || pLeagues.includes(found.league);
    });
    setEditVehicles(validVehicles);
    setEditRaceNumber(pilot.raceNumber || "");
    setSaveError(null);
  };

  // Toggle league in edit modal
  const toggleEditLeague = (leagueName: string) => {
    let nextLeagues: string[];
    if (editLeagues.includes(leagueName)) {
      if (editLeagues.length === 1) return; // Must keep at least one league
      nextLeagues = editLeagues.filter((l) => l !== leagueName);
    } else {
      nextLeagues = [...editLeagues, leagueName];
    }
    setEditLeagues(nextLeagues);

    // Automatically remove vehicles that don't belong to any of nextLeagues
    const prunedVehicles = editVehicles.filter((vehId) => {
      const found = OFFICIAL_VEHICLES.find((v) => v.id === vehId);
      return found && nextLeagues.includes(found.league);
    });
    setEditVehicles(prunedVehicles);

    // Also prune dorsals
    const selectedVehs = OFFICIAL_VEHICLES.filter((v) => prunedVehicles.includes(v.id));
    const sourceVehs =
      selectedVehs.length > 0
        ? selectedVehs
        : OFFICIAL_VEHICLES.filter((v) => nextLeagues.includes(v.league));

    const validDorsals = Array.from(
      new Set(sourceVehs.flatMap((v) => v.defaultDorsals || []))
    );
    const currentDorsals = (editRaceNumber || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const prunedDorsals = currentDorsals.filter((d) => validDorsals.includes(d));
    setEditRaceNumber(prunedDorsals.join(", "));
  };

  // Toggle vehicle in edit modal
  const toggleEditVehicle = (vehId: string) => {
    let nextVehicles: string[];
    if (editVehicles.includes(vehId)) {
      nextVehicles = editVehicles.filter((v) => v !== vehId);
    } else {
      nextVehicles = [...editVehicles, vehId];
    }
    setEditVehicles(nextVehicles);

    // Prune dorsals according to nextVehicles
    const selectedVehs = OFFICIAL_VEHICLES.filter((v) => nextVehicles.includes(v.id));
    const sourceVehs =
      selectedVehs.length > 0
        ? selectedVehs
        : OFFICIAL_VEHICLES.filter((v) => editLeagues.includes(v.league));

    const validDorsals = Array.from(
      new Set(sourceVehs.flatMap((v) => v.defaultDorsals || []))
    );
    const currentDorsals = (editRaceNumber || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const prunedDorsals = currentDorsals.filter((d) => validDorsals.includes(d));
    setEditRaceNumber(prunedDorsals.join(", "));
  };

  // Save updated vehicle, leagues, and dorsal assignment to Firestore
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPilot) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const userRef = doc(db, "users", editingPilot.uid);
      await updateDoc(userRef, {
        leagues: editLeagues,
        assignedVehicles: editVehicles,
        vehicles: editVehicles,
        carPreference: editVehicles.join(", ") || "Banca",
        raceNumber: editRaceNumber,
      });

      // Update in-memory reference
      editingPilot.leagues = editLeagues;
      editingPilot.assignedVehicles = editVehicles;
      editingPilot.vehicles = editVehicles;
      editingPilot.carPreference = editVehicles.join(", ") || "Banca";
      editingPilot.raceNumber = editRaceNumber;

      setEditingPilot(null);
    } catch (err: any) {
      console.error("Error updating assignment:", err);
      setSaveError(
        err?.message || "Error al actualizar asignación de ligas / vehículo"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Render an individual pilot card
  const renderPilotCard = (pilot: UserProfile, vehicle?: OfficialVehicle) => {
    const pilotCountry = COUNTRIES.find(
      (c) => c.code === pilot.country?.toLowerCase()
    );
    const isAdmin = pilot.role === "admin";
    const canEdit =
      currentUserProfile?.role === "admin" ||
      currentUserProfile?.uid === pilot.uid;

    const pilotLeagues = getPilotLeagues(pilot);

    return (
      <div
        key={pilot.uid}
        className="bg-[#141417] border border-stone-800/80 hover:border-cyan-500/40 rounded-xl p-3.5 relative group transition-all duration-300 flex flex-col justify-between h-full cursor-pointer shadow-md hover:shadow-cyan-950/20"
        onClick={() => onViewPilot(pilot.uid)}
      >
        <div className="space-y-2.5">
          {/* Header: Avatar, Name, and Role */}
          <div className="flex items-center gap-2.5">
            {pilot.photoURL ? (
              <img
                src={pilot.photoURL}
                alt={pilot.displayName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-stone-800 object-cover bg-stone-900 group-hover:border-cyan-400/50 transition-all duration-300"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-stone-900 text-[#66FCF1] border border-stone-800 flex items-center justify-center text-xs font-mono font-black">
                {pilot.displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p
                  className="font-extrabold text-white tracking-tight text-xs truncate"
                  title={pilot.displayName}
                >
                  {pilot.displayName}
                </p>
                {isAdmin && (
                  <span title="Administrador / Comisario">
                    <Shield className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
                {isAdmin ? "Comisario" : pilot.experience || "Piloto Oficial"}
              </span>
            </div>
          </div>

          {/* League Badges */}
          <div className="flex flex-wrap gap-1 pt-1">
            {pilotLeagues.map((lg) => {
              const matchedLg = OFFICIAL_LEAGUES.find((l) => l.name === lg);
              const colorClass = matchedLg
                ? matchedLg.badgeBg
                : "bg-stone-900 border-stone-800 text-stone-400";
              return (
                <span
                  key={lg}
                  className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${colorClass}`}
                >
                  {lg}
                </span>
              );
            })}
          </div>

          {/* Details row: Nationality & Simulator */}
          <div className="pt-2 border-t border-stone-800/60 grid grid-cols-2 gap-2 text-[10px] font-mono">
            {/* Nacionalidad */}
            <div className="bg-[#111113]/60 p-1.5 rounded border border-stone-800/30 flex flex-col justify-between">
              <span className="text-stone-500 text-[8px] uppercase tracking-wider">
                Nación
              </span>
              {pilotCountry ? (
                <span className="text-stone-300 font-bold flex items-center gap-1 mt-0.5 truncate">
                  <img
                    src={`https://flagcdn.com/w40/${pilotCountry.code}.png`}
                    alt={pilotCountry.name}
                    className="w-3.5 h-2.5 object-cover rounded-sm flex-shrink-0 border border-stone-900/30"
                  />
                  <span className="truncate">{pilotCountry.name}</span>
                </span>
              ) : (
                <span className="text-stone-400">--</span>
              )}
            </div>

            {/* Simulador */}
            <div className="bg-[#111113]/60 p-1.5 rounded border border-stone-800/30 flex flex-col justify-between">
              <span className="text-stone-500 text-[8px] uppercase tracking-wider">
                Simulador
              </span>
              <span
                className="text-cyan-400 font-bold mt-0.5 truncate"
                title={pilot.preferredGame}
              >
                {pilot.preferredGame || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Socials & Modify vehicle / dorsal button */}
        <div className="mt-2.5 pt-2 border-t border-stone-800/30 space-y-1.5 text-[9px] font-mono text-stone-400">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-stone-600 text-[8px] uppercase">
              Steam ID
            </span>
            <span
              className="text-stone-300 font-semibold truncate max-w-[100px]"
              title={pilot.steamId || ""}
            >
              {pilot.steamId || "--"}
            </span>
          </div>

          <div className="flex justify-between items-center px-0.5">
            <span className="text-stone-600 text-[8px] uppercase">
              Instagram
            </span>
            {pilot.instagram ? (
              <span
                className="text-pink-400 font-medium flex items-center gap-0.5 truncate max-w-[100px]"
                title={pilot.instagram}
              >
                <Instagram className="w-2.5 h-2.5 flex-shrink-0" />
                {pilot.instagram}
              </span>
            ) : (
              <span className="text-stone-500">--</span>
            )}
          </div>

          {/* Quick Edit Dorsal / Vehicle button */}
          {canEdit && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={(e) => openEditModal(pilot, e)}
                className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-stone-900/80 hover:bg-cyan-950/40 border border-stone-800 hover:border-cyan-500/40 rounded-lg text-[9.5px] text-stone-300 hover:text-cyan-400 transition-all font-mono font-bold cursor-pointer group/btn"
              >
                <Edit3 className="w-2.5 h-2.5 text-cyan-400 group-hover/btn:scale-110 transition-transform" />
                <span>Editar Asignación</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter leagues to render
  const visibleLeagues =
    filterLeague === "Todas las Ligas"
      ? OFFICIAL_LEAGUES
      : OFFICIAL_LEAGUES.filter((lg) => lg.name === filterLeague);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-stone-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Roster Oficial ALR
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Estructura organizativa por Ligas, Vehículo y Dorsal de Competición
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* League Filter */}
          <div className="flex items-center gap-1.5 bg-[#121215] border border-stone-800 rounded-xl p-1.5 overflow-x-auto">
            <Trophy className="w-3.5 h-3.5 text-amber-400 ml-1 flex-shrink-0" />
            <div className="flex gap-1">
              {leagueFilterOptions.map((lgName) => (
                <button
                  key={lgName}
                  onClick={() => setFilterLeague(lgName)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                    filterLeague === lgName
                      ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "bg-stone-900/60 hover:bg-stone-800 border-stone-800/80 text-stone-400"
                  }`}
                >
                  {lgName}
                </button>
              ))}
            </div>
          </div>

          {/* Simulator Filter */}
          <div className="flex items-center gap-1.5 bg-[#121215] border border-stone-800 rounded-xl p-1.5 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1 flex-shrink-0" />
            <div className="flex gap-1">
              {simulators.map((simName) => (
                <button
                  key={simName}
                  onClick={() => setFilterSimulator(simName)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                    filterSimulator === simName
                      ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                      : "bg-stone-900/60 hover:bg-stone-800 border-stone-800/80 text-stone-400"
                  }`}
                >
                  {simName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Roster Grid Content */}
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 gap-8">
            <div className="h-64 bg-[#111113] border border-stone-800 rounded-2xl" />
            <div className="h-64 bg-[#111113] border border-stone-800 rounded-2xl" />
          </div>
        </div>
      ) : filteredPilots.length === 0 ? (
        <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-stone-600 mx-auto animate-spin" />
          <h3 className="font-bold text-stone-400 font-mono">
            SIN PILOTOS REGISTRADOS
          </h3>
          <p className="text-stone-500 text-xs">
            No hay pilotos homologados bajo los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* Loop over Official Leagues */}
          {visibleLeagues.map((league) => {
            const leagueVehicles = OFFICIAL_VEHICLES.filter(
              (v) => v.league === league.id
            );

            // Total pilots participating in this league
            const totalLeaguePilots = filteredPilots.filter((p) => {
              const pLeagues = getPilotLeagues(p);
              return pLeagues.includes(league.name);
            });

            return (
              <div
                key={league.id}
                className="bg-[#121215] border border-stone-800 rounded-2xl p-5 md:p-7 space-y-6 shadow-2xl relative overflow-hidden"
              >
                {/* League Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 bg-stone-900 border border-stone-800 rounded-xl ${league.textColor} shadow-inner`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                          {league.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${league.colorTheme}`}
                        >
                          Liga Oficial
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">
                        {league.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-full text-stone-300 font-bold font-mono self-start sm:self-auto">
                    {totalLeaguePilots.length}{" "}
                    {totalLeaguePilots.length === 1
                      ? "Piloto en Liga"
                      : "Pilotos en Liga"}
                  </span>
                </div>

                {/* Vehicles Grouped inside this League */}
                <div className="space-y-8">
                  {leagueVehicles.map((veh) => {
                    const vehPilots = totalLeaguePilots.filter(
                      (p) => getPilotVehicles(p).includes(veh.id)
                    );

                    // Helper to normalize dorsal numbers (e.g. "05" -> "5", "08" -> "8")
                    const normalizeDorsal = (d?: string) => {
                      if (!d || d === "--") return "";
                      const num = parseInt(d, 10);
                      return isNaN(num) ? d.trim() : String(num);
                    };

                    // Dynamically build all distinct dorsals for this vehicle
                    const defaultDorsals = (veh.defaultDorsals || []).map(normalizeDorsal);
                    const allDorsals = defaultDorsals.length > 0
                      ? Array.from(new Set(defaultDorsals)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                      : Array.from(
                          new Set(
                            vehPilots
                              .flatMap((p) => (p.raceNumber || "").split(",").map((s) => normalizeDorsal(s)))
                              .filter(Boolean)
                          )
                        ).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

                    // Unassigned pilots for this vehicle
                    const unassignedPilots = vehPilots.filter(
                      (p) => !p.raceNumber || p.raceNumber === "--"
                    );

                    return (
                      <div
                        key={veh.id}
                        className={`bg-[#18181c]/70 border ${veh.borderColor} rounded-2xl p-5 space-y-5 shadow-lg relative overflow-hidden`}
                      >
                        {/* Vehicle Sub-header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800/80 pb-3 gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl border ${veh.borderColor} ${veh.bgGlow} ${veh.textColor}`}
                            >
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                  {veh.name}
                                </h4>
                                {veh.year && (
                                  <span className="text-xs text-stone-500 font-mono font-bold">
                                    {veh.year}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                Marca: {veh.brand} • Categoría: {veh.category} • Agrupación Dinámica por Dorsal
                              </p>
                            </div>
                          </div>

                          <span className="text-xs px-3 py-1 bg-stone-900/90 border border-stone-800 rounded-full text-stone-300 font-mono font-bold self-start sm:self-auto">
                            {vehPilots.length}{" "}
                            {vehPilots.length === 1 ? "Corredor" : "Corredores"}
                          </span>
                        </div>

                        {/* Grid of Dynamic Dorsals for this Vehicle */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {allDorsals.map((dorsalNum) => {
                            const dorsalPilots = vehPilots.filter((p) => {
                              const pDorsals = (p.raceNumber || "")
                                .split(",")
                                .map((s) => normalizeDorsal(s))
                                .filter(Boolean);
                              return pDorsals.includes(dorsalNum);
                            });

                            return (
                              <div
                                key={dorsalNum}
                                className={`bg-[#131316]/90 border ${veh.borderColor} rounded-xl p-4 space-y-3.5 shadow-inner`}
                              >
                                {/* Dorsal Header */}
                                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Hash className={`w-4 h-4 ${veh.textColor}`} />
                                    <span
                                      className={`font-mono text-xs font-black uppercase tracking-wider ${veh.textColor}`}
                                    >
                                      Asiento / Dorsal #{dorsalNum}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-stone-500 font-bold">
                                    {dorsalPilots.length}{" "}
                                    {dorsalPilots.length === 1 ? "Piloto" : "Pilotos"}
                                  </span>
                                </div>

                                {/* Pilots inside this specific Dorsal Box */}
                                {dorsalPilots.length === 0 ? (
                                  <div className="py-5 text-center text-xs font-mono text-stone-600 border border-dashed border-stone-800/60 rounded-lg">
                                    Asiento oficial #{dorsalNum} disponible
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {dorsalPilots.map((pilot) =>
                                      renderPilotCard(pilot, veh)
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Unassigned Dorsal Box if needed */}
                          {unassignedPilots.length > 0 && (
                            <div className="bg-[#131316]/90 border border-stone-800 rounded-xl p-4 space-y-3.5 shadow-inner">
                              <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                                <span className="font-mono text-xs font-black uppercase tracking-wider text-amber-400">
                                  Dorsal Pendiente / Asignar
                                </span>
                                <span className="text-[10px] font-mono text-stone-500 font-bold">
                                  {unassignedPilots.length} Pilotos
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {unassignedPilots.map((pilot) =>
                                  renderPilotCard(pilot, veh)
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* General Box for Reserves / Banca */}
          {(() => {
            const isFilteredByLeague = filterLeague !== "Todas las Ligas";

            const reservePilots = filteredPilots
              .filter((p) => {
                if (isFilteredByLeague) {
                  // If filtering by a specific league, drivers who are NOT in this league OR don't have a vehicle in this league go to Reserve!
                  const pLeagues = getPilotLeagues(p);
                  if (!pLeagues.includes(filterLeague)) return true;

                  const vList = getPilotVehicles(p);
                  const leagueVehicles = OFFICIAL_VEHICLES.filter(
                    (v) => v.league === filterLeague
                  ).map((v) => v.id);
                  const hasVehicleInThisLeague = vList.some((vId) =>
                    leagueVehicles.includes(vId)
                  );
                  return !hasVehicleInThisLeague;
                } else {
                  // General reserve when viewing All Leagues
                  const vList = getPilotVehicles(p);
                  return (
                    vList.length === 0 ||
                    vList.includes("Reserva") ||
                    vList.includes("Banca")
                  );
                }
              })
              .sort((a, b) => {
                const numA = parseInt(a.raceNumber || "999", 10);
                const numB = parseInt(b.raceNumber || "999", 10);
                return numA - numB;
              });

            return (
              <div className="bg-[#121215] border border-stone-800 rounded-2xl p-6 md:p-7 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-amber-500 shadow-inner">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                        {isFilteredByLeague
                          ? `Banca de Reserva / Sin Asiento en ${filterLeague}`
                          : "Banca de Reserva / Pruebas"}
                      </h3>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">
                        {isFilteredByLeague
                          ? `Pilotos sin vehículo asignado en ${filterLeague} o registrados en otras categorías`
                          : "Pilotos homologados aprobados sin coche o liga asignada actualmente"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-full text-stone-400 font-bold font-mono self-start sm:self-auto">
                    {reservePilots.length}{" "}
                    {reservePilots.length === 1 ? "Piloto" : "Pilotos"}
                  </span>
                </div>

                {reservePilots.length === 0 ? (
                  <div className="bg-[#18181c]/40 border border-stone-800/40 p-6 rounded-xl text-center text-xs font-mono text-stone-500">
                    {isFilteredByLeague
                      ? `Todos los pilotos visibles tienen un vehículo activo en la liga ${filterLeague}.`
                      : "Todos los pilotos oficiales tienen sus ligas y vehículos asignados actualmente."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {reservePilots.map((pilot) => renderPilotCard(pilot))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit Vehicle, Dorsal & Leagues Assignment Modal */}
      {editingPilot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-stone-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Asignación de Ligas / Vehículo / Dorsal
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono truncate max-w-[240px]">
                    Piloto: {editingPilot.displayName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPilot(null)}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAssignment} className="space-y-5">
              {saveError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono">
                  {saveError}
                </div>
              )}

              {/* Leagues Selection (Multi-select) */}
              <div>
                <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Ligas en las que participa (Multi-liga)
                </label>
                <div className="space-y-2">
                  {OFFICIAL_LEAGUES.map((lg) => {
                    const isChecked = editLeagues.includes(lg.name);
                    return (
                      <label
                        key={lg.id}
                        onClick={() => toggleEditLeague(lg.name)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? "bg-amber-950/30 border-amber-500/40 text-amber-200 shadow-inner"
                            : "bg-[#18181b] border-stone-800/80 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold font-mono uppercase">
                            {lg.name}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                            {lg.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-amber-500 border-amber-400 text-black"
                              : "border-stone-700 bg-stone-900"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-500 font-mono mt-1.5">
                  Puedes seleccionar múltiples ligas para que el piloto figure en cada una.
                </p>
              </div>

              {/* Vehicle Selection (Multi-select) */}
              <div>
                <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  Vehículos de Competición Asignados{" "}
                  {editLeagues.length > 0 && (
                    <span className="text-amber-400 font-normal">
                      ({editLeagues.join(" • ")})
                    </span>
                  )}
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(() => {
                    const availableVehicles = OFFICIAL_VEHICLES.filter((v) => {
                      if (editLeagues.length === 0) return true;
                      return editLeagues.includes(v.league);
                    });

                    if (availableVehicles.length === 0) {
                      return (
                        <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl text-center text-stone-500 text-xs font-mono">
                          Selecciona una liga arriba para habilitar sus vehículos de competición.
                        </div>
                      );
                    }

                    return availableVehicles.map((veh) => {
                      const isChecked = editVehicles.includes(veh.id);
                      return (
                        <label
                          key={veh.id}
                          onClick={() => toggleEditVehicle(veh.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200 shadow-inner"
                              : "bg-[#18181b] border-stone-800/80 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold font-mono uppercase text-white">
                              {veh.name}
                            </p>
                            <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                              Liga: <span className="text-amber-400/90">{veh.league}</span> • Categoría: {veh.category}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                              isChecked
                                ? "bg-cyan-500 border-cyan-400 text-black"
                                : "border-stone-700 bg-stone-900"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </label>
                      );
                    });
                  })()}
                </div>
                <p className="text-[10px] text-stone-500 font-mono mt-1.5">
                  Los vehículos se filtran según las ligas seleccionadas arriba. Puedes marcar múltiples vehículos si participas con diferentes coches.
                </p>
              </div>

              {/* Dorsal Selection */}
              {(() => {
                const selectedVehs = OFFICIAL_VEHICLES.filter((v) => editVehicles.includes(v.id));
                const sourceVehs = selectedVehs.length > 0
                  ? selectedVehs
                  : OFFICIAL_VEHICLES.filter((v) => editLeagues.includes(v.league));

                const availableDorsals = Array.from(
                  new Set(sourceVehs.flatMap((v) => v.defaultDorsals || []))
                ).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

                const currentSelectedDorsals = (editRaceNumber || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

                const toggleDorsal = (dorsal: string) => {
                  let updated: string[];
                  if (currentSelectedDorsals.includes(dorsal)) {
                    updated = currentSelectedDorsals.filter((d) => d !== dorsal);
                  } else {
                    updated = [...currentSelectedDorsals, dorsal];
                  }
                  setEditRaceNumber(updated.join(", "));
                };

                return (
                  <div>
                    <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-cyan-400" />
                        Dorsal(es) Oficial(es) Asignado(s)
                      </div>
                      {currentSelectedDorsals.length > 0 && (
                        <span className="text-cyan-400 font-normal">
                          (#{currentSelectedDorsals.join(", #")})
                        </span>
                      )}
                    </label>

                    {availableDorsals.length === 0 ? (
                      <div className="p-3 bg-stone-900/50 border border-stone-800 rounded-xl text-center text-stone-500 text-xs font-mono">
                        Selecciona un vehículo o liga arriba para habilitar sus dorsales oficiales.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableDorsals.map((dorsal) => {
                          const isSelected = currentSelectedDorsals.includes(dorsal);
                          return (
                            <button
                              key={dorsal}
                              type="button"
                              onClick={() => toggleDorsal(dorsal)}
                              className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                                  : "bg-[#18181b] border-stone-800 text-stone-400 hover:border-stone-700 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-stone-500 text-[10px]">Dorsal</span>
                                <span className="text-sm font-black text-white">#{dorsal}</span>
                              </div>
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                  isSelected
                                    ? "bg-cyan-500 border-cyan-400 text-black"
                                    : "border-stone-700 bg-stone-900"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[10px] text-stone-500 font-mono mt-1.5">
                      Puedes seleccionar uno o varios dorsales oficiales según los vehículos asignados al piloto.
                    </p>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingPilot(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar Asignación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
