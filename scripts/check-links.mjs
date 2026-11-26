#!/usr/bin/env node
/**
 * Verify that every http(s) link in the given files still resolves.
 *
 * A 404 or 410 fails the run: the link is broken for every visitor, which is what a
 * private repo, a renamed repo or a Sponsors page that was never enabled looks like
 * from outside. Timeouts, rate limits and server errors are reported as unverified
 * and do not fail the run, so an overloaded host never turns the profile red.
 */
import fs from 'node:fs/promises'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node scripts/check-links.mjs <file> [file...]')
  process.exit(2)
}

const urls = new Set()
for (const file of files) {
  const text = await fs.readFile(file, 'utf8')
  for (const match of text.matchAll(/https?:\/\/[^\s)"'<>`]+/g)) {
    urls.add(match[0].replace(/[.,;:!?]+$/, ''))
  }
}

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'User-Agent': 'profile-link-check' },
        signal: AbortSignal.timeout(20_000),
      })
      // some hosts refuse HEAD outright; retry those with GET
      if (method === 'HEAD' && [400, 403, 405, 501].includes(res.status)) continue
      await res.body?.cancel()
      return res.status
    } catch (err) {
      if (method === 'GET') return `unreachable (${err.name})`
    }
  }
  return 'unreachable'
}

const list = [...urls]
const results = []
for (let i = 0; i < list.length; i += 6) {
  const batch = list.slice(i, i + 6)
  results.push(...(await Promise.all(batch.map(async url => ({ url, status: await probe(url) })))))
}

const broken = results.filter(r => r.status === 404 || r.status === 410)
const unverified = results.filter(
  r => r.status !== 404 && r.status !== 410 && (typeof r.status !== 'number' || r.status >= 400),
)
for (const r of broken) console.error(`[links] BROKEN ${r.status} ${r.url}`)
for (const r of unverified) console.warn(`[links] unverified ${r.status} ${r.url}`)
console.log(`[links] ${list.length} checked · ${broken.length} broken · ${unverified.length} unverified`)
process.exit(broken.length ? 1 : 0)
