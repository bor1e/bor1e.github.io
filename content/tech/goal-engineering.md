---
title: "Goal Engineering: Wie eine Aufgabe autonom läuft, bis sie verifizierbar fertig ist"
date: 2026-08-03
draft: true
description: "Ein Prompt ist eine Bitte. Ein Ziel ist ein Vertrag mit einer Abnahmebedingung. Dieser Post zeigt, wie du in Claude Code aus 'mach mal X' ein 'X läuft, bis ein Verifier bestätigt, dass X fertig ist' machst — mit GOAL.md, Stop-Hooks und dem Subagent als unbestechlichem Prüfer."
tags: ["claude-code", "goal-engineering", "GOAL.md", "run-until-done", "verifier", "subagent"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 6
---

> *„Ich schaue Agenten nicht mehr beim Coden zu. Ich setze Requirements, und lasse sie planen, ausführen, validieren."*
> — Peter Steinberger (AI Engineer World's Fair, Juli 2026)

---

## Wo wir stehen

Fünf Posts lang hat diese Serie ein Harness gebaut. `CLAUDE.md`, Skills, Rules, Hooks, Subagents — und die Metriken, mit denen du weißt, dass es funktioniert. Jeder dieser Bausteine hat eine Eigenschaft, die bisher unausgesprochen geblieben ist: **Du startest sie.**

Ein Prompt ist etwas, das du eingibst. Ein Skill wird ausgelöst, weil du eine Aufgabe stellst, die die Description aktiviert. Ein Hook feuert, weil du eine Aktion ausgelöst hast. Selbst der Stop-Hook aus Post 4 ist reaktiv — er blockiert eine Fertig-Meldung, aber die Fertig-Meldung kam vom Modell, nicht vom System.

Peter Steinbergers Satz vom AI Engineer World's Fair markiert den nächsten Schritt: **Ein Ziel ist keine Aktion — es ist ein Zustand, den das System selbst herstellt.** Er schaut Agenten nicht mehr beim Coden zu. Er definiert, was am Ende dasein soll, und der Agent baut so lange, bis genau dieser Zustand erreicht ist.

Das ist Goal Engineering. Cobus Greyling hat den Begriff geprägt, das Muster ist heute in Claude Code produktiv umsetzbar. Dieser Post zeigt wie.

Post 7 wird zeigen, wie du das Ziel nicht mehr selbst startest — das ist Loop Engineering. Aber Loops ohne Goals sind Scheunentore. Erst das Ziel. Dann der Zeitplan.

---

## Der Unterschied zwischen einem Prompt und einem Ziel

Nimm dieselbe Aufgabe. Formuliere sie zweimal.

**Als Prompt:**
> *„Bau eine Order-Storno-Funktion. Validiere den Input, mache die DB-Mutation, expose es als REST-Endpoint. Schreib auch Tests."*

**Als Ziel:**
> *„Fertig, wenn: `POST /orders/{id}/cancel` existiert und mit HTTP 200 einen Soft-Delete auslöst. Alle bestehenden Tests grün. Neue Tests für Happy Path, doppelte Stornierung, nicht existente Order. Coverage der neuen Datei ≥ 95%. Keine bestehenden `mypy`- oder `ruff`-Warnungen erhöht. Der Code-Reviewer-Subagent approved."*

Der Prompt ist ambig. Was heißt *"schreib auch Tests"*? Wie viele? Was, wenn Claude drei Tests schreibt und einer davon nach dem ersten Refactor rot wird? *"Auch Tests"* ist gedeckt. Aus Prompt-Sicht ist die Aufgabe erledigt.

Das Ziel ist unambig. Jede der sieben Bedingungen kann ein Prozessor prüfen. Es gibt einen definierbaren Moment, an dem *"fertig"* wahr wird — und alle Momente davor sind *"noch nicht fertig"*, unabhängig davon, ob Claude glaubt, es sei fertig.

Der operative Unterschied: **Ein Prompt endet, wenn das Modell aufhört zu antworten. Ein Ziel endet, wenn ein Verifier bestätigt, dass der Endzustand erreicht ist.** In Claude Code ist der Verifier ein `Stop`-Hook. Das ist die technische Grundlage, ohne die Goal Engineering nicht funktioniert.

---

## `GOAL.md`: Das Ziel als externes Artefakt

Post 3 hat `GOAL.md` als Datei erwähnt, in der ein laufendes Ziel lebt. Jetzt zeigen wir, was drin steht.

Ein `GOAL.md` hat vier Sektionen. Sie sind nicht optional — jede beantwortet eine Frage, die das System sonst nicht beantworten könnte.

```markdown
# GOAL: Order-Storno-Endpoint

## Ziel
Kunden können bestellte Waren stornieren, bis der Versandprozess gestartet ist.
Storno ist ein Soft-Delete (Order-Status → CANCELLED, keine Datenlöschung).

## Fertig-Kriterien (Verifier prüft diese Liste)
- [ ] `POST /orders/{id}/cancel` existiert
- [ ] Endpoint gibt 200 zurück bei erfolgreichem Storno
- [ ] Endpoint gibt 409 zurück bei bereits versandter Order
- [ ] Endpoint gibt 404 zurück bei unbekannter Order-ID
- [ ] Tests für alle drei Cases existieren und sind grün
- [ ] Coverage der neuen Datei ≥ 95%
- [ ] `mypy --strict` und `ruff check` ohne neue Warnungen
- [ ] Code-Reviewer-Subagent approved (siehe .claude/agents/code-reviewer.md)

## Kontext (nicht verifiziert, aber relevant)
- Bestehende Order-Struktur: siehe src/domain/order.py
- Auth erfolgt via Sessions (siehe DECISIONS.md, 2026-07-08)
- Soft-Delete-Konvention: siehe DECISIONS.md, 2026-06-15

## Budget
- Max 30 Turns
- Max 200k Token Input, 40k Token Output
- Bei Überschreitung: anhalten und Zwischenstand in STATE.md schreiben
```

Vier Sektionen, vier verschiedene Adressaten:

**Ziel** — für Menschen, die später verstehen wollen, was hier gebaut wurde. Kein Verifier prüft das. Es ist die schriftliche Version der Anforderung.

**Fertig-Kriterien** — für den Verifier. Jede Checkbox ist eine deterministisch prüfbare Bedingung. Wenn alle Checkboxen grün sind, ist das Ziel erreicht. Wenn eine rot ist, ist es das nicht. Es gibt keine Grauzone.

**Kontext** — für Claude. Verweise auf `DECISIONS.md`, auf existierende Strukturen, auf Konventionen. Das ist die Antwort auf die Frage *"was muss ich wissen, ohne es rauszufinden?"*. Post 3 hat das Muster etabliert — hier wird es operativ.

**Budget** — für die Runtime. Der letzte Notausgang. Ein Ziel ohne Budget kann in einen Zustand laufen, in dem der Agent Runden dreht, ohne Fortschritt zu machen, und dabei Token verbrennt.

---

## Der Verifier: Ein Subagent, kein Feature des Modells

Post 2 hat Subagents als isolierten Reviewer eingeführt. Post 4 hat den `Stop`-Hook als Sensor gezeigt. Post 6 verbindet beides zu einem konkreten Muster.

Der Standardablauf für ein `GOAL.md`-getriebenes Ziel:

1. Claude liest `GOAL.md` beim Session-Start.
2. Claude arbeitet an der Umsetzung. Post-3-Skills laden bei Bedarf. Post-4-Hooks prüfen inkrementell (Lint, Types, Secrets).
3. Wenn Claude meint, fertig zu sein, meldet es *"fertig"*.
4. Der `Stop`-Hook feuert. Er tut *nicht* selbst die inhaltliche Prüfung — er delegiert an einen Verifier-Subagent.
5. Der Verifier-Subagent bekommt: den Diff, die `GOAL.md`, keinen Konversationsverlauf. Er geht die Fertig-Kriterien Checkbox für Checkbox durch.
6. Verifier gibt eines von drei Ergebnissen zurück: *approved*, *rejected mit konkreter Liste offener Punkte*, *unclear*.
7. *approved* → `Stop`-Hook Exit 0. Session endet.
8. *rejected* → `Stop`-Hook Exit 2. Claude bekommt die Liste offener Punkte und arbeitet weiter.
9. *unclear* → `Stop`-Hook Exit 2 mit Verweis auf den Menschen. Ein Ziel, das der Verifier nicht bewerten kann, ist ein schlecht formuliertes Ziel.

Der Verifier ist als Subagent implementiert, weil das den einen Vorteil hat, den kein anderer Mechanismus bietet: **Der Verifier hat den Entstehungskontext nicht.** Der Hauptagent hat eine Stunde lang gearbeitet, hat Kompromisse getroffen, hat einen bestimmten Design-Entscheidungspfad genommen — und weiß daher genau, warum eine bestimmte Ecke *"eigentlich okay"* ist. Der Verifier weiß nichts davon. Er sieht nur, was jetzt da ist, und ob es der Checkliste entspricht.

Das ist derselbe Mechanismus, den Post 2 als *"befangenheits­frei"* eingeführt hat. In Goal Engineering ist er nicht optional. Ohne isolierten Verifier hast du kein Goal Engineering — du hast einen Agenten, der sich selbst benotet.

Ein minimaler Verifier-Subagent:

```markdown
---
name: goal-verifier
description: Prüft, ob GOAL.md-Fertig-Kriterien erfüllt sind. Wird vom Stop-Hook aufgerufen, nicht vom Nutzer.
tools: Read, Grep, Bash(git diff:*, pytest:*, mypy:*, ruff:*)
disable-model-invocation: true
---

Du bist der Verifier für ein Goal-Engineering-Ziel.

Vorgehen:
1. Lies GOAL.md im Projekt-Root.
2. Gehe die Fertig-Kriterien Sektion für Sektion durch.
3. Für jede Checkbox: prüfe, ob sie erfüllt ist. Nutze die verfügbaren Tools.
4. Antwort ausschließlich als JSON:
   {
     "verdict": "approved" | "rejected" | "unclear",
     "checks": [
       { "criterion": "...", "status": "pass" | "fail" | "unclear", "evidence": "..." }
     ],
     "next_actions": ["...", "..."]
   }

Du hast keinen Zugriff auf die Konversation. Du siehst nur den aktuellen Repo-Zustand.
Wenn ein Kriterium unklar formuliert ist, markiere es "unclear" — das ist ein Problem des Ziels, nicht deines.
```

Zwei Details verdienen Aufmerksamkeit:

`disable-model-invocation: true` verhindert, dass Claude im Hauptagenten den Verifier aus Bequemlichkeit selbst aufruft. Der Verifier läuft nur, wenn der `Stop`-Hook ihn startet. Nicht früher.

Die strukturierte JSON-Antwort ist absichtlich rigide. Ein Verifier, der Prosa zurückgibt, wird interpretiert. Ein Verifier, der JSON zurückgibt, wird geparst. In der Kette *Hook → Verifier → Hook-Entscheidung* darf nichts interpretiert werden.

---

## Der Stop-Hook, der Verifier und Modell zusammenbringt

```bash
#!/bin/bash
# .claude/hooks/goal-verify.sh
# Wird als Stop-Hook konfiguriert

set -e

# Prüfe, ob überhaupt ein aktives Ziel existiert
if [ ! -f "$CLAUDE_PROJECT_DIR/GOAL.md" ]; then
  # Kein aktives Ziel — Stop-Hook macht normale Verify-Prüfung
  exec "$CLAUDE_PROJECT_DIR/.claude/hooks/verify.sh"
fi

# Infinite-Loop-Schutz (Standard-Pattern für Stop-Hooks)
input=$(cat)
if [ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0
fi

# Rufe den Verifier-Subagent headless auf (Claude-Code-Headless-Modus).
# `--agent` wählt den Subagent, `--output-format json` kapselt die
# Modell-Antwort in ein Envelope; das eigentliche Verifier-JSON liegt in .result.
raw=$(claude -p "Prüfe GOAL.md gegen die Fertig-Kriterien und antworte nur als JSON." \
  --agent goal-verifier --output-format json)

verdict=$(echo "$raw" | jq -r '.result')
result=$(echo "$verdict" | jq -r '.verdict')

case "$result" in
  approved)
    echo "Goal-Verifier: approved. Ziel erreicht." >&2
    # STATE.md aktualisieren mit Abschluss-Vermerk
    echo "## $(date -u +%Y-%m-%d) — GOAL erreicht" >> "$CLAUDE_PROJECT_DIR/STATE.md"
    exit 0
    ;;
  rejected)
    echo "Goal-Verifier: rejected. Offene Punkte:" >&2
    echo "$verdict" | jq -r '.next_actions[]' | sed 's/^/  - /' >&2
    exit 2
    ;;
  unclear)
    echo "Goal-Verifier: unclear. Menschliche Prüfung nötig." >&2
    echo "$verdict" | jq -r '.checks[] | select(.status=="unclear") | "  - \(.criterion): \(.evidence)"' >&2
    exit 2
    ;;
esac
```

Was dieses Skript tut:

Es fallback auf den normalen Verify-Hook aus Post 4, wenn kein Ziel aktiv ist. Das ist wichtig — Goal Engineering ist ein Modus, nicht ein Zustand. Nicht jede Session ist zielgetrieben.

Es fängt den Infinite-Loop-Fall ab (Post 4, Failure Modes). Ein `Stop`-Hook, der bei Rejection wieder feuert und wieder rejectet, produziert einen endlos arbeitenden Agenten.

Es delegiert die inhaltliche Entscheidung an den Verifier. Der Hook selbst hat keine Business-Logik. Er ist ein Routing-Mechanismus.

Und im Erfolgsfall aktualisiert er `STATE.md`. Damit hat die nächste Session den Kontext, den Post 3 verlangt hat: *"Hier waren wir."*

---

## Ein worked example: Eine Session mit `GOAL.md`

Was passiert konkret, wenn du das aufsetzt und `claude` startest? Ein Ablauf:

**Turn 1 — Session-Start.**
`CLAUDE.md` lädt. `GOAL.md` wird gelesen. Claude sieht: sieben Fertig-Kriterien, Kontext-Verweise auf `DECISIONS.md`, Budget von 30 Turns.

**Turn 2 — Planung.**
Claude schreibt einen kurzen Plan: was existiert, was fehlt, welche Reihenfolge. Kein Code.

**Turn 3–8 — Implementation.**
Endpoint schreiben. Tests schreiben. `PostToolUse`-Hooks (Post 4) prüfen `ruff` und `mypy` inkrementell. Zwei Lint-Warnungen, Claude korrigiert.

**Turn 9 — Zwischencheck.**
Claude läuft `pytest`. Ein Test rot: Der 409-Fall für bereits versandte Orders wird noch nicht abgefangen. Claude korrigiert.

**Turn 10 — Erste Fertig-Meldung.**
Claude meldet: *"Ich denke, das Ziel ist erreicht."*

**Stop-Hook feuert.**
Der Verifier-Subagent startet. Er hat keine Ahnung von den zehn Turns davor. Er sieht: `GOAL.md`, den Diff, das Repository.

**Verifier-Prüfung (in einem Subagent-Kontext, nicht im Hauptagenten).**
- `POST /orders/{id}/cancel` existiert? ✓ (grep)
- 200 bei erfolgreichem Storno? ✓ (pytest-Log)
- 409 bei versandter Order? ✓
- 404 bei unbekannter ID? ✗ **Kein Test gefunden.**
- Coverage ≥ 95%? ✗ **93.2%** (drei ungeteste Zweige in der Validierung)
- Lint/Types clean? ✓
- Code-Reviewer approved? — noch nicht gelaufen.

Verdict: *rejected*.

**Zurück zum Hauptagenten mit Feedback.**
Der `Stop`-Hook gibt Exit 2 zurück. Claude sieht: *"Offene Punkte: 404-Test für unbekannte Order-ID fehlt. Coverage bei 93.2%, drei Zweige in der Validierung ungetestet. Code-Reviewer-Subagent muss noch laufen."*

**Turn 11–14 — Nacharbeit.**
Claude schreibt die fehlenden Tests, dann läuft den Code-Reviewer-Subagent (separat, nicht im Verifier-Ablauf).

**Turn 15 — Zweite Fertig-Meldung.**
Claude meldet erneut *"fertig"*. Stop-Hook feuert. Verifier prüft. Alle Checkboxen grün.

**Verifier: approved. Stop-Hook Exit 0.**
`STATE.md` wird aktualisiert. Session endet.

Fünfzehn Turns statt der 30, die im Budget waren. Kein Mensch hat zwischendrin *"schau nochmal bei der 404-Behandlung"* getippt. Der Verifier hat den Zettel geschrieben. Claude hat abgearbeitet.

Das ist Goal Engineering.

---

## Was Metriken aus Post 5 hier bedeuten

Post 5 hat *Time to First Green* und *Turns bis Abschluss* als Session-Metriken definiert. In Goal Engineering bekommen sie eine schärfere Bedeutung:

- **Time to Verified Done** — nicht *Time to First Green*, sondern *Time to Verifier Approval*. Das ist die einzige Zahl, die zählt.
- **Turns bis Verifier-Approval** — inklusive der Nacharbeit-Turns nach dem ersten Rejection. Eine Session, die *"beim ersten Versuch fertig"* ist, ist selten und meist verdächtig.
- **Rejection-Rate des Verifiers** — wie oft musste Claude nacharbeiten? Eine hohe Rate ist nicht per se schlecht. Sie ist die Anzeige dafür, wie ambitioniert deine `GOAL.md`-Kriterien sind.
- **Budget-Ausnutzung** — hat die Session 40% des Budgets gebraucht oder 100%? Eine Session, die konsistent 100% braucht, hat entweder ein zu enges Budget oder ein zu vages Ziel.

Wolffs Vorbehalt aus Post 5 gilt auch hier: Diese Metriken sind Hinweise, keine Wahrheit. Eine hohe Rejection-Rate kann bedeuten, dass Claude schlampt — oder dass dein Team Kriterien aufgeschrieben hat, an denen es sich selbst gerade weiterentwickelt. Ohne das Gespräch weißt du nicht, welches.

---

## Failure Modes von Goal Engineering

**Vager Zielrahmen.** *"Fertig, wenn das Feature funktioniert"* ist kein Ziel. Es ist eine Hoffnung. Wenn der Verifier *"funktioniert"* nicht in eine Bash-Prüfung übersetzen kann, ist das Ziel nicht Goal-Engineering-fähig. Schreib es um.

**Verifier-Kollaps.** Wenn der Verifier ein Subagent ist, der dasselbe Modell wie der Hauptagent nutzt, hast du ein Homework-Grading-Problem gebaut. Der Verifier muss entweder deterministische Prüfungen ausführen (Tests, Lint, Coverage) oder mit strikten strukturellen Vorgaben arbeiten. Ein Verifier, der *"das sieht gut aus"* zurückgibt, ist Theater.

**Fehlende Budgets.** Ein Ziel ohne Turn- oder Token-Limit ist ein Ziel, das dich Geld kosten kann, während du schläfst. Immer ein Budget. Immer.

**Ziel-Drift.** Wenn Claude während der Arbeit merkt, dass ein Fertig-Kriterium schwer erreichbar ist, ist die Verlockung groß, das Kriterium unauffällig weniger streng zu interpretieren. Die Gegenmaßnahme: `GOAL.md` ist read-only während der Session. Änderungen am Ziel sind menschliche Entscheidungen, nicht agentische Anpassungen.

**Ein Ziel für zu viel.** *"Fertig, wenn das ganze Modul refactored ist"* ist zu groß für Goal Engineering. Zerteile es. Fünf kleine `GOAL.md`s hintereinander funktionieren besser als eine große. Litts *"Understanding is the new bottleneck"* aus Post 4 gilt auch hier: Wenn das Ziel so groß ist, dass niemand mehr überblickt, was sich geändert hat, hast du das Verstehen aus dem System geworfen.

**Goal ohne Team-Akzeptanz.** Wolffs Warnung, die in Post 5 zentral war: Ein `GOAL.md`, das ein einzelner Architekt geschrieben hat und das Team nie diskutiert hat, wird umgangen werden. Nicht durch Sabotage, sondern durch Interpretation. Fertig-Kriterien werden von Menschen befolgt oder relativiert — je nachdem, ob sie als *"unsere"* oder als *"seine"* Kriterien wahrgenommen werden.

---

## Die Faustregel

> *Ein Prompt endet, wenn das Modell aufhört. Ein Ziel endet, wenn ein Verifier bestätigt. Ein Ziel ohne Verifier ist ein Prompt in Verkleidung.*

Goal Engineering ist die technische Antwort auf Peter Steinbergers Verschiebung: vom Zuschauen zum Requirements-Setzen. Der `Stop`-Hook aus Post 4 ist der Ort, an dem der Verifier lebt. Der Subagent aus Post 2 ist seine Isolationskammer. `GOAL.md` aus Post 3 ist der Vertrag. Zusammen ergeben sie ein Muster, das eine Aufgabe autonom bis zum verifizierbaren Ende trägt.

Post 7 zeigt, wie du dieses Muster nicht mehr selbst startest.

---

## Was kommt als nächstes

Post 7 zeigt Loop Engineering: Ziele, die nicht mehr auf deinen Anstoß warten, sondern auf einen Zeitplan. Shawn Wangs Bogen — Chat → Tools → Goals → Loops — bekommt sein letztes Wort. Aber auch der ehrliche Gegenwind: Geoff Huntleys Kubernetes-Analogie *"nächstes Jahr die Welle der 'unsere Loops sind gescheitert'-Talks"* und Dex Horthys Erfahrung, dass Loops ohne Menschen im Kreislauf nicht funktionieren.

---

## Weiterführende Quellen

- **Cobus Greyling** — sein [goal-engineering](https://github.com/cobusgreyling/goal-engineering)-Repo etabliert das Muster, das dieser Post in Claude-Code-Primitive übersetzt. Die konzeptionelle Quelle.
- **Peter Steinberger** — Vortrag am AI Engineer World's Fair, Juli 2026. Die pointierteste Formulierung der Verschiebung vom Zuschauer zum Requirements-Setzer.
- **Anthropic Engineering** — *"Effective harnesses for long-running agents"*. Case Study zur Implementation von Long-Running-Sessions mit externem State und Verifier-Pattern. [anthropic.com/engineering/effective-harnesses-for-long-running-agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **Claude Code Subagents-Dokumentation** — [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) für Subagent-Frontmatter, insbesondere `disable-model-invocation` und tool-scoped Bash-Restriktionen.
- **Zum Feld:** Post 7 (Loop Engineering) greift Shawn Wang, Geoff Huntley und Dex Horthy konkret auf. Ihre Argumente über automatisierte Loops sind nur verständlich, wenn Goal Engineering vorher sitzt.
