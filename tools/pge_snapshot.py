#!/usr/bin/env python3
"""Instantané des décos ParaglidingEarth pour la recherche par nom dans « Mes sites ».

L'API ParaglidingEarth n'a ni recherche par nom ni en-têtes CORS : le téléphone ne
peut pas l'interroger depuis github.io. On embarque donc la liste, réduite au
nécessaire, et on relance ce script de temps en temps :

    python3 tools/pge_snapshot.py            # France
    python3 tools/pge_snapshot.py fr ch it   # plusieurs pays

Données © contributeurs ParaglidingEarth, CC BY-SA 3.0.
"""
import json
import sys
import urllib.request
from pathlib import Path

API = "https://www.paraglidingearth.com/api/geojson/getCountrySites.php?iso={}"
DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
OUT = Path(__file__).resolve().parent.parent / "sites-fr.json"


def fetch(iso):
    req = urllib.request.Request(API.format(iso), headers={"User-Agent": "deco-pwa (instantané perso)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)["features"]


def row(f):
    p, (lon, lat) = f["properties"], f["geometry"]["coordinates"][:2]
    alt = p.get("takeoff_altitude")
    # Une ligne par déco : nom, lat, lon, altitude, orientations N→NO (2 principale, 1 possible, 0 non), n° PGE
    return [p["name"].strip(), round(float(lat), 5), round(float(lon), 5),
            int(float(alt)) if alt not in (None, "") else None,
            "".join(str(p.get(d) or "0") for d in DIRS), int(p["pge_site_id"])]


def main(isos):
    rows = [row(f) for iso in isos for f in fetch(iso) if f["properties"].get("paragliding") != "0"]
    rows.sort(key=lambda r: r[0].lower())
    OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(rows)} décos → {OUT.name} ({OUT.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main([a.lower() for a in sys.argv[1:]] or ["fr"])
