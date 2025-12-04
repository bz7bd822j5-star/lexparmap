#!/usr/bin/env node
/**
 * Script de mise à jour des données de la PWA depuis les CSV
 * Convertit les CSV en JSON avec structure compatible (geo, info, adresse, arrondissement)
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Fonction utilitaire: parser geo_point_2d "lat, lon"
function parseGeoPoint(geoPointStr) {
  if (!geoPointStr || typeof geoPointStr !== 'string') return null;
  const parts = geoPointStr.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

// Conversion terrasses-autorisations.csv → terrasses.json
function convertTerrasses(csvPath, jsonPath) {
  console.log(`Conversion: ${csvPath} → ${jsonPath}`);
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, { columns: true, delimiter: ';', skip_empty_lines: true });
  
  const output = records.map(row => {
    const geo = parseGeoPoint(row.geo_point_2d);
    if (!geo) return null; // skip sans coordonnées
    
    return {
      type: row['Typologie'] || '',
      adresse: row['Numéro et voie'] || '',
      arrondissement: row['Arrondissement'] || '',
      geo,
      info: {
        'Typologie': row['Typologie'] || '',
        'Numéro et voie': row['Numéro et voie'] || '',
        'Arrondissement': row['Arrondissement'] || '',
        "Nom de l'enseigne": row["Nom de l'enseigne"] || '',
        'Nom de la société': row['Nom de la société'] || '',
        'SIRET': row['SIRET'] || '',
        'Longueur': row['Longueur'] || '',
        'Largeur': row['Largeur'] || '',
        "Période d'installation": row["Période d'installation"] || '',
        'Lien affichette': row['Lien affichette'] || ''
      }
    };
  }).filter(Boolean);
  
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✓ ${output.length} terrasses exportées dans ${jsonPath}`);
}

// Conversion chantiers-perturbants.csv → perturbants.json
function convertPerturbants(csvPath, jsonPath) {
  console.log(`Conversion: ${csvPath} → ${jsonPath}`);
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, { columns: true, delimiter: ';', skip_empty_lines: true });
  
  const output = records.map(row => {
    const geo = parseGeoPoint(row.geo_point_2d);
    if (!geo) return null;
    
    // Construire adresse à partir de Voie(s) + CP ou Arrondissement
    const voies = row['Voie(s)'] || '';
    const cp = row['Code postal de l\'arrondissement'] || '';
    const adresse = voies ? `${voies}${cp ? ', ' + cp : ''}` : '';
    const arrondissement = cp ? cp.replace('750', '75') : '';
    
    return {
      adresse,
      arrondissement,
      geo,
      info: {
        'Identifiant': row['Identifiant'] || '',
        'Identifiant CTV': row['Identifiant CTV'] || '',
        'Code postal de l\'arrondissement': row['Code postal de l\'arrondissement'] || '',
        'Numéro de STV': row['Numéro de STV'] || '',
        'Typologie': row['Typologie'] || '',
        "Maitre d'ouvrage": row["Maitre d'ouvrage"] || '',
        'Objet': row['Objet'] || '',
        'Description': row['Description'] || '',
        'Voie(s)': row['Voie(s)'] || '',
        'Précisions de localisation': row['Précisions de localisation'] || '',
        'Date de début': row['Date de début'] || '',
        'Date de fin': row['Date de fin'] || '',
        'Impact sur la circulation': row['Impact sur la circulation'] || '',
        'Détail de l\'impact sur la circulation': row['Détail de l\'impact sur la circulation'] || '',
        'Niveau de perturbation': row['Niveau de perturbation'] || '',
        'Statut': row['Statut'] || '',
        'URL LettreInfoChantier': row['URL LettreInfoChantier'] || ''
      }
    };
  }).filter(Boolean);
  
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✓ ${output.length} perturbants exportés dans ${jsonPath}`);
}

// Conversion chantiers-a-paris.csv → travaux.json
// Attendu: colonnes similaires aux jeux Paris Data (Synthèse, dates, maître d'ouvrage, etc.)
function convertTravaux(csvPath, jsonPath) {
  console.log(`Conversion: ${csvPath} → ${jsonPath}`);
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, { columns: true, delimiter: ';', skip_empty_lines: true });

  const output = records.map(row => {
    const geo = parseGeoPoint(row.geo_point_2d || row['geo_point_2d']);
    if (!geo) return null;

    // Champs fréquents dans "Chantiers à Paris"
    const adresse = row['Adresse'] || row['Voie'] || row['Voie(s)'] || '';
    const arrondissement = row['Arrondissement'] || row['Code postal'] || row["Code postal de l'arrondissement"] || '';

    const info = {
      'Référence Chantier': row['Référence Chantier'] || row['Référence'] || '',
      'Synthèse - Nature du chantier': row['Synthèse - Nature du chantier'] || row['Synthèse'] || '',
      'Date début du chantier': row['Date début du chantier'] || row['Date de début'] || '',
      'Date fin du chantier': row['Date fin du chantier'] || row['Date de fin'] || '',
      "Maîtrise d'ouvrage principale": row["Maîtrise d'ouvrage principale"] || row["Maître d'ouvrage"] || '',
      'Responsable du chantier': row['Responsable du chantier'] || row['Responsable'] || '',
      'Encombrement espace public': row['Encombrement espace public'] || row['Encombrement'] || '',
      'Impact stationnement': row['Impact stationnement'] || '',
      'Surface (m2)': row['Surface (m2)'] || row['Surface'] || '',
      'Identifiant demande CITE': row['Identifiant demande CITE'] || row['Identifiant demande'] || '',
      'Identifiant Chantier CITE': row['Identifiant Chantier CITE'] || row['Identifiant Chantier'] || ''
    };

    return { adresse, arrondissement, geo, info };
  }).filter(Boolean);

  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✓ ${output.length} travaux exportés dans ${jsonPath}`);
}

// Exécution
const terrassesCSV = process.argv[2] || 'Downloads/terrasses-autorisations.csv';
const perturbantsCSV = process.argv[3] || 'Downloads/chantiers-perturbants.csv';
const travauxCSV = process.argv[4] || 'Downloads/chantiers-a-paris.csv';

const terrassesJSON = 'data/terrasses.json';
const perturbantsJSON = 'data/perturbants.json';
const travauxJSON = 'data/travaux.json';

try {
  convertTerrasses(terrassesCSV, terrassesJSON);
  convertPerturbants(perturbantsCSV, perturbantsJSON);
  convertTravaux(travauxCSV, travauxJSON);
  console.log('\n✅ Conversion terminée. Vérifiez les fichiers dans data/ puis lancez ./prepare_deploy.sh');
} catch (err) {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
}
