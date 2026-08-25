import { GalleryFolder, GalleryImage } from "../types";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

// Configuración de R2 estática / directa para GitHub Pages
const DIRECT_R2_CONFIG = {
  accountId: "461d06fca308f259b50b8d6d95041b8d",
  accessKeyId: "ee92c8edb20e7d303688376aa329652c",
  secretAccessKey: "be0afac21b77fd8e25c9e0b7fd7ccd61e45c62c4645014b5571885ab103e5a44",
  bucketName: "alr",
  publicDomain: "https://pub-c812e9f9417342bc89292c8495c52b51.r2.dev",
};

let directS3Client: S3Client | null = null;

function getDirectS3Client(): S3Client {
  if (!directS3Client) {
    directS3Client = new S3Client({
      region: "auto",
      endpoint: `https://${DIRECT_R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: DIRECT_R2_CONFIG.accessKeyId,
        secretAccessKey: DIRECT_R2_CONFIG.secretAccessKey,
      },
    });
  }
  return directS3Client;
}

function sanitizeR2Path(input: string): string {
  return input
    .trim()
    .replace(/[\\^#%?*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

/**
 * Consulta si el backend o la configuración directa de Cloudflare R2 está lista
 */
export async function checkR2Status(): Promise<R2StatusResponse> {
  try {
    const res = await fetch("/api/r2/status");
    if (res.ok) {
      const data = await res.json();
      if (data.configured) {
        return data;
      }
    }
  } catch {
    // Si falla el fetch a /api/ (por ejemplo en GitHub Pages), pasamos al fallback directo
  }

  // Fallback directo para GitHub Pages y entornos estáticos
  if (DIRECT_R2_CONFIG.accountId && DIRECT_R2_CONFIG.accessKeyId && DIRECT_R2_CONFIG.bucketName) {
    return {
      configured: true,
      bucketName: DIRECT_R2_CONFIG.bucketName,
      publicDomain: DIRECT_R2_CONFIG.publicDomain,
    };
  }

  return { configured: false, bucketName: null, publicDomain: null };
}

/**
 * Sube una imagen directamente o vía backend a Cloudflare R2
 */
export async function uploadImageToR2(params: UploadImageParams): Promise<{
  url: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
}> {
  // 1. Intentar primero con el endpoint del Backend Express si está disponible
  try {
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

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Si la API del servidor no responde (ej. en GitHub Pages), usar subida directa
  }

  // 2. Subida Directa desde el cliente (GitHub Pages / SPA)
  const client = getDirectS3Client();
  const cleanPilotName = sanitizeR2Path(params.pilotName || params.pilotUid);
  const cleanFolderName = params.folderName ? sanitizeR2Path(params.folderName) : "general";
  const timestamp = Date.now();
  const cleanFileName = sanitizeR2Path(params.fileName || `captura_${timestamp}.png`);

  const r2Key = `pilots/${cleanPilotName}_${params.pilotUid.slice(0, 6)}/${cleanFolderName}/${timestamp}_${cleanFileName}`;

  const base64Data = params.imageData.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const mimeType = params.mimeType || "image/jpeg";
  const command = new PutObjectCommand({
    Bucket: DIRECT_R2_CONFIG.bucketName,
    Key: r2Key,
    Body: bytes,
    ContentType: mimeType,
  });

  await client.send(command);

  const cleanDomain = DIRECT_R2_CONFIG.publicDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const publicUrl = `https://${cleanDomain}/${r2Key}`;

  return {
    url: publicUrl,
    r2Key,
    fileSize: bytes.length,
    mimeType,
  };
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

    if (response.ok) {
      return true;
    }
  } catch {
    // Usar cliente directo si no hay backend
  }

  try {
    const client = getDirectS3Client();
    const command = new DeleteObjectCommand({
      Bucket: DIRECT_R2_CONFIG.bucketName,
      Key: r2Key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.error("Error eliminando de R2:", err);
    throw err;
  }
}

