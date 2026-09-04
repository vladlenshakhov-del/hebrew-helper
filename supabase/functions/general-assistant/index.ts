import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const extractJson = (value: string) => {
  const cleaned = value.replace(/```json|```/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    return { replyText: cleaned }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Метод не поддерживается' }, 405)

  try {
    const body = await req.json()
    const command = typeof body?.command === 'string' ? body.command.trim() : ''
    const history = Array.isArray(body?.history) ? body.history : []
    const vocabulary = Array.isArray(body?.vocabulary) ? body.vocabulary : []
    if (!command) return json({ error: 'Введите команду' }, 400)
    if (history.length > 60 || vocabulary.length > 5000) {
      return json({ error: 'Диалог или словарь слишком большой для одного запроса' }, 400)
    }

    const messages: HistoryMessage[] = history
      .filter((item: unknown): item is HistoryMessage => {
        if (!item || typeof item !== 'object') return false
        const value = item as Record<string, unknown>
        return (value.role === 'user' || value.role === 'assistant') && typeof value.content === 'string'
      })
      .map((item) => ({ role: item.role, content: item.content.slice(0, 12000) }))

    const key = Deno.env.get('LOVABLE_API_KEY')
    if (!key) return json({ error: 'AI не настроен: отсутствует серверный ключ' }, 500)

    const instructions = `Ты — общий AI-помощник приложения для изучения иврита. Отвечай на русском, если пользователь не попросил другой язык. Выполняй любые обычные задания: объяснения, перевод, обучение, планирование и помощь по словарю.

Если пользователь просит изменить, добавить или исправить карточки, используй приложенный локальный словарь, но не утверждай, что изменения уже сохранены: предложи их для подтверждения. Никогда не используй кириллические символы вместо букв иврита. Транскрипция иврита должна быть русскими буквами с ударением, а englishPronunciation — произношением английского русскими буквами.

Верни только JSON-объект такого вида:
{"replyText":"ответ в Markdown","actionPerformed":"краткое описание или null","updatedVocabulary":["полные изменённые или новые объекты карточек"] или null}
Для обычного разговора updatedVocabulary должен быть null. Для исправления существующей карточки сохрани её id и верни полный объект. Не меняй карточки, которых команда не касается.

Локальный словарь (сжатые поля): ${JSON.stringify(vocabulary)}`

    const input = [
      { role: 'developer', content: [{ type: 'input_text', text: instructions }] },
      ...messages.map((message) => ({
        role: message.role,
        content: [{ type: message.role === 'assistant' ? 'output_text' : 'input_text', text: message.content }],
      })),
    ]

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        input,
        stream: true,
        store: false,
        reasoning: { effort: 'medium', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      return json({ error: detail || `Ошибка AI (${upstream.status})` }, upstream.status)
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let answer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const event = JSON.parse(payload)
          if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') answer += event.delta
        } catch {
          // Ignore malformed keep-alive/event lines and continue the stream.
        }
      }
    }

    if (!answer.trim()) return json({ error: 'AI завершил запрос без текстового ответа' }, 502)
    const parsed = extractJson(answer)
    return json({
      replyText: typeof parsed.replyText === 'string' ? parsed.replyText : answer,
      actionPerformed: typeof parsed.actionPerformed === 'string' ? parsed.actionPerformed : undefined,
      updatedVocabulary: Array.isArray(parsed.updatedVocabulary) ? parsed.updatedVocabulary : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка сервера'
    return json({ error: message }, 500)
  }
})