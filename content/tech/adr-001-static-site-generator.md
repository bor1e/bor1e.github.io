---
title: "ADR-001: Choosing a Static Site Generator"
date: 2026-03-22
draft: false
description: "Architecture Decision Record — Why the generator barely matters when your real stack is Markdown, AsciiDoc, and Claude."
tags: ["hugo", "static-site", "architecture", "tooling", "adr"]
categories: ["tech"]
personas: ["tech"]
---

## Status

**Accepted** — March 2026

## Context

This blog serves two audiences from one codebase: software architecture (Tech) and Jewish teaching (Lehre). The authoring workflow matters more than the rendering engine. Posts are written in **Markdown**, **AsciiDoc**, or dictated to **Claude** — then refined, structured, and committed. The generator is a build step, not the product.

Requirements:

- Native Markdown support (all candidates)
- Native AsciiDoc support (eliminates most candidates)
- Diagram embedding — PlantUML, Mermaid, C4
- GitHub Pages deployment with zero infrastructure
- Content sections mapping to URL paths (`/tech/`, `/lehre/`)
- Fast feedback loop — sub-second builds during authoring

## Candidates Considered

### Jekyll

The GitHub Pages default. Ruby-based, mature, massive plugin ecosystem.

- AsciiDoc: via `jekyll-asciidoc` plugin — works, but plugin management adds friction
- Build speed: slow on large sites, Ruby dependency chain
- GitHub Pages: native integration, but locked to an older Jekyll version unless using Actions
- Verdict: **viable but sluggish**, plugin dependency for AsciiDoc is a maintenance tax

### Gatsby

React-based, GraphQL data layer, rich plugin ecosystem.

- AsciiDoc: community plugin, poorly maintained
- Build speed: heavy — node_modules, webpack, GraphQL compilation
- Mental model: designed for dynamic web apps, not document-centric blogs
- Verdict: **wrong tool for the job** — engineering overhead for what is fundamentally a document rendering problem

### Astro

Modern, component-based, "islands" architecture. Rising star.

- AsciiDoc: requires custom integration or `@astrojs/markdoc` workarounds
- Build speed: fast, but Node.js startup cost
- Flexibility: impressive — supports React, Vue, Svelte components
- Verdict: **interesting but over-engineered** for a content-first blog. The component flexibility solves problems this blog doesn't have

### Hugo

Go-based, single binary, opinionated about content organization.

- AsciiDoc: native via `asciidoctor` — first-class, not bolted on
- Build speed: milliseconds. Entire site rebuilds faster than Node.js starts
- Content model: directories map to sections, taxonomies are built-in
- GitHub Pages: official Actions workflow, copy-paste deployment
- Verdict: **the boring choice that just works**

## Decision

**Hugo.**

Not because it's the best technology. Because it's the least interesting technology — and that's the point.

The actual authoring stack is:

```
Brain → Claude → Markdown/AsciiDoc → git push → done
```

Hugo is the `done` part. It converts structured text into HTML and gets out of the way. No dependency trees to manage. No framework concepts to learn. No build configuration to debug at 11pm.

The decision matrix reduced to one question: **which generator adds the least friction between writing and publishing?**

| Criterion | Jekyll | Gatsby | Astro | Hugo |
|---|---|---|---|---|
| AsciiDoc | plugin | plugin (stale) | workaround | native |
| Build speed | seconds | 10s+ seconds | seconds | milliseconds |
| Dependencies | Ruby + gems | Node + npm | Node + npm | single binary |
| Content sections | collections | GraphQL schema | content collections | directories |
| Deployment complexity | low | medium | medium | low |
| Maintenance burden | gem updates | npm audit hell | npm audit hell | near zero |

## Consequences

### Positive

- **Zero JavaScript in production** — static HTML, nothing to hydrate
- **Authoring speed** — new post is `hugo new tech/post-name.md`, write, push
- **AsciiDoc for technical depth** — callouts, tables, includes, admonitions without plugin risk
- **PlantUML/Mermaid via shortcodes** — architecture diagrams live next to prose
- **Claude as co-author works naturally** — the input/output format is plain text files, which is exactly what LLMs handle best

### Negative

- **Go template syntax** — arcane, poorly documented, brutal learning curve for custom layouts
- **No component model** — interactive elements require JavaScript escape hatches
- **Opinionated structure** — Hugo's content organization is powerful but inflexible when it doesn't match your mental model
- **Smaller modern ecosystem** — fewer "starter kits" compared to Astro/Gatsby

### Neutral

- **Theme lock-in is real** — currently using a custom minimal layout, which is both the right call and more work
- **Hugo version pinning matters** — breaking changes between versions are not uncommon

## The Honest Take

Every generator on this list could run this blog. Jekyll would work. Astro would work. Even Gatsby would work, with enough suffering.

The real architecture decision isn't Hugo vs. Astro. It's: **invest complexity budget in the generator, or invest it in the content?**

This blog chose content. Hugo is the infrastructure that disappears.
