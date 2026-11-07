/**
 * Generate the profile scoreboard as committed SVGs.
 *
 * Third-party card services (github-readme-stats, Heroku streak hosts) break or get
 * paused without warning, which is exactly what broke the README. These cards are
 * rendered here from the GitHub API and committed to assets/, so the only dependency
 * is GitHub itself.
 *
 * Outputs: assets/github-stats.svg, assets/top-languages.svg, assets/streak.svg
 */
import fs from 'node:fs/promises'

const USER = process.env.GITHUB_USER || 'cyberd4ch'
const OUT_DIR = 'assets'
const BG = '#0d1117'
const BORDER = '#30363d'
const TEXT = '#e8eaf0'
const MUTED = '#8f99a6'
const ACCENT = '#22d3ee'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USER}-profile-cards`,
  'X-GitHub-Api-Version': '2022-11-28',
}
if (token) headers.Authorization = `Bearer ${token}`

const LANGUAGE_COLORS = {
  C: '#555555',
  'C++': '#f34b7d',
  CSS: '#563d7c',
  Go: '#00ADD8',
  HTML: '#e34c26',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Ruby: '#701516',
  Rust: '#dea584',
  Shell: '#89e051',
  TypeScript: '#3178c6',
  Vue: '#41b883',
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function card(width, height, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="6" fill="${BG}" stroke="${BORDER}" />
  <text x="20" y="30" fill="${ACCENT}" font-family="${FONT}" font-size="14" font-weight="600">${esc(title)}</text>
${body}
</svg>
`
}

async function api(url) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function graphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for graphql`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

function statsCard({ stars, commits, prs, issues, followers, repos, contributedTo }) {
  const cell = (x, y, label, value) => `
  <text x="${x}" y="${y}" fill="${MUTED}" font-family="${FONT}" font-size="11">${esc(label)}</text>
  <text x="${x}" y="${y + 24}" fill="${TEXT}" font-family="${FONT}" font-size="22" font-weight="600">${esc(value)}</text>`

  const body = [
    cell(20, 70, 'Total stars', stars),
    cell(180, 70, 'Commits', commits),
    cell(20, 130, 'Pull requests', prs),
    cell(180, 130, 'Issues', issues),
    `<line x1="20" y1="162" x2="320" y2="162" stroke="${BORDER}" />`,
    `<text x="20" y="184" fill="${MUTED}" font-family="${FONT}" font-size="11">${esc(
      `${repos} public repos · ${followers} followers · contributed to ${contributedTo}`,
    )}</text>`,
  ].join('')

  return card(340, 200, `${USER} · GitHub stats`, body)
}

function languagesCard(languages, repoCount) {
  const total = languages.reduce((sum, item) => sum + item.bytes, 0) || 1
  const top = languages.slice(0, 5)
  const rows = top
    .map((item, index) => {
      const y = 66 + index * 27
      const pct = (item.bytes / total) * 100
      const width = Math.max(2, Math.round((pct / 100) * 280))
      return `
  <circle cx="24" cy="${y - 4}" r="4" fill="${LANGUAGE_COLORS[item.name] || MUTED}" />
  <text x="36" y="${y}" fill="${TEXT}" font-family="${FONT}" font-size="12">${esc(item.name)}</text>
  <text x="320" y="${y}" fill="${MUTED}" font-family="${FONT}" font-size="11" text-anchor="end">${pct.toFixed(1)}%</text>
  <rect x="36" y="${y + 5}" width="284" height="5" rx="2.5" fill="#21262d" />
  <rect x="36" y="${y + 5}" width="${width}" height="5" rx="2.5" fill="${LANGUAGE_COLORS[item.name] || MUTED}" />`
    })
    .join('')

  return card(340, 200, `Top languages · ${repoCount} repos`, rows)
}

function streakCard({ current, longest, total, firstDay, lastDay }) {
  const body = `
  <text x="20" y="76" fill="${MUTED}" font-family="${FONT}" font-size="11">Current streak</text>
  <text x="20" y="108" fill="${TEXT}" font-family="${FONT}" font-size="26" font-weight="600">${current} days</text>
  <text x="180" y="76" fill="${MUTED}" font-family="${FONT}" font-size="11">Longest streak</text>
  <text x="180" y="108" fill="${TEXT}" font-family="${FONT}" font-size="26" font-weight="600">${longest} days</text>
  <line x1="20" y1="132" x2="320" y2="132" stroke="${BORDER}" />
  <text x="20" y="158" fill="${TEXT}" font-family="${FONT}" font-size="13">${total} contributions</text>
  <text x="20" y="180" fill="${MUTED}" font-family="${FONT}" font-size="11">${esc(`${firstDay} → ${lastDay}`)}</text>`

  return card(340, 200, 'Commit streak', body)
}

function localDay(date) {
  return date.toISOString().slice(0, 10)
}

function computeStreaks(days) {
  let longest = 0
  let run = 0
  for (const day of days) {
    if (day.contributionCount > 0) {
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 0
    }
  }

  // Trailing run, ignoring a still-empty "today" so the card does not reset all day.
  const tail = [...days]
  if (tail.length && tail[tail.length - 1].contributionCount === 0) tail.pop()
  let current = 0
  for (let i = tail.length - 1; i >= 0 && tail[i].contributionCount > 0; i--) current += 1

  return { current, longest }
}

async function main() {
  const [user, rawRepos] = await Promise.all([
    api(`https://api.github.com/users/${USER}`),
    api(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`),
  ])

  const repos = rawRepos.filter(repo => !repo.fork && !repo.archived)

  // Language bytes come per-repo; keep the fan-out small and tolerate failures.
  const languageResults = await Promise.all(
    repos.map(repo =>
      api(repo.languages_url).catch(() => ({})),
    ),
  )
  const totals = new Map()
  for (const result of languageResults) {
    for (const [name, bytes] of Object.entries(result)) {
      totals.set(name, (totals.get(name) || 0) + bytes)
    }
  }
  const languages = [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes)

  const to = new Date()
  const from = new Date(to.getTime() - 364 * 24 * 3600 * 1000)
  const data = await graphql(
    `query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoriesWithContributedCommits
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`,
    { login: USER, from: from.toISOString(), to: to.toISOString() },
  )

  const collection = data.user.contributionsCollection
  const days = collection.contributionCalendar.weeks.flatMap(week => week.contributionDays)
  const { current, longest } = computeStreaks(days)
  const total = days.reduce((sum, day) => sum + day.contributionCount, 0)

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(
    `${OUT_DIR}/github-stats.svg`,
    statsCard({
      stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      commits: collection.totalCommitContributions,
      prs: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      followers: user.followers,
      repos: user.public_repos,
      contributedTo: collection.totalRepositoriesWithContributedCommits,
    }),
  )
  await fs.writeFile(`${OUT_DIR}/top-languages.svg`, languagesCard(languages, repos.length))
  await fs.writeFile(
    `${OUT_DIR}/streak.svg`,
    streakCard({
      current,
      longest,
      total,
      firstDay: localDay(from),
      lastDay: localDay(to),
    }),
  )

  // GitHub Camo caches by URL, so bump the query token when the assets change.
  // Without this the committed SVG would keep rendering yesterday's numbers.
  const stamp = localDay(to)
  try {
    const readme = await fs.readFile('README.md', 'utf8')
    const updated = readme.replace(
      /assets\/(github-stats|top-languages|streak)\.svg(\?v=[0-9-]+)?/g,
      `assets/$1.svg?v=${stamp}`,
    )
    if (updated !== readme) await fs.writeFile('README.md', updated)
  } catch (err) {
    console.warn(`[cards] README not updated: ${err.message}`)
  }

  console.log(`[cards] stats, ${languages.length} languages, streak ${current}/${longest} days`)
}

main().catch(err => {
  console.error(`[cards] failed: ${err.message}`)
  process.exit(1)
})
