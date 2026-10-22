export type ProjectCategory = 'security' | 'infrastructure' | 'full-stack' | 'tooling'

export interface Project {
  id: string
  name: string
  category: ProjectCategory
  description: string
  stack: string[]
  github?: string
  live?: string
  featured?: boolean
}

export const projects: Project[] = [
  {
    id: 'txn-agent',
    name: 'txn-agent',
    category: 'full-stack',
    description:
      'safety-first transaction layer for purchasing agents: deterministic policy gate, human approvals loop, idempotent checkout. designed so an autonomous buyer can stall, not spend.',
    stack: ['Python', 'policy engine', 'idempotency keys'],
    github: 'https://github.com/cyberd4ch/txn-agent',
    featured: true,
  },
  {
    id: 'cportscan',
    name: 'cportscan',
    category: 'security',
    description:
      'fast, lightweight port scanner in c. raw sockets + multithreaded sweeps enumerate open ports with minimal overhead — built to understand the probes nmap ships.',
    stack: ['C', 'POSIX sockets', 'pthreads'],
    github: 'https://github.com/cyberd4ch/cportscan',
    featured: true,
  },
  {
    id: 'stride-tmr',
    name: 'stride-tmr',
    category: 'security',
    description:
      'stride threat modelling with pytm. turn architecture into dataflow diagrams, enumerate threats per element, and export findings engineers can act on.',
    stack: ['Python', 'pytm', 'STRIDE'],
    github: 'https://github.com/cyberd4ch/stride-tmr',
    featured: true,
  },
  {
    id: 'atlas',
    name: 'atlas',
    category: 'infrastructure',
    description:
      'pan-african maps platform with self-learning, self-improving features. geodata pipelines + progressive feedback loops.',
    stack: ['TypeScript', 'geodata', 'self-tuning features'],
    github: 'https://github.com/cyberd4ch/atlas',
    featured: false,
  },
  {
    id: 'free-torrent-cli',
    name: 'free-torrent-cli',
    category: 'tooling',
    description:
      'simple torrent client for the terminal built on node.js. stream progress, manage peers, no gui.',
    stack: ['Node.js', 'webtorrent', 'CLI'],
    github: 'https://github.com/cyberd4ch/free-torrent-cli',
    featured: false,
  },
  {
    id: 'openpostings',
    name: 'OpenPostings',
    category: 'full-stack',
    description:
      'the open-source ATS aggregator — job postings pulled out of walled gardens into one queryable feed.',
    stack: ['JavaScript', 'scraping pipeline', 'open data'],
    github: 'https://github.com/cyberd4ch/OpenPostings',
    featured: false,
  },
  {
    id: 'pluto-fm',
    name: 'pluto.fm',
    category: 'full-stack',
    description:
      'community-powered music discovery: rate albums, write threaded micro-reviews, follow tastemakers. full lab — vagrant qemu hosts, hasura graph, next.js app, playwright suite. private: demo on request.',
    stack: ['Next.js 16', 'Hasura', 'PostgreSQL', 'Docker'],
    featured: true,
  },
  {
    id: 'cipher',
    name: 'Enhanced-Caeser-Cipher',
    category: 'tooling',
    description:
      'classical crypto with reinforcement: layered substitutions + key hardening, built while studying cryptographic primitives from first principles.',
    stack: ['encryption', 'cryptography basics'],
    github: 'https://github.com/cyberd4ch/Enhanced-Caeser-Cipher',
    featured: false,
  },
]

export const categories: ProjectCategory[] = ['security', 'full-stack', 'infrastructure', 'tooling']
