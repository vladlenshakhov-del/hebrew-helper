import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Check } from 'lucide-react';
import VoiceFeedbackInput from '@/components/VoiceFeedbackInput';
import { toast } from '@/hooks/use-toast';
import { askSmartGemini, applySmartUpdates } from '@/lib/smartGemini';
import type { Word } from '@/data/vocabulary';
import ReactMarkdown from 'react-markdown';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApplied?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  action?: string;
  updates?: Word[];
  applied?: boolean;
}

const EXAMPLES = [
  'В карточке слова «мадад» измени перевод на «показатель»',
  'Проверь всю категорию Холодильники на огласовки',
  'Объясни разницу между биньянами Пиэль и Хифиль',
];

/** Единый голосовой/текстовый помощник Gemini: свободный чат + правки словаря. */
const GeminiAssistantDialog = ({ open, onOpenChange, onApplied }: Props) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setLoading(false);
  };

  const run = async (command: string) => {
    if (!command.trim()) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: command }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const history = nextMessages.map((message) => ({
        role: message.role,
        content: message.text,
      }));
      const res = await askSmartGemini(command, history);
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: res.replyText, action: res.actionPerformed, updates: res.updatedVocabulary },
      ]);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Неизвестная ошибка AI';
      toast({ title: 'Помощник недоступен', description, variant: 'destructive' });
      setMessages((current) => [...current, { role: 'assistant', text: `**Ошибка:** ${description}` }]);
    } finally {
      setLoading(false);
    }
  };

  const apply = (index: number) => {
    setMessages((m) => {
      const msg = m[index];
      if (!msg?.updates) return m;
      const count = applySmartUpdates(msg.updates);
      toast({ title: 'Применено', description: `Обновлено карточек: ${count}` });
      onApplied?.();
      const next = [...m];
      next[index] = { ...msg, applied: true };
      return next;
    });
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
          {messages.length === 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                Спрашивайте что угодно про иврит или командуйте словарём — помощник ответит и предложит правки.
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                {EXAMPLES.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            </>
          )}

          {messages.length > 0 && (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto overscroll-contain pr-1">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-primary/10 ml-6' : 'bg-muted/50 mr-6'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : m.text}
                  {m.action && <div className="text-[11px] text-muted-foreground mt-1">{m.action}</div>}
                  {m.updates && !m.applied && (
                    <Button size="sm" className="mt-2" onClick={() => apply(i)}>
                      <Check className="w-4 h-4" /> Применить правки ({m.updates.length})
                    </Button>
                  )}
                  {m.applied && <div className="text-[11px] text-primary mt-1">Правки применены</div>}
                </div>
              ))}
            </div>
          )}

          <VoiceFeedbackInput
            loading={loading}
            onSubmit={run}
            submitLabel="Отправить"
            placeholder="Спросите или дайте команду: «исправь транскрипцию у слова мадад»"
          />

          {loading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Думаю…
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeminiAssistantDialog;
