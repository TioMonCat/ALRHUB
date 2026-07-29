export interface SetupContext {
  auto: string;
  pista: string;
  configuracionIni?: string;
  notasPiloto?: string;
  presionNeumaticos?: string;
}

export interface SetupFieldSummary {
  id: string;
  name: string;
  currentValue: string;
  unit?: string;
  min?: number;
  max?: number;
}

export interface OptimizationInput {
  car: string;
  track: string;
  game: string;
  notes?: string;
  currentValues: Record<string, string>;
  fieldsSummary?: SetupFieldSummary[];
  userQuery: string;
}

export interface OptimizationResponse {
  markdownText: string;
  suggestedChanges: Record<string, string>;
}

/**
 * Parsea y extrae los ajustes en tiempo real sugeridos por el Ingeniero ALR
 * a partir de bloques de código JSON en la respuesta.
 */
export function extraerAjustesIngeniero(texto: string): OptimizationResponse {
  let suggestedChanges: Record<string, string> = {};
  let markdownText = texto;

  // 1. Buscar bloque específico ALR_AJUSTES_INI o bloque JSON estándar
  const jsonBlockRegex = /```(?:json)?\s*(?:ALR_AJUSTES_INI)?\s*(\{[\s\S]*?\})\s*```/i;
  const match = texto.match(jsonBlockRegex);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        // Sanitizar que las claves y valores sean strings
        for (const [key, val] of Object.entries(parsed)) {
          if (val !== undefined && val !== null) {
            suggestedChanges[key] = String(val);
          }
        }
      }
      // Limpiar el bloque JSON del markdown para una presentación impecable
      markdownText = texto.replace(jsonBlockRegex, "").trim();
    } catch (e) {
      console.warn("No se pudo parsear el bloque JSON de ajustes del Ingeniero ALR:", e);
    }
  }

  return {
    markdownText,
    suggestedChanges,
  };
}

/**
 * Consulta al Ingeniero Jefe de Pista Virtual (Ingeniero ALR) enviando
 * la pregunta del piloto y opcionalmente el contexto de setups de Firebase.
 *
 * @param preguntaPiloto Pregunta o consulta técnica enviada por el piloto.
 * @param contextoSetupsFirebase Lista opcional de setups provistos desde Firebase.
 * @returns Promesa con la respuesta en texto generada por Gemini.
 */
export async function consultarIngenieroALR(
  preguntaPiloto: string,
  contextoSetupsFirebase?: SetupContext[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "La API Key no está configurada. Por favor, define VITE_GEMINI_API_KEY en las variables de entorno."
    );
  }

  let prompt = preguntaPiloto;
  if (contextoSetupsFirebase && contextoSetupsFirebase.length > 0) {
    prompt = `=== BASE DE DATOS DE SETUPS DE FIREBASE ===\n${JSON.stringify(
      contextoSetupsFirebase,
      null,
      2
    )}\n\n${preguntaPiloto}`;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error en la respuesta de la API de Gemini (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoRespuesta) {
      throw new Error("La API de Gemini devolvió una respuesta vacía o sin candidatos válidos.");
    }

    return textoRespuesta;
  } catch (error: any) {
    console.error("Error al consultar al Ingeniero ALR vía Gemini:", error);
    throw error;
  }
}

/**
 * Optimiza o modifica un setup activo enviando el contexto completo de reglaje
 * al Ingeniero ALR y retornando tanto el análisis en Markdown como los cambios sugeridos.
 */
export async function optimizarSetupConIngenieroALR(
  input: OptimizationInput
): Promise<OptimizationResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "La API Key no está configurada. Por favor, define VITE_GEMINI_API_KEY en las variables de entorno."
    );
  }

  const systemInstructions = `
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual del Equipo de Sim Racing ALR.
Estás integrado directamente en la plataforma web del equipo para analizar la física, aerodinámica y dinamismo de vehículos (GT3, LMP2, etc.) en Assetto Corsa y Assetto Corsa Competizione.

REGLAS DE DIAGNÓSTICO Y FÍSICA:
1. Analiza los valores de reglaje actuales y la duda/comportamiento reportado por el piloto.
2. Fundamenta cada recomendación basándote en física automotriz real: Transferencia de peso, Agarre mecánico o Carga aerodinámica.
3. Sugiere ajustes incrementales (1 a 3 clics o valores exactos dentro de las restricciones de los campos).
4. DEBES concluir obligatoriamente con esta plantilla en Markdown:

### 📋 Resumen de Ajustes

* **[Parámetro / Sistema]:**
  * **Eje / Componente:** [Ej. Delantero / Trasero / Aerodinámica]
  * **Nombre en .ini / Pantalla AC:** \`[Ej. SPRING_RATE_LF / Dureza de Muelle]\`
  * **Valor Anterior:** \`[Valor anterior]\`
  * **Valor Nuevo Sugerido:** \`[Nuevo valor / Clics +/-]\`
  * **Efecto Esperado:** [Breve explicación del comportamiento físico esperado]

* **Instrucciones para el Piloto:** 
  * Rodar 4-5 vueltas limpias para asentar temperaturas/presiones y reportar sensaciones.

5. MUY IMPORTANTE PARA APLICAR CAMBIOS EN TIEMPO REAL:
Si sugieres cambiar parámetros del setup, añade AL FINAL de tu mensaje un bloque de código JSON con las claves de los campos que modificas y sus nuevos valores exactos, usando la clave "ALR_AJUSTES_INI":

\`\`\`json ALR_AJUSTES_INI
{
  "id_del_campo": "nuevo_valor"
}
\`\`\`
Ejemplo: Si ablandas la barra estabilizadora delantera (arb_front) a 2 y aumentas la caida delantera (camber_lf) a -3.5, añade:
\`\`\`json ALR_AJUSTES_INI
{
  "arb_front": "2",
  "camber_lf": "-3.5"
}
\`\`\`
Usa ÚNICAMENTE los IDs de campo que existen en la lista de valores provista.
`;

  const prompt = `${systemInstructions}

=== DATOS DEL SETUP ACTIVO A TRABAJAR ===
- Vehículo: ${input.car}
- Circuito: ${input.track}
- Simulador: ${input.game}
- Notas del Piloto: ${input.notes || "Sin notas previas"}

=== PARÁMETROS Y VALORES DE REGLAJE ACTUALES ===
${JSON.stringify(input.fieldsSummary || input.currentValues, null, 2)}

=== CONSULTA / PROBLEMA EN PISTA DEL PILOTO ===
"${input.userQuery}"
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error en la respuesta de Gemini (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini devolvió una respuesta vacía.");
    }

    return extraerAjustesIngeniero(rawText);
  } catch (error: any) {
    console.error("Error al optimizar setup con Ingeniero ALR:", error);
    throw error;
  }
}

