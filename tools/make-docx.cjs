/**
 * Bearbeitbare Word-Fassungen der Druckvorlagen (gleiche Inhalte wie src/docs/*.html).
 *   node tools/make-docx.cjs   → docs/vorlagen/*.docx
 * Schrift: Arial (auf Praxis-PCs vorhanden). Die PDFs (tools/make-docs.mjs) sind die gestaltete Referenz.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak, Footer, VerticalAlign, TableLayoutType,
} = require('docx');

const root = path.join(__dirname, '..');
const C = { blue: '007AA8', blueText: '08658E', petrol: '008B92', petrolText: '007478', red: 'E2574C', redText: 'B3362C', taupe: '5D534C', taupeLight: '7C6E65', sand: 'ECEAE5', line: 'D4D0C5', white: 'FFFFFF' };
const FONT = 'Arial';
const BOX = 'Segoe UI Symbol';
const W = 11906 - 2 * 851; // A4-Breite minus 15 mm Rand je Seite (DXA)

const logo = fs.readFileSync(path.join(root, 'tools', 'logo-radiologie-dammtor.png'));
const heart = fs.readFileSync(path.join(root, 'assets', 'img', 'herz-symbol-freigestellt.png'));

const t = (text, o = {}) => new TextRun({ text, font: FONT, color: o.color || C.taupe, size: o.size || 18, bold: o.bold, allCaps: o.caps, characterSpacing: o.spacing });
const box = () => new TextRun({ text: '☐ ', font: BOX, size: 20, color: C.taupe });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { before: o.before ?? 0, after: o.after ?? 60, line: o.line }, alignment: o.align, shading: o.shade ? { type: ShadingType.CLEAR, color: 'auto', fill: o.shade } : undefined, border: o.border, indent: o.indent, keepNext: o.keepNext });
const label = (text) => p(t(text, { size: 14, bold: true, caps: true, color: C.taupeLight, spacing: 10 }), { after: 20 });
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
const under = { top: none, left: none, right: none, bottom: { style: BorderStyle.SINGLE, size: 6, color: C.taupeLight } };

function cell(children, o = {}) {
  return new TableCell({
    children, width: { size: o.w, type: WidthType.DXA }, columnSpan: o.span,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    borders: o.borders || { top: none, bottom: none, left: none, right: none },
    margins: { top: o.mt ?? 60, bottom: o.mb ?? 60, left: o.ml ?? 100, right: o.mr ?? 100 },
    verticalAlign: o.va,
  });
}
function table(widths, rows, o = {}) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: o.borders || noBorders, rows });
}
/** Formularfeld: Label und Schreiblinie (optional mit Einheit). */
function field(lbl, w, unit = '', height = 340) {
  return cell([label(lbl), new Paragraph({ children: [t(unit ? `\t${unit}` : '', { color: C.taupeLight, size: 16 })], tabStops: [{ type: 'right', position: w - 220 }], spacing: { before: height, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.taupeLight, space: 1 } } })], { w, mt: 80, mb: 80 });
}
function header(kicker, title1, title2) {
  return table([3000, W - 3000 - 1000, 1000], [new TableRow({ children: [
    cell([p(new ImageRun({ type: 'png', data: logo, transformation: { width: 150, height: 49 } }))], { w: 3000, va: VerticalAlign.CENTER, ml: 0 }),
    cell([p(t(kicker, { size: 15, bold: true, caps: true, color: C.petrolText, spacing: 14 }), { align: AlignmentType.RIGHT, after: 0 }),
      p([t(title1, { size: 34, caps: true }), t(title2, { size: 34, caps: true, bold: true, color: C.blueText })], { align: AlignmentType.RIGHT, after: 0 })], { w: W - 4000, va: VerticalAlign.CENTER }),
    cell([p(new ImageRun({ type: 'png', data: heart, transformation: { width: 46, height: 54 } }), { align: AlignmentType.RIGHT })], { w: 1000, va: VerticalAlign.CENTER, mr: 0 }),
  ] })]);
}
const rule = () => p(t(''), { after: 60, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.blue, space: 1 } } });
const contact = () => p(t('Radiologie Dammtor · Dammtorwall 7a · 20354 Hamburg   ·   Telefon 040 3500484-0   ·   info@radiologie-dammtor.de', { size: 15, color: C.taupeLight }), { align: AlignmentType.RIGHT, after: 120 });
const section = (n, text, right) => new Paragraph({
  children: [
    new TextRun({ text: ` ${n} `, font: FONT, bold: true, color: C.white, size: 18, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.blue } }),
    t('  '), t(text, { bold: true, caps: true, size: 20, spacing: 10 }),
    ...(right ? [t(`\t${right}`, { size: 16, color: C.taupeLight })] : []),
  ],
  tabStops: [{ type: 'right', position: W }], spacing: { before: 200, after: 100 }, keepNext: true,
});
const footer = (right) => new Footer({ children: [new Paragraph({ children: [t('Radiologie Dammtor · CT-Diagnostik · Dammtorwall 7a · 20354 Hamburg · www.radiologie-dammtor.de', { size: 14, color: C.taupeLight }), t(`\t${right}`, { size: 14, color: C.taupeLight })], tabStops: [{ type: 'right', position: W }], border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 4 } } })] });
const important = (lines) => lines.map((runs, i) => p(runs, { shade: C.sand, after: i === lines.length - 1 ? 120 : 0, before: i === 0 ? 120 : 0, indent: { left: 120, right: 120 }, border: { left: { style: BorderStyle.SINGLE, size: 24, color: C.red, space: 6 } } }));
const page = { size: { width: 11906, height: 16838 }, margin: { top: 680, bottom: 680, left: 851, right: 851, footer: 340 } };

// ------------------------------------------------------------------ Laufzettel
function laufzettel() {
  const w3 = [Math.round(W * 0.48), Math.round(W * 0.22), W - Math.round(W * 0.48) - Math.round(W * 0.22)];
  const q = Math.floor(W / 4);
  const w4 = [q, q, q, W - 3 * q];
  const card = (title, text, color) => cell([
    p(t(title, { bold: true, size: 19, color: C.taupe }), { after: 40, border: { top: { style: BorderStyle.SINGLE, size: 18, color, space: 4 } } }),
    p(text, { after: 0 }),
  ], { w: Math.floor(W / 3), borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line }, left: { style: BorderStyle.SINGLE, size: 4, color: C.line }, right: { style: BorderStyle.SINGLE, size: 4, color: C.line } }, mt: 100, mb: 100, ml: 140, mr: 140 });
  const step = (n, title, text, color) => cell([
    p(t(`Schritt ${n}`, { size: 14, bold: true, caps: true, color: C.taupeLight, spacing: 10 }), { after: 20, border: { top: { style: BorderStyle.SINGLE, size: 18, color, space: 4 } } }),
    p(t(title, { bold: true, size: 19 }), { after: 30 }), p(t(text, { size: 16 }), { after: 0 }),
  ], { w: q, fill: C.sand, ml: 120, mr: 120 });
  const brings = [['Diesen ausgefüllten ', 'Laufzettel', ''], ['', 'Aktuelle Laborwerte', ' (Kreatinin/eGFR, TSH)'], ['Aktuellen ', 'Medikamentenplan', ''], ['', 'Vorbefunde', ' (EKG, Herzultraschall, Herzkatheter)'], ['', 'Überweisung', ' und Versichertenkarte'], ['Ausgefüllten ', 'Aufklärungsbogen', '']];
  const bring = ([a, b, c]) => p([box(), t(a), t(b, { bold: true }), t(c)], { after: 40 });
  const t3 = Math.floor(W / 3);
  return [
    header('CT-Diagnostik · Herz-CT (Kardio-CT)', 'Patienten-', 'Laufzettel'), rule(), contact(),
    table(w3, [new TableRow({ children: [field('Name, Vorname', w3[0]), field('Geburtsdatum', w3[1]), field('Termin (Datum, Uhrzeit)', w3[2])] })]),
    ...important([
      [t('Wichtiger Hinweis zur Vorbereitung', { size: 15, bold: true, caps: true, color: C.redText, spacing: 14 })],
      [t('Für ein scharfes und strahlungsarmes Herz-CT ist eine '), t('ruhige Herzfrequenz (unter 60–65 Schläge pro Minute)', { bold: true }), t(' entscheidend. Bitte befolgen Sie die Hinweise auf diesem Bogen.')],
      [t('Bitte unbedingt aktuelle Blutwerte (Kreatinin und TSH) zur Untersuchung mitbringen.', { bold: true })],
    ]),
    section(1, 'Von der überweisenden Praxis auszufüllen'),
    table([W], [new TableRow({ children: [cell([
      label('Indikation / klinische Fragestellung'), p(t(''), { before: 300, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.taupeLight, space: 1 } } }),
      label('Vortestwahrscheinlichkeit (Pflichtangabe GKV, EBM 34370)'),
      p([t('VTW: ________ %     ermittelt mit:  '), box(), t('Marburger Herz-Score   '), box(), t('NVL Tab. 6 (DISCHARGE)   '), box(), t('anderes: ______________')], { after: 80 }),
      table(w4.map((x) => x - 60), [new TableRow({ children: [field('eGFR (Niere)', w4[0] - 60, 'ml/min'), field('TSH (Schilddrüse)', w4[1] - 60, 'µIU/ml'), field('Labordatum (max. 12 Wo.)', w4[2] - 60), field('Ruhepuls in der Praxis', w4[3] - 60, '/min')] })]),
      label('Metoprolol 50 mg zur Vorbereitung'),
      p([box(), t('Ja, Betablocker rezeptiert / mitgegeben: ', { bold: true }), t('1 Tablette Metoprolol 50 mg ca. 2 Stunden vor dem Termin.')], { after: 40 }),
      p([box(), t('Nein, Kontraindikation vorhanden ', { bold: true }), t('(z. B. AV-Block II°/III°, schweres Asthma bronchiale, akute Herzinsuffizienz)', { color: C.taupeLight })], { after: 80 }),
      label('Praxisstempel, Datum, Unterschrift'), p(t(''), { before: 520, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.taupeLight, space: 1 } } }),
    ], { w: W, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line }, left: { style: BorderStyle.SINGLE, size: 4, color: C.line }, right: { style: BorderStyle.SINGLE, size: 4, color: C.line } }, mt: 100, mb: 120, ml: 160, mr: 160 })] })]),
    section(2, 'Vorbereitung am Untersuchungstag (zu Hause)'),
    table([t3, t3, W - 2 * t3], [new TableRow({ children: [
      card('Betablocker (Metoprolol 50 mg)', [t('Wenn von Ihrer Praxis verordnet: 1 Tablette ', { size: 16 }), t('ca. 2 Stunden vor Ihrem Termin', { size: 16, bold: true }), t(' mit etwas Wasser einnehmen. Nehmen Sie bereits regelmäßig einen Betablocker, halten Sie bitte Rücksprache mit Ihrer Ärztin oder Ihrem Arzt.', { size: 16 })], C.blue),
      card('Kein Koffein, kein Nikotin', [t('Am Tag der Untersuchung, mindestens 12 Stunden vorher: ', { size: 16 }), t('kein Kaffee, keine Cola, keine Energy-Drinks, kein schwarzer oder grüner Tee', { size: 16, bold: true }), t(', nicht rauchen. Koffein und Nikotin beschleunigen den Puls.', { size: 16 })], C.redText),
      card('Essen und Trinken', [t('Sie müssen nicht streng nüchtern sein. Vermeiden Sie schweres Essen unmittelbar vor dem Termin und trinken Sie ausreichend ', { size: 16 }), t('stilles Wasser', { size: 16, bold: true }), t('.', { size: 16 })], C.petrol),
    ] })]),
    section(3, 'Ablauf in der Radiologie Dammtor', 'Dauer insgesamt ca. 1,5–2 Stunden'),
    table(w4, [new TableRow({ children: [
      step(1, 'Ankunft', 'Anmeldung, Abgabe dieses Laufzettels, der Laborwerte und des Aufklärungsbogens', C.blue),
      step(2, 'Puls-Check', 'EKG und Blutdruckmessung, bei Bedarf weiterer Betablocker; kurz vor der Untersuchung Nitrospray', '68B1D4'),
      step(3, 'Herz-CT', 'Venenzugang; die Aufnahme selbst dauert nur wenige Sekunden', C.petrol),
      step(4, 'Abschluss', 'Kurze Nachbeobachtung, danach können Sie nach Hause gehen', C.red),
    ] })]),
    section(4, 'Bitte mitbringen'),
    table([t3, t3, W - 2 * t3], [new TableRow({ children: [0, 1, 2].map((i) => cell([bring(brings[i]), bring(brings[i + 3])], { w: t3, fill: C.sand })) })]),
  ];
}

// ------------------------------------------------------------------ Aufklärung
function aufklaerung() {
  const yn = 700;
  const qrow = (text, hint) => new TableRow({ children: [
    cell([p(t(text), { after: hint ? 20 : 0 }), ...(hint ? [p(t(hint, { size: 16, color: C.taupeLight }), { after: 0 }), p(t(''), { before: 260, after: 40, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.taupeLight, space: 1 } } })] : [])], { w: W - 2 * yn, ml: 0, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line }, bottom: none, left: none, right: none } }),
    cell([p(box(), { align: AlignmentType.CENTER, after: 0 })], { w: yn, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line }, bottom: none, left: none, right: none } }),
    cell([p(box(), { align: AlignmentType.CENTER, after: 0 })], { w: yn, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line }, bottom: none, left: none, right: none } }),
  ] });
  const lead = (s) => p(t(s), { after: 100, line: 290 });
  const q3 = Math.floor(W / 3);
  return [
    header('CT-Diagnostik · Patienteninformation', 'Aufklärung ', 'Herz-CT'), rule(), contact(),
    p(t('Aufklärung Computertomographie des Herzens', { bold: true, caps: true, size: 20, spacing: 10 }), { after: 100 }),
    p(t('Liebe Patientin, lieber Patient,', { bold: true }), { after: 80 }),
    lead('die Computertomografie ist ein Röntgenverfahren, mit dem Schnittbilder von bestimmten Körperteilen bzw. Organen angefertigt werden können. Gegenüber der normalen (konventionellen) Röntgendiagnostik ist die Bildinformation bei der CT-Untersuchung wesentlich höher und viele Organe und krankhafte Veränderungen können besser sichtbar gemacht werden.'),
    lead('Während der Untersuchung liegen Sie in Rückenlage auf dem Untersuchungstisch, der langsam in Längsrichtung durch einen beidseitig offenen Ring fährt. In dem Ring befindet sich eine Röntgenröhre, die bei der Untersuchung um den zu untersuchenden Körperteil kreist.'),
    lead('Die Untersuchung ist völlig schmerzfrei und dauert je nach Untersuchungsregion und -ablauf nur wenige Minuten. Häufig wird ein jodhaltiges Kontrastmittel (KM) mittels Druckspritze in eine Vene am Arm gespritzt, um die Organe besser zu beurteilen. Die verwendeten jodhaltigen Kontrastmittel werden in der Regel sehr gut vertragen. Bei Überempfindlichkeit kann es zu leichten Reaktionen kommen, die schnell wieder abklingen (z. B. Hautjucken, Niesen, Hautausschlag). Schwere Kontrastmittelnebenwirkungen sind sehr selten.'),
    section(1, 'Bitte beantworten Sie uns vor der Untersuchung folgende Fragen'),
    table([W - 2 * yn, yn, yn], [
      new TableRow({ children: [cell([p(t(''))], { w: W - 2 * yn }), cell([p(t('nein', { size: 14, bold: true, caps: true, color: C.taupeLight }), { align: AlignmentType.CENTER, after: 0 })], { w: yn }), cell([p(t('ja', { size: 14, bold: true, caps: true, color: C.taupeLight }), { align: AlignmentType.CENTER, after: 0 })], { w: yn })] }),
      qrow('Haben Sie eine Nierenerkrankung?'),
      qrow('Ist eine Überfunktion der Schilddrüse bekannt?'),
      qrow('Haben Sie eine Kontrastmittelallergie oder Medikamentenallergie?'),
      qrow('Sind Sie zuckerkrank, nehmen Sie dafür Medikamente ein?', 'Wenn ja, welche?'),
      qrow('Könnte bei Ihnen eine Schwangerschaft vorliegen?'),
      qrow('Besteht eine Herz-/Kreislauferkrankung (z. B. koronare Herzkrankheit, Bluthochdruck)?', 'Wenn ja, bitte angeben:'),
      qrow('Nehmen Sie Medikamente gegen eine bestehende Herz-/Kreislauferkrankung?', 'Wenn ja, welche?'),
      qrow('Besteht bei Ihnen eine Infektionskrankheit (HIV, Hepatitis o. ä.)?'),
      qrow('Haben Sie Asthma?'),
    ]),
    new Paragraph({ children: [new PageBreak()] }),
    header('CT-Diagnostik · Patienteninformation', 'Aufklärung ', 'Herz-CT'), rule(),
    section(2, 'Angaben zur Person'),
    table([W], [new TableRow({ children: [field('Name Patientin / Patient', W)] })]),
    table([q3, q3, W - 2 * q3], [new TableRow({ children: [field('Größe', q3, 'cm'), field('Gewicht', q3, 'kg'), field('Handynummer', W - 2 * q3)] })]),
    table([W], [new TableRow({ children: [field('E-Mail-Adresse', W)] })]),
    section(3, 'Einverständnis'),
    table([W], [new TableRow({ children: [cell([
      p([box(), t('Mit der unten gegebenen Unterschrift bestätige ich, dass ich die Informationen gelesen und verstanden habe. Ich bin mit einer Kontrastmittelinjektion einverstanden.')], { after: 100 }),
      p([box(), t('Duplikat der Aufklärung ausgehändigt        '), box(), t('Patientin / Patient verzichtet auf Duplikat der Aufklärung')], { after: 0 }),
    ], { w: W, fill: C.sand, mt: 120, mb: 120, ml: 160, mr: 160 })] })]),
    table([Math.floor(W * 0.38), W - Math.floor(W * 0.38)], [new TableRow({ children: [field('Ort, Datum', Math.floor(W * 0.38), '', 480), field('Unterschrift der Patientin / des Patienten', W - Math.floor(W * 0.38), '', 480)] })]),
    p(t(''), { after: 160 }),
    section('+', 'Untersuchungsvorbereitung – vom Personal auszufüllen'),
    table([Math.floor(W / 2), W - Math.floor(W / 2)], [new TableRow({ children: [field('TSH', Math.floor(W / 2)), field('Kreatinin', W - Math.floor(W / 2))] })]),
    p(t(''), { after: 80 }),
    (() => {
      const cw = [Math.floor(W * 0.26), Math.floor(W * 0.37), W - Math.floor(W * 0.26) - Math.floor(W * 0.37)];
      const b = { style: BorderStyle.SINGLE, size: 4, color: C.line };
      const all = { top: b, bottom: b, left: b, right: b };
      const head = new TableRow({ children: ['Uhrzeit', 'Blutdruck', 'Herzfrequenz'].map((h, i) => cell([p(t(h, { bold: true, size: 16 }), { after: 0 })], { w: cw[i], fill: C.sand, borders: all })) });
      const rows = [0, 1, 2, 3].map(() => new TableRow({ height: { value: 440, rule: 'atLeast' }, children: cw.map((w) => cell([p(t(''))], { w, borders: all })) }));
      return table(cw, [head, ...rows]);
    })(),
    p([t('Metohexal:   ', { bold: true }), box(), t('nein     '), box(), t('ja')], { before: 160 }),
  ];
}

const out = path.join(root, 'docs', 'vorlagen');
fs.mkdirSync(out, { recursive: true });
const docs = [
  ['laufzettel-herz-ct-radiologie-dammtor.docx', 'Patienten-Laufzettel Herz-CT', laufzettel(), 'Laufzettel Herz-CT · Stand 10/2026'],
  ['aufklaerung-herz-ct-radiologie-dammtor.docx', 'Aufklärung Computertomographie des Herzens', aufklaerung(), 'Aufklärung Herz-CT · Stand 10/2026'],
];
(async () => {
  for (const [file, title, children, foot] of docs) {
    const doc = new Document({
      creator: 'Radiologie Dammtor', title, language: 'de-DE',
      styles: { default: { document: { run: { font: FONT, size: 18, color: C.taupe } } } },
      sections: [{ properties: { page }, footers: { default: footer(foot) }, children }],
    });
    fs.writeFileSync(path.join(out, file), await Packer.toBuffer(doc));
    console.log('DOCX   ', path.join('docs', 'vorlagen', file));
  }
})();
