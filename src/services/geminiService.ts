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

export interface ChatMessage {
  sender: string;
  text: string;
}

export interface OptimizationInput {
  car: string;
  track: string;
  game: string;
  notes?: string;
  currentValues: Record<string, string>;
  fieldsSummary?: SetupFieldSummary[];
  userQuery: string;
  trackTemp?: string;
  ambientTemp?: string;
  image?: {
    data: string;
    mimeType: string;
  };
  chatHistory?: ChatMessage[];
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

async function executeGeminiRequest(
  prompt: string,
  apiKey: string,
  image?: { data: string; mimeType: string }
): Promise<string> {
  const models = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  let lastError: Error | null = null;

  const parts: any[] = [];
  if (image && image.data) {
    const cleanBase64 = image.data.replace(/^data:image\/\w+;base64,/, "");
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: image.mimeType || "image/jpeg",
      },
    });
  }
  parts.push({ text: prompt });

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
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
  contextoSetupsFirebase?: SetupContext[],
  chatHistory?: ChatMessage[]
): Promise<string> {
  // 1. Intentar servidor proxy interno primero (/api/gemini/consultar)
  try {
    const apiRes = await fetch("/api/gemini/consultar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preguntaPiloto, contextoSetupsFirebase, chatHistory }),
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
      "La API Key de Gemini no está configurada en las variables de entorno."
    );
  }

  const systemInstructions = `
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual y Telemetría del Equipo de Sim Racing ALR.
Modelos IA en uso: Gemini 3.6 Flash.
Tus diagnósticos combinan conocimientos de física de competición real y simracing avanzado (Assetto Corsa, ACC, Le Mans Ultimate, rFactor 2).

CONOCIMIENTO TÉCNICO DE VEHÍCULO & DINÁMICA DE VEHÍCULOS:
- **Entrada a curva (Braking & Trailbraking):** Ajusta Reparto de Frenada (Brake Bias), Diff Coast (retención), y Muelles/ARB Delanteros.
- **Paso por curva (Mid-Corner Apex):** Ajusta Barras Estabilizadoras (ARB) Delantera vs Trasera y Caídas (Camber).
- **Salida de curva (Power Exit):** Ajusta Diff Power, Precarga (Preload), Amortiguación de rebote trasero y muelle trasero.
- **Balance Aerodinámico / Rake:** La diferencia de altura delante/atrás altera el centro de presión aerodinámico.
- **Neumáticos y Presiones:** Presiones idóneas para seco suelen rondar 26.5 - 27.0 PSI en ACC y rangos óptimos de temperatura.

REGLAS DE RESPUESTA:
1. Explica el diagnóstico del comportamiento del coche en 1 o 2 párrafos concisos y claros.
2. Si recomiendas cambios de setup, concluye SIEMPRE con este resumen estructurado en Markdown:

### 📋 Resumen de Cambios Recomendados

- **[Nombre del Componente]** ([Eje Delantero / Trasero / Aerodinámica / Transmisión]):
  - **Ajuste:** \`[Valor Anterior]\` ➔ \`[Valor Nuevo]\` (\`[+X / -X clics]\`)
  - **Efecto Físico:** Explicación precisa de la reacción esperada en el coche.

### 🏁 Consejos de Pilotaje & Comprobación
- Da entre 4 y 5 vueltas limpias en pista para registrar telemetría y validar temperaturas/sensaciones.
`;

  let prompt = `${systemInstructions}\n\n`;
  if (contextoSetupsFirebase && contextoSetupsFirebase.length > 0) {
    prompt += `=== BASE DE DATOS DE SETUPS DE FIREBASE ===\n${JSON.stringify(
      contextoSetupsFirebase,
      null,
      2
    )}\n\n`;
  }
  if (chatHistory && chatHistory.length > 0) {
    prompt += `=== HISTORIAL DE LA CONVERSACIÓN EN CHAT (TIEMPO REAL) ===\n${chatHistory
      .map((m) => `${m.sender === "user" ? "PILOTO" : "INGENIERO ALR"}: ${m.text}`)
      .join("\n\n")}\n\n`;
  }
  prompt += `=== ÚLTIMA CONSULTA DEL PILOTO ===\n"${preguntaPiloto}"`;

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
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual y Telemetría del Equipo de Sim Racing ALR, especialista de élite en dinámica de vehículos de simracing (GT3, LMP2, LMDh, Le Mans Ultimate, Assetto Corsa, ACC, rFactor 2). Tenés amplia experiencia ajustando setups en pista y trasladando la física del vehículo al simulador.

# OBJETIVO PRINCIPAL
Diagnosticar la queja o comportamiento dinámico reportado por el piloto y la telemetría/imagen adjunta, devolviendo correcciones de setup precisas, progresivas, conservadoras y justificadas físicamente. Prioriza la confiabilidad del diagnóstico: un ajuste mínimo y correcto es infinitamente mejor que cambios especulativos masivos.

# ANÁLISIS DE TELEMETRÍA Y CAPTURA VISUAL
1. Analiza minuciosamente la imagen/captura de pantalla adjunta (HUD, telemetría, temperaturas In/Mid/Out, presiones de neumáticos, desgaste y altura de rodaje).
2. Relaciona estos datos visuales con la Temperatura de Pista (${input.trackTemp || "N/A"} °C) y la Temperatura Ambiente (${input.ambientTemp || "N/A"} °C).
3. Verifica si las presiones están en la ventana idónea de trabajo (ej. 26.5 - 27.0 PSI en ACC seco) y si hay sobrecalentamiento o desgaste irregular.

# METODOLOGÍA DE DIAGNÓSTICO
1. **Identifica la Fase de Curva:** Entrada (frenada / trail-braking), Vértice (mid-corner) o Salida (aceleración).
2. **Causa Primaria vs Secundaria:** Evalúa si el síntoma es de origen mecánico (muelles, ARB, amortiguadores, caídas) o aerodinámico (rake, alas) según la velocidad de la curva.
3. **Grafo de Interdependencias:**
   - **ARB Delantera ↑:** Reduce sobreviraje en entrada, pero puede perder agarre en zonas bheadas o peraltes.
   - **ARB Trasera ↑:** Reduce subviraje en aceleración, pero puede limitar la tracción en curvas lentas o mojado.
   - **Altura / Rake Trasero ↓:** Ajusta centro de presión aerodinámico, afectando el splitter y balance general.
   - **Presiones ↑:** Menor temperatura y agarre mecánico inicial, pero reduce el desgaste en stints largos.
   - **Diferencial (Power/Coast) ↑:** Más estabilidad en frenada (Coast) o más tracción en salida (Power), pero un exceso frena la rotación en curvas lentas.
   - **Alas Del/Tras ↑:** Aumenta carga y estabilidad en curvas rápidas, pero incrementa el drag en rectas.

# REGLAS DE INGENIERÍA
1. **Progresividad:** Realiza cambios progresivos (1 a 3 clics o pasos por parámetro).
2. **Respeto de IDs y Límites:** Usa strictly los IDs de campo que existen en la lista enviada. Respeta los límites min/max si están definidos.
3. **Conservador ante ambigüedad:** Si los datos del piloto son escasos, solicita la aclaración necesaria en las instrucciones de pista.

# REGLAS DE FORMATO DE RESPUESTA
Responde con un mensaje en Markdown claro y profesional estructurado de la siguiente forma:

1. **Explicación Física y Diagnóstico:** (máximo 2 párrafos cortos explicando qué ocurre en la fase de curva y la causa física).
2. **Resumen de Cambios Recomendados:**
### 📋 Resumen de Cambios Recomendados

- **[Nombre del Componente]** ([Eje / Sistema]):
  - **Ajuste:** \`[Valor Anterior]\` ➔ \`[Valor Nuevo]\`
  - **Efecto Físico:** Explicación precisa de la reacción esperada.

### 🏁 Instrucciones en Pista
- [Consejos de pilotaje específicos para probar el cambio en las siguientes 4-5 vueltas]

3. **Bloque JSON de Aplicación Automática (OBLIGATORIO AL FINAL):**
Añade AL FINAL de tu respuesta el bloque JSON formateado exactamente así:

\`\`\`json ALR_AJUSTES_INI
{
  "id_del_campo": "nuevo_valor"
}
\`\`\`
Usa ÚNICAMENTE las claves/IDs de campo exactamente iguales a las provistas en la lista de parámetros. No modifiques campos no relevantes.
`;

  let chatHistoryStr = "";
  if (input.chatHistory && input.chatHistory.length > 0) {
    chatHistoryStr = `
=== HISTORIAL DE LA CONVERSACIÓN EN CHAT (TIEMPO REAL) ===
${input.chatHistory
  .map((m) => `${m.sender === "user" ? "PILOTO" : "INGENIERO ALR"}: ${m.text}`)
  .join("\n\n")}
`;
  }

  const prompt = `${systemInstructions}

=== DATOS DEL SETUP Y ENTORNO ACTIVO ===
- Vehículo: ${input.car}
- Circuito: ${input.track}
- Simulador: ${input.game}
- Temperatura de Pista: ${input.trackTemp || "No especificada"} °C
- Temperatura Ambiente: ${input.ambientTemp || "No especificada"} °C
- Notas del Piloto: ${input.notes || "Sin notas previas"}

=== PARÁMETROS Y VALORES DE REGLAJE ACTUALES ===
${JSON.stringify(input.fieldsSummary || input.currentValues, null, 2)}
${chatHistoryStr}
=== CONSULTA / PROBLEMA EN PISTA DEL PILOTO ===
"${input.userQuery}"
`;

  const rawText = await executeGeminiRequest(prompt, apiKey, input.image);
  return extraerAjustesIngeniero(rawText);
}

