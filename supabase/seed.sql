-- Initiale Daten — die 10 Fachbereiche und 30 Ressourcen aus dem Prototyp.
--
-- Anwendung: nach `0001_init.sql` im Supabase-SQL-Editor ausführen.
--
-- Verhalten:
--   - Kategorien: UPSERT — wiederholtes Ausführen aktualisiert label/short/color/sort_order.
--   - Ressourcen: nur einfügen, wenn die Tabelle noch leer ist. Sobald Admins
--     erste Einträge angelegt oder bearbeitet haben, tut nochmaliges Ausführen
--     dieser Datei NICHTS — du verlierst keine Edits.

-- ─────────────────────────────────────────────────────────────────────
-- Kategorien
-- ─────────────────────────────────────────────────────────────────────
insert into public.categories (id, label, short, color, sort_order) values
  ('bpa', 'Berufspraktische Ausbildung',              'Berufspraxis',         '#9a3d1f',  10),
  ('spr', 'Sprachen',                                  'Sprachen',             '#b8860b',  20),
  ('nmg', 'Natur, Mensch, Gesellschaft',               'NMG',                  '#2d5a3f',  30),
  ('ges', 'Gestalten',                                 'Gestalten',            '#a0522d',  40),
  ('mus', 'Musik',                                     'Musik',                '#6b3e7a',  50),
  ('bs',  'Bewegung und Sport',                        'Sport',                '#2a6a7a',  60),
  ('mi',  'Medien und Informatik',                     'Medien & Informatik',  '#1f4a80',  70),
  ('uek', 'Überfachliche Kompetenzen & Beurteilung',   'Überfachlich',         '#4a4528',  80),
  ('stw', 'Stellwerk',                                 'Stellwerk',            '#6b4226',  90),
  ('ibe', 'Internationale Bildungsentwicklung',        'Int. Bildung',         '#3e5a4a', 100)
on conflict (id) do update set
  label      = excluded.label,
  short      = excluded.short,
  color      = excluded.color,
  sort_order = excluded.sort_order;

-- ─────────────────────────────────────────────────────────────────────
-- Ressourcen — nur einfügen, wenn Tabelle leer ist
--
-- Bilder werden NICHT aus dem alten CSV übernommen. Das Schema hat keine
-- externen Bild-URLs mehr; `image_path` ist immer ein Pfad in den
-- Supabase-Storage-Bucket `resource-images`. Im Seed bleibt `image_path`
-- null — Admins laden Bilder über das Admin-Panel hoch, sodass alles
-- lokal liegt (kein externer CDN-Request, keine kaputten Links).
-- Das Placeholder-SVG übernimmt, solange noch kein Bild hochgeladen ist.
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if (select count(*) from public.resources) > 0 then
    raise notice 'resources-Tabelle nicht leer — überspringe Seed.';
    return;
  end if;

  insert into public.resources (title, description, category_id, url, tags, featured) values
    -- BPA
    ('Reflexionskompetenz',
     'Reflexion ist eine Schlüsselkompetenz für die Professionalisierung von Lehrpersonen. Das Lernobjekt bietet mit dem  «Reflexionszirkel» eine strukturierte Methode, um berufspraktische Fragen aus verschiedenen Perspektiven zu beleuchten und leitet an, durch Reflexion die berufliche Identität zu stärken.',
     'bpa', 'https://openilias.phzh.ch/go/pg/2584_308', array['Leitfaden'], true),
    ('Videobibliothek Unterrichtssituationen',
     'Kurze annotierte Klassenzimmer-Sequenzen zur kollegialen Analyse von Classroom Management.',
     'bpa', 'https://phzh.ch', array['Video'], false),
    ('Mentorat — Gesprächsleitfaden',
     'Gesprächsformate für Praxislehrpersonen: lernförderliches Feedback, Zielvereinbarung, kritische Momente.',
     'bpa', 'https://phzh.ch', array['Leitfaden'], false),

    -- Sprachen
    ('Deutsch als Zweitsprache — Diagnose',
     'Beobachtungsinstrumente und Aufgabenpool zur Sprachstandserhebung für die Sekundarstufe I.',
     'spr', 'https://phzh.ch', array['Diagnostik'], false),
    ('Mehrsprachigkeit im Klassenzimmer',
     'Unterrichtsbausteine, die Herkunftssprachen sichtbar machen und Transfer zwischen Sprachen anstossen.',
     'spr', 'https://phzh.ch', array['Unterricht'], false),
    ('Literaturkarten Gegenwartsliteratur',
     'Kuratierte Textauszüge und Begleitmaterial zu zeitgenössischen Schweizer Autor:innen — lesefördernd aufbereitet.',
     'spr', 'https://phzh.ch', array['Material'], false),
    ('English in the Primary Classroom',
     'Activity bank für spielerischen Englischunterricht der 3.–6. Klasse — mit Audio und Bildkarten.',
     'spr', 'https://phzh.ch', array['Material'], false),

    -- NMG
    ('Klimawandel verstehen — Unterrichtsreihe',
     'Forschungsbasierte Sequenz für die Mittelstufe mit Experimenten, Datensätzen und Diskussionsimpulsen.',
     'nmg', 'https://phzh.ch', array['Unterrichtsreihe'], false),
    ('Archiv Zeitgeschichte Schweiz',
     'Primärquellen und didaktisierte Materialien zur jüngeren Schweizer Geschichte — ab Sekundarstufe.',
     'nmg', 'https://phzh.ch', array['Archiv'], false),
    ('Werkstatt Wald & Biodiversität',
     'Draussenlernen-Werkstatt mit Stationenposten, Bestimmungshilfen und Forschungsheft.',
     'nmg', 'https://phzh.ch', array['Werkstatt'], false),

    -- Gestalten
    ('Druckgrafik in der Primarstufe',
     'Einführung in Hoch- und Monotypie-Verfahren mit Material-, Technik- und Sicherheitshinweisen.',
     'ges', 'https://phzh.ch', array['Werkstatt'], false),
    ('Architektur mit der Klasse',
     'Entwurfsübungen vom Modell zum Raum — entwickelt mit dem Departement Architektur ETH.',
     'ges', 'https://phzh.ch', array['Projekt'], false),
    ('Textiles Gestalten — Patternbank',
     'Offene Schnittmuster und Methodenkarten für projektorientiertes Arbeiten mit Textil.',
     'ges', 'https://phzh.ch', array['Material'], false),

    -- Musik
    ('Klassenmusizieren — Repertoire',
     'Arrangements für heterogene Klassen, von Bodypercussion bis Boomwhacker, inklusive Playbacks.',
     'mus', 'https://phzh.ch', array['Repertoire'], false),
    ('Hörbildung digital',
     'Interaktive Höraufgaben für Tablet und Laptop — differenziert nach Zyklus 2 und 3.',
     'mus', 'https://phzh.ch', array['Interaktiv'], false),
    ('Stimmbildung im Schulalltag',
     'Kurze Warm-ups und Sprecherziehungs-Routinen für Lehrpersonen aller Stufen.',
     'mus', 'https://phzh.ch', array['Routine'], false),

    -- Bewegung & Sport
    ('Bewegte Schule — Toolkit',
     'Mikro-Interventionen zur Bewegungsförderung im Regelunterricht, wissenschaftlich begleitet.',
     'bs', 'https://phzh.ch', array['Toolkit'], false),
    ('Schwimmunterricht sicher gestalten',
     'Sicherheitsstandards, Aufbauübungen und Notfallprotokolle für Wassersport in der Volksschule.',
     'bs', 'https://phzh.ch', array['Leitfaden'], false),
    ('Spielsammlung für kleine Räume',
     'Über 80 Bewegungsspiele für Pausenhalle, Gang und knappe Turnhallenzeiten.',
     'bs', 'https://phzh.ch', array['Sammlung'], false),

    -- Medien & Informatik
    ('Informatik ohne Strom',
     'Analoge Einstiegsaufgaben zu Algorithmik, Codierung und Daten — erprobt auf Zyklus 2.',
     'mi', 'https://phzh.ch', array['Material'], false),
    ('Medienkompetenz — Szenarien',
     'Realitätsnahe Fallbeispiele zu KI, Deepfakes und Datenschutz für den Unterricht der Sek I.',
     'mi', 'https://phzh.ch', array['Szenario'], false),
    ('Scratch-Projekte Schritt für Schritt',
     'Offene Scratch-Lernpfade mit Differenzierungsaufgaben und Reflexionsimpulsen.',
     'mi', 'https://phzh.ch', array['Lernpfad'], false),

    -- Überfachliche Kompetenzen & Beurteilung
    ('Formatives Beurteilen — Praxisheft',
     'Beispiele für lernförderliche Rückmeldungen, Kompetenzraster und Selbstbeurteilung.',
     'uek', 'https://phzh.ch', array['Praxisheft'], false),
    ('Lernjournal-Vorlagen',
     'Strukturierte und offene Vorlagen zur Begleitung längerer Lernprozesse, digital und analog.',
     'uek', 'https://phzh.ch', array['Vorlage'], false),
    ('Kooperatives Lernen — Methoden',
     'Eine kuratierte Auswahl erprobter Methoden mit Anleitung, Varianten und Stolpersteinen.',
     'uek', 'https://phzh.ch', array['Methoden'], false),

    -- Stellwerk
    ('Stellwerk 8 — Vorbereitungsaufgaben',
     'Fachspezifische Aufgabenpools, die den Leistungsstand abbilden und zur Standortbestimmung dienen.',
     'stw', 'https://phzh.ch', array['Aufgaben'], false),
    ('Auswertung Stellwerk — Handreichung',
     'Wie Resultate mit Lernenden und Eltern besprochen werden können — mit Gesprächsleitfaden.',
     'stw', 'https://phzh.ch', array['Handreichung'], false),

    -- Internationale Bildungsentwicklung
    ('Global Citizenship Education',
     'Unterrichtsmaterialien zu globalen Zusammenhängen, entwickelt mit Partnerhochschulen.',
     'ibe', 'https://phzh.ch', array['Material'], false),
    ('Austauschprogramme dokumentieren',
     'Reflexionsinstrumente und Portfoliokomponenten für schulische Austauschprojekte.',
     'ibe', 'https://phzh.ch', array['Portfolio'], false),
    ('Bildung in fragilen Kontexten',
     'Fallstudien und Hintergrundtexte aus Forschungskooperationen der PH Zürich.',
     'ibe', 'https://phzh.ch', array['Fallstudien'], false);
end $$;
