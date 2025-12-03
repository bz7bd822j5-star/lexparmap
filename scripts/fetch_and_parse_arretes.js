// Télécharge et parse les arrêtés BOVP depuis ID 33551 jusqu'à 45840
// Filtre: garde uniquement stationnement/circulation avec numéro 2025
// Ajoute au JSON existant sans écraser

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARRETES_PATH = path.resolve(__dirname, '..', 'data', 'arretes_map.json');
const PDF_CACHE = path.resolve(__dirname, '..', 'pdf_cache');
const BASE_URL = 'https://bovp.apps.paris.fr/doc_num_data.php?explnum_id=';
const START_ID = 33551;
const END_ID = 45840;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadPdf(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.rmSync(dest, { force: true });
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      file.close();
      fs.rmSync(dest, { force: true });
      reject(err);
    });
  });
}

async function parsePdf(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (e) {
    return null;
  }
}

function extractSource(text) {
  if (!text) return 'Inconnu';
  if (text.includes('Préfecture de Police') || text.includes('PREFECTURE DE POLICE')) return 'PP';
  if (text.includes('Ville de Paris') || text.includes('VILLE DE PARIS')) return 'Ville';
  return 'Inconnu';
}

function extractNumero(text) {
  if (!text) return null;
  // Cherche pattern année + lettre + numéro
  const match = text.match(/\b(202[0-9]\s*[A-Z]\s*\d+)\b/);
  if (match) return match[1].replace(/\s+/g, ' ');
  return null;
}

function extractType(text) {
  if (!text) return 'autre';
  const lower = text.toLowerCase();
  if (lower.includes('stationnement')) return 'stationnement';
  if (lower.includes('circulation')) return 'circulation';
  return 'autre';
}

function extractArticle1(text) {
  if (!text) return null;
  const match = text.match(/Article\s*1[^]*?(?=Article\s*2|$)/is);
  if (match) return match[0].replace(/\s+/g, ' ').trim().slice(0, 500);
  return null;
}

function extractAdresse(article1) {
  if (!article1) return null;
  // Pattern simple: cherche rue/avenue/boulevard suivi de texte
  const match = article1.match(/(rue|avenue|boulevard|quai|place)[^,\n]{5,80}/i);
  if (match) return match[0].trim();
  return null;
}

function extractDate(text) {
  if (!text) return null;
  const match = text.match(/\b(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+202[0-9])\b/i);
  if (match) return match[1];
  return null;
}

async function processArrete(id) {
  const pdfPath = path.join(PDF_CACHE, `${id}.pdf`);
  const url = `${BASE_URL}${id}`;

  // Télécharger si absent
  if (!fs.existsSync(pdfPath)) {
    try {
      await downloadPdf(url, pdfPath);
    } catch {
      return null; // Échec téléchargement
    }
  }

  // Parser
  const text = await parsePdf(pdfPath);
  if (!text) return null;

  const numero = extractNumero(text);
  const type = extractType(text);

  // Filtres: doit être 2025 + (stationnement ou circulation)
  if (!numero || !numero.startsWith('2025')) return null;
  if (type !== 'stationnement' && type !== 'circulation') return null;

  const source = extractSource(text);
  const article1 = extractArticle1(text);
  const adresse = extractAdresse(article1);
  const date = extractDate(text);

  return {
    id_pdf: id,
    numero,
    source,
    type,
    date,
    adresse,
    article1,
    geo: { lat: null, lon: null },
    pdf_url: url,
    pdf_local: `pdf_cache/${id}.pdf`
  };
}

async function main() {
  ensureDir(PDF_CACHE);

  // Charger JSON existant
  let existing = { data: [] };
  if (fs.existsSync(ARRETES_PATH)) {
    const raw = fs.readFileSync(ARRETES_PATH, 'utf8');
    existing = JSON.parse(raw);
    if (Array.isArray(existing)) existing = { data: existing };
  }

  const existingIds = new Set(existing.data.map(a => a.id_pdf));
  let added = 0;
  let skipped = 0;
  let filtered = 0;

  console.log(`Traitement de ${START_ID} à ${END_ID}...`);

  for (let id = START_ID; id <= END_ID; id++) {
    if (existingIds.has(id)) {
      skipped++;
      continue;
    }

    const arrete = await processArrete(id);
    
    if (arrete) {
      existing.data.push(arrete);
      added++;
      if (added % 50 === 0) {
        console.log(`Ajoutés: ${added} | Filtrés: ${filtered} | Ignorés: ${skipped}`);
      }
    } else {
      filtered++;
    }
  }

  // Sauvegarder avec tri par id décroissant
  existing.data.sort((a, b) => b.id_pdf - a.id_pdf);
  fs.writeFileSync(ARRETES_PATH, JSON.stringify(existing, null, 2), 'utf8');

  console.log('\n✓ Terminé!');
  console.log(`Ajoutés: ${added}`);
  console.log(`Filtrés (non 2025 ou autre type): ${filtered}`);
  console.log(`Ignorés (déjà présents): ${skipped}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
