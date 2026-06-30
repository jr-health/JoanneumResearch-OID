# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repository is the **OID Registry for JOANNEUM RESEARCH** (`2.16.840.1.113883.2.16.3.1.21`) within the Austrian eHealth framework. It manages Object Identifiers (OIDs) assigned by HL7 Austria. OIDs are published publicly at **https://oid.joanneum.at**.

The repository is in its **setup phase** — the OID tree structure and governance are defined, but the `oids/` directory, JSON Schema, and Sveltia CMS configuration have not yet been created. See `README.md` for the current open tasks.

## Repository Structure (Planned)

```
oids/                        # One JSON file per OID entry
  1-instance-identifier/     # Patient/personnel/system IDs
  3-code-schemes/            # CodeSystems, ValueSets, ConceptMaps
  6-templates/               # FHIR IGs and StructureDefinitions
  8-research/                # Studies, datasets, AI models (JR-specific)
  9-alias/                   # Short aliases for DICOM compatibility (≤64 chars)
  99-experimental/           # Temporary/pilot — not for production
schema/
  oid-entry.schema.json      # JSON Schema for validating OID entries
.sveltia-cms/
  config.yml                 # CMS config for non-technical editors
```

## OID Entry Format

Each OID is a single JSON file. Required fields (per EHSREG OID-Leitfaden Kap. 5.4):

```json
{
  "dotNotation": "2.16.840.1.113883.2.16.3.1.21.6.1",
  "symbolicName": "prenudge-appdata-r4",
  "category": "template",
  "status": "active",
  "description": [
    { "lang": "de", "text": "..." },
    { "lang": "en", "text": "..." }
  ],
  "registrationAuthority": "JOANNEUM RESEARCH Forschungsgesellschaft mbH",
  "responsibleAuthority": {
    "person_name": "...",
    "organization_name": "JOANNEUM RESEARCH Forschungsgesellschaft mbH",
    "organization_telecom": "...@joanneum.at"
  },
  "creationDate": "YYYY-MM-DD",
  "lastmodifiedDate": "YYYY-MM-DD",
  "link_uri": "https://..."
}
```

Valid `category` values (official EHSREG types): `identificationscheme | organization | person | community | codingscheme | document | alias | template | experimental`. The `.8 research` branch uses `document` or `experimental` as the closest official match.

Valid `status` values: `active | inactive | retired | pending`

## Key Rules

- **`symbolicName`**: lowercase, digits, hyphens only; starts with lowercase letter; max 25 chars; no leading/trailing/consecutive hyphens.
- **OID length**: max 255 chars (dot-notation); max 64 chars for DICOM compatibility — create an alias entry under `.9` if exceeded.
- **No revocation**: once assigned, OIDs are permanent. Set `status: retired` to deprecate; never delete the file.
- **Both languages required**: `description` must always contain entries for `de` and `en`.
- **No sub-delegation**: JR may not delegate OID registration authority to other organizations.

## Key Documents

| File | Content |
|---|---|
| `README.md` | OID tree structure, governance, open tasks |
| `oid-konzept-bewertung.adoc` | Evaluation of the OID concept and recommended structure (authoritative) |
| `konzept-vorschlag-tanjga.adoc` | Initial concept proposal (input for the evaluation above) |
| `OID-Leitfaden_1-0-0.pdf` | EHSREG Austrian OID guideline v1.0.0 (normative reference) |

## CI Validation (Planned)

When the CI script is implemented, it will check per commit:
- All required fields present (validate against `schema/oid-entry.schema.json`)
- `symbolicName` unique across the entire repo
- `dotNotation` unique and syntactically valid (digits and dots only)
- `description` contains entries for both `de` and `en`
- `status` is a valid value
