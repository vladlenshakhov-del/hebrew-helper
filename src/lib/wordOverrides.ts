import { vocabulary, type Word } from '@/data/vocabulary';

const KEY = 'word-overrides-v1';
const DELETED_KEY = 'word-deleted-v1';
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

const readDeleted = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeDeleted = (ids: string[]) => {
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
};

/** Merge stored overrides + apply tombstone deletions to the in-memory vocabulary. Call once on app boot. */
export const applyStoredOverrides = () => {
  const map = read();
  for (const w of vocabulary) {
    const patch = map[w.id];
    if (patch) Object.assign(w, patch);
  }
  const deleted = new Set(readDeleted());
  if (deleted.size) {
    for (let i = vocabulary.length - 1; i >= 0; i--) {
      if (deleted.has(vocabulary[i].id)) vocabulary.splice(i, 1);
    }
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

/** Permanently remove a word from the in-memory vocabulary and persist a tombstone. */
export const deleteWord = (id: string) => {
  const idx = vocabulary.findIndex((w) => w.id === id);
  if (idx !== -1) vocabulary.splice(idx, 1);
  const deleted = readDeleted();
  if (!deleted.includes(id)) {
    deleted.push(id);
    writeDeleted(deleted);
  }
  // Also drop any override for that id.
  const map = read();
  if (map[id]) {
    delete map[id];
    write(map);
  }
  window.dispatchEvent(new CustomEvent(VOCAB_UPDATED_EVENT, { detail: { id, deleted: true } }));
};
