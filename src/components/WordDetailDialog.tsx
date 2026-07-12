import { memo, ReactNode, useEffect, useMemo, useState } from 'react';
import { Word, vocabulary } from '@/data/vocabulary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ClickableHebrew from '@/components/ClickableHebrew';
import {
  CardLanguageMode,
  getEnglishPronunciation,
  getEnglishText,
  getStoredEnglishOverride,
} from '@/lib/languageDisplay';

interface WordDetailDialogProps {
  word: Word;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  initialMode?: CardLanguageMode;
  englishOverride?: ReturnType<typeof getStoredEnglishOverride>;
}

const tenseOrder: Array<{ key: 'past' | 'present' | 'future' | 'imperative'; label: string }> = [
  { key: 'past', label: 'Прошлое' },
  { key: 'present', label: 'Настоящее' },
  { key: 'future', label: 'Будущее' },
  { key: 'imperative', label: 'Повел.' },
];

const WordDetailDialog = ({ word, open, onOpenChange, initialMode = 'hebrew', englishOverride }: WordDetailDialogProps) => {
  const [mode, setMode] = useState<CardLanguageMode>(initialMode);
  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);
  const override = englishOverride ?? getStoredEnglishOverride(word.id);
  const englishText = useMemo(() => getEnglishText(word, override), [word, override]);
  const englishPron = useMemo(() => getEnglishPronunciation(word, override), [word, override]);
  const conj = word.conjugation;
  const tr = word.conjugationTranscription;


  const availableTenses = conj ? tenseOrder.filter(t => conj[t.key]) : [];
  const defaultTense = availableTenses[0]?.key;

  const relatedSentences = useMemo(() => {
    if (!open) return [];
    const strip = (s: string) => s.replace(/[\u0591-\u05C7]/g, '').replace(/[.,!?;:"'()\[\]…—–\-״׳]/g, '').trim();
    const needles = new Set<string>();
    const addNeedle = (s?: string) => {
      if (!s) return;
      const c = strip(s);
      if (c.length >= 2) needles.add(c);
    };
    addNeedle(word.hebrew);
    addNeedle(word.forms?.feminine);
    addNeedle(word.forms?.plural);
    addNeedle(word.forms?.femininePlural);
    if (conj) {
      addNeedle(conj.past);
      addNeedle(conj.present);
      addNeedle(conj.future);
      addNeedle(conj.imperative);
    }
    // Корневая последовательность (без точек) — fallback
    const rootLetters = word.root?.replace(/\./g, '');
    const out: Word[] = [];
    for (const w of vocabulary) {
      if (w.id === word.id) continue;
      if (w.category !== 'sentences' && w.category !== 'everyday') continue;
      const hay = strip(w.hebrew);
      let match = false;
      for (const n of needles) {
        if (hay.includes(n)) { match = true; break; }
      }
      if (!match && rootLetters && rootLetters.length >= 3) {
        // проверка корня: все буквы в порядке как подпоследовательность
        let idx = 0;
        for (const ch of hay) {
          if (ch === rootLetters[idx]) idx++;
          if (idx === rootLetters.length) break;
        }
        if (idx === rootLetters.length) match = true;
      }
      if (match) out.push(w);
      if (out.length >= 12) break;
    }
    return out;
  }, [open, word, conj]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-dialog-scroll-area="true"
        className="max-w-lg animate-scale-in"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Разбор: {word.russian}</DialogTitle>
        </DialogHeader>

        {/* Hero — top swaps between Hebrew and English based on mode */}
        <div className="flex flex-col items-center gap-2 text-center pb-4 border-b border-border">
          {mode === 'hebrew' ? (
            <>
              <ClickableHebrew
                text={word.hebrew}
                className="font-hebrew text-4xl md:text-5xl leading-tight text-foreground block"
              />
              <span className="text-base text-muted-foreground italic">{word.transcription}</span>
            </>
          ) : (
            <span className="text-4xl md:text-5xl font-bold leading-tight text-foreground break-words">
              {word.english || word.russian}
            </span>
          )}

          {/* Russian translation always visible */}
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
          <div className="mt-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
            <span className="text-xs uppercase tracking-wide text-primary font-bold">Пример</span>
            {mode === 'hebrew' ? (
              <>
                <ClickableHebrew
                  text={word.example.hebrew}
                  className="font-hebrew text-2xl leading-relaxed text-foreground block"
                />
                {word.example.transcription && (
                  <p className="text-base text-muted-foreground italic">{word.example.transcription}</p>
                )}
              </>
            ) : (
              <p className="text-2xl font-semibold text-foreground leading-relaxed">
                {word.example.english || word.example.russian}
              </p>
            )}
            {/* Russian example always visible */}
            <p className="text-base text-foreground/90">{word.example.russian}</p>
          </div>
        )}



        {/* Related sentences from vocabulary */}
        {relatedSentences.length > 0 && (
          <div className="py-2">
            <h4 className="text-sm uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              Встречается в твоих предложениях
            </h4>
            <div className="space-y-2">
              {relatedSentences.map(s => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 hover:bg-muted/50 transition-colors"
                >
                  <ClickableHebrew
                    text={s.hebrew}
                    className="font-hebrew text-2xl leading-relaxed text-foreground block"
                  />
                  {s.transcription && (
                    <p className="text-base text-muted-foreground italic">{s.transcription}</p>
                  )}
                  <p className="text-base text-foreground/90">{s.russian}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom controls: language mode toggle */}
        <div className="sticky bottom-0 mt-4 pt-3 pb-1 bg-background border-t border-border flex justify-center">
          <button
            type="button"
            onClick={() => setMode(m => (m === 'hebrew' ? 'english' : 'hebrew'))}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            aria-label="Переключить язык отображения"
          >
            {mode === 'hebrew' ? '🇮🇱 Иврит → 🇬🇧 English' : '🇬🇧 English → 🇮🇱 Иврит'}
          </button>
        </div>
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
