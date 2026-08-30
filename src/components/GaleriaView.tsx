import React, { useState, useEffect, useRef } from "react";
import {
  collection,
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
  Search,
  Users,
  User,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Download,
  Info,
  Calendar,
  Layers,
  RefreshCw,
  Copy,
  Check,
  Images,
  ArrowLeft,
  FolderOpen,
  Shield,
  Lock,
  UserPlus,
  UserCheck,
  UserMinus,
  Crown,
  ShieldCheck,
  Settings,
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
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [r2Status, setR2Status] = useState<R2StatusResponse>({
    configured: false,
    bucketName: null,
    publicDomain: null,
  });

  // Filtros y Navegación (null = Vista Principal de Carpetas/Álbumes, "root" = ALR OFICIAL)
  const [selectedFolderId, setSelectedFolderId] = useState<string | "all" | "root" | null>(null);
  const [selectedPilotFilter, setSelectedPilotFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);

  // Modales
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [folderToManage, setFolderToManage] = useState<GalleryFolder | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);

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
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 1. Cargar Estado de Cloudflare R2
  useEffect(() => {
    checkR2Status().then(setR2Status);
  }, []);

  // 2. Suscribirse a los Usuarios del Equipo
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const loadedUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== "default_user") {
            loadedUsers.push({
              uid: docSnap.id,
              ...(docSnap.data() as Omit<UserProfile, "uid">),
            });
          }
        });
        setTeamUsers(loadedUsers);
      },
      (err) => {
        console.error("Error cargando usuarios:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Suscribirse a las Carpetas en Firestore
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
        loadedFolders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setFolders(loadedFolders);

        // Si tenemos el modal de miembros abierto, sincronizar el folder seleccionado
        setFolderToManage((prev) => {
          if (!prev) return null;
          return loadedFolders.find((f) => f.id === prev.id) || null;
        });
      },
      (err) => {
        console.error("Error cargando carpetas:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  // 4. Suscribirse a las Imágenes en Firestore
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

  // Helper de Permisos
  const canUploadToFolder = (folderId: string): boolean => {
    if (folderId === "" || folderId === "root") {
      // ALR OFICIAL: Solo Administradores
      return isTeamAdmin;
    }
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return false;
    if (isTeamAdmin) return true;
    if (folder.pilotUid === currentUser.uid) return true;
    if (folder.allowedUids && folder.allowedUids.includes(currentUser.uid)) return true;
    return false;
  };

  const canManageFolderMembers = (folder: GalleryFolder): boolean => {
    return isTeamAdmin || folder.pilotUid === currentUser.uid;
  };

  const canDeleteImage = (img: GalleryImage): boolean => {
    if (isTeamAdmin) return true;
    if (img.pilotUid === currentUser.uid) return true;
    if (img.folderId) {
      const folder = folders.find((f) => f.id === img.folderId);
      if (folder) {
        if (folder.pilotUid === currentUser.uid) return true;
        if (folder.allowedUids && folder.allowedUids.includes(currentUser.uid)) return true;
      }
    }
    return false;
  };

  // Carpetas donde el usuario actual TIENE permiso de subida
  const myWritableFolders = folders.filter(
    (f) => isTeamAdmin || f.pilotUid === currentUser.uid || (f.allowedUids && f.allowedUids.includes(currentUser.uid))
  );

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
          openUploadModalForCurrentView();
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [uploadItems, selectedFolderId, folders, isTeamAdmin]);

  const openUploadModalForCurrentView = () => {
    if (selectedFolderId && selectedFolderId !== "all" && selectedFolderId !== "root") {
      if (canUploadToFolder(selectedFolderId)) {
        setUploadFolderId(selectedFolderId);
      } else {
        // Fallback a primera carpeta permitida
        setUploadFolderId(myWritableFolders[0]?.id || "");
      }
    } else if (selectedFolderId === "root") {
      if (isTeamAdmin) {
        setUploadFolderId("");
      } else {
        setUploadFolderId(myWritableFolders[0]?.id || "");
      }
    } else {
      if (isTeamAdmin) {
        setUploadFolderId("");
      } else {
        setUploadFolderId(myWritableFolders[0]?.id || "");
      }
    }
    setIsUploadModalOpen(true);
  };

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
      const createdDocRef = await addDoc(collection(db, "gallery_folders"), {
        name: newFolderName.trim(),
        color: newFolderColor,
        pilotUid: currentUser.uid,
        pilotName: currentUser.displayName || currentUser.email || "Piloto ALR",
        allowedUids: [], // Inicialmente solo el creador
        createdAt: new Date().toISOString(),
      });
      setNewFolderName("");
      setIsNewFolderModalOpen(false);
      setSelectedFolderId(createdDocRef.id);
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
        "¿Seguro que deseas eliminar esta carpeta? Las imágenes asociadas se desvincularán de la carpeta."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "gallery_folders", folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    } catch (err: any) {
      console.error("Error eliminando carpeta:", err);
      alert("Error al eliminar carpeta: " + err.message);
    }
  };

  // Añadir/Quitar Colaboradores a una Carpeta
  const handleToggleCollaborator = async (targetPilotUid: string) => {
    if (!folderToManage) return;
    if (!canManageFolderMembers(folderToManage)) {
      alert("Solo el creador de la carpeta o un administrador pueden gestionar colaboradores.");
      return;
    }

    setIsUpdatingMembers(true);
    try {
      const currentAllowed = folderToManage.allowedUids || [];
      const isAlreadyAllowed = currentAllowed.includes(targetPilotUid);

      let newAllowed: string[];
      if (isAlreadyAllowed) {
        newAllowed = currentAllowed.filter((uid) => uid !== targetPilotUid);
      } else {
        newAllowed = [...currentAllowed, targetPilotUid];
      }

      await updateDoc(doc(db, "gallery_folders", folderToManage.id), {
        allowedUids: newAllowed,
      });

      // Actualizar estado local inmediatamente
      setFolderToManage({
        ...folderToManage,
        allowedUids: newAllowed,
      });
    } catch (err: any) {
      console.error("Error actualizando colaboradores:", err);
      alert("Error al actualizar colaboradores: " + err.message);
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  // Subir Imágenes a Cloudflare R2 y Guardar en Firestore
  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadItems.length === 0) {
      setUploadError("Por favor carga o pega al menos una imagen primero.");
      return;
    }

    // Validación estricta de permisos
    if (!canUploadToFolder(uploadFolderId)) {
      if (uploadFolderId === "" || uploadFolderId === "root") {
        setUploadError("Solo los administradores de la página pueden subir contenido a la carpeta ALR OFICIAL.");
      } else {
        setUploadError("No tienes permisos de colaborador para subir imágenes en la carpeta seleccionada.");
      }
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressCount({ current: 0, total: uploadItems.length });

    try {
      const isRoot = !uploadFolderId || uploadFolderId === "root";
      const selectedFolder = isRoot ? null : folders.find((f) => f.id === uploadFolderId);
      const folderName = isRoot ? "ALR OFICIAL" : selectedFolder ? selectedFolder.name : "ALR OFICIAL";
      
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
            folderId: isRoot ? undefined : uploadFolderId,
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
          folderId: isRoot ? "" : uploadFolderId,
          folderName: folderName,
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
    if (!canDeleteImage(img)) {
      alert("Solo el autor de la foto, el dueño de la carpeta o un administrador pueden eliminarla.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar esta imagen de la galería y de Cloudflare R2?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "gallery_images", img.id));
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

  // Descarga en Calidad Original
  const handleDownloadOriginal = async (image: GalleryImage) => {
    try {
      setIsDownloading(true);
      const response = await fetch(image.url, { mode: "cors" });
      if (!response.ok) throw new Error("No se pudo obtener el archivo original");
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
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

  // Lista única de pilotos para el filtro
  const pilotsList = Array.from(
    new Set([
      ...images.map((img) => JSON.stringify({ uid: img.pilotUid, name: img.pilotName })),
      ...folders.map((f) => JSON.stringify({ uid: f.pilotUid, name: f.pilotName })),
    ])
  ).map((str) => JSON.parse(str));

  // Filtrado de Imágenes
  const filteredImages = images.filter((img) => {
    if (selectedFolderId === "root") {
      if (img.folderId && img.folderId !== "") return false;
    } else if (selectedFolderId !== "all") {
      if (img.folderId !== selectedFolderId) return false;
    }

    if (selectedPilotFilter !== "all" && img.pilotUid !== selectedPilotFilter) {
      return false;
    }

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

  // Carpetas visibles según filtro
  const visibleFolders = folders.filter((f) => {
    if (selectedPilotFilter !== "all" && f.pilotUid !== selectedPilotFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name?.toLowerCase().includes(q);
      const matchPilot = f.pilotName?.toLowerCase().includes(q);
      return matchName || matchPilot;
    }
    return true;
  });

  const rootImages = images.filter((img) => !img.folderId || img.folderId === "");
  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  // Pilotos disponibles para añadir a una carpeta
  const availablePilotsForFolder = teamUsers.filter((u) => {
    if (!folderToManage) return false;
    // No mostrar al creador de la carpeta en la lista de colaboradores a añadir
    if (u.uid === folderToManage.pilotUid) return false;
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      const matchName = u.displayName?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER DE LA GALERÍA CON ESTADO R2 */}
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
                Álbumes privados, carpeta ALR Oficial y permisos de colaboración por piloto
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
            onClick={openUploadModalForCurrentView}
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
              placeholder="Buscar por carpeta, título, notas, etiquetas o piloto..."
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
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VISTA 1: PRINCIPAL DE CARPETAS / ÁLBUMES (selectedFolderId === null)
          ───────────────────────────────────────────────────────────── */}
      {selectedFolderId === null ? (
        <div className="space-y-6">
          {/* GRID PRINCIPAL DE CARPETAS */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3 bg-[#111113] border border-stone-850 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
                Sincronizando Álbumes con Cloudflare R2...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              
              {/* TARJETA 1: CARPETA OFICIAL ALR (ALR OFICIAL) */}
              <div
                onClick={() => setSelectedFolderId("root")}
                className="bg-gradient-to-b from-[#16161a] to-[#0d0d10] border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl overflow-hidden group transition-all flex flex-col shadow-[0_4px_20px_rgba(6,182,212,0.1)] cursor-pointer hover:scale-[1.01] relative"
              >
                {/* Visual Preview / Mini Collage */}
                <div className="relative aspect-[16/10] bg-black/90 p-2 overflow-hidden border-b border-cyan-500/20">
                  {rootImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5 h-full">
                      {rootImages.slice(0, 3).map((img, idx) => (
                        <div key={img.id} className="relative rounded-lg overflow-hidden bg-stone-900 h-full">
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {idx === 2 && rootImages.length > 3 && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                              +{rootImages.length - 2}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500/60 space-y-1">
                      <Shield className="w-8 h-8 text-cyan-400/80" />
                      <span className="text-[10px] font-mono text-cyan-300/80">Contenido Oficial ALR</span>
                    </div>
                  )}

                  <span className="absolute top-2 left-2 bg-black/90 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <Shield className="w-2.5 h-2.5 text-amber-400" />
                    ALR OFICIAL
                  </span>
                  <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white border border-stone-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {rootImages.length} fotos
                  </span>
                </div>

                {/* Contenido de la Carpeta */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white font-mono group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        <span>ALR OFICIAL</span>
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      </h4>
                      <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold">
                        Solo Admins
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono line-clamp-2 mt-1">
                      Pósters oficiales, capturas de campeonatos, diseños y material del equipo gestionado por los administradores.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> Admin Only
                    </span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold text-[11px]">
                      Abrir Álbum <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* TARJETAS DE CARPETAS DE USUARIO */}
              {visibleFolders.map((folder) => {
                const folderImages = images.filter((img) => img.folderId === folder.id);
                const isOwner = folder.pilotUid === currentUser.uid;
                const isCollaborator = folder.allowedUids && folder.allowedUids.includes(currentUser.uid);
                const canUpload = isTeamAdmin || isOwner || isCollaborator;
                const collaboratorsCount = folder.allowedUids ? folder.allowedUids.length : 0;

                return (
                  <div
                    key={folder.id}
                    className="bg-[#111113] border border-stone-800 hover:border-cyan-500/60 rounded-2xl overflow-hidden group transition-all flex flex-col shadow-lg relative hover:scale-[1.01]"
                  >
                    {/* Visual Preview / Mini Collage */}
                    <div
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="relative aspect-[16/10] bg-black/90 p-2 overflow-hidden border-b border-stone-850 cursor-pointer"
                    >
                      {folderImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1.5 h-full">
                          {folderImages.slice(0, 3).map((img, idx) => (
                            <div key={img.id} className="relative rounded-lg overflow-hidden bg-stone-900 h-full">
                              <img
                                src={img.url}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {idx === 2 && folderImages.length > 3 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                                  +{folderImages.length - 2}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 space-y-1">
                          <FolderOpen className="w-8 h-8 text-cyan-500/40" />
                          <span className="text-[10px] font-mono text-stone-500">Carpeta vacía</span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="bg-black/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5 text-cyan-400" />
                          Álbum
                        </span>
                        {isOwner && (
                          <span className="bg-cyan-950/90 backdrop-blur-md text-cyan-300 border border-cyan-500/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                            Tuya
                          </span>
                        )}
                        {isCollaborator && (
                          <span className="bg-emerald-950/90 backdrop-blur-md text-emerald-300 border border-emerald-500/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                            Colaborador
                          </span>
                        )}
                      </div>

                      <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white border border-stone-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {folderImages.length} fotos
                      </span>
                    </div>

                    {/* Contenido de la Carpeta */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white font-mono group-hover:text-cyan-300 transition-colors truncate" title={folder.name}>
                            {folder.name}
                          </h4>
                          {!canUpload && (
                            <span title="Solo el creador y colaboradores añadidos pueden subir contenido" className="text-stone-500">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-stone-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-3.5 h-3.5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-[7px]">
                              {folder.pilotName.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{folder.pilotName}</span>
                          </div>

                          {collaboratorsCount > 0 && (
                            <span className="text-[9px] text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              <Users className="w-2.5 h-2.5" /> +{collaboratorsCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1">
                          {/* Botón Gestionar Miembros (si es dueño o admin) */}
                          {(isOwner || isTeamAdmin) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToManage(folder);
                                setIsMembersModalOpen(true);
                              }}
                              title="Añadir o gestionar colaboradores de la carpeta"
                              className="p-1 rounded-lg text-stone-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors flex items-center gap-1 text-[10px]"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Miembros</span>
                            </button>
                          )}

                          {/* Botón Eliminar Carpeta */}
                          {(isOwner || isTeamAdmin) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.pilotUid);
                              }}
                              title="Eliminar carpeta"
                              className="p-1 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedFolderId(folder.id)}
                          className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          Abrir Álbum <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* TARJETA +: CREAR NUEVA CARPETA DIRECTAMENTE */}
              <button
                type="button"
                onClick={() => setIsNewFolderModalOpen(true)}
                className="bg-[#111113]/50 border-2 border-dashed border-stone-800 hover:border-cyan-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2.5 text-stone-400 hover:text-cyan-300 transition-all cursor-pointer min-h-[220px] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 group-hover:border-cyan-500/40 flex items-center justify-center text-stone-400 group-hover:text-cyan-400 transition-colors">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-bold font-mono text-white group-hover:text-cyan-300">
                    + Crear Nueva Carpeta
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Tu espacio propio para fotos y telemetría
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* SI EL USUARIO HIZO BÚSQUEDA Y HAY FOTOS COINCIDENTES, MOSTRARLAS TAMBIÉN */}
          {searchQuery.trim() && filteredImages.length > 0 && (
            <div className="pt-6 border-t border-stone-850 space-y-4">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fotos individuales que coinciden con tu búsqueda ({filteredImages.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredImages.slice(0, 8).map((img) => (
                  <div
                    key={img.id}
                    className="bg-[#111113] border border-stone-850 hover:border-cyan-500/40 rounded-2xl overflow-hidden group transition-all flex flex-col shadow-md"
                  >
                    <div className="relative aspect-video bg-black/80 overflow-hidden cursor-pointer" onClick={() => setPreviewImage(img)}>
                      <img src={img.url} alt={img.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/80 backdrop-blur-md border border-stone-700 text-cyan-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5 text-cyan-400" />
                          {img.folderName || "ALR OFICIAL"}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white font-mono truncate">{img.title}</h4>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">{img.pilotName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           VISTA 2: DENTRO DE UNA CARPETA ESPECÍFICA, ALR OFICIAL O TODAS
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          
          {/* BREADCRUMB & BARRA DE NAVEGACIÓN DENTRO DE CARPETA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111113] border border-stone-850 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedFolderId(null)}
                className="flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-cyan-400 hover:text-cyan-300 border border-stone-800 hover:border-cyan-500/40 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Carpetas</span>
              </button>

              <div className="border-l border-stone-800 pl-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    {selectedFolderId === "all" ? (
                      <>
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>Muro de Todas las Fotos</span>
                      </>
                    ) : selectedFolderId === "root" ? (
                      <>
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300">ALR OFICIAL</span>
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold">
                          Oficial
                        </span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-4 h-4 text-cyan-400" />
                        <span>{currentFolder?.name || "Carpeta"}</span>
                      </>
                    )}
                  </h3>
                  <span className="bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {filteredImages.length} foto{filteredImages.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {currentFolder && (
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>Creado por <strong className="text-stone-200">{currentFolder.pilotName}</strong></span>
                    {currentFolder.allowedUids && currentFolder.allowedUids.length > 0 && (
                      <span className="text-emerald-400">· {currentFolder.allowedUids.length} colaborador(es)</span>
                    )}
                  </p>
                )}
                {selectedFolderId === "root" && (
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    Carpeta oficial del equipo · Solo administradores pueden publicar
                  </p>
                )}
              </div>
            </div>

            {/* Acciones de la Carpeta Activa */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón Gestionar Miembros si es creador o admin de esta carpeta */}
              {currentFolder && (canManageFolderMembers(currentFolder)) && (
                <button
                  onClick={() => {
                    setFolderToManage(currentFolder);
                    setIsMembersModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-cyan-300 border border-stone-800 hover:border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Añadir / Gestionar Miembros</span>
                </button>
              )}

              {/* Botón Subir Fotos */}
              {selectedFolderId === "root" ? (
                isTeamAdmin ? (
                  <button
                    onClick={() => {
                      setUploadFolderId("");
                      setIsUploadModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-cyan-500 hover:opacity-90 text-black font-black px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wide transition-all cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Subir a ALR Oficial</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Solo Administradores</span>
                  </span>
                )
              ) : currentFolder ? (
                canUploadToFolder(currentFolder.id) ? (
                  <button
                    onClick={() => {
                      setUploadFolderId(currentFolder.id);
                      setIsUploadModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Subir Fotos a esta Carpeta</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Álbum Privado de {currentFolder.pilotName}</span>
                  </span>
                )
              ) : (
                <button
                  onClick={openUploadModalForCurrentView}
                  className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Subir Fotos</span>
                </button>
              )}
            </div>
          </div>

          {/* GRID DE FOTOS DE LA CARPETA */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3 bg-[#111113] border border-stone-850 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
                Cargando imágenes de la carpeta...
              </p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4 bg-[#111113] border border-stone-850 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  No hay fotos en esta carpeta
                </h3>
                <p className="text-xs text-stone-400 font-mono leading-relaxed">
                  {selectedFolderId === "root" && !isTeamAdmin
                    ? "Esta carpeta oficial solo puede ser nutrida por los administradores de Apex Latam Racing."
                    : currentFolder && !canUploadToFolder(currentFolder.id)
                    ? `Esta carpeta pertenece a ${currentFolder.pilotName}. Pídele que te agregue como colaborador para poder subir tus fotos aquí.`
                    : "Agrega capturas de telemetría o fotos usando el botón inferior o pegando con Ctrl + V."}
                </p>
              </div>

              {((selectedFolderId === "root" && isTeamAdmin) || (currentFolder && canUploadToFolder(currentFolder.id))) && (
                <button
                  onClick={() => {
                    if (selectedFolderId === "root") setUploadFolderId("");
                    else if (currentFolder) setUploadFolderId(currentFolder.id);
                    setIsUploadModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Fotos a esta Carpeta</span>
                </button>
              )}
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
                        {img.folderName || "ALR OFICIAL"}
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
                        {canDeleteImage(img) && (
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
        </div>
      )}

      {/* MODAL 1: CREAR CARPETA */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#111113] border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                Nueva Carpeta de Piloto
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
                  placeholder="Ej: Mis Setups LMU, Telemetrías Spa, Podios 2026..."
                  className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Serás el propietario de esta carpeta. Podrás invitar a otros pilotos para que suban o colaboren en ella.
                </p>
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

      {/* MODAL 2: GESTIONAR MIEMBROS / COLABORADORES DE CARPETA */}
      {isMembersModalOpen && folderToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111113] border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Gestionar Miembros de la Carpeta
                </h3>
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                  Álbum: <strong className="text-cyan-300">{folderToManage.name}</strong> · Creado por {folderToManage.pilotName}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setFolderToManage(null);
                  setMemberSearchQuery("");
                }}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 text-xs font-mono text-cyan-200">
              <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Permisos de Colaboración
              </p>
              <p className="text-[11px] text-stone-300 mt-0.5">
                Los pilotos que agregues a esta carpeta podrán <strong>subir capturas, fotos y telemetrías</strong> directamente a este álbum.
              </p>
            </div>

            {/* CREADOR / PROPIETARIO */}
            <div className="space-y-1.5 font-mono">
              <label className="text-[10px] uppercase font-bold text-stone-400">Propietario / Creador</label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    {folderToManage.pilotName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{folderToManage.pilotName}</p>
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> Dueño del Álbum
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-stone-400 bg-black/40 px-2 py-0.5 rounded">
                  Propietario
                </span>
              </div>
            </div>

            {/* COLABORADORES ACTUALES */}
            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-stone-400">
                  Colaboradores Autorizados ({folderToManage.allowedUids ? folderToManage.allowedUids.length : 0})
                </label>
              </div>

              {folderToManage.allowedUids && folderToManage.allowedUids.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {folderToManage.allowedUids.map((uid) => {
                    const userObj = teamUsers.find((u) => u.uid === uid);
                    const name = userObj ? userObj.displayName || userObj.email : `Piloto (${uid.slice(0, 6)})`;
                    return (
                      <div
                        key={uid}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-[10px]">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{name}</p>
                            <span className="text-[9px] text-emerald-400">Puede subir y colaborar</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdatingMembers}
                          onClick={() => handleToggleCollaborator(uid)}
                          className="text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-stone-500 italic p-2 bg-stone-900/40 rounded-xl border border-stone-850">
                  Aún no hay colaboradores agregados a esta carpeta. Solo el creador puede subir fotos.
                </p>
              )}
            </div>

            {/* SECCIÓN AÑADIR NUEVOS PILOTOS DEL EQUIPO */}
            <div className="pt-3 border-t border-stone-850 space-y-2.5 font-mono">
              <label className="text-[10px] uppercase font-bold text-stone-400 flex items-center justify-between">
                <span>Añadir Pilotos de la Escudería</span>
                <span className="text-stone-500 lowercase">({availablePilotsForFolder.length} disponibles)</span>
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Buscar piloto por nombre o correo..."
                  className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto p-1 bg-black/40 rounded-xl border border-stone-850">
                {availablePilotsForFolder.length === 0 ? (
                  <p className="text-center text-[11px] text-stone-500 py-3">
                    No se encontraron pilotos con ese criterio.
                  </p>
                ) : (
                  availablePilotsForFolder.map((pilot) => {
                    const isAdded = folderToManage.allowedUids?.includes(pilot.uid);
                    return (
                      <div
                        key={pilot.uid}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-[10px]">
                            {(pilot.displayName || pilot.email || "P").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-200">
                              {pilot.displayName || pilot.email}
                            </p>
                            <span className="text-[9px] text-stone-500 uppercase">{pilot.role || "piloto"}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdatingMembers}
                          onClick={() => handleToggleCollaborator(pilot.uid)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                            isAdded
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-red-950 hover:text-red-400 hover:border-red-500/40"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Añadido</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 text-cyan-400" />
                              <span>Añadir</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-850 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setFolderToManage(null);
                  setMemberSearchQuery("");
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBIR / PEGAR FOTO EN CLOUDFLARE R2 */}
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
                  Selecciona la carpeta donde tienes permiso para almacenar fotos
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
                      {uploadError.includes("CORS") ? "Falta habilitar CORS en Cloudflare R2" : "Aviso de Subida"}
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

            {/* AVISO SI EL USUARIO NO ES ADMIN Y NO TIENE CARPETAS PROPIAS NI COMPARTIDAS */}
            {!isTeamAdmin && myWritableFolders.length === 0 && (
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2 font-mono text-xs text-amber-200">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" />
                  No tienes carpetas autorizadas aún
                </p>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  La carpeta <strong>ALR OFICIAL</strong> es exclusiva para los administradores. Para comenzar a subir tus fotos y telemetrías, crea tu primera carpeta o pide a un compañero que te agregue a la suya.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setIsNewFolderModalOpen(true);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer mt-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Crear Mi Primera Carpeta</span>
                </button>
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

                    {/* Botón Seleccionar Archivos Múltiples */}
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

              {/* METADATOS: CARPETA & TÍTULO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 uppercase text-[10px] font-bold">
                    Carpeta Destino *
                  </label>
                  <select
                    value={uploadFolderId}
                    onChange={(e) => setUploadFolderId(e.target.value)}
                    className="w-full bg-[#18181b] border border-stone-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    {isTeamAdmin && (
                      <option value="">🏁 ALR OFICIAL (Solo Admins)</option>
                    )}

                    {/* Mis Carpetas */}
                    {folders.filter((f) => f.pilotUid === currentUser.uid).length > 0 && (
                      <optgroup label="── Mis Carpetas (Propietario) ──">
                        {folders
                          .filter((f) => f.pilotUid === currentUser.uid)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              📁 {f.name} (Tú)
                            </option>
                          ))}
                      </optgroup>
                    )}

                    {/* Carpetas donde soy colaborador */}
                    {folders.filter(
                      (f) => f.pilotUid !== currentUser.uid && f.allowedUids?.includes(currentUser.uid)
                    ).length > 0 && (
                      <optgroup label="── Carpetas Compartidas Conmigo ──">
                        {folders
                          .filter((f) => f.pilotUid !== currentUser.uid && f.allowedUids?.includes(currentUser.uid))
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              👥 {f.name} (de {f.pilotName})
                            </option>
                          ))}
                      </optgroup>
                    )}

                    {/* Otras carpetas (solo seleccionables por admins) */}
                    {isTeamAdmin &&
                      folders.filter(
                        (f) => f.pilotUid !== currentUser.uid && !f.allowedUids?.includes(currentUser.uid)
                      ).length > 0 && (
                        <optgroup label="── Otras Carpetas (Modo Admin) ──">
                          {folders
                            .filter((f) => f.pilotUid !== currentUser.uid && !f.allowedUids?.includes(currentUser.uid))
                            .map((f) => (
                              <option key={f.id} value={f.id}>
                                📁 {f.name} ({f.pilotName})
                              </option>
                            ))}
                        </optgroup>
                      )}
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
                  Descripción o Notas Técnicas (Opcional)
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
                    ? `${uploadItems.length} foto${uploadItems.length > 1 ? "s" : ""} lista${uploadItems.length > 1 ? "s" : ""}`
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
                    disabled={isUploading || uploadItems.length === 0 || (!isTeamAdmin && myWritableFolders.length === 0)}
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

      {/* MODAL 4: VISTA PREVIA FULLSCREEN DE IMAGEN */}
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
                    Subido por <span className="text-cyan-300 font-bold">{previewImage.pilotName}</span> en carpeta <span className="text-white font-bold">{previewImage.folderName || "ALR OFICIAL"}</span>
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
