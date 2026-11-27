// Usage: node scripts/stills.mjs <compId> <scale> <frame,frame,...> [outPrefix]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [id, scale = "0.5", frames = "0", prefix = id] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl: "swangle" };
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
for (const f of frames.split(",").map(Number)) {
  const output = `out/${prefix}-${String(f).padStart(4, "0")}.png`;
  await renderStill({ composition, serveUrl, output, frame: f, scale: Number(scale), browserExecutable, chromiumOptions, overwrite: true });
  console.log(output);
}
