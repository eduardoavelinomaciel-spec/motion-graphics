import { continueRender, delayRender, staticFile } from "remotion";

// Local fonts (no render-time network). HQ lettering = Bangers.
export const HQ = "Bangers";
export const UI = "Nunito";

let loaded = false;
export const ensureFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("fonts");
  const faces = [
    new FontFace(HQ, `url(${staticFile("fonts/bangers-latin-400-normal.woff2")})`, { weight: "400" }),
    new FontFace(UI, `url(${staticFile("fonts/nunito-latin-400-normal.woff2")})`, { weight: "400" }),
    new FontFace(UI, `url(${staticFile("fonts/nunito-latin-800-normal.woff2")})`, { weight: "800" }),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => {
      fs.forEach((f) => document.fonts.add(f));
      continueRender(h);
    })
    .catch(() => continueRender(h));
};
