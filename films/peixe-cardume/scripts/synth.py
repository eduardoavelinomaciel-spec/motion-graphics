"""Shared synth voices for the score (deterministic)."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)
N = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
N.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def note(s): return 12 * (int(s[-1]) + 1) + N[s[:-1]]

class Mix:
    def __init__(self, dur):
        self.dur = dur
        self.buf = np.zeros((int(SR * dur) + SR * 2, 2))
    def place(self, sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= len(self.buf) or i < 0: return
        sig = sig[: len(self.buf) - i]
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        self.buf[i:i + len(sig), 0] += sig * gain * l * 1.414
        self.buf[i:i + len(sig), 1] += sig * gain * r * 1.414
    def write(self, path, cut_at=None):
        import wave
        m = self.buf[: int(SR * self.dur)].copy()
        m[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))[:, None]
        m = m / max(1e-9, np.abs(m).max()) * 0.89
        with wave.open(path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((m * 32767).astype("<i2").tobytes())

def lp(x, fc, order=2): return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)
def hp(x, fc, order=2): return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)

def env_adsr(n, a, d, s, r, hold):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    e[t < a] = t[t < a] / a
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / d
    rel = t >= hold
    e[rel] = s * np.exp(-(t[rel] - hold) / r)
    return e

def celesta(m, dur=1.6, decay=0.9):
    f = midi(m); n = int(SR * dur); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / decay)
         + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / (decay * 0.55))
         + 0.12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / (decay * 0.33))
         + 0.18 * np.sin(2 * np.pi * 4.18 * f * t) * np.exp(-t / 0.12)
         + 0.08 * np.sin(2 * np.pi * 7.1 * f * t) * np.exp(-t / 0.04))
    return y * np.minimum(1, t / 0.002) * 0.5

def pizz(m, dur=0.9):
    f = midi(m); n = int(SR * dur); p = int(SR / f)
    buf = lp(rng.uniform(-1, 1, p), min(6000, f * 8))
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    t = np.arange(n) / SR
    return lp(out, 2500) * np.exp(-t / 0.35) * 0.9

def strings(ms, dur, att=0.05, rel=0.25, bright=2200, vib=5.2, trem=0.0):
    n = int(SR * (dur + rel * 3)); t = np.arange(n) / SR
    y = np.zeros(n)
    for m in ms:
        f = midi(m)
        for det in (-0.07, 0.0, 0.06):
            ph = 2 * np.pi * np.cumsum(f * 2 ** (det / 12) * (1 + 0.004 * np.sin(2 * np.pi * vib * t + rng.uniform(0, 6)))) / SR
            y += 2 * ((ph / (2 * np.pi)) % 1) - 1
    y = lp(y, bright, 2) / (len(ms) * 3)
    if trem: y *= 0.6 + 0.4 * np.sin(2 * np.pi * trem * t)
    return y * env_adsr(n, att, 0.1, 0.85, rel, dur)

def blup(f0, dur=0.22, up=1.7):
    n = int(SR * dur); t = np.arange(n) / SR
    f = f0 * (1 + (up - 1) * (1 - np.exp(-t / 0.035)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur / 3.2)) * np.minimum(1, t / 0.003)

def noise_burst(dur, fc):
    n = int(SR * dur); t = np.arange(n) / SR
    return lp(rng.uniform(-1, 1, n), fc) * np.exp(-t / (dur / 5))

def whoosh(dur, f0, f1, q=0.35):
    """band-passed noise sweeping f0→f1"""
    n = int(SR * dur); t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    out = np.zeros(n); blk = 512
    for i in range(0, n, blk):
        fc = f0 * (f1 / f0) ** (i / n)
        seg = bp(x[max(0, i - 2048): i + blk], fc * (1 - q), fc * (1 + q))
        out[i:i + blk] = seg[-len(out[i:i + blk]):]
    return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5

def bip(m, dur=0.09):
    """soft 8-bit square, filtered (guide: never shrill)"""
    f = midi(m); n = int(SR * dur); t = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * f * t))
    return lp(sq, 1800) * np.exp(-t / (dur / 2.5)) * 0.5

def echo(x, delay=0.33, fb=0.35, n=4):
    d = int(delay * SR)
    out = np.concatenate([x, np.zeros(d * n)])
    for k in range(1, n + 1):
        out[d * k: d * k + len(x)] += x * fb ** k
    return out

def drone(dur, ms, fc=500, beat=0.12):
    n = int(SR * dur); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * midi(m) * t) + 0.6 * np.sin(2 * np.pi * (midi(m) + beat) * t) for m in ms)
    y += lp(rng.uniform(-1, 1, n), 180) * 3
    return lp(y, fc) / (len(ms) * 2)
