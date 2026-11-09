<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/mark-light.svg" />
    <img src="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/mark.svg" width="30" height="30" alt="" align="top" />
  </picture>
  cyber.dach
</h1>

<br>

<div align="center">
  <a href="https://github.com/cyberd4ch"><img alt="github" src="https://img.shields.io/badge/GitHub-%40cyberd4ch-14161c?style=flat-square&logo=github&logoColor=22d3ee" /></a>
  <a href="mailto:cyberdachh@proton.me"><img alt="email" src="https://img.shields.io/badge/Email-cyberdachh%40proton.me-14161c?style=flat-square&logo=protonmail&logoColor=22d3ee" /></a>
  <a href="https://cyberd4ch.github.io/"><img alt="portfolio" src="https://img.shields.io/badge/Portfolio-cyberd4ch.github.io-14161c?style=flat-square&logo=githubpages&logoColor=22d3ee" /></a>
  <a href="https://github.com/sponsors/cyberd4ch"><img alt="sponsor" src="https://img.shields.io/badge/Sponsor-%40cyberd4ch-ea4aaa?style=flat-square&logo=githubsponsors&logoColor=white" /></a>
</div>

<br>

<div align="center">

<p><strong>languages</strong></p>

<p><img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript" /> <img alt="JavaScript" src="https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" /> <img alt="Python" src="https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white" /> <img alt="Rust" src="https://img.shields.io/badge/-Rust-000000?style=flat-square&logo=rust" /> <img alt="C" src="https://img.shields.io/badge/-C-555555?style=flat-square&logo=c&logoColor=white" /></p>

<p><strong>frameworks &amp; runtime</strong></p>

<p><img alt="React" src="https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black" /> <img alt="Next.js" src="https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js" /> <img alt="Node.js" src="https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white" /></p>

<p><strong>infrastructure &amp; data</strong></p>

<p><img alt="PostgreSQL" src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" /> <img alt="Hasura" src="https://img.shields.io/badge/-Hasura-1571DA?style=flat-square&logo=hasura&logoColor=white" /> <img alt="Docker" src="https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" /> <img alt="Kubernetes" src="https://img.shields.io/badge/-Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white" /> <img alt="Terraform" src="https://img.shields.io/badge/-Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white" /> <img alt="AWS" src="https://img.shields.io/badge/-AWS-FF9900?style=flat-square&logo=amazonwebservices&logoColor=white" /> <img alt="Vagrant" src="https://img.shields.io/badge/-Vagrant-1563FF?style=flat-square&logo=vagrant&logoColor=white" /> <img alt="RF/LAN/WAN" src="https://img.shields.io/badge/-RF%20%2F%20LAN%20%2F%20WAN-1589F6?style=flat-square&logo=enable&logoColor=white" /></p>

</div>

<br>

<p align="center">
  <img src="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/github-stats.svg?v=2026-11-09" width="48%" alt="GitHub Stats" />
  <img src="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/streak.svg?v=2026-11-09" width="48%" alt="Streak" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/contributions.svg?v=2026-11-09" width="96%" alt="Contribution activity" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/top-languages.svg?v=2026-11-09" width="48%" alt="Top Languages" />
  <img src="https://raw.githubusercontent.com/cyberd4ch/cyberd4ch/main/assets/repos.svg?v=2026-11-09" width="48%" alt="Top repositories" />
</p>

<br>

## Projects

<!-- projects:start -->
| project | what it does | stack | |
|---|---|---|---|
| **[free-torrent-cli](https://github.com/cyberd4ch/free-torrent-cli)** | A BitTorrent client in one ~3 MB Rust binary: full CLI, local web UI, prebuilt for macOS, Linux and Windows. | `Rust` | ★ 2 |
| **[txn-agent](https://github.com/cyberd4ch/txn-agent)** | Safety-first transaction layer for purchasing agents: deterministic policy gate, human approvals, idempotent checkout | `Python` | ★ 2 |
| **[stride-tmr](https://github.com/cyberd4ch/stride-tmr)** | STRIDE threat modelling with pytm | `Python` |  |
| **[cportscan](https://github.com/cyberd4ch/cportscan)** | A simple port scanner built with C | `HTML` |  |
| **[dns-watch](https://github.com/cyberd4ch/dns-watch)** | dnswatch — a small, dependency-free DNS drift watcher (cron + plain-text log). Free forever. | `Shell` |  |

<sub>auto-synced from GitHub on 2026-11-09 — edit the repo description, not this table.</sub>
<!-- projects:end -->

<br>

## Recently shipped

**Footorrent 3.5.0** — rebuilding the magnet path end to end. Metadata is now fetched and
verified before anything touches disk, so the window shows the real name, size and file list,
then asks where to save. Along the way: a BEP 10 reply read from the wrong extension id, a
handshake that rejected peers for routine chatter, and a download that re-announced to the
magnet's own dead tracker list instead of using the 200-plus peers resolve had already found.
Dead announce lists fall back to public trackers, peers are sampled in parallel batches, and
the UI shows per-peer rates, a tracker-fallback note and a retry button.

Measured on a magnet whose own trackers were all dead: resolve in 17–42 s, 129,302,391 bytes
and 11 files reported before writing, then 917 KB downloaded in the first minute across 6 peers.

→ [Source](https://github.com/cyberd4ch/free-torrent-cli) · [Release notes](https://github.com/cyberd4ch/free-torrent-cli/blob/main/CHANGELOG.md)

<br>

## In the lab

Practice work that runs on a real machine, not in a slide deck. Every lab carries its own
README — goal, run steps, teardown, and an exercise log of what was actually executed,
including the parts that failed first.

| lab | what it taught me | state |
|---|---|---|
| **three-tier on Compose** | nginx → Flask → Postgres, one published port, secrets in a gitignored `.env` | running |
| **the same app on kind** | Deployments, Services, a replicated API, Postgres in-cluster; a `KeyError` crashloop and the secret that is a bag of keys | green |
| **observability layer** | metrics-server, kube-state-metrics, Prometheus, Grafana, postgres-exporter; an alert fired on purpose with a crash pod, then resolved itself after deletion | 0 firing |
| **Terraform, Docker provider** | plan before apply, state as the source of truth, drift and `import` made visible, a `destroy` that leaves nothing | exercises 1–5 |
| **remote state** | state migrated to S3 with SSE, versioning and `use_lockfile` locking; a planted lock object made a second operation refuse to start | done |
| **provider swap** | a bucket and its versioning declared with `hashicorp/aws` — same verbs, different graph; drift introduced by hand, repaired by `apply` | done |

Access for all of it is scoped: a dedicated IAM user limited to `arn:aws:s3:::ftc-labs-*`,
with **no root access keys anywhere**, and the policy proven against a denied request
instead of assumed.

<br>

## Blog

<!-- writing:start -->
- **[magnets that actually work: three wire bugs, a dead tracker list, and 917 KB that finally moved](https://cyberd4ch.github.io/blog/footorrent-3-5-0-magnets-that-work/)** — footorrent 3.5.0 — metadata before disk, a bep 10 reply read from the wrong mailbox, peers discarded at the start line, and the measured numbers after the fix.
- **[from a form to a download manager: categories, drag-and-drop, and a window that lets go](https://cyberd4ch.github.io/blog/from-form-to-download-manager/)** — rebuilding the ftc page as a download manager — one 69 KB page in both the browser and the macOS window, batch verbs the API had to grow, base64 drag-and-drop, and the SIGTERM that left five servers listening.
- **[three tiers become a module: two stacks, one graph, no collisions](https://cyberd4ch.github.io/blog/three-tiers-become-a-module/)** — lab 04 exercise 8: the same three tiers as a reusable module, instanced twice on 8082 and 8083 — including the readiness wait that caught a green apply serving nothing.
- **[one binary, two interfaces: a web ui and a real window in 3 MB of rust](https://cyberd4ch.github.io/blog/one-binary-two-interfaces/)** — a hand-written http server, html compiled into the binary, cancel and pause moved into the engine, an 87 KB swift window — and the favicon bug that explained why 204 is not an icon.
<!-- writing:end -->

<br>

## Recent

<!-- activity:start -->
- [pushed to cyberd4ch/cyberd4ch](https://github.com/cyberd4ch/cyberd4ch/commits) · `2026-11-08`
- [pushed to cyberd4ch/free-torrent-cli](https://github.com/cyberd4ch/free-torrent-cli/commits) · `2026-11-08`
- [merged pull request #2 in cyberd4ch/free-torrent-cli](https://github.com/cyberd4ch/free-torrent-cli) · `2026-11-08`
- [commented on #2 in cyberd4ch/free-torrent-cli](https://github.com/cyberd4ch/free-torrent-cli/pull/2#issuecomment-6714469689) · `2026-11-07`
<!-- activity:end -->

<br>

## Sponsor

If `dns-watch`, `txn-agent`, or anything else here saves you time, you can fund the work at
**[github.com/sponsors/cyberd4ch](https://github.com/sponsors/cyberd4ch)**. Sponsorship pays
for the lab VMs, API quotas, and the time behind the write-ups.

<br>

## Collaborate 

Open to collaborating at the intersection of **security research, cloud infrastructure,
and full-stack development** — especially projects that involve breaking (and fixing) stuff.

📋 → [cyberdachh@proton.me](mailto:cyberdachh@proton.me)
