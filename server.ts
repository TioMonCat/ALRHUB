import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "Sim Racing Garage Manager" });
});

async function fetchGeminiWithFallback(prompt: string, apiKey: string): Promise<string> {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
  ];

  let lastErrorMsg = "";

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const geminiRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }

      const errorData = await geminiRes.json().catch(() => ({}));
      lastErrorMsg = errorData.error?.message || geminiRes.statusText;

      if (geminiRes.status === 400 || geminiRes.status === 401 || geminiRes.status === 403) {
        throw new Error(`Error en Gemini (${geminiRes.status}): ${lastErrorMsg}`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes("Error en Gemini")) {
        throw err;
      }
      lastErrorMsg = err.message;
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
Eres el "Ingeniero ALR", el Ingeniero Jefe de Pista Virtual del Equipo de Sim Racing ALR. Estás integrado directamente como el asistente de IA oficial dentro de la plataforma web del equipo.

REGLAS DE ACTUACIÓN:
1. Analizar el comportamiento dinámico, física y reglajes (GT3, LMP2, etc.) en Assetto Corsa (AC) y Assetto Corsa Competizione (ACC).
2. Prohibición de Setups desde Cero: No entregues setups completos a ciegas sin datos.
3. Fundamentación Técnica: Justifica cada cambio según física real (Transferencia de peso, Agarre mecánico, Carga aerodinámica).
4. Ajustes Incrementales: Recomienda cambios pequeños (1 a 3 clics o valores exactos en .ini).
5. FORMATO OBLIGATORIO DE RESPUESTA: Concluye obligatoriamente con la plantilla en Markdown:

### 📋 Resumen de Ajustes

* **[Parámetro / Sistema]:**
  * **Eje / Componente:** [Ej. Delantero / Trasero / Aerodinámica]
  * **Nombre en .ini / Pantalla AC:** \`[Ej. SPRING_RATE_LF / Dureza de Muelle]\`
  * **Valor Anterior:** \`[Valor anterior o N/A]\`
  * **Valor Nuevo Sugerido:** \`[Nuevo valor / Clics +/-]\`
  * **Efecto Esperado:** [Breve explicación del comportamiento físico esperado]

* **Instrucciones para el Piloto:** 
  * Rodar 4-5 vueltas limpias para asentar temperaturas/presiones y reportar sensaciones al box.
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

