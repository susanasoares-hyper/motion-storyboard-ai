import { Storyboard } from "./types";

export interface ScriptTemplate {
  name: string;
  category: string;
  icon: string;
  aspectRatio: "16:9" | "9:16";
  style: string;
  prompt: string;
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    name: "SaaS Workspace Launch Film",
    category: "Product Promo",
    icon: "Layers",
    aspectRatio: "16:9",
    style: "Minimalist Tech",
    prompt: `[VISUAL STYLE: Linear/Mercury Dark Slate, floating UI glass, ultra-crisp motion blur]
[0:00 - 0:02] A dark obsidian workspace loading screen. A single, razor-sharp glowing cursor flies across the void, leaving a tail of soft electric blue light. VO: "In a world of scattered tabs..."
[0:02 - 0:05] The screen blossoms into a beautiful 3D dashboard grid. Floating widgets with real-time analytics slide in from the left and right with high-speed inertial ease. VO: "...there is finally a singular center."
[0:05 - 0:08] A fast camera zoom into a specific glowing interactive card. The card expands instantly while the background collapses into a smooth cinematic blur. VO: "Focus, automated."
[0:08 - 0:12] High-contrast logo lockup. The abstract logo splits and glows with a warm backlight. Tagline slides in slowly: "One command. Total control."`
  },
  {
    name: "HydroActive FitBottle TikTok Ad",
    category: "Direct-Response Ad",
    icon: "Flame",
    aspectRatio: "9:16",
    style: "Cinematic commercial",
    prompt: `[VISUAL STYLE: High-contrast athletic lighting, splashy water drops, high-speed camera]
[0:00 - 0:03] Extreme close-up of a sleek, matte-black smart bottle on a dark gymnasium bench. Sharp water droplets slowly slide down the flask as a gym neon purple light flashes behind it. VO: "This is not another water bottle."
[0:03 - 0:06] Match-cut to a runner's hand grabbing the bottle in stride. Wide-angle shot of the runner sprinting on a rain-slicked city running track at twilight. Behind them, the city lights form a beautiful soft bokeh. VO: "Track hydration. Fuel performance."
[0:06 - 0:09] The bottle's digital collar glows warm rings of yellow and blue light depending on daily goals. The camera pans down rapidly to reveal a mobile app interface updating a beautiful wave hydration graph in real-time. VO: "Synced with Apple Watch and Garmin instantaneously."
[0:09 - 0:12] Close-up of water splashing dramatically in slow motion around the bottle. Text overlay in bold geometric sans-serif typography flashes: "UPGRADE YET? 30% OFF LINK BELOW."`
  },
  {
    name: "Nova Ring: Wearable Bio-Tracker",
    category: "Luxury Explainer",
    icon: "Sparkles",
    aspectRatio: "16:9",
    style: "Apple Commercial",
    prompt: `[VISUAL STYLE: Sleek luxury jewelry aesthetic, macro lens, golden hour rim lighting]
[0:00 - 0:03] Extreme macro shot of a titanium ring spinning in zero-gravity. Golden sunlight reflects off the polished surface, casting sharp diagonal lines across the dark velvet background. VO: "Sensing health, with absolute elegance."
[0:03 - 0:07] Smooth pan to a person sleeping peacefully in an elegant suite. A gentle, soft green pulse reflects from the inner surface of the ring onto the user's skin, symbolizing active sleep-phase analysis. VO: "Quietly monitoring your bio-rhythms through the night."
[0:07 - 0:10] Match cut to the user pouring coffee, morning light streaming of a window. Abstract colored particle graphs rise from the ring and float in the air in stunning AR, demonstrating heart-rate and recovery scores. VO: "Wake up with data that guides your day."
[0:10 - 0:12] Elegant end frame. The ring slides gracefully onto a sleek wireless charger stone. White text fades in: "Nova Ring. Wear Your Energy."`
  }
];

export const INITIAL_STORYBOARD: Storyboard = {
  id: "sb-empty",
  title: "",
  objective: "",
  targetAudience: "",
  duration: "",
  format: "16:9 Vídeo Landscape",
  tone: "",
  aspectRatio: "16:9",
  createdAt: new Date().toISOString().split('T')[0],
  visualDirection: {
    artDirection: "",
    colorPalette: ["#090A0F", "#1E293B", "#F59E0B", "#38BDF8", "#F1F5F9"],
    motionStyle: "",
    cameraStyle: ""
  },
  shots: [],
  productionNotes: {
    soundDesign: "",
    musicDirection: "",
    motionReferences: "",
    editingReferences: ""
  }
};
