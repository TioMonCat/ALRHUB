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
  Camera,
  Upload,
  Thermometer,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface SetupAiMessage {
  id: string;
  sender: "user" | "ingeniero";
  text: string;
  suggestedChanges?: Record<string, string>;
  applied?: boolean;
  timestamp: string;
  trackTemp?: string;
  ambientTemp?: string;
  imageThumbnail?: string;
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

  // Estados obligatorios de telemetría y entorno
  const [trackTemp, setTrackTemp] = useState("32");
  const [ambientTemp, setAmbientTemp] = useState("24");
  const [telemetryImage, setTelemetryImage] = useState<string | null>(null);
  const [telemetryMime, setTelemetryMime] = useState("image/jpeg");
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper para procesar archivos de imagen
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona un archivo de imagen válido (PNG, JPG, WEBP).");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setTelemetryImage(result);
        setTelemetryMime(file.type || "image/jpeg");
        setImageFileName(file.name || "captura_telemetria.png");
      }
    };
    reader.readAsDataURL(file);
  };

  // Escuchar Pegar desde el Portapapeles (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              processImageFile(blob);
              break;
            }
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

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
        text: `🏎️ **Box, box, piloto.** He cargado el setup **${setup.title}** para el **${setup.car}** en **${setup.track}**.\n\n⚠️ **REQUISITOS PREVIOS OBLIGATORIOS:**\nPara que pueda hacer un análisis óptimo de desgaste IMO, presiones y balance aerodinámico en tiempo real, **debes confirmar la captura del estado de tu coche/telemetría y las temperaturas del circuito y ambiente arriba**.\n\n¿Qué comportamiento dinámico quieres corregir o mejorar?`,
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

    // VALIDACIÓN OBLIGATORIA
    if (!telemetryImage) {
      setError("⚠️ OBLIGATORIO: Debes adjuntar una foto o captura del estado actual del coche o telemetría para que el Ingeniero ALR pueda analizar presiones y desgaste.");
      return;
    }
    if (!trackTemp.trim() || !ambientTemp.trim()) {
      setError("⚠️ OBLIGATORIO: Debes indicar la Temperatura de Pista y la Temperatura Ambiente en °C.");
      return;
    }

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
      trackTemp,
      ambientTemp,
      imageThumbnail: telemetryImage,
    };

    const chatHistory = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

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
        trackTemp,
        ambientTemp,
        image: {
          data: telemetryImage,
          mimeType: telemetryMime,
        },
        chatHistory,
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
      <div className="w-full max-w-4xl h-[94vh] sm:h-[88vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black px-4 sm:px-6 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-black text-sm sm:text-base tracking-wide uppercase flex items-center gap-2">
                  Ingeniero ALR — Telemetría & Setup IA
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

        {/* PANEL DE DATOS OBLIGATORIOS (TELEMETRÍA Y TEMPERATURAS) */}
        <div className="bg-zinc-950/90 border-b border-zinc-800 p-3 sm:p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Campos de Temperatura */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Thermometer className="w-4 h-4" />
              </div>
              
              <div className="flex items-center gap-3 font-mono text-xs">
                <div>
                  <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                    Temp. Pista *
                  </label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={trackTemp}
                      onChange={(e) => setTrackTemp(e.target.value)}
                      placeholder="Ej: 32"
                      className="w-14 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white font-bold text-xs text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-zinc-500 text-[10px]">°C</span>
                  </div>
                </div>

                <span className="text-zinc-700 font-bold">|</span>

                <div>
                  <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                    Temp. Ambiente *
                  </label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(e.target.value)}
                      placeholder="Ej: 24"
                      className="w-14 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white font-bold text-xs text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-zinc-500 text-[10px]">°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subida Obligatoria de Foto / Captura */}
            <div className="flex-1 min-w-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {telemetryImage ? (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={telemetryImage}
                      alt="Telemetría"
                      className="w-10 h-10 object-cover rounded-lg border border-emerald-500/50 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Captura Telemetría Lista
                      </span>
                      <p className="text-xs text-zinc-300 font-mono truncate max-w-[200px] sm:max-w-[300px]">
                        {imageFileName || "captura_estado.png"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTelemetryImage(null);
                        setImageFileName(null);
                      }}
                      title="Quitar imagen"
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border-2 border-dashed border-red-500/40 hover:border-emerald-400/60 rounded-xl p-2.5 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition-colors flex-shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-red-400 group-hover:text-emerald-300 uppercase tracking-wider">
                          Foto / Captura Coche *
                        </span>
                        <span className="text-[9px] bg-red-950 border border-red-500/40 text-red-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          OBLIGATORIO
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">
                        Haz clic, arrastra o pega (Ctrl+V) captura de neumáticos/HUD
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-400 group-hover:text-white flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Subir Captura</span>
                  </div>
                </button>
              )}
            </div>
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

                {/* Mostrar Muestra de Foto/Captura y Clima en Mensaje de Usuario */}
                {msg.sender === "user" && (
                  <div className="mb-3 p-2 bg-black/60 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Thermometer className="w-3 h-3" /> Pista: {msg.trackTemp}°C | Amb: {msg.ambientTemp}°C
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Telemetría
                      </span>
                    </div>
                    {msg.imageThumbnail && (
                      <img
                        src={msg.imageThumbnail}
                        alt="Captura adjunta"
                        className="max-h-36 w-full object-cover rounded-lg border border-zinc-700/60"
                      />
                    )}
                  </div>
                )}

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
                  Analizando captura de telemetría, presiones a {trackTemp}°C y chasis...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
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
