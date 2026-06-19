import { SetupTemplate, CarSetup } from "../types";

export interface FieldMapping {
  iniSection: string;
  iniKey: string;
}

// Map template field IDs (like `press_lf`) to INI section & key
export const FIELD_TO_INI_MAP: Record<string, FieldMapping> = {
  // Tyres
  "press_lf": { iniSection: "PRESSURE_LF", iniKey: "VALUE" },
  "press_rf": { iniSection: "PRESSURE_RF", iniKey: "VALUE" },
  "press_lr": { iniSection: "PRESSURE_LR", iniKey: "VALUE" },
  "press_rr": { iniSection: "PRESSURE_RR", iniKey: "VALUE" },
  "compound": { iniSection: "TYRES", iniKey: "VALUE" },

  "press_lf_lmp": { iniSection: "PRESSURE_LF", iniKey: "VALUE" },
  "press_rf_lmp": { iniSection: "PRESSURE_RF", iniKey: "VALUE" },
  "press_lr_lmp": { iniSection: "PRESSURE_LR", iniKey: "VALUE" },
  "press_rr_lmp": { iniSection: "PRESSURE_RR", iniKey: "VALUE" },
  "compound_lmp": { iniSection: "TYRES", iniKey: "VALUE" },

  // Fuel
  "liters": { iniSection: "FUEL", iniKey: "VALUE" },
  "liters_lmp": { iniSection: "FUEL", iniKey: "VALUE" },

  // Electronics
  "tc": { iniSection: "TRACTION_CONTROL", iniKey: "VALUE" },
  "tc_lmp": { iniSection: "TRACTION_CONTROL", iniKey: "VALUE" },
  "abs": { iniSection: "ABS", iniKey: "VALUE" },

  // Aero
  "rear_wing": { iniSection: "WING_2", iniKey: "VALUE" },
  "rear_wing_lmp": { iniSection: "WING_2", iniKey: "VALUE" },

  // Alignment
  "camber_lf": { iniSection: "CAMBER_LF", iniKey: "VALUE" },
  "camber_rf": { iniSection: "CAMBER_RF", iniKey: "VALUE" },
  "camber_lr": { iniSection: "CAMBER_LR", iniKey: "VALUE" },
  "camber_rr": { iniSection: "CAMBER_RR", iniKey: "VALUE" },
  "toe_lf": { iniSection: "TOE_OUT_LF", iniKey: "VALUE" },
  "toe_rf": { iniSection: "TOE_OUT_RF", iniKey: "VALUE" },
  "toe_lr": { iniSection: "TOE_OUT_LR", iniKey: "VALUE" },
  "toe_rr": { iniSection: "TOE_OUT_RR", iniKey: "VALUE" },

  "camber_lf_lmp": { iniSection: "CAMBER_LF", iniKey: "VALUE" },
  "camber_rf_lmp": { iniSection: "CAMBER_RF", iniKey: "VALUE" },
  "camber_lr_lmp": { iniSection: "CAMBER_LR", iniKey: "VALUE" },
  "camber_rr_lmp": { iniSection: "CAMBER_RR", iniKey: "VALUE" },
  "toe_lf_lmp": { iniSection: "TOE_OUT_LF", iniKey: "VALUE" },
  "toe_rf_lmp": { iniSection: "TOE_OUT_RF", iniKey: "VALUE" },
  "toe_lr_lmp": { iniSection: "TOE_OUT_LR", iniKey: "VALUE" },
  "toe_rr_lmp": { iniSection: "TOE_OUT_RR", iniKey: "VALUE" },

  // Dampers
  "bump_lf": { iniSection: "DAMP_BUMP_LF", iniKey: "VALUE" },
  "bump_rf": { iniSection: "DAMP_BUMP_RF", iniKey: "VALUE" },
  "bump_lr": { iniSection: "DAMP_BUMP_LR", iniKey: "VALUE" },
  "bump_rr": { iniSection: "DAMP_BUMP_RR", iniKey: "VALUE" },
  "fst_bump_lf": { iniSection: "DAMP_FAST_BUMP_LF", iniKey: "VALUE" },
  "fst_bump_rf": { iniSection: "DAMP_FAST_BUMP_RF", iniKey: "VALUE" },
  "fst_bump_lr": { iniSection: "DAMP_FAST_BUMP_LR", iniKey: "VALUE" },
  "fst_bump_rr": { iniSection: "DAMP_FAST_BUMP_RR", iniKey: "VALUE" },
  "rebound_lf": { iniSection: "DAMP_REBOUND_LF", iniKey: "VALUE" },
  "rebound_rf": { iniSection: "DAMP_REBOUND_RF", iniKey: "VALUE" },
  "rebound_lr": { iniSection: "DAMP_REBOUND_LR", iniKey: "VALUE" },
  "rebound_rr": { iniSection: "DAMP_REBOUND_RR", iniKey: "VALUE" },
  "fst_rebound_lf": { iniSection: "DAMP_FAST_REBOUND_LF", iniKey: "VALUE" },
  "fst_rebound_rf": { iniSection: "DAMP_FAST_REBOUND_RF", iniKey: "VALUE" },
  "fst_rebound_lr": { iniSection: "DAMP_FAST_REBOUND_LR", iniKey: "VALUE" },
  "fst_rebound_rr": { iniSection: "DAMP_FAST_REBOUND_RR", iniKey: "VALUE" },

  "bump_lf_lmp": { iniSection: "DAMP_BUMP_LF", iniKey: "VALUE" },
  "bump_rf_lmp": { iniSection: "DAMP_BUMP_RF", iniKey: "VALUE" },
  "bump_lr_lmp": { iniSection: "DAMP_BUMP_LR", iniKey: "VALUE" },
  "bump_rr_lmp": { iniSection: "DAMP_BUMP_RR", iniKey: "VALUE" },
  "fst_bump_lf_lmp": { iniSection: "DAMP_FAST_BUMP_LF", iniKey: "VALUE" },
  "fst_bump_rf_lmp": { iniSection: "DAMP_FAST_BUMP_RF", iniKey: "VALUE" },
  "fst_bump_lr_lmp": { iniSection: "DAMP_FAST_BUMP_LR", iniKey: "VALUE" },
  "fst_bump_rr_lmp": { iniSection: "DAMP_FAST_BUMP_RR", iniKey: "VALUE" },
  "rebound_lf_lmp": { iniSection: "DAMP_REBOUND_LF", iniKey: "VALUE" },
  "rebound_rf_lmp": { iniSection: "DAMP_REBOUND_RF", iniKey: "VALUE" },
  "rebound_lr_lmp": { iniSection: "DAMP_REBOUND_LR", iniKey: "VALUE" },
  "rebound_rr_lmp": { iniSection: "DAMP_REBOUND_RR", iniKey: "VALUE" },
  "fst_rebound_lf_lmp": { iniSection: "DAMP_FAST_REBOUND_LF", iniKey: "VALUE" },
  "fst_rebound_rf_lmp": { iniSection: "DAMP_FAST_REBOUND_RF", iniKey: "VALUE" },
  "fst_rebound_lr_lmp": { iniSection: "DAMP_FAST_REBOUND_LR", iniKey: "VALUE" },
  "fst_rebound_rr_lmp": { iniSection: "DAMP_FAST_REBOUND_RR", iniKey: "VALUE" },

  // Drivetrain
  "diff_power": { iniSection: "DIFF_POWER", iniKey: "VALUE" },
  "diff_preload": { iniSection: "DIFF_PRELOAD", iniKey: "VALUE" },
  "diff_coast": { iniSection: "DIFF_COAST", iniKey: "VALUE" },

  "diff_power_lmp": { iniSection: "DIFF_POWER", iniKey: "VALUE" },
  "diff_coast_lmp": { iniSection: "DIFF_COAST", iniKey: "VALUE" },
  "gears_lmp": { iniSection: "FINAL_RATIO", iniKey: "VALUE" },

  // Generic
  "engine_limiter": { iniSection: "ENGINE_LIMITER", iniKey: "VALUE" },
  "brake_bias": { iniSection: "FRONT_BIAS", iniKey: "VALUE" },
  "brake_power": { iniSection: "BRAKE_POWER_MULT", iniKey: "VALUE" },

  "brake_bias_lmp": { iniSection: "FRONT_BIAS", iniKey: "VALUE" },
  "brake_power_lmp": { iniSection: "BRAKE_POWER_MULT", iniKey: "VALUE" },

  // Suspension
  "arb_front": { iniSection: "ARB_FRONT", iniKey: "VALUE" },
  "arb_front_lmp": { iniSection: "ARB_FRONT", iniKey: "VALUE" },
  "arb_rear": { iniSection: "ARB_REAR", iniKey: "VALUE" },
  "arb_rear_lmp": { iniSection: "ARB_REAR", iniKey: "VALUE" },

  "wheel_rate_lf": { iniSection: "SPRING_RATE_LF", iniKey: "VALUE" },
  "wheel_rate_rf": { iniSection: "SPRING_RATE_RF", iniKey: "VALUE" },
  "wheel_rate_lr": { iniSection: "SPRING_RATE_LR", iniKey: "VALUE" },
  "wheel_rate_rr": { iniSection: "SPRING_RATE_RR", iniKey: "VALUE" },

  "wheel_rate_lf_lmp": { iniSection: "SPRING_RATE_LF", iniKey: "VALUE" },
  "wheel_rate_rf_lmp": { iniSection: "SPRING_RATE_RF", iniKey: "VALUE" },
  "wheel_rate_lr_lmp": { iniSection: "SPRING_RATE_LR", iniKey: "VALUE" },
  "wheel_rate_rr_lmp": { iniSection: "SPRING_RATE_RR", iniKey: "VALUE" },

  "height_lf": { iniSection: "ROD_LENGTH_LF", iniKey: "VALUE" },
  "height_rf": { iniSection: "ROD_LENGTH_RF", iniKey: "VALUE" },
  "height_lr": { iniSection: "ROD_LENGTH_LR", iniKey: "VALUE" },
  "height_rr": { iniSection: "ROD_LENGTH_RR", iniKey: "VALUE" },

  "height_lf_lmp": { iniSection: "ROD_LENGTH_LF", iniKey: "VALUE" },
  "height_rf_lmp": { iniSection: "ROD_LENGTH_RF", iniKey: "VALUE" },
  "height_lr_lmp": { iniSection: "ROD_LENGTH_LR", iniKey: "VALUE" },
  "height_rr_lmp": { iniSection: "ROD_LENGTH_RR", iniKey: "VALUE" },

  // Heave Dampers
  "bump_f_heave": { iniSection: "DAMP_BUMP_HF", iniKey: "VALUE" },
  "rebound_f_heave": { iniSection: "DAMP_REBOUND_HF", iniKey: "VALUE" },
  "fst_bump_f_heave": { iniSection: "DAMP_FAST_BUMP_HF", iniKey: "VALUE" },
  "fst_rebound_f_heave": { iniSection: "DAMP_FAST_REBOUND_HF", iniKey: "VALUE" },

  "bump_r_heave": { iniSection: "DAMP_BUMP_HR", iniKey: "VALUE" },
  "rebound_r_heave": { iniSection: "DAMP_REBOUND_HR", iniKey: "VALUE" },
  "fst_bump_r_heave": { iniSection: "DAMP_FAST_BUMP_HR", iniKey: "VALUE" },
  "fst_rebound_r_heave": { iniSection: "DAMP_FAST_REBOUND_HR", iniKey: "VALUE" },

  // Suspension Adv
  "packer_rate_lf_lmp": { iniSection: "BUMP_STOP_RATE_LF", iniKey: "VALUE" },
  "packer_rate_rf_lmp": { iniSection: "BUMP_STOP_RATE_RF", iniKey: "VALUE" },
  "packer_rate_lr_lmp": { iniSection: "BUMP_STOP_RATE_LR", iniKey: "VALUE" },
  "packer_rate_rr_lmp": { iniSection: "BUMP_STOP_RATE_RR", iniKey: "VALUE" },

  "travel_range_lf_lmp": { iniSection: "PACKER_RANGE_LF", iniKey: "VALUE" },
  "travel_range_rf_lmp": { iniSection: "PACKER_RANGE_RF", iniKey: "VALUE" },
  "travel_range_lr_lmp": { iniSection: "PACKER_RANGE_LR", iniKey: "VALUE" },
  "travel_range_rr_lmp": { iniSection: "PACKER_RANGE_RR", iniKey: "VALUE" },

  "travel_range_lf": { iniSection: "PACKER_RANGE_LF", iniKey: "VALUE" },
  "travel_range_rf": { iniSection: "PACKER_RANGE_RF", iniKey: "VALUE" },
  "travel_range_lr": { iniSection: "PACKER_RANGE_LR", iniKey: "VALUE" },
  "travel_range_rr": { iniSection: "PACKER_RANGE_RR", iniKey: "VALUE" },
};

export interface IniParseResult {
  metadata: {
    car?: string;
    author?: string;
    description?: string;
  };
  rawValues: Record<string, Record<string, string>>;
}

export function parseIni(content: string): IniParseResult {
  const lines = content.split(/\r?\n/);
  const rawValues: Record<string, Record<string, string>> = {};
  let currentSection = "";

  const metadata: { car?: string; author?: string; description?: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1).trim();
      rawValues[currentSection] = {};
    } else if (currentSection) {
      const index = trimmed.indexOf("=");
      if (index !== -1) {
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        rawValues[currentSection][key] = value;
      }
    }
  }

  // Extract metadata if CAR or ABOUT exist
  if (rawValues["CAR"] && rawValues["CAR"]["MODEL"]) {
    metadata.car = rawValues["CAR"]["MODEL"];
  }
  if (rawValues["ABOUT"]) {
    if (rawValues["ABOUT"]["AUTHOR"]) metadata.author = rawValues["ABOUT"]["AUTHOR"];
    if (rawValues["ABOUT"]["DESCRIPTION"]) metadata.description = rawValues["ABOUT"]["DESCRIPTION"];
  }

  return { metadata, rawValues };
}

export function mapIniToSetupValues(
  rawValues: Record<string, Record<string, string>>,
  template: SetupTemplate
): Record<string, string> {
  const result: Record<string, string> = {};

  // Initialize with template defaults
  template.sections.forEach(sec => {
    sec.fields.forEach(f => {
      result[f.id] = f.defaultValue || "0";
    });
  });

  // Apply mapped values
  Object.keys(FIELD_TO_INI_MAP).forEach(fieldId => {
    const mapping = FIELD_TO_INI_MAP[fieldId];
    if (rawValues[mapping.iniSection] && rawValues[mapping.iniSection][mapping.iniKey] !== undefined) {
      let rawVal = rawValues[mapping.iniSection][mapping.iniKey];
      if (fieldId === "compound" && rawVal === "0") {
        rawVal = "Medium slick (m)";
      } else if (fieldId === "compound" && rawVal === "1") {
        rawVal = "Rain (wet)";
      } else if (fieldId === "compound_lmp" && rawVal === "0") {
        rawVal = "LMP Medium (MED)";
      } else if (fieldId === "gears_lmp") {
        if (rawVal === "0") rawVal = "10/32";
        else if (rawVal === "1") rawVal = "10/30";
        else if (rawVal === "2") rawVal = "10/28";
      }
      result[fieldId] = rawVal;
    }
  });

  // Try flexible case-insensitive matching fallback for remaining fields
  template.sections.forEach(sec => {
    sec.fields.forEach(f => {
      // If we didn't populate this field yet or it's default
      if (result[f.id] === f.defaultValue || !result[f.id]) {
        const normFieldId = f.id.toUpperCase().replace(/_LMP$/, ""); 
        
        for (const sName of Object.keys(rawValues)) {
          const normSection = sName.toUpperCase();
          if (normSection === normFieldId || 
              normSection === normFieldId.replace("PRESS_", "PRESSURE_") ||
              normSection === normFieldId.replace("PRESSURE_", "PRESS_")) {
            if (rawValues[sName]["VALUE"] !== undefined) {
              result[f.id] = rawValues[sName]["VALUE"];
              break;
            }
          }
        }
      }
    });
  });

  return result;
}

export const CORE_AC_SECTIONS: Record<string, string> = {
  ABS: "5",
  ARB_FRONT: "3",
  ARB_REAR: "1",
  BRAKE_POWER_MULT: "100",
  CAMBER_LF: "-23",
  CAMBER_LR: "-21",
  CAMBER_RF: "-23",
  CAMBER_RR: "-21",
  DAMP_BUMP_LF: "14",
  DAMP_BUMP_LR: "7",
  DAMP_BUMP_RF: "14",
  DAMP_BUMP_RR: "7",
  DAMP_FAST_BUMP_LF: "4",
  DAMP_FAST_BUMP_LR: "4",
  DAMP_FAST_BUMP_RF: "4",
  DAMP_FAST_BUMP_RR: "4",
  DAMP_FAST_REBOUND_LF: "25",
  DAMP_FAST_REBOUND_LR: "36",
  DAMP_FAST_REBOUND_RF: "25",
  DAMP_FAST_REBOUND_RR: "36",
  DAMP_REBOUND_LF: "20",
  DAMP_REBOUND_LR: "29",
  DAMP_REBOUND_RF: "20",
  DAMP_REBOUND_RR: "29",
  DIFF_COAST: "45",
  DIFF_POWER: "10",
  DIFF_PRELOAD: "80",
  ENGINE_LIMITER: "100",
  FINAL_RATIO: "1",
  FRONT_BIAS: "60",
  FUEL: "20",
  PACKER_RANGE_LF: "75",
  PACKER_RANGE_LR: "75",
  PACKER_RANGE_RF: "75",
  PACKER_RANGE_RR: "75",
  PRESSURE_LF: "19",
  PRESSURE_LR: "19",
  PRESSURE_RF: "20",
  PRESSURE_RR: "19",
  ROD_LENGTH_LF: "11",
  ROD_LENGTH_LR: "18",
  ROD_LENGTH_RF: "11",
  ROD_LENGTH_RR: "18",
  SPRING_RATE_LF: "130",
  SPRING_RATE_LR: "170",
  SPRING_RATE_RF: "130",
  SPRING_RATE_RR: "170",
  TOE_OUT_LF: "10",
  TOE_OUT_LR: "14",
  TOE_OUT_RF: "10",
  TOE_OUT_RR: "14",
  TRACTION_CONTROL: "5",
  TYRES: "0",
  WING_2: "2"
};

export const CORE_LMP2_SECTIONS: Record<string, string> = {
  ARB_FRONT: "2",
  ARB_REAR: "0",
  BRAKE_POWER_MULT: "100",
  BUMP_STOP_RATE_LF: "150",
  BUMP_STOP_RATE_LR: "150",
  BUMP_STOP_RATE_RF: "150",
  BUMP_STOP_RATE_RR: "150",
  CAMBER_LF: "-20",
  CAMBER_LR: "-15",
  CAMBER_RF: "-20",
  CAMBER_RR: "-15",
  DAMP_BUMP_HF: "14",
  DAMP_BUMP_HR: "15",
  DAMP_BUMP_LF: "10",
  DAMP_BUMP_LR: "13",
  DAMP_BUMP_RF: "10",
  DAMP_BUMP_RR: "13",
  DAMP_FAST_BUMP_HF: "10",
  DAMP_FAST_BUMP_HR: "7",
  DAMP_FAST_BUMP_LF: "7",
  DAMP_FAST_BUMP_LR: "10",
  DAMP_FAST_BUMP_RF: "7",
  DAMP_FAST_BUMP_RR: "10",
  DAMP_FAST_REBOUND_HF: "18",
  DAMP_FAST_REBOUND_HR: "14",
  DAMP_FAST_REBOUND_LF: "15",
  DAMP_FAST_REBOUND_LR: "15",
  DAMP_FAST_REBOUND_RF: "15",
  DAMP_FAST_REBOUND_RR: "15",
  DAMP_REBOUND_HF: "19",
  DAMP_REBOUND_HR: "16",
  DAMP_REBOUND_LF: "10",
  DAMP_REBOUND_LR: "8",
  DAMP_REBOUND_RF: "10",
  DAMP_REBOUND_RR: "8",
  DIFF_COAST: "50",
  DIFF_POWER: "10",
  FINAL_RATIO: "2",
  FRONT_BIAS: "60",
  FUEL: "20",
  PACKER_RANGE_LF: "50",
  PACKER_RANGE_LR: "50",
  PACKER_RANGE_RF: "50",
  PACKER_RANGE_RR: "50",
  PRESSURE_LF: "25",
  PRESSURE_LR: "25",
  PRESSURE_RF: "25",
  PRESSURE_RR: "25",
  ROD_LENGTH_LF: "6",
  ROD_LENGTH_LR: "7",
  ROD_LENGTH_RF: "6",
  ROD_LENGTH_RR: "7",
  SPRING_RATE_HF: "4",
  SPRING_RATE_HR: "5",
  SPRING_RATE_LF: "2",
  SPRING_RATE_LR: "4",
  SPRING_RATE_RF: "2",
  SPRING_RATE_RR: "4",
  TOE_OUT_LF: "8",
  TOE_OUT_LR: "13",
  TOE_OUT_RF: "8",
  TOE_OUT_RR: "13",
  TRACTION_CONTROL: "1",
  TYRES: "0",
  WING_2: "4"
};

export function exportSetupToIni(setup: CarSetup, template: SetupTemplate): string {
  const iniBlocks: string[] = [];

  const isLmp2 = template.id.includes("lmp2") || (setup.templateId && setup.templateId.includes("lmp2"));
  const coreDict = isLmp2 ? CORE_LMP2_SECTIONS : CORE_AC_SECTIONS;

  // Core sections: and insert metadata sections, then sort everything alphabetically.
  const allSections = [
    ...Object.keys(coreDict),
    "ABOUT",
    "CAR",
    "__EXT_PATCH"
  ];

  // Alphabetical sort matches: ABOUT, ABS, ..., CAR, ..., __EXT_PATCH
  allSections.sort();

  allSections.forEach(section => {
    if (section === "ABOUT") {
      iniBlocks.push("[ABOUT]");
      iniBlocks.push(`AUTHOR=${setup.creatorName || "MonCat"}`);
      iniBlocks.push(`DESCRIPTION=${setup.notes || ""}`);
      iniBlocks.push("");
    } else if (section === "CAR") {
      iniBlocks.push("[CAR]");
      iniBlocks.push(`MODEL=${setup.car || "unknown"}`);
      iniBlocks.push("");
    } else if (section === "__EXT_PATCH") {
      iniBlocks.push("[__EXT_PATCH]");
      iniBlocks.push("VERSION=0.2.11");
      iniBlocks.push("");
    } else {
      // Find matching setup/mapping value
      let val: string | null = null;
      
      for (const [fieldId, mapping] of Object.entries(FIELD_TO_INI_MAP)) {
        if (mapping.iniSection === section) {
          if (setup.values[fieldId] !== undefined && setup.values[fieldId] !== null && setup.values[fieldId] !== "") {
            let rawVal = setup.values[fieldId];
            if (fieldId === "compound" || fieldId === "compound_lmp") {
              if (rawVal === "Medium slick (m)" || rawVal === "LMP Medium (MED)") rawVal = "0";
              else if (rawVal === "Rain (wet)") rawVal = "1";
            } else if (fieldId === "gears_lmp") {
              if (rawVal === "10/32") rawVal = "0";
              else if (rawVal === "10/30") rawVal = "1";
              else if (rawVal === "10/28") rawVal = "2";
            }
            val = rawVal;
            break;
          }
        }
      }

      if (val === null && setup.values[section.toLowerCase()] !== undefined && setup.values[section.toLowerCase()] !== null && setup.values[section.toLowerCase()] !== "") {
        val = setup.values[section.toLowerCase()];
      }

      if (val === null) {
        val = coreDict[section] !== undefined ? coreDict[section] : "0";
      }

      if (section.startsWith("CAMBER_") && val) {
        val = val.replace(".", "");
      }

      iniBlocks.push(`[${section}]`);
      iniBlocks.push(`VALUE=${val}`);
      iniBlocks.push("");
    }
  });

  return iniBlocks.join("\n").trim() + "\n";
}
