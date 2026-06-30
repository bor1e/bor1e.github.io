---
title: "Von Vibe zu Harness: Warum sich dasselbe Claude-Modell wie zwei verschiedene Werkzeuge verhält"
date: 2026-06-29
draft: false
description: "Vibe Coding und Agentic Programming nutzen dasselbe Modell — aber ein völlig anderes System drumherum. Der Unterschied liegt nicht in der KI, sondern darin, wer die Verantwortung für den Code trägt."
tags: ["claude-code", "agentic-programming", "vibe-coding", "CLAUDE.md", "ai-tooling", "harness"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 1
---

> *„Vibe Coding ist, was du machst, wenn die Kosten eines fehlerhaften Codes niedriger sind als die Kosten, ihn zu reviewen. Agentic Programming ist, was du machst, wenn das nicht gilt."*

---

## Der Karpathy-Moment

Im Februar 2025 twitterte Andrej Karpathy einen Satz, der seitdem in Entwicklerkreisen nicht mehr verschwunden ist:

> *„I just see stuff, say stuff, run stuff, and copy paste stuff, and it mostly works."*
> *(Sinngemäß: schauen, sagen, laufen lassen, kopieren — und es funktioniert meistens.)*

Er nannte es **Vibe Coding**: eine Arbeitsweise, bei der das Verstehen des Codes optional wird. Du beschreibst, was du willst. Die KI schreibt es. Du schaust, ob es aussieht wie das, was du meintest. Fertig.

Martin Fowler hat kurz darauf eine wichtige Korrektur nachgeliefert: Das meiste, was seither als „Vibe Coding" bezeichnet wird, *ist eigentlich kein Vibe Coding*. Und der Unterschied ist nicht trivial — er ist die Kernfrage, die diese Blogserie antreibt.

---

## Abschnitt 1 — Die eigentliche Achse: Wer ist verantwortlich?

Den Wendepunkt, den Fowler **„November Inflection"** nennt — die Phase Ende 2025, in der agentische Entwicklungsumgebungen wie Claude Code professionell einsetzbar wurden —, hat eine Spaltung erzeugt, die sich nicht mehr rückgängig machen lässt. Plötzlich konnte dieselbe KI, die dir einen Prototyp in zehn Minuten hinwarf, auch wochenlange Refactoring-Projekte selbstständig durchführen.

Diese Spaltung hat nichts mit Werkzeugen zu tun. Sie hat nichts mit Modell-Fähigkeiten zu tun. Sie hat alles damit zu tun, **ob der Mensch die Verantwortung für das trägt, was ausgeliefert wird**.

> *Vibe Coding ist, was du machst, wenn die Kosten eines fehlerhaften Codes niedriger sind als die Kosten, ihn zu reviewen. Agentic Programming ist, was du machst, wenn das nicht gilt.*

Diese eine Frage — *Bin ich bereit, für diesen Code zu haften?* — bestimmt, welches Paradigma du brauchst. Alles andere ist Werkzeugwahl.

---

## Abschnitt 2 — Vibe Coding: Den Code nicht mehr als primäre Arbeitsebene behandeln

Beim Vibe Coding liegt der kognitive Fokus ausschließlich auf dem externen Verhalten: Sieht die Ausgabe richtig aus? Reagiert die App wie erwartet? Der Code selbst ist eine Blackbox.

Das ist **kein Fehler** — es ist das Feature. Für Citizen Developer, Wochenend-Prototypen und interne Hilfsskripte, bei denen der Autor gleichzeitig der einzige Nutzer ist, ist Vibe Coding ein außerordentlicher Beschleuniger. Du baust Dinge, die du sonst nie gebaut hättest.

Die Gefahr entsteht, wenn der Code beginnt, Dinge zu berühren, die wichtig sind: Nutzerdaten, Authentifizierungspfade, externe API-Aufrufe. Simon Willison hat dafür den Begriff **Lethal Trifecta** geprägt — das gefährliche Dreieck aus:

1. **Sensiblen Daten** (Tokens, Passwörter, PII)
2. **Nicht vertrauenswürdigem Inhalt** (Nutzereingaben, externe Dokumente)
3. **Ausgehender Kommunikation** (API-Calls, E-Mails, Webhooks)

Wenn alle drei Bedingungen zusammentreffen und der Code nie wirklich gelesen wird, ist das System nicht mehr vertrauenswürdig: Das Modell kann durch nicht vertrauenswürdigen Input gesteuert werden, während es gleichzeitig Zugriff auf sensible Daten und auf Wege nach außen hat. Das Vibe-Paradigma hat keine Schutzmechanismen dagegen — nicht weil es fahrlässig ist, sondern weil es für diesen Fall schlicht nicht ausgelegt wurde.

Vibe Coding ist nicht falsch. Es ist nur falsch für bestimmten Code.

---

## Abschnitt 3 — Agentic Programming: Der Mensch als Reviewer und Entscheider

Das Gegenbild zum Vibe Coder ist nicht der klassische Entwickler, der jede Zeile selbst schreibt. Es ist jemand, dessen Aufgabe sich fundamental verändert hat.

Eine Analogie, die ich hilfreich finde: Du bist Küchenchef, der Agent ist Sous-Chef. Der Küchenchef wählt das Rezept, überwacht den Prozess und probiert das Gericht. Der Sous-Chef schneidet, rührt und präsentiert — aber er entscheidet nicht über das Menü. Du trägst die volle Verantwortung, wenn das Gericht misslungen ist. Aber du kochst es nicht alleine.

Was früher zählte: schnell korrekten Code schreiben.

Was jetzt zählt: **Code gegen benannte Kriterien reviewen**.

Das ist kein kleinerer Skill — es ist ein anderer. Und er hat eine wichtige Implikation: Die Kriterien müssen irgendwo stehen, explizit und konsistent durchgesetzt. Das ist die Brücke zum nächsten Abschnitt.

---

## Abschnitt 4 — Artifacts vs. Claude Code: Dasselbe Modell, ein anderes Harness

Hier wird der Unterschied konkret. Nehmen wir zwei Werkzeuge, die beide dasselbe Claude-Modell nutzen:

**Claude.ai mit Artifacts (vibe-freundlich):**
- Browser-UI, keine lokale Installation
- Kein Zugriff auf dein Dateisystem
- Kein persistenter Projektstatus zwischen Sessions
- Ideal für visuelle Prototypen, Textarbeit, Einzel-Experimente

**Claude Code (agentisch):**
- Terminal-integriert, sieht dein Dateisystem
- Führt deine Tests und Linter aus
- Kennt deinen Projektkontext über Sessions hinweg
- Erzwingt Regeln durch Hooks

Dasselbe Claude darunter. Ein völlig anderes System drumherum.

Das ist die wichtigste Einsicht dieser Serie, und sie lässt sich in einen Satz fassen:

> ***Ein KI-Agent ist schlicht ein Modell plus ein Harness.***

Das Modell entscheidet, wie klug die Antworten sind. Das Harness entscheidet, ob die Antworten zuverlässig, prüfbar und wiederholbar sind.

Artifacts ist ein Harness — aber eines, das auf Containment und Einfachheit optimiert ist: kein Dateisystemzugriff, kein persistenter State, keine erzwungenen Regeln. Das ist eine bewusste Designentscheidung für einen bestimmten Risikoappetit. Claude Code ist ein Harness, das auf Autonomie und Durchsetzung optimiert ist. Zwei Harnesses für zwei Risikoprofile. Agentic Programming bedeutet, das richtige Harness zu bauen — und es dann tatsächlich zu konfigurieren.

---

## Abschnitt 5 — Das agentische Harness in Claude Code, in Schichten

Das ist der Teil, der sich auszahlt. Was genau ist dieses Harness? In Claude Code besteht es aus fünf Schichten, die jeweils einen anderen Aspekt des Projektverhaltens steuern.

Die Leitfrage für jede Schicht:

> *Anker, auf die sich das Team einigt, leben in `CLAUDE.md`. Anker, die Urteilsvermögen brauchen, leben in Skills. Anker, die ein Prozessor prüfen kann, leben in Hooks.*

### `CLAUDE.md` — die Verfassung des Projekts

Eine kurze Datei (~500 Tokens) im Projektstamm, die Claude beim Start jeder Session automatisch liest — ohne Prompt, ohne Erinnerung, ohne Konfiguration. Sie ist die schriftliche Antwort auf die Frage: *Was gilt hier immer?* Stack, Befehle, Hard Rules, Standards — alles, worüber das Team nicht bei jedem Task neu verhandeln will. Drei konkrete Beispiele stehen am Ende dieses Posts.

### Skills (`.claude/skills/`) — Expertise auf Abruf

Ein Ordner mit einer `SKILL.md`-Datei, die Claude lädt, wenn der Kontext es erfordert — nicht immer, sondern gezielt. Beispiele:

- `review-for-code-smells/` — aktiviert Fowlers Katalog als Review-Kriterium
- `design-by-contract/` — Pre-/Postconditions und Invarianten
- `tdd-red-green-refactor/` — der TDD-Zyklus als explizit benanntes Protokoll

Die Tiefe dieses Mechanismus kommt in Post 3.

### Rules (`.claude/rules/`) — Pfad-gebundenes Verhalten

Unterschiedliche Regeln für `backend/`, `frontend/`, `tests/`. Claude wendet die jeweils passenden Regeln an, abhängig davon, welche Datei gerade bearbeitet wird. Tiefe kommt in Post 4.

### Hooks — deterministische Durchsetzung

Ein `PostToolUse`-Hook, der nach jedem Edit den Linter ausführt. Ein `Stop`-Hook, der die Aufgabe erst als abgeschlossen markiert, wenn Tests und Typen grün sind. Das sind keine Empfehlungen — das sind Vetos.

Faustregel: Wer dem Modell sagt, was richtig ist, dem Harness aber nichts zu sagen hat, verliert die Kontrolle innerhalb von drei Sessions.

Tiefe kommt in Post 4.

### Subagents — der isolierte Reviewer

Ein zweiter Durchlauf mit frischem Kontext, eingeschränktem Tool-Zugriff und einer fokussierten Aufgabe: den Diff gegen benannte Kriterien reviewen. Der Subagent bekommt nur den Diff und die Kriterien — den Entstehungskontext bewusst nicht. Das ist sein Vorteil. Tiefe kommt in Post 5.

`CLAUDE.md` ist die Schicht, die dieser Post in der Tiefe behandelt — die anderen vier folgen in späteren Beiträgen der Serie.

---

### Die Verschiebung

Boris Cherny, der Autor von Claude Code, hat öffentlich beschrieben, wohin diese Verschiebung führt: Er promptet Claude nicht mehr. Er schreibt Loops, die laufen. Sein Job ist das Schreiben von Loops.

Vom Prompting zum System-Design. Das ist die Verschiebung. Das ist der Grund, warum diese Serie existiert.

---

## Abschnitt 6 — Zwei `CLAUDE.md`-Starterpunkte

Das Nützlichste, was dieser Post dir geben kann, ist ein konkreter Startpunkt. Zwei Beispiele — einmal Frontend, einmal Backend — jedes mit explizit benannten Standards, denn **die Standards-Blöcke sind der Teil, der die eigentliche Arbeit erledigt**. Jeder benannte Anchor aktiviert komprimiertes, geteiltes Wissen in Claude, das weit mehr leistet als ausgeschriebene Regeln.

---

### Angular Frontend

```markdown
# Projekt: web-app

## Stack
Angular 22 (signal-first, Standalone Components als Default), TypeScript Strict Mode.
RxJS für asynchrone Streams, Signals für reaktiven State.
Jest + Testing Library, Playwright für E2E.

## Konventionen
- Ausschließlich Standalone Components — keine NgModules in neuem Code.
- `inject()` statt Constructor Injection.
- Eine Komponente pro Datei. `.spec.ts`, `.html`, `.scss` werden co-lokalisiert.
- Angular Style Guide gilt (https://angular.dev/style-guide).

## Standards
Dieses Projekt verpflichtet sich auf:
- SOLID Principles
- KISS, YAGNI (keine spekulative Abstraktion vor dem dritten Anwendungsfall)
- Separation of Concerns: Components rendern, Services halten Logik, Stores halten State
- Container/Presentational Component Split

## Befehle
- Dev:          `npm run start`
- Test:         `npm run test`
- Lint:         `npm run lint`
- Type-check:   `npm run typecheck`

## Hard Rules
- Kein `any`. `unknown` verwenden und narrowen.
- Kein Subscriben in Components — `async` Pipe oder `toSignal` nutzen.
- Ein PostToolUse-Hook blockiert Commits mit `console.log`.
```

---

### Kotlin / Spring Boot Backend

```markdown
# Projekt: order-api

## Stack
Kotlin 2.4, Spring Boot 4 (Spring Framework 7), Gradle (Kotlin DSL), JDK 25.
JUnit 5, MockK, Testcontainers. ktlint + detekt.

## Konventionen
- Immutable Data Classes; `val` vor `var`.
- Sealed Classes / Sealed Interfaces für geschlossene Hierarchien.
- `Result<T>` oder domänenspezifische Sum Types — niemals werfen für erwartete Fälle.
- Coroutines + Structured Concurrency; kein `GlobalScope`.

## Standards
Dieses Projekt verpflichtet sich auf:
- SOLID Principles
- Design by Contract: `require` (Pre), `check` (Invariante), `ensure` (Post)
- Domain-Driven Design Tactical Patterns (Entity, Value Object, Aggregate)
- Hexagonal Architecture (Domain ↔ Ports ↔ Adapters)
- Fowlers Code-Smells-Katalog als Review-Kriterium

## Befehle
- Test:         `./gradlew test`
- Lint:         `./gradlew ktlintCheck detekt`
- Alles prüfen: `./gradlew check`

## Hard Rules
- Keine Nullable Returns aus öffentlichen APIs — Sealed Result Types verwenden.
- Repository-Interfaces in `domain/`, Implementierungen in `infrastructure/`.
- Niemals Secrets, Tokens oder PII loggen. Ein PreToolUse-Hook scannt jeden Write.
```

---

**Die editoriale Pointe:** Die fettgedruckten `Standards`-Blöcke erledigen die schwere Arbeit. Jeder benannte Anchor — SOLID, YAGNI, Design by Contract, Hexagonal Architecture, Fowlers Code Smells — ruft in Claude ein dichtes Wissenspaket ab, das du nicht ausschreiben musst. Das ist der Hebel.

---

## Abschnitt 7 — Der Fluch des Wissens, invertiert

Vibe Coder sind nicht leichtsinnig — sie operieren unter einem invertierten Curse of Knowledge: Du kannst nicht reviewen, was du nicht gelesen hast, und du weißt nicht, was du nicht weißt. Das Harness externalisiert dieses Wissen, sodass das System es trägt, nicht der Mensch. Das ist kein moralisches Urteil — es ist Systemdesign.

---

## Abschnitt 8 — Failure Modes

**Anchor-Stuffing.** Zwanzig benannte Standards in `CLAUDE.md` sind schlechter als fünf. Wähle die, die du tatsächlich durchsetzt.

**Inferentiell, wo Rechenleistung genügt.** Wenn ein Linter es finden kann, soll ein Linter es finden — keine Token verbrennen, damit das Modell DRY-Verletzungen aufspürt.

**Hooks als optional behandeln.** Eine Regel, die das Harness nicht erzwingt, driftet innerhalb von drei Sessions weg.

**Vibe Coding in Produktionscode.** Das Lethal Trifecta ist nicht verhandelbar.

---

## Abschnitt 9 — Die Faustregel

> *Vibe Coding ist, was du machst, wenn die Kosten eines fehlerhaften Codes niedriger sind als die Kosten, ihn zu reviewen. Agentic Programming ist, was du machst, wenn das nicht gilt. Das Harness — `CLAUDE.md`, Skills, Rules, Hooks, Subagents — ist, wie du „wenn das nicht gilt" erschwinglich machst.*

---

## Was kommt als nächstes

Post 2 untersucht, warum größere Kontextfenster das Recall-Problem nicht lösen — und was stattdessen hilft.

---

## Weiterführende Quellen

### Personen, denen es sich lohnt zu folgen

- **Andrej Karpathy** — hat „Vibe Coding" geprägt; sein [ursprünglicher X-Post](https://x.com/karpathy/status/1886192184808149383) bleibt die kanonische Referenz.
- **Martin Fowler** — *bliki*-Einträge [Vibe Coding](https://martinfowler.com/bliki/VibeCoding.html), [Agentic Programming](https://martinfowler.com/bliki/AgenticProgramming.html), [November Inflection](https://martinfowler.com/bliki/NovemberInflection.html) sowie die Langformartikel [Harness Engineering](https://martinfowler.com/articles/harness-engineering.html), [Agentic AI Security](https://martinfowler.com/articles/agentic-ai-security.html) und [The VibeSec Reckoning](https://martinfowler.com/articles/vibesec-reckoning.html).
- **Boris Cherny** — Autor von Claude Code; seine Beschreibung der Verschiebung vom Prompting zum Loop-Schreiben ist der konzeptionelle Ursprung von Posts 5 und 6.
- **Simon Willison** — hat das [Lethal Trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) geprägt; sein Weblog ist das laufende Protokoll zu Agent-Exfiltrations-Angriffen und Prompt-Injection-Forschung.
- **Cobus Greyling** — Pionier von Goal und Loop Engineering; seine Repos [goal-engineering](https://github.com/cobusgreyling/goal-engineering) und [loop-engineering](https://github.com/cobusgreyling/loop-engineering) bereiten Posts 5 und 6 vor.
- **Addy Osmani** — praktische Texte zu KI-unterstützten Entwicklungsworkflows.
- **Bruce Schneier** — übergeordnete Perspektive auf KI und Sicherheit; sein Blog *Schneier on Security* ordnet einzelne Agenten-Risiken in das größere Bild der IT-Sicherheit ein.

### Konzepte und Referenzen

- **Semantic Anchors** — der Katalog unter [llm-coding.github.io/Semantic-Anchors](https://llm-coding.github.io/Semantic-Anchors/) ist das Vokabular, aus dem die obigen `CLAUDE.md`-Beispiele schöpfen.
- **Claude Code Dokumentation** — [code.claude.com/docs](https://code.claude.com/docs) für die kanonische Referenz zu `CLAUDE.md`, Skills, Hooks und Slash Commands.
- **Anthropics offizieller Skills-Marketplace** — [github.com/anthropics/skills](https://github.com/anthropics/skills) für Beispiele gut geformter `SKILL.md`-Dateien.
