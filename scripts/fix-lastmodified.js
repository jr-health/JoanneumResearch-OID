// Aktualisiert lastmodifiedDate automatisch für jede oids/*.json, deren
// sonstiger Inhalt sich gegenüber dem Vergleichs-Commit geändert hat.
// Läuft über .github/workflows/auto-fix-lastmodified.yml nach jedem Push auf
// main; der Workflow committet + pusht die Korrektur bei Bedarf selbst.
//
// Aufruf: node scripts/fix-lastmodified.js
const fs = require('node:fs');
const { listOidFiles, relPath, resolveBaseRef, readJsonAtRef } = require('./lib/oids');

function withoutLastmodified(data) {
  const { lastmodifiedDate, ...rest } = data;
  return JSON.stringify(rest);
}

const baseRef = resolveBaseRef();
if (!baseRef) {
  console.log('Kein Vergleichs-Commit gefunden (z. B. erster Commit) — nichts zu tun.');
  process.exit(0);
}

const now = new Date().toISOString();
let fixedCount = 0;

for (const file of listOidFiles()) {
  const rel = relPath(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  const oldData = readJsonAtRef(baseRef, rel);
  if (oldData === null) continue; // neue Datei - nichts zu vergleichen

  if (withoutLastmodified(oldData) !== withoutLastmodified(data)) {
    data.lastmodifiedDate = now;
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`lastmodifiedDate aktualisiert: ${rel}`);
    fixedCount += 1;
  }
}

console.log(fixedCount > 0 ? `${fixedCount} Datei(en) korrigiert.` : 'Keine Korrektur nötig.');
