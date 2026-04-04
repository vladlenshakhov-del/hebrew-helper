import { memo } from 'react';
import { Word } from '@/data/vocabulary';
import { ReviewData } from '@/hooks/useSpacedRepetition';
import { Clock, RotateCcw } from 'lucide-react';

interface WordListItemProps {
  word: Word;
  review?: ReviewData;
  onSetInterval?: (wordId: string, days: number) => void;
  onClearInterval?: (wordId: string) => void;
}

const intervalOptions = [
  { days: 1, label: '1д' },
  { days: 3, label: '3д' },
  { days: 5, label: '5д' },
  { days: 10, label: '10д' },
];

const WordListItem = ({ word, review, onSetInterval, onClearInterval }: WordListItemProps) => {
  const isDue = !review || Date.now() >= review.nextReview;
  const daysLeft = review ? Math.max(0, Math.ceil((review.nextReview - Date.now()) / 86400000)) : 0;

  return (
    <div className={`content-visibility-auto rounded-xl bg-card border ${isDue ? 'border-border' : 'border-primary/30'} p-4 flex flex-col gap-2 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <span className="font-hebrew text-3xl md:text-4xl leading-relaxed text-foreground" dir="rtl">
          {word.hebrew}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
          {!isDue && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {daysLeft}д
            </span>
          )}
          {word.gender && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
              {word.gender === 'masculine' ? '♂' : '♀'}
            </span>
          )}
          {word.binyan && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {word.binyan}
            </span>
          )}
          {word.preposition && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/50 text-accent-foreground">
              + {word.preposition}
            </span>
          )}
          {word.subcategory && !word.binyan && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
              {word.subcategory}
            </span>
          )}
        </div>
      </div>
      <span className="text-base text-muted-foreground italic">{word.transcription}</span>
      <span className="text-xl font-medium text-primary">{word.russian}</span>
      
      {word.forms && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {word.forms.feminine && <span>♀ {word.forms.feminine}</span>}
          {word.forms.plural && <span>мн. {word.forms.plural}</span>}
          {word.forms.femininePlural && <span>♀мн. {word.forms.femininePlural}</span>}
        </div>
      )}

      {word.conjugation && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {word.conjugation.past && <span>⏪ {word.conjugation.past}</span>}
          {word.conjugation.present && <span>▶️ {word.conjugation.present}</span>}
          {word.conjugation.future && <span>⏩ {word.conjugation.future}</span>}
          {word.conjugation.imperative && <span>❗ {word.conjugation.imperative}</span>}
        </div>
      )}

      {word.example && (
        <div className="mt-1 border-t border-border pt-2">
          <p className="font-hebrew text-sm text-foreground/80" dir="rtl">{word.example.hebrew}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{word.example.russian}</p>
        </div>
      )}

      {/* Interval buttons */}
      <div className="flex items-center gap-1 mt-1">
        {intervalOptions.map(opt => (
          <button
            key={opt.days}
            onClick={() => onSetInterval?.(word.id, opt.days)}
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
            onClick={() => onClearInterval?.(word.id)}
            className="text-[10px] px-1.5 py-1 rounded-md border border-border bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Сбросить"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(WordListItem);
