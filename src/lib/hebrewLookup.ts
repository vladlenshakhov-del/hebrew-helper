import { vocabulary, Word } from '@/data/vocabulary';
import { HEBREW_DICT, DictEntry } from './hebrewDictionary';

const stripNiqqud = (s: string) => s.replace(/[\u0591-\u05C7]/g, '');
const stripPunct = (s: string) => s.replace(/[.,!?;:"'()\[\]…—–\-״׳]/g, '').trim();
const clean = (s: string) => stripPunct(stripNiqqud(s));

// Точечный индекс: только записи словаря, чьё hebrew — одно слово (без пробелов).
// Так клик по слову внутри фразы НЕ возвращает родительскую фразу.
let singleWordIndex: Map<string, Word[]> | null = null;

const addWord = (m: Map<string, Word[]>, key: string, w: Word) => {
  const k = clean(key);
  if (!k || k.includes(' ')) return;
  const arr = m.get(k);
  if (arr) {
    if (!arr.includes(w)) arr.push(w);
  } else {
    m.set(k, [w]);
  }
};

const build = () => {
  const m = new Map<string, Word[]>();
  for (const w of vocabulary) {
    const main = clean(w.hebrew);
    if (main && !main.includes(' ')) addWord(m, main, w);
    if (w.forms?.feminine) addWord(m, w.forms.feminine, w);
    if (w.forms?.plural) addWord(m, w.forms.plural, w);
    if (w.forms?.femininePlural) addWord(m, w.forms.femininePlural, w);
  }
  singleWordIndex = m;
};

// Префиксы, которые в иврите часто «приклеиваются» к слову.
const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'כ', 'ש', 'וה', 'וב', 'ול', 'ומ', 'וכ', 'וש', 'מה', 'שה', 'כש', 'לכש'];

export interface LookupResult {
  hebrew: string;
  ru: string;
  tr?: string;
  source: 'dict' | 'vocab';
}

const fromDict = (key: string): LookupResult | null => {
  const e: DictEntry | undefined = HEBREW_DICT[key];
  if (!e) return null;
  return { hebrew: key, ru: e.ru, tr: e.tr, source: 'dict' };
};

const fromVocab = (key: string): LookupResult | null => {
  if (!singleWordIndex) build();
  const arr = singleWordIndex!.get(key);
  if (!arr || arr.length === 0) return null;
  const w = arr[0];
  const ru = w.russian.split(/[;\n]|,\s/)[0].trim();
  return { hebrew: clean(w.hebrew), ru, tr: w.transcription?.split(/[;,]/)[0]?.trim(), source: 'vocab' };
};

const tryKey = (key: string): LookupResult | null => fromDict(key) || fromVocab(key);

export const lookupHebrewWord = (token: string): LookupResult[] => {
  const c = clean(token);
  if (!c) return [];

  // 1) Точное совпадение
  const exact = tryKey(c);
  if (exact) return [exact];

  // 2) Снятие одного из частых префиксов
  for (const p of PREFIXES) {
    if (c.length > p.length + 1 && c.startsWith(p)) {
      const stem = c.slice(p.length);
      const r = tryKey(stem);
      if (r) return [r];
    }
  }

  return [];
};
