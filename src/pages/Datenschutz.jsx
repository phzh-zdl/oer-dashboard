import { Link } from 'react-router-dom';

// PLATZHALTER. Vor dem Audit / Live-Gang von der Hochschul-Stelle für
// Datenschutz prüfen und ergänzen lassen — speziell:
//  - Verantwortlicher / Kontaktdaten Datenschutzbeauftragte:r
//  - Rechtsgrundlage für Verarbeitung
//  - Auftragsverarbeitungsverträge mit Supabase / Netlify
//  - Speicherdauer und Löschkonzept
//  - Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Widerspruch)
export default function Datenschutz() {
  return (
    <div className="static-page">
      <header className="static-page-head">
        <Link to="/" className="static-back">← Zum Katalog</Link>
        <h1>Datenschutzerklärung</h1>
        <p className="static-stamp">Stand: <strong>Platzhalter</strong> — von Datenschutzstelle der PH&nbsp;Zürich abnehmen lassen.</p>
      </header>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Pädagogische Hochschule Zürich<br />
          Lagerstrasse 2, 8090 Zürich<br />
          [E-Mail / Datenschutzbeauftragte:r]
        </p>
      </section>

      <section>
        <h2>2. Welche Daten verarbeitet werden</h2>
        <p>
          <strong>Besucher:innen des öffentlichen Katalogs:</strong> keine personenbezogenen Daten.
          Die Seite setzt keine Tracking-Cookies und nutzt kein Analytics. Der Browser lädt Texte
          und Bilder direkt von unseren Hostern (siehe Punkt 4).
        </p>
        <p>
          <strong>Admin-Login:</strong> bei der Anmeldung verarbeiten wir die zugelassene
          E-Mail-Adresse über den Magic-Link-Mechanismus von Supabase. Eine Session wird
          im Browser des/der Admins als Token im <code>localStorage</code> abgelegt.
        </p>
        <p>
          <strong>Inhaltsbearbeitung:</strong> für jede angelegte oder geänderte Ressource
          speichert die Datenbank die User-ID des/der ausführenden Admin (Spalten
          <code>created_by</code>, <code>updated_by</code>) zu Audit-Zwecken.
        </p>
      </section>

      <section>
        <h2>3. Zwecke und Rechtsgrundlage</h2>
        <p>[Ergänzen je nach geltendem Recht — DSG für CH-Hosting, DSGVO falls EU-Bezug.]</p>
      </section>

      <section>
        <h2>4. Auftragsverarbeiter</h2>
        <ul>
          <li>
            <strong>Supabase (Datenbank, Authentifizierung, Storage)</strong> —
            Server-Region: Frankfurt am Main (EU). DPA: <a href="https://supabase.com/legal/dpa" target="_blank" rel="noopener noreferrer">supabase.com/legal/dpa</a>.
          </li>
          <li>
            <strong>Netlify (Hosting, CDN)</strong> — globales Edge-Netzwerk, Hauptsitz USA.
            DPA: <a href="https://www.netlify.com/gdpr-ccpa/" target="_blank" rel="noopener noreferrer">netlify.com/gdpr-ccpa</a>.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Rechte</h2>
        <p>[Auskunft, Berichtigung, Löschung, Widerspruch — Kontakt-E-Mail einsetzen.]</p>
      </section>
    </div>
  );
}
