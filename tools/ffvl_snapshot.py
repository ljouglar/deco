#!/usr/bin/env python3
"""Instantanés FFVL : les balises pour le choix de la balise d'un site, les terrains pour leurs consignes.

Le téléphone lit les relevés en direct, mais ils ne donnent ni le nom ni la position
d'une balise ; le fichier des terrains pèse près de 4 Mo. On embarque donc les deux
listes, réduites au nécessaire, et on relance ce script de temps en temps :

    python3 tools/ffvl_snapshot.py

Les balises OpenWindMap sont écartées : la FFVL ne publie pas leurs relevés, l'appli
les lit chez Pioupiou. Les champs de contact des fichiers d'origine ne sont pas repris. Les consignes
gardent leur texte : il peut citer le téléphone à appeler avant de voler.

Source : FFVL, sur data.gouv.fr, Licence Ouverte Etalab.
"""
import datetime
import json
import urllib.request
from pathlib import Path

API = "https://www.data.gouv.fr/api/1/datasets/r/8d795154-9145-4ab2-99de-6768a36f31ea"
API_TERRAINS = "https://www.data.gouv.fr/api/1/datasets/r/4375c95d-cf26-4e71-b72d-2e09be5a0e36"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "balises-ffvl.json"
OUT_TERRAINS = ROOT / "terrains-ffvl.json"
VIDE = {"", ".", "ras", "r.a.s", "r.a.s.", "aucun", "aucune", "néant", "neant", "sans objet", "non", "rien"}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "deco-pwa (instantané perso)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def texte(v):
    v = (v or "").strip()
    return "" if v.lower() in VIDE else v


def terrains():
    # Une ligne par terrain de parapente : n° FFVL, nom, lat, lon, altitude, statut, fonctions, vents favorables,
    # niveau conseillé, restrictions, dangers, règles de vol
    rows = [[t["suid"], t["toponym"].strip(), t["latitude"], t["longitude"], t.get("altitude"), t["status"],
             t.get("flying_functions_text") or "", t.get("wind_orientations_ok") or "", t.get("terrain_experience_conseillee") or "",
             texte(t.get("restrictions")), texte(t.get("warnings")), texte(t.get("flying_rules_description"))]
            for t in fetch(API_TERRAINS) if "parapente" in (t.get("possible_usages_text") or "") and t.get("latitude") and t.get("longitude")]
    rows.sort(key=lambda r: r[0])
    data = {"date": datetime.date.today().isoformat(), "rows": rows}
    OUT_TERRAINS.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(rows)} terrains → {OUT_TERRAINS.name} ({OUT_TERRAINS.stat().st_size // 1024} Ko)")


def main():
    data = fetch(API)
    # Une ligne par balise : n° FFVL, nom, lat, lon, altitude
    rows = [[b["idBalise"], b["nom"].strip(), round(float(b["latitude"]), 5), round(float(b["longitude"]), 5), b.get("altitude")]
            for b in data if b.get("station_type") != "OPENWINDMAP" and b.get("latitude") and b.get("longitude")]
    rows.sort(key=lambda r: r[0])
    OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(rows)} balises → {OUT.name} ({OUT.stat().st_size // 1024} Ko)")
    terrains()


if __name__ == "__main__":
    main()
