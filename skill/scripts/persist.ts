import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { STYLE_VOCABULARY, type Draft, type Judgment, type SiteRecord } from "./schema.js";
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
export function guide(site: SiteRecord): string { const c=(role:string)=>site.tokens.colors.find(x=>x.role===role)?.hex ?? "未确定"; const t=site.tokens; return `# STYLE-GUIDE · ${site.name}\n> 用途：给前端改造定方向的可迁移风格画像。只含原子与原则，不含布局/组件/结构。整段粘给编码 agent。\n\n## 风格定调\n主风格：${site.style.primary}${site.style.secondary ? ` · 次风格：${site.style.secondary}` : ""}\n气质词：${site.style.descriptors.join(" / ")}\n${site.style.thesis}\n\n## 主题色（只保留 L1/L2 稳定色）\n- 使用背景 ${c("背景 bg")}、分隔面 ${c("surface")}、正文 ${c("text")}、次要 ${c("muted")}。\n- 仅将强调 ${c("accent")} 用于 CTA 与关键数据，保持克制。\n- 用大面积中性打底，避免铺满强调色。\n\n## 字体\n- 使用字体栈：${t.typography.fontSans}\n- 维持${t.typography.contrast}层级，标题 ${t.typography.scale.at(-1)?.px ?? 0}/${t.typography.scale.at(-1)?.w ?? 400}，不要引入装饰字体。\n\n## 间距 / 密度\n- 以 ${t.space.unit}px 为基准，整体${t.space.density}；用留白而非分隔线建立节奏。\n\n## 圆角 / 阴影\n- 保持${t.radius.tendency}圆角（约 ${t.radius.md}px）。\n- 使用${t.shadow.weight}阴影：${t.shadow.md}。\n\n## 该做 / 该避免\n- 做：保持色彩克制、留白撑场、层级靠字重字号。\n- 避免：多强调色并置、重阴影、信息紧凑堆叠。\n`; }
async function atomicJson(file:string, value:unknown) { const tmp=`${file}.${process.pid}.tmp`; await writeFile(tmp,JSON.stringify(value,null,2)+"\n"); await rename(tmp,file); }
export async function finalize(draft: Draft, judgment: unknown, workDir=process.cwd()): Promise<SiteRecord> {
  const style=validateJudgment(judgment), staging=path.join(workDir,".style-extractor",draft.id), screenshot=path.join(staging,"screenshot.png"); const raw=JSON.parse(await readFile(path.join(staging,"raw.json"),"utf8"));
  const record:SiteRecord={...draft,style,screenshot:"screenshot.png"};
  try { record.fidelity=await fidelity(screenshot,raw,record.tokens); if(record.fidelity.coverage<.65 || record.fidelity.eligibleRatio<.2) record.warnings=[...record.warnings,`调色板保真覆盖率 ${record.fidelity.coverage}（阈值 0.65），结果仅供参考。`]; } catch { record.warnings=[...record.warnings,"无法完成截图保真校验，结果仅供参考。"] }
  const target=path.join(workDir,"sites",draft.id); await mkdir(target,{recursive:true}); await copyFile(screenshot,path.join(target,"screenshot.png")); await atomicJson(path.join(target,"site.json"),record); await writeFile(path.join(target,"STYLE-GUIDE.md"),guide(record));
  const indexFile=path.join(workDir,"sites","index.json"); let index:Array<Record<string,string>>=[]; try { index=JSON.parse(await readFile(indexFile,"utf8")); } catch { /* initialized below */ }
  const entry={id:record.id,name:record.name,url:record.url,primaryStyle:record.style.primary,accent:record.tokens.colors.find(x=>x.role==="accent")?.hex ?? ""}; index=[...index.filter(x=>x.id!==record.id),entry].sort((a,b)=>a.name.localeCompare(b.name)); await atomicJson(indexFile,index); return record;
}
