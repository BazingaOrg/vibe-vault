import test from "node:test";
import assert from "node:assert/strict";
import { clusterColors, colorToOklch, contrastLabel, contrastRatio, displayName, distance, normalize, normalizeShadow, splitShadowLayers } from "../skill/scripts/normalize.js";
import { siteId } from "../skill/scripts/collect.js";
import { fidelityFlags, fidelityNotices, guide, indexEntry, sortIndex, validateJudgment } from "../skill/scripts/persist.js";
import { collect } from "../skill/scripts/collect.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import type { RawExtraction } from "../skill/scripts/schema.js";
// @ts-expect-error Browser helpers intentionally stay dependency-free JavaScript.
import { fontStackSummary, foregroundFor, previewBackdropFor, splitFontStack } from "../assets/theme.js";
// @ts-expect-error Browser renderer intentionally stays dependency-free JavaScript.
import { colorPreview } from "../assets/render.js";
const base: RawExtraction={url:"https://www.example.com/x",id:"example-com",collectedAt:"2026-07-22T00:00:00Z",viewport:{width:1440,height:900},rootVariables:{},mediaRects:[],warnings:[],samples:[
 {tag:"body",root:true,text:false,media:false,rect:{x:0,y:0,width:1440,height:900},colors:{backgroundColor:"rgb(255,255,255)",color:"rgb(12, 20, 33)",borderColor:"rgba(0, 0, 0, 0)"},fontFamily:"Inter, sans-serif",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[8,16]},
 ...Array.from({length:10},(_,i)=>({tag:"a",text:true,media:false,rect:{x:i*10,y:20,width:100,height:30},colors:{backgroundColor:"rgba(0, 0, 0, 0)",color:"rgb(98, 91, 255)",borderColor:"rgb(230, 235, 241)"},fontFamily:"Inter, sans-serif",fontSize:16,fontWeight:500,lineHeight:24,radius:8,shadow:"0 2px 8px rgba(10,37,64,.08)",spacing:[8,16]}))
]};
test("normalizes a stable palette and theme",()=>{ const d=normalize(base); assert.equal(d.id,"example-com"); assert.ok(d.tokens.colors.some(c=>c.role==="背景 bg")); assert.ok(d.theme["--tk-bg"]); assert.equal(d.tokens.space.unit,8); assert.ok(clusterColors(base).length>=3); });
test("contrast is computed from the palette, not assumed high",()=>{
  assert.equal(contrastLabel("#ffffff","#000000"),"高对比"); assert.equal(contrastLabel("#7c7c7c","#ffffff"),"中等对比"); assert.equal(contrastLabel("#999999","#ffffff"),"低对比");
  assert.ok(contrastRatio("#ffffff","#000000") >= 4.5); assert.ok(contrastRatio("#999999","#ffffff") < 3);
  const raw:RawExtraction={...base,samples:[{...base.samples[0],colors:{backgroundColor:"rgb(255,255,255)",color:"rgb(12, 20, 33)"}}, ...base.samples.slice(1).map((s,i)=>({...s,colors:{color:"rgb(153, 153, 153)"}}))]};
  assert.equal(normalize(raw).tokens.typography.contrast,"高对比");
});
test("radius tendency ignores pill-shaped corners",()=>{
  const sample=(radius:number,count=1)=>({tag:"a",text:true,media:false,rect:{x:0,y:0,width:100,height:30},colors:{},fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius,shadow:"none",spacing:[8]});
  const withRadii=(radii:number[])=>({...base,samples:[base.samples[0],...radii.map((radius)=>sample(radius))]}) as RawExtraction;
  assert.deepEqual(normalize(withRadii([2,50,999])).tokens.radius,{tendency:"较克制",sm:2,md:2,lg:2});
  assert.equal(normalize(withRadii([12,16,20])).tokens.radius.tendency,"偏圆润");
  assert.equal(normalize(withRadii([60,120])).tokens.radius.tendency,"胶囊圆润");
  assert.deepEqual(normalize(withRadii([0,0])).tokens.radius,{tendency:"直角",sm:0,md:0,lg:0});
});
test("density has three tiers instead of a binary guess",()=>{
  const withSpacing=(spacing:number[])=>({...base,samples:[{...base.samples[0],spacing}, ...base.samples.slice(1)]}) as RawExtraction;
  assert.equal(normalize(withSpacing([4,6,8])).tokens.space.density,"紧凑");
  assert.equal(normalize(withSpacing([12,16])).tokens.space.density,"适中");
  assert.equal(normalize(withSpacing([24,32])).tokens.space.density,"偏疏");
});
test("preview helpers keep same-colour roles readable and preserve real border paint",()=>{
 assert.equal(previewBackdropFor("#31353a","#14181e","#31353a"),"#fff");
 assert.ok(contrastRatio("#31353a",previewBackdropFor("#31353a","#14181e","#31353a"))>=3);
 assert.equal(previewBackdropFor("#777777",undefined,undefined),"#000");
 assert.equal(foregroundFor("#c9a96e","#f5f3ee"),"#000");
 const border=colorPreview("边框","border","#31353a","#f5f3ee","#14181e","#31353a");
 assert.match(border,/type="button" class="swatch swatch--border"/); assert.match(border,/class="sample-border" style="border-color:#31353a"/); assert.doesNotMatch(border,/style="[^"]*;color:#31353a/);
 const accent=colorPreview("强调色","accent","#c9a96e","#f5f3ee","#14181e","#31353a");
 assert.match(accent,/sample-action/); assert.match(accent,/color:#000/);
});
test("copy controls use explicit native buttons",()=>{ assert.match(colorPreview("正文","text","#111111","#111111","#ffffff","#eeeeee"),/^<button type="button"/); });
test("font stack summaries are quote and escape aware without changing source values",()=>{
 const yeguozi='"Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei"';
 assert.equal(fontStackSummary(yeguozi),"主要字体 · Helvetica Neue（另 8 个回退）"); assert.equal(yeguozi,'"Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei"');
 assert.deepEqual(splitFontStack('"A, B", "C\\\\, D", serif'),['"A, B"','"C\\\\, D"','serif']);
 assert.equal(fontStackSummary("Inter"),"主要字体 · Inter"); assert.equal(fontStackSummary(""),"未采集字体栈"); assert.equal(fontStackSummary(undefined),"未采集字体栈"); assert.doesNotThrow(()=>splitFontStack('"unterminated, serif'));
});
test("uses stable background evidence instead of mixed foreground area",()=>{
 const foreground={tag:"a",text:true,media:false,rect:{x:0,y:0,width:1440,height:800},colors:{color:"rgb(245, 243, 238)"},fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[]};
 const raw:RawExtraction={...base,samples:[
  {...base.samples[0],colors:{backgroundColor:"rgb(20, 24, 30)",color:"rgb(245, 243, 238)"}},
  ...Array.from({length:10},()=>({...foreground,colors:{backgroundColor:"rgb(245, 243, 238)"},rect:{x:0,y:0,width:1,height:1}})),
  foreground,
  ...Array.from({length:3},()=>({tag:"section",text:false,media:false,rect:{x:0,y:0,width:300,height:100},colors:{backgroundColor:"rgb(49, 53, 58)",borderColor:"rgb(49, 53, 58)"},fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[]}))
 ]};
 const colors=Object.fromEntries(normalize(raw).tokens.colors.map((color)=>[color.role,color.hex]));
 assert.equal(colors["背景 bg"],"#14181e"); assert.equal(colors.surface,"#31353a"); assert.equal(colors.text,"#f5f3ee"); assert.equal(colors.border,"#31353a");
});
test("keeps the established Codex Resets six semantic colours", async()=>{
  const sample=(colors:Record<string,string>, count:number, rect={x:0,y:0,width:120,height:40})=>Array.from({length:count},()=>({tag:"a",text:true,media:false,rect,colors,fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[]}));
  const raw:RawExtraction={...base,rootVariables:{"--paper":"#fff4dd","--card":"#fffdf7","--ink":"#26201a","--ink-2":"#5c5347","--accent":"#ff5c2b","--border":"2px solid #26201a"},samples:[
    {...base.samples[0],colors:{backgroundColor:"rgb(255, 244, 221)",color:"rgb(0, 0, 0)"}},
    ...sample({backgroundColor:"rgb(255, 253, 247)"},3), ...sample({color:"rgb(0, 0, 0)"},10),
    ...sample({color:"rgb(38, 32, 26)",borderColor:"rgb(38, 32, 26)"},6,{x:0,y:0,width:500,height:40}), ...sample({color:"rgb(92, 83, 71)"},5), ...sample({color:"rgb(255, 92, 43)"},5)
  ]};
  const colors=Object.fromEntries(normalize(raw).tokens.colors.map((color)=>[color.role,color.hex]));
  assert.deepEqual(colors,{"背景 bg":"#fff4dd",surface:"#fffdf7",text:"#26201a",muted:"#5c5347",accent:"#ff5c2b",border:"#26201a"});
});
test("derives the Yeguozi dark semantic palette from stable property evidence", async()=>{
 const sample=(colors:Record<string,string>, count:number, rect={x:0,y:0,width:120,height:40})=>Array.from({length:count},()=>({tag:"a",text:true,media:false,rect,colors,fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[]}));
 const raw:RawExtraction={...base,samples:[
  {...base.samples[0],colors:{backgroundColor:"rgb(20, 24, 30)",color:"rgb(245, 243, 238)"}},
  ...sample({backgroundColor:"rgb(49, 53, 58)",borderColor:"rgb(49, 53, 58)"},3), ...sample({color:"rgb(245, 243, 238)"},10),
  ...sample({color:"rgb(107, 105, 100)"},5,{x:0,y:0,width:500,height:40}), ...sample({color:"rgb(168, 165, 158)"},6),
  ...sample({color:"rgb(201, 169, 110)"},3)
 ]};
 const colors=Object.fromEntries(normalize(raw).tokens.colors.map((color)=>[color.role,color.hex]));
 assert.deepEqual(colors,{"背景 bg":"#14181e",surface:"#31353a",text:"#f5f3ee",muted:"#6b6964",accent:"#c9a96e",border:"#31353a"});
});
test("selects the visually dominant real text font and ignores non-text inheritance",()=>{ const raw:RawExtraction={...base,samples:[
 {tag:"div",text:false,media:false,rect:{x:0,y:0,width:1440,height:800},colors:{},fontFamily:"Arial",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[]},
 {tag:"h1",text:true,media:false,rect:{x:0,y:0,width:600,height:64},colors:{},fontFamily:'"Baloo 2", sans-serif',fontSize:64,fontWeight:800,lineHeight:68,radius:0,shadow:"none",spacing:[]},
 {tag:"code",text:true,media:false,rect:{x:0,y:0,width:1000,height:20},colors:{},fontFamily:"ui-monospace",fontSize:14,fontWeight:400,lineHeight:20,radius:0,shadow:"none",spacing:[]}
]}; assert.equal(normalize(raw).tokens.typography.fontSans,'"Baloo 2", sans-serif'); });
test("falls back to body font when no usable text sample exists",()=>{ const raw:RawExtraction={...base,samples:[{...base.samples[0],text:false,fontFamily:"Body Font",fontSize:16}]}; assert.equal(normalize(raw).tokens.typography.fontSans,"Body Font"); });
test("extracts distinct typography roles and exposes the display family in the theme",()=>{
 const raw:RawExtraction={...base,samples:[
  {...base.samples[0],fontFamily:"Inter, sans-serif"},
  {tag:"h1",text:true,media:false,rect:{x:0,y:0,width:700,height:80},colors:{},fontFamily:"Cormorant Garamond, serif",fontSize:64,fontWeight:500,lineHeight:68,letterSpacing:-1.2,fontStyle:"normal",textTransform:"none",radius:0,shadow:"none",spacing:[24]},
  ...Array.from({length:4},()=>({tag:"p",text:true,media:false,rect:{x:0,y:100,width:600,height:48},colors:{},fontFamily:"Inter, sans-serif",fontSize:16,fontWeight:400,lineHeight:26,letterSpacing:0,fontStyle:"normal",textTransform:"none",radius:0,shadow:"none",spacing:[16]})),
  {tag:"small",text:true,media:false,rect:{x:0,y:180,width:180,height:18},colors:{},fontFamily:"Inter, sans-serif",fontSize:11,fontWeight:600,lineHeight:14,letterSpacing:.8,fontStyle:"normal",textTransform:"uppercase",radius:0,shadow:"none",spacing:[8]},
 ]};
 const draft=normalize(raw);
 assert.equal(draft.visualGrammar.typography.display.value?.family,"Cormorant Garamond, serif");
 assert.equal(draft.visualGrammar.typography.body.value?.family,"Inter, sans-serif");
 assert.equal(draft.visualGrammar.typography.meta.value?.textTransform,"uppercase");
 assert.equal(draft.visualGrammar.typography.pairing.value,"展示字体与正文字体形成对照");
 assert.equal(draft.theme["--tk-font-display"],"Cormorant Garamond, serif");
});
test("visual grammar records stroke and composite style signals",()=>{
 const raw:RawExtraction={...base,samples:base.samples.map((sample)=>({...sample,borderWidth:2,borderStyle:"solid"}))};
 const grammar=normalize(raw).visualGrammar;
 assert.deepEqual(grammar.stroke.value,{widths:[2],primary:2,style:"solid",character:"强调描边"});
 assert.equal(grammar.stroke.source,"measured");
 assert.ok(grammar.elementTraits.includes("强调描边"));
 assert.match(grammar.elevation.value??"",/层次阴影/);
});
test("domain ids and strict judgments",()=>{ assert.equal(siteId("https://www.Stripe.com/pay"),"stripe-com"); assert.throws(()=>validateJudgment({primary:"Invented",secondary:null,descriptors:[],thesis:"x"})); assert.equal(validateJudgment({primary:"Minimalism",secondary:null,descriptors:["calm","clean","premium"],thesis:"保持清晰而克制的层级，并让核心信息优先出现。使用稳定的留白建立节奏，避免把页面塞满装饰。"}).primary,"Minimalism"); });
test("display names use the host name without technical separators",()=>{ assert.equal(displayName("https://codex-resets.com/"),"Codex Resets"); assert.equal(displayName("https://www.example.com/path"),"Example"); assert.equal(normalize(base).name,"Example"); });
test("colour distance is finite for neutral screenshot pixels",()=>{ const white=colorToOklch("rgb(255,255,255)"); const black=colorToOklch("rgb(0,0,0)"); assert.ok(white&&black); assert.ok(Number.isFinite(distance(white!,black!))); });
test("normalizes only visible outer shadow layers without splitting rgba commas",()=>{
 const yeguozi="rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.07) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px";
 assert.equal(splitShadowLayers(yeguozi).length,3);
 assert.equal(normalizeShadow(yeguozi),"none");
 assert.equal(normalizeShadow("0 2px 8px rgba(10, 37, 64, .08), 0 0 0 1px rgb(0 0 0 / 0)"),"0 2px 8px rgba(10, 37, 64, .08)");
 assert.equal(normalizeShadow("0 0 0 1px rgb(0 0 0 / .2)"),"none");
 assert.equal(normalizeShadow("0 0 0 1px rgba(0,0,0,0), 3px 3px 0 rgb(38, 32, 26)"),"3px 3px 0 rgb(38, 32, 26)");
});
test("chooses repeated or control-priority real shadows",()=>{
 const sample=(shadow:string, tag="div", width=40,height=20)=>({tag,text:false,media:false,rect:{x:0,y:0,width,height},colors:{},fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow,spacing:[]});
 const raw:RawExtraction={...base,samples:[base.samples[0],sample("0 6px 20px rgba(0,0,0,.2)"),sample("3px 3px 0 rgb(38, 32, 26)","button",40,30),sample("3px 3px 0 rgb(38, 32, 26)","a",40,30)]};
 assert.equal(normalize(raw).tokens.shadow.md,"3px 3px 0 rgb(38, 32, 26)");
});
test("L3 and L4 colours cannot become anchors, themes, or guides",()=>{ const raw:RawExtraction={...base,samples:[...base.samples, {tag:"span",text:true,media:false,rect:{x:1,y:1,width:5,height:5},colors:{color:"rgb(255,0,0)",backgroundColor:"transparent",borderColor:"transparent"},fontFamily:"Inter",fontSize:13,fontWeight:400,lineHeight:18,radius:0,shadow:"none",spacing:[1]}, {tag:"img",text:false,media:true,rect:{x:1,y:1,width:5,height:5},colors:{color:"rgb(0,255,0)",backgroundColor:"transparent",borderColor:"transparent"},fontFamily:"Inter",fontSize:13,fontWeight:400,lineHeight:18,radius:0,shadow:"none",spacing:[1]}]}; const d=normalize(raw); const all=JSON.stringify({colors:d.tokens.colors,theme:d.theme}); assert.equal(all.includes("#ff0000"),false); assert.equal(all.includes("#00ff00"),false); assert.equal(guide({...d,style:{primary:"Minimalism",secondary:null,descriptors:["calm","clean","premium"],thesis:"保持清晰而克制的层级，并让核心信息优先出现。使用稳定的留白建立节奏，避免把页面塞满装饰。"},screenshot:"screenshot.png"}).includes("#ff0000"),false); });
test("guide accepts legacy role labels and keeps Neo-Brutalism shadows accurate",()=>{ const d=normalize(base); const styled={...d,style:{primary:"Neo-Brutalism" as const,secondary:null,descriptors:["direct","bold","tactile"],thesis:"以清晰的边界和直接的色彩建立视觉秩序。阴影与描边共同传达明确的触感。"},screenshot:"screenshot.png"}; styled.tokens.colors=[{role:"背景 bg",hex:"#fff4dd",stability:"L1",freq:.2},{role:"正文 text",hex:"#000000",stability:"L1",freq:.2},{role:"分隔面 surface",hex:"#ffd84d",stability:"L2",freq:.2},{role:"强调 accent",hex:"#ff5c2b",stability:"L1",freq:.2},{role:"边框 border",hex:"#877b6b",stability:"L1",freq:.2}]; styled.tokens.shadow={weight:"有",md:"rgb(38, 32, 26) 3px 3px 0px 0px"}; const output=guide(styled); assert.equal(output.split("\n",1)[0],"# STYLE-GUIDE"); assert.match(output,/## 风格方向\n/); assert.match(output,/## 语义色彩\n/); assert.match(output,/\| 表面 \| #ffd84d \|/); assert.match(output,/## CSS/); assert.match(output,/3px 3px 0px 0px/); for(const legacy of ["STYLE-GUIDE ·","用途：","迁移边界","## 使用边界","已采集间距","未采集到字阶","未采集的信息","原站布局"]){assert.equal(output.includes(legacy),false);} assert.equal(output.includes("避免重阴影"),false); assert.equal(output.includes("不要引入装饰字体"),false); assert.equal(output.includes("CTA"),false); });
test("saved index excludes the removed example record", async()=>{ const index=JSON.parse(await (await import("node:fs/promises")).readFile(path.join(process.cwd(),"sites/index.json"),"utf8")) as Array<{id:string}>; assert.equal(index.some((entry)=>entry.id==="example-com"),false); });
test("index entry maps extraction warnings separately from validation limits",()=>{ const record={...normalize(base),extractedAt:"2026-07-22",style:{primary:"Minimalism" as const,secondary:"Editorial" as const,descriptors:["calm","clean","precise"],thesis:"保持清晰而克制的视觉层级，让内容和留白共同建立稳定节奏。避免用装饰取代信息优先级。"},screenshot:"screenshot.png",warnings:["采集不完整"],fidelity:{coverage:.9,eligibleRatio:.1,mean:.01,p95:.02,samples:10},validationNotices:["非媒体可校验像素比例 0.1（阈值 0.2），结果仅供参考。"]}; record.tokens.colors=[{role:"强调 accent",hex:"#d4552b",stability:"L1",freq:.2}]; assert.deepEqual(indexEntry(record),{id:record.id,name:record.name,url:record.url,primaryStyle:"Minimalism",secondaryStyle:"Editorial",descriptors:["calm","clean","precise"],accent:"#d4552b",extractedAt:"2026-07-22",partial:true,validationFlags:["media-heavy"]}); const complete={...record,warnings:[]}; assert.deepEqual(indexEntry(complete),{...indexEntry(record),partial:false}); });
test("index sort uses date descending then name and id",()=>{ const entry=(id:string,name:string,extractedAt:string)=>({id,name,url:"https://example.com",primaryStyle:"Minimalism" as const,secondaryStyle:null,descriptors:[],accent:"",extractedAt,partial:false,validationFlags:[]}); assert.deepEqual(sortIndex([entry("z","Beta","2026-07-22"),entry("a","Alpha","2026-07-22"),entry("new","New","2026-07-23")]).map(item=>item.id),["new","a","z"]); });
test("fidelity notices and flags identify the metric that missed its threshold",()=>{ assert.deepEqual(fidelityNotices({coverage:.9,eligibleRatio:.1,samples:10}),["非媒体可校验像素比例 0.1（阈值 0.2），结果仅供参考。"]); assert.deepEqual(fidelityFlags({coverage:.9,eligibleRatio:.1,samples:10}),["media-heavy"]); assert.equal(fidelityNotices({coverage:.9,eligibleRatio:.8,samples:10}).length,0); assert.deepEqual(fidelityFlags({coverage:.5,eligibleRatio:.1,samples:10}),["palette-low","media-heavy"]); assert.deepEqual(fidelityNotices({coverage:0,eligibleRatio:0,samples:0}),["无法完成截图保真校验，结果仅供参考。"]); assert.deepEqual(fidelityFlags({coverage:0,eligibleRatio:0,samples:0}),["unavailable"]); });
test("root variables resolve aliases but reject non-border composite paints",()=>{ const raw:RawExtraction={...base,rootVariables:{"--brand-red":"#625bff","--accent":"var(--brand-red)","--background":"linear-gradient(#ff0000, #000000)"}}; const colors=Object.fromEntries(normalize(raw).tokens.colors.map((c)=>[c.role,c.hex])); assert.equal(colors.accent,"#625bff"); assert.notEqual(colors["背景 bg"],"#ff0000"); });
test("collect samples a local fixture and preserves non-generated staging files on refresh", async()=>{ const root=await mkdtemp(path.join(tmpdir(),"vibe-vault-")); try { const fixture=pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)),"fixtures/collector.html")).href; const {raw,dir}=await collect(fixture,root); assert.ok(raw.samples.length>0); assert.equal(raw.warnings.some(w=>w.includes("采集不完整")),false); assert.ok(raw.samples.some((sample)=>typeof sample.letterSpacing==="number"&&typeof sample.borderWidth==="number"&&typeof sample.opacity==="number")); const { access, writeFile } = await import("node:fs/promises"); await access(path.join(dir,"screenshot.png")); await access(path.join(dir,"evidence","manifest.json")); await access(path.join(dir,"evidence","primary-top.png")); await writeFile(path.join(dir,"judgment.json"),"{}\n"); await writeFile(path.join(dir,"evidence","manual-note.json"),"{}\n"); await collect(fixture,root); await access(path.join(dir,"judgment.json")); await access(path.join(dir,"evidence","manual-note.json")); } finally { await rm(root,{recursive:true,force:true}); } });
test("SVG chart descendants are media and cannot anchor the palette",()=>{
 const sample=(tag:string,media:boolean,colors:Record<string,string>)=>({tag,text:false,media,rect:{x:10,y:10,width:200,height:80},colors,fontFamily:"Inter",fontSize:12,fontWeight:400,lineHeight:16,radius:0,shadow:"none",spacing:[]});
 const raw:RawExtraction={...base,samples:[
  base.samples[0],
  ...Array.from({length:12},()=>sample("polyline",true,{color:"rgb(0, 200, 180)",borderColor:"rgb(0, 200, 180)"})),
  ...Array.from({length:8},()=>sample("path",true,{color:"rgb(31, 54, 86)"})),
  ...Array.from({length:10},()=>({tag:"a",text:true,media:false,rect:{x:0,y:0,width:120,height:30},colors:{color:"rgb(24, 24, 34)"},fontFamily:"Inter",fontSize:16,fontWeight:500,lineHeight:24,radius:2,shadow:"none",spacing:[8]}))
 ]};
 const hexes=normalize(raw).tokens.colors.map((c)=>c.hex);
 assert.equal(hexes.includes("#00c8b4"),false);
 assert.equal(hexes.includes("#1f3656"),false);
 assert.ok(hexes.includes("#181822") || hexes.includes("#0c1421") || normalize(raw).tokens.colors.some((c)=>c.role==="text"||c.role==="背景 bg"));
});
test("root design variables beat high-chroma metric ink for accent and text roles",()=>{
 const sample=(colors:Record<string,string>, count:number)=>Array.from({length:count},()=>({tag:"span",text:true,media:false,rect:{x:0,y:0,width:80,height:24},colors,fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[]}));
 const raw:RawExtraction={...base,rootVariables:{
  "--paper":"#f7faf8","--ink":"#181822","--ink-mute":"#5c5c65","--oxblood":"#a0292a","--hairline":"#c6cecd","--paper-tint":"#f0f4f1","--verdant":"#006967","--signal":"#1f3656"
 },samples:[
  {...base.samples[0],colors:{backgroundColor:"rgb(247, 250, 248)",color:"rgb(24, 24, 34)"}},
  ...sample({color:"rgb(82, 198, 192)"},8),
  ...sample({color:"rgb(24, 24, 34)"},6),
  ...sample({color:"rgb(92, 92, 101)"},5),
  ...sample({borderColor:"rgb(198, 206, 205)"},4),
  ...sample({color:"rgb(160, 41, 42)"},3),
  ...Array.from({length:3},()=>({tag:"button",text:true,media:false,rect:{x:0,y:0,width:120,height:36},colors:{backgroundColor:"rgb(24, 24, 34)",color:"rgb(247, 250, 248)"},fontFamily:"Inter",fontSize:14,fontWeight:600,lineHeight:20,radius:2,shadow:"none",spacing:[8]}))
 ]};
 const colors=Object.fromEntries(normalize(raw).tokens.colors.map((c)=>[c.role,c.hex]));
 assert.equal(colors["背景 bg"],"#f7faf8");
 assert.equal(colors.text,"#181822");
 assert.equal(colors.muted,"#5c5c65");
 assert.equal(colors.accent,"#a0292a");
 assert.equal(colors.border,"#c6cecd");
  assert.notEqual(colors.accent,"#52c6c0");
});
test("unused root colour variables cannot become stable tokens",()=>{
 const raw:RawExtraction={...base,rootVariables:{"--paper":"#ffffff","--accent":"#ff00ff"}};
 const colors=Object.fromEntries(normalize(raw).tokens.colors.map((c)=>[c.role,c.hex]));
 assert.equal(colors["背景 bg"],"#ffffff");
 assert.notEqual(colors.accent,"#ff00ff");
});
