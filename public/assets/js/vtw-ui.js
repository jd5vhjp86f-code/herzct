/**
 * VTW-Rechner – Oberfläche.
 * Bindet sich an <div class="hct-calc" data-hct-vtw>. Keine Speicherung, kein Versand:
 * alle Eingaben bleiben im Browser (kein fetch, kein Storage).
 */
import {
  MHS_CRITERIA, marburgScore, marburgVtw, dischargeVtw, classifySymptoms, validateDischarge,
  categorize, CATEGORY_TEXT, buildSummary, SYMPTOM_LABEL,
} from './vtw.js';

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

class VtwCalculator {
  constructor(root) {
    this.root = root;
    this.form = root.querySelector('form');
    this.touched = new Set();
    this.submitted = false;
    this.symptomManual = false;
    const q = (s) => root.querySelector(s);
    this.out = {
      region: q('.hct-calc__result'),
      value: q('[data-out="vtw"]'),
      method: q('[data-out="method"]'),
      fill: q('.hct-bar__fill'),
      track: q('.hct-bar__track'),
      title: q('[data-out="title"]'),
      text: q('[data-out="text"]'),
      hint: q('[data-out="hint"]'),
      message: q('.hct-calc__message'),
      summary: q('[data-out="summary"]'),
      copy: q('[data-action="copy"]'),
      copyStatus: q('[data-out="copyStatus"]'),
      live: q('[data-out="live"]'),
      suggestion: q('[data-out="suggestion"]'),
    };
    this.announce = debounce((t) => { this.out.live.textContent = t; }, 700);

    this.form.addEventListener('input', (e) => this.onChange(e));
    this.form.addEventListener('change', (e) => this.onChange(e));
    this.form.addEventListener('focusout', (e) => { if (e.target.name) this.touched.add(e.target.name); this.update(); });
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitted = true;
      this.update();
      const bad = this.form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      else this.out.region.focus();
    });
    this.out.copy?.addEventListener('click', () => this.copy());
    this.update();
  }

  get mode() { return this.form.elements.mode.value || 'marburg'; }

  onChange(e) {
    const name = e.target.name;
    if (e.type === 'change' && name) this.touched.add(name);
    if (name === 'symptom' && e.isTrusted) this.symptomManual = true;
    if (['location', 'exertion', 'relief'].includes(name) && !this.symptomManual) this.applySuggestion();
    if (name === 'mode') { this.submitted = false; }
    this.update();
  }

  criteria() {
    const el = this.form.elements;
    return { location: el.location.checked, exertion: el.exertion.checked, relief: el.relief.checked };
  }

  applySuggestion() {
    const sym = classifySymptoms(this.criteria());
    const radio = this.form.querySelector(`input[name="symptom"][value="${sym}"]`);
    if (radio) radio.checked = true;
  }

  read() {
    const el = this.form.elements;
    if (this.mode === 'marburg') {
      const answers = Object.fromEntries(MHS_CRITERIA.map(([k]) => [k, el[k].checked]));
      return { mode: 'marburg', answers };
    }
    const raw = String(el.age.value).trim();
    return {
      mode: 'discharge',
      age: raw === '' ? NaN : Number(raw),
      sex: el.sex.value,
      symptom: el.symptom.value,
    };
  }

  showErrors(errors) {
    for (const name of ['age', 'sex', 'symptom']) {
      const show = (this.submitted || this.touched.has(name)) ? errors[name] : '';
      const err = this.form.querySelector(`[data-error="${name}"]`);
      if (err) err.textContent = show || '';
      const fields = this.form.querySelectorAll(`[name="${name}"]`);
      fields.forEach((f) => { if (show) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); });
    }
  }

  update() {
    for (const block of this.form.querySelectorAll('[data-mode]')) block.hidden = block.dataset.mode !== this.mode;
    const input = this.read();
    let vtw = null; let display = ''; let method = '';
    if (input.mode === 'marburg') {
      this.showErrors({});
      const score = marburgScore(input.answers);
      const res = marburgVtw(score);
      vtw = res.value; display = res.display;
      method = `Marburger Herz-Score: ${score} von 5 Punkten`;
      this.out.hint.textContent = score >= 4
        ? 'Der Marburger Herz-Score liefert nur grobe Kategorien. Ein Wert von ca. 50 % liegt an der Grenze zum oberen Bereich – bitte im klinischen Gesamtbild einordnen.'
        : 'Die NVL betont: Die Grenzwerte sind keine starren Cut-offs, maßgeblich ist das klinische Gesamtbild.';
      this.out.suggestion.textContent = '';
    } else {
      const errors = validateDischarge(input);
      this.showErrors(errors);
      const c = this.criteria();
      const n = Object.values(c).filter(Boolean).length;
      this.out.suggestion.textContent = `${n} von 3 Kriterien → ${SYMPTOM_LABEL[classifySymptoms(c)]}`;
      if (Object.keys(errors).length === 0) {
        vtw = dischargeVtw(input); display = `${vtw} %`;
        method = `DISCHARGE-Kalkulator (NVL Tabelle 6): ${input.sex === 'f' ? 'Frau' : 'Mann'}, ${input.age} Jahre, ${SYMPTOM_LABEL[input.symptom]}`;
      }
      this.out.hint.textContent = 'Die Werte der Tabelle gelten für Patientinnen und Patienten mit stabiler Brustschmerz-Symptomatik; sie stammen aus Universitätskliniken und sind nicht direkt auf die Hausarztpraxis übertragbar (NVL).';
    }

    if (vtw == null) {
      this.out.region.dataset.state = 'empty';
      this.out.value.textContent = '–';
      this.out.method.textContent = '';
      this.out.fill.style.width = '0';
      this.out.track.setAttribute('aria-valuenow', '0');
      this.out.track.setAttribute('aria-valuetext', 'noch kein Ergebnis');
      this.out.message.textContent = 'Bitte Alter, Geschlecht und Art der Beschwerden angeben. Das Ergebnis erscheint dann hier.';
      this.out.summary.textContent = '';
      return;
    }
    const cat = categorize(vtw);
    this.out.region.dataset.state = 'result';
    this.out.region.dataset.category = cat;
    this.out.value.textContent = display;
    this.out.method.textContent = method;
    this.out.fill.style.width = `${Math.min(100, vtw)}%`;
    this.out.track.setAttribute('aria-valuenow', String(vtw));
    this.out.track.setAttribute('aria-valuetext', display);
    this.out.title.textContent = CATEGORY_TEXT[cat].title;
    this.out.text.textContent = CATEGORY_TEXT[cat].text;
    this.out.message.textContent = '';
    const summary = buildSummary(input);
    this.out.summary.textContent = summary;
    if (this.out.copyStatus) this.out.copyStatus.textContent = '';
    this.announce(`Vortestwahrscheinlichkeit ${display}. ${CATEGORY_TEXT[cat].title}.`);
  }

  async copy() {
    const text = this.out.summary.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.out.copyStatus.textContent = 'Kopiert.';
    } catch {
      const r = document.createRange();
      r.selectNodeContents(this.out.summary);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      this.out.copyStatus.textContent = 'Text markiert – bitte mit Strg+C bzw. ⌘+C kopieren.';
    }
  }
}

document.querySelectorAll('[data-hct-vtw]').forEach((el) => new VtwCalculator(el));
