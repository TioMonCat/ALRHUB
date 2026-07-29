import React, { useState, useRef, useEffect } from "react";
import { CarSetup, SetupTemplate } from "../types";
import {
  optimizarSetupConIngenieroALR,
  OptimizationResponse,
  SetupFieldSummary,
  hasApiKey,
} from "../services/geminiService";
import { exportSetupToIni } from "./ALRIniParser";
import { ApiKeyConfigModal } from "./ApiKeyConfigModal";
import {
  Bot,
  User,
  Send,
  Cpu,
  Activity,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Download,
  Zap,
  Sliders,
  Terminal,
  Key,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface SetupAiMessage {
  id: string;
  sender: "user" | "ingeniero";
  text: string;
  suggestedChanges?: Record<string, string>;
  applied?: boolean;
  timestamp: string;
}

interface SetupAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: CarSetup;
  template: SetupTemplate;
  currentValues: Record<string, string>;
  onApplyChanges: (changes: Record<string, string>) => void;
  readOnly?: boolean;
}

export const SetupAiAssistantModal: React.FC<SetupAiAssistantModalProps> = ({
  isOpen,
  onClose,
  setup,
  template,
  currentValues,
  onApplyChanges,
  readOnly = false,
}) => {
  const [messages, setMessages] = useState<SetupAiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper para traducir IDs de campo a nombres legibles
  const getFieldName = (fieldId: string): string => {
    const sections = setup.customSections || template.sections;
    for (const sec of sections) {
      for (const field of sec.fields) {
        if (field.id === fieldId) {
          return `${field.name} (${sec.name})`;
        }
      }
    }
    return fieldId;
  };

  // Resumen estructurado de campos del setup actual
  const buildFieldsSummary = (): SetupFieldSummary[] => {
    const sections = setup.customSections || template.sections;
    const summary: SetupFieldSummary[] = [];

    for (const sec of sections) {
      for (const field of sec.fields) {
        const val =
          currentValues[field.id] !== undefined
            ? currentValues[field.id]
            : field.defaultValue || "0";
        summary.push({
          id: field.id,
          name: `${field.name} [${sec.name}]`,
          currentValue: val,
          unit: field.unit,
          min: field.min,
          max: field.max,
        });
      }
    }
    return summary;
  };

  // Inicializar mensaje de bienvenida si el chat está vacío
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: SetupAiMessage = {
        id: "setup-welcome",
        sender: "ingeniero",
        text: `🏎️ **Box, box, piloto.** He cargado el setup **${setup.title}** para el **${setup.car}** en **${setup.track}**.\n\nTengo acceso en tiempo real a tus ${
          Object.keys(currentValues).length
        } parámetros de reglaje (muelles, barras, caídas, presiones, aerodinámica y diferencial).\n\n¿Qué comportamiento dinámico quieres corregir o qué mejora buscas en este reglaje?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([welcome]);
    }
  }, [isOpen, setup, currentValues, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: SetupAiMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInput("");
    setIsLoading(true);

    try {
      const result: OptimizationResponse = await optimizarSetupConIngenieroALR({
        car: setup.car,
        track: setup.track,
        game: setup.game,
        notes: setup.notes,
        currentValues,
        fieldsSummary: buildFieldsSummary(),
        userQuery: textToSend,
      });

      const hasSuggested =
        result.suggestedChanges &&
        Object.keys(result.suggestedChanges).length > 0;

      const ingenieroMessage: SetupAiMessage = {
        id: `ing-${Date.now()}`,
        sender: "ingeniero",
        text: result.markdownText,
        suggestedChanges: hasSuggested ? result.suggestedChanges : undefined,
        applied: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, ingenieroMessage]);
    } catch (err: any) {
      console.error("Error optimizando setup:", err);
      setError(
        err?.message ||
          "Error al procesar la telemetría del reglaje con el Ingeniero ALR."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyMsgChanges = (msgId: string, changes: Record<string, string>) => {
    if (readOnly) return;
    onApplyChanges(changes);
    setAppliedCount((prev) => prev + Object.keys(changes).length);

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleExportIni = () => {
    try {
      const currentSetupSnapshot = { ...setup, values: currentValues };
      const iniContent = exportSetupToIni(currentSetupSnapshot, template);
      const blob = new Blob([iniContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanCarName = setup.car ? setup.car.toLowerCase().replace(/[\s\W]+/g, "_") : "setup";
      const cleanTitleName = setup.title ? setup.title.toLowerCase().replace(/[\s\W]+/g, "_") : "reglaje";
      link.href = url;
      link.download = `${cleanCarName}_${cleanTitleName}_IA.ini`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al exportar .ini", e);
    }
  };

  const quickPrompts = [
    "Corregir subviraje severo en entrada de curva",
    "Corregir sobreviraje al acelerar a la salida",
    "Optimizar presiones y temperatura para seco",
    "Equilibrar carga aerodinámica (Rake / Ala trasera)",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl h-[92vh] sm:h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-black text-sm sm:text-base tracking-wide uppercase flex items-center gap-2">
                  Ingeniero ALR — Ajuste en Tiempo Real
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                  {setup.car}
                </span>
                <span>•</span>
                <span className="text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px]">
                  {setup.track}
                </span>
                {appliedCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {appliedCount} ajustes aplicados en vivo
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              title="Configurar Gemini API Key"
              className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 px-2.5 py-1.5 rounded-lg font-mono transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">API Key</span>
            </button>
            <button
              onClick={handleExportIni}
              title="Exportar archivo .ini actualizado"
              className="flex items-center gap-1.5 text-xs text-black bg-cyan-400 hover:bg-cyan-300 px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span className="hidden sm:inline">Exportar .ini</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                  msg.sender === "user"
                    ? "bg-cyan-950/80 text-cyan-400 border-cyan-500/30"
                    : "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm shadow-xl border ${
                  msg.sender === "user"
                    ? "bg-zinc-900 text-zinc-100 border-zinc-800 rounded-tr-none"
                    : "bg-zinc-900/90 text-zinc-200 border-emerald-500/20 rounded-tl-none"
                }`}
              >
                <div className="flex items-center justify-between mb-2 text-[10px] text-zinc-500 border-b border-zinc-800/80 pb-1.5 font-mono">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider">
                    {msg.sender === "user" ? "Piloto ALR" : "Ingeniero ALR"}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {msg.sender === "ingeniero" ? (
                  <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed text-xs sm:text-sm space-y-2">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-zinc-100">
                    {msg.text}
                  </p>
                )}

                {/* BOTÓN PARA APLICAR CAMBIOS EN TIEMPO REAL */}
                {msg.suggestedChanges && (
                  <div className="mt-4 pt-3 border-t border-emerald-500/30 bg-emerald-950/30 -mx-4 -mb-4 p-3.5 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        <span>
                          {msg.applied
                            ? "✅ Ajustes Aplicados al Setup"
                            : `⚡ ${
                                Object.keys(msg.suggestedChanges).length
                              } Modificaciones Sugeridas`}
                        </span>
                      </div>

                      {!msg.applied ? (
                        <button
                          onClick={() =>
                            handleApplyMsgChanges(msg.id, msg.suggestedChanges!)
                          }
                          disabled={readOnly}
                          className="bg-emerald-400 hover:bg-emerald-300 text-black font-black px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 fill-black" />
                          Aplicar al Setup en Vivo
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Modificado en
                          tiempo real
                        </span>
                      )}
                    </div>

                    {/* LISTA DE CAMBIOS PROPUESTOS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 text-[11px] font-mono">
                      {Object.entries(msg.suggestedChanges).map(
                        ([fieldId, newVal]) => {
                          const oldVal =
                            currentValues[fieldId] !== undefined
                              ? currentValues[fieldId]
                              : "N/A";
                          return (
                            <div
                              key={fieldId}
                              className="bg-black/60 border border-emerald-900/40 p-2 rounded flex items-center justify-between text-zinc-300"
                            >
                              <span className="truncate max-w-[140px] text-zinc-400 font-medium">
                                {getFieldName(fieldId)}:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="line-through text-zinc-500 text-[10px]">
                                  {oldVal}
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  → {newVal}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 flex-row">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-zinc-900/90 border border-emerald-500/30 text-emerald-400 rounded-2xl rounded-tl-none p-4 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
                <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
                <span className="font-mono tracking-wide text-zinc-300 animate-pulse">
                  Analizando chasis, aerodinámica y calculando ajustes...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="px-3 py-1 bg-red-900/60 hover:bg-red-800 border border-red-500/50 text-white rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Configurar API Key
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK PROMPTS CHIPS */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Terminal className="w-3 h-3 text-emerald-400" /> Ajustes Frecuentes:
          </span>
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(promptText)}
              disabled={isLoading}
              className="text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-emerald-500/40 px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 font-mono disabled:opacity-50"
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              {promptText}
            </button>
          ))}
        </div>

        {/* INPUT & SEND */}
        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
            placeholder="Pide un ajuste al Ingeniero (ej. 'ablanda la barra delantera y aumenta caída')..."
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-400 hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider font-mono"
          >
            <span className="hidden sm:inline">Optimizar</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ApiKeyConfigModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => setError(null)}
      />
    </div>
  );
};

export default SetupAiAssistantModal;
