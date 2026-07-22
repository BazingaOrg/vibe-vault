import { converter, formatHex, parse } from "culori";
import type { ColorToken, Draft, RawExtraction, RawSample, Stability, Tokens } from "./schema.js";

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
export function stability(sample: RawSample, seen: number): Stability {
  if (sample.media) return "L4";
  if (sample.root || seen >= 10 || sample.tag === "body" || sample.tag === "html") return "L1";
  if (seen >= 3 || sample.tag === "button" || sample.tag === "a") return "L2";
  return "L3";
}
type Cluster = { o: O; hex: string; count: number; area: number; props: Record<string, number>; levels: Record<Stability, number> };
export function clusterColors(raw: RawExtraction): Cluster[] {
  const all: Array<{ value: string; sample: RawSample; prop: string }> = [];
  for (const sample of raw.samples) for (const [prop, value] of Object.entries(sample.colors)) if (value && value !== "transparent" && hex(value)) all.push({ value, sample, prop });
  const occurrences = new Map<string, number>(); for (const x of all) occurrences.set(x.value, (occurrences.get(x.value) ?? 0) + 1);
  const clusters: Cluster[] = [];
  for (const item of all) {
    const o = colorToOklch(item.value), h = hex(item.value); if (!o || !h) continue;
    const level = stability(item.sample, occurrences.get(item.value) ?? 1);
    let c = clusters.find((v) => distance(v.o, o) <= .06);
    if (!c) { c = { o, hex: h, count: 0, area: 0, props: {}, levels: { L1: 0, L2: 0, L3: 0, L4: 0 } }; clusters.push(c); }
    c.count++; c.area += Math.max(1, item.sample.rect.width * item.sample.rect.height); c.props[item.prop] = (c.props[item.prop] ?? 0) + 1; c.levels[level]++;
  }
  return clusters.sort((a, b) => b.count - a.count);
}
function level(c: Cluster): Stability { if (c.levels.L1) return "L1"; if (c.levels.L2) return "L2"; if (c.levels.L3) return "L3"; return "L4"; }
function pick(clusters: Cluster[], test: (c: Cluster) => boolean, used: Set<Cluster>): Cluster | undefined { const x = clusters.find((c) => !used.has(c) && test(c)); if (x) used.add(x); return x; }
function roleColors(clusters: Cluster[]): ColorToken[] {
  // L3 campaign values and L4 media colours may be observed, but are never
  // allowed to become an anchor token or a theme variable.
  const eligible = clusters.filter((c) => level(c) === "L1" || level(c) === "L2"); const used = new Set<Cluster>();
  const bg = pick(eligible.slice().sort((a,b) => b.area-a.area), c => (c.props.backgroundColor ?? 0) > 0, used);
  const bgL = bg?.o.l ?? 1;
  const surface = pick(eligible.slice().sort((a,b) => b.area-a.area), c => (c.props.backgroundColor ?? 0) > 0, used);
  const text = pick(eligible, c => (c.props.color ?? 0) > 0 && Math.abs(c.o.l-bgL) > .35, used);
  const muted = pick(eligible, c => (c.props.color ?? 0) > 0 && Math.abs(c.o.l-bgL) > .12, used);
  const border = pick(eligible, c => (c.props.borderColor ?? 0) > 0, used);
  const accent = pick(eligible.slice().sort((a,b) => b.o.c-a.o.c), c => c.o.c >= .06, used);
  return [["背景 bg",bg],["surface",surface],["text",text],["muted",muted],["accent",accent],["border",border]].flatMap(([role,c]) => c ? [{ role: String(role), hex: (c as Cluster).hex, stability: level(c as Cluster), freq: Number(((c as Cluster).count / Math.max(1, clusters.reduce((n,x)=>n+x.count,0))).toFixed(3)) }] : []);
}
const median = (v: number[]) => { const x=[...v].sort((a,b)=>a-b); return x[Math.floor(x.length/2)] ?? 0; };
const unique = (v: number[]) => [...new Set(v.filter((n) => Number.isFinite(n) && n > 0).map((n) => Math.round(n)))].sort((a,b)=>a-b);
export function normalize(raw: RawExtraction): Draft {
  const clusters = clusterColors(raw), colors = roleColors(clusters), samples = raw.samples.filter((s) => !s.media);
  const font = samples.map(s=>s.fontFamily).filter(Boolean).sort((a,b)=>samples.filter(s=>s.fontFamily===b).length-samples.filter(s=>s.fontFamily===a).length)[0] || "system-ui, sans-serif";
  const type = unique(samples.map(s=>s.fontSize)).slice(-5); const scale = type.map((px, i) => { const set=samples.filter(s=>Math.round(s.fontSize)===px); return { role: i===type.length-1 ? "H1" : px <= 16 ? "Body" : `H${type.length-i}`, px, w: Math.round(median(set.map(s=>s.fontWeight)) || 400), lh: Number(((median(set.map(s=>s.lineHeight)) || px*1.4)/px).toFixed(2)) }; });
  const spacings = unique(samples.flatMap(s=>s.spacing)).slice(0,8); const unit = spacings.find(x=>x >= 4 && x <= 12) ?? 8;
  const radii = unique(samples.map(s=>s.radius)); const radius = { tendency: (median(radii) >= 8 ? "圆润 rounded" : "克制 restrained"), sm: radii[0] ?? 0, md: Math.round(median(radii)), lg: radii.at(-1) ?? 0 };
  const shadow = samples.map(s=>s.shadow).find(s=>s && s !== "none") ?? "none";
  const textColor = colors.find(c=>c.role==="text")?.hex, muted = colors.find(c=>c.role==="muted")?.hex, bg = colors.find(c=>c.role==="背景 bg")?.hex, surface=colors.find(c=>c.role==="surface")?.hex, accent=colors.find(c=>c.role==="accent")?.hex, border=colors.find(c=>c.role==="border")?.hex;
  const theme: Record<string,string> = { "--tk-font-sans": font, "--tk-font-display": font, "--tk-radius": `${radius.md}px`, "--tk-btn-radius": `${radius.sm}px`, "--tk-shadow": shadow, "--tk-btn-shadow": shadow, "--tk-space": `${unit}px`, "--tk-btn-border": "transparent" };
  for (const [k,v] of Object.entries({"--tk-bg":bg,"--tk-surface":surface,"--tk-text":textColor,"--tk-muted":muted,"--tk-accent":accent,"--tk-border":border})) if (v) theme[k]=v;
  const tokens: Tokens = { colors, typography: { fontSans: font, contrast: textColor && bg ? "高对比" : "未确定", scale }, space: { unit, density: median(spacings) >= 16 ? "偏疏 airy" : "紧凑 compact", scale: spacings }, radius, shadow: { weight: shadow === "none" ? "无 none" : "轻 light", md: shadow } };
  const warnings = [...raw.warnings]; if (colors.length < 3) warnings.push("可用稳定色不足，结果仅供参考。");
  return { id: raw.id, name: raw.id.replace(/(^|[-_])(\w)/g, (_,p,c)=>`${p}${c.toUpperCase()}`), url: raw.url, extractedAt: raw.collectedAt.slice(0,10), tokens, theme, warnings, rawPath: "raw.json" };
}
