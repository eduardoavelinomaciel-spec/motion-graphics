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
