import { Word } from '@/data/vocabulary';

interface WordListItemProps {
  word: Word;
}

const WordListItem = ({ word }: WordListItemProps) => {
  return (
    <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="font-hebrew text-2xl md:text-3xl leading-relaxed text-foreground" dir="rtl">
          {word.hebrew}
        </span>
        {word.subcategory && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap mt-1">
            {word.subcategory}
          </span>
        )}
      </div>
      <span className="text-sm text-muted-foreground italic">{word.transcription}</span>
      <span className="text-base font-medium text-primary">{word.russian}</span>
      {word.example && (
        <div className="mt-1 border-t border-border pt-2">
          <p className="font-hebrew text-sm text-foreground/80" dir="rtl">{word.example.hebrew}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{word.example.russian}</p>
        </div>
      )}
    </div>
  );
};

export default WordListItem;
