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

export function getApiKey(): string {
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("alr_gemini_api_key");
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  }
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY) ||
    ""
  );
}

export function saveApiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("alr_gemini_api_key", key.trim());
  }
}

export function removeApiKey(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("alr_gemini_api_key");
  }
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}

async function executeGeminiRequest(prompt: string, apiKey: string): Promise<string> {
  const models = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }

      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || response.statusText;
      lastError = new Error(`Error con modelo ${model} (${response.status}): ${errMsg}`);

      // Si el error es 404 (modelo no disponible en este plan/clave), continuamos al siguiente modelo
      if (response.status !== 404) {
        // Si es error de cuota/clave inválida (400, 401, 403), no sirve probar otros modelos con la misma clave
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(`Error en API Key de Gemini (${response.status}): ${errMsg}`);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes("API Key")) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini disponible.");
}

/**
 * Consulta al Ingeniero Jefe de Pista Virtual (Ingeniero ALR) enviando
 * la pregunta del piloto y opcionalmente el contexto de setups de Firebase.
 */
export async function consultarIngenieroALR(
  preguntaPiloto: string,
  contextoSetupsFirebase?: SetupContext[]
): Promise<string> {
  // 1. Intentar servidor proxy interno primero (/api/gemini/consultar)
  try {
    const apiRes = await fetch("/api/gemini/consultar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preguntaPiloto, contextoSetupsFirebase }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.text) return data.text;
    } else {
      const errorJson = await apiRes.json().catch(() => ({}));
      if (apiRes.status !== 404 && errorJson.error) {
        throw new Error(errorJson.error);
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("404") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    // Si falla por red o 404, intentar fallback cliente
  }

  // 2. Fallback cliente si existe API Key en localStorage / import.meta.env / process.env
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "La API Key de Gemini no está configurada. Por favor, asegúrate de haber agregado tu clave GEMINI_API_KEY haciendo clic en el botón 'API Key' de la pantalla."
    );
  }

  const systemInstructions = `
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual del Equipo de Sim Racing ALR.
Tus respuestas deben ser MUY CLARAS, DIRECTAS Y FÁCILES DE ENTENDER. Evita tecnicismos excesivamente complejos o listas anidadas difíciles de leer.

REGLAS DE RESPUESTA:
1. Explica el diagnóstico del vehículo en 1 o 2 párrafos concisos y sencillos.
2. Si recomiendas cambios de setup, concluye SIEMPRE con este resumen limpio en Markdown:

### 📋 Resumen de Cambios

- **[Nombre del Componente]** ([Eje Delantero / Trasero / Aerodinámica]):
  - **Ajuste:** \`[Valor Anterior]\` ➔ \`[Valor Nuevo]\` (\`[+X / -X clics]\`)
  - **Efecto:** Explicación simple y directa del comportamiento esperado en curva.

### 🏁 Instrucciones en Pista
- Dar 4 a 5 vueltas limpias para evaluar la mejora antes de hacer más cambios.
`;

  let prompt = `${systemInstructions}\n\n`;
  if (contextoSetupsFirebase && contextoSetupsFirebase.length > 0) {
    prompt += `=== BASE DE DATOS DE SETUPS DE FIREBASE ===\n${JSON.stringify(
      contextoSetupsFirebase,
      null,
      2
    )}\n\n`;
  }
  prompt += `=== CONSULTA DEL PILOTO ===\n"${preguntaPiloto}"`;

  return executeGeminiRequest(prompt, apiKey);
}

/**
 * Optimiza o modifica un setup activo enviando el contexto completo de reglaje
 * al Ingeniero ALR y retornando tanto el análisis en Markdown como los cambios sugeridos.
 */
export async function optimizarSetupConIngenieroALR(
  input: OptimizationInput
): Promise<OptimizationResponse> {
  // 1. Intentar servidor proxy interno primero (/api/gemini/optimizar)
  try {
    const apiRes = await fetch("/api/gemini/optimizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.rawText) {
        return extraerAjustesIngeniero(data.rawText);
      }
    } else {
      const errorJson = await apiRes.json().catch(() => ({}));
      if (apiRes.status !== 404 && errorJson.error) {
        throw new Error(errorJson.error);
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("404") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    // Si falla por red o 404, intentar fallback cliente
  }

  // 2. Fallback cliente
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "La API Key de Gemini no está configurada. Por favor, asegúrate de haber agregado tu clave GEMINI_API_KEY en el panel de Secretos / Variables de Entorno de AI Studio."
    );
  }

  const systemInstructions = `
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual del Equipo de Sim Racing ALR.
Tus diagnósticos y recomendaciones deben ser EXTREMADAMENTE CLAROS, DIRECTOS Y FÁCILES DE ENTENDER por cualquier piloto.

REGLAS DE RESPUESTA:
1. Explica la solución física de forma muy clara y concisa (máximo 2 párrafos cortos).
2. Concluye SIEMPRE con este resumen limpio en Markdown:

### 📋 Resumen de Cambios

- **[Nombre del Componente]** ([Eje / Sistema]):
  - **Ajuste:** \`[Valor Anterior]\` ➔ \`[Valor Nuevo]\`
  - **Efecto:** Explicación simple de lo que sentirás al pilotar.

### 🏁 Instrucciones en Pista
- Dar 4 a 5 vueltas constantes para probar los cambios.

3. MUY IMPORTANTE PARA APLICAR CAMBIOS EN TIEMPO REAL:
Si sugieres cambiar parámetros del setup, añade AL FINAL de tu mensaje un bloque JSON con las claves exactas modificadas:

\`\`\`json ALR_AJUSTES_INI
{
  "id_del_campo": "nuevo_valor"
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

  const rawText = await executeGeminiRequest(prompt, apiKey);
  return extraerAjustesIngeniero(rawText);
}

