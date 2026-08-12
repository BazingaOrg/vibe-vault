export const STYLE_VOCABULARY = [
  "Minimalism", "Swiss-International", "Neo-Brutalism", "Brutalism", "Glassmorphism",
  "Neumorphism", "Claymorphism", "Flat", "Material", "Skeuomorphism", "Editorial",
  "Corporate", "Dark-Tech", "Retro-Y2K", "Memphis", "Maximalism", "Luxury-Elegant",
  "Geometric-Bauhaus", "Playful-Illustrative", "Organic-Natural"
] as const;
export type StyleName = typeof STYLE_VOCABULARY[number];
export type Stability = "L1" | "L2" | "L3" | "L4";

export interface RawSample {
  tag: string; text: boolean; media: boolean; rect: { x: number; y: number; width: number; height: number };
  colors: Record<string, string>; fontFamily: string; fontSize: number; fontWeight: number; lineHeight: number;
  letterSpacing?: number; fontStyle?: string; textTransform?: string;
  borderWidth?: number; borderStyle?: string; opacity?: number;
  radius: number; shadow: string; spacing: number[]; root?: boolean;
}
export interface RawExtraction {
  url: string; id: string; collectedAt: string; viewport: { width: number; height: number };
  samples: RawSample[]; rootVariables: Record<string, string>; mediaRects: RawSample["rect"][]; warnings: string[]; evidenceNotes?: string[];
}
export interface ColorToken { role: string; hex: string; stability: Stability; freq: number }
export interface Tokens {
  colors: ColorToken[];
  typography: { fontSans: string; contrast: string; scale: Array<{ role: string; px: number; w: number; lh: number }> };
  space: { unit: number; density: string; scale: number[] };
  radius: { tendency: string; sm: number; md: number; lg: number };
  shadow: { weight: string; md: string };
}
export type GrammarSource = "measured" | "inferred" | "judged" | "missing";
export type GrammarConfidence = "high" | "medium" | "low";
export interface GrammarSignal<T> { value: T | null; source: GrammarSource; confidence: GrammarConfidence }
export interface TypeRole {
  family: string; size: number; weight: number; lineHeight: number;
  letterSpacing: number; fontStyle: string; textTransform: string;
}
export interface VisualGrammar {
  typography: {
    display: GrammarSignal<TypeRole>; body: GrammarSignal<TypeRole>; meta: GrammarSignal<TypeRole>;
    pairing: GrammarSignal<string>;
  };
  palette: {
    mode: GrammarSignal<string>; allocation: GrammarSignal<string>; accentRule: GrammarSignal<string>;
  };
  stroke: GrammarSignal<{ widths: number[]; primary: number; style: string; character: string }>;
  surface: GrammarSignal<string>;
  elevation: GrammarSignal<string>;
  shape: GrammarSignal<string>;
  spacing: GrammarSignal<string>;
  elementTraits: string[];
}
export interface Draft { schemaVersion: 2; id: string; name: string; url: string; extractedAt: string; tokens: Tokens; visualGrammar: VisualGrammar; theme: Record<string, string>; warnings: string[]; evidenceNotes?: string[] }
export interface Judgment { primary: StyleName; secondary: StyleName | null; descriptors: string[]; thesis: string }
export type ValidationFlag = "media-heavy" | "palette-low" | "unavailable";
export interface FidelityResult { coverage: number; eligibleRatio: number; mean: number; p95: number; samples: number }
export interface SiteRecord extends Draft { style: Judgment; screenshot: string; fidelity?: FidelityResult; validationNotices?: string[] }
/** The complete, index-only data needed to render a gallery card. */
export interface IndexEntry {
  id: string; name: string; url: string;
  primaryStyle: StyleName; secondaryStyle: StyleName | null;
  descriptors: string[]; accent: string; extractedAt: string; partial: boolean; validationFlags: ValidationFlag[];
}
