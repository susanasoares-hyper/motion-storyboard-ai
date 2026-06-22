import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sparkles, Layers, Plus, Trash2, Printer, Clock, Camera, Video,
  Music, Volume2, Edit, RefreshCw, Sliders, Palette, Play,
  AlertCircle, Upload, X, FileText, ChevronLeft, ChevronRight,
  Download, Eye, ArrowLeft, ArrowRight, Film
} from "lucide-react";
import { Storyboard, Shot, VisualDirection } from "./types";
import { INITIAL_STORYBOARD } from "./data";

// ─── UploadedFile type ────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  text?: string;
  data?: string;
  size: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function processUploadedFile(file: File): Promise<UploadedFile> {
  const id = `f-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const isText = file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");
  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

  if (isText) {
    const text = await readFileAsText(file);
    return { id, name: file.name, mimeType: "text/plain", text, size: file.size };
  } else if (isPdf) {
    const data = await readFileAsBase64(file);
    return { id, name: file.name, mimeType: "application/pdf", data, size: file.size };
  } else {
    throw new Error(`Formato não suportado: ${file.name}. Use PDF ou TXT.`);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function shotDisplayNumber(sceneIdx: number, shotIdx: number): string {
  return `${sceneIdx + 1}.${shotIdx + 1}`;
}

// ─── ShotCard ─────────────────────────────────────────────────────────────────

interface ShotCardProps {
  shot: Shot;
  sceneIdx: number;
  shotIdx: number;
  isFirst: boolean;
  isLast: boolean;
  isGeneratingImage: boolean;
  onEdit: (shot: Shot) => void;
  onDelete: (id: string) => void;
  onDuplicate: (shot: Shot) => void;
  onMove: (shot: Shot, dir: "left" | "right") => void;
}

function ShotCard({ shot, sceneIdx, shotIdx, isFirst, isLast, isGeneratingImage, onEdit, onDelete, onDuplicate, onMove }: ShotCardProps) {
  const displayNum = shotDisplayNumber(sceneIdx, shotIdx);

  return (
    <div className="shot-card group relative bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-600 transition-colors duration-200">
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 shrink-0">
        <span className="bg-[#FF4E00] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider">
          SHOT {displayNum}
        </span>
        <span className="text-zinc-500 text-[10px] font-mono flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {shot.duration}
        </span>
      </div>

      {/* Image */}
      <div className="relative aspect-video bg-zinc-950 overflow-hidden shrink-0">
        {isGeneratingImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#FF4E00]">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-[10px] font-mono">Gerando...</span>
          </div>
        ) : shot.imageUrl ? (
          <img
            src={shot.imageUrl}
            alt={`Shot ${displayNum}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="h-8 w-8 text-zinc-700" />
          </div>
        )}

        {/* Camera overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-6">
          <span className="text-[10px] text-zinc-300 font-mono truncate block">{shot.cameraDirection}</span>
        </div>

        {/* Edit overlay on hover — no-print */}
        <button
          onClick={() => onEdit(shot)}
          className="no-print absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
          title="Editar shot"
        >
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-2 flex items-center gap-2 text-white text-xs font-semibold">
            <Edit className="h-3.5 w-3.5" />
            Editar
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2.5 flex-1 text-xs">
        <p className="text-zinc-300 leading-relaxed line-clamp-3">{shot.visualDescription}</p>

        <div className="border-t border-zinc-800/60 pt-2 flex flex-col gap-1.5">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 block">ANIMAÇÃO</span>
            <span className="text-zinc-400 text-[11px]">{shot.motionDirection}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-zinc-800 text-zinc-400 text-[9px] font-mono px-1.5 py-0.5 rounded">{shot.transition}</span>
          </div>
        </div>

        {shot.voiceover && (
          <div className="border-t border-zinc-800/60 pt-2">
            <p className="text-zinc-400 italic text-[11px] leading-relaxed line-clamp-2">"{shot.voiceover}"</p>
          </div>
        )}
      </div>

      {/* Hover controls — no-print */}
      <div className="no-print absolute top-10 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(shot); }}
          className="p-1.5 rounded bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-400 hover:text-white text-[9px] font-mono cursor-pointer"
          title="Duplicar"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(shot.id); }}
          className="p-1.5 rounded bg-zinc-900/90 backdrop-blur border border-zinc-700 text-rose-400 hover:text-rose-300 cursor-pointer"
          title="Excluir"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        {!isFirst && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(shot, "left"); }}
            className="p-1.5 rounded bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
            title="Mover para esquerda"
          >
            <ArrowLeft className="h-3 w-3" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(shot, "right"); }}
            className="p-1.5 rounded bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
            title="Mover para direita"
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ShotEditModal ────────────────────────────────────────────────────────────

interface ShotEditModalProps {
  shot: Shot;
  allShots: Shot[];
  isGeneratingImage: boolean;
  onClose: () => void;
  onUpdate: (shotId: string, field: keyof Shot, value: any) => void;
  onGenerateImage: (shotId: string, prompt: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (shot: Shot) => void;
  onNavigate: (dir: "prev" | "next") => void;
}

function ShotEditModal({ shot, allShots, isGeneratingImage, onClose, onUpdate, onGenerateImage, onDelete, onDuplicate, onNavigate }: ShotEditModalProps) {
  const idx = allShots.findIndex(s => s.id === shot.id);
  const canPrev = idx > 0;
  const canNext = idx < allShots.length - 1;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#111] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-[#111] z-10">
          <div className="flex items-center gap-3">
            <span className="bg-[#FF4E00] text-white text-xs font-mono font-bold px-3 py-1 rounded">
              SHOT {String(shot.shotNumber).padStart(2, "0")}
            </span>
            <span className="text-zinc-400 text-sm">{shot.scene || "Storyboard"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDuplicate(shot)}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded bg-zinc-800 border border-zinc-700 cursor-pointer"
            >
              Duplicar
            </button>
            <button
              onClick={() => { onDelete(shot.id); onClose(); }}
              className="p-1.5 rounded bg-rose-950/30 border border-rose-900/50 text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: image */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
              {isGeneratingImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#FF4E00]">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-mono">Gerando imagem...</span>
                </div>
              ) : shot.imageUrl ? (
                <img src={shot.imageUrl} alt={`Shot ${shot.shotNumber}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="h-10 w-10 text-zinc-700" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Prompt de IA (para gerar imagem)</label>
              <textarea
                value={shot.aiImagePrompt}
                rows={4}
                onChange={e => onUpdate(shot.id, "aiImagePrompt", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded-lg p-2.5 text-[11px] font-mono text-zinc-300 outline-none leading-relaxed w-full resize-none"
              />
              <button
                onClick={() => onGenerateImage(shot.id, shot.aiImagePrompt)}
                disabled={isGeneratingImage}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs py-2 rounded-lg transition disabled:opacity-40 cursor-pointer font-medium"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#FF4E00] ${isGeneratingImage ? "animate-spin" : ""}`} />
                {isGeneratingImage ? "Gerando..." : "Regenerar Imagem com IA"}
              </button>
            </div>
          </div>

          {/* Right: fields */}
          <div className="flex flex-col gap-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Duração</label>
                <input
                  type="text"
                  value={shot.duration}
                  onChange={e => onUpdate(shot.id, "duration", e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono outline-none focus:border-[#FF4E00]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Cena</label>
                <input
                  type="text"
                  value={shot.scene || ""}
                  onChange={e => onUpdate(shot.id, "scene", e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-[#FF4E00]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Objetivo do Shot</label>
              <input
                type="text"
                value={shot.goal}
                onChange={e => onUpdate(shot.id, "goal", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-[#FF4E00]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Descrição Visual</label>
              <textarea
                value={shot.visualDescription}
                rows={4}
                onChange={e => onUpdate(shot.id, "visualDescription", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded p-2.5 text-zinc-200 outline-none leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Camera className="h-3 w-3 text-[#FF4E00]" /> Câmera
                </label>
                <input
                  type="text"
                  value={shot.cameraDirection}
                  onChange={e => onUpdate(shot.id, "cameraDirection", e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-[#FF4E00]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Sliders className="h-3 w-3 text-[#FF4E00]" /> Motion / Animação
                </label>
                <input
                  type="text"
                  value={shot.motionDirection}
                  onChange={e => onUpdate(shot.id, "motionDirection", e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-[#FF4E00]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Video className="h-3 w-3 text-[#FF4E00]" /> Transição
                </label>
                <input
                  type="text"
                  value={shot.transition}
                  onChange={e => onUpdate(shot.id, "transition", e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-[#FF4E00]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                <Volume2 className="h-3 w-3 text-[#FF4E00]" /> Narração (Voiceover)
              </label>
              <textarea
                value={shot.voiceover}
                rows={3}
                onChange={e => onUpdate(shot.id, "voiceover", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 focus:border-[#FF4E00] rounded p-2.5 text-orange-200 italic outline-none leading-relaxed resize-none"
                placeholder="Texto narrado neste momento..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Notas do Editor</label>
              <input
                type="text"
                value={shot.editorNotes}
                onChange={e => onUpdate(shot.id, "editorNotes", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-400 font-mono outline-none focus:border-[#FF4E00]"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <button
            onClick={() => onNavigate("prev")}
            disabled={!canPrev}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer px-3 py-2 rounded-lg hover:bg-zinc-800 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Shot anterior
          </button>
          <span className="text-xs text-zinc-600 font-mono">{idx + 1} / {allShots.length}</span>
          <button
            onClick={() => onNavigate("next")}
            disabled={!canNext}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer px-3 py-2 rounded-lg hover:bg-zinc-800 transition"
          >
            Próximo shot
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FileUploadZone ───────────────────────────────────────────────────────────

interface FileUploadZoneProps {
  files: UploadedFile[];
  onAdd: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}

function FileUploadZone({ files, onAdd, onRemove }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setProcessing(true);
    setError(null);
    const results: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const processed = await processUploadedFile(file);
        results.push(processed);
      } catch (e: any) {
        setError(e.message);
      }
    }
    onAdd(results);
    setProcessing(false);
  }, [onAdd]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[80px] ${
          dragOver
            ? "border-[#FF4E00] bg-[#FF4E00]/5 text-[#FF4E00]"
            : "border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-400"
        }`}
      >
        {processing ? (
          <RefreshCw className="h-5 w-5 animate-spin text-[#FF4E00]" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
        <span className="text-xs text-center">
          {processing ? "Processando..." : "Arraste arquivos de referência aqui"}
        </span>
        <span className="text-[10px] text-zinc-600">PDF, TXT — briefings, roteiros, transcrições</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
              <FileText className="h-3 w-3 text-[#FF4E00] shrink-0" />
              <span className="truncate max-w-[140px]">{f.name}</span>
              <span className="text-zinc-600 text-[10px]">{formatFileSize(f.size)}</span>
              <button
                onClick={() => onRemove(f.id)}
                className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
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
  const [userInput, setUserInput] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("Comercial Cinematográfico");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingStatus, setGeneratingStatus] = useState<string>("");
  const [imageGeneratingState, setImageGeneratingState] = useState<{ [id: string]: boolean }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showProjectMeta, setShowProjectMeta] = useState<boolean>(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Group shots by scene
  const sceneGroups = useMemo(() => {
    const groups: { name: string; shots: Shot[] }[] = [];
    const seenNames = new Map<string, number>();
    for (const shot of storyboard.shots) {
      const name = shot.scene || "Storyboard";
      if (seenNames.has(name)) {
        groups[seenNames.get(name)!].shots.push(shot);
      } else {
        seenNames.set(name, groups.length);
        groups.push({ name, shots: [shot] });
      }
    }
    return groups;
  }, [storyboard.shots]);

  const hasShots = storyboard.shots.length > 0;

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const handleUpdateShotField = useCallback((shotId: string, field: keyof Shot, value: any) => {
    setStoryboard(prev => ({
      ...prev,
      shots: prev.shots.map(s => s.id === shotId ? { ...s, [field]: value } : s)
    }));
    // Keep editingShot in sync
    setEditingShot(prev => prev?.id === shotId ? { ...prev, [field]: value } : prev);
  }, []);

  const handleUpdateMetaField = useCallback((section: "visualDirection" | "productionNotes", field: string, value: any) => {
    setStoryboard(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value }
    }));
  }, []);

  const handleUpdateProjectField = useCallback((field: "title" | "objective" | "targetAudience" | "tone" | "duration", value: string) => {
    setStoryboard(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDeleteShot = useCallback((shotId: string) => {
    setStoryboard(prev => {
      if (prev.shots.length <= 1) return prev;
      const filtered = prev.shots.filter(s => s.id !== shotId).map((s, i) => ({ ...s, shotNumber: i + 1 }));
      return { ...prev, shots: filtered };
    });
  }, []);

  const handleDuplicateShot = useCallback((shot: Shot) => {
    setStoryboard(prev => {
      const idx = prev.shots.findIndex(s => s.id === shot.id);
      const newShot: Shot = { ...shot, id: `shot-dup-${Date.now()}`, shotNumber: prev.shots.length + 1 };
      const updated = [...prev.shots];
      updated.splice(idx + 1, 0, newShot);
      return { ...prev, shots: updated.map((s, i) => ({ ...s, shotNumber: i + 1 })) };
    });
  }, []);

  const handleMoveShot = useCallback((shot: Shot, dir: "left" | "right") => {
    setStoryboard(prev => {
      const idx = prev.shots.findIndex(s => s.id === shot.id);
      const targetIdx = dir === "left" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.shots.length) return prev;
      const reordered = [...prev.shots];
      [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
      return { ...prev, shots: reordered.map((s, i) => ({ ...s, shotNumber: i + 1 })) };
    });
  }, []);

  const handleAddBlankShot = useCallback(() => {
    const newId = `shot-new-${Date.now()}`;
    const newNum = storyboard.shots.length + 1;
    const blank: Shot = {
      id: newId,
      shotNumber: newNum,
      scene: storyboard.shots[storyboard.shots.length - 1]?.scene || "Nova Cena",
      duration: "0:00 - 0:03",
      goal: "Descreva o objetivo deste shot",
      visualDescription: "Descreva o que aparece na tela neste momento.",
      cameraDirection: "Plano médio, câmera estática",
      motionDirection: "Fade in suave",
      transition: "Corte seco",
      voiceover: "",
      editorNotes: "",
      aiImagePrompt: "Cinematic commercial storyboard frame, product-focused, professional lighting",
      imageUrl: undefined
    };
    setStoryboard(prev => ({ ...prev, shots: [...prev.shots, blank] }));
    setEditingShot(blank);
  }, [storyboard.shots]);

  const handleGenerateFrameImage = useCallback(async (shotId: string, prompt: string) => {
    setImageGeneratingState(prev => ({ ...prev, [shotId]: true }));
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${selectedStyle}: ${prompt}`, aspectRatio: selectedAspectRatio })
      });
      if (!response.ok) throw new Error("Erro na geração de imagem");
      const result = await response.json();
      if (result.imageUrl) {
        setStoryboard(prev => ({
          ...prev,
          shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: result.imageUrl } : s)
        }));
        setEditingShot(prev => prev?.id === shotId ? { ...prev, imageUrl: result.imageUrl } : prev);
      }
    } catch (err: any) {
      // Fallback to pollinations
      const seed = Math.floor(Math.random() * 9999);
      const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=800&height=500&seed=${seed}&nologo=true`;
      setStoryboard(prev => ({
        ...prev,
        shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: url } : s)
      }));
      setEditingShot(prev => prev?.id === shotId ? { ...prev, imageUrl: url } : prev);
    } finally {
      setImageGeneratingState(prev => ({ ...prev, [shotId]: false }));
    }
  }, [selectedStyle, selectedAspectRatio]);

  const handleNavigateModal = useCallback((dir: "prev" | "next") => {
    if (!editingShot) return;
    const idx = storyboard.shots.findIndex(s => s.id === editingShot.id);
    const newIdx = dir === "prev" ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < storyboard.shots.length) {
      setEditingShot(storyboard.shots[newIdx]);
    }
  }, [editingShot, storyboard.shots]);

  const executeClientFallback = useCallback((scriptText: string, style: string, aspect: "16:9" | "9:16") => {
    const blocks = scriptText.split(/\n\n+/).map(s => s.trim()).filter(s => s.length > 20);
    const count = Math.max(4, Math.min(8, blocks.length));
    const scenes = ["Abertura — Impacto inicial", "Desenvolvimento — Argumento central", "Prova social — Resultados", "Encerramento — CTA"];
    const shots: Shot[] = Array.from({ length: count }, (_, i) => ({
      id: `shot-fb-${i + 1}-${Date.now()}`,
      shotNumber: i + 1,
      scene: scenes[Math.floor(i / 2) % scenes.length],
      duration: `0:${String(i * 4).padStart(2, "0")} - 0:${String((i + 1) * 4).padStart(2, "0")}`,
      goal: `Comunicar ponto-chave ${i + 1}`,
      visualDescription: blocks[i] || `Cena visual ${i + 1} com elementos cinematográficos de destaque.`,
      cameraDirection: ["Plano médio, câmera estática", "Close-up com dolly lento", "Plano aberto, câmera alta", "Zoom in suave"][i % 4],
      motionDirection: ["Tipografia cinética entrando da esquerda", "Contador de número animado", "Card com stagger pop", "Logo reveal com glow"][i % 4],
      transition: ["Corte seco", "Whip pan", "Fade suave", "Match cut"][i % 4],
      voiceover: blocks[i]?.slice(0, 100) || "",
      editorNotes: "Sincronizar com batida musical",
      aiImagePrompt: `${style} style commercial storyboard frame, ${blocks[i]?.slice(0, 80) || "product showcase"}, cinematic lighting`,
      imageUrl: `https://images.unsplash.com/photo-${["1618005182384-a83a8bd57fbe", "1634017839464-5c339ebe3cb4", "1550751827-4bd374c3f58b", "1614741118887-7a4ee193a5fa", "1600132806370-bf17e65e942f", "1541701494587-cb58502866ab", "1518770660439-4636190af475", "1535303311169-de17f07e3b54"][i % 8]}?w=800&auto=format&fit=crop&q=80`
    }));

    setStoryboard({
      id: `sb-${Date.now()}`,
      title: "Storyboard Gerado Localmente",
      objective: scriptText.slice(0, 120),
      targetAudience: "Público definido no briefing",
      duration: `${count * 4}s`,
      format: aspect === "9:16" ? "9:16 Vertical" : "16:9 Landscape",
      tone: "Energético, moderno",
      aspectRatio: aspect,
      createdAt: new Date().toISOString().split("T")[0],
      visualDirection: {
        artDirection: `${style} — visualmente impactante`,
        colorPalette: ["#090A0F", "#1E293B", "#F59E0B", "#38BDF8", "#F1F5F9"],
        motionStyle: "Animações fluidas com timing preciso",
        cameraStyle: "Ângulos variados, mix de planos"
      },
      shots,
      productionNotes: {
        soundDesign: "Foley e efeitos sonoros sincronizados",
        musicDirection: "Trilha energética e moderna",
        motionReferences: "Referências de agências top br",
        editingReferences: "Cortes rítmicos com beat-sync"
      }
    });
  }, []);

  const handleGenerateStoryboard = useCallback(async () => {
    if (!userInput.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setWarningMessage(null);
    setGeneratingStatus("Analisando roteiro e arquivos de referência com Gemini AI...");

    try {
      const filesPayload = uploadedFiles.map(f => ({
        name: f.name,
        mimeType: f.mimeType,
        text: f.text,
        data: f.data
      }));

      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: userInput,
          style: selectedStyle,
          aspectRatio: selectedAspectRatio,
          files: filesPayload
        })
      });

      setGeneratingStatus("Estruturando cenas, câmeras e direção visual...");

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      if (!result?.shots?.length) throw new Error("Estrutura inválida");

      const parsedShots: Shot[] = result.shots.map((s: Partial<Shot>, idx: number) => {
        const num = s.shotNumber || (idx + 1);
        const queryPrompt = encodeURIComponent(`${selectedStyle}: ${s.aiImagePrompt || s.visualDescription}`);
        return {
          id: `shot-${num}-${Date.now()}`,
          shotNumber: num,
          scene: s.scene || "Storyboard",
          duration: s.duration || `0:0${idx * 3} - 0:0${(idx + 1) * 3}`,
          goal: s.goal || "",
          visualDescription: s.visualDescription || "",
          cameraDirection: s.cameraDirection || "",
          motionDirection: s.motionDirection || "",
          transition: s.transition || "",
          voiceover: s.voiceover || "",
          editorNotes: s.editorNotes || "",
          aiImagePrompt: s.aiImagePrompt || "",
          imageUrl: `https://image.pollinations.ai/p/${queryPrompt}?width=800&height=500&seed=${num}&nologo=true`
        };
      });

      setStoryboard({
        id: `sb-${Date.now()}`,
        title: result.title || "Storyboard",
        objective: result.objective || "",
        targetAudience: result.targetAudience || "",
        duration: result.duration || "",
        format: result.format || `${selectedAspectRatio} Vídeo`,
        tone: result.tone || "",
        aspectRatio: selectedAspectRatio,
        createdAt: new Date().toISOString().split("T")[0],
        visualDirection: {
          artDirection: result.visualDirection?.artDirection || "",
          colorPalette: result.visualDirection?.colorPalette || ["#090A0F", "#1E293B", "#F59E0B", "#38BDF8", "#F1F5F9"],
          motionStyle: result.visualDirection?.motionStyle || "",
          cameraStyle: result.visualDirection?.cameraStyle || ""
        },
        shots: parsedShots,
        productionNotes: {
          soundDesign: result.productionNotes?.soundDesign || "",
          musicDirection: result.productionNotes?.musicDirection || "",
          motionReferences: result.productionNotes?.motionReferences || "",
          editingReferences: result.productionNotes?.editingReferences || ""
        }
      });

      setTimeout(() => documentRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      console.warn("Backend failed, using local fallback:", err);
      executeClientFallback(userInput, selectedStyle, selectedAspectRatio);
      setWarningMessage("Modo de simulação ativo — configure a GEMINI_API_KEY para ativar a IA completa.");
    } finally {
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  }, [userInput, uploadedFiles, selectedStyle, selectedAspectRatio, executeClientFallback]);

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans">

      {/* ── HEADER ── */}
      <header className="no-print border-b border-zinc-800 bg-[#0F0F0F]/95 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#FF4E00] flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <div className="text-[10px] tracking-widest uppercase font-mono font-bold text-[#FF4E00]">Motion Storyboard AI</div>
            <div className="text-[11px] text-zinc-500">Estúdio de Vídeo Inteligente</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasShots && (
            <>
              <button
                onClick={() => setShowProjectMeta(p => !p)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition cursor-pointer ${
                  showProjectMeta ? "bg-zinc-800 text-white border-zinc-600" : "text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Projeto
              </button>
              <button
                onClick={handleAddBlankShot}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo Shot
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-[#FF4E00] hover:brightness-110 text-white font-bold transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar PDF
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── WARNINGS ── */}
      {warningMessage && (
        <div className="no-print bg-amber-900/20 border-b border-amber-800/30 px-4 py-2 text-xs text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {warningMessage}
          </div>
          <button onClick={() => setWarningMessage(null)} className="text-amber-600 hover:text-amber-300 cursor-pointer ml-4">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="no-print bg-rose-900/20 border-b border-rose-800/30 px-4 py-2 text-xs text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-300 cursor-pointer ml-4">✕</button>
        </div>
      )}

      <main className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 gap-8">

        {/* ── BRIEFING SECTION ── */}
        <section className="no-print bg-[#0F0F0F] border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF4E00]" />
              <h2 className="font-bold text-sm uppercase tracking-wider font-display text-white">Briefing & Geração</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <select
                value={selectedStyle}
                onChange={e => setSelectedStyle(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-[#FF4E00] outline-none cursor-pointer"
              >
                <option value="Comercial Cinematográfico">Comercial Cinematográfico</option>
                <option value="Minimalista Tech">Minimalista Tech (Dark / Glass)</option>
                <option value="3D Chrome">3D Chrome (Octane Render)</option>
                <option value="Cyberpunk Neon">Cyberpunk Neon</option>
                <option value="Esboço Editorial">Esboço Editorial</option>
                <option value="UI Motion">UI Motion (App / SaaS)</option>
              </select>
              <select
                value={selectedAspectRatio}
                onChange={e => setSelectedAspectRatio(e.target.value as "16:9" | "9:16")}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-[#FF4E00] outline-none cursor-pointer"
              >
                <option value="16:9">16:9 Horizontal</option>
                <option value="9:16">9:16 Vertical (Reels/TikTok)</option>
              </select>
            </div>
          </div>

          {/* File upload */}
          <FileUploadZone
            files={uploadedFiles}
            onAdd={newFiles => setUploadedFiles(prev => [...prev, ...newFiles])}
            onRemove={id => setUploadedFiles(prev => prev.filter(f => f.id !== id))}
          />

          {/* Script textarea + generate */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-9 relative">
              <textarea
                value={userInput}
                rows={6}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Cole seu roteiro, briefing, transcrição de VSL ou ideias de campanha aqui..."
                className="bg-zinc-950 hover:bg-[#111] border border-zinc-800 focus:border-[#FF4E00] focus:ring-1 focus:ring-[#FF4E00] rounded-xl p-4 text-sm text-zinc-200 outline-none leading-relaxed w-full resize-none font-serif h-[150px]"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur rounded-xl flex flex-col items-center justify-center gap-3 text-[#FF4E00]">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-mono font-bold tracking-widest uppercase">{generatingStatus}</span>
                </div>
              )}
            </div>
            <div className="lg:col-span-3 flex flex-col gap-3">
              <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 p-3 flex flex-col gap-1.5 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs mb-1">
                  <Eye className="h-3.5 w-3.5 text-[#FF4E00]" /> Como funciona
                </div>
                <div className="flex items-start gap-1.5"><span className="text-[#FF4E00] mt-0.5">✔</span> Cole o roteiro ou briefing</div>
                <div className="flex items-start gap-1.5"><span className="text-[#FF4E00] mt-0.5">✔</span> Adicione PDFs de referência</div>
                <div className="flex items-start gap-1.5"><span className="text-[#FF4E00] mt-0.5">✔</span> A IA transforma em storyboard visual</div>
                <div className="flex items-start gap-1.5"><span className="text-[#FF4E00] mt-0.5">✔</span> Exporte em PDF profissional</div>
              </div>
              <button
                onClick={handleGenerateStoryboard}
                disabled={isGenerating || !userInput.trim()}
                className="w-full bg-[#FF4E00] hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg cursor-pointer text-sm uppercase tracking-wider font-display disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                {isGenerating ? "Gerando..." : "Gerar Storyboard"}
              </button>
            </div>
          </div>
        </section>

        {/* ── DOCUMENT VIEW ── */}
        <div ref={documentRef}>
          {!hasShots ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#FF4E00]/10 flex items-center justify-center">
                <Film className="h-8 w-8 text-[#FF4E00]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-2 font-display">Nenhum storyboard ainda</h3>
                <p className="text-zinc-500 text-sm max-w-sm">
                  Cole seu briefing ou roteiro acima, adicione arquivos de referência se tiver, e clique em <span className="text-[#FF4E00] font-semibold">Gerar Storyboard</span>.
                </p>
              </div>
            </div>
          ) : (
            /* Document */
            <div className="flex flex-col gap-0">

              {/* Document title block */}
              <div className="border border-zinc-800 rounded-t-2xl bg-[#0F0F0F] px-6 py-5 flex flex-col gap-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">STORYBOARD DE MOTION</div>
                    {showProjectMeta ? (
                      <input
                        type="text"
                        value={storyboard.title}
                        onChange={e => handleUpdateProjectField("title", e.target.value)}
                        className="text-2xl sm:text-3xl font-bold font-display text-white bg-transparent border-b border-zinc-700 outline-none w-full focus:border-[#FF4E00]"
                      />
                    ) : (
                      <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">{storyboard.title}</h1>
                    )}
                  </div>
                  <div className="no-print text-[10px] text-zinc-600 font-mono shrink-0">{storyboard.createdAt}</div>
                </div>

                {/* Metadata chips */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {[
                    { label: "Duração", value: storyboard.duration },
                    { label: "Formato", value: storyboard.format },
                    { label: "Tom", value: storyboard.tone },
                    { label: "Shots", value: `${storyboard.shots.length} shots` },
                    { label: "Cenas", value: `${sceneGroups.length} cenas` }
                  ].filter(m => m.value).map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1">
                      <span className="text-zinc-500 font-mono">{m.label}:</span>
                      <span className="text-zinc-200 font-semibold">{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Objective + Color palette */}
                {(storyboard.objective || storyboard.visualDirection.colorPalette.length > 0) && (
                  <div className="flex flex-wrap items-start gap-4 pt-1 border-t border-zinc-800/60">
                    {storyboard.objective && (
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 block mb-1">Objetivo</span>
                        {showProjectMeta ? (
                          <textarea
                            value={storyboard.objective}
                            rows={2}
                            onChange={e => handleUpdateProjectField("objective", e.target.value)}
                            className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-700 rounded p-1.5 outline-none focus:border-[#FF4E00] w-full resize-none"
                          />
                        ) : (
                          <p className="text-xs text-zinc-400 leading-relaxed">{storyboard.objective}</p>
                        )}
                      </div>
                    )}
                    {storyboard.visualDirection.colorPalette.length > 0 && (
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 block mb-1.5">Paleta</span>
                        <div className="flex gap-1.5">
                          {storyboard.visualDirection.colorPalette.map((color, idx) => (
                            <div key={idx} className="relative group/color">
                              <div
                                className="h-7 w-7 rounded-lg border border-zinc-700 cursor-pointer"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                              {showProjectMeta && (
                                <input
                                  type="color"
                                  value={color.startsWith("#") && color.length === 7 ? color : "#000000"}
                                  onChange={e => {
                                    const updated = [...storyboard.visualDirection.colorPalette];
                                    updated[idx] = e.target.value;
                                    handleUpdateMetaField("visualDirection", "colorPalette", updated);
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Art direction — only when meta is open */}
                {showProjectMeta && (
                  <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                    {[
                      { key: "artDirection", label: "Direção de Arte" },
                      { key: "motionStyle", label: "Estilo de Motion" },
                      { key: "cameraStyle", label: "Estilo de Câmera" }
                    ].map(field => (
                      <div key={field.key} className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">{field.label}</label>
                        <input
                          type="text"
                          value={(storyboard.visualDirection as any)[field.key]}
                          onChange={e => handleUpdateMetaField("visualDirection", field.key, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-[#FF4E00]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scene groups */}
              {sceneGroups.map((group, sceneIdx) => (
                <div key={group.name} className="scene-group border-x border-b border-zinc-800 last:rounded-b-2xl bg-[#0A0A0A]">
                  {/* Scene header */}
                  <div className="flex items-center gap-3 px-6 py-3.5 bg-zinc-900/40 border-b border-zinc-800/80">
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded tracking-wider shrink-0">
                      CENA {sceneIdx + 1}
                    </span>
                    <h2 className="font-semibold text-zinc-200 text-sm font-display flex-1">{group.name}</h2>
                    <span className="text-zinc-600 text-[10px] font-mono shrink-0">{group.shots.length} shot{group.shots.length > 1 ? "s" : ""}</span>
                  </div>

                  {/* Shot grid */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.shots.map((shot, shotIdx) => {
                      const globalIdx = storyboard.shots.findIndex(s => s.id === shot.id);
                      return (
                        <ShotCard
                          key={shot.id}
                          shot={shot}
                          sceneIdx={sceneIdx}
                          shotIdx={shotIdx}
                          isFirst={globalIdx === 0}
                          isLast={globalIdx === storyboard.shots.length - 1}
                          isGeneratingImage={!!imageGeneratingState[shot.id]}
                          onEdit={setEditingShot}
                          onDelete={handleDeleteShot}
                          onDuplicate={handleDuplicateShot}
                          onMove={handleMoveShot}
                        />
                      );
                    })}

                    {/* Add shot button */}
                    <div
                      onClick={handleAddBlankShot}
                      className="no-print border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[180px] transition-colors text-zinc-600 hover:text-zinc-400"
                    >
                      <Plus className="h-7 w-7" />
                      <span className="text-[11px] font-mono uppercase tracking-wider">Adicionar Shot</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Production notes */}
              <div className="border-x border-b border-zinc-800 rounded-b-2xl bg-[#0F0F0F] px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="h-4 w-4 text-[#FF4E00]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider font-display text-zinc-300">Notas de Produção</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {[
                    { key: "soundDesign", label: "Som & Foley", icon: <Volume2 className="h-3 w-3" /> },
                    { key: "musicDirection", label: "Música", icon: <Music className="h-3 w-3" /> },
                    { key: "motionReferences", label: "Referências de Motion", icon: <Play className="h-3 w-3" /> },
                    { key: "editingReferences", label: "Referências de Edição", icon: <Film className="h-3 w-3" /> }
                  ].map(field => (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                        <span className="text-[#FF4E00]">{field.icon}</span>
                        {field.label}
                      </label>
                      {showProjectMeta ? (
                        <textarea
                          value={(storyboard.productionNotes as any)[field.key]}
                          rows={2}
                          onChange={e => handleUpdateMetaField("productionNotes", field.key, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-400 outline-none focus:border-[#FF4E00] text-[11px] resize-none"
                        />
                      ) : (
                        <p className="text-zinc-400 leading-relaxed">{(storyboard.productionNotes as any)[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="no-print border-t border-zinc-800 bg-[#0F0F0F] mt-6 py-5 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p>© 2026 Motion Storyboard AI — Hyper</p>
          <p className="text-zinc-700">Powered by Gemini AI</p>
        </div>
      </footer>

      {/* ── SHOT EDIT MODAL ── */}
      {editingShot && (
        <ShotEditModal
          shot={editingShot}
          allShots={storyboard.shots}
          isGeneratingImage={!!imageGeneratingState[editingShot.id]}
          onClose={() => setEditingShot(null)}
          onUpdate={handleUpdateShotField}
          onGenerateImage={handleGenerateFrameImage}
          onDelete={id => { handleDeleteShot(id); setEditingShot(null); }}
          onDuplicate={shot => { handleDuplicateShot(shot); setEditingShot(null); }}
          onNavigate={handleNavigateModal}
        />
      )}

    </div>
  );
}
