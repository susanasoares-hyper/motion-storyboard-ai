import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Set up server-side limits and parsing
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Shared lazy-loaded Gemini SDK helper
let geminiAI: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  if (!geminiAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not defined or is placeholder. Using fallback structures.");
    }
    geminiAI = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiAI;
}

// 1. STORYBOARD GENERATION ROUTE
// Direct structured response format based on gemini-3.5-flash
app.post("/api/storyboard", async (req: Request, res: Response) => {
  try {
    const { script, style, aspectRatio } = req.body;
    if (!script) {
       res.status(400).json({ error: "Script text is required to generate a storyboard" });
       return;
    }

    const ai = getGeminiAI();

    const systemInstruction = `Você é um Diretor de Storyboard de Motion de nível mundial, especializado em animação de UI, anúncios de resposta direta, vídeos explicativos de SaaS, apresentações de produtos estilo Apple e storyboards para agências de marketing digital brasileiras (estilo Cakto, Suviegas, etc.).

Sua missão é transformar um roteiro, briefing, ideia ou conceito bruto em um documento de storyboard profissional e estruturado, pronto para produção.

REGRAS ABSOLUTAS — NUNCA DESCUMPRA:
1. TODOS os textos de saída DEVEM estar em português do Brasil (pt-BR). Sem exceções. Títulos, objetivos, descrições, narrações, notas — tudo em português.
2. Analise o texto de entrada e divida em momentos visuais cinematográficos claros (shots).
3. Garanta ritmo visual adequado, linguagem de câmera profissional e indicações de transição.
4. Cada shot deve ter narração (voiceover) coerente com o contexto, mesmo que seja instrumental ou ambiental.
5. As descrições visuais devem ser ricas, detalhadas e orientadas para produção audiovisual brasileira de alto nível.

Para o campo 'aiImagePrompt' de cada shot, crie um prompt profissional para modelos de geração de imagem (em inglês, pois são modelos internacionais):
- Composição extremamente detalhada, enquadramento (plano aberto, close extremo, macro, plano médio), iluminação (cinematográfica, dramática, luz suave de produto), lente, ângulo de câmera, cores, elementos-chave e ambiente.
- Adaptado ao estilo de Direção de Arte selecionado: "${style || 'Comercial Cinematográfico'}".
- As descrições de frames devem ser altamente visuais, focadas em ação e ideais para tratamentos publicitários.
- NUNCA referencie texto na tela no prompt, exceto se for parte de um dashboard de UI flutuante ou sobreposições de tipografia elegante.`;

    const promptText = `Gere um documento de storyboard completo e pronto para produção para o seguinte roteiro/briefing:
---
ROTEIRO / BRIEFING:
${script}
---

Estilo Selecionado: ${style || 'Comercial Cinematográfico'}
Proporção do Storyboard: ${aspectRatio || '16:9'}

Divida em uma lista otimizada de shots (busque de 4 a 8 shots visualmente ricos e bem cadenciados) e forneça os metadados gerais do projeto conforme solicitado.
IMPORTANTE: Todo o conteúdo textual do storyboard (título, objetivo, público-alvo, tom, descrições de shots, narrações, notas) DEVE estar em português do Brasil.`;

    const apiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy, corporate-agency style title for this commercial concept" },
            objective: { type: Type.STRING, description: "The strategic video objective or core goal" },
            targetAudience: { type: Type.STRING, description: "Detailed target audience description" },
            duration: { type: Type.STRING, description: "Estimated total run time of the script" },
            format: { type: Type.STRING, description: "Video aspect ratio format (e.g. 16:9 Landscape Video, 9:16 Portrait TikTok)" },
            tone: { type: Type.STRING, description: "Dynamic tone adjectives" },
            visualDirection: {
              type: Type.OBJECT,
              properties: {
                artDirection: { type: Type.STRING, description: "Visual aesthetic summary" },
                colorPalette: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Hex values code palette matching the visual direction, exactly 4-5 hex values"
                },
                motionStyle: { type: Type.STRING, description: "The design pacing and kinetics style" },
                cameraStyle: { type: Type.STRING, description: "The overarching lens and tracking choice" }
              },
              required: ["artDirection", "colorPalette", "motionStyle", "cameraStyle"]
            },
            shots: {
              type: Type.ARRAY,
              description: "The chronologically ordered lists of production shots",
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER, description: "Sequential integer starting at 1" },
                  duration: { type: Type.STRING, description: "Time-code increment (e.g. 0:00 - 0:03)" },
                  goal: { type: Type.STRING, description: "Production goal of this specific shot" },
                  visualDescription: { type: Type.STRING, description: "Detailed look of characters, devices, UI overlays, actions, backgrounds" },
                  cameraDirection: { type: Type.STRING, description: "Tracking instruction (e.g. Dolly in, Drone tracking, Handheld, Pivot orbit)" },
                  motionDirection: { type: Type.STRING, description: "UI action, motion graphics overlay or scale directions (e.g., Number count-up, Card swipe)" },
                  transition: { type: Type.STRING, description: "Slick cutting style (e.g. Match cut, Whip pan, Morph cut)" },
                  voiceover: { type: Type.STRING, description: "The specific voiceover block, narration, or on-screen copy matching this shot duration" },
                  editorNotes: { type: Type.STRING, description: "Notes like 'Sync with beat-drop', 'Add whoosh sound effect', 'Use speed ramping'" },
                  aiImagePrompt: { type: Type.STRING, description: "The hyper-detailed creative prompt for image generation models to visualize this frame" }
                },
                required: [
                  "shotNumber",
                  "duration",
                  "goal",
                  "visualDescription",
                  "cameraDirection",
                  "motionDirection",
                  "transition",
                  "voiceover",
                  "editorNotes",
                  "aiImagePrompt"
                ]
              }
            },
            productionNotes: {
              type: Type.OBJECT,
              properties: {
                soundDesign: { type: Type.STRING, description: "Foley, whooshes, SFX ideas" },
                musicDirection: { type: Type.STRING, description: "Rhythm, references, beats per minute" },
                motionReferences: { type: Type.STRING, description: "Existing aesthetic lookalikes (e.g., Apple launch film, Linear dashboard transition)" },
                editingReferences: { type: Type.STRING, description: "Vibe matches" }
              },
              required: ["soundDesign", "musicDirection", "motionReferences", "editingReferences"]
            }
          },
          required: [
            "title", 
            "objective", 
            "targetAudience", 
            "duration", 
            "format", 
            "tone", 
            "visualDirection", 
            "shots", 
            "productionNotes"
          ]
        }
      }
    });

    const parsedJsonStr = apiResponse.text;
    if (!parsedJsonStr) {
      throw new Error("No response content generated from Gemini model");
    }

    const parsedData = JSON.parse(parsedJsonStr);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Storyboard generation error:", error);
    res.status(500).json({ 
      error: "Failed to parse script using Gemini AI", 
      details: error?.message || "Check server console fields or API credentials"
    });
  }
});

// 2. IMAGE FRAME GENERATION ROUTE
// Uses gemini-2.5-flash-image for standard image generation
app.post("/api/generate-frame", async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) {
       res.status(400).json({ error: "Image prompt has not been specified" });
       return;
    }

    const ai = getGeminiAI();
    const cleanAspect = aspectRatio === "9:16" ? "9:16" : "16:9";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `Professional cinematic high-contrast detailed video advertising storyboard concept art. Style is sleek commercial design. Masterful lighting: ${prompt}`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: cleanAspect,
        }
      }
    });

    let base64Image = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } else {
      throw new Error("Image data was missing in response parts");
    }
  } catch (error: any) {
    console.error("Frame generation error details:", error);
    res.status(500).json({ 
      error: "Model generation failed", 
      details: error?.message || "May require checking API credits, quota or using standard mock visuals"
    });
  }
});

// Serve frontend assets
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
    console.log(`[Motion Storyboard AI] Full-stack server running on host 0.0.0.0, port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to bootstrap Vite middleware server:", err);
});
