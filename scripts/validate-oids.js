// CI-Validierung für oids/**/*.json (siehe CLAUDE.md, Abschnitt "CI Validation"):
//   1. Alle Pflichtfelder vorhanden / Schema-Validierung gegen schema/oid-entry.schema.json
//   2. symbolicName eindeutig im gesamten Repo
//   3. dotNotation eindeutig und syntaktisch korrekt
//   4. description enthält Einträge für de und en
//   5. status ist ein gültiger Wert
//   (4. und 5. werden bereits vom JSON-Schema erzwungen, siehe dort)
//   6. lastmodifiedDate wurde aktualisiert, wenn sich eine bereits vorhandene Datei geändert hat
//
// Aufruf: node scripts/validate-oids.js
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
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

// --- 6. lastmodifiedDate wurde bei Änderungen aktualisiert ------------------
function resolveBaseRef() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (process.env.GITHUB_EVENT_NAME === 'pull_request' && eventPath) {
    const event = loadJson(eventPath);
    return event.pull_request?.base?.sha || null;
  }
  if (process.env.GITHUB_EVENT_NAME === 'push' && eventPath) {
    const event = loadJson(eventPath);
    if (event.before && !/^0+$/.test(event.before)) return event.before;
    return null;
  }
  try {
    execSync('git rev-parse HEAD~1', { cwd: ROOT, stdio: 'ignore' });
    return 'HEAD~1';
  } catch {
    return null;
  }
}

const baseRef = resolveBaseRef();
if (!baseRef) {
  console.log('Kein Vergleichs-Commit gefunden (z. B. erster Commit / neuer Branch) — lastmodifiedDate-Check übersprungen.');
} else {
  for (const { rel, data } of entries) {
    let oldRaw;
    try {
      oldRaw = execSync(`git show ${baseRef}:${rel}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    } catch {
      continue; // Datei ist neu in diesem Commit/PR - kein Vergleich nötig
    }

    let oldData;
    try {
      oldData = JSON.parse(oldRaw);
    } catch {
      continue; // alte Version war kein gültiges JSON, nichts zu vergleichen
    }

    const changed = JSON.stringify(oldData) !== JSON.stringify(data);
    if (changed && oldData.lastmodifiedDate === data.lastmodifiedDate) {
      fail(rel, `Inhalt hat sich geändert, aber "lastmodifiedDate" (${data.lastmodifiedDate}) wurde nicht aktualisiert`);
    }
  }
}

// --- Ergebnis ----------------------------------------------------------------
if (errorCount > 0) {
  console.error(`\n${errorCount} Fehler in ${files.length} OID-Einträgen gefunden.`);
  process.exit(1);
}
console.log(`✓ Alle ${entries.length} OID-Einträge sind gültig.`);
