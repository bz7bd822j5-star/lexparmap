#!/usr/bin/env bash
set -euo pipefail

# prepare_deploy.sh
# Usage:
#   ./prepare_deploy.sh        -> crée dist/ avec fichiers essentiels et zip site-deploy.zip
#   ./prepare_deploy.sh --all-data -> copie tout le dossier data/

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

DIST=dist
ZIP_NAME=site-deploy.zip

echo "Préparation du dossier $DIST pour déploiement..."

rm -rf "$DIST"
mkdir -p "$DIST"

# Copier les fichiers de base
for f in index.html app.js styles.css; do
  if [ -f "$f" ]; then
    cp "$f" "$DIST/"
    echo "copié: $f"
  else
    echo "ATTENTION: $f introuvable (vérifiez que vous êtes à la racine du projet)"
  fi
done

# Par défaut on copie seulement les JSON chargés par app.js
COPY_ALL_DATA=false
if [ "${1:-}" = "--all-data" ]; then
  COPY_ALL_DATA=true
fi

if [ "$COPY_ALL_DATA" = true ]; then
  if [ -d data ]; then
    cp -R data "$DIST/"
    echo "Copié tout le dossier data/"
  else
    echo "Aucun dossier data/ trouvé"
  fi
else
  mkdir -p "$DIST/data"
  for jf in data/terrasses.json data/travaux.json data/perturbants.json data/arretes_map.json; do
    if [ -f "$jf" ]; then
      cp "$jf" "$DIST/data/"
      echo "copié: $jf"
    else
      echo "(optionnel) $jf non trouvé"
    fi
  done
fi

echo "Création de $ZIP_NAME..."
cd "$DIST"
rm -f ../$ZIP_NAME
zip -r ../$ZIP_NAME . >/dev/null
cd - >/dev/null

echo "Fichier généré: $ZIP_NAME ($(du -h $ZIP_NAME | cut -f1))"
echo "Prêt: déposez $ZIP_NAME sur Netlify (drag & drop) ou connectez le repo git." 

echo "Astuce: pour inclure d'autres assets, ajoutez-les au script ou utilisez --all-data pour tout copier." 

exit 0
