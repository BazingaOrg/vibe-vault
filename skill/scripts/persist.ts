import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { STYLE_VOCABULARY, type Draft, type IndexEntry, type Judgment, type SiteRecord } from "./schema.js";
import { fidelity } from "./verify.js";
const legal = new Set<string>(STYLE_VOCABULARY);
export function validateJudgment(value: unknown): Judgment {
  if (!value || typeof value !== "object") throw new Error("judgment.json 必须是对象。"); const j=value as Record<string,unknown>;
  if (typeof j.primary!=="string" || !legal.has(j.primary)) throw new Error("primary 必须来自封闭风格词表。");
  if (j.secondary !== null && (typeof j.secondary!=="string" || !legal.has(j.secondary))) throw new Error("secondary 必须为词表项或 null。");
  if (!Array.isArray(j.descriptors) || j.descriptors.length<3 || j.descriptors.length>5 || !j.descriptors.every(x=>typeof x==="string"&&x.trim().length>=2&&x.trim().length<=32)) throw new Error("descriptors 必须为 3–5 个长度 2–32 的词。");
  if (typeof j.thesis!=="string" || j.thesis.trim().length<40 || j.thesis.trim().length>600) throw new Error("thesis 长度必须为 40–600 字符。");
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
  return {
    id: record.id, name: record.name, url: record.url,
    primaryStyle: record.style.primary, secondaryStyle: record.style.secondary,
    descriptors: record.style.descriptors, accent: color(record, "accent") === "未确定" ? "" : color(record, "accent"),
    extractedAt: record.extractedAt, partial: record.warnings.length > 0,
  };
}
export function sortIndex(entries: IndexEntry[]): IndexEntry[] {
  return [...entries].sort((a,b)=>b.extractedAt.localeCompare(a.extractedAt)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function guide(site: SiteRecord): string {
  const t = site.tokens;
  const scale = [...t.typography.scale].sort((a, b) => a.px - b.px);
  const min = scale[0];
  const max = scale.at(-1);
  const css = Object.entries(site.theme).filter(([name]) => !name.startsWith("--tk-btn-")).map(([name, value]) => `  ${name}: ${value};`).join("\n");
  return `# STYLE-GUIDE\n\n## 风格方向\n主风格：${site.style.primary}${site.style.secondary ? ` · 次风格：${site.style.secondary}` : ""}\n气质词：${site.style.descriptors.join(" / ")}\n${site.style.thesis}\n\n## 语义色彩\n| 用途 | 色值 | 使用方式 |\n| --- | --- | --- |\n| 背景 | ${color(site, "background")} | 页面底色与大面积留白 |\n| 表面 | ${color(site, "surface")} | 内容承载面或层次区分 |\n| 正文 | ${color(site, "text")} | 主要文字与关键信息 |\n| 次要文字 | ${color(site, "muted")} | 辅助信息、说明与元数据 |\n| 强调 | ${color(site, "accent")} | 主要操作、状态或注意点 |\n| 边框 | ${color(site, "border")} | 分隔、描边与结构边界 |\n\n## 字体与字阶\n- 主要字体栈：${t.typography.fontSans}\n- 对比：${t.typography.contrast}。字阶范围 ${min?.px ?? 0}–${max?.px ?? 0}px。\n${scale.length ? scale.map((item) => `- ${item.role}：${item.px}px / ${item.w} / ${item.lh}`).join("\n") : "- 字阶未定义。"}\n\n## 间距与形态\n- 间距基准：${t.space.unit}px；整体密度：${t.space.density}。\n- 间距阶梯：${t.space.scale.length ? t.space.scale.map((value) => `${value}px`).join(" / ") : "未定义"}。\n- 圆角：${t.radius.tendency}（${t.radius.sm}px / ${t.radius.md}px / ${t.radius.lg}px）。\n- 阴影：${t.shadow.weight}${t.shadow.weight === "有" ? `，${t.shadow.md}` : ""}。\n\n## CSS\n\`\`\`css\n:root {\n${css}\n}\n\`\`\`\n`;
}
async function atomicJson(file:string, value:unknown) { const tmp=`${file}.${process.pid}.tmp`; await writeFile(tmp,JSON.stringify(value,null,2)+"\n"); await rename(tmp,file); }
export async function finalize(draft: Draft, judgment: unknown, workDir=process.cwd()): Promise<SiteRecord> {
  const style=validateJudgment(judgment), staging=path.join(workDir,".style-extractor",draft.id), screenshot=path.join(staging,"screenshot.png"); const raw=JSON.parse(await readFile(path.join(staging,"raw.json"),"utf8"));
  const record:SiteRecord={...draft,style,screenshot:"screenshot.png"};
  try { record.fidelity=await fidelity(screenshot,raw,record.tokens); if(record.fidelity.coverage<.65 || record.fidelity.eligibleRatio<.2) record.warnings=[...record.warnings,`调色板保真覆盖率 ${record.fidelity.coverage}（阈值 0.65），结果仅供参考。`]; } catch { record.warnings=[...record.warnings,"无法完成截图保真校验，结果仅供参考。"] }
  const target=path.join(workDir,"sites",draft.id); await mkdir(target,{recursive:true}); await copyFile(screenshot,path.join(target,"screenshot.png")); await atomicJson(path.join(target,"site.json"),record); await writeFile(path.join(target,"STYLE-GUIDE.md"),guide(record));
  const indexFile=path.join(workDir,"sites","index.json"); let index:IndexEntry[]=[]; try { index=JSON.parse(await readFile(indexFile,"utf8")); } catch { /* initialized below */ }
  index=sortIndex([...index.filter(x=>x.id!==record.id),indexEntry(record)]); await atomicJson(indexFile,index); return record;
}
