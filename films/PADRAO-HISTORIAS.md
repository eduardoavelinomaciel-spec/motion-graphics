# Padrão de produção — Histórias que Aquecem (versão sem fala)

Este é o padrão extraído da produção de **03 · O Peixe que se Perdeu do Cardume** (`films/peixe-cardume/`).
Serve para as próximas histórias: o que perguntar, como montar o projeto, que peças reaproveitar,
como revisar e o que evitar. Os roteiros seguem o `00-guia-visual.md`; este documento diz **como** fazer.

---

## 1. Fluxo de trabalho (o que funcionou)

1. **Ler** o roteiro da história + `00-guia-visual.md` + README dos roteiros.
2. **Perguntar antes de produzir** (duas rodadas curtas, com opções e uma recomendada):
   - Rodada 1: versão (YouTube primeiro → TikTok depois) · ferramenta (Remotion + R3F) · origem do som
     (sintetizado em código) · forma de revisão (ficha de personagens → cena a cena).
   - Rodada 2: acabamento dos personagens (arredondado/macio) · cartão final (sim) · onde salvar
     (repo + branch, MP4 fora do git) · resolução das prévias (960×540; final 1080p).
3. **Ficha de personagens** (3 imagens): ficha com nomes/cores/gestos · folha de expressões ·
   teste de silhueta em preto. Enviar ao autor.
4. **Cena a cena**, sempre no mesmo ciclo:
   1. escrever a cena (linha do tempo em frames locais, câmeras por plano, efeitos 2D);
   2. **frames-chave** com `scripts/stills.mjs` → folha de contato (ffmpeg `tile`) → corrigir;
   3. **trilha** da cena (`scripts/score_cenaN.py`) → normalizar;
   4. **render da prévia** (`--scale=0.5`) em segundo plano;
   5. conferir uma tira de frames a cada 3 s + loudness → enviar ao autor;
   6. **commit + push** a cada etapa; registrar o mapa de planos em `PRODUCAO.md`.
5. Perguntar ao autor só quando a decisão é dele (ex.: conflito com a regra "sem fala").

Tempo de referência (servidor de 4 núcleos, GL por software): still ≈ 3 s; cena de 50 s em 960×540 ≈ 10–15 min.

---

## 2. Montagem do projeto

```bash
mkdir -p films && cd films
npx create-video@latest --yes --blank --no-tailwind <historia>
cd <historia> && npm i && npx remotion add @remotion/three && npm i three @types/three
npm i @fontsource/bangers @fontsource/nunito   # copiar os .woff2 para public/fonts/
pip install numpy scipy                          # trilha sintetizada
```

`remotion.config.ts` (além do padrão):
```ts
Config.setChromiumOpenGlRenderer("angle");
Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell");
```
Renderizar sempre com `--gl=swangle` (WebGL sem GPU). O download do navegador do Remotion é bloqueado na
nuvem; por isso o executável já instalado.

`.gitignore` do repo: `films/*/out/` e `films/*/node_modules/`.

### Estrutura de pastas (copiar para a nova história)

| Pasta | Conteúdo | Reaproveitável? |
|---|---|---|
| `src/lib/` | `glsl.ts` (shaders toon, contorno, olho, cáusticas), `materials.ts` (materiais, expressões), `geom.ts` (geometrias), `Toon.tsx`, `fonts.ts`, `surface.ts`, `palette.ts` | **Sim, inteiro** (trocar só `palette.ts`) |
| `src/fx/` | `Grade.tsx` (vinheta, grão, íris), `AnimeFx.tsx` (brilhos, estouro), `Hq.tsx` (quadros, retícula, onomatopeia, speed lines), `Balloon.tsx` (balão pictográfico), `PixelWorld.tsx` (mundo 2D/1-bit) | **Sim, inteiro** |
| `src/scenes/cam.tsx` | câmera dirigida por frame, `lerpCam`, `project()` | **Sim** |
| `src/scenes/common.tsx` | `Caption` (recordatório de HQ) | **Sim** |
| `src/world/` | céu, areia, raios, bolhas, recife, multidão instanciada, formações, pedra, corrente | Parcial (técnicas sim; cenários são da história) |
| `src/characters/` | personagens da história | Técnica sim (rig de peixe, tartaruga…) |
| `src/sheets/` | `Stage.tsx` + fichas | `Stage` sim; fichas adaptar |
| `src/scenes/` | `Titulo`, `CenaN`, `ParteN` (cena + áudio), `Filme` (encadeia as partes) | Padrão de organização sim |
| `scripts/` | `stills.mjs` (frames-chave), `synth.py` (vozes da trilha), `score_*.py` | `stills.mjs` e `synth.py` **inteiros** |

---

## 3. Sistema visual (os 4 modos do guia, como código)

### 3D — o mundo
- **Toon de 3 tons** (`makeToon`): sombra tingida de azul, meio-tom, luz; *rim light*; brilho especular
  recortado; névoa; padrões por shader (`shell` placas, `chroma` manchas animadas, `scales` escamas,
  `rays` raios de nadadeira); cor de ponta por eixo (`tip`, ex. ponta azul da nadadeira, barriga clara);
  cáusticas também sobre os personagens; modo `uSilhouette` para o teste de silhueta.
- **Contorno de tinta**: casca invertida (`BackSide`) com normais **suavizadas** (`smooth()` faz
  `mergeVertices` + `computeVertexNormals`), senão o contorno racha.
- **Geometria**: `sweepX` (corpos de peixe por perfil), `sweepCurve` (tubos com perfil de raio: tentáculos,
  pescoço, cavalo-marinho), `fin` (forma 2D extrudada com bisel), `ellipsoid`, `bump` (perfil normalizado).
- **Ondulação de nado** no vertex shader (`applyWave`), aplicada igual no corpo e no contorno.
- **Cenário**: `Sky` (cúpula com degradê por direção), `Sand` (ondulações + cáusticas), `GodRays`
  (planos aditivos que se viram para a câmera), `BubbleColumns`/`Bubble` (borda com fresnel e contorno
  azul para ler em água clara; modo iridescente), `FarReef` (silhuetas que a névoa azula),
  `CurrentField` (partículas aditivas correndo numa direção).
- **Multidões**: `InstancedMesh` com shader próprio (olho pintado, brilho por instância). Em vez de
  simulação passo a passo, **formações analíticas com semente fixa** (espiral; fileira com curva em onda
  que se propaga). Cada frame é independente e idêntico a cada render.

### ANIME — os picos de emoção
- **Olho por shader** sobre elipsoide achatado: íris em degradê, pupila, 2 brilhos, pálpebras curvas,
  inclinação triste, cílios, rugas, modo estrela e modo `^ ^`. Expressões prontas em `EXPR`:
  `neutro, curioso, triste, choro, alegria, susto, ternura, estrela, calma, sonolento, fechado`,
  com `mixExpr` para transições e piscadas.
- **Boca**: linha de tinta sobre a superfície (lê em 3/4) e boca **aberta** com interior rosa.
- **Efeitos**: `Sparkle` (brilho de 4 pontas), `SpeedLines` radiais (12 fps), **impact frame** (CSS
  `grayscale(1) contrast(9) invert(1)` alternando por 3 frames), **íris** (`Iris`), lágrimas que viram
  bolhas, `Pop` (estouro de bolha).
- **Overlays 2D presos ao 3D**: `project(pontoNoMundo, cam, W, H)` dá a posição na tela.

### PIXEL — o mundo interior
- Fundo simples (água aberta) desenhado em **canvas 2D** (`OpenBlue`): degradê por direção da câmera +
  partículas projetadas em perspectiva. Permite resolução arbitrária.
- **Pixel-dissolve**: o canvas cai em degraus 1920→960→480→320 em 12 frames, mostrado com
  `image-rendering: pixelated`.
- **1-bit**: luminância → pontilhado **Bayer 4×4** em duas cores (marinho/preto). Elementos em pixel
  (cristais de gelo) desenhados no mesmo grid, animados a **12 fps** (`Math.floor(frame / 2.5)`).
- **Personagem fora do efeito**: uma segunda `ThreeCanvas` transparente só com ele, por cima.
- **Pixel-bloom** (volta ao 3D): a `ThreeCanvas` da cena nova renderiza em `W/div` com `scale(div)`
  pixelado, 320→480→960→1920, com flash suave na cor-chave.

### HQ — ritmo
- `Panel` (contorno de tinta), `Halftone` (retícula CSS), `Onoma` (onomatopeia com traço e sombra),
  página de quadros que entram deslizando e se fecham numa tela só; "quebra de quadro" = congelar +
  retícula + borda e dividir.
- **Balão pictográfico** (`Balloon`): elipse + rabicho, só desenhos/símbolos (`FishGlyph`, `?`).
  Pop elástico 0→1,1→1 em 8 frames; "plic" ao abrir, "plop" ao fechar.
- **Recordatório** (`Caption`, para texto permitido): caixa amarela torta, borda de tinta, retícula,
  palavras entrando uma a uma, "plic".
- **Whip-pan**: alvo da câmera gira rápido + filtro SVG `feGaussianBlur stdDeviation="X 0"`.

### Camada final (GRADE)
Vinheta + grão de 2–5 % com semente = frame (`feTurbulence seed={frame}`).

---

## 4. Tempo, câmera e composições

- Cada cena é uma composição com **frames locais** (0 = início da cena) e um objeto `T` com os momentos
  (`T.turn`, `T.impact`…). Todas as animações vêm de `interpolate`/`Easing` sobre o frame.
- Coreografia em funções puras `personagemState(f)` → posição, rotação, expressão, boca. Podem ser
  chamadas para **outros frames** (ex.: de onde a lágrima nasceu, o caminho já desenhado).
- **Câmera**: `camFor(f, …)` devolve `{pos, target, fov}` por plano; `CameraRig` aplica no render
  (nunca `useFrame`). Cortes = trocar de ramo no `if`; movimentos = `lerpCam`.
- **Contato físico exato** (pontas que se tocam, nadadeira que desenha): funções que repetem a cadeia de
  transformações do personagem e dão a posição no mundo (`finTipWorld`, `marisaRightTip`).
- Composições: `CenaN` (só imagem) → `ParteN` (cena + `<Audio>` da cena) → `Filme` (encadeia as partes
  com `<Sequence>`). Registrar em `Root.tsx` com pastas.
- `ThreeCanvas` exige **largura/altura inteiras** (arredondar quando animadas).
- Nada de `Math.random()`/`Date.now()`: usar `random("semente")` do Remotion.

---

## 5. Som (o que substitui a voz)

- `scripts/synth.py`: `celesta`, `pizz` (Karplus-Strong), `strings` (cordas/violoncelo), `blup` (bolha),
  `whoosh`, `bip` 8-bit filtrado, `drone`, `echo`, `noise_burst`, e `Mix.place(som, tempo, ganho, pan)`.
- Um script por cena (`score_cenaN.py`) com os eventos em **frames da cena** (`F(frame)`), sincronizados
  com o mapa de planos.
- **Leitmotivs** (bíblia): um por personagem, num instrumento fixo; voltam transformados
  (oitava abaixo para a mãe, nota menor na solidão, maior na esperança).
- **Silêncio é recurso**: deixar o trecho realmente baixo (~-37 dB contra ~-20 dB).
- **Normalização**: medir com `ebur128` e aplicar **ganho estático** + `alimiter` (alvo -18/-19 LUFS).
  Não usar `loudnorm` de uma passada: ele levanta o silêncio.
- "Plic" de balão em `public/audio/plic.wav`, nunca voz.

---

## 6. Revisão (antes de mandar ao autor)

```bash
node scripts/stills.mjs CenaN 0.5 0,150,300,... k        # frames-chave
cd out && ffmpeg -pattern_type glob -i 'k-*.png' -vf "scale=640:360,tile=3x4:padding=4" -frames:v 1 contact.png
npx remotion render ParteN out/parteN_preview.mp4 --scale=0.5 --gl=swangle --concurrency=4 --crf=20
ffmpeg -i out/parteN_preview.mp4 -vf "fps=1/3,scale=320:180,tile=6x3" -frames:v 1 strip.png
ffmpeg -i out/parteN_preview.mp4 -af ebur128 -f null -              # loudness
```
Checklist por cena: cada batida do roteiro aparece no tempo certo · personagem legível (3/4, não de frente)
· nada importante cortado · overlays 2D no lugar · texto só onde o guia permite · trilha com os eventos
certos · silêncio onde o roteiro pede.

---

## 7. Armadilhas já encontradas (e a solução)

| Problema | Causa | Solução |
|---|---|---|
| Render não abre o navegador | download bloqueado na nuvem | `setBrowserExecutable` + `--gl=swangle` |
| Pupila gigante / olho errado | coordenadas do olho na escala do objeto | geometria do olho unitária, escala no mesh |
| Tubos pretos | ordem dos vértices invertida em `sweepCurve` | inverter o *winding* |
| Contorno rachado | normais duplicadas nas emendas | `smooth()` (merge + normais) |
| Personagem feio de frente ("ovo") | olhos laterais | enquadrar em **3/4** |
| Sorriso parece piscadela | linha curva perto do olho | boca **aberta** como padrão do Ciro |
| Fundo 2D quase preto | `THREE.Color` devolve cor **linear** | ler o hex direto em sRGB |
| 1-bit parece papel quadriculado | luminância quase constante | densidade por degradê da direção |
| Partículas somem na prévia | tamanho em pixels pequeno com `--scale=0.5` | pontos maiores + núcleo brilhante |
| Fonte errada | fonte não carregada | `ensureFonts()` em toda cena com texto |
| Bolha invisível em água clara | borda branca sobre claro | contorno azul-tinta na borda |
| Cáusticas viram "azulejo" | rede grande vista de cima | rede mais fina e menos intensa |
| Linha desenhada vira rabisco | ponta vai e volta | curva analítica presa ao deslize |
| Desenho escondido | membro do lado oposto à câmera | posicionar o personagem a favor da câmera |
| Silêncio "levantado" | `loudnorm` dinâmico | ganho estático |
| Render quebra no fechamento de quadros | largura fracionária na `ThreeCanvas` | `Math.round` |
| Push recusado | outra sessão na mesma branch | `fetch` + `merge`, nunca forçar; avisar o autor |

---

## 8. Regras do guia que mais pesam na prática

- **Sem fala.** Texto só: título, onomatopeias, interface sem palavras, avisos, cartão final — e,
  por decisão do autor nesta história, as frases da abertura em **letreiro de HQ** (recordatório).
- Densidade: ~60 % 3D+ANIME, 20 % HQ, 20 % PIXEL; no máximo dois modos dominantes por plano.
- **Momento assinatura** (os 4 modos juntos) só uma vez, no clímax.
- Cada protagonista: uma cor-assinatura, um gesto-chave, um leitmotiv.

---

## 9. Checklist para começar a próxima história

1. Ler roteiro + guia; fazer as duas rodadas de perguntas.
2. Criar `films/<historia>/` e copiar `src/lib`, `src/fx`, `src/scenes/cam.tsx`, `src/scenes/common.tsx`,
   `src/sheets/Stage.tsx`, `scripts/stills.mjs`, `scripts/synth.py`, `remotion.config.ts`, `public/fonts`.
3. Trocar `palette.ts` pela bíblia da história; criar os personagens (`src/characters/`).
4. Ficha + expressões + silhueta → enviar.
5. Para cada cena: `CenaN.tsx` → frames-chave → `score_cenaN.py` → `ParteN.tsx` → render → enviar →
   commit; atualizar `PRODUCAO.md` com o mapa de planos.
6. No fim: render 1080p do `Filme`, cartão final, descrição e comentário fixado com a pergunta final;
   depois a versão TikTok (9:16, 60 s) reaproveitando os assets.
