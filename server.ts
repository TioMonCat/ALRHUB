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

async function fetchGeminiWithFallback(prompt: string, apiKey: string): Promise<string> {
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

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
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

    const { preguntaPiloto, contextoSetupsFirebase } = req.body;

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

    let contextString = "";
    if (contextoSetupsFirebase && contextoSetupsFirebase.length > 0) {
      contextString = `
=== DATOS OFICIALES DE SETUPS Y PISTA EN FIREBASE DEL EQUIPO ALR ===
${JSON.stringify(contextoSetupsFirebase, null, 2)}
`;
    }

    const prompt = `${systemInstructions}

${contextString}

=== CONSULTA DEL PILOTO EN BOX ===
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

    const rawText = await fetchGeminiWithFallback(prompt, apiKey);
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

