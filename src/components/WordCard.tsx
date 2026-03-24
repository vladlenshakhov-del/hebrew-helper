import { useState } from 'react';
import { Word } from '@/data/vocabulary';

interface WordCardProps {
  word: Word;
}

const WordCard = ({ word }: WordCardProps) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="group cursor-pointer perspective-1000"
    >
      <div
        className={`relative w-full min-h-[180px] transition-transform duration-500 transform-style-preserve-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-xl bg-card border border-border p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-shadow">
          <span className="font-hebrew text-3xl md:text-4xl leading-relaxed text-foreground" dir="rtl">
            {word.hebrew}
          </span>
          <span className="text-sm text-muted-foreground italic">{word.transcription}</span>
          {word.subcategory && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {word.subcategory}
            </span>
          )}
          <span className="text-xs text-muted-foreground mt-1 opacity-60">нажмите для перевода</span>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-primary p-5 flex flex-col items-center justify-center gap-3 shadow-md">
          <span className="text-xl font-medium text-primary-foreground">{word.russian}</span>
          <span className="font-hebrew text-lg text-primary-foreground/70" dir="rtl">{word.hebrew}</span>
          {word.example && (
            <div className="mt-2 text-center border-t border-primary-foreground/20 pt-2">
              <p className="font-hebrew text-sm text-primary-foreground/80" dir="rtl">{word.example.hebrew}</p>
              <p className="text-xs text-primary-foreground/60 mt-1">{word.example.russian}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordCard;
