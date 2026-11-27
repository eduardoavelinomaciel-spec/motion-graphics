"""Trilha da Cena 3 (o padeiro): 50 s @30 fps."""
import sys, numpy as np
sys.path.insert(0, "scripts")
from synth import *
DUR = 50.0
F = lambda fr: fr / 30.0
m = Mix(DUR); r = np.random.default_rng(31)
MOTIF = ["A3", "C#4", "E4", "D4", "C#4", "B3"]
def motif(t, gain=0.4, gap=0.5, pan=0.0, o=0):
    for i, n in enumerate(MOTIF): m.place(pizz(note(n) + 12 * o, 1.2), t + i * gap, gain * (0.85 + 0.15 * (i % 2)), pan)
n = int(SR * DUR)
amb = lp(r.uniform(-1, 1, n), 180) * 0.035
m.place(amb * np.interp(np.arange(n) / SR, [0, 1, 49, 50], [0.3, 1, 1, 0.2]), 0, 1)
# forno: rumor baixo que cresce com o calor
oven = lp(r.uniform(-1, 1, n), 120) * 0.05 * np.interp(np.arange(n) / SR, [0, 18, 36, 50], [0.2, 0.6, 1.0, 0.8])
m.place(oven, 0, 1)
for i in range(70): m.place(noise_burst(0.02, 3000), F(40 + i * 18 + r.uniform(0, 12)), 0.02 * (0.5 + 0.5 * np.interp(i * 18 / 30, [0, 36], [0.3, 1])), r.uniform(-0.5, 0.8))  # estalos de brasa
# passos de Elias entrando (0–150) e saindo (1250–1480)
for f in list(range(8, 150, 17)) + list(range(1262, 1480, 17)):
    th = lp(r.uniform(-1, 1, int(SR * 0.07)), 420) * np.exp(-np.arange(int(SR * 0.07)) / SR / 0.018)
    m.place(th, F(f), 0.05, -0.4 + 0.8 * (f > 1000))
# padeiro triste: cordas graves + gotas
m.place(strings([note("D2"), note("A2"), note("F3")], 6.0, att=1.5, rel=1.8, bright=900), F(30), 0.26)
for i in range(18): m.place(echo(celesta(note(["D4", "F4", "A3", "C4"][i % 4]), 1.2, 0.7), 0.28, 0.3, 2), F(60 + i * 20 + r.uniform(0, 8)), 0.09, 0.5)
motif(F(170), 0.36, 0.55, -0.2)                           # Elias sente
m.place(strings([note("A2"), note("E3"), note("C4")], 6.0, att=1.2, rel=1.6, bright=1100), F(160), 0.24)
# sentar no banquinho (rangido), pão sai do forno (tilintar), entrega
m.place(noise_burst(0.35, 900), F(360), 0.06, -0.3)
m.place(echo(celesta(note("E6"), 1.0, 0.6), 0.2, 0.3, 2), F(440), 0.12, 0.0)
m.place(noise_burst(0.25, 1800), F(545), 0.07, 0.3)       # pão toca a mão
# balão pictográfico: pop + mini-fanfarra de bolo (violão + sinos) + palminhas
m.place(blup(520, 0.2, 2.0), F(625), 0.2, -0.3)
for i, nn in enumerate(["D5", "F#5", "A5", "D6"]): m.place(echo(celesta(note(nn), 1.5, 0.9), 0.28, 0.3, 3), F(640) + i * 0.16, 0.16, -0.3)
for i in range(16): m.place(noise_burst(0.05, 2600), F(700) + i * 0.17 + r.uniform(0, 0.03), 0.04, r.uniform(-0.5, 0.5))   # palmas
m.place(strings([note("D3"), note("A3"), note("F#4")], 6.0, att=1.6, rel=2.0, bright=1900), F(640), 0.28)
motif(F(720), 0.38, 0.5, 0)
# primeiro sorriso do padeiro: cordas se abrem, sinos
m.place(strings([note("D3"), note("A3"), note("D4"), note("F#4"), note("A4")], 7.0, att=1.0, rel=2.5, bright=2600), F(1000), 0.32)
for i, nn in enumerate(["F#5", "A5", "D6", "F#6", "A6"]): m.place(echo(celesta(note(nn), 1.8, 1.0), 0.28, 0.3, 3), F(1004) + i * 0.1, 0.18, 0.2)
for i in range(30): m.place(celesta(note(["A5", "B5", "D6", "E6", "F#6"][i % 5]), 0.5, 0.25), F(1010) + i * 0.09 + r.uniform(0, 0.05), 0.045, r.uniform(-0.6, 0.6))
motif(F(1090), 0.38, 0.55, 0)
# saída
m.place(strings([note("D2"), note("A2"), note("D3"), note("F#3")], 8.0, att=2.0, rel=2.5, bright=1500), F(1250), 0.26)
for i in range(18): m.place(bip(88 + i, 0.05), F(1488) + i * 0.012 * (18 - i) / 8, 0.045)
m.place(whoosh(0.5, 4000, 200), F(1488), 0.12)
m.write("/tmp/cena3_raw.wav")
