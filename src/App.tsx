/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2, 
  ArrowLeftRight, 
  Printer, 
  Clock, 
  Camera, 
  Video, 
  Music, 
  Volume2, 
  Edit, 
  Save, 
  FileText, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Palette, 
  Maximize2, 
  Play, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Shuffle, 
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Storyboard, Shot, VisualDirection, ProductionNotes } from "./types";
import { INITIAL_STORYBOARD } from "./data";

export default function App() {
  // Main state holding the current active storyboard
  const [storyboard, setStoryboard] = useState<Storyboard>(INITIAL_STORYBOARD);
  
  // Selection/Focus states
  const [activeShotId, setActiveShotId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"visuals" | "metadata" | "production">("visuals");
  
  // Custom manual prompt input & UI control states
  const [userInput, setUserInput] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("Minimalist Tech");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"16:9" | "9:16">("16:9");
  
  // PDF/Print preview active overlay state
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [printVersion, setPrintVersion] = useState<string>("v1.0");
  const [printDate, setPrintDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Loading & network status states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingStatus, setGeneratingStatus] = useState<string>("");
  const [imageGeneratingState, setImageGeneratingState] = useState<{ [shotId: string]: boolean }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Auto-scroll ref to move the focus details into view
  const topGalleryRef = useRef<HTMLDivElement>(null);
  const activeFocusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyboard.shots.length > 0) {
      const exists = storyboard.shots.find(s => s.id === activeShotId);
      if (!exists) {
        setActiveShotId(storyboard.shots[0].id);
      }
    } else {
      setActiveShotId("");
    }
  }, [storyboard.shots, activeShotId]);

  const activeShot = storyboard.shots.find(s => s.id === activeShotId) || storyboard.shots[0] || null;

  // 1. FALLBACK OFFLINE GENERATOR (Saves user experience if API Keys are not set up yet)
  const executeClientFallback = (scriptText: string, artStyle: string, aspect: "16:9" | "9:16") => {
    // Generate a beautiful storyboard structure locally using client parsing
    const normalizedText = scriptText.replace(/\[Visual Style[^\]]*\]/gi, "");
    
    // Split into sentences or shot markers
    const blocks = normalizedText
      .split(/(?:\[\d+:\d+[^\]]*\]|SHOT \d+|\n\n)/i)
      .map(s => s.trim())
      .filter(s => s.length > 25);

    const generatedShots: Shot[] = [];
    const colorPalettes: { [key: string]: string[] } = {
      "Cinematic Commercial": ["#0F172A", "#334155", "#64748B", "#F59E0B", "#F8FAFC"],
      "Minimalist Tech": ["#08090D", "#1E293B", "#38BDF8", "#F1F5F9", "#FFFFFF"],
      "Hand-drawn Storyboard": ["#1C1A17", "#44403C", "#78716C", "#D6D3D1", "#F5F5F4"],
      "3D Render Chrome": ["#171717", "#262626", "#8B5CF6", "#EC4899", "#FAFAFA"],
      "Cyberpunk Neon": ["#0B0314", "#1E0B36", "#FF007F", "#00F0FF", "#FDFDFD"],
      "Vintage Editorial": ["#1E1B18", "#4A3E3D", "#8C6A5C", "#D9C3B0", "#F7F5F0"]
    };

    const stylesCameraMap: { [key: string]: { cameras: string[], motions: string[], transitions: string[] } } = {
      "Cinematic Commercial": {
        cameras: ["Dolly in slow angle", "High speed tracking crane", "Golden hour rim orbit", "Low angle heroic pan"],
        motions: ["Water splash explosion", "Sleek lens flare pan", "Dramatic dark sweep", "Hyper speed-ramp cut"],
        transitions: ["Whip pan slide", "Light flash cut", "Hard cinematic beat cut", "Fade to soft focus"]
      },
      "Minimalist Tech": {
        cameras: ["Overhead metric focus", "Dolly in 45-degree isometric", "Sleek macro UI zoom", "Subtle floating tilt"],
        motions: ["Inertia snap element load", "Counter counts up to 100", "Glass window glide", "Cursor swipe trail"],
        transitions: ["Clean push slide", "Soft focus wipe", "Instant UI snap", "Grid cross dissolve"]
      }
    };

    const presetDirection = stylesCameraMap[artStyle] || stylesCameraMap["Cinematic Commercial"];
    const activePalette = colorPalettes[artStyle] || colorPalettes["Cinematic Commercial"];

    const defaultTitle = scriptText.slice(0, 30).trim() + "... Storyboard";
    const segmentCount = Math.max(3, Math.min(6, blocks.length || 4));

    for (let i = 0; i < segmentCount; i++) {
      const shotNum = i + 1;
      const originalText = blocks[i] || `Detailed visual reveal of client campaign elements for segment scene ${shotNum}.`;
      
      // Smart pull voiceover if containing VO: or quotes
      let voiceoverText = originalText;
      let visualText = originalText;
      
      const voMatch = originalText.match(/(?:VO|Voiceover|Narration):\s*"([^"]+)"/i);
      if (voMatch) {
         voiceoverText = voMatch[1];
         visualText = originalText.replace(/(?:VO|Voiceover|Narration):\s*"[^"]+"/i, "").trim();
      } else {
         const firstQuote = originalText.match(/"([^"]+)"/);
         if (firstQuote) {
           voiceoverText = firstQuote[1];
           visualText = originalText.replace(/"[^"]+"/,"").trim();
         } else {
           voiceoverText = "Dynamic ambient cinematic background melody plays synchronously.";
         }
      }

      // Format clean prompts
      const cleanedVisual = visualText.replace(/\[[^\]]*\]/g, "").slice(0, 160);
      const imagePromptForShot = `${artStyle} design of ${cleanedVisual}. Masterful commercial lighting, pristine advertisement mockup, professional cinematic framing style, matching palette: ${activePalette.join(", ")}.`;

      // Formulate timing string
      const startSec = i * 3;
      const endSec = (i + 1) * 3;
      const durationFmt = `0:${startSec < 10 ? "0" + startSec : startSec} - 0:${endSec < 10 ? "0" + endSec : endSec}`;

      generatedShots.push({
        id: `shot-offline-${shotNum}-${Date.now()}`,
        shotNumber: shotNum,
        duration: durationFmt,
        goal: `Highlight primary benefits of Section ${shotNum} in the video workflow.`,
        visualDescription: visualText.replace(/\[|\]/g, ""),
        cameraDirection: presetDirection.cameras[i % presetDirection.cameras.length],
        motionDirection: presetDirection.motions[i % presetDirection.motions.length],
        transition: presetDirection.transitions[i % presetDirection.transitions.length],
        voiceover: voiceoverText,
        editorNotes: `Sync key cuts precisely to the beat. Enhance foley with crisp cinematic layers.`,
        aiImagePrompt: imagePromptForShot,
        // Premium locked Pollination image to look highly polished instantly
        imageUrl: `https://images.unsplash.com/photo-${[
          "1618005182384-a83a8bd57fbe",
          "1634017839464-5c339ebe3cb4",
          "1550751827-4bd374c3f58b",
          "1614741118887-7a4ee193a5fa",
          "1600132806370-bf17e65e942f",
          "1541701494587-cb58502866ab"
        ][i % 6]}?w=800&auto=format&fit=crop&q=80`
      });
    }

    const fallStoryboard: Storyboard = {
      id: `sb-offline-${Date.now()}`,
      title: "Interactive Storyboard Treatment",
      objective: "Achieve direct response brand relevance through an aesthetic presentation.",
      targetAudience: "Primary campaign targets and system stakeholders.",
      duration: `${segmentCount * 3} Seconds`,
      format: aspect === "16:9" ? "16:9 Landscape Video" : "9:16 Portrait TikTok",
      tone: "Sleek, High-Impact, Cinematic",
      aspectRatio: aspect,
      createdAt: new Date().toISOString().split('T')[0],
      visualDirection: {
        artDirection: `${artStyle} themed visual styling matching high-fidelity output criteria.`,
        colorPalette: activePalette,
        motionStyle: "Ultra-dynamic organic animations combined with clean typography overrides.",
        cameraStyle: "Sleek sweeping angles and crisp modern close ups."
      },
      shots: generatedShots,
      productionNotes: {
        soundDesign: "Immersive foley clicks, acoustic build ups and premium sound sweeps.",
        musicDirection: "Energetic digital synthesizer beats, adjusted dynamically at 115 BPM.",
        motionReferences: "Linear.app video designs, Apple high-motion launches.",
        editingReferences: "Slick cutting, aggressive tracking and slow-mo speed rampings."
      }
    };

    setStoryboard(fallStoryboard);
    setActiveShotId(fallStoryboard.shots[0].id);
  };

  // 2. TRIGGER GENERATE FROM BACKEND (Calls server-side Gemini 3.5-flash)
  const handleGenerateStoryboard = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setWarningMessage(null);
    setGeneratingStatus("Analisando estrutura do roteiro com Gemini AI...");

    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: userInput,
          style: selectedStyle,
          aspectRatio: selectedAspectRatio
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      setGeneratingStatus("Estruturando timings, câmeras e prompts gráficos...");
      const result = await response.json();

      if (result && result.shots && result.shots.length > 0) {
        // Map individual shots to add IDs and beautiful preview templates via Pollinations
        // This ensures the visual storyboard loads instantly with gorgeous imagery of the script!
        const parsedShots = result.shots.map((s: Partial<Shot>, idx: number) => {
          const num = s.shotNumber || (idx + 1);
          // Generate a beautifully styled background from Pollinations based on the exact AI Image Prompt!
          const visualSeeds = [
            "1618005182384-a83a8bd57fbe",
            "1634017839464-5c339ebe3cb4",
            "1550751827-4bd374c3f58b",
            "1614741118887-7a4ee193a5fa",
            "1600132806370-bf17e65e942f"
          ];
          const querySafePrompt = encodeURIComponent(
            `${selectedStyle} visual of: ${s.aiImagePrompt || s.visualDescription}. Commercial advertisement, 8k cinematic masterpiece.`
          );
          
          return {
            id: `shot-${num}-${Date.now()}`,
            shotNumber: num,
            duration: s.duration || `0:0${idx * 3} - 0:0${(idx + 1) * 3}`,
            goal: s.goal || "Advance visual segment theme",
            visualDescription: s.visualDescription || "A beautiful visual scenario overlay.",
            cameraDirection: s.cameraDirection || "Smooth dolly in",
            motionDirection: s.motionDirection || "Ambient screen adjustments",
            transition: s.transition || "Soft cut",
            voiceover: s.voiceover || "",
            editorNotes: s.editorNotes || "Keep fluid pacing",
            aiImagePrompt: s.aiImagePrompt || "Product shot on table",
            // Give them a gorgeous, matching dynamic image!
            imageUrl: `https://image.pollinations.ai/p/${querySafePrompt}?width=800&height=500&seed=${num}&nologo=true`
          };
        });

        const newStoryboard: Storyboard = {
          id: `sb-${Date.now()}`,
          title: result.title || "Custom Commercial Concept",
          objective: result.objective || "Strategic business video overview",
          targetAudience: result.targetAudience || "Target demographics",
          duration: result.duration || `${parsedShots.length * 3}s`,
          format: result.format || `${selectedAspectRatio} Landscape Video`,
          tone: result.tone || "Sleek and Premium",
          aspectRatio: selectedAspectRatio,
          createdAt: new Date().toISOString().split('T')[0],
          visualDirection: {
            artDirection: result.visualDirection?.artDirection || `${selectedStyle} aesthetics.`,
            colorPalette: result.visualDirection?.colorPalette || ["#0F172A", "#1E293B", "#38BDF8", "#F1F5F9", "#FFFFFF"],
            motionStyle: result.visualDirection?.motionStyle || "Fluid keyframes",
            cameraStyle: result.visualDirection?.cameraStyle || "Macro tracking"
          },
          shots: parsedShots,
          productionNotes: {
            soundDesign: result.productionNotes?.soundDesign || "Sleek audio cues",
            musicDirection: result.productionNotes?.musicDirection || "Tech ambient track",
            motionReferences: result.productionNotes?.motionReferences || "Modern SaaS film",
            editingReferences: result.productionNotes?.editingReferences || "Dynamic speed ramps"
          }
        };

        setStoryboard(newStoryboard);
        setActiveShotId(newStoryboard.shots[0].id);
        
        // Auto-scroll layout to top gallery
        if (topGalleryRef.current) {
          topGalleryRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        throw new Error("Estrutura inválida retornada pelo servidor.");
      }
    } catch (err: any) {
      console.warn("Backend fail or missing key, deploying clever client fallback", err);
      // Run fallback so that the user receives a fully structured storyboard INSTANTLY
      executeClientFallback(userInput, selectedStyle, selectedAspectRatio);
      setWarningMessage("Atenção: Operando em modo de simulação local pois GEMINI_API_KEY não está definida. Configure a variável GEMINI_API_KEY para ativar a análise completa do modelo.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. GENERATE ADVANCED IMAGE FRAME VIA BACKEND (Uses gemini-2.5-flash-image)
  const handleGenerateFrameImage = async (shotId: string, customPrompt: string) => {
    setImageGeneratingState(prev => ({ ...prev, [shotId]: true }));
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${selectedStyle} style: ${customPrompt}`,
          aspectRatio: selectedAspectRatio
        })
      });

      if (!response.ok) {
        throw new Error("Visual generation model returned an error");
      }

      const result = await response.json();
      if (result.imageUrl) {
        // Update the shot's image in state
        setStoryboard(prev => ({
          ...prev,
          shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: result.imageUrl } : s)
        }));
      } else {
        throw new Error("Missing binary image path in server JSON response");
      }
    } catch (err: any) {
      console.error("Advanced image generation failed, falling back to secure pollination seed update", err);
      // Fallback: Refresh the pollination seed randomly to look entirely fresh!
      const randomSeed = Math.floor(Math.random() * 1000) + 1;
      const querySafe = encodeURIComponent(`${selectedStyle} direction: ${customPrompt}`);
      const freshUrl = `https://image.pollinations.ai/p/${querySafe}?width=800&height=500&seed=${randomSeed}&nologo=true`;
      
      setStoryboard(prev => ({
        ...prev,
        shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: freshUrl } : s)
      }));
    } finally {
      setImageGeneratingState(prev => ({ ...prev, [shotId]: false }));
    }
  };

  // 4. INTERACTIVE STATE MODIFIERS (Duplication, sorting, and inline updates)
  const handleUpdateShotField = (shotId: string, field: keyof Shot, value: any) => {
    setStoryboard(prev => ({
      ...prev,
      shots: prev.shots.map(s => s.id === shotId ? { ...s, [field]: value } : s)
    }));
  };

  const handleUpdateMetaField = (section: 'visualDirection' | 'productionNotes', field: string, value: any) => {
    setStoryboard(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleUpdateProjectField = (field: 'title' | 'objective' | 'targetAudience' | 'tone' | 'duration', value: string) => {
    setStoryboard(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDuplicateShot = (shotToCopy: Shot) => {
    const currentIdx = storyboard.shots.findIndex(s => s.id === shotToCopy.id);
    const newId = `shot-dup-${Date.now()}`;
    const newShot: Shot = {
      ...shotToCopy,
      id: newId,
      shotNumber: storyboard.shots.length + 1,
      duration: "0:00 - 0:00" // Reset to allow manual timing adjustments
    };

    const updatedShots = [...storyboard.shots];
    updatedShots.splice(currentIdx + 1, 0, newShot);
    
    // Recalculate numbering chronologically
    const normalizedShots = updatedShots.map((s, index) => ({
      ...s,
      shotNumber: index + 1
    }));

    setStoryboard(prev => ({ ...prev, shots: normalizedShots }));
    setActiveShotId(newId);
  };

  const handleDeleteShot = (shotId: string) => {
    if (storyboard.shots.length <= 1) {
      alert("Um storyboard deve conter pelo menos um shot.");
      return;
    }

    const filtered = storyboard.shots.filter(s => s.id !== shotId);
    // Recalculate listing
    const normalized = filtered.map((s, idx) => ({
      ...s,
      shotNumber: idx + 1
    }));

    setStoryboard(prev => ({ ...prev, shots: normalized }));
  };

  const handleMoveShot = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= storyboard.shots.length) return;

    const reordered = [...storyboard.shots];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // Recalculate card numbers
    const normalized = reordered.map((s, idx) => ({
      ...s,
      shotNumber: idx + 1
    }));

    setStoryboard(prev => ({ ...prev, shots: normalized }));
  };

  const handleAddBlankShot = () => {
    const newId = `shot-new-${Date.now()}`;
    const newNum = storyboard.shots.length + 1;
    const blankShot: Shot = {
      id: newId,
      shotNumber: newNum,
      duration: `0:0${(newNum - 1) * 3} - 0:0${newNum * 3}`,
      goal: "Introduce client feature segment.",
      visualDescription: "Describe exactly what visual structures are shown on the camera frame.",
      cameraDirection: "Smooth dynamic pan",
      motionDirection: "Sleek movement",
      transition: "Match cut",
      voiceover: "Introduce your voiceover copy lines here.",
      editorNotes: "E.g. Fast speed ramp cut",
      aiImagePrompt: "Cinematic commercial mockup, product centered on clean studio set.",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
    };

    setStoryboard(prev => ({
      ...prev,
      shots: [...prev.shots, blankShot]
    }));
    setActiveShotId(newId);
    
    // Smooth scroll into focus
    setTimeout(() => {
      activeFocusRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans selection:bg-[#FF4E00] selection:text-white">
      
      {/* HEADER BAR */}
      <header className="border-b border-zinc-800 bg-[#0F0F0F]/90 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#FF4E00] flex items-center justify-center shadow-md shadow-orange-950/20">
            <Sparkles className="h-5 w-5 text-white font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest uppercase font-mono font-bold text-[#FF4E00]">Estúdio de Vídeo IA</span>
              <span className="bg-zinc-800 text-[10px] text-zinc-300 px-1.5 py-0.5 rounded font-mono">Fullstack</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight font-display text-white">Motion Storyboard AI</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowPrintPreview(!showPrintPreview)}
            disabled={storyboard.shots.length === 0}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              showPrintPreview
                ? "bg-[#FF4E00]/10 text-[#FF4E00] border border-[#FF4E00]/30"
                : "bg-zinc-800/80 text-zinc-200 border border-zinc-700 hover:bg-zinc-750"
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{showPrintPreview ? "Voltar ao Workspace" : "Imprimir PDF"}</span>
          </button>
        </div>
      </header>

      {/* WARNING OVERLAYS */}
      {warningMessage && (
        <div className="bg-[#FF4E00]/10 border-b border-[#FF4E00]/20 px-4 py-2 text-xs text-orange-400 no-print flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-[#FF4E00] flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button onClick={() => setWarningMessage(null)} className="text-[10px] uppercase font-bold text-[#FF4E00] hover:text-orange-400 px-2 cursor-pointer">Fechar</button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 text-xs text-rose-300 no-print flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Erro:</span> {errorMessage}
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-zinc-400 hover:text-white px-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-[1700px] w-full mx-auto gap-6">
        
        {showPrintPreview ? (
          /* ========================================================= */
          /* PRINT PREVIEW / PDF PLAYOUT CHANNEL */
          /* ========================================================= */
          <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-xl shadow-2xl border border-slate-300 flex flex-col gap-8 max-w-5xl mx-auto w-full transition-all">
            
            {/* Printable Controls Header (hides on print itself) */}
            <div className="no-print bg-zinc-900 p-4 rounded-lg flex flex-wrap gap-4 items-center justify-between border border-zinc-800">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-[#FF4E00]" />
                <div>
                  <h4 className="font-bold text-xs text-white">Imprimir Deck de Storyboard</h4>
                  <p className="text-[11px] text-zinc-400">Configure o cabeçalho antes de imprimir.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span>Versão:</span>
                  <input 
                    type="text" 
                    value={printVersion} 
                    onChange={(e) => setPrintVersion(e.target.value)}
                    className="w-16 bg-zinc-950 border border-zinc-800 text-white px-2 py-1 rounded text-xs font-bold font-mono focus:ring-1 focus:ring-[#FF4E00] outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span>Data:</span>
                  <input 
                    type="date" 
                    value={printDate} 
                    onChange={(e) => setPrintDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-white px-2 py-1 rounded text-xs font-bold font-mono focus:ring-1 focus:ring-[#FF4E00] outline-none"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleTriggerPrint}
                  className="bg-[#FF4E00] hover:brightness-110 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="text-xs text-zinc-400 hover:bg-zinc-800 px-3 py-2 rounded cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>

            {/* PITCH DECK MASTER */}
            <div className="print-header border-b-2 border-slate-900 pb-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold tracking-wider text-slate-500">
                <span>STORYBOARD PROFISSIONAL PRONTO PARA PRODUÇÃO</span>
                <span>{printDate} | VERSION {printVersion}</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight font-display text-slate-900">{storyboard.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs mt-3">
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">Objetivo Estratégico</span>
                  <p className="text-slate-800 leading-relaxed font-serif mt-1">{storyboard.objective}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">Público-Alvo</span>
                  <p className="text-slate-800 leading-relaxed font-serif mt-1">{storyboard.targetAudience}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs mt-2 border-t border-slate-200 pt-3">
                <div><span className="font-bold text-slate-400">Duração:</span> <span className="font-semibold text-slate-800">{storyboard.duration}</span></div>
                <div><span className="font-bold text-slate-400">Formato:</span> <span className="font-semibold text-slate-800">{storyboard.format}</span></div>
                <div><span className="font-bold text-slate-400">Tom Criativo:</span> <span className="font-semibold text-slate-800">{storyboard.tone}</span></div>
                <div><span className="font-bold text-slate-400">Estilo Visual:</span> <span className="font-semibold text-slate-800">{storyboard.visualDirection.artDirection}</span></div>
              </div>
            </div>

            {/* PDF FRAMES GRID */}
            <div className="print-card-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              {storyboard.shots.map((shot) => (
                <div key={shot.id} className="print-card border border-slate-200 rounded-lg p-5 bg-white shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 text-xs font-bold font-mono">
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded text-[11px] tracking-wider font-display">SHOT {shot.shotNumber < 10 ? `0${shot.shotNumber}` : shot.shotNumber}</span>
                    <span className="text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {shot.duration}</span>
                  </div>

                  <div className="relative aspect-video bg-slate-100 border border-slate-200 rounded overflow-hidden">
                    <img 
                      src={shot.imageUrl} 
                      alt={`Shot ${shot.shotNumber}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                      {shot.cameraDirection}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div>
                      <span className="font-bold uppercase text-[9px] tracking-widest text-slate-400 block">Objetivo / Visual:</span>
                      <p className="text-slate-800 mt-0.5 leading-relaxed font-serif">{shot.visualDescription}</p>
                    </div>
                    {shot.voiceover && (
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-bold uppercase text-[9px] tracking-widest text-[#B45309] block">Narração (Voz):</span>
                        <p className="text-slate-700 italic mt-0.5 leading-relaxed">"{shot.voiceover}"</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 border-t pt-2 mt-1 border-slate-100 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-400 block uppercase text-[8px]">Movimento</span>
                        <span className="text-slate-800">{shot.motionDirection}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 block uppercase text-[8px]">Transição</span>
                        <span className="text-slate-800">{shot.transition}</span>
                      </div>
                    </div>
                    {shot.editorNotes && (
                      <div className="border-t pt-2 mt-1 border-slate-100 text-[10px] text-slate-500 font-mono">
                        <span className="font-bold block uppercase text-[8px] tracking-widest">Nota de Produção</span>
                        {shot.editorNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ART DIRECTION META BLOCK */}
            <div className="print-page-break border-t-2 border-slate-950 pt-6 mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-850">
              <div className="flex flex-col gap-3">
                <h3 className="font-bold uppercase tracking-wider border-b text-slate-900 pb-1 text-sm font-display">Paleta de Direção de Arte</h3>
                <div className="flex flex-col gap-1">
                  <div><strong>Estética Visual:</strong> {storyboard.visualDirection.artDirection}</div>
                  <div><strong>Estilo de Motion Design:</strong> {storyboard.visualDirection.motionStyle}</div>
                  <div><strong>Câmera:</strong> {storyboard.visualDirection.cameraStyle}</div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-semibold">Paleta de Cores:</span>
                  <div className="flex gap-1.5">
                    {storyboard.visualDirection.colorPalette.map((color, i) => (
                      <div key={i} className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border">
                        <div className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: color }} />
                        <span className="font-mono text-[9px]">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="font-bold uppercase tracking-wider border-b text-slate-900 pb-1 text-sm font-display">Áudio & Referências de Filme</h3>
                <div className="flex flex-col gap-1.5 font-serif">
                  <div><strong>Som & Foley:</strong> {storyboard.productionNotes.soundDesign}</div>
                  <div><strong>Direção Musical (Gênero/BPM):</strong> {storyboard.productionNotes.musicDirection}</div>
                  <div><strong>Referências de Movimento:</strong> {storyboard.productionNotes.motionReferences}</div>
                  <div><strong>Estilo de Edição:</strong> {storyboard.productionNotes.editingReferences}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 flex items-center justify-between text-zinc-400 hover:text-zinc-500 mt-6 no-print">
              <span>Quer refinar mais algum detalhe?</span>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="bg-[#FF4E00] hover:brightness-110 font-bold text-white text-xs px-4 py-1.5 rounded-lg transition cursor-pointer"
              >
                Voltar ao Workspace
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* MAIN WORKSPACE DESIGN WORKPANEL */
          /* ========================================================= */
          <div className="flex flex-col gap-6">

            {/* GALLERY SLIDE STRIP (TOP AREA) */}
            <section ref={topGalleryRef} className="bg-[#0F0F0F] border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/85 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00]">
                    <Layers className="h-3 w-3" />
                  </span>
                  <h3 className="font-bold text-sm tracking-wide uppercase font-display text-white">Galeria de Cards do Storyboard</h3>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{storyboard.shots.length} Shots no total</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleAddBlankShot}
                    className="flex items-center gap-1 bg-[#FF4E00] hover:brightness-110 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md shadow-orange-950/20 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-white" />
                    <span>Inserir Novo Shot</span>
                  </button>
                </div>
              </div>

              {/* CARD CONTAINER (HORIZONTAL SCROLLER) */}
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x touch-pan-x min-h-[180px]">
                {storyboard.shots.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8 px-4">
                    <Layers className="h-8 w-8 text-zinc-700" />
                    <p className="text-zinc-500 text-xs font-mono">Nenhum shot ainda — gere seu storyboard abaixo</p>
                  </div>
                )}
                {storyboard.shots.map((shot, index) => {
                  const isActive = shot.id === activeShotId;
                  return (
                    <div 
                      key={shot.id}
                      onClick={() => setActiveShotId(shot.id)}
                      className={`flex-shrink-0 w-[270px] sm:w-[300px] snap-start rounded-xl overflow-hidden transition-all duration-200 relative group cursor-pointer ${
                        isActive 
                          ? "bg-zinc-900 border border-zinc-805 ring-2 ring-[#FF4E00] shadow-lg shadow-[#FF4E00]/5 translate-y-[-2px]" 
                          : "bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80"
                      }`}
                    >
                      {/* Image Frame Layer */}
                      <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                        {imageGeneratingState[shot.id] ? (
                          <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur flex flex-col items-center justify-center gap-2 text-xs text-orange-400">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="font-mono text-[10px]">Gerando Frame...</span>
                          </div>
                        ) : (
                          <img 
                            src={shot.imageUrl} 
                            alt={`Shot ${shot.shotNumber} frame`} 
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Badges Overlays */}
                        <div className="absolute bottom-2 left-2 bg-[#0F0F0F]/90 backdrop-blur text-[10px] text-white px-2 py-0.5 rounded font-mono font-bold tracking-tight">
                          {shot.cameraDirection || "Static Camera"}
                        </div>

                        <div className="absolute top-2 left-2 bg-[#FF4E00] text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          SHOT {shot.shotNumber < 10 ? `0${shot.shotNumber}` : shot.shotNumber}
                        </div>

                        <div className="absolute top-2 right-2 bg-[#0F0F0F]/90 backdrop-blur text-zinc-300 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          <span>{shot.duration || "0:03"}</span>
                        </div>
                      </div>

                      {/* Info segment */}
                      <div className="p-3.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1.5 border-b border-zinc-800/50">
                          <span className="text-[#FF4E00] font-bold max-w-[140px] truncate">{shot.goal || "Objetivo do Shot"}</span>
                          <span className="bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 font-semibold">{shot.transition}</span>
                        </div>

                        <p className="text-xs text-zinc-300 line-clamp-2 h-8 font-serif leading-relaxed">
                          {shot.visualDescription}
                        </p>

                        {shot.voiceover ? (
                          <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800/40 text-[10.5px] text-zinc-400 truncate font-serif italic text-left">
                            VO: "{shot.voiceover}"
                          </div>
                        ) : (
                          <div className="h-5 text-[10.5px] text-zinc-600 font-mono italic">Sem narração</div>
                        )}

                        {/* Interactive Sort & Layer Actions (Hides standard when index limits hit) */}
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50 opacity-0 group-hover:opacity-100 transition duration-150">
                          <div className="flex items-center gap-1">
                            <button 
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => { e.stopPropagation(); handleMoveShot(index, "left"); }}
                              className="p-1 rounded bg-[#0A0A0A] text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 cursor-pointer"
                              title="Mover Frame para Esquerda"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                            <button 
                              type="button"
                              disabled={index === storyboard.shots.length - 1}
                              onClick={(e) => { e.stopPropagation(); handleMoveShot(index, "right"); }}
                              className="p-1 rounded bg-[#0A0A0A] text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 cursor-pointer"
                              title="Mover Frame para Direita"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDuplicateShot(shot); }}
                              className="text-[9.5px] text-zinc-400 hover:text-[#FF4E00] px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-zinc-800 cursor-pointer"
                              title="Duplicar segmento"
                            >
                              Copiar
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteShot(shot.id); }}
                              className="p-1 rounded bg-rose-950/20 text-rose-400 hover:bg-rose-900/50 cursor-pointer"
                              title="Excluir Frame"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Insertion card panel */}
                <div 
                  onClick={handleAddBlankShot}
                  className="flex-shrink-0 w-[160px] aspect-[1800/1800] rounded-xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/10 flex flex-col items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Plus className="h-8 w-8 text-zinc-500 hover:text-[#FF4E00]" />
                  <span className="text-[11px] font-mono tracking-wider font-bold text-zinc-400 uppercase">Adicionar Shot</span>
                </div>
              </div>
            </section>

            {/* ACTIVE SHOT DETAIL & PROJECT OVERVIEW (MIDDLE AREA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* COMPREHENSIVE COMPONENT INSPECTOR PANEL */}
              <section ref={activeFocusRef} className="lg:col-span-8 bg-[#0F0F0F] border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">

                {!activeShot ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-[#FF4E00]/10 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-[#FF4E00]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Nenhum storyboard gerado ainda</h3>
                      <p className="text-zinc-400 text-sm max-w-sm">Cole seu briefing ou roteiro na área abaixo e clique em <span className="text-[#FF4E00] font-semibold">Gerar Storyboard</span> para começar.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth' })}
                      className="mt-2 bg-[#FF4E00] hover:brightness-110 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ir para o Briefing
                    </button>
                  </div>
                ) : (<>

                {/* Header title */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/85 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#FF4E00] text-white font-bold text-xs tracking-wider px-2.5 py-1 rounded font-mono shadow-md shadow-orange-950/10">
                      SHOT {activeShot.shotNumber < 10 ? `0${activeShot.shotNumber}` : activeShot.shotNumber}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold font-display text-white">Painel de Controle do Frame</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => handleGenerateFrameImage(activeShot.id, activeShot.aiImagePrompt)}
                      disabled={imageGeneratingState[activeShot.id]}
                      className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-200 text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-40 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-[#FF4E00] ${imageGeneratingState[activeShot.id] ? "animate-spin" : ""}`} />
                      <span>{imageGeneratingState[activeShot.id] ? "Gerando com IA..." : "Regenerar Imagem"}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteShot(activeShot.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
                      title="Excluir Frame"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Interactive Layout View (Split frame/form) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left block (Active visualization image) */}
                  <div className="md:col-span-5 flex flex-col gap-3">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner group">
                      {imageGeneratingState[activeShot.id] ? (
                        <div className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur flex flex-col items-center justify-center gap-3 text-xs text-[#FF4E00] p-4">
                          <RefreshCw className="h-8 w-8 text-[#FF4E00] animate-spin" />
                          <span className="font-mono font-bold tracking-widest text-[10px] uppercase">Renderizando frame com modelo...</span>
                          <p className="text-[10px] text-zinc-400 text-center italic mt-2">Invocando modelos de geração de imagem no servidor...</p>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={activeShot.imageUrl} 
                            alt={`Active frame ${activeShot.shotNumber}`} 
                            className="w-full h-full object-cover transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-250 flex items-end justify-center p-4">
                            <span className="text-[10px] bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded flex items-center gap-1">
                              <Maximize2 className="h-3 w-3 text-[#FF4E00]" /> Renderização do Frame Ativo
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Frame Art Preset and Manual Prompt Input */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-bold uppercase tracking-wider text-[9px] text-zinc-400">Prompt de IA para este Frame:</span>
                        <HelpCircle className="h-3 w-3 text-zinc-500" title="Este prompt é enviado ao modelo de imagem para gerar o frame." />
                      </div>
                      <textarea 
                        value={activeShot.aiImagePrompt}
                        rows={3}
                        onChange={(e) => handleUpdateShotField(activeShot.id, "aiImagePrompt", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] focus:ring-1 focus:ring-[#FF4E00] rounded p-2 text-[11.5px] leading-relaxed font-mono w-full text-zinc-200 outline-none"
                        placeholder="Descreva o frame em detalhes para o modelo de imagem..."
                      />
                      <p className="text-[10px] text-zinc-550 leading-normal">
                        Dica: Inclua perspectiva focal, ângulos de luz, cores precisas, sobreposições e definições de layout.
                      </p>
                    </div>
                  </div>

                  {/* Right block (Form fields editing) */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    
                    {/* Timecode & Action goal row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4 flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#FF4E00]" /> Duração
                        </label>
                        <input 
                          type="text" 
                          value={activeShot.duration}
                          onChange={(e) => handleUpdateShotField(activeShot.id, "duration", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white outline-none w-full font-mono focus:border-[#FF4E00]"
                        />
                      </div>
                      <div className="sm:col-span-8 flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                          Objetivo do Shot / Meta da Cena
                        </label>
                        <input 
                          type="text" 
                          value={activeShot.goal}
                          onChange={(e) => handleUpdateShotField(activeShot.id, "goal", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white outline-none w-full focus:border-[#FF4E00]"
                        />
                      </div>
                    </div>

                    {/* Camera and motion parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                          <Camera className="h-3 w-3 text-[#FF4E00]" /> Ângulo de Câmera
                        </label>
                        <input 
                          type="text" 
                          value={activeShot.cameraDirection}
                          onChange={(e) => handleUpdateShotField(activeShot.id, "cameraDirection", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none w-full focus:border-[#FF4E00]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                          <Sliders className="h-3 w-3 text-[#FF4E00]" /> Motion Graphics
                        </label>
                        <input 
                          type="text" 
                          value={activeShot.motionDirection}
                          onChange={(e) => handleUpdateShotField(activeShot.id, "motionDirection", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none w-full focus:border-[#FF4E00]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                          <Video className="h-3 w-3 text-[#FF4E00]" /> Transição de Corte
                        </label>
                        <input 
                          type="text" 
                          value={activeShot.transition}
                          onChange={(e) => handleUpdateShotField(activeShot.id, "transition", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none w-full focus:border-[#FF4E00]"
                        />
                      </div>
                    </div>

                    {/* Visual descriptions */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                        Descrição Visual da Cena (O que aparece na tela)
                      </label>
                      <textarea 
                        value={activeShot.visualDescription}
                        rows={3}
                        onChange={(e) => handleUpdateShotField(activeShot.id, "visualDescription", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded p-2.5 text-xs text-zinc-200 outline-none leading-relaxed font-serif"
                      />
                    </div>

                    {/* Voiceover segment */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#FF4E00] font-bold flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" /> Narração (Texto de Voz)
                      </label>
                      <input
                        type="text"
                        value={activeShot.voiceover}
                        onChange={(e) => handleUpdateShotField(activeShot.id, "voiceover", e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 focus:border-[#FF4E00] rounded p-2.5 text-xs text-orange-200 italic outline-none"
                        placeholder="Texto de narração do segmento..."
                      />
                    </div>

                    {/* Editor director production notes */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                        Notas do Diretor &amp; Editor de Pós-Produção
                      </label>
                      <input 
                        type="text" 
                        value={activeShot.editorNotes}
                        onChange={(e) => handleUpdateShotField(activeShot.id, "editorNotes", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-300 outline-none focus:border-[#FF4E00]"
                      />
                    </div>

                  </div>
                </div>
                </>)}
              </section>

              {/* PROJECT STRATEGY & VISUAL METADATA (RIGHT PANEL) */}
              <aside className={`lg:col-span-4 flex flex-col gap-6 ${storyboard.shots.length === 0 ? 'opacity-30 pointer-events-none' : ''}`}>

                {/* METADATA FORM BLOCK */}
                <div className="bg-[#0F0F0F] border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#FF4E00]" />
                      <h3 className="font-bold text-xs uppercase tracking-wider font-display text-white">Visão Geral do Projeto</h3>
                    </div>
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 rounded font-mono">ID Tracker</span>
                  </div>

                  {/* General Project Inputs */}
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Título do Projeto</label>
                      <input 
                        type="text" 
                        value={storyboard.title}
                        onChange={(e) => handleUpdateProjectField("title", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 font-bold text-white focus:border-[#FF4E00] outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Objetivo Estratégico</label>
                      <textarea 
                        value={storyboard.objective}
                        rows={2}
                        onChange={(e) => handleUpdateProjectField("objective", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded p-2 text-zinc-300 font-serif outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Público-Alvo</label>
                      <input 
                        type="text" 
                        value={storyboard.targetAudience}
                        onChange={(e) => handleUpdateProjectField("targetAudience", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Tom / Adjetivos</label>
                        <input 
                          type="text" 
                          value={storyboard.tone}
                          onChange={(e) => handleUpdateProjectField("tone", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Duração Total</label>
                        <input 
                          type="text" 
                          value={storyboard.duration}
                          onChange={(e) => handleUpdateProjectField("duration", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DESIGN SYSTEM VISUAL DIRECTION & AUDIO PANEL */}
                <div className="bg-[#0F0F0F] border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
                  
                  {/* Tab switches */}
                  <div className="flex border-b border-zinc-800 text-[11px] font-mono font-bold tracking-tight pb-1.5 gap-2 select-none">
                    <button 
                      type="button"
                      onClick={() => setActiveTab("visuals")}
                      className={`px-3 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "visuals" ? "bg-[#FF4E00] text-white font-bold" : "text-zinc-400 hover:text-white"}`}
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span>Direção de Arte</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab("production")}
                      className={`px-3 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "production" ? "bg-[#FF4E00] text-white font-bold" : "text-zinc-400 hover:text-white"}`}
                    >
                      <Music className="h-3.5 w-3.5" />
                      <span>Áudio &amp; Vibe</span>
                    </button>
                  </div>

                  {activeTab === "visuals" ? (
                    /* VISUAL DESIGN DIRECTION */
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Tema de Direção de Arte</label>
                        <input 
                          type="text" 
                          value={storyboard.visualDirection.artDirection}
                          onChange={(e) => handleUpdateMetaField("visualDirection", "artDirection", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none font-serif"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Estilo de Motion</label>
                        <input 
                          type="text" 
                          value={storyboard.visualDirection.motionStyle}
                          onChange={(e) => handleUpdateMetaField("visualDirection", "motionStyle", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Referência de Estilo de Câmera</label>
                        <input 
                          type="text" 
                          value={storyboard.visualDirection.cameraStyle}
                          onChange={(e) => handleUpdateMetaField("visualDirection", "cameraStyle", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>

                      {/* Color palette representation */}
                      <div className="flex flex-col gap-1.5 border-t border-zinc-800/80 pt-3.5">
                        <div className="flex items-center justify-between text-zinc-400 text-[9.5px] font-mono uppercase font-bold">
                          <span>Paleta de Cores (Hex)</span>
                          <span className="text-zinc-500 italic">4-5 Cores Customizadas</span>
                        </div>
                        <div className="flex gap-2">
                          {storyboard.visualDirection.colorPalette.map((color, idx) => (
                            <div key={idx} className="flex-1 flex flex-col gap-1 items-center bg-zinc-950 p-1.5 rounded border border-zinc-800 hover:border-zinc-600 transition">
                              <label className="relative h-6 w-full rounded border border-zinc-700 cursor-pointer overflow-hidden group" title={`Cor ${idx + 1}`}>
                                <div className="h-full w-full" style={{ backgroundColor: color }} />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition">
                                  <Edit className="h-2.5 w-2.5 text-white opacity-0 group-hover:opacity-100 transition" />
                                </div>
                                <input
                                  type="color"
                                  value={color.startsWith('#') && color.length === 7 ? color : '#000000'}
                                  onChange={(e) => {
                                    const updatedColors = [...storyboard.visualDirection.colorPalette];
                                    updatedColors[idx] = e.target.value;
                                    handleUpdateMetaField("visualDirection", "colorPalette", updatedColors);
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </label>
                              <input
                                type="text"
                                value={color}
                                onChange={(e) => {
                                  const updatedColors = [...storyboard.visualDirection.colorPalette];
                                  updatedColors[idx] = e.target.value;
                                  handleUpdateMetaField("visualDirection", "colorPalette", updatedColors);
                                }}
                                className="w-full text-center bg-transparent border-0 font-mono text-[9px] focus:ring-0 p-0 text-zinc-300 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* AUDIO & VIBE DICTION DIRECTION */
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                          <Volume2 className="h-3 w-3 text-[#FF4E00]" /> Foley &amp; Design de Som
                        </label>
                        <input 
                          type="text" 
                          value={storyboard.productionNotes.soundDesign}
                          onChange={(e) => handleUpdateMetaField("productionNotes", "soundDesign", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                          <Music className="h-3 w-3 text-[#FF4E00]" /> Direção Musical (Gênero/Ritmo)
                        </label>
                        <input 
                          type="text" 
                          value={storyboard.productionNotes.musicDirection}
                          onChange={(e) => handleUpdateMetaField("productionNotes", "musicDirection", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Referências de Motion</label>
                        <input 
                          type="text" 
                          value={storyboard.productionNotes.motionReferences}
                          onChange={(e) => handleUpdateMetaField("productionNotes", "motionReferences", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Referências de Edição</label>
                        <input 
                          type="text" 
                          value={storyboard.productionNotes.editingReferences}
                          onChange={(e) => handleUpdateMetaField("productionNotes", "editingReferences", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:border-[#FF4E00] outline-none"
                        />
                      </div>
                    </div>
                  )}

                </div>
              </aside>

            </div>

            {/* SCRIPT TERMINAL / PROMPT & BRIEFING AREA (BOTTOM AREA) */}
            <section className="bg-[#0F0F0F] border border-zinc-805 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-[#FF4E00]" />
                  <h3 className="font-bold text-sm tracking-wide uppercase font-display text-white">Workspace de Roteiro &amp; Briefing Criativo</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Style Presets */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 hidden sm:inline">Estilo Visual:</span>
                    <select 
                      value={selectedStyle} 
                      onChange={(e) => {
                        setSelectedStyle(e.target.value);
                      }}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-[#FF4E00] outline-none font-medium cursor-pointer"
                    >
                      <option value="Minimalist Tech">Minimalista Tech (Dark, Glassmorphism)</option>
                      <option value="Cinematic Commercial">Comercial Cinematográfico (Foco no produto)</option>
                      <option value="3D Render Chrome">3D Render Chrome (Brilhoso, Octane render)</option>
                      <option value="Hand-drawn Storyboard">Esboço em Carvão (Layout desenhado à mão)</option>
                      <option value="Cyberpunk Neon">Cyberpunk Neon (Alto contraste, Brilho neon)</option>
                      <option value="Vintage Editorial">Editorial Vintage (Tons quentes, Granulado de filme)</option>
                    </select>
                  </div>

                  {/* Aspect Format */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 hidden sm:inline">Formato:</span>
                    <select 
                      value={selectedAspectRatio} 
                      onChange={(e) => {
                        setSelectedAspectRatio(e.target.value as "16:9" | "9:16");
                      }}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-[#FF4E00] outline-none font-medium cursor-pointer"
                    >
                      <option value="16:9">Horizontal (16:9 Vídeo Landscape)</option>
                      <option value="9:16">Vertical (9:16 TikTok / Reels)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Textarea Left */}
                <div className="lg:col-span-8 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11.5px] font-mono text-zinc-400">
                    <span>Cole seu roteiro de narração ou notas de briefing promocional</span>
                    <span>Suporta indicadores de cue de narração</span>
                  </div>
                  <div className="relative">
                    <textarea 
                      value={userInput}
                      rows={8}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="bg-zinc-950 hover:bg-[#121212] border border-zinc-800 focus:border-[#FF4E00] focus:ring-1 focus:ring-[#FF4E00] rounded-lg p-3.5 text-xs text-zinc-200 outline-none leading-relaxed font-serif w-full h-[220px]"
                      placeholder="Escreva ou cole linhas de narração, roteiro, briefing de campanha..."
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur rounded-lg flex flex-col items-center justify-center gap-3 text-xs text-orange-400">
                        <RefreshCw className="h-10 w-10 animate-spin text-[#FF4E00]" />
                        <span className="font-mono font-bold tracking-widest text-[11px] uppercase">{generatingStatus}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Right */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-4 p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-zinc-200 uppercase tracking-wide text-[10px] font-mono flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#FF4E00]" /> Como usar
                    </h4>
                    <p className="text-zinc-400 leading-normal text-[11px]">
                      Digite suas ideias ou estrutura de roteiro. Nosso Diretor de Motion analisa a narrativa e gera shots coesos, prompts de imagem, direções visuais e sugestões de ritmo.
                    </p>
                    <div className="flex flex-col gap-1 bg-[#0A0A0A] p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-400 leading-snug">
                      <div className="flex items-center gap-1"><span className="text-[#FF4E00]">✔</span> Preserva o ritmo cronológico do roteiro</div>
                      <div className="flex items-center gap-1"><span className="text-[#FF4E00]">✔</span> Gera prompts de imagem cinematográficos</div>
                      <div className="flex items-center gap-1"><span className="text-[#FF4E00]">✔</span> Mapeia sobreposições de som e transições</div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleGenerateStoryboard}
                    disabled={isGenerating || !userInput.trim()}
                    className="w-full bg-[#FF4E00] hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-orange-950/10 cursor-pointer text-xs uppercase tracking-wider font-display disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    <span>Gerar Storyboard</span>
                  </button>
                </div>

              </div>
            </section>
          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-zinc-800 bg-[#0F0F0F] mt-10 py-5 text-center text-xs text-zinc-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Motion Storyboard AI. Feito para diretores, criativos de marketing e animadores.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition">Termos de Uso</span>
            <span className="hover:text-white cursor-pointer transition">Privacidade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
