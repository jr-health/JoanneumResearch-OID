// Gemeinsame Helper für build-site.js und validate-oids.js
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const OIDS_DIR = path.join(ROOT, 'oids');

function walkJsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function listOidFiles() {
  return walkJsonFiles(OIDS_DIR);
}

function relPath(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

module.exports = { ROOT, OIDS_DIR, listOidFiles, relPath };
