export const concerns = ['moisture', 'oiliness', 'texture', 'redness'];
export function normalizeResult(envelope) {
  if (!envelope || envelope.status !== 200 || envelope.data?.task_status !== 'success' || !Array.isArray(envelope.data?.results?.output)) {
    throw new Error('Unexpected analysis response. No scores were inferred.');
  }
  const known = new Map();
  for (const row of envelope.data.results.output) {
    if (!row || typeof row !== 'object' || typeof row.type !== 'string') throw new Error('Malformed result item.');
    if (!concerns.includes(row.type)) continue;
    if (known.has(row.type)) throw new Error('Duplicate concern in analysis response.');
    const raw = row.raw_score;
    const ui = row.ui_score;
    if (raw !== undefined && (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1 || raw > 100)) throw new Error('Invalid raw score.');
    if (ui !== undefined && (typeof ui !== 'number' || !Number.isInteger(ui) || ui < 1 || ui > 100)) throw new Error('Invalid adjusted score.');
    known.set(row.type, { type: row.type, raw: raw ?? null, ui: ui ?? null });
  }
  const scores = concerns.map(type => known.get(type) ?? { type, raw: null, ui: null });
  const complete = scores.every(s => s.raw !== null);
  return { scores, complete };
}
export function decide(catalog, { budget, fragranceFree = false, lightweight = false }) {
  if (!Number.isInteger(budget) || budget < 0 || budget > 10000 || typeof fragranceFree !== 'boolean' || typeof lightweight !== 'boolean') throw new Error('Choose a whole-rupee budget from 0 to 10,000 and valid preferences.');
  const trace = catalog.map(item => {
    const reasons = [];
    if (item.price > budget) reasons.push(`₹${item.price} exceeds your ₹${budget} budget`);
    if (fragranceFree && !item.fragranceFree) reasons.push('Does not match fragrance-free preference');
    if (lightweight && !item.lightweight) reasons.push('Does not match lightweight preference');
    return { ...item, eligible: reasons.length === 0, reasons: reasons.length ? reasons : ['Within budget', ...(fragranceFree ? ['Matches fragrance-free preference'] : []), ...(lightweight ? ['Matches lightweight preference'] : [])] };
  });
  const eligible = trace.filter(x => x.eligible).sort((a,b)=>a.price-b.price || a.id.localeCompare(b.id));
  return { trace, eligible, keep: { name: 'Keep your existing routine', price: 0 }, suggested: eligible[0]?.id ?? null };
}
