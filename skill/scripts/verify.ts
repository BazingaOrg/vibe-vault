import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";
import { colorToOklch, distance } from "./normalize.js";
import type { RawExtraction, Tokens } from "./schema.js";

export async function fidelity(screenshot: string, raw: RawExtraction, tokens: Tokens) {
  const png = PNG.sync.read(await readFile(screenshot)); const palette=tokens.colors.map(c=>colorToOklch(c.hex)).filter(Boolean); const d:number[]=[]; let eligible=0,total=0;
  const isMedia=(x:number,y:number)=>raw.mediaRects.some(r=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height);
  for(let y=0;y<png.height;y+=4) for(let x=0;x<png.width;x+=4) { total++; if(isMedia(x,y)) continue; eligible++; const i=(y*png.width+x)*4, a=png.data[i+3]/255; const c=colorToOklch(`rgb(${Math.round(png.data[i]*a+255*(1-a))}, ${Math.round(png.data[i+1]*a+255*(1-a))}, ${Math.round(png.data[i+2]*a+255*(1-a))})`); if(c&&palette.length) d.push(Math.min(...palette.map(p=>distance(c,p!)))); }
  d.sort((a,b)=>a-b); const coverage=d.length ? d.filter(x=>x<=.06).length/d.length : 0; return { coverage:Number(coverage.toFixed(3)), eligibleRatio:Number((eligible/Math.max(1,total)).toFixed(3)), mean:Number((d.reduce((a,b)=>a+b,0)/Math.max(1,d.length)).toFixed(3)), p95:Number((d[Math.floor(d.length*.95)]??0).toFixed(3)), samples:d.length };
}
