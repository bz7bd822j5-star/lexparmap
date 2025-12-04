// -------------------------------------------------------
// build_parisdata.js (version corrigée et optimisée)
// Conversion CSV -> JSON propre pour LexPar Map
// -------------------------------------------------------

import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Bloc 1 - Dossiers sources / sortie
const CSV_DIR = "./data/csv/";
const OUT_DIR = "./data/json/";

// Bloc 2 - Fichiers CSV d’entrée
const FILES = {
  terrasses: "terrasses-autorisations.csv",
  travaux: "chantiers-a-paris.csv",
  perturbants: "chantiers-perturbants.csv"
};

// Bloc 3 - Lecture CSV
function parseCSV(filePath) {
  return new Promise((resolve) => {
    const entries = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => entries.push(row))
      .on("end", () => resolve(entries));
  });
}

// -------------------------------------------------------
// BLOC 4 - Extraction géographique (corrigé ★★ IMPORTANT ★★)
// -------------------------------------------------------
function extractGeo(row) {
  // 1️⃣ geo_point_2d → format "48.85, 2.35"
  if (row.geo_point_2d) {
    const parts = row.geo_point_2d.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  }

  // 2️⃣ geo_shape → polygone → calcul du centroïde
  if (row.geo_shape) {
    try {
      const shape = JSON.parse(row.geo_shape);
      if (
        shape.type === "Polygon" &&
        Array.isArray(shape.coordinates) &&
        Array.isArray(shape.coordinates[0])
      ) {
        const points = shape.coordinates[0];
        let sumLat = 0;
        let sumLon = 0;
        points.forEach(([lon, lat]) => {
          sumLat += lat;
          sumLon += lon;
        });
        return {
          lat: sumLat / points.length,
          lon: sumLon / points.length
        };
      }
    } catch (e) {}
  }

  // 3️⃣ Si colonnes lat/lon classiques
  let lat = null;
  let lon = null;
  for (const key of Object.keys(row)) {
    const v = row[key];
    const k = key.toLowerCase();
    if (k.includes("lat") && v) lat = parseFloat(v);
    if (k.includes("lon") && v) lon = parseFloat(v);
  }
  if (!isNaN(lat) && !isNaN(lon) && lat && lon) return { lat, lon };

  // 4️⃣ Sinon → null
  return null;
}

// -------------------------------------------------------
// BLOC 5 – Normalisation d’un objet ParisData
// -------------------------------------------------------
function formatEntry(row, typeName) {
  const titre =
    row.nom_enseigne || row.titre || row.typologie || "Sans titre";

  const adresse = row.adresse || row.voie || row.location || "";

  const cp =
    row["Code postal arrondissement - Commune"] ||
    row["code_postal"] ||
    "";

  const arr =
    cp.startsWith("75") && cp.length >= 5 ? cp : "";

  const geo = extractGeo(row);

  // Détection lien Eudonet
  let lienEudo = "";
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().includes("eudo") && row[k].trim()) {
      lienEudo = row[k].trim();
    }
  }

  const info = { ...row };
  if (lienEudo) info.lien_eudonet = lienEudo;

  return {
    type: typeName,
    titre,
    adresse,
    arrondissement: arr,
    info,
    geo,
    commentaire: ""
  };
}

// -------------------------------------------------------
// BLOC 6 - traitement d’un CSV → JSON
// -------------------------------------------------------
async function buildOne(typeName, csvFile) {
  const filePath = path.join(CSV_DIR, csvFile);
  const rows = await parseCSV(filePath);

  const formatted = rows.map((row) => formatEntry(row, typeName));

  fs.writeFileSync(
    path.join(OUT_DIR, `${typeName}.json`),
    JSON.stringify(formatted, null, 2),
    "utf-8"
  );

  console.log(`✔ ${typeName}.json généré (${formatted.length} éléments)`);
  return formatted;
}

// -------------------------------------------------------
// BLOC 7 - build complet
// -------------------------------------------------------
async function buildAll() {
  console.log("🚀 Conversion ParisData -> JSON corrigée");

  const terr = await buildOne("Terrasse", FILES.terrasses);
  const trav = await buildOne("Travaux", FILES.travaux);
  const pert = await buildOne("Perturbants", FILES.perturbants);

  const fusion = [...terr, ...trav, ...pert];

  fs.writeFileSync(
    path.join(OUT_DIR, "lexpar_parisdata_full.json"),
    JSON.stringify(fusion, null, 2)
  );

  console.log(`📦 Fusion totale : ${fusion.length} entrées`);
}

buildAll();