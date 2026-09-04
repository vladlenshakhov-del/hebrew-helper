/**
 * General AI assistant backed by a server-side Lovable Cloud function.
 */
import { vocabulary, type Word } from '@/data/vocabulary';
import { saveOverride } from '@/lib/wordOverrides';
import { supabase } from '@/integrations/supabase/client';

export interface GeminiResponse {
  replyText: string;
  actionPerformed?: string;
  /** Только изменённые/новые карточки (полный массив не нужен). */
  updatedVocabulary?: Word[];
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  history: AssistantHistoryMessage[],
  currentVocabulary: Word[] = vocabulary
): Promise<GeminiResponse> => {
  const { data, error } = await supabase.functions.invoke('general-assistant', {
    body: {
      command: userCommand,
      history,
      vocabulary: compact(currentVocabulary),
    },
  });
  if (error) {
    throw new Error(error.message || 'Сервер AI недоступен');
  }
  if (!data?.replyText) throw new Error(data?.error || 'AI вернул пустой ответ');
  return data as GeminiResponse;
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
