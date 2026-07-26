---
title: "Kontextfenster, Skills und externe Memory: Warum 'mehr Tokens' das falsche Problem löst"
date: 2026-07-01
draft: false
description: "Größere Kontextfenster sind nicht die Antwort auf das Recall-Problem. Modelle vergessen in der Mitte, und Sessions enden — beides löst kein Token-Limit. Skills und externe Memory-Dateien lösen es."
tags: ["claude-code", "context-engineering", "skills", "external-memory", "CLAUDE.md", "context-rot", "lost-in-the-middle"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 3
---

> *Größere Kontextfenster lösen das falsche Problem. Das eigentliche Problem ist, dass Modelle in der Mitte vergessen — und dass Sessions enden.*

---

## Wo wir stehen

Post 2 hat das Harness in fünf Schichten gezeigt. Eine Frage blieb offen: Wenn `CLAUDE.md` immer geladen ist und Skills nur on-demand — warum reicht das nicht?

Die kurze Antwort: Weil Modelle nicht *alles* gleich gut lesen, was im Kontext steht. Und weil jede Session endet, ohne dass etwas davon bleibt.

Dieser Post zeigt beide Probleme und die zwei Mechanismen, die sie lösen: **Progressive Disclosure** über Skills (für das Recall-Problem) und **externe Memory-Dateien** (für das Session-Grenze-Problem). Beide gibt es in Claude Code heute. Beide werden konsequent unterschätzt.

---

## Das Recall-Problem: Lost in the Middle, oder: Context Rot

Claude Sonnet 4.6 und die aktuellen Opus-Modelle bieten in Claude Code ein Kontextfenster von 1 Million Tokens. Das klingt nach genug für jede vorstellbare Aufgabe. In der Praxis ist es das nicht — nicht weil 1M zu klein wäre, sondern weil **das Modell innerhalb dieser 1M nicht gleichmäßig gut liest**.

Das Phänomen heißt in der akademischen Literatur *Lost in the Middle* und ist seit dem Papier von Liu et al. (2023) dokumentiert: Modelle erinnern sich überdurchschnittlich gut an das, was am Anfang und am Ende ihres Kontextfensters steht. Was in der Mitte landet — und in einer langen Session ist das eine Menge — wird mit deutlich niedrigerer Treffsicherheit abgerufen.

Anthropic hat für dieses und verwandte Phänomene den Sammelbegriff **Context Rot** etabliert — die schlichtere Beobachtung, dass Recall mit wachsendem Kontext degradiert, unabhängig davon, *wo* die Information liegt. Ein 1M-Fenster ist nicht linear zehn Mal so gut wie ein 100k-Fenster. Es ist zehn Mal so groß, aber die Trefferquote pro Token sinkt mit jedem Token.

Konkret bedeutet das:

- Eine Entscheidung, die du in Turn 4 getroffen hast, ist in Turn 47 schwerer abrufbar als die, die du gerade in Turn 46 getroffen hast.
- Ein Architektur-Prinzip, das du am Session-Anfang etabliert hast, verblasst in der Mitte einer langen Implementierung, je weiter du arbeitest.
- Eine Hard Rule aus `CLAUDE.md` ist robuster — sie steht am Anfang. Aber Rules, die ein Skill in Turn 30 nachgeladen hat? Die sind fragil.

**Größere Kontextfenster verschlimmern das Problem.** Der Sprung von 200k auf 1M hat mehr Kapazität gebracht, nicht mehr Präzision. Wer mehr Tokens hineinschüttet, vergisst nicht weniger — er vergisst nur Anderes. Anthropic selbst weist in der Dokumentation explizit darauf hin: *"As token count grows, accuracy and recall degrade."* Kapazität ≠ Qualität.

Die operative Konsequenz: *Was du in einer langen Session konsistent durchsetzen willst, muss entweder ans Ende des Kontexts gelangen (per Hook-Ausgabe oder Skill-Reload) oder gar nicht erst in der Mitte verloren gehen.* Das zweite ist billiger.

---

## Die erste Antwort: Progressive Disclosure über Skills

Post 2 hat Skills als "Expertise auf Abruf" eingeführt. Hier ist der ökonomische Grund, warum dieser Mechanismus existiert.

Ein Skill hat zwei Lade-Stufen:

**Stufe 1 — Description.** Die ~50 Tokens aus dem Frontmatter sind immer im Kontext. Sie sind das Schild an der Tür: *"Wenn du X tust, schau hier rein."*

**Stufe 2 — Body.** Die eigentlichen 500–2000 Tokens des Skills laden erst, wenn die Description matcht. Vorher kosten sie nichts.

Und seit der Vereinheitlichung von Custom Commands in Skills lädt eine `SKILL.md` zusätzlich als Slash-Command — derselbe Mechanismus, anderer Trigger.

Das klingt wie eine triviale Optimierung. Es ist keine. Es ist der Mechanismus, der `CLAUDE.md` kurz bleiben lässt, *ohne* Wissen zu verlieren. Ein Projekt mit 30 benannten Standards in `CLAUDE.md` ist unbenutzbar — jeder Turn bezahlt 4000 Tokens für Standards, von denen 28 gerade irrelevant sind. Dasselbe Projekt mit 5 Standards in `CLAUDE.md` und 25 in Skills bezahlt 700 Tokens pro Turn — und lädt den Rest nur dann, wenn er gebraucht wird.

Aber Progressive Disclosure löst nicht nur das Token-Ökonomie-Problem. Sie löst auch das Context-Rot-Problem, weil ein Skill, das in Turn 30 frisch lädt, **am Ende des Kontexts steht**. Es ist nicht in der Mitte versteckt — es ist gerade ankommend, hochaufgelöst, mit voller Recall-Treffsicherheit. Skills sind nicht nur ein Speicher-Trick. Sie sind ein **Positions-Trick**.

Ein konkretes Beispiel. Stell dir vor, ein Skill `design-by-contract/SKILL.md` definiert, wie öffentliche APIs in deinem Projekt mit Pre-/Postconditions und Invarianten dokumentiert werden. Drei Optionen:

| Wo lebt das Wissen? | Token-Kosten pro Turn | Recall in Turn 47 |
|---|---|---|
| `CLAUDE.md` (immer geladen) | ~800 Tokens × jeder Turn | Schwach — steht in der Mitte |
| Skill (on-demand) | ~50 Tokens (Description) + 800 nur bei Matches | Stark — frisch geladen |
| Nirgends abgelegt, jedes Mal im Prompt erklärt | 0 normalerweise, aber bei jedem Bedarf neu | Inkonsistent |

Die mittlere Zeile gewinnt. Skills sind die Schicht, in der die meisten benannten Anker aus deinen `CLAUDE.md`-Beispielen (Post 1) leben sollten — nicht aus Geiz, sondern aus Recall-Treffsicherheit.

### Skill Fitness & Validation mit agnix[^1]

Damit dieser Progressive-Disclosure-Mechanismus reibungslos funktioniert, müssen die Metadaten und die Ordnerstruktur der Skills fehlerfrei sein. Wenn die Description im YAML-Frontmatter einen Syntaxfehler hat oder die Triggermuster ungenau sind, verliert das Modell den Zugriff auf den Skill (der Skill verliert seine "Fitness").

Hier kommt **agnix** ins Spiel:
*   **Was es ist:** Ein statischer CLI-Linter und Validator für AI-Agenten-Konfigurationen (wie `CLAUDE.md`, `SKILL.md` und MCP-Settings).
*   **Funktionsweise:** Es prüft deine Skill-Dateien gegen vordefinierte Regeln, um sicherzustellen, dass Frontmatter-Deklarationen, Pfadangaben und Slash-Commands syntaktisch korrekt sind und von AI-Assistenten wie Claude Code zuverlässig erkannt und geladen werden können.
*   **Einsatz:** Lässt sich via npm oder Cargo installieren und kann lokal oder in der CI/CD-Pipeline ausgeführt werden, um die "Fitness" der verteilten Skill-Umgebung abzusichern.

---

## Das Session-Grenze-Problem

Selbst wenn jedes Skill perfekt designed ist, bleibt ein Problem ungelöst: **die Session endet**. Du schließt das Terminal, gehst essen, kommst zurück. Was bleibt?

`CLAUDE.md` bleibt. Skills bleiben. Aber alles, was *in der Session passiert ist* — die Entscheidung, dass das Auth-Modul auf Sessions statt JWTs umgestellt wird, der Kompromiss, dass die Migration in zwei Schritten läuft, das offene TODO, in der nächsten Session den Repository-Layer zu refaktorieren — verschwindet, sobald die Konversation endet.

Die naive Antwort ist *"merk's dir halt"*. Aber das ist nicht das Modell-Versagen — es ist Modell-Design. Sessions sind per Definition zustandslos: Was zwischen ihnen persistieren soll, muss außerhalb der Session leben.

Claude Code hat dafür zwei eingebaute Mechanismen: **Compaction** (verdichtet den laufenden Kontext, wenn das Fenster voll wird) und **Auto Memory** (seit v2.1.59 — Claude schreibt selbst Notizen in ein Projekt-Memory-Verzeichnis, die in Folgesessions geladen werden). Beide sind nützlich. Aber sie beantworten eine andere Frage als das, was hier gemeint ist: Auto Memory ist, was *Claude* sich merkt. Externe Markdown-Dateien im Repo sind, was *du und dein Team* dokumentieren wollen. Das eine ist Assistent-Gedächtnis, das andere ist Projekt-Kanon.

Das ist die Aufgabe externer Memory-Dateien.

---

## Die zweite Antwort: Externe Memory-Dateien

Eine externe Memory-Datei ist eine schlichte Markdown-Datei im Repository, die festhält, was über das Session-Ende hinaus relevant ist. Sie hat keinen Frontmatter-Trick, keinen Lade-Mechanismus, keine besondere Magie. Sie liegt im Repo. Claude liest sie, wenn `CLAUDE.md` darauf verweist.

Drei Typen haben sich etabliert:

### `DECISIONS.md` — die Architecture-Decision-Records-Variante

Ein chronologisches Log der nicht-trivialen Entscheidungen, jeweils mit *Was, Warum, Konsequenzen*. Beispiel:

```markdown
# Decisions

## 2026-07-08 — Auth via Sessions statt JWT
- **Was:** Session-Cookies mit Server-State, nicht JWTs.
- **Warum:** Revocation muss in <100ms greifen. JWTs erlauben das nur
  mit Blacklist — Blacklist + JWT ist die schlechtere Version von Session.
- **Konsequenzen:** Redis als Session-Store. Horizontale Skalierung
  braucht Sticky Sessions oder geteilten Store.

## 2026-07-03 — Migration in zwei Schritten
- **Was:** Erst Schema-Erweiterung (additive), dann Backfill, dann Schema-Reduktion.
- **Warum:** Zero-Downtime. Ein einziger Migrationsschritt würde Locks brauchen.
- **Konsequenzen:** Drei Deployments statt einem. Zwischen Schritt 1 und 3
  muss der alte Code mit beiden Schemata umgehen können.
```

Eine `DECISIONS.md` ist nicht *"die Architektur"*. Sie ist das **Warum** hinter der Architektur — die Information, die ein neuer Entwickler (oder ein neuer Agent) braucht, um den Code zu verstehen, ohne ihn rückzuengineeren.

### `STATE.md` — die laufende Arbeit

Wo `DECISIONS.md` permanent ist, ist `STATE.md` transient. Sie hält den aktuellen Stand:

```markdown
# Aktueller Stand — 2026-07-08

## In Arbeit
- Refactor: Repository-Layer trennen (in `src/infrastructure/repos/`)
- Test-Coverage für `OrderValidator` von 60% auf 90% bringen

## Blockiert
- Migration zu Sessions: wartet auf Redis-Cluster (Infra-Team)

## Nächstes
- E-Mail-Versand asynchron machen (RQ oder Celery — noch nicht entschieden)
```

Diese Datei wird oft aktualisiert. Sie ist explizit gemeint, um Claude beim Session-Start zu sagen: *"Hier waren wir."* Ohne sie startet jede Session mit derselben Frage: *"Woran arbeiten wir nochmal?"*

### `GOAL.md` — das aktuelle Ziel

Wenn du Goal Engineering (Post 6) ernst meinst, ist `GOAL.md` die Datei, in der ein laufendes Ziel lebt — was erreicht werden soll, woran "fertig" erkennbar ist, was bisher geprüft wurde. Mehr dazu in Post 6.

---

## Die Tooling-Antwort: MCP-Server & Token-Saving CLI-Tools[^2]

Obwohl handgeschriebene Markdown-Dateien hervorragend für konzeptionelles Wissen funktionieren, gibt es für den Entwicklungs-Alltag mittlerweile spezialisierte Werkzeuge, die diesen Prozess automatisieren und Token-Kosten drastisch reduzieren:

### 1. TokenSave (`tokensave.dev`)
TokenSave fungiert als lokaler Code-Intelligence-Server über das **Model Context Protocol (MCP)**. 
*   **Funktionsweise**: Es indiziert die Codebase in einen lokalen semantischen Wissensgraphen (`.tokensave/tokensave.db` via libSQL).
*   **Token-Vorteil**: Statt dass der Agent bei jeder Frage ("Wo wird X aufgerufen?") ganze Verzeichnisse einlesen muss, stellt TokenSave gezielte semantische Suchergebnisse bereit. Das spart repetitive Datei-Scans und verhindert die "Session-Amnesie".
*   **Sicherheit**: 100 % lokale Ausführung, kein Code verlässt die Entwicklerumgebung.

### 2. RTK (Rust Token Killer)
Ein kompaktes CLI-Proxy-Tool für Terminal-Ausgaben.
*   **Funktionsweise**: Es fängt die Ausgaben von CLI-Befehlen (z. B. `git diff`, `git log` oder Suchergebnissen) ab, filtert Rauschen und komprimiert sie vor der Übermittlung an das Modell.
*   **Token-Vorteil**: Reduziert das Token-Volumen bei langen Terminal-Ausgaben um 60–90 %, indem es redundante Zeilen, Whitespaces und redundante Dateipfade bereinigt.

### 3. context-mem
Ein MCP-Server, der als "lebendes Wiki" dient. Er schreibt Tool-Ausgaben, Interaktionsergebnisse und Zusammenfassungen automatisch in eine persistente Markdown-Datenbank, auf die Agenten in nachfolgenden Sessions direkt zugreifen können.

---

## Wie das alles zusammenspielt

Eine `CLAUDE.md`, die externe Memory-Dateien orchestriert, könnte so aussehen:

```markdown
# Projekt: order-api

## Stack
[wie in Post 1]

## Standards
[wie in Post 1]

## Externe Memory
- **`DECISIONS.md`** — alle nicht-trivialen Architektur-Entscheidungen
  mit Begründung. Lies vor jeder strukturellen Änderung.
- **`STATE.md`** — laufende Arbeit. Lies beim Session-Start. Aktualisiere
  am Session-Ende oder wenn sich der Stand signifikant ändert.
- **`GOAL.md`** — falls vorhanden: das aktuelle Run-Until-Done-Ziel.
  Lies und respektiere die Done-Kriterien.

## Hard Rules
[wie in Post 1]
```

Das ist `CLAUDE.md` als **Routing-Tabelle**, nicht als Speicher. Sie nennt, *wo* das Wissen liegt — sie speichert es nicht selbst.

---

## Side-by-Side: Dieselbe Aufgabe, zwei Approaches

Aufgabe: *"Bau ein Feature, das Bestellungen storniert. Schreibe die Validierungslogik, die DB-Mutation, und ein API-Endpoint."*

### Approach A — Nur Konversation, kein Memory

| Turn | Was passiert | Was im Kontext steht |
|---|---|---|
| 1 | Aufgabe, Claude antwortet | Aufgabe, Antwort |
| 5 | Claude fragt: "Sessions oder JWTs für Auth?" | Akkumulierte Konversation |
| 6 | Du erklärst die Session-Entscheidung | Erklärung im Kontext |
| 20 | Claude implementiert Endpoint, vergisst Soft-Delete-Policy | Auth-Entscheidung in der Mitte versunken |
| 25 | Du korrigierst: "Soft-Delete, kein Hard-Delete" | Korrektur im Kontext |
| 40 | Claude schreibt Tests, missachtet die 90%-Coverage-Regel | Coverage-Regel war nie explizit |
| **Neue Session** | Claude weiß nichts mehr von all dem | Nur `CLAUDE.md` und Skills |

### Approach B — `DECISIONS.md` + `STATE.md` + Skills

| Turn | Was passiert | Was im Kontext steht |
|---|---|---|
| 1 | Aufgabe. Claude liest `STATE.md` und `DECISIONS.md` zuerst | Stack, Standards, Stand, Entscheidungen |
| 2 | Claude weiß: Sessions (aus `DECISIONS.md`), Soft-Delete (aus `DECISIONS.md`) | Keine Rückfragen nötig |
| 5 | Claude aktiviert `design-by-contract/SKILL.md` für die neue API | Skill frisch geladen, am Kontext-Ende |
| 20 | Claude implementiert Endpoint mit Soft-Delete | Decision-Wissen am Anfang stabil |
| 25 | Coverage-Hook feuert, blockiert bei <90% | Sensor erzwingt Standard |
| 40 | Claude meldet "fertig". `STATE.md` wird mit neuer Story aktualisiert | Nächste Session beginnt informiert |
| **Neue Session** | Claude startet mit `STATE.md` → weiß sofort, wo wir stehen | Kontinuität ohne Re-Briefing |

Der Unterschied ist nicht *"weniger Token"*. Der Unterschied ist *"weniger Vergessen, weniger Re-Briefing, weniger Drift."* Approach A produziert Code, der drei verschiedene Auth-Modelle und zwei Delete-Semantiken vermischt — nicht weil Claude schlecht ist, sondern weil die Information nicht persistent war. Approach B produziert Code, der konsistent ist, weil Konsistenz im Repo lebt, nicht in der Konversation.

---

## Failure Modes von Context Engineering

**Memory-Stuffing.** Eine `DECISIONS.md` mit 200 Einträgen aus drei Jahren ist nicht mehr Memory — sie ist Archäologie. Alte Entscheidungen, die obsolet sind, sollten archiviert werden (`DECISIONS-archive.md`) oder gelöscht. Memory ist nur nützlich, wenn sie aktuell ist.

**Verweise ohne Disziplin.** Eine `CLAUDE.md`, die auf `DECISIONS.md` verweist, die niemand pflegt, ist schlechter als keine Verweise. Claude wird die Datei lesen, ihr glauben, und auf veralteter Basis arbeiten.

**Dokumentierte Entscheidungen ohne Akzeptanz.** Eberhard Wolff hat für klassische Architektur-Reviews den Punkt geprägt, der auch für `DECISIONS.md` gilt: Eine dokumentierte Entscheidung, die das Team nie akzeptiert hat, ist keine Dokumentation — sie ist eine Fiktion, an die sich in Zukunft niemand hält. Wenn du merkst, dass eine `DECISIONS.md`-Eintragung in der Praxis systematisch umgangen wird, ist das kein Doku-Problem. Es ist ein soziales Problem.

**`STATE.md` als Tagebuch.** Wenn `STATE.md` zur narrativen Zusammenfassung jeder Session wird, wächst sie ins Bodenlose. Sie soll *aktuell* sein, nicht *historisch*. Was nicht mehr relevant ist, kommt raus.

**Auto Memory verwechseln mit Projekt-Kanon.** Auto Memory ist Claudes Werkzeug, um sich selbst über Sessions hinweg zu helfen. Aber es ist nicht dazu gedacht, dokumentierte Team-Entscheidungen zu ersetzen. Wer sich darauf verlässt, dass Auto Memory schon irgendwie die Auth-Architektur behält, hat den Mechanismus falsch verstanden. Auto Memory ist Assistent-Gedächtnis. `DECISIONS.md` ist Team-Vertrag.

**Skills statt Memory.** Skills lösen das Recall-Problem, nicht das Session-Grenze-Problem. Eine Entscheidung, die zwischen Sessions persistieren soll, gehört in `DECISIONS.md`, nicht in ein Skill. Skills sind Wissen über *Verfahren*. Memory ist Wissen über *Geschichte*.

**Verlassen auf 1M-Token-Fenster.** Wenn deine Antwort auf das Recall-Problem *"warten, bis das Fenster größer wird"* ist — du hast das Problem nicht verstanden. Mehr Kapazität ist nicht mehr Präzision.

---

## Die Faustregel

> *Was in jedem Turn gilt: `CLAUDE.md`. Was on-demand gebraucht wird: Skills. Was zwischen Sessions persistieren muss: externe Memory-Dateien.*

Die drei Schichten lösen drei verschiedene Probleme — und sie lassen sich nicht gegeneinander ersetzen. Ein Projekt, das alles in `CLAUDE.md` packt, verbrennt Tokens. Ein Projekt, das alles in Skills packt, verliert Memory. Ein Projekt, das alles in `DECISIONS.md` packt, hat keinen Trigger.

Das nennt man Context Engineering. Es ist die Disziplin, *wo* Wissen lebt — nicht *wie viel* davon im Modell-Kontext liegt.

---

## Was kommt als nächstes

Post 4 stellt die Parallelfrage für **Zugriff**: das Model Context Protocol (MCP) verbindet Claude Code mit deinen Systemen — Jira, Confluence, Datenbanken, CRM — und klärt, wann sich ein MCP-Server lohnt und wann ein Skill die bessere Wahl ist. Post 5 vertieft dann Hooks: die Sensor-Schicht. Welche Events gibt es, was kann ein Hook blockieren, und wo zieht man die Grenze zwischen "Modell soll das wissen" und "Hook soll das erzwingen." Tariq Shaukat hat auf dem AI Engineer World's Fair den Satz geprägt, um den es dabei geht: *"In the Land of AI Agents, the Verifiers Are King."*

---

## Weiterführende Quellen

- **agnix** — Linter und Validator für AI-Agenten-Konfigurationen und `SKILL.md`/`CLAUDE.md`-Dateien zur Absicherung der Skill Fitness. [github.com/agent-sh/agnix](https://github.com/agent-sh/agnix)
- **TokenSave** — Lokaler Semantic Memory Store für AI-Agents via Model Context Protocol (MCP). [tokensave.dev](https://tokensave.dev)
- **Rust Token Killer (RTK)** — CLI-Proxy zur Filterung und Token-Komprimierung von Terminal-Ausgaben. [github.com/jasonjmcghee/rtk](https://github.com/jasonjmcghee/rtk)
- **Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang (2023)** — *"Lost in the Middle: How Language Models Use Long Contexts."* Die Originalarbeit zum Recall-Verfall in der Mitte langer Kontexte. [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
- **Anthropic Engineering** — *"Effective context engineering for AI agents"* (September 2025). Anthropics eigene Übersicht, mit besonderem Fokus auf Skills, Progressive Disclosure und Context Rot. [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- **Claude Platform Dokumentation** — *"Context windows"* (definiert Context Rot: *"As token count grows, accuracy and recall degrade"*) und *"Compaction"* für die Runtime-Mechanismen, die Claude Code als Ergänzung zu externen Memory-Dateien anbietet.
- **Claude Code Dokumentation** — *"How Claude remembers your project"* für die Auto-Memory-Funktion (v2.1.59+) und die `CLAUDE.md`-Hierarchie. [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)
- **Cobus Greyling** — sein [goal-engineering](https://github.com/cobusgreyling/goal-engineering)-Repo etabliert `GOAL.md` als Pattern für persistente Ziele über Session-Grenzen hinweg.
- **Michael Nygard** — *"Documenting Architecture Decisions"* (2011). Der Original-Blogpost zu ADRs, auf den das `DECISIONS.md`-Pattern direkt zurückgeht.
- **Zum Feld:** Die Loop-Engineering-Diskussion (Shawn Wang, Peter Steinberger, Geoff Huntley, Dex Horthy) und die Verifier-Debatte (Geoffrey Litt, Tariq Shaukat, Laurie Voss) haben auf dem AI Engineer World's Fair im Juli 2026 gemeinsam eine Bühne bekommen. Post 5 (Sensoren) und Post 8 (Loop Engineering) greifen diese Stimmen konkret auf.

[^1]: Update 05.07.2026 (Commit b0e234e): Ergänzung des agnix-Tools zur Überprüfung der Skill-Fitness.
[^2]: Update 02.07.2026 (Commit 3c8fff4): Hinzufügen der Tooling-Antwort mit TokenSave, RTK und context-mem.
