import React, { useState } from "react";
import { CarSetup, SetupTemplate, SetupSection, SetupField, FieldType } from "../types";
import { ArrowLeft, Save, Plus, Trash2, Info, Compass, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getCarImage = (carName: string) => {
  const c = carName.toUpperCase();
  if (c.includes("GT3")) return "/img/GT3.JPG";
  if (c.includes("LMP2") || c.includes("ORECA")) return "/img/LMP2.JPG";
  return null;
};

interface ChassisVisualizerProps {
  activeSection: SetupSection;
  values: Record<string, string>;
}

export function ChassisVisualizer({ activeSection, values }: ChassisVisualizerProps) {
  const sectionId = activeSection.id.toLowerCase();

  const getVal = (ids: string[], fallback: string): string => {
    for (const id of ids) {
      if (values[id] !== undefined) return values[id];
    }
    return fallback;
  };

  const getNum = (ids: string[], fallback: number): number => {
    return parseFloat(getVal(ids, fallback.toString())) ?? fallback;
  };

  // 1. ALIGNMENT (Toe & Camber)
  if (sectionId.includes("alignment") || sectionId.includes("alineacion") || activeSection.name.toLowerCase().includes("alinea")) {
    const lfCamber = getNum(["camber_lf", "camber_lf_lmp"], -3.2);
    const rfCamber = getNum(["camber_rf", "camber_rf_lmp"], -3.2);
    const lrCamber = getNum(["camber_lr", "camber_lr_lmp"], -2.5);
    const rrCamber = getNum(["camber_rr", "camber_rr_lmp"], -2.5);

    const lfToe = getNum(["toe_lf", "toe_lf_lmp"], 10);
    const rfToe = getNum(["toe_rf", "toe_rf_lmp"], 10);
    const lrToe = getNum(["toe_lr", "toe_lr_lmp"], 8);
    const rrToe = getNum(["toe_rr", "toe_rr_lmp"], 8);

    const lfToeAngle = (lfToe - 10) * 1.2;
    const rfToeAngle = -(rfToe - 10) * 1.2;
    const lrToeAngle = (lrToe - 10) * 0.8;
    const rrToeAngle = -(rrToe - 10) * 0.8;

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-3 font-mono">
        <span className="text-[11px] sm:text-xs font-black text-[#66FCF1] mb-2.5 tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
          SIMULACIÓN ALINEACIÓN EN VIVO
        </span>
        <div className="relative w-full aspect-[4/5] max-h-[300px] w-[260px] bg-[#09090C]/60 border border-[#232327] rounded-xl flex items-center justify-center overflow-hidden p-2">
          <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
          
          <svg viewBox="0 0 160 220" className="w-[170px] h-[210px] text-stone-700 drop-shadow-2xl" stroke="currentColor" fill="none" strokeWidth="1.2">
            <line x1="80" y1="10" x2="80" y2="210" stroke="#ff3c3c" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.4" />
            <rect x="42" y="30" width="76" height="150" rx="15" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" fill="rgba(255,255,255,0.01)" />
            <path d="M 50,25 C 60,20 100,20 110,25" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            <line x1="38" y1="185" x2="122" y2="185" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />

            {/* 1. Left Front Wheel (LF) */}
            <g transform={`translate(32, 45) rotate(${lfToeAngle})`} className="transition-all duration-300 ease-out">
              <rect x="-8" y="-18" width="16" height="36" rx="4" fill="#0D0D10" stroke="#66FCF1" strokeWidth="1.5" />
              <line x1="-4" y1="-10" x2="-4" y2="10" stroke="#66FCF1" strokeWidth="0.8" opacity="0.4" />
              <line x1="4" y1="-10" x2="4" y2="10" stroke="#66FCF1" strokeWidth="0.8" opacity="0.4" />
              <line x1="0" y1="-18" x2="0" y2="-90" stroke="#66FCF1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
              <circle cx="0" cy="-90" r="2.5" fill="#66FCF1" />
            </g>

            {/* 2. Right Front Wheel (RF) */}
            <g transform={`translate(128, 45) rotate(${rfToeAngle})`} className="transition-all duration-300 ease-out">
              <rect x="-8" y="-18" width="16" height="36" rx="4" fill="#0D0D10" stroke="#66FCF1" strokeWidth="1.5" />
              <line x1="-4" y1="-10" x2="-4" y2="10" stroke="#66FCF1" strokeWidth="0.8" opacity="0.4" />
              <line x1="4" y1="-10" x2="4" y2="10" stroke="#66FCF1" strokeWidth="0.8" opacity="0.4" />
              <line x1="0" y1="-18" x2="0" y2="-90" stroke="#66FCF1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
              <circle cx="0" cy="-90" r="2.5" fill="#66FCF1" />
            </g>

            {/* 3. Left Rear Wheel (LR) */}
            <g transform={`translate(32, 160) rotate(${lrToeAngle})`} className="transition-all duration-300 ease-out">
              <rect x="-9" y="-20" width="18" height="40" rx="4" fill="#0D0D10" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="0" y1="-20" x2="0" y2="-70" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
            </g>

            {/* 4. Right Rear Wheel (RR) */}
            <g transform={`translate(128, 160) rotate(${rrToeAngle})`} className="transition-all duration-300 ease-out">
              <rect x="-9" y="-20" width="18" height="40" rx="4" fill="#0D0D10" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="0" y1="-20" x2="0" y2="-70" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
            </g>
          </svg>

          {/* Real-time Angle Badges */}
          <div className="absolute top-2 left-2 text-[10px] sm:text-xs bg-black/90 px-2 py-1 border border-[#1F1F23] rounded font-mono text-stone-300 space-y-0.5 select-none shadow">
            <div>LF Camber: <span className="text-[#66FCF1] font-bold">{lfCamber}°</span></div>
            <div>LF Toe: <span className="text-[#66FCF1] font-bold">{lfToe}</span></div>
          </div>
          <div className="absolute top-2 right-2 text-[10px] sm:text-xs bg-black/90 px-2 py-1 border border-[#1F1F23] rounded font-mono text-stone-300 space-y-0.5 select-none text-right shadow">
            <div>RF Camber: <span className="text-[#66FCF1] font-bold">{rfCamber}°</span></div>
            <div>RF Toe: <span className="text-[#66FCF1] font-bold">{rfToe}</span></div>
          </div>
          <div className="absolute bottom-2 left-2 text-[10px] sm:text-xs bg-black/90 px-2 py-1 border border-[#1F1F23] rounded font-mono text-stone-300 space-y-0.5 select-none shadow">
            <div>LR Camber: <span className="text-[#3b82f6] font-bold">{lrCamber}°</span></div>
            <div>LR Toe: <span className="text-[#3b82f6] font-bold">{lrToe}</span></div>
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] sm:text-xs bg-black/90 px-2 py-1 border border-[#1F1F23] rounded font-mono text-stone-300 space-y-0.5 select-none text-right shadow">
            <div>RR Camber: <span className="text-[#3b82f6] font-bold">{rrCamber}°</span></div>
            <div>RR Toe: <span className="text-[#3b82f6] font-bold">{rrToe}</span></div>
          </div>
        </div>
        <p className="text-[10px] text-[#66FCF1] text-center mt-2.5 uppercase font-bold tracking-widest">
          Simulación de convergencia activa
        </p>
      </div>
    );
  }

  // 2. TYRES (Pressure thermal simulator)
  if (sectionId.includes("tyres") || sectionId.includes("compound") || sectionId.includes("neuma") || activeSection.name.toLowerCase().includes("neuma") || activeSection.name.toLowerCase().includes("tire")) {
    const lfPres = getNum(["press_lf", "press_lf_lmp", "psi_fl"], 26.0);
    const rfPres = getNum(["press_rf", "press_rf_lmp", "psi_fr"], 26.0);
    const lrPres = getNum(["press_lr", "press_lr_lmp", "psi_rl"], 26.5);
    const rrPres = getNum(["press_rr", "press_rr_lmp", "psi_rr"], 26.5);

    const getTyreCol = (p: number) => {
      if (p < 25.0) return { border: "border-blue-500", text: "text-blue-400", bg: "bg-blue-500/10", label: "FRÍO ❄️" };
      if (p > 27.8) return { border: "border-[#ff3c3c]", text: "text-[#ff3c3c]", bg: "bg-red-500/10", label: "SOBREPR. 🔥" };
      return { border: "border-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", label: "ÓPTIMO ✅" };
    };

    const lfSt = getTyreCol(lfPres);
    const rfSt = getTyreCol(rfPres);
    const lrSt = getTyreCol(lrPres);
    const rrSt = getTyreCol(rrPres);

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-3 font-mono">
        <span className="text-[11px] sm:text-xs font-black text-[#66FCF1] mb-2.5 tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
          ESTADO TÉRMICO DE NEUMÁTICOS
        </span>
        <div className="relative w-full aspect-[4/5] max-h-[300px] w-[260px] bg-[#09090C]/60 border border-[#232327] rounded-xl flex items-center justify-center p-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-x-10 gap-y-12 w-full max-w-[210px] relative z-10">
            {/* Connecting lines */}
            <div className="absolute inset-y-6 inset-x-8 border-x border-[#1F1F23]/60 rounded-lg pointer-events-none select-none flex items-center justify-center">
              <span className="text-[9.5px] text-stone-400 bg-[#09090C] px-2 tracking-wider uppercase font-black">TERMICOS</span>
            </div>

            {/* LF WHEEL CARD */}
            <div className={`p-2.5 bg-black/90 border-2 rounded-lg text-center ${lfSt.border} transition-all duration-350 shadow-lg`}>
              <div className="text-[10px] text-stone-200 uppercase font-black tracking-wider">LF</div>
              <div className={`text-sm sm:text-base font-black my-0.5 text-white`}>{lfPres} <span className="text-[10px] font-normal text-stone-400">psi</span></div>
              <div className={`text-[9.5px] font-black tracking-wider ${lfSt.text} px-1.5 py-0.5 rounded-full ${lfSt.bg}`}>{lfSt.label}</div>
            </div>

            {/* RF WHEEL CARD */}
            <div className={`p-2.5 bg-black/90 border-2 rounded-lg text-center ${rfSt.border} transition-all duration-350 shadow-lg`}>
              <div className="text-[10px] text-stone-200 uppercase font-black tracking-wider">RF</div>
              <div className={`text-sm sm:text-base font-black my-0.5 text-white`}>{rfPres} <span className="text-[10px] font-normal text-stone-400">psi</span></div>
              <div className={`text-[9.5px] font-black tracking-wider ${rfSt.text} px-1.5 py-0.5 rounded-full ${rfSt.bg}`}>{rfSt.label}</div>
            </div>

            {/* LR WHEEL CARD */}
            <div className={`p-2.5 bg-black/90 border-2 rounded-lg text-center ${lrSt.border} transition-all duration-350 shadow-lg`}>
              <div className="text-[10px] text-stone-200 uppercase font-black tracking-wider">LR</div>
              <div className={`text-sm sm:text-base font-black my-0.5 text-white`}>{lrPres} <span className="text-[10px] font-normal text-stone-400">psi</span></div>
              <div className={`text-[9.5px] font-black tracking-wider ${lrSt.text} px-1.5 py-0.5 rounded-full ${lrSt.bg}`}>{lrSt.label}</div>
            </div>

            {/* RR WHEEL CARD */}
            <div className={`p-2.5 bg-black/90 border-2 rounded-lg text-center ${rrSt.border} transition-all duration-350 shadow-lg`}>
              <div className="text-[10px] text-stone-200 uppercase font-black tracking-wider">RR</div>
              <div className={`text-sm sm:text-base font-black my-0.5 text-white`}>{rrPres} <span className="text-[10px] font-normal text-stone-400">psi</span></div>
              <div className={`text-[9.5px] font-black tracking-wider ${rrSt.text} px-1.5 py-0.5 rounded-full ${rrSt.bg}`}>{rrSt.label}</div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#66FCF1] text-center mt-2.5 uppercase font-bold tracking-widest">
          Rango óptimo: 25.5 - 27.5 psi
        </p>
      </div>
    );
  }

  // 3. SUSPENSION / HEIGHTS (Real-time Spring Compress/Decompress Simulator with strict physical bounds)
  if (sectionId.includes("suspension") || sectionId.includes("spring") || sectionId.includes("height") || activeSection.name.toLowerCase().includes("suspen") || activeSection.name.toLowerCase().includes("altura")) {
    const lfHeight = getNum(["height_lf", "height_lf_lmp", "ride_height_f"], 15);
    const rfHeight = getNum(["height_rf", "height_rf_lmp", "ride_height_f"], 15);
    const lrHeight = getNum(["height_lr", "height_lr_lmp", "ride_height_r"], 20);
    const rrHeight = getNum(["height_rr", "height_rr_lmp", "ride_height_r"], 20);

    // Clamp values to calculate a bounded normalized percentage (0 to 1) for realistic movement (between 10mm and 120mm)
    const lfPercent = Math.min(1, Math.max(0, (lfHeight - 10) / 110));
    const lrPercent = Math.min(1, Math.max(0, (lrHeight - 15) / 110));

    // Dynamic Y position of the lower spring support plate, strictly bounded (54px to 86px inside the 120px viewBox)
    const lfBaseY = 54 + lfPercent * 32;
    const lrBaseY = 54 + lrPercent * 32;

    const lfSpringHeight = lfBaseY - 25;
    const lrSpringHeight = lrBaseY - 25;

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-3 font-mono">
        <span className="text-[11px] sm:text-xs font-black text-[#66FCF1] mb-2.5 tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
          ALTURAS Y COMPRESIÓN DE SUSPENSIÓN
        </span>
        <div className="relative w-full aspect-[4/5] max-h-[300px] w-[260px] bg-[#09090C]/60 border border-[#232327] rounded-xl flex flex-col items-center justify-center overflow-hidden p-3 text-stone-400 shadow-xl">
          
          <div className="flex gap-4 w-full justify-around items-center px-1 max-w-[220px]">
            {/* Front Axle Strut */}
            <div className="flex flex-col items-center">
              <span className="text-[9.5px] text-stone-300 font-bold mb-1.5 uppercase tracking-wide">Eje Delantero</span>
              <svg viewBox="0 0 60 120" className="w-[50px] h-[105px] text-emerald-400" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
                <rect x="15" y="10" width="30" height="6" fill="#15161A" stroke="#2D2D32" strokeWidth="1" />
                <line x1="30" y1="16" x2="30" y2="25" stroke="#6B6B70" />
                
                <circle cx="30" cy="25" r="4" fill="#0D0D10" stroke="#66FCF1" strokeWidth="1" />

                {/* Physically bounded coil spring starting at y=25 and ending exactly at the mobile cup lfBaseY */}
                <path d={`
                  M 30,25 
                  L 20,${25 + lfSpringHeight * 0.15}
                  L 40,${25 + lfSpringHeight * 0.3}
                  L 20,${25 + lfSpringHeight * 0.45}
                  L 40,${25 + lfSpringHeight * 0.6}
                  L 20,${25 + lfSpringHeight * 0.75}
                  L 40,${25 + lfSpringHeight * 0.9}
                  L 30,${lfBaseY}
                `} stroke="#66FCF1" strokeWidth="2.5" className="transition-all duration-300" fill="none" />

                {/* Mobile lower spring seat plate */}
                <rect x="16" y={lfBaseY} width="28" height="4" rx="1" fill="#2C2C32" stroke="#6B6B70" strokeWidth="1" className="transition-all duration-300" />

                {/* Mobile hydraulic damper rod inside the lower casing */}
                <line x1="30" y1={lfBaseY + 4} x2="30" y2="100" stroke="#EEEEEE" strokeWidth="3" className="transition-all duration-300" />
                
                <rect x="25" y="100" width="10" height="13" rx="1" fill="#1C1C1F" stroke="#6B6B70" strokeWidth="1" />
                <line x1="10" y1="113" x2="50" y2="113" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              </svg>
              <div className="text-[11px] sm:text-xs font-black text-[#66FCF1] mt-1 border border-stone-800 bg-[#121216] px-1.5 py-0.5 rounded shadow">{lfHeight}mm</div>
            </div>

            {/* Rear Axle Strut */}
            <div className="flex flex-col items-center">
              <span className="text-[9.5px] text-stone-300 font-bold mb-1.5 uppercase tracking-wide">Eje Trasero</span>
              <svg viewBox="0 0 60 120" className="w-[50px] h-[105px] text-blue-400" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
                <rect x="15" y="10" width="30" height="6" fill="#15161A" stroke="#2D2D32" strokeWidth="1" />
                <line x1="30" y1="16" x2="30" y2="25" stroke="#6B6B70" />
                
                <circle cx="30" cy="25" r="4" fill="#0D0D10" stroke="#3b82f6" strokeWidth="1" />

                {/* Physically bounded coil spring starting at y=25 and ending exactly at the mobile cup lrBaseY */}
                <path d={`
                  M 30,25 
                  L 20,${25 + lrSpringHeight * 0.15}
                  L 40,${25 + lrSpringHeight * 0.3}
                  L 20,${25 + lrSpringHeight * 0.45}
                  L 40,${25 + lrSpringHeight * 0.6}
                  L 20,${25 + lrSpringHeight * 0.75}
                  L 40,${25 + lrSpringHeight * 0.9}
                  L 30,${lrBaseY}
                `} stroke="#3b82f6" strokeWidth="2.5" className="transition-all duration-300" fill="none" />

                {/* Mobile lower spring seat plate */}
                <rect x="16" y={lrBaseY} width="28" height="4" rx="1" fill="#2C2C32" stroke="#6B6B70" strokeWidth="1" className="transition-all duration-300" />

                {/* Mobile hydraulic damper rod inside the lower casing */}
                <line x1="30" y1={lrBaseY + 4} x2="30" y2="100" stroke="#EEEEEE" strokeWidth="3" className="transition-all duration-300" />
                
                <rect x="25" y="100" width="10" height="13" rx="1" fill="#1C1C1F" stroke="#6B6B70" strokeWidth="1" />
                <line x1="10" y1="113" x2="50" y2="113" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              </svg>
              <div className="text-[11px] sm:text-xs font-black text-[#3b82f6] mt-1 border border-stone-800 bg-[#121216] px-1.5 py-0.5 rounded shadow">{lrHeight}mm</div>
            </div>
          </div>

          <div className="flex justify-between w-full mt-3.5 text-[9.5px] font-bold text-stone-400 border-t border-[#1F1F23]/60 pt-2 px-1 col-span-2">
            <span>FRONT: <span className="text-[#66FCF1] font-black">{lfHeight} / {rfHeight}</span></span>
            <span>REAR: <span className="text-[#3b82f6] font-black">{lrHeight} / {rrHeight}</span></span>
          </div>
        </div>
        <p className="text-[10px] text-[#66FCF1] text-center mt-2.5 uppercase font-bold tracking-widest">
          Compresión de muelles adaptativa
        </p>
      </div>
    );
  }

  // 3.5. DAMPERS / AMORTIGUADORES (Telemetry dynamic hydraulic diagram)
  if (sectionId.includes("damper") || sectionId.includes("amortig") || activeSection.name.toLowerCase().includes("damper") || activeSection.name.toLowerCase().includes("amortiguador")) {
    const bumpLF = getNum(["bump_lf", "bump_lf_lmp", "bump_fl"], 6);
    const reboundLF = getNum(["rebound_lf", "rebound_lf_lmp", "rebound_fl"], 9);
    
    const bumpRF = getNum(["bump_rf", "bump_rf_lmp", "bump_fr"], 6);
    const reboundRF = getNum(["rebound_rf", "rebound_rf_lmp", "rebound_fr"], 9);

    const bumpLR = getNum(["bump_lr", "bump_lr_lmp", "bump_rl"], 5);
    const reboundLR = getNum(["rebound_lr", "rebound_lr_lmp", "rebound_rl"], 8);

    const bumpRR = getNum(["bump_rr", "bump_rr_lmp", "bump_rr"], 5);
    const reboundRR = getNum(["rebound_rr", "rebound_rr_lmp", "rebound_rr"], 8);

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-3 font-mono">
        <span className="text-[11px] sm:text-xs font-black text-[#66FCF1] mb-2.5 tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
          SIMULACIÓN DE RESPUESTA HIDRÁULICA
        </span>
        <div className="relative w-full aspect-[4/5] max-h-[300px] w-[260px] bg-[#09090C]/60 border border-[#232327] rounded-xl flex flex-col justify-between p-3 flex-1 text-stone-200 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
          
          <div className="grid grid-cols-2 gap-2 w-full flex-1 items-center">
            {/* LF */}
            <div className="p-2 border border-[#1F1F23] bg-black/45 rounded-lg flex flex-col justify-between h-[105px]">
              <div className="flex justify-between items-center text-[9px] font-black tracking-wider text-emerald-400">
                <span>FRONT LEFT (LF)</span>
              </div>
              <div className="space-y-1.5 font-mono text-[8px] mt-1 flex-1 flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>BUMP (Comp.)</span>
                    <span className="text-[#66FCF1] font-bold">{bumpLF}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-[#66FCF1] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (bumpLF / 20) * 100))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>REBOUND (Ext.)</span>
                    <span className="text-amber-500 font-bold">{reboundLF}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (reboundLF / 30) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* RF */}
            <div className="p-2 border border-[#1F1F23] bg-black/45 rounded-lg flex flex-col justify-between h-[105px]">
              <div className="flex justify-between items-center text-[9px] font-black tracking-wider text-emerald-400">
                <span>FRONT RIGHT (RF)</span>
              </div>
              <div className="space-y-1.5 font-mono text-[8px] mt-1 flex-1 flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>BUMP (Comp.)</span>
                    <span className="text-[#66FCF1] font-bold">{bumpRF}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-[#66FCF1] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (bumpRF / 20) * 100))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>REBOUND (Ext.)</span>
                    <span className="text-amber-500 font-bold">{reboundRF}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (reboundRF / 30) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* LR */}
            <div className="p-2 border border-[#1F1F23] bg-black/45 rounded-lg flex flex-col justify-between h-[105px]">
              <div className="flex justify-between items-center text-[9px] font-black tracking-wider text-blue-400">
                <span>REAR LEFT (LR)</span>
              </div>
              <div className="space-y-1.5 font-mono text-[8px] mt-1 flex-1 flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>BUMP (Comp.)</span>
                    <span className="text-[#66FCF1] font-bold">{bumpLR}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-[#66FCF1] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (bumpLR / 20) * 100))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>REBOUND (Ext.)</span>
                    <span className="text-amber-500 font-bold">{reboundLR}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (reboundLR / 30) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* RR */}
            <div className="p-2 border border-[#1F1F23] bg-black/45 rounded-lg flex flex-col justify-between h-[105px]">
              <div className="flex justify-between items-center text-[9px] font-black tracking-wider text-blue-400">
                <span>REAR RIGHT (RR)</span>
              </div>
              <div className="space-y-1.5 font-mono text-[8px] mt-1 flex-1 flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>BUMP (Comp.)</span>
                    <span className="text-[#66FCF1] font-bold">{bumpRR}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-[#66FCF1] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (bumpRR / 20) * 100))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>REBOUND (Ext.)</span>
                    <span className="text-amber-500 font-bold">{reboundRR}</span>
                  </div>
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, (reboundRR / 30) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-black/50 p-1 rounded justify-center border border-stone-800/40 text-[7.5px] text-stone-500 uppercase tracking-widest font-bold select-none mt-1 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#66FCF1] rounded-full animate-pulse" />
            Veredicto: {(bumpLF + bumpRF + bumpLR + bumpRR) / 4 > 11 ? "Configuración Firme" : "Compresión Reactiva"}
          </div>
        </div>
        <p className="text-[10px] text-[#66FCF1] text-center mt-2.5 uppercase font-bold tracking-widest">
          Grados de amortiguación
        </p>
      </div>
    );
  }

  // 4. AERO (Wind-tunnel visualizer)
  if (sectionId.includes("aero") || sectionId.includes("wing") || activeSection.name.toLowerCase().includes("aero") || activeSection.name.toLowerCase().includes("aler")) {
    const rearWing = getNum(["rear_wing", "rear_wing_lmp"], 4);
    const wingNormalizedAngle = 8 + (rearWing * 2.5);

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-3 font-mono">
        <span className="text-[11px] sm:text-xs font-black text-[#66FCF1] mb-2.5 tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
          SIMULACIÓN EN TÚNEL DE VIENTO
        </span>
        <div className="relative w-full aspect-[4/5] max-h-[300px] w-[260px] bg-[#09090C]/60 border border-[#232327] rounded-xl flex items-center justify-center p-3 overflow-hidden shadow-xl">
          
          <svg viewBox="0 0 160 160" className="w-[180px] h-[180px]" stroke="currentColor" fill="none" strokeWidth="1.2">
            <path d="M 5,30 Q 50,30 90,32 Q 120,38 152,58" stroke="#66FCF1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" opacity="0.6" />
            <path d="M 5,60 Q 55,59 100,68 Q 120,78 152,105" stroke="#66FCF1" strokeWidth="1.8" strokeDasharray="4,4" opacity="0.8" />
            <path d="M 115,75 Q 125,85 152,120" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" />

            <g transform="translate(130, 85)">
              <line x1="0" y1="0" x2="0" y2={10 + rearWing * 2} stroke="#ff3c3c" strokeWidth="2.5" />
              <path d={`M -3,${6 + rearWing * 2} L 0,${10 + rearWing * 2} L 3,${6 + rearWing * 2}`} stroke="#ff3c3c" strokeWidth="2.5" fill="none" />
              <text x="6" y="9" fill="#ff3c3c" fontSize="8" fontWeight="black" stroke="none">D.FORCE</text>
            </g>

            <path d="M 10,120 L 25,120 Q 30,120 32,118 Q 36,110 40,108 L 60,108 Q 70,104 74,90 Q 82,75 105,75 L 120,76 L 122,86 L 132,86 L 134,77 L 146,80 L 148,120 Z" fill="#0C0C0F" stroke="#323237" strokeWidth="1.5" />
            
            <circle cx="45" cy="120" r="14" fill="#0D0D10" stroke="#333" strokeWidth="1.5" />
            <circle cx="45" cy="120" r="6" fill="#15151A" stroke="#66FCF1" strokeWidth="1" />
            <circle cx="115" cy="120" r="14" fill="#0D0D10" stroke="#333" strokeWidth="1.5" />
            <circle cx="115" cy="120" r="6" fill="#15151A" stroke="#66FCF1" strokeWidth="1" />

            <g transform={`translate(136, 75) rotate(${wingNormalizedAngle})`} className="transition-all duration-300 ease-out">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#ff3c3c" strokeWidth="1.5" />
              <rect x="-8" y="-4" width="16" height="5" rx="1.5" fill="#1E1E22" stroke="#66FCF1" strokeWidth="1.2" />
              <line x1="-8" y1="-2" x2="8" y2="-1" stroke="#ff3c3c" strokeWidth="1.8" />
            </g>
          </svg>

          <div className="absolute top-3 left-3 bg-black/90 px-2.5 py-1 border border-[#1F1F23] rounded font-mono text-[11px] text-stone-200 font-bold shadow">
            Alerón: <span className="text-[#66FCF1] font-black">{rearWing}°</span>
          </div>

          <div className="absolute bottom-3 right-3 bg-black/90 px-2.5 py-1 border border-[#1F1F23] rounded font-mono text-[11px] text-[#ff3c3c] font-bold shadow">
            Downforce: <span className="text-white font-black">+{(rearWing * 14.5).toFixed(0)} kgf</span>
          </div>
        </div>
        <p className="text-[10px] text-[#66FCF1] text-center mt-2.5 uppercase font-bold tracking-widest">
          Alerón y carga aerodinámica
        </p>
      </div>
    );
  }

  // 5. DEFAULT FALLBACK SCANNER (Electronics, fuel, drivetrain, generic)
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-3 font-mono">
      <span className="text-[11px] sm:text-xs font-black text-stone-300 mb-2.5 tracking-widest uppercase flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        DIAGNÓSTICO GENERAL DE CHASIS
      </span>
      <div className="relative w-full aspect-[4/5] max-h-[300px] w-[260px] bg-[#09090C]/60 border border-[#232327] rounded-xl flex items-center justify-center overflow-hidden p-2 shadow-xl">
        <div className="absolute inset-x-0 h-0.5 bg-[#66FCF1]/15 border-b border-[#66FCF1]/25 animate-bounce pointer-events-none" style={{ animationDuration: "3.5s" }} />

        <svg viewBox="0 0 100 160" className="w-[155px] h-[190px] text-stone-700 opacity-60" stroke="currentColor" fill="none" strokeWidth="1.2">
          <rect x="25" y="15" width="50" height="130" rx="16" />
          <circle cx="50" cy="50" r="10" />
          <line x1="8" y1="36" x2="92" y2="36" strokeDasharray="3,3" />
          <line x1="8" y1="124" x2="92" y2="124" strokeDasharray="3,3" />
          
          <path d="M 12,31 L 8,31 L 8,41 L 12,41 Z" />
          <path d="M 88,31 L 92,31 L 92,41 L 88,41 Z" />
          <path d="M 10,119 L 6,119 L 6,129 L 10,129 Z" />
          <path d="M 90,119 L 94,119 L 94,129 L 90,129 Z" />
          <line x1="12" y1="147" x2="88" y2="147" strokeWidth="2.5" />
        </svg>

        <div className="absolute inset-0 flex flex-col justify-between p-3.5 text-[10px] sm:text-[11px] text-stone-300 pointer-events-none select-none">
          <div className="flex justify-between w-full">
            <span className="bg-black/90 px-2.5 py-1 rounded border border-[#1F1F23] font-bold shadow">ABS: LEVEL {getVal(["abs", "abs_lmp"], "4")}</span>
            <span className="bg-black/90 px-2.5 py-1 rounded border border-[#1F1F23] font-bold shadow">TC: LEVEL {getVal(["tc", "tc_lmp"], "3")}</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 bg-black/60 p-1.5 rounded border border-stone-820/50">
            <span className="text-[11px] sm:text-xs text-[#66FCF1] font-black tracking-wider animate-pulse">TELEMETRIA OK</span>
            <span className="text-stone-400 font-bold text-[9px]">REG. MOTOR ACTIVO</span>
          </div>

          <div className="flex justify-between w-full">
            <span className="bg-black/90 px-2.5 py-1 rounded border border-[#1F1F23] font-bold shadow">LITERS: {getVal(["liters", "liters_lmp"], "35")}L</span>
            <span className="bg-black/90 px-2.5 py-1 rounded border border-[#1F1F23] text-red-400 font-bold shadow">BIAS: {getVal(["brake_bias", "brake_bias_lmp"], "56.0")}%</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-[#66FCF1] text-center mt-2.5 uppercase font-bold tracking-widest">
        Frenos, combustible y telemetría
      </p>
    </div>
  );
}

interface SetupDetailProps {
  setup: CarSetup;
  template: SetupTemplate;
  onGoBack: () => void;
  onUpdateSetupValues: (updatedValues: Record<string, string>) => void;
  onUpdateSetupMeta: (meta: {
    title: string;
    car: string;
    track: string;
    notes: string;
    lapTime?: string;
    weather?: "Dry" | "Wet" | "Mixed";
    setupType?: string;
  }) => void;
  onAddNewSection: (sectionName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddNewField: (sectionId: string, field: Omit<SetupField, "id">) => void;
  onDeleteField: (sectionId: string, fieldId: string) => void;
  readOnly?: boolean;
}

export default function SetupDetail({
  setup,
  template,
  onGoBack,
  onUpdateSetupValues,
  onUpdateSetupMeta,
  onAddNewSection,
  onDeleteSection,
  onAddNewField,
  onDeleteField,
  readOnly = false,
}: SetupDetailProps) {
  const [values, setValues] = useState<Record<string, string>>({ ...setup.values });

  const effectiveSections = setup.customSections || template.sections;

  const [metaTitle, setMetaTitle] = useState(setup.title);
  const [metaCar, setMetaCar] = useState(setup.car);
  const [metaTrack, setMetaTrack] = useState(setup.track);
  const [metaNotes, setMetaNotes] = useState(setup.notes || "");
  const [metaLapTime, setMetaLapTime] = useState(setup.lapTime || "");
  const [metaWeather, setMetaWeather] = useState<"Dry" | "Wet" | "Mixed" | undefined>(setup.weather);
  const [metaSetupType, setMetaSetupType] = useState(setup.setupType || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success">("idle");

  const isAssetto = setup.game === "Assetto Corsa";

  const [activeTab, setActiveTab] = useState<string>(effectiveSections[0]?.id || "");

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [isAddingField, setIsAddingField] = useState<string | null>(null); // sectionId
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<string>(FieldType.NUMBER);
  const [newFieldMin, setNewFieldMin] = useState<number>(0);
  const [newFieldMax, setNewFieldMax] = useState<number>(100);
  const [newFieldStep, setNewFieldStep] = useState<number>(1);
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldDefaultVal, setNewFieldDefaultVal] = useState("");

  const [explainingField, setExplainingField] = useState<SetupField | null>(null);

  // Sync setup type options dynamically inside details view as well
  React.useEffect(() => {
    if (!metaSetupType) {
      if (setup.game === "Le Mans Ultimate") {
        setMetaSetupType("Libre");
      } else if (setup.game === "Assetto Corsa") {
        setMetaSetupType("LFM");
      }
    }
  }, [setup.game, metaSetupType]);

  const handleValueChange = (fieldId: string, val: string) => {
    const nextValues = { ...values, [fieldId]: val };
    setValues(nextValues);
    onUpdateSetupValues(nextValues);
  };

  const handleIncrement = (field: SetupField, direction: number) => {
    const currentStr = values[field.id] !== undefined ? values[field.id] : (field.defaultValue || "0");
    const currentNum = parseFloat(currentStr) || 0;
    const step = field.step || 1;
    const min = field.min !== undefined ? field.min : -99999;
    const max = field.max !== undefined ? field.max : 99999;

    let nextNum = currentNum + direction * step;
    const stepDecimals = (step.toString().split(".")[1] || "").length;
    nextNum = parseFloat(nextNum.toFixed(Math.max(stepDecimals, 2)));

    if (nextNum < min) nextNum = min;
    if (nextNum > max) nextNum = max;

    handleValueChange(field.id, nextNum.toString());
  };

  const saveMetadata = () => {
    onUpdateSetupMeta({
      title: metaTitle,
      car: metaCar,
      track: metaTrack,
      notes: metaNotes,
      lapTime: metaLapTime,
      weather: metaWeather,
      setupType: metaSetupType,
    });
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    onAddNewSection(newSectionName.trim());
    setNewSectionName("");
    setIsAddingSection(false);
  };

  const handleAddFieldSubmit = (sectionId: string) => {
    if (!newFieldName.trim()) {
      return;
    }
    const oList = newFieldOptions
      ? newFieldOptions.split(",").map(s => s.trim())
      : undefined;

    onAddNewField(sectionId, {
      name: newFieldName,
      type: newFieldType,
      min: newFieldType === FieldType.NUMBER ? newFieldMin : undefined,
      max: newFieldType === FieldType.NUMBER ? newFieldMax : undefined,
      step: newFieldType === FieldType.NUMBER ? newFieldStep : undefined,
      unit: newFieldUnit || undefined,
      options: oList,
      defaultValue: newFieldDefaultVal || undefined,
    });

    setIsAddingField(null);
    setNewFieldName("");
    setNewFieldUnit("");
    setNewFieldOptions("");
    setNewFieldDefaultVal("");
  };

  // Static high-quality driver explanations of main parameters
  const getFieldExplanation = (field: SetupField) => {
    const id = field.id.toLowerCase();

    // Dynamic patterns for heave dampers (check first to avoid matching standard corner dampers)
    if (id.includes("_heave")) {
      const isFront = id.includes("_f_");
      const type = isFront ? "delantero" : "trasero";
      const side = isFront ? "F" : "R";
      if (id.includes("fst_bump_")) {
        return `Compresión rápida del tercer amortiguador ${type} (Heave FST Bump ${side}). Regula la respuesta del coche ante movimientos de amortiguación verticales de alta velocidad, como baches simétricos que afectan a todo el eje o impactos de pianos grandes.`;
      }
      if (id.includes("fst_rebound_")) {
        return `Extensión rápida del tercer amortiguador ${type} (Heave FST Rebound ${side}). Controla el retorno rápido simétrico de la suspensión tras una compresión vertical severa, asegurando el contacto continuo de los neumáticos con la pista.`;
      }
      if (id.includes("bump_")) {
        return `Compresión lenta del tercer amortiguador ${type} (Heave Bump ${side}). Controla la rigidez hidráulica del chasis ante hundimientos verticales constantes provocados por la altísima carga aerodinámica propia del LMP2 a altas velocidades o la inercia pesada en frenadas.`;
      }
      if (id.includes("rebound_")) {
        return `Extensión lenta del tercer amortiguador ${type} (Heave Rebound ${side}). Controla el cabeceo del coche y la recuperación de la altura al salir de frenadas o disminuir la carga aerodinámica, estabilizando la plataforma.`;
      }
    }

    // Dynamic patterns for packer rates
    if (id.includes("packer_rate_")) {
      const pos = id.replace("packer_rate_", "").replace("_lmp", "").toUpperCase();
      return `Constante de rigidez elástica de los topes progresivos (Packer rate) de la rueda ${pos}. Define la dureza de los topes elastómeros que limitan y protegen el final de recorrido de la suspensión, impidiendo que el fondo plano del LMP2 roce bruscamente contra el asfalto.`;
    }

    // Dynamic patterns for springs, suspension heights, and dampers
    if (id.includes("wheel_rate_")) {
      const pos = id.replace("wheel_rate_", "").replace("_lmp", "").toUpperCase();
      return `Constante elástica del muelle de la rueda ${pos} (Wheel rate). Determina la rigidez mecánica de ese muelle. Muelles más rígidos limitan el balanceo de la carrocería en curvas, pero pueden disminuir el agarre mecánico absoluto en superficies irregulares.`;
    }
    if (id.includes("height_")) {
      const pos = id.replace("height_", "").replace("_lmp", "").toUpperCase();
      return `Altura de la carrocería en la rueda ${pos} (Height). Reducir la altura baja el centro de gravedad e incrementa el agarre general y el apoyo aerodinámico, pero excederse provoca que el chasis golpee los baches del asfalto.`;
    }
    if (id.includes("fst_bump_")) {
      const pos = id.replace("fst_bump_", "").replace("_lmp", "").toUpperCase();
      return `Compresión rápida para la rueda ${pos} (FST Bump). Controla la resistencia hidráulica del amortiguador ante movimientos superrápidos de la rueda, como al pisar pianos elevados o baches agresivos en pista.`;
    }
    if (id.includes("fst_rebound_")) {
      const pos = id.replace("fst_rebound_", "").replace("_lmp", "").toUpperCase();
      return `Extensión rápida para la rueda ${pos} (FST Rebound). Controla el retorno rápido del amortiguador después de que la rueda sea golpeada por un bache o piano, ayudando a que vuelva al asfalto de inmediato.`;
    }
    if (id.includes("bump_")) {
      const pos = id.replace("bump_", "").replace("_lmp", "").toUpperCase();
      return `Compresión lenta para la rueda ${pos} (Bump). Controla la velocidad de transferencia lateral de peso del chasis al iniciar virajes cerrados y el cabeceo al presionar el freno.`;
    }
    if (id.includes("rebound_")) {
      const pos = id.replace("rebound_", "").replace("_lmp", "").toUpperCase();
      return `Extensión lenta para la rueda ${pos} (Rebound). Regula cuánto tarda el muelle en recuperar su longitud normal en curvas lentas o inclinaciones longitudinales progresivas.`;
    }

    const detailsMap: Record<string, string> = {
      gears: "Relación de transmisión del cambio. 'Long' ofrece mayor velocidad punta en rectas largas a costa de aceleración; 'Short' aumenta la aceleración pero reduce la velocidad máxima punta.",
      gears_lmp: "Relación de transmisión del cambio para el LMP2. Permite elegir piñones de marchas óptimos de acuerdo a la longitud de rectas y velocidad máxima promedio del circuito (p. ej., Le Mans o Spa).",
      compound: "Compuesto del neumático. 'Medium slick (m)' es idóneo para asfalto seco en condiciones de carrera estables; 'Rain (wet)' posee ranurado profundo y goma súper blanda para drenar agua y ganar adherencia en lluvia.",
      compound_lmp: "Compuesto específico de neumático para competición LMP2. Proporciona estabilidad térmica excelente y un rendimiento predecible en carreras de resistencia extensas.",
      press_lf: "Presión en frío del neumático delantero izquierdo (LF). La presión ideal en caliente (tras girar unas vueltas) de un neumático GT3 suele rondar las 26-27 psi en seco.",
      press_lf_lmp: "Presión en frío del neumático delantero izquierdo (LF). Permite buscar la presión óptima de funcionamiento en caliente de los prototipos LMP2 en apoyos exigentes.",
      press_rf: "Presión en frío del neumático delantero derecho (RF). Adapta el inflado para igualar las presiones dinámicas finales de acuerdo al sentido de giro del trazado.",
      press_rf_lmp: "Presión en frío del neumático delantero derecho (RF). Regula el nivel de inflado dinámico para optimizar el paso por curva sobre el lado derecho.",
      press_lr: "Presión en frío del neumático trasero izquierdo (LR). Controla la tracción y adherencia longitudinal al acelerar en la salida de curvas rápidas.",
      press_lr_lmp: "Presión en frío del neumático trasero izquierdo (LR). Equilibra la entrega de potencia al asfalto desde las gomas traseras del LMP2.",
      press_rr: "Presión en frío del neumático trasero derecho (RR). Busca una presión perfecta para evitar el deslizamiento lateral excesivo y la elevación térmica en apoyos largos.",
      press_rr_lmp: "Presión en frío del neumático trasero derecho (RR). Ayuda a estabilizar la temperatura térmica en carreras largas y frenadas asimétricas.",
      liters: "Litros de combustible extra en el coche. Mayor peso eleva la inercia total del chasis ralentizando la frenada, pero determina la autonomía máxima de combustible para tu stint.",
      liters_lmp: "Litros de combustible cargados a bordo del prototipo LMP2. Regula el peso corporal y autonomía. Un mayor volumen genera un centro de gravedad más atrasado pero permite realizar stints más prolongados.",
      tc: "Control de Tracción (TC). Determina el nivel de intervención cortando potencia electrónica al patinar las ruedas del eje de tracción trasera.",
      tc_lmp: "Control de Tracción (TC) en prototipo LMP2. Un sistema rápido y de alta precisión electrónica diseñado para dosificar la entrega de los más de 600cv sobre el asfalto mojado o seco.",
      abs: "Sistema Antibloqueo de Frenada. Regula el nivel de sensibilidad para evitar que los neumáticos se deslicen sobre la calzada bloqueados en frenadas de emergencia.",
      rear_wing: "Alerón trasero (Rear wing). Ángulo de incidencia aerodinámica. Mayor deflexión aporta estabilidad aerodinámica en curvas rápidas a cambio de mayor resistencia al avance (drag) en rectas.",
      rear_wing_lmp: "Alerón trasero (Rear wing) del prototipo LMP2. Ajusta el ángulo aerodinámico posterior para equilibrar la inmensa carga del morro con el apoyo dinámico trasero (Downforce).",
      camber_lf: "Caída delantera izquierda (Camber LF). Ángulo negativo de apoyo de la rueda. Permite que el neumático apoye plano al inclinarse el coche en giros de alta velocidad.",
      camber_lf_lmp: "Caída delantera izquierda (Camber LF). Permite que el neumático aproveche al máximo el parche de contacto en las exigentes fuerzas de gravedad laterales del LMP2.",
      toe_lf: "Convergencia delantera izquierda (Toe LF). Alineación. Valores negativos (divergencia) mejoran sustancialmente la velocidad de entrada del morro en curvas lentas.",
      toe_lf_lmp: "Convergencia delantera izquierda (Toe LF). Afecta directamente la agilidad con la que el chasis de carreras muerde el vértice de la curva.",
      camber_rf: "Caída delantera derecha (Camber RF). Asegura que el neumático delantero derecho sewgura el máximo parche de contacto y adherencia lateral posible en giros a la izquierda.",
      camber_rf_lmp: "Caída delantera derecha (Camber RF). Optimiza la superficie dinámica de agarre exterior derecho bajo apoyos de alto downforce.",
      toe_rf: "Convergencia delantera derecha (Toe RF). Modifica la agilidad al inicio del giro y el comportamiento longitudinal del neumático exterior.",
      toe_rf_lmp: "Convergencia delantera derecha (Toe RF). Da balance y estabilidad de guiñada al eje delantero.",
      camber_lr: "Caída trasera izquierda (Camber LR). Estabiliza la tracción lateral del eje trasero en curvas veloces.",
      camber_lr_lmp: "Caída trasera izquierda (Camber LR). Consigue estabilidad dinámica de la zaga para aguantar velocidades supersónicas en curvas de apoyo continuo.",
      toe_lr: "Convergencia trasera izquierda (Toe LR). Valores positivos (convergencia) ayudan a amarrar firmemente la parte trasera en aceleraciones continuas y pianos.",
      toe_lr_lmp: "Convergencia trasera izquierda (Toe LR). Asegura la estabilidad lineal trasera en tramos de alta velocidad punta.",
      camber_rr: "Caída trasera derecha (Camber RR). Optimiza la superficie de arrastre del neumático posterior derecho en apoyos pesados.",
      camber_rr_lmp: "Caída trasera derecha (Camber RR). Asegura un apoyo uniforme para evitar sobrecalentar una sección única del neumático trasero derecho.",
      toe_rr: "Convergencia trasera derecha (Toe RR). Centra la dirección longitudinal posterior ante oscilaciones dinámicas bruscas.",
      toe_rr_lmp: "Convergencia trasera derecha (Toe RR). Mapea el guiado longitudinal evitando latigazos del eje trasero al cruzar badenes.",
      diff_power: "Tasa de bloqueo del diferencial bajo aceleración (Diff Power). Valores altos garantizan que ambas ruedas traseras giren con la misma velocidad al dar gas, optimizando la tracción pero induciendo subviraje inicial.",
      diff_power_lmp: "Tasa de bloqueo de aceleración (Diff Power) del LMP2. Controla la transferencia de caballos del motor V8 a las salidas de curva. Valores altos mejoran tracción pero penalizan rotación.",
      diff_preload: "Precarga mecánica del diferencial (Diff Preload). Resistencia estática al deslizamiento del embrague. Regula la estabilidad y suavidad de reacción en la transición clave al soltar el freno e iniciar el gas.",
      diff_coast: "Bloqueo del diferencial en retención (Diff Coast). Niveles altos estabilizan el eje posterior reduciendo la guiñada violenta al soltar el pedal del acelerador.",
      diff_coast_lmp: "Bloqueo de retención (Diff Coast) del LMP2. Estabiliza el prototipo en entrada a curva de alta velocidad durante el trailbreaking agresivo al soltar el acelerador.",
      engine_limiter: "Limitador de motor (Engine Limiter). Regula el potencial y RPMs máximas del propulsor. Un nivel menor a 100 reduce el consumo y fatiga térmica a cambio de cierta aceleración.",
      brake_bias: "Reparto de frenada (Brake Bias). Porcentaje de potencia asignado al eje delantero. Una frenada delantera alta elimina latigazos traseros al coste de mermar la capacidad de giro inicial.",
      brake_bias_lmp: "Reparto del freno (Brake Bias) del LMP2. Mapea la distribución de potencia de frenado. Al no contar con ABS, una distribución equilibrada e idónea de este reparto previene bloqueos graves de los neumáticos.",
      brake_power: "Fuerza de freno máxima (Brake Power). Potencia y rigidez del pedal de freno. Niveles cercanos al 100% exprimen las pinzas, requiriendo excelente modulación para evitar el ABS continuo.",
      brake_power_lmp: "Potencia del freno (Brake Power) del LMP2. Determina el torque definitivo asignado al pedal de freno. Exige máxima modulación del piloto para evitar bloqueos desastrosos en las detenciones de gran velocidad.",
      arb_front: "Rigidez de la barra estabilizadora delantera (ARB Front). Rigidez que contiene el balanceo. Elevarla acelera la agilidad de entrada al volante, pero puede causar subviraje progresivo.",
      arb_front_lmp: "Barra antibalanceo delantera (ARB Front). Controla la rigidez contra el balanceo en curva lenta. Rigideces altas dan morro reactivo y rápido en curvas encadenadas.",
      arb_rear: "Rigidez de la barra estabilizadora trasera (ARB Rear). Rigidez reactiva lateral trasera. Valores mayores aumentan la sobreviración natural en salidas de curvas, mejorando la agilidad.",
      arb_rear_lmp: "Barra antibalanceo trasera (ARB Rear). Incrementa el balance sobrevirador facilitando la rotación ágil del tren posterior en curvas cerradas.",
      travel_range_lf: "Recorrido de suspensión delantera izquierda (Travel range LF). La máxima distancia que la suspensión puede contraerse mecánicamente antes de activar de lleno los topes rígidos.",
      travel_range_lf_lmp: "Recorrido delantero izquierdo (Travel range LF). Controla cuánta oscilación hacia el suelo se consiente dinámicamente antes de impactar los packers.",
      travel_range_rf: "Recorrido delantero derecho (Travel range RF). Distancia libre para regular la tracción corporal ante cabeceos de frenada.",
      travel_range_rf_lmp: "Recorrido delantero derecho (Travel range RF). Distancia de compresión vertical del muelle previo a tocar topes rígidos.",
      travel_range_lr: "Recorrido trasero izquierdo (Travel range LR). Flexión longitudinal residual en el eje motriz trasero izquierdo.",
      travel_range_lr_lmp: "Recorrido trasero izquierdo (Travel range LR). Espacio de oscilación libre del muelle mecánico para garantizar tracción uniforme.",
      travel_range_rr: "Recorrido trasero derecho (Travel range RR). Evita rotaciones subviradoras de apoyo cuando la zaga hace contacto duro sobre los límites del chasis.",
      travel_range_rr_lmp: "Recorrido trasero derecho (Travel range RR). Mantiene rango libre de absorción mecánica en el costado posterior derecho."
    };

    return detailsMap[id] || `El parámetro "${field.name}" modifica crucialmente el equilibrio y comportamiento dinámico de tu coche de simracing. Ajusta con cautela para adaptarlo a tus sensaciones en pista.`;
  };

  const renderCompactCtrl = (field: SetupField) => {
    const currentVal = values[field.id] !== undefined ? values[field.id] : (field.defaultValue || "");
    const min = field.min !== undefined ? field.min : 0;
    const max = field.max !== undefined ? field.max : 100;
    const ratio = field.type === FieldType.NUMBER
      ? Math.min(100, Math.max(0, ((parseFloat(currentVal) || 0) - min) / (max - min) * 100))
      : 0;

    return (
      <div key={field.id} className="space-y-1 text-xs border-b border-[#2A2A2E]/30 pb-2 last:border-b-0 last:pb-0">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <button
              type="button"
              onClick={() => setExplainingField(field)}
              className="text-stone-500 hover:text-[#66FCF1] transition-colors shrink-0"
              title="Explicación del parámetro"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <span className="text-stone-300 truncate font-mono text-[10.5px]" title={field.name}>
              {field.name.replace(/\s(LF|RF|LR|RR)$/i, "")}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-[#66FCF1] font-black text-xs">{currentVal}</span>
            {field.unit && <span className="text-[9px] text-[#6B6B70] font-normal">{field.unit}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => handleIncrement(field, -1)}
            className="w-5 h-5 bg-black/40 hover:bg-[#1E1E22] text-stone-300 disabled:opacity-30 border border-[#2A2A2E] rounded font-black text-[10px] flex items-center justify-center select-none cursor-pointer"
          >
            -
          </button>

          <div className="relative flex-1 h-3.5 bg-black rounded overflow-hidden border border-[#2E2E32]">
            <div className="absolute left-0 top-0 bottom-0 bg-[#66FCF1]/20 transition-all" style={{ width: `${ratio}%` }} />
            <input
              type="range"
              disabled={readOnly}
              min={min}
              max={max}
              step={field.step || 1}
              value={parseFloat(currentVal) || min}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
          </div>

          <button
            type="button"
            disabled={readOnly}
            onClick={() => handleIncrement(field, 1)}
            className="w-5 h-5 bg-black/40 hover:bg-[#1E1E22] text-stone-300 disabled:opacity-30 border border-[#2A2A2E] rounded font-black text-[10px] flex items-center justify-center select-none cursor-pointer"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderAxleBarCtrl = (field: SetupField) => {
    const currentVal = values[field.id] !== undefined ? values[field.id] : (field.defaultValue || "");
    const min = field.min ?? 0;
    const max = field.max ?? 10;
    const ratio = Math.min(100, Math.max(0, ((parseFloat(currentVal) || 0) - min) / (max - min) * 100));

    return (
      <div className="p-2 bg-black/35 border border-[#2A2A2E]/50 rounded text-left space-y-1">
        <div className="flex justify-between items-baseline text-[10px] font-mono">
          <span className="text-stone-400 font-bold uppercase truncate max-w-[120px]">{field.name}</span>
          <span className="text-[#64FFDA] font-black">{currentVal} {field.unit || ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => handleIncrement(field, -1)}
            className="w-4.5 h-4.5 bg-[#161618] hover:bg-stone-850 text-stone-300 disabled:opacity-30 rounded text-[9px] flex items-center justify-center font-bold"
          >
            -
          </button>
          <div className="relative flex-1 h-2 bg-black rounded overflow-hidden border border-[#2A2A2E]">
            <div className="absolute left-0 top-0 bottom-0 bg-[#64FFDA]/30 transition-all font-mono" style={{ width: `${ratio}%` }} />
            <input
              type="range"
              disabled={readOnly}
              min={min}
              max={max}
              step={field.step || 1}
              value={parseFloat(currentVal) || min}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
          </div>
          <button
            type="button"
            disabled={readOnly}
            onClick={() => handleIncrement(field, 1)}
            className="w-4.5 h-4.5 bg-[#161618] hover:bg-stone-850 text-stone-300 disabled:opacity-30 rounded text-[9px] flex items-center justify-center font-bold"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const activeSection = effectiveSections.find((s) => s.id === activeTab) || effectiveSections[0];

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-12 px-2 md:px-4">
      {/* Navigation Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-all uppercase font-mono bg-[#161618] border border-[#2A2A2E] px-3.5 py-2 rounded cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#FF3C3C] stroke-[3]" />
          Volver al Garaje
        </button>

        <span className="text-[10px] text-[#6B6B70] uppercase tracking-wider font-mono">
          Último cambio guardado: {new Date(setup.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Permission Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-stone-900 border border-stone-850 rounded-xl">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${readOnly ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
          <span className="text-xs font-mono font-bold text-stone-200">
            {readOnly ? "MODO LECTURA" : "MODO EDICIÓN ACTIVO"}
          </span>
          <span className="text-[11px] text-stone-400 font-mono hidden md:inline">
            {readOnly 
              ? `• Este reglamento es propiedad de ${setup.creatorName || "otro piloto"} (solo lectura)` 
              : `• Eres dueño de este reglamento o cuentas con permisos de Administrador`
            }
          </span>
        </div>
        {setup.creatorName && (
          <span className="text-xs font-mono text-cyan-400 bg-black/40 border border-stone-850 px-2.5 py-1 rounded">
            Alineador: <strong className="text-white">{setup.creatorName}</strong>
          </span>
        )}
      </div>

      {/* Identity & Metadata Editor Card */}
      <div className="tuning-card border border-[#1F1F23] rounded-xl flex flex-col md:flex-row overflow-hidden shadow-xl mt-4">
        
        <div className="flex-1 p-6 space-y-5">
          <div className="border-b border-[#1F1F23] pb-3 flex items-center justify-between">
            <h2 className="text-sm font-black font-mono text-white flex items-center gap-2 uppercase tracking-wide">
              <Compass className="w-4 h-4 text-[#FF3C3C]" />
              Ficha del Piloto: <span className="text-[#66FCF1] font-bold">{setup.car}</span>
            </h2>
            <span className="text-[9px] uppercase tracking-widest text-[#6B6B70] font-mono">Simulador: {setup.game}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-12 lg:col-span-12 xl:col-span-5 space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-stone-400 block">Título del Reglaje</label>
              <input
                type="text"
                disabled={readOnly}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#FF3C3C] font-mono disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-6 lg:col-span-6 xl:col-span-3 space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-stone-400 block">Record Vuelta</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="1:47.340"
                  value={metaLapTime}
                  onChange={(e) => setMetaLapTime(e.target.value)}
                  className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-[#66FCF1] rounded pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:border-[#FF3C3C] font-mono font-bold disabled:opacity-50"
                />
              </div>
            </div>

            <div className="sm:col-span-6 lg:col-span-6 xl:col-span-4 space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-stone-400 block">Condición Clima</label>
              <div className="grid grid-cols-3 gap-1 bg-[#0D0D0F] p-1 border border-[#2A2A2E] rounded">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaWeather("Dry")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaWeather === "Dry" ? "bg-amber-600 text-black font-extrabold" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  Seco
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaWeather("Wet")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaWeather === "Wet" ? "bg-[#66FCF1] text-black font-extrabold" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  Mojado
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaWeather("Mixed")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaWeather === "Mixed" ? "bg-indigo-600 text-white font-extrabold" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  Mixto
                </button>
              </div>
            </div>

          {/* Dynamic Category/SetupType Selection depending on simulator */}
          {setup.game === "Le Mans Ultimate" && (
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-[#FF3C3C] block">Reglaje Ajuste (LMU)</label>
              <div className="grid grid-cols-2 gap-1 bg-[#0D0D0F] p-1 border border-[#2A2A2E] rounded">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaSetupType("Libre")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaSetupType === "Libre" ? "bg-[#FF3C3C] text-black font-extrabold" : "text-[#88888C] hover:text-stone-200"
                  }`}
                >
                  Libre
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaSetupType("Fixed")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaSetupType === "Fixed" ? "bg-[#FF3C3C] text-black font-extrabold" : "text-[#88888C] hover:text-stone-200"
                  }`}
                >
                  Fixed
                </button>
              </div>
            </div>
          )}

          {setup.game === "Assetto Corsa" && (
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-[#66FCF1] block">Liga Separada (AC)</label>
              <div className="grid grid-cols-2 gap-1 bg-[#0D0D0F] p-1 border border-[#2A2A2E] rounded">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaSetupType("LFM")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaSetupType === "LFM" ? "bg-[#66FCF1] text-black font-extrabold" : "text-[#88888C] hover:text-stone-200"
                  }`}
                >
                  LFM (Low Fuel)
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && setMetaSetupType("RSX")}
                  className={`py-1 rounded text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase disabled:cursor-not-allowed cursor-pointer ${
                    metaSetupType === "RSX" ? "bg-[#FF3C3C] text-black font-extrabold" : "text-[#88888C] hover:text-stone-200"
                  }`}
                >
                  RSX Liga
                </button>
              </div>
            </div>
          )}

          <div className="sm:col-span-6 space-y-1">
            <label className="text-[9px] uppercase font-mono tracking-widest text-stone-400 block">Circuito Fijo</label>
            <input
              type="text"
              disabled={readOnly}
              value={metaTrack}
              onChange={(e) => setMetaTrack(e.target.value)}
              className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-white rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF3C3C] font-mono font-semibold disabled:opacity-50"
            />
          </div>

          <div className="sm:col-span-6 space-y-1">
            <label className="text-[9px] uppercase font-mono tracking-widest text-stone-400 block">Modelo Coche</label>
            <input
              type="text"
              disabled={readOnly}
              value={metaCar}
              onChange={(e) => setMetaCar(e.target.value)}
              className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-stone-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF3C3C] font-mono disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] uppercase font-mono tracking-widest text-stone-400">Notas de Conducción y Sensaciones</label>
            <span className="text-[9px] text-[#6B6B70] uppercase font-mono">Modera el desgaste o comportamiento</span>
          </div>
          <textarea
            rows={2}
            disabled={readOnly}
            value={metaNotes}
            onChange={(e) => setMetaNotes(e.target.value)}
            placeholder="Escribe sensaciones del coche, comportamiento aerodinámico o trucos del circuito..."
            className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-stone-200 rounded p-3 text-xs focus:outline-none focus:border-[#FF3C3C] font-mono leading-relaxed disabled:opacity-50"
          />
        </div>

        {!readOnly && (
          <div className="flex justify-end p-0.5">
            <div className="flex items-center gap-3 ml-auto">
              {saveStatus === "success" && (
                <span className="text-[#66FCF1] font-mono text-xs animate-pulse">¡Ficha Actualizada!</span>
              )}
              <button
                onClick={saveMetadata}
                className="px-4 py-2 bg-[#FF3C3C] hover:bg-red-500 text-black font-mono font-extrabold text-xs tracking-wider rounded uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-black stroke-[3]" />
                Guardar Ficha
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Right side background image */}
        {getCarImage(setup.car) && (
          <div className="md:w-[35%] relative min-h-[160px] hidden md:block border-l border-[#1F1F23]">
            <img src={getCarImage(setup.car)!} alt={setup.car} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#18181B] via-[#18181B]/70 to-transparent z-10" />
          </div>
        )}
      </div>

      {/* Actionable Glossary Panel Overlay */}
      <AnimatePresence>
        {explainingField && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="p-5 bg-[#161618] border border-[#FF3C3C]/20 rounded-xl space-y-2.5 relative active-glow shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#1F1F23] pb-1.5">
              <span className="text-[9px] font-mono tracking-wider uppercase text-[#FF3C3C] font-black block">
                GLOSARIO DE AJUSTE MECÁNICO
              </span>
              <button
                onClick={() => setExplainingField(null)}
                className="text-stone-500 hover:text-white text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="font-mono text-xs font-bold text-[#66FCF1] uppercase flex items-baseline gap-2">
              <span>{explainingField.name}</span>
              {explainingField.unit && <span className="text-[10px] text-[#FF3C3C] font-normal">({explainingField.unit})</span>}
            </div>

            <p className="p-3 bg-[#0D0D0F] border border-[#1F1F23] rounded text-xs text-stone-300 leading-relaxed font-sans leading-relaxed">
              {getFieldExplanation(explainingField)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Tabs Selector */}
      <div className="bg-[#0D0D0F] p-1 rounded-lg border border-[#1F1F23] flex items-center justify-between flex-wrap gap-1">
        <div className="flex flex-wrap gap-1">
          {effectiveSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === section.id
                  ? "bg-[#FF3C3C] text-black font-extrabold shadow-sm"
                  : "text-[#88888C] hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={() => setIsAddingSection(true)}
            className="px-2.5 py-1 rounded text-[10.5px] font-mono font-bold text-[#66FCF1] hover:bg-[#66FCF1]/10 transition-colors flex items-center gap-1 uppercase cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Añadir Sección
          </button>
        )}
      </div>

      {/* Section Add Box */}
      {isAddingSection && (
        <form onSubmit={handleAddSectionSubmit} className="p-4 bg-[#0D0D0F] border border-[#FF3C3C]/30 rounded flex items-center gap-3 animate-fade-in">
          <div className="flex-1 space-y-1">
            <label className="text-[9px] uppercase tracking-wider font-mono text-[#66FCF1]">Nombre de la nueva Sección de reglaje</label>
            <input
              type="text"
              required
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Ej. Suspensiones, Frenada, Alturas"
              className="w-full bg-[#050506] border border-[#2A2A2E] text-stone-200 rounded px-2.5 py-1 text-xs font-mono focus:border-[#FF3C3C]"
            />
          </div>
          <div className="flex gap-1 pt-4">
            <button
              type="button"
              onClick={() => setIsAddingSection(false)}
              className="px-2.5 py-1 bg-transparent text-stone-500 hover:text-stone-300 font-mono text-2xs uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 bg-[#FF3C3C] text-black font-extrabold rounded font-mono text-xs uppercase cursor-pointer"
            >
              Añadir
            </button>
          </div>
        </form>
      )}

      {/* Main Sheet Container */}
      <div className="tuning-card border border-[#1F1F23] rounded-xl overflow-hidden bg-black/15 shadow-xl">
        {activeSection && (
          <div className="divide-y divide-[#1F1F23]/40">
            {/* Header toolbar */}
            <div className="p-4 bg-[#141416] flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F1F23] gap-3">
              <div>
                <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">ÁREA ESTRUCTURAL</span>
                <h3 className="text-xs font-black tracking-wider text-[#66FCF1] uppercase font-mono mt-0.5">{activeSection.name}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">


                {!readOnly && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingField(activeSection.id)}
                      className="px-2.5 py-1.5 bg-[#0D0D0F] hover:bg-[#66FCF1]/10 border border-[#2A2A2E] hover:border-[#66FCF1]/30 text-[#66FCF1] rounded text-[10px] font-mono uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#66FCF1]" />
                      Añadir Variable
                    </button>

                    {effectiveSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSection(activeSection.id);
                          setActiveTab(effectiveSections.find(s => s.id !== activeSection?.id)?.id || "");
                        }}
                        className="p-1.5 bg-[#0D0D0F] border border-[#2A2A2E] text-stone-600 hover:text-[#FF3C3C] rounded transition-colors cursor-pointer"
                        title="Borrar sección estructural"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Field Creator Modal Form */}
            {isAddingField === activeSection.id && (
              <div className="p-4 bg-[#0A0A0C] border-b border-[#FF3C3C]/30 grid grid-cols-1 sm:grid-cols-12 gap-3 animate-fade-in font-mono text-2xs">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[9px] text-[#66FCF1] block">Nombre de la nueva Variable</label>
                  <input
                    type="text"
                    required
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Ej. Barra Antibuelco Posterior"
                    className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-2 py-1"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] text-stone-400 block">Tipo Control</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-1.5 py-1"
                  >
                    <option value={FieldType.NUMBER}>Número (Rango)</option>
                    <option value={FieldType.SELECT}>Opciones (Select)</option>
                    <option value={FieldType.TEXT}>Comentario/Texto</option>
                  </select>
                </div>

                {newFieldType === FieldType.NUMBER ? (
                  <>
                    <div className="sm:col-span-1 border-l border-[#1F1F23]/50 pl-1 space-y-1">
                      <label className="text-[9px] text-stone-400 block">Mínimo</label>
                      <input
                        type="number"
                        step="any"
                        value={newFieldMin}
                        onChange={(e) => setNewFieldMin(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-1.5 py-1"
                      />
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[9px] text-stone-400 block">Máximo</label>
                      <input
                        type="number"
                        step="any"
                        value={newFieldMax}
                        onChange={(e) => setNewFieldMax(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-1.5 py-1"
                      />
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[9px] text-stone-400 block">Salto</label>
                      <input
                        type="number"
                        step="any"
                        value={newFieldStep}
                        onChange={(e) => setNewFieldStep(parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-1.5 py-1"
                      />
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[9px] text-stone-400 block">Unidad</label>
                      <input
                        type="text"
                        value={newFieldUnit}
                        onChange={(e) => setNewFieldUnit(e.target.value)}
                        placeholder="psi, mm, °"
                        className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-1.5 py-1"
                      />
                    </div>
                  </>
                ) : newFieldType === FieldType.SELECT ? (
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9px] text-[#66FCF1] block">Opciones (Cachopo de comas)</label>
                    <input
                      type="text"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      placeholder="Ej. Blando, Regular, Firme"
                      className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-2 py-1"
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-4" />
                )}

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] text-stone-400 font-mono block">Valor Inicial</label>
                  <input
                    type="text"
                    value={newFieldDefaultVal}
                    onChange={(e) => setNewFieldDefaultVal(e.target.value)}
                    placeholder="Ej. 26.5"
                    className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-white rounded px-2 py-1"
                  />
                </div>

                <div className="sm:col-span-12 flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingField(null)}
                    className="px-2.5 py-1 bg-[#161618] hover:bg-[#1E1E22] text-stone-400 rounded text-2xs font-mono uppercase font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddFieldSubmit(activeSection.id)}
                    className="px-2.5 py-1 bg-[#FF3C3C] hover:bg-red-500 text-black font-extrabold rounded text-2xs font-mono uppercase cursor-pointer"
                  >
                    Insertar Casilla
                         </button>
                </div>
              </div>
            )}

            {/* Fields rows list */}
            <div className="p-4" id="fields-rows-list">
              {activeSection.fields.length === 0 ? (
                <div className="py-8 text-center text-stone-500 text-xs font-mono italic">
                  Esta sección se encuentra vacía. Pulsa en &quot;Agregar Variable&quot; arriba para incluir parámetros.
                </div>
              ) : (
                (() => {
                  const lfFields = activeSection.fields.filter(f => f.id.toLowerCase().endsWith("_lf") || f.name.toLowerCase().includes("lf") || f.name.toLowerCase().includes("left front") || f.name.toLowerCase().includes("delantero izquierdo") || f.name.toLowerCase().includes("delantera izquierda"));
                  const rfFields = activeSection.fields.filter(f => f.id.toLowerCase().endsWith("_rf") || f.name.toLowerCase().includes("rf") || f.name.toLowerCase().includes("right front") || f.name.toLowerCase().includes("delantero derecho") || f.name.toLowerCase().includes("delantera derecha"));
                  const lrFields = activeSection.fields.filter(f => f.id.toLowerCase().endsWith("_lr") || f.name.toLowerCase().includes("lr") || f.name.toLowerCase().includes("left rear") || f.name.toLowerCase().includes("trasero izquierdo") || f.name.toLowerCase().includes("trasera izquierda"));
                  const rrFields = activeSection.fields.filter(f => f.id.toLowerCase().endsWith("_rr") || f.name.toLowerCase().includes("rr") || f.name.toLowerCase().includes("right rear") || f.name.toLowerCase().includes("trasero derecho") || f.name.toLowerCase().includes("trasera derecha"));

                  const hasCorners = lfFields.length > 0 || rfFields.length > 0 || lrFields.length > 0 || rrFields.length > 0;
                  const generalFields = activeSection.fields.filter(f => 
                    !lfFields.includes(f) && 
                    !rfFields.includes(f) && 
                    !lrFields.includes(f) && 
                    !rrFields.includes(f)
                  );

                  if (hasCorners) {
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        {/* COL 1: LEFT SIDE (LF and LR) */}
                        <div className="lg:col-span-4 flex flex-col justify-between gap-5">
                          {/* LEFT FRONT (LF) WHEEL BOX */}
                          <div className="bg-[#09090A] border border-[#232327] hover:border-[#66FCF1]/30 p-4 rounded-xl space-y-4 transition-all relative overflow-hidden group/corner shadow-lg">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#66FCF1]/50" />
                            <div className="flex items-center justify-between border-b border-[#232327]/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black font-mono text-[#66FCF1] bg-[#66FCF1]/10 px-2 py-0.5 rounded leading-none border border-[#66FCF1]/15 border-b-2">LF</span>
                                <span className="text-11px font-bold font-mono text-stone-250 tracking-wide uppercase leading-none">Delantero Izquierdo</span>
                              </div>
                              <div className="w-3.5 h-6 border border-[#66FCF1]/40 rounded bg-black shadow shadow-[#66FCF1]/10 rotate-[-1deg]" />
                            </div>
                            <div className="space-y-4">
                              {lfFields.length > 0 ? (
                                lfFields.map(field => renderCompactCtrl(field))
                              ) : (
                                <div className="text-[10px] text-stone-600 font-mono italic py-2">Sin variables de esquina</div>
                              )}
                            </div>
                          </div>

                          {/* LEFT REAR (LR) WHEEL BOX */}
                          <div className="bg-[#09090A] border border-[#232327] hover:border-[#66FCF1]/30 p-4 rounded-xl space-y-4 transition-all relative overflow-hidden group/corner shadow-lg">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#3b82f6]/40" />
                            <div className="flex items-center justify-between border-b border-[#232327]/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded leading-none border border-[#3b82f6]/20">LR</span>
                                <span className="text-11px font-bold font-mono text-stone-250 tracking-wide uppercase leading-none">Trasero Izquierdo</span>
                              </div>
                              <div className="w-4 h-6 border border-[#66FCF1]/30 rounded bg-black shadow shadow-cyan-500/5 rotate-[-2deg]" />
                            </div>
                            <div className="space-y-4">
                              {lrFields.length > 0 ? (
                                lrFields.map(field => renderCompactCtrl(field))
                              ) : (
                                <div className="text-[10px] text-stone-600 font-mono italic py-2">Sin variables de esquina</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* COL 2: CENTER (CHASSIS CAR OUTLINE & AXLE CONTROLS) */}
                        <div className="lg:col-span-4 bg-[#070709] border border-[#1B1B1E] rounded-xl p-4 flex flex-col justify-between items-center relative min-h-[460px] overflow-hidden shadow-2xl">
                          {/* Live Dynamic Chassis Visualizer */}
                          <ChassisVisualizer activeSection={activeSection} values={values} />

                          {/* Front Axle Crossbar parameters (e.g. ARB Front) */}
                          <div className="w-full z-10 text-center space-y-2 mt-2">
                            <div className="text-[9px] uppercase tracking-widest text-[#6B6B70] font-mono">Eje Delantero (Front Axle)</div>
                            {activeSection.fields.some(f => f.id === "arb_front") ? (
                              <div className="mx-auto max-w-[210px] transform hover:scale-[1.02] transition-transform">
                                {renderAxleBarCtrl(activeSection.fields.find(f => f.id === "arb_front")!)}
                              </div>
                            ) : (
                              <p className="text-[10px] text-stone-600 font-mono italic">Barra Antivuelco Estándar</p>
                            )}
                          </div>

                          {/* Central Aero & Flight parameters */}
                          <div className="w-full z-10 p-3.5 bg-black/55 border border-stone-850 rounded-xl space-y-3 my-4 max-w-[230px] shadow-lg">
                            <div className="text-[8.5px] uppercase tracking-widest text-center text-[#66FCF1] font-mono font-black border-b border-[#232327] pb-1.5 flex items-center justify-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] animate-pulse" />
                              REGULACIONES CENTRALES
                            </div>
                            {generalFields.filter(f => f.id !== "arb_front" && f.id !== "arb_rear").length > 0 ? (
                              <div className="space-y-4">
                                {generalFields.filter(f => f.id !== "arb_front" && f.id !== "arb_rear").map(field => {
                                  const currentVal = values[field.id] !== undefined ? values[field.id] : (field.defaultValue || "");
                                  const min = field.min ?? 0;
                                  const max = field.max ?? 100;
                                  const ratio = Math.min(100, Math.max(0, ((parseFloat(currentVal) || 0) - min) / (max - min) * 100));

                                  return (
                                    <div key={field.id} className="space-y-1.5">
                                      <div className="flex justify-between items-baseline text-[10px] font-mono">
                                        <span className="text-stone-400 font-bold max-w-[140px] truncate" title={field.name}>{field.name}</span>
                                        <span className="text-[#66FCF1] font-black">{currentVal} {field.unit || ""}</span>
                                      </div>
                                      {field.type === FieldType.NUMBER ? (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            disabled={readOnly}
                                            onClick={() => handleIncrement(field, -1)}
                                            className="w-4 h-4 bg-[#141416] hover:bg-stone-800 disabled:opacity-30 rounded text-[9px] flex items-center justify-center font-bold font-mono text-stone-300"
                                          >
                                            -
                                          </button>
                                          <div className="relative flex-1 h-1.5 bg-stone-950 rounded overflow-hidden border border-[#1C1C1F]">
                                            <div className="absolute left-0 top-0 bottom-0 bg-[#66FCF1]/20 transition-all" style={{ width: `${ratio}%` }} />
                                            <input
                                              type="range"
                                              disabled={readOnly}
                                              min={min}
                                              max={max}
                                              step={field.step || 1}
                                              value={parseFloat(currentVal) || min}
                                              onChange={(e) => handleValueChange(field.id, e.target.value)}
                                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            disabled={readOnly}
                                            onClick={() => handleIncrement(field, 1)}
                                            className="w-4 h-4 bg-[#141416] hover:bg-stone-800 disabled:opacity-30 rounded text-[9px] flex items-center justify-center font-bold font-mono text-stone-300"
                                          >
                                            +
                                          </button>
                                        </div>
                                      ) : field.type === FieldType.SELECT ? (
                                        <select
                                          disabled={readOnly}
                                          value={currentVal}
                                          onChange={(e) => handleValueChange(field.id, e.target.value)}
                                          className="w-full bg-[#0E0E10] border border-[#222226] text-[10px] font-mono text-stone-300 rounded px-1.5 py-0.5 focus:outline-none"
                                        >
                                          {(field.options || []).map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-stone-500 text-center font-mono italic py-2">Parámetros del Eje Asignados</div>
                            )}
                          </div>

                          {/* Rear Axle Crossbar parameters (e.g. ARB Rear / Spoiler Wing) */}
                          <div className="w-full z-10 text-center space-y-2 mb-2">
                            {activeSection.fields.some(f => f.id === "arb_rear") ? (
                              <div className="mx-auto max-w-[210px] transform hover:scale-[1.02] transition-transform">
                                {renderAxleBarCtrl(activeSection.fields.find(f => f.id === "arb_rear")!)}
                              </div>
                            ) : activeSection.fields.some(f => f.id === "rear_wing") ? (
                              <div className="mx-auto max-w-[210px] transform hover:scale-[1.02] transition-transform">
                                {renderAxleBarCtrl(activeSection.fields.find(f => f.id === "rear_wing")!)}
                              </div>
                            ) : (
                              <p className="text-[10px] text-stone-600 font-mono italic">Tracción Base (Eje Trasero)</p>
                            )}
                            <div className="text-[9px] uppercase tracking-widest text-[#6B6B70] font-mono">Eje Trasero (Rear Axle / Aerodinámica)</div>
                          </div>
                        </div>

                        {/* COL 3: RIGHT SIDE (RF and RR) */}
                        <div className="lg:col-span-4 flex flex-col justify-between gap-5">
                          {/* RIGHT FRONT (RF) WHEEL BOX */}
                          <div className="bg-[#09090A] border border-[#232327] hover:border-[#66FCF1]/30 p-4 rounded-xl space-y-4 transition-all relative overflow-hidden group/corner shadow-lg">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#66FCF1]/50" />
                            <div className="flex items-center justify-between border-b border-[#232327]/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black font-mono text-[#66FCF1] bg-[#66FCF1]/10 px-2 py-0.5 rounded leading-none border border-[#66FCF1]/15 border-b-2">RF</span>
                                <span className="text-11px font-bold font-mono text-stone-250 tracking-wide uppercase leading-none">Delantero Derecho</span>
                              </div>
                              <div className="w-3.5 h-6 border border-[#66FCF1]/40 rounded bg-black shadow shadow-[#66FCF1]/10 rotate-[1deg]" />
                            </div>
                            <div className="space-y-4">
                              {rfFields.length > 0 ? (
                                rfFields.map(field => renderCompactCtrl(field))
                              ) : (
                                <div className="text-[10px] text-stone-600 font-mono italic py-2">Sin variables de esquina</div>
                              )}
                            </div>
                          </div>

                          {/* RIGHT REAR (RR) WHEEL BOX */}
                          <div className="bg-[#09090A] border border-[#232327] hover:border-[#66FCF1]/30 p-4 rounded-xl space-y-4 transition-all relative overflow-hidden group/corner shadow-lg">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#3b82f6]/40" />
                            <div className="flex items-center justify-between border-b border-[#232327]/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded leading-none border border-[#3b82f6]/20">RR</span>
                                <span className="text-11px font-bold font-mono text-stone-250 tracking-wide uppercase leading-none">Trasero Derecho</span>
                              </div>
                              <div className="w-4 h-6 border border-[#66FCF1]/30 rounded bg-black shadow shadow-cyan-500/5 rotate-[2deg]" />
                            </div>
                            <div className="space-y-4">
                              {rrFields.length > 0 ? (
                                rrFields.map(field => renderCompactCtrl(field))
                              ) : (
                                <div className="text-[10px] text-stone-600 font-mono italic py-2">Sin variables de esquina</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    {/* Bento grid layout fallback for sections without wheels */}
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeSection.fields.map(field => {
                          const currentVal = values[field.id] !== undefined ? values[field.id] : (field.defaultValue || "");
                          const min = field.min !== undefined ? field.min : 0;
                          const max = field.max !== undefined ? field.max : 100;
                          const ratio = field.type === FieldType.NUMBER
                            ? Math.min(100, Math.max(0, ((parseFloat(currentVal) || 0) - min) / (max - min) * 100))
                            : 0;

                          return (
                            <div key={field.id} className="bg-[#09090A] border border-[#232327] hover:border-[#66FCF1]/20 p-4 rounded-xl space-y-4 transition-colors">
                              <div className="flex items-center justify-between border-b border-[#232327]/70 pb-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setExplainingField(field)}
                                    className="text-stone-500 hover:text-[#66FCF1] transition-colors"
                                    title="Explicación del parámetro"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-bold font-mono text-stone-250 uppercase">{field.name}</span>
                                </div>
                                {field.unit && (
                                  <span className="text-[9px] font-mono font-bold text-[#66FCF1] bg-[#66FCF1]/10 px-1.5 py-0.5 rounded border border-[#66FCF1]/15">
                                    {field.unit}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  {field.type === FieldType.NUMBER ? (
                                    <div className="w-full space-y-2">
                                      <div className="flex justify-between items-center text-xs font-mono">
                                        <span className="text-[10px] text-stone-500">{min}</span>
                                        <span className="text-emerald-400 font-black text-sm bg-black/45 px-2.5 py-0.5 rounded border border-stone-850">{currentVal}</span>
                                        <span className="text-[10px] text-stone-500">{max}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          disabled={readOnly}
                                          onClick={() => handleIncrement(field, -1)}
                                          className="w-7 h-7 bg-[#161618] hover:bg-stone-800 disabled:opacity-40 text-stone-200 border border-[#2A2A2E] rounded font-bold font-mono text-xs flex items-center justify-center cursor-pointer select-none"
                                        >
                                          -
                                        </button>
                                        
                                        <div className="relative flex-1 h-5 bg-[#0D0D0F] rounded overflow-hidden border border-[#2A2A2E]">
                                          <div className="absolute left-0 top-0 bottom-0 bg-[#66FCF1]/15 transition-all" style={{ width: `${ratio}%` }} />
                                          <input
                                            type="range"
                                            disabled={readOnly}
                                            min={min}
                                            max={max}
                                            step={field.step || 1}
                                            value={parseFloat(currentVal) || min}
                                            onChange={(e) => handleValueChange(field.id, e.target.value)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                          />
                                        </div>

                                        <button
                                          type="button"
                                          disabled={readOnly}
                                          onClick={() => handleIncrement(field, 1)}
                                          className="w-7 h-7 bg-[#161618] hover:bg-stone-800 disabled:opacity-40 text-stone-200 border border-[#2A2A2E] rounded font-bold font-mono text-xs flex items-center justify-center cursor-pointer select-none"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  ) : field.type === FieldType.SELECT ? (
                                    <div className="w-full">
                                      <select
                                        disabled={readOnly}
                                        value={currentVal}
                                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                                        className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-xs font-mono text-[#66FCF1] font-black rounded p-1.5 focus:outline-none focus:border-[#FF3C3C] cursor-pointer"
                                      >
                                        {(field.options || []).map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      disabled={readOnly}
                                      value={currentVal}
                                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                                      placeholder="Comentario de reglaje"
                                      className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-xs font-mono text-stone-300 rounded p-1.5 focus:outline-none focus:border-[#FF3C3C]"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
