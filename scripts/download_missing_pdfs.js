// Télécharge les PDFs manquants dans pdf_cache/ en parcourant tous les IDs de la plage trouvée dans arretes_map.json
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARRETES_PATH = path.resolve(__dirname, '..', 'data', 'arretes_map.json');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'pdf_cache');
const BASE_URL = 'https://bovp.apps.paris.fr/doc_num_data.php?explnum_id=';

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
          return reject(new Error(`HTTP ${res.statusCode}`));
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

  // Trouver min et max id_pdf
  const ids = items.map(it => it.id_pdf).filter(id => id && typeof id === 'number');
  const minId = Math.min(...ids);
  const maxId = Math.max(...ids);
  
  console.log(`Plage d'IDs: ${minId} → ${maxId} (${maxId - minId + 1} PDFs potentiels)`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let id = minId; id <= maxId; id++) {
    const outFile = path.join(OUTPUT_DIR, `${id}.pdf`);
    
    if (fs.existsSync(outFile)) {
      skipped++;
      continue;
    }

    const url = `${BASE_URL}${id}`;
    
    try {
      await downloadFile(url, outFile);
      downloaded++;
      if (downloaded % 100 === 0) {
        console.log(`Téléchargés: ${downloaded} | Ignorés: ${skipped} | Échecs: ${failed}`);
      }
    } catch (e) {
      failed++;
      if (failed <= 10) {
        console.warn(`Échec pour id ${id}: ${e.message}`);
      }
    }
  }

  console.log(`\nTerminé!`);
  console.log(`✓ Téléchargés: ${downloaded}`);
  console.log(`⊘ Ignorés (déjà présents): ${skipped}`);
  console.log(`✗ Échecs: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
