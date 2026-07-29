import React, { useState, useEffect } from "react";
import { getApiKey, saveApiKey, removeApiKey } from "../services/geminiService";
import { Key, Check, Trash2, X, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";

interface ApiKeyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyConfigModal: React.FC<ApiKeyConfigModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [keyInput, setKeyInput] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentKey, setCurrentKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      const activeKey = getApiKey();
      setCurrentKey(activeKey);
      setKeyInput(activeKey);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    saveApiKey(keyInput.trim());
    setCurrentKey(keyInput.trim());
    setSavedSuccess(true);
    if (onKeyUpdated) onKeyUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    removeApiKey();
    setCurrentKey("");
    setKeyInput("");
    if (onKeyUpdated) onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative font-sans text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wide text-white flex items-center gap-2">
              Configuración de API Key (Gemini)
            </h3>
            <p className="text-xs text-zinc-400">
              Para uso en GitHub Pages / Sitios Estáticos
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 mb-4 text-xs text-zinc-300 space-y-2 leading-relaxed">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              Al estar desplegado en <strong>GitHub / Host Estático</strong>, no existe un servidor Node intermedio. Guarda aquí tu API Key de Google Gemini para habilitar el <strong>Ingeniero ALR</strong> en este navegador.
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono pl-6">
            🔒 Tu clave se guarda localmente en tu navegador (<code className="text-emerald-400">localStorage</code>) y nunca se comparte fuera de las solicitudes directas a Google Gemini.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-zinc-100 placeholder-zinc-600 font-mono text-xs rounded-xl px-4 py-3 outline-none transition-all pr-10"
              />
              {currentKey && (
                <span className="absolute right-3 top-3 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Activa
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
            >
              Obtener API Key Gratis en Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 font-mono">
              <Check className="w-4 h-4" />
              <span>¡API Key guardada correctamente!</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {currentKey ? (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Key
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!keyInput.trim()}
                className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-black uppercase font-mono text-xs tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                Guardar Key
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
