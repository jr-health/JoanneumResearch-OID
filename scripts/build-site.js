// Baut aus oids/**/*.json eine statische index.html fürs GitHub-Pages-Deployment.
// Aufruf: node scripts/build-site.js
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OIDS_DIR = path.join(ROOT, 'oids');
const OUT_DIR = path.join(ROOT, '_site');

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

const files = walk(OIDS_DIR);
const entries = files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
entries.sort((a, b) => dotSortKey(a.dotNotation).localeCompare(dotSortKey(b.dotNotation)));

const rows = entries.map((e) => {
  const de = (e.description || []).find((d) => d.lang === 'de')?.text || '';
  const responsible = e.responsibleAuthority?.person_name || '';
  const link = e.link_uri
    ? `<a href="${escapeHtml(e.link_uri)}" target="_blank" rel="noopener">${escapeHtml(e.link_uri)}</a>`
    : '';
  return `<tr>
    <td><code>${escapeHtml(e.dotNotation)}</code></td>
    <td>${escapeHtml(e.symbolicName)}</td>
    <td>${escapeHtml(e.category)}</td>
    <td><span class="status status-${escapeHtml(e.status)}">${escapeHtml(e.status)}</span></td>
    <td>${escapeHtml(de)}</td>
    <td>${escapeHtml(responsible)}</td>
    <td>${link}</td>
  </tr>`;
}).join('\n');

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JOANNEUM RESEARCH OID Registry</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  code { font-size: 0.85em; }
  .status { padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.8em; white-space: nowrap; }
  .status-active { background: #d4edda; color: #155724; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-inactive { background: #e2e3e5; color: #383d41; }
  .status-retired { background: #f8d7da; color: #721c24; }
  footer { margin-top: 2rem; font-size: 0.8rem; color: #777; }
</style>
</head>
<body>
<h1>JOANNEUM RESEARCH OID Registry</h1>
<p>Root-OID: <code>2.16.840.1.113883.2.16.3.1.21</code> — ${entries.length} Einträge</p>
<table>
<thead>
<tr><th>OID</th><th>Symbolischer Name</th><th>Kategorie</th><th>Status</th><th>Beschreibung (DE)</th><th>Verantwortlich</th><th>Link</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<footer>Generiert aus <code>oids/**/*.json</code> bei jedem Push auf <code>main</code>. <a href="admin/">CMS-Verwaltung</a></footer>
</body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
console.log(`Built ${entries.length} entries -> ${path.join(OUT_DIR, 'index.html')}`);
