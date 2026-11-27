"""Trilha da Parte 1 (título + cena 1): 50 s @30 fps. Frame de filme = F(frame)."""
import json, sys, numpy as np
sys.path.insert(0, "scripts")
from synth import *

DUR = 50.0
F = lambda fr: fr / 30.0
m = Mix(DUR)
tl = json.load(open("out/timeline.json"))
r = np.random.default_rng(11)

# --- leitmotiv de Elias (violão dedilhado, 6 notas, lá menor/maior ambíguo)
MOTIF = ["A3", "C#4", "E4", "D4", "C#4", "B3"]
def motif(t, gain=0.5, gap=0.42, pan=0.0, oct_=0):
    for i, n in enumerate(MOTIF):
        m.place(pizz(note(n) + 12 * oct_, 1.1), t + i * gap, gain * (0.85 + 0.15 * (i % 2)), pan)

# --- ambiência de rua (muito baixa) + pássaros
n = int(SR * DUR)
amb = lp(r.uniform(-1, 1, n), 260) * 0.05 + bp(r.uniform(-1, 1, n), 800, 2200) * 0.006
amb *= np.interp(np.arange(n) / SR, [0, 3, 46, 50], [0.4, 1, 1, 0.2])
m.place(amb, 0, 1.0)
for i in range(14):
    t0 = 1.5 + i * 3.1 + r.uniform(0, 1.2)
    nn = int(SR * 0.12); tt = np.arange(nn) / SR
    ch = np.sin(2 * np.pi * np.cumsum(3200 + 900 * np.sin(2 * np.pi * 18 * tt) - 1500 * tt) / SR) * np.exp(-tt / 0.05)
    m.place(ch, t0, 0.02, r.uniform(-0.8, 0.8))
    m.place(ch * 0.8, t0 + 0.16, 0.015, r.uniform(-0.8, 0.8))

# --- título: pixels voam e se encaixam (bips suaves) + acorde de cordas
m.place(strings([note("A2"), note("E3"), note("A3")], 4.2, att=1.2, rel=1.2, bright=900), F(10), 0.28)
for i in range(26):
    t = F(30 + i * 1.7)
    m.place(bip(81 + (i * 5) % 14, 0.06), t, 0.05, -0.6 + (i % 7) * 0.2)
for i, nn in enumerate(MOTIF):
    m.place(echo(celesta(note(nn) + 12, 1.8, 1.1), 0.33, 0.35, 3), F(72) + i * 0.38, 0.22)
m.place(whoosh(1.0, 3000, 400), F(112), 0.1, 0)   # pixels se dispersam

# --- passos de Elias
for f in tl["steps"]:
    t = F(f)
    th = lp(r.uniform(-1, 1, int(SR * 0.07)), 420) * np.exp(-np.arange(int(SR * 0.07)) / SR / 0.018)
    m.place(th, t, 0.05, 0.0)

# --- Rita (tristeza): gotas graves de celesta, mais densas quando Elias chega; fio = cordas
for i in range(40):
    t = F(180 + i * 4.2 + r.uniform(0, 3))
    if t > F(450): break
    m.place(echo(celesta(note(["A3", "C4", "E4", "G3"][i % 4]), 1.2, 0.7), 0.25, 0.3, 2), t, 0.10, 0.5)
m.place(strings([note("A2"), note("E3"), note("C4")], 6.0, att=1.5, rel=1.4, bright=1100), F(160), 0.30, 0.2)
motif(F(160), 0.42, 0.5, 0)                                  # Elias sente (mão no peito)
m.place(noise_burst(0.3, 3500), F(300), 0.10, 0.3)           # lenço pousa na caixa
for i, nn in enumerate(["E5", "A5", "C#6"]):                 # alívio
    m.place(echo(celesta(note(nn), 2.0, 1.2), 0.3, 0.3, 3), F(304) + i * 0.16, 0.16, 0.3)
m.place(strings([note("A2"), note("E3"), note("A3"), note("C#4")], 5.0, att=0.8, rel=1.6, bright=1600), F(305), 0.26)

# --- entregador (pressa): moto com efeito doppler, faíscas de bips, aura laranja
t0, t1 = F(tl["pass"] - 70), F(tl["pass"] + 70)
nn = int((t1 - t0) * SR); tt = np.arange(nn) / SR
env = np.exp(-(((tt - (t1 - t0) / 2) / 0.55) ** 2))
fr = 95 + 28 * np.tanh((tt - (t1 - t0) / 2) * -2.2) * -1
eng = ((np.cumsum(fr) / SR) % 1) * 2 - 1
eng = lp(eng + 0.5 * np.sin(2 * np.pi * np.cumsum(fr * 2) / SR), 700) * env * 0.5
m.place(eng, t0, 0.45, 0)
pan_curve = np.linspace(-0.9, 0.9, 8)
for i in range(8):
    m.place(eng[i * nn // 8: (i + 1) * nn // 8] * 0, t0, 0, pan_curve[i])
m.place(whoosh(1.1, 600, 1800), F(tl["pass"] - 14), 0.12, 0.0)
for i in range(34):
    m.place(bip(88 + (i * 7) % 12, 0.045), F(tl["pass"] - 60 + i * 3.7), 0.045, -0.7 + (i % 9) * 0.17)
motif(F(tl["pass"] - 20), 0.30, 0.34, 0, 0)                  # Elias atento (curioso)

# --- menino (alegria): sino de bicicleta, estrelinhas, jingle ascendente
for k_, tp in enumerate([920, 924]):
    nnn = int(SR * 0.9); tq = np.arange(nnn) / SR
    ding = (np.sin(2 * np.pi * 2750 * tq) + 0.4 * np.sin(2 * np.pi * 5520 * tq)) * np.exp(-tq / 0.22)
    m.place(ding, F(tp - 150 + 0) , 0.0)
for k_, tp in enumerate([920 - 150 + 150, 928]):
    pass
BELL_AT = 150 + 775
for k_, dt in enumerate([0, 5]):
    nnn = int(SR * 0.9); tq = np.arange(nnn) / SR
    ding = (np.sin(2 * np.pi * 2750 * tq) + 0.4 * np.sin(2 * np.pi * 5520 * tq)) * np.exp(-tq / 0.22)
    m.place(ding, F(BELL_AT + dt), 0.07, 0.3)
for i, nn_ in enumerate(["D5", "F#5", "A5", "D6", "F#6"]):
    m.place(echo(celesta(note(nn_), 1.6, 0.9), 0.28, 0.3, 3), F(BELL_AT - 4) + i * 0.09, 0.19, 0.2)
for i in range(40):
    m.place(celesta(note(["A5", "B5", "D6", "E6", "F#6"][i % 5]), 0.5, 0.25), F(BELL_AT + 8) + i * 0.07 + r.uniform(0, 0.04), 0.045, r.uniform(-0.6, 0.6))
for i in range(60):
    m.place(noise_burst(0.015, 4200), F(150 + 760) + i * 0.16, 0.012, 0.3)     # roda de bicicleta (tique)
m.place(strings([note("D3"), note("A3"), note("F#4")], 4.0, att=0.5, rel=1.2, bright=2000), F(150 + 750), 0.24)
motif(F(150 + 800), 0.38, 0.4, 0, 0)                         # Elias sorri

# --- plano geral: todas as auras (camadas) e fios entrando no peito
m.place(strings([note("D2"), note("A2"), note("D3"), note("F#3"), note("A3")], 12.0, att=3.5, rel=2.5, bright=1500), F(150 + 985), 0.30)
for i in range(60):
    nm = ["A4", "C#5", "E5", "F#5", "B4", "D5", "G#4"][i % 7]
    m.place(echo(celesta(note(nm), 1.5, 0.8), 0.3, 0.28, 2), F(150 + 1000 + i * 2.1 + r.uniform(0, 1.2)), 0.07, r.uniform(-0.9, 0.9))
m.place(whoosh(3.2, 300, 2600), F(150 + 1035), 0.11)
motif(F(150 + 1050), 0.40, 0.55, 0, 0)

# --- mergulho no peito: batimento, cordas crescendo, motivo completo oitava abaixo
for i in range(14):
    t = F(150 + 1225) + i * 0.78
    nnn = int(SR * 0.32); tq = np.arange(nnn) / SR
    th = np.sin(2 * np.pi * 52 * tq) * np.exp(-tq / 0.09) * np.minimum(1, tq / 0.004)
    m.place(th, t, 0.17 + 0.08 * i / 14, 0)
    m.place(th * 0.7, t + 0.24, 0.12 + 0.06 * i / 14, 0)
m.place(strings([note("A2"), note("E3"), note("A3"), note("C#4"), note("E4")], 5.5, att=2.2, rel=1.8, bright=2400), F(150 + 1235), 0.34)
motif(F(150 + 1235), 0.5, 0.6, 0, 0)
for i in range(30):
    m.place(bip(88 + i, 0.05), F(150 + 1312) + i * 0.012 * (30 - i) / 15 + 0.0, 0.05 - 0.001 * i)
m.place(whoosh(0.5, 4000, 200), F(150 + 1336), 0.14)

m.write("/tmp/parte1_raw.wav")
