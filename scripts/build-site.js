// Baut aus oids/**/*.json eine statische index.html fürs GitHub-Pages-Deployment.
// Aufruf: node scripts/build-site.js
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const OIDS_DIR = path.join(ROOT, 'oids');
const OUT_DIR = path.join(ROOT, '_site');

const REPO_URL = 'https://github.com/jr-health/JoanneumResearch-OID';
const REPO_BRANCH = 'main';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function dotSortKey(dot) {
  return dot.split('.').map((n) => n.padStart(6, '0')).join('.');
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

const files = walk(OIDS_DIR);
const entries = files.map((f) => {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  data.__relPath = path.relative(ROOT, f).split(path.sep).join('/');
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
    <td>${escapeHtml(e.lastmodifiedDate)}</td>
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
<h1>JOANNEUM RESEARCH OID Registry</h1>
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
     <a href="admin/">CMS-Verwaltung</a></p>
</footer>
</body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
console.log(`Built ${entries.length} entries (commit ${shortSha}) -> ${path.join(OUT_DIR, 'index.html')}`);
