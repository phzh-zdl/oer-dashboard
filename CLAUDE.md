# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PHZH OER — a single-page catalog of Open Educational Resources for Pädagogische Hochschule Zürich. UI strings and content are German.

## Status

In Migration vom ClaudeDesign-Prototyp (CDN-basiert, CSV-driven) zu Vite + React + Supabase + Netlify mit Admin-Panel. Plan: `C:\Users\henry.chen\.claude\plans\delegated-booping-blum.md`.

## Hartnäckige Constraints (gelten dauerhaft)

- **Kein CDN** — alle Runtime-Abhängigkeiten kommen aus npm und werden lokal gebündelt. Schul-IT verbietet externe CDN-Requests im Browser. Das gilt auch für Fonts (→ via `@fontsource/*` als npm-Paket einbinden, nicht via Google Fonts CSS-Link).
- **Wöchentliche Update-Checks** — `.github/dependabot.yml` öffnet PRs für npm- und Action-Updates; `.github/workflows/audit.yml` lässt CI bei `high`/`critical` Vulnerabilities fehlschlagen. Beim Hinzufügen neuer Deps prüfen, dass beide Mechanismen sie noch erfassen.
- **Anon-Key + RLS** — der Supabase Anon-Key landet im Client (Vite env `VITE_SUPABASE_ANON_KEY`). Datenschutz wird ausschließlich über RLS-Policies in der DB durchgesetzt, nicht über Key-Geheimhaltung. Der `service_role`-Key kommt **nie** in den Client und nie ins Repo.
- **`safeHttps()` auf jede externe URL** — sowohl client- als auch DB-seitig (`check (url ~* '^https://')`). Verhindert `javascript:`, `data:`, `file:` etc. aus eingegebenen Daten.

## Arbeitsweise mit dem User

Der User ist mit GitHub, Netlify und Supabase noch nicht vertraut. Beim Aufsetzen / Konfigurieren externer Dienste:
- Schritt-für-Schritt-Anleitung mit erwarteten Klicks, URLs, Eingaben.
- Pro Schritt kurz erklären, **was passiert** und **wozu**, nicht nur **wie**.
- Verifikations-Anker: nach jedem Block ein konkretes "Du müsstest jetzt X sehen".
- Code-Änderungen mache ich, manuelle Browser-/Dashboard-Schritte macht der User.

## Running it

No build step, no package manager. Open `index.html` via any static file server from the project root (e.g. `python -m http.server`, `npx serve`). Loading via `file://` will break the `fetch('resources.csv')` call.

React, ReactDOM, Babel-Standalone, and SheetJS are pulled from CDNs at runtime; JSX is compiled in the browser by `@babel/standalone` (the `<script type="text/babel">` tag in `index.html`). There is no bundler, no test suite, no linter configured.

`src/styles.css` is referenced as `styles.css?v=6` — bump the version when changing CSS to bust caches.

## Architecture

Four scripts load in order from `index.html` and communicate exclusively through `window` globals:

1. `src/data.js` → `window.PHZH_DATA = { CATEGORIES, RESOURCES }`. The hardcoded `RESOURCES` array is **fallback only**; real content comes from the CSV. `CATEGORIES` is the source of truth for category ids, labels, and accent colors — its ids must match the `kategorie` column values in CSVs.
2. `src/placeholder.js` → `window.PHZH_PLACEHOLDER.placeholderSVG(resource, catLabel, w, h)`. Generates a deterministic striped SVG (data URL) per resource id, used when no `bild` is provided.
3. `src/sheet.js` → `window.PHZH_SHEET.{ loadFromSheet, loadFromFile, parseCSV, rowsToResources }`. Loads CSV from a URL or a local CSV/XLSX file. Handles UTF-8 vs Windows-1252 (Excel-on-Windows exports), auto-detects `;` vs `,` delimiter, and accepts both German (`titel`, `beschreibung`, `kategorie`, `bild`, `fokus`) and English (`title`, `desc`, `cat`, `image`/`img`, `featured`) header names.
4. `src/app.jsx` → React app mounted at `#root`.

### Data flow

On mount, `App` calls `PHZH_SHEET.loadFromSheet('resources.csv')` (relative path → loaded via `fetch`). If the user pastes a Google Sheets CSV URL into the Tweaks panel, that fetch replaces the local one. If neither succeeds, the hardcoded `FALLBACK_RESOURCES` from `data.js` is used. Source of truth at runtime is the `sheetResources` state, normalized so every resource has a `tags` array (split from the comma-separated `tag` column).

### Featured carousel

`pickFeatured` is a seeded shuffle. The seed comes from `state.rotation`:
- `daily` — `dayOfYear() * 2654435761` (everyone sees the same set on the same day)
- `weekly` — week-of-year × the same constant
- `session` — random per page load (`sessionSeedRef`)

Resources flagged `featured: true` (CSV column `featured` / `fokus`, truthy values: `1|true|ja|yes|x|y|fokus`) are pinned to the front of the carousel, then the rest is appended in shuffled order.

### Security: URL allowlisting

`safeHttps()` (defined identically in both `app.jsx` and `sheet.js`) restricts every URL — both `r.url` and `r.img` — to `https://` (or protocol-relative `//`, promoted to https). This blocks `javascript:`, `data:`, `file:`, `http:`, etc. from CSV input. **Always run untrusted URLs through `safeHttps` before rendering them as `href` or `background-image`.** Cards with no valid URL are dropped (`return null`).

### Editmode bridge

`app.jsx` posts `{type: '__edit_mode_available'}` and `{type: '__edit_mode_set_keys', edits: state}` to `window.parent`, and listens for `__activate_edit_mode` / `__deactivate_edit_mode` to open/close the Tweaks panel. The `defaults` literal in `App` is wrapped in `/*EDITMODE-BEGIN*/` … `/*EDITMODE-END*/` markers — an external editor pattern-replaces this block to persist tweak changes back into the source. **Don't reformat or remove these comments.**

## CSV schema

Columns (order doesn't matter, headers are case-insensitive, German or English):

| German | English | Notes |
|---|---|---|
| `id` | — | Optional; auto-assigned `s<row>` if missing |
| `titel` | `title` | Required |
| `beschreibung` | `desc` | |
| `kategorie` | `cat` | Required; must be one of the `CATEGORIES` ids in `data.js` |
| `url` / `link` | | Required; must be `https://` |
| `tag` | | Comma-separated; first becomes the primary tag, all become chips |
| `bild` / `image` / `img` | | Optional; `https://` only — falls back to generated SVG |
| `featured` / `fokus` | | Truthy values pin the row to the carousel |

Adding a new category requires editing `CATEGORIES` in `src/data.js` (id, label, short label, color) **and** `categoryPalette()` in `src/placeholder.js` (bg/stripe/fg colors for the SVG fallback).
