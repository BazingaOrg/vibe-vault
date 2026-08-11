import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { STYLE_VOCABULARY, type Draft, type FidelityResult, type IndexEntry, type Judgment, type SiteRecord, type ValidationFlag } from "./schema.js";
import { fidelity } from "./verify.js";
const legal = new Set<string>(STYLE_VOCABULARY);
export function validateJudgment(value: unknown): Judgment {
  if (!value || typeof value !== "object") throw new Error("judgment.json 必须是对象。"); const j=value as Record<string,unknown>;
  if (typeof j.primary!=="string" || !legal.has(j.primary)) throw new Error("primary 必须来自封闭风格词表。");
  if (j.secondary !== null && (typeof j.secondary!=="string" || !legal.has(j.secondary))) throw new Error("secondary 必须为词表项或 null。");
  if (!Array.isArray(j.descriptors) || j.descriptors.length<3 || j.descriptors.length>5 || !j.descriptors.every(x=>typeof x==="string"&&x.trim().length>=2&&x.trim().length<=32)) throw new Error("descriptors 必须为 3–5 个长度 2–32 的词。");
  if (typeof j.thesis!=="string" || j.thesis.trim().length<24 || j.thesis.trim().length>600) throw new Error("thesis 长度必须为 24–600 字符。");
  const sentences=j.thesis.split(/[。！？.!?]+/).filter(Boolean).length; if(sentences<2||sentences>4) throw new Error("thesis 必须为 2–4 句。");
  return {primary:j.primary as Judgment["primary"],secondary:j.secondary as Judgment["secondary"],descriptors:j.descriptors.map(x=>(x as string).trim()),thesis:j.thesis.trim()};
}
const COLOR_ROLES: Record<string, string[]> = {
  background: ["背景 bg", "背景", "bg", "background"],
  surface: ["surface", "分隔面 surface", "表面", "分隔面"],
  text: ["text", "正文 text", "正文"],
  muted: ["muted", "次要 muted", "次要", "次要文字"],
  accent: ["accent", "强调 accent", "强调", "强调色"],
  border: ["border", "边框 border", "边框", "描边"],
};
function color(site: SiteRecord, role: keyof typeof COLOR_ROLES): string {
  return site.tokens.colors.find((token) => COLOR_ROLES[role].includes(token.role))?.hex ?? "未确定";
}
export function indexEntry(record: SiteRecord): IndexEntry {
  const validationFlags = record.fidelity
    ? fidelityFlags(record.fidelity)
    : record.validationNotices?.length ? ["unavailable" as const] : [];
  return {
    id: record.id, name: record.name, url: record.url,
    primaryStyle: record.style.primary, secondaryStyle: record.style.secondary,
    descriptors: record.style.descriptors, accent: color(record, "accent") === "未确定" ? "" : color(record, "accent"),
    extractedAt: record.extractedAt, partial: record.warnings.length > 0, validationFlags,
  };
}
export function sortIndex(entries: IndexEntry[]): IndexEntry[] {
  return [...entries].sort((a,b)=>b.extractedAt.localeCompare(a.extractedAt)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function fidelityFlags(result: Pick<FidelityResult, "coverage" | "eligibleRatio" | "samples">): ValidationFlag[] {
  if(result.samples===0) return ["unavailable"];
  const flags: ValidationFlag[] = [];
  if(result.coverage<.65) flags.push("palette-low");
  if(result.eligibleRatio<.2) flags.push("media-heavy");
  return flags;
}
export function fidelityNotices(result: Pick<FidelityResult, "coverage" | "eligibleRatio" | "samples">): string[] {
  const notices: string[] = [];
  if(result.samples===0) return ["无法完成截图保真校验，结果仅供参考。"];
  if(result.coverage<.65) notices.push(`调色板覆盖率 ${result.coverage}（阈值 0.65），结果仅供参考。`);
  if(result.eligibleRatio<.2) notices.push(`非媒体可校验像素比例 ${result.eligibleRatio}（阈值 0.2），结果仅供参考。`);
  return notices;
}
export function guide(site: SiteRecord): string {
  const t = site.tokens;
  const grammar = site.visualGrammar;
  const scale = [...t.typography.scale].sort((a, b) => a.px - b.px);
  const min = scale[0];
  const max = scale.at(-1);
  const usage = {
    background: "页面底色与大面积留白",
    surface: color(site, "surface") === color(site, "background") ? "与背景同色，以边界或留白区分层次" : "内容承载面或层次区分",
    text: "主要文字与关键信息",
    muted: "辅助信息、说明与元数据",
    accent: color(site, "accent") === color(site, "text") ? "与正文共享墨色，以字重、位置或留白形成强调" : "少量用于关键操作、链接或注意点",
    border: color(site, "border") === color(site, "text") ? "以正文墨色建立清晰结构边界" : "分隔、描边与结构边界",
  };
  const roleLine = (label: string, signal: typeof grammar.typography.display | undefined) => signal?.value
    ? `- ${label}：${signal.value.family} · ${signal.value.size}px / ${signal.value.weight} / ${signal.value.lineHeight} · 字距 ${signal.value.letterSpacing}px`
    : `- ${label}：未可靠采集`;
  const value = (signal: { value: unknown } | undefined) => typeof signal?.value === "string" ? signal.value : "未可靠采集";
  const stroke = grammar.stroke.value ? `${grammar.stroke.value.character}，${grammar.stroke.value.widths.map((width) => `${width}px`).join(" / ")} ${grammar.stroke.value.style}` : "未可靠采集";
  // Control-level button geometry stays out of the reusable CSS (see SKILL.md).
  const css = Object.entries(site.theme).filter(([name]) => !name.startsWith("--tk-btn-")).map(([name, value]) => `  ${name}: ${value};`).join("\n");
  return `# STYLE-GUIDE\n\n## 风格方向\n主风格：${site.style.primary}${site.style.secondary ? ` · 次风格：${site.style.secondary}` : ""}\n气质词：${site.style.descriptors.join(" / ")}\n${site.style.thesis}\n\n## 语义色彩\n| 用途 | 色值 | 使用方式 |\n| --- | --- | --- |\n| 背景 | ${color(site, "background")} | ${usage.background} |\n| 表面 | ${color(site, "surface")} | ${usage.surface} |\n| 正文 | ${color(site, "text")} | ${usage.text} |\n| 次要文字 | ${color(site, "muted")} | ${usage.muted} |\n| 强调 | ${color(site, "accent")} | ${usage.accent} |\n| 边框 | ${color(site, "border")} | ${usage.border} |\n\n## 字体系统\n${roleLine("展示文字", grammar.typography.display)}\n${roleLine("正文", grammar.typography.body)}\n${roleLine("元信息", grammar.typography.meta)}\n- 字体关系：${value(grammar.typography.pairing)}\n- 对比：${t.typography.contrast}。字阶范围 ${min?.px ?? 0}–${max?.px ?? 0}px。\n${scale.length ? scale.map((item) => `- ${item.role}：${item.px}px / ${item.w} / ${item.lh}`).join("\n") : "- 字阶未定义。"}\n\n## 复合视觉语法\n- 色彩模式：${value(grammar.palette.mode)}；${value(grammar.palette.allocation)}；${value(grammar.palette.accentRule)}。\n- 描边：${stroke}。\n- 表面：${value(grammar.surface)}。\n- 层次：${value(grammar.elevation)}。\n- 形态：${value(grammar.shape)}。\n- 间距节奏：${value(grammar.spacing)}。\n- 元素特征：${grammar.elementTraits.length ? grammar.elementTraits.join(" / ") : "未可靠采集"}。\n\n## 间距与形态\n- 间距基准：${t.space.unit}px；整体密度：${t.space.density}。\n- 间距阶梯：${t.space.scale.length ? t.space.scale.map((item) => `${item}px`).join(" / ") : "未定义"}。\n- 圆角：${t.radius.tendency}（${t.radius.sm}px / ${t.radius.md}px / ${t.radius.lg}px）。\n- 阴影：${t.shadow.weight}${t.shadow.weight === "有" ? `，${t.shadow.md}` : ""}。\n\n## CSS\n\`\`\`css\n:root {\n${css}\n}\n\`\`\`\n`;
}
async function atomicJson(file:string, value:unknown) { const tmp=`${file}.${process.pid}.tmp`; await writeFile(tmp,JSON.stringify(value,null,2)+"\n"); await rename(tmp,file); }
export async function finalize(draft: Draft, judgment: unknown, workDir=process.cwd()): Promise<SiteRecord> {
  const style=validateJudgment(judgment), staging=path.join(workDir,".style-extractor",draft.id), screenshot=path.join(staging,"screenshot.png"); const raw=JSON.parse(await readFile(path.join(staging,"raw.json"),"utf8"));
  const record:SiteRecord={...draft,style,screenshot:"screenshot.png",validationNotices:[]};
  try {
    record.fidelity=await fidelity(screenshot,raw,record.tokens);
    record.validationNotices=fidelityNotices(record.fidelity);
  } catch { record.validationNotices=["无法完成截图保真校验，结果仅供参考。"] }
  const target=path.join(workDir,"sites",draft.id); await mkdir(target,{recursive:true}); await copyFile(screenshot,path.join(target,"screenshot.png")); await atomicJson(path.join(target,"site.json"),record); await writeFile(path.join(target,"STYLE-GUIDE.md"),guide(record));
  const indexFile=path.join(workDir,"sites","index.json"); let index:IndexEntry[]=[]; try { index=JSON.parse(await readFile(indexFile,"utf8")); } catch { /* initialized below */ }
  index=sortIndex([...index.filter(x=>x.id!==record.id),indexEntry(record)]); await atomicJson(indexFile,index); return record;
}
