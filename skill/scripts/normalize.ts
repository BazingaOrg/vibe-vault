import { converter, formatHex, parse } from "culori";
import type { ColorToken, Draft, GrammarConfidence, GrammarSignal, RawExtraction, RawSample, Stability, Tokens, TypeRole, VisualGrammar } from "./schema.js";

const toOklch = converter("oklch");
type O = { l: number; c: number; h: number; alpha?: number };
export function colorToOklch(value: string): O | null {
  const c = parse(value); if (!c) return null;
  const x = toOklch(c) as O | undefined; if (!x || !Number.isFinite(x.l)) return null;
  if ((x.alpha ?? 1) < 1) { const a = x.alpha ?? 1; return { l: x.l * a + (1 - a), c: x.c * a, h: x.h, alpha: 1 }; }
  return x;
}
export function distance(a: O, b: O): number { const dh = a.c < .0001 || b.c < .0001 ? 0 : Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 360; return Math.hypot(a.l - b.l, a.c - b.c, dh * Math.min(a.c, b.c)); }
export function hex(value: string): string | null { const c = parse(value); if (!c || (c.alpha ?? 1) <= .01) return null; const o = colorToOklch(value); return o ? formatHex({ mode: "oklch", l: o.l, c: o.c, h: o.h }) : null; }
function luminance(value: string): number {
  const c = parse(value) as { r?: number; g?: number; b?: number } | null;
  if (!c || ![c.r, c.g, c.b].every((channel) => Number.isFinite(channel))) return 0;
  const linear = (n: number) => (n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  return .2126 * linear(c.r!) + .7152 * linear(c.g!) + .0722 * linear(c.b!);
}
export function contrastRatio(a: string, b: string): number { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + .05) / (lo + .05); }
export function contrastLabel(text: string, bg: string): string { const ratio = contrastRatio(text, bg); return ratio >= 4.5 ? "高对比" : ratio >= 3 ? "中等对比" : "低对比"; }
export function stability(sample: RawSample, seen: number): Stability {
  if (sample.media) return "L4";
  if (sample.root || seen >= 10 || sample.tag === "body" || sample.tag === "html") return "L1";
  if (seen >= 3 || sample.tag === "button" || sample.tag === "a") return "L2";
  return "L3";
}
type Cluster = {
  o: O; hex: string; count: number; area: number;
  props: Record<string, number>; propAreas: Record<string, number>;
  levels: Record<Stability, number>; propLevels: Record<string, Record<Stability, number>>;
};
export function clusterColors(raw: RawExtraction): Cluster[] {
  const all: Array<{ value: string; sample: RawSample; prop: string }> = [];
  for (const sample of raw.samples) for (const [prop, value] of Object.entries(sample.colors)) if (value && value !== "transparent" && hex(value)) all.push({ value, sample, prop });
  const occurrences = new Map<string, number>(); for (const x of all) occurrences.set(x.value, (occurrences.get(x.value) ?? 0) + 1);
  const clusters: Cluster[] = [];
  for (const item of all) {
    const o = colorToOklch(item.value), h = hex(item.value); if (!o || !h) continue;
    const level = stability(item.sample, occurrences.get(item.value) ?? 1);
    let c = clusters.find((v) => distance(v.o, o) <= .06);
    if (!c) { c = { o, hex: h, count: 0, area: 0, props: {}, propAreas: {}, levels: { L1: 0, L2: 0, L3: 0, L4: 0 }, propLevels: {} }; clusters.push(c); }
    const area = Math.max(1, item.sample.rect.width * item.sample.rect.height);
    c.count++; c.area += area; c.props[item.prop] = (c.props[item.prop] ?? 0) + 1;
    c.propAreas[item.prop] = (c.propAreas[item.prop] ?? 0) + area;
    c.propLevels[item.prop] ??= { L1: 0, L2: 0, L3: 0, L4: 0 };
    c.propLevels[item.prop][level]++; c.levels[level]++;
  }
  return clusters.sort((a, b) => b.count - a.count);
}
function level(c: Cluster): Stability { if (c.levels.L1) return "L1"; if (c.levels.L2) return "L2"; if (c.levels.L3) return "L3"; return "L4"; }
function propLevel(c: Cluster, prop: string): Stability | undefined {
  const levels = c.propLevels[prop]; if (!levels) return undefined;
  if (levels.L1) return "L1"; if (levels.L2) return "L2"; if (levels.L3) return "L3"; if (levels.L4) return "L4";
  return undefined;
}
function stableProp(c: Cluster, prop: string): boolean { const value = propLevel(c, prop); return value === "L1" || value === "L2"; }
function pick(clusters: Cluster[], test: (c: Cluster) => boolean, used: Set<Cluster>): Cluster | undefined { const x = clusters.find((c) => !used.has(c) && test(c)); if (x) used.add(x); return x; }

/** Prefer author design CSS variables over high-chroma data/metric ink when naming is explicit. */
const ROOT_ROLE_RULES: Array<{ role: string; names: RegExp[]; reject?: RegExp }> = [
  { role: "背景 bg", names: [/^--paper$/, /^--bg$/, /^--background$/, /^--color-bg$/, /^--background-color$/, /^--page-bg$/] },
  { role: "surface", names: [/^--paper-tint$/, /^--paper-deep$/, /^--surface$/, /^--color-surface$/, /^--elevated$/, /^--panel$/, /^--card$/] },
  { role: "text", names: [/^--ink$/, /^--text$/, /^--foreground$/, /^--color-text$/, /^--color-fg$/, /^--fg$/] },
  { role: "muted", names: [/^--ink-2$/, /^--ink-soft$/, /^--ink-mute$/, /^--ink-faint$/, /^--muted$/, /^--color-muted$/, /^--text-muted$/, /^--text-secondary$/] },
  { role: "accent", names: [/^--oxblood$/, /^--accent$/, /^--brand$/, /^--brand-accent$/, /^--color-accent$/, /^--primary$/, /^--color-primary$/], reject: /verdant|signal|success|positive|negative|danger|warning|chart|series|track|gain|loss/i },
  { role: "border", names: [/^--hairline$/, /^--border$/, /^--color-border$/, /^--hairline-strong$/, /^--divider$/], reject: /ghost|wash|soft$/i },
];

export function colorFromRootVariables(rootVariables: Record<string, string>, role: string): string | null {
  const rule = ROOT_ROLE_RULES.find((item) => item.role === role);
  if (!rule) return null;
  const resolve = (value: string, seen = new Set<string>()): string | null => {
    const direct = hex(value.trim());
    if (direct) return direct;
    const reference = value.trim().match(/^var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)$/);
    if (reference) {
      const name = reference[1];
      if (seen.has(name)) return null;
      seen.add(name);
      return rootVariables[name] ? resolve(rootVariables[name], seen) : reference[2] ? resolve(reference[2], seen) : null;
    }
    if (role !== "border" || /gradient|color-mix|image-set|url\(/i.test(value)) return null;
    return (value.match(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|#[0-9a-f]{3,8}\b/gi) ?? []).map(hex).find(Boolean) ?? null;
  };
  for (const [name, value] of Object.entries(rootVariables)) {
    if (rule.reject?.test(name)) continue;
    if (!rule.names.some((pattern) => pattern.test(name))) continue;
    const h = resolve(value);
    if (h) return h;
  }
  return null;
}

function tokenFromCluster(role: string, value: string, match: Cluster, clusters: Cluster[]): ColorToken {
  const total = Math.max(1, clusters.reduce((n, x) => n + x.count, 0));
  return {
    role,
    hex: value,
    stability: level(match),
    freq: Number((match.count / total).toFixed(3)),
  };
}

function roleColors(clusters: Cluster[], rootVariables: Record<string, string> = {}): ColorToken[] {
  // L3 campaign values and L4 media colours may be observed, but are never
  // allowed to become an anchor token or a theme variable.
  const eligible = clusters.filter((c) => level(c) === "L1" || level(c) === "L2"); const used = new Set<Cluster>();
  const roles = ["背景 bg", "surface", "text", "muted", "accent", "border"] as const;
  const fromVars = new Map<string, ColorToken>();
  for (const role of roles) {
    const value = colorFromRootVariables(rootVariables, role);
    if (!value) continue;
    const o = colorToOklch(value);
    const match = o ? eligible.find((c) => distance(c.o, o) <= .06) : undefined;
    if (!match) continue;
    fromVars.set(role, tokenFromCluster(role, value, match, clusters));
    used.add(match);
  }

  const backgrounds = eligible.filter((c) => stableProp(c, "backgroundColor"))
    .sort((a, b) => (b.propAreas.backgroundColor ?? 0) - (a.propAreas.backgroundColor ?? 0));
  const bgCluster = fromVars.has("背景 bg") ? undefined : pick(backgrounds, () => true, used);
  const bgL = (fromVars.get("背景 bg") ? colorToOklch(fromVars.get("背景 bg")!.hex)?.l : bgCluster?.o.l) ?? 1;
  const surfaceCluster = fromVars.has("surface") ? undefined : pick(backgrounds, () => true, used);
  const textCluster = fromVars.has("text") ? undefined : pick(eligible, c => (c.props.color ?? 0) > 0 && Math.abs(c.o.l-bgL) > .35, used);
  const mutedCluster = fromVars.has("muted") ? undefined : pick(eligible.slice().sort((a, b) => ((b.propAreas.color ?? 0) / Math.max(1, b.props.color ?? 0)) - ((a.propAreas.color ?? 0) / Math.max(1, a.props.color ?? 0))), c => (c.props.color ?? 0) >= 3 && Math.abs(c.o.l-bgL) > .12, used);
  const borderCluster = fromVars.has("border") ? undefined : (surfaceCluster && stableProp(surfaceCluster, "borderColor") ? surfaceCluster : eligible.slice()
    .filter((c) => stableProp(c, "borderColor"))
    .sort((a, b) => (b.props.borderColor ?? 0) - (a.props.borderColor ?? 0) || (b.propAreas.borderColor ?? 0) - (a.propAreas.borderColor ?? 0))
    .find((c) => !used.has(c)));
  if (borderCluster) used.add(borderCluster);
  // Prefer editorial brand chroma over high-chroma metric greens/teals when no design var.
  const accentCluster = fromVars.has("accent") ? undefined : pick(
    eligible.slice().sort((a, b) => b.o.c - a.o.c),
    (c) => c.o.c >= .06 && !used.has(c),
    used,
  );

  const fromCluster: Record<string, Cluster | undefined> = {
    "背景 bg": bgCluster,
    surface: surfaceCluster,
    text: textCluster,
    muted: mutedCluster,
    accent: accentCluster,
    border: borderCluster,
  };
  return roles.flatMap((role) => {
    if (fromVars.has(role)) return [fromVars.get(role)!];
    const c = fromCluster[role];
    return c ? [{ role, hex: c.hex, stability: level(c), freq: Number((c.count / Math.max(1, clusters.reduce((n, x) => n + x.count, 0))).toFixed(3)) }] : [];
  });
}
const median = (v: number[]) => { const x=[...v].sort((a,b)=>a-b); return x[Math.floor(x.length/2)] ?? 0; };
const unique = (v: number[]) => [...new Set(v.filter((n) => Number.isFinite(n) && n > 0).map((n) => Math.round(n)))].sort((a,b)=>a-b);
export function splitShadowLayers(value: string): string[] {
  const layers: string[] = []; let start = 0, depth = 0, quote = "", escaped = false;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (escaped) { escaped = false; continue; }
    if (quote) { if (char === "\\") escaped = true; else if (char === quote) quote = ""; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "(") depth++; else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === "," && depth === 0) { layers.push(value.slice(start, index).trim()); start = index + 1; }
  }
  const last = value.slice(start).trim(); if (last) layers.push(last); return layers;
}
function shadowColor(layer: string): string | null {
  const candidates = layer.match(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|#[0-9a-f]{3,8}\b|\b[a-z]+\b/gi) ?? [];
  for (const candidate of candidates) { const color = parse(candidate); if (color) return candidate; }
  return null;
}
function visibleShadowLayer(layer: string): boolean {
  if (!layer || /\binset\b/i.test(layer)) return false;
  const color = shadowColor(layer); const parsed = color ? parse(color) : null;
  if (!parsed || (parsed.alpha ?? 1) <= .01) return false;
  const withoutColor = color ? layer.replace(color, " ") : layer;
  const lengths = withoutColor.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?(?:[a-z%]+)?/gi) ?? [];
  const [x = 0, y = 0, blur = 0] = lengths.map(Number.parseFloat);
  return x !== 0 || y !== 0 || blur > 0;
}
export function normalizeShadow(value: string | undefined): string {
  if (!value || value === "none") return "none";
  const layers = splitShadowLayers(value).filter(visibleShadowLayer);
  return layers.length ? layers.join(", ") : "none";
}
function representativeShadow(samples: RawSample[]): string {
  const candidates = new Map<string, { count: number; area: number; first: number }>();
  samples.forEach((sample, index) => {
    const shadow = normalizeShadow(sample.shadow); if (shadow === "none") return;
    const area = Math.max(1, sample.rect.width * sample.rect.height);
    const current = candidates.get(shadow) ?? { count: 0, area: 0, first: index };
    current.count++; current.area += area;
    candidates.set(shadow, current);
  });
  return [...candidates.entries()].filter(([, value]) => value.count >= 2).sort((a, b) => b[1].count - a[1].count || b[1].area - a[1].area || a[1].first - b[1].first)[0]?.[0] ?? "none";
}
function usableFont(sample: RawSample): boolean { return Boolean(sample.fontFamily?.trim()) && Number.isFinite(sample.fontSize) && sample.fontSize > 0; }
function primaryFont(raw: RawExtraction, samples: RawSample[]): string {
  const weights = new Map<string, { weight: number; first: number }>();
  samples.forEach((sample, index) => {
    if (!sample.text || sample.media || !usableFont(sample) || !Number.isFinite(sample.rect.width) || sample.rect.width <= 0) return;
    const width = Math.min(Math.max(sample.rect.width, 1), Math.max(raw.viewport.width, 1));
    const current = weights.get(sample.fontFamily) ?? { weight: 0, first: index };
    current.weight += width * sample.fontSize;
    weights.set(sample.fontFamily, current);
  });
  const weighted = [...weights.entries()].sort((a, b) => b[1].weight - a[1].weight || a[1].first - b[1].first);
  if (weighted[0]) return weighted[0][0];
  const fallback = samples.find((sample) => (sample.tag === "body" || sample.root) && usableFont(sample));
  return fallback?.fontFamily ?? "system-ui, sans-serif";
}
function grammarSignal<T>(value: T | null, source: GrammarSignal<T>["source"], confidence: GrammarConfidence): GrammarSignal<T> {
  return { value, source, confidence };
}
function roleFromSample(sample: RawSample | undefined): GrammarSignal<TypeRole> {
  if (!sample || !usableFont(sample)) return grammarSignal<TypeRole>(null, "missing", "low");
  return grammarSignal({
    family: sample.fontFamily,
    size: Math.round(sample.fontSize),
    weight: Math.round(sample.fontWeight || 400),
    lineHeight: Number(((sample.lineHeight || sample.fontSize * 1.4) / sample.fontSize).toFixed(2)),
    letterSpacing: Number((sample.letterSpacing ?? 0).toFixed(2)),
    fontStyle: sample.fontStyle || "normal",
    textTransform: sample.textTransform || "none",
  }, "measured", "high");
}
function textRoles(samples: RawSample[], bodyFamily?: string) {
  const text = samples.filter((sample) => sample.text && !sample.media && usableFont(sample));
  const byArea = (a: RawSample, b: RawSample) => (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height);
  const display = [...text].filter((sample) => sample.fontSize >= 24).sort((a, b) => b.fontSize - a.fontSize || byArea(a, b))[0]
    ?? [...text].sort((a, b) => b.fontSize - a.fontSize || byArea(a, b))[0];
  const bodyCandidates = [...text].filter((sample) => sample.fontSize >= 13 && sample.fontSize <= 20);
  const body = bodyCandidates.filter((sample) => !bodyFamily || sample.fontFamily === bodyFamily).sort(byArea)[0]
    ?? bodyCandidates.sort(byArea)[0]
    ?? [...text].sort(byArea)[0];
  const meta = [...text].filter((sample) => sample.fontSize <= 14).sort((a, b) => a.fontSize - b.fontSize || byArea(a, b))[0];
  return { display: roleFromSample(display), body: roleFromSample(body), meta: roleFromSample(meta) };
}
function shadowModel(shadow: string): string {
  if (shadow === "none") return "平面，无外部投影";
  const layer = splitShadowLayers(shadow)[0] ?? shadow;
  const color = shadowColor(layer);
  const lengths = (color ? layer.replace(color, " ") : layer).match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?(?:px)?/gi) ?? [];
  const [x = 0, y = 0, blur = 0] = lengths.map(Number.parseFloat);
  if (blur <= 1 && (x !== 0 || y !== 0)) return "硬质偏移阴影";
  if (blur >= 12) return "柔和扩散阴影";
  return "轻柔层次阴影";
}
function borderGrammar(samples: RawSample[]): GrammarSignal<{ widths: number[]; primary: number; style: string; character: string }> {
  const candidates = samples.filter((sample) => (sample.borderWidth ?? 0) > 0 && sample.borderStyle && sample.borderStyle !== "none");
  if (!candidates.length) return grammarSignal<{ widths: number[]; primary: number; style: string; character: string }>(null, "missing", "low");
  const widths = candidates.map((sample) => sample.borderWidth ?? 0);
  const measuredWidths = [...new Set(widths.map((width) => Number(width.toFixed(1))))].sort((a, b) => a - b).slice(0, 4);
  const primary = Number(median(widths).toFixed(1));
  const styles = new Map<string, number>();
  for (const sample of candidates) styles.set(sample.borderStyle!, (styles.get(sample.borderStyle!) ?? 0) + 1);
  const style = [...styles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "solid";
  const character = measuredWidths.some((width) => width >= 2) ? (primary >= 2 ? "强调描边" : "细线与强调描边并用") : "细线分隔";
  return grammarSignal({ widths: measuredWidths, primary, style, character }, "measured", candidates.length >= 3 ? "high" : "medium");
}
function visualGrammar(samples: RawSample[], colors: ColorToken[], radius: Tokens["radius"], shadow: string, density: string, primaryBodyFamily: string): VisualGrammar {
  const typography = textRoles(samples, primaryBodyFamily);
  const displayFamily = typography.display.value?.family;
  const bodyFamily = typography.body.value?.family;
  const pairing = displayFamily && bodyFamily
    ? (displayFamily === bodyFamily ? "统一字体家族，以字号与字重建立层级" : "展示字体与正文字体形成对照")
    : null;
  const bg = colors.find((token) => token.role === "背景 bg");
  const surface = colors.find((token) => token.role === "surface");
  const accent = colors.find((token) => token.role === "accent");
  const mode = bg ? (luminance(bg.hex) < .25 ? "深色基底" : "浅色基底") : null;
  const allocation = bg && surface
    ? (bg.hex === surface.hex ? "单一底色承载内容" : "背景与承载面分层，中性色占主导")
    : bg ? "背景色主导" : null;
  const accentRule = accent ? (accent.freq <= .1 ? "强调色少量点缀" : "强调色参与主要层级") : null;
  const stroke = borderGrammar(samples);
  const surfaceModel = allocation ? grammarSignal(allocation, "inferred", surface ? "high" : "medium") : grammarSignal<string>(null, "missing", "low");
  const elevationValue = shadowModel(shadow);
  const elevation = grammarSignal(elevationValue, shadow === "none" ? "inferred" : "measured", shadow === "none" ? "medium" : "high");
  const shapeValue = radius.tendency === "直角" ? "锐利直角" : radius.tendency === "胶囊圆润" ? "胶囊式圆润" : radius.tendency === "偏圆润" ? "柔和圆角" : "克制小圆角";
  const traits = [
    pairing?.includes("形成对照") ? "字体角色对照" : "统一字体层级",
    stroke.value?.character,
    elevationValue === "硬质偏移阴影" ? "偏移硬阴影" : elevationValue === "柔和扩散阴影" ? "柔和扩散层次" : null,
    mode,
    surface && bg && surface.hex !== bg.hex ? "分层表面" : null,
    shapeValue,
  ].filter((value): value is string => Boolean(value));
  return {
    typography: {
      ...typography,
      pairing: pairing ? grammarSignal(pairing, "inferred", "high") : grammarSignal<string>(null, "missing", "low"),
    },
    palette: {
      mode: mode ? grammarSignal(mode, "inferred", "high") : grammarSignal<string>(null, "missing", "low"),
      allocation: allocation ? grammarSignal(allocation, "inferred", surface ? "high" : "medium") : grammarSignal<string>(null, "missing", "low"),
      accentRule: accentRule ? grammarSignal(accentRule, "inferred", "medium") : grammarSignal<string>(null, "missing", "low"),
    },
    stroke,
    surface: surfaceModel,
    elevation,
    shape: grammarSignal(shapeValue, "inferred", "high"),
    spacing: grammarSignal(`${density}节奏`, "inferred", "medium"),
    elementTraits: [...new Set(traits)].slice(0, 6),
  };
}
export function displayName(url: string): string {
  const hostname = new URL(url).hostname.replace(/^www\./i, "");
  const labels = hostname.split(".");
  const name = labels.length > 1 ? labels.slice(0, -1).join("-") : hostname;
  return name.split(/[-_]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
export function normalize(raw: RawExtraction): Draft {
  const clusters = clusterColors(raw), colors = roleColors(clusters, raw.rootVariables ?? {}), samples = raw.samples.filter((s) => !s.media);
  const font = primaryFont(raw, samples);
  const type = unique(samples.map(s=>s.fontSize)).slice(-5); const scale = type.map((px, i) => { const set=samples.filter(s=>Math.round(s.fontSize)===px); const role=i===type.length-1 ? "H1" : px <= 14 ? "Small" : px <= 16 ? "Body" : px <= 20 ? "Lead" : `H${type.length-i}`; return { role, px, w: Math.round(median(set.map(s=>s.fontWeight)) || 400), lh: Number(((median(set.map(s=>s.lineHeight)) || px*1.4)/px).toFixed(2)) }; });
  const spacings = unique(samples.flatMap(s=>s.spacing)).slice(0,8); const unit = spacings.find(x=>x >= 4 && x <= 12) ?? 8;
  const radii = unique(samples.map(s=>s.radius)); const corners = radii.filter(v=>v < 48); const representativeRadii = corners.length ? corners : radii; const radius = { tendency: !radii.length ? "直角" : corners.length ? (median(corners) >= 8 ? "偏圆润" : "较克制") : "胶囊圆润", sm: representativeRadii[0] ?? 0, md: Math.round(median(representativeRadii)), lg: representativeRadii.at(-1) ?? 0 };
  const shadow = representativeShadow(samples);
  const textColor = colors.find(c=>c.role==="text")?.hex, muted = colors.find(c=>c.role==="muted")?.hex, bg = colors.find(c=>c.role==="背景 bg")?.hex, surface=colors.find(c=>c.role==="surface")?.hex, accent=colors.find(c=>c.role==="accent")?.hex, border=colors.find(c=>c.role==="border")?.hex;
  const roles = textRoles(samples, font);
  const displayFont = roles.display.value?.family ?? font;
  const theme: Record<string,string> = { "--tk-font-sans": font, "--tk-font-display": displayFont, "--tk-radius": `${radius.md}px`, "--tk-shadow": shadow, "--tk-space": `${unit}px` };
  for (const [k,v] of Object.entries({"--tk-bg":bg,"--tk-surface":surface,"--tk-text":textColor,"--tk-muted":muted,"--tk-accent":accent,"--tk-border":border})) if (v) theme[k]=v;
  const spacingMedian = median(spacings);
  const density = spacingMedian >= 20 ? "偏疏" : spacingMedian >= 12 ? "适中" : "紧凑";
  const tokens: Tokens = { colors, typography: { fontSans: font, contrast: textColor && bg ? contrastLabel(textColor, bg) : "未确定", scale }, space: { unit, density, scale: spacings }, radius, shadow: { weight: shadow === "none" ? "无" : "有", md: shadow } };
  const warnings = [...raw.warnings]; if (colors.length < 3) warnings.push("可用稳定色不足，结果仅供参考。");
  return { schemaVersion: 2, id: raw.id, name: displayName(raw.url), url: raw.url, extractedAt: raw.collectedAt.slice(0,10), tokens, visualGrammar: visualGrammar(samples, colors, radius, shadow, density, font), theme, warnings, evidenceNotes: raw.evidenceNotes ?? [] };
}
