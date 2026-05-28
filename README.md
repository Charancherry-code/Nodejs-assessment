# GitHub Profile Analyzer

A backend service that analyzes a GitHub user profile via the public GitHub REST API and stores the resulting insights in MySQL. Built with **Node.js**, **Express.js**, **MySQL**, and the **GitHub API**.

## Features

- Analyze any public GitHub user by username and persist insights to MySQL.
- Aggregate insights beyond the basic user object:
  - Total stars, total forks, total watchers across owned repos.
  - Language breakdown (`languages_json`) and top language.
  - Top repository (name, stars, URL).
  - Account age in days.
- Stable upsert by `github_id` and `username` so re-analyzing a user updates the existing record.
- REST endpoints to analyze, list, fetch, refresh, and delete profiles.
- Pagination + sorting on the list endpoint.
- Helmet, CORS, request logging, and per-IP rate limiting.
- Optional `GITHUB_TOKEN` to dramatically raise the GitHub API rate limit.
- Postman collection and SQL schema export included.

## Tech Stack

- Node.js (>=18) + Express.js 4
- MySQL 8 (via `mysql2` connection pool)
- Axios for the GitHub API
- helmet, cors, morgan, express-rate-limit

## Project Structure

```
.
├─ server.js                  # Entry point
├─ scripts/initDb.js          # Creates DB + tables (npm run db:init)
├─ database/schema.sql        # Schema export
├─ postman/                   # Postman collection
└─ src/
   ├─ app.js                  # Express app
   ├─ config/db.js            # MySQL pool + ensureSchema
   ├─ services/
   │  ├─ githubService.js     # GitHub API client
   │  └─ analyzerService.js   # Insight aggregation
   ├─ models/profileModel.js  # DB access
   ├─ controllers/profileController.js
   ├─ routes/profileRoutes.js
   └─ middleware/errorHandler.js
```

## Setup

### 1. Prerequisites

- Node.js 18+
- MySQL 8+ running locally or remotely
- (Optional) GitHub Personal Access Token for higher rate limits

### 2. Install

```bash
git clone <your-repo-url>
cd github-profile-analyzer
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in values:

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer

GITHUB_TOKEN=
```

### 4. Initialize the database

This creates the database (if missing) and the `profiles` table.

```bash
npm run db:init
```

Alternatively, run `database/schema.sql` directly in your MySQL client.

### 5. Run

```bash
npm run dev    # nodemon
# or
npm start
```

Server boots at `http://localhost:3000`.

## API Reference

Base URL: `/api/profiles`

### POST `/analyze`
Analyze a GitHub user and persist insights.

Request body:
```json
{ "username": "octocat" }
```

Response `201`:
```json
{
  "success": true,
  "message": "Profile for 'octocat' analyzed and saved.",
  "data": { "...full profile row..." }
}
```

### GET `/`
List analyzed profiles (paginated).

Query params: `limit` (default 50, max 200), `offset` (default 0), `sort` (`last_analyzed_at` | `followers` | `total_stars` | `public_repos` | `username` | `created_at`), `order` (`ASC` | `DESC`).

### GET `/:username`
Fetch a single stored profile.

### POST `/:username/refresh`
Re-analyze a user and update their stored insights.

### DELETE `/:username`
Remove a profile from the database.

### GET `/health`
Service health check.

## Insights Stored

| Field | Description |
| --- | --- |
| `github_id`, `username`, `name`, `bio`, `company`, `location`, `blog`, `email`, `twitter_username` | Identity fields from GitHub |
| `avatar_url`, `html_url` | Profile imagery and link |
| `public_repos`, `public_gists`, `followers`, `following` | Standard counts |
| `total_stars`, `total_forks`, `total_watchers` | Sum across owned (non-fork) repos |
| `top_language`, `languages_json` | Most-used language and full breakdown |
| `top_repo_name`, `top_repo_stars`, `top_repo_url` | Most starred owned repo |
| `account_age_days` | Days since GitHub account creation |
| `hireable` | GitHub hireable flag |
| `github_created_at`, `github_updated_at` | GitHub-side timestamps |
| `last_analyzed_at`, `created_at`, `updated_at` | Service-side timestamps |

## GitHub Rate Limits

- Without token: 60 requests/hour per IP.
- With `GITHUB_TOKEN`: 5,000 requests/hour.
- Each analyze call uses 1 user request + up to 5 repo pages (max 6 requests).

## Postman Collection

Import `postman/GitHub-Profile-Analyzer.postman_collection.json`. The collection variables `baseUrl` and `username` are preset and editable.

## Database Export

See `database/schema.sql` for the full DDL. The schema is also auto-applied on server boot via `ensureSchema()`.

## Deployment Notes

### Deploy to Railway (recommended free path)

Railway hosts both the Node app and a MySQL plugin in the same project, with a small monthly free credit that's enough for a demo.

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app), create a new project → **Deploy from GitHub repo**.
3. Inside the project, click **+ New** → **Database** → **Add MySQL**.
4. Open your service → **Variables** tab → click **Add Reference** and pull in `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` from the MySQL plugin. The app reads these automatically as fallbacks for the `DB_*` vars.
5. Add these extra variables on the service:
   - `NODE_ENV=production`
   - `GITHUB_TOKEN=<your PAT>` (optional but strongly recommended)
6. Railway sets `PORT` automatically; the app already respects it.
7. First deploy boots, runs `ensureSchema()`, and creates the `profiles` table. You're live.

To expose a public URL, open the service → **Settings** → **Networking** → **Generate Domain**.

### Other hosts

- Set environment variables on your platform of choice (Render, Fly.io, AWS, etc.).
- Provision a managed MySQL (TiDB Cloud Serverless, Aiven, RDS, etc.) and point `DB_*` envs to it. Set `DB_SSL=true` for providers that require TLS.
- Run `npm run db:init` once against the target DB, or rely on `ensureSchema()` on first boot.
- Recommended: set `NODE_ENV=production` and a non-empty `GITHUB_TOKEN`.

## License

MIT
