---
title: "ADR-002: Documenting and Highlighting Blog Post Revisions"
date: 2026-07-26
draft: false
description: "Architecture Decision Record — Why and how we track and highlight blog post revisions using markdown footnotes."
tags: ["blog", "documentation", "revisions", "adr"]
categories: ["tech"]
personas: ["tech"]
---

## Status

**Accepted** — July 2026

## Context

Technical posts on AI agents, LLM workflows, and developer tooling evolve rapidly. When new tools emerge or established scripts are refactored, existing blog posts need to be updated. 

However, readers should be able to:
1. Distinguish between the original content of a post and subsequent revisions.
2. View the exact date and commit hash of a revision to verify changes against the git history.
3. Read the post without their attention being disrupted by loud, inline update banners (e.g., "[Update 24-07-2025 asda23c]").

## Decision

We will use standard markdown footnotes (`[^1]`) at the specific points of revision to document updates in a subtle, non-intrusive way. 

The footnotes will be defined at the bottom of the markdown files using the following format:
```markdown
[^1]: Update DD.MM.YYYY (Commit <hash>): <Brief description of the change>.
```

## Consequences

### Positive

- **Transparency**: Readers can trace the history of code changes and tool updates directly in the text.
- **Minimalist Aesthetic**: Footnotes keep the prose clean and maintain the visual design of the site without adding distracting update banners.
- **Traceability**: Direct mapping to commit hashes enables quick cross-referencing with the GitHub repository.

### Negative

- **Maintenance**: Adding footnotes requires manual lookup of commit hashes and dates during edits.
