/**
 * Generate the profile scoreboard as committed SVGs.
 *
 * Third-party card services (github-readme-stats, Heroku streak hosts) break or get
 * paused without warning, which is exactly what broke the README. These cards are
 * rendered here from the GitHub API and committed to assets/, so the only dependency
 * is GitHub itself.
 *
 * Outputs: assets/github-stats.svg, assets/top-languages.svg, assets/streak.svg,
 *          assets/contributions.svg, assets/repos.svg
 *
 * Every card is rendered in memory and validated before anything is written, so a bad
 * API response fails the workflow instead of committing a half-drawn card. If the run
 * fails, the previously committed SVGs stay in place and the README keeps rendering
 * them — that is the intended fallback.
 */
import fs from 'node:fs/promises'

const USER = process.env.GITHUB_USER || 'cyberd4ch'
const OUT_DIR = 'assets'
const BG = '#0d1117'
const BORDER = '#30363d'
const TEXT = '#e8eaf0'
const MUTED = '#8f99a6'
const ACCENT = '#22d3ee'
// One ramp for the heatmap, so density reads at a glance without a legend lookup.
const EMPTY = '#161b22'
const HEAT = ['#0e4a55', '#14707f', '#1a9aab', '#22d3ee']
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

function card(width, height, title, body, updated) {
  const stamp = updated
    ? `\n  <text x="${width - 20}" y="${height - 9}" fill="${MUTED}" font-family="${FONT}" font-size="9" text-anchor="end">updated ${esc(updated)}</text>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="6" fill="${BG}" stroke="${BORDER}" />
  <text x="20" y="30" fill="${ACCENT}" font-family="${FONT}" font-size="14" font-weight="600">${esc(title)}</text>
${body}${stamp}
</svg>
`
}

function assertCard(name, svg) {
  const problems = []
  if (!svg.startsWith('<svg') || !svg.trimEnd().endsWith('</svg>')) problems.push('malformed root element')
  if (/NaN|undefined|Infinity/.test(svg)) problems.push('numeric placeholder leaked into markup')
  const opened = (svg.match(/<svg/g) || []).length
  const closed = (svg.match(/<\/svg>/g) || []).length
  if (opened !== closed) problems.push(`${opened} <svg> vs ${closed} </svg>`)
  if (problems.length) throw new Error(`${name}: ${problems.join('; ')}`)
  return svg
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

function statsCard({ stars, commits, prs, issues, followers, repos, contributedTo }, updated) {
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

  return card(340, 200, `${USER} · GitHub stats`, body, updated)
}

function languagesCard(languages, repoCount, updated) {
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

  return card(340, 200, `Top languages · ${repoCount} repos`, rows, updated)
}

function streakCard({ current, longest, total, firstDay, lastDay }, updated) {
  const body = `
  <text x="20" y="76" fill="${MUTED}" font-family="${FONT}" font-size="11">Current streak</text>
  <text x="20" y="108" fill="${TEXT}" font-family="${FONT}" font-size="26" font-weight="600">${current} days</text>
  <text x="180" y="76" fill="${MUTED}" font-family="${FONT}" font-size="11">Longest streak</text>
  <text x="180" y="108" fill="${TEXT}" font-family="${FONT}" font-size="26" font-weight="600">${longest} days</text>
  <line x1="20" y1="132" x2="320" y2="132" stroke="${BORDER}" />
  <text x="20" y="158" fill="${TEXT}" font-family="${FONT}" font-size="13">${total} contributions</text>
  <text x="20" y="180" fill="${MUTED}" font-family="${FONT}" font-size="11">${esc(`${firstDay} → ${lastDay}`)}</text>`

  return card(340, 200, 'Commit streak', body, updated)
}

function heatmapCard(weeks, { total, updated }) {
  const cell = 11
  const gap = 3
  const pitch = cell + gap
  const x0 = 56
  const y0 = 58

  const columns = []
  let lastMonth = -1
  let lastLabelX = -99
  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day, row) => {
      const x = x0 + weekIndex * pitch
      const y = y0 + row * pitch
      const count = day.contributionCount
      const shade = count === 0 ? EMPTY : HEAT[Math.min(HEAT.length - 1, Math.floor(Math.log2(count)))]
      columns.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${shade}"><title>${esc(day.date)}: ${count} contribution${count === 1 ? '' : 's'}</title></rect>`,
      )
      // Label the column at its first in-month day, skipping labels that would collide.
      const month = Number(day.date.slice(5, 7))
      if (row === 0 && month !== lastMonth && x - lastLabelX >= 26) {
        const label = new Date(`${day.date}T00:00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' })
        columns.push(
          `<text x="${x}" y="${y0 - 8}" fill="${MUTED}" font-family="${FONT}" font-size="9">${esc(label)}</text>`,
        )
        lastLabelX = x
        lastMonth = month
      }
    })
  })

  const weekdayLabels = [['Mon', 1], ['Wed', 3], ['Fri', 5]]
    .map(([label, row]) =>
      `<text x="20" y="${y0 + row * pitch + 9}" fill="${MUTED}" font-family="${FONT}" font-size="9">${label}</text>`,
    )
    .join('')

  const legendX = x0
  const legendY = y0 + 7 * pitch + 16
  const legend = HEAT.map(
    (shade, i) =>
      `<rect x="${legendX + 26 + i * (cell + gap)}" y="${legendY - 9}" width="${cell}" height="${cell}" rx="2" fill="${shade}" />`,
  ).join('')

  const body = `
  ${weekdayLabels}
${columns.join('\n')}
  <text x="${legendX}" y="${legendY}" fill="${MUTED}" font-family="${FONT}" font-size="9">Less</text>
${legend}
  <text x="${legendX + 26 + HEAT.length * (cell + gap) + 4}" y="${legendY}" fill="${MUTED}" font-family="${FONT}" font-size="9">More</text>
  <text x="${legendX + 26 + HEAT.length * (cell + gap) + 44}" y="${legendY}" fill="${TEXT}" font-family="${FONT}" font-size="11">${total} contributions in the last year</text>`

  return card(840, 210, 'Contribution activity', body, updated)
}

function reposCard(repos, updated) {
  const top = repos.filter(repo => repo.name).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4)
  const name = value => (value.length > 24 ? `${value.slice(0, 23)}…` : value)
  const rows = top
    .map((repo, index) => {
      const y = 66 + index * 32
      const color = LANGUAGE_COLORS[repo.language] || MUTED
      return `
  <text x="20" y="${y}" fill="${TEXT}" font-family="${FONT}" font-size="12">${esc(name(repo.name))}</text>
  <text x="320" y="${y}" fill="${MUTED}" font-family="${FONT}" font-size="11" text-anchor="end">★ ${repo.stargazers_count}</text>
  <circle cx="23" cy="${y + 13}" r="3" fill="${color}" />
  <text x="32" y="${y + 16}" fill="${MUTED}" font-family="${FONT}" font-size="10">${esc(repo.language || 'no language')}</text>`
    })
    .join('')

  return card(340, 200, 'Top repositories', rows, updated)
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
  const weeks = collection.contributionCalendar.weeks
  const days = weeks.flatMap(week => week.contributionDays)
  const { current, longest } = computeStreaks(days)
  const total = days.reduce((sum, day) => sum + day.contributionCount, 0)
  const stamp = localDay(to)

  const rendered = {
    'github-stats.svg': statsCard(
      {
        stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        commits: collection.totalCommitContributions,
        prs: collection.totalPullRequestContributions,
        issues: collection.totalIssueContributions,
        followers: user.followers,
        repos: user.public_repos,
        contributedTo: collection.totalRepositoriesWithContributedCommits,
      },
      stamp,
    ),
    'top-languages.svg': languagesCard(languages, repos.length, stamp),
    'streak.svg': streakCard(
      { current, longest, total, firstDay: localDay(from), lastDay: localDay(to) },
      stamp,
    ),
    'contributions.svg': heatmapCard(weeks, { total, updated: stamp }),
    'repos.svg': reposCard(repos, stamp),
  }

  // Validate everything first: a broken card should fail the run, not land in the README.
  for (const [name, svg] of Object.entries(rendered)) assertCard(name, svg)

  await fs.mkdir(OUT_DIR, { recursive: true })
  await Promise.all(
    Object.entries(rendered).map(([name, svg]) => fs.writeFile(`${OUT_DIR}/${name}`, svg)),
  )

  // GitHub Camo caches by URL, so bump the query token when the assets change.
  // Without this the committed SVG would keep rendering yesterday's numbers.
  try {
    const readme = await fs.readFile('README.md', 'utf8')
    const updated = readme.replace(
      /assets\/(github-stats|top-languages|streak|contributions|repos)\.svg(\?v=[0-9-]+)?/g,
      `assets/$1.svg?v=${stamp}`,
    )
    if (updated !== readme) await fs.writeFile('README.md', updated)
  } catch (err) {
    console.warn(`[cards] README not updated: ${err.message}`)
  }

  console.log(
    `[cards] 5 cards, ${languages.length} languages, streak ${current}/${longest} days, ${total} contributions`,
  )
}

main().catch(err => {
  console.error(`[cards] failed: ${err.message}`)
  process.exit(1)
})
