import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "Sim Racing Garage Manager" });
});

async function fetchGeminiWithFallback(
  prompt: string,
  apiKey: string,
  image?: { data: string; mimeType: string }
): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const models = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  let lastErrorMsg = "";

  const contentsParts: any[] = [];
  if (image && image.data) {
    const cleanBase64 = image.data.replace(/^data:image\/\w+;base64,/, "");
    contentsParts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: image.mimeType || "image/jpeg",
      },
    });
  }
  contentsParts.push({ text: prompt });

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contentsParts,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Error al probar modelo ${model}:`, err?.message || err);
      lastErrorMsg = err?.message || String(err);
      if (err?.status === 400 || err?.status === 401 || err?.status === 403) {
        throw new Error(`Error en API Key de Gemini (${err.status}): ${lastErrorMsg}`);
      }
    }
  }

  throw new Error(`Error en Gemini: ${lastErrorMsg || "No se pudo conectar con ningún modelo."}`);
}

// Gemini Proxy Endpoints
app.post("/api/gemini/consultar", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "La API Key de Gemini no está configurada en las variables de entorno del servidor. Agrega tu clave en el panel de Secretos (Secrets) de AI Studio.",
      });
    }

    const { preguntaPiloto, contextoSetupsFirebase, chatHistory } = req.body;

    const systemInstructions = `
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual y Telemetría del Equipo de Sim Racing ALR.
Modelos IA en uso: Gemini 3.6 Flash.
Tus diagnósticos combinan conocimientos de física de competición real y simracing avanzado (Assetto Corsa, ACC, Le Mans Ultimate, rFactor 2).

CONOCIMIENTO TÉCNICO DE VEHÍCULO & DINÁMICA DE VEHÍCULOS:
- **Entrada a curva (Braking & Trailbraking):** Ajusta Reparto de Frenada (Brake Bias), Diff Coast (retención), y Muelles/ARB Delanteros.
- **Paso por curva (Mid-Corner Apex):** Ajusta Barras Estabilizadoras (ARB) Delantera vs Trasera y Caídas (Camber).
- **Salida de curva (Power Exit):** Ajusta Diff Power, Precarga (Preload), Amortiguación de rebote trasero y muelle trasero.
- **Balance Aerodinámico / Rake:** La diferencia de altura delante/atrás altera el centro de presión aerodinámico. Un frontal más bajo aumenta carga delante (reducen subviraje rápido), pero altura demasiado baja puede provocar rozamiento con el suelo (bottoming out).
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

    let contextString = "";
    if (contextoSetupsFirebase && contextoSetupsFirebase.length > 0) {
      contextString = `
=== DATOS OFICIALES DE SETUPS Y PISTA EN FIREBASE DEL EQUIPO ALR ===
${JSON.stringify(contextoSetupsFirebase, null, 2)}
`;
    }

    let chatHistoryStr = "";
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      chatHistoryStr = `
=== HISTORIAL DE LA CONVERSACIÓN EN CHAT (TIEMPO REAL) ===
${chatHistory.map((m: any) => `${m.sender === "user" ? "PILOTO" : "INGENIERO ALR"}: ${m.text}`).join("\n\n")}
`;
    }

    const prompt = `${systemInstructions}

${contextString}
${chatHistoryStr}
=== ÚLTIMA CONSULTA DEL PILOTO EN BOX ===
"${preguntaPiloto}"
`;

    const rawText = await fetchGeminiWithFallback(prompt, apiKey);
    res.json({ text: rawText || "No se obtuvo respuesta del Ingeniero ALR." });
  } catch (err: any) {
    console.error("Error en /api/gemini/consultar:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

app.post("/api/gemini/optimizar", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "La API Key de Gemini no está configurada en las variables de entorno del servidor. Agrega tu clave en el panel de Secretos (Secrets) de AI Studio.",
      });
    }

    const input = req.body;

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
2. **Respeto de IDs y Límites:** Usa estrictamente los IDs de campo que existen en la lista enviada. Respeta los límites min/max si están definidos.
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
    if (input.chatHistory && Array.isArray(input.chatHistory) && input.chatHistory.length > 0) {
      chatHistoryStr = `
=== HISTORIAL DE LA CONVERSACIÓN EN CHAT (TIEMPO REAL) ===
${input.chatHistory.map((m: any) => `${m.sender === "user" ? "PILOTO" : "INGENIERO ALR"}: ${m.text}`).join("\n\n")}
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

    const rawText = await fetchGeminiWithFallback(prompt, apiKey, input.image);
    res.json({ rawText });
  } catch (err: any) {
    console.error("Error en /api/gemini/optimizar:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://0.0.0.0:${PORT}`);
  });
}

startServer();

