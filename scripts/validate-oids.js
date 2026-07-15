// CI-Validierung für oids/**/*.json (siehe CLAUDE.md, Abschnitt "CI Validation"):
//   1. Alle Pflichtfelder vorhanden / Schema-Validierung gegen schema/oid-entry.schema.json
//   2. symbolicName eindeutig im gesamten Repo
//   3. dotNotation eindeutig und syntaktisch korrekt
//   4. description enthält Einträge für de und en
//   5. status ist ein gültiger Wert
//   (4. und 5. werden bereits vom JSON-Schema erzwungen, siehe dort)
//
// lastmodifiedDate wird nicht mehr auf "wurde bei Änderungen aktualisiert"
// geprüft, sondern automatisch von scripts/fix-lastmodified.js korrigiert
// (siehe .github/workflows/auto-fix-lastmodified.yml). Manuelle Werte sind
// weiterhin möglich (z. B. um historische Zeitstempel zu korrigieren) - hier
// wird nur noch geprüft, ob so ein manueller Wert überhaupt plausibel ist.
//
// Aufruf: node scripts/validate-oids.js
const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { ROOT, listOidFiles, relPath } = require('./lib/oids');

const SCHEMA_PATH = path.join(ROOT, 'schema', 'oid-entry.schema.json');

let errorCount = 0;
function fail(file, message) {
  console.error(`✗ ${file}: ${message}`);
  errorCount += 1;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// --- 1. Schema-Validierung ------------------------------------------------
const schema = loadJson(SCHEMA_PATH);
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const files = listOidFiles();
if (files.length === 0) {
  console.log('Keine oids/**/*.json gefunden — nichts zu validieren.');
  process.exit(0);
}

const entries = [];
for (const file of files) {
  const rel = relPath(file);
  let data;
  try {
    data = loadJson(file);
  } catch (err) {
    fail(rel, `Ungültiges JSON (${err.message})`);
    continue;
  }

  const valid = validateSchema(data);
  if (!valid) {
    for (const err of validateSchema.errors) {
      fail(rel, `${err.instancePath || '/'} ${err.message}`);
    }
    continue;
  }

  entries.push({ file, rel, data });
}

// --- 2. symbolicName eindeutig ---------------------------------------------
// --- 3. dotNotation eindeutig -----------------------------------------------
const bySymbolicName = new Map();
const byDotNotation = new Map();
for (const { rel, data } of entries) {
  if (bySymbolicName.has(data.symbolicName)) {
    fail(rel, `symbolicName "${data.symbolicName}" bereits vergeben in ${bySymbolicName.get(data.symbolicName)}`);
  } else {
    bySymbolicName.set(data.symbolicName, rel);
  }

  if (byDotNotation.has(data.dotNotation)) {
    fail(rel, `dotNotation "${data.dotNotation}" bereits vergeben in ${byDotNotation.get(data.dotNotation)}`);
  } else {
    byDotNotation.set(data.dotNotation, rel);
  }
}

// --- 4. lastmodifiedDate plausibel (nicht in der Zukunft, nicht vor creationDate) ---
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000; // Toleranz für Clock-Skew zwischen CMS/Client und CI-Runner
const now = Date.now();
for (const { rel, data } of entries) {
  const lastModified = new Date(data.lastmodifiedDate).getTime();
  const created = new Date(data.creationDate).getTime();

  if (lastModified > now + FUTURE_TOLERANCE_MS) {
    fail(rel, `lastmodifiedDate (${data.lastmodifiedDate}) liegt in der Zukunft`);
  } else if (lastModified < created) {
    fail(rel, `lastmodifiedDate (${data.lastmodifiedDate}) liegt vor creationDate (${data.creationDate})`);
  }
}

// --- Ergebnis ----------------------------------------------------------------
if (errorCount > 0) {
  console.error(`\n${errorCount} Fehler in ${files.length} OID-Einträgen gefunden.`);
  process.exit(1);
}
console.log(`✓ Alle ${entries.length} OID-Einträge sind gültig.`);
