import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

/**
 * Fetch the unified diff for a pull request.
 * @param {string} owner   - repo owner/org
 * @param {string} repo    - repo name
 * @param {number} prNumber
 * @param {string} token   - GitHub personal access token
 * @returns {Promise<{ diff: string, pr: object }>}
 */
export const getPRDiff = async (owner, repo, prNumber, token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'review-agent/1.0',
  };

  // Fetch PR metadata
  const prRes = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers,
  });
  const pr = prRes.data;

  // Fetch raw diff
  const diffRes = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: { ...headers, Accept: 'application/vnd.github.v3.diff' },
    responseType: 'text',
  });

  return { diff: diffRes.data, pr };
};

/**
 * Post review comments to a GitHub PR.
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} commitId  - latest commit SHA on the PR head
 * @param {Array}  comments  - [{ path, line, side, body }]
 * @param {string} token
 */
export const postReviewComments = async (owner, repo, prNumber, commitId, comments, token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'review-agent/1.0',
    Accept: 'application/vnd.github.v3+json',
  };

  // Create a review with all comments in one API call
  const body = {
    commit_id: commitId,
    event: 'COMMENT',
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      side: c.side || 'RIGHT',
      body: c.body,
    })),
  };

  const res = await axios.post(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    body,
    { headers }
  );
  return res.data;
};

/**
 * Parse a GitHub PR URL into its constituent parts.
 * Supports:  https://github.com/owner/repo/pull/123
 * @param {string} url
 * @returns {{ owner, repo, prNumber }}
 */
export const parsePRUrl = (url) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error('Invalid GitHub PR URL');
  return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) };
};
