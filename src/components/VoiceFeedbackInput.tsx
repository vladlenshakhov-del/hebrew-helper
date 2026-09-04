import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
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

/** Text + voice input: native Android recognizer in APK, Web Speech API in browsers. */
const VoiceFeedbackInput = ({ loading, placeholder, submitLabel = 'Исправить', onSubmit }: Props) => {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;

  const isNative = Capacitor.isNativePlatform();
  const nativeActiveRef = useRef(false);

  const loadNativePlugin = async () => {
    const mod = await import('@capacitor-community/speech-recognition');
    return mod.SpeechRecognition;
  };

  const stopNative = async () => {
    try {
      const plugin = await loadNativePlugin();
      await plugin.stop();
      await plugin.removeAllListeners();
    } catch {
      /* noop */
    }
    nativeActiveRef.current = false;
    setListening(false);
  };

  const startNative = async () => {
    try {
      const plugin = await loadNativePlugin();
      const { available } = await plugin.available();
      if (!available) {
        setSpeechError('Нативное распознавание недоступно [native-unavailable]. Используйте микрофон клавиатуры.');
        focusKeyboardInput();
        return;
      }

      let perm = await plugin.checkPermissions();
      if (perm.speechRecognition !== 'granted') {
        perm = await plugin.requestPermissions();
      }
      if (perm.speechRecognition !== 'granted') {
        const message = 'Ошибка доступа к микрофону [native-not-allowed]. Разрешите микрофон в настройках Android.';
        setSpeechError(message);
        toast({ title: 'Голосовой ввод', description: message, variant: 'destructive' });
        focusKeyboardInput();
        return;
      }

      baseTextRef.current = text ? text.trim() + ' ' : '';
      await plugin.removeAllListeners();
      await plugin.addListener('listeningState', (data: any) => {
        setListening(data?.status === 'started');
      });

      setSpeechError('');
      nativeActiveRef.current = true;
      setListening(true);
      // Android's system recognition popup is substantially more reliable than
      // background recognition across Samsung/Xiaomi/Pixel WebViews.
      const result = await plugin.start({
        language: 'ru-RU',
        maxResults: 3,
        partialResults: false,
        popup: true,
      });
      const value = result.matches?.[0]?.trim();
      if (value) {
        setText(baseTextRef.current + value);
      } else {
        setSpeechError('Речь не распознана. Нажмите микрофон и попробуйте ещё раз.');
      }
      await plugin.removeAllListeners();
      nativeActiveRef.current = false;
      setListening(false);
    } catch (error) {
      nativeActiveRef.current = false;
      setListening(false);
      const message = `Ошибка нативного распознавания [${(error as any)?.message || 'native-error'}]. Используйте микрофон клавиатуры.`;
      setSpeechError(message);
      toast({ title: 'Голосовой ввод', description: message, variant: 'destructive' });
      focusKeyboardInput();
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
      if (nativeActiveRef.current) void stopNative();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusKeyboardInput = () => {
    textareaRef.current?.focus({ preventScroll: true });
  };

  const toggleListening = async () => {
    if (listening) {
      if (isNative && nativeActiveRef.current) {
        await stopNative();
        return;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
      setListening(false);
      return;
    }

    // Native APK always uses Android SpeechRecognizer, never Web Speech API.
    if (isNative) {
      setSpeechError('');
      await startNative();
      return;
    }

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API не поддерживается [unsupported]. Используйте микрофон клавиатуры Android.');

      focusKeyboardInput();
      toast({
        title: 'Голосовой ввод недоступен',
        description: 'Используйте микрофон на клавиатуре телефона или введите команду текстом ниже.',
      });
      return;
    }
    setSpeechError('');

    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      stream?.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const code = error instanceof DOMException ? error.name : 'permission-error';
      const message = `Ошибка доступа к микрофону [${code}]. Разрешите микрофон приложению или используйте микрофон клавиатуры.`;
      setSpeechError(message);
      toast({ title: 'Голосовой ввод', description: message, variant: 'destructive' });
      focusKeyboardInput();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    baseTextRef.current = text ? text.trim() + ' ' : '';

    recognition.onstart = () => {
      setSpeechError('');
      setListening(true);
    };
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
        'not-allowed': 'Ошибка доступа к микрофону [not-allowed]. Разрешите микрофон в настройках Android.',
        'service-not-allowed': 'Распознавание речи заблокировано [service-not-allowed]. Используйте микрофон клавиатуры.',
        'no-speech': 'Речь не распознана [no-speech]. Попробуйте ещё раз.',
        'audio-capture': 'Микрофон не найден [audio-capture].',
        network: 'Ошибка сервиса распознавания [network]. Проверьте подключение.',
        aborted: 'Распознавание остановлено [aborted].',
      };
      const description = messages[code] ?? `Ошибка распознавания [${code || 'unknown'}].`;
      setSpeechError(description);
      toast({ title: 'Голосовой ввод', description, variant: 'destructive' });
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (error) {
      setListening(false);
      const code = error instanceof DOMException ? error.name : 'start-failed';
      setSpeechError(`Не удалось запустить распознавание [${code}]. Используйте микрофон клавиатуры.`);
      focusKeyboardInput();
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
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSpeechError('');
          }}
          onPointerDown={focusKeyboardInput}
          onClick={focusKeyboardInput}
          inputMode="text"
          autoCapitalize="sentences"
          enterKeyHint="send"
          placeholder={placeholder || 'Введите команду текстом или надиктуйте голосом'}
          className="min-h-[80px] pr-12 text-base"
        />
        <Button
          type="button"
          size="icon"
          variant={listening ? 'destructive' : 'secondary'}
          onClick={toggleListening}
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
      {speechError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {speechError}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        {isNative
          ? 'В APK откроется системное распознавание Android. Команду также можно ввести текстом.'
          : 'Введите команду текстом или используйте микрофон браузера.'}
      </p>
      <Button
        type="button"
        onClick={submit}
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
