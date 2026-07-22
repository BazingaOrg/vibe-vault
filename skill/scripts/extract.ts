#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collect, siteId } from "./collect.js";
import { normalize } from "./normalize.js";
import { finalize } from "./persist.js";
const [command,arg] = process.argv.slice(2);
async function main() {
  if(command==="collect" && arg) { const {raw,dir}=await collect(arg); const draft=normalize(raw); await writeFile(path.join(dir,"draft.json"),JSON.stringify(draft,null,2)+"\n"); console.log(`Collected ${raw.id}. Add ${path.join(dir,"judgment.json")} then run: npm run extract -- finalize ${raw.id}`); return; }
  if(command==="finalize" && arg) { const dir=path.join(process.cwd(),".style-extractor",arg); const [draft,judgment]=await Promise.all([readFile(path.join(dir,"draft.json"),"utf8"),readFile(path.join(dir,"judgment.json"),"utf8")]); const site=await finalize(JSON.parse(draft),JSON.parse(judgment)); console.log(`Finalized sites/${site.id}`); return; }
  console.error("Usage: npm run extract -- collect <url> | finalize <id>"); process.exitCode=1;
}
main().catch(error=>{ console.error(error instanceof Error?error.message:error); process.exitCode=1; });
export { siteId };
