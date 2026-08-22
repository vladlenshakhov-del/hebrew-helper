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

// Транскрипция английского — ВСЕГДА русскими буквами (englishTranscription).
export const getEnglishPronunciation = (word: Word, override?: EnglishOverride) => {
  return (
    override?.englishPronunciation?.trim() ||
    word.englishTranscription?.trim() ||
    word.englishPronunciation?.trim() ||
    override?.example?.englishPronunciation?.trim() ||
    word.example?.englishPronunciation?.trim() ||
    ''
  );
};

// Русский перевод английской части (по умолчанию совпадает с переводом иврита).
export const getEnglishTranslation = (word: Word) =>
  word.englishTranslation?.trim() || word.hebrewTranslation?.trim() || word.russian;

export const getHebrewTranscription = (word: Word) =>
  word.hebrewTranscription?.trim() || word.transcription;

export const getHebrewTranslation = (word: Word) =>
  word.hebrewTranslation?.trim() || word.russian;

export const generateEnglishForWord = async (word: Word): Promise<EnglishOverride> => {
  const key = localStorage.getItem('GEMINI_API_KEY');
  if (!key) {
    throw new Error('Gemini API key is missing');
  }

  const prompt = `You are a professional Hebrew-Russian-English dictionary editor.
Every card has a STRICT 6-component structure:
  1. hebrew                — Hebrew text with nikkud
  2. hebrewTranscription   — Hebrew pronunciation in RUSSIAN (Cyrillic) letters
  3. hebrewTranslation     — Russian translation of the Hebrew
  4. english               — natural English sentence/word
  5. englishTranscription  — pronunciation of the ENGLISH text in RUSSIAN (Cyrillic) letters
  6. englishTranslation    — Russian translation of the English sentence

You must produce components 4, 5, 6 for the CARD below.
Do NOT copy or transliterate the Russian translation into "english".

CRITICAL RULE for "englishTranscription":
It MUST be how the ENGLISH text sounds, written with RUSSIAN (Cyrillic) letters, with stress marks (́).
NEVER put the Hebrew transcription there. NEVER use Latin letters. NEVER copy the English text itself.
Examples:
  english: "How is it going?"      -> englishTranscription: "хау из ит го́уинг?"
  english: "It's important"        -> englishTranscription: "итс импо́ртэнт"
  english: "I need to check it"    -> englishTranscription: "ай нид ту чек ит"
  english: "compressor"            -> englishTranscription: "кэмпрэ́сэр"

Return STRICT JSON only:
{
  "english": "real English translation",
  "englishTranscription": "транскрипция английского русскими буквами с ударением",
  "englishTranslation": "русский перевод английского предложения",
  "example": { "english": "English example translation if example exists", "englishTranscription": "транскрипция примера русскими буквами" }
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
