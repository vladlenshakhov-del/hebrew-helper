import { memo, useState } from 'react';
import { Word } from '@/data/vocabulary';
import { ReviewData } from '@/hooks/useSpacedRepetition';
import { Clock, RotateCcw } from 'lucide-react';

interface WordCardProps {
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

const WordCard = ({ word, review, onSetInterval, onClearInterval }: WordCardProps) => {
  const [flipped, setFlipped] = useState(false);

  const isDue = !review || Date.now() >= review.nextReview;
  const daysLeft = review ? Math.max(0, Math.ceil((review.nextReview - Date.now()) / 86400000)) : 0;

  return (
    <div className="content-visibility-auto flex flex-col gap-2">
      <div
        onClick={() => setFlipped(!flipped)}
        className="group cursor-pointer perspective-1000"
      >
        <div
          className={`relative w-full transition-transform duration-500 transform-style-preserve-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
          style={{ minHeight: word.category === 'sentences' ? '240px' : '180px' }}
        >
          {/* Front */}
          <div className={`absolute inset-0 backface-hidden rounded-xl bg-card border ${isDue ? 'border-border' : 'border-primary/30'} p-4 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
            {!isDue && (
              <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {daysLeft}д
              </span>
            )}
            <span className="font-hebrew text-3xl md:text-4xl leading-snug text-foreground text-center break-words w-full" dir="rtl">
              {word.hebrew}
            </span>
            <span className="text-base text-muted-foreground italic text-center break-words w-full">{word.transcription}</span>
            {word.gender && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                {word.gender === 'masculine' ? '♂ муж.' : '♀ жен.'}
              </span>
            )}
            {word.forms?.plural && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                мн. {word.forms.plural}
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {word.subcategory}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground mt-1 opacity-60">нажмите для перевода</span>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-primary p-4 flex flex-col items-center justify-center gap-1.5 shadow-md overflow-hidden">
            <span className="text-lg md:text-xl font-medium text-primary-foreground text-center break-words w-full">{word.russian}</span>
            <span className="font-hebrew text-lg text-primary-foreground/70 text-center break-words w-full" dir="rtl">{word.hebrew}</span>
            {word.forms && (
              <div className="text-xs text-primary-foreground/60 text-center space-y-0.5">
                {word.forms.feminine && <p>♀ {word.forms.feminine}</p>}
                {word.forms.plural && <p>мн. {word.forms.plural}</p>}
                {word.forms.femininePlural && <p>♀мн. {word.forms.femininePlural}</p>}
              </div>
            )}
            {word.conjugation && (
              <div className="text-xs text-primary-foreground/60 text-center space-y-0.5 border-t border-primary-foreground/20 pt-1 w-full">
                {word.conjugation.past && <p>⏪ {word.conjugation.past}</p>}
                {word.conjugation.present && <p>▶️ {word.conjugation.present}</p>}
                {word.conjugation.future && <p>⏩ {word.conjugation.future}</p>}
                {word.conjugation.imperative && <p>❗ {word.conjugation.imperative}</p>}
              </div>
            )}
            {word.example && (
              <div className="mt-1 text-center border-t border-primary-foreground/20 pt-1.5 w-full">
                <p className="font-hebrew text-sm text-primary-foreground/80 break-words" dir="rtl">{word.example.hebrew}</p>
                <p className="text-xs text-primary-foreground/60 mt-0.5 break-words">{word.example.russian}</p>
              </div>
            )}
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
    </div>
  );
};

export default memo(WordCard);
