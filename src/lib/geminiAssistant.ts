/** Global Gemini assistant: interprets a free-form command and patches the local vocabulary. */
import { vocabulary, type Word } from '@/data/vocabulary';
import { callGeminiJson, getGeminiKey } from '@/lib/geminiRephrase';
import { saveOverride } from '@/lib/wordOverrides';

const stripNiqqud = (s: string) => s.replace(/[\u0591-\u05C7]/g, '');

export interface AssistantFilter {
  ids?: string[];
  hebrewQueries?: string[];
  textQueries?: string[];
  category?: string;
  binyan?: string;
  limit?: number;
}

export interface AssistantPatch {
  id: string;
  hebrew?: string;
  transcription?: string;
  russian?: string;
  english?: string;
  englishPronunciation?: string;
  root?: string;
  binyan?: string;
  example?: {
    hebrew?: string;
    transcription?: string;
    russian?: string;
    english?: string;
    englishPronunciation?: string;
  };
  reason?: string;
}

export interface AssistantRun {
  scanned: number;
  patches: AssistantPatch[];
  summary?: string;
}

const MAX_SCAN = 40;

/** Step 1 — ask Gemini to turn the spoken/typed command into a local search filter. */
const buildFilter = async (command: string, key: string): Promise<AssistantFilter> => {
  const prompt = `Ты — планировщик поиска по локальной базе карточек иврита.
Команда пользователя (возможно надиктована голосом, с опечатками): "${command}"

Категории: everyday, verbs, adjectives, nouns, sentences, technical.
Биньяны: Пааль, Пиэль, Хифиль, Нифаль, Пуаль, Хуфаль, Хитпаэль.

Верни СТРОГО JSON фильтра, чтобы найти нужные карточки:
{
  "ids": ["точные id, если пользователь их назвал"],
  "hebrewQueries": ["слова на иврите без огласовок, которые должны встречаться в карточке"],
  "textQueries": ["слова на русском или в транскрипции для поиска"],
  "category": "одна из категорий или пустая строка",
  "binyan": "биньян или пустая строка",
  "limit": 20
}
Не выдумывай лишнего: если пользователь назвал слово транскрипцией (например «мадад»), положи его в textQueries и по возможности вариант на иврите в hebrewQueries.`;
  return await callGeminiJson<AssistantFilter>(prompt, key);
};

/** Local selection of candidate cards based on the filter. */
export const selectWords = (filter: AssistantFilter): Word[] => {
  const limit = Math.min(filter.limit || MAX_SCAN, MAX_SCAN);
  const ids = new Set((filter.ids || []).filter(Boolean));
  const heQ = (filter.hebrewQueries || []).filter(Boolean).map(stripNiqqud);
  const txtQ = (filter.textQueries || []).filter(Boolean).map((s) => s.toLowerCase());

  const matches = vocabulary.filter((w) => {
    if (ids.size && ids.has(w.id)) return true;
    if (filter.category && w.category !== filter.category) return false;
    if (filter.binyan && w.binyan !== filter.binyan) return false;
    if (!heQ.length && !txtQ.length) return Boolean(filter.category || filter.binyan);
    const he = stripNiqqud(w.hebrew) + ' ' + stripNiqqud(w.example?.hebrew || '');
    const txt = `${w.russian} ${w.transcription} ${w.english || ''}`.toLowerCase();
    return heQ.some((q) => q && he.includes(q)) || txtQ.some((q) => q && txt.includes(q));
  });

  return matches.slice(0, limit);
};

/** Step 2 — ask Gemini to patch the selected cards according to the command. */
const buildPatches = async (command: string, words: Word[], key: string): Promise<AssistantRun> => {
  const compact = words.map((w) => ({
    id: w.id,
    hebrew: w.hebrew,
    transcription: w.transcription,
    russian: w.russian,
    english: w.english,
    englishPronunciation: w.englishPronunciation,
    root: w.root,
    binyan: w.binyan,
    category: w.category,
    example: w.example,
  }));

  const prompt = `Ты — эксперт по ивриту и редактор словаря для русскоязычных.

Команда пользователя (надиктована голосом, возможны опечатки — пойми смысл):
"${command}"

Карточки из базы (JSON):
${JSON.stringify(compact, null, 1)}

ПРАВИЛА:
1. Измени ТОЛЬКО те карточки и ТОЛЬКО те поля, которых реально касается команда.
2. Никогда не используй кириллические буквы вместо ивритских.
3. transcription — русская транскрипция иврита с ударением.
4. englishPronunciation — произношение АНГЛИЙСКОГО текста русскими буквами.
5. Учитывай контекст и часть речи (омографы).
6. Если менять нечего — верни пустой массив patches.

Верни СТРОГО JSON:
{
  "patches": [
    { "id": "id карточки", "hebrew": "...", "transcription": "...", "russian": "...", "english": "...", "englishPronunciation": "...", "root": "...", "binyan": "...", "example": { "hebrew": "...", "transcription": "...", "russian": "...", "english": "...", "englishPronunciation": "..." }, "reason": "что изменено" }
  ],
  "summary": "коротко на русском: что сделано"
}
В каждом patch указывай только изменённые поля (плюс id и reason).`;

  const raw = await callGeminiJson<{ patches?: AssistantPatch[]; summary?: string }>(prompt, key);
  return { scanned: words.length, patches: raw?.patches || [], summary: raw?.summary };
};

/** Full pipeline: command -> filter -> candidates -> proposed patches (not applied yet). */
export const runAssistantCommand = async (command: string): Promise<AssistantRun> => {
  const key = getGeminiKey();
  if (!key) throw new Error('Нет Gemini API ключа');
  const filter = await buildFilter(command, key);
  const words = selectWords(filter);
  if (!words.length) return { scanned: 0, patches: [], summary: 'Подходящие карточки не найдены' };
  return await buildPatches(command, words, key);
};

/** Apply the approved patches to the in-memory vocabulary + localStorage overrides. */
export const applyPatches = (patches: AssistantPatch[]): number => {
  let applied = 0;
  for (const p of patches) {
    if (!p?.id) continue;
    const target = vocabulary.find((w) => w.id === p.id);
    if (!target) continue;
    const { id, reason, example, ...rest } = p;
    const patch: Partial<Word> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === 'string' && v.trim()) (patch as any)[k] = v;
    }
    if (example && Object.values(example).some((v) => typeof v === 'string' && v.trim())) {
      patch.example = {
        hebrew: example.hebrew || target.example?.hebrew || '',
        transcription: example.transcription || target.example?.transcription,
        russian: example.russian || target.example?.russian || '',
        english: example.english || target.example?.english,
        englishPronunciation: example.englishPronunciation || target.example?.englishPronunciation,
      };
    }
    if (Object.keys(patch).length) {
      saveOverride(id, patch);
      applied++;
    }
  }
  return applied;
};
