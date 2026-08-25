import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Check, X } from 'lucide-react';
import VoiceFeedbackInput from '@/components/VoiceFeedbackInput';
import { toast } from '@/hooks/use-toast';
import { applyPatches, runAssistantCommand, type AssistantPatch } from '@/lib/geminiAssistant';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApplied?: () => void;
}

const EXAMPLES = [
  'В карточке слова «мадад» измени перевод на «показатель»',
  'Проверь всю категорию Холодильники на огласовки',
  'Исправь двойной йод во всех глаголах Нифаля',
];

/** One global voice/text assistant that scans the local vocabulary and patches cards via Gemini. */
const GeminiAssistantDialog = ({ open, onOpenChange, onApplied }: Props) => {
  const [loading, setLoading] = useState(false);
  const [patches, setPatches] = useState<AssistantPatch[] | null>(null);
  const [summary, setSummary] = useState('');
  const [scanned, setScanned] = useState(0);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setPatches(null);
      setSummary('');
      setScanned(0);
      setLoading(false);
    }
  };

  const run = async (command: string) => {
    setLoading(true);
    setPatches(null);
    try {
      const res = await runAssistantCommand(command);
      setScanned(res.scanned);
      setSummary(res.summary || '');
      setPatches(res.patches);
      if (!res.patches.length) {
        toast({ title: 'Изменений нет', description: res.summary || 'Gemini не нашёл что править' });
      }
    } catch (e: any) {
      toast({ title: 'Ошибка Gemini', description: e?.message?.slice(0, 200), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    const count = applyPatches(patches || []);
    toast({ title: 'Применено', description: `Обновлено карточек: ${count}` });
    onApplied?.();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Голосовой помощник Gemini
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Скажите или напишите команду по всему словарю — помощник найдёт нужные карточки и предложит правки.
          </p>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            {EXAMPLES.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>

          <VoiceFeedbackInput
            loading={loading}
            onSubmit={run}
            submitLabel="Выполнить команду"
            placeholder="Например: в карточке «мадад» измени перевод на «показатель»"
          />

          {loading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Сканирую словарь…
            </p>
          )}

          {patches && patches.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-sm font-medium">
                Проверено карточек: {scanned} · правок: {patches.length}
              </p>
              {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
              <div className="space-y-2 max-h-64 overflow-y-auto overscroll-contain">
                {patches.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border bg-muted/40 p-2 text-xs space-y-1">
                    <div className="font-mono text-[10px] text-muted-foreground">{p.id}</div>
                    {p.hebrew && (
                      <div className="font-hebrew text-lg" dir="rtl">
                        {p.hebrew}
                      </div>
                    )}
                    {p.transcription && <div className="italic">{p.transcription}</div>}
                    {p.russian && <div className="text-primary font-medium">{p.russian}</div>}
                    {p.english && <div dir="ltr">{p.english}</div>}
                    {p.reason && <div className="text-muted-foreground">{p.reason}</div>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={apply}>
                  <Check className="w-4 h-4" /> Применить
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setPatches(null)}>
                  <X className="w-4 h-4" /> Отменить
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeminiAssistantDialog;
