#!/usr/bin/env python3
"""Instantané des balises FFVL pour le choix de la balise d'un site.

Le téléphone lit les relevés en direct, mais ils ne donnent ni le nom ni la position
d'une balise. On embarque donc la liste, réduite au nécessaire, et on relance ce script
de temps en temps :

    python3 tools/ffvl_snapshot.py

Les balises OpenWindMap sont écartées : la FFVL ne publie pas leurs relevés, l'appli
les lit chez Pioupiou. Les contacts du fichier d'origine ne sont pas repris.

Source : FFVL, sur data.gouv.fr, Licence Ouverte Etalab.
"""
import json
import urllib.request
from pathlib import Path

API = "https://www.data.gouv.fr/api/1/datasets/r/8d795154-9145-4ab2-99de-6768a36f31ea"
OUT = Path(__file__).resolve().parent.parent / "balises-ffvl.json"


def main():
    req = urllib.request.Request(API, headers={"User-Agent": "deco-pwa (instantané perso)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    # Une ligne par balise : n° FFVL, nom, lat, lon, altitude
    rows = [[b["idBalise"], b["nom"].strip(), round(float(b["latitude"]), 5), round(float(b["longitude"]), 5), b.get("altitude")]
            for b in data if b.get("station_type") != "OPENWINDMAP" and b.get("latitude") and b.get("longitude")]
    rows.sort(key=lambda r: r[0])
    OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(rows)} balises → {OUT.name} ({OUT.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
