import React from "react";
import { CarSetup, SetupTemplate } from "../types";
import { ArrowLeft, RefreshCw, Layers, Check, HelpCircle, ChevronRight, Fuel, Gauge, Eye, Zap } from "lucide-react";

interface SetupCompareProps {
  setupA: CarSetup;
  setupB: CarSetup;
  templates: SetupTemplate[];
  onGoBack: () => void;
  onSelectSetup: (id: string) => void;
}

export default function SetupCompare({
  setupA,
  setupB,
  templates,
  onGoBack,
  onSelectSetup,
}: SetupCompareProps) {
  // Find associated template for layout matching. We'll prefer template of A, falling back to B
  const template = templates.find(t => t.id === setupA.templateId) || templates.find(t => t.id === setupB.templateId) || templates[0];

  // Resolve sections dynamically from individual setup if customSections exist, else fallback to template
  const sectionsA = setupA.customSections || templates.find(t => t.id === setupA.templateId)?.sections || [];
  const sectionsB = setupB.customSections || templates.find(t => t.id === setupB.templateId)?.sections || [];
  const effectiveSections = sectionsA.length > 0 ? sectionsA : (sectionsB.length > 0 ? sectionsB : (template?.sections || []));

  // Helper to extract value safely matching template fields
  const getValue = (setup: CarSetup, fieldId: string, defVal?: string) => {
    const val = setup.values[fieldId] !== undefined ? setup.values[fieldId] : (defVal || "--");
    if (fieldId.toLowerCase().includes("camber")) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        return num.toFixed(1);
      }
    }
    return val;
  };

  // Compare function to compute variance
  const getVarianceInfo = (valA: string, valB: string, fieldId: string) => {
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (isNaN(numA) || isNaN(numB)) {
      if (valA === valB) return { differs: false, text: "Iguales", color: "text-stone-500" };
      return { differs: true, text: "Diferentes", color: "text-amber-400" };
    }

    const diff = numB - numA;
    // Handle tiny float precision issues (like -0.000000001 or 0)
    if (Math.abs(diff) < 0.0001) {
      return { differs: false, text: "=", color: "text-stone-600 font-mono" };
    }

    const sign = diff > 0 ? "+" : "";
    const isCamber = fieldId.toLowerCase().includes("camber");
    
    let textDiff = "";
    if (isCamber) {
      textDiff = diff.toFixed(1);
      // If rounding made it +0.0 or -0.0, treat as equal
      if (textDiff === "0.0" || textDiff === "-0.0") {
        return { differs: false, text: "=", color: "text-stone-600 font-mono" };
      }
    } else {
      textDiff = parseFloat(diff.toFixed(4)).toString();
    }

    return {
      differs: true,
      text: `${sign}${textDiff}`,
      color: diff > 0 ? "text-lime-400 font-medium" : "text-red-400 font-medium"
    };
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Compare Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-all uppercase font-mono bg-[#161618] border border-[#2A2A2E] px-3.5 py-2 rounded shadow-sm animate-pulse"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#FF3C3C] stroke-[3]" />
          Volver al Garaje
        </button>

        <span className="text-[10px] text-[#6B6B70] tracking-widest uppercase font-mono">
          Comparación de Diferenciales Físicos
        </span>
      </div>

      {/* Duel Cards info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A */}
        <div className="tuning-card border border-[#1F1F23] rounded-xl p-5 flex flex-col justify-between group active-glow">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F1F23] pb-2.5 mb-2.5">
              <span className="text-[9.5px] uppercase font-mono bg-[#FF3C3C]/10 text-[#FF3C3C] border border-[#FF3C3C]/30 px-2.5 py-0.5 rounded font-extrabold tracking-widest">
                REGLAJE A (BASE)
              </span>
              <button
                onClick={() => onSelectSetup(setupA.id)}
                className="text-[10.5px] font-mono text-[#66FCF1] flex items-center gap-1 hover:underline uppercase tracking-wide font-bold"
              >
                Abrir editor <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-white font-bold text-sm truncate">{setupA.title}</h4>
            <p className="text-xs text-[#88888C] font-mono mt-0.5">{setupA.car} • {setupA.game}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 text-[10.5px] font-mono border-t border-[#1F1F23]/80 pt-2.5 text-stone-400">
            <span>Circuito: <strong className="text-stone-200">{setupA.track}</strong></span>
            <span>Record: <strong className="text-[#66FCF1]">{setupA.lapTime || "Sin rev."}</strong></span>
          </div>
        </div>

        {/* Card B */}
        <div className="tuning-card border border-[#1F1F23] rounded-xl p-5 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F1F23] pb-2.5 mb-2.5">
              <span className="text-[9.5px] uppercase font-mono bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 px-2.5 py-0.5 rounded font-extrabold tracking-widest">
                REGLAJE B (EVO)
              </span>
              <button
                onClick={() => onSelectSetup(setupB.id)}
                className="text-[10.5px] font-mono text-[#66FCF1] flex items-center gap-1 hover:underline uppercase tracking-wide font-bold"
              >
                Abrir editor <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-white font-bold text-sm truncate">{setupB.title}</h4>
            <p className="text-xs text-[#88888C] font-mono mt-0.5">{setupB.car} • {setupB.game}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 text-[10.5px] font-mono border-t border-[#1F1F23]/80 pt-2.5 text-stone-400">
            <span>Circuito: <strong className="text-stone-200">{setupB.track}</strong></span>
            <span>Record: <strong className="text-[#66FCF1]">{setupB.lapTime || "Sin rev."}</strong></span>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="tuning-card border border-[#1F1F23] rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-black/35 border-b border-[#1F1F23]">
          <h3 className="text-xs font-bold text-stone-200 font-mono uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF3C3C]" />
            Tabla Comparativa de Parámetros Mecánicos
          </h3>
          <p className="text-[10.5px] text-[#6B6B70] mt-1 font-mono leading-relaxed uppercase">
            Se comparan los valores de cada sección. Las variaciones se calculan automáticamente de forma deductiva para un análisis rápido de telemetría.
          </p>
        </div>

        <div className="divide-y divide-[#1F1F23]">
          {effectiveSections.map((section) => {
            // Check if there are fields that actually exist in setup values (or are default in template)
            const fields = section.fields;

            return (
              <div key={section.id} className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase font-mono border-b border-[#1F1F23]/60 pb-1 flex items-center justify-between">
                  <span>{section.name}</span>
                  <span className="text-[10px] text-[#6B6B70] uppercase tracking-wide font-mono">{fields.length} variables</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#1F1F23]/50 text-[9.5px] text-[#6B6B70] uppercase tracking-wider">
                        <th className="py-2.5 font-medium">Ajuste</th>
                        <th className="py-2.5 text-right font-medium">Reglaje A ({setupA.title.slice(0, 10)}...)</th>
                        <th className="py-2.5 text-right font-medium text-[#66FCF1]">Reglaje B ({setupB.title.slice(0, 10)}...)</th>
                        <th className="py-2.5 text-right font-medium">Diferencial (Delta)</th>
                        <th className="py-2.5 text-center font-medium">Métricas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F23]/40 text-stone-300">
                      {fields.map((field) => {
                        const valA = getValue(setupA, field.id, field.defaultValue);
                        const valB = getValue(setupB, field.id, field.defaultValue);
                        const variance = getVarianceInfo(valA, valB, field.id);

                        return (
                          <tr
                            key={field.id}
                            className={`hover:bg-white/[0.015] transition-all ${
                              variance.differs ? "bg-[#FF3C3C]/[0.01]" : ""
                            }`}
                          >
                            <td className="py-2.5 text-stone-100 font-sans text-xs flex items-center gap-1.5 pl-1">
                              {variance.differs && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3C3C] block" title="Parámetro diferente" />
                              )}
                              {field.name}
                            </td>
                            <td className="py-2.5 text-right font-bold text-stone-300">{valA}</td>
                            <td className="py-2.5 text-right font-bold text-white">{valB}</td>
                            <td className={`py-2.5 text-right font-bold ${variance.color}`}>{variance.text}</td>
                            <td className="py-2.5 text-center text-[#6B6B70] text-[10px]">
                              {field.unit || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
