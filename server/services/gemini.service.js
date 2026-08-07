const NEMOTRON_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getSelectedModel = (model) => model || process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3-nano-30b-a3b';

const createNemotronHeaders = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
  'X-Title': 'PR Sage',
});

const parseNemotronStreamChunk = (chunkText) => {
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
 * Stream a review from Nemotron using NVIDIA's OpenAI-compatible API.
 */
export async function* streamReview(prompt, model, apiKey) {
  const key = apiKey || process.env.NEMOTRON_API_KEY;
  if (!key) {
    throw new Error('NEMOTRON_API_KEY not set in the server environment.');
  }

  const response = await fetch(process.env.NEMOTRON_BASE_URL || NEMOTRON_BASE_URL, {
    method: 'POST',
    headers: createNemotronHeaders(key),
    body: JSON.stringify({
      model: getSelectedModel(model),
      temperature: 0.3,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nemotron request failed: ${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Nemotron stream did not return a readable body.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunkText = parseNemotronStreamChunk(buffer);
    if (chunkText) {
      yield chunkText;
    }

    buffer = '';
  }

  const finalChunk = parseNemotronStreamChunk(buffer);
  if (finalChunk) {
    yield finalChunk;
  }
}

/**
 * One-shot (non-streaming) Nemotron call.
 */
export const generateReview = async (prompt, model, apiKey) => {
  const key = apiKey || process.env.NEMOTRON_API_KEY;
  if (!key) {
    throw new Error('NEMOTRON_API_KEY not set in the server environment.');
  }

  const response = await fetch(process.env.NEMOTRON_BASE_URL || NEMOTRON_BASE_URL, {
    method: 'POST',
    headers: createNemotronHeaders(key),
    body: JSON.stringify({
      model: getSelectedModel(model),
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nemotron request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
};

/**
 * Nemotron model list intentionally kept to a single configured model.
 */
export const listModels = () => [getSelectedModel()];
