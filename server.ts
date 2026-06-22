import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let geminiAI: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  if (!geminiAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    geminiAI = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return geminiAI;
}

// 1. STORYBOARD GENERATION
app.post("/api/storyboard", async (req: Request, res: Response) => {
  try {
    const { script, style, aspectRatio, files } = req.body;
    if (!script) {
      res.status(400).json({ error: "Script text is required" });
      return;
    }

    const ai = getGeminiAI();

    const systemInstruction = `Você é um Diretor Criativo e Diretor de Storyboard de Motion de nível mundial, especializado em animação de UI, anúncios de resposta direta, vídeos de marketing digital brasileiro (estilo Cakto, Suviegas, etc.) e storyboards prontos para produção.

Sua missão é transformar roteiros, briefings, documentos estratégicos e contexto criativo em um storyboard profissional e visualmente rico, pronto para um editor de vídeo executar.

REGRAS ABSOLUTAS:
1. TODOS os textos DEVEM estar em português do Brasil (pt-BR). Sem exceções.
2. Organize os shots em CENAS temáticas. Cada cena agrupa shots com tema visual/narrativo comum. Defina nomes de cenas descritivos como "Abertura — Impacto inicial", "Dashboard — Métricas ao vivo", "Encerramento — CTA final".
3. Cada shot recebe o nome da sua cena no campo "scene".
4. As descrições visuais devem ser RICAS, DETALHADAS e orientadas para produção: enquadramento, iluminação, movimento de câmera, elementos on-screen, animações de UI, tipografia cinética, cores.
5. O storyboard NÃO deve ser genérico. Deve refletir com precisão o conteúdo estratégico fornecido: produto, público, tom, argumentos de venda, elementos visuais mencionados.
6. Transforme contexto estratégico em decisões visuais: "empresa premium" → iluminação sofisticada, composição elegant, tipografia refinada. "urgência" → cortes rápidos, motion agressivo, elementos de destaque.
7. O voiceover de cada shot deve corresponder EXATAMENTE ao texto narrado naquele momento do vídeo.
8. Gere entre 8 e 14 shots bem cadenciados (mais shots = storyboard mais detalhado e utilizável).

Para o campo "aiImagePrompt" (em inglês, para modelos de geração de imagem internacionais):
- Descreva composição, enquadramento, iluminação cinematográfica, ângulo de câmera, paleta de cores, elementos visuais principais
- Estilo: ${style || 'Comercial Cinematográfico'}
- Nunca referencie texto na tela exceto overlays de UI ou tipografia animada`;

    const promptText = `Gere um storyboard profissional completo e pronto para produção com base no seguinte material:

---
ROTEIRO / BRIEFING PRINCIPAL:
${script}
---

Estilo Visual: ${style || 'Comercial Cinematográfico'}
Formato: ${aspectRatio || '16:9'}

INSTRUÇÕES EXTRAS:
- Divida em cenas (scenes) temáticas com nomes descritivos
- Gere 8 a 14 shots ricos e bem cadenciados
- Cada shot deve ter descrição visual detalhada, direção de câmera precisa, motion direction específico
- Voiceover deve ser exato ao que seria narrado naquele momento
- Todo conteúdo textual em português do Brasil`;

    // Build content parts — include uploaded files as context
    const contentParts: any[] = [];

    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.text) {
          contentParts.push({
            text: `\n\n### ARQUIVO DE REFERÊNCIA: "${file.name}"\n\n${file.text}\n\n---\n\n`
          });
        } else if (file.data && file.mimeType) {
          contentParts.push({
            inlineData: { mimeType: file.mimeType, data: file.data }
          });
        }
      }
    }

    contentParts.push({ text: promptText });

    const contentsPayload = contentParts.length === 1
      ? promptText
      : [{ role: "user", parts: contentParts }];

    const apiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentsPayload as any,
      config: {
        systemInstruction,
        temperature: 0.75,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            objective: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            duration: { type: Type.STRING },
            format: { type: Type.STRING },
            tone: { type: Type.STRING },
            visualDirection: {
              type: Type.OBJECT,
              properties: {
                artDirection: { type: Type.STRING },
                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                motionStyle: { type: Type.STRING },
                cameraStyle: { type: Type.STRING }
              },
              required: ["artDirection", "colorPalette", "motionStyle", "cameraStyle"]
            },
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER },
                  scene: { type: Type.STRING, description: "Nome da cena/sequência temática deste shot (ex: 'Abertura — Impacto inicial')" },
                  duration: { type: Type.STRING },
                  goal: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                  cameraDirection: { type: Type.STRING },
                  motionDirection: { type: Type.STRING },
                  transition: { type: Type.STRING },
                  voiceover: { type: Type.STRING },
                  editorNotes: { type: Type.STRING },
                  aiImagePrompt: { type: Type.STRING }
                },
                required: ["shotNumber", "scene", "duration", "goal", "visualDescription", "cameraDirection", "motionDirection", "transition", "voiceover", "editorNotes", "aiImagePrompt"]
              }
            },
            productionNotes: {
              type: Type.OBJECT,
              properties: {
                soundDesign: { type: Type.STRING },
                musicDirection: { type: Type.STRING },
                motionReferences: { type: Type.STRING },
                editingReferences: { type: Type.STRING }
              },
              required: ["soundDesign", "musicDirection", "motionReferences", "editingReferences"]
            }
          },
          required: ["title", "objective", "targetAudience", "duration", "format", "tone", "visualDirection", "shots", "productionNotes"]
        }
      }
    });

    const parsedJsonStr = apiResponse.text;
    if (!parsedJsonStr) throw new Error("No content from Gemini");

    res.json(JSON.parse(parsedJsonStr));
  } catch (error: any) {
    console.error("Storyboard generation error:", error);
    res.status(500).json({ error: "Falha na geração", details: error?.message });
  }
});

// 2. SUGGEST CONFIG
app.post("/api/suggest-config", async (req: Request, res: Response) => {
  try {
    const { briefing } = req.body;
    if (!briefing) { res.status(400).json({ error: "Briefing required" }); return; }

    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise este briefing/roteiro e sugira configurações para um storyboard de motion design. Responda APENAS com JSON válido, sem markdown.\n\nBriefing:\n${briefing}\n\nRetorne exatamente este formato:\n{\n  "duration": "30s",\n  "tones": ["Energético", "Inspirador"],\n  "audiences": ["B2B", "Empresários"],\n  "purpose": "ADS",\n  "colorPreset": "Tecnologia",\n  "style": "Comercial Cinematográfico"\n}\n\nValores válidos:\n- duration: 15s, 30s, 45s, 60s, 90s, 2min, 3min+\n- tones (máx 3): Urgente, Emocional, Autoridade, Premium, Inspirador, Luxuoso, Energético, Documental, Humorístico, Educativo\n- audiences (máx 3): B2B, Empresários, Donos de Agência, Criadores de Conteúdo, Infoprodutores, E-commerce, Atletas, Consumidor Final\n- purpose: ADS, Orgânico, Branding, Educacional\n- colorPreset: Minimalista, Corporativo, Luxo, Tecnologia, Esportivo, Cinema\n- style: Comercial Cinematográfico, Minimalista Tech (Dark / Glass), 3D Chrome (Octane Render), Cyberpunk Neon, UI Motion (App / SaaS), Esboço Editorial`,
      config: { responseMimeType: "application/json", temperature: 0.3 }
    });

    const json = JSON.parse(response.text || "{}");
    res.json(json);
  } catch (error: any) {
    console.error("Suggest config error:", error);
    res.status(500).json({ error: "Failed to suggest config" });
  }
});

// 3. FRAME IMAGE GENERATION
app.post("/api/generate-frame", async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Image prompt required" });
      return;
    }

    const ai = getGeminiAI();
    const cleanAspect = aspectRatio === "9:16" ? "9:16" : "16:9";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-image-generation",
      contents: {
        parts: [{
          text: `Professional cinematic storyboard concept art for video production. Commercial advertising style. Masterful lighting and composition: ${prompt}`
        }]
      } as any,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: cleanAspect }
      } as any
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          base64Image = (part as any).inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } else {
      throw new Error("No image data in response");
    }
  } catch (error: any) {
    console.error("Frame generation error:", error);
    res.status(500).json({ error: "Image generation failed", details: error?.message });
  }
});

// Serve frontend
async function setupVite() {
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
    console.log(`[Motion Storyboard AI] Running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
});
