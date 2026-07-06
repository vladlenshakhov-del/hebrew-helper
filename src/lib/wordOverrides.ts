import { vocabulary, type Word } from '@/data/vocabulary';

const KEY = 'word-overrides-v1';
export const VOCAB_UPDATED_EVENT = 'vocab-updated';

type OverrideMap = Record<string, Partial<Word>>;

const read = (): OverrideMap => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const write = (map: OverrideMap) => {
  localStorage.setItem(KEY, JSON.stringify(map));
};

/** Merge stored overrides into the in-memory vocabulary. Call once on app boot. */
export const applyStoredOverrides = () => {
  const map = read();
  const ids = Object.keys(map);
  if (!ids.length) return;
  for (const w of vocabulary) {
    const patch = map[w.id];
    if (patch) Object.assign(w, patch);
  }
};

/** Persist + apply an override to the given word id, then notify listeners. */
export const saveOverride = (id: string, patch: Partial<Word>) => {
  const map = read();
  map[id] = { ...(map[id] || {}), ...patch };
  write(map);
  const target = vocabulary.find((w) => w.id === id);
  if (target) Object.assign(target, patch);
  window.dispatchEvent(new CustomEvent(VOCAB_UPDATED_EVENT, { detail: { id } }));
};
