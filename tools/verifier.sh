#!/usr/bin/env bash
# Vérifications avant commit, sans framework : un serveur local, Chrome sans fenêtre et le banc d'essai.
#
#   tools/verifier.sh               tous les contrôles
#   tools/verifier.sh --accepter    une règle a changé exprès : réécrit tools/attendu.txt (à relire dans git diff)
#   tools/verifier.sh --lighthouse  ajoute un audit Lighthouse (performance, accessibilité…, seuil 90)
#
# Sort en erreur si un contrôle échoue.
set -u
cd "$(dirname "$0")/.."

PORT=8790
CHROME=(google-chrome --headless=new --disable-gpu --no-sandbox)
ACCEPTER=0; LIGHTHOUSE=0
for a in "$@"; do
  case "$a" in --accepter) ACCEPTER=1 ;; --lighthouse) LIGHTHOUSE=1 ;; *) echo "option inconnue : $a"; exit 2 ;; esac
done

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill "$SRV" 2>/dev/null' EXIT
sleep 1

KO=0
ok() { echo "OK $*"; }
ko() { echo "KO $*"; KO=1; }

# Lance une étape du banc et renvoie le texte de son résultat
banc() {
  "${CHROME[@]}" --virtual-time-budget=60000 --dump-dom "http://localhost:$PORT/tools/banc.html#$1" 2>/dev/null \
    | python3 -I -c 'import sys, re, html; m = re.search(r"<pre id=\"out\">(.*?)</pre>", sys.stdin.read(), re.S); print(html.unescape(m.group(1)) if m else "KO pas de réponse du banc")'
}

echo "— Verdicts sur la prévision figée"
banc verdicts | python3 -I tools/verdicts_texte.py > /tmp/deco-verdicts.txt || ko "verdicts illisibles"
if [ "$ACCEPTER" = 1 ]; then
  cp /tmp/deco-verdicts.txt tools/attendu.txt
  ok "tools/attendu.txt réécrit ($(wc -l < tools/attendu.txt) lignes) : relis git diff tools/attendu.txt"
elif diff -q tools/attendu.txt /tmp/deco-verdicts.txt >/dev/null; then
  ok "verdicts identiques à tools/attendu.txt ($(wc -l < tools/attendu.txt) lignes)"
else
  ko "verdicts différents de tools/attendu.txt ($(diff tools/attendu.txt /tmp/deco-verdicts.txt | grep -c '^>') lignes changées) :"
  diff tools/attendu.txt /tmp/deco-verdicts.txt | head -12 | sed 's/^/     /'
  echo "     (changement voulu ? tools/verifier.sh --accepter)"
fi

echo "— Parcours"
while IFS= read -r l; do case "$l" in OK*) echo "$l" ;; *) ko "${l#KO }" ;; esac; done < <(banc parcours)

echo "— Réseau lent"
while IFS= read -r l; do case "$l" in OK*) echo "$l" ;; *) ko "${l#KO }" ;; esac; done < <(banc lent)

echo "— Service worker"
python3 -I - <<'EOF' || KO=1
import pathlib, re, sys
sw = pathlib.Path("sw.js").read_text()
shell = re.findall(r'"\./([^"]*)"', sw.split("SHELL = [")[1].split("];")[0])
manque = [p for p in shell if p and not pathlib.Path(p).is_file()]
appli = ["index.html", "style.css", "manifest.webmanifest", "sites-fr.json"] + sorted(str(p) for p in pathlib.Path("js").glob("*.js"))
oublie = [p for p in appli if p not in shell]
print("OK" if not manque else "KO", "fichiers de SHELL présents" + (f" : absents {manque}" if manque else ""))
print("OK" if not oublie else "KO", "fichiers de l'appli dans SHELL" + (f" : oubliés {oublie} (l'appli ne s'ouvrirait plus hors ligne)" if oublie else ""))
sys.exit(1 if manque or oublie else 0)
EOF
# Toute modification de l'appli doit changer CACHE, sinon les téléphones gardent l'ancienne version
if ! git diff --quiet HEAD -- index.html style.css js manifest.webmanifest sites-fr.json sw.js icons 2>/dev/null; then
  avant=$(git show HEAD:sw.js | grep -o 'CACHE = "[^"]*"'); apres=$(grep -o 'CACHE = "[^"]*"' sw.js)
  if [ "$avant" != "$apres" ]; then ok "CACHE changé ($avant → $apres)"; else ko "l'appli a changé mais pas CACHE dans sw.js ($apres)"; fi
else
  ok "appli inchangée depuis le dernier commit"
fi

if [ "$LIGHTHOUSE" = 1 ]; then
  echo "— Lighthouse"
  lighthouse "http://localhost:$PORT/" --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=/tmp/deco-lh.json >/dev/null 2>&1
  python3 -I - <<'EOF' || KO=1
import json, sys
r = json.load(open("/tmp/deco-lh.json"))
bad = 0
for c in r["categories"].values():
    s = round(c["score"] * 100); bad |= s < 90
    print("OK" if s >= 90 else "KO", f"{c['title']} : {s}")
sys.exit(bad)
EOF
fi

echo
if [ "$KO" = 0 ]; then echo "Tout est bon."; else echo "Au moins un contrôle a échoué."; fi
exit "$KO"
