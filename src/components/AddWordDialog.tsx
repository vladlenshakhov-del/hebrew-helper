import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { vocabulary, type Binyan, type Category, type Word } from '@/data/vocabulary';

interface WordDraft {
  hebrew: string;
  transcription: string;
  russian: string;
  root: string;
  binyan: string;
  example: { hebrew: string; transcription: string; russian: string };
}

const EMPTY: WordDraft = {
  hebrew: '', transcription: '', russian: '', root: '', binyan: '',
  example: { hebrew: '', transcription: '', russian: '' },
};

interface AddWordDialogProps {
  onWordAdded?: () => void;
}

const BINYANIM: Binyan[] = ['Пааль', 'Пиэль', 'Хифиль', 'Нифаль', 'Пуаль', 'Хуфаль', 'Хитпаэль'];
const emptyDraft = (): WordDraft => ({ ...EMPTY, example: { ...EMPTY.example } });

const AddWordDialog = ({ onWordAdded }: AddWordDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<WordDraft>(emptyDraft);
  const requestIdRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);


  const resetForm = () => {
    requestIdRef.current += 1;
    setDraft(emptyDraft());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setLoading(false);
      resetForm();
    }
  };

  const fillWithGemini = async () => {
    if (!draft.hebrew.trim()) {
      toast({ title: 'Введите слово на иврите', variant: 'destructive' });
      return;
    }
    let key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) {
      key = window.prompt('Введите ваш Gemini API ключ (сохранится локально):') || '';
      if (!key) return;
      localStorage.setItem('GEMINI_API_KEY', key);
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    try {
      const prompt = `Проанализируй ивритское слово "${draft.hebrew}". Верни СТРОГО JSON без markdown:
{
  "hebrew": "слово с огласовками (никудот)",
  "transcription": "русская транскрипция с ударениями",
  "russian": "перевод на русский",
  "root": "корень через точку, например פ.ת.ח",
  "binyan": "биньян если глагол, иначе пустая строка",
  "example": {
    "hebrew": "пример предложения на иврите",
    "transcription": "русская транскрипция примера",
    "russian": "перевод примера"
  }
}`;
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
      const parsed = JSON.parse(text);
      if (requestId !== requestIdRef.current) return;
      setDraft({ ...EMPTY, ...parsed, example: { ...EMPTY.example, ...(parsed.example || {}) } });
      toast({ title: 'Готово', description: 'Поля заполнены через Gemini' });
    } catch (e: any) {
      if (requestId !== requestIdRef.current) return;
      toast({ title: 'Ошибка Gemini', description: e.message?.slice(0, 200), variant: 'destructive' });
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const save = () => {
    if (!draft.hebrew || !draft.russian) {
      toast({ title: 'Заполните иврит и перевод', variant: 'destructive' });
      return;
    }
    const normalizedBinyan = BINYANIM.includes(draft.binyan as Binyan) ? draft.binyan as Binyan : undefined;
    const category: Category = normalizedBinyan ? 'verbs' : 'everyday';
    const example = draft.example.hebrew.trim() && draft.example.russian.trim()
      ? {
          hebrew: draft.example.hebrew.trim(),
          transcription: draft.example.transcription.trim() || undefined,
          russian: draft.example.russian.trim(),
        }
      : undefined;
    const word: Word = {
      id: `user-${Date.now()}`,
      hebrew: draft.hebrew.trim(),
      transcription: draft.transcription.trim(),
      russian: draft.russian.trim(),
      category,
      root: draft.root.trim() || undefined,
      binyan: normalizedBinyan,
      example,
    };

    vocabulary.unshift(word);
    onWordAdded?.();
    toast({ title: 'Сохранено', description: 'Слово добавлено в общий список' });
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-lg border border-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
          title="Добавить слово"
        >
          <Plus className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent ref={contentRef} className="max-w-md max-h-[90vh] overflow-y-auto touch-pan-y [overscroll-behavior-y:contain!important] [-webkit-overflow-scrolling:touch] [&_*]:touch-pan-y [&_*]:[overscroll-behavior-y:contain!important]">
        <DialogHeader>
          <DialogTitle>Добавить новое слово</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Иврит *</label>
            <div className="flex gap-2">
              <Input
                dir="rtl"
                className="font-hebrew text-xl text-right"
                value={draft.hebrew}
                onChange={(e) => setDraft({ ...draft, hebrew: e.target.value })}
                placeholder="לִכְתֹּב"
              />
            </div>
            <Button
              type="button"
              onClick={fillWithGemini}
              disabled={loading}
              className="mt-2 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Заполнить через Gemini
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Транскрипция</label>
            <Input value={draft.transcription} onChange={(e) => setDraft({ ...draft, transcription: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Перевод *</label>
            <Input value={draft.russian} onChange={(e) => setDraft({ ...draft, russian: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Корень</label>
              <Input value={draft.root} onChange={(e) => setDraft({ ...draft, root: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Биньян</label>
              <Input value={draft.binyan} onChange={(e) => setDraft({ ...draft, binyan: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-sm font-semibold">Пример</p>
            <Input
              dir="rtl"
              className="font-hebrew text-right"
              value={draft.example.hebrew}
              onChange={(e) => setDraft({ ...draft, example: { ...draft.example, hebrew: e.target.value } })}
              placeholder="Иврит"
            />
            <Input
              value={draft.example.transcription}
              onChange={(e) => setDraft({ ...draft, example: { ...draft.example, transcription: e.target.value } })}
              placeholder="Транскрипция"
            />
            <Input
              value={draft.example.russian}
              onChange={(e) => setDraft({ ...draft, example: { ...draft.example, russian: e.target.value } })}
              placeholder="Перевод"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={resetForm} className="bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              Очистить форму
            </Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWordDialog;
