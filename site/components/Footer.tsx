export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-6 font-mono text-xs text-muted">
        <span>
          cyber<span className="text-[var(--accent)]">.dach</span> © {new Date().getFullYear()} — built
          with next.js + tailwind, designed from scratch
        </span>
        <a href="mailto:cyberdachh@proton.me" className="transition-colors hover:text-[var(--accent)]">
          cyberdachh@proton.me ↗
        </a>
      </div>
    </footer>
  )
}
