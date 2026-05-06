import axios from 'axios';

/**
 * Stream a review from Ollama using the /api/generate endpoint.
 * Yields partial text chunks as they arrive.
 *
 * @param {string} prompt
 * @param {string} model      - e.g. 'codellama'
 * @param {string} baseUrl    - e.g. 'http://localhost:11434'
 * @returns {AsyncGenerator<string>}
 */
export async function* streamReview(prompt, model, baseUrl) {
  const url = `${baseUrl}/api/generate`;

  const response = await axios.post(
    url,
    { model, prompt, stream: true },
    { responseType: 'stream', timeout: 120_000 }
  );

  let buffer = '';

  for await (const chunk of response.data) {
    buffer += chunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) yield parsed.response;
        if (parsed.done) return;
      } catch {
        // ignore JSON parse errors on partial chunks
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.response) yield parsed.response;
    } catch { /* ignore */ }
  }
}

/**
 * One-shot (non-streaming) call to Ollama.
 * Useful for smaller prompts where streaming is unnecessary.
 */
export const generateReview = async (prompt, model, baseUrl) => {
  const url = `${baseUrl}/api/generate`;
  const res = await axios.post(url, { model, prompt, stream: false }, { timeout: 120_000 });
  return res.data.response;
};

/**
 * List available models on the local Ollama instance.
 */
export const listModels = async (baseUrl) => {
  const res = await axios.get(`${baseUrl}/api/tags`);
  return res.data.models || [];
};
