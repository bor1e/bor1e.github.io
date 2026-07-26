---
title: "Das Harness in fünf Schichten: CLAUDE.md, Skills, Rules, Hooks, Subagents"
date: 2026-06-30
draft: false
description: "Post 1 hat das Harness als das beschrieben, was ein Modell von einem Agenten unterscheidet. Dieser Post zeigt, woraus das Harness in Claude Code besteht — fünf Schichten, jede mit einer eigenen Aufgabe."
tags: ["claude-code", "agentic-programming", "harness", "CLAUDE.md", "skills", "hooks", "subagents"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 2
---

> *Anker, auf die sich das Team einigt, leben in `CLAUDE.md`. Anker, die Urteilsvermögen brauchen, leben in Skills. Anker, die ein Prozessor prüfen kann, leben in Hooks.*
>
> — der Satz aus Post 1, der dieses Harness in einer Zeile beschreibt.

---

## Wo wir stehen

Post 1 hat die zentrale These der Serie etabliert: *Ein KI-Agent ist schlicht ein Modell plus ein Harness.* Das Modell entscheidet, wie klug die Antworten sind. Das Harness entscheidet, ob die Antworten zuverlässig, prüfbar und wiederholbar sind.

Was er bewusst offen gelassen hat: *Woraus besteht dieses Harness eigentlich?* Drei `CLAUDE.md`-Beispiele am Ende waren ein Vorgeschmack — aber `CLAUDE.md` ist nur eine von fünf Schichten. Dieser Post zeigt die anderen vier und wie sie zusammenspielen.

Die Leitfrage für die ganze Mechanik bleibt der Satz aus Post 1: *Anker, auf die sich das Team einigt, leben in `CLAUDE.md`. Anker, die Urteilsvermögen brauchen, leben in Skills. Anker, die ein Prozessor prüfen kann, leben in Hooks.* Subagents und Rules sind die zwei Schichten, die diese Dreiteilung verfeinern.

---

## Schicht 1 — `CLAUDE.md`: Die Verfassung des Projekts

`CLAUDE.md` ist die einzige Datei, die Claude Code beim Start jeder Session automatisch liest — ohne dass du sie erwähnst, ohne dass du sie verlinkst. Sie liegt im Projektstamm, hat keine Frontmatter, keine Konfiguration, kein Plugin-System. Sie ist einfach da.

Das macht sie zur richtigen Schicht für **alles, was immer gilt**:

- Was ist der Stack?
- Welche Befehle baut/testet/lintet das Projekt?
- Welche Standards verpflichtet sich das Projekt?
- Welche Regeln sind nicht verhandelbar?

Drei Eigenschaften machen `CLAUDE.md` mächtig — und gefährlich:

**1. Sie ist immer geladen.** Jeder Token in dieser Datei wird in jedem Turn neu bezahlt. Das ist der Grund, warum die Datei kurz sein muss. ~500 Tokens ist eine gute Obergrenze für den Anfang. Wenn deine `CLAUDE.md` 3000 Tokens hat, bezahlst du in jeder Session für Wissen, das in den meisten Sessions irrelevant ist. Das ist die Aufgabe von Skills (Schicht 2), nicht von `CLAUDE.md`.

**2. Sie ist hierarchisch.** Claude Code liest nicht nur die `CLAUDE.md` im Projektstamm. Sie liest auch:
- `~/.claude/CLAUDE.md` (deine persönlichen Präferenzen, projektübergreifend)
- `CLAUDE.md` in Unterverzeichnissen (z.B. `frontend/CLAUDE.md`)
- `CLAUDE.md` in jedem Elternverzeichnis bis zum Repository-Root

Persönliche Präferenzen gehören in `~/.claude/CLAUDE.md`. Team-Standards gehören in die Projekt-`CLAUDE.md`. Diese Trennung verhindert, dass deine Vorlieben — *"verwende immer Semantic Commit Messages"* — als Projektregel im Repo landen.

**3. Sie wird oft missbraucht.** Die häufigste Anti-Pattern: `CLAUDE.md` als Sammlung von Prozeduren. *"Um ein neues Feature zu releasen: 1. Branch erstellen, 2. Tests schreiben, 3. PR öffnen, ..."* Solche Prozeduren gehören in Skills. `CLAUDE.md` antwortet die Frage *Was gilt hier immer?*, nicht *Wie macht man X?*.

**Ein knapper Test:** Wenn ein Satz in `CLAUDE.md` für 80% der Sessions irrelevant ist, gehört er in ein Skill. Wenn er für jede Session relevant ist, gehört er in `CLAUDE.md`.

---

## Schicht 2 — Skills: Expertise auf Abruf

Skills sind Ordner unter `.claude/skills/`, jeder mit einer `SKILL.md`. Im Gegensatz zu `CLAUDE.md` werden sie **nicht** beim Session-Start geladen. Geladen wird nur die kurze Description aus dem Frontmatter — der eigentliche Inhalt erst, wenn Claude entscheidet, dass das Skill relevant ist.

Das macht Skills zur richtigen Schicht für **alles, was gezielt gebraucht wird**:

- Prozeduren (Release-Checklisten, Migration-Workflows)
- Domänenwissen, das nur für bestimmte Tasks relevant ist
- Komplexe Review-Kriterien (Code-Smells-Katalog, Architecture-Fitness-Checks)
- Workflows mit mehreren Schritten

Beispiel — ein Skill für TDD-konforme Refactorings:

```markdown
---
name: tdd-refactor
description: Wende TDD-konformes Refactoring an, wenn der Nutzer "refactor" sagt oder
  bestehender Code mit grünen Tests verbessert werden soll. NICHT verwenden für
  Bugfixes oder neue Features — nur für struktur­erhaltende Änderungen.
---

# TDD-Refactoring

## Vorbedingung
Alle Tests müssen grün sein. Wenn nicht: anhalten und sagen.

## Ablauf
1. Identifiziere das Code Smell (Long Method, Feature Envy, Duplicate Code, ...)
2. Wähle das Refactoring aus Fowlers Katalog (Extract Method, Move Function, ...)
3. Führe den Refactor in einem Schritt durch.
4. Führe die Tests aus.
5. Wenn Tests grün: commit. Wenn rot: rollback.

## Niemals
- Mehrere Refactorings in einem Commit kombinieren.
- Verhalten ändern. Refactoring ist per Definition verhaltens­neutral.
- Tests anpassen, damit sie wieder grün werden. Das ist kein Refactor — das ist
  ein verstecktes Feature.
```

Zwei Dinge an dieser Datei verdienen Aufmerksamkeit:

**Die Description ist der Trigger.** Sie ist nicht Dokumentation — sie ist der einzige Text, den Claude in jedem Turn sieht, um zu entscheiden, ob dieses Skill aktiviert wird. Eine vage Description (*"Hilft bei Refactoring"*) feuert nie. Eine präzise Description mit `wann ja` und `wann nicht` feuert genau dann, wenn sie soll.

**Progressive Disclosure.** Der Body lädt erst, wenn die Description matcht. Du kannst also 2000 Tokens detaillierte Anweisungen in einem Skill haben, ohne dass es in irrelevanten Sessions etwas kostet. Das ist der ökonomische Hebel, der `CLAUDE.md` kurz halten lässt.

**Skills *sind* die Custom Commands.** Was früher in `.claude/commands/` lag, ist in der aktuellen Claude-Code-Dokumentation in Skills aufgegangen: Eine `SKILL.md` ist gleichzeitig die Wissensquelle *und* der Slash-Command. Eine Datei wie `.claude/skills/deploy/SKILL.md` erzeugt automatisch `/deploy`. Das Frontmatter steuert das Invocation-Verhalten: `user-invocable: false` versteckt das Skill aus dem Slash-Menü (dann nur automatisch via Description-Match), `disable-model-invocation: true` macht es ausschließlich manuell aufrufbar — nützlich für Skills mit Seiteneffekten wie Deployments. Bestehende `.claude/commands/`-Dateien funktionieren weiter, sind aber inzwischen Kompatibilitäts-Alias, nicht eigenes Primitiv.

Skills sind die Schicht, in die die meisten benannten Anker aus den `CLAUDE.md`-Beispielen von Post 1 ihre operative Heimat finden: `design-by-contract/SKILL.md`, `review-for-code-smells/SKILL.md`, `hexagonal-architecture/SKILL.md`. `CLAUDE.md` nennt sie; Skills entfalten sie.

---

## Schicht 3 — Rules: Pfad-gebundenes Verhalten

Rules sind die unterschätzte Schicht. Sie leben in `.claude/rules/` und sind kurze Markdown-Dateien, die jeweils an einen oder mehrere Pfade gebunden sind. Claude wendet eine Rule an, wenn die gerade bearbeitete Datei zu einem der Glob-Patterns im `paths`-Feld passt.

Beispiel — `.claude/rules/tests.md`:

```markdown
---
paths:
  - "tests/**/*.py"
---

In Testdateien:
- Mache niemals echte HTTP-Calls. Nutze stattdessen `responses` oder `httpx_mock`.
- Niemals `time.sleep`. Nutze `freezegun` oder `pytest-asyncio` Fixtures.
- Ein Test pro Verhalten. Keine Mega-Tests mit 15 Assertions.
```

Warum Rules statt `CLAUDE.md`? Weil diese Regeln nur in Testdateien gelten. In `src/` willst du sie nicht — dort ist `time.sleep` manchmal die richtige Wahl. Würden diese drei Punkte in `CLAUDE.md` stehen, würde Claude versuchen, sie überall anzuwenden, mit absurden Konsequenzen. Eine Rule ohne `paths`-Feld lädt dagegen unbedingt — das ist `CLAUDE.md`-Verhalten über einen Umweg und meist nicht, was du willst.

Rules sind, wo `CLAUDE.md`'s *"hier gilt immer X"* auf die Realität trifft, dass Projekte aus Bereichen bestehen, in denen unterschiedliche Dinge gelten. Frontend ≠ Backend ≠ Tests ≠ Infrastructure. Jeder Bereich bekommt seine Rules; `CLAUDE.md` bleibt frei für das, was projektweit gilt.

**Die einfache Heuristik:** Wenn eine Regel nur in einem Teilbaum gilt, ist es eine Rule. Wenn sie überall gilt, ist es `CLAUDE.md`. Wenn sie eine Prozedur ist, ist es ein Skill.

---

## Schicht 4 — Hooks: Deterministische Durchsetzung

Hier verschiebt sich das Harness von *Anleitung* zu *Durchsetzung*. `CLAUDE.md`, Skills und Rules sind alle **inferentiell** — sie hängen davon ab, dass das Modell die Anweisung liest, versteht und befolgt. Modelle sind gut darin. Aber sie sind nicht deterministisch.

Hooks sind. Ein Hook ist ein Shell-Befehl, den die Claude-Code-Runtime — nicht das Modell — bei einem bestimmten Event ausführt. Wenn der Hook Exit-Code 2 zurückgibt, ist die Aktion blockiert. Das Modell hat keine Wahl.

Konfiguriert in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "ruff check $CLAUDE_PROJECT_DIR/src"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/verify.sh"
          }
        ]
      }
    ]
  }
}
```

Was dieser Block bewirkt:

- **Nach jedem Edit oder Write:** `ruff` läuft. Wenn Lint-Fehler auftauchen, sieht Claude sie sofort und korrigiert sie im nächsten Turn.
- **Bevor Claude eine Aufgabe als abgeschlossen markiert:** `verify.sh` läuft. Dieses Script kann Tests ausführen, Type-Checks erzwingen, Security-Scans triggern. Wenn es Exit-Code 2 zurückgibt, ist die Aufgabe nicht fertig — egal was Claude denkt.

**Die wichtigste Hook-Kategorie für Anfänger:** PreToolUse für Sicherheit. Ein Hook, der bei jedem `Write` prüft, ob Secrets oder Tokens im Commit landen, ist die billigste Versicherung gegen die schlimmste Klasse von Vibe-Coding-Fehlern. Implementierung in vier Zeilen Bash. Schutz auf Dauer.

**Die Faustregel aus Post 1, präzisiert:** Anker, die ein Linter, ein Type-Checker oder ein Test-Runner prüfen kann, gehören in einen Hook — nicht in `CLAUDE.md`. Sie als Prosa-Anweisung im Kontext zu führen, ist Token-Verbrennung für etwas, das ein Shell-Befehl in 50 Millisekunden deterministisch entscheidet.

---

## Schicht 5 — Subagents: Der isolierte Reviewer

Die ersten vier Schichten formen, was *der* Agent tut. Subagents führen einen zweiten Agenten in einem frischen Kontext aus, mit eingeschränktem Tool-Zugriff, für eine fokussierte Aufgabe.

Der typische Use Case: Review. Der Hauptagent hat eine Stunde lang Code geschrieben, hat den Diff im Kontext, hat eine Idee davon, *warum* der Code so aussieht — und genau das macht ihn zu einem schlechten Reviewer. Er ist befangen.

Ein Subagent, definiert in `.claude/agents/code-reviewer.md`, bekommt nur:
- den Diff
- die Review-Kriterien (z.B. via `allowed_skills: ["review-for-code-smells"]`)
- nicht die Konversation, nicht den Entstehungs­kontext

Beispiel:

```markdown
---
name: code-reviewer
description: Reviewt einen Diff gegen die Projekt-Standards. Aktiviert vor jedem
  Commit oder wenn der Nutzer explizit "review" sagt.
tools: Read, Grep, Bash(git diff:*)
allowed_skills: ["review-for-code-smells"]
---

Du bekommst einen Diff und reviewst ihn gegen:
- SOLID Principles
- Fowlers Code-Smells-Katalog
- Die Hard Rules aus CLAUDE.md

Du hast keinen Zugriff auf die Entstehungs­geschichte des Codes. Du siehst nur,
was jetzt da ist. Das ist Absicht.

Antworte mit:
1. Approve, Approve-with-Comments, oder Request-Changes
2. Konkrete Fundstellen (Datei:Zeile + Befund)
3. Maximal drei strukturelle Beobachtungen
```

Die `description` ist auch hier der Delegations-Trigger — der einzige Text, den der Hauptagent in jedem Turn sieht, um zu entscheiden, ob der Subagent aktiviert wird. Die `tools`-Zeile schränkt ein, *was* der Subagent darf; `allowed_skills` schränkt ein, *welches Wissen* er nutzen darf. Beides zusammen formt einen Reviewer, der gezielt für eine Aufgabe gebaut ist — nicht ein zweiter Generalist mit frischem Kontext.

Subagents sind die Schicht, die die Curse-of-Knowledge-Sidebar aus Post 1 operationalisiert: Der Hauptagent hat das Wissen über die Entstehung; der Subagent hat den Vorteil, es nicht zu haben.

---

## Wie die Schichten zusammenspielen

Eine typische agentische Session in Claude Code, die alle fünf Schichten nutzt:

1. **Session-Start.** `CLAUDE.md` lädt: Stack, Standards, Hard Rules sind im Kontext.
2. **Du gibst eine Aufgabe.** *"Implementiere Order-Validierung."*
3. **Claude liest Rules.** `.claude/rules/domain.md` matcht, weil die Aufgabe in `src/domain/` landet. Hexagonal-Architecture-Konventionen sind aktiv.
4. **Claude aktiviert Skills.** Die Description von `design-by-contract/SKILL.md` matcht — neue öffentliche API. Skill lädt.
5. **Claude schreibt Code.** Edit-Events.
6. **`PostToolUse`-Hook feuert.** `ruff` und `mypy` laufen. Lint-Fehler erscheinen im Kontext. Claude korrigiert.
7. **Claude meldet: "Fertig."**
8. **`Stop`-Hook feuert, bevor Claude die Aufgabe als abgeschlossen meldet.** `verify.sh` läuft Tests. Tests rot. Hook blockiert. Claude muss weiterarbeiten.
9. **Tests grün. Stop-Hook lässt durch.**
10. **Du startest den Subagent.** `code-reviewer` läuft mit dem Diff, ohne Kontext. Findet zwei Smells. Du entscheidest.

Keine dieser zehn Schritte ist Theorie. Alle sind heute in Claude Code konfigurierbar. Der Aufwand für die initiale Einrichtung — eine `CLAUDE.md`, zwei Skills, eine Rule, zwei Hooks, einen Subagent — ist ein Nachmittag. Die Auszahlung ist jede folgende Session.

---

## Failure Modes pro Schicht

**`CLAUDE.md`:** Anchor-Stuffing (aus Post 1) und Prozedur-Verwechslung — Prozeduren gehören in Skills.

**Skills:** Vage Descriptions, die nie matchen. Wenn ein Skill drei Sessions lang nicht aktiviert wurde, obwohl es sollte: die Description prüfen, nicht den Body.

**Rules:** Zu breit gefasste `paths`-Patterns. Eine Rule für `**/*.py` ist keine Rule — es ist `CLAUDE.md` mit Umweg.

**Hooks:** Lang laufende Hooks. Wenn dein `PostToolUse`-Hook fünf Sekunden braucht, wird jede Session zur Geduldsprobe. Hooks müssen blitzschnell sein. Wenn nicht: in einen Background-Job auslagern und das Ergebnis im Nachgang prüfen.

**Subagents:** Zu viel Kontext mitgeben. Ein Subagent, dem du die ganze Konversation mitgibst, verliert seinen Vorteil. Die Isolation *ist* der Mechanismus.

---

## Die Faustregel

> *Inferentielles in `CLAUDE.md`, Skills und Rules. Deterministisches in Hooks. Befangenheits­freies in Subagents.*

Das ist die Mechanik des Harness. Die nächsten Posts vertiefen einzelne Schichten — Skills und Context Engineering in Post 3, Hooks als Sensoren in Post 5, Goal Engineering in Post 6. Aber der Bauplan steht.

---

## Was kommt als nächstes

Post 3 untersucht, warum größere Kontextfenster das Recall-Problem nicht lösen — und warum Skills und externe Memory-Dateien die eigentliche Antwort sind.

---

## Weiterführende Quellen

**Warum dieses Design existiert**

- **Martin Fowler — [Harness Engineering](https://martinfowler.com/articles/harness-engineering.html)** — der abstrakte Rahmen, dessen konkrete Implementierung dieser Post ist. Fowler beschreibt das *Warum*; die fünf Schichten sind das *Wie* in Claude Code.
- **Anthropic — [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — die architektonischen Muster (Workflow vs. Agent, der augmentierte LLM, Orchestrator-Workers), die die Fünf-Schichten-Mechanik operationalisiert.

**Die Mechanik im Detail**

- **Claude Code Dokumentation** — [code.claude.com/docs](https://code.claude.com/docs) für die kanonischen Referenzen zu `CLAUDE.md`, Skills, Hooks, Subagents und der `settings.json`-Hierarchie.
- **Anthropic Engineering Blog** — *"Steering Claude Code: skills, hooks, rules, subagents and more"* — die offizielle Übersicht über die Mechanik, inklusive Context-Cost-Tabelle.
- **anthropics/skills** — [github.com/anthropics/skills](https://github.com/anthropics/skills) — Anthropics offizielle Skills für Beispiele gut geformter `SKILL.md`-Dateien.
- **Hidekazu Konishis Claude-Code-Referenz** — die ausführlichste implementierungs­nahe Dokumentation außerhalb von Anthropic selbst.
