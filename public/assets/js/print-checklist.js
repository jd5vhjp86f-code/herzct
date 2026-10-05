/** „Checkliste drucken“: druckt nur #checkliste (siehe @media print in hct.css). */
document.querySelectorAll('[data-action="print-checklist"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.body.classList.add('hct-print-checklist');
    const reset = () => { document.body.classList.remove('hct-print-checklist'); window.removeEventListener('afterprint', reset); };
    window.addEventListener('afterprint', reset);
    window.print();
  });
});
