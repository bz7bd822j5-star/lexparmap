#!/bin/bash
# 📦 Script de Sauvegarde LexPar Map v2
# Sauvegarde complète du projet avec Git (recommandé)

set -e  # Exit on error

PROJECT_DIR="/Users/christophedubois/Library/Mobile Documents/com~apple~CloudDocs/LexPar_map_v2"
BACKUP_DIR="$HOME/Desktop/LexPar_Backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Sauvegarde LexPar Map v2"
echo "================================"

# 1️⃣ Vérifier si Git est initialisé
cd "$PROJECT_DIR"

if [ ! -d .git ]; then
    echo "❌ Git non initialisé"
    echo "📝 Initialiser Git:"
    echo ""
    echo "  cd \"$PROJECT_DIR\""
    echo "  git init"
    echo "  git config user.name \"Christophe Dubois\""
    echo "  git config user.email \"votre-email@example.com\""
    echo "  git add ."
    echo "  git commit -m 'v2.0 - Mobile Optimized'"
    echo "  git remote add origin https://github.com/votre-user/lexparmap.git"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi

# 2️⃣ Sauvegarder avec Git
echo "✅ Projet avec Git détecté"
echo "📤 Préparation commit..."

git add -A
git commit -m "Auto-backup: $TIMESTAMP" || echo "ℹ️  Rien à commiter"

# 3️⃣ Sauvegarder en local aussi
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/LexPar_v2_${TIMESTAMP}.tar.gz"
echo "💾 Compression en $BACKUP_FILE..."

tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    -czf "$BACKUP_FILE" \
    -C "$(dirname "$PROJECT_DIR")" \
    "$(basename "$PROJECT_DIR")"

echo "✅ Sauvegarde complète: $BACKUP_FILE"

# 4️⃣ Nettoyer anciennes sauvegardes (garder 5 dernières)
echo "🧹 Nettoyage anciennes sauvegardes..."
ls -t "$BACKUP_DIR"/LexPar_v2_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f || true

# 5️⃣ Résumé
echo ""
echo "📊 Résumé:"
echo "  Projet:     $PROJECT_DIR"
echo "  Sauvegardes: $BACKUP_DIR"
echo "  Dernière:   $BACKUP_FILE"
echo ""
echo "✨ Sauvegarde réussie!"
echo ""
echo "📌 Prochaines étapes (Git):"
echo "  git log --oneline | head -5"
echo "  git push origin main  # Si remote configuré"
