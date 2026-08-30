import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, GalleryFolder, GalleryImage } from "../types";
import {
  checkR2Status,
  uploadImageToR2,
  deleteImageFromR2,
  R2StatusResponse,
} from "../services/galleryR2Service";
import {
  Image as ImageIcon,
  Folder,
  FolderPlus,
  Upload,
  ClipboardPaste,
  Trash2,
  Eye,
  Plus,
  Filter,
  Search,
  Users,
  User,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Download,
  Tag,
  Maximize2,
  Info,
  Calendar,
  Layers,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  Images,
} from "lucide-react";

interface UploadFileItem {
  id: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  title: string;
  size: number;
}

interface GaleriaViewProps {
  currentUser: UserProfile;
  isTeamAdmin?: boolean;
}

export const GaleriaView: React.FC<GaleriaViewProps> = ({
  currentUser,
  isTeamAdmin = false,
}) => {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [r2Status, setR2Status] = useState<R2StatusResponse>({
    configured: false,
    bucketName: null,
    publicDomain: null,
  });

  // Filtros y Navegación
  const [selectedFolderId, setSelectedFolderId] = useState<string | "all" | "root">("all");
  const [selectedPilotFilter, setSelectedPilotFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);

  // Modales
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Estados del Formulario de Carpeta
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("cyan");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Estados del Formulario de Subida
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState<string>("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadItems, setUploadItems] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressStatus, setUploadProgressStatus] = useState("Subiendo a Cloudflare R2...");
  const [uploadProgressCount, setUploadProgressCount] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [hasCopiedCors, setHasCopiedCors] = useState(false);

  const corsRuleJson = `[
  {
    "AllowedOrigins": [
      "https://apexlatamracing.it.com",
      "https://tiomoncat.github.io",
      "http://localhost:3000",
      "http://localhost:5173",
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]`;

  const copyCorsRule = () => {
    navigator.clipboard.writeText(corsRuleJson);
    setHasCopiedCors(true);
    setTimeout(() => setHasCopiedCors(false), 3000);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  // Función para descargar en calidad original / tamaño completo sin comprimir
  const handleDownloadOriginal = async (image: GalleryImage) => {
    try {
      setIsDownloading(true);
      // Fetch del blob original desde Cloudflare R2
      const response = await fetch(image.url, { mode: "cors" });
      if (!response.ok) throw new Error("No se pudo obtener el archivo original");
      const blob = await response.blob();
      
      // Crear objeto URL y forzar descarga del archivo sin alteraciones
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      // Determinar extensión adecuada
      let extension = "png";
      if (blob.type.includes("jpeg") || blob.type.includes("jpg")) extension = "jpg";
      else if (blob.type.includes("webp")) extension = "webp";
      else if (image.url.includes(".")) {
        const urlExt = image.url.split(".").pop()?.split("?")[0];
        if (urlExt) extension = urlExt;
      }
      
      const cleanName = (image.title || "alr_foto_original")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${cleanName}_fullres.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Fallo descarga directa por blob, usando enlace directo:", err);
      // Fallback: abrir o descargar directamente vía link
      const fallbackLink = document.createElement("a");
      fallbackLink.href = image.url;
      fallbackLink.target = "_blank";
      fallbackLink.rel = "noreferrer";
      fallbackLink.download = `${(image.title || "alr_foto").replace(/[^a-zA-Z0-9_-]/g, "_")}_fullres.png`;
      fallbackLink.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar Estado de Cloudflare R2
  useEffect(() => {
    checkR2Status().then(setR2Status);
  }, []);

  // 2. Suscribirse a las Carpetas en Firestore
  useEffect(() => {
    const foldersRef = collection(db, "gallery_folders");
    const unsubscribe = onSnapshot(
      foldersRef,
      (snapshot) => {
        const loadedFolders: GalleryFolder[] = [];
        snapshot.forEach((docSnap) => {
          loadedFolders.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<GalleryFolder, "id">),
          });
        });
        // Ordenar por fecha de creación desc
        loadedFolders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setFolders(loadedFolders);
      },
      (err) => {
        console.error("Error cargando carpetas:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Suscribirse a las Imágenes en Firestore
  useEffect(() => {
    const imagesRef = collection(db, "gallery_images");
    const unsubscribe = onSnapshot(
      imagesRef,
      (snapshot) => {
        const loadedImages: GalleryImage[] = [];
        snapshot.forEach((docSnap) => {
          loadedImages.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<GalleryImage, "id">),
          });
        });
        loadedImages.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setImages(loadedImages);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando imágenes:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Escuchar Pegar (Ctrl + V) global dentro del modal de subida o en la vista si está abierto
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        const imageBlobs: { file: Blob; name: string }[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              imageBlobs.push({
                file: blob,
                name: `captura_portapapeles_${Date.now()}_${i + 1}.png`,
              });
            }
          }
        }
        if (imageBlobs.length > 0) {
          e.preventDefault();
          processImageFiles(imageBlobs.map((b) => b.file));
          setIsUploadModalOpen(true);
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [uploadItems]);

  const processImageFiles = async (files: (File | Blob)[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      setUploadError("Por favor selecciona o pega formatos de imagen válidos (PNG, JPG, WEBP).");
      return;
    }
    setUploadError(null);

    const newItems: UploadFileItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const fileName = (file as File).name || `captura_${Date.now()}_${i + 1}.png`;
      const cleanTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_ -]+/g, " ");

      newItems.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        dataUrl,
        fileName,
        mimeType: file.type || "image/png",
        title: cleanTitle,
        size: file.size || dataUrl.length,
      });
    }

    setUploadItems((prev) => {
      const combined = [...prev, ...newItems];
      if (!uploadTitle && combined.length === 1) {
        setUploadTitle(combined[0].title);
      }
      return combined;
    });
  };

  const handleRemoveUploadItem = (id: string) => {
    setUploadItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setUploadItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  // Crear Carpeta
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      await addDoc(collection(db, "gallery_folders"), {
        name: newFolderName.trim(),
        color: newFolderColor,
        pilotUid: currentUser.uid,
        pilotName: currentUser.displayName || currentUser.email || "Piloto ALR",
        createdAt: new Date().toISOString(),
      });
      setNewFolderName("");
      setIsNewFolderModalOpen(false);
    } catch (err: any) {
      console.error("Error creando carpeta:", err);
      alert("Error al crear carpeta: " + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Eliminar Carpeta
  const handleDeleteFolder = async (folderId: string, folderPilotUid: string) => {
    if (!isTeamAdmin && folderPilotUid !== currentUser.uid) {
      alert("Solo el creador o un administrador puede eliminar esta carpeta.");
      return;
    }
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar esta carpeta? Las imágenes asociadas se moverán a la raíz."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "gallery_folders", folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId("all");
      }
    } catch (err: any) {
      console.error("Error eliminando carpeta:", err);
      alert("Error al eliminar carpeta: " + err.message);
    }
  };

  // Subir Imágenes a Cloudflare R2 y Guardar en Firestore (Lote o Individual)
  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadItems.length === 0) {
      setUploadError("Por favor carga o pega al menos una imagen primero.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressCount({ current: 0, total: uploadItems.length });

    try {
      const selectedFolder = folders.find((f) => f.id === uploadFolderId);
      const folderName = selectedFolder ? selectedFolder.name : "general";
      const tagsArray = uploadTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const total = uploadItems.length;

      for (let i = 0; i < total; i++) {
        const item = uploadItems[i];
        const itemTitle = total === 1 ? uploadTitle.trim() || item.title : item.title || `Foto ${i + 1}`;
        setUploadProgressCount({ current: i + 1, total });
        setUploadProgressStatus(`Subiendo imagen ${i + 1} de ${total}: "${itemTitle}"...`);

        // 1. Subida a Cloudflare R2 vía S3 nativo
        const r2Result = await uploadImageToR2(
          {
            imageData: item.dataUrl,
            fileName: item.fileName,
            pilotUid: currentUser.uid,
            pilotName: currentUser.displayName || currentUser.email || "Piloto",
            pilotPhoto: currentUser.photoURL,
            folderId: uploadFolderId || undefined,
            folderName: folderName,
            title: itemTitle,
            description: uploadDescription.trim(),
            mimeType: item.mimeType,
          },
          (step) => setUploadProgressStatus(`[${i + 1}/${total}] ${step}`)
        );

        // 2. Guardar Registro en Firestore
        await addDoc(collection(db, "gallery_images"), {
          title: itemTitle,
          description: uploadDescription.trim(),
          url: r2Result.url,
          r2Key: r2Result.r2Key,
          folderId: uploadFolderId || "",
          folderName: selectedFolder ? selectedFolder.name : "Raíz / General",
          pilotUid: currentUser.uid,
          pilotName: currentUser.displayName || currentUser.email || "Piloto ALR",
          pilotPhoto: currentUser.photoURL || "",
          fileSize: r2Result.fileSize,
          mimeType: r2Result.mimeType,
          tags: tagsArray,
          createdAt: new Date().toISOString(),
        });
      }

      setUploadSuccess(
        total > 1
          ? `¡${total} imágenes subidas y respaldadas en Cloudflare R2 con éxito!`
          : "¡Imagen subida y respaldada en Cloudflare R2 con éxito!"
      );

      setTimeout(() => {
        setUploadSuccess(null);
        setIsUploadModalOpen(false);
        // Reset form
        setUploadItems([]);
        setUploadTitle("");
        setUploadDescription("");
        setUploadTags("");
        setUploadProgressCount(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error al subir lote de imágenes:", err);
      setUploadError(err.message || "Error al subir las imágenes.");
    } finally {
      setIsUploading(false);
      setUploadProgressCount(null);
    }
  };

  // Eliminar Imagen
  const handleDeleteImage = async (img: GalleryImage) => {
    if (!isTeamAdmin && img.pilotUid !== currentUser.uid) {
      alert("Solo el autor de la foto o un administrador pueden eliminarla.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar esta imagen de la galería y de Cloudflare R2?")) {
      return;
    }

    try {
      // 1. Eliminar de Firestore
      await deleteDoc(doc(db, "gallery_images", img.id));

      // 2. Eliminar del Bucket R2
      if (img.r2Key) {
        await deleteImageFromR2(img.r2Key).catch((e) =>
          console.warn("No se pudo eliminar de R2 o ya no existía:", e)
        );
      }

      if (previewImage?.id === img.id) {
        setPreviewImage(null);
      }
    } catch (err: any) {
      console.error("Error eliminando imagen:", err);
      alert("Error al eliminar imagen: " + err.message);
    }
  };

  // Lista única de pilotos que tienen imágenes o carpetas
  const pilotsList = Array.from(
    new Set([
      ...images.map((img) => JSON.stringify({ uid: img.pilotUid, name: img.pilotName })),
      ...folders.map((f) => JSON.stringify({ uid: f.pilotUid, name: f.pilotName })),
    ])
  ).map((str) => JSON.parse(str));

  // Filtrado de Imágenes
  const filteredImages = images.filter((img) => {
    // Filtro por Carpeta
    if (selectedFolderId === "root") {
      if (img.folderId && img.folderId !== "") return false;
    } else if (selectedFolderId !== "all") {
      if (img.folderId !== selectedFolderId) return false;
    }

    // Filtro por Piloto
    if (selectedPilotFilter !== "all" && img.pilotUid !== selectedPilotFilter) {
      return false;
    }

    // Filtro por Búsqueda de texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = img.title?.toLowerCase().includes(q);
      const matchDesc = img.description?.toLowerCase().includes(q);
      const matchPilot = img.pilotName?.toLowerCase().includes(q);
      const matchFolder = img.folderName?.toLowerCase().includes(q);
      const matchTag = img.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchPilot && !matchFolder && !matchTag) {
        return false;
      }
    }

    return true;
  });

  // Carpetas visibles según piloto seleccionado
  const visibleFolders = folders.filter((f) => {
    if (selectedPilotFilter !== "all" && f.pilotUid !== selectedPilotFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER DE LA GALERÍA CON CLOUDFLARE R2 STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-850 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Galería & Telemetrías Paddock
                </h2>
                <span className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-cyan-400" />
                  Cloudflare R2
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono mt-0.5">
                Almacenamiento en la nube organizado por carpetas y pilotos de la escudería
              </p>
            </div>
          </div>
        </div>

        {/* ACCIONES SUPERIORES */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="flex items-center gap-2 bg-[#18181b] hover:bg-[#27272a] border border-stone-700 hover:border-cyan-500/50 text-stone-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>Nueva Carpeta</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-black font-black px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Subir / Pegar Foto</span>
          </button>
        </div>
      </div>

      {/* AVISO DE CONFIGURACIÓN CLOUDFLARE R2 SI FALTA EN EL ENTORNO */}
      {!r2Status.configured && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs font-mono text-amber-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Conexión con Cloudflare R2 pendiente de credenciales</p>
              <p className="text-[11px] text-amber-400/80 mt-1 leading-relaxed">
                Para guardar los archivos en tu bucket de Cloudflare R2, agrega las credenciales en el archivo <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">.env</code> del servidor:
                <span className="block mt-1 text-[10px] text-stone-300 font-mono">
                  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS & BÚSQUEDA */}
      <div className="bg-[#111113] border border-stone-850 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, notas, etiquetas o piloto..."
              className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-stone-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Piloto */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] font-mono text-stone-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Piloto:
            </span>
            <select
              value={selectedPilotFilter}
              onChange={(e) => setSelectedPilotFilter(e.target.value)}
              className="bg-[#18181b] border border-stone-800 focus:border-cyan-500/60 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 outline-none cursor-pointer"
            >
              <option value="all">Todos los Pilotos</option>
              {pilotsList.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.name} {p.uid === currentUser.uid ? "(Tú)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SELECTOR DE CARPETAS / TABS HORIZONTALES */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-stone-850/60">
          <button
            onClick={() => setSelectedFolderId("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedFolderId === "all"
                ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "bg-[#18181b] text-stone-400 hover:text-white border border-stone-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas ({images.length})</span>
          </button>

          <button
            onClick={() => setSelectedFolderId("root")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedFolderId === "root"
                ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "bg-[#18181b] text-stone-400 hover:text-white border border-stone-800"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>General / Raíz ({images.filter((i) => !i.folderId).length})</span>
          </button>

          {visibleFolders.map((folder) => {
            const count = images.filter((img) => img.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;
            return (
              <div key={folder.id} className="flex items-center group flex-shrink-0">
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-[#18181b] text-stone-300 hover:text-white border border-stone-800"
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{folder.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-black/30 text-black font-black" : "bg-black/60 text-stone-400"}`}>
                    {count}
                  </span>
                </button>

                {(isTeamAdmin || folder.pilotUid === currentUser.uid) && (
                  <button
                    onClick={() => handleDeleteFolder(folder.id, folder.pilotUid)}
                    title="Eliminar carpeta"
                    className={`px-1.5 py-1.5 rounded-r-lg border border-l-0 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-cyan-600 border-cyan-500 text-black hover:bg-red-600 hover:text-white"
                        : "bg-[#18181b] border-stone-800 text-stone-500 hover:text-red-400 hover:bg-[#27272a]"
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* GRID DE IMÁGENES */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 bg-[#111113] border border-stone-850 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            Sincronizando Galería con Cloudflare R2...
          </p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4 bg-[#111113] border border-stone-850 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              No hay fotos en esta vista
            </h3>
            <p className="text-xs text-stone-400 font-mono leading-relaxed">
              Sube capturas de telemetría, fotos de carreras o skins usando el botón superior o pegando directamente con <span className="text-cyan-400 font-bold">Ctrl + V</span>.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Primera Foto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="bg-[#111113] border border-stone-850 hover:border-cyan-500/40 rounded-2xl overflow-hidden group transition-all flex flex-col shadow-md hover:shadow-cyan-500/5"
            >
              {/* Contenedor de Imagen con Overlay de Acciones */}
              <div className="relative aspect-video bg-black/80 overflow-hidden cursor-pointer">
                <img
                  src={img.url}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onClick={() => setPreviewImage(img)}
                />

                {/* Badge de Carpeta */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-black/80 backdrop-blur-md border border-stone-700 text-cyan-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Folder className="w-2.5 h-2.5 text-cyan-400" />
                    {img.folderName || "General"}
                  </span>
                </div>

                {/* Botón Ver Pantalla Completa */}
                <div 
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  onClick={() => setPreviewImage(img)}
                >
                  <span className="bg-cyan-500/90 text-black font-mono text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Eye className="w-3 h-3" /> Ver Detalle
                  </span>
                </div>
              </div>

              {/* Información y Metadatos */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono truncate" title={img.title}>
                    {img.title}
                  </h4>
                  {img.description && (
                    <p className="text-[11px] text-stone-400 font-mono line-clamp-2 mt-1">
                      {img.description}
                    </p>
                  )}
                </div>

                {/* Tags si existen */}
                {img.tags && img.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {img.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-[#18181b] border border-stone-800 text-stone-400 text-[9px] font-mono px-1.5 py-0.2 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer de Tarjeta: Piloto & Acciones */}
                <div className="pt-2 border-t border-stone-850/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                  <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                    <div className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-[8px]">
                      {img.pilotName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-stone-300 truncate" title={img.pilotName}>
                      {img.pilotName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownloadOriginal(img)}
                      title="Descargar imagen original (Full Res)"
                      className="p-1 rounded bg-[#18181b] hover:bg-cyan-950/60 text-stone-400 hover:text-cyan-400 border border-stone-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {(isTeamAdmin || img.pilotUid === currentUser.uid) && (
                      <button
                        onClick={() => handleDeleteImage(img)}
                        title="Eliminar de Cloudflare R2 y Galería"
                        className="p-1 rounded bg-[#18181b] hover:bg-red-950/60 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: CREAR CARPETA */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#111113] border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                Nueva Carpeta en Galería
              </h3>
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-stone-400 mb-1 uppercase text-[10px] font-bold">
                  Nombre de la Carpeta *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej: Liveries GT3, Setups Monza, Podios..."
                  className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-stone-400 hover:text-white border border-stone-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingFolder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>Crear Carpeta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIR / PEGAR FOTO EN CLOUDFLARE R2 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111113] border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  Subir Imagen a Cloudflare R2
                </h3>
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                  Se guardará en la carpeta seleccionada en tu espacio de piloto
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs font-mono space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-red-300">
                      {uploadError.includes("CORS") ? "Falta habilitar CORS en Cloudflare R2" : "Error al subir imagen"}
                    </p>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {uploadError.includes("CORS")
                        ? "Tu bucket 'alr' de Cloudflare R2 bloquea las subidas directas desde el navegador porque no tiene activada una Política CORS. Habilítala en 3 clics:"
                        : uploadError}
                    </p>
                  </div>
                </div>

                {uploadError.includes("CORS") && (
                  <div className="bg-black/70 border border-red-500/30 rounded-lg p-3 space-y-2 text-[11px]">
                    <ol className="list-decimal list-inside space-y-1 text-stone-300">
                      <li>Ve a tu consola de Cloudflare &gt; <strong>R2</strong> &gt; Bucket <strong>alr</strong>.</li>
                      <li>Entra a la pestaña <strong>Settings (Configuración)</strong> y baja hasta <strong>CORS Policy</strong>.</li>
                      <li>Haz clic en <strong>Add CORS Policy</strong> (o Edit) y pega la siguiente regla:</li>
                    </ol>

                    <div className="flex items-center justify-between bg-stone-900 px-2.5 py-1.5 rounded border border-stone-800">
                      <span className="text-[10px] text-stone-400 font-mono">Regla CORS JSON para R2</span>
                      <button
                        type="button"
                        onClick={copyCorsRule}
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 transition-colors"
                      >
                        {hasCopiedCors ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{hasCopiedCors ? "¡Copiado al portapapeles!" : "Copiar Regla CORS"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleUploadImage} className="space-y-4 font-mono text-xs">
              {/* ZONA DE CARGA / PEGAR IMÁGENES */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-stone-400 uppercase text-[10px] font-bold">
                    Imágenes * {uploadItems.length > 0 && `(${uploadItems.length} seleccionada${uploadItems.length > 1 ? "s" : ""})`}
                  </label>
                  {uploadItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar más fotos</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processImageFiles(Array.from(e.target.files));
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />

                {uploadItems.length > 0 ? (
                  <div className="space-y-2">
                    {/* Lista / Carrusel de Imágenes seleccionadas */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-2 bg-black/60 rounded-xl border border-stone-800 custom-scrollbar">
                      {uploadItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative rounded-lg border border-stone-700 bg-stone-900 overflow-hidden group flex flex-col"
                        >
                          <div className="relative aspect-video bg-black/80 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.dataUrl}
                              alt={item.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-cyan-400 border border-stone-800">
                              #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadItem(item.id)}
                              className="absolute top-1 right-1 bg-red-950/90 hover:bg-red-900 text-red-300 p-1 rounded-md border border-red-800 transition-colors opacity-90 group-hover:opacity-100"
                              title="Quitar esta foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="p-1.5 bg-stone-950 space-y-1">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                              placeholder={`Título foto ${index + 1}`}
                              className="w-full bg-stone-900 border border-stone-800 focus:border-cyan-500 rounded px-1.5 py-1 text-[10px] text-white outline-none"
                              title="Título individual para esta foto"
                            />
                            <p className="text-[9px] text-stone-500 truncate" title={item.fileName}>
                              {item.fileName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 font-mono">
                      <span>Puedes seguir pegando con <strong className="text-emerald-400">Ctrl + V</strong> o arrastrar más archivos.</span>
                      <button
                        type="button"
                        onClick={() => setUploadItems([])}
                        className="text-red-400 hover:text-red-300 text-[10px] underline"
                      >
                        Limpiar todo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Botón Pegar Portapapeles */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard && navigator.clipboard.read) {
                            const items = await navigator.clipboard.read();
                            const filesToProcess: Blob[] = [];
                            for (const item of items) {
                              for (const type of item.types) {
                                if (type.startsWith("image/")) {
                                  const blob = await item.getType(type);
                                  filesToProcess.push(blob);
                                }
                              }
                            }
                            if (filesToProcess.length > 0) {
                              processImageFiles(filesToProcess);
                              return;
                            }
                            setUploadError("No se detectó imagen en el portapapeles. Haz tu captura (Win+Shift+S) y pulsa Ctrl + V.");
                          } else {
                            setUploadError("Presiona directamente Ctrl + V en tu teclado para pegar.");
                          }
                        } catch {
                          setUploadError("Presiona directamente las teclas Ctrl + V en tu teclado para pegar la captura.");
                        }
                      }}
                      className="p-4 bg-gradient-to-br from-[#18181b] to-emerald-950/20 border border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ClipboardPaste className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold text-emerald-300 text-xs">Pegar Captura(s)</span>
                        <span className="text-[10px] text-stone-500 font-mono">Win + Shift + S o Ctrl + V</span>
                      </div>
                    </button>

                    {/* Botón Examinar Archivos Múltiples */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 bg-gradient-to-br from-[#18181b] to-cyan-950/20 border border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Images className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold text-cyan-300 text-xs">Seleccionar Archivo(s)</span>
                        <span className="text-[10px] text-stone-500 font-mono">Una o varias fotos (PNG, JPG, WEBP)</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* METADATOS: CARPETA & TÍTULO (O TÍTULO PRINCIPAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 uppercase text-[10px] font-bold">
                    Carpeta Destino
                  </label>
                  <select
                    value={uploadFolderId}
                    onChange={(e) => setUploadFolderId(e.target.value)}
                    className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="">📁 General / Raíz</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name} ({f.pilotName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 uppercase text-[10px] font-bold">
                    {uploadItems.length > 1 ? "Título Base o Serie" : "Título de la Foto *"}
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder={uploadItems.length > 1 ? "Ej: Test Le Mans Stint 1" : "Ej: Telemetría Vuelta 1:47.3"}
                    className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* DESCRIPCIÓN & TAGS */}
              <div>
                <label className="block text-stone-400 mb-1 uppercase text-[10px] font-bold">
                  Descripción o Notas Técnicas (Opcional para todas las fotos)
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Detalles sobre el circuito, setup o condiciones de pista..."
                  className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 uppercase text-[10px] font-bold">
                  Etiquetas (Separadas por comas)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="ej: spa, audi, motec, lluvia, podio"
                  className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-850">
                <span className="text-[11px] text-stone-400 font-mono">
                  {uploadItems.length > 0
                    ? `${uploadItems.length} foto${uploadItems.length > 1 ? "s" : ""} lista${uploadItems.length > 1 ? "s" : ""} para subir`
                    : "No hay fotos seleccionadas"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadItems([]);
                    }}
                    className="px-3.5 py-2 rounded-xl text-stone-400 hover:text-white border border-stone-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || uploadItems.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-black font-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {uploadProgressCount
                            ? `[${uploadProgressCount.current}/${uploadProgressCount.total}] Subiendo...`
                            : uploadProgressStatus}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>
                          {uploadItems.length > 1
                            ? `Subir ${uploadItems.length} Fotos a Cloudflare R2`
                            : "Guardar en Cloudflare R2"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VISTA PREVIA FULLSCREEN DE IMAGEN */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] bg-[#111113] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Preview */}
            <div className="flex items-center justify-between p-4 border-b border-stone-850 bg-[#18181b]/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono">
                  {previewImage.pilotName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                    {previewImage.title}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono">
                    Subido por <span className="text-cyan-300 font-bold">{previewImage.pilotName}</span> en carpeta <span className="text-white font-bold">{previewImage.folderName || "General"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadOriginal(previewImage)}
                  disabled={isDownloading}
                  className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-black transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center"
                  title="Descargar imagen original (Full Res)"
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-[#18181b] hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-colors"
                  title="Abrir imagen original en nueva pestaña"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-lg bg-[#18181b] hover:bg-red-950 text-stone-400 hover:text-white border border-stone-700 transition-colors"
                  title="Cerrar vista previa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Imagen Principal */}
            <div className="flex-1 bg-black/90 flex items-center justify-center p-2 overflow-auto max-h-[65vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>

            {/* Metadatos y Tags del Preview */}
            <div className="p-4 border-t border-stone-850 bg-[#141416] space-y-2 font-mono text-xs">
              {previewImage.description && (
                <p className="text-stone-300 leading-relaxed">
                  {previewImage.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500 pt-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {new Date(previewImage.createdAt).toLocaleDateString()} {new Date(previewImage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {previewImage.r2Key && (
                    <span className="text-stone-600 truncate max-w-[200px]" title={previewImage.r2Key}>
                      R2: {previewImage.r2Key}
                    </span>
                  )}
                </div>

                {previewImage.tags && previewImage.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {previewImage.tags.map((t, idx) => (
                      <span key={idx} className="bg-stone-900 border border-stone-800 text-cyan-400 px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
