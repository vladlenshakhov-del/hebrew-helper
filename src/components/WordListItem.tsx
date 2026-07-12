import { memo, useEffect, useMemo, useState } from 'react';
import { Word } from '@/data/vocabulary';
import { ReviewData } from '@/hooks/useSpacedRepetition';
import { Clock, Languages, Loader2, RotateCcw, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import WordDetailDialog from '@/components/WordDetailDialog';
import {
  CardLanguageMode,
  generateEnglishForWord,
  getEnglishPronunciation,
  getEnglishText,
  getStoredEnglishOverride,
} from '@/lib/languageDisplay';
import { toast } from '@/hooks/use-toast';

interface WordListItemProps {
  word: Word;
  review?: ReviewData;
  onSetInterval?: (wordId: string, days: number) => void;
  onClearInterval?: (wordId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (wordId: string) => void;
}

const intervalOptions = [
  { days: 1, label: '1д' },
  { days: 3, label: '3д' },
  { days: 5, label: '5д' },
  { days: 10, label: '10д' },
];

const WordListItem = ({ word, review, onSetInterval, onClearInterval, isFavorite, onToggleFavorite }: WordListItemProps) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [mode, setMode] = useState<CardLanguageMode>('hebrew');
  const [englishOverride, setEnglishOverride] = useState(() => getStoredEnglishOverride(word.id));
  const [loadingEnglish, setLoadingEnglish] = useState(false);
  const isDue = !review || Date.now() >= review.nextReview;
  const daysLeft = review ? Math.max(0, Math.ceil((review.nextReview - Date.now()) / 86400000)) : 0;
  const englishText = useMemo(() => getEnglishText(word, englishOverride), [word, englishOverride]);
  const englishPronunciation = useMemo(() => getEnglishPronunciation(word, englishOverride), [word, englishOverride]);

  useEffect(() => {
    setEnglishOverride(getStoredEnglishOverride(word.id));
    setMode('hebrew');
  }, [word.id]);

  const toggleLanguage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (mode === 'english') { setMode('hebrew'); return; }
    setMode('english');
    if (englishText || loadingEnglish) return;
    setLoadingEnglish(true);
    try {
      const generated = await generateEnglishForWord(word);
      setEnglishOverride(generated);
    } catch {
      toast({
        title: 'English не заполнен',
        description: 'Добавь Gemini API ключ через AI-форму или оптимизацию.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnglish(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={`content-visibility-auto rounded-xl bg-card border ${isDue ? 'border-border' : 'border-primary/30'} p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {mode === 'hebrew' ? (
              <>
                <span className="font-hebrew text-3xl md:text-4xl leading-relaxed text-foreground block" dir="rtl">
                  {word.hebrew}
                </span>
                <span className="text-base text-muted-foreground italic block">{word.transcription}</span>
              </>
            ) : (
              <>
                <span className="text-2xl md:text-3xl font-bold leading-snug text-foreground block" dir="ltr">
                  {loadingEnglish ? 'Generating…' : englishText || 'English translation is missing'}
                </span>
                <span className="text-base text-muted-foreground italic block">
                  {loadingEnglish ? 'Пожалуйста, подождите' : englishPronunciation || '[транскрипция ещё не сгенерирована]'}
                </span>
              </>
            )}
            <span className="text-base font-semibold text-primary block mt-1">{word.russian}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(word.id); }}
              className="p-1 rounded hover:bg-accent transition-colors"
              title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </button>
            {!isDue && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-0.5 flex-shrink-0">
                <Clock className="w-3 h-3" /> {daysLeft}д
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {word.gender && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {word.gender === 'masculine' ? '♂' : '♀'}
            </Badge>
          )}
          {word.binyan && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">{word.binyan}</Badge>
          )}
          {word.root && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-hebrew" dir="rtl">
              שורש: {word.root}
            </Badge>
          )}
          {word.preposition && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">+ {word.preposition}</Badge>
          )}
          {word.subcategory && !word.binyan && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{word.subcategory}</Badge>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={toggleLanguage}
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-colors ${
              mode === 'english'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            }`}
            title="Переключить Иврит / English"
          >
            {loadingEnglish ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {mode === 'hebrew' ? 'HE→EN' : 'EN→HE'}
          </button>
          {intervalOptions.map(opt => (
            <button
              key={opt.days}
              onClick={(e) => { e.stopPropagation(); onSetInterval?.(word.id, opt.days); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                review?.interval === opt.days
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {review && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearInterval?.(word.id); }}
              className="text-[10px] px-1.5 py-1 rounded-md border border-border bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Сбросить"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <WordDetailDialog
        word={word}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        initialMode={mode}
        englishOverride={englishOverride}
      />
    </>
  );
};

export default memo(WordListItem);
