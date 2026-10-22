'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

/** cyberdach antenna-cabin mark — geometry audited against the 256 grid,
 *  ink follows currentColor, the signal follows the cyan token. */
function CabinMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox='0 0 256 256' fill='none' className={className} aria-hidden='true'>
      <path
        fill='currentColor'
        fillRule='evenodd'
        d='M36,224 L36,96 L68,96 L124,40 L180,96
      A64,64 0 0 1 180,224 L36,224 Z
      M68,126 L124,80 L164,120 A35,35 0 0 1 164,190 L68,190 Z'
      />
      <rect x='119' y='18' width='10' height='22' fill='var(--accent)' />
      <circle cx='124' cy='12' r='6' fill='var(--accent)' />
    </svg>
  )
}

const links = [
  { href: '/', label: 'index' },
  { href: '/projects', label: 'projects' },
]

export default function Nav() {
  const path = usePathname()
  const [light, setLight] = useState(false)

  useEffect(() => {
    setLight(document.documentElement.dataset.theme === 'light')
  }, [])

  const toggleTheme = () => {
    const next = !light
    document.documentElement.dataset.theme = next ? 'light' : 'dark'
    try {
      localStorage.setItem('cd-theme', next ? 'light' : 'dark')
    } catch {}
    setLight(next)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[var(--bg)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium">
          <CabinMark className="h-[18px] w-[18px] text-fg" />
          cyber<span className="text-[var(--accent)]">.dach</span>
        </Link>
        <div className="flex items-center gap-1 font-mono text-xs">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className={`rounded-full px-3 py-1.5 transition-colors hover:text-[var(--accent)] ${
                path === href ? 'bg-surface text-[var(--accent)]' : 'text-muted'
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/cyberd4ch"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-[var(--accent)]"
          >
            github ↗
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {light ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </nav>
    </header>
  )
}
