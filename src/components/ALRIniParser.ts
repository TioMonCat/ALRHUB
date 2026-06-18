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
      result[fieldId] = rawValues[mapping.iniSection][mapping.iniKey];
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

export function exportSetupToIni(setup: CarSetup, template: SetupTemplate): string {
  const iniBlocks: string[] = [];

  // 1. Add [ABOUT]
  iniBlocks.push("[ABOUT]");
  iniBlocks.push(`AUTHOR=${setup.creatorName || "MonCat"}`);
  iniBlocks.push(`DESCRIPTION=${setup.notes || ""}`);
  iniBlocks.push("");

  // 2. Add [CAR]
  iniBlocks.push("[CAR]");
  iniBlocks.push(`MODEL=${setup.car || "unknown"}`);
  iniBlocks.push("");

  // Keep track of sections we have already outputted to avoid duplicates
  const exportedSections = new Set<string>();

  // Map our fields back to INI blocks
  Object.keys(setup.values).forEach(fieldId => {
    const mapping = FIELD_TO_INI_MAP[fieldId];
    if (mapping) {
      const sectionName = mapping.iniSection;
      if (!exportedSections.has(sectionName)) {
        exportedSections.add(sectionName);
        iniBlocks.push(`[${sectionName}]`);
        iniBlocks.push(`${mapping.iniKey}=${setup.values[fieldId]}`);
        iniBlocks.push("");
      }
    }
  });

  // For any remaining values that aren't in FIELD_TO_INI_MAP, let's write them if they follow a reasonable pattern
  Object.keys(setup.values).forEach(fieldId => {
    const mapping = FIELD_TO_INI_MAP[fieldId];
    if (!mapping) {
      const sectionName = fieldId.toUpperCase();
      // Only export alphanumeric section names to keep INI file clean
      if (/^[A-Z0-9_]+$/.test(sectionName) && !exportedSections.has(sectionName)) {
        exportedSections.add(sectionName);
        iniBlocks.push(`[${sectionName}]`);
        iniBlocks.push(`VALUE=${setup.values[fieldId]}`);
        iniBlocks.push("");
      }
    }
  });

  // Always output __EXT_PATCH block to match standard templates perfectly
  if (!exportedSections.has("__EXT_PATCH")) {
    iniBlocks.push("[__EXT_PATCH]");
    iniBlocks.push("VERSION=0.2.11");
    iniBlocks.push("");
  }

  return iniBlocks.join("\n").trim() + "\n";
}
