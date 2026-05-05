import { vocabulary, Word } from '@/data/vocabulary';

const stripNiqqud = (s: string) => s.replace(/[\u0591-\u05C7]/g, '');
const stripPunct = (s: string) => s.replace(/[.,!?;:"'()\[\]…—–\-״׳]/g, '').trim();

// Build lookup once
let lookup: Map<string, Word[]> | null = null;

const getLookup = (): Map<string, Word[]> => {
  if (lookup) return lookup;
  lookup = new Map();
  for (const w of vocabulary) {
    const key = stripNiqqud(w.hebrew).trim();
    if (!key || key.includes(' ')) continue; // skip phrases for word-token lookup
    const arr = lookup.get(key) || [];
    arr.push(w);
    lookup.set(key, arr);
    // Also index alternative forms
    if (w.forms?.feminine) {
      const k = stripNiqqud(w.forms.feminine).trim();
      if (k && !k.includes(' ')) (lookup.get(k) || lookup.set(k, []).get(k)!).push(w);
    }
    if (w.forms?.plural) {
      const k = stripNiqqud(w.forms.plural).trim();
      if (k && !k.includes(' ')) (lookup.get(k) || lookup.set(k, []).get(k)!).push(w);
    }
  }
  return lookup;
};

const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'כ', 'ש', 'וה', 'וב', 'ול', 'ומ', 'וכ', 'וש'];

export const lookupHebrewWord = (token: string): Word[] => {
  const map = getLookup();
  const clean = stripPunct(stripNiqqud(token));
  if (!clean) return [];
  if (map.has(clean)) return map.get(clean)!;
  // Try removing prefix letters
  for (const p of PREFIXES) {
    if (clean.startsWith(p) && clean.length > p.length + 1) {
      const stem = clean.slice(p.length);
      if (map.has(stem)) return map.get(stem)!;
    }
  }
  // Try removing trailing pronominal suffix ו/י/ך/ם/ן/נו/כם/הן/הם
  const suffixes = ['ים', 'ות', 'ה', 'ת', 'י', 'ך', 'ו', 'נו'];
  for (const s of suffixes) {
    if (clean.endsWith(s) && clean.length > s.length + 1) {
      const stem = clean.slice(0, -s.length);
      if (map.has(stem)) return map.get(stem)!;
    }
  }
  return [];
};
