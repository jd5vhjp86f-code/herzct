/**
 * Vortestwahrscheinlichkeit (VTW) für eine stenosierende KHK – reine Rechenlogik ohne DOM.
 *
 * Quellen (Stand 05.10.2026):
 *  - NVL Chronische KHK, Version 7.0 (2024), Tabelle 5 (Marburger Herz-Score, hausärztliche
 *    Versorgungsebene, Empfehlungen 3-4 bis 3-7) und Tabelle 6 (DISCHARGE-Kalkulator,
 *    spezialfachärztliche Versorgungsebene, Empfehlung 3-8), Empfehlungen 3-12 bis 3-15.
 *  - G-BA, MVV-RL Anlage I Nr. 42 (Beschluss vom 18.01.2024): CCTA zu Lasten der GKV ab
 *    VTW ≥ 15 %; bei VTW 15–50 % soll die Abklärung mittels CCTA erfolgen (§ 3 Abs. 1).
 *  - EBM 34370: Überweisung mit Dokumentation der VTW (Ergebnis und Art der Ermittlung).
 *
 * Das Ergebnis ist eine Orientierung für Ärztinnen und Ärzte, keine Indikationsstellung.
 */

export const SOURCE_NVL = 'NVL Chronische KHK, Version 7.0 (2024)';

/** NVL Tabelle 6 (DISCHARGE-Kalkulator), gerundete Prozentwerte. Reihenfolge: [Frauen, Männer]. */
export const DISCHARGE_TABLE = {
  typical:    { '30-39': [31, 52], '40-49': [38, 59], '50-59': [45, 66], '60-69': [52, 72], '70+': [60, 78] },
  atypical:   { '30-39': [14, 29], '40-49': [19, 36], '50-59': [24, 43], '60-69': [30, 51], '70+': [37, 58] },
  nonanginal: { '30-39': [14, 28], '40-49': [18, 35], '50-59': [23, 42], '60-69': [29, 49], '70+': [36, 57] },
  other:      { '30-39': [12, 25], '40-49': [15, 31], '50-59': [20, 38], '60-69': [25, 45], '70+': [32, 52] },
};

export const SYMPTOM_LABEL = {
  typical: 'typische Angina pectoris',
  atypical: 'atypische Angina pectoris',
  nonanginal: 'nicht-anginöse Brustschmerzen',
  other: 'andere Brustschmerzen',
};

export const AGE_GROUPS = ['30-39', '40-49', '50-59', '60-69', '70+'];
export const AGE_GROUP_LABEL = { '30-39': '30–39 J.', '40-49': '40–49 J.', '50-59': '50–59 J.', '60-69': '60–69 J.', '70+': '≥ 70 J.' };

/** Alter → Altersgruppe der Tabelle 6; unter 30 Jahren ist die Tabelle nicht anwendbar. */
export function ageGroup(age) {
  if (!Number.isFinite(age) || age < 30) return null;
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age < 70) return '60-69';
  return '70+';
}

/**
 * Angina-Klassifikation nach NVL (Kriterien nach Diamond):
 *  1. einengende Beschwerden retrosternal oder in Nacken, Schulter, Kiefer oder Arm
 *  2. verstärkt durch körperliche Belastung oder emotionalen Stress
 *  3. Besserung durch Ruhe und/oder Nitro innerhalb von 5 Minuten
 * 3 Kriterien → typisch, 2 → atypisch, 0–1 → nicht-anginös.
 */
export function classifySymptoms(criteria) {
  const n = [criteria?.location, criteria?.exertion, criteria?.relief].filter(Boolean).length;
  if (n === 3) return 'typical';
  if (n === 2) return 'atypical';
  return 'nonanginal';
}

/** VTW nach NVL Tabelle 6. sex: 'f' | 'm'. */
export function dischargeVtw({ age, sex, symptom }) {
  const group = ageGroup(age);
  if (!group || !DISCHARGE_TABLE[symptom] || !['f', 'm'].includes(sex)) return null;
  return DISCHARGE_TABLE[symptom][group][sex === 'f' ? 0 : 1];
}

/** Marburger Herz-Score (NVL Tabelle 5): fünf Kriterien, je 1 Punkt. */
export const MHS_CRITERIA = [
  ['ageSex', 'Geschlecht und Alter (Männer ≥ 55 Jahre, Frauen ≥ 65 Jahre)'],
  ['vascular', 'Bekannte vaskuläre Erkrankung'],
  ['exertional', 'Beschwerden sind belastungsabhängig'],
  ['notPalpable', 'Schmerzen sind durch Palpation nicht reproduzierbar'],
  ['patientCardiac', 'Patient/Patientin vermutet, dass der Schmerz vom Herzen kommt'],
];

export function marburgScore(answers) {
  return MHS_CRITERIA.reduce((sum, [key]) => sum + (answers?.[key] ? 1 : 0), 0);
}

/**
 * Interpretation nach NVL Tabelle 5 und Empfehlungen 3-5/3-6.
 * Liefert einen Orientierungswert (Zahl) für die Einordnung und einen Anzeigetext.
 */
export function marburgVtw(score) {
  if (!Number.isInteger(score) || score < 0 || score > 5) return null;
  if (score <= 2) return { value: 2.5, display: '< 2,5 %', below: true };
  if (score === 3) return { value: 17, display: 'ca. 17 %', below: false };
  return { value: 50, display: 'ca. 50 %', below: false };
}

/**
 * Einordnung der VTW.
 *  low:      < 15 %   → NVL 3-12: primär keine KHK-Diagnostik, andere Ursache erwägen; keine GKV-Indikation für CCTA
 *  cctaPreferred: 15–50 % → G-BA § 3 Abs. 1 / NVL 3-15: Abklärung mittels CCTA
 *  intermediateHigh: > 50–85 % → NVL 3-14: nicht-invasive Diagnostik; CCTA (GKV-Indikation besteht) oder funktionelle Bildgebung
 *  high:     > 85 %   → NVL 3-13: stenosierende KHK annehmen, Therapieplanung
 */
export function categorize(vtw) {
  if (!Number.isFinite(vtw)) return null;
  if (vtw < 15) return 'low';
  if (vtw <= 50) return 'cctaPreferred';
  if (vtw <= 85) return 'intermediateHigh';
  return 'high';
}

export const CATEGORY_TEXT = {
  low: {
    title: 'Niedrige Vortestwahrscheinlichkeit (< 15 %)',
    text: 'Nach NVL (Empfehlung 3-12) sollte primär keine Diagnostik zum Nachweis einer stenosierenden KHK erfolgen, sondern eine andere Ursache der Beschwerden erwogen werden. Eine CCTA zu Lasten der GKV setzt eine VTW von mindestens 15 % voraus (MVV-RL Anl. I Nr. 42 § 2).',
    short: '< 15 %: primär keine KHK-Diagnostik, andere Ursache erwägen (NVL 3-12); keine GKV-Indikation für CCTA',
  },
  cctaPreferred: {
    title: 'VTW 15–50 %: Koronar-CT bevorzugt',
    text: 'Liegt die VTW zwischen 15 % und 50 %, soll die Abklärung durch eine CCTA erfolgen (MVV-RL Anl. I Nr. 42 § 3 Abs. 1; NVL Empfehlung 3-15).',
    short: '15–50 %: Abklärung mittels CCTA (MVV-RL Anl. I Nr. 42 § 3 Abs. 1; NVL 3-15)',
  },
  intermediateHigh: {
    title: 'VTW über 50 bis 85 %',
    text: 'Nicht-invasive Diagnostik (NVL Empfehlung 3-14). Die GKV-Indikation zur CCTA besteht ab 15 %; im oberen Bereich kommen gleichermaßen funktionelle bildgebende Verfahren in Betracht. Die Wahl richtet sich nach Eignung, Fragestellung und Therapieplanung (NVL 3-11).',
    short: '> 50–85 %: nicht-invasive Diagnostik (NVL 3-14), CCTA oder funktionelle Bildgebung nach Eignung (NVL 3-11)',
  },
  high: {
    title: 'Hohe Vortestwahrscheinlichkeit (> 85 %)',
    text: 'Nach NVL (Empfehlung 3-13) sollte ohne weitere Diagnostik eine stenosierende KHK angenommen und mit der Therapieplanung begonnen werden.',
    short: '> 85 %: KHK annehmen, Therapieplanung (NVL 3-13)',
  },
};

/** Validierung der Eingaben im DISCHARGE-Modus. Liefert { feld: Meldung }. */
export function validateDischarge({ age, sex, symptom }) {
  const errors = {};
  if (!Number.isFinite(age)) errors.age = 'Bitte das Alter angeben.';
  else if (!Number.isInteger(age) || age < 18 || age > 110) errors.age = 'Bitte ein Alter zwischen 18 und 110 Jahren angeben.';
  else if (age < 30) errors.age = 'Tabelle 6 der NVL gilt erst ab 30 Jahren.';
  if (!['f', 'm'].includes(sex)) errors.sex = 'Bitte das Geschlecht angeben.';
  if (!DISCHARGE_TABLE[symptom]) errors.symptom = 'Bitte die Art der Beschwerden angeben.';
  return errors;
}

const fmtPct = (v) => `${v} %`;

/** Kopierbare Kurzzusammenfassung für die Überweisung (EBM 34370: Ergebnis und Art der Ermittlung). */
export function buildSummary(input) {
  if (input.mode === 'discharge') {
    const vtw = dischargeVtw(input);
    if (vtw == null) return '';
    const cat = categorize(vtw);
    return [
      `VTW stenosierende KHK: ${fmtPct(vtw)}`,
      `Ermittlung: DISCHARGE-Kalkulator, ${SOURCE_NVL}, Tabelle 6`,
      `Angaben: ${input.sex === 'f' ? 'weiblich' : 'männlich'}, ${input.age} J. (Gruppe ${AGE_GROUP_LABEL[ageGroup(input.age)]}), ${SYMPTOM_LABEL[input.symptom]}`,
      `Einordnung: ${CATEGORY_TEXT[cat].short}`,
    ].join(' · ');
  }
  if (input.mode === 'marburg') {
    const score = marburgScore(input.answers);
    const res = marburgVtw(score);
    const cat = categorize(res.value);
    return [
      `VTW stenosierende KHK: ${res.display}`,
      `Ermittlung: Marburger Herz-Score ${score}/5 Punkte, ${SOURCE_NVL}, Tabelle 5`,
      `Einordnung: ${CATEGORY_TEXT[cat].short}`,
    ].join(' · ');
  }
  return '';
}
