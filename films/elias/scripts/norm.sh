#!/bin/bash
# Uso: scripts/norm.sh <nome>  -> public/audio/<nome>.wav a ≈ -18.5 LUFS
n=$1
L=$(ffmpeg -i /tmp/${n}_raw.wav -af ebur128 -f null - 2>&1 | grep -A0 " I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-18.5-($L),2))")
ffmpeg -y -loglevel error -i /tmp/${n}_raw.wav -af "volume=${G}dB,alimiter=limit=0.89:level=disabled" public/audio/${n}.wav
echo $n $L $G
