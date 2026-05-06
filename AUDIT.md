# OER-Dashboard — Notiz für Sicherheits-/Datenschutz-Audit

**Stand:** 2026-05-06
**Repo:** https://github.com/phzh-zdl/oer-dashboard
**Live:** [Netlify-URL hier eintragen]

Dieses Dokument fasst die sicherheits- und datenschutzrelevanten Aspekte der
Anwendung in einer Sprache zusammen, die ein Audit-Board ohne tiefen
Code-Einstieg lesen kann.

---

## 1. Architektur-Überblick

| Schicht | Komponente | Hosting / Region |
|---|---|---|
| Frontend (React, Vite-Build) | `dist/` als statische Dateien | **Netlify** — globales Edge-CDN, Hauptsitz USA |
| Backend (Datenbank, Auth, Storage) | **Supabase** | Frankfurt am Main (eu-central-1) |
| Quellcode | Git | **GitHub**, Org `phzh-zdl` |
| CI / Dependency-Audit | GitHub Actions | github.com (USA) |

Der Browser des/der Endnutzer:in spricht direkt mit Supabase über HTTPS;
es gibt **keinen eigenen Application-Server**. Datenschutz und Zugriffskontrolle
werden ausschliesslich über die Supabase-Datenbank durchgesetzt
(Row Level Security, siehe §3).

---

## 2. Welche Daten werden verarbeitet

### Öffentliche Besucher:innen des Katalogs
- **Keine personenbezogenen Daten.** Keine Cookies, keine Analytics, kein Tracking.
- Browser lädt: HTML, JS, CSS, Bilder vom Storage-Bucket.

### Admins (Login)
- **E-Mail-Adresse** (für Magic-Link-Authentifizierung).
- **Session-Token** (JWT) im `localStorage` des Browsers, ~1 Stunde gültig,
  Refresh-Token persistent.
- **User-ID** (UUID, intern bei Supabase Auth).

### Inhalts-Audit
- Pro Ressource und Kategorie: Spalten `created_by`, `updated_by` —
  enthalten die User-ID des/der Admin, der/die zuletzt bearbeitet hat.

### Bilder
- In Supabase Storage (Bucket `resource-images`), public-URL-zugänglich.
- Pfad-Schema: `<UUID>-<slugified-original-name>.<ext>`.

---

## 3. Sicherheits-Maßnahmen (bereits implementiert)

### Authentifizierung
- **Magic-Link** über Supabase Auth (kein Passwort-Speicher).
- **`shouldCreateUser: false`** im Login-Form: niemand kann sich selbst registrieren.
- **Whitelist via Supabase-Dashboard:** Admins werden manuell unter
  *Authentication → Users* angelegt; nur diese Adressen erhalten Magic Links.
- Redirect-URL für Magic Links ist in Supabase fest auf
  `localhost:5173` und die Netlify-Produktionsdomain beschränkt
  (Open-Redirect-Schutz).

### Autorisierung — Row Level Security (RLS)
Supabase Postgres prüft jeden Request gegen RLS-Policies.
Datei: `supabase/migrations/0001_init.sql`.

| Tabelle / Bucket | `anon` (öffentlich) | `authenticated` (eingeloggt) |
|---|---|---|
| `categories` | SELECT | SELECT, INSERT, UPDATE, DELETE |
| `resources`  | SELECT | SELECT, INSERT, UPDATE, DELETE |
| `storage.objects` (resource-images) | **kein API-Zugriff** | SELECT, INSERT, UPDATE, DELETE |
| Storage Public-URL | Lesen | Lesen |

Wichtige Detail-Entscheidung: Anon-User können den Storage-Bucket **nicht via
API auflisten** (kein `list()`); öffentliche Bilder werden ausschließlich über
die Public-URL der Storage-CDN ausgeliefert. Damit ist Filename-/Metadaten-
Enumeration unterbunden.

### URL-Härtung
- **Client-seitig:** Helper `safeHttps()` lehnt `javascript:`, `data:`, `file:`,
  `http:` etc. ab — nur `https://` (und protocol-relative `//` → https) sind
  erlaubt. Gilt für jede URL aus DB-Daten in `href`-Attributen und
  Bild-`url()`-Background-Werten.
- **Server-seitig:** DB-Constraint `check (url ~* '^https://')` auf
  `resources.url`. Auch wenn Client-Validierung umgangen würde, lehnt die DB ab.

### XSS / Content-Injection
- React escapt alle Texte automatisch.
- **Kein `dangerouslySetInnerHTML`** im Code.
- Inline-SVG-Placeholder escaped XML-Sonderzeichen (`escapeXml`).

### CSRF
- Auth läuft über **JWT im `Authorization`-Header**, nicht über Cookies.
  Klassische CSRF-Angriffe greifen nicht.

### Transport / HTTP-Header
Konfiguriert in `netlify.toml`:
- `Content-Security-Policy` — `script-src 'self'`, kein eval, externe Hosts
  nur `*.supabase.co`. **Kein CDN-Bezug zur Laufzeit** (entspricht der Schul-
  Vorgabe „kein CDN").
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (1 Jahr)
- `X-Frame-Options: DENY` — Clickjacking-Schutz
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — Camera, Mic, Geolocation, Sensoren komplett deaktiviert

### Supply Chain / Dependencies
- Alle Runtime-Abhängigkeiten aus npm, lokal gebündelt
  (kein externer CDN-Request zur Laufzeit).
- `package-lock.json` committet (reproduzierbare Builds).
- **Dependabot** (`.github/dependabot.yml`): wöchentliche PRs für npm-Updates,
  monatlich für GitHub-Actions.
- **GitHub Actions** (`.github/workflows/audit.yml`): bei jedem Push und PR
  läuft `npm audit --audit-level=high` — Build schlägt fehl bei
  high/critical CVEs.
- Fonts (IBM Plex Sans/Mono, Newsreader): aktuell System-Fallback.
  Wenn echte Fonts benötigt werden, kommen sie als npm-Paket
  (`@fontsource/...`), nicht von Google Fonts CDN.

### Geheimnisse
- `service_role`-Key (Supabase) **nie im Code, nie im Repo**.
  Verwendet ausschließlich für manuelle SQL-Migration im Dashboard.
- `anon public key` ist **per Design** öffentlich im JS-Bundle. Sicherheit
  kommt aus den RLS-Policies, nicht aus Key-Geheimhaltung
  ([Supabase-Doku](https://supabase.com/docs/guides/auth/row-level-security)).

---

## 4. By-Design-Entscheidungen (typische Audit-Rückfragen)

> **„Da ist ein JWT im JavaScript-Bundle."**
> Korrekt. Das ist der Anon-Key (Spaltenname *anon public*). Er identifiziert
> nur das Supabase-Projekt; alle Berechtigungen werden serverseitig durch RLS
> erzwungen. Ohne RLS-Bypass kann er nichts mehr als „Daten lesen, die ohnehin
> öffentlich sind".

> **„Der Storage-Bucket ist als public markiert."**
> Korrekt. Die OER-Inhalte (Bilder zu öffentlich verlinkten Lehrmaterialien)
> sind zur Verbreitung gedacht. Public-URL-Zugriff ist gewollt; **API-Listing
> ist trotzdem auf eingeloggte User beschränkt** (siehe §3).

> **„Sessions liegen im localStorage — XSS könnte sie exfiltrieren."**
> Stimmt grundsätzlich. Mitigation: strikte CSP (`script-src 'self'`,
> kein `unsafe-eval`), keine eingebetteten Scripts, automatisches Escaping
> in React. Bei einem konkreten XSS-Befund würde ein Angreifer trotzdem
> Schaden anrichten können — deshalb ist die CSP der Hauptschutz.

> **„Magic Link ist single-factor."**
> Stimmt. Wer Zugriff auf das E-Mail-Postfach hat, kann sich einloggen.
> Wenn MFA gefordert wird: Supabase Auth unterstützt TOTP-MFA.
> Aufwand: ~½ Tag.

---

## 5. Offene Prozess-/Vertragspunkte (zu klären)

Diese Punkte sind keine technischen Mängel, sondern Verträge und Entscheidungen,
die außerhalb des Codes laufen.

### 5.1 Auftragsverarbeitungsverträge (AVV / DPA)
- [ ] **Supabase:** Standard-DPA unter https://supabase.com/legal/dpa —
      formal abnicken, ggf. von Datenschutzstelle prüfen lassen.
- [ ] **Netlify:** Standard-DPA unter https://www.netlify.com/gdpr-ccpa —
      gleiche Frage.
- [ ] **GitHub:** AVV erforderlich? (Repo enthält keine personenbezogenen
      Daten der Endnutzer:innen, nur Code + Commit-Metadaten der Admins.)

### 5.2 Datenresidenz
- [x] Supabase: Frankfurt (EU). Bestätigt.
- [ ] Netlify: globales Edge-CDN, Logs **können in den USA landen**.
      Falls strikte EU-Datenresidenz gefordert ist: Migration auf
      Cloudflare Pages oder eigenen EU-Server prüfen.

### 5.3 Backup-Strategie
- Aktuell: Supabase Free-Tier hat **keine** automatischen Backups.
- Optionen:
  - **Supabase Pro** ($25/Monat): tägliche Backups, 7-Tage-Retention.
  - **Pro + Add-on**: Point-in-Time-Recovery (~28 Tage).
  - **Eigene pg_dump-Routine** (z. B. via Cron im Schul-Rechenzentrum).
- [ ] Entscheidung: welche Variante?

### 5.4 Mehrfaktor-Authentifizierung
- Aktuell: Magic-Link-Only.
- [ ] Pflicht für Admin-Zugang? Falls ja, TOTP-MFA via Supabase nachrüsten.

### 5.5 Audit-Log
- Aktuell: `created_by`, `updated_by` pro Zeile (letzter Zustand sichtbar).
- [ ] Wird ein **lückenloses, append-only Audit-Log** gefordert
      („wer hat wann was geändert, auch wenn jemand danach editiert hat")?
      Falls ja: zusätzliche Audit-Tabelle + DB-Trigger nachrüsten (~½ Tag).

### 5.6 Datenschutz-/Impressums-Inhalt
- Routes `/datenschutz` und `/impressum` existieren als **Platzhalter**
  mit den uns bekannten Fakten (Hoster, Region, lokale Speicherung).
- [ ] Inhaltliche Prüfung und Vervollständigung durch Datenschutzstelle PHZH:
      Verantwortliche Person, Rechtsgrundlage, Speicherdauer/Löschkonzept,
      Rechte der Betroffenen, Kontaktadresse.

### 5.7 Bestehende Seed-Daten ohne `created_by`
- Die initialen 30 Ressourcen (aus `resources.csv` migriert) haben
  `created_by = NULL`.
- [ ] Akzeptiert, oder soll ein Service-User („seed@phzh.ch") als
      Pseudo-Author angelegt und referenziert werden?

### 5.8 Logging / Monitoring
- Aktuell: Standard-Logs von Supabase und Netlify, Aufbewahrung gemäß deren
  Defaults.
- Kein zentralisiertes Error-Tracking (z. B. Sentry).
- [ ] Reicht das, oder soll ein Error-Tracker integriert werden?

---

## 6. Konkrete Fragen an das Audit-Board

Wenn ihr das Dokument als Gesprächs-Vorlage nutzt, hier die Punkte, an denen
ihr eine **Ja/Nein-Entscheidung** der Stelle braucht:

1. AVV für Supabase und Netlify — Standard-DPA akzeptiert? Eigene Vertrags-
   anpassungen nötig?
2. Datenresidenz Netlify (US-Edge) — akzeptabel oder Migration?
3. Backup-Strategie und Budget?
4. MFA-Pflicht für Admins?
5. Audit-Log lückenlos oder Spalten-State (created_by/updated_by) ausreichend?
6. Datenschutz-/Impressums-Inhalt — wer schreibt, bis wann, mit welchen
   Pflicht-Angaben?

---

## 7. Was ändert sich, wenn neue Auflagen kommen?

Damit das Audit nicht in einer Sackgasse endet — Aufwandsschätzungen für die
häufigsten Nachforderungen:

| Auflage | Aufwand | Was sich ändert |
|---|---|---|
| MFA für Admins | ~½ Tag | Supabase MFA aktivieren, Login-Flow erweitern |
| Lückenloses Audit-Log | ~½ Tag | Audit-Tabelle + Trigger; UI optional |
| Sentry / Error-Tracking | ~½ Tag | Package + DSN, CSP `connect-src` ergänzen |
| Cloudflare Pages statt Netlify | ~1 Tag | Build-Pipeline + DNS umziehen |
| Eigene Backup-Routine | ~1 Tag | Cron-Skript + Storage für Dumps |
| Self-Hosted Supabase | ~1 Woche | Server-Setup, Postgres-Admin, eigene Updates |
