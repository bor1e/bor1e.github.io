---
title: "Kontextfenster, Skills und externe Memory: Warum 'mehr Tokens' das falsche Problem löst"
date: 2026-07-01
draft: false
description: "Größere Kontextfenster sind nicht die Antwort auf das Recall-Problem. Modelle vergessen in der Mitte, und Sessions enden — beides löst kein Token-Limit. Skills und externe Memory-Dateien lösen es."
tags: ["claude-code", "context-engineering", "skills", "external-memory", "CLAUDE.md", "lost-in-the-middle"]
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

## Das Recall-Problem: Lost in the Middle

Anthropic gibt Claude in der aktuellen Generation 200.000 Tokens Kontextfenster. Das klingt nach genug für jede vorstellbare Aufgabe. In der Praxis ist es das nicht — nicht weil 200k zu klein wären, sondern weil **das Modell innerhalb dieser 200k nicht gleichmäßig gut liest**.

Das Phänomen heißt *Lost in the Middle* und ist seit dem Papier von Liu et al. (2023) gut dokumentiert: Modelle erinnern sich überdurchschnittlich gut an das, was am Anfang und am Ende ihres Kontextfensters steht. Was in der Mitte landet — und in einer langen Session ist das eine Menge — wird mit deutlich niedrigerer Treffsicherheit abgerufen.

Konkret bedeutet das:

- Eine Entscheidung, die du in Turn 4 getroffen hast, ist in Turn 47 schwerer abrufbar als die, die du gerade in Turn 46 getroffen hast.
- Ein Architecture-Prinzip, das du am Session-Anfang etabliert hast, wird in der Mitte einer langen Implementierung vergessener, je weiter du arbeitest.
- Eine Hard Rule aus `CLAUDE.md` ist robuster — sie steht am Anfang. Aber Rules, die ein Skill in Turn 30 nachgeladen hat? Die sind angreifbar.

**Größere Kontextfenster verschlimmern das Problem.** Ein 1M-Token-Fenster hat mehr Mitte als ein 200k-Fenster. Wer mehr Token hineinschüttet, vergisst nicht weniger — er vergisst nur Anderes.

Die operative Konsequenz: *Was du in einer langen Session konsistent durchsetzen willst, muss entweder ans Ende des Kontexts gelangen (per Hook-Ausgabe oder Skill-Reload) oder gar nicht erst in der Mitte verloren gehen.* Das zweite ist billiger.

---

## Die erste Antwort: Progressive Disclosure über Skills

Post 2 hat Skills als "Expertise auf Abruf" eingeführt. Hier ist der ökonomische Grund, warum dieser Mechanismus existiert.

Ein Skill hat zwei Lade-Stufen:

**Stufe 1 — Description.** Die ~50 Tokens aus dem Frontmatter sind immer im Kontext. Sie sind das Schild an der Tür: *"Wenn du X tust, schau hier rein."*

**Stufe 2 — Body.** Die eigentlichen 500–2000 Tokens des Skills laden erst, wenn die Description matcht. Vorher kosten sie nichts.

Und seit der Vereinheitlichung von Custom Commands in Skills lädt eine `SKILL.md` zusätzlich als Slash-Command — derselbe Mechanismus, anderer Trigger.

Das klingt wie eine triviale Optimierung. Es ist keine. Es ist der Mechanismus, der `CLAUDE.md` kurz halten lässt, *ohne* Wissen zu verlieren. Ein Projekt mit 30 benannten Standards in `CLAUDE.md` ist unbenutzbar — jeder Turn bezahlt 4000 Tokens für Standards, von denen 28 gerade irrelevant sind. Dasselbe Projekt mit 5 Standards in `CLAUDE.md` und 25 in Skills bezahlt 700 Tokens pro Turn — und lädt den Rest nur dann, wenn er gebraucht wird.

Aber Progressive Disclosure löst nicht nur das Token-Ökonomie-Problem. Sie löst auch das Lost-in-the-Middle-Problem, weil ein Skill, das in Turn 30 frisch lädt, **am Ende des Kontexts steht**. Es ist nicht in der Mitte versteckt — es ist gerade ankommend, hochaufgelöst, mit voller Recall-Treffsicherheit. Skills sind nicht nur ein Speicher-Trick. Sie sind ein **Positions-Trick**.

Ein konkretes Beispiel. Stell dir vor, ein Skill `design-by-contract/SKILL.md` definiert, wie öffentliche APIs in deinem Projekt mit Pre-/Postconditions und Invarianten dokumentiert werden. Drei Optionen:

| Wo lebt das Wissen? | Token-Kosten pro Turn | Recall in Turn 47 |
|---|---|---|
| `CLAUDE.md` (immer geladen) | ~800 Tokens × jeder Turn | Schwach — steht in der Mitte |
| Skill (on-demand) | ~50 Tokens (Description) + 800 nur bei Matches | Stark — frisch geladen |
| Nirgends, im Prompt erklärt | 0 normalerweise, aber bei jedem Bedarf neu | Inkonsistent |

Die mittlere Zeile gewinnt. Skills sind die Schicht, die die meisten der benannten Anker aus deinen `CLAUDE.md`-Beispielen (Post 1) übernehmen sollten — nicht aus Geiz, sondern aus Recall-Treffsicherheit.

---

## Das Session-Grenze-Problem

Selbst wenn jedes Skill perfekt designed ist, bleibt ein Problem ungelöst: **die Session endet**. Du schließt das Terminal, gehst essen, kommst zurück. Was bleibt?

`CLAUDE.md` bleibt. Skills bleiben. Aber alles, was *in der Session passiert ist* — die Entscheidung, dass das Auth-Modul auf Sessions statt JWTs umgestellt wird, der Kompromiss, dass die Migration in zwei Schritten läuft, das offene TODO, in der nächsten Session den Repository-Layer zu refaktorieren — verschwindet, sobald die Konversation endet.

Die naive Antwort ist *"merk's dir halt"*. Aber das ist nicht das Modell-Versagen — es ist Modell-Design. Sessions sind per Definition zustandslos. Was zwischen Sessions persistieren soll, muss **außerhalb der Session** leben.

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

Wenn du Goal Engineering (Post 5) ernst meinst, ist `GOAL.md` die Datei, in der ein laufendes Ziel lebt — was erreicht werden soll, woran "fertig" erkennbar ist, was bisher geprüft wurde. Mehr dazu in Post 5.

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
- **`DECISIONS.md`** — alle nicht-trivialen Architecture-Entscheidungen
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

**`STATE.md` als Tagebuch.** Wenn `STATE.md` zur narrativen Zusammenfassung jeder Session wird, wächst sie ins Bodenlose. Sie soll *aktuell* sein, nicht *historisch*. Was nicht mehr relevant ist, kommt raus.

**Skills statt Memory.** Skills lösen das Recall-Problem, nicht das Session-Grenze-Problem. Eine Entscheidung, die zwischen Sessions persistieren soll, gehört in `DECISIONS.md`, nicht in ein Skill. Skills sind Wissen über *Verfahren*. Memory ist Wissen über *Geschichte*.

**Verlassen auf 1M-Token-Fenster.** Wenn deine Antwort auf das Recall-Problem *"warten, bis das Fenster größer wird"* ist — du hast das Problem nicht verstanden. Mehr Mitte ist mehr Vergessen.

---

## Die Faustregel

> *Was in jedem Turn gilt: `CLAUDE.md`. Was on-demand gebraucht wird: Skills. Was zwischen Sessions persistieren muss: externe Memory-Dateien.*

Die drei Schichten lösen drei verschiedene Probleme — und sie lassen sich nicht gegeneinander ersetzen. Ein Projekt, das alles in `CLAUDE.md` packt, verbrennt Tokens. Ein Projekt, das alles in Skills packt, verliert Memory. Ein Projekt, das alles in `DECISIONS.md` packt, hat keinen Trigger.

Das nennt man Context Engineering. Es ist die Disziplin, *wo* Wissen lebt — nicht *wie viel* davon im Modell-Kontext liegt.

---

## Was kommt als nächstes

Post 4 vertieft Hooks: die Sensor-Schicht. Welche Events gibt es, was kann ein Hook blockieren, und wo zieht man die Grenze zwischen "Modell soll das wissen" und "Hook soll das erzwingen."

---

## Weiterführende Quellen

- **Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang (2023)** — *"Lost in the Middle: How Language Models Use Long Contexts"* — die Originalarbeit zum Recall-Verfall in der Mitte langer Kontexte. [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
- **Anthropic Engineering** — *"Effective context engineering for AI agents"* — die offizielle Übersicht, mit besonderem Fokus auf Skills und Progressive Disclosure. [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- **Cobus Greyling** — sein [goal-engineering](https://github.com/cobusgreyling/goal-engineering)-Repo etabliert `GOAL.md` als Pattern für persistente Ziele über Session-Grenzen hinweg.
- **Architecture Decision Records (ADR)** — Michael Nygards Original-Blogpost *"Documenting Architecture Decisions"* (2011) — das Pattern, auf das `DECISIONS.md` direkt zurückgeht.
- **Claude Code Dokumentation** — [code.claude.com/docs](https://code.claude.com/docs) — zu `CLAUDE.md`-Hierarchie, Skill-Progressive-Disclosure und Custom-Memory-Patterns.
