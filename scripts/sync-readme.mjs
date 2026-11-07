/**
 * Keep the profile README in sync with the portfolio.
 *
 * The profile front is split by necessity: the README must live in `cyberd4ch/cyberd4ch`
 * while the site must live in `cyberd4ch/cyberd4ch.github.io`. This script derives both
 * the project table (GitHub API) and the writing list (the site's /blog.json) so the two
 * front doors cannot drift.
 *
 * Rewrites only the blocks between the markers; everything else is left alone.
 */
import fs from 'node:fs/promises'

const USER = process.env.GITHUB_USER || 'cyberd4ch'
const SITE = process.env.PORTFOLIO_URL || 'https://cyberd4ch.github.io'
const README = 'README.md'
const PROJECTS = ['<!-- projects:start -->', '<!-- projects:end -->']
const WRITING = ['<!-- writing:start -->', '<!-- writing:end -->']
const EXCLUDE = new Set([USER, `${USER}.github.io`])
const PROJECT_LIMIT = 5
const WRITING_LIMIT = 4

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

function absolute(url) {
  return url.startsWith('http') ? url : `${SITE}${url}`
}

async function fetchProjects() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching repos`)
  const raw = await res.json()

  return raw
    .filter(repo => !repo.fork && !repo.archived && !EXCLUDE.has(repo.name))
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, PROJECT_LIMIT)
    .map(repo => {
      const stars = repo.stargazers_count > 0 ? `★ ${repo.stargazers_count}` : ''
      const stack = repo.language ? `\`${repo.language}\`` : ''
      return `| **[${repo.name}](${repo.html_url})** | ${cell(repo.description) || '—'} | ${stack} | ${stars} |`
    })
}

async function fetchWriting() {
  const res = await fetch(`${SITE}/blog.json`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${SITE}/blog.json`)
  const { posts } = await res.json()

  return (posts || [])
    // First-party articles only; external posts stay linked from the site itself.
    .filter(post => !post.external)
    .slice(0, WRITING_LIMIT)
    .map(post => `- **[${cell(post.title)}](${absolute(post.url)})** — ${cell(post.excerpt)}`)
}

/**
 * Replace the block between two markers. Returns null when the markers are absent,
 * or the unchanged text when the block already matches.
 */
function replaceBlock(readme, [startMarker, endMarker], body) {
  const start = readme.indexOf(startMarker)
  const end = readme.indexOf(endMarker)
  if (start === -1 || end === -1 || end < start) return null

  const block = [startMarker, body, endMarker].join('\n')
  const updated = `${readme.slice(0, start)}${block}${readme.slice(end + endMarker.length)}`
  return { updated, changed: updated !== readme }
}

async function main() {
  let readme = await fs.readFile(README, 'utf8')
  let changed = false

  // Each block is independent: a failed fetch keeps the committed section rather
  // than failing the whole sync.
  try {
    const rows = await fetchProjects()
    const body = [
      '| project | what it does | stack | |',
      '|---|---|---|---|',
      ...rows,
      '',
      `<sub>auto-synced from GitHub on ${new Date().toISOString().slice(0, 10)} — edit the repo description, not this table.</sub>`,
    ].join('\n')
    const result = replaceBlock(readme, PROJECTS, body)
    if (!result) throw new Error(`markers ${PROJECTS.join(' / ')} not found`)
    readme = result.updated
    changed = changed || result.changed
    console.log(`[readme] projects: ${rows.length} repos`)
  } catch (err) {
    console.warn(`[readme] projects skipped: ${err.message}`)
  }

  try {
    const bullets = await fetchWriting()
    const result = replaceBlock(readme, WRITING, bullets.join('\n'))
    if (!result) throw new Error(`markers ${WRITING.join(' / ')} not found`)
    readme = result.updated
    changed = changed || result.changed
    console.log(`[readme] writing: ${bullets.length} posts`)
  } catch (err) {
    console.warn(`[readme] writing skipped: ${err.message}`)
  }

  if (!changed) {
    console.log('[readme] already current')
    return
  }

  await fs.writeFile(README, readme)
  console.log('[readme] updated')
}

main().catch(err => {
  console.error(`[readme] sync failed: ${err.message}`)
  process.exit(1)
})
