// Télécharge les PDFs des arrêtés listés dans data/arretes_map.json vers pdf_cache/{id_pdf}.pdf
// Utilise uniquement les modules Node.js natifs.

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARRETES_PATH = path.resolve(__dirname, '..', 'data', 'arretes_map.json');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'pdf_cache');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          fileStream.close();
          fs.rmSync(dest, { force: true });
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(fileStream);
        fileStream.on('finish', () => fileStream.close(resolve));
      })
      .on('error', (err) => {
        fileStream.close();
        fs.rmSync(dest, { force: true });
        reject(err);
      });
  });
}

async function main() {
  ensureDir(OUTPUT_DIR);
  const json = readJson(ARRETES_PATH);
  const items = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
  if (!items.length) {
    console.error('Aucun arrêté trouvé dans', ARRETES_PATH);
    process.exit(1);
  }

  let total = 0;
  let skipped = 0;
  let failed = 0;

  for (const it of items) {
    const id = it.id_pdf;
    const url = it.pdf_url;
    if (!id || !url) {
      continue;
    }
    const outFile = path.join(OUTPUT_DIR, `${id}.pdf`);
    if (fs.existsSync(outFile)) {
      skipped++;
      continue;
    }
    try {
      await downloadFile(url, outFile);
      total++;
      // Petit log progressif pour grandes séries
      if (total % 50 === 0) {
        console.log(`Téléchargés: ${total} | Ignorés: ${skipped} | Échecs: ${failed}`);
      }
    } catch (e) {
      failed++;
      console.warn(`Échec pour id ${id}: ${e.message}`);
    }
  }

  console.log(`Terminé. Téléchargés: ${total}, Ignorés (déjà présents): ${skipped}, Échecs: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
