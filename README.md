# bor1e.github.io

Personal blog with two perspectives: **Tech** (Architecture, AI, Software Design) and **Lehre** (Tora, Chassidus, Jewish Education).

## Stack

- [Hugo](https://gohugo.io/) 0.158.0 (static site generator)
- GitHub Pages (hosting via GitHub Actions)
- Markdown, AsciiDoc, PlantUML (content formats)

## Structure

```
content/
  tech/          # Architecture & AI posts
  lehre/         # Jewish teaching & learning posts
  about/         # About page
layouts/
  shortcodes/
    plantuml.html  # PlantUML via server API
  _markup/
    render-codeblock-mermaid.html  # Mermaid diagrams
archetypes/
  tech.md        # Template for new tech posts
  lehre.md       # Template for new lehre posts
```

## Development

```bash
hugo server --buildDrafts    # http://localhost:1313
```

## Create Posts

```bash
hugo new content tech/my-post.md       # Markdown tech post
hugo new content lehre/my-post.md      # Markdown lehre post
hugo new content tech/my-post.adoc     # AsciiDoc tech post
```

Set `draft: false` when ready to publish.

## Content Formats

### Markdown (.md)
Standard posts. Supports Mermaid diagrams via fenced code blocks:

````markdown
```mermaid
graph LR
    A --> B
```
````

### AsciiDoc (.adoc)
Technical documentation with richer structure. Requires `asciidoctor` installed locally:

```bash
gem install asciidoctor asciidoctor-diagram
```

### PlantUML
Embedded via shortcode — renders at build time using PlantUML server API:

```
{{</* plantuml */>}}
@startuml
A -> B : message
@enduml
{{</* /plantuml */>}}
```

## Deployment

Push to `main` triggers GitHub Actions workflow that builds and deploys to GitHub Pages. No manual steps needed.

## Dual-Persona Pattern

Same concept as [elyahu.de](https://elyahu.de): one platform, two perspectives. Content is separated by Hugo sections (`/tech/`, `/lehre/`), each with its own visual accent color and taxonomy.
