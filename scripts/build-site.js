// Baut aus oids/**/*.json eine statische index.html fürs GitHub-Pages-Deployment.
// Aufruf: node scripts/build-site.js
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { ROOT, listOidFiles, relPath } = require('./lib/oids');

const OUT_DIR = path.join(ROOT, '_site');
const ASSETS_DIR = path.join(ROOT, 'assets');

const REPO_URL = 'https://github.com/jr-health/JoanneumResearch-OID';
const REPO_BRANCH = 'main';
const RESEARCH_GROUP_URL = 'https://www.joanneum.at/health/en/research-groups/digital-healthcare-solutions/';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function dotSortKey(dot) {
  return dot.split('.').map((n) => n.padStart(6, '0')).join('.');
}

// Zeigt lastmodifiedDate lesbar an ("YYYY-MM-DD HH:mm", UTC), statt der
// vollen ISO-Zeichenkette mit Sekunden/Offset. Rohwert bleibt im JSON-LD.
function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function getCommitSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return null;
  }
}

const commitSha = getCommitSha();
const shortSha = commitSha ? commitSha.slice(0, 7) : 'unknown';
const buildTime = new Date().toISOString();

const files = listOidFiles();
const entries = files.map((f) => {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  data.__relPath = relPath(f);
  return data;
});
entries.sort((a, b) => dotSortKey(a.dotNotation).localeCompare(dotSortKey(b.dotNotation)));

const rows = entries.map((e) => {
  const de = (e.description || []).find((d) => d.lang === 'de')?.text || '';
  const responsible = e.responsibleAuthority?.person_name || '';
  const link = e.link_uri
    ? `<a href="${escapeHtml(e.link_uri)}" target="_blank" rel="noopener">${escapeHtml(e.link_uri)}</a>`
    : '';
  const historyUrl = `${REPO_URL}/commits/${REPO_BRANCH}/${e.__relPath}`;
  const jsonUrl = `${REPO_URL}/blob/${REPO_BRANCH}/${e.__relPath}`;
  const anchorId = `oid-${e.symbolicName}`;
  return `<tr id="${escapeHtml(anchorId)}">
    <td><a href="#${escapeHtml(anchorId)}" class="anchor" title="Permalink">#</a> <code>${escapeHtml(e.dotNotation)}</code></td>
    <td>${escapeHtml(e.symbolicName)}</td>
    <td>${escapeHtml(e.category)}</td>
    <td><span class="status status-${escapeHtml(e.status)}">${escapeHtml(e.status)}</span></td>
    <td>${escapeHtml(de)}</td>
    <td>${escapeHtml(responsible)}</td>
    <td>${escapeHtml(formatDateTime(e.lastmodifiedDate))}</td>
    <td>${link}</td>
    <td><a href="${jsonUrl}" target="_blank" rel="noopener">JSON</a> · <a href="${historyUrl}" target="_blank" rel="noopener">Verlauf</a></td>
  </tr>`;
}).join('\n');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'JOANNEUM RESEARCH OID Registry',
  description: 'Registry der unter 2.16.840.1.113883.2.16.3.1.21 vergebenen OIDs.',
  identifier: '2.16.840.1.113883.2.16.3.1.21',
  url: REPO_URL,
  dateModified: buildTime,
  hasPart: entries.map((e) => ({
    '@type': 'DefinedTerm',
    identifier: e.dotNotation,
    name: e.symbolicName,
    description: (e.description || []).find((d) => d.lang === 'de')?.text,
    dateModified: e.lastmodifiedDate,
    url: `${REPO_URL}/blob/${REPO_BRANCH}/${e.__relPath}`,
  })),
};

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JOANNEUM RESEARCH OID Registry</title>
<meta name="description" content="Öffentliches Registry der von JOANNEUM RESEARCH unter 2.16.840.1.113883.2.16.3.1.21 vergebenen OIDs (HL7 Austria).">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
  .site-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
  .site-header img { height: 64px; width: auto; display: block; }
  .site-header h1 { margin: 0; }
  h1 { font-size: 1.4rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  code { font-size: 0.85em; }
  tr:target { background: #fff8dc; }
  a.anchor { text-decoration: none; color: #aaa; margin-right: 0.2rem; }
  .status { padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.8em; white-space: nowrap; }
  .status-active { background: #d4edda; color: #155724; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-inactive { background: #e2e3e5; color: #383d41; }
  .status-retired { background: #f8d7da; color: #721c24; }
  footer { margin-top: 2rem; font-size: 0.8rem; color: #777; }
  footer a { color: #555; }
</style>
</head>
<body>
<header class="site-header">
  <a href="${RESEARCH_GROUP_URL}" target="_blank" rel="noopener" title="JOANNEUM RESEARCH – Digital Healthcare Solutions">
    <img src="assets/JOANNEUM-RESEARCH-allgemein-logo-rgb.png" alt="JOANNEUM RESEARCH Logo">
  </a>
  <h1>JOANNEUM RESEARCH OID Registry</h1>
</header>
<p>Root-OID: <code>2.16.840.1.113883.2.16.3.1.21</code> — ${entries.length} Einträge</p>
<table>
<thead>
<tr><th>OID</th><th>Symbolischer Name</th><th>Kategorie</th><th>Status</th><th>Beschreibung (DE)</th><th>Verantwortlich</th><th>Letzte Änderung</th><th>Link</th><th>Quelle</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<footer>
  <p>Generiert aus <code>oids/**/*.json</code> bei jedem Push auf <code>${REPO_BRANCH}</code>.
     Build: ${buildTime} · Commit: <a href="${REPO_URL}/commit/${commitSha || ''}" target="_blank" rel="noopener"><code>${escapeHtml(shortSha)}</code></a></p>
  <p><a href="${REPO_URL}" target="_blank" rel="noopener">Repository</a> ·
     <a href="${REPO_URL}/commits/${REPO_BRANCH}" target="_blank" rel="noopener">Änderungshistorie</a> ·
     <a href="admin/">CMS-Verwaltung</a> ·
     <a href="${RESEARCH_GROUP_URL}" target="_blank" rel="noopener">Digital Healthcare Solutions (Forschungsgruppe)</a></p>
</footer>
</body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
if (fs.existsSync(ASSETS_DIR)) {
  fs.cpSync(ASSETS_DIR, path.join(OUT_DIR, 'assets'), { recursive: true });
}
console.log(`Built ${entries.length} entries (commit ${shortSha}) -> ${path.join(OUT_DIR, 'index.html')}`);
