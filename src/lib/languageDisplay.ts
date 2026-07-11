import type { Word } from '@/data/vocabulary';

export type CardLanguageMode = 'hebrew' | 'english';

const ENGLISH_OVERRIDE_KEY = 'word-english-overrides-v1';

type EnglishOverride = {
  english?: string;
  englishPronunciation?: string;
  example?: {
    english?: string;
    englishPronunciation?: string;
  };
};

type EnglishOverrideMap = Record<string, EnglishOverride>;

const readEnglishOverrides = (): EnglishOverrideMap => {
  try {
    const raw = localStorage.getItem(ENGLISH_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeEnglishOverrides = (map: EnglishOverrideMap) => {
  localStorage.setItem(ENGLISH_OVERRIDE_KEY, JSON.stringify(map));
};

export const getStoredEnglishOverride = (wordId: string): EnglishOverride | undefined => {
  return readEnglishOverrides()[wordId];
};

export const saveEnglishOverride = (wordId: string, patch: EnglishOverride) => {
  const map = readEnglishOverrides();
  map[wordId] = {
    ...(map[wordId] || {}),
    ...patch,
    example: {
      ...(map[wordId]?.example || {}),
      ...(patch.example || {}),
    },
  };
  writeEnglishOverrides(map);
};

export const getEnglishText = (word: Word, override?: EnglishOverride) => {
  return override?.english?.trim() || word.english?.trim() || word.example?.english?.trim() || '';
};

export const getEnglishPronunciation = (word: Word, override?: EnglishOverride) => {
  return (
    override?.englishPronunciation?.trim() ||
    word.englishPronunciation?.trim() ||
    override?.example?.englishPronunciation?.trim() ||
    word.example?.englishPronunciation?.trim() ||
    getEnglishText(word, override)
  );
};

export const generateEnglishForWord = async (word: Word): Promise<EnglishOverride> => {
  const key = localStorage.getItem('GEMINI_API_KEY');
  if (!key) {
    throw new Error('Gemini API key is missing');
  }

  const prompt = `You are a professional Hebrew-Russian-English dictionary editor.
Translate the CARD into natural English using the full context. Do NOT copy or transliterate the Russian translation into English fields.
For a sentence card, "english" must be the full English sentence. For a single word, "english" must be the English word/phrase.
"englishPronunciation" should be a simple readable English pronunciation/reading line. For normal English sentences, repeat the English sentence with clear punctuation.
Return STRICT JSON only:
{
  "english": "real English translation",
  "englishPronunciation": "English reading/pronunciation line",
  "example": { "english": "English example translation if example exists", "englishPronunciation": "English reading line for the example" }
}

CARD:
${JSON.stringify({
    hebrew: word.hebrew,
    transcription: word.transcription,
    russian: word.russian,
    category: word.category,
    subcategory: word.subcategory,
    example: word.example,
  }, null, 2)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(text) as EnglishOverride;
  if (!parsed.english?.trim()) throw new Error('Gemini returned empty English translation');
  saveEnglishOverride(word.id, parsed);
  return parsed;
};
