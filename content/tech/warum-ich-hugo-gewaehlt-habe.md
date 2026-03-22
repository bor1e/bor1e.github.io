---
title: "Warum ich Hugo für meinen Blog gewählt habe"
date: 2026-03-22
draft: false
description: "Ein Vergleich von Static Site Generators — und warum Hugo für einen Dual-Persona-Blog die richtige Wahl ist."
tags: ["hugo", "static-site", "architecture", "tooling"]
categories: ["tech"]
personas: ["tech"]
---

## Anforderungen

Für diesen Blog brauchte ich:

- **Markdown** für schnelle Beiträge
- **AsciiDoc** für technische Dokumentation mit mehr Struktur
- **PlantUML** für Architekturdiagramme
- **GitHub Pages** Hosting — kostenlos, zero-infra
- **Zwei Bereiche** — Tech und Lehre unter einem Dach

## Die Kandidaten

| Generator | Markdown | AsciiDoc | PlantUML | GitHub Pages |
|-----------|----------|----------|----------|--------------|
| Hugo      | nativ    | nativ    | Shortcode | offiziell    |
| Astro     | nativ    | Plugin   | Plugin   | Adapter      |
| Zola      | nativ    | nein     | nein     | manuell      |

## Entscheidung

Hugo gewinnt durch:

1. **Native AsciiDoc-Unterstützung** — kein Plugin-Management
2. **Content Sections** — `content/tech/` und `content/lehre/` mappen direkt auf URLs
3. **Build-Geschwindigkeit** — Millisekunden, nicht Sekunden
4. **Offizieller GitHub Actions Workflow** — copy-paste fertig

## PlantUML Integration

PlantUML läuft über einen Shortcode, der die öffentliche PlantUML-API nutzt:

{{< plantuml >}}
@startuml
actor User
User -> Blog : reads post
Blog -> Hugo : builds static HTML
Hugo -> GitHub : deploys via Actions
GitHub -> CDN : serves to User
@enduml
{{< /plantuml >}}

## Mermaid für einfache Diagramme

Für schnelle Flowcharts nutze ich Mermaid — direkt im Markdown:

```mermaid
graph LR
    A[Write Post] --> B[git push]
    B --> C[GitHub Actions]
    C --> D[Hugo Build]
    D --> E[GitHub Pages]
```

## Fazit

Hugo ist kein hippes Framework. Es ist ein ausgereiftes, schnelles Werkzeug, das genau das tut, was es soll.
