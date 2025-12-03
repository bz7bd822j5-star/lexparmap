// Déduplique les arrêtés par adresse + type
// Règles:
// - Même adresse + même type => garde le plus récent
// - Même adresse + types différents => garde les 2
// - Sans date => garde (suppression manuelle après)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARRETES_PATH = path.resolve(__dirname, '..', 'data', 'arretes_map.json');

function normalizeAdresse(adresse) {
  if (!adresse) return null;
  
  // Nettoie et normalise l'adresse
  let normalized = adresse
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[,;.]/g, '')
    .trim();
  
  // Extrait rue/avenue/boulevard + numéros
  const match = normalized.match(/(rue|avenue|boulevard|quai|place|passage|villa|square|impasse|voie|cours|allée|cité)[^,\n]{5,80}/i);
  if (match) {
    normalized = match[0].trim();
    // Garde les numéros
    const numMatch = normalized.match(/\b(n°?\s*\d+|au droit du\s*n?°?\s*\d+|\d+\s*(?:au|et)\s*\d+)/i);
    if (numMatch) {
      return normalized;
    }
    // Pas de numéro: garde quand même la rue
    return normalized.replace(/\s+/g, ' ').slice(0, 50);
  }
  
  return normalized.slice(0, 50);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const months = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };
  
  // Format: "31 décembre 2024" ou "02 janvier 2025"
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = months[match[2].toLowerCase()];
    const year = parseInt(match[3], 10);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

function main() {
  const raw = fs.readFileSync(ARRETES_PATH, 'utf8');
  const json = JSON.parse(raw);
  const items = Array.isArray(json) ? json : json.data || [];
  
  console.log(`Total arrêtés avant dédoublonnage: ${items.length}`);
  
  // Grouper par adresse normalisée + type
  const groups = new Map();
  
  for (const arrete of items) {
    const addr = normalizeAdresse(arrete.adresse || arrete.article1);
    const type = arrete.type || 'autre';
    
    if (!addr) {
      // Pas d'adresse identifiable: on garde tel quel
      const key = `NO_ADDR_${arrete.id_pdf}`;
      groups.set(key, [arrete]);
      continue;
    }
    
    const key = `${addr}|||${type}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(arrete);
  }
  
  // Pour chaque groupe: garder le plus récent
  const kept = [];
  let removed = 0;
  
  for (const [key, arretes] of groups.entries()) {
    if (arretes.length === 1) {
      kept.push(arretes[0]);
      continue;
    }
    
    // Trier par date décroissante
    arretes.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      
      // Arrêtés sans date: on les garde en dernier (suppression manuelle)
      if (!dateA && !dateB) return b.id_pdf - a.id_pdf; // par ID décroissant
      if (!dateA) return 1; // a sans date passe après
      if (!dateB) return -1; // b sans date passe après
      
      return dateB - dateA; // plus récent en premier
    });
    
    // Garde le premier (plus récent)
    kept.push(arretes[0]);
    removed += arretes.length - 1;
    
    if (arretes.length > 1) {
      console.log(`Adresse: ${key.split('|||')[0]}`);
      console.log(`  → Gardé: ${arretes[0].numero} (${arretes[0].date || 'sans date'})`);
      console.log(`  → Supprimé: ${arretes.slice(1).map(a => a.numero).join(', ')}`);
    }
  }
  
  // Trier par ID décroissant
  kept.sort((a, b) => b.id_pdf - a.id_pdf);
  
  console.log(`\nRésultat:`);
  console.log(`  Gardés: ${kept.length}`);
  console.log(`  Supprimés: ${removed}`);
  
  // Sauvegarder
  const output = Array.isArray(json) ? kept : { data: kept };
  fs.writeFileSync(ARRETES_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✓ Fichier mis à jour: ${ARRETES_PATH}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
