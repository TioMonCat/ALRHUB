// src/services/geminiService.ts
import { CONOCIMIENTO_INICIAL_GEM } from '../data/conocimientoInicialGem';

export interface SetupContext {
  auto?: string;
  pista?: string;
  configuracionIni?: string;
  notasPiloto?: string;
  durezaMuelles?: string;
  presionNeumaticos?: string;
  [key: string]: any; // Para permitir campos dinámicos de Firebase
}

export const consultarIngenieroALR = async (
  preguntaPiloto: string,
  setupsFirebase: SetupContext[] = []
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("No se encontró VITE_GEMINI_API_KEY en las variables de entorno.");
  }

  // Estructuramos todo el conocimiento (Base Semilla del Gem + Datos dinámicos de Firebase)
  const contextoCompleto = {
    base_conocimiento_maestra: CONOCIMIENTO_INICIAL_GEM,
    nuevos_setups_y_notas_firebase: setupsFirebase
  };

  const promptConContexto = `
=== CONOCIMIENTO ACUMULADO Y BASE DE DATOS DEL EQUIPO ALR ===
${JSON.stringify(contextoCompleto, null, 2)}
============================================================

=== TELEMETRÍA / DUDAS / CONSULTA DEL PILOTO ===
${preguntaPiloto}
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: promptConContexto }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error en la llamada a la API: ${response.statusText}`);
    }

    const data = await response.json();
    const respuestaIngeniero =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "El Ingeniero ALR no pudo procesar la respuesta en este momento.";

    return respuestaIngeniero;
  } catch (error) {
    console.error("Error al consultar al Ingeniero ALR:", error);
    throw error;
  }
};
