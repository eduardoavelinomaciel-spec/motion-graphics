"""6 Shorts verticais (1080x1920) a partir do vídeo completo. Uso: python3 scripts/shorts.py [n ...]"""
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
SRC = "out/elias_completo.mp4"
FONT = "/tmp/bangers.ttf"
W, H = 1080, 1920
Y, S = "#FFD23F", "#FFFFFF"

def txt(lines, size, color=S, stroke=10, w=W, pad=40):
    """lines: lista de linhas; cada linha pode ser lista de (palavra, cor). Devolve imagem RGBA."""
    f = ImageFont.truetype(FONT, size)
    lh = int(size * 1.08)
    im = Image.new("RGBA", (w, lh * len(lines) + pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines):
        parts = ln if isinstance(ln, list) else [(ln, color)]
        full = " ".join(p for p, _ in parts)
        tw = d.textlength(full, font=f)
        x = (w - tw) / 2
        for p, c in parts:
            d.text((x + 6, i * lh + 14), p, font=f, fill="#10141f", stroke_width=stroke, stroke_fill="#10141f")
            d.text((x, i * lh + 8), p, font=f, fill=c, stroke_width=stroke, stroke_fill="#10141f")
            x += d.textlength(p + " ", font=f)
    return im

# cada short: segmentos (início, fim) em segundos do vídeo completo, crop x, gancho, legendas (t0,t1,linhas), pergunta final
SHORTS = [
 dict(n=1, seg=[(153, 191)], x=480,
  hook=[[("ELA PERDEU O BALÃO.", S)], [("ELE CHOROU JUNTO.", Y)]],
  caps=[(3, 8, ["O vento levou."]), (9, 15, ["Ela chorou sem fazer barulho."]), (15, 23, ["Ele sente tudo", "o que ela sente."]), (23, 31, ["Um desconhecido", "viu também."]), (31, 36, ["Ela voltou a sorrir."])],
  end=[["Quem te ajudou", "quando você chorou?"], ["COMENTA O NOME"]]),
 dict(n=2, seg=[(209, 247)], x=420,
  hook=[[("O VELHINHO ESTAVA", S)], [("SOZINHO HÁ ANOS.", Y)]],
  caps=[(3, 9, ["Ninguém perguntou", "como ele estava."]), (10, 17, ["Elias sentou", "sem dizer nada."]), (17, 24, ["Ele sentiu o luto", "no próprio peito."]), (25, 33, ["Às vezes, só estar", "perto já basta."])],
  end=[["Quem na sua vida", "precisa de companhia hoje?"], ["MARCA AQUI"]]),
 dict(n=3, seg=[(251, 289)], x=420,
  hook=[[("TODO MUNDO DESCARREGA", S)], [("NELE.", Y)]],
  caps=[(3, 10, ["Pressa. Tristeza. Medo."]), (10, 18, ["Cada pessoa deixa", "um peso."]), (18, 27, ["E ninguém olha", "pra ele."]), (28, 36, ["Você é a pessoa", "forte da família?"])],
  end=[["Quem pergunta", "como VOCÊ está?"], ["COMENTA 'EU'"]]),
 dict(n=4, seg=[(299, 320), (335, 345)], x=420,
  hook=[[("ATÉ QUE", S)], [("ALGUÉM PERCEBEU.", Y)]],
  caps=[(3, 9, ["Ela sentou ao lado."]), (9, 15, ["Pegou a mão dele."]), (15, 21, ["E ele finalmente", "pôde chorar."])],
  end=[["Marque quem cuida", "de você"], ["COMPARTILHE"]]),
 dict(n=5, seg=[(110, 148)], x=420,
  hook=[[("O PADEIRO CHORAVA", S)], [("POR DENTRO.", Y)]],
  caps=[(3, 9, ["Ninguém reparou."]), (9, 17, ["Um estranho", "sentiu a dor dele."]), (18, 26, ["Um pão quente.", "Um gesto."]), (28, 36, ["O primeiro sorriso", "em muito tempo."])],
  end=[["Qual gesto pequeno", "mudou o seu dia?"], ["CONTA AQUI"]]),
 dict(n=6, seg=[(3, 41)], x=420,
  hook=[[("ESSE HOMEM SENTE", S)], [("O QUE VOCÊ SENTE.", Y)]],
  caps=[(3, 10, ["Cada cor", "é um sentimento."]), (11, 19, ["Ele atravessa a rua", "absorvendo tudo."]), (20, 29, ["E ninguém", "percebe."]), (30, 36, ["Você já se sentiu", "assim?"])],
  end=[["Reparou nos pixels?", "Assista de novo"], ["E COMENTA SUA COR"]]),
]

TEASE = {1: 'ESPERE O FINAL: O QUE O DESCONHECIDO FEZ', 2: 'NO FINAL, O VELHINHO FAZ ALGO RARO', 3: 'NO FINAL, ELE NÃO AGUENTA MAIS', 4: 'NO FINAL: A PERGUNTA QUE MUDA TUDO', 5: 'NO FINAL: O PRIMEIRO SORRISO DELE', 6: 'NO FINAL: UMA PERGUNTA SÓ PRA VOCÊ'}
ZOOMS = [1.0, 1.4, 1.0, 1.5, 1.2, 1.0, 1.45, 1.0, 1.35, 1.0, 1.5, 1.0]
SHIFT = [0, -90, 0, 80, 40, 0, -60, 0, 70, 0, -40, 0]

def pieces(seg, step=3.0):
    out = []
    k = 0
    for a, b in seg:
        t = a
        while t < b - 0.01:
            e = min(b, t + step) if b - (t + step) > 1.2 else b
            out.append((t, e, ZOOMS[k % len(ZOOMS)], SHIFT[k % len(SHIFT)]))
            t = e; k += 1
    return out

def build(s):
    dur = sum(b - a for a, b in s["seg"])
    ps = pieces(s["seg"])
    P = len(ps); n = len(s["seg"])
    x = s["x"]
    inputs = ["-i", SRC]
    parts = [f"[0:v]split={P}" + "".join(f"[s{i}]" for i in range(P))]
    for i, (t0, t1, z, sh) in enumerate(ps):
        cs = int(1080 / z); cx = max(0, min(1920 - cs, x + 540 - cs // 2 + sh)); cy = max(0, min(1080 - cs, 500 - cs // 2))
        parts.append(f"[s{i}]trim={t0}:{t1},setpts=PTS-STARTPTS,crop={cs}:{cs}:{cx}:{cy},scale=1080:1080:flags=lanczos[p{i}]")
    parts.append("".join(f"[p{i}]" for i in range(P)) + f"concat=n={P}:v=1:a=0[fgc]")
    parts.append(f"[0:a]asplit={n}" + "".join(f"[q{i}]" for i in range(n)))
    for i, (t0, t1) in enumerate(s["seg"]):
        parts.append(f"[q{i}]atrim={t0}:{t1},asetpts=PTS-STARTPTS[a{i}]")
    parts.append("".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[ca]")
    parts.append(f"[fgc]split[fg1][bgs];[bgs]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:6,eq=brightness=-0.18:saturation=1.2[b];[b][fg1]overlay=0:430[base]")
    # overlays
    ovs = []
    def add(im, name, x0, y0, t0, t1):
        p = f"/tmp/ov/s{s['n']}_{name}.png"; im.save(p); ovs.append((p, x0, y0, t0, t1))
    add(txt(s["hook"], 112), "hook", 0, 130, 0, 3.2)
    add(txt([[("O HOMEM QUE SENTIA TUDO", "#F4F1EA")]], 56, stroke=7), "tag", 0, 120, 3.2, 5.6)
    tz = TEASE[s["n"]].split(": ") if ": " in TEASE[s["n"]] else ["", TEASE[s["n"]]]
    tl = [[(w, Y)] for w in ([TEASE[s["n"]][:TEASE[s["n"]].index(" ", 14)], TEASE[s["n"]][TEASE[s["n"]].index(" ", 14)+1:]])]
    add(txt(tl, 100), "tease", 0, 130, 5.6, 9.8)
    add(txt([[("FIQUE ATÉ O FINAL  >>", Y)]], 60, stroke=7), "stay", 0, 120, 9.8, dur - 4.5)
    for k, (t0, t1, lines) in enumerate(s["caps"]):
        if t0 < dur - 4.6: add(txt(lines, 92), f"cap{k}", 0, 1560, t0, min(t1, dur - 4.6))
    e = s["end"]
    add(txt(e[0], 92), "end0", 0, 1540, dur - 4.5, dur)
    add(txt(e[1], 116, color=Y), "end1", 0, 190, dur - 4.5, dur)
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + inputs
    for p, *_ in ovs: cmd += ["-i", p]
    last = "base"
    for i, (p, x0, y0, t0, t1) in enumerate(ovs):
        idx = 1 + i
        parts.append(f"[{last}][{idx}:v]overlay={x0}:{y0}:enable='between(t,{t0},{t1})'[o{i}]")
        last = f"o{i}"
    parts.append(f"[{last}]drawbox=x=0:y=1904:w='1080*t/{dur}':h=16:color=0xFFD23F@0.95:t=fill[outv]")
    parts.append(f"[ca]afade=t=in:d=0.25,afade=t=out:st={dur-0.6}:d=0.6[outa]")
    cmd += ["-filter_complex", ";".join(parts), "-map", "[outv]", "-map", "[outa]", "-t", str(dur), "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", f"out/shorts/short{s['n']}.mp4"]
    subprocess.run(cmd, check=True)
    print("ok", s["n"], dur)

if __name__ == "__main__":
    sel = [int(a) for a in sys.argv[1:]] or [s["n"] for s in SHORTS]
    for s in SHORTS:
        if s["n"] in sel: build(s)
