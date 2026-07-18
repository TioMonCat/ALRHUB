import React, { useState, useEffect } from "react";
import { CarSetup, SetupTemplate } from "../types";
import { POPULAR_GAMES, POPULAR_TRACKS, DEFAULT_TEMPLATES } from "../presets";
import { Trash2, Star, Plus, FileSpreadsheet, Download, Upload, Search, Filter, Sliders, Layers, RefreshCw, Layers3, Flame, Clock, CloudRain, Sun, CloudDrizzle, Check, File } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseIni, mapIniToSetupValues } from "./ALRIniParser";

const getCarImage = (carName: string) => {
  const c = carName.toUpperCase();
  if (c.includes("GT3")) return "img/GT3.JPG";
  if (c.includes("LMP2") || c.includes("ORECA")) return "img/LMP2.JPG";
  return null;
};

interface SetupHubProps {
  setups: CarSetup[];
  templates: SetupTemplate[];
  onSelectSetup: (id: string) => void;
  onDeleteSetup: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCreateSetup: (title: string, game: string, car: string, track: string, templateId: string, setupType?: string, initialValues?: Record<string, string>) => void;
  onImportBackup: (importedSetups: CarSetup[], importedTemplates: SetupTemplate[]) => void;
  onCompareSetups: (idA: string, idB: string) => void;
  readOnly?: boolean;
  isTeamAdmin?: boolean;
  isApprovedMember?: boolean;
  currentUserId?: string;
  onCreateTemplate?: (title: string, description: string) => void;
  onDeleteTemplate?: (id: string) => void;
  onUpdateTemplate?: (updatedTpl: SetupTemplate) => void;
  dbReadOnly?: boolean;
}

export default function SetupHub({
  setups,
  templates,
  onSelectSetup,
  onDeleteSetup,
  onToggleFavorite,
  onCreateSetup,
  onImportBackup,
  onCompareSetups,
  readOnly = false,
  isTeamAdmin = false,
  isApprovedMember = false,
  currentUserId = "",
  onCreateTemplate,
  onDeleteTemplate,
  onUpdateTemplate,
  dbReadOnly = false,
}: SetupHubProps) {
  const [search, setSearch] = useState("");
  const [selectedGameFilter, setSelectedGameFilter] = useState("Todos");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState("Todos");
  const [selectedWeatherFilter, setSelectedWeatherFilter] = useState("Todos");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // New Setup Form states
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGame, setNewGame] = useState(POPULAR_GAMES[0] || "Le Mans Ultimate");
  const [newCar, setNewCar] = useState("");
  const [newTrack, setNewTrack] = useState(POPULAR_TRACKS[0] || "Le Mans (Circuit de la Sarthe)");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [setupType, setSetupType] = useState("Libre");

  // .ini setup import states
  const [importedRawValues, setImportedRawValues] = useState<Record<string, Record<string, string>> | null>(null);
  const [uploadedIniFileName, setUploadedIniFileName] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Template Admin States (For editing existing templates and creating new base templates)
  const [editingTemplate, setEditingTemplate] = useState<SetupTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState("");
  const [newTplDesc, setNewTplDesc] = useState("");

  // States for layout builder in Template Edit Mode
  const [activeEditSectionId, setActiveEditSectionId] = useState<string>("");
  const [newSectionName, setNewSectionName] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Field addition sub-states
  const [isAddingField, setIsAddingField] = useState<string | null>(null); // sectionId
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<string>("number");
  const [newFieldMin, setNewFieldMin] = useState<number>(0);
  const [newFieldMax, setNewFieldMax] = useState<number>(100);
  const [newFieldStep, setNewFieldStep] = useState<number>(1);
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldDefaultVal, setNewFieldDefaultVal] = useState("");

  // Sync setupType and template options based on selected game
  useEffect(() => {
    if (newGame === "Le Mans Ultimate") {
      setSetupType("Libre");
      setNewTemplateId(templates.find(t => t.id.includes("le-mans-ultimate-gt3"))?.id || "le-mans-ultimate-gt3");
    } else if (newGame === "Assetto Corsa") {
      setSetupType("LFM");
      setNewTemplateId(templates.find(t => t.id.includes("assetto-corsa-gt3"))?.id || "assetto-corsa-gt3");
    } else {
      setSetupType("");
      const firstTpl = templates.find(t => t.id.includes(newGame.toLowerCase().replace(/\s+/g, '-')));
      if (firstTpl) setNewTemplateId(firstTpl.id);
      else if (templates[0]) setNewTemplateId(templates[0].id);
    }
  }, [newGame, templates]);

  // Compare mode states
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Unique list of games and tracks for filtration
  const availableGames = ["Todos", ...Array.from(new Set(setups.map(s => s.game)))];
  const availableTracks = ["Todos", ...Array.from(new Set(setups.map(s => s.track)))];

  const filteredSetups = setups.filter((setup) => {
    const matchesSearch =
      (setup.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (setup.car || "").toLowerCase().includes(search.toLowerCase()) ||
      (setup.track || "").toLowerCase().includes(search.toLowerCase()) ||
      (setup.game || "").toLowerCase().includes(search.toLowerCase());

    const matchesGame = selectedGameFilter === "Todos" || setup.game === selectedGameFilter;
    const matchesTrack = selectedTrackFilter === "Todos" || setup.track === selectedTrackFilter;
    const matchesWeather = selectedWeatherFilter === "Todos" || setup.weather === selectedWeatherFilter;
    const matchesFav = !onlyFavorites || setup.isFavorite;

    return matchesSearch && matchesGame && matchesTrack && matchesWeather && matchesFav;
  });

  const handleExport = () => {
    const completeBackup = {
      app: "SimRacingSetupsManager",
      version: "1.0",
      exportDate: new Date().toISOString(),
      setups,
      templates,
    };
    const blob = new Blob([JSON.stringify(completeBackup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Backup-SimRacingSetups-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.app === "SimRacingSetupsManager" && Array.isArray(data.setups)) {
          onImportBackup(data.setups, data.templates || []);
        } else {
          console.warn("El archivo no es un backup válido de Sim Racing Setups Manager.");
        }
      } catch (err) {
        console.error("Error al leer el archivo JSON.", err);
      }
    };
    reader.readAsText(file);
  };

  const handleIniFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedIniFileName(file.name);
    setImportNotice(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseIni(text);

        if (Object.keys(parsed.rawValues).length === 0) {
          setImportNotice("⚠️ El archivo no parece contener secciones válidas de un archivo de configuración .ini.");
          return;
        }

        setImportedRawValues(parsed.rawValues);

        // Auto-detect fields
        if (parsed.metadata.car) {
          setNewCar(parsed.metadata.car);
        }

        // Auto-detect template and game from the ini model key
        const carUpper = (parsed.metadata.car || "").toUpperCase();
        
        // Always Assetto Corsa by default if importing a .ini configuration file
        setNewGame("Assetto Corsa");

        let detectedTemplate = "assetto-corsa-gt3";
        if (carUpper.includes("LMP2") || carUpper.includes("ORECA") || carUpper.includes("LMP") || carUpper.includes("07")) {
          detectedTemplate = "assetto-corsa-lmp2";
          setSetupType("LFM");
        }
        setNewTemplateId(detectedTemplate);

        // Set an elegant auto-imported title
        const cleanCarName = parsed.metadata.car 
          ? parsed.metadata.car.replace(/_/g, " ").toUpperCase() 
          : "Coche Importado";
        setNewTitle(`Reglaje Importado - ${cleanCarName}`);

        setImportNotice(`✅ ¡Configuración .ini cargada! Se leyeron los parámetros y se fijó el coche como "${parsed.metadata.car || 'desconocido'}". Completa de forma manual el resto de campos.`);
      } catch (err) {
        console.error("Error al leer el archivo .ini", err);
        setImportNotice("❌ Error al leer o analizar el archivo .ini.");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCar) {
      return;
    }

    let finalValues: Record<string, string> | undefined = undefined;
    if (importedRawValues) {
      const selectedTemplate = templates.find(t => t.id === newTemplateId);
      if (selectedTemplate) {
        finalValues = mapIniToSetupValues(importedRawValues, selectedTemplate);
      }
    }

    onCreateSetup(newTitle, newGame, newCar, newTrack, newTemplateId, setupType, finalValues);
    setIsCreating(false);
    // Reset inputs
    setNewTitle("");
    setNewCar("");
    setImportedRawValues(null);
    setUploadedIniFileName(null);
    setImportNotice(null);
  };

  const toggleCompareSelect = (id: string) => {
    setCompareError(null);
    if (compareSelection.includes(id)) {
      setCompareSelection(compareSelection.filter(item => item !== id));
    } else {
      const clickedSetup = setups.find(s => s.id === id);
      if (!clickedSetup) return;

      if (compareSelection.length > 0) {
        // Find existing setups in comparison
        const referenceSetup = setups.find(s => s.id === compareSelection[0]);
        if (referenceSetup && referenceSetup.game !== clickedSetup.game) {
          setCompareError(`Solo puedes comparar setups del mismo simulador. El primer setup seleccionado es de "${referenceSetup.game}", y estás intentando seleccionar uno de "${clickedSetup.game}".`);
          return;
        }
      }

      if (compareSelection.length >= 2) {
        setCompareSelection([compareSelection[1], id]);
      } else {
        setCompareSelection([...compareSelection, id]);
      }
    }
  };

  const triggerComparison = () => {
    if (compareSelection.length !== 2) {
      return;
    }
    onCompareSetups(compareSelection[0], compareSelection[1]);
  };

  const getGameBadgeTheme = (gameStr: string) => {
    const term = gameStr.toLowerCase();
    if (term.includes("le mans") || term.includes("ultimate")) {
      return "bg-[#FF3C3C]/10 text-[#FF3C3C] border border-[#FF3C3C]/30";
    }
    if (term.includes("assetto") || term.includes("corsa")) {
      return "bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30";
    }
    return "bg-[#1E1E22]/60 text-stone-300 border border-stone-850";
  };

  return (
    <div className="w-full space-y-6">
      {/* Banner de Modo Vista para Postulantes o Modo Solo Lectura de Base de Datos */}
      {dbReadOnly ? (
        <div className="bg-red-950/25 border border-red-500/25 p-4 rounded-xl text-red-400 font-mono text-xs flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
          <div className="flex items-start gap-2.5 pl-1.5">
            <span className="text-red-400 font-bold text-sm animate-pulse">⚠️</span>
            <div className="space-y-1">
              <p className="font-extrabold text-red-400 uppercase tracking-wider text-[10px]">LÍMITE DE ESCRITURA EXCEDIDO • MODO SOLO LECTURA ACTIVO</p>
              <p className="text-stone-300">
                La base de datos está congelada temporalmente hoy por límite de cuota. Los setups actuales son visibles y comparables, pero <strong>no se pueden guardar nuevas modificaciones, renames ni borrar reglajes</strong> en el servidor por hoy.
              </p>
            </div>
          </div>
        </div>
      ) : readOnly ? (
        <div className="bg-amber-950/20 border border-amber-500/25 p-4 rounded-xl text-amber-400 font-mono text-xs flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-500 font-bold text-sm">⚠️</span>
            <div className="space-y-1">
              <p className="font-extrabold text-[#FFAA00] uppercase tracking-wider text-[10px]">Restricción Temporal • MODO ADMINS</p>
              <p className="text-stone-300">La edición de setups está restringida temporalmente a administradores.</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Upper Control Console */}
      <div className="flex justify-end gap-3 mb-4" id="control-console">
        <button
          onClick={() => {
            setIsCompareMode(!isCompareMode);
            setCompareSelection([]);
            setCompareError(null);
          }}
          className={`px-4 py-2 font-mono font-extrabold text-2xs sm:text-xs rounded transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wider cursor-pointer ${
            isCompareMode
              ? "bg-[#66FCF1] hover:bg-cyan-300 text-black shadow-cyan-300/10 border border-[#66FCF1]"
              : "bg-[#161618] hover:bg-[#202024] text-stone-300 border border-[#2A2A2E]"
          }`}
          id="action-toggle-compare"
        >
          <Layers3 className="w-4 h-4" />
          {isCompareMode ? "Desactivar Comparar" : "Modo Comparar"}
        </button>

        {!readOnly && !dbReadOnly && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-[#FF3C3C] hover:bg-red-500 text-black font-mono font-extrabold text-2xs sm:text-xs rounded transition-all flex items-center gap-1.5 shadow-md shadow-red-500/10 uppercase tracking-wider cursor-pointer font-black"
            id="action-new-setup"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            NUEVO REGLAJE
          </button>
        )}
      </div>

      {isCompareMode && (
        <div className="space-y-3">
          <div className="p-4 bg-[#FF3C3C]/5 border border-[#FF3C3C]/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 font-mono active-glow animate-pulse">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Layers3 className="w-5 h-5 text-[#FF3C3C]" />
              <div className="min-w-0 flex-1">
                <span className="text-xs text-[#FF3C3C] font-black tracking-widest block uppercase">BIFURCADOR DE COMPARACIÓN SECUENCIAL</span>
                <span className="text-[10.5px] text-stone-300 block leading-tight mt-0.5">
                  {compareSelection.length === 0 && (
                    "Selección vacía. Haz clic en 'COMPARAR' en un primer reglaje de referencia."
                  )}
                  {compareSelection.length === 1 && (
                    <>
                      Excelente. Primer reglaje: <strong className="text-[#66FCF1]">{setups.find(s => s.id === compareSelection[0])?.title}</strong>. Ahora selecciona un segundo del mismo juego.
                    </>
                  )}
                  {compareSelection.length === 2 && (
                    <>
                      Reglajes del mismo simulador listos: <strong className="text-[#66FCF1]">{setups.find(s => s.id === compareSelection[0])?.title}</strong> vs <strong className="text-[#66FCF1]">{setups.find(s => s.id === compareSelection[1])?.title}</strong>.
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-[#6B6B70] bg-[#0A0A0B] px-2.5 py-1 rounded border border-[#2A2A2E]">
                CONFIGURACIONES: <strong className="text-[#66FCF1]">{compareSelection.length}</strong> / 2
              </span>
              <button
                disabled={compareSelection.length !== 2}
                onClick={triggerComparison}
                className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-extrabold rounded ${
                  compareSelection.length === 2
                    ? "bg-[#66FCF1] text-black hover:bg-cyan-300 cursor-pointer"
                    : "bg-[#1A1A1D] text-stone-600 cursor-not-allowed border border-[#2A2A2E]"
                }`}
              >
                COMPARAR EN PILOTO
              </button>
            </div>
          </div>

          {compareError && (
            <motion.div
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[11px] font-mono text-[#FF3C3C] bg-[#FF3C3C]/10 border border-[#FF3C3C]/20 px-4 py-2.5 rounded-lg flex items-center gap-2"
            >
              <span className="font-bold shrink-0">⚠️ MARGEN DE ERROR:</span>
              <span>{compareError}</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Database Filters Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" id="filters-container">
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-[#6B6B70]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por coche, simulador, pista o nombre..."
            className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#FF3C3C] transition-colors font-mono"
          />
        </div>

        <div className="col-span-1 lg:col-span-2 relative">
          <span className="absolute left-2.5 top-0.5 text-[8.5px] text-[#6B6B70] uppercase tracking-widest font-mono">Simulador</span>
          <select
            value={selectedGameFilter}
            onChange={(e) => setSelectedGameFilter(e.target.value)}
            className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-stone-300 rounded-lg pl-3 pr-2 pt-4 pb-1 text-xs focus:outline-none focus:border-[#FF3C3C]"
          >
            {availableGames.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 lg:col-span-2 relative">
          <span className="absolute left-2.5 top-0.5 text-[8.5px] text-[#6B6B70] uppercase tracking-widest font-mono">Pista</span>
          <select
            value={selectedTrackFilter}
            onChange={(e) => setSelectedTrackFilter(e.target.value)}
            className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-stone-300 rounded-lg pl-3 pr-2 pt-4 pb-1 text-xs focus:outline-none focus:border-[#FF3C3C]"
          >
            {availableTracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 lg:col-span-2 relative">
          <span className="absolute left-2.5 top-0.5 text-[8.5px] text-[#6B6B70] uppercase tracking-widest font-mono">Clima</span>
          <select
            value={selectedWeatherFilter}
            onChange={(e) => setSelectedWeatherFilter(e.target.value)}
            className="w-full bg-[#0D0D0F] border border-[#2A2A2E] text-stone-300 rounded-lg pl-3 pr-2 pt-4 pb-1 text-xs focus:outline-none focus:border-[#FF3C3C]"
          >
            <option value="Todos">Todos</option>
            <option value="Dry">Seco (Dry)</option>
            <option value="Wet">Mojado (Wet)</option>
            <option value="Mixed">Mixto</option>
          </select>
        </div>

        <div className="lg:col-span-2 flex items-center justify-center bg-[#0D0D0F] border border-[#2A2A2E] rounded-lg p-2">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-mono py-1 rounded transition-colors cursor-pointer ${
              onlyFavorites
                ? "bg-red-950/40 text-[#FF3C3C] border border-[#FF3C3C]/40"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-[#FF3C3C]" : ""}`} />
            Favoritos
          </button>
        </div>
      </div>

      {/* Applet Creation Modal Dialog */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl shadow-black/60 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-850"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FF3C3C]" />
                  NUEVO REGISTRO DE REGLAJE
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setImportedRawValues(null);
                    setUploadedIniFileName(null);
                    setImportNotice(null);
                  }}
                  className="text-stone-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Regresar
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* INI Setup File Import Panel */}
                {!importedRawValues && (
                  <div className="p-3.5 bg-stone-950/40 border border-dashed border-stone-800 hover:border-[#66FCF1]/50 rounded-lg text-center transition-all">
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-[#66FCF1] mb-1 animate-pulse" />
                      <span className="text-[10.5px] font-black text-white uppercase tracking-wider">COMPLEMENTAR CON ARCHIVO .INI</span>
                      <span className="text-[10px] text-stone-400 max-w-xs mx-auto leading-tight">
                        {uploadedIniFileName 
                          ? `Archivo: ${uploadedIniFileName}` 
                          : "Selecciona el archivo de reglajes .ini para auto-detectar y rellenar automáticamente"}
                      </span>
                      <input
                        type="file"
                        accept=".ini"
                        onChange={handleIniFileImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {importNotice && (
                  <div className={`p-2.5 rounded text-[10.5px] font-mono leading-relaxed border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                    importNotice.includes("❌") 
                      ? "bg-red-950/20 text-[#FF3C3C] border-red-950/50" 
                      : importNotice.includes("⚠️")
                      ? "bg-amber-950/20 text-amber-500 border-amber-950/50"
                      : "bg-[#66FCF1]/5 text-[#66FCF1] border-[#66FCF1]/20"
                  }`}>
                    <span className="flex-1">{importNotice}</span>
                    {importedRawValues && (
                      <button
                        type="button"
                        onClick={() => {
                          setImportedRawValues(null);
                          setUploadedIniFileName(null);
                          setImportNotice(null);
                        }}
                        className="text-[9px] uppercase tracking-wider bg-stone-850 hover:bg-stone-800 border border-stone-750 px-2.5 py-1 rounded text-[#66FCF1] font-mono cursor-pointer transition-all self-end sm:self-auto shrink-0 font-bold"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>
                )}

                {getCarImage(newCar) && (
                  <div className="w-full h-24 sm:h-32 rounded border border-[#2A2A2E] overflow-hidden relative mb-2">
                    <img src={getCarImage(newCar)!} alt="Coche seleccionado" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs text-stone-400 font-mono">Nombre de este Reglaje</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Q-Run V1 - Seco, Setup Base V3"
                    className="w-full bg-stone-950 border border-stone-800 text-sm text-stone-100 rounded px-3 py-1.5 focus:outline-none focus:border-[#FF3C3C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 font-mono">Simulador / Juego</label>
                    <select
                      value={newGame}
                      onChange={(e) => setNewGame(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                    >
                      {POPULAR_GAMES.map((game) => (
                        <option key={game} value={game}>
                          {game}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 font-mono">Circuito / Pista</label>
                    <select
                      value={newTrack}
                      onChange={(e) => setNewTrack(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                    >
                      {POPULAR_TRACKS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-400 font-mono">Modelo del Coche</label>
                  <input
                    type="text"
                    required
                    value={newCar}
                    onChange={(e) => setNewCar(e.target.value)}
                    placeholder="Ej. Ferrari 499P, Porsche 911 GT3, Glickenhaus SCG"
                    className="w-full bg-stone-950 border border-stone-800 text-sm text-stone-100 rounded px-3 py-1.5 focus:outline-none focus:border-[#FF3C3C]"
                  />
                </div>

                {/* Game specific type selector (Free/Fixed for LMU, LFM/RSX for Assetto Corsa) */}
                {newGame === "Le Mans Ultimate" && (
                  <div className="space-y-1">
                    <label className="text-xs text-[#FF3C3C] font-mono block">Tipo de Setup (Le Mans Ultimate)</label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 border border-stone-850 rounded">
                      <button
                        type="button"
                        onClick={() => setSetupType("Libre")}
                        className={`py-1.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase cursor-pointer ${
                          setupType === "Libre" ? "bg-[#FF3C3C] text-black font-extrabold" : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        Libre
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupType("Fixed")}
                        className={`py-1.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase cursor-pointer ${
                          setupType === "Fixed" ? "bg-[#FF3C3C] text-black font-extrabold" : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        Fixed
                      </button>
                    </div>
                  </div>
                )}

                {newGame === "Assetto Corsa" && (
                  <div className="space-y-1">
                    <label className="text-xs text-[#66FCF1] font-mono block">Categoría / Liga (Assetto Corsa)</label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 border border-stone-850 rounded">
                      <button
                        type="button"
                        onClick={() => setSetupType("LFM")}
                        className={`py-1.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase cursor-pointer ${
                          setupType === "LFM" ? "bg-[#66FCF1] text-black font-extrabold" : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        LFM (Low Fuel)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupType("RSX")}
                        className={`py-1.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors uppercase cursor-pointer ${
                          setupType === "RSX" ? "bg-[#FF3C3C] text-black font-extrabold" : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        RSX League
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-stone-400 font-mono">Estructura de la Plantilla</label>
                  <select
                    value={newTemplateId}
                    onChange={(e) => setNewTemplateId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setImportedRawValues(null);
                      setUploadedIniFileName(null);
                      setImportNotice(null);
                    }}
                    className="px-4 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 font-mono text-xs rounded transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#FF3C3C] hover:bg-red-500 text-black font-mono font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cargar Ficha</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Setups Cards Grid */}
      <AnimatePresence mode="popLayout">
        {filteredSetups.length === 0 ? (
          <div className="p-12 text-center bg-stone-900 border border-stone-850 rounded-xl space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-stone-700 mx-auto stroke-[1.2]" />
            <div className="text-sm font-medium text-stone-300 font-mono">Sin reglajes registrados</div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Crea tu primer reglaje pulsando en el botón &quot;Nuevo Reglaje&quot;.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            id="setups-grid"
          >
            {filteredSetups.map((setup) => {
              const setupSelectedForCompare = compareSelection.includes(setup.id);

              return (
                <motion.div
                  layout
                  key={setup.id}
                  className={`tuning-card border ${
                    setupSelectedForCompare
                      ? "border-[#66FCF1] shadow-lg shadow-[#66FCF1]/5 bg-[#0E0E10]"
                      : "border-[#1F1F23] hover:border-[#FF3C3C]/40 hover:bg-[#111113]"
                  } rounded-xl overflow-hidden transition-all flex flex-col justify-between group relative`}
                  id={`setup-card-${setup.id}`}
                >
                  <div className="p-4 space-y-3 flex-1 z-10">
                    {/* Header: Favorites and status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border ${getGameBadgeTheme(setup.game)}`}>
                          {setup.game}
                        </span>
                        {setup.setupType && (
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border ${
                            setup.setupType === "LFM" 
                              ? "bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30" 
                              : "bg-[#FF3C3C]/10 text-[#FF3C3C] border border-[#FF3C3C]/30"
                          }`}>
                            {setup.setupType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={dbReadOnly}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!dbReadOnly) onToggleFavorite(setup.id);
                          }}
                          className={`p-1 rounded bg-[#0A0A0B]/80 hover:bg-[#0A0A0B] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            setup.isFavorite ? "text-[#FF3C3C]" : "text-stone-500 hover:text-[#FF3C3C]"
                          }`}
                          title={dbReadOnly ? "No disponible en modo solo lectura" : setup.isFavorite ? "Quitar de favoritos" : "Marcar favorito"}
                        >
                          <Star className={`w-3.5 h-3.5 ${setup.isFavorite ? "fill-[#FF3C3C]" : ""}`} />
                        </button>

                        {!readOnly && !dbReadOnly && (isTeamAdmin || !setup.ownerId || setup.ownerId === currentUserId || setup.ownerId === "default_user") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSetup(setup.id);
                            }}
                            className="p-1 rounded bg-[#0A0A0B]/80 hover:bg-black/40 hover:text-[#FF3C3C] text-stone-500 transition-colors cursor-pointer"
                            title="Eliminar este reglaje"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle: Title, Car and Track */}
                    <div className="cursor-pointer space-y-1.5 pt-1" onClick={() => onSelectSetup(setup.id)}>
                      <h4 className="text-white font-bold group-hover:text-[#66FCF1] transition-colors text-sm line-clamp-1 leading-snug font-mono uppercase">
                        {setup.title}
                      </h4>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <p className="text-xs text-[#88888C] font-mono">{setup.car}</p>
                        {setup.creatorName && (
                          <span className="text-[9.5px] text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/10 font-mono tracking-wide" title={`Creado por: ${setup.creatorName}`}>
                            👤 {setup.creatorName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta widgets: Track, laptime, weather, details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F23] text-[10.5px] font-mono">
                      <div className="space-y-0.5">
                        <span className="text-stone-500 block text-[9.5px] uppercase">CIRCUITO</span>
                        <span className="text-stone-300 font-medium truncate block max-w-full">{setup.track}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-stone-500 block text-[9.5px] uppercase">RECORD V.</span>
                        <span className="text-[#66FCF1] font-bold font-mono flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          {setup.lapTime ? setup.lapTime : "--:--.---"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer ribbon actions */}
                  <div className="px-4 py-2.5 bg-black/40 border-t border-[#1F1F23]/60 flex items-center justify-between text-stone-400 z-10">
                    <div className="flex items-center gap-2">
                      {setup.weather === "Dry" && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-mono">
                          <Sun className="w-3 h-3" /> Seco
                        </span>
                      )}
                      {setup.weather === "Wet" && (
                        <span className="flex items-center gap-1 text-[10px] text-[#66FCF1] font-mono">
                          <CloudRain className="w-3 h-3" /> Mojado
                        </span>
                      )}
                      {setup.weather === "Mixed" && (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
                          <CloudDrizzle className="w-3 h-3" /> Mixto
                        </span>
                      )}
                      {!setup.weather && (
                        <span className="text-[10px] text-stone-500 font-mono">Clima standard</span>
                      )}
                    </div>

                    {isCompareMode ? (
                      <button
                        onClick={() => toggleCompareSelect(setup.id)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors flex items-center gap-1 uppercase font-bold cursor-pointer ${
                          setupSelectedForCompare
                            ? "bg-[#66FCF1]/20 text-[#66FCF1] border border-[#66FCF1]"
                            : "bg-[#1A1A1D] text-stone-300 hover:bg-stone-800 border border-[#2A2A2E]"
                        }`}
                      >
                        {setupSelectedForCompare ? (
                          <>
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> SELECCIONADO
                          </>
                        ) : (
                          "COMPARAR"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectSetup(setup.id)}
                        className="text-[10px] font-mono font-bold text-[#66FCF1] hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wide py-0.5 cursor-pointer"
                      >
                        <span>CONFIGURAR</span>
                        <Sliders className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom templates list panel */}
      {isTeamAdmin && (
        <div className="mt-8 p-5 bg-stone-900 border border-stone-850 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono">Plantillas base del Sistema</h3>
              <p className="text-[11px] text-stone-400">Esquemas de reglaje oficiales listos para albergar tus ajustes mecánicos:</p>
            </div>
            {isTeamAdmin && (
              <button
                onClick={() => setIsCreatingTemplate(true)}
                className="px-3 py-1.5 bg-[#66FCF1]/10 border border-[#66FCF1]/30 hover:bg-[#66FCF1]/20 text-[#66FCF1] font-mono text-[11px] rounded transition-all cursor-pointer flex items-center gap-1 uppercase font-bold self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Nueva Plantilla
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-3.5 bg-stone-950/60 border border-stone-850 rounded-lg flex flex-col justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold font-mono">{tpl.title}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-normal">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-stone-400 font-mono mt-1 pt-1.5 border-t border-stone-900">
                  <span>{(tpl.sections || []).length} secciones ({(tpl.sections || []).flatMap(s => s.fields || []).length} campos)</span>
                  {isTeamAdmin && (
                    <div className="flex items-center gap-1.5">
                      {deletingTemplateId === tpl.id ? (
                        <div className="flex items-center gap-1.5 bg-red-950/25 border border-red-900/40 px-2 py-0.5 rounded font-bold font-mono">
                          <span className="text-[10px] text-red-400">¿Borrar?</span>
                          <button
                            onClick={() => {
                              onDeleteTemplate?.(tpl.id);
                              setDeletingTemplateId(null);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-bold cursor-pointer transition-colors"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setDeletingTemplateId(null)}
                            className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[9px] font-bold cursor-pointer transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingTemplate({ ...tpl });
                              setActiveEditSectionId(tpl.sections?.[0]?.id || "");
                            }}
                            className="p-1 bg-stone-800 hover:bg-cyan-950/40 hover:text-[#66FCF1] text-stone-500 rounded border border-stone-850 transition-colors cursor-pointer"
                            title="Editar Estructura"
                          >
                            <Sliders className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingTemplateId(tpl.id)}
                            className="p-1 hover:bg-red-950/45 hover:text-red-400 text-stone-500 rounded border border-stone-850 transition-colors cursor-pointer"
                            title="Eliminar Plantilla"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Creation Modal Dialog */}
      <AnimatePresence>
        {isCreatingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-xl p-6 w-full max-w-md space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#66FCF1]" /> Crear Nueva Plantilla Base
                </h3>
                <button
                  onClick={() => setIsCreatingTemplate(false)}
                  className="text-stone-400 hover:text-white font-mono text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTplTitle.trim()) return;
                  onCreateTemplate?.(newTplTitle.trim(), newTplDesc.trim());
                  setIsCreatingTemplate(false);
                  setNewTplTitle("");
                  setNewTplDesc("");
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs text-stone-400 font-mono">Nombre de la Plantilla</label>
                  <input
                    type="text"
                    value={newTplTitle}
                    onChange={(e) => setNewTplTitle(e.target.value)}
                    placeholder="Ej. Assetto Corsa (LMP3)"
                    className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                    required
                  />
                </div>

                <div className="space-y-1 prefix">
                  <label className="text-xs text-stone-400 font-mono">Descripción / Finalidad</label>
                  <textarea
                    value={newTplDesc}
                    onChange={(e) => setNewTplDesc(e.target.value)}
                    placeholder="Describe para qué categorías o simuladores está pensada esta estructura de reglaje..."
                    className="w-full h-20 bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1] resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTemplate(false)}
                    className="flex-1 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded font-mono text-xs uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-[#121619] border border-[#66FCF1]/40 text-[#66FCF1] font-mono text-xs uppercase hover:bg-[#66FCF1]/10 rounded cursor-pointer"
                  >
                    Crear Plantilla
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Editing Modal Dialog */}
      <AnimatePresence>
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-xl p-6 w-full max-w-3xl space-y-5 text-left my-8"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#66FCF1]" /> Editor Estructura Plantilla
                  </h3>
                  <p className="text-[9px] text-stone-500 font-mono italic">ID: {editingTemplate.id}</p>
                </div>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="text-stone-400 hover:text-white font-mono text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* General Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Nombre de la Plantilla</label>
                  <input
                    type="text"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Descripción / Finalidad</label>
                  <input
                    type="text"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>
              </div>

              {/* Section Tabs inside modal */}
              <div className="space-y-4">
                {isAddingSection ? (
                  <div className="flex items-center gap-2 bg-stone-950 p-2.5 rounded-lg border border-stone-850 w-full">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva sección..."
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className="flex-1 bg-stone-900 border border-stone-800 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1] font-mono"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (newSectionName.trim()) {
                            const newSec = {
                              id: `sec-${Date.now()}`,
                              name: newSectionName.trim(),
                              fields: []
                            };
                            const updatedSecs = [...(editingTemplate.sections || []), newSec];
                            setEditingTemplate({
                              ...editingTemplate,
                              sections: updatedSecs
                            });
                            setActiveEditSectionId(newSec.id);
                            setNewSectionName("");
                            setIsAddingSection(false);
                          }
                        } else if (e.key === "Escape") {
                          setIsAddingSection(false);
                          setNewSectionName("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSectionName.trim()) {
                          const newSec = {
                            id: `sec-${Date.now()}`,
                            name: newSectionName.trim(),
                            fields: []
                          };
                          const updatedSecs = [...(editingTemplate.sections || []), newSec];
                          setEditingTemplate({
                            ...editingTemplate,
                            sections: updatedSecs
                          });
                          setActiveEditSectionId(newSec.id);
                          setNewSectionName("");
                          setIsAddingSection(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#66FCF1]/10 text-[#66FCF1] hover:bg-[#66FCF1]/20 border border-[#66FCF1]/30 font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-colors"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionName("");
                      }}
                      className="px-3 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-400 font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#66FCF1] font-mono uppercase font-bold tracking-widest">
                      Secciones Estructurales ({(editingTemplate.sections || []).length})
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSection(true);
                        setNewSectionName("");
                      }}
                      className="px-2.5 py-1 bg-stone-850 hover:bg-stone-800 text-stone-300 font-mono text-[10px] uppercase font-bold rounded border border-[#2A2A2E] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Añadir Sección
                    </button>
                  </div>
                )}

                {/* Tab layout selector */}
                <div className="bg-stone-950 p-1.5 rounded-lg border border-stone-850 flex items-center flex-wrap gap-1">
                  {(editingTemplate.sections || []).map((sec) => (
                    <div key={sec.id} className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded">
                      <button
                        onClick={() => setActiveEditSectionId(sec.id)}
                        className={`text-[10.5px] rounded font-mono transition-all font-semibold uppercase ${
                          activeEditSectionId === sec.id
                            ? "text-[#66FCF1]"
                            : "text-stone-500 hover:text-stone-300"
                        }`}
                      >
                        {sec.name}
                      </button>
                      {deletingSectionId === sec.id ? (
                        <div className="flex items-center gap-1 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded">
                          <span className="text-[9px] text-red-500 font-bold font-mono">¿Eliminar?</span>
                          <button
                            onClick={() => {
                              const updatedSecs = (editingTemplate.sections || []).filter(s => s.id !== sec.id);
                              setEditingTemplate({ ...editingTemplate, sections: updatedSecs });
                              if (activeEditSectionId === sec.id) {
                                setActiveEditSectionId(updatedSecs[0]?.id || "");
                              }
                              setDeletingSectionId(null);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white rounded px-1 py-0.5 text-[8.5px] font-bold transition-colors cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setDeletingSectionId(null)}
                            className="bg-stone-850 hover:bg-stone-800 text-stone-300 rounded px-1 py-0.5 text-[8.5px] transition-colors cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingSectionId(sec.id)}
                          className="text-stone-600 hover:text-red-400 p-0.5 transition-all text-[11px] cursor-pointer"
                          title="Borrar sección entera"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Active Section fields editor */}
                {(() => {
                  const activeSection = (editingTemplate.sections || []).find(s => s.id === activeEditSectionId) || (editingTemplate.sections || [])[0];
                  if (!activeSection) {
                    return <div className="text-center p-8 bg-stone-950 border border-stone-850 rounded text-stone-600 font-mono text-xs">Añade una sección para empezar a definir variables de reglaje</div>;
                  }

                  return (
                    <div className="p-4 bg-stone-950/40 border border-stone-850 rounded-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-900 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400 font-mono">Nombre Sección:</span>
                          <input
                            type="text"
                            value={activeSection.name}
                            onChange={(e) => {
                              const updated = (editingTemplate.sections || []).map(s => s.id === activeSection.id ? { ...s, name: e.target.value } : s);
                              setEditingTemplate({ ...editingTemplate, sections: updated });
                            }}
                            className="bg-stone-950 border border-stone-850 text-xs text-white rounded px-2 py-0.5 font-mono focus:outline-none focus:border-[#66FCF1]"
                          />
                        </div>

                        <button
                          onClick={() => setIsAddingField(activeSection.id)}
                          className="px-2.5 py-1 bg-cyan-950/40 border border-[#66FCF1]/30 hover:bg-cyan-950/60 text-[#66FCF1] font-mono text-[10px] uppercase font-bold rounded flex items-center gap-1 cursor-pointer self-start sm:self-center"
                        >
                          <Plus className="w-3 h-3" /> Añadir Variable
                        </button>
                      </div>

                      {/* Fields display */}
                      <div className="space-y-1">
                        {(activeSection.fields || []).length === 0 ? (
                          <p className="text-[11px] text-stone-600 font-mono italic p-4 text-center">No hay campos de reglaje en esta sección. Añade tu primera variable mecánica.</p>
                        ) : (
                          <div className="divide-y divide-stone-900">
                            {(activeSection.fields || []).map((field) => (
                              <div key={field.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                                <div>
                                  <div className="font-mono font-bold text-white flex items-center gap-2">
                                    <span>{field.name}</span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-stone-850 border border-stone-800 text-stone-400 font-normal rounded font-sans">
                                      {field.type} {field.unit ? `(${field.unit})` : ""}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                                    Predefinido: <span className="text-stone-300">{field.defaultValue}</span> 
                                    {field.type === "number" && ` | Rango: [${field.min} a ${field.max}] | Increm: ${field.step}`}
                                    {field.type === "select" && ` | Opciones: [${(field.options || []).join(", ")}]`}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updatedFields = (activeSection.fields || []).filter(f => f.id !== field.id);
                                    const updatedSections = (editingTemplate.sections || []).map(s => s.id === activeSection.id ? { ...s, fields: updatedFields } : s);
                                    setEditingTemplate({ ...editingTemplate, sections: updatedSections });
                                  }}
                                  className="p-1 hover:bg-red-950/50 hover:text-red-400 text-stone-600 rounded transition-colors cursor-pointer"
                                  title="Borrar Casilla"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Field Sub-Form */}
                      {isAddingField === activeSection.id && (
                        <div className="mt-4 p-4 bg-stone-950 border border-stone-850 rounded-lg space-y-4">
                          <h4 className="text-[10.5px] font-bold text-[#66FCF1] uppercase font-mono tracking-wider">Añadir nueva variable de reglaje</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 font-mono block">Nombre de Ajuste</label>
                              <input
                                type="text"
                                placeholder="Ej. Presión Trasera"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 font-mono block">Tipo de Ajuste</label>
                              <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value)}
                                className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                              >
                                <option value="number">Número (Métrico)</option>
                                <option value="select">Lista de Opciones</option>
                                <option value="text">Texto Libre</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 font-mono block">Valor Por Defecto</label>
                              <input
                                type="text"
                                placeholder="Ej. 26.5 o Medio"
                                value={newFieldDefaultVal}
                                onChange={(e) => setNewFieldDefaultVal(e.target.value)}
                                className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                              />
                            </div>
                          </div>

                          {newFieldType === "number" && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                              <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 font-mono block">Límite Mínimo</label>
                                <input
                                  type="number"
                                  value={newFieldMin}
                                  onChange={(e) => setNewFieldMin(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 font-mono block">Límite Máximo</label>
                                <input
                                  type="number"
                                  value={newFieldMax}
                                  onChange={(e) => setNewFieldMax(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 font-mono block">Paso / Intervalo</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={newFieldStep}
                                  onChange={(e) => setNewFieldStep(parseFloat(e.target.value) || 1)}
                                  className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 font-mono block">Unidad de Medida</label>
                                <input
                                  type="text"
                                  placeholder="Ej. psi, mm, °"
                                  value={newFieldUnit}
                                  onChange={(e) => setNewFieldUnit(e.target.value)}
                                  className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {newFieldType === "select" && (
                            <div className="space-y-1 pt-1 col-span-full">
                              <label className="text-[10px] text-stone-400 font-mono block">Opciones de la lista (Separadas por comas)</label>
                              <input
                                type="text"
                                placeholder="Ej. Blando, Medio, Duro, Lluvia"
                                value={newFieldOptions}
                                onChange={(e) => setNewFieldOptions(e.target.value)}
                                className="w-full bg-[#0D0D0F] border border-stone-850 text-xs text-stone-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                              />
                            </div>
                          )}

                          <div className="flex gap-2 justify-end pt-3 border-t border-[#1F1F23]">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingField(null);
                                setNewFieldName("");
                                setNewFieldOptions("");
                                setNewFieldDefaultVal("");
                              }}
                              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-stone-400 rounded font-mono text-[10.5px] uppercase cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!newFieldName.trim()) return;
                                const oList = newFieldOptions
                                  ? newFieldOptions.split(",").map(o => o.trim())
                                  : undefined;
                                const addedField = {
                                  id: `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                  name: newFieldName.trim(),
                                  type: newFieldType,
                                  min: newFieldType === "number" ? newFieldMin : undefined,
                                  max: newFieldType === "number" ? newFieldMax : undefined,
                                  step: newFieldType === "number" ? newFieldStep : undefined,
                                  unit: newFieldType === "number" ? newFieldUnit.trim() : undefined,
                                  defaultValue: newFieldDefaultVal.trim(),
                                  options: oList
                                };

                                const updatedFields = [...(activeSection.fields || []), addedField];
                                const updatedSections = (editingTemplate.sections || []).map(s => s.id === activeSection.id ? { ...s, fields: updatedFields } : s);
                                setEditingTemplate({ ...editingTemplate, sections: updatedSections });

                                // Reset forms
                                setIsAddingField(null);
                                setNewFieldName("");
                                setNewFieldOptions("");
                                setNewFieldDefaultVal("");
                                setNewFieldUnit("");
                              }}
                              className="px-3.5 py-1.5 bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 hover:bg-[#66FCF1]/20 rounded font-mono text-[10.5px] uppercase font-bold cursor-pointer"
                            >
                              Añadir Campo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Save changes */}
              <div className="flex items-center gap-3 pt-6 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded font-mono text-xs uppercase cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTemplate?.(editingTemplate);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 py-1.5 bg-[#121619] border border-[#66FCF1]/40 text-[#66FCF1] hover:bg-[#66FCF1]/15 rounded font-mono text-xs uppercase font-bold cursor-pointer text-center"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
