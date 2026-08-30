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

// Helper rápido para convertir Base64 Data URL a Uint8Array de forma nativa sin congelar el hilo principal
async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  try {
    const res = await fetch(dataUrl);
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Consulta si el backend o la configuración directa de Cloudflare R2 está lista
 */
export async function checkR2Status(): Promise<R2StatusResponse> {
  // En producción estática (GitHub Pages o dominio propio), usar directamente la configuración
  if (DIRECT_R2_CONFIG.accountId && DIRECT_R2_CONFIG.accessKeyId && DIRECT_R2_CONFIG.bucketName) {
    return {
      configured: true,
      bucketName: DIRECT_R2_CONFIG.bucketName,
      publicDomain: DIRECT_R2_CONFIG.publicDomain,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("/api/r2/status", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.configured) {
        return data;
      }
    }
  } catch {
    // Si falla el fetch a /api/ (por ejemplo en GitHub Pages), pasamos al fallback directo
  }

  return { configured: false, bucketName: null, publicDomain: null };
}

/**
 * Sube una imagen directamente o vía backend a Cloudflare R2
 */
export async function uploadImageToR2(
  params: UploadImageParams,
  onProgressStep?: (step: string) => void
): Promise<{
  url: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
}> {
  onProgressStep?.("Procesando imagen...");

  const cleanPilotName = sanitizeR2Path(params.pilotName || params.pilotUid);
  const cleanFolderName = params.folderName ? sanitizeR2Path(params.folderName) : "general";
  const timestamp = Date.now();
  const cleanFileName = sanitizeR2Path(params.fileName || `captura_${timestamp}.png`);
  const r2Key = `pilots/${cleanPilotName}_${params.pilotUid.slice(0, 6)}/${cleanFolderName}/${timestamp}_${cleanFileName}`;
  const mimeType = params.mimeType || "image/jpeg";

  // 1. Decodificar imagen de forma nativa ultra rápida
  const bytes = await dataUrlToUint8Array(params.imageData);

  // 2. Subida Directa desde el cliente (GitHub Pages / SPA / Web)
  onProgressStep?.("Transfiriendo a Cloudflare R2...");
  const client = getDirectS3Client();

  const command = new PutObjectCommand({
    Bucket: DIRECT_R2_CONFIG.bucketName,
    Key: r2Key,
    Body: bytes,
    ContentType: mimeType,
  });

  // Timeout de seguridad de 45 segundos para que nunca se quede colgado indefinidamente
  const uploadPromise = client.send(command);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Tiempo de espera agotado al subir a Cloudflare R2. Por favor verifica tu conexión a internet e intenta nuevamente."
          )
        ),
      45000
    )
  );

  try {
    await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err: any) {
    console.error("Error en subida directa S3/R2:", err);
    if (
      err.name === "TypeError" ||
      err.name === "NetworkError" ||
      err.message?.includes("fetch") ||
      err.message?.includes("NetworkError") ||
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("Cross-Origin")
    ) {
      throw new Error(
        "CORS_ERROR: Tu bucket 'alr' de Cloudflare R2 necesita tener agregada la regla CORS para permitir subidas web directas."
      );
    }
    throw err;
  }

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

