/**
 * Keep the profile README in sync with GitHub and with the portfolio.
 *
 * Every block is rewritten only between its markers, in one of two kinds:
 *
 *  - fed by the portfolio (writing, recent) or by the repo list (payload manifest):
 *    always regenerated from the source;
 *  - facts-driven (stack, now, upstream, shipped): the narrative lives in
 *    data/facts.json, and every state (merged or open, latest release, repo
 *    visibility, branch existence) and every badge is read live from GitHub.
 *
 * Card images are cache-busted by a content hash, so GitHub's image proxy serves
 * a fresh card as soon as the stats change. A failed fetch keeps the committed
 * block, so one flaky request never blanks the profile.
 */
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'

const USER = process.env.GITHUB_USER || '00xcyd'
const SITE = process.env.PORTFOLIO_URL || 'https://00xcyd.github.io'
const README = 'README.md'
const FACTS = 'data/facts.json'
const PROJECTS = ['<!-- projects:start -->', '<!-- projects:end -->']
const WRITING = ['<!-- writing:start -->', '<!-- writing:end -->']
const ACTIVITY = ['<!-- activity:start -->', '<!-- activity:end -->']
const STACK = ['<!-- stack:start -->', '<!-- stack:end -->']
const NOW = ['<!-- now:start -->', '<!-- now:end -->']
const UPSTREAM = ['<!-- upstream:start -->', '<!-- upstream:end -->']
const SHIPPED = ['<!-- shipped:start -->', '<!-- shipped:end -->']
const EXCLUDE = new Set([USER, `${USER}.github.io`])
const PROJECT_LIMIT = 6
const WRITING_LIMIT = 4
const ACTIVITY_LIMIT = 4
const DISCOVER_DAYS = 180
const DISCOVER_LIMIT = 8
const GROUPS = ['languages', 'frameworks & runtime', 'infrastructure & data']

// Badges for what GitHub reports. A language or topic without an entry here still
// gets a plain badge (languages) or is skipped (topics), never a guessed logo.
const LANGUAGE_BADGES = {
  TypeScript: { group: 'languages', logo: 'typescript', color: '3178C6' },
  JavaScript: { group: 'languages', logo: 'javascript', color: 'F7DF1E', text: 'black' },
  Python: { group: 'languages', logo: 'python', color: '3776AB' },
  Rust: { group: 'languages', logo: 'rust', color: '000000' },
  C: { group: 'languages', logo: 'c', color: '555555' },
  Shell: { group: 'languages', logo: 'gnubash', color: '4EAA25' },
  Ruby: { group: 'languages', logo: 'ruby', color: 'CC342D' },
}
const TOPIC_BADGES = {
  fastapi: { label: 'FastAPI', group: 'frameworks & runtime', logo: 'fastapi', color: '009688' },
  stripe: { label: 'Stripe', group: 'infrastructure & data', logo: 'stripe', color: '635BFF' },
  homebrew: { label: 'Homebrew', group: 'infrastructure & data', logo: 'homebrew', color: 'FBB040', text: 'black' },
  nextjs: { label: 'Next.js', group: 'frameworks & runtime', logo: 'next.js', color: '000000' },
  react: { label: 'React', group: 'frameworks & runtime', logo: 'react', color: '61DAFB', text: 'black' },
  tailwindcss: { label: 'Tailwind CSS', group: 'frameworks & runtime', logo: 'tailwindcss', color: '06B6D4' },
  docker: { label: 'Docker', group: 'infrastructure & data', logo: 'docker', color: '2496ED' },
  kubernetes: { label: 'Kubernetes', group: 'infrastructure & data', logo: 'kubernetes', color: '326CE5' },
  terraform: { label: 'Terraform', group: 'infrastructure & data', logo: 'terraform', color: '7B42BC' },
  postgresql: { label: 'PostgreSQL', group: 'infrastructure & data', logo: 'postgresql', color: '4169E1' },
  vagrant: { label: 'Vagrant', group: 'infrastructure & data', logo: 'vagrant', color: '1563FF' },
  ollama: { label: 'Ollama', group: 'frameworks & runtime', logo: 'ollama', color: '000000' },
}
// Markup and config files are not a stack: they would badge every site and README.
const IGNORED_LANGUAGES = new Set(['HTML', 'CSS', 'Markdown', 'JSON', 'YAML', 'Makefile', 'Dockerfile', 'Batchfile', 'TeX', 'SCSS'])
const LANGUAGE_SHARE_MIN = 0.01

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USER}-profile-readme`,
  'X-GitHub-Api-Version': '2022-11-28',
}
if (token) headers.Authorization = `Bearer ${token}`

const today = () => new Date().toISOString().slice(0, 10)

function cell(text) {
  return String(text || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

function absolute(url) {
  return url.startsWith('http') ? url : `${SITE}${url}`
}

/** GET a JSON resource. A 404 is a normal answer here (null); other failures throw. */
async function get(url) {
  const res = await fetch(url, { headers })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function required(url) {
  const data = await get(url)
  if (data === null) throw new Error(`not found: ${url}`)
  return data
}

async function fetchRepos() {
  const raw = await required(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`)
  return raw.filter(repo => !repo.fork && !repo.archived && !EXCLUDE.has(repo.name))
}

/** The repos pinned on the profile, in pin order. The pins are the account owner's own curation. */
async function fetchPinned() {
  if (!token) return []
  const query = `query($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name } } }
    }
  }`
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for graphql pinnedItems`)
  const json = await res.json()
  return (json.data?.user?.pinnedItems?.nodes || []).map(node => node?.name).filter(Boolean)
}

async function fetchProjects() {
  const [repos, pinned] = await Promise.all([fetchRepos(), fetchPinned().catch(() => [])])
  const rank = new Map(pinned.map((name, index) => [name, index]))
  // pinned repos first in pin order, then the newest pushes: the table shows the
  // flagship work even when a burst of new repos is the most recent activity
  return repos
    .sort((a, b) => {
      const pinnedA = rank.has(a.name)
      const pinnedB = rank.has(b.name)
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1
      if (pinnedA && pinnedB) return rank.get(a.name) - rank.get(b.name)
      return b.pushed_at.localeCompare(a.pushed_at)
    })
    .slice(0, PROJECT_LIMIT)
    .map(repo => {
      const stars = repo.stargazers_count > 0 ? `★ ${repo.stargazers_count}` : ''
      const stack = repo.language ? `\`${repo.language}\`` : ''
      return `| **[${repo.name}](${repo.html_url})** | ${cell(repo.description) || '—'} | ${stack} | ${stars} |`
    })
}

async function fetchActivity() {
  const res = await fetch(`${SITE}/activity.json`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${SITE}/activity.json`)
  const { activity } = await res.json()

  return (activity || []).slice(0, ACTIVITY_LIMIT).map(event => {
    const day = String(event.at).slice(0, 10)
    return `- [${cell(event.title)}](${event.url}) · \`${day}\``
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

/** Bytes per language across the public repos: the same data the top-languages card uses. */
async function languageShares(repos) {
  const shares = new Map()
  const rows = await Promise.all(
    repos.map(repo => get(`https://api.github.com/repos/${USER}/${repo.name}/languages`).catch(() => null)),
  )
  for (const row of rows) {
    for (const [language, bytes] of Object.entries(row || {})) {
      shares.set(language, (shares.get(language) || 0) + bytes)
    }
  }
  return shares
}

function buildStack({ repos, shares, extras }) {
  const entries = []
  const seen = new Set()
  const add = entry => {
    const key = entry.label.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    entries.push(entry)
  }

  // a language counts when a public repo is written in it, or when it is a real share of the bytes
  const primary = new Set(repos.map(repo => repo.language).filter(Boolean))
  const total = [...shares.values()].reduce((sum, bytes) => sum + bytes, 0) || 1
  for (const [language, bytes] of [...shares.entries()].sort((a, b) => b[1] - a[1])) {
    if (IGNORED_LANGUAGES.has(language)) continue
    if (!primary.has(language) && bytes / total < LANGUAGE_SHARE_MIN) continue
    add({ label: language, group: 'languages', color: '555555', ...LANGUAGE_BADGES[language] })
  }
  for (const repo of repos) {
    for (const topic of repo.topics || []) {
      if (TOPIC_BADGES[topic]) add({ ...TOPIC_BADGES[topic] })
    }
  }
  for (const extra of extras) add({ ...extra })
  return entries
}

function badge({ label, logo, color, text }) {
  const shield = encodeURIComponent(label).replace(/-/g, '--')
  const query = ['style=flat-square']
  if (logo) query.push(`logo=${encodeURIComponent(logo)}`, `logoColor=${text === 'black' ? 'black' : 'white'}`)
  return `<img alt="${label}" src="https://img.shields.io/badge/-${shield}-${color}?${query.join('&')}" />`
}

function renderStack(entries) {
  const out = []
  for (const group of GROUPS) {
    const items = entries.filter(entry => entry.group === group)
    if (items.length === 0) continue
    out.push(`<p><strong>${group.replace(/&/g, '&amp;')}</strong></p>`, '', `<p>${items.map(badge).join(' ')}</p>`, '')
  }
  return out.join('\n').trimEnd()
}

function upstreamStatus(item, data) {
  if (item.kind === 'pull') {
    if (data.merged_at) return '**merged**'
    return data.state === 'open' ? 'open' : 'closed without merge'
  }
  if (data.state === 'open') return data.state_reason === 'reopened' ? 'reopened' : 'open'
  return data.state_reason === 'not_planned' ? 'closed as not planned' : '**closed**'
}

async function resolveUpstream(items) {
  return Promise.all(
    items.map(async item => {
      const url = `https://github.com/${item.repo}/${item.kind === 'pull' ? 'pull' : 'issues'}/${item.number}`
      try {
        const path = item.kind === 'pull' ? 'pulls' : 'issues'
        const data = await required(`https://api.github.com/repos/${item.repo}/${path}/${item.number}`)
        return { ...item, url, status: upstreamStatus(item, data) }
      } catch (err) {
        console.warn(`[readme] upstream ${item.repo}#${item.number}: ${err.message}`)
        return { ...item, url, status: 'state unavailable' }
      }
    }),
  )
}

/**
 * Every public PR and issue the account opened outside its own repos, found by search,
 * so new upstream work appears without a manual edit. Curated rows win; this list
 * only adds what is not already in the table, and facts.upstreamIgnore hides the rest.
 */
async function discoverUpstream(curated, ignore) {
  const since = new Date(Date.now() - DISCOVER_DAYS * 864e5).toISOString().slice(0, 10)
  const query = encodeURIComponent(`author:${USER} -user:${USER} is:public created:>=${since}`)
  const data = await required(`https://api.github.com/search/issues?q=${query}&sort=updated&order=desc&per_page=50`)
  const skip = new Set([...curated.map(item => `${item.repo}#${item.number}`), ...ignore].map(key => key.toLowerCase()))
  return data.items
    .map(item => ({
      repo: item.repository_url.replace('https://api.github.com/repos/', ''),
      number: item.number,
      url: item.html_url,
      title: item.title,
      status: discoveredStatus(item),
    }))
    .filter(item => !skip.has(`${item.repo}#${item.number}`.toLowerCase()))
    .slice(0, DISCOVER_LIMIT)
}

function discoveredStatus(item) {
  if (item.pull_request) {
    if (item.pull_request.merged_at) return '**merged**'
    return item.state === 'open' ? 'open' : 'closed without merge'
  }
  if (item.state === 'open') return item.state_reason === 'reopened' ? 'reopened' : 'open'
  return item.state_reason === 'not_planned' ? 'closed as not planned' : '**closed**'
}

function renderUpstream(items, reviewed, discovered) {
  const lines = [
    '| repo | report | outcome |',
    '|---|---|---|',
    ...items.map(item => `| **[${item.repo} #${item.number}](${item.url})** | ${cell(item.report)} | ${item.status} — ${cell(item.outcome)} |`),
  ]
  if (discovered.length) {
    lines.push(
      '',
      `**also opened upstream** · found by search in the last ${DISCOVER_DAYS} days`,
      '',
      ...discovered.map(item => {
        const title = cell(item.title)
        const short = title.length > 110 ? `${title.slice(0, 107).trimEnd()}…` : title
        return `- [${item.repo} #${item.number}](${item.url}) — ${short} · ${item.status}`
      }),
    )
  }
  lines.push('', `<sub>states read live from GitHub on ${today()} · narrative last reviewed ${reviewed || 'never'}.</sub>`)
  return lines.join('\n')
}

async function resolveShipped(items) {
  return Promise.all(
    items.map(async item => {
      const release = await get(`https://api.github.com/repos/${item.repo}/releases/latest`).catch(() => null)
      return {
        ...item,
        tag: release?.tag_name || '',
        date: (release?.published_at || '').slice(0, 10),
        releaseUrl: release?.html_url || '',
      }
    }),
  )
}

function renderShipped(items) {
  const blocks = []
  for (const item of items) {
    const release = item.tag ? `released ${item.date} · [release notes](${item.releaseUrl})` : 'no release yet'
    const write = item.writeup ? ` · [write-up](${item.writeup})` : ''
    blocks.push(
      `**${item.label}${item.tag ? ` ${item.tag}` : ''}** — ${item.summary} · ${release} · [source](https://github.com/${item.repo})${write}`,
    )
    if (item.detail) blocks.push(item.detail)
  }
  return blocks.join('\n\n')
}

async function resolveNow(items) {
  return Promise.all(
    items.map(async item => {
      if (!item.repo) return { ...item }
      const repo = await get(`https://api.github.com/repos/${item.repo}`).catch(() => null)
      const branch = item.branch
        ? await get(`https://api.github.com/repos/${item.repo}/branches/${item.branch}`).catch(() => null)
        : true
      return {
        ...item,
        // a repo that does not answer publicly is treated as private: no link to it
        isPrivate: repo ? repo.private : true,
        url: repo?.html_url || `https://github.com/${item.repo}`,
        branchOk: Boolean(branch),
      }
    }),
  )
}

function renderNow(items) {
  return items
    .map(item => {
      const named = item.repo && !item.isPrivate ? `**[${item.title}](${item.url})**` : `**${item.title}**`
      const notes = []
      if (item.repo && item.isPrivate) notes.push('private repo')
      if (item.status && item.branchOk !== false) notes.push(item.status)
      const tail = notes.length ? ` (${notes.join(', ')})` : ''
      const link = item.link ? ` [${item.linkLabel}](${item.link})` : ''
      return `${named}${tail} — ${item.text}${link}`
    })
    .join('\n\n')
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

/** Card images carry a hash of their content, so a changed card gets a fresh URL. */
async function refreshCardStamps(readme) {
  const names = [...new Set([...readme.matchAll(/assets\/[\w.-]+\.svg(?=\?v=)/g)].map(match => match[0]))]
  let out = readme
  for (const name of names) {
    const hash = createHash('sha1').update(await fs.readFile(name)).digest('hex').slice(0, 10)
    out = out.replace(new RegExp(`${name.replace(/\./g, '\\.')}\\?v=[\\w:.-]+`, 'g'), `${name}?v=${hash}`)
  }
  return out
}

async function main() {
  let readme = await fs.readFile(README, 'utf8')
  let changed = false

  const facts = await fs
    .readFile(FACTS, 'utf8')
    .then(text => JSON.parse(text))
    .catch(err => {
      console.warn(`[readme] facts unavailable, facts-driven blocks kept: ${err.message}`)
      return null
    })

  // Each block is independent: a failed fetch keeps the committed section rather
  // than failing the whole sync.
  const section = async (name, markers, build) => {
    try {
      const { body, log } = await build()
      const result = replaceBlock(readme, markers, body)
      if (!result) throw new Error(`markers ${markers.join(' / ')} not found`)
      readme = result.updated
      changed = changed || result.changed
      console.log(`[readme] ${name}: ${log}`)
    } catch (err) {
      console.warn(`[readme] ${name} skipped: ${err.message}`)
    }
  }

  await section('projects', PROJECTS, async () => {
    const rows = await fetchProjects()
    const body = [
      '| project | what it does | stack | |',
      '|---|---|---|---|',
      ...rows,
      '',
      `<sub>auto-synced from GitHub on ${today()} — pinned repos first, then the newest pushes. Change the pins and descriptions on GitHub, not here.</sub>`,
    ].join('\n')
    return { body, log: `${rows.length} repos` }
  })

  await section('writing', WRITING, async () => {
    const bullets = await fetchWriting()
    return { body: bullets.join('\n'), log: `${bullets.length} posts` }
  })

  await section('activity', ACTIVITY, async () => {
    const bullets = await fetchActivity()
    return { body: bullets.join('\n'), log: `${bullets.length} events` }
  })

  if (facts) {
    await section('stack', STACK, async () => {
      const repos = await fetchRepos()
      const shares = await languageShares(repos)
      const entries = buildStack({ repos, shares, extras: facts.stack?.extra || [] })
      return { body: renderStack(entries), log: `${entries.length} badges` }
    })

    await section('now', NOW, async () => {
      const items = await resolveNow(facts.now || [])
      return { body: renderNow(items), log: `${items.length} entries` }
    })

    await section('upstream', UPSTREAM, async () => {
      const items = await resolveUpstream(facts.upstream || [])
      // a failed search skips the whole block (the committed rows stay) rather than
      // rewriting it without its discovered list
      const discovered = await discoverUpstream(facts.upstream || [], facts.upstreamIgnore || [])
      return {
        body: renderUpstream(items, facts.reviewed, discovered),
        log: `${items.length} curated, ${discovered.length} discovered`,
      }
    })

    await section('shipped', SHIPPED, async () => {
      const items = await resolveShipped(facts.shipped || [])
      return { body: renderShipped(items), log: `${items.length} entries` }
    })
  }

  const stamped = await refreshCardStamps(readme).catch(err => {
    console.warn(`[readme] card stamps skipped: ${err.message}`)
    return readme
  })
  if (stamped !== readme) {
    readme = stamped
    changed = true
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
