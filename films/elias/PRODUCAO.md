# O Homem que Sentia Tudo (Elias) — produção

Fonte: `06-elias-sentia-tudo.md` + `00-guia-visual.md` + `PADRAO-HISTORIAS.md`.

## Decisões (com o autor)
- YouTube 16:9, 1920×1080, 30 fps, título + 8 cenas (≈5:45). TikTok 60 s depois, reaproveitando assets.
- Estilo do peixe: anime cel-shading + pixel bem marcado + HQ (flashback, balões com mini-quadros, tela dividida do abraço).
- Sem imagens de referência: personagens criados a partir das descrições do roteiro.
- Revisão: ficha de personagens → cena 1 → aprovação → próximas cenas.
- Prévias em 1920×1080; cartão final com a pergunta em letreiro de HQ.
- Código em `films/elias/` (branch `elias-sentia-tudo`); MP4 fora do git.

## Base técnica
- `src/lib/body.ts`: `sweepY`, `capsule`, `flare`, `roundBox`, `tube` (corpos humanos).
- `src/characters/Human.tsx`: esqueleto (bacia, tronco, braços, pernas, cabeça), olhos de anime por shader, sobrancelhas e boca por expressão. `headOnly` para folhas de expressão.
- `src/characters/cast.tsx`: Elias, Rita (+ caixa), Seu Antônio, Bia (+ fita), Seu Jorge (+ chapéu, aliança).
- Sombra toon dos humanos: `shadowK = 1` + tint claro, luz frontal (`FRONT_LIGHT` em `Stage.tsx`).

## Comandos
```
npx remotion still Equipe out/Equipe.png --gl=swangle      # ficha
npx remotion still Expressoes out/Expressoes.png --gl=swangle
npx remotion still EquipeSil out/EquipeSil.png --gl=swangle
```

## Parte 1 (título + cena 1) — 0:00–0:50
- Título 0–150 (pixels voam e formam "O HOMEM QUE / SENTIA TUDO"), Cena 1 = frames 150–1500.
- Mapa de planos (frame local da cena): 0–150 Elias caminha; 150–345 Rita (fio azul, lenço ~f300); 540–690 entregador (laranja); 735–860 menino (amarelo); 985–1130 plano geral, todas as auras e fios; 1130–1240 push; 1235–1350 mergulho no peito + dissolve em pixels.
- Render: `npx remotion render src/index.ts Parte1 out/chunks/p1_N.mp4 --frames=A-B --gl=swangle --crf=18 --muted --concurrency=2` (350 quadros ≈ 7 min; 2 CPUs), concat + `public/audio/parte1.wav` (-18,5 LUFS, pico -3,6 dBFS).
- Pendências conhecidas: braços rígidos ("salsicha"), Jorge/Bia (retoques), mão no peito pouco expressiva, lenço pequeno.

## Cena 2 — página de HQ (0:50–1:40, origem do dom)
- `src/scenes/Cena2.tsx`: 5 quadros de HQ com mini-cenas 3D (criança sente ondas / separa orbes em frascos / adulto filtra a multidão / ajuda Rita: azul→menta / noite, cidade acesa). Câmera de página foca cada quadro e abre na página inteira (f1320–1400), zoom final + fade (f1455–1500).
- Áudio: `scripts/score_cena2.py` → `public/audio/cena2.wav` (-18,5 LUFS). Render igual à Parte 1 (≈0,65 s/quadro).

## Cena 3 — o padeiro (1:40–2:30)
- `src/scenes/Cena3.tsx` + `world/Bakery.tsx` + `fx/Pictoballoon.tsx` (balão pictográfico com 2 mini-quadros: bolo premiado / multidão aplaudindo). Antônio triste (aura azul+laranja) → Elias senta, pão quente → balão → primeiro sorriso (estrelas amarelas, luz da padaria fica dourada). Elias sai pela porta; dissolve em pixels nos últimos 12 quadros.
- Áudio: `scripts/score_cena3.py` → `public/audio/cena3.wav`.
