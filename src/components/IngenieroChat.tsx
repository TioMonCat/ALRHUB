import React, { useState, useRef, useEffect } from "react";
import {
  consultarIngenieroALR,
  SetupContext,
  hasApiKey,
} from "../services/geminiService";
import { ApiKeyConfigModal } from "./ApiKeyConfigModal";
import {
  Bot,
  User,
  Send,
  Cpu,
  Activity,
  Database,
  Gauge,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Terminal,
  Key,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  sender: "user" | "ingeniero";
  text: string;
  timestamp: string;
}

interface IngenieroChatProps {
  setupsDesdeFirebase?: SetupContext[];
}

export const IngenieroChat: React.FC<IngenieroChatProps> = ({
  setupsDesdeFirebase = [],
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "ingeniero",
      text: "👋 **Box, box, piloto.** Soy el **Ingeniero ALR**, tu Jefe de Pista Virtual. Estoy listo para analizar la telemetría, archivos `.ini` y datos de tus setups en Firebase.\n\n¿Qué problema dinámico o duda de balance (subviraje, sobreviraje, presiones, aerodinámica) estamos enfrentando en pista?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInput("");
    setIsLoading(true);

    try {
      const respuestaIngeniero = await consultarIngenieroALR(
        textToSend,
        setupsDesdeFirebase
      );

      const ingenieroMessage: Message = {
        id: `ing-${Date.now()}`,
        sender: "ingeniero",
        text: respuestaIngeniero,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, ingenieroMessage]);
    } catch (err: any) {
      console.error("Error al consultar al Ingeniero ALR:", err);
      setError(
        err?.message ||
          "Error al comunicarse con la telemetría del Ingeniero ALR."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Tengo subviraje severo a la entrada de curva con el GT3",
    "Analiza el setup guardado de Firebase para equilibrar la aerodinámica",
    "¿Cómo ajusto el rake y la barra estabilizadora trasera para Monza?",
    "¿Qué presiones de neumáticos debo mantener en pista seca?",
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl font-sans flex flex-col">
      {/* HEADER DE LA TELEMETRÍA DEL INGENIERO */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-900"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-white font-black tracking-wide text-sm sm:text-base uppercase flex items-center gap-1.5">
                Ingeniero ALR
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold tracking-widest">
                  TELEMETRÍA AI VIRTUAL
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Gauge className="w-3 h-3 text-cyan-400" /> AC / ACC Telemetry
                Engine
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <Database className="w-3 h-3" />
                {setupsDesdeFirebase.length > 0
                  ? `${setupsDesdeFirebase.length} setups en Firebase`
                  : "Firebase Conectado"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono">
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            title="Configurar Gemini API Key para GitHub / Sitios Estáticos"
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-700/80 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-bold">API Key</span>
          </button>
          <div className="hidden sm:flex px-2.5 py-1 bg-zinc-900 rounded border border-zinc-800 items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>PIT WALL ONLINE</span>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO DEL CHAT */}
      <div className="h-[480px] sm:h-[520px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* AVATAR */}
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

            {/* MESSAGE BALLOON */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-xl p-3.5 text-xs sm:text-sm shadow-md border ${
                msg.sender === "user"
                  ? "bg-zinc-900 text-zinc-100 border-zinc-800 rounded-tr-none"
                  : "bg-zinc-900/90 text-zinc-200 border-emerald-500/20 rounded-tl-none"
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-500 border-b border-zinc-800/60 pb-1 gap-4 font-mono">
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
            </div>
          </div>
        ))}

        {/* CARGANDO / PROCESANDO TELEMETRÍA */}
        {isLoading && (
          <div className="flex items-start gap-3 flex-row">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-zinc-900/90 border border-emerald-500/30 text-emerald-400 rounded-xl rounded-tl-none p-3.5 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
              <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
              <span className="font-mono tracking-wide text-zinc-300 animate-pulse">
                Analizando telemetría y datos de física...
              </span>
            </div>
          </div>
        )}

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
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

      {/* CHIPS DE PREGUNTAS RÁPIDAS */}
      <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Terminal className="w-3 h-3 text-emerald-400" /> Consultas Rápidas:
        </span>
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(promptText)}
            disabled={isLoading}
            className="text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-emerald-500/40 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 font-mono disabled:opacity-50"
          >
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            {promptText}
          </button>
        ))}
      </div>

      {/* INPUT Y BOTÓN DE ENVIAR */}
      <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Escribe tu consulta al Ingeniero (ej. subviraje en curva rápida, presiones .ini...)"
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-lg px-3.5 py-2.5 outline-none transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-4 py-2.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      <ApiKeyConfigModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => setError(null)}
      />
    </div>
  );
};

export default IngenieroChat;
