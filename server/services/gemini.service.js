const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getSelectedModel = (model) => model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const createGroqHeaders = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
});

const parseGroqStreamChunk = (chunkText) => {
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
 * Stream a review from Groq using the Groq chat completion API.
 */
export async function* streamReview(prompt, model, apiKey) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY not set in the server environment.');
  }

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: createGroqHeaders(key),
    body: JSON.stringify({
      model: getSelectedModel(model),
      temperature: 0.3,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Groq stream did not return a readable body.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunkText = parseGroqStreamChunk(buffer);
    if (chunkText) {
      yield chunkText;
    }

    buffer = '';
  }

  const finalChunk = parseGroqStreamChunk(buffer);
  if (finalChunk) {
    yield finalChunk;
  }
}

/**
 * One-shot (non-streaming) Groq call.
 */
export const generateReview = async (prompt, model, apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY not set in the server environment.');
  }

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: createGroqHeaders(key),
    body: JSON.stringify({
      model: getSelectedModel(model),
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
};

/**
 * Groq model list intentionally kept to a single default model.
 */
export const listModels = () => ['llama-3.3-70b-versatile'];
