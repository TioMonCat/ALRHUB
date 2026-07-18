import React, { useState } from "react";
import { Fuel, Clock, AlertCircle, Users, Zap, Layers, RefreshCw, Info } from "lucide-react";

interface FuelCalculatorProps {
  onClose?: () => void;
}

export default function FuelCalculator({ onClose }: FuelCalculatorProps) {
  // Category Select
  const [selectedCategory, setSelectedCategory] = useState<"GT3" | "LMP2">("GT3");

  // Inputs as strings to allow typing, clearing, and pasting without jumping
  const [raceDurationHours, setRaceDurationHours] = useState<string>("6"); // Default 6 Hours race
  const [lapMin, setLapMin] = useState<string>("1");
  const [lapSec, setLapSec] = useState<string>("45");
  const [consumption, setConsumption] = useState<string>("3.1");
  const [tankCapacity, setTankCapacity] = useState<string>("110");
  const [safetyMargin, setSafetyMargin] = useState<string>("2"); // Default 2 laps safety margin for endurance

  // Driver Change / Stint Inputs
  const [maxDriverStintMin, setMaxDriverStintMin] = useState<string>("65"); // Maximum continuous minutes a driver can do
  const [numDrivers, setNumDrivers] = useState<number>(3); // Standard 3 drivers for endurance

  // Apply quick endurance presets for GT3 and LMP2 (updating string states)
  const applyCategoryPreset = (category: "GT3" | "LMP2") => {
    setSelectedCategory(category);
    if (category === "GT3") {
      setLapMin("1");
      setLapSec("45");
      setConsumption("3.1");
      setTankCapacity("120");
      setMaxDriverStintMin("65");
    } else {
      setLapMin("1");
      setLapSec("35");
      setConsumption("3.7");
      setTankCapacity("75");
      setMaxDriverStintMin("50");
    }
  };

  // Real-time parsed numbers
  const numDurationHours = parseFloat(raceDurationHours);
  const numLapMin = parseInt(lapMin);
  const numLapSec = parseInt(lapSec);
  const numConsumption = parseFloat(consumption);
  const numTankCapacity = parseFloat(tankCapacity);
  const numSafetyMargin = parseFloat(safetyMargin);
  const numMaxDriverStintMin = parseFloat(maxDriverStintMin);

  // Real-time input validation errors
  const errors: { [key: string]: string } = {};

  if (raceDurationHours.trim() === "") {
    errors.duration = "Requerido";
  } else if (isNaN(numDurationHours) || numDurationHours <= 0) {
    errors.duration = "Debe ser mayor que 0";
  }

  const isLapMinEmpty = lapMin.trim() === "";
  const isLapSecEmpty = lapSec.trim() === "";
  const totalLapSecondsCheck = (isLapMinEmpty ? 0 : numLapMin) * 60 + (isLapSecEmpty ? 0 : numLapSec);

  if (isLapMinEmpty && isLapSecEmpty) {
    errors.laptime = "Requerido";
  } else if (isNaN(numLapMin) || numLapMin < 0 || isNaN(numLapSec) || numLapSec < 0) {
    errors.laptime = "Números válidos";
  } else if (totalLapSecondsCheck <= 0) {
    errors.laptime = "Mayor que 0s";
  } else if (numLapSec >= 60) {
    errors.laptime = "Segundos < 60";
  }

  if (consumption.trim() === "") {
    errors.consumption = "Requerido";
  } else if (isNaN(numConsumption) || numConsumption <= 0) {
    errors.consumption = "Debe ser mayor que 0";
  }

  if (safetyMargin.trim() === "") {
    errors.safetyMargin = "Requerido";
  } else if (isNaN(numSafetyMargin) || numSafetyMargin < 0) {
    errors.safetyMargin = "Debe ser 0 o mayor";
  }

  if (tankCapacity.trim() === "") {
    errors.tankCapacity = "Requerido";
  } else if (isNaN(numTankCapacity) || numTankCapacity <= 0) {
    errors.tankCapacity = "Debe ser mayor que 0";
  }

  if (maxDriverStintMin.trim() === "") {
    errors.maxStint = "Requerido";
  } else if (isNaN(numMaxDriverStintMin) || numMaxDriverStintMin <= 0) {
    errors.maxStint = "Debe ser mayor que 0";
  }

  const hasAnyErrors = Object.keys(errors).length > 0;

  // Calculaciones seguras con respaldo
  const parsedDurationHours = isNaN(numDurationHours) || numDurationHours < 0 ? 0 : numDurationHours;
  const parsedLapMin = isNaN(numLapMin) || numLapMin < 0 ? 0 : numLapMin;
  const parsedLapSec = isNaN(numLapSec) || numLapSec < 0 ? 0 : numLapSec;
  const parsedConsumption = isNaN(numConsumption) || numConsumption < 0 ? 0 : numConsumption;
  const parsedTankCapacity = isNaN(numTankCapacity) || numTankCapacity < 0 ? 0 : numTankCapacity;
  const parsedSafetyMargin = isNaN(numSafetyMargin) || numSafetyMargin < 0 ? 0 : numSafetyMargin;
  const parsedMaxDriverStintMin = isNaN(numMaxDriverStintMin) || numMaxDriverStintMin < 0 ? 0 : numMaxDriverStintMin;

  const lapTimeSeconds = (parsedLapMin * 60) + parsedLapSec;
  const raceDurationMinutes = parsedDurationHours * 60;
  const raceDurationSeconds = raceDurationMinutes * 60;

  // Total Laps in the entire endurance race
  const totalLaps = lapTimeSeconds > 0 ? Math.ceil(raceDurationSeconds / lapTimeSeconds) : 0;

  // Total fuel needed for the whole race (base and safe)
  const totalBaseFuel = totalLaps * parsedConsumption;
  const totalSafeFuel = (totalLaps + parsedSafetyMargin) * parsedConsumption;

  // Fuel Stint Autonomy
  const tankMaxLaps = parsedConsumption > 0 ? Math.floor(parsedTankCapacity / parsedConsumption) : 0;
  const fuelStintDurationMin = lapTimeSeconds > 0 ? Math.floor((tankMaxLaps * lapTimeSeconds) / 60) : 0;

  // Number of fuel stints needed to finish the race
  const requiredFuelStints = fuelStintDurationMin > 0 ? Math.ceil(raceDurationMinutes / fuelStintDurationMin) : 1;

  // Real-world logic: the car must stop when either fuel is depleted OR driver reaches max stint limit.
  const maxTimeBetweenStopsMin = Math.min(fuelStintDurationMin, parsedMaxDriverStintMin);
  const totalRequiredPitStops = maxTimeBetweenStopsMin > 0 ? Math.ceil(raceDurationMinutes / maxTimeBetweenStopsMin) - 1 : 0;

  // Driver names helper
  const driverLabels = ["Piloto A", "Piloto B", "Piloto C", "Piloto D"];
  const activeDrivers = driverLabels.slice(0, numDrivers);

  // Generate sequence of driver rotations for stints
  const getRotationSequence = () => {
    const sequence = [];
    for (let i = 0; i < Math.max(1, totalRequiredPitStops + 1); i++) {
      sequence.push(activeDrivers[i % numDrivers]);
    }
    return sequence;
  };

  const rotationSequence = getRotationSequence();

  // Fuel Calculation details per Pit Stop:
  // Initial fill to start the race: We always start with a full tank OR exactly what's needed if it's less than a full tank (highly rare in endurance, but correct).
  const initialFuelLoad = Math.min(parsedTankCapacity, totalSafeFuel);

  // Remaining fuel needed after the initial stint
  const totalRemainingFuel = Math.max(0, totalSafeFuel - initialFuelLoad);

  // Calculation of liters to refill per stop:
  // How much fuel do we consume during one dynamic stint?
  const lapsPerStint = lapTimeSeconds > 0 ? (maxTimeBetweenStopsMin * 60) / lapTimeSeconds : 0;
  const fuelConsumedPerStint = lapsPerStint * parsedConsumption;
  
  // Refill amount: for standard stops, we fill the car up to its maximum capacity to complete the stint.
  // Unless it's the last stop, which may only require a "Splash" to finish the race.
  // Let's calculate standard regular refill (mostly a full tank or exactly what was consumed since the last stop)
  const regularRefillLitres = Math.min(parsedTankCapacity, fuelConsumedPerStint);

  return (
    <div className="bg-[#09090C]/95 border border-[#1e1f26] rounded-2xl overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)] backdrop-blur-md w-full max-w-xl mx-auto font-mono">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-red-950/25 via-stone-900/10 to-transparent p-4 border-b border-stone-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#FF3C3C]/10 rounded-lg border border-[#FF3C3C]/20">
            <Fuel className="w-5 h-5 text-[#FF3C3C]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>⛽ CALCULADORA DE RESISTENCIA APEX</span>
            </h3>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">Estrategia de Stints, Cargas y Relevos</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-[#FF3C3C] transition-colors text-xs p-1.5 rounded hover:bg-stone-900 cursor-pointer font-bold"
          >
            ✕ CERRAR
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Toggle Category & Quick Stint Info */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => applyCategoryPreset("GT3")}
            className={`py-2 rounded-xl transition-all border font-bold text-center cursor-pointer text-xs flex flex-col items-center justify-center gap-1
              ${selectedCategory === "GT3" 
                ? "bg-stone-900/90 border-[#66FCF1] text-[#66FCF1] shadow-[0_0_15px_rgba(102,252,241,0.1)]" 
                : "bg-black/30 border-stone-850 text-stone-400 hover:text-stone-200 hover:border-stone-700"}`}
          >
            <span className="text-[13px] tracking-wider">🏎️ GT3 RESISTENCIA</span>
            <span className="text-[9px] text-stone-500 font-normal">Capacidad: 120L • ~3.1L/V</span>
          </button>
          
          <button
            type="button"
            onClick={() => applyCategoryPreset("LMP2")}
            className={`py-2 rounded-xl transition-all border font-bold text-center cursor-pointer text-xs flex flex-col items-center justify-center gap-1
              ${selectedCategory === "LMP2" 
                ? "bg-stone-900/90 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                : "bg-black/30 border-stone-850 text-stone-400 hover:text-stone-200 hover:border-stone-700"}`}
          >
            <span className="text-[13px] tracking-wider">🚀 LMP2 RESISTENCIA</span>
            <span className="text-[9px] text-stone-500 font-normal">Capacidad: 75L • ~3.7L/V</span>
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Section 1: Race Settings */}
          <div className="space-y-4 p-3.5 bg-black/45 border border-stone-900 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-bold text-red-500 tracking-wider uppercase block border-b border-stone-850 pb-1 mb-3">
                ⏱️ PARÁMETROS DE CARRERA
              </span>

              {/* Race Duration Input */}
              <div className="mb-3">
                <label className="text-[9.5px] text-stone-400 font-bold uppercase block mb-1">Duración Total Carrera</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={raceDurationHours} 
                    onChange={(e) => setRaceDurationHours(e.target.value)} 
                    className={`w-full bg-[#121215] border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-colors
                      ${errors.duration ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                  />
                  <span className="absolute right-3 text-[10px] text-stone-500 font-bold">Horas</span>
                </div>
                {errors.duration && (
                  <span className="text-[9px] text-red-500 font-bold block mt-1">⚠️ {errors.duration}</span>
                )}
                
                {/* Duration Presets featuring 4H */}
                <div className="flex gap-1 mt-1.5">
                  {[3, 4, 6, 12, 24].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setRaceDurationHours(h.toString())}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer border
                        ${raceDurationHours === h.toString() 
                          ? "bg-red-950/20 border-red-500 text-red-400 font-black" 
                          : "bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200"}`}
                    >
                      {h}H
                    </button>
                  ))}
                </div>
              </div>

              {/* Mean Lap Time Input */}
              <div className="mb-3">
                <label className="text-[9.5px] text-stone-400 font-bold uppercase block mb-1">Tiempo de Vuelta Promedio</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      placeholder="M"
                      value={lapMin} 
                      onChange={(e) => setLapMin(e.target.value)} 
                      className={`w-full bg-[#121215] border rounded-lg px-2.5 py-1.5 text-xs text-center text-white focus:outline-none transition-colors
                        ${errors.laptime ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                    />
                    <span className="absolute right-2 text-[8px] text-stone-500 font-bold">M</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      placeholder="S"
                      value={lapSec} 
                      onChange={(e) => setLapSec(e.target.value)} 
                      className={`w-full bg-[#121215] border rounded-lg px-2.5 py-1.5 text-xs text-center text-white focus:outline-none transition-colors
                        ${errors.laptime ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                    />
                    <span className="absolute right-2 text-[8px] text-stone-500 font-bold">S</span>
                  </div>
                </div>
                {errors.laptime && (
                  <span className="text-[9px] text-red-500 font-bold block mt-1">⚠️ {errors.laptime}</span>
                )}
              </div>

              {/* Consumption Input */}
              <div className="mb-1">
                <label className="text-[9.5px] text-stone-400 font-bold uppercase block mb-1">Consumo Litros/Vuelta</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={consumption} 
                    onChange={(e) => setConsumption(e.target.value)} 
                    className={`w-full bg-[#121215] border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-colors
                      ${errors.consumption ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                  />
                  <span className="absolute right-3 text-[10px] text-stone-500 font-bold">L / Vuelta</span>
                </div>
                {errors.consumption && (
                  <span className="text-[9px] text-red-500 font-bold block mt-1">⚠️ {errors.consumption}</span>
                )}
              </div>
            </div>

            <div className="pt-2 text-stone-500 text-[10px] font-semibold border-t border-stone-900 mt-2">
              ⏱️ Vuelta calculada: <span className="text-white font-black">{lapTimeSeconds} segundos</span>
            </div>
          </div>

          {/* Section 2: Driver & Strategy Settings */}
          <div className="space-y-4 p-3.5 bg-black/45 border border-stone-900 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-bold text-red-500 tracking-wider uppercase block border-b border-stone-850 pb-1 mb-3">
                👥 RELEVOS Y PILOTOS
              </span>

              {/* Driver Count Selection */}
              <div className="mb-3">
                <label className="text-[9.5px] text-stone-400 font-bold uppercase block mb-1">Pilotos Disponibles</label>
                <div className="grid grid-cols-3 gap-1">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumDrivers(num)}
                      className={`py-1 rounded font-bold text-xs transition-colors cursor-pointer border
                        ${numDrivers === num 
                          ? "bg-[#FF3C3C]/10 border-red-500 text-red-400" 
                          : "bg-[#121215] border-stone-800 text-stone-500 hover:text-stone-300"}`}
                    >
                      {num} Pilotos
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Driver Stint Input */}
              <div className="mb-3">
                <label className="text-[9.5px] text-stone-400 font-bold uppercase block mb-1">Tiempo Máx. Conducción (Stint)</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={maxDriverStintMin} 
                    onChange={(e) => setMaxDriverStintMin(e.target.value)} 
                    className={`w-full bg-[#121215] border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-colors
                      ${errors.maxStint ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                  />
                  <span className="absolute right-3 text-[10px] text-stone-500 font-bold">Minutos</span>
                </div>
                {errors.maxStint ? (
                  <span className="text-[9px] text-red-500 font-bold block mt-1">⚠️ {errors.maxStint}</span>
                ) : (
                  <span className="text-[7.5px] text-stone-500 block mt-0.5">Límite por reglamento o cansancio</span>
                )}
              </div>

              {/* Fuel Margins & Capacity */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-[9.5px] text-stone-400 font-bold uppercase block">DEPÓSITO MÁX. AUTO</label>
                    <div className="relative group/tooltip">
                      <Info className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 bg-[#121215] border border-stone-800 text-[8.5px] font-bold text-stone-300 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 shadow-xl leading-normal">
                        La capacidad máxima física del tanque de combustible de tu coche (ej: 120L en GT3, 75L en LMP2).
                      </div>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={tankCapacity} 
                    onChange={(e) => setTankCapacity(e.target.value)} 
                    className={`w-full bg-[#121215] border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-colors
                      ${errors.tankCapacity ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                  />
                  {errors.tankCapacity && (
                    <span className="text-[9px] text-red-500 font-bold block mt-1">⚠️ {errors.tankCapacity}</span>
                  )}
                </div>

                <div>
                  <label className="text-[9.5px] text-stone-400 font-bold uppercase block mb-1">Margen (Vueltas)</label>
                  <input 
                    type="text" 
                    value={safetyMargin} 
                    onChange={(e) => setSafetyMargin(e.target.value)} 
                    className={`w-full bg-[#121215] border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-colors
                      ${errors.safetyMargin ? "border-red-500 focus:border-red-400 bg-red-950/10" : "border-stone-800 focus:border-[#66FCF1]/50"}`}
                  />
                  {errors.safetyMargin && (
                    <span className="text-[9px] text-red-500 font-bold block mt-1">⚠️ {errors.safetyMargin}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 text-stone-500 text-[10px] font-semibold border-t border-stone-900 mt-2 text-right">
              🔋 Autonomía comb: <span className="text-white font-black">{tankMaxLaps} vueltas</span>
            </div>
          </div>
        </div>

        {/* Real-time Validation Error Banner */}
        {hasAnyErrors && (
          <div className="p-2.5 px-3.5 rounded-xl border border-red-900/50 bg-red-950/20 text-[11px] text-red-400 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 animation-pulse" />
            <div>
              <span>⚠️ INTRODUZCA VALORES VÁLIDOS MAYORES A 0.</span>
              <p className="text-[9.5px] font-normal text-stone-400 mt-0.5">La simulación se pausará o mostrará datos aproximados hasta corregir los errores.</p>
            </div>
          </div>
        )}

        {/* Dynamic Warning Alert: Driver Stint vs Fuel Autonomy */}
        {!hasAnyErrors && (
          <div className="p-2.5 px-3.5 rounded-xl text-[10.5px] flex items-start gap-2 border bg-stone-950/50 border-stone-850">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-stone-400">
              <span className="font-bold text-stone-200">ANÁLISIS DE AUTONOMÍA:</span> El depósito dura máximo{" "}
              <span className="text-emerald-400 font-bold">{fuelStintDurationMin} min</span> (~{tankMaxLaps} v.).{" "}
              {fuelStintDurationMin > parsedMaxDriverStintMin ? (
                <span className="text-amber-500 font-bold">
                  ⚠️ El piloto se cansará o excederá su límite ({parsedMaxDriverStintMin} min) antes de vaciar el depósito. ¡Pararás por piloto y no por combustible!
                </span>
              ) : (
                <span className="text-emerald-400">
                  ✔️ El depósito se vacía antes de alcanzar el límite del conductor ({parsedMaxDriverStintMin} min). ¡Podrías planear un "Doble Stint" con el mismo piloto!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Litres Per Pitstop Breakdown - REQUESTED */}
        {!hasAnyErrors && (
          <div className="p-3 bg-gradient-to-br from-red-950/20 to-stone-950 border border-stone-900 rounded-xl space-y-2">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block border-b border-stone-850 pb-1">
              ⛽ PLAN DE COMBUSIBLE POR PARADAS (BOXES)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-stone-400">
              <div className="p-2 bg-black/40 rounded-lg border border-stone-900">
                <span className="text-[8.5px] font-bold text-stone-500 uppercase tracking-wider block">Carga Inicial (Salida)</span>
                <div className="text-sm font-black text-white mt-0.5">
                  {initialFuelLoad.toFixed(1)} <span className="text-[10px] text-stone-500 font-normal">Litros</span>
                </div>
                <span className="text-[8px] text-[#66FCF1]/70 block mt-0.5">Lleno al máximo para empezar</span>
              </div>

              <div className="p-2 bg-black/40 rounded-lg border border-stone-900">
                <span className="text-[8.5px] font-bold text-stone-500 uppercase tracking-wider block">Recarga por Parada</span>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {totalRequiredPitStops > 0 ? regularRefillLitres.toFixed(1) : "0.0"}{" "}
                  <span className="text-[10px] text-stone-500 font-normal">Litros</span>
                </div>
                <span className="text-[8px] text-stone-500 block mt-0.5">
                  Consume {regularRefillLitres.toFixed(1)}L por stint
                </span>
              </div>

              <div className="p-2 bg-black/40 rounded-lg border border-stone-900">
                <span className="text-[8.5px] font-bold text-stone-500 uppercase tracking-wider block">Último Repostaje (Splash)</span>
                <div className="text-sm font-black text-amber-500 mt-0.5">
                  {totalRequiredPitStops > 0 && (totalSafeFuel % regularRefillLitres) > 0 
                    ? Math.min(regularRefillLitres, totalSafeFuel % regularRefillLitres).toFixed(1)
                    : "Solo Margen"}{" "}
                  <span className="text-[10px] text-stone-500 font-normal">Litros</span>
                </div>
                <span className="text-[8px] text-stone-500 block mt-0.5">Carga parcial de seguridad al final</span>
              </div>
            </div>
          </div>
        )}

        {/* Output Section */}
        <div className="border-t border-stone-850 pt-4 space-y-4">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Laps Result */}
            <div className={`border p-2 rounded-xl text-center flex flex-col justify-center transition-colors
              ${hasAnyErrors ? "bg-stone-950 border-stone-900 opacity-50" : "bg-[#111115] border-stone-900"}`}>
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Vueltas Totales</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                {hasAnyErrors ? "--" : totalLaps} <span className="text-[10px] text-stone-500 font-normal">v.</span>
              </div>
            </div>

            {/* Total Fuel Safe */}
            <div className={`border p-2 rounded-xl text-center flex flex-col justify-center transition-colors
              ${hasAnyErrors ? "bg-stone-950 border-stone-900 opacity-50" : "bg-[#111115] border-stone-900"}`}>
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Litros Totales (Margen)</span>
              <div className="text-lg sm:text-xl font-extrabold text-[#66FCF1] mt-0.5">
                {hasAnyErrors ? "--" : totalSafeFuel.toFixed(0)} <span className="text-[9px] text-stone-500 font-normal">L</span>
              </div>
            </div>

            {/* Fuel Stops */}
            <div className={`border p-2 rounded-xl text-center flex flex-col justify-center transition-colors
              ${hasAnyErrors ? "bg-stone-950 border-stone-900 opacity-50" : "bg-[#111115] border-stone-900"}`}>
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Repostajes Requeridos</span>
              <div className="text-lg sm:text-xl font-extrabold text-amber-500 mt-0.5">
                {hasAnyErrors ? "--" : Math.max(0, requiredFuelStints - 1)} <span className="text-[9px] text-stone-500 font-normal">paradas</span>
              </div>
            </div>

            {/* Pitstop Strategy */}
            <div className={`border p-2 rounded-xl text-center flex flex-col justify-center transition-colors
              ${hasAnyErrors ? "bg-stone-950 border-stone-900 opacity-50" : "bg-[#11141a] border-red-950/40"}`}>
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider block">Intervalo Paradas Gral.</span>
              <div className="text-lg sm:text-xl font-black text-red-400 mt-0.5">
                {hasAnyErrors ? "--" : `Cada ${maxTimeBetweenStopsMin}m`}
              </div>
            </div>
          </div>

          {/* Stint Rotation Sequence / Driving Strategy visualizer */}
          <div className={`p-4 border rounded-xl space-y-2.5 transition-all
            ${hasAnyErrors ? "bg-stone-950/20 border-stone-900 opacity-40 select-none pointer-events-none" : "bg-black/45 border-stone-900"}`}>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider border-b border-stone-850 pb-1.5">
              <span className="text-stone-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-500" />
                ESTRATEGIA RECOMENDADA DE RELEVOS ({numDrivers} Pilotos)
              </span>
              <span className="text-stone-500">{hasAnyErrors ? "0" : totalRequiredPitStops + 1} Relevos Totales</span>
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {!hasAnyErrors ? (
                rotationSequence.map((driver, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="text-stone-700 text-[10px] font-bold">➔</span>
                    )}
                    <div className="relative group">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border flex items-center gap-1.5 uppercase transition-all
                        ${driver === "Piloto A" ? "bg-red-950/45 border-red-900/60 text-red-400" : ""}
                        ${driver === "Piloto B" ? "bg-cyan-950/45 border-cyan-900/60 text-cyan-400" : ""}
                        ${driver === "Piloto C" ? "bg-emerald-950/45 border-emerald-900/60 text-emerald-400" : ""}
                        ${driver === "Piloto D" ? "bg-purple-950/45 border-purple-900/60 text-purple-400" : ""}
                      `}>
                        <span className="w-1.5 h-1.5 bg-current rounded-full" />
                        Turno {index + 1}: {driver}
                      </span>
                    </div>
                  </React.Fragment>
                ))
              ) : (
                <span className="text-stone-600 text-xs italic">Complete el formulario sin errores para ver el plan de relevos.</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10.5px] text-stone-400 pt-2 border-t border-stone-905">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                Doble Stint posible: <span className="font-bold text-white">{!hasAnyErrors && (fuelStintDurationMin * 2 <= parsedMaxDriverStintMin) ? "SÍ" : "NO"}</span>
              </span>
              <span className="flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                Frecuencia: <span className="font-bold text-white">~Cada {!hasAnyErrors ? Math.ceil(maxTimeBetweenStopsMin) : "0"} min</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
