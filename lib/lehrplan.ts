// Sommer 2026 — Lehrplan content as a typed constant.
// Sources: /public/Lehrplan_Sommer_2026.docx (§3, §4, §5, §6).
// The "W0 / Vorwoche" scouting concept is intentionally not modelled — W1 is
// the first delivered week (06.05.2026).

export type Niveau = "n1" | "n2" | "n3" | "vhs";

export type LehrplanWeek = {
  week: number; // 1..11 (VHS only goes to 5)
  date: string; // ISO date of the Wednesday (lesson day for these groups)
  spielsituation: string;
  schlagZiel: string;
  nbf: string;
  akzent: string;
  methodik: string;
  bemerkung: string;
};

export type LessonStructure = {
  warmup: string;
  technik: string;
  taktik: string | null;
  spielform: string;
};

export type LehrplanNiveau = {
  id: Niveau;
  title: string;
  shortTitle: string;
  ageRange: string | null;
  focusLine: string;
  description: string;
  periodisierung: string;
  lessonStructure: LessonStructure;
  weeks: LehrplanWeek[];
};

export const NIVEAU_ORDER: Niveau[] = ["n1", "n2", "n3", "vhs"];

export const NIVEAU_LABEL: Record<Niveau, string> = {
  n1: "Niveau 1",
  n2: "Niveau 2",
  n3: "Niveau 3",
  vhs: "Sondergruppe",
};

const N1_WEEKS: LehrplanWeek[] = [
  {
    week: 1,
    date: "2026-05-06",
    spielsituation: "Grundlinienspiel — Auftakt",
    schlagZiel: "VH / RH cross + Mitte",
    nbf: "Konstanz · Platzierung",
    akzent:
      "Cross-Konstanz: 10er-Serien ohne Fehler. Recovery zur Mittellinie nach jedem Schlag.",
    methodik:
      "Power-Position als Endposition Ausholen. Treffpunkt seitlich vor dem Körper. U-Turn FH cross.",
    bemerkung:
      "Allgemein mehr cross als longline. Bewegung zur Winkelhalbierenden.",
  },
  {
    week: 2,
    date: "2026-05-13",
    spielsituation: "Vorlaufen + Netzspiel — Erstkontakt",
    schlagZiel: "Volley + Approach + Stop",
    nbf: "Platzierung · Antizipation",
    akzent:
      "Approach longline → erste Volley diagonal in offene Hälfte. Kurzer Ball erkennen + angreifen.",
    methodik:
      "V-förmige Schrittrichtung beim Volley. Ellbogen vor dem Körper. Slice-Approach als Standard.",
    bemerkung: "Nicht jeder Volley muss Unterschnitt haben.",
  },
  {
    week: 3,
    date: "2026-05-20",
    spielsituation: "Service + Return auf Aufschlag",
    schlagZiel: "1./2. Aufschlag + Return",
    nbf: "Konstanz (Wurf) · Platzierung",
    akzent:
      "1.S 60% Quote, 2.S 95% Quote. Return tief in Mitte (1.S) oder Richtung Mitte (2.S).",
    methodik:
      "Werfen einüben — Pendel im unteren Bogen, Wurf 12:00. Spannbogen aus den Beinen. Pronation. Splitstep Pflicht beim Return.",
    bemerkung: "Body-Serve und Slice-Aufschlag als Variation.",
  },
  {
    week: 4,
    date: "2026-05-27",
    spielsituation: "Grundlinienspiel — 2×1 Hauptspielzug",
    schlagZiel: "VH inside-out / RH cross + longline-Winner",
    nbf: "Platzierung · Tempo",
    akzent:
      "2× cross (lang/winkel) + 1× longline als wiederholbares Pattern. 85 % der Winner mit VH.",
    methodik:
      "Platzierung in Zonen. FH-Inside-Out aus Mitte. Longline als Überraschung wenn Gegner cross erwartet.",
    bemerkung: "Häufigster Spielzug Spitzentennis: 2×1.",
  },
  {
    week: 5,
    date: "2026-06-03",
    spielsituation: "Spielen gegen Netzspieler",
    schlagZiel: "Pass cross / longline + Lob + Drop",
    nbf: "Rotation · Platzierung",
    akzent:
      "Drei Antworten auf Netzspieler. Topspin-Lob als Waffe — die meisten Gegner können keinen Smash.",
    methodik:
      "Frisbee-Werfen für VH-Slice / Drop. Spin-Lob: tief unter den Ball, Schläger fällt, Rotation hoch. Body-Drop wenn Gegner aus Position.",
    bemerkung: "Lob und Drop als Variations-Werkzeuge.",
  },
  {
    week: 6,
    date: "2026-06-10",
    spielsituation: "Service+1 / Return+1 (erste 4 Schläge)",
    schlagZiel: "Aufschlag + VH / Return + 1",
    nbf: "Tempo · Platzierung",
    akzent:
      "70 % der Punkte fallen in 0–4 Schlägen — also genau diese 4 Schläge perfektionieren.",
    methodik:
      "Plan vor dem Aufschlag laut sagen: „außen + VH inside-out“. Serve+1 = Serve+VH. Returnseite: Vorwärtsschritt nach Splitstep.",
    bemerkung: "Erste 4 Schläge entscheiden 70 % der Punkte.",
  },
  {
    week: 7,
    date: "2026-06-17",
    spielsituation: "Doppel — I-Formation, Poachen, Aussie",
    schlagZiel: "Aufschlag + Volley-Poach",
    nbf: "Antizipation · Camouflage",
    akzent:
      "Server-Returner-Kommunikation. Poach-Timing am Netz. I-Formation als Druckmittel.",
    methodik:
      "Server signalisiert Platzierung per Hand hinter Rücken. Netzspieler bewegt sich beim Treffpunkt zur Mitte.",
    bemerkung: "Position auf Winkelhalbierender erreichen.",
  },
  {
    week: 8,
    date: "2026-06-24",
    spielsituation: "Grundlinienspiel unter Druck — Power & Stamina",
    schlagZiel: "VH/RH unter Tempo",
    nbf: "Schlagtempo · Unter Druck",
    akzent:
      "Power-Maximierung in kontrollierten Drills. Stamina-Limit suchen. Lange Punkte bauen statt früh enden.",
    methodik:
      "Suicides, Tabata, Med-Ball-Slam. Battles bis 21 Punkte ohne Pause. „Suffer wisely.“",
    bemerkung: "27 % der Punkte = unforced Errors — Power dosieren.",
  },
  {
    week: 9,
    date: "2026-07-01",
    spielsituation: "Match-Druck — Tiebreaks, Breakpoints",
    schlagZiel: "Aufschlag/Return im Score-Kontext",
    nbf: "Unter Druck · Camouflage",
    akzent:
      "Routinen unter Druck halten. Breakpoint-Quote (Save) und Service-Quote (Win) erhöhen.",
    methodik:
      "Atemroutine vor dem Aufschlag. Score-Strategien: 30:0 anders spielen als 30:30. Break-Punkte: nichts riskieren, hoch über die Mitte.",
    bemerkung: "Ziel: 60 % Save Breakpoints, 80 % Win Service Games.",
  },
  {
    week: 10,
    date: "2026-07-08",
    spielsituation: "Resilient im Wettkampf — Variation als Waffe",
    schlagZiel: "Volle Palette mit Camouflage",
    nbf: "Camouflage · Variation",
    akzent:
      "Gegner irritieren ohne Niveauverlust. „Guter Gegner sein“ — bestes Tennis + Sportsmanship.",
    methodik:
      "Tempo-Variation, Spin-Variation, Body-Serve, Drop nach Tiefe. Selbst-Calls mit Fairness.",
    bemerkung: "Variation + Camouflage als zwei der 10 NBF.",
  },
  {
    week: 11,
    date: "2026-07-15",
    spielsituation: "Wettkampf-Tag — Anwendung & Reflexion",
    schlagZiel: "Alles",
    nbf: "Anwendung",
    akzent:
      "Mini-Turnier (Round-Robin oder König-Match). Saisonziele festhalten.",
    methodik:
      "Aufschlag-Plus-1-Quote zählen. Punkt-Länge zählen. Sportsmanship feiern.",
    bemerkung: "Vorher-Nachher-Statistik vergleichen.",
  },
];

const N2_WEEKS: LehrplanWeek[] = [
  {
    week: 1,
    date: "2026-05-06",
    spielsituation: "Grundlinienspiel — Hart-Ball kalibrieren",
    schlagZiel: "VH + RH Grundschwung",
    nbf: "Konstanz · Treffpunkt",
    akzent:
      "Cross-Konstanz auf Vollfeld. Treffpunkt ans schnellere Tempo anpassen.",
    methodik:
      "Power-Position. Schlägerkopf über Handgelenk → fallen lassen → Peitsche. Beidh. RH: linke Hand dominant.",
    bemerkung: "Treffpunkt seitlich vor dem Körper.",
  },
  {
    week: 2,
    date: "2026-05-13",
    spielsituation: "Netzspiel + kurzer Ball",
    schlagZiel: "Volley aus dem Stand + Approach",
    nbf: "Platzierung · Antizipation",
    akzent:
      "Erstkontakt Volley. Kurzen Ball erkennen, vorlaufen, Approach longline.",
    methodik:
      "Hammergriff. Ellbogen vor dem Körper. „Ball fangen vor dem Körper“.",
    bemerkung: "V-förmiger Schritt zum Treffpunkt.",
  },
  {
    week: 3,
    date: "2026-05-20",
    spielsituation: "Service + Return als Paket",
    schlagZiel: "1. Aufschlag + Return tief Mitte",
    nbf: "Konstanz (Wurf) · Platzierung",
    akzent:
      "Konstanten Wurf an gleicher Stelle. Return tief mittig auf 2. Aufschlag.",
    methodik:
      "Pfeil-und-Bogen-Bild. 2-Finger-Aufschlag zur Lockerheit. Splitstep beim Return Pflicht.",
    bemerkung: "Wurf ist die Grundvoraussetzung für alles Weitere.",
  },
  {
    week: 4,
    date: "2026-05-27",
    spielsituation: "Slice einführen — VH und RH",
    schlagZiel: "Slice-RH einhändig, VH-Slice als Drop-Vorstufe",
    nbf: "Rotation · Variation",
    akzent:
      "Slice als Defensiv- und Variations-Tool. Schlägerkopf leicht oberhalb des Balls.",
    methodik:
      "Frisbee-Bild für RH-Slice. Semicontinental. Ausschwung über Mittelachse.",
    bemerkung:
      "Slice früh einführen, bevor schlechte Gewohnheiten zementieren.",
  },
  {
    week: 5,
    date: "2026-06-03",
    spielsituation: "Spielen gegen Netzspieler",
    schlagZiel: "Pass + Lob + Drop-Erstkontakt",
    nbf: "Platzierung · Rotation",
    akzent:
      "Drei Antworten auf Netzspieler. Lob über den Kopf — die meisten Kinder können noch keinen Smash.",
    methodik:
      "Topspin-Lob: Ball mit Spin nach oben, fällt schnell. Block-Lob bei Zeitnot. Drop = Slice mit Auslauf.",
    bemerkung: "Lob als Werkzeug, nicht als Notlösung.",
  },
  {
    week: 6,
    date: "2026-06-10",
    spielsituation: "Grundlinienspiel — 2×1 Pattern",
    schlagZiel: "2 cross + 1 longline",
    nbf: "Platzierung · Tempo",
    akzent:
      "Hauptspielzug 2×1 als Standard. Spielintention vor dem Schlag laut sagen.",
    methodik:
      "Cross sicher, Longline nur wenn Gegner falsch steht. Ball aus offenem Stand spielen.",
    bemerkung: "Häufigster Spielzug Spitzentennis: 2×1.",
  },
  {
    week: 7,
    date: "2026-06-17",
    spielsituation: "Verteidigen + hoher Ball Mitte (Recovery)",
    schlagZiel: "Hoher Ball, Slice tief, Lob defensiv",
    nbf: "Konstanz · Felddeckung",
    akzent:
      "In der Verteidigung Zeit gewinnen. Hoher Ball über Mitte = Recovery-Tool.",
    methodik:
      "Wenn ich aus dem Eck verteidigen muss: hoch + Mitte → ich erreiche meinen Mittelpunkt zurück.",
    bemerkung: "Position auf der Winkelhalbierenden ist immer das Ziel.",
  },
  {
    week: 8,
    date: "2026-06-24",
    spielsituation: "Approach + Volley + Smash kombiniert",
    schlagZiel: "Approach → Volley → Smash bei Lob",
    nbf: "Tempo · Antizipation",
    akzent:
      "Komplette Netzangriffs-Sequenz. Auf Lob-Antwort: Smash diagonal.",
    methodik:
      "Smash: seitwärts drehen, Schritt-Schritt-Schritt unter den Ball, Schlägerschwung wie Aufschlag.",
    bemerkung: "Smash: langsam vorbereiten, oben beschleunigen.",
  },
  {
    week: 9,
    date: "2026-07-01",
    spielsituation: "Doppel — Stellung & Kommunikation",
    schlagZiel: "Doppel-Aufschlag + Doppel-Volley",
    nbf: "Antizipation",
    akzent:
      "Stellungs-Verständnis: einer hinten, einer vorne; Aufschläger kommt nach.",
    methodik:
      "Mittel-Lücken vermeiden. Netzspieler poachet bei tiefem Return.",
    bemerkung: "Kommunikation Server-Returner aktiv schulen.",
  },
  {
    week: 10,
    date: "2026-07-08",
    spielsituation: "Match-Druck — Tiebreaks",
    schlagZiel: "Volle Palette unter Druck",
    nbf: "Unter Druck",
    akzent:
      "Aufschlagspiel-Quote. Routinen unter Score-Druck halten.",
    methodik:
      "Tiebreak-Marathon. Aufschlag-Plus-1 mit Plan + 2-Punkte-Bonus bei Plan-Erfolg.",
    bemerkung: "Spielen unter Druck als trainierbare NBF.",
  },
  {
    week: 11,
    date: "2026-07-15",
    spielsituation: "Wettkampf-Tag — Mini-Turnier",
    schlagZiel: "Alles",
    nbf: "Anwendung",
    akzent:
      "Round-Robin internes Mini-Turnier. Sportsmanship feiern, Champion-Urkunde.",
    methodik:
      "Lieblings-Drills aus 11 Wochen mitnehmen. Saisonende positiv abschließen.",
    bemerkung: "Erlebniswelt der 10–13-Jährigen ansprechen.",
  },
];

const N3_WEEKS: LehrplanWeek[] = [
  {
    week: 1,
    date: "2026-05-06",
    spielsituation: "Ballgefühl + Treffpunkt",
    schlagZiel: "VH cross",
    nbf: "Ballgefühl · Konstanz",
    akzent:
      "Schläger-Ball-Bewohnen. Treffpunkt seitlich vorm Körper finden.",
    methodik:
      "„Banane zum Mund“. Schläger kurz fassen. Mini-Tennis im Aufschlagfeld.",
    bemerkung: "Treffpunkt vor dem Körper — kindgerecht übersetzt.",
  },
  {
    week: 2,
    date: "2026-05-13",
    spielsituation: "Kurzer Ball — laufen + VH",
    schlagZiel: "VH attackieren auf kurzen Ball",
    nbf: "Antizipation · Sprint",
    akzent: "Ball erkennen, nach vorn laufen, VH cross.",
    methodik:
      "„Ist der Ball kurz? → Lauf nach vorn → Schlag mit der VH.“ Zwei Fragen, mehr nicht.",
    bemerkung: "Vereinfachte Version der Erwachsenen-Strategie.",
  },
  {
    week: 3,
    date: "2026-05-20",
    spielsituation: "Beidhändige Rückhand einführen",
    schlagZiel: "RH cross",
    nbf: "Konstanz",
    akzent: "Sauberen RH-Treffpunkt finden. Cross-Rallye RH.",
    methodik:
      "„Eimer Wasser ausschütten“. Linke Hand führt (Rechtshänder).",
    bemerkung: "Klassisches Bewegungsbild aus der Trainerpraxis.",
  },
  {
    week: 4,
    date: "2026-05-27",
    spielsituation: "Aufschlag-Bewegung",
    schlagZiel: "Schaufel-Aufschlag",
    nbf: "Konstanz",
    akzent:
      "Bewegung aus der Tiefe verstehen. Aus T-Linie über das Netz aufschlagen.",
    methodik:
      "Schaufel-Bild: Schläger fällt nach unten, dann nach oben. Wurfhand zum Himmel.",
    bemerkung: "Pendelbewegung im unteren Bogen — frühe Aufschlag-Vorstufe.",
  },
  {
    week: 5,
    date: "2026-06-03",
    spielsituation: "Volley-Erstkontakt",
    schlagZiel: "VH und RH Volley aus der Hand",
    nbf: "Ballgefühl",
    akzent:
      "Erstes Erlebnis am Netz. „Ball fangen mit den Saiten“.",
    methodik: "Hammergriff. Schläger waagrecht. Kein Ausholen.",
    bemerkung: "Volley-Grundlage für späteren Hart-Übergang.",
  },
  {
    week: 6,
    date: "2026-06-10",
    spielsituation: "Cross spielen vs. Mitte",
    schlagZiel: "Platzierung FH/RH",
    nbf: "Platzierung",
    akzent:
      "Bewusste Platzierung — wo will ich hin? Hütchen-Zonen treffen.",
    methodik: "Targetwars: Hütchen umspielen = 1 Punkt, treffen = 3.",
    bemerkung: "Platzierung als NBF früh einführen.",
  },
  {
    week: 7,
    date: "2026-06-17",
    spielsituation: "Slice einführen — Frisbee",
    schlagZiel: "VH-Slice (Drop-Vorstufe)",
    nbf: "Variation · Rotation",
    akzent:
      "Slice als „witzigen“ Schlag entdecken. Frisbee-Werfen.",
    methodik: "Schläger leicht offen. Schwung von oben nach unten-vorn.",
    bemerkung: "Slice spielerisch ans Orange-Niveau angepasst.",
  },
  {
    week: 8,
    date: "2026-06-24",
    spielsituation: "Smash-Erstkontakt",
    schlagZiel: "Smash aus hohem Hand-Feed",
    nbf: "Tempo · Ballgefühl",
    akzent:
      "Hohen Ball mit Schläger über Kopf treffen. Spaß am „Hau drauf“.",
    methodik:
      "Trainer wirft sehr hohen Ball, Spieler schlägt nach unten ins Feld. Beide Hände am Ball halten.",
    bemerkung: "Vorform Smash — Aufschlag-Bewegung am stehenden Ball.",
  },
  {
    week: 9,
    date: "2026-07-01",
    spielsituation: "Doppel-Spaß — 2v2",
    schlagZiel: "Alles",
    nbf: "Spielfreude",
    akzent: "Erste Doppel-Erfahrung. Lernen, sich abzusprechen.",
    methodik: "Wer ruft den Ball? Wer steht wo? Trainer mediatiert.",
    bemerkung: "Kindgerechte Doppel-Stellung.",
  },
  {
    week: 10,
    date: "2026-07-08",
    spielsituation: "Mini-Wettkampf Round-Robin",
    schlagZiel: "Alles",
    nbf: "Anwendung",
    akzent:
      "Jeder gegen jeden, kurze Spiele zu 5 Punkten. Punktspiel-Erfahrung.",
    methodik:
      "Sportsmanship-Punkte zusätzlich vergeben (handshake, fair play).",
    bemerkung: "Guter Gegner sein — von früh an eingeübt.",
  },
  {
    week: 11,
    date: "2026-07-15",
    spielsituation: "Sommer-Spaß-Tag",
    schlagZiel: "Alles",
    nbf: "Spielfreude",
    akzent: "Saisonende positiv. Lieblings-Spiele.",
    methodik: "Kinder wählen Übungen. Mini-Match. Eis am Ende.",
    bemerkung: "Erlebniswelt zuerst.",
  },
];

const VHS_WEEKS: LehrplanWeek[] = [
  {
    week: 1,
    date: "2026-05-06",
    spielsituation: "Auftakt — Ballgefühl + Vorhand",
    schlagZiel: "Vorhand",
    nbf: "Ballgefühl · Konstanz",
    akzent:
      "Schläger halten, Ball treffen, ersten Ball mit der Vorhand über das Netz spielen. Spaß und erstes Erfolgserlebnis.",
    methodik:
      "Eastern-Griff. Schläger kurz fassen. Ball auf den Saiten balancieren, prellen. Mini-Tennis aus der Aufschlaglinie mit Trainer-Wurf.",
    bemerkung: "Erfolg geht in dieser Stunde vor Technik.",
  },
  {
    week: 2,
    date: "2026-05-13",
    spielsituation: "Rückhand + Wiederholung Vorhand",
    schlagZiel: "VH + RH (beidhändig)",
    nbf: "Konstanz · Treffpunkt",
    akzent:
      "5 Bälle im Aufschlagfeld hin und her — kooperative Mini-Tennis-Rallye. Beidhändige Rückhand-Bewegung kennen.",
    methodik:
      "„Eimer Wasser ausschütten“-Bild für die Rückhand. Linke Hand führt. Treffpunkt vor dem Körper. Wiederholung wichtiger als Korrektur.",
    bemerkung:
      "Stunde 2 vertieft Stunde 1 — noch keine neuen Themen, nur sauberer.",
  },
  {
    week: 3,
    date: "2026-05-20",
    spielsituation: "Erster Aufschlag",
    schlagZiel: "Aufschlag (Schaufel → Standard)",
    nbf: "Konstanz (Wurf)",
    akzent:
      "Aufschlag aus der T-Linie in das Aufschlagfeld bringen. Wurfhand und Schlaghand koordinieren.",
    methodik:
      "Schaufel-Bild: Schläger fällt unten durch und wieder hoch. Pendelbewegung. Wurfhand zum Himmel. Erste Versuche aus der Grundlinie für Geübte.",
    bemerkung: "Werfen vor Schlagen — die Wurfqualität entscheidet alles.",
  },
  {
    week: 4,
    date: "2026-05-27",
    spielsituation: "Zählen + Doppel + Volley am Netz",
    schlagZiel: "Alle Schläge + Volley-Erstkontakt",
    nbf: "Antizipation · Konstanz",
    akzent:
      "Tennis-Zählweise verstehen (15-30-40-Spiel). Doppel-Aufstellung kennen. Ball am Netz fangen mit Volley.",
    methodik:
      "Hammergriff am Netz. „Ball fangen mit den Saiten“. Wer steht wo im Doppel? Wer ruft den Ball? Aufschlag → Return → Ballwechsel.",
    bemerkung: "Spielerische Erstbegegnung mit Punktspiel-Mechanik.",
  },
  {
    week: 5,
    date: "2026-06-03",
    spielsituation:
      "Anwendung — Kleinfeld-Singles + Doppel + Grundlinie für Geübte",
    schlagZiel: "Alles im Spielkontext",
    nbf: "Anwendung · Spielfreude",
    akzent:
      "Singles im Aufschlagfeld (Kleinfeld) spielen können. Doppel auf dem ganzen Platz. Geübte Spieler vom Grundlinien-Bereich.",
    methodik:
      "Aufschlag von Hand erlaubt, wenn der reguläre Aufschlag noch nicht klappt. Sportsmanship-Punkte. Hinweis auf Folgekurs und Verein.",
    bemerkung:
      "Saisonabschluss mit positivem Erlebnis und klarem nächsten Schritt.",
  },
];

export const LEHRPLAN: Record<Niveau, LehrplanNiveau> = {
  n1: {
    id: "n1",
    title: "Niveau 1 — Erwachsene / Fortgeschritten",
    shortTitle: "Erwachsene / Fortgeschritten",
    ageRange: null,
    focusLine:
      "Taktische Tiefe, Wettkampfstabilität, Variation. Spieler in Mannschaft oder Turnier.",
    description:
      "Spieler, die alle Schläge technisch beherrschen und in der Saison Mannschaftsspiele oder Turniere bestreiten. Schwerpunkt: taktische Tiefe, Wettkampfstabilität, Variation. Saisonbeginn nutzen wir zur Standortbestimmung — Cross-Konstanz, Tiefe, Aufschlag-Quote — und besprechen persönliche Ziele für die 11 Wochen.",
    periodisierung:
      "Vier Perioden in 11 Wochen: P1 Grundordnung (W1–3), P2 Patterns + Aufschlagwaffe (W4–6), P3 Druck + Doppel (W7–9), P4 Wettkampf-Resilienz (W10–11).",
    lessonStructure: {
      warmup: "10 min",
      technik: "20 min",
      taktik: "15 min",
      spielform: "15 min",
    },
    weeks: N1_WEEKS,
  },
  n2: {
    id: "n2",
    title: "Niveau 2 — Hart-Mixed Jugend",
    shortTitle: "Hart-Mixed Jugend",
    ageRange: "9–14 Jahre",
    focusLine:
      "Schläge auf Hart-Tempo kalibrieren, Patterns einführen, erste Wettkampf-Erfahrungen.",
    description:
      "Spieler im Alter 9–14, in der Übergangsphase zum gelben Hart-Ball. Schwerpunkt: Schläge auf Hart-Tempo kalibrieren, Patterns einführen, erste Wettkampf-Erfahrungen. In den ersten Stunden beobachtet der Trainer Cross-Konstanz, Treffpunkt und Aufschlag-Wurf — Diagnose vor Korrektur.",
    periodisierung:
      "Drei Perioden in 11 Wochen: P1 Grundschläge auf Hart (W1–4 inkl. Slice-Einführung), P2 Patterns + Spiel gegen Netzspieler + Netzangriff (W5–8), P3 Doppel + Match + Mini-Turnier (W9–11).",
    lessonStructure: {
      warmup: "10 min",
      technik: "25 min",
      taktik: "15 min",
      spielform: "10 min",
    },
    weeks: N2_WEEKS,
  },
  n3: {
    id: "n3",
    title: "Niveau 3 — Orange",
    shortTitle: "Orange",
    ageRange: "7–9 Jahre",
    focusLine:
      "Ballgefühl, erste Schläge, Spaß. Spielfreude vor Schlag-Perfektion.",
    description:
      "Kinder im Alter 7–9 Jahre, oranger Punktball, Midcourt 18 m. Schwerpunkt: Ballgefühl, erste Schläge, Spaß. Spielfreude ist immer wichtiger als Schlag-Perfektion. Bewegungsbilder als Anker (Banane, Eimer Wasser, Frisbee, Schaufel).",
    periodisierung:
      "Drei Perioden, deutlich spielerischer: P1 Ballgefühl + Grundschläge (W1–4), P2 Spiel-Elemente einführen (W5–8), P3 Wettkampf-Spaß (W9–11).",
    lessonStructure: {
      warmup: "10 min",
      technik: "20 min",
      taktik: "10 min",
      spielform: "20 min",
    },
    weeks: N3_WEEKS,
  },
  vhs: {
    id: "vhs",
    title: "Sondergruppe — VHS Anfängerkurs",
    shortTitle: "VHS Anfänger / Hobbytreff",
    ageRange: "Erwachsene Anfänger",
    focusLine:
      "Fünf Stunden bis zum ersten Doppel: Aufschlag, Zählen, Kleinfeld-Singles.",
    description:
      "Erwachsene Totalanfänger, fünf Stunden in Folge ab 6. Mai 2026. Ziel ist nicht Technik-Perfektion, sondern: am Ende der fünf Stunden können die Teilnehmer einen Aufschlag platzieren, im Doppel zählen und sich aufstellen, im Kleinfeld Singles spielen, und die Geübten einen kurzen Ballwechsel von der Grundlinie führen. Der Hobbytreff folgt sinngemäß demselben Mini-Plan.",
    periodisierung:
      "Drei Mini-Perioden in 5 Stunden: P1 Grundschläge VH + RH (Stunde 1–2), P2 Aufschlag + erste Punktspiel-Mechanik (Stunde 3–4), P3 Anwendung (Stunde 5). Jede Stunde endet mit einem kooperativen Spielblock.",
    lessonStructure: {
      warmup: "10 min",
      technik: "30 min",
      taktik: null,
      spielform: "20 min",
    },
    weeks: VHS_WEEKS,
  },
};

export function isNiveau(value: unknown): value is Niveau {
  return (
    value === "n1" || value === "n2" || value === "n3" || value === "vhs"
  );
}
