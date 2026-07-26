---
title: "Goal Engineering: Wie eine Aufgabe autonom läuft, bis sie verifizierbar fertig ist"
date: 2026-07-08
draft: false
description: "Ein Prompt ist eine Bitte. Ein Ziel ist ein Vertrag mit einer Abnahmebedingung. Dieser Post zeigt, wie du in Claude Code aus 'mach mal X' ein 'X läuft, bis ein Verifier bestätigt, dass X fertig ist' machst — mit GOAL.md, Stop-Hooks und einem deterministischen Verifier-Skript als unbestechlichem Prüfer."
tags: ["claude-code", "goal-engineering", "GOAL.md", "run-until-done", "verifier", "stop-hook"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 7
---

> *Nicht mehr beim Coden zusehen — Requirements setzen und den Agenten planen, ausführen und validieren lassen.*
> — sinngemäß nach Peter Steinberger (AI Engineer World's Fair, Juli 2026)

---

## Wo wir stehen

Fünf Posts lang hat diese Serie ein Harness gebaut. `CLAUDE.md`, Skills, Rules, Hooks, Subagents — und die Metriken, mit denen du weißt, dass es funktioniert. Jeder dieser Bausteine hat eine Eigenschaft, die bisher unausgesprochen geblieben ist: **Du startest sie.**

Ein Prompt ist etwas, das du eingibst. Ein Skill wird ausgelöst, weil du eine Aufgabe stellst, die die Description aktiviert. Ein Hook feuert, weil du eine Aktion ausgelöst hast. Selbst der Stop-Hook aus Post 5 ist reaktiv — er blockiert eine Fertig-Meldung, aber die Fertig-Meldung kam vom Modell, nicht vom System.

Was Peter Steinberger auf dem AI Engineer World's Fair sinngemäß beschrieben hat, markiert den nächsten Schritt: **Ein Ziel ist keine Aktion — es ist ein Zustand, den das System selbst herstellt.** Er schaut Agenten nicht mehr beim Coden zu. Er definiert, was am Ende dasein soll, und der Agent baut so lange, bis genau dieser Zustand erreicht ist.

Das ist Goal Engineering. Cobus Greyling hat den Begriff geprägt, das Muster ist heute in Claude Code produktiv umsetzbar. Dieser Post zeigt wie.

Post 8 wird zeigen, wie du das Ziel nicht mehr selbst startest — das ist Loop Engineering. Aber Loops ohne Goals sind Scheunentore. Erst das Ziel. Dann der Zeitplan.

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

## Der Verifier: Ein deterministisches Skript, kein Urteil des Modells

Post 5 hatte eine scharfe Regel: Was ein Prozessor prüfen kann, prüft ein Hook — deterministisch, nicht inferentiell. Goal Engineering nimmt diese Regel beim Wort. **Der Verifier eines Ziels ist kein zweites Modell, das den Output bewertet. Er ist ein Bash-Skript, das die Fertig-Kriterien gegen den Repo-Zustand ausführt.**

Das klingt bescheidener als *"ein befangenheitsfreier Reviewer"* — ist aber stärker. Ein Skript hat keinen Anteil am Code. Es kennt die zehn Turns nicht, die zum aktuellen Stand geführt haben, es kennt die Kompromisse nicht, die unterwegs getroffen wurden, und es kann sich keine Ecke schönreden, weil sie *"eigentlich okay"* ist. `pytest`, `ruff`, `mypy` und ein paar `grep`s führen aus — sie urteilen nicht. Genau darin liegt die Unbestechlichkeit: Der Verifier ist non-inferentiell.

Die Grenze dieses Ansatzes ist klar: Ein Skript kann *"404 bei unbekannter ID"* prüfen, aber nicht *"folgt SOLID"*. Urteilsbehaftete Kriterien bleiben eine Sache für Menschen oder für einen Subagenten. Deshalb steht in der `GOAL.md` genau *ein* solches Kriterium — *"Code-Reviewer-Subagent approved"* — und es wird nicht vom Stop-Hook geprüft, sondern vom Hauptagenten während der Arbeit **ausgeführt**: Claude ruft den Code-Reviewer-Subagenten (Post 2) auf, und dessen Votum wird als Artefakt festgehalten (eine Marker-Datei). Das Verifier-Skript prüft am Ende nur noch, ob dieser Marker existiert — es fällt das Urteil nicht selbst.

Der Standardablauf für ein `GOAL.md`-getriebenes Ziel:

1. Claude liest `GOAL.md` beim Session-Start.
2. Claude arbeitet an der Umsetzung. Post-3-Skills laden bei Bedarf. Post-4-Hooks prüfen inkrementell (Lint, Types, Secrets).
3. Wenn Claude nah am Ziel ist, ruft es den Code-Reviewer-Subagenten auf und schreibt bei Approval einen Marker (`.goal/review-approved`).
4. Wenn Claude meint, fertig zu sein, meldet es *"fertig"*.
5. Der `Stop`-Hook feuert. Er ruft **nicht** das Modell, sondern das deterministische Verifier-Skript.
6. Das Skript geht die Fertig-Kriterien Checkbox für Checkbox durch — jede als konkrete Bash-Prüfung.
7. Alle Prüfungen grün → Exit 0. Session endet.
8. Mindestens eine rot → Exit 2. Claude bekommt die Liste offener Punkte auf `stderr` und arbeitet weiter.

Das ist derselbe Gedanke, den Post 2 als *"befangenheitsfrei"* eingeführt hat — nur in seiner härtesten Form: Ein Skript hat gar kein Urteil, das befangen sein könnte. Ohne diese Trennung hast du kein Goal Engineering — du hast einen Agenten, der sich selbst benotet.

---

## Der Stop-Hook, der die Kriterien prüft

```bash
#!/bin/bash
# .claude/hooks/goal-verify.sh — als Stop-Hook konfiguriert.
# Prüft die Fertig-Kriterien aus GOAL.md deterministisch. Kein Modell, kein Urteil.

set -uo pipefail

PROJECT="${CLAUDE_PROJECT_DIR:-.}"

# Kein aktives Ziel? -> normaler Verify-Hook aus Post 5
if [ ! -f "$PROJECT/GOAL.md" ]; then
  exec "$PROJECT/.claude/hooks/verify.sh"
fi

# Infinite-Loop-Schutz (Standard-Pattern für Stop-Hooks)
input=$(cat)
if [ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0
fi

open=()  # sammelt offene Punkte

# 1. Endpoint existiert?
grep -rq 'orders/{id}/cancel\|orders/<.*>/cancel' "$PROJECT/src" \
  || open+=("Endpoint POST /orders/{id}/cancel nicht gefunden")

# 2.–5. Verhalten + Tests: Suite grün? (200/409/404 werden in den Tests abgedeckt)
if ! pytest -q "$PROJECT/tests" >/tmp/goal-pytest.log 2>&1; then
  open+=("Tests rot — siehe /tmp/goal-pytest.log")
fi

# 6. Coverage der neuen Datei >= 95%?
cov=$(pytest --cov=src/api/orders --cov-report=term -q "$PROJECT/tests" 2>/dev/null \
  | awk '/orders/ {gsub(/%/,"",$NF); print $NF}' | tail -1)
if [ -z "${cov:-}" ] || [ "${cov%.*}" -lt 95 ]; then
  open+=("Coverage der neuen Datei bei ${cov:-?}% (< 95%)")
fi

# 7. Types + Lint ohne neue Warnungen?
mypy --strict "$PROJECT/src" >/dev/null 2>&1 || open+=("mypy --strict meldet Fehler")
ruff check "$PROJECT/src"   >/dev/null 2>&1 || open+=("ruff check meldet Warnungen")

# 8. Code-Reviewer-Subagent approved? (Marker, den der Hauptagent nach dem Review schreibt)
if [ ! -f "$PROJECT/.goal/review-approved" ]; then
  open+=("Code-Reviewer-Subagent hat noch nicht approved")
fi

# Auswertung
if [ ${#open[@]} -eq 0 ]; then
  echo "Goal-Verifier: alle Kriterien erfüllt. Ziel erreicht." >&2
  echo "## $(date -u +%Y-%m-%d) — GOAL erreicht" >> "$PROJECT/STATE.md"
  exit 0
fi

echo "Goal-Verifier: Ziel noch nicht erreicht. Offene Punkte:" >&2
printf '  - %s\n' "${open[@]}" >&2
exit 2
```

Was dieses Skript tut:

Es fällt auf den normalen Verify-Hook aus Post 5 zurück, wenn kein Ziel aktiv ist. Das ist wichtig — Goal Engineering ist ein Modus, nicht ein Zustand. Nicht jede Session ist zielgetrieben.

Es fängt den Infinite-Loop-Fall ab (Post 5, Failure Modes). Ein `Stop`-Hook, der bei Rejection wieder feuert und wieder rejectet, produziert einen endlos arbeitenden Agenten.

Es prüft jedes Fertig-Kriterium als konkrete Bash-Prüfung und sammelt die offenen Punkte in einem Array. Die Rückmeldung an Claude ist die Liste auf `stderr` plus Exit 2 — genau das Format, das Post 5 als *"stderr-Disziplin"* verlangt hat: nicht *"failed"*, sondern *welches* Kriterium warum offen ist.

Und im Erfolgsfall aktualisiert es `STATE.md`. Damit hat die nächste Session den Kontext, den Post 3 verlangt hat: *"Hier waren wir."*

> **Randnotiz — der mächtigere Weg.** Wer echte Subagent-Isolation mit strukturierten JSON-Antworten statt Exit-Codes will, implementiert den Verifier über das **Claude Agent SDK** (Python oder TypeScript) und lässt ihn dort als eigenständigen Agenten mit Tool-Zugriff laufen. Das ist ausdrucksstärker, bringt aber eine SDK-Abhängigkeit mit, die die restliche Serie bewusst nicht hat. Für das *Muster* — GOAL.md, Verifier, Stop-Hook — reicht Bash. Deshalb hier der Bash-Weg; die SDK-Variante ist einen eigenen Post wert.

---

## Ein worked example: Eine Session mit `GOAL.md`

Was passiert konkret, wenn du das aufsetzt und `claude` startest? Ein Ablauf:

**Turn 1 — Session-Start.**
`CLAUDE.md` lädt. `GOAL.md` wird gelesen. Claude sieht: sieben Fertig-Kriterien, Kontext-Verweise auf `DECISIONS.md`, Budget von 30 Turns.

**Turn 2 — Planung.**
Claude schreibt einen kurzen Plan: was existiert, was fehlt, welche Reihenfolge. Kein Code.

**Turn 3–8 — Implementation.**
Endpoint schreiben. Tests schreiben. `PostToolUse`-Hooks (Post 5) prüfen `ruff` und `mypy` inkrementell. Zwei Lint-Warnungen, Claude korrigiert.

**Turn 9 — Zwischencheck.**
Claude läuft `pytest`. Ein Test rot: Der 409-Fall für bereits versandte Orders wird noch nicht abgefangen. Claude korrigiert.

**Turn 10 — Erste Fertig-Meldung.**
Claude meldet: *"Ich denke, das Ziel ist erreicht."*

**Stop-Hook feuert.**
Das Verifier-Skript läuft. Es kennt die zehn Turns davor nicht — es kennt nur den Repo-Zustand und die Checkliste. Es führt die Prüfungen aus:

- `POST /orders/{id}/cancel` existiert? ✓ (grep)
- 200 bei erfolgreichem Storno? ✓ (pytest grün)
- 409 bei versandter Order? ✓
- 404 bei unbekannter ID? ✗ **Kein Test — pytest deckt den Fall nicht ab.**
- Coverage ≥ 95%? ✗ **93.2%** (drei ungetestete Zweige in der Validierung)
- Lint/Types clean? ✓
- Code-Reviewer approved? ✗ **Marker `.goal/review-approved` fehlt — Review noch nicht gelaufen.**

Ergebnis: Exit 2, drei offene Punkte.

**Zurück zum Hauptagenten mit Feedback.**
Claude sieht auf `stderr`: *"Offene Punkte: 404-Test für unbekannte Order-ID fehlt. Coverage bei 93.2%, drei Zweige in der Validierung ungetestet. Code-Reviewer-Subagent hat noch nicht approved."*

**Turn 11–14 — Nacharbeit.**
Claude schreibt die fehlenden Tests, bringt die Coverage über 95%, ruft dann den Code-Reviewer-Subagenten auf. Der Reviewer approved — Claude schreibt `.goal/review-approved`.

**Turn 15 — Zweite Fertig-Meldung.**
Claude meldet erneut *"fertig"*. Stop-Hook feuert. Das Skript prüft. Alle Kriterien grün.

**Exit 0.**
`STATE.md` wird aktualisiert. Session endet.

Fünfzehn Turns statt der 30, die im Budget waren. Kein Mensch hat zwischendrin *"schau nochmal bei der 404-Behandlung"* getippt. Das Verifier-Skript hat den Zettel geschrieben. Claude hat abgearbeitet.

Das ist Goal Engineering.

---

## Was Metriken aus Post 6 hier bedeuten

Post 6 hat *Time to First Green* und *Turns bis Abschluss* als Session-Metriken definiert. In Goal Engineering bekommen sie eine schärfere Bedeutung:

- **Time to Verified Done** — nicht *Time to First Green*, sondern *Time to Verifier Approval*. Das ist die einzige Zahl, die zählt.
- **Turns bis Verifier-Approval** — inklusive der Nacharbeit-Turns nach dem ersten Rejection. Eine Session, die *"beim ersten Versuch fertig"* ist, ist selten und meist verdächtig.
- **Rejection-Rate des Verifiers** — wie oft musste Claude nacharbeiten? Eine hohe Rate ist nicht per se schlecht. Sie ist die Anzeige dafür, wie ambitioniert deine `GOAL.md`-Kriterien sind.
- **Budget-Ausnutzung** — hat die Session 40% des Budgets gebraucht oder 100%? Eine Session, die konsistent 100% braucht, hat entweder ein zu enges Budget oder ein zu vages Ziel.

Wolffs Vorbehalt aus Post 6 gilt auch hier: Diese Metriken sind Hinweise, keine Wahrheit. Eine hohe Rejection-Rate kann bedeuten, dass Claude schlampt — oder dass dein Team Kriterien aufgeschrieben hat, an denen es sich selbst gerade weiterentwickelt. Ohne das Gespräch weißt du nicht, welches.

---

## Failure Modes von Goal Engineering

**Vager Zielrahmen.** *"Fertig, wenn das Feature funktioniert"* ist kein Ziel. Es ist eine Hoffnung. Wenn der Verifier *"funktioniert"* nicht in eine Bash-Prüfung übersetzen kann, ist das Ziel nicht Goal-Engineering-fähig. Schreib es um.

**Verifier-Kollaps.** Ein Verifier, der selbst ein Modell ist — noch dazu dasselbe wie der Hauptagent — benotet seine eigenen Hausaufgaben. Genau deshalb ist der Verifier hier ein deterministisches Skript: Tests, Lint, Coverage, Diff-Greps führen aus, sie urteilen nicht. Die urteilsbehafteten Kriterien (SOLID, Lesbarkeit) delegierst du an einen separaten Code-Reviewer-Subagenten — dessen Votum das Skript nur als Artefakt prüft, nicht selbst fällt.

**Schatten-Logik im Verifier-Skript.** Wenn das Verifier-Skript (`goal-verify.sh`) zu komplex wird – weil es beispielsweise selbst Test-Setups orchestriert, Datenbank-Zustände manipuliert oder komplizierte Assertions enthält –, wird das Skript zur Schatten-Implementierung des Features. Der Code verlagert sich aus der App in den Test-Harness. Die Regel lautet: Der Verifier führt nur aus (z. B. `pytest`), die fachlichen und logischen Assertions gehören in die Test-Suite der Anwendung.

**Fehlende Budgets.** Ein Ziel ohne Turn- oder Token-Limit ist ein Ziel, das dich Geld kosten kann, während du schläfst. Immer ein Budget. Immer.

**Ziel-Drift.** Wenn Claude während der Arbeit merkt, dass ein Fertig-Kriterium schwer erreichbar ist, ist die Verlockung groß, das Kriterium unauffällig weniger streng zu interpretieren. Die Gegenmaßnahme: `GOAL.md` ist read-only während der Session. Änderungen am Ziel sind menschliche Entscheidungen, nicht agentische Anpassungen.

**Ein Ziel für zu viel.** *"Fertig, wenn das ganze Modul refactored ist"* ist zu groß für Goal Engineering. Zerteile es. Fünf kleine `GOAL.md`s hintereinander funktionieren besser als eine große. Litts *"Understanding is the new bottleneck"* aus Post 5 gilt auch hier: Wenn das Ziel so groß ist, dass niemand mehr überblickt, was sich geändert hat, hast du das Verstehen aus dem System geworfen.

**Goal ohne Team-Akzeptanz.** Wolffs Warnung, die in Post 6 zentral war: Ein `GOAL.md`, das ein einzelner Architekt geschrieben hat und das Team nie diskutiert hat, wird umgangen werden. Nicht durch Sabotage, sondern durch Interpretation. Fertig-Kriterien werden von Menschen befolgt oder relativiert — je nachdem, ob sie als *"unsere"* oder als *"seine"* Kriterien wahrgenommen werden.

---

## Die Faustregel

> *Ein Prompt endet, wenn das Modell aufhört. Ein Ziel endet, wenn ein Verifier bestätigt. Ein Ziel ohne Verifier ist ein Prompt in Verkleidung.*

Goal Engineering ist die technische Antwort auf Peter Steinbergers Verschiebung: vom Zuschauen zum Requirements-Setzen. Der `Stop`-Hook aus Post 5 ist der Ort, an dem der Verifier lebt. Das deterministische Skript ist seine Unbestechlichkeit. `GOAL.md` aus Post 3 ist der Vertrag. Zusammen ergeben sie ein Muster, das eine Aufgabe autonom bis zum verifizierbaren Ende trägt.

Post 8 zeigt, wie du dieses Muster nicht mehr selbst startest.

---

## Was kommt als nächstes

Post 8 zeigt Loop Engineering: Ziele, die nicht mehr auf deinen Anstoß warten, sondern auf einen Zeitplan. Shawn Wangs Bogen — Chat → Tools → Goals → Loops — bekommt sein letztes Wort. Aber auch der ehrliche Gegenwind: Geoff Huntleys Kubernetes-Analogie *"nächstes Jahr die Welle der 'unsere Loops sind gescheitert'-Talks"* und Dex Horthys Erfahrung, dass Loops ohne Menschen im Kreislauf nicht funktionieren.

---

## Weiterführende Quellen

- **Cobus Greyling** — sein [goal-engineering](https://github.com/cobusgreyling/goal-engineering)-Repo etabliert das Muster, das dieser Post in Claude-Code-Primitive übersetzt. Die konzeptionelle Quelle.
- **Peter Steinberger** — Vortrag am AI Engineer World's Fair, Juli 2026. Die pointierteste Formulierung der Verschiebung vom Zuschauer zum Requirements-Setzer (hier sinngemäß wiedergegeben, nicht wörtlich zitiert).
- **Anthropic Engineering** — *"Effective harnesses for long-running agents"*. Case Study zur Implementation von Long-Running-Sessions mit externem State und Verifier-Pattern. [anthropic.com/engineering/effective-harnesses-for-long-running-agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **Claude Code Subagents-Dokumentation** — [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) für Subagent-Frontmatter (`name`, `description`, `tools`, `model`, `permissionMode`, `maxTurns`) und tool-scoped Bash-Restriktionen.
- **Zum Feld:** Post 8 (Loop Engineering) greift Shawn Wang, Geoff Huntley und Dex Horthy konkret auf. Ihre Argumente über automatisierte Loops sind nur verständlich, wenn Goal Engineering vorher sitzt.
