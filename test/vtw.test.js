import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ageGroup, classifySymptoms, dischargeVtw, DISCHARGE_TABLE, marburgScore, marburgVtw,
  categorize, validateDischarge, buildSummary,
} from '../assets/js/vtw.js';

test('Altersgruppen nach NVL Tabelle 6', () => {
  assert.equal(ageGroup(29), null);
  assert.equal(ageGroup(30), '30-39');
  assert.equal(ageGroup(39), '30-39');
  assert.equal(ageGroup(40), '40-49');
  assert.equal(ageGroup(59), '50-59');
  assert.equal(ageGroup(69), '60-69');
  assert.equal(ageGroup(70), '70+');
  assert.equal(ageGroup(95), '70+');
  assert.equal(ageGroup(NaN), null);
});

test('Angina-Klassifikation: 3 → typisch, 2 → atypisch, 0–1 → nicht-anginös', () => {
  assert.equal(classifySymptoms({ location: true, exertion: true, relief: true }), 'typical');
  assert.equal(classifySymptoms({ location: true, exertion: true }), 'atypical');
  assert.equal(classifySymptoms({ relief: true, exertion: true }), 'atypical');
  assert.equal(classifySymptoms({ location: true }), 'nonanginal');
  assert.equal(classifySymptoms({}), 'nonanginal');
});

test('Tabelle 6 vollständig und Werte wie in der NVL', () => {
  // Stichproben direkt aus NVL Chronische KHK 7.0, Tabelle 6
  assert.equal(dischargeVtw({ age: 35, sex: 'f', symptom: 'typical' }), 31);
  assert.equal(dischargeVtw({ age: 35, sex: 'm', symptom: 'typical' }), 52);
  assert.equal(dischargeVtw({ age: 55, sex: 'f', symptom: 'atypical' }), 24);
  assert.equal(dischargeVtw({ age: 65, sex: 'm', symptom: 'atypical' }), 51);
  assert.equal(dischargeVtw({ age: 45, sex: 'm', symptom: 'nonanginal' }), 35);
  assert.equal(dischargeVtw({ age: 75, sex: 'f', symptom: 'other' }), 32);
  assert.equal(dischargeVtw({ age: 80, sex: 'm', symptom: 'typical' }), 78);
  for (const sym of Object.keys(DISCHARGE_TABLE)) {
    assert.equal(Object.keys(DISCHARGE_TABLE[sym]).length, 5);
    for (const [f, m] of Object.values(DISCHARGE_TABLE[sym])) assert.ok(f < m, 'Frauen niedriger als Männer');
  }
  assert.equal(dischargeVtw({ age: 25, sex: 'f', symptom: 'typical' }), null);
  assert.equal(dischargeVtw({ age: 50, sex: 'x', symptom: 'typical' }), null);
});

test('Marburger Herz-Score', () => {
  assert.equal(marburgScore({}), 0);
  assert.equal(marburgScore({ ageSex: true, vascular: true, exertional: true }), 3);
  assert.equal(marburgScore({ ageSex: true, vascular: true, exertional: true, notPalpable: true, patientCardiac: true }), 5);
  assert.equal(marburgVtw(0).display, '< 2,5 %');
  assert.equal(marburgVtw(2).display, '< 2,5 %');
  assert.equal(marburgVtw(3).display, 'ca. 17 %');
  assert.equal(marburgVtw(4).display, 'ca. 50 %');
  assert.equal(marburgVtw(5).display, 'ca. 50 %');
  assert.equal(marburgVtw(6), null);
});

test('Einordnung an den Grenzen 15 / 50 / 85 %', () => {
  assert.equal(categorize(14), 'low');
  assert.equal(categorize(14.9), 'low');
  assert.equal(categorize(15), 'cctaPreferred');
  assert.equal(categorize(50), 'cctaPreferred');
  assert.equal(categorize(51), 'intermediateHigh');
  assert.equal(categorize(85), 'intermediateHigh');
  assert.equal(categorize(86), 'high');
  assert.equal(categorize(marburgVtw(2).value), 'low');
  assert.equal(categorize(marburgVtw(3).value), 'cctaPreferred');
});

test('Validierung', () => {
  assert.deepEqual(validateDischarge({ age: 55, sex: 'f', symptom: 'typical' }), {});
  assert.ok(validateDischarge({ age: NaN, sex: 'f', symptom: 'typical' }).age);
  assert.ok(validateDischarge({ age: 25, sex: 'f', symptom: 'typical' }).age);
  assert.ok(validateDischarge({ age: 55.5, sex: 'f', symptom: 'typical' }).age);
  assert.ok(validateDischarge({ age: 55, sex: '', symptom: 'typical' }).sex);
  assert.ok(validateDischarge({ age: 55, sex: 'm', symptom: '' }).symptom);
});

test('Kurzzusammenfassung enthält Ergebnis und Art der Ermittlung (EBM 34370)', () => {
  const s = buildSummary({ mode: 'discharge', age: 58, sex: 'f', symptom: 'typical' });
  assert.match(s, /VTW stenosierende KHK: 45 %/);
  assert.match(s, /DISCHARGE-Kalkulator, NVL Chronische KHK, Version 7\.0 \(2024\), Tabelle 6/);
  assert.match(s, /weiblich, 58 J\./);
  assert.match(s, /15–50 %: Abklärung mittels CCTA/);
  const m = buildSummary({ mode: 'marburg', answers: { ageSex: true, exertional: true, notPalpable: true } });
  assert.match(m, /ca\. 17 %/);
  assert.match(m, /Marburger Herz-Score 3\/5 Punkte/);
  const low = buildSummary({ mode: 'marburg', answers: { ageSex: true } });
  assert.match(low, /< 2,5 %/);
  assert.match(low, /keine GKV-Indikation/);
});
