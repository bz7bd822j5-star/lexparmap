/* ============================================================
   INITIALISATION DE LA CARTE
============================================================ */

const map = L.map("map", { preferCanvas: true }).setView([48.8566, 2.3522], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

/* ============================================================
   GROUPES DE COUCHES
============================================================ */

const terrassesLayer = L.markerClusterGroup({ disableClusteringAtZoom: 18 });
const travauxLayer = L.markerClusterGroup({ disableClusteringAtZoom: 18 });
const perturbantsLayer = L.markerClusterGroup({ disableClusteringAtZoom: 18 });
const arretesLayer = L.markerClusterGroup({ disableClusteringAtZoom: 18 });
// flags pour lazy-load afin d'améliorer la responsivité mobile
let terrassesLoaded = false;
let travauxLoaded = false;
let perturbantsLoaded = false;
let arretesLoaded = false;
// emplacement du marqueur de géolocalisation utilisateur
let userLocMarker = null;
let userLocCircle = null;

/* ============================================================
   OUTILS MARKERS
============================================================ */

function createColoredMarker(lat, lon, color) {
  // Use a lightweight divIcon marker so marker clustering and popups work reliably
    // Utiliser un DivIcon léger pour assurer compatibilité parfaite avec markerCluster et popups
    const icon = L.divIcon({
      className: 'dot-marker',
      html: `<span style="background:${color};"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    return L.marker([lat, lon], { icon, riseOnHover: true });
}

// Ajout en batch pour éviter de bloquer le thread principal
function addMarkersInBatches(items, createMarkerFn, layer, batchSize = 300) {
  let i = 0;
  function next() {
    const end = Math.min(i + batchSize, items.length);
    for (; i < end; i++) {
      const maybeMarker = createMarkerFn(items[i]);
      if (maybeMarker) layer.addLayer(maybeMarker);
    }
    if (i < items.length) {
      // yield au navigateur
      setTimeout(next, 0);
    } else {
      console.log('Ajout terminé, total:', layer.getLayers().length);
    }
  }
  next();
}

/* ============================================================
   CHARGEMENT TERRASSES
============================================================ */
async function loadTerrasses() {
  try {
    console.log("Chargement des terrasses…");

    const res = await fetch("data/terrasses.json");
    if (!res.ok) {
      console.error("Échec du fetch terrasses.json :", res.status, res.statusText);
      return;
    }

    let data = await res.json();
    if (!Array.isArray(data) && data && Array.isArray(data.data)) data = data.data;

    // filtrer les éléments valides et les ajouter par batches pour ne pas bloquer l'UI
    const items = data.filter(t => t && t.geo && t.geo.lat && t.geo.lon);

    addMarkersInBatches(items, (t) => {
      const info = t.info || {};
      function getInfo(fieldName) {
        if (!info) return "";
        const keys = Object.keys(info);
        const target = fieldName.replace(/\uFEFF/g, "").trim().toLowerCase();
        for (const k of keys) {
          const normalized = k.replace(/^\uFEFF/, "").trim().toLowerCase();
          if (normalized === target) return info[k];
        }
        return info[fieldName] || "";
      }

      const typologie = getInfo("Typologie") || t.type || "";
      const adresse = t.adresse || getInfo("Numéro et voie") || "";
      const arrondissement = t.arrondissement || getInfo("Arrondissement") || "";
      const enseigne = getInfo("Nom de l'enseigne") || getInfo("Nom de l\u2019enseigne") || "";
      const siret = getInfo("SIRET") || "";
      const longueur = getInfo("Longueur") || "";
      const largeur = getInfo("Largeur") || "";
      const periode = getInfo("Période d'installation") || getInfo("Période d installation") || "";
      const lienAffichette = getInfo("Lien affichette") || "";

      const m = createColoredMarker(t.geo.lat, t.geo.lon, "green");
      m.bindPopup(`
        <div class="popup-terrasse">
          <div style="margin-bottom:6px;"><strong>${typologie || "Terrasse"}</strong></div>
          <div>${adresse || "-"}</div>
          <div style="font-size:90%;color:#555;"><em>${arrondissement || "-"}</em></div>
          <hr style="margin:6px 0;"/>
          <div><strong>Enseigne :</strong> ${enseigne || "-"}</div>
          <div><strong>SIRET :</strong> ${siret || "-"}</div>
          <div><strong>Longueur :</strong> ${longueur ? longueur + ' m' : "-"}</div>
          <div><strong>Largeur :</strong> ${largeur ? largeur + ' m' : "-"}</div>
          <div><strong>Période :</strong> ${periode || "-"}</div>
          ${lienAffichette ? `<div style="margin-top:8px;"><a href="${lienAffichette}" target="_blank">Voir l'affichette</a></div>` : ""}
        </div>
      `);

      return m;
    }, terrassesLayer, 250);

    console.log("Lancement de l'ajout des terrasses (par batches)…");
  } catch (err) {
    console.error("Erreur dans loadTerrasses():", err);
  }
}

/* ============================================================
   CHARGEMENT TRAVAUX
============================================================ */
async function loadTravaux() {
  try {
    console.log("Chargement des travaux…");

    const res = await fetch("data/travaux.json");
    if (!res.ok) {
      console.error("Échec du fetch travaux.json :", res.status, res.statusText);
      return;
    }

    let data = await res.json();
    if (!Array.isArray(data) && data && Array.isArray(data.data)) data = data.data;

    const items = data.filter(t => t && t.geo && t.geo.lat && t.geo.lon);

    addMarkersInBatches(items, (t) => {
      const info = t.info || {};
      function getInfo(fieldName) {
        if (!info) return "";
        const keys = Object.keys(info);
        const target = fieldName.replace(/\uFEFF/g, "").trim().toLowerCase();
        for (const k of keys) {
          const normalized = k.replace(/^\uFEFF/, "").trim().toLowerCase();
          if (normalized === target) return info[k];
        }
        return info[fieldName] || "";
      }

      const ref = getInfo("Référence Chantier") || getInfo("Référence") || "";
      const synthese = getInfo("Synthèse - Nature du chantier") || getInfo("Synthèse") || "";
      const dateDeb = getInfo("Date début du chantier") || getInfo("Date de début") || "";
      const dateFin = getInfo("Date fin du chantier") || getInfo("Date de fin") || "";
      const maitre = getInfo("Maîtrise d'ouvrage principale") || getInfo("Maîtrise d ouvrage principale") || getInfo("Maître d'ouvrage") || "";
      const responsable = getInfo("Responsable du chantier") || getInfo("Responsable") || "";
      const encombrement = getInfo("Encombrement espace public") || getInfo("Encombrement") || "";
      const impactStationnement = getInfo("Impact stationnement") || getInfo("Impact stationnement") || "";
      const surface = getInfo("Surface (m2)") || getInfo("Surface") || "";
      const idDemande = getInfo("Identifiant demande CITE") || getInfo("Identifiant demande") || "";
      const idChantier = getInfo("Identifiant Chantier CITE") || getInfo("Identifiant Chantier") || "";

      const m = createColoredMarker(t.geo.lat, t.geo.lon, "orange");

      m.bindPopup(`
        <div class="popup-travaux" style="max-width:320px;">
          <div style="font-weight:700;margin-bottom:6px;">${ref ? ref + ' — ' + (synthese || 'Travaux') : (synthese || 'Travaux')}</div>
          <div style="font-size:90%;color:#444;margin-bottom:6px;white-space:pre-wrap;">${t.adresse || '-'}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:92%;color:#333;">
            <div><strong>Arr. :</strong> ${t.arrondissement || '-'}</div>
            <div><strong>Surface :</strong> ${surface ? surface + ' m²' : '-'}</div>
          </div>
          <hr style="margin:8px 0;"/>
          <div style="font-size:92%;color:#222;">
            ${maitre ? `<div><strong>Maîtrise d'ouvrage :</strong> ${maitre}</div>` : ''}
            ${responsable ? `<div><strong>Responsable :</strong> ${responsable}</div>` : ''}
            ${encombrement ? `<div><strong>Encombrement :</strong> ${encombrement}</div>` : ''}
            ${impactStationnement ? `<div><strong>Impact stationnement :</strong> ${impactStationnement}</div>` : ''}
            ${dateDeb || dateFin ? `<div style="margin-top:6px;"><strong>Période :</strong> ${dateDeb || '-'} — ${dateFin || '-'}</div>` : ''}
            ${idDemande ? `<div style="margin-top:6px;"><strong>ID demande :</strong> ${idDemande}</div>` : ''}
            ${idChantier ? `<div><strong>ID chantier :</strong> ${idChantier}</div>` : ''}
          </div>
        </div>
      `);

      return m;
    }, travauxLayer, 250);

    console.log("Lancement de l'ajout des travaux (par batches)…");
  } catch (err) {
    console.error("Erreur dans loadTravaux():", err);
  }
}

/* ============================================================
   CHARGEMENT PERTURBANTS
============================================================ */
async function loadPerturbants() {
  try {
    console.log("Chargement des perturbants…");

    const res = await fetch("data/perturbants.json");
    if (!res.ok) {
      console.error("Échec du fetch perturbants.json :", res.status, res.statusText);
      return;
    }

    let data = await res.json();
    if (!Array.isArray(data) && data && Array.isArray(data.data)) data = data.data;

    const items = data.filter(p => p && p.geo && p.geo.lat && p.geo.lon);

    addMarkersInBatches(items, (p) => {
      const info = p.info || {};
      function getInfo(fieldName) {
        if (!info) return "";
        const keys = Object.keys(info);
        const target = fieldName.replace(/\uFEFF/g, "").trim().toLowerCase();
        for (const k of keys) {
          const normalized = k.replace(/^\uFEFF/, "").trim().toLowerCase();
          if (normalized === target) return info[k];
        }
        return info[fieldName] || "";
      }

      const ident = getInfo("Identifiant") || getInfo("Identifiant CTV") || "";
      const maitre = getInfo("Maitre d'ouvrage") || getInfo("Maitre d ouvrage") || "";
      const objet = getInfo("Objet") || "";
      const description = getInfo("Description") || "";
      const voies = getInfo("Voie(s)") || getInfo("Voie(s)") || "";
      const precisions = getInfo("Précisions de localisation") || getInfo("Precisions de localisation") || "";
      const dateDeb = getInfo("Date de début") || "";
      const dateFin = getInfo("Date de fin") || "";
      const impact = getInfo("Impact sur la circulation") || "";
      const detailImpact = getInfo("Détail de l'impact sur la circulation") || "";
      const niveau = getInfo("Niveau de perturbation") || "";
      const statut = getInfo("Statut") || "";
      const urlLettre = getInfo("URL LettreInfoChantier") || getInfo("URL LettreInfoChantier") || "";

      const m = createColoredMarker(p.geo.lat, p.geo.lon, "red");

      m.bindPopup(`
        <div class="popup-perturbant">
          <div style="font-weight:700;margin-bottom:6px;">${objet || "Perturbation"}</div>
          ${ident ? `<div><strong>ID :</strong> ${ident}</div>` : ""}
          ${maitre ? `<div><strong>Maitre d'ouvrage :</strong> ${maitre}</div>` : ""}
          ${voies ? `<div><strong>Voie(s) :</strong> ${voies}</div>` : ""}
          ${precisions ? `<div><strong>Localisation :</strong> ${precisions}</div>` : ""}
          ${dateDeb || dateFin ? `<div><strong>Période :</strong> ${dateDeb || "-"} — ${dateFin || "-"}</div>` : ""}
          ${impact ? `<div><strong>Impact :</strong> ${impact}</div>` : ""}
          ${detailImpact ? `<div style="white-space:pre-wrap;margin-top:6px;">${detailImpact}</div>` : ""}
          ${description ? `<hr style="margin:6px 0;"/><div style="white-space:pre-wrap;">${description}</div>` : ""}
          <div style="margin-top:6px;font-size:90%;color:#666;">
            ${niveau ? `<span><strong>Niveau :</strong> ${niveau}</span>` : ""}
            ${statut ? `<span style="margin-left:8px;"><strong>Statut :</strong> ${statut}</span>` : ""}
          </div>
          ${urlLettre ? `<div style="margin-top:8px;"><a href="${urlLettre}" target="_blank">📄 Lettre / document</a></div>` : ""}
        </div>
      `);

      return m;
    }, perturbantsLayer, 250);

    console.log("Lancement de l'ajout des perturbants (par batches)…");
  } catch (err) {
    console.error("Erreur dans loadPerturbants():", err);
  }
}

/* ============================================================
   CHARGEMENT ARRÊTÉS — VERSION CORRECTE POUR TON JSON
============================================================ */
async function loadArretes() {
  try {
    console.log("Chargement des arrêtés…");

    const res = await fetch("data/arretes_map.json");
    if (!res.ok) {
      console.error("Échec du fetch arretes_map.json :", res.status, res.statusText);
      return;
    }

    let arretes = await res.json();

    // Certains exports renvoient un objet { _meta:..., data: [...] }
    if (!Array.isArray(arretes)) {
      if (arretes && Array.isArray(arretes.data)) {
        arretes = arretes.data;
      } else {
        console.error("ERREUR : le fichier arretes_map.json n'est pas un tableau !", arretes);
        return;
      }
    }

    console.log("Nombre d'arrêtés :", arretes.length);

    const items = arretes.filter(a => a && a.geo && a.geo.lat && a.geo.lon);

    addMarkersInBatches(items, (a) => {
      const m = createColoredMarker(a.geo.lat, a.geo.lon, "#3A6EA5");
      const dateStr = a.date || "";
      const articleHtml = a.article1 ? `<div class="pa-article article">${a.article1}</div>` : "";

      m.bindPopup(`
        <div class="popup-arrete">
          <div class="pa-meta">
            <div><strong>${a.numero || "(n° inconnu)"}</strong></div>
            <div style="font-size:90%;color:#333;margin-top:8px;">
              <div><strong>Source :</strong> ${a.source || "-"}</div>
              <div><strong>Type :</strong> ${a.type || "-"}</div>
              <div><strong>Date :</strong> ${dateStr}</div>
              <div><strong>Adresse :</strong> ${a.adresse || "-"}</div>
            </div>
          </div>
          ${articleHtml}
          ${a.pdf_url ? `<div class="pa-pdf" style="margin-top:8px;"><a href="${a.pdf_url}" target="_blank">📄 Ouvrir le PDF</a></div>` : ""}
        </div>
      `);

      return m;
    }, arretesLayer, 250);

    console.log("Lancement de l'ajout des arrêtés (par batches)…");
  } catch (err) {
    console.error("Erreur dans loadArretes():", err);
  }
}

/* ============================================================
   BOUTON SUPPRIMER LES COUCHES
============================================================ */
function clearLayers() {
  terrassesLayer.clearLayers();
  travauxLayer.clearLayers();
  perturbantsLayer.clearLayers();
  arretesLayer.clearLayers();
}

/* ============================================================
   AUTOUR DE MOI
============================================================ */
document.getElementById("btnGeoloc").addEventListener("click", () => {
  const btn = document.getElementById("btnGeoloc");
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par ce navigateur.");
    return;
  }

  // Safari (et certains navigateurs) n'autorisent la géolocalisation que sur HTTPS
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    alert(
      "La géolocalisation nécessite un contexte sécurisé (HTTPS) ou d'être servi en local. " +
        "Ouvre l'application via https ou via localhost (ex: `python -m http.server`) et autorise la localisation dans les réglages de Safari."
    );
    return;
  }

  // Indiquer que l'on cherche la position
  btn.disabled = true;
  btn.classList.add('active');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      map.setView([lat, lon], 17);

      // supprimer l'ancien marker/cercle s'il existe
      if (userLocMarker) map.removeLayer(userLocMarker);
      if (userLocCircle) map.removeLayer(userLocCircle);

      userLocMarker = L.marker([lat, lon]).addTo(map).bindPopup("Vous êtes ici");
      userLocMarker.openPopup();

      if (pos.coords.accuracy) {
        userLocCircle = L.circle([lat, lon], { radius: pos.coords.accuracy, color: '#1976d2', weight: 1, fillOpacity: 0.08 }).addTo(map);
      }

      btn.disabled = false;
      btn.classList.remove('active');
    },
    err => {
      // gérer les erreurs (permission, timeout, unavailable)
      console.error('Erreur de géolocalisation :', err);
      const code = err && err.code ? err.code : 'unknown';
      const msg = err && err.message ? err.message : '';
      if (code === 1) {
        alert('Permission de géolocalisation refusée. Vérifie dans Safari → Réglages du site que l\'accès à la localisation est autorisé.');
      } else if (code === 2) {
        alert('Position indisponible. Assure-toi que l\'appareil peut fournir la position (Wi‑Fi ou GPS activés).\nDétail: ' + msg);
      } else if (code === 3) {
        alert('Délai de géolocalisation dépassé. Réessaie.');
      } else {
        alert('Erreur de géolocalisation (' + code + '): ' + msg);
      }

      btn.disabled = false;
      btn.classList.remove('active');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

/* ============================================================
   APPLICATION DES COUCHES AUX BOUTONS
============================================================ */
document.getElementById("btnTerrasses").onclick = () => {
  if (map.hasLayer(terrassesLayer)) {
    map.removeLayer(terrassesLayer);
    return;
  }
  // ajouter la couche immédiatement pour que l'UI réponde, puis charger les données si besoin
  map.addLayer(terrassesLayer);
  if (!terrassesLoaded) {
    terrassesLoaded = true;
    loadTerrasses();
  }
};

document.getElementById("btnTravaux").onclick = () => {
  if (map.hasLayer(travauxLayer)) {
    map.removeLayer(travauxLayer);
    return;
  }
  map.addLayer(travauxLayer);
  if (!travauxLoaded) {
    travauxLoaded = true;
    loadTravaux();
  }
};

document.getElementById("btnPerturbants").onclick = () => {
  if (map.hasLayer(perturbantsLayer)) {
    map.removeLayer(perturbantsLayer);
    return;
  }
  map.addLayer(perturbantsLayer);
  if (!perturbantsLoaded) {
    perturbantsLoaded = true;
    loadPerturbants();
  }
};

document.getElementById("btnArretes").onclick = () => {
  if (map.hasLayer(arretesLayer)) {
    map.removeLayer(arretesLayer);
    return;
  }
  map.addLayer(arretesLayer);
  if (!arretesLoaded) {
    arretesLoaded = true;
    loadArretes();
  }
};

document.getElementById("btnDelete").onclick = clearLayers;

/* ============================================================
   RECHERCHE — PHOTON KOMOOT (100% compatible CORS)
============================================================ */

const searchInput = document.getElementById("search");
const autoList = document.getElementById("autocomplete-list");

function clearAuto() {
  autoList.innerHTML = "";
  autoList.style.display = 'none';
}

async function photonAutocomplete(query) {
  if (query.length < 3) return [];

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    query + " Paris"
  )}&lang=fr&limit=5`;

  const resp = await fetch(url);
  if (!resp.ok) return [];

  return (await resp.json()).features || [];
}

searchInput.addEventListener("input", async e => {
  const q = e.target.value.trim();
  clearAuto();
  if (q.length < 3) return;

  const results = await photonAutocomplete(q);

  if (!results || results.length === 0) return;

  results.forEach(r => {
    const props = r.properties;
    const [lon, lat] = r.geometry.coordinates;

    const div = document.createElement("div");
    div.className = "auto-item";
    div.textContent = `${props.housenumber || ""} ${props.street || ""}, ${
      props.city || "Paris"
    }`;

    div.onclick = () => {
      searchInput.value = div.textContent;
      clearAuto();
      map.setView([lat, lon], 18);
      L.marker([lat, lon]).addTo(map);
    };

    autoList.appendChild(div);
  });
  autoList.style.display = 'block';
});

searchInput.addEventListener("keydown", async e => {
  if (e.key !== "Enter") return;

  const q = searchInput.value.trim();
  if (!q) return;

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    q + " Paris"
  )}&lang=fr&limit=1`;

  const resp = await fetch(url);
  const json = await resp.json();
  const r = json.features?.[0];

  if (!r) return alert("Adresse introuvable.");

  const [lon, lat] = r.geometry.coordinates;

  map.setView([lat, lon], 18);
  L.marker([lat, lon]).addTo(map);
  clearAuto();
});

document.addEventListener("click", () => clearAuto());

/* ============================================================
   DÉMARRAGE
============================================================ */

// Les couches sont maintenant chargées à la demande (lazy-load) pour améliorer la réactivité mobile.

/* ============================================================
   DYNAMIQUE : hauteur de la barre supérieure
   Calcule la hauteur réelle de `.top-bar` et expose la valeur
   via la variable CSS `--topbar-height`. Invalide ensuite la
   taille de la carte pour forcer le recalcul du viewport.
============================================================ */

function updateTopbarHeight() {
  try {
    const tb = document.querySelector('.top-bar');
    const current = getComputedStyle(document.documentElement).getPropertyValue('--topbar-height') || '85px';
    const fallback = parseInt(current, 10) || 85;
    const h = tb ? tb.offsetHeight : fallback;
    document.documentElement.style.setProperty('--topbar-height', h + 'px');
    if (typeof map !== 'undefined' && map && typeof map.invalidateSize === 'function') {
      // Laisser le navigateur finir les layouts avant d'invalider
      setTimeout(() => {
        try { map.invalidateSize(); } catch (e) { /* ignore */ }
      }, 200);
    }
  } catch (err) {
    console.warn('updateTopbarHeight failed', err);
  }
}

window.addEventListener('load', updateTopbarHeight);
window.addEventListener('resize', updateTopbarHeight);
window.addEventListener('orientationchange', updateTopbarHeight);

// Si la top-bar change de taille dynamiquement (ex: messages, recherche), observer
const topBarEl = document.querySelector('.top-bar');
if (topBarEl && typeof ResizeObserver !== 'undefined') {
  try {
    const ro = new ResizeObserver(() => updateTopbarHeight());
    ro.observe(topBarEl);
  } catch (e) { /* fall back to resize listeners */ }
}

// Quand le champ de recherche obtient le focus (clavier iOS), recalculer après délai
if (typeof searchInput !== 'undefined' && searchInput) {
  searchInput.addEventListener('focus', () => setTimeout(updateTopbarHeight, 500));
  searchInput.addEventListener('blur', () => setTimeout(updateTopbarHeight, 300));
}