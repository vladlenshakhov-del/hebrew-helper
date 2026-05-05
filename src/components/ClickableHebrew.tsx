import { memo, useState } from 'react';
import { lookupHebrewWord } from '@/lib/hebrewLookup';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ClickableHebrewProps {
  text: string;
  className?: string;
  onLight?: boolean; // true when on dark/primary background
}

const ClickableHebrew = ({ text, className, onLight }: ClickableHebrewProps) => {
  // Split keeping whitespace
  const tokens = text.split(/(\s+)/);
  return (
    <span className={className} dir="rtl">
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok) || !tok) return <span key={i}>{tok}</span>;
        return <ClickableToken key={i} token={tok} onLight={onLight} />;
      })}
    </span>
  );
};

const ClickableToken = ({ token, onLight }: { token: string; onLight?: boolean }) => {
  const [open, setOpen] = useState(false);
  const matches = open ? lookupHebrewWord(token) : [];
  const hoverCls = onLight
    ? 'hover:bg-primary-foreground/20 active:bg-primary-foreground/30'
    : 'hover:bg-accent active:bg-accent/70';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className={`inline rounded px-0.5 cursor-pointer transition-colors ${hoverCls}`}
        >
          {token}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        className="w-auto max-w-[260px] p-2 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {matches.length === 0 ? (
          <p className="text-xs text-muted-foreground">Перевод не найден</p>
        ) : (
          <div className="space-y-1.5">
            {matches.slice(0, 4).map((w) => (
              <div key={w.id} className="text-sm">
                <span className="font-hebrew text-base font-semibold" dir="rtl">{w.hebrew}</span>
                <span className="text-xs text-muted-foreground italic mx-1">{w.transcription}</span>
                <div className="text-foreground">{w.russian}</div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default memo(ClickableHebrew);
