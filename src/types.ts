export interface VisualDirection {
  artDirection: string;
  colorPalette: string[];
  motionStyle: string;
  cameraStyle: string;
}

export interface ProductionNotes {
  soundDesign: string;
  musicDirection: string;
  motionReferences: string;
  editingReferences: string;
}

export interface Shot {
  id: string;
  shotNumber: number;
  duration: string;
  goal: string;
  visualDescription: string;
  cameraDirection: string;
  motionDirection: string;
  transition: string;
  voiceover: string;
  editorNotes: string;
  aiImagePrompt: string;
  imageUrl?: string;
}

export interface Storyboard {
  id: string;
  title: string;
  objective: string;
  targetAudience: string;
  duration: string;
  format: string;
  tone: string;
  visualDirection: VisualDirection;
  shots: Shot[];
  productionNotes: ProductionNotes;
  aspectRatio: "16:9" | "9:16";
  createdAt: string;
}
