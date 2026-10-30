import test from "node:test";
import assert from "node:assert/strict";
import { copyFile, cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collect } from "../skill/scripts/collect.js";
import { normalize } from "../skill/scripts/normalize.js";
import { finalize, guide, indexEntry } from "../skill/scripts/persist.js";
import { fidelity } from "../skill/scripts/verify.js";
import type { Draft } from "../skill/scripts/schema.js";
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

test("collection reuse survives error log write failures without touching prior artifacts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-reuse-"));
  try {
    const url = "http://127.0.0.1:1/";
    const dir = path.join(root, ".style-extractor", "127-0-0-1");
    await mkdir(path.join(dir, "evidence"), { recursive: true });
    const previous = { url, id: "127-0-0-1", collectedAt: "2026-01-01T00:00:00.000Z", viewport: { width: 1440, height: 900 }, samples: [], rootVariables: {}, mediaRects: [], warnings: [], evidenceNotes: [] };
    const artifacts = { "raw.json": JSON.stringify(previous, null, 2), "draft.json": "prior draft\n", "screenshot.png": "prior screenshot\n", "evidence/primary-top.png": "prior evidence\n" };
    for (const [name, content] of Object.entries(artifacts)) await writeFile(path.join(dir, name), content);
    await mkdir(path.join(dir, "last-collect-error.json"));
    const result = await collect(url, root);
    assert.equal(result.status, "reused");
    assert.deepEqual(result.raw, previous);
    for (const [name, content] of Object.entries(artifacts)) assert.equal(await readFile(path.join(dir, name), "utf8"), content);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("successful recollection publishes one raw/draft generation and archives judgment", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-generation-"));
  try {
    const first = await collect(fixture, root);
    await writeFile(path.join(first.dir, "draft.json"), "stale draft\n");
    await writeFile(path.join(first.dir, "judgment.json"), "prior judgment\n");
    const second = await collect(fixture, root);
    const raw = JSON.parse(await readFile(path.join(second.dir, "raw.json"), "utf8"));
    const draft = JSON.parse(await readFile(path.join(second.dir, "draft.json"), "utf8"));
    assert.deepEqual(raw, second.raw);
    assert.deepEqual(draft, normalize(raw));
    assert.equal(await readFile(path.join(second.dir, "judgment.previous.json"), "utf8"), "prior judgment\n");
    await assert.rejects(readFile(path.join(second.dir, "judgment.json"), "utf8"), /ENOENT/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function collectedDraft(root: string) {
  const { raw, dir } = await collect(fixture, root);
  const draft = JSON.parse(await readFile(path.join(dir, "draft.json"), "utf8")) as Draft;
  return { raw, dir, draft };
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

test("finalize preflight and publication failures preserve every published file", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-finalize-rollback-"));
  try {
    const { dir, draft } = await collectedDraft(root);
    const target = path.join(root, "sites", draft.id), indexFile = path.join(root, "sites", "index.json");
    await mkdir(target, { recursive: true });
    const artifacts = {
      [path.join(target, "site.json")]: "prior site\n",
      [path.join(target, "screenshot.png")]: "prior screenshot\n",
      [path.join(target, "STYLE-GUIDE.md")]: "prior guide\n",
      [indexFile]: "[]\n",
    };
    for (const [file, content] of Object.entries(artifacts)) await writeFile(file, content);
    const assertUnchanged = async () => {
      for (const [file, content] of Object.entries(artifacts)) assert.equal(await readFile(file, "utf8"), content);
    };

    await assert.rejects(finalize({ ...draft, schemaVersion: 1 }, judgment, root), /schemaVersion.*2/);
    await assertUnchanged();
    await assert.rejects(finalize({ ...draft, visualGrammar: undefined }, judgment, root));
    await assertUnchanged();

    const screenshot = path.join(dir, "screenshot.png");
    await rm(screenshot);
    await mkdir(screenshot);
    await assert.rejects(finalize(draft, judgment, root));
    await assertUnchanged();
    assert.deepEqual((await readdir(path.join(root, "sites"))).sort(), [draft.id, "index.json"].sort());
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("concurrent finalizes serialize within one work directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibe-vault-finalize-queue-"));
  try {
    const { raw, dir, draft } = await collectedDraft(root);
    const drafts: Draft[] = [
      { ...draft, id: "concurrent-a", name: "Concurrent A" },
      { ...draft, id: "concurrent-b", name: "Concurrent B" },
    ];
    for (const next of drafts) {
      const staging = path.join(root, ".style-extractor", next.id);
      await cp(dir, staging, { recursive: true });
      await writeFile(path.join(staging, "raw.json"), JSON.stringify({ ...raw, id: next.id }, null, 2));
    }

    const records = await Promise.all(drafts.map((next) => finalize(next, judgment, root)));
    for (const record of records) {
      const target = path.join(root, "sites", record.id);
      assert.deepEqual(JSON.parse(await readFile(path.join(target, "site.json"), "utf8")), record);
      assert.deepEqual(await readFile(path.join(target, "screenshot.png")), await readFile(path.join(root, ".style-extractor", record.id, "screenshot.png")));
      assert.equal(await readFile(path.join(target, "STYLE-GUIDE.md"), "utf8"), guide(record));
    }
    const entries = JSON.parse(await readFile(path.join(root, "sites", "index.json"), "utf8"));
    assert.equal(entries.length, 2);
    for (const record of records) assert.deepEqual(entries.find((entry: { id: string }) => entry.id === record.id), indexEntry(record));
    assert.deepEqual((await readdir(path.join(root, "sites"))).sort(), ["concurrent-a", "concurrent-b", "index.json"]);
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
