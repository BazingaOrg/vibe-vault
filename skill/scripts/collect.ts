import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import type { RawExtraction } from "./schema.js";

export function siteId(url: string): string {
  const h = new URL(url).hostname.replace(/^www\./, "");
  return h.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

const VIEWPORT = { width: 1440, height: 900 } as const;
const SCROLL_OFFSETS = [0, 450, 1200] as const;

/** Browser-side sampling payload (stringified so tsx helpers never leak into the page). */
const SAMPLE_SCRIPT = `(() => {
  const rect = (r) => ({ x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height });
  const mediaTag = new Set(["IMG", "VIDEO", "CANVAS", "SVG", "PICTURE", "PATH", "POLYLINE", "POLYGON", "LINE", "CIRCLE", "ELLIPSE", "RECT", "USE", "TEXT", "TSPAN", "G"]);
  const isMedia = (el) => {
    if (mediaTag.has(el.tagName)) return true;
    if (el.closest && (el.closest("svg") || el.closest("canvas") || el.closest("picture") || el.closest("video"))) return true;
    return false;
  };
  const nodes = [document.documentElement, document.body, ...document.querySelectorAll("body *")];
  const samples = nodes.map((el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const media = isMedia(el);
    return {
      tag: el.tagName.toLowerCase(),
      root: el === document.documentElement || el === document.body,
      text: !!el.textContent?.trim() && el.children.length === 0,
      media,
      rect: rect(r),
      colors: { color: cs.color, backgroundColor: cs.backgroundColor, borderColor: cs.borderColor },
      fontFamily: cs.fontFamily,
      fontSize: parseFloat(cs.fontSize),
      fontWeight: parseFloat(cs.fontWeight) || 400,
      lineHeight: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4,
      letterSpacing: parseFloat(cs.letterSpacing) || 0,
      fontStyle: cs.fontStyle || "normal",
      textTransform: cs.textTransform || "none",
      borderWidth: Math.max(parseFloat(cs.borderTopWidth) || 0, parseFloat(cs.borderRightWidth) || 0, parseFloat(cs.borderBottomWidth) || 0, parseFloat(cs.borderLeftWidth) || 0),
      borderStyle: [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle].find((value) => value && value !== "none") || "none",
      opacity: parseFloat(cs.opacity) || 0,
      radius: parseFloat(cs.borderRadius) || 0,
      shadow: cs.boxShadow,
      spacing: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft, cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat)
    };
  }).filter((x) => x.rect.width > 1 && x.rect.height > 1 && x.rect.y < innerHeight && x.rect.y + x.rect.height > 0).slice(0, 2500);
  const root = getComputedStyle(document.documentElement);
  const rootVariables = Object.fromEntries([...root].filter((x) => x.startsWith("--")).map((x) => [x, root.getPropertyValue(x).trim()]));
  return { samples, rootVariables, mediaRects: samples.filter((x) => x.media).map((x) => x.rect) };
})()`;

async function captureEvidence(page: Page, evidenceDir: string, name: string, note: string, url: string) {
  const file = path.join(evidenceDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return { name, note, url, file: path.basename(file) };
}

async function settle(page: Page) {
  await page.waitForTimeout(350);
}

function generatedEvidence(name: string): boolean {
  return name === "manifest.json" || name === "primary-top.png" || /^scroll-\d+\.png$/.test(name) || /^secondary-\d+\.png$/.test(name);
}

function missingPath(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
}

async function publishCollection(stagingDir: string, targetDir: string) {
  const stagingEvidence = path.join(stagingDir, "evidence");
  const extractorRoot = path.dirname(targetDir);
  const nextDir = await mkdtemp(path.join(extractorRoot, `.${path.basename(targetDir)}-publish-`));
  const nextEvidence = path.join(nextDir, "evidence");

  // Build a complete next snapshot, retaining judgments/drafts and manual evidence.
  try {
    try { await cp(targetDir, nextDir, { recursive: true, force: true }); } catch (error) { if (!missingPath(error)) throw error; }
    await mkdir(nextEvidence, { recursive: true });
    for (const entry of await readdir(nextEvidence, { withFileTypes: true })) {
      if (entry.isFile() && generatedEvidence(entry.name)) await rm(path.join(nextEvidence, entry.name), { force: true });
    }
    for (const entry of await readdir(stagingEvidence, { withFileTypes: true })) {
      if (entry.isFile()) await copyFile(path.join(stagingEvidence, entry.name), path.join(nextEvidence, entry.name));
    }
    await copyFile(path.join(stagingDir, "screenshot.png"), path.join(nextDir, "screenshot.png"));
    await copyFile(path.join(stagingDir, "raw.json"), path.join(nextDir, "raw.json"));

    const backupDir = `${targetDir}.${process.pid}.old`;
    let hadTarget = false;
    try { await rename(targetDir, backupDir); hadTarget = true; } catch (error) { if (!missingPath(error)) throw error; }
    try {
      await rename(nextDir, targetDir);
    } catch (error) {
      if (hadTarget) await rename(backupDir, targetDir);
      throw error;
    }
    if (hadTarget) {
      try { await rm(backupDir, { recursive: true, force: true }); } catch { /* committed; cleanup is best-effort */ }
    }
  } finally {
    await rm(nextDir, { recursive: true, force: true });
  }
}

export async function collect(url: string, root = process.cwd()): Promise<{ raw: RawExtraction; dir: string }> {
  const id = siteId(url);
  const extractorRoot = path.join(root, ".style-extractor");
  const dir = path.join(extractorRoot, id);
  await mkdir(extractorRoot, { recursive: true });
  const stagingDir = await mkdtemp(path.join(extractorRoot, `.${id}-collect-`));
  const evidenceDir = path.join(stagingDir, "evidence");
  await mkdir(evidenceDir, { recursive: true });
  let browser: Browser | undefined;
  const warnings: string[] = [];
  const evidence: Array<{ name: string; note: string; url: string; file: string }> = [];

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);

    // Scroll primary offsets to warm lazy content, capture multi-view evidence along the way.
    for (const y of SCROLL_OFFSETS) {
      await page.evaluate((offset) => window.scrollTo(0, offset), y);
      await settle(page);
      evidence.push(await captureEvidence(page, evidenceDir, `scroll-${String(y).padStart(4, "0")}`, `Primary page scrollY=${y}`, page.url()));
    }

    // Primary token screenshot and DOM sample stay on the first-screen frame.
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await page.screenshot({ path: path.join(stagingDir, "screenshot.png"), fullPage: false });
    evidence.push(await captureEvidence(page, evidenceDir, "primary-top", "Primary page top (token sample frame)", page.url()));

    // A string is intentionally used here: tsx/esbuild may inject helpers into a
    // serialized TypeScript callback, but the browser context cannot resolve them.
    const payload = await page.evaluate(SAMPLE_SCRIPT) as Pick<RawExtraction, "samples" | "rootVariables" | "mediaRects">;
    const primaryOrigin = new URL(page.url()).origin;

    // Optional same-host secondary pages: visual evidence only (not merged into tokens).
    // Skip non-http(s) primaries (e.g. file:// fixtures) — origin is unusable there.
    let secondaryHrefs: string[] = [];
    try {
      const primary = new URL(url);
      if (primary.protocol === "http:" || primary.protocol === "https:") {
        secondaryHrefs = await page.evaluate((pageUrl: string) => {
          const base = new URL(pageUrl);
          const seen = new Set<string>();
          const out: string[] = [];
          for (const a of document.querySelectorAll("a[href]")) {
            try {
              const href = new URL((a as HTMLAnchorElement).href, base).href;
              const u = new URL(href);
              if (u.protocol !== "http:" && u.protocol !== "https:") continue;
              if (u.origin !== base.origin) continue;
              if (u.pathname === base.pathname && u.search === base.search) continue;
              if (u.hash && u.pathname === base.pathname) continue;
              const key = u.origin + u.pathname + u.search;
              if (seen.has(key)) continue;
              seen.add(key);
              out.push(u.href);
              if (out.length >= 2) break;
            } catch { /* ignore bad hrefs */ }
          }
          return out;
        }, page.url());
      }
    } catch (error) {
      warnings.push(`次页发现失败：${error instanceof Error ? error.message : String(error)}`);
    }

    let idx = 1;
    for (const href of secondaryHrefs) {
      try {
        await page.goto(href, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (new URL(page.url()).origin !== primaryOrigin) continue;
        await page.waitForTimeout(900);
        await page.evaluate(() => window.scrollTo(0, 0));
        await settle(page);
        const name = `secondary-${String(idx).padStart(2, "0")}`;
        evidence.push(await captureEvidence(page, evidenceDir, name, `Secondary same-host page for judgment only`, page.url()));
        idx++;
      } catch (error) {
        warnings.push(`次页证据未完成：${href} · ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    await writeFile(path.join(evidenceDir, "manifest.json"), JSON.stringify(evidence, null, 2) + "\n");

    const raw: RawExtraction = {
      url,
      id,
      collectedAt: new Date().toISOString(),
      viewport: { ...VIEWPORT },
      ...payload,
      warnings,
    };
    await writeFile(path.join(stagingDir, "raw.json"), JSON.stringify(raw, null, 2));
    await publishCollection(stagingDir, dir);
    return { raw, dir };
  } catch (error) {
    warnings.push(`采集不完整：${error instanceof Error ? error.message : String(error)}`);
    const raw: RawExtraction = {
      url,
      id,
      collectedAt: new Date().toISOString(),
      viewport: { ...VIEWPORT },
      samples: [],
      rootVariables: {},
      mediaRects: [],
      warnings,
    };
    try {
      const previous = JSON.parse(await readFile(path.join(dir, "raw.json"), "utf8")) as RawExtraction;
      const preserved = { ...previous, warnings: [...previous.warnings, ...warnings.map((warning) => `重采集失败，保留上次成功证据。${warning}`)] };
      await writeFile(path.join(dir, "raw.json"), JSON.stringify(preserved, null, 2));
      return { raw: preserved, dir };
    } catch {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "raw.json"), JSON.stringify(raw, null, 2));
      return { raw, dir };
    }
  } finally {
    await browser?.close();
    await rm(stagingDir, { recursive: true, force: true });
  }
}
