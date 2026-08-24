/** Shared Gemini helpers: API key handling + card correction by user feedback. */

export const getGeminiKey = (): string | null => {
  let key = localStorage.getItem('GEMINI_API_KEY');
  if (!key) {
    key = window.prompt('Введите ваш Gemini API ключ (сохранится локально):') || '';
    if (!key) return null;
    localStorage.setItem('GEMINI_API_KEY', key);
  }
  return key;
};

export const callGeminiJson = async <T = any>(prompt: string, key: string): Promise<T> => {
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
  return JSON.parse(text) as T;
};

export interface RephraseResult {
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
  changes_summary?: string;
}

const normalize = (raw: any): RephraseResult => ({
  ...raw,
  transcription: raw?.hebrewTranscription || raw?.transcription,
  russian: raw?.hebrewTranslation || raw?.russian,
  englishPronunciation: raw?.englishTranscription || raw?.englishPronunciation,
  example: raw?.example
    ? {
        ...raw.example,
        transcription: raw.example.hebrewTranscription || raw.example.transcription,
        russian: raw.example.hebrewTranslation || raw.example.russian,
        englishPronunciation: raw.example.englishTranscription || raw.example.englishPronunciation,
      }
    : undefined,
});

/**
 * Re-generate a card taking the user's (voice or typed) correction into account.
 * Returns the corrected card fields — the caller decides whether to apply/save them.
 */
export const rephraseWithGemini = async (
  currentCard: Record<string, unknown>,
  userVoiceFeedback: string
): Promise<RephraseResult> => {
  const key = getGeminiKey();
  if (!key) throw new Error('Нет Gemini API ключа');

  const prompt = `Ты — эксперт по ивриту и редактор словаря для русскоязычных.

У нас есть текущая карточка слова/фразы:
${JSON.stringify(currentCard, null, 2)}

Пользователь заметил ошибку и даёт следующее уточнение/замечание (надиктовано голосом, возможны опечатки — пойми смысл):
"${userVoiceFeedback}"

ПРАВИЛА:
1. Исправь карточку СТРОГО с учётом замечания пользователя. Замечание пользователя важнее твоего первоначального варианта.
2. Не меняй поля, которых замечание не касается (но исправь явные ошибки, если они связаны с замечанием).
3. Транскрипция иврита — русскими буквами с ударением.
4. englishPronunciation — произношение АНГЛИЙСКОГО текста РУССКИМИ буквами (например "How is it going?" -> "хау из ит го́уинг?"). Никогда не подставляй туда ивритскую транскрипцию или латиницу.
5. english — настоящий английский перевод, а не транслитерация русского.
6. Учитывай контекст всей фразы и часть речи (омографы: המדד — «показатель/индекс», а не «измерил»).

Верни СТРОГО JSON без markdown, сохранив структуру карточки:
{
  "hebrew": "иврит с огласовками",
  "transcription": "русская транскрипция иврита с ударениями",
  "russian": "перевод на русский",
  "english": "real English translation",
  "englishPronunciation": "произношение английского русскими буквами",
  "root": "корень через точку или пустая строка",
  "binyan": "биньян если глагол, иначе пустая строка",
  "example": {
    "hebrew": "пример на иврите",
    "transcription": "русская транскрипция примера",
    "russian": "перевод примера",
    "english": "natural English translation",
    "englishPronunciation": "произношение английского примера русскими буквами"
  },
  "changes_summary": "коротко на русском: что именно исправлено по замечанию пользователя"
}`;

  const raw = await callGeminiJson<any>(prompt, key);
  return normalize(raw);
};
