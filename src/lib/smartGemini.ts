/**
 * Умный чат-ассистент Gemini: свободный диалог + правки словаря.
 * Адаптировано под Vite (без Next.js): ключ берётся из VITE_GEMINI_API_KEY
 * или из локально сохранённого ключа пользователя.
 */
import { vocabulary, type Word } from '@/data/vocabulary';
import { getGeminiKey } from '@/lib/geminiRephrase';
import { saveOverride } from '@/lib/wordOverrides';

export interface GeminiResponse {
  replyText: string;
  actionPerformed?: string;
  /** Только изменённые/новые карточки (полный массив не нужен). */
  updatedVocabulary?: Word[];
}

const MODEL = 'gemini-2.5-flash';

const resolveKey = (): string | null => {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey) return envKey;
  return getGeminiKey();
};

const compact = (words: Word[]) =>
  words.map((w) => ({
    id: w.id,
    he: w.hebrew,
    tr: w.transcription,
    ru: w.russian,
    cat: w.category,
    root: w.root || '',
    binyan: w.binyan || '',
  }));

export const askSmartGemini = async (
  userCommand: string,
  currentVocabulary: Word[] = vocabulary
): Promise<GeminiResponse> => {
  try {
    const key = resolveKey();
    if (!key) return { replyText: 'Нет Gemini API ключа — добавьте его, чтобы пользоваться помощником.' };

    const systemInstruction = `Ты — умный AI-ассистент приложения-словаря иврита.
Разговаривай с пользователем свободно, умно, как эксперт-лингвист и живой собеседник.

ВОТ БАЗА СЛОВАРЯ ПОЛЬЗОВАТЕЛЯ (сжатый вид):
${JSON.stringify(compact(currentVocabulary))}

ПРАВИЛА:
1. НИКОГДА не отвечай «карточка не найдена», «ничего не найдено» или «неизвестный термин».
2. Если пользователь просто общается, просит объяснить грамматику или перевести фразу — отвечай свободно и подробно на русском языке.
3. Если пользователь просит «проверь словарь», «найди ошибки», «добавь слово X» или «исправь транскрипцию»:
   - проанализируй базу, внеси изменения;
   - в updatedVocabulary верни ТОЛЬКО изменённые или новые карточки (полными объектами с полями id, hebrew, transcription, russian, category, при необходимости root, binyan, english, englishPronunciation, example);
   - в replyText подробно объясни на русском, что проверил, какие ошибки нашёл и что изменил.
4. Никогда не используй кириллические буквы вместо ивритских.
5. transcription — русская транскрипция иврита с ударением.

Формат ответа — СТРОГО JSON:
{
  "replyText": "подробный человеческий ответ на русском",
  "actionPerformed": "краткое описание действия или null",
  "updatedVocabulary": [изменённые карточки] или null
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userCommand }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Модель может вернуть JSON (в т.ч. в ```json ... ```) или просто текст.
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        replyText: parsed.replyText || responseText || 'Запрос обработан.',
        actionPerformed: parsed.actionPerformed || undefined,
        updatedVocabulary:
          Array.isArray(parsed.updatedVocabulary) && parsed.updatedVocabulary.length
            ? (parsed.updatedVocabulary as Word[])
            : undefined,
      };
    } catch {
      // Модель ответила обычным текстом — показываем его как есть.
      return { replyText: responseText || 'Запрос обработан.' };
    }

  } catch (error) {
    console.error('Gemini Error:', error);
    return { replyText: 'Произошла ошибка при обработке запроса. Попробуй переформулировать.' };
  }
};

/** Применить карточки из ответа: обновить существующие и добавить новые. */
export const applySmartUpdates = (updated: Word[]): number => {
  let count = 0;
  for (const w of updated) {
    if (!w?.id || !w.hebrew) continue;
    const existing = vocabulary.find((v) => v.id === w.id);
    if (existing) {
      const { id, ...patch } = w;
      saveOverride(id, patch as Partial<Word>);
    } else {
      vocabulary.push(w);
    }
    count++;
  }
  return count;
};
