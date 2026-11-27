#!/bin/bash
# Uso: scripts/assemble.sh <Comp> <audio> <saida.mp4>   (concatena chunks e muxa áudio)
c=$1; a=$2; o=$3
ls out/chunks/${c}_[0-9][0-9][0-9][0-9].mp4 | sed "s|^|file '$PWD/|;s|$|'|" > /tmp/${c}_list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i /tmp/${c}_list.txt -i public/audio/$a.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest $o
ffprobe -v error -show_entries format=duration -of csv=p=0 $o
