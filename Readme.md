# JoanneumResearch-OID

OID-Repository für JOANNEUM RESEARCH Forschungsgesellschaft mbH im österreichischen eHealth-Rahmen.

**JR-OID-Root:** `2.16.840.1.113883.2.16.3.1.21`
(HL7 Austria Organisationsknoten, zugewiesen an JOANNEUM RESEARCH)

---

## Hintergrund

JOANNEUM RESEARCH verfügt über den HL7-Austria-Organisationsknoten
`2.16.840.1.113883.2.16.3.1.21` und ist als *Registration Authority* berechtigt, den
darunter liegenden Teilbaum eigenverantwortlich zu verwalten
(gemäß ISO/IEC 9834-1 und ÖNORM A 2642:2011, EHSREG OID-Leitfaden v1.0.0).

Dieses Repository ist das interne OID-Registry für alle unter diesem Knoten vergebenen OIDs.
Grundlage für Struktur und Governance ist der [EHSREG OID-Leitfaden v1.0.0](OID-Leitfaden_1-0-0.pdf).

Die OIDs werden als **öffentlich zugängliche Webseite** unter
**[jr-health.github.io/JoanneumResearch-OID/](https://jr-health.github.io/JoanneumResearch-OID/)** publiziert und sind dort von
Suchmaschinen indizierbar. Damit entfällt eine formale Meldung an EHSREG/HL7 Austria.

---

## OID-Baumstruktur

| OID-Muster | Symbolischer Name | Inhalt / Zweck |
|---|---|---|
| `2.16.840.1.113883.2.16.3.1.21` | `organization` | Root-Knoten (JR selbst); fixer Einzeleintrag, nicht erweiterbar |
| `2.16.840.1.113883.2.16.3.1.21.1.x` | `instance-identifier` | Instanz-Identifier-Namespaces (Patienten-/Probanden-IDs, Fall-IDs, Studien-IDs etc.) – gemäß Tanjga-Vorschlag ohne Unterteilung |
| `2.16.840.1.113883.2.16.3.1.21.2.x` | `identification-mechanism` | Identifikationsmechanismen |
| `2.16.840.1.113883.2.16.3.1.21.3.x` | `code-schemes` | Codeschemata & Terminologien |
| `2.16.840.1.113883.2.16.3.1.21.3.1.x` | `code-systems` | CodeSystems |
| `2.16.840.1.113883.2.16.3.1.21.3.2.x` | `value-sets` | ValueSets |
| `2.16.840.1.113883.2.16.3.1.21.3.3.x` | `concept-maps` | ConceptMaps |
| `2.16.840.1.113883.2.16.3.1.21.4.x` | `documents` | Policies, Consent-Profile, Studienprotokolle |
| `2.16.840.1.113883.2.16.3.1.21.5.x` | `services` | eHealth-Services, FHIR-Server-Instanzen, APIs |
| `2.16.840.1.113883.2.16.3.1.21.6.x` | `templates` | FHIR StructureDefinitions, Profile, Implementation Guides |
| `2.16.840.1.113883.2.16.3.1.21.7.x` | `system-artefacts` | Softwaresysteme, Geräte, Sensor-Plattformen |
| `2.16.840.1.113883.2.16.3.1.21.8.x` | `research` | Studien, Datensätze, KI-Modelle, Scoring-Methoden *(JR-spezifisch)* |
| `2.16.840.1.113883.2.16.3.1.21.9.x` | `alias` | Kürzere Alias-OIDs (z.B. für DICOM-Kompatibilität, max. 64 Zeichen) |
| `2.16.840.1.113883.2.16.3.1.21.99.x` | `experimental` | Pilotprojekte, Test-Namespaces *(nicht für Produktion)* |

---

## Geplante Repository-Struktur

```
JoanneumResearch-OID/
  oids/
    0-organization/
      joanneum-research.json
    1-instance-identifier/
    2-identification-mechanism/
    3-code-schemes/
      3-1-code-systems/
      3-2-value-sets/
      3-3-concept-maps/
    4-documents/
    5-services/
    6-templates/
      prenudge-appdata-r4.json
    7-system-artefacts/
    8-research/
    9-alias/
    99-experimental/
  schema/
    oid-entry.schema.json
  .sveltia-cms/
    config.yml
```

Jede OID wird als eine JSON-Datei erfasst. Beispiel (`oids/6-templates/prenudge-appdata-r4.json`):

```json
{
  "dotNotation": "2.16.840.1.113883.2.16.3.1.21.6.1",
  "symbolicName": "prenudge-appdata-r4",
  "category": "template",
  "status": "active",
  "description": [
    { "lang": "de", "text": "PräNUDGE FHIR R4 Implementation Guide (AppData)" },
    { "lang": "en", "text": "PräNUDGE FHIR R4 Implementation Guide (AppData)" }
  ],
  "link_uri": "https://github.com/JoanneumResearch/JoanneumResearch-PreNUDGE-AppData-R4",
  "creationDate": "2026-06-26",
  "lastmodifiedDate": "2026-06-26",
  "responsibleAuthority": {
    "person_name": "Thomas Truskaller",
    "organization_name": "JOANNEUM RESEARCH Forschungsgesellschaft mbH",
    "organization_telecom": "thomas.truskaller@joanneum.at"
  }
}
```

Pflicht-Metadaten gemäß OID-Leitfaden Kap. 5.4: `dotNotation`, `symbolicName`, `category`,
`status`, `description` (DE + EN), `registrationAuthority`, `responsibleAuthority`.

---

## Governance

### OID-Vergabeprozess

1. **Antrag**: Issue im Repo anlegen mit gewünschtem Zweig, Zweck, `symbolicName`-Vorschlag und verantwortlicher Person.
2. **Prüfung**: OID-Verantwortliche/r prüft Eindeutigkeit und korrekte Zweig-Zuordnung.
3. **Vergabe**: JSON-Datei anlegen, Commit, CI-Check grün → OID ist aktiv.
4. **Keine Rücknahme**: Einmal vergebene OIDs bleiben dauerhaft gültig. Status kann auf `retired` gesetzt werden, die OID selbst bleibt im Repository.

### Verantwortlichkeiten pro Zweig

| Zweig | Empfohlene Verantwortung |
|---|---|
| `organization` (Root) | OID-Verantwortliche/r (create/delete gesperrt, nur Bearbeitung) |
| `.1` instance-identifier | Projektleitung / Datenschutzbeauftragte/r |
| `.2` identification-mechanism | Projektleitung / Datenschutzbeauftragte/r |
| `.3` code-schemes | FHIR IG Autor:innen |
| `.4` documents | Projektleitung |
| `.5` services | DevOps / Systemarchitektur |
| `.6` templates | FHIR IG Autor:innen |
| `.7` system-artefacts | DevOps / IT |
| `.8` research | Wissenschaftliche/r Projektleiter:in je Studie |
| `.9` alias | Wer die ursprüngliche OID vergeben hat |
| `.99` experimental | Frei, kein formaler Freigabeprozess |

### Namenskonventionen (`symbolicName`)

- Kleinbuchstaben, Ziffern, Bindestriche
- Beginnt mit Kleinbuchstabe; max. 25 Zeichen
- Kein Bindestrich am Anfang/Ende, keine zwei aufeinanderfolgenden Bindestriche
- OID-Länge: max. 255 Zeichen (Dot-Notation); max. 64 Zeichen für DICOM-Kompatibilität — bei Überschreitung Alias-Eintrag im `.9`-Zweig anlegen

---

## Sveltia CMS lokal ausführen

Anders als beim alten Netlify/Decap CMS braucht Sveltia CMS für lokales
Arbeiten **keinen Proxy-Server** und kein `local_backend` in der Config
(`@sveltia/cms-proxy-server` existiert für Sveltia CMS nicht und funktioniert
daher nicht). Stattdessen nutzt Sveltia CMS die File-System-Access-API des
Browsers direkt:

1. **Statischen Server** im Repo-Root starten, da `admin/index.html` kein
   Build-Tool hat, z. B.:
   ```
   npx http-server .
   ```
   (alternativ `npx serve .`)
2. `admin/index.html` in einem **Chromium-basierten Browser** öffnen (Chrome,
   Edge oder Brave — **Firefox/Safari funktionieren nicht**, da die File
   System Access API benötigt wird).
3. Auf **„Work with Local Repository"** klicken und den Projekt-Root-Ordner
   auswählen.

**Wichtig:** Der lokale Modus macht **keine Git-Operationen** — Commit und
Push müssen weiterhin manuell per Git erfolgen. Für den Produktivbetrieb
gegen das echte GitHub-Backend muss zusätzlich das OAuth-Relay eingerichtet
werden (siehe Kommentar oben in `.sveltia-cms/config.yml`).

---

## Dokumente

| Datei | Inhalt |
|---|---|
| [`OID-Leitfaden_1-0-0.pdf`](OID-Leitfaden_1-0-0.pdf) | EHSREG OID-Leitfaden v1.0.0 (Austria) |
| [`konzept-vorschlag-tanjga.adoc`](konzept-vorschlag-tanjga.adoc) | Initialer Konzeptvorschlag (Tanjga, 2026-06-26) |
| [`oid-konzept-bewertung.adoc`](oid-konzept-bewertung.adoc) | Bewertung und Empfehlung auf Basis des Leitfadens (Truskaller, 2026-06-26) |

---

## Offene Punkte

- [x] JSON-Schema für OID-Einträge definieren (`schema/oid-entry.schema.json`)
- [x] Sveltia CMS Konfiguration erstellen (`.sveltia-cms/config.yml`)
- [x] Erste OID-Einträge anlegen: JR-Root-Knoten + PräNUDGE FHIR IG
- [x] Öffentliche Publikation über GitHub Actions + GitHub Pages (aktuell unter
      `https://jr-health.github.io/JoanneumResearch-OID/`, inkl. `/admin/`)
- [x] OAuth-Relay für Sveltia CMS eingerichtet (bestehender Cloudflare Worker
      `sveltia-cms-auth` wiederverwendet) — Login + Speichern erfolgreich getestet
- [x] CI-Validierungsscript implementieren (GitHub Actions): Eindeutigkeit von
      `symbolicName`/`dotNotation`, Schema-Validierung, DE+EN-Beschreibung
- [x] `lastmodifiedDate` wird automatisch per CI korrigiert, falls sich der
      Inhalt einer OID geändert hat (statt manuell im CMS gepflegt zu werden)
- [ ] Verantwortliche pro Zweig festlegen
- [ ] Prozess wie neue OIDs angefordert, vergeben und veröffentlicht werden testen
### optional:
- [ ] Eigene Domain `oid.joanneum.at` einrichten (DNS-CNAME + Pages-Custom-Domain + Homepage-/Callback-URLs der GitHub-OAuth-App anpassen)
- [ ] Statische Übersichtsseite weiter verbessern
- [ ] Entscheidung: Repository dauerhaft öffentlich lassen oder GitHub Pro/Team
  für privates GitHub Pages
---

## Kontakt

Theresa Weitlaner — Theresa.Weitlaner@joanneum.at  
JOANNEUM RESEARCH Forschungsgesellschaft mbH
