const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getSelectedModel = (model) =>
  model || process.env.OPENROUTER_DEFAULT_MODEL || process.env.GEMINI_DEFAULT_MODEL || 'openai/gpt-4o-mini';

const createOpenRouterHeaders = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
  'X-Title': 'Review Agent',
});

const parseOpenRouterStreamChunk = (chunkText) => {
  if (!chunkText) return '';

  const lines = chunkText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let partial = '';

  for (const line of lines) {
    if (line === '[DONE]' || line.startsWith('event:')) continue;
    if (!line.startsWith('data:')) continue;

    const payload = line.replace(/^data:\s*/, '').trim();
    if (!payload || payload === '[DONE]') continue;

    try {
      const json = JSON.parse(payload);
      const token = json.choices?.[0]?.delta?.content;
      if (typeof token === 'string') {
        partial += token;
      }
    } catch {
      // ignore malformed SSE frames
    }
  }

  return partial;
};

/**
 * Stream a review from OpenRouter using a chat-completions request.
 * Yields text chunks as they arrive.
 *
 * @param {string} prompt
 * @param {string} model
 * @param {string} apiKey
 * @returns {AsyncGenerator<string>}
 */
export async function* streamReview(prompt, model, apiKey) {
  const key = apiKey || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY not set in the server environment.');
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: createOpenRouterHeaders(key),
    body: JSON.stringify({
      model: getSelectedModel(model),
      temperature: 0.3,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('OpenRouter stream did not return a readable body.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunkText = parseOpenRouterStreamChunk(buffer);
    if (chunkText) {
      yield chunkText;
    }

    buffer = '';
  }

  const finalChunk = parseOpenRouterStreamChunk(buffer);
  if (finalChunk) {
    yield finalChunk;
  }
}

/**
 * One-shot (non-streaming) OpenRouter call.
 */
export const generateReview = async (prompt, model, apiKey) => {
  const key = apiKey || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY not set in the server environment.');
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: createOpenRouterHeaders(key),
    body: JSON.stringify({
      model: getSelectedModel(model),
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
};

/**
 * List available OpenRouter-compatible models.
 */
export const listModels = () => [
  'openai/gpt-4o-mini',
  'openai/gpt-4.1-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-haiku',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.1-8b-instruct',
];
