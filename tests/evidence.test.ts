import test from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collect } from "../skill/scripts/collect.js";
import { normalize } from "../skill/scripts/normalize.js";
import { finalize } from "../skill/scripts/persist.js";
import { fidelity } from "../skill/scripts/verify.js";
import { PNG } from "pngjs";

const judgment = { primary: "Minimalism", secondary: null, descriptors: ["calm", "clean", "precise"], thesis: "保持清晰而克制的视觉层级，让内容和留白建立稳定节奏。避免用装饰取代信息优先级。" };
const fixture = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "media.html")).href;

test("collect clips viewport media, ignores invisible nodes, and keeps background text eligible", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-evidence-"));
  try {
    const { raw } = await collect(fixture, root);
    assert.equal(raw.samples.some(sample => sample.colors.color === "rgb(255, 0, 255)"), false);
    assert.equal(normalize(raw).tokens.colors.some(color => color.hex === "#ff00ff"), false);
    assert.ok(raw.mediaRects.some((rect) => rect.x === 0 && rect.y === 20 && rect.width === 60 && rect.height === 50));
    assert.ok(raw.samples.some((sample) => sample.tag === "p" && sample.text && sample.fontSize === 17));
    assert.ok(raw.samples.some((sample) => sample.tag === "iframe" && sample.media));
    assert.ok(raw.samples.some((sample) => sample.tag === "object" && sample.media));
    assert.ok(raw.samples.some((sample) => sample.tag === "embed" && sample.media));
    assert.ok(raw.samples.some((sample) => sample.tag === "section" && sample.text && !sample.media));
    assert.ok(raw.samples.some((sample) => sample.tag === "div" && sample.text && !sample.media));
    for (const tag of ["aside", "article", "nav", "footer"]) assert.equal(raw.samples.some((sample) => sample.tag === tag), false);
    assert.equal(raw.mediaRects.some((rect) => rect.width === 180 && rect.height === 50), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function collectedDraft(root: string) {
  const { raw, dir } = await collect(fixture, root);
  return { raw, dir, draft: normalize(raw) };
}

test("finalize publishes a promoted cover but measures the primary token frame", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-fidelity-"));
  try {
    const { raw, dir, draft } = await collectedDraft(root);
    const primary = path.join(dir, "evidence", "primary-top.png");
    const promoted = path.join(dir, "evidence", "scroll-0450.png");
    const cover = new PNG({ width: raw.viewport.width, height: raw.viewport.height });
    for (let i = 0; i < cover.data.length; i += 4) {
      cover.data[i] = 255;
      cover.data[i + 1] = 0;
      cover.data[i + 2] = 255;
      cover.data[i + 3] = 255;
    }
    await writeFile(promoted, PNG.sync.write(cover));
    await copyFile(promoted, path.join(dir, "screenshot.png"));
    const expected = await fidelity(primary, raw, draft.tokens);
    assert.notDeepEqual(await fidelity(promoted, raw, draft.tokens), expected);
    const record = await finalize(draft, judgment, root);
    assert.deepEqual(record.fidelity, expected);
    assert.deepEqual(await readFile(path.join(root, "sites", draft.id, "screenshot.png")), await readFile(promoted));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("invalid existing indexes leave all site files untouched", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-index-"));
  const valid = {id:"existing",name:"Existing",url:"https://existing.example",primaryStyle:"Minimalism",secondaryStyle:null,descriptors:["calm"],accent:"#333333",extractedAt:"2026-01-01",partial:false,validationFlags:[]};
  const missingFields = Object.keys(valid).map((key) => Object.fromEntries(Object.entries(valid).filter(([field]) => field !== key)));
  const invalidIndexes = [
    "{broken", "{}", "[null]",
    ...missingFields.map(entry => JSON.stringify([entry])),
    JSON.stringify([{...valid, primaryStyle:"unknown"}]),
    JSON.stringify([{...valid, secondaryStyle:"unknown"}]),
    JSON.stringify([{...valid, descriptors:[42]}]),
    JSON.stringify([{...valid, partial:"false"}]),
    JSON.stringify([{...valid, validationFlags:["unknown"]}]),
    JSON.stringify([valid, valid]),
  ];
  try {
    const { draft } = await collectedDraft(root);
    const target = path.join(root, "sites", draft.id);
    const indexFile = path.join(root, "sites", "index.json");
    await mkdir(target, { recursive: true });
    for (const file of ["site.json", "screenshot.png", "STYLE-GUIDE.md"]) await writeFile(path.join(target, file), "preserve\n");
    for (const invalid of invalidIndexes) {
      await writeFile(indexFile, invalid);
      await assert.rejects(finalize(draft, judgment, root), /sites\/index\.json/);
      assert.equal(await readFile(indexFile, "utf8"), invalid);
      for (const file of ["site.json", "screenshot.png", "STYLE-GUIDE.md"]) assert.equal(await readFile(path.join(target, file), "utf8"), "preserve\n");
    }
    await writeFile(indexFile, JSON.stringify([valid]));
    await finalize(draft, judgment, root);
    const entries = JSON.parse(await readFile(indexFile, "utf8"));
    assert.deepEqual(entries.find((entry: {id:string}) => entry.id === valid.id), valid);
    assert.equal(entries.filter((entry: {id:string}) => entry.id === draft.id).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
