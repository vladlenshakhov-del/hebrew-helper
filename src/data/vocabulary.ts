export type Category = 'everyday' | 'verbs' | 'adjectives' | 'nouns' | 'sentences' | 'technical';

export interface Word {
  id: string;
  hebrew: string;
  transcription: string;
  russian: string;
  category: Category;
  subcategory?: string;
  example?: { hebrew: string; russian: string };
}

export const categoryLabels: Record<Category, { ru: string; he: string; icon: string }> = {
  everyday: { ru: 'Повседневные', he: 'יומיומי', icon: '☀️' },
  verbs: { ru: 'Глаголы', he: 'פעלים', icon: '⚡' },
  adjectives: { ru: 'Прилагательные', he: 'שמות תואר', icon: '🎨' },
  nouns: { ru: 'Существительные', he: 'שמות עצם', icon: '📦' },
  sentences: { ru: 'Предложения', he: 'משפטים', icon: '💬' },
  technical: { ru: 'Техн. иврит', he: 'טכני', icon: '❄️' },
};

export const vocabulary: Word[] = [
  // Повседневные слова
  { id: 'e1', hebrew: 'שָׁלוֹם', transcription: 'шалом', russian: 'привет / мир', category: 'everyday' },
  { id: 'e2', hebrew: 'תּוֹדָה', transcription: 'тода', russian: 'спасибо', category: 'everyday' },
  { id: 'e3', hebrew: 'בְּבַקָּשָׁה', transcription: 'бевакаша', russian: 'пожалуйста', category: 'everyday' },
  { id: 'e4', hebrew: 'סְלִיחָה', transcription: 'слиха', russian: 'извините', category: 'everyday' },
  { id: 'e5', hebrew: 'כֵּן', transcription: 'кен', russian: 'да', category: 'everyday' },
  { id: 'e6', hebrew: 'לֹא', transcription: 'ло', russian: 'нет', category: 'everyday' },
  { id: 'e7', hebrew: 'מַיִם', transcription: 'маим', russian: 'вода', category: 'everyday' },
  { id: 'e8', hebrew: 'לֶחֶם', transcription: 'лехем', russian: 'хлеб', category: 'everyday' },
  { id: 'e9', hebrew: 'בֹּקֶר טוֹב', transcription: 'бокер тов', russian: 'доброе утро', category: 'everyday' },
  { id: 'e10', hebrew: 'לַיְלָה טוֹב', transcription: 'лайла тов', russian: 'спокойной ночи', category: 'everyday' },
  { id: 'e11', hebrew: 'מָה נִשְׁמָע?', transcription: 'ма нишма?', russian: 'как дела?', category: 'everyday' },
  { id: 'e12', hebrew: 'אֲנִי בְּסֵדֶר', transcription: 'ани беседер', russian: 'я в порядке', category: 'everyday' },

  // Глаголы — активная и пассивная формы
  { id: 'v1', hebrew: 'לִכְתֹּב', transcription: 'лихтов', russian: 'писать (акт.)', category: 'verbs', subcategory: 'Активная форма',
    example: { hebrew: 'אני כותב מכתב', russian: 'Я пишу письмо' } },
  { id: 'v2', hebrew: 'נִכְתָּב', transcription: 'нихтав', russian: 'быть написанным (пасс.)', category: 'verbs', subcategory: 'Пассивная форма',
    example: { hebrew: 'המכתב נכתב אתמול', russian: 'Письмо было написано вчера' } },
  { id: 'v3', hebrew: 'לִפְתֹּחַ', transcription: 'лифтоах', russian: 'открывать (акт.)', category: 'verbs', subcategory: 'Активная форма',
    example: { hebrew: 'אני פותח את הדלת', russian: 'Я открываю дверь' } },
  { id: 'v4', hebrew: 'נִפְתָּח', transcription: 'нифтах', russian: 'быть открытым (пасс.)', category: 'verbs', subcategory: 'Пассивная форма',
    example: { hebrew: 'החנות נפתחת בשמונה', russian: 'Магазин открывается в восемь' } },
  { id: 'v5', hebrew: 'לְתַקֵּן', transcription: 'летакен', russian: 'ремонтировать (акт.)', category: 'verbs', subcategory: 'Активная форма',
    example: { hebrew: 'הטכנאי מתקן את המקרר', russian: 'Техник ремонтирует холодильник' } },
  { id: 'v6', hebrew: 'תֻּקַּן', transcription: 'тукан', russian: 'быть отремонтированным (пасс.)', category: 'verbs', subcategory: 'Пассивная форма',
    example: { hebrew: 'המקרר תוקן אתמול', russian: 'Холодильник был отремонтирован вчера' } },
  { id: 'v7', hebrew: 'לִלְמֹד', transcription: 'лильмод', russian: 'учить(ся) (акт.)', category: 'verbs', subcategory: 'Активная форма' },
  { id: 'v8', hebrew: 'לְדַבֵּר', transcription: 'ледабер', russian: 'говорить (акт.)', category: 'verbs', subcategory: 'Активная форма' },
  { id: 'v9', hebrew: 'לֶאֱכֹל', transcription: 'леэхоль', russian: 'есть/кушать (акт.)', category: 'verbs', subcategory: 'Активная форма' },
  { id: 'v10', hebrew: 'לִשְׁתּוֹת', transcription: 'лиштот', russian: 'пить (акт.)', category: 'verbs', subcategory: 'Активная форма' },

  // Прилагательные
  { id: 'a1', hebrew: 'גָּדוֹל', transcription: 'гадоль', russian: 'большой', category: 'adjectives' },
  { id: 'a2', hebrew: 'קָטָן', transcription: 'катан', russian: 'маленький', category: 'adjectives' },
  { id: 'a3', hebrew: 'חָם', transcription: 'хам', russian: 'горячий / жаркий', category: 'adjectives' },
  { id: 'a4', hebrew: 'קַר', transcription: 'кар', russian: 'холодный', category: 'adjectives' },
  { id: 'a5', hebrew: 'טוֹב', transcription: 'тов', russian: 'хороший', category: 'adjectives' },
  { id: 'a6', hebrew: 'רַע', transcription: 'ра', russian: 'плохой', category: 'adjectives' },
  { id: 'a7', hebrew: 'יָפֶה', transcription: 'яфе', russian: 'красивый', category: 'adjectives' },
  { id: 'a8', hebrew: 'חָדָשׁ', transcription: 'хадаш', russian: 'новый', category: 'adjectives' },
  { id: 'a9', hebrew: 'יָשָׁן', transcription: 'яшан', russian: 'старый', category: 'adjectives' },
  { id: 'a10', hebrew: 'מָהִיר', transcription: 'маhир', russian: 'быстрый', category: 'adjectives' },

  // Существительные
  { id: 'n1', hebrew: 'בַּיִת', transcription: 'баит', russian: 'дом', category: 'nouns' },
  { id: 'n2', hebrew: 'סֵפֶר', transcription: 'сефер', russian: 'книга', category: 'nouns' },
  { id: 'n3', hebrew: 'שֻׁלְחָן', transcription: 'шульхан', russian: 'стол', category: 'nouns' },
  { id: 'n4', hebrew: 'כִּסֵּא', transcription: 'кисе', russian: 'стул', category: 'nouns' },
  { id: 'n5', hebrew: 'מְכוֹנִית', transcription: 'мехонит', russian: 'машина', category: 'nouns' },
  { id: 'n6', hebrew: 'טֶלֶפוֹן', transcription: 'телефон', russian: 'телефон', category: 'nouns' },
  { id: 'n7', hebrew: 'חַלּוֹן', transcription: 'халон', russian: 'окно', category: 'nouns' },
  { id: 'n8', hebrew: 'דֶּלֶת', transcription: 'делет', russian: 'дверь', category: 'nouns' },
  { id: 'n9', hebrew: 'עֵט', transcription: 'эт', russian: 'ручка', category: 'nouns' },
  { id: 'n10', hebrew: 'מַחְשֵׁב', transcription: 'махшев', russian: 'компьютер', category: 'nouns' },

  // Предложения
  { id: 's1', hebrew: 'אֲנִי לוֹמֵד עִבְרִית', transcription: 'ани ломед иврит', russian: 'Я учу иврит', category: 'sentences' },
  { id: 's2', hebrew: 'אֵיפֹה הַשֵּׁרוּתִים?', transcription: 'эйфо hашерутим?', russian: 'Где туалет?', category: 'sentences' },
  { id: 's3', hebrew: 'כַּמָּה זֶה עוֹלֶה?', transcription: 'кама зе оле?', russian: 'Сколько это стоит?', category: 'sentences' },
  { id: 's4', hebrew: 'אֲנִי לֹא מֵבִין', transcription: 'ани ло мевин', russian: 'Я не понимаю', category: 'sentences' },
  { id: 's5', hebrew: 'אֲנִי צָרִיךְ עֶזְרָה', transcription: 'ани царих эзра', russian: 'Мне нужна помощь', category: 'sentences' },
  { id: 's6', hebrew: 'יֵשׁ תַּקָּלָה בַּמְקָרֵר', transcription: 'еш такала бамекарер', russian: 'Есть неисправность в холодильнике', category: 'sentences' },
  { id: 's7', hebrew: 'צָרִיךְ לְהַחְלִיף אֶת הַמַּדְחֵס', transcription: 'царих лехахлиф эт hамадхес', russian: 'Нужно заменить компрессор', category: 'sentences' },
  { id: 's8', hebrew: 'הַטֶּמְפֶּרָטוּרָה גְּבוֹהָה מִדַּי', transcription: 'hатемпература гвоhа мидай', russian: 'Температура слишком высокая', category: 'sentences' },

  // Технический иврит — холодильное оборудование
  { id: 't1', hebrew: 'מְקָרֵר', transcription: 'мекарер', russian: 'холодильник', category: 'technical', subcategory: 'Оборудование' },
  { id: 't2', hebrew: 'מַקְפִּיא', transcription: 'макпиа', russian: 'морозильник', category: 'technical', subcategory: 'Оборудование' },
  { id: 't3', hebrew: 'מַדְחֵס', transcription: 'мадхес', russian: 'компрессор', category: 'technical', subcategory: 'Компоненты' },
  { id: 't4', hebrew: 'מְעַבֶּה', transcription: 'меабе', russian: 'конденсатор', category: 'technical', subcategory: 'Компоненты' },
  { id: 't5', hebrew: 'מְאַדֶּה', transcription: 'меаде', russian: 'испаритель', category: 'technical', subcategory: 'Компоненты' },
  { id: 't6', hebrew: 'שַׁסְתּוֹם הַתְפַּשְּׁטוּת', transcription: 'шастом hитпаштут', russian: 'расширительный клапан', category: 'technical', subcategory: 'Компоненты' },
  { id: 't7', hebrew: 'גַּז קֵירוּר', transcription: 'газ кейрур', russian: 'хладагент / фреон', category: 'technical', subcategory: 'Материалы' },
  { id: 't8', hebrew: 'צִנּוֹר', transcription: 'цинор', russian: 'труба / трубка', category: 'technical', subcategory: 'Компоненты' },
  { id: 't9', hebrew: 'מְפוּחַ', transcription: 'мефуах', russian: 'вентилятор', category: 'technical', subcategory: 'Компоненты' },
  { id: 't10', hebrew: 'תֶּרְמוֹסְטָט', transcription: 'термостат', russian: 'термостат', category: 'technical', subcategory: 'Компоненты' },
  { id: 't11', hebrew: 'לַחַץ', transcription: 'лахац', russian: 'давление', category: 'technical', subcategory: 'Параметры' },
  { id: 't12', hebrew: 'טֶמְפֶּרָטוּרָה', transcription: 'температура', russian: 'температура', category: 'technical', subcategory: 'Параметры' },
  { id: 't13', hebrew: 'הַפְשָׁרָה', transcription: 'hафшара', russian: 'разморозка', category: 'technical', subcategory: 'Процессы' },
  { id: 't14', hebrew: 'קֵירוּר', transcription: 'кейрур', russian: 'охлаждение', category: 'technical', subcategory: 'Процессы' },
  { id: 't15', hebrew: 'הַקְפָּאָה', transcription: 'hакпаа', russian: 'заморозка', category: 'technical', subcategory: 'Процессы' },
  { id: 't16', hebrew: 'דְּלִיפָה', transcription: 'длифа', russian: 'утечка', category: 'technical', subcategory: 'Неисправности' },
  { id: 't17', hebrew: 'תַּקָּלָה', transcription: 'такала', russian: 'неисправность / поломка', category: 'technical', subcategory: 'Неисправности' },
  { id: 't18', hebrew: 'תְּחוּזָקָה', transcription: 'тхузака', russian: 'техобслуживание', category: 'technical', subcategory: 'Процессы' },
  { id: 't19', hebrew: 'חִיבּוּר חַשְׁמַל', transcription: 'хибур хашмаль', russian: 'электроподключение', category: 'technical', subcategory: 'Электрика' },
  { id: 't20', hebrew: 'מָנוֹמֶטֶר', transcription: 'манометер', russian: 'манометр', category: 'technical', subcategory: 'Инструменты' },
];
