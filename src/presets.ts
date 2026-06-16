import { SetupTemplate, SetupSection, FieldType } from "./types";

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
        { id: "gears", name: "Gears", type: FieldType.SELECT, defaultValue: "mid", options: ["long", "mid", "short"] }
      ]
    },
    {
      id: "tyres",
      name: "Tyres",
      fields: [
        { id: "compound", name: "Compound", type: FieldType.SELECT, defaultValue: "Medium slick (m)", options: ["Medium slick (m)", "Rain (wet)"] },
        { id: "press_lf", name: "Pressure LF", type: FieldType.NUMBER, min: 15, max: 40, step: 0.1, unit: "psi", defaultValue: "26" },
        { id: "press_rf", name: "Pressure RF", type: FieldType.NUMBER, min: 15, max: 40, step: 0.1, unit: "psi", defaultValue: "26" },
        { id: "press_lr", name: "Pressure LR", type: FieldType.NUMBER, min: 15, max: 40, step: 0.1, unit: "psi", defaultValue: "26.5" },
        { id: "press_rr", name: "Pressure RR", type: FieldType.NUMBER, min: 15, max: 40, step: 0.1, unit: "psi", defaultValue: "26.5" }
      ]
    },
    {
      id: "fuel",
      name: "Fuel",
      fields: [
        { id: "liters", name: "Liters", type: FieldType.NUMBER, min: 0, max: 120, step: 1, unit: "L", defaultValue: "30" }
      ]
    },
    {
      id: "electronics",
      name: "Electronics",
      fields: [
        { id: "tc", name: "Traction control", type: FieldType.NUMBER, min: 0, max: 10, step: 1, defaultValue: "3" },
        { id: "abs", name: "ABS", type: FieldType.NUMBER, min: 0, max: 8, step: 1, defaultValue: "4" }
      ]
    },
    {
      id: "aero",
      name: "Aero",
      fields: [
        { id: "rear_wing", name: "Rear wing", type: FieldType.NUMBER, min: 1, max: 8, step: 1, unit: "deg", defaultValue: "4" }
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      fields: [
        { id: "camber_lf", name: "Camber LF", type: FieldType.NUMBER, min: -4.0, max: 1.0, step: 0.1, unit: "°", defaultValue: "-3.2" },
        { id: "toe_lf", name: "Toe LF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "10" },
        { id: "camber_rf", name: "Camber RF", type: FieldType.NUMBER, min: -4.0, max: 1.0, step: 0.1, unit: "°", defaultValue: "-3.2" },
        { id: "toe_rf", name: "Toe RF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "10" },
        { id: "camber_lr", name: "Camber LR", type: FieldType.NUMBER, min: -4.0, max: 1.0, step: 0.1, unit: "°", defaultValue: "-2.5" },
        { id: "toe_lr", name: "Toe LR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" },
        { id: "camber_rr", name: "Camber RR", type: FieldType.NUMBER, min: -4.0, max: 1.0, step: 0.1, unit: "°", defaultValue: "-2.5" },
        { id: "toe_rr", name: "Toe RR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" }
      ]
    },
    {
      id: "dampers",
      name: "Dampers",
      fields: [
        { id: "bump_lf", name: "Bump LF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" },
        { id: "fst_bump_lf", name: "FST Bump LF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "6" },
        { id: "rebound_lf", name: "Rebound LF", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "12" },
        { id: "fst_rebound_lf", name: "FST Rebound LF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "10" },
        { id: "bump_rf", name: "Bump RF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" },
        { id: "fst_bump_rf", name: "FST Bump RF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "6" },
        { id: "rebound_rf", name: "Rebound RF", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "12" },
        { id: "fst_rebound_rf", name: "FST Rebound RF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "10" },
        { id: "bump_lr", name: "Bump LR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "7" },
        { id: "fst_bump_lr", name: "FST Bump LR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "5" },
        { id: "rebound_lr", name: "Rebound LR", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "10" },
        { id: "fst_rebound_lr", name: "FST Rebound LR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" },
        { id: "bump_rr", name: "Bump RR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "7" },
        { id: "fst_bump_rr", name: "FST Bump RR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "5" },
        { id: "rebound_rr", name: "Rebound RR", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "10" },
        { id: "fst_rebound_rr", name: "FST Rebound RR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" }
      ]
    },
    {
      id: "drivetrain",
      name: "Drivetrain",
      fields: [
        { id: "diff_power", name: "Diff Power", type: FieldType.NUMBER, min: 10, max: 90, step: 1, unit: "%", defaultValue: "40" },
        { id: "diff_preload", name: "Diff Preload", type: FieldType.NUMBER, min: 0, max: 180, step: 1, unit: "Nm", defaultValue: "40" },
        { id: "diff_coast", name: "Diff Coast", type: FieldType.NUMBER, min: 10, max: 90, step: 1, unit: "%", defaultValue: "30" }
      ]
    },
    {
      id: "generic",
      name: "Generic",
      fields: [
        { id: "engine_limiter", name: "Engine Limiter", type: FieldType.NUMBER, min: 95, max: 100, step: 1, defaultValue: "100" },
        { id: "brake_bias", name: "Brake Bias", type: FieldType.NUMBER, min: 50, max: 65, step: 0.1, unit: "%", defaultValue: "56" },
        { id: "brake_power", name: "Brake Power", type: FieldType.NUMBER, min: 80, max: 100, step: 1, unit: "%", defaultValue: "100" }
      ]
    },
    {
      id: "suspension",
      name: "Suspension",
      fields: [
        { id: "arb_front", name: "ARB Front", type: FieldType.NUMBER, min: 0, max: 7, step: 1, defaultValue: "3" },
        { id: "wheel_rate_lf", name: "Wheel rate LF", type: FieldType.NUMBER, min: 120, max: 185, step: 1, unit: "N/mm", defaultValue: "150" },
        { id: "height_lf", name: "Height LF", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "15" },
        { id: "wheel_rate_rf", name: "Wheel rate RF", type: FieldType.NUMBER, min: 120, max: 185, step: 1, unit: "N/mm", defaultValue: "150" },
        { id: "height_rf", name: "Height RF", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "15" },
        { id: "wheel_rate_lr", name: "Wheel rate LR", type: FieldType.NUMBER, min: 120, max: 185, step: 1, unit: "N/mm", defaultValue: "140" },
        { id: "height_lr", name: "Height LR", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "20" },
        { id: "wheel_rate_rr", name: "Wheel rate RR", type: FieldType.NUMBER, min: 120, max: 185, step: 1, unit: "N/mm", defaultValue: "140" },
        { id: "height_rr", name: "Height RR", type: FieldType.NUMBER, min: 0, max: 30, step: 1, defaultValue: "20" },
        { id: "arb_rear", name: "ARB Rear", type: FieldType.NUMBER, min: 0, max: 10, step: 1, defaultValue: "2" }
      ]
    },
    {
      id: "suspension_adv",
      name: "Suspension Adv.",
      fields: [
        { id: "travel_range_lf", name: "Travel range LF", type: FieldType.NUMBER, min: 10, max: 80, step: 1, unit: "mm", defaultValue: "50" },
        { id: "travel_range_rf", name: "Travel range RF", type: FieldType.NUMBER, min: 10, max: 80, step: 1, unit: "mm", defaultValue: "50" },
        { id: "travel_range_lr", name: "Travel range LR", type: FieldType.NUMBER, min: 10, max: 80, step: 1, unit: "mm", defaultValue: "45" },
        { id: "travel_range_rr", name: "Travel range RR", type: FieldType.NUMBER, min: 10, max: 80, step: 1, unit: "mm", defaultValue: "45" }
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
        { id: "gears_lmp", name: "Gears", type: FieldType.SELECT, defaultValue: "10/30", options: ["10/32", "10/30", "10/28"] }
      ]
    },
    {
      id: "tyres",
      name: "Tyres",
      fields: [
        { id: "compound_lmp", name: "Compound", type: FieldType.SELECT, defaultValue: "LMP Medium (MED)", options: ["LMP Medium (MED)"] },
        { id: "press_lf_lmp", name: "Pressure LF", type: FieldType.NUMBER, min: 20, max: 35, step: 0.1, unit: "psi", defaultValue: "26.5" },
        { id: "press_rf_lmp", name: "Pressure RF", type: FieldType.NUMBER, min: 20, max: 35, step: 0.1, unit: "psi", defaultValue: "26.5" },
        { id: "press_lr_lmp", name: "Pressure LR", type: FieldType.NUMBER, min: 20, max: 35, step: 0.1, unit: "psi", defaultValue: "27" },
        { id: "press_rr_lmp", name: "Pressure RR", type: FieldType.NUMBER, min: 20, max: 35, step: 0.1, unit: "psi", defaultValue: "27" }
      ]
    },
    {
      id: "fuel",
      name: "Fuel",
      fields: [
        { id: "liters_lmp", name: "Liters", type: FieldType.NUMBER, min: 0, max: 75, step: 1, unit: "L", defaultValue: "35" }
      ]
    },
    {
      id: "electronics",
      name: "Electronics",
      fields: [
         { id: "tc_lmp", name: "Traction control", type: FieldType.NUMBER, min: 0, max: 10, step: 1, defaultValue: "3" }
      ]
    },
    {
      id: "aero",
      name: "Aero",
      fields: [
        { id: "rear_wing_lmp", name: "Rear wing", type: FieldType.NUMBER, min: 1, max: 8, step: 1, unit: "deg", defaultValue: "4" }
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      fields: [
        { id: "camber_lf_lmp", name: "Camber LF", type: FieldType.NUMBER, min: -4.0, max: -1.2, step: 0.1, unit: "°", defaultValue: "-3.0" },
        { id: "toe_lf_lmp", name: "Toe LF", type: FieldType.NUMBER, min: 0, max: 13, step: 1, defaultValue: "5" },
        { id: "camber_rf_lmp", name: "Camber RF", type: FieldType.NUMBER, min: -4.0, max: -1.2, step: 0.1, unit: "°", defaultValue: "-3.0" },
        { id: "toe_rf_lmp", name: "Toe RF", type: FieldType.NUMBER, min: 0, max: 13, step: 1, defaultValue: "5" },
        { id: "camber_lr_lmp", name: "Camber LR", type: FieldType.NUMBER, min: -4.0, max: -1.2, step: 0.1, unit: "°", defaultValue: "-2.2" },
        { id: "toe_lr_lmp", name: "Toe LR", type: FieldType.NUMBER, min: 0, max: 13, step: 1, defaultValue: "4" },
        { id: "camber_rr_lmp", name: "Camber RR", type: FieldType.NUMBER, min: -4.0, max: -1.2, step: 0.1, unit: "°", defaultValue: "-2.2" },
        { id: "toe_rr_lmp", name: "Toe RR", type: FieldType.NUMBER, min: 0, max: 13, step: 1, defaultValue: "4" }
      ]
    },
    {
      id: "dampers",
      name: "Dampers",
      fields: [
        { id: "bump_lf_lmp", name: "Bump LF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "6" },
        { id: "fst_bump_lf_lmp", name: "FST Bump LF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "5" },
        { id: "rebound_lf_lmp", name: "Rebound LF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "9" },
        { id: "fst_rebound_lf_lmp", name: "FST Rebound LF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "8" },
        { id: "bump_rf_lmp", name: "Bump RF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "6" },
        { id: "fst_bump_rf_lmp", name: "FST Bump RF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "5" },
        { id: "rebound_rf_lmp", name: "Rebound RF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "9" },
        { id: "fst_rebound_rf_lmp", name: "FST Rebound RF", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "8" },
        { id: "bump_lr_lmp", name: "Bump LR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "5" },
        { id: "fst_bump_lr_lmp", name: "FST Bump LR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "4" },
        { id: "rebound_lr_lmp", name: "Rebound LR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "8" },
        { id: "fst_rebound_lr_lmp", name: "FST Rebound LR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "7" },
        { id: "bump_rr_lmp", name: "Bump RR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "5" },
        { id: "fst_bump_rr_lmp", name: "FST Bump RR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "4" },
        { id: "rebound_rr_lmp", name: "Rebound RR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "8" },
        { id: "fst_rebound_rr_lmp", name: "FST Rebound RR", type: FieldType.NUMBER, min: 0, max: 16, step: 1, defaultValue: "7" }
      ]
    },
    {
      id: "drivetrain",
      name: "Drivetrain",
      fields: [
        { id: "diff_power_lmp", name: "Diff Power", type: FieldType.NUMBER, min: 10, max: 90, step: 1, unit: "%", defaultValue: "40" },
        { id: "diff_coast_lmp", name: "Diff Coast", type: FieldType.NUMBER, min: 10, max: 90, step: 1, unit: "%", defaultValue: "30" }
      ]
    },
    {
      id: "generic",
      name: "Generic",
      fields: [
        { id: "brake_bias_lmp", name: "Brake Bias", type: FieldType.NUMBER, min: 50, max: 70, step: 0.1, unit: "%", defaultValue: "54.5" },
        { id: "brake_power_lmp", name: "Brake Power", type: FieldType.NUMBER, min: 80, max: 100, step: 1, unit: "%", defaultValue: "100" }
      ]
    },
    {
      id: "heave_dampers",
      name: "Heave Dampers",
      fields: [
        { id: "bump_f_heave", name: "Bump F", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "10" },
        { id: "fst_bump_f_heave", name: "FST Bump F", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "8" },
        { id: "rebound_f_heave", name: "Rebound F", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "14" },
        { id: "fst_rebound_f_heave", name: "FST Rebound F", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "12" },
        { id: "bump_r_heave", name: "Bump R", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "8" },
        { id: "fst_bump_r_heave", name: "FST Bump R", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "6" },
        { id: "rebound_r_heave", name: "Rebound R", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "12" },
        { id: "fst_rebound_r_heave", name: "FST Rebound R", type: FieldType.NUMBER, min: 0, max: 24, step: 1, defaultValue: "10" }
      ]
    },
    {
      id: "suspension",
      name: "Suspension",
      fields: [
        { id: "arb_front_lmp", name: "ARB Front", type: FieldType.NUMBER, min: 0, max: 11, step: 1, defaultValue: "4" },
        { id: "wheel_rate_lf_lmp", name: "Wheel rate LF", type: FieldType.NUMBER, min: 0, max: 7, step: 1, defaultValue: "3" },
        { id: "height_lf_lmp", name: "Height LF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" },
        { id: "wheel_rate_rf_lmp", name: "Wheel rate RF", type: FieldType.NUMBER, min: 0, max: 7, step: 1, defaultValue: "3" },
        { id: "height_rf_lmp", name: "Height RF", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "8" },
        { id: "wheel_rate_lr_lmp", name: "Wheel rate LR", type: FieldType.NUMBER, min: 0, max: 14, step: 1, defaultValue: "6" },
        { id: "height_lr_lmp", name: "Height LR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "12" },
        { id: "wheel_rate_rr_lmp", name: "Wheel rate RR", type: FieldType.NUMBER, min: 0, max: 14, step: 1, defaultValue: "6" },
        { id: "height_rr_lmp", name: "Height RR", type: FieldType.NUMBER, min: 0, max: 20, step: 1, defaultValue: "12" },
        { id: "arb_rear_lmp", name: "ARB Rear", type: FieldType.NUMBER, min: 0, max: 10, step: 1, defaultValue: "3" }
      ]
    },
    {
      id: "suspension_adv",
      name: "Suspension Adv.",
      fields: [
        { id: "packer_rate_lf_lmp", name: "Packer rate LF", type: FieldType.NUMBER, min: 50, max: 200, step: 5, defaultValue: "100" },
        { id: "travel_range_lf_lmp", name: "Travel range LF", type: FieldType.NUMBER, min: 20, max: 50, step: 1, unit: "mm", defaultValue: "35" },
        { id: "packer_rate_rf_lmp", name: "Packer rate RF", type: FieldType.NUMBER, min: 50, max: 200, step: 5, defaultValue: "100" },
        { id: "travel_range_rf_lmp", name: "Travel range RF", type: FieldType.NUMBER, min: 20, max: 50, step: 1, unit: "mm", defaultValue: "35" },
        { id: "packer_rate_lr_lmp", name: "Packer rate LR", type: FieldType.NUMBER, min: 50, max: 200, step: 5, defaultValue: "100" },
        { id: "travel_range_lr_lmp", name: "Travel range LR", type: FieldType.NUMBER, min: 25, max: 50, step: 1, unit: "mm", defaultValue: "30" },
        { id: "packer_rate_rr_lmp", name: "Packer rate RR", type: FieldType.NUMBER, min: 50, max: 200, step: 5, defaultValue: "100" },
        { id: "travel_range_rr_lmp", name: "Travel range RR", type: FieldType.NUMBER, min: 25, max: 50, step: 1, unit: "mm", defaultValue: "30" }
      ]
    }
  ]
};

export const DEFAULT_TEMPLATES: SetupTemplate[] = [
  LE_MANS_ULTIMATE_GT3_TEMPLATE,
  ASSETTO_CORSA_GT3_TEMPLATE,
  ASSETTO_CORSA_LMP2_TEMPLATE
];

export const POPULAR_GAMES = [
  "Le Mans Ultimate",
  "Assetto Corsa"
];

export const POPULAR_TRACKS = [
  "Spa-Francorchamps",
  "Monza",
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

