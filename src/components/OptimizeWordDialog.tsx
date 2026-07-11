import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Check, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Word } from '@/data/vocabulary';
import { saveOverride, deleteWord } from '@/lib/wordOverrides';

interface Props {
  word: Word;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

type AiResult = {
  id: string;
  hebrew?: string;
  transcription?: string;
  russian?: string;
  english?: string;
  englishPronunciation?: string;
  root?: string;
  binyan?: string;
  example?: { hebrew?: string; transcription?: string; russian?: string; english?: string; englishPronunciation?: string };
  changes_summary?: string;
};

const SYSTEM_PROMPT = `Ты — эксперт по ивриту и редактор словаря. Изучи присланную карточку (слово, перевод, примеры).
- Если в ивритском написании, корнях или огласовках есть ошибки (например, пропущена буква йуд), исправь их.
- Если ошибок нет, расширь карточку: добавь ещё один точный перевод на русский (если применимо) ИЛИ одно новое короткое предложение-пример на иврите с огласовками и переводом.
- Всегда добавь/исправь поля english и englishPronunciation настоящим английским переводом. Никогда не копируй русский перевод в english.
Верни результат СТРОГО в формате JSON, сохранив исходный ID карточки. Формат:
{
  "id": "исходный id",
  "hebrew": "иврит с никудот",
  "transcription": "русская транскрипция с ударениями",
  "russian": "перевод (при необходимости — расширенный: 'основной / доп. вариант')",
  "english": "real English translation",
  "englishPronunciation": "simple English reading/pronunciation line",
  "root": "корень через точку или пустая строка",
  "binyan": "биньян если глагол, иначе пустая строка",
  "example": { "hebrew": "...", "transcription": "...", "russian": "...", "english": "...", "englishPronunciation": "..." },
  "changes_summary": "коротко на русском: что именно исправлено или добавлено"
}`;

const OptimizeWordDialog = ({ word, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setResult(null);
      setLoading(false);
    }
  };

  const runOptimize = async () => {
    let key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) {
      key = window.prompt('Введите ваш Gemini API ключ (сохранится локально):') || '';
      if (!key) return;
      localStorage.setItem('GEMINI_API_KEY', key);
    }
    setLoading(true);
    setResult(null);
    try {
      const cardPayload = {
        id: word.id,
        hebrew: word.hebrew,
        transcription: word.transcription,
        russian: word.russian,
        english: word.english,
        englishPronunciation: word.englishPronunciation,
        category: word.category,
        root: word.root,
        binyan: word.binyan,
        example: word.example,
      };
      const prompt = `${SYSTEM_PROMPT}\n\nКарточка:\n${JSON.stringify(cardPayload, null, 2)}`;
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
      const parsed: AiResult = JSON.parse(text);
      setResult(parsed);
    } catch (e: any) {
      toast({ title: 'Ошибка Gemini', description: e?.message?.slice(0, 200), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const patch: Partial<Word> = {};
    if (result.hebrew) patch.hebrew = result.hebrew;
    if (result.transcription) patch.transcription = result.transcription;
    if (result.russian) patch.russian = result.russian;
    if (result.english) patch.english = result.english;
    if (result.englishPronunciation) patch.englishPronunciation = result.englishPronunciation;
    if (result.root) patch.root = result.root;
    if (result.example?.hebrew && result.example?.russian) {
      patch.example = {
        hebrew: result.example.hebrew,
        transcription: result.example.transcription,
        russian: result.example.russian,
        english: result.example.english,
        englishPronunciation: result.example.englishPronunciation,
      };
    }
    saveOverride(word.id, patch);
    toast({ title: 'Карточка обновлена', description: 'Изменения применены' });
    handleOpenChange(false);
  };

  const handleDelete = () => {
    deleteWord(word.id);
    toast({ title: 'Карточка удалена', description: 'Слово полностью удалено из словаря' });
    setConfirmDelete(false);
    handleOpenChange(false);
  };

  const DiffRow = ({ label, before, after }: { label: string; before?: string; after?: string }) => {
    const changed = (after ?? '') && after !== before;
    if (!after) return null;
    return (
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        {changed && before ? (
          <div className="text-sm line-through text-muted-foreground break-words">{before}</div>
        ) : null}
        <div className={`text-sm break-words ${changed ? 'text-primary font-medium' : 'text-foreground'}`}>
          {after}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI-Оптимизация
          </DialogTitle>
        </DialogHeader>

        {!result && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gemini проверит карточку на ошибки в написании/огласовках и, если ошибок нет, — расширит её (доп. перевод или новый пример).
            </p>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="font-hebrew text-2xl" dir="rtl">{word.hebrew}</div>
              <div className="text-sm text-muted-foreground italic">{word.transcription}</div>
              <div className="text-sm text-primary">{word.russian}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={runOptimize} className="flex-1">
                <Wand2 className="w-4 h-4" /> Запустить оптимизацию
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                title="Удалить карточку"
                aria-label="Удалить карточку"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Gemini анализирует карточку...</span>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {result.changes_summary && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="text-xs font-semibold text-primary mb-1">Что исправил / добавил ИИ</div>
                <div className="text-sm text-foreground">{result.changes_summary}</div>
              </div>
            )}
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              <DiffRow label="Иврит" before={word.hebrew} after={result.hebrew} />
              <DiffRow label="Транскрипция" before={word.transcription} after={result.transcription} />
              <DiffRow label="Перевод" before={word.russian} after={result.russian} />
              <DiffRow label="English" before={word.english} after={result.english} />
              <DiffRow label="English pronunciation" before={word.englishPronunciation} after={result.englishPronunciation} />
              <DiffRow label="Корень" before={word.root} after={result.root} />
              {result.example?.hebrew && (
                <div className="space-y-1 border-t border-border pt-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Пример</div>
                  <div className="font-hebrew text-right" dir="rtl">{result.example.hebrew}</div>
                  {result.example.transcription && (
                    <div className="text-xs italic text-muted-foreground">{result.example.transcription}</div>
                  )}
                  {result.example.russian && (
                    <div className="text-sm">{result.example.russian}</div>
                  )}
                  {result.example.english && (
                    <div className="text-sm text-primary">{result.example.english}</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={apply} className="flex-1">
                <Check className="w-4 h-4" /> Применить изменения
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                title="Удалить карточку"
                aria-label="Удалить карточку"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить карточку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите полностью удалить это слово/предложение из словаря? Действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default OptimizeWordDialog;
