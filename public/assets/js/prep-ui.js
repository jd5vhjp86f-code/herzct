/**
 * Vorbereitungs-Check für Patientinnen und Patienten.
 * Bindet sich an <div class="hct-calc" data-hct-prep>. Keine Speicherung, kein Versand.
 * Die Hinweise sind allgemein gehalten; die Einzelheiten klärt die Praxis bei der Anmeldung.
 */
export const PREP_ITEMS = {
  allergy: 'Sie haben schon einmal auf ein jodhaltiges Kontrastmittel (z. B. bei CT oder Herzkatheter) reagiert. Bitte sagen Sie uns das bei der Terminvereinbarung. Dann besprechen wir, ob eine Vorbehandlung nötig ist oder eine andere Untersuchung besser geeignet ist.',
  thyroid: 'Sie haben eine Schilddrüsenüberfunktion, Schilddrüsenknoten oder eine geplante Radiojodtherapie. Jodhaltiges Kontrastmittel kann die Schilddrüse beeinflussen. Bitte bringen Sie einen aktuellen TSH-Wert mit.',
  kidney: 'Ihre Nierenfunktion ist eingeschränkt. Bitte bringen Sie einen aktuellen Kreatinin-Wert (eGFR) mit. Wir prüfen damit, ob und wie das Kontrastmittel gegeben werden kann.',
  metformin: 'Sie nehmen Metformin. Setzen Sie es bitte nicht eigenmächtig ab. Ob eine Pause nötig ist, hängt von Ihrer Nierenfunktion ab. Wir besprechen das mit Ihnen.',
  lungs: 'Sie haben Asthma, eine COPD, einen sehr langsamen Puls oder eine schwere Herzschwäche. Das ist wichtig, weil vor der Untersuchung oft ein Medikament zur Senkung der Herzfrequenz (Betablocker) gegeben wird.',
  pde5: 'Sie haben in den letzten zwei Tagen vor der Untersuchung ein Potenzmittel (z. B. Sildenafil, Tadalafil) eingenommen oder haben es vor. Zusammen mit dem Nitrospray, das wir oft zur Erweiterung der Herzkranzgefäße geben, kann der Blutdruck stark abfallen. Bitte sagen Sie uns das unbedingt.',
  rhythm: 'Sie haben Herzrhythmusstörungen (z. B. Vorhofflimmern) oder einen Herzschrittmacher. Ein unregelmäßiger Herzschlag kann die Bildqualität beeinträchtigen. Bitte geben Sie das bei der Anmeldung an.',
  pregnancy: 'Sie sind schwanger oder könnten schwanger sein. Bitte teilen Sie uns das vor der Untersuchung mit.',
};

class PrepCheck {
  constructor(root) {
    this.root = root;
    this.form = root.querySelector('form');
    this.list = root.querySelector('[data-out="prep-list"]');
    this.message = root.querySelector('[data-out="prep-message"]');
    this.form.addEventListener('change', () => this.update());
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.update(); root.querySelector('.hct-calc__result').focus(); });
    this.update();
  }

  update() {
    const checked = [...this.form.querySelectorAll('input[type="checkbox"]:checked')].map((i) => i.name);
    this.list.replaceChildren(...checked.filter((k) => PREP_ITEMS[k]).map((k) => {
      const li = document.createElement('li');
      li.textContent = PREP_ITEMS[k];
      return li;
    }));
    this.message.textContent = checked.length
      ? `${checked.length === 1 ? 'Ein Punkt betrifft' : `${checked.length} Punkte betreffen`} Sie. Bitte sprechen Sie ${checked.length === 1 ? 'ihn' : 'sie'} bei der Terminvereinbarung an:`
      : 'Keiner der Punkte trifft zu? Dann gelten für Sie die allgemeinen Hinweise unten.';
  }
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-hct-prep]').forEach((el) => new PrepCheck(el));
}
