"""Score for Cena 3 (Dona Marisa, local 0–50 s). The cello enters with the turtle."""
import sys, numpy as np
from synth import *

DUR = 50.0
M = Mix(DUR)
F = lambda fr: fr / 30.0
n = int(SR * DUR); t = np.arange(n) / SR

# low hum throughout; the scene-2 drone carries over and fades as the cello arrives
dr = drone(DUR, [note("D2"), note("A2")], fc=380)
g = 0.45 * (1 - np.clip((t - F(340)) / 4.0, 0, 1))
M.buf[:n, 0] += dr * g; M.buf[:n, 1] += dr * g
hum = lp(rng.uniform(-1, 1, n), 90) * 0.5
M.buf[:n, 0] += hum * 0.22; M.buf[:n, 1] += hum * 0.22

# tears: a sad celesta fragment in D minor, and tiny bubble blips
for i, (nm, at) in enumerate([("A5", 1.0), ("F5", 2.2), ("E5", 3.4), ("D5", 5.0), ("A4", 7.0)]):
    M.place(celesta(note(nm), 2.4, decay=1.3), at, 0.22, -0.2)
for i in range(14):
    M.place(blup(1900 + (i % 4) * 220, 0.07), 1.8 + i * 0.55, 0.05, 0.3)

# the shadow: a low swell, then the impact
nn = int(SR * (F(333) - F(296))); tt = np.arange(nn) / SR
sw = lp(rng.uniform(-1, 1, nn), 160) * 4 + np.sin(2 * np.pi * (45 + 15 * tt) * tt)
sw *= (tt / tt[-1]) ** 2
M.place(sw, F(296), 0.35)
M.place(noise_burst(0.35, 900) * 1.5, F(333), 0.55)
M.place(blup(70, 0.6, 1.2) * 1.5, F(333), 0.6)
M.place(strings([note("D2"), note("D#3")], 0.25, att=0.005, rel=0.2, bright=1200), F(333), 0.3)

# Dona Marisa's cello: long notes, D major, unhurried
def cello(nm, dur, at, gain=0.3):
    M.place(strings([note(nm)], dur, att=0.45, rel=0.9, bright=1300, vib=4.8), at, gain, 0.15)
cel = [("D3", 3.2, 12.6), ("A3", 2.8, 15.9), ("F#3", 3.0, 18.9), ("G3", 3.4, 22.0), ("A3", 3.0, 25.6),
       ("B3", 2.6, 28.8), ("A3", 3.2, 31.6), ("D3", 3.6, 35.2), ("F#3", 3.0, 39.0), ("A3", 3.0, 42.2), ("D4", 4.4, 45.4)]
for nm, d, at in cel:
    cello(nm, d, at)
# a soft string bed under her from the landing on
M.place(strings([note("D3"), note("A3"), note("F#4")], 30.0, att=4.0, rel=3.0, bright=900), F(560), 0.07)

# slow blinks: "you can trust me"
for b in (615, 1300):
    M.place(celesta(note("A5"), 2.0, decay=1.2), F(b + 10), 0.16, -0.3)
    M.place(celesta(note("D5"), 2.4, decay=1.4), F(b + 28), 0.16, -0.3)

# the balloon: plic … plop; Ciro's "yes"
plic_n = int(SR * 0.3); pt = np.arange(plic_n) / SR
plic = np.sin(2 * np.pi * np.cumsum(1500 * (1 + 0.8 * (1 - np.exp(-pt / 0.012)))) / SR) * np.exp(-pt / 0.04)
M.place(plic, F(700), 0.22)
M.place(blup(700, 0.12, 0.7), F(882), 0.16)
for i, nm in enumerate(["D6", "F#6", "A6"]):
    M.place(celesta(note(nm), 0.9, decay=0.5), F(778) + i * 0.17, 0.16, 0.3)

# sand being drawn: a soft hiss that follows the wave, two strokes for the arrow
nn = int(SR * (F(1040) - F(930))); tt = np.arange(nn) / SR
hs = bp(rng.uniform(-1, 1, nn), 1800, 6000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 0.5 * tt)))
hs *= np.minimum(1, tt / 0.2) * np.minimum(1, (tt[-1] - tt) / 0.2)
M.place(hs, F(930), 0.18, -0.2)
for i in range(2):
    M.place(whoosh(0.18, 2500, 5000) * 0.6, F(1046) + i * 0.24, 0.16, -0.2)
for i in range(10):  # glitter
    M.place(celesta(note(["D7", "F#7", "A7", "B6"][i % 4]), 0.5, decay=0.15), F(940) + i * 0.45, 0.05, 0.4)

# she points up: the current — a rising arpeggio and a shimmer
arp = ["D4", "F#4", "A4", "D5", "F#5", "A5", "D6", "F#6", "A6", "D7"]
for i, nm in enumerate(arp):
    M.place(pizz(note(nm), 0.8), F(1085) + i * 0.12, 0.16, -0.5 + i * 0.1)
    M.place(celesta(note(nm), 1.4), F(1110) + i * 0.15, 0.11, 0.5 - i * 0.1)
nn = int(SR * 5.0); tt = np.arange(nn) / SR
shim = sum(np.sin(2 * np.pi * midi(note(nm)) * tt + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (2.3 + k) * tt)) for k, nm in enumerate(["A5", "D6", "F#6"]))
M.place(shim * np.sin(np.pi * tt / 5.0) ** 2 / 3, F(1110), 0.09)

# he comes out: his leitmotif, now in major and with the cello under it
for i, nm in enumerate(["D5", "E5", "F#5", "A5", "B5"]):
    M.place(celesta(note(nm), 2.0), F(1350) + i * 0.33, 0.3, -0.15 + i * 0.07)
M.place(strings([note("D4"), note("F#4"), note("A4"), note("D5")], 4.0, att=1.5, rel=1.5, bright=1800), F(1340), 0.11)

# the whip-pan
M.place(whoosh(0.5, 400, 3500), F(1482), 0.5)

M.write(sys.argv[1])
print("ok")
