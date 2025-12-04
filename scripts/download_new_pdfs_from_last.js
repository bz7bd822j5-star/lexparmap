// Télécharge uniquement les nouveaux PDFs depuis le dernier id présent
// - Ne modifie PAS data/arretes_map.json
// - S'arrête après un nombre configuré de ratés consécutifs
// - Limite un maximum de téléchargements par exécution

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARRETES_PATH = path.resolve(__dirname, '..', 'data', 'arretes_map.json');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'pdf_cache');
const BASE_URL = 'https://bovp.apps.paris.fr/doc_num_data.php?explnum_id=';

// Bornes de sécurité
const MAX_NEW_DOWNLOADS = parseInt(process.env.MAX_NEW_DOWNLOADS || '100', 10); // plafond
const MAX_CONSECUTIVE_MISSES = parseInt(process.env.MAX_CONSECUTIVE_MISSES || '30', 10); // stop après 30 échecs de suite

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readItems() {
  const raw = fs.readFileSync(ARRETES_PATH, 'utf8');
  const json = JSON.parse(raw);
  return Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
}

function headOrGetPdf(url) {
  // Certains serveurs refusent HEAD, on tente GET et on arrête après headers
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      const ok = res.statusCode === 200 &&
                 ((res.headers['content-type'] || '').includes('pdf') || (res.headers['content-disposition'] || '').includes('.pdf'));
      req.destroy();
      resolve({ ok, statusCode: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, statusCode: 0 }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ ok: false, statusCode: 0 });
    });
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        out.close();
        fs.rmSync(dest, { force: true });
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
    }).on('error', (err) => {
      out.close();
      fs.rmSync(dest, { force: true });
      reject(err);
    });
  });
}

async function main() {
  ensureDir(OUTPUT_DIR);
  const items = readItems();
  if (!items.length) {
    console.error('Aucun arrêté dans', ARRETES_PATH);
    process.exit(1);
  }

  // Détermine le dernier ID connu (max par sécurité)
  const ids = items.map((it) => it && it.id_pdf).filter((n) => Number.isFinite(n));
  const lastId = Math.max(...ids);

  console.log(`Dernier id connu: ${lastId}`);

  let nextId = lastId + 1;
  let downloaded = 0;
  let misses = 0;

  while (downloaded < MAX_NEW_DOWNLOADS && misses < MAX_CONSECUTIVE_MISSES) {
    const dest = path.join(OUTPUT_DIR, `${nextId}.pdf`);
    if (fs.existsSync(dest)) {
      // déjà présent (au cas où), on saute mais on ne compte pas comme miss
      nextId++;
      continue;
    }

    const url = `${BASE_URL}${nextId}`;
    const probe = await headOrGetPdf(url);

    if (probe.ok) {
      try {
        await downloadFile(url, dest);
        downloaded++;
        misses = 0; // reset miss streak
        console.log(`+ ${nextId}.pdf`);
      } catch {
        misses++;
      }
    } else {
      misses++;
    }

    nextId++;
  }

  console.log('\nRésultat');
  console.log(`Nouveaux téléchargés: ${downloaded}`);
  console.log(`Échecs consécutifs avant arrêt: ${misses}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
