import React, { useState } from "react";
import { UserProfile } from "../types";
import { Shield, Eye, Hash, Award, RefreshCw, Layers, Instagram } from "lucide-react";
import { COUNTRIES } from "../presets";

interface RosterProps {
  users: UserProfile[];
  isLoading: boolean;
}

export default function Roster({ users, isLoading }: RosterProps) {
  const [filterSimulator, setFilterSimulator] = useState<string>("Todos");

  // Filter roster: anyone whose role is "piloto" or "admin" and whose status is "aprobado"
  // (admins are approved and participate in the roster!)
  const pilots = users.filter(
    (u) => (u.role === "piloto" || u.role === "admin") && u.status === "aprobado"
  ).sort((a,b) => {
    // Admins first, then by dorsal number
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    const numA = parseInt(a.raceNumber || "999");
    const numB = parseInt(b.raceNumber || "999");
    return numA - numB;
  });

  // Extract unique simulators/platfoms for filtering
  const simulators = ["Todos", "Assetto Corsa", "Le Mans Ultimate"];

  const filteredPilots = pilots.filter((p) => {
    if (filterSimulator === "Todos") return true;
    return p.preferredGame === filterSimulator || p.preferredGame === "Ambos";
  });

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
            Plantilla oficial homologada de corredores y comisarios
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

      {/* Grid of driver profiles */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl" />
          <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl" />
          <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl" />
        </div>
      ) : filteredPilots.length === 0 ? (
        <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-stone-600 mx-auto animate-spin" />
          <h3 className="font-bold text-stone-400 font-mono">SIN PILOTOS CORRESPONDIENTES</h3>
          <p className="text-stone-500 text-xs">No hay pilotos homologados oficiales bajo este filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPilots.map((pilot) => {
            const isAdmin = pilot.role === "admin";
            const pilotCountry = COUNTRIES.find((c) => c.code === pilot.country?.toLowerCase());
            return (
              <div
                key={pilot.uid}
                className="bg-[#111113] border border-stone-800/80 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.06)] rounded-2xl p-5 relative overflow-hidden group transition-all duration-300"
              >
                {/* Decorative horizontal lines in the background */}
                <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute top-4 right-4 text-xs font-mono font-bold flex items-center justify-center p-2 rounded-lg bg-stone-900 border border-stone-800 w-10 h-10 shadow-inner">
                  <span className="text-[10px] text-stone-500 font-mono mr-0.5">#</span>
                  <span className={`text-sm font-black tracking-tighter ${
                    pilot.raceNumber === "32" || pilot.raceNumber === "43" ? "text-amber-400 font-extrabold" : "text-cyan-400"
                  }`}>
                    {pilot.raceNumber || "00"}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Photo & Identity header */}
                  <div className="flex items-center gap-4.5">
                    {pilot.photoURL ? (
                      <img
                        src={pilot.photoURL}
                        alt={pilot.displayName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border border-stone-800 object-cover bg-stone-900 ring-2 ring-stone-900 ring-offset-2 ring-offset-stone-950 group-hover:border-cyan-400/50 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-stone-900 text-[#66FCF1] border border-stone-800 flex items-center justify-center text-xs font-mono font-black ring-2 ring-stone-900 ring-offset-2 ring-offset-stone-950">
                        {pilot.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-[#FFFFFF] tracking-tight text-sm">
                          {pilot.displayName}
                        </p>
                        {isAdmin && (
                          <Shield className="w-3.5 h-3.5 text-red-400" title="Administrador de Escudería" />
                        )}
                      </div>
                      
                      <span className={`inline-flex items-center text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isAdmin 
                          ? "bg-red-950/20 text-red-400 border border-red-500/10" 
                          : "bg-cyan-950/20 text-cyan-400 border border-cyan-500/10"
                      }`}>
                        {isAdmin ? "Comisario" : pilot.experience || "Piloto Oficial"}
                      </span>
                    </div>
                  </div>

                  {/* Operational parameters */}
                  <div className="border-t border-stone-800/80 pt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-[#17171a] p-2 rounded-lg border border-stone-800/40">
                      <span className="text-stone-500 text-[10px] font-mono uppercase">Simulador(es)</span>
                      <span className="text-cyan-400 font-bold font-mono text-[11px] truncate max-w-[130px]" title={pilot.preferredGame}>
                        {pilot.preferredGame || "Sin especificar"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#17171a] p-2 rounded-lg border border-stone-800/40">
                      <span className="text-stone-500 text-[10px] font-mono uppercase">Garaje Preferido</span>
                      <span className={`font-bold font-mono text-[11px] truncate max-w-[130px] ${
                        pilot.carPreference?.includes("LMP2") 
                          ? "text-fuchsia-400 font-extrabold" 
                          : pilot.carPreference?.includes("GT3") 
                          ? "text-rose-400 font-extrabold" 
                          : "text-stone-200"
                      }`} title={pilot.carPreference}>
                        {pilot.carPreference || "Sin especificar"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#17171a] p-2 rounded-lg border border-stone-800/40">
                      <span className="text-stone-500 text-[10px] font-mono uppercase">Nacionalidad</span>
                      <span className="text-stone-200 font-bold font-mono text-[11px] flex items-center gap-1.5 truncate max-w-[130px]" title={pilotCountry ? pilotCountry.name : "Sin especificar"}>
                        {pilotCountry ? (
                          <>
                            <img
                              src={`https://flagcdn.com/w40/${pilotCountry.code}.png`}
                              alt={pilotCountry.name}
                              className="w-4 h-3 object-cover rounded-sm border border-stone-800/60 flex-shrink-0"
                            />
                            <span>{pilotCountry.name}</span>
                          </>
                        ) : (
                          "Sin especificar"
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-stone-500 text-[10px] font-mono uppercase">Steam ID</span>
                      <span className="text-cyan-400 font-bold font-mono">{pilot.steamId || "N/A"}</span>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-stone-500 text-[10px] font-mono uppercase">Instagram</span>
                      <span className="text-pink-400 font-semibold font-sans text-xs flex items-center gap-1">
                        <Instagram className="w-3 h-3" />
                        {pilot.instagram || "N/A"}
                      </span>
                    </div>

                    {pilot.appliedAt && (
                      <div className="flex justify-between items-center px-1">
                        <span className="text-stone-500 text-[10px] font-mono uppercase">Licencia desde</span>
                        <span className="text-stone-400 font-mono text-[10px]">
                          {`${String(new Date(pilot.appliedAt).getDate()).padStart(2, '0')}-${String(new Date(pilot.appliedAt).getMonth() + 1).padStart(2, '0')}-${new Date(pilot.appliedAt).getFullYear()}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
