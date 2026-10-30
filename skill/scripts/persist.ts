import { copyFile, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { STYLE_VOCABULARY, type Draft, type FidelityResult, type IndexEntry, type Judgment, type SiteRecord, type ValidationFlag } from "./schema.js";
import { fidelity } from "./verify.js";
const legal = new Set<string>(STYLE_VOCABULARY);
const TYPE_ROLES = ["display", "body", "meta"] as const;
const VALIDATION_FLAGS = new Set<string>(["palette-low", "media-heavy", "unavailable"]);
export function validateJudgment(value: unknown): Judgment {
  if (!value || typeof value !== "object") throw new Error("judgment.json 必须是对象。"); const j=value as Record<string,unknown>;
  const keys=Object.keys(j).sort(); if(keys.join(",")!=="descriptors,primary,secondary,thesis") throw new Error("judgment.json 只能包含 primary、secondary、descriptors、thesis。");
  if (typeof j.primary!=="string" || !legal.has(j.primary)) throw new Error("primary 必须来自封闭风格词表。");
  if (j.secondary !== null && (typeof j.secondary!=="string" || !legal.has(j.secondary))) throw new Error("secondary 必须为词表项或 null。");
  if (j.secondary===j.primary) throw new Error("primary 与 secondary 不能相同。");
  if (!Array.isArray(j.descriptors) || j.descriptors.length<3 || j.descriptors.length>5 || !j.descriptors.every(x=>typeof x==="string"&&x.trim().length>=2&&x.trim().length<=32)) throw new Error("descriptors 必须为 3–5 个长度 2–32 的词。");
  if (new Set(j.descriptors.map(x=>(x as string).trim().toLocaleLowerCase())).size!==j.descriptors.length) throw new Error("descriptors 不能重复。");
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
export function exportTheme(site: SiteRecord): Record<string, string> {
  const theme = Object.fromEntries(Object.entries(site.theme).filter(([name]) => !name.startsWith("--tk-btn-")));
  for (const role of TYPE_ROLES) {
    const value = site.visualGrammar?.typography?.[role]?.value;
    if (!value) continue;
    theme[`--tk-${role}-font`] = value.family;
    theme[`--tk-${role}-size`] = `${value.size}px`;
    theme[`--tk-${role}-weight`] = String(value.weight);
    theme[`--tk-${role}-leading`] = String(value.lineHeight);
    theme[`--tk-${role}-tracking`] = `${value.letterSpacing}px`;
    theme[`--tk-${role}-style`] = value.fontStyle;
    theme[`--tk-${role}-transform`] = value.textTransform;
  }
  const stroke = site.visualGrammar?.stroke?.value;
  if (stroke) {
    theme["--tk-stroke-width"] = `${stroke.primary}px`;
    theme["--tk-stroke-style"] = stroke.style;
  }
  return theme;
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
  const css = Object.entries(exportTheme(site)).map(([name, value]) => `  ${name}: ${value};`).join("\n");
  const roleCss = TYPE_ROLES.filter((role) => Boolean(grammar.typography[role]?.value)).map((role) => `.style-${role} {
  font-family: var(--tk-${role}-font);
  font-size: var(--tk-${role}-size);
  font-weight: var(--tk-${role}-weight);
  line-height: var(--tk-${role}-leading);
  letter-spacing: var(--tk-${role}-tracking);
  font-style: var(--tk-${role}-style);
  text-transform: var(--tk-${role}-transform);
}`).join("\n\n");
  const fontFamilies = [...new Set(TYPE_ROLES.map((role) => grammar.typography[role]).flatMap((signal) => signal?.value?.family ? [signal.value.family] : []))];
  const notes = [
    `- 来源：${site.url}`,
    `- 采集日期：${site.extractedAt}`,
    "- 先加载对应字体，再应用角色样式；仅声明字体名称不会安装或下载字体。本风格包不包含字体文件。",
    ...fontFamilies.map((family) => `- 字体栈：${family}`),
    "- 将 .style-display 用于展示文字、.style-body 用于正文、.style-meta 用于辅助文字，并用语义色变量设置背景与文本。",
    "- 优先保留展示字与正文的关系、背景与表面的层次、强调色比例、描边和阴影。角色字号为采样值，按目标内容和屏幕调整。",
    "- 色彩与角色 CSS 用于你的内容；原站布局、图片、图表和数据不在风格包中。",
    ...site.warnings.map((warning) => `- 采集限制：${warning}`),
    ...(site.evidenceNotes || []).map((note) => `- 证据补充：${note}`),
    ...(site.validationNotices || []).map((notice) => `- 校验说明：${notice}`),
    "- 调色板覆盖率仅验证采样画面的颜色，不是整体相似度。",
  ].join("\n");
  return `# STYLE-GUIDE\n\n## 风格方向\n主风格：${site.style.primary}${site.style.secondary ? ` · 次风格：${site.style.secondary}` : ""}\n气质词：${site.style.descriptors.join(" / ")}\n${site.style.thesis}\n\n## 语义色彩\n| 用途 | 色值 | 使用方式 |\n| --- | --- | --- |\n| 背景 | ${color(site, "background")} | ${usage.background} |\n| 表面 | ${color(site, "surface")} | ${usage.surface} |\n| 正文 | ${color(site, "text")} | ${usage.text} |\n| 次要文字 | ${color(site, "muted")} | ${usage.muted} |\n| 强调 | ${color(site, "accent")} | ${usage.accent} |\n| 边框 | ${color(site, "border")} | ${usage.border} |\n\n## 字体系统\n${roleLine("展示文字", grammar.typography.display)}\n${roleLine("正文", grammar.typography.body)}\n${roleLine("元信息", grammar.typography.meta)}\n- 字体关系：${value(grammar.typography.pairing)}\n- 对比：${t.typography.contrast}。字阶范围 ${min?.px ?? 0}–${max?.px ?? 0}px。\n${scale.length ? scale.map((item) => `- ${item.role}：${item.px}px / ${item.w} / ${item.lh}`).join("\n") : "- 字阶未定义。"}\n\n## 复合视觉语法\n- 色彩模式：${value(grammar.palette.mode)}；${value(grammar.palette.allocation)}；${value(grammar.palette.accentRule)}。\n- 描边：${stroke}。\n- 表面：${value(grammar.surface)}。\n- 层次：${value(grammar.elevation)}。\n- 形态：${value(grammar.shape)}。\n- 间距节奏：${value(grammar.spacing)}。\n- 元素特征：${grammar.elementTraits.length ? grammar.elementTraits.join(" / ") : "未可靠采集"}。\n\n## 间距与形态\n- 间距基准：${t.space.unit}px；整体密度：${t.space.density}。\n- 间距阶梯：${t.space.scale.length ? t.space.scale.map((item) => `${item}px`).join(" / ") : "未定义"}。\n- 圆角：${t.radius.tendency}（${t.radius.sm}px / ${t.radius.md}px / ${t.radius.lg}px）。\n- 阴影：${t.shadow.weight}${t.shadow.weight === "有" ? `，${t.shadow.md}` : ""}。\n\n## CSS\n\`\`\`css\n:root {\n${css}\n}\n\n${roleCss}\n\`\`\`\n\n## 复用与来源\n${notes}\n`;
}
async function atomicJson(file:string, value:unknown) { const tmp=`${file}.${process.pid}.tmp`; await writeFile(tmp,JSON.stringify(value,null,2)+"\n"); await rename(tmp,file); }
function missingPath(error: unknown): boolean { return (error as NodeJS.ErrnoException | undefined)?.code === "ENOENT"; }
function isIndexEntry(value: unknown): value is IndexEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return ["id", "name", "url", "accent", "extractedAt"].every((key) => typeof entry[key] === "string")
    && typeof entry.primaryStyle === "string" && legal.has(entry.primaryStyle)
    && (entry.secondaryStyle === null || typeof entry.secondaryStyle === "string" && legal.has(entry.secondaryStyle))
    && Array.isArray(entry.descriptors) && entry.descriptors.every((item) => typeof item === "string")
    && typeof entry.partial === "boolean"
    && Array.isArray(entry.validationFlags) && entry.validationFlags.every((flag) => typeof flag === "string" && VALIDATION_FLAGS.has(flag));
}
async function readIndex(indexFile: string): Promise<IndexEntry[]> {
  let value: unknown;
  try { value=JSON.parse(await readFile(indexFile,"utf8")); }
  catch (error) {
    if (missingPath(error)) return [];
    throw new Error(`无法读取 sites/index.json：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(value)) throw new Error("sites/index.json 必须是数组。");
  if (!value.every(isIndexEntry)) throw new Error("sites/index.json 包含无效条目。");
  if (new Set(value.map((entry) => entry.id)).size !== value.length) throw new Error("sites/index.json 包含重复 ID。");
  return value;
}
async function finalizeOnce(value: unknown, judgment: unknown, workDir=process.cwd()): Promise<SiteRecord> {
  if (!value || typeof value !== "object" || (value as { schemaVersion?: unknown }).schemaVersion !== 2) throw new Error("draft.json schemaVersion 必须为 2，请重新运行 collect。");
  const draft=value as Draft;
  const style=validateJudgment(judgment), staging=path.join(workDir,".style-extractor",draft.id), screenshot=path.join(staging,"screenshot.png"); const raw=JSON.parse(await readFile(path.join(staging,"raw.json"),"utf8"));
  const record:SiteRecord={...draft,style,screenshot:"screenshot.png",validationNotices:[]};
  const primaryScreenshot=path.join(staging,"evidence","primary-top.png");
  try {
    try { record.fidelity=await fidelity(primaryScreenshot,raw,record.tokens); }
    catch (error) {
      if (!missingPath(error)) throw error;
      record.fidelity=await fidelity(screenshot,raw,record.tokens);
    }
    record.validationNotices=fidelityNotices(record.fidelity);
  } catch { record.validationNotices=["无法完成截图保真校验，结果仅供参考。"] }
  const sitesRoot=path.join(workDir,"sites"), indexFile=path.join(sitesRoot,"index.json"); const index=await readIndex(indexFile);
  const nextIndex=sortIndex([...index.filter(x=>x.id!==record.id),indexEntry(record)]);
  const document=guide(record);
  await mkdir(sitesRoot,{recursive:true});
  const target=path.join(sitesRoot,draft.id), nextDir=await mkdtemp(path.join(sitesRoot,`.${draft.id}-finalize-`));
  const backup=`${target}.${process.pid}.old`, indexTmp=`${indexFile}.${path.basename(nextDir)}.tmp`;
  let hadTarget=false;
  try {
    try { await cp(target,nextDir,{recursive:true,force:true}); } catch (error) { if (!missingPath(error)) throw error; }
    await copyFile(screenshot,path.join(nextDir,"screenshot.png"));
    await atomicJson(path.join(nextDir,"site.json"),record);
    await writeFile(path.join(nextDir,"STYLE-GUIDE.md"),document);
    await writeFile(indexTmp,JSON.stringify(nextIndex,null,2)+"\n");
    try { await rename(target,backup); hadTarget=true; } catch (error) { if (!missingPath(error)) throw error; }
    try {
      await rename(nextDir,target);
    } catch (error) {
      if (hadTarget) await rename(backup,target);
      throw error;
    }
    try {
      await rename(indexTmp,indexFile);
    } catch (error) {
      await rm(target,{recursive:true,force:true});
      if (hadTarget) await rename(backup,target);
      throw error;
    }
    if (hadTarget) {
      try { await rm(backup,{recursive:true,force:true}); } catch { /* committed; cleanup is best-effort */ }
    }
  } finally {
    await rm(nextDir,{recursive:true,force:true});
    await rm(indexTmp,{recursive:true,force:true});
  }
  return record;
}

const finalizations = new Map<string, Promise<void>>();
export async function finalize(value: unknown, judgment: unknown, workDir=process.cwd()): Promise<SiteRecord> {
  const key=path.resolve(workDir), previous=finalizations.get(key) ?? Promise.resolve();
  const run=previous.then(()=>finalizeOnce(value,judgment,workDir));
  const settled=run.then(()=>undefined,()=>undefined);
  finalizations.set(key,settled);
  try { return await run; }
  finally { if (finalizations.get(key)===settled) finalizations.delete(key); }
}
