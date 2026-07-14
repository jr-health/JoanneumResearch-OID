// Gemeinsame Helper für build-site.js, validate-oids.js und fix-lastmodified.js
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

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

// Ermittelt den Commit, gegen den die aktuell geänderten oids/*.json verglichen
// werden sollen: PR-Base-SHA, der Stand vor einem Push, oder lokal HEAD~1.
function resolveBaseRef() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (process.env.GITHUB_EVENT_NAME === 'pull_request' && eventPath) {
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    return event.pull_request?.base?.sha || null;
  }
  if (process.env.GITHUB_EVENT_NAME === 'push' && eventPath) {
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
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

// Lädt eine oids/*.json-Datei aus einem bestimmten Commit (git show), oder
// null, falls die Datei dort noch nicht existierte oder kein gültiges JSON war.
function readJsonAtRef(ref, rel) {
  let raw;
  try {
    raw = execSync(`git show ${ref}:${rel}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { ROOT, OIDS_DIR, listOidFiles, relPath, resolveBaseRef, readJsonAtRef };
