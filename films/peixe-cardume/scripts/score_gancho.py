"""Áudio do gancho (0:00–0:11.5). Sintetizado, determinístico. Escuro e solitário; um acorde de cordas grave
(Ré menor) sob o Ciro sozinho, bolhas, e o motivo do Ciro na celesta, lento e em tom menor.
Uso: python3 scripts/score_gancho.py public/audio/gancho_raw.wav"""
import sys, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 11.5
rng = np.random.default_rng(11)
mix = np.zeros((int(SR * DUR) + SR, 2))

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def lp(x, fc, order=2): return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)

def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(mix): return
    sig = sig[: len(mix) - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * l * 1.414
    mix[i:i + len(sig), 1] += sig * gain * r * 1.414

def celesta(m, dur=2.2):
    f = midi(m); n = int(SR * dur); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 1.1) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.5)
         + 0.1 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / 0.3))
    return y * np.minimum(1, t / 0.002) * 0.5

def pad(ms, dur, att=1.5, rel=2.0, bright=900):
    n = int(SR * (dur + rel)); t = np.arange(n) / SR
    y = np.zeros(n)
    for m in ms:
        f = midi(m)
        for det in (-0.08, 0.0, 0.07):
            ph = 2 * np.pi * np.cumsum(f * 2 ** (det / 12) * (1 + 0.003 * np.sin(2 * np.pi * 4.8 * t + rng.uniform(0, 6)))) / SR
            y += 2 * ((ph / (2 * np.pi)) % 1) - 1
    y = lp(y, bright) / (len(ms) * 3)
    e = np.minimum(1, t / att) * np.where(t < dur, 1, np.exp(-(t - dur) / (rel / 3)))
    return y * e

def blup(f0, dur=0.2, up=1.7):
    n = int(SR * dur); t = np.arange(n) / SR
    f = f0 * (1 + (up - 1) * (1 - np.exp(-t / 0.035)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur / 3.2)) * np.minimum(1, t / 0.003)

# 0–3 s: dark. Only bubbles and a far, low drone fading in under the question card.
place(pad([38, 45, 50], 3.2, att=2.0, rel=0.5, bright=500), 0.0, 0.6)
for tt in (0.7, 1.4, 2.0, 2.5):
    place(blup(rng.uniform(700, 1500), 0.18), tt, 0.05, rng.uniform(-0.7, 0.7))
# 3.0 s: hard cut into the water — the pad opens up (D minor), Ciro's motif, sparse and slow.
place(pad([50, 57, 62, 65], 8.8, att=1.2, rel=2.0, bright=1400), 3.0, 0.55)
for tt, m in [(3.6, 74), (5.1, 72), (6.6, 69), (8.4, 70), (9.6, 69)]:
    place(celesta(m), tt, 0.22, -0.2)
for tt in np.arange(3.4, 11.4, 0.9):
    place(blup(rng.uniform(900, 2200), 0.07), tt + rng.uniform(0, 0.4), 0.018, rng.uniform(-0.8, 0.8))
# underwater air
t = np.arange(int(SR * DUR)) / SR
air = lp(rng.standard_normal(len(t)), 700) * 0.03 * np.minimum(1, t / 3)
mix[: len(t), 0] += air; mix[: len(t), 1] += air

mix = mix[: int(SR * DUR)]
fade = np.ones(len(mix)); fade[-int(SR * 0.4):] = np.linspace(1, 0, int(SR * 0.4))
mix *= fade[:, None]
mix *= 0.85 / max(1e-9, np.abs(mix).max())
out = sys.argv[1] if len(sys.argv) > 1 else "public/audio/gancho_raw.wav"
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(out, len(mix) / SR, "s")
