// Invented engineering inputs in the documented JSON shape. Never real analyses.
export const fixtures = {
  moisture: { label: 'Scenario A · moisture context', data: { task_status: 'success', results: { output: [
    { type: 'moisture', raw_score: 42, ui_score: 68 },
    { type: 'oiliness', raw_score: 79, ui_score: 82 },
    { type: 'texture', raw_score: 73, ui_score: 78 },
    { type: 'redness', raw_score: 81, ui_score: 84 }
  ] } } },
  texture: { label: 'Scenario B · texture context', data: { task_status: 'success', results: { output: [
    { type: 'moisture', raw_score: 80, ui_score: 83 },
    { type: 'oiliness', raw_score: 76, ui_score: 80 },
    { type: 'texture', raw_score: 44, ui_score: 66 },
    { type: 'redness', raw_score: 82, ui_score: 84 }
  ] } } },
  partial: { label: 'Scenario C · incomplete response', data: { task_status: 'success', results: { output: [
    { type: 'moisture', raw_score: 65 }
  ] } } }
};
export const catalog = [
  { id: 'cloud', name: 'Cloud gel', price: 249, fragranceFree: false, lightweight: true, finish: 'Fresh gel', color: 'peach' },
  { id: 'quiet', name: 'Quiet lotion', price: 399, fragranceFree: true, lightweight: true, finish: 'Light lotion', color: 'sage' },
  { id: 'cushion', name: 'Cushion cream', price: 499, fragranceFree: true, lightweight: false, finish: 'Rich cream', color: 'lilac' }
];
