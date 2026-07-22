import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import type { RawExtraction } from "./schema.js";
export function siteId(url: string): string { const h = new URL(url).hostname.replace(/^www\./, ""); return h.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase(); }
export async function collect(url: string, root = process.cwd()): Promise<{ raw: RawExtraction; dir: string }> {
  const id = siteId(url), dir = path.join(root, ".style-extractor", id); await mkdir(dir, { recursive:true });
  const browser = await chromium.launch({ headless:true }); const page = await browser.newPage({ viewport:{width:1440,height:900}, deviceScaleFactor:1 }); const warnings:string[]=[];
  try { await page.goto(url, { waitUntil:"domcontentloaded", timeout:30000 }); await page.waitForTimeout(1200); for (const y of [0,450,1200]) { await page.evaluate(`window.scrollTo(0, ${y})`); await page.waitForTimeout(350); } await page.evaluate("window.scrollTo(0, 0)"); await page.screenshot({path:path.join(dir,"screenshot.png"),fullPage:false});
    // A string is intentionally used here: tsx/esbuild may inject helpers into a
    // serialized TypeScript callback, but the browser context cannot resolve them.
    const payload = await page.evaluate(`(() => {
      const rect = (r) => ({ x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height });
      const nodes = [document.documentElement, document.body, ...document.querySelectorAll("body *")];
      const samples = nodes.map((el) => {
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        const media = ["IMG", "VIDEO", "CANVAS", "SVG", "PICTURE"].includes(el.tagName);
        return { tag: el.tagName.toLowerCase(), root: el === document.documentElement || el === document.body, text: !!el.textContent?.trim() && el.children.length === 0, media, rect: rect(r), colors: { color: cs.color, backgroundColor: cs.backgroundColor, borderColor: cs.borderColor }, fontFamily: cs.fontFamily, fontSize: parseFloat(cs.fontSize), fontWeight: parseFloat(cs.fontWeight) || 400, lineHeight: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4, radius: parseFloat(cs.borderRadius) || 0, shadow: cs.boxShadow, spacing: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft, cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat) };
      }).filter((x) => x.rect.width > 1 && x.rect.height > 1 && x.rect.y < innerHeight && x.rect.y + x.rect.height > 0).slice(0, 2500);
      const root = getComputedStyle(document.documentElement);
      const rootVariables = Object.fromEntries([...root].filter((x) => x.startsWith("--")).map((x) => [x, root.getPropertyValue(x).trim()]));
      return { samples, rootVariables, mediaRects: samples.filter((x) => x.media).map((x) => x.rect) };
    })()`) as Pick<RawExtraction, "samples" | "rootVariables" | "mediaRects">;
    const raw: RawExtraction={url,id,collectedAt:new Date().toISOString(),viewport:{width:1440,height:900},...payload,warnings}; await writeFile(path.join(dir,"raw.json"),JSON.stringify(raw,null,2)); return {raw,dir};
  } catch(error) { warnings.push(`采集不完整：${error instanceof Error ? error.message : String(error)}`); const raw:RawExtraction={url,id,collectedAt:new Date().toISOString(),viewport:{width:1440,height:900},samples:[],rootVariables:{},mediaRects:[],warnings}; await writeFile(path.join(dir,"raw.json"),JSON.stringify(raw,null,2)); return {raw,dir}; } finally { await browser.close(); }
}
