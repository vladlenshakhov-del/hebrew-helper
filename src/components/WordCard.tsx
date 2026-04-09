import { memo, useState } from 'react';
import { Word } from '@/data/vocabulary';
import { ReviewData } from '@/hooks/useSpacedRepetition';
import { Clock, RotateCcw, Star } from 'lucide-react';

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
  const [flipped, setFlipped] = useState(false);

  const isDue = !review || Date.now() >= review.nextReview;
  const daysLeft = review ? Math.max(0, Math.ceil((review.nextReview - Date.now()) / 86400000)) : 0;

  return (
    <div className="content-visibility-auto flex flex-col gap-2">
      <div
        onClick={() => setFlipped(!flipped)}
        className="group cursor-pointer h-full"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            minHeight: word.category === 'sentences' ? '300px' : '240px',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 rounded-xl bg-card border ${isDue ? 'border-border' : 'border-primary/30'} p-3 pt-1 pb-14 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="font-hebrew text-2xl md:text-3xl leading-tight text-foreground text-center break-words w-full max-w-full flex-shrink-0" dir="rtl">
              {word.hebrew}
            </span>
            <span className="text-sm text-muted-foreground italic text-center break-words w-full max-w-full flex-shrink-0">{word.transcription}</span>
            <div className="flex flex-wrap gap-0.5 justify-center w-full text-[9px] flex-shrink-0">
              {word.gender && (
                <span className="px-1 py-0.5 rounded-full bg-accent text-accent-foreground whitespace-nowrap">
                  {word.gender === 'masculine' ? '♂' : '♀'}
                </span>
              )}
              {word.binyan && (
                <span className="px-1 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                  {word.binyan}
                </span>
              )}
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-2 h-10 bg-gradient-to-t from-card to-transparent">
              {!isDue && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-0.5 flex-shrink-0">
                  <Clock className="w-3 h-3" /> {daysLeft}д
                </span>
              )}
              <div className="flex-1" />
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(word.id); }}
                className="p-1 rounded-full hover:bg-accent transition-colors flex-shrink-0"
                title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              </button>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-xl bg-primary p-3 pt-2 pb-14 flex flex-col items-center justify-start gap-1 shadow-md overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-lg md:text-xl font-bold text-primary-foreground text-center break-words w-full max-w-full flex-shrink-0">{word.russian}</span>
            <span className="font-hebrew text-base font-semibold text-primary-foreground/80 text-center break-words w-full max-w-full flex-shrink-0" dir="rtl">{word.hebrew}</span>
            <div className="overflow-y-auto flex-1 w-full text-center">
              {word.forms && (
                <div className="text-xs font-medium text-primary-foreground/70 space-y-0.5 w-full mb-1">
                  {word.forms.feminine && <p className="break-words">♀ {word.forms.feminine}</p>}
                  {word.forms.plural && <p className="break-words">мн. {word.forms.plural}</p>}
                  {word.forms.femininePlural && <p className="break-words">♀мн. {word.forms.femininePlural}</p>}
                </div>
              )}
              {word.conjugation && (
                <div className="text-xs font-medium text-primary-foreground/70 space-y-0.5 border-t border-primary-foreground/20 pt-0.5 mb-1 w-full">
                  {word.conjugation.past && <p className="break-words">⏪ {word.conjugation.past}</p>}
                  {word.conjugation.present && <p className="break-words">▶️ {word.conjugation.present}</p>}
                  {word.conjugation.future && <p className="break-words">⏩ {word.conjugation.future}</p>}
                  {word.conjugation.imperative && <p className="break-words">❗ {word.conjugation.imperative}</p>}
                </div>
              )}
              {word.example && (
                <div className="text-center border-t border-primary-foreground/20 pt-0.5 w-full">
                  <p className="font-hebrew text-sm font-semibold text-primary-foreground/90 break-words w-full max-w-full" dir="rtl">{word.example.hebrew}</p>
                  <p className="text-xs font-medium text-primary-foreground/70 mt-0.5 break-words w-full max-w-full">{word.example.russian}</p>
                </div>
              )}
            </div>
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
