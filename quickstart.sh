#!/bin/bash
# ⚡ COMMANDES RAPIDES - LexPar Map v2

# 📍 Définir le répertoire du projet
PROJECT_DIR="/Users/christophedubois/Library/Mobile Documents/com~apple~CloudDocs/LexPar_map_v2"

# ============================================
# 🚀 DÉMARRAGE RAPIDE
# ============================================

# 1️⃣ Lancer serveur local
function start_server() {
    cd "$PROJECT_DIR"
    echo "🚀 Démarrage serveur sur http://localhost:8000"
    python3 -m http.server 8000
}

# 2️⃣ Ouvrir dans navigateur
function open_app() {
    open "http://localhost:8000"
}

# ============================================
# 📱 TESTER SUR APPAREIL MOBILE
# ============================================

# 3️⃣ Obtenir IP locale
function get_local_ip() {
    IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
    echo "📍 IP locale: $IP"
    echo "🔗 Accès mobile: http://$IP:8000"
}

# ============================================
# 💾 SAUVEGARDE
# ============================================

# 4️⃣ Sauvegarder avec Git
function backup_git() {
    cd "$PROJECT_DIR"
    echo "📤 Commit et push Git..."
    git add -A
    git commit -m "Backup auto: $(date +%Y%m%d_%H%M%S)" || echo "Rien à commiter"
    git push origin main 2>/dev/null || echo "⚠️  Git remote pas configuré"
}

# 5️⃣ Sauvegarder localement
function backup_local() {
    BACKUP_DIR="$HOME/Desktop/LexPar_Backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"
    
    echo "💾 Compression en cours..."
    tar --exclude='.git' --exclude='node_modules' --exclude='.DS_Store' \
        -czf "$BACKUP_DIR/LexPar_v2_${TIMESTAMP}.tar.gz" \
        -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"
    
    echo "✅ Sauvegarde: $BACKUP_DIR/LexPar_v2_${TIMESTAMP}.tar.gz"
}

# 6️⃣ Sauvegarder complète
function backup_all() {
    echo "🔄 Sauvegarde complète..."
    backup_git
    backup_local
}

# ============================================
# 📊 STATISTIQUES
# ============================================

# 7️⃣ Info projet
function project_info() {
    cd "$PROJECT_DIR"
    echo "📊 STATISTIQUES LEXPAR MAP v2"
    echo "================================"
    echo ""
    echo "📁 Taille répertoire:"
    du -sh .
    echo ""
    echo "📄 Fichiers"
    find . -maxdepth 1 -type f | wc -l | xargs echo "Total files:"
    echo ""
    echo "📈 Code:"
    echo "JavaScript:"
    wc -l app.js | awk '{print $1 " lignes"}'
    echo "CSS:"
    wc -l styles.css | awk '{print $1 " lignes"}'
    echo "HTML:"
    wc -l index.html | awk '{print $1 " lignes"}'
}

# ============================================
# 🧪 DÉVELOPPEMENT
# ============================================

# 8️⃣ Ouvrir VS Code
function open_vscode() {
    cd "$PROJECT_DIR"
    code .
}

# 9️⃣ Lister fichiers du projet
function list_files() {
    cd "$PROJECT_DIR"
    echo "📂 Fichiers du projet:"
    find . -maxdepth 1 \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.sh" \) | sort
}

# 🔟 Valider JavaScript
function validate_js() {
    echo "✅ Validation JavaScript..."
    node -c app.js && echo "Syntaxe OK" || echo "Erreur détectée"
}

# ============================================
# 🔍 DEBUGGING
# ============================================

# 1️⃣1️⃣ Voir logs serveur
function server_logs() {
    cd "$PROJECT_DIR"
    python3 -m http.server 8000 2>&1 | tee server.log
}

# 1️⃣2️⃣ Voir fichiers JSON
function check_json() {
    echo "✅ Vérification fichiers JSON..."
    
    for file in *.json; do
        echo -n "$file: "
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            echo "✅ Valide"
        else
            echo "❌ Erreur!"
        fi
    done
}

# ============================================
# 📚 DOCUMENTATION
# ============================================

# 1️⃣3️⃣ Afficher README
function show_readme() {
    less "$PROJECT_DIR/README.md"
}

# 1️⃣4️⃣ Afficher guide test
function show_test_guide() {
    less "$PROJECT_DIR/GUIDE_TEST_MOBILE.md"
}

# 1️⃣5️⃣ Afficher optimisations
function show_optimizations() {
    less "$PROJECT_DIR/OPTIMISATIONS_MOBILES.md"
}

# ============================================
# 🎯 MENUS
# ============================================

function show_menu() {
    clear
    echo "⚡ LEXPAR MAP v2 - COMMANDES RAPIDES"
    echo "======================================"
    echo ""
    echo "🚀 DÉMARRAGE"
    echo "  1) start_server          - Lancer serveur (port 8000)"
    echo "  2) open_app              - Ouvrir navigateur"
    echo "  3) get_local_ip          - Afficher IP pour mobile"
    echo ""
    echo "📁 DÉVELOPPEMENT"
    echo "  4) open_vscode           - Ouvrir VS Code"
    echo "  5) list_files            - Lister fichiers projet"
    echo "  6) validate_js           - Vérifier syntaxe JS"
    echo "  7) check_json            - Vérifier fichiers JSON"
    echo ""
    echo "💾 SAUVEGARDE"
    echo "  8) backup_git            - Backup Git + Push"
    echo "  9) backup_local          - Backup compressé"
    echo "  10) backup_all           - Backup complète"
    echo ""
    echo "📊 INFO"
    echo "  11) project_info         - Statistiques"
    echo "  12) server_logs          - Logs serveur (tee)"
    echo ""
    echo "📚 DOCUMENTATION"
    echo "  13) show_readme          - Lire README"
    echo "  14) show_test_guide      - Lire guide test"
    echo "  15) show_optimizations   - Lire optimisations"
    echo ""
    echo "======================================"
    echo "Utilisation: Copier la commande et exécuter dans terminal"
    echo ""
}

# ============================================
# ALIAS RAPIDES (À ajouter dans ~/.zshrc)
# ============================================

# Décommenter et ajouter à ~/.zshrc:
# alias lexpar-start='cd "$PROJECT_DIR" && python3 -m http.server 8000'
# alias lexpar-open='open http://localhost:8000'
# alias lexpar-backup='cd "$PROJECT_DIR" && git add -A && git commit -m "Auto backup" && git push'
# alias lexpar-code='code "$PROJECT_DIR"'
# alias lexpar-ip='ipconfig getifaddr en0'

# ============================================
# AFFICHER MENU
# ============================================

if [ "$1" == "--menu" ]; then
    show_menu
else
    echo "ℹ️  Utilisation: source quickstart.sh [--menu]"
    echo ""
    echo "Commandes disponibles:"
    echo "  start_server      - Lancer serveur"
    echo "  open_app          - Ouvrir navigateur"
    echo "  get_local_ip      - Afficher IP locale"
    echo "  backup_all        - Sauvegarder"
    echo "  project_info      - Statistiques"
    echo "  open_vscode       - VS Code"
    echo ""
    echo "Afficher menu complet: source quickstart.sh --menu"
fi
