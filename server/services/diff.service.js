import parseDiff from 'parse-diff';

const MAX_CHUNK_CHARS = 6000; // conservative limit for a single Ollama prompt

/**
 * Parse a unified diff string into structured file objects.
 * Each file contains an array of chunks (hunks) with context/add/del lines.
 *
 * @param {string} rawDiff
 * @returns {Array<{ from, to, chunks: Array }>}
 */
export const parseDiffString = (rawDiff) => {
  const files = parseDiff(rawDiff);
  return files.map((file) => ({
    from: file.from,
    to: file.to,
    chunks: file.chunks,
  }));
};

/**
 * Convert a parsed file back into a readable diff string block.
 */
const fileToString = (file) => {
  let out = `--- ${file.from}\n+++ ${file.to}\n`;
  for (const chunk of file.chunks) {
    out += `@@ ${chunk.content} @@\n`;
    for (const change of chunk.changes) {
      if (change.type === 'normal') out += ` ${change.content}\n`;
      else if (change.type === 'add') out += `+${change.content}\n`;
      else if (change.type === 'del') out += `-${change.content}\n`;
    }
  }
  return out;
};

/**
 * Split parsed diff files into reviewable chunks that fit within MAX_CHUNK_CHARS.
 * Each chunk contains one or more file diffs.
 *
 * @param {Array} files  - output of parseDiffString
 * @param {number} maxChars
 * @returns {Array<string>}  - array of diff text chunks
 */
export const chunkDiff = (files, maxChars = MAX_CHUNK_CHARS) => {
  const chunks = [];
  let currentChunk = '';

  for (const file of files) {
    // Skip binary files and lock files
    const fileName = file.to || file.from || '';
    if (
      fileName.endsWith('.lock') ||
      fileName.endsWith('.min.js') ||
      fileName.endsWith('.map')
    ) {
      continue;
    }

    const fileStr = fileToString(file);

    if (currentChunk.length + fileStr.length > maxChars) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = fileStr;
    } else {
      currentChunk += fileStr;
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
};

/**
 * Get a summary of what changed in the diff (for logging/display).
 */
export const getDiffStats = (files) => {
  let added = 0;
  let deleted = 0;
  const fileNames = [];

  for (const file of files) {
    fileNames.push(file.to || file.from);
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type === 'add') added++;
        else if (change.type === 'del') deleted++;
      }
    }
  }

  return { filesChanged: files.length, linesAdded: added, linesDeleted: deleted, fileNames };
};
