import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Sparkles, Plus, Trash2, Clock,
  Music, Volume2, Edit, RefreshCw, Sliders, AlertCircle,
  Upload, X, FileText, ChevronLeft, ChevronRight,
  Film, Printer, Users, Target, Palette, LayoutGrid
} from "lucide-react";
import { Storyboard, Shot } from "./types";
import { INITIAL_STORYBOARD } from "./data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  text?: string;
  data?: string;
  size: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function processUploadedFile(file: File): Promise<UploadedFile> {
  const id = `f-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
  const isText = file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");

  if (isText) {
    const text = await new Promise<string>((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsText(file);
    });
    return { id, name: file.name, mimeType: "text/plain", text, size: file.size };
  } else if (isPdf) {
    const data = await new Promise<string>((res, rej) => {
      const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
    });
    return { id, name: file.name, mimeType: "application/pdf", data, size: file.size };
  }
  throw new Error(`Formato não suportado: ${file.name}. Use PDF ou TXT.`);
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
}

// ─── ShotCard — visual do documento igual ao PDF de referência ────────────────

function ShotCard({
  shot, sceneIdx, shotIdx, isGeneratingImage, onEdit, onDelete, onDuplicate
}: {
  shot: Shot; sceneIdx: number; shotIdx: number; isGeneratingImage: boolean;
  onEdit: (s: Shot) => void; onDelete: (id: string) => void; onDuplicate: (s: Shot) => void;
}) {
  return (
    <div className="shot-card flex flex-col bg-[#181818] border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 shrink-0">
        <span className="bg-[#FF4E00] text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded tracking-wider">
          SHOT {sceneIdx + 1}.{shotIdx + 1}
        </span>
        <span className="text-zinc-500 text-[10px] font-mono flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />{shot.duration}
        </span>
      </div>

      {/* Image — dominant */}
      <div className="relative aspect-video bg-zinc-950 overflow-hidden group/img shrink-0">
        {isGeneratingImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#FF4E00]">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-[10px] font-mono">Gerando...</span>
          </div>
        ) : shot.imageUrl ? (
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            <Film className="h-8 w-8" />
          </div>
        )}
        {/* Edit overlay — hidden on print/export */}
        <div className="export-hide absolute inset-0 bg-black/0 group-hover/img:bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100 transition-all">
          <button onClick={() => onEdit(shot)} className="bg-white/10 border border-white/20 backdrop-blur text-white text-[11px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer hover:bg-white/20 transition">
            <Edit className="h-3 w-3" /> Editar
          </button>
          <button onClick={() => onDuplicate(shot)} className="bg-white/10 border border-white/20 backdrop-blur text-white text-[11px] px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/20 transition">
            <Plus className="h-3 w-3" />
          </button>
          <button onClick={() => onDelete(shot.id)} className="bg-rose-500/20 border border-rose-500/30 backdrop-blur text-rose-300 text-[11px] px-2 py-1.5 rounded-lg cursor-pointer hover:bg-rose-500/30 transition">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content — matches reference PDF structure */}
      <div className="p-3 flex flex-col gap-2 flex-1 text-[11px]">
        <p className="text-zinc-300 leading-relaxed">{shot.visualDescription}</p>

        <div className="border-t border-zinc-800/50 pt-2 flex flex-col gap-1.5">
          <div>
            <span className="text-[#FF4E00] text-[9px] font-mono font-bold uppercase tracking-widest block mb-0.5">ANIMAÇÃO</span>
            <span className="text-zinc-400 leading-snug">{shot.motionDirection}</span>
          </div>
          <div>
            <span className="text-[#FF4E00] text-[9px] font-mono font-bold uppercase tracking-widest block mb-0.5">TÉCNICA</span>
            <span className="text-zinc-400 leading-snug">{shot.cameraDirection}{shot.transition ? ` · ${shot.transition}` : ""}</span>
          </div>
        </div>

        {shot.voiceover && (
          <div className="border-t border-zinc-800/50 pt-2">
            <p className="text-zinc-500 italic leading-relaxed">"{shot.voiceover}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ShotEditModal ────────────────────────────────────────────────────────────

function ShotEditModal({ shot, allShots, isGeneratingImage, onClose, onUpdate, onGenerateImage, onDelete, onDuplicate, onNavigate }: {
  shot: Shot; allShots: Shot[]; isGeneratingImage: boolean;
  onClose: () => void; onUpdate: (id: string, f: keyof Shot, v: any) => void;
  onGenerateImage: (id: string, p: string) => void; onDelete: (id: string) => void;
  onDuplicate: (s: Shot) => void; onNavigate: (d: "prev" | "next") => void;
}) {
  const idx = allShots.findIndex(s => s.id === shot.id);
  return (
    <div className="export-hide fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-[#111] z-10">
          <div className="flex items-center gap-3">
            <span className="bg-[#FF4E00] text-white text-xs font-mono font-bold px-3 py-1 rounded">SHOT {String(shot.shotNumber).padStart(2, "0")}</span>
            <span className="text-zinc-400 text-sm">{shot.scene}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onDuplicate(shot)} className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded bg-zinc-800 border border-zinc-700 cursor-pointer">Duplicar</button>
            <button onClick={() => { onDelete(shot.id); onClose(); }} className="p-1.5 rounded bg-rose-950/30 border border-rose-900/50 text-rose-400 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            <button onClick={onClose} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
              {isGeneratingImage ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-[#FF4E00]"><RefreshCw className="h-7 w-7 animate-spin" /></div>
              ) : shot.imageUrl ? (
                <img src={shot.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : <div className="absolute inset-0 flex items-center justify-center text-zinc-700"><Film className="h-10 w-10" /></div>}
            </div>
            <textarea value={shot.aiImagePrompt} rows={4} onChange={e => onUpdate(shot.id, "aiImagePrompt", e.target.value)}
              className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded-lg p-2.5 text-[11px] font-mono text-zinc-300 outline-none w-full resize-none" />
            <button onClick={() => onGenerateImage(shot.id, shot.aiImagePrompt)} disabled={isGeneratingImage}
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 rounded-lg transition disabled:opacity-40 cursor-pointer font-medium">
              <RefreshCw className={`h-3.5 w-3.5 text-[#FF4E00] ${isGeneratingImage ? "animate-spin" : ""}`} />
              Regenerar Imagem com IA
            </button>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            {[
              { key: "scene", label: "Cena" }, { key: "duration", label: "Duração" }, { key: "goal", label: "Objetivo do Shot" }
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">{f.label}</label>
                <input type="text" value={(shot as any)[f.key] || ""} onChange={e => onUpdate(shot.id, f.key as keyof Shot, e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-[#FF4E00]" />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Descrição Visual</label>
              <textarea value={shot.visualDescription} rows={4} onChange={e => onUpdate(shot.id, "visualDescription", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded p-2.5 text-zinc-200 outline-none resize-none" />
            </div>
            {[
              { key: "cameraDirection", label: "Câmera" }, { key: "motionDirection", label: "Animação / Motion" },
              { key: "transition", label: "Transição" }, { key: "voiceover", label: "Narração (Voiceover)" },
              { key: "editorNotes", label: "Notas do Editor" }
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">{f.label}</label>
                <input type="text" value={(shot as any)[f.key] || ""} onChange={e => onUpdate(shot.id, f.key as keyof Shot, e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-[#FF4E00]" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <button onClick={() => onNavigate("prev")} disabled={idx === 0} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer px-3 py-2 rounded-lg hover:bg-zinc-800 transition">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          <span className="text-xs text-zinc-600 font-mono">{idx + 1} / {allShots.length}</span>
          <button onClick={() => onNavigate("next")} disabled={idx === allShots.length - 1} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer px-3 py-2 rounded-lg hover:bg-zinc-800 transition">
            Próximo <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FileUploadZone ───────────────────────────────────────────────────────────

function FileUploadZone({ files, onAdd, onRemove }: {
  files: UploadedFile[]; onAdd: (f: UploadedFile[]) => void; onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setProcessing(true); setErr(null);
    const results: UploadedFile[] = [];
    for (const file of Array.from(list)) {
      try { results.push(await processUploadedFile(file)); }
      catch (e: any) { setErr(e.message); }
    }
    onAdd(results); setProcessing(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all min-h-[80px] ${dragOver ? "border-[#FF4E00] bg-[#FF4E00]/5 text-[#FF4E00]" : "border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-400"}`}>
        {processing ? <RefreshCw className="h-5 w-5 animate-spin text-[#FF4E00]" /> : <Upload className="h-5 w-5" />}
        <span className="text-xs">{processing ? "Processando..." : "Arraste arquivos de referência aqui"}</span>
        <span className="text-[10px] text-zinc-600">PDF, TXT — briefings, roteiros, transcrições, documentos de estratégia</span>
        <input ref={inputRef} type="file" multiple accept=".pdf,.txt,.md" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>
      {err && <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{err}</p>}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
              <FileText className="h-3 w-3 text-[#FF4E00] shrink-0" />
              <span className="truncate max-w-[140px]">{f.name}</span>
              <span className="text-zinc-600 text-[10px]">{fmtBytes(f.size)}</span>
              <button onClick={() => onRemove(f.id)} className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [storyboard, setStoryboard] = useState<Storyboard>(INITIAL_STORYBOARD);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [userInput, setUserInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Comercial Cinematográfico");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [imageGeneratingState, setImageGeneratingState] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<"ADS" | "Orgânico">("ADS");

  const documentRef = useRef<HTMLDivElement>(null);
  const briefingRef = useRef<HTMLDivElement>(null);

  const hasShots = storyboard.shots.length > 0;

  const sceneGroups = useMemo(() => {
    const groups: { name: string; shots: Shot[] }[] = [];
    const seen = new Map<string, number>();
    for (const shot of storyboard.shots) {
      const name = shot.scene || "Storyboard";
      if (seen.has(name)) { groups[seen.get(name)!].shots.push(shot); }
      else { seen.set(name, groups.length); groups.push({ name, shots: [shot] }); }
    }
    return groups;
  }, [storyboard.shots]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const updateShot = useCallback((shotId: string, field: keyof Shot, value: any) => {
    setStoryboard(prev => ({ ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, [field]: value } : s) }));
    setEditingShot(prev => prev?.id === shotId ? { ...prev, [field]: value } : prev);
  }, []);

  const deleteShot = useCallback((shotId: string) => {
    setStoryboard(prev => {
      if (prev.shots.length <= 1) return prev;
      return { ...prev, shots: prev.shots.filter(s => s.id !== shotId).map((s, i) => ({ ...s, shotNumber: i + 1 })) };
    });
  }, []);

  const duplicateShot = useCallback((shot: Shot) => {
    setStoryboard(prev => {
      const idx = prev.shots.findIndex(s => s.id === shot.id);
      const copy: Shot = { ...shot, id: `shot-dup-${Date.now()}`, shotNumber: prev.shots.length + 1 };
      const updated = [...prev.shots]; updated.splice(idx + 1, 0, copy);
      return { ...prev, shots: updated.map((s, i) => ({ ...s, shotNumber: i + 1 })) };
    });
  }, []);

  const navigateModal = useCallback((dir: "prev" | "next") => {
    if (!editingShot) return;
    const idx = storyboard.shots.findIndex(s => s.id === editingShot.id);
    const next = storyboard.shots[dir === "prev" ? idx - 1 : idx + 1];
    if (next) setEditingShot(next);
  }, [editingShot, storyboard.shots]);

  const generateImage = useCallback(async (shotId: string, prompt: string) => {
    setImageGeneratingState(prev => ({ ...prev, [shotId]: true }));
    try {
      const res = await fetch("/api/generate-frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${selectedStyle}: ${prompt}`, aspectRatio: selectedAspectRatio })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.imageUrl) {
        setStoryboard(prev => ({ ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: data.imageUrl } : s) }));
        setEditingShot(prev => prev?.id === shotId ? { ...prev, imageUrl: data.imageUrl } : prev);
      }
    } catch {
      const seed = Math.floor(Math.random() * 9999);
      const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=800&height=500&seed=${seed}&nologo=true`;
      setStoryboard(prev => ({ ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: url } : s) }));
      setEditingShot(prev => prev?.id === shotId ? { ...prev, imageUrl: url } : prev);
    } finally {
      setImageGeneratingState(prev => ({ ...prev, [shotId]: false }));
    }
  }, [selectedStyle, selectedAspectRatio]);

  // ── Export functions ─────────────────────────────────────────────────────────

  const exportAsPDF = () => window.print();

  // ── Generate storyboard ───────────────────────────────────────────────────────

  const fallback = useCallback((text: string, style: string, aspect: "16:9" | "9:16") => {
    const blocks = text.split(/\n\n+/).filter(s => s.length > 15);
    const count = Math.max(4, Math.min(8, blocks.length));
    const scenes = ["Abertura — Impacto inicial", "Desenvolvimento — Argumento central", "Evidências — Resultados e prova social", "Encerramento — CTA final"];
    const shots: Shot[] = Array.from({ length: count }, (_, i) => ({
      id: `shot-fb-${i}-${Date.now()}`, shotNumber: i + 1,
      scene: scenes[Math.floor(i / 2) % scenes.length],
      duration: `0:${String(i * 4).padStart(2, "0")} - 0:${String((i + 1) * 4).padStart(2, "0")}`,
      goal: `Comunicar ponto-chave ${i + 1}`, visualDescription: blocks[i] || `Cena visual ${i + 1}.`,
      cameraDirection: ["Plano médio estático", "Close-up com dolly", "Plano aberto, câmera alta", "Zoom in suave"][i % 4],
      motionDirection: ["Tipografia cinética entrando", "Contador animado (count-up)", "Card com stagger pop", "Logo reveal com glow"][i % 4],
      transition: ["Corte seco", "Whip pan", "Fade suave", "Match cut"][i % 4],
      voiceover: blocks[i]?.slice(0, 80) || "", editorNotes: "Sincronizar com batida musical",
      aiImagePrompt: `${style} cinematic storyboard frame, ${blocks[i]?.slice(0, 60) || "product"}, professional lighting`,
      imageUrl: `https://images.unsplash.com/photo-${["1618005182384-a83a8bd57fbe","1634017839464-5c339ebe3cb4","1550751827-4bd374c3f58b","1614741118887-7a4ee193a5fa","1600132806370-bf17e65e942f","1541701494587-cb58502866ab","1518770660439-4636190af475","1535303311169-de17f07e3b54"][i % 8]}?w=800&auto=format&fit=crop&q=80`
    }));
    setStoryboard({ id: `sb-${Date.now()}`, title: "Storyboard", objective: text.slice(0, 100), targetAudience: "Definido no briefing", duration: `${count * 4}s`, format: aspect === "9:16" ? "9:16 Vertical" : "16:9 Landscape", tone: "Energético, moderno", aspectRatio: aspect, createdAt: new Date().toISOString().split("T")[0], visualDirection: { artDirection: style, colorPalette: ["#090A0F","#1E293B","#F59E0B","#38BDF8","#F1F5F9"], motionStyle: "Animações fluidas", cameraStyle: "Ângulos variados" }, shots, productionNotes: { soundDesign: "Foley e efeitos sonoros", musicDirection: "Trilha energética", motionReferences: "Estilo agências top br", editingReferences: "Cortes rítmicos" } });
  }, []);

  const generateStoryboard = useCallback(async () => {
    if (!userInput.trim()) return;
    setIsGenerating(true); setErrorMessage(null); setWarningMessage(null);
    setGeneratingStatus("Analisando roteiro e arquivos com Gemini AI...");
    try {
      const res = await fetch("/api/storyboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: userInput, style: selectedStyle, aspectRatio: selectedAspectRatio,
          files: uploadedFiles.map(f => ({ name: f.name, mimeType: f.mimeType, text: f.text, data: f.data })) })
      });
      setGeneratingStatus("Estruturando cenas e direção visual...");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result?.shots?.length) throw new Error("Estrutura inválida");

      const shots: Shot[] = result.shots.map((s: Partial<Shot>, i: number) => {
        const num = s.shotNumber || (i + 1);
        const q = encodeURIComponent(`${selectedStyle}: ${s.aiImagePrompt || s.visualDescription}`);
        return { id: `shot-${num}-${Date.now()}`, shotNumber: num, scene: s.scene || "Storyboard", duration: s.duration || `0:0${i*3} - 0:0${(i+1)*3}`, goal: s.goal || "", visualDescription: s.visualDescription || "", cameraDirection: s.cameraDirection || "", motionDirection: s.motionDirection || "", transition: s.transition || "", voiceover: s.voiceover || "", editorNotes: s.editorNotes || "", aiImagePrompt: s.aiImagePrompt || "", imageUrl: `https://image.pollinations.ai/p/${q}?width=800&height=500&seed=${num}&nologo=true` };
      });

      setStoryboard({ id: `sb-${Date.now()}`, title: result.title || "Storyboard", objective: result.objective || "", targetAudience: result.targetAudience || "", duration: result.duration || "", format: result.format || `${selectedAspectRatio} Vídeo`, tone: result.tone || "", aspectRatio: selectedAspectRatio, createdAt: new Date().toISOString().split("T")[0], visualDirection: { artDirection: result.visualDirection?.artDirection || "", colorPalette: result.visualDirection?.colorPalette || ["#090A0F","#1E293B","#F59E0B","#38BDF8","#F1F5F9"], motionStyle: result.visualDirection?.motionStyle || "", cameraStyle: result.visualDirection?.cameraStyle || "" }, shots, productionNotes: { soundDesign: result.productionNotes?.soundDesign || "", musicDirection: result.productionNotes?.musicDirection || "", motionReferences: result.productionNotes?.motionReferences || "", editingReferences: result.productionNotes?.editingReferences || "" } });
      setTimeout(() => documentRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (e: any) {
      console.warn("Backend failed, fallback:", e);
      fallback(userInput, selectedStyle, selectedAspectRatio);
      setWarningMessage("Modo simulação — configure GEMINI_API_KEY no Render para ativar a IA completa.");
    } finally { setIsGenerating(false); setGeneratingStatus(""); }
  }, [userInput, uploadedFiles, selectedStyle, selectedAspectRatio, fallback]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans">

      {/* HEADER */}
      <header className="export-hide border-b border-zinc-800 bg-[#0F0F0F]/95 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#FF4E00] flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] tracking-widest uppercase font-mono font-bold text-[#FF4E00]">Motion Storyboard AI</div>
            <div className="text-[11px] text-zinc-500 hidden sm:block">Estúdio de Vídeo Inteligente — Hyper</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasShots && (
            <>
              <button onClick={exportAsPDF}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition cursor-pointer font-medium">
                <Printer className="h-3.5 w-3.5" /> Exportar PDF
              </button>
              <button onClick={() => briefingRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-[#FF4E00] hover:brightness-110 text-white font-bold transition cursor-pointer">
                <RefreshCw className="h-3.5 w-3.5" /> Novo Briefing
              </button>
            </>
          )}
        </div>
      </header>

      {/* WARNINGS */}
      {warningMessage && (
        <div className="export-hide bg-amber-900/20 border-b border-amber-800/30 px-4 py-2 text-xs text-amber-400 flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{warningMessage}</span>
          <button onClick={() => setWarningMessage(null)} className="text-amber-600 hover:text-amber-300 cursor-pointer ml-4">✕</button>
        </div>
      )}

      <main className="flex-1 flex flex-col">

        {/* ── BRIEFING SECTION ── */}
        <div ref={briefingRef} className="export-hide max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
          <div className="bg-[#0F0F0F] border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#FF4E00]" />
                <h2 className="font-bold text-sm uppercase tracking-wider font-display text-white">Briefing & Geração</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-[#FF4E00] outline-none cursor-pointer">
                  <option>Comercial Cinematográfico</option>
                  <option>Minimalista Tech (Dark / Glass)</option>
                  <option>3D Chrome (Octane Render)</option>
                  <option>Cyberpunk Neon</option>
                  <option>UI Motion (App / SaaS)</option>
                  <option>Esboço Editorial</option>
                </select>
                <select value={selectedAspectRatio} onChange={e => setSelectedAspectRatio(e.target.value as "16:9" | "9:16")}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-[#FF4E00] outline-none cursor-pointer">
                  <option value="16:9">16:9 Horizontal</option>
                  <option value="9:16">9:16 Vertical (Reels/TikTok)</option>
                </select>
              </div>
            </div>

            <FileUploadZone files={uploadedFiles} onAdd={f => setUploadedFiles(p => [...p, ...f])} onRemove={id => setUploadedFiles(p => p.filter(f => f.id !== id))} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-9 flex flex-col gap-3">
                <div className="relative">
                  <textarea value={userInput} rows={6} onChange={e => setUserInput(e.target.value)}
                    placeholder="Cole seu roteiro, briefing, transcrição de VSL, script de anúncio ou ideias de campanha..."
                    className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] focus:ring-1 focus:ring-[#FF4E00] rounded-xl p-4 text-sm text-zinc-200 outline-none w-full resize-none font-serif h-[140px]" />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur rounded-xl flex flex-col items-center justify-center gap-3 text-[#FF4E00]">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="text-xs font-mono font-bold tracking-widest uppercase">{generatingStatus}</span>
                    </div>
                  )}
                </div>

                {/* Metadata panel */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  {/* Duração */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Duração
                    </span>
                    <span className="text-zinc-300 font-medium">{storyboard.duration || "—"}</span>
                  </div>
                  {/* Tom */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                      <Music className="h-2.5 w-2.5" /> Tom
                    </span>
                    <span className="text-zinc-300 font-medium">{storyboard.tone || "—"}</span>
                  </div>
                  {/* Público */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" /> Público
                    </span>
                    <span className="text-zinc-300 font-medium truncate">{storyboard.targetAudience || "—"}</span>
                  </div>
                  {/* Paleta */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                      <Palette className="h-2.5 w-2.5" /> Paleta de Cores
                    </span>
                    <div className="flex gap-1.5 items-center">
                      {storyboard.visualDirection.colorPalette.length > 0
                        ? storyboard.visualDirection.colorPalette.map((c, i) => (
                          <div key={i} className="h-4 w-4 rounded border border-zinc-700 shrink-0" style={{ backgroundColor: c }} title={c} />
                        ))
                        : <span className="text-zinc-600">—</span>}
                    </div>
                  </div>
                  {/* Propósito */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                      <Target className="h-2.5 w-2.5" /> Propósito
                    </span>
                    <div className="flex gap-1.5">
                      {(["ADS", "Orgânico"] as const).map(p => (
                        <button key={p} onClick={() => setSelectedPurpose(p)}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition ${selectedPurpose === p ? "bg-[#FF4E00] text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Shots / Cenas */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                      <LayoutGrid className="h-2.5 w-2.5" /> Shots / Cenas
                    </span>
                    <span className="text-zinc-300 font-medium">
                      {hasShots ? `${storyboard.shots.length} shots · ${sceneGroups.length} cenas` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 p-3 text-[11px] text-zinc-400 flex flex-col gap-1.5">
                  <div className="text-zinc-300 font-semibold text-xs mb-1 flex items-center gap-1.5"><Film className="h-3.5 w-3.5 text-[#FF4E00]" />Como usar</div>
                  {["Cole roteiro ou briefing", "Adicione PDFs de referência", "IA gera o storyboard visual", "Exporte o documento em PDF"].map(t => (
                    <div key={t} className="flex items-start gap-1.5"><span className="text-[#FF4E00] shrink-0">✔</span>{t}</div>
                  ))}
                </div>
                <button onClick={generateStoryboard} disabled={isGenerating || !userInput.trim()}
                  className="w-full bg-[#FF4E00] hover:brightness-110 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm uppercase tracking-wider font-display disabled:opacity-40 disabled:cursor-not-allowed">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  {isGenerating ? "Gerando..." : "Gerar Storyboard"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STORYBOARD DOCUMENT ── */}
        {!hasShots ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-[#FF4E00]/10 flex items-center justify-center">
              <Film className="h-8 w-8 text-[#FF4E00]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-2 font-display">Nenhum storyboard gerado</h3>
              <p className="text-zinc-500 text-sm max-w-md">Cole seu briefing ou roteiro acima, adicione arquivos de referência, e clique em <span className="text-[#FF4E00] font-semibold">Gerar Storyboard</span>. O resultado será um documento visual completo pronto para exportar.</p>
            </div>
          </div>
        ) : (
          /* THE DOCUMENT — this is what gets exported */
          <div ref={documentRef} id="storyboard-document" className="w-full bg-[#0A0A0A]" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}>

            {/* Document header */}
            <div className="border-b border-zinc-800 px-8 py-6 bg-[#0F0F0F]">
              <div className="max-w-[1400px] mx-auto">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">
                  HYPER · STORYBOARD DE MOTION
                </div>
                <h1 className="text-3xl font-bold font-display text-white mb-2">{storyboard.title}</h1>
                <p className="text-zinc-400 text-sm mb-3">{storyboard.objective}</p>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  {[
                    { l: "Duração", v: storyboard.duration }, { l: "Formato", v: storyboard.format },
                    { l: "Tom", v: storyboard.tone }, { l: "Público", v: storyboard.targetAudience },
                    { l: "Shots", v: `${storyboard.shots.length} shots · ${sceneGroups.length} cenas` }
                  ].filter(m => m.v).map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-2.5 py-1">
                      <span className="text-zinc-500 font-mono">{m.l}:</span>
                      <span className="text-zinc-200 font-semibold">{m.v}</span>
                    </div>
                  ))}
                  {storyboard.visualDirection.colorPalette.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-2.5 py-1">
                      <span className="text-zinc-500 font-mono">Paleta:</span>
                      <div className="flex gap-1">
                        {storyboard.visualDirection.colorPalette.map((c, i) => (
                          <div key={i} className="h-4 w-4 rounded-sm border border-zinc-600" style={{ backgroundColor: c }} title={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scene groups */}
            {sceneGroups.map((group, sceneIdx) => (
              <div key={group.name} className="border-b border-zinc-800/60">
                <div className="max-w-[1400px] mx-auto">
                  {/* Scene header */}
                  <div className="flex items-center gap-3 px-8 py-3 border-b border-zinc-800/60 bg-zinc-900/30">
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded tracking-wider shrink-0">
                      CENA {sceneIdx + 1}
                    </span>
                    <h2 className="font-semibold text-zinc-200 font-display text-sm flex-1">{group.name}</h2>
                    <span className="text-zinc-600 text-[10px] font-mono shrink-0">{group.shots.length} shot{group.shots.length > 1 ? "s" : ""}</span>
                  </div>

                  {/* Shot grid — 3 columns */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.shots.map((shot, shotIdx) => (
                      <ShotCard key={shot.id} shot={shot} sceneIdx={sceneIdx} shotIdx={shotIdx}
                        isGeneratingImage={!!imageGeneratingState[shot.id]}
                        onEdit={setEditingShot} onDelete={deleteShot} onDuplicate={duplicateShot} />
                    ))}
                    {/* Add shot — hidden on export */}
                    <div onClick={() => {
                      const newId = `shot-new-${Date.now()}`;
                      const num = storyboard.shots.length + 1;
                      const blank: Shot = { id: newId, shotNumber: num, scene: group.name, duration: "0:00 - 0:03", goal: "", visualDescription: "Descreva o que aparece na tela.", cameraDirection: "Plano médio", motionDirection: "Fade in", transition: "Corte seco", voiceover: "", editorNotes: "", aiImagePrompt: "Cinematic commercial storyboard frame, professional lighting" };
                      setStoryboard(prev => ({ ...prev, shots: [...prev.shots, blank] }));
                      setEditingShot(blank);
                    }} className="export-hide border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[200px] transition-colors text-zinc-700 hover:text-zinc-400">
                      <Plus className="h-7 w-7" />
                      <span className="text-[11px] font-mono uppercase tracking-wider">Adicionar Shot</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Production notes */}
            <div className="px-8 py-6 bg-[#0F0F0F]">
              <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                  <Music className="h-4 w-4 text-[#FF4E00]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider font-display text-zinc-400">Notas de Produção</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {[
                    { label: "Som & Foley", value: storyboard.productionNotes.soundDesign, icon: <Volume2 className="h-3 w-3" /> },
                    { label: "Música", value: storyboard.productionNotes.musicDirection, icon: <Music className="h-3 w-3" /> },
                    { label: "Referências de Motion", value: storyboard.productionNotes.motionReferences, icon: <Film className="h-3 w-3" /> },
                    { label: "Referências de Edição", value: storyboard.productionNotes.editingReferences, icon: <Sliders className="h-3 w-3" /> }
                  ].filter(n => n.value).map((n, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#FF4E00] mb-1.5">
                        {n.icon}{n.label}
                      </div>
                      <p className="text-zinc-400 leading-relaxed">{n.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-700 font-mono">
                  <span>HYPER · STORYBOARD DE MOTION · {storyboard.createdAt}</span>
                  <span>Confidencial</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      <footer className="export-hide border-t border-zinc-800 bg-[#0F0F0F] py-4 text-center text-xs text-zinc-700">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p>© 2026 Motion Storyboard AI — Hyper</p>
          <p>Powered by Gemini AI</p>
        </div>
      </footer>

      {/* Shot edit modal */}
      {editingShot && (
        <ShotEditModal shot={editingShot} allShots={storyboard.shots} isGeneratingImage={!!imageGeneratingState[editingShot.id]}
          onClose={() => setEditingShot(null)} onUpdate={updateShot} onGenerateImage={generateImage}
          onDelete={id => { deleteShot(id); setEditingShot(null); }} onDuplicate={s => { duplicateShot(s); setEditingShot(null); }}
          onNavigate={navigateModal} />
      )}

    </div>
  );
}
