import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Résolution du chemin vrai
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 TON FICHIER EST DANS /data/
const geojsonPath = path.join(__dirname, "../data/denominations-emprises-voies-actuelles.geojson");

// Charger le fichier
const raw = fs.readFileSync(geojsonPath, "utf8");
const data = JSON.parse(raw);

// Vérification
if (!data || !Array.isArray(data.features)) {
  console.error("❌ ERREUR : data.features n'est pas une liste");
  console.error("⚠️ Le fichier n'est pas lu correctement :", geojsonPath);
  process.exit(1);
}

console.log("⏳ Traitement des rues…");

const rows = [];

// Centroid = moyenne simple
function computeCentroid(coords) {
  let xs = 0, ys = 0, n = 0;

  const add = pts => {
    for (const [x, y] of pts) {
      xs += x;
      ys += y;
      n++;
    }
  };

  if (Array.isArray(coords[0][0])) {
    // MultiLineString / MultiPolygon
    for (const segment of coords) add(segment);
  } else {
    // LineString
    add(coords);
  }

  return {
    lon: +(xs / n).toFixed(6),
    lat: +(ys / n).toFixed(6)
  };
}

for (const feature of data.features) {
  const props = feature.properties || {};
  const geom = feature.geometry || {};

  const nom = props.LIB_VOIE?.trim() || "";
  const type = props.TYP_VOIE?.trim() || "";
  const arr = props.ARROND?.toString().trim() || "";

  if (!geom.coordinates) continue;

  let centroid;
  try {
    centroid = computeCentroid(geom.coordinates);
  } catch {
    continue;
  }

  rows.push({
    nom,
    type,
    arrondissement: arr,
    lat: centroid.lat,
    lon: centroid.lon
  });
}

console.log("✔ Rues trouvées :", rows.length);

// Sauvegarde
const outDir = path.join(__dirname, "../data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const outPath = path.join(outDir, "rues_paris.json");
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");

console.log("💾 Fichier généré :", outPath);
console.log("🎉 Terminé !");