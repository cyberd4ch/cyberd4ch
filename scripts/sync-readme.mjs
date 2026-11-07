/**
 * Keep the profile README's project table in sync with the GitHub account.
 *
 * The profile front is split by necessity: the README must live in `cyberd4ch/cyberd4ch`
 * while the site must live in `cyberd4ch/cyberd4ch.github.io`. This script makes the
 * README derive from the same public repo data the site uses, so the two never drift.
 *
 * Rewrites only the block between the markers, everything else is left alone.
 */
import fs from 'node:fs/promises'

const USER = process.env.GITHUB_USER || 'cyberd4ch'
const README = 'README.md'
const START = '<!-- projects:start -->'
const END = '<!-- projects:end -->'
const EXCLUDE = new Set([USER, `${USER}.github.io`])
const LIMIT = 5

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USER}-profile-readme`,
  'X-GitHub-Api-Version': '2022-11-28',
}
if (token) headers.Authorization = `Bearer ${token}`

function cell(text) {
  return String(text || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

async function main() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching repos`)
  const raw = await res.json()

  const repos = raw
    .filter(repo => !repo.fork && !repo.archived && !EXCLUDE.has(repo.name))
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, LIMIT)

  const rows = repos.map(repo => {
    const stars = repo.stargazers_count > 0 ? `★ ${repo.stargazers_count}` : ''
    const stack = repo.language ? `\`${repo.language}\`` : ''
    return `| **[${repo.name}](${repo.html_url})** | ${cell(repo.description) || '—'} | ${stack} | ${stars} |`
  })

  const block = [
    START,
    '| project | what it does | stack | |',
    '|---|---|---|---|',
    ...rows,
    '',
    `<sub>auto-synced from GitHub on ${new Date().toISOString().slice(0, 10)} — edit the repo description, not this table.</sub>`,
    END,
  ].join('\n')

  const readme = await fs.readFile(README, 'utf8')
  const start = readme.indexOf(START)
  const end = readme.indexOf(END)

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`markers ${START} / ${END} not found in ${README}`)
  }

  const updated = `${readme.slice(0, start)}${block}${readme.slice(end + END.length)}`
  if (updated === readme) {
    console.log('[readme] already current')
    return
  }

  await fs.writeFile(README, updated)
  console.log(`[readme] synced ${repos.length} repos`)
}

main().catch(err => {
  console.error(`[readme] sync failed: ${err.message}`)
  process.exit(1)
})
