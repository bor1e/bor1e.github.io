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

{{< plantuml >}}
@startuml
!include <C4/C4_Context>

Person(user, "Besucher", "Liest Tech- oder Lehre-Inhalte")
System(website, "elyahu.de", "Persönliche Website mit Dual-Persona")
System_Ext(github, "GitHub Pages", "Blog Hosting")
System_Ext(aws, "AWS", "S3 + CloudFront")

Rel(user, website, "besucht", "HTTPS")
Rel(user, github, "liest Blog", "HTTPS")
Rel(website, aws, "hosted auf")
@enduml
{{< /plantuml >}}

## Container Diagram: Blog

{{< plantuml >}}
@startuml
!include <C4/C4_Container>

Person(author, "Autor", "Schreibt Posts in MD/AsciiDoc")
System_Boundary(blog, "Blog") {
  Container(hugo, "Hugo", "Go", "Static Site Generator")
  Container(content, "Content", "MD/AsciiDoc", "Blog Posts in /tech und /lehre")
  Container(gh_actions, "GitHub Actions", "CI/CD", "Build & Deploy Pipeline")
  Container(gh_pages, "GitHub Pages", "CDN", "Statische Auslieferung")
}

Rel(author, content, "schreibt")
Rel(content, hugo, "wird verarbeitet von")
Rel(hugo, gh_actions, "getriggert durch push")
Rel(gh_actions, gh_pages, "deployed nach")
@enduml
{{< /plantuml >}}

## Einbettung in Hugo

PlantUML-Diagramme werden über einen Shortcode eingebettet, der zur Build-Zeit die PlantUML-Server-API aufruft und SVG zurückbekommt. Kein JavaScript im Browser nötig.
