import Link from 'next/link'
import { Terminal, MapPin, Zap } from 'lucide-react'
import { projects } from '@/lib/projects'

const heroLines = [
  '$ whoami',
  'cyber.dach — telecom engineer → full-stack dev → security researcher',
  '$ grep focus stack.log',
  'typescript · next.js · hasura · docker · rf-to-cloud networking',
  '$ tail -f thesis.log',
  'npm supply-chain breaches: how dependency trees become liabilities',
]

export default function HomePage() {
  const featured = projects.filter((p) => p.featured)

  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-14 md:pt-20">
      {/* hero */}
      <section className="stagger">
        <p className="mb-2 flex items-center gap-2 font-mono text-xs text-muted">
          <MapPin size={12} aria-hidden /> accra, ghana — reserved-frequencies welcome
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          telecom wiring meets
          <br />
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
            secure code
          </span>
        </h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted">
          I&nbsp;build systems across the stack — Next.js/TypeScript apps, C tooling, python security
          research — and deploy them into containers &amp; VMs to learn what breaks, and why. Physical
          layer up to cloud: if it moves bits, I want to know where they leak. 📡
        </p>
      </section>

      {/* terminal */}
      <section className="mt-10">
        <div className="rounded-2xl border border-line bg-surface shadow-[0_20px_60px_-30px_var(--glow)]">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <Terminal size={11} aria-hidden /> bash — 80×24
            </span>
          </div>
          <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
            {heroLines.map((line, i) => (
              <p key={i} className={line.startsWith('$') ? 'text-[var(--accent-2)]' : 'text-fg'}>
                {line}
                {i === heroLines.length - 1 && (
                  <span className="ml-1 inline-block h-4 w-2 animate-pulse-dot bg-[var(--accent)] align-middle" />
                )}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* featured */}
      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Zap size={17} className="text-[var(--accent)]" aria-hidden /> featured builds
          </h2>
          <Link
            href="/projects"
            className="font-mono text-xs text-muted transition-colors hover:text-[var(--accent)]"
          >
            all projects →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <a
              key={p.id}
              href={p.github ?? (p.id === 'pluto-fm' ? 'mailto:cyberdachh@proton.me' : '#')}
              target={p.github ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="grain-card group rounded-2xl border border-line bg-surface p-5"
            >
              <h3 className="font-mono text-base font-semibold transition-colors group-hover:text-[var(--accent)]">
                {p.name}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{p.description}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-2)]">
                {p.stack.slice(0, 3).join(' · ')}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* research + connect */}
      <section className="stagger mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            research focus
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Master&apos;s thesis in progress: real-world <strong className="text-fg">npm
            supply-chain breach</strong> post-mortems, mapped onto what a CI pipeline{' '}
            <em>should</em> have caught — turning incident reports into prevention systems.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--accent-2)]">
            open signal
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Open to collaborating at the intersection of security research, cloud infrastructure
            and full-stack development — especially projects that involve breaking (and fixing)
            stuff.
          </p>
          <a
            href="mailto:cyberdachh@proton.me"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs transition-colors hover:text-[var(--accent)]"
          >
            cyberdachh@proton.me ↗
          </a>
        </div>
      </section>
    </div>
  )
}
