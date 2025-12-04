# ⚙️ Configuration LexPar Map v2

## 🌍 URLs Externes

### API Nominatim (Géocodage)
```
URL: https://nominatim.openstreetmap.org
Endpoints utilisés:
  - /search?q=...&format=json
  - /reverse?lat=...&lon=...&format=json
Rate limit: 1 requête/seconde (OK pour usage normal)
User-Agent: "LexParMap"
```

### Tiles OpenStreetMap
```
URL: https://tile.openstreetmap.org/{z}/{x}/{y}.png
Attribution: © OpenStreetMap contributors
Max zoom: 19
Cache: Automatique par navigateur
```

### Leaflet.js CDN
```
JS: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
CSS: https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
Size: ~140KB JS + 50KB CSS (gzippé)
```

### Leaflet MarkerCluster CDN
```
JS: https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js
CSS: https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css
Size: ~50KB total (gzippé)
```

---

## 🗂️ Fichiers JSON

### Structure Données

#### terrasses.json
```json
[
  {
    "geo": { "lat": 48.8598, "lon": 2.2938 },
    "info": {
      "Nom de l'enseigne": "Café de la Paix",
      "Numéro et voie": "1 rue...",
      "Arrondissement": "9e",
      "SIRET": "75012345678901",
      "Longueur": "5",
      "Largeur": "3",
      "Lien affichette": "https://..."
    }
  }
]
```

#### travaux.json
```json
[
  {
    "geo": { "lat": 48.8..., "lon": 2.3... },
    "info": {
      "Synthèse - Nature du chantier": "...",
      "Date début du chantier": "2025-...",
      "Date fin du chantier": "2025-..."
    }
  }
]
```

#### perturbants.json
```json
[
  {
    "geo": { "lat": 48.8..., "lon": 2.3... },
    "info": {
      "Objet": "...",
      "Voie(s)": "...",
      "Précisions de localisation": "...",
      "Date de début": "2025-...",
      "Date de fin": "2025-...",
      "Impact sur la circulation": "...",
      "Niveau de perturbation": "...",
      "Statut": "..."
    }
  }
]
```

#### bovp_pp_map_master_v13.json
```json
[
  {
    "numero": "...",
    "titre": "...",
    "type": "...",
    "adresse": "...",
    "arrondissement": "...",
    "date_signature": "2025-...",
    "date_publication": "2025-...",
    "emetteur": "...",
    "source": "...",
    "geo": { "lat": 48.8..., "lon": 2.3... }
  }
]
```

#### data/rues_paris.json
```json
[
  {
    "nom": "Rue de Rivoli",
    "arrondissement": "1er",
    "lat": 48.8612,
    "lon": 2.3608
  }
]
```

---

## 🔧 Variables d'Environnement

Aucune env var requise. Tout est hardcodé ou en localStorage.

### LocalStorage Schema
```javascript
// Clé: "lexparmap-state"
{
  "center": { "lat": 48.8566, "lng": 2.3522 },
  "zoom": 12,
  "layers": ["terrasses", "travaux", "perturbants", "bovp"]
}
```

---

## 📱 Media Queries Breakpoints

```css
/* Mobile smalll phones */
max-width: 375px

/* Tablets */
min-width: 768px

/* Landscape */
max-height: 500px

/* iPhone specific */
@supports (padding: max(0px)) {
  /* Safe area support */
}
```

---

## ⚡ Performance Settings

### Leaflet Options
```javascript
const mapOptions = {
  preferCanvas: true,        // Canvas rendering (faster)
  zoomControl: true,         // Afficher boutons zoom
  tap: true,                 // Better mobile touch
  maxBoundsViscosity: 1.0,   // Sticky bounds
}
```

### Debounce Search
```javascript
debounceTimer = setTimeout(() => { ... }, 200)
// Réduit les requêtes JS lors de la saisie rapide
```

### Geolocation Options
```javascript
{
  enableHighAccuracy: false,  // Moins d'énergie
  timeout: 10000,            // 10 secondes max
  maximumAge: 300000         // 5 minutes cache
}
```

---

## 🎨 Design Tokens

### Couleurs
```css
--primary-blue: #0d47a1
--terrasses-green: #27ae60
--travaux-orange: #f39c12
--perturbants-red: #e74c3c
--bovp-blue: #3498db
--neutral-light: #ecf0f1
--neutral-dark: #2c3e50
```

### Spacing
```css
--gap-xs: 4px
--gap-sm: 6px
--gap-md: 8px
--gap-lg: 12px
--gap-xl: 16px
```

### Border Radius
```css
--radius-sm: 8px
--radius-lg: 18px
--radius-full: 50%
```

### Typography
```css
--font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica
--font-size-xs: 11px
--font-size-sm: 12px
--font-size-md: 14px
--font-size-lg: 18px
```

---

## 🚀 Build & Deploy

### Local Development
```bash
python3 -m http.server 8000
# http://localhost:8000
```

### Production Checklist
- [ ] Tous JSON minifiés
- [ ] CSS/JS minifiés (optionnel)
- [ ] HTTPS activé
- [ ] Cache headers configurés
- [ ] Gzip enabled
- [ ] 404 handling

### GitHub Pages (Recommandé)
```bash
# Push to gh-pages branch
git checkout --orphan gh-pages
git add .
git commit -m "Deploy"
git push origin gh-pages

# Configure dans GitHub > Settings > Pages
# Sélectionner gh-pages branch
```

---

## 📊 Monitoring & Analytics

### Lighthouse Scores (target)
```
Performance: ≥90
Accessibility: ≥95
Best Practices: ≥90
SEO: ≥90
PWA: ≥80 (future)
```

### Performance Budget
```
JS: < 100KB
CSS: < 50KB
JSON data: < 5MB
Total: < 5.5MB (initial)
```

---

## 🐛 Debugging Tips

### Console Logs
```javascript
console.log("✔ Toutes les couches sont chargées.")
console.log("Terrasses affichées :", data.length)
console.error("Erreur chargement :", url, err)
```

### DevTools Mobile
```bash
# iOS Safari
Develop > iPhone > http://localhost:8000

# Chrome Android
chrome://inspect/#devices
# Connecter appareil USB
```

### Network Throttling
```javascript
// Chrome DevTools > Network tab
// Throttle: "Slow 4G" ou "Mid-tier mobile"
```

---

## 📦 Dependencies

### Runtime (CDN only)
- Leaflet 1.9.4
- Leaflet.MarkerCluster 1.5.3
- Nominatim API (free)
- OpenStreetMap (free)

### Dev (npm, optional)
```json
{
  "csv-parse": "^6.1.0"  // Pour importer CSV
}
```

### Zero Runtime Dependencies (PWA/future)
- Service Worker (native)
- Web API (IndexedDB, localStorage)

---

## 🔐 Security

### Permissions Demandées
- ✅ Geolocation (optionnel, demandé à chaque fois)
- ❌ Pas de stockage identifiant
- ❌ Pas de cookies tracking
- ❌ Pas de fingerprinting

### Audit Sécurité
```bash
# Vérifier dans DevTools:
# 1. Mixed Content (tous HTTPS)
# 2. CSP headers (optionnel)
# 3. No malware/phishing (Safe Browsing)
```

---

## 📚 Références Externes

- [Leaflet.js API](https://leafletjs.com/reference.html)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/)
- [OpenStreetMap Tiles](https://wiki.openstreetmap.org/wiki/Tile_servers)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design/)

---

**Dernier update:** 4 décembre 2025
**Version:** 2.0
**Statut:** Production-ready ✅
