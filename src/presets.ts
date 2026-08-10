import { SetupTemplate, SetupSection, FieldType } from "./types";

export interface OfficialLeague {
  id: string;
  name: string;
  description: string;
  colorTheme: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  bgGlow: string;
}

export const OFFICIAL_LEAGUES: OfficialLeague[] = [
  {
    id: "ERC: Hypercar",
    name: "ERC: Hypercar",
    description: "Liga ERC división reina Hypercar",
    colorTheme: "border-amber-500/30 bg-amber-950/10 text-amber-400",
    badgeBg: "bg-amber-950/50 border-amber-500/30 text-amber-400",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
    bgGlow: "bg-amber-950/20",
  },
  {
    id: "Ferrari GT3-Hypercar",
    name: "Ferrari GT3-Hypercar",
    description: "Liga monomarca Ferrari GT3 (296 GT3) y Hypercar (499P LMH)",
    colorTheme: "border-red-500/30 bg-red-950/10 text-red-400",
    badgeBg: "bg-red-950/50 border-red-500/30 text-red-400",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    bgGlow: "bg-red-950/20",
  },
  {
    id: "ERC NG",
    name: "ERC NG",
    description: "Liga Next-Gen GT3 (Lexus, BMW, Porsche) y LMP2 (Oreca 07)",
    colorTheme: "border-cyan-500/30 bg-cyan-950/10 text-cyan-400",
    badgeBg: "bg-cyan-950/50 border-cyan-500/30 text-cyan-400",
    borderColor: "border-cyan-500/20",
    textColor: "text-cyan-400",
    bgGlow: "bg-cyan-950/20",
  },
];

export interface OfficialVehicle {
  id: string;
  name: string;
  category: "GT3" | "LMP2" | "Hypercar";
  league: "ERC: Hypercar" | "Ferrari GT3-Hypercar" | "ERC NG";
  brand: string;
  year?: string;
  defaultDorsals?: string[];
  badgeColor: string;
  borderColor: string;
  textColor: string;
  bgGlow: string;
  badgeBg: string;
}

export const OFFICIAL_VEHICLES: OfficialVehicle[] = [
  // --- ERC: Hypercar ---
  {
    id: "Porsche 963 LMDh | Hypercar",
    name: "Porsche 963 LMDh (EMKA Hypercar)",
    category: "Hypercar",
    league: "ERC: Hypercar",
    brand: "Porsche / EMKA",
    defaultDorsals: ["5", "50", "963"],
    badgeColor: "amber",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
    bgGlow: "bg-amber-950/20",
    badgeBg: "bg-amber-950/50 border-amber-500/30 text-amber-400",
  },
  {
    id: "Hypercar | ERC",
    name: "Hypercar (Por elegir modelo)",
    category: "Hypercar",
    league: "ERC: Hypercar",
    brand: "Hypercar",
    defaultDorsals: ["1", "50"],
    badgeColor: "amber",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
    bgGlow: "bg-amber-950/20",
    badgeBg: "bg-amber-950/50 border-amber-500/30 text-amber-400",
  },
  // --- Ferrari GT3-Hypercar ---
  {
    id: "Ferrari 296 GT3",
    name: "Ferrari 296 GT3",
    category: "GT3",
    league: "Ferrari GT3-Hypercar",
    brand: "Ferrari",
    defaultDorsals: ["29", "51"],
    badgeColor: "red",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    bgGlow: "bg-red-950/20",
    badgeBg: "bg-red-950/50 border-red-500/30 text-red-400",
  },
  {
    id: "Ferrari 499P LMH",
    name: "Ferrari 499P LMH (Hypercar)",
    category: "Hypercar",
    league: "Ferrari GT3-Hypercar",
    brand: "Ferrari",
    defaultDorsals: ["50", "51"],
    badgeColor: "red",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    bgGlow: "bg-red-950/20",
    badgeBg: "bg-red-950/50 border-red-500/30 text-red-400",
  },
  // --- ERC NG ---
  {
    id: "Oreca 07 | LMP2",
    name: "Oreca 07 LMP2",
    category: "LMP2",
    league: "ERC NG",
    brand: "Oreca",
    defaultDorsals: ["32", "43"],
    badgeColor: "fuchsia",
    borderColor: "border-fuchsia-500/20",
    textColor: "text-fuchsia-400",
    bgGlow: "bg-fuchsia-950/20",
    badgeBg: "bg-fuchsia-950/50 border-fuchsia-500/30 text-fuchsia-400",
  },
  {
    id: "Lexus RC F | GT3",
    name: "Lexus RC F GT3",
    category: "GT3",
    league: "ERC NG",
    brand: "Lexus",
    defaultDorsals: ["5", "8"],
    badgeColor: "red",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    bgGlow: "bg-red-950/20",
    badgeBg: "bg-red-950/50 border-red-500/30 text-red-400",
  },
  {
    id: "BMW M4 2021 | GT3",
    name: "BMW M4 GT3 2021",
    category: "GT3",
    league: "ERC NG",
    brand: "BMW",
    year: "2021",
    defaultDorsals: ["23"],
    badgeColor: "blue",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
    bgGlow: "bg-blue-950/20",
    badgeBg: "bg-blue-950/50 border-blue-500/30 text-blue-400",
  },
  {
    id: "Porsche 992 R 2023 | GT3",
    name: "Porsche 992 R 2023 GT3",
    category: "GT3",
    league: "ERC NG",
    brand: "Porsche",
    year: "2023",
    defaultDorsals: ["91"],
    badgeColor: "emerald",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-400",
    bgGlow: "bg-emerald-950/20",
    badgeBg: "bg-emerald-950/50 border-emerald-500/30 text-emerald-400",
  },
];

export const LE_MANS_ULTIMATE_GT3_TEMPLATE: SetupTemplate = {
  id: "le-mans-ultimate-gt3",
  title: "Le Mans Ultimate (GT3)",
  description: "Estructura completa para reglajes de GT3 en Le Mans Ultimate (Soporta esquemas tanto libres como fixed).",
  sections: [
    {
      id: "tyres",
      name: "Neumáticos y Presión",
      fields: [
        { id: "psi_fl", name: "Presión Delantera Izquierda", type: FieldType.NUMBER, min: 23.0, max: 29.5, step: 0.1, unit: "psi", defaultValue: "25.5" },
        { id: "psi_fr", name: "Presión Delantera Derecha", type: FieldType.NUMBER, min: 23.0, max: 29.5, step: 0.1, unit: "psi", defaultValue: "25.5" },
        { id: "psi_rl", name: "Presión Trasera Izquierda", type: FieldType.NUMBER, min: 23.0, max: 29.5, step: 0.1, unit: "psi", defaultValue: "26.0" },
        { id: "psi_rr", name: "Presión Trasera Derecha", type: FieldType.NUMBER, min: 23.0, max: 29.5, step: 0.1, unit: "psi", defaultValue: "26.0" },
      ]
    },
    {
      id: "aero",
      name: "Aerodinámica y Altura",
      fields: [
        { id: "rear_wing", name: "Alerón Trasero", type: FieldType.NUMBER, min: 0, max: 15, step: 1, unit: "clic", defaultValue: "6" },
        { id: "ride_height_f", name: "Altura Chasis Delantera", type: FieldType.NUMBER, min: 45, max: 80, step: 1, unit: "mm", defaultValue: "55" },
        { id: "ride_height_r", name: "Altura Chasis Trasera", type: FieldType.NUMBER, min: 55, max: 95, step: 1, unit: "mm", defaultValue: "70" },
      ]
    },
    {
      id: "electronics",
      name: "Electrónica y Tracción",
      fields: [
        { id: "tc", name: "Control de Tracción (TC)", type: FieldType.NUMBER, min: 0, max: 10, step: 1, unit: "nivel", defaultValue: "3" },
        { id: "abs", name: "Sistema de Frenado (ABS)", type: FieldType.NUMBER, min: 0, max: 10, step: 1, unit: "nivel", defaultValue: "4" },
      ]
    }
  ]
};

export const ASSETTO_CORSA_GT3_TEMPLATE: SetupTemplate = {
  id: "assetto-corsa-gt3",
  title: "Assetto Corsa (GT3)",
  description: "Plantilla oficial completa con todas las variables de puesta a punto de un GT3 en Assetto Corsa.",
  sections: [
    {
      id: "gears",
      name: "Gears",
      fields: [
        { id: "gears", name: "Gears", type: FieldType.SELECT, defaultValue: "Standard", options: ["Short", "Standard", "Long"] }
      ]
    },
    {
      id: "tyres",
      name: "Tyres",
      fields: [
        { id: "compound", name: "Type set", type: FieldType.SELECT, defaultValue: "Michelin SBM (SBM)", options: ["Michelin SBM (SBM)", "Rain (WET)"] },
        { id: "press_lf", name: "Pressure LF", type: FieldType.NUMBER, min: 15, max: 48, step: 1, unit: "psi", defaultValue: "20" },
        { id: "press_rf", name: "Pressure RF", type: FieldType.NUMBER, min: 15, max: 48, step: 1, unit: "psi", defaultValue: "20" },
        { id: "press_lr", name: "Pressure LR", type: FieldType.NUMBER, min: 15, max: 48, step: 1, unit: "psi", defaultValue: "18" },
        { id: "press_rr", name: "Pressure RR", type: FieldType.NUMBER, min: 15, max: 48, step: 1, unit: "psi", defaultValue: "18" }
      ]
    },
    {
      id: "fuel",
      name: "Fuel",
      fields: [
        { id: "liters", name: "Fuel", type: FieldType.NUMBER, min: 0, max: 100, step: 1, unit: "L", defaultValue: "100" }
      ]
    },
    {
      id: "electronics",
      name: "Electronics",
      fields: [
        { id: "tc", name: "Traction Control", type: FieldType.NUMBER, min: 0, max: 11, step: 1, defaultValue: "6" },
        { id: "abs", name: "ABS", type: FieldType.NUMBER, min: 0, max: 11, step: 1, defaultValue: "8" }
      ]
    },
    {
      id: "aero",
      name: "Aero",
      fields: [
        { id: "rear_wing", name: "Rear", type: FieldType.NUMBER, min: 1, max: 10, step: 1, unit: "°", defaultValue: "3" }
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      fields: [
        { id: "camber_lf", name: "Camber LF", type: FieldType.NUMBER, min: -4.0, max: 0.0, step: 0.1, unit: "°", defaultValue: "-3.0" },
        { id: "toe_lf", name: "Toe LF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "11" },
        { id: "camber_rf", name: "Camber RF", type: FieldType.NUMBER, min: -4.0, max: -1.0, step: 0.1, unit: "°", defaultValue: "-3.0" },
        { id: "toe_rf", name: "Toe RF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "11" },
        { id: "camber_lr", name: "Camber LR", type: FieldType.NUMBER, min: -4.0, max: 0.0, step: 0.1, unit: "°", defaultValue: "-2.5" },
        { id: "toe_lr", name: "Toe LR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "14" },
        { id: "camber_rr", name: "Camber RR", type: FieldType.NUMBER, min: -4.0, max: 0.0, step: 0.1, unit: "°", defaultValue: "-2.5" },
        { id: "toe_rr", name: "Toe RR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "14" }
      ]
    },
    {
      id: "bumpstop",
      name: "Bumpstop",
      fields: [
        { id: "bumpstop_rate_f", name: "Bumpstop rate F", type: FieldType.SELECT, defaultValue: "Soft", options: ["Stiff", "Soft"] },
        { id: "travel_range_lf", name: "Travel range LF", type: FieldType.NUMBER, min: 30, max: 80, step: 1, unit: "mm", defaultValue: "71" },
        { id: "travel_range_rf", name: "Travel range RF", type: FieldType.NUMBER, min: 30, max: 80, step: 1, unit: "mm", defaultValue: "71" },
        { id: "travel_range_lr", name: "Travel range LR", type: FieldType.NUMBER, min: 30, max: 80, step: 1, unit: "mm", defaultValue: "75" },
        { id: "travel_range_rr", name: "Travel range RR", type: FieldType.NUMBER, min: 30, max: 80, step: 1, unit: "mm", defaultValue: "75" },
        { id: "bumpstop_rate_r", name: "Bumpstop rate R", type: FieldType.SELECT, defaultValue: "Soft", options: ["Stiff", "Soft"] }
      ]
    },
    {
      id: "dampers",
      name: "Dampers",
      fields: [
        { id: "bump_lf", name: "Bump LF", type: FieldType.NUMBER, min: 11000, max: 20000, step: 1000, defaultValue: "13000" },
        { id: "fst_bump_lf", name: "FST Bump LF", type: FieldType.NUMBER, min: 3000, max: 9000, step: 500, defaultValue: "5000" },
        { id: "rebound_lf", name: "Rebound LF", type: FieldType.NUMBER, min: 11000, max: 25000, step: 1000, defaultValue: "17000" },
        { id: "fst_rebound_lf", name: "FST Rebound LF", type: FieldType.NUMBER, min: 3000, max: 10000, step: 500, defaultValue: "5000" },
        { id: "bump_rf", name: "Bump RF", type: FieldType.NUMBER, min: 11000, max: 20000, step: 1000, defaultValue: "13000" },
        { id: "fst_bump_rf", name: "FST Bump RF", type: FieldType.NUMBER, min: 3000, max: 9000, step: 500, defaultValue: "5000" },
        { id: "rebound_rf", name: "Rebound RF", type: FieldType.NUMBER, min: 11000, max: 25000, step: 1000, defaultValue: "17000" },
        { id: "fst_rebound_rf", name: "FST Rebound RF", type: FieldType.NUMBER, min: 3000, max: 10000, step: 500, defaultValue: "5000" },
        { id: "bump_lr", name: "Bump LR", type: FieldType.NUMBER, min: 11000, max: 20000, step: 1000, defaultValue: "13000" },
        { id: "fst_bump_lr", name: "FST Bump LR", type: FieldType.NUMBER, min: 3000, max: 9000, step: 500, defaultValue: "5000" },
        { id: "rebound_lr", name: "Rebound LR", type: FieldType.NUMBER, min: 11000, max: 25000, step: 1000, defaultValue: "17000" },
        { id: "fst_rebound_lr", name: "FST Rebound LR", type: FieldType.NUMBER, min: 3000, max: 10000, step: 500, defaultValue: "5000" },
        { id: "bump_rr", name: "Bump RR", type: FieldType.NUMBER, min: 11000, max: 20000, step: 1000, defaultValue: "13000" },
        { id: "fst_bump_rr", name: "FST Bump RR", type: FieldType.NUMBER, min: 3000, max: 9000, step: 500, defaultValue: "5000" },
        { id: "rebound_rr", name: "Rebound RR", type: FieldType.NUMBER, min: 11000, max: 25000, step: 1000, defaultValue: "17000" },
        { id: "fst_rebound_rr", name: "FST Rebound RR", type: FieldType.NUMBER, min: 3000, max: 10000, step: 500, defaultValue: "5000" }
      ]
    },
    {
      id: "drivetrain",
      name: "Drivetrain",
      fields: [
        { id: "diff_power", name: "Diff Power", type: FieldType.NUMBER, min: 10, max: 90, step: 10, unit: "%", defaultValue: "20" },
        { id: "diff_preload", name: "Diff Preload", type: FieldType.NUMBER, min: 20, max: 300, step: 10, unit: "Nm", defaultValue: "90" },
        { id: "diff_coast", name: "Diff Coast", type: FieldType.NUMBER, min: 10, max: 90, step: 10, unit: "%", defaultValue: "30" }
      ]
    },
    {
      id: "generic",
      name: "Generic",
      fields: [
        { id: "brake_bias", name: "Brake Bias", type: FieldType.NUMBER, min: 52, max: 80, step: 1, unit: "%", defaultValue: "66" }
      ]
    },
    {
      id: "suspension",
      name: "Suspension",
      fields: [
        { id: "arb_front", name: "ARB Front", type: FieldType.NUMBER, min: 30000, max: 120000, step: 10000, defaultValue: "50000" },
        { id: "wheel_rate_lf", name: "Wheel rate LF", type: FieldType.NUMBER, min: 90, max: 180, step: 10, unit: "N/mm", defaultValue: "130" },
        { id: "height_lf", name: "Height LF", type: FieldType.NUMBER, min: 0, max: 35, step: 1, defaultValue: "21" },
        { id: "wheel_rate_rf", name: "Wheel rate RF", type: FieldType.NUMBER, min: 90, max: 180, step: 10, unit: "N/mm", defaultValue: "130" },
        { id: "height_rf", name: "Height RF", type: FieldType.NUMBER, min: 0, max: 35, step: 1, defaultValue: "21" },
        { id: "wheel_rate_lr", name: "Wheel rate LR", type: FieldType.NUMBER, min: 90, max: 180, step: 10, unit: "N/mm", defaultValue: "130" },
        { id: "height_lr", name: "Height LR", type: FieldType.NUMBER, min: 0, max: 35, step: 1, defaultValue: "21" },
        { id: "wheel_rate_rr", name: "Wheel rate RR", type: FieldType.NUMBER, min: 90, max: 180, step: 10, unit: "N/mm", defaultValue: "130" },
        { id: "height_rr", name: "Height RR", type: FieldType.NUMBER, min: 0, max: 35, step: 1, defaultValue: "21" },
        { id: "arb_rear", name: "ARB Rear", type: FieldType.NUMBER, min: 10000, max: 40000, step: 5000, defaultValue: "30000" }
      ]
    }
  ]
};

export const ASSETTO_CORSA_LMP2_TEMPLATE: SetupTemplate = {
  id: "assetto-corsa-lmp2",
  title: "Assetto Corsa (LMP2)",
  description: "Plantilla oficial completa con todas las variables de puesta a punto de un LMP2 en Assetto Corsa.",
  sections: [
    {
      id: "gears",
      name: "Gears",
      fields: [
        { id: "gears_lmp", name: "Gears", type: FieldType.SELECT, defaultValue: "Medium", options: ["Short", "Medium", "Long", "Le Mans"] }
      ]
    },
    {
      id: "tyres",
      name: "Tyres",
      fields: [
        { id: "compound_lmp", name: "Type set", type: FieldType.SELECT, defaultValue: "Medium (M)", options: ["Medium (M)", "Rain (WET)"] },
        { id: "press_lf_lmp", name: "Pressure LF", type: FieldType.NUMBER, min: 15, max: 35, step: 1, unit: "psi", defaultValue: "22" },
        { id: "press_rf_lmp", name: "Pressure RF", type: FieldType.NUMBER, min: 15, max: 35, step: 1, unit: "psi", defaultValue: "22" },
        { id: "press_lr_lmp", name: "Pressure LR", type: FieldType.NUMBER, min: 15, max: 35, step: 1, unit: "psi", defaultValue: "22" },
        { id: "press_rr_lmp", name: "Pressure RR", type: FieldType.NUMBER, min: 15, max: 35, step: 1, unit: "psi", defaultValue: "22" }
      ]
    },
    {
      id: "fuel",
      name: "Fuel",
      fields: [
        { id: "liters_lmp", name: "Fuel", type: FieldType.NUMBER, min: 0, max: 35, step: 1, unit: "L", defaultValue: "35" }
      ]
    },
    {
      id: "electronics",
      name: "Electronics",
      fields: [
         { id: "tc_lmp", name: "Traction Control", type: FieldType.NUMBER, min: 0, max: 11, step: 1, defaultValue: "8" }
      ]
    },
    {
      id: "aero",
      name: "Aero",
      fields: [
        { id: "rear_wing_lmp", name: "Rear", type: FieldType.NUMBER, min: 1, max: 10, step: 1, unit: "°", defaultValue: "1" }
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      fields: [
        { id: "camber_lf_lmp", name: "Camber LF", type: FieldType.NUMBER, min: -4.0, max: -1.0, step: 0.1, unit: "°", defaultValue: "-1.0" },
        { id: "toe_lf_lmp", name: "Toe LF", type: FieldType.NUMBER, min: -30, max: 30, step: 1, defaultValue: "4" },
        { id: "camber_rf_lmp", name: "Camber RF", type: FieldType.NUMBER, min: -4.0, max: -1.0, step: 0.1, unit: "°", defaultValue: "-1.0" },
        { id: "toe_rf_lmp", name: "Toe RF", type: FieldType.NUMBER, min: -30, max: 30, step: 1, defaultValue: "4" },
        { id: "camber_lr_lmp", name: "Camber LR", type: FieldType.NUMBER, min: -4.0, max: -1.0, step: 0.1, unit: "°", defaultValue: "-1.0" },
        { id: "toe_lr_lmp", name: "Toe LR", type: FieldType.NUMBER, min: -60, max: 60, step: 1, defaultValue: "5" },
        { id: "camber_rr_lmp", name: "Camber RR", type: FieldType.NUMBER, min: -4.0, max: -1.0, step: 0.1, unit: "°", defaultValue: "-1.0" },
        { id: "toe_rr_lmp", name: "Toe RR", type: FieldType.NUMBER, min: -30, max: 30, step: 1, defaultValue: "5" }
      ]
    },
    {
      id: "bumpstop",
      name: "Bumpstop",
      fields: [
        { id: "bumpstop_rate_f_lmp", name: "Bumpstop rate F", type: FieldType.SELECT, defaultValue: "Stiff", options: ["Soft", "Stiff"] },
        { id: "travel_range_lf_lmp", name: "Travel range LF", type: FieldType.NUMBER, min: 20, max: 80, step: 1, unit: "mm", defaultValue: "55" },
        { id: "travel_range_rf_lmp", name: "Travel range RF", type: FieldType.NUMBER, min: 20, max: 80, step: 1, unit: "mm", defaultValue: "55" },
        { id: "travel_range_lr_lmp", name: "Travel range LR", type: FieldType.NUMBER, min: 20, max: 80, step: 1, unit: "mm", defaultValue: "60" },
        { id: "travel_range_rr_lmp", name: "Travel range RR", type: FieldType.NUMBER, min: 20, max: 80, step: 1, unit: "mm", defaultValue: "60" },
        { id: "bumpstop_rate_r_lmp", name: "Bumpstop rate R", type: FieldType.SELECT, defaultValue: "Soft", options: ["Soft", "Stiff"] }
      ]
    },
    {
      id: "dampers",
      name: "Dampers",
      fields: [
        { id: "bump_lf_lmp", name: "Bump LF", type: FieldType.NUMBER, min: 7000, max: 16000, step: 500, defaultValue: "13000" },
        { id: "fst_bump_lf_lmp", name: "FST Bump LF", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "2000" },
        { id: "rebound_lf_lmp", name: "Rebound LF", type: FieldType.NUMBER, min: 10000, max: 25000, step: 500, defaultValue: "22000" },
        { id: "fst_rebound_lf_lmp", name: "FST Rebound LF", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "6000" },
        { id: "bump_rf_lmp", name: "Bump RF", type: FieldType.NUMBER, min: 7000, max: 16000, step: 500, defaultValue: "13000" },
        { id: "fst_bump_rf_lmp", name: "FST Bump RF", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "2000" },
        { id: "rebound_rf_lmp", name: "Rebound RF", type: FieldType.NUMBER, min: 10000, max: 25000, step: 500, defaultValue: "22000" },
        { id: "fst_rebound_rf_lmp", name: "FST Rebound RF", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "6000" },
        { id: "bump_lr_lmp", name: "Bump LR", type: FieldType.NUMBER, min: 7000, max: 16000, step: 500, defaultValue: "12500" },
        { id: "fst_bump_lr_lmp", name: "FST Bump LR", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "2000" },
        { id: "rebound_lr_lmp", name: "Rebound LR", type: FieldType.NUMBER, min: 10000, max: 25000, step: 500, defaultValue: "20500" },
        { id: "fst_rebound_lr_lmp", name: "FST Rebound LR", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "6000" },
        { id: "bump_rr_lmp", name: "Bump RR", type: FieldType.NUMBER, min: 7000, max: 16000, step: 500, defaultValue: "12500" },
        { id: "fst_bump_rr_lmp", name: "FST Bump RR", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "2000" },
        { id: "rebound_rr_lmp", name: "Rebound RR", type: FieldType.NUMBER, min: 10000, max: 25000, step: 500, defaultValue: "20500" },
        { id: "fst_rebound_rr_lmp", name: "FST Rebound RR", type: FieldType.NUMBER, min: 2000, max: 8000, step: 500, defaultValue: "6000" }
      ]
    },
    {
      id: "heave_dampers",
      name: "Dampers Heave",
      fields: [
        { id: "bump_f_heave", name: "Bump F", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "2750" },
        { id: "fst_bump_f_heave", name: "FST Bump F", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "500" },
        { id: "rebound_f_heave", name: "Rebound F", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "3250" },
        { id: "fst_rebound_f_heave", name: "FST Rebound F", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "2500" },
        { id: "bump_r_heave", name: "Bump R", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "2750" },
        { id: "fst_bump_r_heave", name: "FST Bump R", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "250" },
        { id: "rebound_r_heave", name: "Rebound R", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "3000" },
        { id: "fst_rebound_r_heave", name: "FST Rebound R", type: FieldType.NUMBER, min: 0, max: 4000, step: 250, defaultValue: "2250" }
      ]
    },
    {
      id: "drivetrain",
      name: "Drivetrain",
      fields: [
        { id: "diff_power_lmp", name: "Diff power", type: FieldType.NUMBER, min: 10, max: 90, step: 5, unit: "%", defaultValue: "60" },
        { id: "diff_preload_lmp", name: "Diff preload", type: FieldType.NUMBER, min: 0, max: 200, step: 5, unit: "Nm", defaultValue: "50" },
        { id: "diff_coast_lmp", name: "Diff coast", type: FieldType.NUMBER, min: 10, max: 90, step: 5, unit: "%", defaultValue: "50" }
      ]
    },
    {
      id: "generic",
      name: "Generic",
      fields: [
        { id: "engine_limiter_lmp", name: "Engine limiter", type: FieldType.NUMBER, min: 90, max: 100, step: 1, defaultValue: "100" },
        { id: "brake_bias_lmp", name: "Brake bias", type: FieldType.NUMBER, min: 50, max: 75, step: 1, unit: "%", defaultValue: "61" },
        { id: "steer_assist_lmp", name: "Steer asist", type: FieldType.NUMBER, min: 0, max: 200, step: 5, defaultValue: "70" },
        { id: "brake_power_lmp", name: "Brake power", type: FieldType.NUMBER, min: 80, max: 100, step: 1, unit: "%", defaultValue: "100" }
      ]
    },
    {
      id: "suspension",
      name: "Suspension",
      fields: [
        { id: "arb_front_lmp", name: "ARB Front", type: FieldType.NUMBER, min: 50000, max: 100000, step: 5000, defaultValue: "55000" },
        { id: "wheel_rate_lf_lmp", name: "Wheel rate LF", type: FieldType.NUMBER, min: 90, max: 150, step: 5, defaultValue: "115" },
        { id: "height_lf_lmp", name: "Height LF", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "18" },
        { id: "wheel_rate_rf_lmp", name: "Wheel rate RF", type: FieldType.NUMBER, min: 90, max: 150, step: 5, defaultValue: "115" },
        { id: "height_rf_lmp", name: "Height RF", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "18" },
        { id: "wheel_rate_hf_lmp", name: "Wheel rate HF", type: FieldType.NUMBER, min: 0, max: 150, step: 10, defaultValue: "70" },
        { id: "arb_rear_lmp", name: "ARB Rear", type: FieldType.NUMBER, min: 20000, max: 50000, step: 5000, defaultValue: "25000" },
        { id: "wheel_rate_lr_lmp", name: "Wheel rate LR", type: FieldType.NUMBER, min: 90, max: 150, step: 5, defaultValue: "105" },
        { id: "height_lr_lmp", name: "Height LR", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "18" },
        { id: "wheel_rate_rr_lmp", name: "Wheel rate RR", type: FieldType.NUMBER, min: 90, max: 150, step: 5, defaultValue: "105" },
        { id: "height_rr_lmp", name: "Height RR", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "18" },
        { id: "wheel_rate_hr_lmp", name: "Wheel rate HR", type: FieldType.NUMBER, min: 0, max: 150, step: 10, defaultValue: "60" }
      ]
    }
  ]
};

export const ASSETTO_CORSA_EMKA_HYPERCAR_TEMPLATE: SetupTemplate = {
  id: "assetto-corsa-emka-hypercar",
  title: "Assetto Corsa (HYPERCAR EMKA)",
  description: "Plantilla oficial con soporte completo para importar/exportar archivos .ini para los HYPERCAR de EMKA (Porsche 963 LMDh).",
  sections: [
    {
      id: "gears",
      name: "Gears",
      fields: [
        { id: "gears_hc", name: "Gears sets", type: FieldType.SELECT, options: ["Short", "Long"], defaultValue: "Short" },
      ]
    },
    {
      id: "tyres",
      name: "Tyres",
      fields: [
        { id: "compound_hc", name: "Tyres Set", type: FieldType.SELECT, options: ["Soft", "Medium", "Rain"], defaultValue: "Medium" },
        { id: "press_lf_hc", name: "Pressure LF", type: FieldType.NUMBER, min: 19, max: 35, step: 1, unit: "psi", defaultValue: "19" },
        { id: "press_rf_hc", name: "Pressure RF", type: FieldType.NUMBER, min: 19, max: 35, step: 1, unit: "psi", defaultValue: "35" },
        { id: "press_lr_hc", name: "Pressure LR", type: FieldType.NUMBER, min: 19, max: 35, step: 1, unit: "psi", defaultValue: "22" },
        { id: "press_rr_hc", name: "Pressure RR", type: FieldType.NUMBER, min: 19, max: 35, step: 1, unit: "psi", defaultValue: "35" },
      ]
    },
    {
      id: "fuel",
      name: "Fuel",
      fields: [
        { id: "fuel_hc", name: "Fuel", type: FieldType.NUMBER, min: 0, max: 120, step: 1, unit: "L", defaultValue: "120" },
      ]
    },
    {
      id: "electronics",
      name: "Electronics",
      fields: [
        { id: "tc_hc", name: "Traction Control", type: FieldType.NUMBER, min: 0, max: 8, step: 1, defaultValue: "8" },
        { id: "mguk_hc", name: "MGUK-Delivery", type: FieldType.NUMBER, min: 0, max: 50, step: 10, unit: "KW", defaultValue: "50" },
      ]
    },
    {
      id: "aero",
      name: "Aero",
      fields: [
        { id: "rear_wing_hc", name: "Rear Wing", type: FieldType.NUMBER, min: 1, max: 5, step: 1, unit: "°", defaultValue: "5" },
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      fields: [
        { id: "camber_lf_hc", name: "Camber LF", type: FieldType.NUMBER, min: -4.0, max: 0, step: 0.1, unit: "°", defaultValue: "-3.8" },
        { id: "toe_lf_hc", name: "Toe LF", type: FieldType.NUMBER, min: -10, max: 10, step: 1, defaultValue: "8" },
        { id: "camber_rf_hc", name: "Camber RF", type: FieldType.NUMBER, min: -4.0, max: 0, step: 0.1, unit: "°", defaultValue: "0" },
        { id: "toe_rf_hc", name: "Toe RF", type: FieldType.NUMBER, min: -10, max: 10, step: 1, defaultValue: "1" },
        { id: "camber_lr_hc", name: "Camber LR", type: FieldType.NUMBER, min: -4.0, max: 0, step: 0.1, unit: "°", defaultValue: "0.5" },
        { id: "toe_lr_hc", name: "Toe LR", type: FieldType.NUMBER, min: -10, max: 10, step: 1, defaultValue: "10" },
        { id: "camber_rr_hc", name: "Camber RR", type: FieldType.NUMBER, min: -4.0, max: 0, step: 0.1, unit: "°", defaultValue: "0" },
        { id: "toe_rr_hc", name: "Toe RR", type: FieldType.NUMBER, min: -10, max: 10, step: 1, defaultValue: "0" },
      ]
    },
    {
      id: "dampers",
      name: "Dampers",
      fields: [
        { id: "bump_lf_hc", name: "Bump LF", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "7" },
        { id: "fst_bump_lf_hc", name: "FST Bump LF", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "49" },
        { id: "rebound_lf_hc", name: "Rebound LF", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "40" },
        { id: "fst_rebound_lf_hc", name: "FST Rebound LF", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "49" },

        { id: "bump_rf_hc", name: "Bump RF", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "10" },
        { id: "fst_bump_rf_hc", name: "FST Bump RF", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "10" },
        { id: "rebound_rf_hc", name: "Rebound RF", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "10" },
        { id: "fst_rebound_rf_hc", name: "FST Rebound RF", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "10" },

        { id: "bump_lr_hc", name: "Bump LR", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "40" },
        { id: "fst_bump_lr_hc", name: "FST Bump LR", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "49" },
        { id: "rebound_lr_hc", name: "Rebound LR", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "40" },
        { id: "fst_rebound_lr_hc", name: "FST Rebound LR", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "49" },

        { id: "bump_rr_hc", name: "Bump RR", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "9" },
        { id: "fst_bump_rr_hc", name: "FST Bump RR", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "11" },
        { id: "rebound_rr_hc", name: "Rebound RR", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "8" },
        { id: "fst_rebound_rr_hc", name: "FST Rebound RR", type: FieldType.NUMBER, min: 0, max: 49, step: 1, defaultValue: "9" },
      ]
    },
    {
      id: "drivetrain",
      name: "Drive train",
      fields: [
        { id: "diff_power_hc", name: "Diff Power", type: FieldType.NUMBER, min: 0, max: 180, step: 10, defaultValue: "160" },
        { id: "diff_preload_hc", name: "Diff Preload", type: FieldType.NUMBER, min: 0, max: 200, step: 5, defaultValue: "190" },
        { id: "diff_coast_hc", name: "Diff Coast", type: FieldType.NUMBER, min: 0, max: 200, step: 10, defaultValue: "190" },
      ]
    },
    {
      id: "generic",
      name: "Generic",
      fields: [
        { id: "brake_bias_hc", name: "Brake Bias", type: FieldType.NUMBER, min: 40, max: 70, step: 1, unit: "%", defaultValue: "68" },
        { id: "brake_power_hc", name: "Brake power", type: FieldType.NUMBER, min: 80, max: 100, step: 1, unit: "%", defaultValue: "99" },
      ]
    },
    {
      id: "suspension",
      name: "Suspension",
      fields: [
        { id: "arb_front_hc", name: "ARB front", type: FieldType.NUMBER, min: 2, max: 30, step: 1, defaultValue: "30" },
        { id: "wheel_rate_lf_hc", name: "Wheel rate LF", type: FieldType.NUMBER, min: 0, max: 4, step: 1, defaultValue: "0" },
        { id: "height_lf_hc", name: "Height LF", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "38" },
        { id: "wheel_rate_rf_hc", name: "Wheel rate RF", type: FieldType.NUMBER, min: 0, max: 4, step: 1, defaultValue: "4" },
        { id: "height_rf_hc", name: "Height RF", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "15" },
        { id: "wheel_rate_lr_hc", name: "Wheel rate LR", type: FieldType.NUMBER, min: 0, max: 4, step: 1, defaultValue: "0" },
        { id: "height_lr_hc", name: "Height LR", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "20" },
        { id: "wheel_rate_rr_hc", name: "Wheel rate RR", type: FieldType.NUMBER, min: 0, max: 4, step: 1, defaultValue: "4" },
        { id: "height_rr_hc", name: "Height RR", type: FieldType.NUMBER, min: 0, max: 40, step: 1, defaultValue: "40" },
        { id: "arb_rear_hc", name: "ARB Rear", type: FieldType.NUMBER, min: 2, max: 40, step: 1, defaultValue: "40" },
      ]
    },
    {
      id: "suspension_adv",
      name: "Suspension adv.",
      fields: [
        { id: "packer_rate_lf_hc", name: "Packer rate LF", type: FieldType.NUMBER, min: 100, max: 200, step: 5, defaultValue: "110" },
        { id: "travel_range_lf_hc", name: "Travel Range LF", type: FieldType.NUMBER, min: 20, max: 100, step: 1, unit: "mm", defaultValue: "100" },
        { id: "packer_rate_rf_hc", name: "Packer rate RF", type: FieldType.NUMBER, min: 100, max: 200, step: 5, defaultValue: "200" },
        { id: "travel_range_rf_hc", name: "Travel Range RF", type: FieldType.NUMBER, min: 20, max: 100, step: 1, unit: "mm", defaultValue: "50" },
        { id: "packer_rate_lr_hc", name: "Packer rate LR", type: FieldType.NUMBER, min: 100, max: 200, step: 5, defaultValue: "200" },
        { id: "travel_range_lr_hc", name: "Travel Range LR", type: FieldType.NUMBER, min: 25, max: 100, step: 1, unit: "mm", defaultValue: "100" },
        { id: "packer_rate_rr_hc", name: "Packer rate RR", type: FieldType.NUMBER, min: 100, max: 200, step: 5, defaultValue: "200" },
        { id: "travel_range_rr_hc", name: "Travel Range RR", type: FieldType.NUMBER, min: 25, max: 100, step: 1, unit: "mm", defaultValue: "66" },
      ]
    }
  ]
};

export const DEFAULT_TEMPLATES: SetupTemplate[] = [
  LE_MANS_ULTIMATE_GT3_TEMPLATE,
  ASSETTO_CORSA_GT3_TEMPLATE,
  ASSETTO_CORSA_LMP2_TEMPLATE,
  ASSETTO_CORSA_EMKA_HYPERCAR_TEMPLATE
];

export const POPULAR_GAMES = [
  "Le Mans Ultimate",
  "Assetto Corsa"
];

export const POPULAR_TRACKS = [
  "Spa-Francorchamps",
  "Monza",
  "Fuji Speedway",
  "Nürburgring Nordschleife",
  "Nürburgring GP",
  "Silverstone",
  "Barcelona-Catalunya",
  "Suzuka",
  "Mount Panorama (Bathurst)",
  "Imola (Autodromo Enzo e Dino Ferrari)",
  "Mugello",
  "Laguna Seca",
  "Red Bull Ring",
  "Daytona International Speedway",
  "Sebring",
  "Road America",
  "Road Atlanta",
  "Kyalami",
  "Interlagos (São Paulo)",
  "Zandvoort",
  "Watkins Glen",
  "Le Mans (Circuit de la Sarthe)",
  "Hungaroring",
  "Paul Ricard",
  "Misano",
  "Zolder",
  "Indianapolis Motor Speedway"
];

export interface CountryOption {
  code: string;
  name: string;
  flagEmoji: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "es", name: "España", flagEmoji: "🇪🇸" },
  { code: "mx", name: "México", flagEmoji: "🇲🇽" },
  { code: "ar", name: "Argentina", flagEmoji: "🇦🇷" },
  { code: "co", name: "Colombia", flagEmoji: "🇨🇴" },
  { code: "cl", name: "Chile", flagEmoji: "🇨🇱" },
  { code: "uy", name: "Uruguay", flagEmoji: "🇺🇾" },
  { code: "pe", name: "Perú", flagEmoji: "🇵🇪" },
  { code: "ve", name: "Venezuela", flagEmoji: "🇻🇪" },
  { code: "cr", name: "Costa Rica", flagEmoji: "🇨🇷" },
  { code: "sv", name: "El Salvador", flagEmoji: "🇸🇻" },
  { code: "gt", name: "Guatemala", flagEmoji: "🇬🇹" },
  { code: "hn", name: "Honduras", flagEmoji: "🇭🇳" },
  { code: "ni", name: "Nicaragua", flagEmoji: "🇳🇮" },
  { code: "pa", name: "Panamá", flagEmoji: "🇵🇦" },
  { code: "do", name: "República Dominicana", flagEmoji: "🇩🇴" },
  { code: "bo", name: "Bolivia", flagEmoji: "🇧🇴" },
  { code: "py", name: "Paraguay", flagEmoji: "🇵🇾" },
  { code: "ec", name: "Ecuador", flagEmoji: "🇪🇨" },
  { code: "us", name: "Estados Unidos", flagEmoji: "🇺🇸" },
  { code: "br", name: "Brasil", flagEmoji: "🇧🇷" },
  { code: "pt", name: "Portugal", flagEmoji: "🇵🇹" },
  { code: "it", name: "Italia", flagEmoji: "🇮🇹" },
  { code: "fr", name: "Francia", flagEmoji: "🇫🇷" },
  { code: "de", name: "Alemania", flagEmoji: "🇩🇪" },
  { code: "gb", name: "Reino Unido", flagEmoji: "🇬🇧" }
];

