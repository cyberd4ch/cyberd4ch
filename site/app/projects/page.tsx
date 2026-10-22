import { projects } from '@/lib/projects'
import ProjectCard from '@/components/ProjectCard'

const allCategories = ['all', 'security', 'full-stack', 'infrastructure', 'tooling'] as const

export default function ProjectsPage() {
  const sections = allCategories.map((cat) => ({
    cat,
    items: cat === 'all' ? projects : projects.filter((p) => p.category === cat),
  }))

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-14 md:pt-20">
      <section className="stagger">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          the <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">workbench</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Scanners, threat-modelling kits, transaction safety layers, maps platforms — everything
          here is public, buildable, and built to teach me something new.
        </p>
      </section>

      <div className="mt-12 space-y-12">
        {sections
          .filter((s) => s.items.length > 0)
          .map(({ cat, items }) => (
            <section key={cat}>
              <h2 className="mb-4 border-b border-line pb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {cat === 'all' ? 'everything' : cat}
                <span className="ml-2 text-[var(--accent)]">{items.length}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
