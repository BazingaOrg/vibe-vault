import test from "node:test";
import assert from "node:assert/strict";
import { clusterColors, colorToOklch, distance, normalize } from "../skill/scripts/normalize.js";
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
test("domain ids and strict judgments",()=>{ assert.equal(siteId("https://www.Stripe.com/pay"),"stripe-com"); assert.throws(()=>validateJudgment({primary:"Invented",secondary:null,descriptors:[],thesis:"x"})); assert.equal(validateJudgment({primary:"Minimalism",secondary:null,descriptors:["calm","clean","premium"],thesis:"保持清晰而克制的层级，并让核心信息优先出现。使用稳定的留白建立节奏，避免把页面塞满装饰。"}).primary,"Minimalism"); });
test("colour distance is finite for neutral screenshot pixels",()=>{ const white=colorToOklch("rgb(255,255,255)"); const black=colorToOklch("rgb(0,0,0)"); assert.ok(white&&black); assert.ok(Number.isFinite(distance(white!,black!))); });
test("L3 and L4 colours cannot become anchors, themes, or guides",()=>{ const raw:RawExtraction={...base,samples:[...base.samples, {tag:"span",text:true,media:false,rect:{x:1,y:1,width:5,height:5},colors:{color:"rgb(255,0,0)",backgroundColor:"transparent",borderColor:"transparent"},fontFamily:"Inter",fontSize:13,fontWeight:400,lineHeight:18,radius:0,shadow:"none",spacing:[1]}, {tag:"img",text:false,media:true,rect:{x:1,y:1,width:5,height:5},colors:{color:"rgb(0,255,0)",backgroundColor:"transparent",borderColor:"transparent"},fontFamily:"Inter",fontSize:13,fontWeight:400,lineHeight:18,radius:0,shadow:"none",spacing:[1]}]}; const d=normalize(raw); const all=JSON.stringify({colors:d.tokens.colors,theme:d.theme}); assert.equal(all.includes("#ff0000"),false); assert.equal(all.includes("#00ff00"),false); assert.equal(guide({...d,style:{primary:"Minimalism",secondary:null,descriptors:["calm","clean","premium"],thesis:"保持清晰而克制的层级，并让核心信息优先出现。使用稳定的留白建立节奏，避免把页面塞满装饰。"},screenshot:"screenshot.png"}).includes("#ff0000"),false); });
test("collect samples a local fixture without an incomplete warning", async()=>{ const root=await mkdtemp(path.join(tmpdir(),"vibe-vault-")); try { const fixture=pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)),"fixtures/collector.html")).href; const {raw}=await collect(fixture,root); assert.ok(raw.samples.length>0); assert.equal(raw.warnings.some(w=>w.includes("采集不完整")),false); } finally { await rm(root,{recursive:true,force:true}); } });
