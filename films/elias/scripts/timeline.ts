import { writeFileSync } from "node:fs";
import { PHASE, walkFactor, exAt } from "../src/scenes/mundo";
const steps: number[] = [];
let k = 1;
for (let f = 1; f < 1350; f++) {
  while (PHASE[f] >= k * Math.PI) { if (walkFactor(f) > 0.4) steps.push(f + 150); k++; }
}
// frame em que a moto passa em frente à câmera (x moto == x câmera aprox.)
const moto = (f: number) => exAt(580) + 0.3 * (f - 590);
let pass = 590;
for (let f = 520; f < 700; f++) if (moto(f) >= exAt(f) + 1.2) { pass = f; break; }
writeFileSync("out/timeline.json", JSON.stringify({ steps, pass: pass + 150, elias: { r150: exAt(150), r580: exAt(580), r1000: exAt(1000) } }));
console.log(steps.length, pass);
