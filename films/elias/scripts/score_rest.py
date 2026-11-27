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

def cena5():
    s = S(50.0, 51, 160, 0.03)
    s.steps(8, 300, 17, 0.05, -0.4)
    s.pad(20, ["B2", "F#3", "D4"], 8.0, 0.26, att=1.6, bright=800); s.drops(40, 18, 22, 0.09)
    s.m.place(noise_burst(0.3, 900), F(360), 0.05, -0.3)
    s.motif(420, 0.34, 0.55, -0.2)
    s.pop(580); s.bells(595, ["B4", "D5", "F#5", "B5"], 0.15, 0.16, -0.3)
    s.pad(590, ["B2", "F#3", "D4", "A4"], 6.5, 0.27, att=1.5, bright=1700)
    s.m.place(echo(celesta(note("F#5"), 1.4, 0.7), 0.25, 0.3, 3), F(760), 0.12, 0.2)   # mão no ombro
    s.motif(780, 0.38, 0.5, 0)
    s.pad(960, ["D3", "A3", "D4", "F#4", "A4"], 8.0, 0.32, att=1.2, rel=2.5, bright=2400)
    s.bells(980, ["F#5", "A5", "D6", "F#6"], 0.17, 0.12, 0.2); s.sparkle(1100, 24)
    s.motif(1200, 0.36, 0.6, 0)
    s.out(1488, "cena5")

def cena6():
    s = S(40.0, 61, 150, 0.04)
    s.pad(0, ["B1", "F#2", "D3"], 12.0, 0.26, att=2.5, rel=3, bright=600)
    s.pad(500, ["B1", "E2", "G#2", "D3"], 14.0, 0.26, att=3, rel=3, bright=700)
    for i in range(8):
        t = 40 + i * 118
        s.steps(t + 10, t + 110, 15, 0.035, -0.5 if i % 2 else 0.5)
        s.m.place(lp(s.r.uniform(-1, 1, int(SR * 0.5)), 500), F(t + 40), 0.04 + 0.01 * i, 0)       # murmúrio da pressa
        s.m.place(echo(celesta(note(["D4", "F4", "A3", "C4"][i % 4]), 1.4, 0.7), 0.3, 0.3, 3), F(t + 60), 0.06 + 0.01 * i, 0.4)
    s.m.place(noise_burst(1.5, 700), F(850), 0.06, 0)
    s.m.place(strings([note("C#3"), note("G3"), note("D4")], 10.0, att=3.5, rel=3, bright=900, trem=5), F(850), 0.22)
    s.out(1188, "cena6")

def cena7():
    s = S(30.0, 71, 150, 0.035)
    s.pad(0, ["B1", "F#2", "D3"], 8.0, 0.22, att=2.0, bright=700)
    s.steps(70, 285, 17, 0.05, 0.5)
    s.m.place(noise_burst(0.3, 900), F(310), 0.05, 0.3)
    s.m.place(echo(celesta(note("E5"), 1.4, 0.8), 0.25, 0.3, 3), F(380), 0.14, 0.0)      # a mão
    s.pad(380, ["D3", "A3", "F#4"], 6.0, 0.26, att=1.0, bright=1600)
    s.pad(470, ["D3", "A3", "D4", "F#4", "A4"], 9.0, 0.34, att=1.0, rel=3, bright=2600)  # abraço
    s.bells(480, ["F#5", "A5", "D6", "F#6"], 0.17, 0.12, 0.2); s.sparkle(520, 30)
    s.motif(540, 0.4, 0.5, 0)
    s.pop(610); s.bells(625, ["B4", "D5", "F#5", "B5"], 0.15, 0.16, -0.3)
    s.motif(700, 0.38, 0.5, 0.0, 1)
    s.out(888, "cena7")

def cena8():
    s = S(25.0, 81, 200, 0.03)
    s.steps(8, 100, 17, 0.045, 0)
    s.pad(10, ["D3", "A3", "F#4"], 8.0, 0.26, att=1.5, bright=1600)
    s.pad(130, ["D3", "A3", "D4", "F#4", "A4"], 10.0, 0.32, att=1.5, rel=3, bright=2600)
    s.sparkle(130, 50, 0.04, 0.12); s.bells(180, ["F#5", "A5", "D6", "F#6", "A6"], 0.16, 0.14, 0.1)
    s.motif(240, 0.4, 0.55, 0, 1)
    s.m.place(strings([note("D2"), note("A2"), note("D3")], 8.0, att=1.5, rel=3, bright=1200), F(520), 0.3)
    s.bells(580, ["D5", "F#5", "A5"], 0.14, 0.4, 0.0)
    s.m.place(echo(celesta(note("D6"), 3.0, 1.2), 0.4, 0.35, 4), F(640), 0.16, 0)
    s.out(740, "cena8")

if __name__ == "__main__":
    for n in sys.argv[1:]: globals()[n]()
