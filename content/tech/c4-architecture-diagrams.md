---
title: "C4 Architekturdiagramme mit PlantUML"
date: 2026-03-22
draft: false
description: "Wie ich C4-Modelle für Architekturentscheidungen nutze — und wie sie in Hugo-Posts eingebettet werden."
tags: ["architecture", "c4-model", "plantuml", "documentation"]
categories: ["tech"]
personas: ["tech"]
---

## Warum C4?

Das C4-Modell von Simon Brown strukturiert Architekturdiagramme in vier Abstraktionsebenen:

1. **Context** — System und seine Umgebung
2. **Container** — Technische Bausteine
3. **Component** — Interne Struktur eines Containers
4. **Code** — Klassenebene (selten nötig)

## Context Diagram: elyahu.de

```mermaid
flowchart TB
    user([Besucher\nLiest Tech- oder Lehre-Inhalte])
    website[elyahu.de\nPersönliche Website mit Dual-Persona]
    github[GitHub Pages\nBlog Hosting]
    aws[AWS · S3 + CloudFront]

    user -->|besucht, HTTPS| website
    user -->|liest Blog, HTTPS| github
    website -->|hosted auf| aws
```

## Container Diagram: Blog

```mermaid
flowchart LR
    author([Autor\nSchreibt Posts in MD/AsciiDoc])

    subgraph blog[Blog]
        content[Content\nMD/AsciiDoc]
        hugo[Hugo\nGo · Static Site Generator]
        gh_actions[GitHub Actions\nCI/CD · Build & Deploy]
        gh_pages[GitHub Pages\nCDN · Statische Auslieferung]
    end

    author -->|schreibt| content
    content -->|wird verarbeitet von| hugo
    hugo -->|push triggert| gh_actions
    gh_actions -->|deployed nach| gh_pages
```

## Einbettung in Hugo

Die Diagramme werden als Mermaid-Codeblöcke eingebettet und rendern client-seitig im Browser — kein externer Server, kein Netzwerkaufruf beim Build.
