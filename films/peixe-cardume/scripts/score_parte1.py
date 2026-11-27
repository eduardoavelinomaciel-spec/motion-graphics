"""Score for Título + Cena 1 (0:00–0:50). Synthesised, deterministic (seeded).
Waltz in D major, 3/4 at 90 bpm (bar = 2 s) from 0:05. Ciro's leitmotif on celesta."""
import numpy as np
from scipy.signal import butter, sosfilt
import wave, sys

SR = 48000
DUR = 50.0
rng = np.random.default_rng(3)
mix = np.zeros((int(SR * DUR) + SR, 2))

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
N = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
def note(s):  # "F#5"
    name, octv = s[:-1], int(s[-1])
    return 12 * (octv + 1) + N[name]

def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(mix): return
    sig = sig[: len(mix) - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * l * 1.414
    mix[i:i + len(sig), 1] += sig * gain * r * 1.414

def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)

def env_adsr(n, a, d, s, r, hold):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    e[t < a] = t[t < a] / a
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / d
    rel = t >= hold
    e[rel] = s * np.exp(-(t[rel] - hold) / r)
    return e

def celesta(m, dur=1.6):
    f = midi(m); n = int(SR * dur); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9)
         + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.5)
         + 0.12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / 0.3)
         + 0.18 * np.sin(2 * np.pi * 4.18 * f * t) * np.exp(-t / 0.12)
         + 0.08 * np.sin(2 * np.pi * 7.1 * f * t) * np.exp(-t / 0.04))
    y *= np.minimum(1, t / 0.002)
    return y * 0.5

def pizz(m, dur=0.9):
    f = midi(m); n = int(SR * dur)
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, min(6000, f * 8))
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    t = np.arange(n) / SR
    return lp(out, 2500) * np.exp(-t / 0.35) * 0.9

def strings(ms, dur, att=0.05, rel=0.25, bright=2200, vib=5.2):
    n = int(SR * (dur + rel * 3)); t = np.arange(n) / SR
    y = np.zeros(n)
    for m in ms:
        f = midi(m)
        for det in (-0.07, 0.0, 0.06):
            ph = 2 * np.pi * np.cumsum(f * 2 ** (det / 12) * (1 + 0.004 * np.sin(2 * np.pi * vib * t + rng.uniform(0, 6)))) / SR
            saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
            y += saw
    y = lp(y, bright, 2) / (len(ms) * 3)
    return y * env_adsr(n, att, 0.1, 0.85, rel, dur)

def blup(f0, dur=0.22, up=1.7):
    n = int(SR * dur); t = np.arange(n) / SR
    f = f0 * (1 + (up - 1) * (1 - np.exp(-t / 0.035)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / (dur / 3.2)) * np.minimum(1, t / 0.003)

def noise_burst(dur, fc):
    n = int(SR * dur); t = np.arange(n) / SR
    return lp(rng.uniform(-1, 1, n), fc) * np.exp(-t / (dur / 5))

# --- ambience: low ocean hum + tiny distant bubbles ------------------------------------
n = len(mix); t = np.arange(n) / SR
hum = lp(np.cumsum(rng.uniform(-1, 1, n)) * 0.002, 300, 2)
hum = hum / (np.abs(hum).max() + 1e-9) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
mix[:, 0] += hum * 0.05; mix[:, 1] += hum * 0.05
for i in range(70):
    place(blup(rng.uniform(900, 2400), 0.06), rng.uniform(0, DUR), 0.02, rng.uniform(-0.8, 0.8))

LEIT = ["D5", "E5", "F#5", "A5", "B5"]

# --- title (0–5 s) -------------------------------------------------------------------------
for i in range(12):  # the bubble rising: little wobble glugs
    place(blup(330 + i * 18, 0.08, 1.3), 0.15 + i * 0.13, 0.05, 0.0)
place(blup(150, 0.5, 2.0), 1.8, 0.75)           # "blup" grave
place(noise_burst(0.08, 3000), 1.8, 0.2)
for i, nm in enumerate(LEIT):                    # first celesta arpeggio
    place(celesta(note(nm), 2.2), 1.9 + i * 0.13, 0.42, -0.3 + i * 0.15)
place(strings([note("D4"), note("A4"), note("F#5")], 2.6, att=0.6, rel=0.8, bright=1600), 1.9, 0.16)
for i in range(16):                              # the title dissolving into bubbles
    place(blup(rng.uniform(1400, 2600), 0.05), 3.75 + i * 0.06 + rng.uniform(0, 0.03), 0.05, rng.uniform(-0.7, 0.7))

# --- waltz (5–50 s) -------------------------------------------------------------------------
T0, BAR, BEAT = 5.0, 2.0, 2.0 / 3
CH = {
    "D": ["D", "F#", "A"], "Bm": ["B", "D", "F#"], "G": ["G", "B", "D"], "A": ["A", "C#", "E"],
    "Em": ["E", "G", "B"], "F#m": ["F#", "A", "C#"], "A7": ["A", "C#", "G"],
}
PROG = ["D", "Bm", "G", "A", "D", "Bm", "Em", "A7",
        "D", "F#m", "G", "A", "Bm", "G", "Em", "A7",
        "G", "A", "D", "Bm", "Em", "A7", "D"]
ROOT_OCT = {"D": 2, "Bm": 2, "G": 2, "A": 2, "Em": 2, "F#m": 2, "A7": 2}

def chord_notes(name, octv):
    out = []
    base = note(CH[name][0] + str(octv))
    for nm in CH[name]:
        m = note(nm + str(octv))
        while m < base: m += 12
        out.append(m)
    return out

# soft violin line: long tones on chord tones (enters at bar 3, rests under the leitmotifs)
MEL = {2: ("B5", 2), 3: ("C#6", 2), 4: ("A5", 3), 6: ("B5", 1.5), 7: ("G5", 2),
       10: ("B5", 2), 11: ("A5", 2), 14: ("B5", 2), 15: ("G5", 2), 16: ("B5", 1.6), 17: ("C#6", 2), 18: ("D6", 3),
       20: ("B5", 2), 21: ("G5", 2)}
fade_in = lambda bar: min(1.0, 0.35 + bar * 0.12)
for b, ch in enumerate(PROG):
    tb = T0 + b * BAR
    if tb >= DUR: break
    g = fade_in(b)
    root = note(CH[ch][0] + str(ROOT_OCT[ch]))
    place(pizz(root + 12, 1.0), tb, 0.55 * g, -0.1)                      # oom
    up = chord_notes(ch, 4)
    for k in (1, 2):                                                     # pa-pa
        place(strings(up, 0.22, att=0.015, rel=0.12, bright=2600), tb + k * BEAT, 0.13 * g, 0.25)
        place(pizz(up[k % 3] + 12, 0.5), tb + k * BEAT, 0.12 * g, -0.35)
    if b in MEL:
        nm, d = MEL[b]
        place(strings([note(nm)], d * 0.95, att=0.25, rel=0.5, bright=3200, vib=5.6), tb, 0.12, 0.1)

def leitmotif(t0, shift=0, step=1 / 3, gain=0.4, pan=-0.2):
    for i, nm in enumerate(LEIT):
        place(celesta(note(nm) + shift, 2.0), t0 + i * step, gain, pan + i * 0.08)

leitmotif(15.0 + BEAT)                               # the camera finds Ciro
for i, nm in enumerate(["A5", "B5", "D6", "E6", "F#6"]):  # bubbles, in a musical scale
    place(blup(midi(note(nm)) * 0.5, 0.25, 2.0), 18.3 + i * 0.52, 0.32, -0.4 + i * 0.2)
for i, nm in enumerate(["D6", "F#6", "A6", "D7", "F#7", "A7"]):  # light ray in the eyes
    place(celesta(note(nm), 1.2), 22.95 + i * 0.045, 0.18, 0.3)
place(strings([note("D4"), note("A4"), note("D5"), note("F#5")], 3.0, att=1.2, rel=1.0, bright=1800), 24.8, 0.12)  # reef swell
leitmotif(29.0 + BEAT, shift=-12, gain=0.5, pan=0.2)  # the mother: one octave below
place(strings([note("D3"), note("A3"), note("F#4"), note("D5")], 3.2, att=0.8, rel=1.2, bright=1400), 32.7, 0.14)  # the two tips

# the iridescent bubble: glassy shimmer
n = int(SR * 4.0); tt = np.arange(n) / SR
shim = sum(np.sin(2 * np.pi * midi(note(nm)) * tt + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + k) * tt))
           for k, nm in enumerate(["A6", "C#7", "E7", "F#7"]))
shim *= np.sin(np.pi * np.clip(tt / 4.0, 0, 1)) ** 2
place(shim / 4, 36.0, 0.12, 0.2)
for i, nm in enumerate(["A6", "D7", "F#7", "A7"]):   # star pupils
    place(celesta(note(nm), 1.0), 39.5 + i * 0.07, 0.2, -0.2 + i * 0.15)
for i, nm in enumerate(["D5", "F#5", "A5", "B5", "D6", "E6", "F#6", "A6"]):  # Ciro follows the bubble
    place(celesta(note(nm), 1.2), 42.2 + i * 0.16, 0.16, 0.4)
for i in range(14):                                   # the school turns: a pizzicato wave
    m = note("D4") + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 21, 19, 16][i]
    place(pizz(m, 0.6), 43.8 + i * 0.075, 0.16, -0.7 + i * 0.1)
place(blup(520, 0.3, 2.2), 49.27, 0.6, 0.0)           # the pop
place(noise_burst(0.06, 5000), 49.27, 0.15)

mix = mix[: int(SR * DUR)]
# end with no click
mix[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))[:, None]
peak = np.abs(mix).max()
mix = mix / peak * 0.89
out = sys.argv[1]
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out, "peak", peak)
