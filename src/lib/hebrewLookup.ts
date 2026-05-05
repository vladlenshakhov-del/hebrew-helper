import { vocabulary, Word } from '@/data/vocabulary';

const stripNiqqud = (s: string) => s.replace(/[\u0591-\u05C7]/g, '');
const stripPunct = (s: string) => s.replace(/[.,!?;:"'()\[\]…—–\-״׳]/g, '').trim();

let primary: Map<string, Word[]> | null = null;
let secondary: Map<string, Word[]> | null = null;

const add = (m: Map<string, Word[]>, key: string, w: Word) => {
  const k = stripPunct(stripNiqqud(key));
  if (!k) return;
  const arr = m.get(k);
  if (arr) {
    if (!arr.includes(w)) arr.push(w);
  } else {
    m.set(k, [w]);
  }
};

const tokenize = (s: string) => stripNiqqud(s).split(/\s+/).map(stripPunct).filter(Boolean);

const build = () => {
  const p = new Map<string, Word[]>();
  const s = new Map<string, Word[]>();
  for (const w of vocabulary) {
    // Primary: full entry hebrew (single word) + form variants
    const main = stripNiqqud(w.hebrew).trim();
    if (main && !main.includes(' ')) add(p, main, w);
    if (w.forms?.feminine) add(p, w.forms.feminine, w);
    if (w.forms?.plural) add(p, w.forms.plural, w);
    if (w.forms?.femininePlural) add(p, w.forms.femininePlural, w);

    // Secondary: every token from phrase entries, examples, conjugations
    const sources: string[] = [w.hebrew];
    if (w.example?.hebrew) sources.push(w.example.hebrew);
    if (w.conjugation?.past) sources.push(w.conjugation.past);
    if (w.conjugation?.present) sources.push(w.conjugation.present);
    if (w.conjugation?.future) sources.push(w.conjugation.future);
    if (w.conjugation?.imperative) sources.push(w.conjugation.imperative);
    for (const src of sources) {
      for (const tok of tokenize(src)) add(s, tok, w);
    }
  }
  primary = p;
  secondary = s;
};

const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'כ', 'ש', 'וה', 'וב', 'ול', 'ומ', 'וכ', 'וש', 'מה', 'שה', 'שב', 'של', 'מל'];
const SUFFIXES = ['ים', 'ות', 'יים', 'ייה', 'נו', 'כם', 'כן', 'הם', 'הן', 'תי', 'תם', 'תן', 'ני', 'נו', 'ך', 'ם', 'ן', 'ה', 'ת', 'י', 'ו'];

const tryMap = (m: Map<string, Word[]>, clean: string): Word[] | null => {
  if (m.has(clean)) return m.get(clean)!;
  for (const p of PREFIXES) {
    if (clean.startsWith(p) && clean.length > p.length + 1) {
      const stem = clean.slice(p.length);
      if (m.has(stem)) return m.get(stem)!;
      for (const sf of SUFFIXES) {
        if (stem.endsWith(sf) && stem.length > sf.length + 1) {
          const s2 = stem.slice(0, -sf.length);
          if (m.has(s2)) return m.get(s2)!;
        }
      }
    }
  }
  for (const sf of SUFFIXES) {
    if (clean.endsWith(sf) && clean.length > sf.length + 1) {
      const stem = clean.slice(0, -sf.length);
      if (m.has(stem)) return m.get(stem)!;
    }
  }
  return null;
};

export const lookupHebrewWord = (token: string): Word[] => {
  if (!primary || !secondary) build();
  const clean = stripPunct(stripNiqqud(token));
  if (!clean) return [];
  return tryMap(primary!, clean) || tryMap(secondary!, clean) || [];
};
