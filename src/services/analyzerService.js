const { fetchUser, fetchAllRepos } = require('./githubService');

/**
 * Convert GitHub ISO timestamp to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS).
 */
function toMysqlDatetime(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Aggregate insights from a user's repositories.
 */
function buildRepoInsights(repos) {
  const ownRepos = repos.filter((r) => !r.fork);

  let totalStars = 0;
  let totalForks = 0;
  let totalWatchers = 0;
  const languageCounts = {};
  let topRepo = null;

  for (const repo of ownRepos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    totalWatchers += repo.watchers_count || 0;

    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }

    if (!topRepo || (repo.stargazers_count || 0) > (topRepo.stargazers_count || 0)) {
      topRepo = repo;
    }
  }

  const sortedLanguages = Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [lang, count]) => {
      acc[lang] = count;
      return acc;
    }, {});

  const topLanguage = Object.keys(sortedLanguages)[0] || null;

  return {
    totalStars,
    totalForks,
    totalWatchers,
    languages: sortedLanguages,
    topLanguage,
    topRepo
  };
}

/**
 * Build a complete insight payload by combining the GitHub user object with repo aggregates.
 */
async function analyzeUsername(username) {
  const user = await fetchUser(username);
  const repos = await fetchAllRepos(user.login);
  const insights = buildRepoInsights(repos);

  const accountAgeDays = user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    github_id: user.id,
    username: user.login,
    name: user.name,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: user.blog || null,
    email: user.email,
    twitter_username: user.twitter_username,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    public_repos: user.public_repos || 0,
    public_gists: user.public_gists || 0,
    followers: user.followers || 0,
    following: user.following || 0,
    total_stars: insights.totalStars,
    total_forks: insights.totalForks,
    total_watchers: insights.totalWatchers,
    top_language: insights.topLanguage,
    languages_json: insights.languages,
    top_repo_name: insights.topRepo?.name || null,
    top_repo_stars: insights.topRepo?.stargazers_count || 0,
    top_repo_url: insights.topRepo?.html_url || null,
    account_age_days: accountAgeDays,
    hireable: user.hireable === null ? null : user.hireable ? 1 : 0,
    github_created_at: toMysqlDatetime(user.created_at),
    github_updated_at: toMysqlDatetime(user.updated_at)
  };
}

module.exports = { analyzeUsername };
