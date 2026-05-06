# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PHZH OER — Katalog von Open Educational Resources der Pädagogische Hochschule Zürich. Public-Katalog mit Suche/Filter, plus Admin-Panel zum Anlegen/Bearbeiten/Löschen von Ressourcen und Kategorien (inkl. Bild-Upload). UI-Sprache: Deutsch.

Stack: **Vite + React 18** (Frontend), **Supabase** (Postgres + Auth + Storage), **Netlify** (Hosting). Repo: `phzh-zdl/oer-dashboard`. Audit-Vorlage in `AUDIT.md`.

## Hartnäckige Constraints (gelten dauerhaft)

- **Kein CDN** — alle Runtime-Abhängigkeiten kommen aus npm und werden lokal gebündelt. Schul-IT verbietet externe CDN-Requests im Browser. Das gilt auch für Fonts (→ via `@fontsource/*` als npm-Paket einbinden, nicht via Google Fonts CSS-Link).
- **Wöchentliche Update-Checks** — `.github/dependabot.yml` öffnet PRs für npm- und Action-Updates; `.github/workflows/audit.yml` lässt CI bei `high`/`critical` Vulnerabilities fehlschlagen. Beim Hinzufügen neuer Deps prüfen, dass beide Mechanismen sie noch erfassen.
- **Anon-Key + RLS** — der Supabase Anon-Key landet im Client (Vite env `VITE_SUPABASE_ANON_KEY`). Datenschutz wird ausschließlich über RLS-Policies in der DB durchgesetzt, nicht über Key-Geheimhaltung. Der `service_role`-Key kommt **nie** in den Client und nie ins Repo.
- **`safeHttps()` auf jede externe URL** — sowohl client- als auch DB-seitig (`check (url ~* '^https://')`). Verhindert `javascript:`, `data:`, `file:` etc. aus eingegebenen Daten.
- **Bilder ausschliesslich lokal** — Ressourcen-Bilder leben im Supabase-Storage-Bucket `resource-images`. Die DB-Spalte `image_path` ist ein **Bucket-Pfad**, keine externe URL. Hochladen passiert ausschließlich über das Admin-Panel; externe Bild-URLs werden weder beim Seed noch im UI akzeptiert.
- **Security-Header in `netlify.toml`** — CSP/HSTS/X-Frame-Options/Permissions-Policy. Bei neuen externen Hosts (z. B. Analytics) `connect-src` und `img-src` in der CSP ergänzen, sonst blockt der Browser die Requests.

## Arbeitsweise mit dem User

Der User ist mit GitHub, Netlify und Supabase noch nicht vertraut. Beim Aufsetzen / Konfigurieren externer Dienste:
- Schritt-für-Schritt-Anleitung mit erwarteten Klicks, URLs, Eingaben.
- Pro Schritt kurz erklären, **was passiert** und **wozu**, nicht nur **wie**.
- Verifikations-Anker: nach jedem Block ein konkretes "Du müsstest jetzt X sehen".
- Code-Änderungen mache ich, manuelle Browser-/Dashboard-Schritte macht der User.

## Running it

Voraussetzungen: Node 20+, npm.

```bash
cp .env.example .env.local
# In .env.local VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY eintragen
npm install
npm run dev          # localhost:5173
npm run build        # erzeugt dist/
npm run preview      # serviert dist/ lokal
```

**Faustregel zu Reloads:**
| Was geändert | Lokal | Netlify |
|---|---|---|
| Code (jsx/css) | Vite reloadet automatisch | git push → auto-deploy |
| `.env.local` / Env-Vars | Dev-Server **neu starten** | "Trigger deploy + Clear cache" |
| Supabase-DB (SQL/Daten) | Browser-Tab refreshen | Browser-Tab refreshen |

Migration und Seed laufen **nicht automatisch** — `supabase/migrations/0001_init.sql` und `supabase/seed.sql` werden manuell im Supabase-Dashboard SQL-Editor ausgeführt. Beide sind idempotent (re-run = no-op außer Updates).

## Architektur

```
Browser
  ├── /                     → Public-Katalog (anon-SELECT auf categories/resources)
  ├── /admin                → Magic-Link-Login
  ├── /admin/callback       → AuthCallback (URL-Hash → Session)
  ├── /admin/app            → ResourceList (RequireAuth wrapper)
  │     ├── /new            → ResourceForm (create)
  │     ├── /:id/edit       → ResourceForm (edit)
  │     ├── /categories     → CategoryList
  │     │     ├── /new      → CategoryForm
  │     │     └── /:id/edit
  ├── /datenschutz          → Platzhalter
  └── /impressum            → Platzhalter
                                    │
                                    ▼ HTTPS
                              ┌─────────────┐
                              │  Supabase   │  Frankfurt
                              │  Postgres   │  (RLS)
                              │  + Auth     │
                              │  + Storage  │
                              └─────────────┘
```

### Datenfluss

- **Public-Read:** `useResources()` und `useCategories()` Hooks rufen `supabase.from(...).select(...)` direkt aus dem Browser. RLS erlaubt anon-SELECT auf beide Tabellen.
- **Admin-Schreib:** gleicher Client, aber mit gesetztem JWT in den Auth-Headern (Supabase-SDK macht das automatisch nach Login). RLS lässt INSERT/UPDATE/DELETE nur für `authenticated` zu.
- **Bilder lesen:** `resolveImage()` (`src/lib/image.js`) baut die Public-CDN-URL über `getPublicUrl(image_path)` zusammen, oder liefert ein generiertes Placeholder-SVG (Data-URL) zurück, wenn `image_path = null`.
- **Bilder schreiben:** `uploadImage()` / `deleteImage()` (`src/lib/storage.js`). Pfad-Schema: `<UUID>-<slug>.<ext>`. Beim Edit altes Bild explizit `remove([oldPath])`. Beim DB-Fail: hochgeladenes Bild zurückrollen.

### DB-Schema

Quelle der Wahrheit: `supabase/migrations/0001_init.sql`.

- `categories` — id (text PK, regex `^[a-z0-9_-]{1,32}$`), label, short, color (hex), sort_order, timestamps.
- `resources` — id (uuid), title, description, category_id (FK on delete restrict), url (check `^https://`), tags (text[]), image_path, featured, created_by/updated_by (auth.users), timestamps.
- Trigger `set_updated_at` auf beiden Tabellen.
- Storage-Bucket `resource-images` (public=true).
- **GRANTs sind explizit gesetzt** für anon/authenticated — Supabase setzt sie in neueren Projekten nicht mehr automatisch, sonst „permission denied for table xyz" trotz passender RLS.

### Featured-Karussell

`pickDailyFeatured()` in `src/components/Carousel.jsx`: gepinnte Ressourcen (`featured = true`) zuerst, danach täglich rotierender Rest. Seed = `dayOfYear() * 2654435761` — alle Besucher:innen sehen am selben Tag dieselbe Auswahl. Der Carousel-Modus ist auf `daily` fest verdrahtet (kein Tweaks-Panel mehr wie im alten Prototyp).

### Auth-Flow

1. `/admin` → E-Mail-Eingabe → `signInWithOtp({ email, options: { emailRedirectTo, shouldCreateUser: false }})`.
2. Klick auf Magic Link → `/admin/callback` → `detectSessionInUrl: true` im Client erkennt die Tokens im URL-Hash, etabliert Session.
3. `RequireAuth` (`src/pages/admin/RequireAuth.jsx`) prüft Session via `getSession()` + abonniert `onAuthStateChange`. Bei keiner Session → Redirect `/admin`. Bei Session → `<Outlet context={{ session }} />`.
4. `AdminLayout` umschliesst alle `/admin/app`-Seiten und reicht die Session über `useOutletContext()` weiter.

### Admin-Whitelist

Es gibt **kein eigenes admin-emails-Table**. Whitelist läuft über zwei Mechanismen kombiniert:
- `shouldCreateUser: false` im Login-Form → unbekannte E-Mails bekommen keinen Magic Link.
- Im Supabase-Dashboard unter **Authentication → Users → Invite user** werden Admin-E-Mails einzeln freigeschaltet.

Heißt: jeder eingeladene User ist Admin. Keine Rollen-Differenzierung. Reicht für MVP, würde bei „read-only Editor" erweitert werden müssen.

## Projektstruktur

```
src/
  main.jsx                    Vite-Entry, Router-Tree, ConfigError-Fallback
  styles.css                  Alle Styles (eine Datei, mit Sektions-Kommentaren)
  assets/phzh-logo.png        Wordmark, von Vite gefingerprintet
  lib/
    supabase.js               Client-Init, exportiert `configError` bei fehlenden Env-Vars
    safeHttps.js              URL-Allowlist (https-only)
    placeholder.js            Data-URL-SVG aus Kategorie-Farbe
    image.js                  resolveImage() — public-URL oder placeholder; RESOURCE_BUCKET
    storage.js                uploadImage / deleteImage / validateImageFile
  hooks/
    useResources.js
    useCategories.js
  components/                 Public-Katalog
    Topbar, SearchBar, Carousel (mit FeaturedCard + pickDailyFeatured),
    CategoryNav, ResourceCard
  pages/
    Catalog.jsx               Haupt-Public-Page
    ConfigError.jsx           Wenn Env-Vars fehlen
    Datenschutz.jsx, Impressum.jsx — Platzhalter
    admin/
      Login.jsx               Magic-Link-Form
      AuthCallback.jsx        verarbeitet Magic-Link-URL
      RequireAuth.jsx         Nested-Route-Wrapper
      AdminLayout.jsx         Topbar + Tab-Nav + Outlet
      ResourceList.jsx        Tabelle aller Ressourcen
      ResourceForm.jsx        Create/Edit, Bild-Upload
      CategoryList.jsx
      CategoryForm.jsx

supabase/
  migrations/0001_init.sql    Schema, RLS, GRANTs, Storage-Bucket, Policies
  seed.sql                    10 Kategorien (UPSERT) + 30 Ressourcen (nur wenn leer)

.github/
  dependabot.yml              wöchentliche npm-/action-Updates
  workflows/audit.yml         npm audit + build pro Push/PR

netlify.toml                  Build + SPA-Redirect + Security-Header
```

### URL-Härtung

`safeHttps()` (Quelle: `src/lib/safeHttps.js`) ist **die** Stelle für URL-Validierung im Code. Doppelt abgesichert durch DB-Check `check (url ~* '^https://')` auf `resources.url`. Bei jeder neuen Stelle, die User-Input als `href` oder `background-image` rendert: durch `safeHttps()` schicken.

### Bei Fehlersuche zuerst prüfen

- `permission denied for table xyz` → GRANTs in `0001_init.sql` ausführen, RLS-Policy passt nicht zur Rolle.
- Leere Seite ohne Fehlermeldung → CSP zu strikt? Browser-Console öffnen, nach `Refused to load…` suchen, dann CSP in `netlify.toml` lockern.
- Login-Magic-Link führt nicht zurück → Redirect-URL in Supabase nicht gewhitelisted (Authentication → URL Configuration).
- Bild-Upload schlägt fehl mit RLS-Fehler → User ist nicht eingeloggt oder Storage-Policy fehlt.

## Kategorie hinzufügen

Im UI: `/admin/app/categories/new`. ID einmal vergeben, danach unveränderlich (FK-Schlüssel).

Per SQL (für Bulk):
```sql
insert into categories (id, label, short, color, sort_order)
values ('neue-id', 'Langform', 'Kurz', '#445566', 110);
```

## Ressource hinzufügen

Im UI: `/admin/app/new`. Bild-Upload optional (Placeholder-SVG falls leer).

Per SQL/CSV-Bulk: aktuell nicht im UI; `seed.sql` als Vorlage. Wenn das wieder gebraucht wird, ist `src/lib/sheet.js` aus dem Prototyp im Git-History (`git log -- src/sheet.js` auf dem Initial-Commit).
