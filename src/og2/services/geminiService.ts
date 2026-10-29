import { getAiConfig, type AiProvider } from '../../store/settingsStore';
import { useAppStore } from '../store';

type Part = { text?: string; inlineData?: { mimeType?: string; data?: string } };
type Turn = { role?: string; parts?: Part[] };
type Contents = string | Turn | Turn[] | { parts?: Part[] };

export interface GenRequest {
  model?: string;
  contents: Contents;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    tools?: unknown;
  };
}

export interface GenResult {
  text: string;
  candidates: { groundingMetadata?: { groundingChunks: unknown[] } }[];
}

const DEFAULT_MODEL: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  gemini: 'gemini-2.5-flash',
  groq: 'llama-3.3-70b-versatile',
  ollama: 'llama3.2',
  custom: 'gpt-4o-mini',
};

function turnsOf(contents: Contents): Turn[] {
  if (typeof contents === 'string') return [{ role: 'user', parts: [{ text: contents }] }];
  if (Array.isArray(contents)) return contents;
  if (contents && Array.isArray((contents as Turn).parts)) return [{ role: 'user', ...(contents as Turn) }];
  return [{ role: 'user', parts: [{ text: '' }] }];
}

function textOf(parts: Part[] = []) {
  return parts.map((part) => part.text || '').join('');
}

function imagesOf(parts: Part[] = []) {
  return parts
    .filter((part) => part.inlineData?.data)
    .map((part) => ({
      mime: part.inlineData?.mimeType || 'image/jpeg',
      data: part.inlineData?.data || '',
    }));
}

function resolveAuth(overrideKey?: string) {
  const host = getAiConfig();
  const ogKey = useAppStore.getState().settings?.geminiApiKey?.trim() || '';
  const explicit = overrideKey?.trim() || '';
  if (explicit) return { provider: 'gemini' as const, key: explicit, baseUrl: host.baseUrl, model: host.model };
  if (host.apiKey.trim()) return { provider: host.provider, key: host.apiKey.trim(), baseUrl: host.baseUrl, model: host.model };
  if (ogKey) return { provider: 'gemini' as const, key: ogKey, baseUrl: '', model: '' };
  if (host.provider === 'ollama' || (host.provider === 'custom' && host.baseUrl.trim())) {
    return { provider: host.provider, key: '', baseUrl: host.baseUrl, model: host.model };
  }
  return null;
}

function pickModel(requested: string | undefined, provider: AiProvider, chosen: string) {
  if (chosen.trim()) return chosen.trim();
  if (provider === 'gemini') {
    const asked = requested || '';
    if (asked.includes('pro')) return 'gemini-2.5-pro';
    if (/^gemini-2[\w.-]*$/.test(asked)) return asked;
    return DEFAULT_MODEL.gemini;
  }
  return DEFAULT_MODEL[provider];
}

function openaiBase(provider: AiProvider, baseUrl: string) {
  if (provider === 'groq') return 'https://api.groq.com/openai/v1';
  if (provider === 'ollama') {
    const root = (baseUrl || 'http://127.0.0.1:11434').replace(/\/$/, '');
    return root.endsWith('/v1') ? root : `${root}/v1`;
  }
  if (provider === 'custom') return baseUrl.replace(/\/$/, '');
  return 'https://api.openai.com/v1';
}

async function readError(res: Response) {
  const raw = await res.text();
  try {
    const data = JSON.parse(raw);
    return data.error?.message || data.error?.status || data.message || raw.slice(0, 280);
  } catch {
    return raw.slice(0, 280) || res.statusText;
  }
}

function networkError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Request failed';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return new Error('The browser blocked that provider. Gemini works directly. Ollama needs OLLAMA_ORIGINS=* .');
  }
  return err instanceof Error ? err : new Error(message);
}

async function geminiGenerate(model: string, req: GenRequest, key: string, stream: boolean) {
  const contents = turnsOf(req.contents).map((turn) => ({
    role: turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user',
    parts: (turn.parts || []).map((part) =>
      part.inlineData?.data
        ? { inlineData: { mimeType: part.inlineData.mimeType || 'image/jpeg', data: part.inlineData.data } }
        : { text: part.text || '' },
    ),
  }));
  const body: Record<string, unknown> = { contents };
  if (req.config?.systemInstruction) {
    body.systemInstruction = { parts: [{ text: req.config.systemInstruction }] };
  }
  if (req.config?.responseMimeType) {
    body.generationConfig = { responseMimeType: req.config.responseMimeType };
  }
  const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  const send = async (name: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:${action}${stream ? '&' : '?'}key=${encodeURIComponent(key)}`;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };
  let res = await send(model);
  if (res.status === 404 && model !== 'gemini-2.0-flash') res = await send('gemini-2.0-flash');
  if (!res.ok) throw new Error(await readError(res));
  return res;
}

function geminiText(data: { candidates?: { content?: { parts?: { text?: string }[] } }[] }) {
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
}

async function chatGenerate(provider: AiProvider, model: string, req: GenRequest, key: string, baseUrl: string, stream: boolean) {
  if (provider === 'anthropic') return anthropicGenerate(model, req, key);
  const messages: { role: string; content: unknown }[] = [];
  const system = [
    req.config?.systemInstruction,
    req.config?.responseMimeType === 'application/json' ? 'Reply with raw JSON only.' : '',
  ].filter(Boolean).join('\n');
  if (system) messages.push({ role: 'system', content: system });
  for (const turn of turnsOf(req.contents)) {
    const role = turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user';
    const text = textOf(turn.parts);
    const images = imagesOf(turn.parts);
    if (!images.length) {
      messages.push({ role, content: text });
      continue;
    }
    messages.push({
      role,
      content: [
        { type: 'text', text },
        ...images.map((image) => ({
          type: 'image_url',
          image_url: { url: `data:${image.mime};base64,${image.data}` },
        })),
      ],
    });
  }
  const res = await fetch(`${openaiBase(provider, baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ model, messages, stream }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res;
}

async function anthropicGenerate(model: string, req: GenRequest, key: string) {
  const messages = turnsOf(req.contents).map((turn) => ({
    role: turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user',
    content: textOf(turn.parts) || '(empty)',
  }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: req.config?.systemInstruction,
      messages,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res;
}

async function collect(provider: AiProvider, res: Response) {
  if (provider === 'gemini') return geminiText(await res.json());
  if (provider === 'anthropic') {
    const data = await res.json();
    return (data.content || []).map((part: { text?: string }) => part.text || '').join('');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function* readSse(res: Response, pull: (data: unknown) => string) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n');
    buffer = chunks.pop() || '';
    for (const line of chunks) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const text = pull(JSON.parse(payload));
        if (text) yield text;
      } catch {
        /* keep reading */
      }
    }
  }
}

function makeClient(auth: NonNullable<ReturnType<typeof resolveAuth>>) {
  const run = async (req: GenRequest): Promise<GenResult> => {
    const model = pickModel(req.model, auth.provider, auth.model);
    try {
      const res = auth.provider === 'gemini'
        ? await geminiGenerate(model, req, auth.key, false)
        : await chatGenerate(auth.provider, model, req, auth.key, auth.baseUrl, false);
      const text = await collect(auth.provider, res);
      return { text, candidates: [{ groundingMetadata: { groundingChunks: [] } }] };
    } catch (err) {
      throw networkError(err);
    }
  };

  const stream = async function* (req: GenRequest) {
    const model = pickModel(req.model, auth.provider, auth.model);
    try {
      if (auth.provider === 'anthropic') {
        const result = await run(req);
        if (result.text) yield { text: result.text };
        return;
      }
      const res = auth.provider === 'gemini'
        ? await geminiGenerate(model, req, auth.key, true)
        : await chatGenerate(auth.provider, model, req, auth.key, auth.baseUrl, true);
      const pull = auth.provider === 'gemini'
        ? (data: unknown) => geminiText(data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
        : (data: unknown) => (data as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content || '';
      for await (const text of readSse(res, pull)) yield { text };
    } catch (err) {
      throw networkError(err);
    }
  };

  return {
    models: {
      generateContent: run,
      generateContentStream: stream,
    },
  };
}

export function getGenAIClient(overrideKey?: string) {
  const auth = resolveAuth(overrideKey);
  return auth ? makeClient(auth) : null;
}

const REFINE: Record<string, string> = {
  REFINE: 'Rewrite this so it is clearer and tighter. Return only the revised text.',
  EXPAND: 'Expand this with useful detail. Return only the expanded text.',
  TRANSLATE: 'If this is English, translate it to Norwegian. Otherwise translate it to English. Return only the translation.',
  ANALYZE: 'Analyze this. Return a short structured note.',
  SUMMARY: 'Summarize this in a few sentences. Return only the summary.',
  TONE: 'Rewrite this in a calm, precise operator tone. Return only the revised text.',
};

export async function refineText(text: string, action?: string): Promise<string> {
  const ai = getGenAIClient();
  if (!ai) return text;
  const instruction = REFINE[action || ''] || action || REFINE.REFINE;
  const response = await ai.models.generateContent({
    contents: `${instruction}\n\n${text}`,
  });
  return response.text?.trim() || text;
}
