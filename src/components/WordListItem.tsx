import { memo, useState } from 'react';
import { Word } from '@/data/vocabulary';
import { ReviewData } from '@/hooks/useSpacedRepetition';
import { Clock, RotateCcw, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import WordDetailDialog from '@/components/WordDetailDialog';

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
  const [open, setOpen] = useState(false);
  const isDue = !review || Date.now() >= review.nextReview;
  const daysLeft = review ? Math.max(0, Math.ceil((review.nextReview - Date.now()) / 86400000)) : 0;

  return (
    <div
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }}
      className={`content-visibility-auto cursor-pointer rounded-xl bg-card border ${isDue ? 'border-border' : 'border-primary/30'} p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-primary/40 transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="font-hebrew text-3xl md:text-4xl leading-relaxed text-foreground block" dir="rtl">
            {word.hebrew}
          </span>
          <span className="text-base text-muted-foreground italic block">{word.transcription}</span>
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

      <span className="text-xl font-medium text-primary">{word.russian}</span>

      {/* Interval buttons */}
      <div className="flex items-center gap-1 mt-1">
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

      <WordDetailDialog word={word} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default memo(WordListItem);
