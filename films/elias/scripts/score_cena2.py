"""Trilha da Cena 2 (HQ, origem do dom): 50 s @30 fps."""
import sys, numpy as np
sys.path.insert(0, "scripts")
from synth import *
DUR = 50.0
F = lambda fr: fr / 30.0
m = Mix(DUR); r = np.random.default_rng(23)
MOTIF = ["A3", "C#4", "E4", "D4", "C#4", "B3"]
def motif(t, gain=0.4, gap=0.5, pan=0.0, o=0):
    for i, n in enumerate(MOTIF): m.place(pizz(note(n) + 12 * o, 1.2), t + i * gap, gain * (0.85 + 0.15 * (i % 2)), pan)

n = int(SR * DUR)
m.place(lp(r.uniform(-1, 1, n), 200) * 0.03, 0, 1)
# páginas: cada quadro "estala" (papel + tick)
for fr in [0, 225, 468, 708, 990]:
    m.place(noise_burst(0.12, 5000), F(fr), 0.12, 0); m.place(bip(76, 0.05), F(fr), 0.08, 0)
# P1: ondas de luz e som sobre a criança — camadas dissonantes crescendo, depois acalma com a mãe
m.place(strings([note("A2"), note("Bb2"), note("E3"), note("F3")], 4.8, att=1.2, rel=1.5, bright=1400, trem=5), F(30), 0.24)
for i in range(30): m.place(bip(70 + (i * 11) % 24, 0.05), F(40 + i * 5), 0.045, -0.8 + (i % 9) * 0.2)
m.place(whoosh(3.0, 200, 3500), F(55), 0.12)
m.place(strings([note("A2"), note("E3"), note("A3"), note("C#4")], 4.5, att=1.0, rel=1.8, bright=1800), F(150), 0.27)   # mãe acalma
motif(F(170), 0.3, 0.55, 0.3)
# P2: orbes caem nos frascos (clinks), orbe próprio branco = celesta clara
for i in range(6):
    t = F(225 + 30 + i * 28 + 26)
    m.place(echo(celesta(note(["D5", "F5", "A5", "C6", "E5", "G5"][i]), 1.2, 0.7), 0.25, 0.3, 2), t, 0.13, 0.6)
    m.place(blup(500 + 60 * i, 0.15), t - 0.06, 0.12, 0.6)
m.place(echo(celesta(note("A5"), 2.2, 1.2), 0.3, 0.4, 3), F(225 + 224), 0.2, -0.6)
m.place(echo(celesta(note("E6"), 2.2, 1.2), 0.3, 0.4, 3), F(225 + 232), 0.14, -0.6)
# P3: filtro — passagens suaves (whoosh) com dedilhado
for i in range(9): m.place(whoosh(1.2, 500, 1500), F(500 + i * 24), 0.05, -0.8 + i * 0.2)
motif(F(505), 0.34, 0.45, 0)
# P4: azul vira menta — acorde menor→maior
m.place(strings([note("A2"), note("E3"), note("C4")], 3.2, att=0.6, rel=1.0, bright=1100), F(710), 0.24)
m.place(strings([note("A2"), note("E3"), note("A3"), note("C#4"), note("F#4")], 5.5, att=2.0, rel=2.0, bright=2200), F(790), 0.30)
for i, nn in enumerate(["E5", "A5", "C#6", "E6"]): m.place(echo(celesta(note(nn), 2.0, 1.1), 0.3, 0.3, 3), F(840) + i * 0.15, 0.15, 0.3)
# P5: noite, cidade acesa — luzes cintilam em celesta esparsa, grave quente
m.place(drone(12.0, [note("D2"), note("A2")], fc=380), F(990), 0.20)
for i in range(60):
    nm = ["A4", "C#5", "E5", "F#5", "B4", "D5", "G#4"][i % 7]
    m.place(echo(celesta(note(nm), 1.4, 0.7), 0.3, 0.25, 2), F(1000 + i * 3.6 + r.uniform(0, 2)), 0.07, r.uniform(-0.9, 0.9))
motif(F(1050), 0.4, 0.6, 0)
# página inteira + zoom final
m.place(strings([note("A2"), note("E3"), note("A3"), note("C#4"), note("E4")], 6.0, att=2.5, rel=2.0, bright=2400), F(1300), 0.30)
m.place(whoosh(2.5, 300, 3000), F(1400), 0.12)
m.write("/tmp/cena2_raw.wav")
