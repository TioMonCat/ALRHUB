import React, { useState, useRef, useEffect } from "react";
import { CarSetup, SetupTemplate } from "../types";
import {
  optimizarSetupConIngenieroALR,
  OptimizationResponse,
  SetupFieldSummary,
} from "../services/geminiService";
import { exportSetupToIni } from "./ALRIniParser";
import { ApiKeyConfigModal } from "./ApiKeyConfigModal";
import {
  parseTelemetryFile,
  parseMotecLdBinary,
  TelemetrySummary,
} from "../utils/telemetryParser";
import {
  Bot,
  User,
  Send,
  Cpu,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Download,
  Zap,
  Sliders,
  Key,
  Upload,
  Thermometer,
  Trash2,
  Image as ImageIcon,
  Gauge,
  FileSpreadsheet,
  ClipboardPaste,
  Eye,
  Check,
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
  motecSummary?: TelemetrySummary;
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
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Estados obligatorios de telemetría y entorno
  const [trackTemp, setTrackTemp] = useState("32");
  const [ambientTemp, setAmbientTemp] = useState("24");
  const [telemetryImage, setTelemetryImage] = useState<string | null>(null);
  const [telemetryMime, setTelemetryMime] = useState("image/jpeg");
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [motecSummary, setMotecSummary] = useState<TelemetrySummary | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const motecFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Helper para procesar archivos o blobs de imagen (desde Ctrl+V o selector)
  const processImageFile = (file: Blob, defaultName?: string) => {
    if (file.type && !file.type.startsWith("image/")) {
      setError("Por favor, pega o selecciona una imagen válida (PNG, JPG, WEBP).");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setTelemetryImage(result);
        setTelemetryMime(file.type || "image/png");
        const name = (file as File).name || defaultName || `captura_${new Date().toLocaleTimeString().replace(/:/g, "-")}.png`;
        setImageFileName(name);
        showToast("📸 ¡Captura pegada con éxito en el setup!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper para procesar archivos de telemetría MoTeC (.ld binario, .ldx, .csv, .json)
  const processMotecFile = (file: File) => {
    setError(null);
    const fileNameLower = file.name.toLowerCase();
    const isLd = fileNameLower.endsWith(".ld");
    const isLdx = fileNameLower.endsWith(".ldx");

    if (isLd) {
      // Lectura binaria directa para archivos .ld de MoTeC i2 Pro / Assetto Corsa / ACC
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          try {
            const parsed = parseMotecLdBinary(buffer, file.name);
            setMotecSummary(parsed);
            showToast(`📊 ¡Telemetría MoTeC binaria (.ld) cargada: ${file.name}!`);
          } catch (err) {
            console.error("Error parseando MoTeC .ld:", err);
            setError("Error al leer el archivo binario .ld de MoTeC. Asegúrate de que no esté corrupto.");
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isLdx) {
      // Archivo XML de marcas de vuelta / beacons de MoTeC
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          try {
            const parsed = parseTelemetryFile(content, file.name);
            setMotecSummary(parsed);
            showToast("🏁 ¡Marcas de vuelta .ldx procesadas!");
          } catch (err) {
            setError("Error al procesar el archivo .ldx.");
          }
        }
      };
      reader.readAsText(file);
    } else {
      // Archivos de texto (CSV, JSON, Logs AC, SimHub)
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          try {
            const parsed = parseTelemetryFile(content, file.name);
            setMotecSummary(parsed);
            showToast(`📊 ¡Telemetría ${file.name} procesada correctamente!`);
          } catch (err) {
            setError("Error al parsear el archivo de telemetría. Asegúrate de que sea un CSV o JSON válido.");
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // Botón para pegar desde portapapeles con API Clipboard
  const handlePasteFromClipboardButton = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              processImageFile(blob, "captura_portapapeles.png");
              return;
            }
          }
        }
        showToast("No se detectó imagen en el portapapeles. Haz tu captura (Win+Shift+S) y pulsa Ctrl + V.");
      } else {
        showToast("Presiona directamente las teclas Ctrl + V en tu teclado para pegar la captura.");
      }
    } catch (err) {
      showToast("Haz tu captura (Win+Shift+S) y pulsa directamente Ctrl + V en tu teclado.");
    }
  };

  // Escuchar Pegar desde el Portapapeles (Ctrl + V) en cualquier lugar del modal
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              e.preventDefault();
              processImageFile(blob, "captura_portapapeles.png");
              break;
            }
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  // Manejo de Drag & Drop para archivos (.ld, .csv, imágenes)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      } else if (
        name.endsWith(".ld") ||
        name.endsWith(".ldx") ||
        name.endsWith(".csv") ||
        name.endsWith(".json") ||
        name.endsWith(".txt")
      ) {
        processMotecFile(file);
      } else {
        setError("Formato no reconocido. Arrastra una imagen (PNG/JPG) o un archivo MoTeC (.ld/.ldx/.csv).");
      }
    }
  };

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
        text: `🏎️ **Box, box, piloto.** He cargado el setup **${setup.title}** para el **${setup.car}** en **${setup.track}**.\n\n⚡ **TELEMETRÍA MOTEC & CAPTURAS ACTIVADAS:**\n- **Capturas de pantalla**: Haz tu recorte (**Win + Shift + S**) y presiona **Ctrl + V** directamente en cualquier momento para pegarlo.\n- **MoTeC i2 Pro**: Puedes cargar directamente tus archivos binarios **\`.ld\`** (o \`.ldx\` / CSV) generados automáticamente por Assetto Corsa / ACC.\n\n¿Qué comportamiento dinámico en pista quieres que analice y optimice?`,
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

    // VALIDACIÓN: Requerir foto pegada O archivo de telemetría MoTeC (o ambos)
    if (!telemetryImage && !motecSummary) {
      setError("⚠️ OBLIGATORIO: Debes pegar una captura de pantalla (Ctrl + V) O cargar un archivo de telemetría MoTeC (.ld / CSV) para que el Ingeniero ALR pueda analizar la telemetría.");
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
      imageThumbnail: telemetryImage || undefined,
      motecSummary: motecSummary || undefined,
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
        telemetrySummary: motecSummary ? motecSummary.rawSummaryText : undefined,
        image: telemetryImage
          ? {
              data: telemetryImage,
              mimeType: telemetryMime,
            }
          : undefined,
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
          "Error al consultar al Ingeniero ALR. Revisa tu conexión o API Key."
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
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, applied: true } : msg
      )
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Visual Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-cyan-950/80 border-4 border-dashed border-cyan-400 z-50 flex flex-col items-center justify-center pointer-events-none gap-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-white font-mono font-bold text-lg">Suelta tu archivo MoTeC (.ld) o Captura de Imagen aquí</p>
        </div>
      )}

      {/* Modal Zoom de Imagen */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 cursor-zoom-out animate-fadeIn"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-zinc-900 p-2 rounded-2xl border border-zinc-700 shadow-2xl">
            <img 
              src={previewZoomImage} 
              alt="Zoom Telemetría" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <button 
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/80 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-5xl h-[94vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* TOAST FLOTANTE DE ACCIÓN */}
        {successToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-cyan-400 text-black px-4 py-2 rounded-full font-mono text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{successToast}</span>
          </div>
        )}

        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                  Ingeniero ALR • Telemetría MoTeC & IA
                </h3>
                <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-black text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full">
                  MoTeC i2 Pro & .ld
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {setup.car} • {setup.track} ({setup.game})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              title="Configurar API Key de Gemini"
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportIni}
              title="Exportar archivo .ini actualizado"
              className="flex items-center gap-1.5 text-xs text-black bg-cyan-400 hover:bg-cyan-300 px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
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
        <div className="bg-zinc-950/95 border-b border-zinc-800 p-3 sm:p-4 space-y-3 flex-shrink-0">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* 1. Campos de Temperatura de Circuito */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex-shrink-0">
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

            {/* 2. Sección de Captura (Ctrl+V) y MoTeC .ld */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 min-w-0">
              
              {/* ZONA DE PEGAR CAPTURA (CTRL + V) */}
              <div className="relative">
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
                  <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-2 gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => setPreviewZoomImage(telemetryImage)}
                        title="Clic para ampliar captura"
                      >
                        <img
                          src={telemetryImage}
                          alt="Captura de telemetría"
                          className="w-10 h-10 object-cover rounded-lg border border-emerald-500/60 flex-shrink-0 group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Captura Pegada
                        </span>
                        <p className="text-[11px] text-zinc-200 font-mono truncate max-w-[130px]" title={imageFileName || "captura.png"}>
                          {imageFileName || "captura.png"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewZoomImage(telemetryImage)}
                        title="Ver imagen completa"
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTelemetryImage(null);
                          setImageFileName(null);
                        }}
                        title="Eliminar captura"
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-1.5 h-full">
                    {/* Botón principal de Pegar Captura */}
                    <button
                      type="button"
                      onClick={handlePasteFromClipboardButton}
                      title="Haz una captura (Win+Shift+S) y pulsa aquí o presiona Ctrl+V"
                      className="flex-1 min-h-[50px] bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-emerald-950/50 hover:to-zinc-900 border border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all flex-shrink-0">
                          <ClipboardPaste className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[11px] font-bold font-mono text-emerald-300 group-hover:text-emerald-200 uppercase tracking-wider truncate">
                            Pegar Captura (Ctrl + V)
                          </span>
                          <span className="block text-[9px] text-zinc-400 font-mono truncate">
                            Win + Shift + S o Clic para pegar
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 flex-shrink-0">
                        Ctrl+V
                      </span>
                    </button>

                    {/* Botón secundario para subir archivo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Examinar archivo en tu PC"
                      className="px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 text-zinc-400 hover:text-white rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer flex-shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-mono uppercase mt-0.5">Subir</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ZONA DE ARCHIVO MOTEC (.LD BINARIO, .LDX, CSV) */}
              <div className="relative">
                <input
                  type="file"
                  ref={motecFileInputRef}
                  accept=".ld,.ldx,.csv,.txt,.json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processMotecFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {motecSummary ? (
                  <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-500/50 rounded-xl p-2 gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <Gauge className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-cyan-400 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> {motecSummary.sourceType}
                        </span>
                        <p className="text-[11px] text-zinc-200 font-mono font-bold truncate max-w-[130px]" title={motecSummary.fileName}>
                          {motecSummary.fileName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMotecSummary(null)}
                      title="Eliminar telemetría"
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => motecFileInputRef.current?.click()}
                    title="Cargar archivo binario .ld de MoTeC i2 Pro, .ldx o CSV"
                    className="w-full min-h-[50px] bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-cyan-950/50 hover:to-zinc-900 border border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold font-mono text-cyan-300 group-hover:text-cyan-200 uppercase tracking-wider truncate">
                          MoTeC .ld Binario
                        </span>
                        <span className="block text-[9px] text-zinc-400 font-mono truncate">
                          .ld / .ldx / i2 Pro / CSV
                        </span>
                      </div>
                    </div>
                    <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TARJETA DE RESUMEN DE TELEMETRÍA MOTEC PARSEADA (SI EXISTE) */}
          {motecSummary && (
            <div className="bg-zinc-900/90 border border-cyan-500/40 rounded-xl p-3 font-mono text-xs space-y-2.5 animate-fadeIn shadow-lg">
              <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Métricas Extraídas de MoTeC ({motecSummary.totalRows} muestras{motecSummary.channelsFound ? ` • ${motecSummary.channelsFound.length} canales` : ""})</span>
                  {motecSummary.bestLapTime && (
                    <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[10px]">
                      Mejor Vuelta: {motecSummary.bestLapTime}
                    </span>
                  )}
                </div>

                {motecSummary.bottomingOutAlert ? (
                  <span className="bg-red-950 border border-red-500/60 text-red-300 text-[10px] px-2.5 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                    ⚠️ Rozamiento Crítico Asfalto (Bottoming-Out)
                  </span>
                ) : (
                  <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold">
                    ✓ Rake & Alturas OK
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Vel. Máx / RPM</span>
                  <span className="text-white font-bold text-xs">{motecSummary.maxSpeedKmh} km/h</span>
                  <span className="text-zinc-400 text-[9px] block font-mono">{motecSummary.maxRpm} RPM</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Rake Aerodinámico</span>
                  <span className="text-cyan-300 font-bold text-xs">{motecSummary.rakeAvgMm} mm</span>
                  <span className="text-zinc-400 text-[9px] block">Rake Mín: {motecSummary.rakeMinMm} mm</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Presiones Caliente</span>
                  <span className="text-emerald-400 font-bold text-[11px] block">
                    FL: {motecSummary.tyres.FL.pressPsi} | FR: {motecSummary.tyres.FR.pressPsi} PSI
                  </span>
                  <span className="text-zinc-400 text-[9px] block">
                    RL: {motecSummary.tyres.RL.pressPsi} | RR: {motecSummary.tyres.RR.pressPsi} PSI
                  </span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Temp. Neumáticos Del.</span>
                  <span className="text-amber-300 font-bold text-[10px] block">
                    FL: {motecSummary.tyres.FL.tempAvgC}°C | FR: {motecSummary.tyres.FR.tempAvgC}°C
                  </span>
                  <span className="text-zinc-400 text-[9px] block">
                    {motecSummary.balanceInfo.understeerEvents > 10 ? "⚠️ Subviraje Alto" : "Balance Estable"}
                  </span>
                </div>
              </div>
            </div>
          )}
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

                {/* Mostrar Muestra de Foto/Captura, MoTeC y Clima en Mensaje de Usuario */}
                {msg.sender === "user" && (
                  <div className="mb-3 p-2 bg-black/60 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-400 gap-1">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Thermometer className="w-3 h-3" /> Pista: {msg.trackTemp}°C | Amb: {msg.ambientTemp}°C
                      </span>
                      {msg.motecSummary && (
                        <span className="text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                          <Gauge className="w-3 h-3" /> {msg.motecSummary.fileName} ({msg.motecSummary.sourceType})
                        </span>
                      )}
                      {msg.imageThumbnail && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <ImageIcon className="w-3 h-3" /> Captura Pegada
                        </span>
                      )}
                    </div>
                    {msg.imageThumbnail && (
                      <div 
                        className="cursor-pointer group relative"
                        onClick={() => setPreviewZoomImage(msg.imageThumbnail || null)}
                      >
                        <img
                          src={msg.imageThumbnail}
                          alt="Captura adjunta"
                          className="max-h-40 w-full object-cover rounded-lg border border-zinc-700/60 group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                          <span className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Clic para ampliar
                          </span>
                        </div>
                      </div>
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
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="font-mono tracking-wide text-zinc-300 animate-pulse">
                  Analizando telemetría MoTeC, balance aerodinámico y presiones a {trackTemp}°C...
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

        {/* PROMPT SUGERENCIAS RÁPIDAS */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Consultas rápidas:
          </span>
          {[
            "Analiza si tengo bottoming o rozamiento con el asfalto en curvas rápidas",
            "Tengo subviraje en entrada de curva al soltar el freno",
            "El coche es inestable en aceleración de curvas lentas (sobreviraje)",
            "Ajusta presiones y caídas según el gradiente IMO",
          ].map((sug, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSend(sug)}
              className="text-[11px] font-mono text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
            >
              {sug}
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
            placeholder="Pide un ajuste al Ingeniero o consulta telemetría (Ctrl+V para pegar capturas)..."
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none transition-all disabled:opacity-50 font-mono"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider font-mono flex-shrink-0"
          >
            <span className="hidden sm:inline">Optimizar</span>
            <Send className="w-4 h-4 stroke-[2.5]" />
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
