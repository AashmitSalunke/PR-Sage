import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Stream a review from Gemini using generateContentStream.
 * Yields text chunks as they arrive.
 *
 * @param {string} prompt
 * @param {string} model    - e.g. 'gemini-1.5-flash', 'gemini-1.5-pro'
 * @param {string} apiKey   - Gemini API key
 * @returns {AsyncGenerator<string>}
 */
export async function* streamReview(prompt, model, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model: model || process.env.GEMINI_DEFAULT_MODEL || 'gemini-3-flash-preview',
    generationConfig: {
      temperature: 0.3,        // lower = more deterministic / consistent reviews
      maxOutputTokens: 8192,
    },
  });

  const result = await genModel.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

/**
 * One-shot (non-streaming) Gemini call.
 */
export const generateReview = async (prompt, model, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model: model || process.env.GEMINI_DEFAULT_MODEL || 'gemini-3-flash-preview',
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  });
  const result = await genModel.generateContent(prompt);
  return result.response.text();
};

/**
 * List available Gemini models (hardcoded — Gemini doesn't expose a models list endpoint via SDK).
 */
export const listModels = () => [
  'gemini-3-flash-preview',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];
