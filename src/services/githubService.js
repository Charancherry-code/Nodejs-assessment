const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

const githubClient = axios.create({
  baseURL: GITHUB_API,
  timeout: 15000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'github-profile-analyzer'
  }
});

githubClient.interceptors.request.use((config) => {
  if (process.env.GITHUB_TOKEN) {
    config.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return config;
});

class GitHubError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
    this.name = 'GitHubError';
  }
}

async function fetchUser(username) {
  try {
    const { data } = await githubClient.get(`/users/${encodeURIComponent(username)}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new GitHubError(`GitHub user '${username}' not found`, 404);
    }
    if (err.response?.status === 403) {
      throw new GitHubError('GitHub API rate limit exceeded. Set GITHUB_TOKEN to increase limits.', 429);
    }
    throw new GitHubError(`Failed to fetch user from GitHub: ${err.message}`);
  }
}

/**
 * Fetch all public repositories for a user (paginated).
 * Limits to 5 pages * 100 = 500 repos to keep things bounded.
 */
async function fetchAllRepos(username) {
  const perPage = 100;
  const maxPages = 5;
  const repos = [];

  for (let page = 1; page <= maxPages; page += 1) {
    let data;
    try {
      const response = await githubClient.get(`/users/${encodeURIComponent(username)}/repos`, {
        params: { per_page: perPage, page, type: 'owner', sort: 'updated' }
      });
      data = response.data;
    } catch (err) {
      if (err.response?.status === 403) {
        throw new GitHubError('GitHub API rate limit exceeded. Set GITHUB_TOKEN to increase limits.', 429);
      }
      throw new GitHubError(`Failed to fetch repos from GitHub: ${err.message}`);
    }

    repos.push(...data);
    if (data.length < perPage) break;
  }

  return repos;
}

module.exports = { fetchUser, fetchAllRepos, GitHubError };
