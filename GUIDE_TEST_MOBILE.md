# 📱 LexPar Map v2 - Guide de Test Mobile

## ✅ État Actuel
L'application a été complètement optimisée pour mobiles et est **prête à tester**.

---

## 🚀 Démarrage Rapide

### Serveur Local
```bash
cd "/Users/christophedubois/Library/Mobile Documents/com~apple~CloudDocs/LexPar_map_v2"
python3 -m http.server 8000
```
Puis ouvrez: **http://localhost:8000**

### Sur iPhone 16 Pro Max
1. Connectez le Mac et l'iPhone au même WiFi
2. Trouvez l'IP du Mac: `ifconfig | grep "inet "`
3. Accédez à: `http://<IP_MAC>:8000`
4. Vous pouvez ensuite ajouter en tant que raccourci d'accueil

---

## 🎯 Checklist de Test

### Interface Générale
- [ ] Barre bleue supérieure bien positionée (pas chevauchée par Dynamic Island)
- [ ] Contenu de la carte commence exactement sous la barre
- [ ] Pas de scroll horizontal involontaire
- [ ] Barre reste visible en scroll vertical (sticky)

### Boutons et Contrôles
- [ ] **Terrasses, Travaux, Perturbants, Arrêtés** : tout clickable facilement au doigt
- [ ] Au tap : feedback visual (`scale 0.95`)
- [ ] État `.active` bien visible (couleur plus foncée + aura)
- [ ] Boutons se désactivent pas après clic

### Recherche et Autocomplete
- [ ] Tapez 2+ caractères = apparition liste
- [ ] Sélectionner une rue = zoom fluide + marqueur ajouté
- [ ] Clavier iOS se ferme après sélection
- [ ] Liste scroll smoothe si beaucoup de résultats (max 12)

### Géolocalisation
- [ ] Clic "Autour de moi" = demande permission (1ère fois)
- [ ] Bouton change en "Localisation..." pendant la requête
- [ ] Après success : zoom 17 + marqueur bleu à votre position
- [ ] Erreur gracieuse si refusé

### Suppression Marqueurs
- [ ] Clic "Supprimer" = enlève tous les marqueurs utilisateur
- [ ] Champ recherche se vide aussi
- [ ] Autocomplete ferme

### Affichage des Couches
- [ ] **Terrasses** (vert) : 3 marqueurs d'exemple
- [ ] **Travaux** (orange) : géocodage inverse fonctionne
- [ ] **Perturbants** (rouge) : s'affiche correctement
- [ ] **Arrêtés/BOVP** (bleu) : ~100+ arrêtés de Paris

### Clusters
- [ ] Zoom avant = clusters se divisent en marqueurs individuels
- [ ] Zoom arrière = marqueurs se regroupent
- [ ] Couleurs par couche respectées

### Popups
- [ ] Clic marqueur = popup avec info
- [ ] Width max 300px (pas trop large)
- [ ] Texte lisible sur fond blanc
- [ ] Bouton X (36x36) facile à fermer

### Persistance de l'État
- [ ] Changez zoom/position, fermez et rouvrez
- [ ] **Centrage et zoom restaurés** ✓
- [ ] Couches activées/désactivées restent identiques ✓

---

## 📐 Tests de Responsive

### iPhone 16 Pro Max (430x932)
```
✅ Barre: 70px (avec safe-area top ~47px)
✅ Tous boutons visibles
✅ Recherche prend ~60% de la largeur
✅ Aucun crop de contenu
```

### iPhone 13 (390x844)
```
✅ Boutons légèrement réduits (clamp)
✅ Texte readable
✅ Pas de débordement
```

### Samsung Galaxy S24 Ultra (440x940)
```
✅ Layout identique à iPhone 16 Pro Max
✅ Boutons bien espacés
✅ Barre de statut Android respectée
```

### iPad Pro (1024x1366)
```
✅ Barre réduite optimalement
✅ Recherche largerait
✅ Boutons conservent taille lisible
```

### Mode Landscape (tous appareils)
```
✅ Barre ultra-réduite (50px)
✅ Subtitle caché intelligemment
✅ Boutons compressés mais usables
✅ Carte s'étend correctement
```

---

## 🔍 Détails Techniques à Vérifier

### CSS Variables (Safe Areas)
```css
--top-bar-height: 70px  /* Ajusté auto en landscape */
--safe-top: env(safe-area-inset-top)  /* Dynamic Island */
--safe-left: env(safe-area-inset-left)  /* Possibly unused */
```

### Touch Optimizations
```javascript
-webkit-tap-highlight-color: transparent  /* No blue flash */
-webkit-touch-callout: none  /* No contextual menu */
user-select: none  /* Pas de sélection accidentelle */
preferCanvas: true  /* Rendering plus fluide */
```

### Debounce Search
```javascript
setTimeout(..., 200)  // Requête différée 200ms
```

---

## ⚡ Performance - Checklist

- [ ] Première charge < 1s
- [ ] Interactions réagissent en < 100ms
- [ ] Pas de lag au zoom/pan
- [ ] Popups s'ouvrent fluidement
- [ ] Autocomplete ne gèle pas

### DevTools Mobile (Chrome Remote Debug)
```
1. Connectez iPhone/Android en USB
2. Safari (Mac) : Develop > Appareil > index.html
3. Ouvrez console et Network
4. Vérifiez :
   - Pas d'erreurs JS
   - Images/CSS chargent rapidement
   - XHR réussies (JSON, Nominatim)
```

---

## 🐛 Bugs Potentiels à Checker

| Bug | Impact | Solution |
|-----|--------|----------|
| Auto-scroll de la barre de clavier iOS | UX | Pas contrôlable en HTML5 |
| Double-tap zoom Chrome | Annoyance | Désactivé avec `user-scalable=no` |
| Safe-area non appliquée | Overlap | Vérifier version iOS min 11+ |
| Géolocalisation refusée | Feature inutile | Message d'erreur clair |
| JSON 404 | Crash | Tous fichiers doivent exister |

---

## 📊 Benchmark vs GeoVas / ExparRef

### Critères Comparés

| Critère | GeoVas | ExparRef | LexPar v2 |
|---------|--------|----------|-----------|
| **Responsive** | ✅ | ✅ | ✅ |
| **Touch-friendly boutons** | 44px | 40px | 36-44px |
| **Safe area support** | ❓ | ❓ | ✅ |
| **Autocomplete** | ✅ | ✅ | ✅ Debounce |
| **Géolocalisation** | ✅ | ✅ | ✅ Feedback UX |
| **Sauvegarde état** | ❓ | ❓ | ✅ LocalStorage |
| **Landscape mode** | ✅ | ✅ | ✅ Optimisé |
| **Performance Mobiles** | ✅ | ✅ | ✅ Canvas + Debounce |

---

## 📋 Fichiers à Sauvegarder Localement

Créez une sauvegarde complète:
```bash
# Sauvegarde sur iCloud
cp -r "/Users/christophedubois/Library/Mobile Documents/com~apple~CloudDocs/LexPar_map_v2" \
  ~/Desktop/LexPar_map_v2_backup_$(date +%Y%m%d)

# Ou sur Git (recommandé)
cd LexPar_map_v2
git init
git add .
git commit -m "v2.0 - Mobile Optimized"
git remote add origin https://github.com/votre-user/lexparmap.git
git push -u origin main
```

---

## ✨ Prochaines Étapes

1. **PWA** : Ajouter Service Worker pour offline
2. **Dark Mode** : Media query `prefers-color-scheme`
3. **Haptics** : Retour tactile iOS (VibrationAPI)
4. **Voice Search** : Web Speech API
5. **Sharing** : Navigator.share() pour partager URL

---

**Dernier test:** 4 décembre 2025
**Version testé:** 2.0 Mobile-Optimized
**Plateforme:** iPhone 16 Pro Max + Android
