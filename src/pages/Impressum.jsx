import { Link } from 'react-router-dom';

// PLATZHALTER. Pflichtangaben gemäß CH-Recht / EU-TMG sind je nach
// Trägerschaft unterschiedlich; hier nur das Grundgerüst.
export default function Impressum() {
  return (
    <div className="static-page">
      <header className="static-page-head">
        <Link to="/" className="static-back">← Zum Katalog</Link>
        <h1>Impressum</h1>
        <p className="static-stamp">Stand: <strong>Platzhalter</strong> — vor Live-Gang prüfen lassen.</p>
      </header>

      <section>
        <h2>Herausgeberin</h2>
        <p>
          Pädagogische Hochschule Zürich<br />
          Lagerstrasse 2, 8090 Zürich<br />
          Schweiz
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>[E-Mail / Telefon redaktionell verantwortliche Stelle]</p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <p>[Name / Funktion]</p>
      </section>

      <section>
        <h2>Haftungsausschluss</h2>
        <p>
          Die hier verlinkten Materialien werden in der Regel nicht von der
          Pädagogischen Hochschule Zürich betrieben. Für Inhalte externer Links
          übernehmen wir keine Verantwortung; massgebend sind die jeweiligen
          Anbieter:innen.
        </p>
      </section>
    </div>
  );
}
