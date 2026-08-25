import { GalleryFolder, GalleryImage } from "../types";

export interface UploadImageParams {
  imageData: string; // Base64 Data URL
  fileName: string;
  pilotUid: string;
  pilotName: string;
  pilotPhoto?: string;
  folderId?: string;
  folderName?: string;
  title: string;
  description?: string;
  mimeType?: string;
  tags?: string[];
}

export interface R2StatusResponse {
  configured: boolean;
  bucketName: string | null;
  publicDomain: string | null;
}

/**
 * Consulta si el backend tiene las variables de Cloudflare R2 configuradas
 */
export async function checkR2Status(): Promise<R2StatusResponse> {
  try {
    const res = await fetch("/api/r2/status");
    if (!res.ok) {
      return { configured: false, bucketName: null, publicDomain: null };
    }
    return await res.json();
  } catch (e) {
    console.error("Error verificando estado de R2:", e);
    return { configured: false, bucketName: null, publicDomain: null };
  }
}

/**
 * Sube una imagen al backend, que la transfiere a Cloudflare R2 y retorna la URL y r2Key
 */
export async function uploadImageToR2(params: UploadImageParams): Promise<{
  url: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
}> {
  const response = await fetch("/api/r2/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageData: params.imageData,
      fileName: params.fileName,
      pilotUid: params.pilotUid,
      pilotName: params.pilotName,
      folderName: params.folderName || "general",
      mimeType: params.mimeType || "image/jpeg",
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Error ${response.status} al subir la imagen a Cloudflare R2`);
  }

  const data = await response.json();
  return data;
}

/**
 * Elimina una imagen físicamente del bucket Cloudflare R2
 */
export async function deleteImageFromR2(r2Key: string): Promise<boolean> {
  try {
    const response = await fetch("/api/r2/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ r2Key }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Error al eliminar de Cloudflare R2");
    }

    return true;
  } catch (err) {
    console.error("Error eliminando de R2:", err);
    throw err;
  }
}
