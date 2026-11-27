#!/bin/bash
# Uso: scripts/render_chunks.sh <comp> <total_frames> <chunk> <saida.mp4>
# Renderiza em pedaços (limite de 10 min por comando) e depois concatena.
comp=$1; total=$2; chunk=$3; out=$4
mkdir -p out/chunks
i=0
for ((s=0; s<total; s+=chunk)); do
  e=$((s+chunk-1)); [ $e -ge $total ] && e=$((total-1))
  f=out/chunks/${comp}_$(printf %04d $i).mp4
  [ -f "$f.done" ] || { npx remotion render src/index.ts $comp "$f" --frames=$s-$e --gl=swangle --codec=h264 --crf=18 --muted --concurrency=2 --log=error && touch "$f.done"; }
  i=$((i+1))
done
