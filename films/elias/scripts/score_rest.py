"""Trilhas das cenas 4–8. Uso: python3 scripts/score_rest.py cena4 ... (gera /tmp/<nome>_raw.wav)"""
import sys, numpy as np
sys.path.insert(0, "scripts")
from synth import *
F = lambda fr: fr / 30.0
MOTIF = ["A3", "C#4", "E4", "D4", "C#4", "B3"]

class S:
    def __init__(s, dur, seed, amb_fc=180, amb=0.035):
        s.dur = dur; s.m = Mix(dur); s.r = np.random.default_rng(seed)
        n = int(SR * dur); t = np.arange(n) / SR
        s.m.place(lp(s.r.uniform(-1, 1, n), amb_fc) * amb * np.interp(t, [0, 1, dur - 1, dur], [0.3, 1, 1, 0.2]), 0, 1)
    def motif(s, f, gain=0.38, gap=0.52, pan=0.0, o=0):
        for i, n in enumerate(MOTIF): s.m.place(pizz(note(n) + 12 * o, 1.2), F(f) + i * gap, gain * (0.85 + 0.15 * (i % 2)), pan)
    def pad(s, f, notes, dur=6.0, g=0.26, att=1.4, rel=1.8, bright=1200): s.m.place(strings([note(n) for n in notes], dur, att=att, rel=rel, bright=bright), F(f), g)
    def bells(s, f, notes, g=0.15, gap=0.12, pan=0.0):
        for i, nn in enumerate(notes): s.m.place(echo(celesta(note(nn), 1.6, 0.9), 0.28, 0.3, 3), F(f) + i * gap, g, pan)
    def steps(s, a, b, step=17, g=0.05, pan=0.0):
        for f in range(a, b, step):
            th = lp(s.r.uniform(-1, 1, int(SR * 0.07)), 420) * np.exp(-np.arange(int(SR * 0.07)) / SR / 0.018)
            s.m.place(th, F(f), g, pan)
    def sparkle(s, f, n=30, g=0.045, gap=0.09):
        for i in range(n): s.m.place(celesta(note(["A5", "B5", "D6", "E6", "F#6"][i % 5]), 0.5, 0.25), F(f) + i * gap + s.r.uniform(0, 0.05), g, s.r.uniform(-0.6, 0.6))
    def drops(s, f, n=14, gap=20, g=0.09):
        for i in range(n): s.m.place(echo(celesta(note(["D4", "F4", "A3", "C4"][i % 4]), 1.2, 0.7), 0.28, 0.3, 2), F(f + i * gap + s.r.uniform(0, 8)), g, 0.5)
    def pop(s, f, g=0.2): s.m.place(blup(520, 0.2, 2.0), F(f), g, -0.3)
    def out(s, fr0, name):
        for i in range(18): s.m.place(bip(88 + i, 0.05), F(fr0) + i * 0.012 * (18 - i) / 8, 0.045)
        s.m.place(whoosh(0.5, 4000, 200), F(fr0), 0.12)
        s.m.write(f"/tmp/{name}_raw.wav")

def cena4():
    s = S(50.0, 41)
    s.steps(8, 280, 17, 0.05, -0.4); s.steps(960, 1480, 17, 0.05, 0.4)
    s.m.place(noise_burst(1.2, 2500), F(0), 0.012, 0)  # rua distante
    s.pad(10, ["D3", "A3", "F#4"], 5.5, 0.2, bright=1700)
    s.m.place(whoosh(1.0, 800, 3000), F(168), 0.07, 0.3)               # vento leva o balão
    s.m.place(blup(700, 0.4, 0.6), F(175), 0.12, 0.0)
    s.pad(180, ["D2", "A2", "F3"], 8.0, 0.28, att=0.8, bright=800); s.drops(200, 20, 20, 0.1)
    s.motif(330, 0.34, 0.55, -0.2)
    s.pop(430); s.bells(445, ["D5", "F#5", "A5", "D6"], 0.15, 0.16, -0.3)
    s.pad(440, ["D3", "A3", "F#4"], 6.0, 0.26, att=1.6, bright=1900)
    s.steps(600, 735, 17, 0.04, 0.6)
    s.m.place(echo(celesta(note("E6"), 1.0, 0.6), 0.2, 0.3, 2), F(745), 0.12, 0.2)
    s.pad(780, ["D3", "A3", "D4", "F#4", "A4"], 7.0, 0.32, att=1.0, rel=2.5, bright=2600)
    s.bells(792, ["F#5", "A5", "D6", "F#6", "A6"], 0.18, 0.1, 0.2); s.sparkle(800, 30)
    for i in range(10): s.m.place(celesta(note(["D6", "E6", "F#6"][i % 3]), 0.4, 0.2), F(800) + i * 0.14 + s.r.uniform(0, 0.04), 0.07, 0.5)  # risadinha
    s.motif(900, 0.38, 0.55, 0)
    s.out(1488, "cena4")

if __name__ == "__main__":
    for n in sys.argv[1:]: globals()[n]()
