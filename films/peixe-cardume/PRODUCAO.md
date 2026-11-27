# O Peixe que se Perdeu do Cardume — produção

Fonte: `03-peixe-cardume.md` + `00-guia-visual.md` (Histórias que Aquecem, versão sem fala).

## Decisões (com o autor)
- YouTube primeiro (5:40 · 1920×1080 · 30 fps); TikTok depois, reaproveitando assets.
- Remotion + React Three Fiber (`@remotion/three`).
- Som sintetizado em código (`scripts/score_*.py`), determinístico.
- Revisão: ficha de personagens → cena a cena.
- Personagens arredondados e macios (toon 3 tons + contorno de tinta + olhos de anime por shader).
- Cartão final entra (5:32–5:40).
- Prévias em 960×540 (`--scale=0.5`); final em 1080p no fim.
- Código no repo `motion-graphics`, branch `ccr-8750cfcb-hs28qi`; MP4 fora do git.

## Decisões de direção
- Ponta azul-elétrica nas **duas nadadeiras peitorais** de Ciro e da Mãe (é ela que se toca nas cenas 1 e 7).
- Cardume: formações analíticas com semente fixa (giro em espiral; nado em fileira com a virada propagada como onda), em vez de uma simulação de boids passo a passo. Mesmo comportamento na tela, frames independentes e idênticos a cada render.
- Pontas que se tocam: a posição da Mãe é calculada a partir da posição real das pontas (`finTipWorld`).

## Mapa da Parte 1 (f 0–1500)
| Filme | Local | Plano |
|---|---|---|
| 0:00–0:05 | Título 0–150 | Superfície vista de baixo; bolha sobe e estoura no título; título vira bolhas |
| 0:05–0:12 | 0–210 | Aberto: cardume em espiral |
| 0:12–0:18 | 210–390 | Câmera entra no cardume, encontra Ciro; ele olha para cima |
| 0:18–0:21 | 390–490 | Bolhas sobem; ele segue com os olhos, corpo inclinado |
| 0:21–0:25 | 490–590 | Toca o raio de luz; brilho nos olhos |
| 0:25–0:28 | 590–690 | O que ele vê: o recife distante no azul |
| 0:28–0:33 | 690–830 | A Mãe encosta a nadadeira; ele volta à formação |
| 0:33–0:36 | 830–930 | Plano-detalhe: as duas pontas azuis juntas |
| 0:36–0:39 | 930–1020 | A bolha iridescente passa |
| 0:39–0:42 | 1020–1110 | Close anime: pupilas de estrela |
| 0:42–0:48 | 1110–1290 | Ele sai atrás da bolha; o cardume vira à esquerda como onda |
| 0:48–0:50 | 1290–1350 | Bolha em close, estoura; íris fecha |

## Comandos
```
npx remotion still Ficha out/Ficha.png --gl=swangle
node scripts/stills.mjs Cena1 0.5 100,300,450 k      # frames-chave
python3 scripts/score_parte1.py public/audio/parte1_raw.wav
ffmpeg -i public/audio/parte1_raw.wav -af loudnorm=I=-17:TP=-1.5 public/audio/parte1.wav
npx remotion render Parte1 out/parte1_preview.mp4 --scale=0.5 --gl=swangle
```
