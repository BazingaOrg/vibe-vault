import test from "node:test";
import assert from "node:assert/strict";
import { clusterColors, colorToOklch, displayName, distance, normalize, normalizeShadow, splitShadowLayers } from "../skill/scripts/normalize.js";
import { siteId } from "../skill/scripts/collect.js";
import { validateJudgment } from "../skill/scripts/persist.js";
import { guide } from "../skill/scripts/persist.js";
import { collect } from "../skill/scripts/collect.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import type { RawExtraction } from "../skill/scripts/schema.js";
const base: RawExtraction={url:"https://www.example.com/x",id:"example-com",collectedAt:"2026-07-22T00:00:00Z",viewport:{width:1440,height:900},rootVariables:{},mediaRects:[],warnings:[],samples:[
 {tag:"body",root:true,text:false,media:false,rect:{x:0,y:0,width:1440,height:900},colors:{backgroundColor:"rgb(255,255,255)",color:"rgb(12, 20, 33)",borderColor:"rgba(0, 0, 0, 0)"},fontFamily:"Inter, sans-serif",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow:"none",spacing:[8,16]},
 ...Array.from({length:10},(_,i)=>({tag:"a",text:true,media:false,rect:{x:i*10,y:20,width:100,height:30},colors:{backgroundColor:"rgba(0, 0, 0, 0)",color:"rgb(98, 91, 255)",borderColor:"rgb(230, 235, 241)"},fontFamily:"Inter, sans-serif",fontSize:16,fontWeight:500,lineHeight:24,radius:8,shadow:"0 2px 8px rgba(10,37,64,.08)",spacing:[8,16]}))
]};
test("normalizes a stable palette and theme",()=>{ const d=normalize(base); assert.equal(d.id,"example-com"); assert.ok(d.tokens.colors.some(c=>c.role==="背景 bg")); assert.ok(d.theme["--tk-bg"]); assert.equal(d.tokens.space.unit,8); assert.ok(clusterColors(base).length>=3); });
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
  const raw:RawExtraction={...base,samples:[
    {...base.samples[0],colors:{backgroundColor:"rgb(255, 244, 221)",color:"rgb(0, 0, 0)"}},
    ...sample({backgroundColor:"rgb(255, 216, 77)"},3), ...sample({color:"rgb(0, 0, 0)"},10),
    ...sample({color:"rgb(38, 32, 26)"},6,{x:0,y:0,width:500,height:40}), ...sample({color:"rgb(255, 92, 43)"},5),
    ...sample({borderColor:"rgb(135, 123, 107)"},10)
  ]};
  const colors=Object.fromEntries(normalize(raw).tokens.colors.map((color)=>[color.role,color.hex]));
  assert.deepEqual(colors,{"背景 bg":"#fff4dd",surface:"#ffd84d",text:"#000000",muted:"#26201a",accent:"#ff5c2b",border:"#877b6b"});
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
test("chooses repeated or control-priority real shadows while retaining both site regressions", async()=>{
 const sample=(shadow:string, tag="div", width=40,height=20)=>({tag,text:false,media:false,rect:{x:0,y:0,width,height},colors:{},fontFamily:"Inter",fontSize:16,fontWeight:400,lineHeight:24,radius:0,shadow,spacing:[]});
 const raw:RawExtraction={...base,samples:[base.samples[0],sample("0 6px 20px rgba(0,0,0,.2)"),sample("3px 3px 0 rgb(38, 32, 26)","button",40,30),sample("3px 3px 0 rgb(38, 32, 26)","a",40,30)]};
 assert.equal(normalize(raw).tokens.shadow.md,"3px 3px 0 rgb(38, 32, 26)");
 const [yeguozi,codex]=await Promise.all(["yeguozi-com","codex-resets-com"].map(async id=>JSON.parse(await (await import("node:fs/promises")).readFile(path.join(process.cwd(),`.style-extractor/${id}/raw.json`),"utf8")) as RawExtraction));
 assert.equal(normalize(yeguozi).tokens.shadow.md,"none");
 assert.match(normalize(codex).tokens.shadow.md,/3px 3px 0px 0px/);
});
test("L3 and L4 colours cannot become anchors, themes, or guides",()=>{ const raw:RawExtraction={...base,samples:[...base.samples, {tag:"span",text:true,media:false,rect:{x:1,y:1,width:5,height:5},colors:{color:"rgb(255,0,0)",backgroundColor:"transparent",borderColor:"transparent"},fontFamily:"Inter",fontSize:13,fontWeight:400,lineHeight:18,radius:0,shadow:"none",spacing:[1]}, {tag:"img",text:false,media:true,rect:{x:1,y:1,width:5,height:5},colors:{color:"rgb(0,255,0)",backgroundColor:"transparent",borderColor:"transparent"},fontFamily:"Inter",fontSize:13,fontWeight:400,lineHeight:18,radius:0,shadow:"none",spacing:[1]}]}; const d=normalize(raw); const all=JSON.stringify({colors:d.tokens.colors,theme:d.theme}); assert.equal(all.includes("#ff0000"),false); assert.equal(all.includes("#00ff00"),false); assert.equal(guide({...d,style:{primary:"Minimalism",secondary:null,descriptors:["calm","clean","premium"],thesis:"保持清晰而克制的层级，并让核心信息优先出现。使用稳定的留白建立节奏，避免把页面塞满装饰。"},screenshot:"screenshot.png"}).includes("#ff0000"),false); });
test("guide accepts legacy role labels and keeps Neo-Brutalism shadows accurate",()=>{ const d=normalize(base); const styled={...d,style:{primary:"Neo-Brutalism" as const,secondary:null,descriptors:["direct","bold","tactile"],thesis:"以清晰的边界和直接的色彩建立视觉秩序。阴影与描边共同传达明确的触感。"},screenshot:"screenshot.png"}; styled.tokens.colors=[{role:"背景 bg",hex:"#fff4dd",stability:"L1",freq:.2},{role:"正文 text",hex:"#000000",stability:"L1",freq:.2},{role:"分隔面 surface",hex:"#ffd84d",stability:"L2",freq:.2},{role:"强调 accent",hex:"#ff5c2b",stability:"L1",freq:.2},{role:"边框 border",hex:"#877b6b",stability:"L1",freq:.2}]; styled.tokens.shadow={weight:"有",md:"rgb(38, 32, 26) 3px 3px 0px 0px"}; const output=guide(styled); assert.equal(output.split("\n",1)[0],"# STYLE-GUIDE"); assert.match(output,/## 风格方向\n/); assert.match(output,/## 语义色彩\n/); assert.match(output,/\| 表面 \| #ffd84d \|/); assert.match(output,/## CSS/); assert.match(output,/3px 3px 0px 0px/); for(const legacy of ["STYLE-GUIDE ·","用途：","迁移边界","## 使用边界","已采集间距","未采集到字阶","未采集的信息","原站布局"]){assert.equal(output.includes(legacy),false);} assert.equal(output.includes("避免重阴影"),false); assert.equal(output.includes("不要引入装饰字体"),false); assert.equal(output.includes("CTA"),false); });
test("saved index excludes the removed example record", async()=>{ const index=JSON.parse(await (await import("node:fs/promises")).readFile(path.join(process.cwd(),"sites/index.json"),"utf8")) as Array<{id:string}>; assert.equal(index.some((entry)=>entry.id==="example-com"),false); });
test("collect samples a local fixture without an incomplete warning", async()=>{ const root=await mkdtemp(path.join(tmpdir(),"vibe-vault-")); try { const fixture=pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)),"fixtures/collector.html")).href; const {raw}=await collect(fixture,root); assert.ok(raw.samples.length>0); assert.equal(raw.warnings.some(w=>w.includes("采集不完整")),false); } finally { await rm(root,{recursive:true,force:true}); } });
