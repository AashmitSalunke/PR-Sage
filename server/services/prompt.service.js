/**
 * Build a structured code review prompt for Ollama.
 *
 * @param {string} diffChunk   - diff text for this chunk
 * @param {string} prTitle
 * @param {string} prDescription
 * @param {number} chunkIndex  - 0-based index
 * @param {number} totalChunks
 * @returns {string}
 */
export const buildReviewPrompt = (diffChunk, prTitle, prDescription, chunkIndex, totalChunks) => {
  const chunkInfo =
    totalChunks > 1
      ? `This is chunk ${chunkIndex + 1} of ${totalChunks} of the diff.`
      : 'This is the complete diff.';

  return `You are an expert code reviewer. Your job is to review a GitHub pull request diff and provide constructive, actionable feedback.

## Pull Request
**Title:** ${prTitle || 'N/A'}
**Description:** ${prDescription || 'No description provided.'}

## Instructions
${chunkInfo}

Analyze the diff below and provide feedback in the following JSON format:
{
  "summary": "<brief overall summary of what changed>",
  "comments": [
    {
      "path": "<file path>",
      "line": <line number in the new file, or null if file-level>,
      "side": "RIGHT",
      "severity": "critical|warning|suggestion|praise",
      "body": "<your review comment>"
    }
  ]
}

Rules:
- Only comment on lines that start with '+' (additions) or '-' (deletions)
- Be specific — reference the actual code, not generic advice
- Keep comments concise (1-3 sentences)
- Include at least one "praise" comment if the code is good
- Flag: bugs, security issues, performance problems, style violations, missing error handling
- Do NOT comment on whitespace-only changes
- Return ONLY valid JSON, no markdown code fences

## Diff
\`\`\`diff
${diffChunk}
\`\`\`
`;
};

/**
 * Build a prompt to synthesize multiple chunk reviews into a final summary.
 */
export const buildSummaryPrompt = (reviews) => {
  const reviewText = reviews
    .map((r, i) => `### Chunk ${i + 1} Review\n${JSON.stringify(r, null, 2)}`)
    .join('\n\n');

  return `You are a senior code reviewer. Below are code review results for different chunks of the same pull request.

Synthesize them into a single cohesive review summary in 3-5 sentences. Highlight the most critical issues and overall quality.

${reviewText}

Return a plain text summary only.`;
};
