// OER resource catalog for PH Zürich
// Placeholder images use striped SVG with a label hint.

const CATEGORIES = [
  { id: 'bpa',     label: 'Berufspraktische Ausbildung',              short: 'Berufspraxis',        color: '#9a3d1f' },
  { id: 'spr',     label: 'Sprachen',                                  short: 'Sprachen',            color: '#b8860b' },
  { id: 'nmg',     label: 'Natur, Mensch, Gesellschaft',               short: 'NMG',                 color: '#2d5a3f' },
  { id: 'ges',     label: 'Gestalten',                                 short: 'Gestalten',           color: '#a0522d' },
  { id: 'mus',     label: 'Musik',                                     short: 'Musik',               color: '#6b3e7a' },
  { id: 'bs',      label: 'Bewegung und Sport',                        short: 'Sport',               color: '#2a6a7a' },
  { id: 'mi',      label: 'Medien und Informatik',                     short: 'Medien & Informatik', color: '#1f4a80' },
  { id: 'uek',     label: 'Überfachliche Kompetenzen & Beurteilung',   short: 'Überfachlich',        color: '#4a4528' },
  { id: 'stw',     label: 'Stellwerk',                                 short: 'Stellwerk',           color: '#6b4226' },
  { id: 'ibe',     label: 'Internationale Bildungsentwicklung',        short: 'Int. Bildung',        color: '#3e5a4a' },
];

const RESOURCES = [
  // BPA
  { id: 'r01', cat: 'bpa', title: 'Leitfaden Praktikum Primarstufe',      desc: 'Strukturierter Begleitleitfaden für Studierende im Kernpraktikum — mit Reflexionsvorlagen und Beobachtungsrastern.',          url: 'https://phzh.ch', tag: 'Leitfaden' },
  { id: 'r02', cat: 'bpa', title: 'Videobibliothek Unterrichtssituationen', desc: 'Kurze annotierte Klassenzimmer-Sequenzen zur kollegialen Analyse von Classroom Management.',                         url: 'https://phzh.ch', tag: 'Video' },
  { id: 'r03', cat: 'bpa', title: 'Mentorat — Gesprächsleitfaden',        desc: 'Gesprächsformate für Praxislehrpersonen: lernförderliches Feedback, Zielvereinbarung, kritische Momente.',                url: 'https://phzh.ch', tag: 'Leitfaden' },

  // Sprachen
  { id: 'r04', cat: 'spr', title: 'Deutsch als Zweitsprache — Diagnose',  desc: 'Beobachtungsinstrumente und Aufgabenpool zur Sprachstandserhebung für die Sekundarstufe I.',                           url: 'https://phzh.ch', tag: 'Diagnostik' },
  { id: 'r05', cat: 'spr', title: 'Mehrsprachigkeit im Klassenzimmer',    desc: 'Unterrichtsbausteine, die Herkunftssprachen sichtbar machen und Transfer zwischen Sprachen anstossen.',                 url: 'https://phzh.ch', tag: 'Unterricht' },
  { id: 'r06', cat: 'spr', title: 'Literaturkarten Gegenwartsliteratur',  desc: 'Kuratierte Textauszüge und Begleitmaterial zu zeitgenössischen Schweizer Autor:innen — lesefördernd aufbereitet.',       url: 'https://phzh.ch', tag: 'Material' },
  { id: 'r07', cat: 'spr', title: 'English in the Primary Classroom',     desc: 'Activity bank für spielerischen Englischunterricht der 3.–6. Klasse — mit Audio und Bildkarten.',                         url: 'https://phzh.ch', tag: 'Material' },

  // NMG
  { id: 'r08', cat: 'nmg', title: 'Klimawandel verstehen — Unterrichtsreihe', desc: 'Forschungsbasierte Sequenz für die Mittelstufe mit Experimenten, Datensätzen und Diskussionsimpulsen.',             url: 'https://phzh.ch', tag: 'Unterrichtsreihe' },
  { id: 'r09', cat: 'nmg', title: 'Archiv Zeitgeschichte Schweiz',         desc: 'Primärquellen und didaktisierte Materialien zur jüngeren Schweizer Geschichte — ab Sekundarstufe.',                     url: 'https://phzh.ch', tag: 'Archiv' },
  { id: 'r10', cat: 'nmg', title: 'Werkstatt Wald & Biodiversität',        desc: 'Draussenlernen-Werkstatt mit Stationenposten, Bestimmungshilfen und Forschungsheft.',                                   url: 'https://phzh.ch', tag: 'Werkstatt' },

  // Gestalten
  { id: 'r11', cat: 'ges', title: 'Druckgrafik in der Primarstufe',       desc: 'Einführung in Hoch- und Monotypie-Verfahren mit Material-, Technik- und Sicherheitshinweisen.',                         url: 'https://phzh.ch', tag: 'Werkstatt' },
  { id: 'r12', cat: 'ges', title: 'Architektur mit der Klasse',           desc: 'Entwurfsübungen vom Modell zum Raum — entwickelt mit dem Departement Architektur ETH.',                                  url: 'https://phzh.ch', tag: 'Projekt' },
  { id: 'r13', cat: 'ges', title: 'Textiles Gestalten — Patternbank',     desc: 'Offene Schnittmuster und Methodenkarten für projektorientiertes Arbeiten mit Textil.',                                   url: 'https://phzh.ch', tag: 'Material' },

  // Musik
  { id: 'r14', cat: 'mus', title: 'Klassenmusizieren — Repertoire',       desc: 'Arrangements für heterogene Klassen, von Bodypercussion bis Boomwhacker, inklusive Playbacks.',                        url: 'https://phzh.ch', tag: 'Repertoire' },
  { id: 'r15', cat: 'mus', title: 'Hörbildung digital',                    desc: 'Interaktive Höraufgaben für Tablet und Laptop — differenziert nach Zyklus 2 und 3.',                                    url: 'https://phzh.ch', tag: 'Interaktiv' },
  { id: 'r16', cat: 'mus', title: 'Stimmbildung im Schulalltag',           desc: 'Kurze Warm-ups und Sprecherziehungs-Routinen für Lehrpersonen aller Stufen.',                                          url: 'https://phzh.ch', tag: 'Routine' },

  // Bewegung & Sport
  { id: 'r17', cat: 'bs',  title: 'Bewegte Schule — Toolkit',             desc: 'Mikro-Interventionen zur Bewegungsförderung im Regelunterricht, wissenschaftlich begleitet.',                           url: 'https://phzh.ch', tag: 'Toolkit' },
  { id: 'r18', cat: 'bs',  title: 'Schwimmunterricht sicher gestalten',    desc: 'Sicherheitsstandards, Aufbauübungen und Notfallprotokolle für Wassersport in der Volksschule.',                        url: 'https://phzh.ch', tag: 'Leitfaden' },
  { id: 'r19', cat: 'bs',  title: 'Spielsammlung für kleine Räume',        desc: 'Über 80 Bewegungsspiele für Pausenhalle, Gang und knappe Turnhallenzeiten.',                                           url: 'https://phzh.ch', tag: 'Sammlung' },

  // Medien & Informatik
  { id: 'r20', cat: 'mi',  title: 'Informatik ohne Strom',                 desc: 'Analoge Einstiegsaufgaben zu Algorithmik, Codierung und Daten — erprobt auf Zyklus 2.',                                 url: 'https://phzh.ch', tag: 'Material' },
  { id: 'r21', cat: 'mi',  title: 'Medienkompetenz — Szenarien',           desc: 'Realitätsnahe Fallbeispiele zu KI, Deepfakes und Datenschutz für den Unterricht der Sek I.',                            url: 'https://phzh.ch', tag: 'Szenario' },
  { id: 'r22', cat: 'mi',  title: 'Scratch-Projekte Schritt für Schritt',  desc: 'Offene Scratch-Lernpfade mit Differenzierungsaufgaben und Reflexionsimpulsen.',                                        url: 'https://phzh.ch', tag: 'Lernpfad' },

  // Überfachliche Kompetenzen & Beurteilung
  { id: 'r23', cat: 'uek', title: 'Formatives Beurteilen — Praxisheft',   desc: 'Beispiele für lernförderliche Rückmeldungen, Kompetenzraster und Selbstbeurteilung.',                                  url: 'https://phzh.ch', tag: 'Praxisheft' },
  { id: 'r24', cat: 'uek', title: 'Lernjournal-Vorlagen',                  desc: 'Strukturierte und offene Vorlagen zur Begleitung längerer Lernprozesse, digital und analog.',                           url: 'https://phzh.ch', tag: 'Vorlage' },
  { id: 'r25', cat: 'uek', title: 'Kooperatives Lernen — Methoden',        desc: 'Eine kuratierte Auswahl erprobter Methoden mit Anleitung, Varianten und Stolpersteinen.',                              url: 'https://phzh.ch', tag: 'Methoden' },

  // Stellwerk
  { id: 'r26', cat: 'stw', title: 'Stellwerk 8 — Vorbereitungsaufgaben',  desc: 'Fachspezifische Aufgabenpools, die den Leistungsstand abbilden und zur Standortbestimmung dienen.',                   url: 'https://phzh.ch', tag: 'Aufgaben' },
  { id: 'r27', cat: 'stw', title: 'Auswertung Stellwerk — Handreichung',   desc: 'Wie Resultate mit Lernenden und Eltern besprochen werden können — mit Gesprächsleitfaden.',                           url: 'https://phzh.ch', tag: 'Handreichung' },

  // Internationale Bildungsentwicklung
  { id: 'r28', cat: 'ibe', title: 'Global Citizenship Education',         desc: 'Unterrichtsmaterialien zu globalen Zusammenhängen, entwickelt mit Partnerhochschulen.',                                url: 'https://phzh.ch', tag: 'Material' },
  { id: 'r29', cat: 'ibe', title: 'Austauschprogramme dokumentieren',      desc: 'Reflexionsinstrumente und Portfoliokomponenten für schulische Austauschprojekte.',                                      url: 'https://phzh.ch', tag: 'Portfolio' },
  { id: 'r30', cat: 'ibe', title: 'Bildung in fragilen Kontexten',         desc: 'Fallstudien und Hintergrundtexte aus Forschungskooperationen der PH Zürich.',                                           url: 'https://phzh.ch', tag: 'Fallstudien' },
];

window.PHZH_DATA = { CATEGORIES, RESOURCES };
