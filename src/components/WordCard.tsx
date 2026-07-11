import { memo, useEffect, useMemo, useState } from 'react';
import { Word } from '@/data/vocabulary';
import { ReviewData } from '@/hooks/useSpacedRepetition';
import { Clock, Languages, Loader2, RotateCcw, Star, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import OptimizeWordDialog from '@/components/OptimizeWordDialog';
import {
  CardLanguageMode,
  generateEnglishForWord,
  getEnglishPronunciation,
  getEnglishText,
  getStoredEnglishOverride,
} from '@/lib/languageDisplay';
import { toast } from '@/hooks/use-toast';

interface WordCardProps {
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

const WordCard = ({ word, review, onSetInterval, onClearInterval, isFavorite, onToggleFavorite }: WordCardProps) => {
  const [aiOpen, setAiOpen] = useState(false);
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
    if (mode === 'english') {
      setMode('hebrew');
      return;
    }

    setMode('english');
    if (englishText || loadingEnglish) return;

    setLoadingEnglish(true);
    try {
      const generated = await generateEnglishForWord(word);
      setEnglishOverride(generated);
    } catch (err) {
      toast({
        title: 'English не заполнен',
        description: 'Добавь Gemini API ключ через AI-форму или оптимизацию, чтобы сгенерировать перевод.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnglish(false);
    }
  };

  return (
    <div className="content-visibility-auto flex flex-col gap-2">
      <div
        className={`group relative w-full rounded-xl bg-card border ${isDue ? 'border-border' : 'border-primary/30'} p-3 pt-2 pb-12 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all overflow-hidden text-center`}
        style={{ minHeight: word.category === 'sentences' ? '220px' : '180px' }}
      >
        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Переключить Иврит / English"
          title="Переключить Иврит / English"
        >
          {loadingEnglish ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
          {mode === 'hebrew' ? 'HE → EN' : 'EN → HE'}
        </button>

        {mode === 'hebrew' ? (
          <>
            <span className="font-hebrew font-bold text-2xl md:text-3xl leading-tight text-foreground break-words w-full block pt-5" dir="rtl">
              {word.hebrew}
            </span>
            <span className="text-base text-muted-foreground italic break-words w-full">{word.transcription}</span>
          </>
        ) : (
          <>
            <span className="font-bold text-xl md:text-2xl leading-tight text-foreground break-words w-full block pt-5" dir="ltr">
              {loadingEnglish ? 'Generating English translation...' : englishText || 'English translation is missing'}
            </span>
            <span className="text-base text-muted-foreground italic break-words w-full" dir="ltr">
              {loadingEnglish ? 'Please wait' : englishPronunciation || 'No English pronunciation yet'}
            </span>
          </>
        )}

        <span className="text-sm md:text-base font-semibold text-primary break-words w-full px-1">
          {word.russian}
        </span>

        <div className="flex flex-wrap gap-1 justify-center w-full">

          {word.gender && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              {word.gender === 'masculine' ? '♂' : '♀'}
            </Badge>
          )}
          {word.binyan && (
            <Badge variant="default" className="text-[9px] px-1.5 py-0">{word.binyan}</Badge>
          )}
          {word.root && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-hebrew" dir="rtl">
              √ {word.root}
            </Badge>
          )}
          {word.preposition && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">+ {word.preposition}</Badge>
          )}
        </div>

        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-2 h-8">
          {!isDue ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {daysLeft}д
            </span>
          ) : <span />}
          <div className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setAiOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setAiOpen(true); } }}
              className="p-1 rounded-full hover:bg-accent transition-colors cursor-pointer text-primary"
              title="AI-Оптимизация 🪄"
              aria-label="AI-Оптимизация"
            >
              <Wand2 className="w-4 h-4" />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(word.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onToggleFavorite?.(word.id); } }}
              className="p-1 rounded-full hover:bg-accent transition-colors cursor-pointer"
              title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </span>
          </div>
        </div>
      </div>

      {/* Interval buttons */}
      <div className="flex items-center justify-center gap-1">
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
            title="Сбросить интервал"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      <OptimizeWordDialog word={word} open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
};

export default memo(WordCard);
