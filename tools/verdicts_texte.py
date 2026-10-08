#!/usr/bin/env python3
"""Met en texte les verdicts du banc d'essai (tools/banc.html#verdicts), une ligne par jour et par heure.

Le texte se relit dans un diff git : quand une règle change, on voit quels sites, quels jours et quelles
heures basculent, et pourquoi.
"""
import json
import sys

NIV = {0: "vert  ", 1: "orange", 2: "rouge ", None: "–     "}
MODELE = {"meteofrance_seamless": "MF", "icon_seamless": "ICON", "ecmwf_ifs025": "ECMWF"}


def creneau(w):
    return f"{w['from']}–{w['to'] + 1} h" if w else "pas de créneau"


for site in json.load(sys.stdin):
    for d in site["days"]:
        v = d["verdict"] if "verdict" in d else d["v"]
        mod = " ".join(f"{MODELE[m]}:{NIV[l].strip()}" for m, l, _ in d["models"])
        accord = "accord" if d["agree"]["same"] else f"désaccord ({d['agree']['n']} modèles)"
        print(f"{site['id']} {d['date']} JOUR {NIV[v['level']]} {v['title']} · {creneau(v['win'])}"
              f" · {', '.join(v['top']) or '-'} · {mod} · {accord}")
        for hour, past, level, base, reasons, ens in d["hours"]:
            raisons = " ; ".join(f"{NIV[l].strip()} {msg}" for l, _, msg in reasons)
            vents = " ".join("-" if ws is None else f"{round(ws)}/{round(wg)}" for ws, wg in ens)
            print(f"{site['id']} {d['date']} {hour:02d}h {NIV[level]}{' passée' if past else ''}"
                  f"{f' · base {round(base)} m' if base is not None else ''} · {raisons} · vents {vents}")
