"""Score for Cena 2 (0:50–1:40, local 0–50 s): the waltz stops, the blue, the circles, the 1-bit silence."""
import sys, numpy as np
from synth import *

DUR = 50.0
M = Mix(DUR)
F = lambda fr: fr / 30.0  # local frame → seconds

# --- the waltz carries over from scene 1 (bar 23 began at −1.0 s) and stops dead when he turns -----
BEAT = 2 / 3
waltz = Mix(3.0)
up_D = [note("D4"), note("F#4"), note("A4")]
up_G = [note("G4"), note("B4"), note("D5")]
waltz.place(strings(up_D, 0.22, att=0.015, rel=0.12, bright=2600), -1.0 + 2 * BEAT + 0.0, 0.13, 0.25)
waltz.place(pizz(note("G3"), 1.0), 1.0, 0.55, -0.1)
waltz.place(strings(up_G, 0.22, att=0.015, rel=0.12, bright=2600), 1.0 + BEAT, 0.13, 0.25)
waltz.place(celesta(note("B5"), 1.2), 0.35, 0.25, -0.2)
waltz.place(celesta(note("D6"), 1.2), 1.0 + BEAT, 0.2, -0.2)
cut = int(F(62) * SR)
w = waltz.buf[:cut].copy()
w[-int(0.012 * SR):] *= np.linspace(1, 0, int(0.012 * SR))[:, None]
M.buf[: len(w)] += w

# --- drone grave: the empty blue (enters after the cut, out for the silence) ------------------------
n = int(SR * DUR); t = np.arange(n) / SR
dr = drone(DUR, [note("D2"), note("A2")], fc=420)
gain = np.clip((t - 2.6) / 3.0, 0, 1) * 0.55
gain *= 1 - 0.85 * np.clip((t - F(1040)) / 0.6, 0, 1) * (1 - np.clip((t - F(1115)) / 1.5, 0, 1))  # the 2 s of near-silence
M.buf[:n, 0] += dr * gain; M.buf[:n, 1] += dr * gain
hum = lp(rng.uniform(-1, 1, n), 90) * 0.5
M.buf[:n, 0] += hum * 0.25; M.buf[:n, 1] += hum * 0.25

# --- the HQ page: paper slides and four zips --------------------------------------------------------
M.place(whoosh(0.25, 300, 1200), F(150), 0.25)
for i, at in enumerate([160, 250, 340, 430]):
    M.place(noise_burst(0.08, 1500), F(at), 0.18, [-0.5, 0.5, -0.5, 0.5][i])          # panel lands
    M.place(whoosh(0.12, 900, 4200), F(at + 10), 0.45, [-0.6, 0.6, 0.0, 0.0][i])      # zip
M.place(whoosh(0.35, 2000, 300), F(540), 0.3)                                         # panels close

# --- the circles: a swirl that speeds up, a dissonant string cluster growing ------------------------
s0, s1 = F(560), F(840)
dur = s1 - s0
nn = int(SR * dur); tt = np.arange(nn) / SR
x = rng.uniform(-1, 1, nn)
sw = np.zeros(nn); blk = 512
for i in range(0, nn, blk):
    s = i / SR
    omega = 2.0 + 1.24 * s
    fc = 500 + 300 * omega * (0.5 + 0.5 * np.sin(2 * np.pi * (omega / (2 * np.pi)) * s))
    seg = bp(x[max(0, i - 2048): i + blk], fc * 0.7, fc * 1.3)
    sw[i:i + blk] = seg[-len(sw[i:i + blk]):]
sw *= np.clip(tt / 2, 0, 1) * (0.4 + 0.6 * tt / dur)
M.place(sw, s0, 0.5)
cl = strings([note("D3"), note("D#3"), note("A3"), note("G#4")], dur, att=dur * 0.8, rel=0.05, bright=1500, trem=9)
M.place(cl[: int(dur * SR)], s0, 0.22)
M.place(noise_burst(0.2, 200) * 2, s1, 0.5)                                          # the stop
M.place(blup(90, 0.4, 1.3), s1, 0.4)

# --- pixel-dissolve: soft 8-bit bips stepping down -------------------------------------------------
for i, nm in enumerate(["A5", "F5", "D5", "A4"]):
    M.place(bip(note(nm)), F(870) + i * 0.1, 0.14, 0.0)

# --- ice: tiny glassy tinkles; the leitmotif once, slow, with the wrong (minor) note --------------
for i in range(14):
    f0 = [2637, 3136, 2349, 3520][i % 4]
    nn = int(SR * 0.25); tt = np.arange(nn) / SR
    tk = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / 0.05) * 0.5
    M.place(tk, F(1140 + i * 16 + 5), 0.06, -0.6 + (i % 5) * 0.3)
lm = np.zeros(int(SR * 6))
for i, nm in enumerate(["D5", "E5", "F5", "A5"]):          # F natural: the wrong note
    c = celesta(note(nm), 2.6, decay=1.4)
    lm[int(i * 0.85 * SR): int(i * 0.85 * SR) + len(c)] += c[: len(lm) - int(i * 0.85 * SR)]
M.place(echo(lm, 0.42, 0.33), F(1200), 0.32, -0.1)

M.write(sys.argv[1])
print("ok")
