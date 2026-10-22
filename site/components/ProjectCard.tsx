import { Code2, ArrowUpRight } from 'lucide-react'
import type { Project, ProjectCategory } from '@/lib/projects'

/* on-brand category ramp: the signal-cyan family + one neutral, no rainbow */
const categoryTone: Record<ProjectCategory, string> = {
  security: 'text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_35%,transparent)]',
  'full-stack': 'text-[var(--accent-2)] border-[color-mix(in_srgb,var(--accent-2)_40%,transparent)]',
  infrastructure: 'text-cyan-200/90 border-cyan-700/40',
  tooling: 'text-muted border-line',
}

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article
      className="grain-card rounded-2xl border border-line bg-surface p-6"
      style={{ animationDelay: `${0.08 * (index % 4)}s` }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${categoryTone[project.category]}`}
        >
          {project.category}
        </span>
        {project.featured && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
            ★ featured
          </span>
        )}
      </div>

      <h2 className="font-mono text-lg font-semibold tracking-tight">{project.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="rounded-md border border-line bg-[var(--bg)] px-2 py-0.5 font-mono text-[10px] text-muted"
          >
            {tech}
          </span>
        ))}
      </div>

      {(project.github || project.live) && (
        <div className="mt-4 flex gap-3 font-mono text-xs">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]"
            >
              <Code2 size={13} aria-hidden /> source
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]"
            >
              <ArrowUpRight size={13} aria-hidden /> live
            </a>
          )}
        </div>
      )}
    </article>
  )
}
