/* ---------------------------------------------------------
   🌍 INITIALISATION DE LA MAP - OPTIMISÉE MOBILES
--------------------------------------------------------- */
let map;

function initMap() {
  if (map) {
    console.log('Carte déjà initialisée');
    map.invalidateSize();
    return;
  }
  
  const mapDiv = document.getElementById("map");
  if (!mapDiv) {
    console.error('Élément #map introuvable');
    return;
  }
  
  console.log('Initialisation de la carte...');
  
  map = L.map("map", {
    preferCanvas: true,
    zoomControl: true,
    tap: true,
    maxBoundsViscosity: 1.0,
  }).setView([48.8566, 2.3522], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
    maxNativeZoom: 18,
  }).addTo(map);
  
  // Ajouter les layers à la carte
  map.addLayer(layers.terrasses);
  map.addLayer(layers.travaux);
  map.addLayer(layers.perturbants);
  map.addLayer(layers.bovp);
  
  console.log('✅ Carte Leaflet créée avec 4 layers');
  
  // Charger les données
  loadAllData();
}

// Exposer initMap globalement pour auth.js
window.initMap = initMap;

/* ---------------------------------------------------------
   🔧 SÉLECTEURS PRINCIPAUX - OPTIMISÉS MOBILES
--------------------------------------------------------- */
// Fonction pour obtenir les éléments (appelée après que le DOM soit prêt)
function getElements() {
  return {
    searchInput: document.getElementById("search"),
    acList: document.getElementById("autocomplete-list"),
    btnTerrasses: document.getElementById("btnTerrasses"),
    btnTravaux: document.getElementById("btnTravaux"),
    btnPerturbants: document.getElementById("btnPerturbants"),
    btnArretes: document.getElementById("btnArretes"),
    btnGeoloc: document.getElementById("btnGeoloc"),
    btnDelete: document.getElementById("btnDelete")
  };
}

let searchInput, acList, btnTerrasses, btnTravaux, btnPerturbants, btnArretes, btnGeoloc, btnDelete;

// Initialiser les éléments dès que possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const els = getElements();
    Object.assign(window, els);
    searchInput = els.searchInput;
    acList = els.acList;
    btnTerrasses = els.btnTerrasses;
    btnTravaux = els.btnTravaux;
    btnPerturbants = els.btnPerturbants;
    btnArretes = els.btnArretes;
    btnGeoloc = els.btnGeoloc;
    btnDelete = els.btnDelete;
  });
} else {
  const els = getElements();
  searchInput = els.searchInput;
  acList = els.acList;
  btnTerrasses = els.btnTerrasses;
  btnTravaux = els.btnTravaux;
  btnPerturbants = els.btnPerturbants;
  btnArretes = els.btnArretes;
  btnGeoloc = els.btnGeoloc;
  btnDelete = els.btnDelete;
}

/* ---------------------------------------------------------
   🧩 CLUSTERS — 4 COUCHES (Terrasses / Travaux / Perturbants / BOVP PP)
--------------------------------------------------------- */
const layers = {
  terrasses: L.markerClusterGroup(),
  travaux: L.markerClusterGroup(),
  perturbants: L.markerClusterGroup(),
  bovp: L.markerClusterGroup()
};

/* ---------------------------------------------------------
   📦 CHARGEMENT JSON
--------------------------------------------------------- */
async function loadJSON(url) {
  try {
    // Adapter le chemin pour GitHub Pages
    let base = '';
    if (window.location.pathname.startsWith('/lexparmap/')) {
      base = '/lexparmap/';
    }
    // Si le chemin commence déjà par /lexparmap/, ne pas doubler
    let finalUrl = url.startsWith('/') ? url.slice(1) : url;
    finalUrl = base + finalUrl;
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error("Erreur chargement :", url, err);
    return [];
  }
}

/* ---------------------------------------------------------
   🚀 CHARGEMENT GLOBAL DES DONNÉES
--------------------------------------------------------- */
async function loadAllData() {
  drawTerrasses(await loadJSON("terrasses.json"));
  drawTravaux(await loadJSON("travaux.json"));
  drawPerturbants(await loadJSON("perturbants.json"));

  // ⭐ BOVP CHARGE ICI
  drawBOVP(await loadJSON("bovp_pp_map_master_v13.json"));

  console.log("✔ Toutes les couches sont chargées.");
  
  // Afficher popup "Carte mise à jour" après chargement
  showUpdateNotification();
}

/* ---------------------------------------------------------
   📢 NOTIFICATION CARTE MISE À JOUR
--------------------------------------------------------- */
function showUpdateNotification() {
  // Vérifier si déjà affiché aujourd'hui
  const today = new Date().toDateString();
  const lastShown = localStorage.getItem('lexpar_update_shown');
  
  if (lastShown === today) {
    return; // Déjà affiché aujourd'hui
  }
  
  // Créer le popup
  const popup = document.createElement('div');
  popup.className = 'update-notification';
  popup.innerHTML = `
    <div class="update-notification-content">
      <div class="update-icon">🗺️</div>
      <h3>Carte mise à jour</h3>
      <p>Les données de la carte ont été actualisées</p>
      <button class="btn-close-notification">OK</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Animation d'apparition
  setTimeout(() => {
    popup.classList.add('show');
  }, 500);
  
  // Fermer au clic sur OK
  const btnClose = popup.querySelector('.btn-close-notification');
  btnClose.addEventListener('click', () => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
    
    // Marquer comme affiché aujourd'hui
    localStorage.setItem('lexpar_update_shown', today);
  });
  
  // Auto-fermer après 5 secondes
  setTimeout(() => {
    if (popup.parentNode) {
      popup.classList.remove('show');
      setTimeout(() => {
        popup.remove();
      }, 300);
      localStorage.setItem('lexpar_update_shown', today);
    }
  }, 5000);
}

/* ---------------------------------------------------------
   🌿 TERRASSES (VERT)
--------------------------------------------------------- */
function drawTerrasses(data) {
  layers.terrasses.clearLayers();

  data.forEach((item) => {
    if (!item.geo) return;
    const info = item.info || {};

    const popup = `
      <b>${info["Nom de l'enseigne"] || "Terrasse"}</b><br>
      ${info["Typologie"] || ""}<br><br>
      <b>Adresse :</b> ${info["Numéro et voie"] || ""} — ${info["Arrondissement"] || ""}<br><br>
      <b>SIRET :</b> ${info["SIRET"] || ""}<br>
      <b>Dimensions :</b> ${info["Longueur"] || ""} × ${info["Largeur"] || ""} m<br>
      ${
        info["Lien affichette"]
          ? `<br><a href="${info["Lien affichette"]}" target="_blank">📄 Voir autorisation</a>`
          : ""
      }
    `;

    const marker = L.circleMarker([item.geo.lat, item.geo.lon], {
      radius: 6,
      color: "#27ae60",
      fillColor: "#2ecc71",
      fillOpacity: 0.9,
    });

    marker.bindPopup(popup);
    layers.terrasses.addLayer(marker);
  });

  console.log("Terrasses affichées :", data.length);
}

/* ---------------------------------------------------------
   📍 GÉOCODAGE REVERSE
--------------------------------------------------------- */
async function geocodeAdresse(lat, lon) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}` +
      "&format=json&addressdetails=1";

    const res = await fetch(url, { headers: { "User-Agent": "LexParMap" } });
    const data = await res.json();
    if (!data.address) return "Adresse inconnue";

    const A = data.address;
    return `${A.house_number || ""} ${A.road || ""}, ${A.postcode || ""} ${
      A.city || ""
    }`
      .replace(/\s+/g, " ")
      .trim();
  } catch (e) {
    return "Adresse inconnue";
  }
}

/* ---------------------------------------------------------
   🚧 TRAVAUX (JAUNE)
--------------------------------------------------------- */
async function drawTravaux(data) {
  layers.travaux.clearLayers();

  for (const item of data) {
    if (!item.geo) continue;

    const info = item.info || {};
    const adresse = await geocodeAdresse(item.geo.lat, item.geo.lon);

    const popup = `
      <b>${info["Synthèse - Nature du chantier"]}</b><br>
      ${adresse}<br><br>
      <b>Début :</b> ${info["Date début du chantier"]}<br>
      <b>Fin :</b> ${info["Date fin du chantier"]}
    `;

    const marker = L.circleMarker([item.geo.lat, item.geo.lon], {
      radius: 7,
      color: "#f1c40f",
      fillColor: "#f7dc6f",
      fillOpacity: 0.9,
    });

    marker.bindPopup(popup);
    layers.travaux.addLayer(marker);
  }

  console.log("Travaux affichés :", data.length);
}

/* ---------------------------------------------------------
   🚨 TRAVAUX PERTURBANTS (ROUGE)
--------------------------------------------------------- */
function drawPerturbants(data) {
  layers.perturbants.clearLayers();

  data.forEach((item) => {
    if (!item.geo) return;
    const info = item.info || {};

    const popup = `
      <b>Objet :</b> ${info["Objet"]}<br>
      <b>Voie(s) :</b> ${info["Voie(s)"]}<br><br>
      <b>Localisation :</b><br>${info["Précisions de localisation"]}<br><br>
      <b>Début :</b> ${info["Date de début"]}<br>
      <b>Fin :</b> ${info["Date de fin"]}<br><br>
      <b>Impact :</b> ${info["Impact sur la circulation"]}<br>
      <b>Niveau :</b> ${info["Niveau de perturbation"]}<br>
      <b>Statut :</b> ${info["Statut"]}
    `;

    const marker = L.circleMarker([item.geo.lat, item.geo.lon], {
      radius: 8,
      color: "#922b21",
      fillColor: "#e74c3c",
      fillOpacity: 0.9,
    });

    marker.bindPopup(popup);
    layers.perturbants.addLayer(marker);
  });

  console.log("Perturbants affichés :", data.length);
}

/* ---------------------------------------------------------
   🟦 BOVP PP (BLEU)
--------------------------------------------------------- */
function drawBOVP(data) {
  layers.bovp.clearLayers();

  data.forEach((item) => {
    if (!item.geo) return;

   const popup = `
  <b>${item.numero || ""}</b><br>
  <div style="margin-top:4px; font-size:14px;">
    ${item.titre || ""}
  </div>
  <hr>

  <b>Type :</b> ${item.type || "—"}<br>
  <b>Adresse :</b> ${item.adresse || "—"}<br>
  <b>Arrondissement :</b> ${item.arrondissement || "—"}<br><br>

  <b>Date de signature :</b> ${item.date_signature || "—"}<br>
  <b>Date de publication :</b> ${item.date_publication || "—"}<br><br>

  <b>Émetteur :</b> ${item.emetteur || "—"}<br>
  <b>Source :</b> ${item.source || "—"}<br>
`;

    const m = L.circleMarker([item.geo.lat, item.geo.lon], {
      radius: 7,
      color: "#3498db",
      fillColor: "#5dade2",
      fillOpacity: 0.9,
    });

    m.bindPopup(popup);
    layers.bovp.addLayer(m);
  });

  console.log("BOVP affichés :", data.length);
}

/* ---------------------------------------------------------
   🎛️ BOUTONS ON/OFF - OPTIMISÉ MOBILES
--------------------------------------------------------- */
function setupLayerButtons() {
  const layerButtons = {
    terrasses: btnTerrasses,
    travaux: btnTravaux,
    perturbants: btnPerturbants,
    bovp: btnArretes, // BOVP mappé sur bouton Arrêtés
  };

  Object.entries(layerButtons).forEach(([name, btn]) => {
    if (!btn) return;
    
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!map) return;
      const layer = layers[name];

      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
        btn.classList.remove("active");
      } else {
        map.addLayer(layer);
        btn.classList.add("active");
      }
    });
  });
}

// Appeler quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLayerButtons);
} else {
  setupLayerButtons();
}

/* ---------------------------------------------------------
   📍 GÉOLOCALISATION AUTO - OPTIMISÉE MOBILES
--------------------------------------------------------- */
function setupGeolocation() {
  if (!btnGeoloc) return;

  // Géolocalisation automatique au démarrage
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!map) return;
        map.setView([pos.coords.latitude, pos.coords.longitude], 18);
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
        L.marker([pos.coords.latitude, pos.coords.longitude])
          .addTo(map)
          .bindPopup("📍 Vous êtes ici")
          .openPopup();
      },
      (err) => {
        console.warn("Géoloc auto refusée ou impossible.");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  btnGeoloc.addEventListener("click", (e) => {
    e.preventDefault();
    if (!map) return;
    btnGeoloc.disabled = true;
    btnGeoloc.textContent = "Localisation...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 18);
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
        L.marker([pos.coords.latitude, pos.coords.longitude])
          .addTo(map)
          .bindPopup("📍 Vous êtes ici")
          .openPopup();
        btnGeoloc.disabled = false;
        btnGeoloc.textContent = "Autour de moi";
      },
      (err) => {
        console.error("Erreur géoloc:", err);
        alert("Impossible de récupérer votre position.\nVérifiez vos permissions.");
        btnGeoloc.disabled = false;
        btnGeoloc.textContent = "Autour de moi";
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      }
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupGeolocation);
} else {
  setupGeolocation();
}/* ---------------------------------------------------------
   🔍 RECHERCHE MANUELLE - OPTIMISÉE MOBILES
--------------------------------------------------------- */
async function searchAdresse() {
  const q = searchInput.value.trim();
  if (!q) return;

  searchInput.disabled = true;
  const originalPlaceholder = searchInput.placeholder;
  searchInput.placeholder = "Recherche...";

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "LexParMap" },
    });
    const data = await res.json();
    
    if (!data.length) {
      alert("❌ Adresse introuvable");
      return;
    }

    map.flyTo([data[0].lat, data[0].lon], 18, {
      duration: 0.8,
    });

    L.marker([data[0].lat, data[0].lon])
      .addTo(map)
      .bindPopup("📍 Adresse recherchée: " + q)
      .openPopup();
  } catch (e) {
    console.error(e);
    alert("Erreur de connexion");
  } finally {
    searchInput.disabled = false;
    searchInput.placeholder = originalPlaceholder;
  }
}

/* ---------------------------------------------------------
   ✨ AUTO-COMPLÉTION RUES - OPTIMISÉE MOBILES
--------------------------------------------------------- */
let ruesParis = [];

// Chargement dynamique du chemin pour GitHub Pages
let base = window.location.pathname.startsWith('/lexparmap/') ? '/lexparmap/' : '';
fetch(base + "data/rues_paris.json")
  .then((r) => r.json())
  .then((d) => (ruesParis = d))
  .catch((e) => console.error("Erreur rues_paris.json:", e));

let debounceTimer;

function setupSearchListeners() {
  if (!searchInput) return;
  
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchAdresse();
      acList.style.display = "none";
    }
    if (e.key === "Escape") {
      acList.style.display = "none";
    }
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.toLowerCase().trim();
    if (q.length < 2) {
      acList.style.display = "none";
      acList.innerHTML = "";
      return;
    }
    debounceTimer = setTimeout(() => {
      const matches = ruesParis
        .filter((r) => r.nom.toLowerCase().includes(q))
        .slice(0, 12);
      acList.innerHTML = "";
      if (!matches.length) {
        acList.style.display = "none";
        return;
      }
      matches.forEach((rue) => {
        const el = document.createElement("div");
        el.className = "autocomplete-item";
        el.textContent = `${rue.nom} — ${rue.arrondissement}`;
        el.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          acList.style.display = "none";
          searchInput.value = rue.nom;
          searchInput.blur();
          map.flyTo([rue.lat, rue.lon], 17, {
            duration: 0.8,
          });
          L.marker([rue.lat, rue.lon])
            .addTo(map)
            .bindPopup(`📍 ${rue.nom}`)
            .openPopup();
        });
        acList.appendChild(el);
      });
      acList.style.display = "block";
    }, 200);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSearchListeners);
} else {
  setupSearchListeners();
}

// Fermer l'autocomplete au clic ailleurs
document.addEventListener("mousedown", (e) => {
  if (!document.querySelector(".search-wrapper").contains(e.target)) {
    acList.style.display = "none";
  }
});

/* ---------------------------------------------------------
   🗑️ BOUTON SUPPRESSION MARQUEURS UTILISATEUR
--------------------------------------------------------- */
function setupDeleteButton() {
  if (!btnDelete) return;
  
  btnDelete.addEventListener("click", (e) => {
    e.preventDefault();
    if (!map) return;
    
    // Confirmation de sécurité
    const confirmation = confirm('⚠️ Supprimer tous les marqueurs ajoutés ?\n\nCette action est irréversible.');
    
    if (!confirmation) {
      return; // Annulation
    }
    
    // Supprimer tous les marqueurs (sauf les clusters)
    let deletedCount = 0;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer._noDelete) {
        map.removeLayer(layer);
        deletedCount++;
      }
    });
    
    if (searchInput) searchInput.value = "";
    if (acList) acList.style.display = "none";
    
    // Feedback
    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount} marqueur(s) supprimé(s)`);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDeleteButton);
} else {
  setupDeleteButton();
}

/* ---------------------------------------------------------
   ⚡ OPTIMISATIONS DE PERFORMANCE - MOBILES
--------------------------------------------------------- */

// Disable zoom animation sur mobiles faibles
if (window.innerWidth < 768) {
  map.options.zoomAnimation = true;
  map.options.markerZoomAnimation = true;
}

// Prevent double-tap zoom sur iOS
let lastTouchEnd = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
});

// Gestion de la sauvegarde locale (iCloud)
window.addEventListener("beforeunload", () => {
  const mapState = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    layers: Object.keys(layers).filter(
      (name) => map.hasLayer(layers[name])
    ),
  };
  localStorage.setItem("lexparmap-state", JSON.stringify(mapState));
});

// Restaurer l'état au chargement
window.addEventListener("load", () => {
  try {
    const saved = localStorage.getItem("lexparmap-state");
    if (saved) {
      const state = JSON.parse(saved);
      map.setView(state.center, state.zoom);
      
      // Restaurer les couches visibles
      state.layers.forEach((name) => {
        if (layers[name] && !map.hasLayer(layers[name])) {
          map.addLayer(layers[name]);
          if (layerButtons[name]) {
            layerButtons[name].classList.add("active");
          }
        }
      });
    }
  } catch (e) {
    console.error("Erreur restauration état:", e);
  }
});

console.log("✅ LexPar Map v2 - Optimisée Mobiles");

/* ---------------------------------------------------------
   🚀 GESTION PWA - SHORTCUTS
--------------------------------------------------------- */
function handlePWAShortcuts() {
  const params = new URLSearchParams(window.location.search);
  const layer = params.get('layer');
  const action = params.get('action');

  if (layer) {
    // Activer une couche spécifique
    const btn = document.getElementById(`btn${layer.charAt(0).toUpperCase() + layer.slice(1)}`);
    if (btn && !map.hasLayer(layers[layer])) {
      btn.click();
    }
  }

  if (action === 'geoloc') {
    // Déclencher géolocalisation
    setTimeout(() => {
      if (btnGeoloc) btnGeoloc.click();
    }, 500);
  }

  if (action === 'search') {
    // Focus sur la recherche
    setTimeout(() => {
      if (searchInput) searchInput.focus();
    }, 500);
  }
}

// Exécuter au chargement
handlePWAShortcuts();