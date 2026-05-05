import { vocabulary, Word } from '@/data/vocabulary';

const stripNiqqud = (s: string) => s.replace(/[\u0591-\u05C7]/g, '');
const stripPunct = (s: string) => s.replace(/[.,!?;:"'()\[\]…—–\-״׳]/g, '').trim();

// Build lookup once
let lookup: Map<string, Word[]> | null = null;

const addKey = (m: Map<string, Word[]>, key: string, w: Word) => {
  if (!key || key.includes(' ')) return;
  const arr = m.get(key);
  if (arr) arr.push(w); else m.set(key, [w]);
};

const getLookup = (): Map<string, Word[]> => {
  if (lookup) return lookup;
  const m = new Map<string, Word[]>();
  for (const w of vocabulary) {
    addKey(m, stripNiqqud(w.hebrew).trim(), w);
    if (w.forms?.feminine) addKey(m, stripNiqqud(w.forms.feminine).trim(), w);
    if (w.forms?.plural) addKey(m, stripNiqqud(w.forms.plural).trim(), w);
    if (w.forms?.femininePlural) addKey(m, stripNiqqud(w.forms.femininePlural).trim(), w);
  }
  lookup = m;
  return m;
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
