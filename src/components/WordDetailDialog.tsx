import { memo, ReactNode, useMemo } from 'react';
import { Word, vocabulary } from '@/data/vocabulary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ClickableHebrew from '@/components/ClickableHebrew';

interface WordDetailDialogProps {
  word: Word;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
}

const tenseOrder: Array<{ key: 'past' | 'present' | 'future' | 'imperative'; label: string }> = [
  { key: 'past', label: 'Прошлое' },
  { key: 'present', label: 'Настоящее' },
  { key: 'future', label: 'Будущее' },
  { key: 'imperative', label: 'Повел.' },
];

const WordDetailDialog = ({ word, open, onOpenChange }: WordDetailDialogProps) => {
  const conj = word.conjugation;
  const tr = word.conjugationTranscription;
  const availableTenses = conj ? tenseOrder.filter(t => conj[t.key]) : [];
  const defaultTense = availableTenses[0]?.key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="sr-only">Разбор: {word.russian}</DialogTitle>
        </DialogHeader>

        {/* Hero */}
        <div className="flex flex-col items-center gap-2 text-center pb-4 border-b border-border">
          <ClickableHebrew
            text={word.hebrew}
            className="font-hebrew text-4xl md:text-5xl leading-tight text-foreground block"
          />
          <span className="text-base text-muted-foreground italic">{word.transcription}</span>
          <span className="text-xl font-semibold text-primary">{word.russian}</span>

          <div className="flex flex-wrap gap-1.5 justify-center mt-1">
            {word.gender && (
              <Badge variant="secondary">{word.gender === 'masculine' ? '♂ муж.' : '♀ жен.'}</Badge>
            )}
            {word.binyan && <Badge variant="default">{word.binyan}</Badge>}
            {word.preposition && <Badge variant="outline">+ {word.preposition}</Badge>}
            {word.root && (
              <Badge variant="outline" className="font-hebrew" dir="rtl">
                שורש: {word.root}
              </Badge>
            )}
            {word.subcategory && !word.binyan && (
              <Badge variant="secondary">{word.subcategory}</Badge>
            )}
          </div>
        </div>

        {/* Forms */}
        {word.forms && (
          <div className="space-y-1.5 py-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Формы</h4>
            <div className="grid grid-cols-1 gap-1.5">
              {word.forms.feminine && (
                <FormRow label="Женский род" hebrew={word.forms.feminine} />
              )}
              {word.forms.plural && (
                <FormRow label="Мн. число" hebrew={word.forms.plural} />
              )}
              {word.forms.femininePlural && (
                <FormRow label="Ж. мн. число" hebrew={word.forms.femininePlural} />
              )}
            </div>
          </div>
        )}

        {/* Conjugation tabs */}
        {conj && defaultTense && (
          <div className="py-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              Спряжение
            </h4>
            <Tabs defaultValue={defaultTense}>
              <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${availableTenses.length}, 1fr)` }}>
                {availableTenses.map(t => (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {availableTenses.map(t => (
                <TabsContent key={t.key} value={t.key} className="mt-3">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
                    <ClickableHebrew
                      text={conj[t.key]!}
                      className="font-hebrew text-2xl md:text-3xl text-foreground block"
                    />
                    {tr?.[t.key] && (
                      <p className="text-sm text-muted-foreground italic mt-1">{tr[t.key]}</p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Full analysis */}
        {word.fullAnalysis && word.fullAnalysis.length > 0 && (
          <div className="py-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              Пословный разбор
            </h4>
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {word.fullAnalysis.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2.5 bg-card hover:bg-accent/30 transition-colors">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground truncate">{a.translation}</span>
                    {a.details && (
                      <span className="text-[11px] text-muted-foreground truncate">{a.details}</span>
                    )}
                  </div>
                  <span className="font-hebrew text-xl font-bold text-primary text-right shrink-0" dir="rtl">
                    {a.word}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example */}
        {word.example && (
          <div className="mt-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-primary font-bold">Пример</span>
            <ClickableHebrew
              text={word.example.hebrew}
              className="font-hebrew text-xl leading-relaxed text-foreground block"
            />
            {word.example.transcription && (
              <p className="text-sm text-muted-foreground italic">{word.example.transcription}</p>
            )}
            <p className="text-sm text-foreground/80">{word.example.russian}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const FormRow = ({ label, hebrew }: { label: string; hebrew: string }) => (
  <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <ClickableHebrew text={hebrew} className="font-hebrew text-lg text-foreground" />
  </div>
);

export default memo(WordDetailDialog);
