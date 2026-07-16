---
title: "Metriken für agentische Entwicklung: Was du misst, wenn Codegenerierung billig wird"
date: 2026-07-07
draft: false
description: "DORA-Metriken wurden für eine Welt entworfen, in der Menschen den Code schreiben. Wenn Agenten schreiben, kollabieren die klassischen Zahlen — Cycle Time sinkt, aber sagt nichts über Qualität. Dieser Post zeigt, was du stattdessen misst, und warum Metriken allein nicht reichen."
tags: ["claude-code", "metriken", "dora", "measurement", "observability", "cost", "agentic-development"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 5
---

> *Miss den Verifier, nicht den Generator. Miss das Team, nicht den Entwickler. Miss den Outcome, nicht den Output.*

---

## Wo wir stehen

Post 4 hat Tariq Shaukats These vorgestellt: *In the Land of AI Agents, the Verifiers Are King.* Wenn Codegenerierung nahezu unendlich und nahezu kostenlos wird, verschiebt sich der Wert von den Generatoren zu den Verifiern. Das ist eine ökonomische Aussage. Sie hat eine unbequeme Konsequenz: **Alles, was du bisher gemessen hast, misst jetzt das Falsche.**

DORA-Metriken — Deployment Frequency, Lead Time, Change Failure Rate, MTTR — wurden von Nicole Forsgren und Team für eine Welt entworfen, in der Menschen den Code schreiben. Sie messen den Fluss vom Entwickler-Commit bis zur Produktion. Wenn Agenten committen, kollabiert dieser Fluss auf Sekundenbruchteile. Cycle Time geht gegen Null. Deployment Frequency explodiert. Nach DORA-Logik ist dein Team plötzlich *Elite Performer* — aber die Codebase brennt.

Dieser Post zeigt drei Dinge: Was DORA in agentischer Entwicklung noch aussagt und was nicht. Welche drei Ebenen von Metriken die Lücke füllen. Und warum die technischen Metriken, die wir hier definieren, ohne den soziotechnischen Kontext, den Eberhard Wolff einfordert, gefährlich in die Irre führen können.

Dieser Post ist die operative Antwort auf Post 4. Post 4 hat argumentiert, dass Verifier knapp und wertvoll sind. Post 5 zeigt, wie du weißt, dass deine Verifier funktionieren.

---

## Warum DORA-Metriken agentisch nicht ausreichen

DORA hat vier klassische Metriken. Für jede lohnt sich die Frage: *Was misst sie in agentischer Entwicklung wirklich?*

**Deployment Frequency.** Klassisch: Wie oft deployt das Team? Agentisch: Wie oft deployt der Agent? Das ist keine Team-Metrik mehr, sondern eine Automatisierungs-Metrik. Sie sagt nichts über Code-Qualität, nichts über Feature-Wert, nichts über Team-Gesundheit.

**Lead Time for Changes.** Klassisch: Wie lange von Commit zu Produktion? Agentisch: Sekunden. In einem gut konfigurierten Loop kann ein triviales Feature — Copy-Änderung, kleine Bugfix, Dependency-Update — in unter einer Minute in Produktion sein. Nach DORA-Logik ist das perfekt. In der Realität hast du nur den Bottleneck verschoben, nicht beseitigt: Die Frage ist jetzt, ob überhaupt jemand *versteht*, was gerade deployt wurde.

**Change Failure Rate.** Klassisch: Anteil der Deployments, die einen Incident auslösen. Diese Metrik überlebt agentisch — mit einer wichtigen Präzisierung: Sie muss *pro Agent-Loop* gemessen werden, nicht nur global. Ein Loop mit 30% Failure Rate ist kaputt und muss abgeschaltet werden, egal wie gut die anderen aussehen.

**Mean Time to Recovery.** Klassisch: Wie schnell erholt sich das System von einem Incident? Agentisch: Interessante Frage. Wenn der Rollback selbst von einem Agenten getrieben wird — misst man dann noch Team-Fähigkeit oder nur noch Runtime-Automatisierung?

**Die Kurzfassung:** DORA ist nicht falsch. Aber DORA misst, wie schnell dein *Prozess* läuft. In agentischer Entwicklung ist der Prozess trivial schnell. Was knapp wird, ist etwas anderes: **Qualitätssicherung, Kontrolle, Verständnis.** Und dafür brauchst du andere Zahlen.

---

## Drei Ebenen von Metriken

Metriken für agentische Entwicklung fallen sauber in drei Ebenen. Jede beantwortet eine andere Frage. Wer nur eine Ebene misst, hat nur ein Drittel des Bildes.

### Ebene 1 — Session-Metriken (pro Aufgabe)

Diese Metriken beantworten: *Hat diese eine Session gut funktioniert?*

| Metrik | Was sie sagt | Wie du sie erhebst |
|---|---|---|
| **Time to First Green** | Von der Aufgabenstellung bis zum ersten grünen Test-Lauf. Ersetzt "Time to First Commit" | Session-Log + Timestamp des ersten erfolgreichen `verify.sh` |
| **Token-Kosten pro Session** | Wie teuer war diese Aufgabe? | Anthropic API-Logs, aggregiert über LiteLLM oder die Anthropic Console |
| **Turns bis Abschluss** | Wie oft musste Claude iterieren? | Session-Transcript-Länge |
| **Hook-Rejection-Rate** | Wie oft haben deine Guides gegriffen? | Custom-Logging in `PostToolUse` / `Stop`-Hooks |
| **Subagent-Approval-Rate** | Hat der Code-Reviewer-Subagent approved, angemerkt, oder abgelehnt? | Subagent-Output-Log |

Die interessanteste Zahl aus dieser Liste ist die **Hook-Rejection-Rate**. Wenn sie über die Zeit sinkt, bedeutet das eine von zwei Dingen: Entweder wird Claude besser darin, deine Regeln direkt einzuhalten (gut), oder die Hooks fangen zu wenig, weil sie zu schwach konfiguriert sind (schlecht). Ohne zusätzliche Zahlen kannst du die zwei nicht unterscheiden.

### Ebene 2 — Team-Metriken (pro Woche/Sprint)

Diese Metriken beantworten: *Wird das Team als Ganzes produktiver, oder nur der Agent?*

- **Feature Cycle Time** — von Idee zu Produktion, inklusive Review und Merge. Nicht agent-only Zeit.
- **Defect Rate auf agent-generierten PRs** — bezogen auf alle agent-getriebenen PRs, gemessen über die ersten 30 Tage nach Merge.
- **Coverage-Trend** — steigt oder fällt die Test-Coverage über Sprints hinweg? Ein Team, das mit Claude schneller wird, aber Coverage verliert, kauft Geschwindigkeit auf Kredit.
- **Review-Zeit** — hat sie sich verkürzt? Wenn ja: gut oder schlecht? Voss' *Death of the Code Review*-Argument aus Post 4 sagt: kürzere Reviews sind *inhärent* zweideutig, weil das Ziel des Reviews sich verschoben hat.
- **PR-Größe** — bleibt sie konstant oder wachsen die PRs, weil Agenten "einfach mehr" generieren? Große PRs mit oberflächlichem Review sind der klassische Vorhof zur nächsten Katastrophe.

### Ebene 3 — Organisatorische Metriken (pro Quartal)

Diese Metriken beantworten: *Zahlt sich die Investition in agentische Entwicklung aus?*

- **Cost per Developer per Month (Token-Spend)** — die einzige Zahl, die dein CFO wirklich versteht. Der konkrete Wert hängt von Subscription-Modell und Nutzungsintensität ab, aber er muss in dein Reporting.
- **Time-to-Productivity für neue Entwickler** — wenn das Harness (`CLAUDE.md`, Skills, Rules) gut ist, sollten neue Team-Mitglieder schneller produktiv sein. Wenn nicht — was misst du dann?
- **Incident-Rate** — Shaukats Warnung vor *"technical debt at machine speed"* wird hier messbar. Ein steigender Incident-Trend bei gleichzeitig steigendem Deployment-Trend ist der Kanarienvogel im Kohlebergwerk.
- **Retention und Zufriedenheit** — die einzige Metrik dieser Ebene, die nicht aus Logs kommt. Aber sie zählt. Ein Team, das sein Handwerk verliert (Litts *"understanding is the new bottleneck"* aus Post 4), wird unglücklich, bevor die technischen Metriken es zeigen.

---

## Der Wolff-Vorbehalt: Metriken sind Hinweise, keine Wahrheit

Eberhard Wolff, Chief Scientist bei INNOQ und einer der wichtigsten deutschen Architektur-Stimmen, hat für klassische Architektur-Reviews einen Punkt geprägt, der auf dieses Kapitel eins zu eins zutrifft: **Metriken haben oft weniger Aussagekraft, als wir ihnen zutrauen.**

Sein Beispiel aus der Architektur-Welt: Ein System mit zyklischen Package-Abhängigkeiten hat *"schlechte"* Metriken. Nach dem Lehrbuch ist eine solche zyklische Abhängigkeit eine *"Todsünde"*. In der Praxis kommt ein Team, das das System seit Jahren kennt, damit oft völlig zurecht. Und umgekehrt: Ein perfekt strukturiertes System nützt niemandem, wenn das Team ohne Übergabe damit alleingelassen wird.

Übertragen auf agentische Metriken:

- **Eine hohe Hook-Rejection-Rate ist nicht automatisch ein Problem.** Vielleicht sind deine Guides einfach ambitionierter als der Durchschnitt. Vielleicht lernt Claude gerade eine neue Konvention. Die Zahl allein sagt es dir nicht.
- **Eine niedrige Defect-Rate auf agent-generierten PRs ist nicht automatisch gut.** Vielleicht schaut niemand hin. Vielleicht sind die Test-Suites so oberflächlich, dass sie nichts finden. Die Zahl allein sagt es dir nicht.
- **Ein hoher Token-Spend ist nicht automatisch schlecht.** Vielleicht arbeitet dein Team gerade an einem großen Refactor. Vielleicht ist der ROI extrem hoch. Die Zahl allein sagt es dir nicht.

Wolffs eigentliche Beobachtung aus seinen Reviews ist noch schärfer: **Viele Architektur-Probleme sind soziale Probleme.** Er beschreibt ein Team, das eine bestimmte Architektur-Entscheidung einhellig als *"katastrophal"* empfand — aber niemand konnte eine Alternative benennen, die unter den damaligen Randbedingungen funktioniert hätte. Die eigentliche Erkenntnis war nicht, dass die Entscheidung falsch war. Es war, dass das Team die Entscheidung nie akzeptiert hatte.

Übersetzt in die Welt der agentischen Metriken: **Wenn ein Team die eingesetzten Skills, Hooks und Loops nie akzeptiert hat, kannst du jede Metrik messen — und wirst nicht verstehen, warum das Team trotz *"guter Zahlen"* nicht vom Fleck kommt.** Das ist kein Metrik-Problem. Es ist das Problem, das keine Metrik löst.

Der praktische Umgang damit ist der, den Wolff für Architektur-Reviews vorschlägt: **Ergänze Zahlen durch Gespräche.** Interviews mit offenen Fragen. *"Was funktioniert an eurem Setup gut? Was frustriert euch? Wo umgeht ihr das Harness bewusst?"* Diese Fragen liefern Informationen, die in keinem Dashboard stehen — und die für die Interpretation der Zahlen unentbehrlich sind.

Der Rest dieses Posts liefert die Zahlen. Der Wolff-Vorbehalt ist die Warnung, sie richtig zu lesen.

---

## Der Observability-Stack in Claude Code

Zahlen zu erheben ist trivial, wenn die Infrastruktur mitspielt. Fünf konkrete Quellen:

### Session-Logs
Claude Code speichert Session-Transcripts unter `~/.claude/projects/` (ein Unterverzeichnis pro Projekt, mit escapetem Pfad als Namen). Jede Session ist eine JSONL-Datei mit Timestamps, Tool-Calls und Modell-Ausgaben. Das ist die primäre Quelle für Session-Metriken.

### Hook-Logging
Ein `PostToolUse`- oder `Stop`-Hook, der bei jedem Fire einen strukturierten Log-Eintrag schreibt, gibt dir die Hook-Rejection-Rate ohne zusätzliche Werkzeuge. Beispiel:

```bash
#!/bin/bash
# .claude/hooks/verify.sh — mit Metrik-Logging
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
session_id="${CLAUDE_SESSION_ID:-unknown}"

if ! ./scripts/run-tests.sh; then
  echo "{\"ts\":\"$timestamp\",\"session\":\"$session_id\",\"hook\":\"stop\",\"result\":\"rejected\",\"reason\":\"tests_failed\"}" \
    >> ~/.claude/logs/hook-events.jsonl
  exit 2
fi

echo "{\"ts\":\"$timestamp\",\"session\":\"$session_id\",\"hook\":\"stop\",\"result\":\"passed\"}" \
  >> ~/.claude/logs/hook-events.jsonl
exit 0
```

Nach zwei Wochen hast du eine JSONL-Datei, die mit `jq` oder Pandas in jede beliebige Aggregation läuft.

### LiteLLM-Proxy
Wenn Claude Code über einen LiteLLM-Proxy läuft (der Standard-Weg für DSGVO-konforme Enterprise-Setups), gibt LiteLLM dir Token-Spend pro API-Key, pro Modell, pro Zeitraum — out of the box. Grafana-Dashboards existieren. Das ist die einfachste Quelle für organisatorische Kostenmetriken.

### OpenTelemetry
Claude Code hat Beta-Support für OpenTelemetry-Export. Wenn dein Team bereits einen OTel-Collector betreibt, landen Session-Metadaten dort — und du bekommst Aggregation, Alerting und Dashboards, ohne selbst zu bauen.

### Anthropic Console
Für Teams mit direktem Anthropic-Abo: Die Console gibt dir Usage-Statistiken auf Organisations-Ebene. Weniger granular als LiteLLM, aber ohne Extra-Setup.

**Faustregel für den Stack:** LiteLLM für Kosten. Hook-JSONL für Verhalten. OpenTelemetry für Ops-Integration. Anthropic Console als Sanity-Check. Alles andere ist Bonus.

---

## Ein Dashboard-Sketch

Was du am Ende zeigen willst — dem Team, deinem CTO, dir selbst — passt auf eine Seite. Ein Beispiel-Layout:

```
┌────────────────────────────────────────────────────────────────┐
│  Claude Code — Team Health, KW 29/2026                         │
├─────────────────────────────┬──────────────────────────────────┤
│  SESSION (Median)           │  KOSTEN                          │
│  ─────────────────          │  ──────                          │
│  Time to First Green: 4:23  │  Token-Spend/Woche: 340 USD      │
│  Turns bis Abschluss: 8     │  Pro aktivem Dev: 42 USD/Monat   │
│  Token-Kosten: 12k in/2k out│  Trend: → (stabil)               │
├─────────────────────────────┼──────────────────────────────────┤
│  HARNESS (Woche)            │  QUALITÄT (Rolling 30d)          │
│  ────────────────           │  ──────────────────────          │
│  Hook-Rejections: 34        │  Defect Rate agent-PRs: 3.2%     │
│  ↳ Secret-Scan: 2           │  Coverage-Trend: +1.4%           │
│  ↳ Lint: 21                 │  Feature Cycle Time: 2.1 Tage    │
│  ↳ Stop-Hook: 11            │  Incident-Rate: 0.4/Woche        │
│  Subagent-Approvals: 87%    │                                  │
├─────────────────────────────┴──────────────────────────────────┤
│  QUALITATIV (aus Wöchentlichem Retro)                          │
│  ────────────────────────────────────                          │
│  · 2 Devs berichten von "Harness fühlt sich zu streng an"     │
│  · Neuer Hook für DB-Migrations wird pilotiert                 │
│  · TDD-Skill wird häufiger explizit aufgerufen als erwartet    │
└────────────────────────────────────────────────────────────────┘
```

Die letzte Sektion ist entscheidend. Ohne die qualitative Ergänzung ist das Dashboard das, wovor Wolff warnt: eine Sammlung von Zahlen, die den Kern der Probleme verfehlt.

---

## Failure Modes von Metriken

**Vanity Metrics.** *"Lines of AI-generated code"* ist die klassische. Sie misst Aktivität, nicht Wert. Genauso: Anzahl generierter Tests, Anzahl aufgerufener Skills, Anzahl Slash-Commands. Alles sagt nichts über Qualität. Wenn deine Metrik unter Manipulation stärker steigen kann als unter echter Verbesserung, ist es eine Vanity Metric.

**Goodhart's Law.** *"When a measure becomes a target, it ceases to be a good measure."* Wenn dein Team weiß, dass Hook-Rejection-Rate ein KPI ist, wird die Rate sinken — durch bessere Arbeit, oder durch entschärfte Hooks. Die Zahl allein sagt dir nicht, welches passiert ist.

**Individuelle statt Team-Metriken.** *"Wer schreibt am meisten agent-generierten Code?"* ist die Frage, die eine Kultur zerstört. In agentischer Entwicklung ist der Beitrag eines Entwicklers noch weniger an Zeilen messbar als vorher. Team-Metriken. Immer.

**Metriken ohne Interviews.** Wolffs zentraler Punkt. Zahlen ohne Kontext sind gefährlich, weil sie präzise falsch sind. Ein wöchentliches 30-Minuten-Retro mit offenen Fragen liefert mehr Signal als jedes Dashboard allein.

**Single-Metric-Optimization.** Ein Team, das nur auf Cycle Time optimiert, opfert Coverage. Ein Team, das nur auf Coverage optimiert, opfert Cycle Time. Metriken kommen in Paaren, die gegeneinander laufen — genau wie DORAs Delivery vs Stability.

---

## Die Faustregel

> *Miss den Verifier, nicht den Generator. Miss das Team, nicht den Entwickler. Miss den Outcome, nicht den Output. Und miss nicht ohne zu reden.*

Der erste Halbsatz ist Shaukats Verifier-Ökonomie aus Post 4, in Metrik-Form. Der zweite ist die Einsicht, dass agentische Entwicklung individuelle Beiträge unsichtbarer macht — Team-Metriken sind der einzige ehrliche Kompass. Der dritte trennt Vanity Metrics von echter Wert-Messung. Und der vierte ist Wolffs Vorbehalt: Zahlen ohne Gespräche sind Präzision ohne Wahrheit.

---

## Was kommt als nächstes

Post 6 zeigt Goal Engineering: die technische Grundlage dafür, dass eine Aufgabe *"fertig"* ist — nicht *"scheint fertig"*. Die Metriken aus diesem Post werden dort zu Done-Kriterien: Ein `Stop`-Hook, der Coverage prüft, ist der operative Weg, wie *"Test-Coverage ≥ 90%"* aus einem KPI zu einem verifizierbaren Ziel wird. Post 7 setzt darauf Loops auf. Post 8 fragt, was Metriken *nicht* messen können.

---

## Weiterführende Quellen

- **Nicole Forsgren, Jez Humble, Gene Kim** — *"Accelerate: The Science of Lean Software and DevOps"* (2018). Die kanonische Grundlage für DORA-Metriken. Immer noch relevant, aber vor der agentischen Wende geschrieben.
- **Eberhard Wolff (INNOQ)** — *"Soziotechnische Architektur-Reviews"* auf heise.de und in seinem Podcast *"Software-Architektur im Stream"*. Der zentrale Vorbehalt gegen rein technische Metriken: Software ist ein soziotechnisches System, und die wichtigsten Probleme leben zwischen Menschen, nicht in Klassen.
- **Tariq Shaukat (Sonar)** — *"In the Land of AI Agents, the Verifiers Are King"*, AI Engineer World's Fair 2026. Die ökonomische These, die diesen Post überhaupt notwendig macht.
- **Claude Code Monitoring-Dokumentation** — [code.claude.com/docs/en/monitoring-usage](https://code.claude.com/docs/en/monitoring-usage) für OpenTelemetry-Export und Usage-Reporting.
- **LiteLLM Observability** — [docs.litellm.ai](https://docs.litellm.ai) für Token-Spend-Aggregation über Anthropic und andere Provider.
- **Charity Majors, Liz Fong-Jones, George Miranda** — *"Observability Engineering"* (O'Reilly 2022). Für den generellen Observability-Stack. Die Prinzipien übertragen sich sauber auf agentische Systeme.
- **Kent Beck** — sein Substack [tidyfirst.substack.com](https://tidyfirst.substack.com) behandelt regelmäßig, wie sich Refactoring-Disziplin in agentischen Workflows verändert. Kein einzelner Post zum Verlinken, aber die laufende Reihe lohnt sich.
