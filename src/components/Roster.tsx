import React, { useState } from "react";
import { UserProfile } from "../types";
import { COUNTRIES, OFFICIAL_VEHICLES, OfficialVehicle } from "../presets";
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

  // State for vehicle / dorsal assignment edit modal
  const [editingPilot, setEditingPilot] = useState<UserProfile | null>(null);
  const [editCarPref, setEditCarPref] = useState<string>("");
  const [editRaceNumber, setEditRaceNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Filter roster: anyone whose role is "piloto" or "admin" and whose status is "aprobado"
  const pilots = users.filter(
    (u) => (u.role === "piloto" || u.role === "admin") && u.status === "aprobado"
  );

  // Helper to resolve which vehicle a pilot belongs to
  const getPilotVehicle = (pilot: UserProfile): string => {
    const pref = pilot.carPreference || "";
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

    return "Reserva";
  };

  // Extract unique simulators/platforms for filtering
  const simulators = ["Todos", "Assetto Corsa", "Le Mans Ultimate"];

  // Filter list by simulator
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
    setEditCarPref(pilot.carPreference || getPilotVehicle(pilot));
    setEditRaceNumber(pilot.raceNumber || "");
    setSaveError(null);
  };

  // Save updated vehicle and dorsal assignment to Firestore
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPilot) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const userRef = doc(db, "users", editingPilot.uid);
      await updateDoc(userRef, {
        carPreference: editCarPref,
        raceNumber: editRaceNumber,
      });

      // Update in-memory reference
      editingPilot.carPreference = editCarPref;
      editingPilot.raceNumber = editRaceNumber;

      setEditingPilot(null);
    } catch (err: any) {
      console.error("Error updating assignment:", err);
      setSaveError(
        err?.message || "Error al actualizar asignación del vehículo"
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

  // Group vehicles by category
  const categories: Array<{
    id: "GT3" | "LMP2";
    title: string;
    subtitle: string;
    colorTheme: string;
  }> = [
    {
      id: "GT3",
      title: "Categoría Gran Turismo (GT3)",
      subtitle: "Competición de Turismos GT3 de alta carga aerodinámica",
      colorTheme: "border-red-500/30 bg-red-950/10 text-red-400",
    },
    {
      id: "LMP2",
      title: "Categoría Prototipos (LMP2)",
      subtitle: "División Le Mans Prototype 2 de máxima velocidad en curva",
      colorTheme: "border-fuchsia-500/30 bg-fuchsia-950/10 text-fuchsia-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Roster Oficial ALR
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Estructura jerárquica por Categoría, Vehículo y Dorsal de Competición
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 self-start sm:self-center">
          {simulators.map((simName) => (
            <button
              key={simName}
              onClick={() => setFilterSimulator(simName)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                filterSimulator === simName
                  ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  : "bg-stone-900/60 hover:bg-stone-800 border-stone-800 text-stone-400"
              }`}
            >
              {simName}
            </button>
          ))}
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
            No hay pilotos homologados bajo el simulador seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* Loop over General Categories */}
          {categories.map((cat) => {
            const catVehicles = OFFICIAL_VEHICLES.filter(
              (v) => v.category === cat.id
            );

            // Total pilots in this category
            const totalCatPilots = filteredPilots.filter((p) => {
              const vehId = getPilotVehicle(p);
              return catVehicles.some((v) => v.id === vehId);
            });

            return (
              <div
                key={cat.id}
                className="bg-[#121215] border border-stone-800 rounded-2xl p-5 md:p-7 space-y-6 shadow-2xl relative overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-cyan-400 shadow-inner">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                          {cat.title}
                        </h3>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${cat.colorTheme}`}
                        >
                          {cat.id}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">
                        {cat.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-full text-stone-300 font-bold font-mono self-start sm:self-auto">
                    {totalCatPilots.length}{" "}
                    {totalCatPilots.length === 1
                      ? "Piloto en Categoría"
                      : "Pilotos en Categoría"}
                  </span>
                </div>

                {/* Vehicles Grouped inside this Category */}
                <div className="space-y-8">
                  {catVehicles.map((veh) => {
                    const vehPilots = filteredPilots.filter(
                      (p) => getPilotVehicle(p) === veh.id
                    );

                    // Helper to normalize dorsal numbers (e.g. "05" -> "5", "08" -> "8")
                    const normalizeDorsal = (d?: string) => {
                      if (!d || d === "--") return "";
                      const num = parseInt(d, 10);
                      return isNaN(num) ? d.trim() : String(num);
                    };

                    // Dynamically build all distinct dorsals for this vehicle
                    const defaultDorsals = (veh.defaultDorsals || []).map(normalizeDorsal);
                    const customDorsals = vehPilots
                      .map((p) => normalizeDorsal(p.raceNumber))
                      .filter(Boolean);

                    const allDorsals = Array.from(
                      new Set([...defaultDorsals, ...customDorsals])
                    ).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

                    // Add an unassigned dorsal box if there are pilots for this vehicle with no dorsal
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
                                Marca: {veh.brand} • Agrupación Dinámica por Dorsal
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
                            const dorsalPilots = vehPilots.filter(
                              (p) => normalizeDorsal(p.raceNumber) === dorsalNum
                            );

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
                                      Asiento / Dorsals #{dorsalNum}
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
            const reservePilots = filteredPilots
              .filter((p) => getPilotVehicle(p) === "Reserva")
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
                        Banca de Reserva / Pruebas
                      </h3>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">
                        Pilotos homologados aprobados sin coche asignado actualmente
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
                    Todos los pilotos oficiales tienen una categoría y coche asignado actualmente.
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

      {/* Edit Vehicle & Dorsal Assignment Modal */}
      {editingPilot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Asignación de Vehículo / Dorsal
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono truncate max-w-[220px]">
                    {editingPilot.displayName}
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
            <form onSubmit={handleSaveAssignment} className="space-y-4">
              {saveError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono">
                  {saveError}
                </div>
              )}

              {/* Vehicle Selection */}
              <div>
                <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1.5 font-bold">
                  Vehículo de Competición
                </label>
                <select
                  required
                  value={editCarPref}
                  onChange={(e) => {
                    const newVehId = e.target.value;
                    setEditCarPref(newVehId);
                    const foundVeh = OFFICIAL_VEHICLES.find((v) => v.id === newVehId);
                    if (foundVeh && foundVeh.defaultDorsals && foundVeh.defaultDorsals.length > 0) {
                      if (!foundVeh.defaultDorsals.includes(editRaceNumber)) {
                        setEditRaceNumber(foundVeh.defaultDorsals[0]);
                      }
                    } else {
                      setEditRaceNumber("--");
                    }
                  }}
                  className="w-full bg-[#18181b] border border-stone-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Sin Vehículo (Banca de Reserva) --</option>
                  {OFFICIAL_VEHICLES.map((veh) => (
                    <option key={veh.id} value={veh.id}>
                      {veh.name} ({veh.category})
                    </option>
                  ))}
                  <option value="Banca">Banca / Sin Asiento</option>
                </select>
                <p className="text-[10px] text-stone-500 font-mono mt-1">
                  El corredor se agrupará dinámicamente en su categoría y vehículo en el Roster.
                </p>
              </div>

              {/* Dorsal Selection */}
              {(() => {
                const selectedVeh = OFFICIAL_VEHICLES.find((v) => v.id === editCarPref);
                const defaultDorsals = selectedVeh?.defaultDorsals || [];

                if (selectedVeh && defaultDorsals.length > 0) {
                  return (
                    <div>
                      <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1.5 font-bold">
                        Seleccionar Dorsal de {selectedVeh.brand}
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {defaultDorsals.map((dorsal) => {
                          const isSelected = editRaceNumber === dorsal;
                          return (
                            <button
                              key={dorsal}
                              type="button"
                              onClick={() => setEditRaceNumber(dorsal)}
                              className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isSelected
                                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                  : "bg-[#18181b] border-stone-800 text-stone-400 hover:border-stone-700 hover:text-white"
                              }`}
                            >
                              <span>Dorsal</span>
                              <span className="text-sm font-black text-white">#{dorsal}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="O escribir dorsal personalizado..."
                          value={editRaceNumber}
                          onChange={(e) => setEditRaceNumber(e.target.value)}
                          className="w-full bg-[#18181b] border border-stone-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 placeholder:text-stone-600"
                        />
                      </div>
                      <p className="text-[10px] text-stone-500 font-mono mt-1">
                        Asigna directamente al asiento de este dorsal en el equipo.
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1.5 font-bold">
                      Número de Dorsal / Coche
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 5, 8, 23, 91, 32, 43..."
                      value={editRaceNumber}
                      onChange={(e) => setEditRaceNumber(e.target.value)}
                      className="w-full bg-[#18181b] border border-stone-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[10px] text-stone-500 font-mono mt-1">
                      Dorsal oficial visible en el recuadro de asiento.
                    </p>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
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
