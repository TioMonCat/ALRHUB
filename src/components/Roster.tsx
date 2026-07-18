import React, { useState } from "react";
import { UserProfile } from "../types";
import { COUNTRIES } from "../presets";
import { Shield, Award, RefreshCw, Instagram, Car, Users, HelpCircle } from "lucide-react";

interface RosterProps {
  users: UserProfile[];
  isLoading: boolean;
  onViewPilot: (uid: string) => void;
}

export default function Roster({ users, isLoading, onViewPilot }: RosterProps) {
  const [filterSimulator, setFilterSimulator] = useState<string>("Todos");

  // Filter roster: anyone whose role is "piloto" or "admin" and whose status is "aprobado"
  const pilots = users.filter(
    (u) => (u.role === "piloto" || u.role === "admin") && u.status === "aprobado"
  );

  // Group pilots into active car configurations and reserves:
  // - Ferrari 296 | GT3 -> Dorsals 05, 08
  // - Oreca 07 | LMP2 -> Dorsals 32, 43
  // - Banca / Reserva -> everything else (empty, "--", other dorsals)
  const ferrariPilots = pilots.filter(
    (u) => u.raceNumber === "05" || u.raceNumber === "08"
  ).sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return (a.raceNumber || "").localeCompare(b.raceNumber || "");
  });

  const orecaPilots = pilots.filter(
    (u) => u.raceNumber === "32" || u.raceNumber === "43"
  ).sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return (a.raceNumber || "").localeCompare(b.raceNumber || "");
  });

  const reservePilots = pilots.filter(
    (u) => u.raceNumber !== "05" && u.raceNumber !== "08" && u.raceNumber !== "32" && u.raceNumber !== "43"
  ).sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  // Extract unique simulators/platforms for filtering
  const simulators = ["Todos", "Assetto Corsa", "Le Mans Ultimate"];

  // Apply simulator filters
  const filterByGame = (list: UserProfile[]) => {
    return list.filter((p) => {
      if (filterSimulator === "Todos") return true;
      return p.preferredGame === filterSimulator || p.preferredGame === "Ambos";
    });
  };

  const filteredFerrari = filterByGame(ferrariPilots);
  const filteredOreca = filterByGame(orecaPilots);
  const filteredReserves = filterByGame(reservePilots);

  const totalFilteredCount = filteredFerrari.length + filteredOreca.length + filteredReserves.length;

  const renderPilotCard = (pilot: UserProfile) => {
    const isFerrari = pilot.raceNumber === "05" || pilot.raceNumber === "08";
    const pilotCountry = COUNTRIES.find((c) => c.code === pilot.country?.toLowerCase());
    const isAdmin = pilot.role === "admin";

    return (
      <div
        key={pilot.uid}
        className="bg-[#141416]/90 border border-stone-800/80 hover:border-cyan-500/40 rounded-xl p-4 relative group transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
        onClick={() => onViewPilot(pilot.uid)}
      >
        <div className="space-y-3">
          {/* Header: Avatar, Name, Role, and Dorsal */}
          <div className="flex items-center gap-3">
            {pilot.photoURL ? (
              <img
                src={pilot.photoURL}
                alt={pilot.displayName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-stone-800 object-cover bg-stone-900 group-hover:border-cyan-400/50 transition-all duration-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-900 text-[#66FCF1] border border-stone-800 flex items-center justify-center text-xs font-mono font-black">
                {pilot.displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="font-extrabold text-white tracking-tight text-xs truncate" title={pilot.displayName}>
                  {pilot.displayName}
                </p>
                {isAdmin && (
                  <Shield className="w-3.5 h-3.5 text-red-400 flex-shrink-0" title="Administrador" />
                )}
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
                {isAdmin ? "Comisario" : pilot.experience || "Piloto Oficial"}
              </span>
            </div>

            {/* Big Gorgeous Dorsal Number */}
            <div className="font-mono text-center flex flex-col justify-center items-center bg-[#1c1c1f] border border-stone-800 rounded-lg w-10 h-10 shadow-inner flex-shrink-0">
              <span className="text-[7px] text-stone-500 font-bold uppercase leading-none">Nº</span>
              <span className={`text-sm font-black tracking-tight leading-none ${
                isFerrari ? "text-red-400" : "text-fuchsia-400"
              }`}>
                {pilot.raceNumber || "00"}
              </span>
            </div>
          </div>

          {/* Driver Stats/Details row */}
          <div className="pt-3 border-t border-stone-800/60 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
            {/* Nacionalidad */}
            <div className="bg-[#17171a]/50 p-1.5 rounded border border-stone-800/20 flex flex-col justify-between">
              <span className="text-stone-500 text-[8px] uppercase tracking-wider">Nación</span>
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
            <div className="bg-[#17171a]/50 p-1.5 rounded border border-stone-800/20 flex flex-col justify-between">
              <span className="text-stone-500 text-[8px] uppercase tracking-wider">Simulador</span>
              <span className="text-cyan-400 font-bold mt-0.5 truncate" title={pilot.preferredGame}>
                {pilot.preferredGame || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Technical / Social fields */}
        <div className="mt-3 pt-2.5 border-t border-stone-800/30 space-y-1 text-[9.5px] font-mono text-stone-400">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-stone-600 text-[8.5px] uppercase">Steam ID</span>
            <span className="text-stone-300 font-semibold truncate max-w-[110px]" title={pilot.steamId || ""}>
              {pilot.steamId || "--"}
            </span>
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span className="text-stone-600 text-[8.5px] uppercase">Instagram</span>
            {pilot.instagram ? (
              <span className="text-pink-400 font-medium flex items-center gap-0.5 truncate max-w-[110px]" title={pilot.instagram}>
                <Instagram className="w-2.5 h-2.5 flex-shrink-0" />
                {pilot.instagram}
              </span>
            ) : (
              <span className="text-stone-500">--</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReserveCard = (pilot: UserProfile) => {
    const pilotCountry = COUNTRIES.find((c) => c.code === pilot.country?.toLowerCase());
    const isAdmin = pilot.role === "admin";

    return (
      <div
        key={pilot.uid}
        className="bg-[#111113]/70 border border-stone-800/60 hover:border-amber-500/30 rounded-xl p-4 relative group transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
        onClick={() => onViewPilot(pilot.uid)}
      >
        <div className="space-y-3">
          {/* Header: Avatar, Name, Role, No Dorsal */}
          <div className="flex items-center gap-3">
            {pilot.photoURL ? (
              <img
                src={pilot.photoURL}
                alt={pilot.displayName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-stone-800 object-cover bg-stone-900 filter grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-900/60 text-stone-500 border border-stone-800 flex items-center justify-center text-xs font-mono">
                {pilot.displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="font-bold text-stone-300 tracking-tight text-xs truncate" title={pilot.displayName}>
                  {pilot.displayName}
                </p>
                {isAdmin && (
                  <Shield className="w-3.5 h-3.5 text-red-400/70 flex-shrink-0" title="Administrador" />
                )}
              </div>
              <span className="inline-flex text-[8px] font-mono font-bold uppercase tracking-wider text-amber-500/80 bg-amber-950/10 border border-amber-900/10 px-1.5 py-0.5 rounded">
                Banca / Sin Asiento
              </span>
            </div>

            {/* No Dorsal Badge */}
            <div className="font-mono text-center flex flex-col justify-center items-center bg-stone-900/40 border border-stone-800 rounded-lg w-10 h-10 flex-shrink-0">
              <span className="text-[7px] text-stone-600 font-bold uppercase leading-none">Nº</span>
              <span className="text-xs text-stone-500 font-bold leading-none mt-0.5">--</span>
            </div>
          </div>

          {/* Stats row with preferred garage & nationality */}
          <div className="pt-3 border-t border-stone-800/40 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
            {/* Preferred Garage */}
            <div className="bg-stone-900/30 p-1.5 rounded border border-stone-800/10 flex flex-col justify-between">
              <span className="text-stone-600 text-[8px] uppercase tracking-wider">Garaje</span>
              <span className="text-stone-400 font-bold truncate mt-0.5" title={pilot.carPreference}>
                {pilot.carPreference ? pilot.carPreference.split(" | ")[0] : "Sin definir"}
              </span>
            </div>

            {/* Simulador */}
            <div className="bg-stone-900/30 p-1.5 rounded border border-stone-800/10 flex flex-col justify-between">
              <span className="text-stone-600 text-[8px] uppercase tracking-wider">Simulador</span>
              <span className="text-cyan-500 font-bold truncate mt-0.5" title={pilot.preferredGame}>
                {pilot.preferredGame || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Instagram & Steam ID */}
        <div className="mt-3 pt-2.5 border-t border-stone-800/20 space-y-1 text-[9.5px] font-mono text-stone-500">
          <div className="flex justify-between items-center px-0.5">
            <span>Steam ID</span>
            <span className="text-stone-400 truncate max-w-[110px]" title={pilot.steamId || ""}>
              {pilot.steamId || "--"}
            </span>
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span>Instagram</span>
            {pilot.instagram ? (
              <span className="text-pink-500/70 font-medium flex items-center gap-0.5 truncate max-w-[110px]" title={pilot.instagram}>
                <Instagram className="w-2.5 h-2.5 flex-shrink-0" />
                {pilot.instagram}
              </span>
            ) : (
              <span>--</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Roster Oficial ALR
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Plantilla de corredores clasificados por vehículo y divisiones oficiales
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

      {/* Grid of driver profiles categorized by vehicles */}
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-[#111113] border border-stone-800 rounded-2xl" />
            <div className="h-64 bg-[#111113] border border-stone-800 rounded-2xl" />
          </div>
          <div className="h-44 bg-[#111113] border border-stone-800 rounded-2xl" />
        </div>
      ) : totalFilteredCount === 0 ? (
        <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-stone-600 mx-auto animate-spin" />
          <h3 className="font-bold text-stone-400 font-mono">SIN PILOTOS REGISTRADOS</h3>
          <p className="text-stone-500 text-xs">No hay pilotos homologados oficiales bajo el simulador seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Active squads list */}
          
          {/* Ferrari 296 GT3 Section */}
          <div className="bg-[#141011]/40 border border-red-500/15 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-red-950/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                    Ferrari 296 GT3
                  </h3>
                  <p className="text-[10px] text-red-500/80 font-mono uppercase tracking-widest">
                    División GT3 • Asientos oficiales #05 / #08
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-red-950/30 border border-red-500/20 rounded-full text-red-400 font-bold font-mono">
                {filteredFerrari.length} {filteredFerrari.length === 1 ? "Piloto" : "Pilotos"}
              </span>
            </div>

            {filteredFerrari.length === 0 ? (
              <div className="bg-[#111113]/40 border border-stone-800/40 p-8 rounded-xl text-center text-xs font-mono text-stone-500">
                Ningún piloto activo en pista con este filtro.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coche #05 */}
                <div className="bg-[#1a1213]/40 border border-red-500/10 rounded-xl p-4 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-red-950/40 pb-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Coche #05
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {filteredFerrari.filter(p => p.raceNumber === "05").length} {filteredFerrari.filter(p => p.raceNumber === "05").length === 1 ? "Piloto" : "Pilotos"}
                    </span>
                  </div>
                  {filteredFerrari.filter(p => p.raceNumber === "05").length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-[10px] text-stone-600 font-mono italic">Sin pilotos asignados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredFerrari.filter(p => p.raceNumber === "05").map((pilot) => renderPilotCard(pilot))}
                    </div>
                  )}
                </div>

                {/* Coche #08 */}
                <div className="bg-[#1a1213]/40 border border-red-500/10 rounded-xl p-4 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-red-950/40 pb-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Coche #08
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {filteredFerrari.filter(p => p.raceNumber === "08").length} {filteredFerrari.filter(p => p.raceNumber === "08").length === 1 ? "Piloto" : "Pilotos"}
                    </span>
                  </div>
                  {filteredFerrari.filter(p => p.raceNumber === "08").length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-[10px] text-stone-600 font-mono italic">Sin pilotos asignados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredFerrari.filter(p => p.raceNumber === "08").map((pilot) => renderPilotCard(pilot))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Oreca 07 LMP2 Section */}
          <div className="bg-[#111014]/40 border border-fuchsia-500/15 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-fuchsia-950/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-xl text-fuchsia-400">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                    Oreca 07 LMP2
                  </h3>
                  <p className="text-[10px] text-fuchsia-500/80 font-mono uppercase tracking-widest">
                    División Prototipos • Asientos oficiales #32 / #43
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-fuchsia-950/30 border border-fuchsia-500/20 rounded-full text-fuchsia-400 font-bold font-mono">
                {filteredOreca.length} {filteredOreca.length === 1 ? "Piloto" : "Pilotos"}
              </span>
            </div>

            {filteredOreca.length === 0 ? (
              <div className="bg-[#111113]/40 border border-stone-800/40 p-8 rounded-xl text-center text-xs font-mono text-stone-500">
                Ningún piloto activo en pista con este filtro.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coche #32 */}
                <div className="bg-[#141217]/40 border border-fuchsia-500/10 rounded-xl p-4 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-fuchsia-950/40 pb-2">
                    <span className="text-xs font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                      Coche #32
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {filteredOreca.filter(p => p.raceNumber === "32").length} {filteredOreca.filter(p => p.raceNumber === "32").length === 1 ? "Piloto" : "Pilotos"}
                    </span>
                  </div>
                  {filteredOreca.filter(p => p.raceNumber === "32").length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-[10px] text-stone-600 font-mono italic">Sin pilotos asignados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredOreca.filter(p => p.raceNumber === "32").map((pilot) => renderPilotCard(pilot))}
                    </div>
                  )}
                </div>

                {/* Coche #43 */}
                <div className="bg-[#141217]/40 border border-fuchsia-500/10 rounded-xl p-4 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-fuchsia-950/40 pb-2">
                    <span className="text-xs font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                      Coche #43
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {filteredOreca.filter(p => p.raceNumber === "43").length} {filteredOreca.filter(p => p.raceNumber === "43").length === 1 ? "Piloto" : "Pilotos"}
                    </span>
                  </div>
                  {filteredOreca.filter(p => p.raceNumber === "43").length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-[10px] text-stone-600 font-mono italic">Sin pilotos asignados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredOreca.filter(p => p.raceNumber === "43").map((pilot) => renderPilotCard(pilot))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reserve list / Banca */}
          <div className="bg-stone-950/30 border border-stone-800/60 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800/80 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-900 border border-stone-800 rounded-xl text-amber-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Banca de Reserva / Pruebas
                  </h3>
                  <p className="text-[10px] text-stone-500 font-mono">
                    Pilotos oficiales aprobados sin dorsal oficial asignado en pista
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-full text-stone-400 font-bold font-mono self-start sm:self-auto">
                {filteredReserves.length} {filteredReserves.length === 1 ? "Piloto" : "Pilotos"}
              </span>
            </div>

            {filteredReserves.length === 0 ? (
              <div className="bg-[#111113]/20 border border-stone-800/40 p-6 rounded-xl text-center text-xs font-mono text-stone-500">
                Todos los pilotos oficiales tienen asientos activos asignados actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredReserves.map((pilot) => renderReserveCard(pilot))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
