import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Loader2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  loading?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (feedback: string) => void;
}

/** Text + voice (Web Speech API) input used to tell Gemini what to fix in a card. */
const VoiceFeedbackInput = ({ loading, placeholder, submitLabel = 'Исправить', onSubmit }: Props) => {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const toggleListening = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
      setListening(false);
      return;
    }
    if (!SpeechRecognition) {
      toast({
        title: 'Голосовой ввод недоступен',
        description: 'Используйте микрофон на клавиатуре телефона или введите команду текстом ниже.',
      });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    baseTextRef.current = text ? text.trim() + ' ' : '';

    recognition.onstart = () => setListening(true);
    recognition.onaudiostart = () => setListening(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(baseTextRef.current + transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      const code = event?.error;
      const messages: Record<string, string> = {
        'not-allowed': 'Нет доступа к микрофону — разрешите его в настройках браузера.',
        'service-not-allowed': 'Распознавание речи заблокировано браузером.',
        'no-speech': 'Речь не распознана — попробуйте ещё раз или введите текст.',
        'audio-capture': 'Микрофон не найден.',
        network: 'Нет связи с сервисом распознавания.',
        aborted: '',
      };
      const description = messages[code] ?? `Ошибка распознавания: ${code}`;
      if (description) toast({ title: 'Голосовой ввод', description, variant: 'destructive' });
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const submit = () => {
    const value = text.trim();
    if (!value) {
      toast({ title: 'Опишите, что исправить', variant: 'destructive' });
      return;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
    onSubmit(value);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || 'Введите команду текстом или надиктуйте голосом'}
          className="min-h-[80px] pr-12 text-base"
        />
        <Button
          type="button"
          size="icon"
          variant={listening ? 'destructive' : 'secondary'}
          onClick={toggleListening}
          onTouchEnd={(e) => {
            e.preventDefault();
            toggleListening();
          }}
          style={{ touchAction: 'manipulation' }}
          title={listening ? 'Остановить запись' : 'Надиктовать команду'}
          aria-label={listening ? 'Остановить запись' : 'Надиктовать команду'}
          className="absolute right-2 top-2"
        >
          {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>
      {listening && (
        <p className="text-xs text-destructive flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
          Слушаю... говорите
        </p>
      )}
      {!SpeechRecognition && (
        <p className="text-[11px] text-muted-foreground">
          Голосовой ввод не поддерживается этим браузером — введите команду текстом.
        </p>
      )}
      <Button
        type="button"
        onClick={submit}
        onTouchEnd={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ touchAction: 'manipulation' }}
        disabled={loading}
        className="w-full"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitLabel}
      </Button>
    </div>
  );
};


export default VoiceFeedbackInput;
