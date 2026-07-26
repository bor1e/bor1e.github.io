---
title: "Loop Engineering: Vom Prompter zum Loop-Designer — und was danach kommt"
date: 2026-07-26
draft: false
description: "Shawn Wang hat den Bogen gezeichnet: Chat → Tools → Goals → Loops. Dieser Post zeigt, wie Loops in Claude Code konkret aussehen — und warum die ehrlichste Botschaft ist, dass Loops nicht die letzte Stufe sind."
tags: ["claude-code", "loop-engineering", "cron", "github-actions", "loopcraft", "autonomous-agents"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 7
---

> *„Loopcraft: The Art of Stacking Loops."*
> — Shawn Wang (swyx), AI Engineer World's Fair, Juli 2026

---

## Wo wir stehen

Post 6 hat gezeigt, wie eine Aufgabe autonom bis zum verifizierbaren Ende läuft — Goal Engineering. Aber ein Ziel ist immer noch etwas, das *du* startest. Du öffnest das Terminal, schreibst `GOAL.md`, tippst `claude`, und dann übernimmt das System.

Loop Engineering entfernt den letzten Schritt: **du startest nichts mehr.** Der Agent läuft, weil ein Timer abgelaufen ist, ein Webhook gefeuert hat, oder eine Bedingung eingetreten ist. Er entscheidet, ob es etwas zu tun gibt. Wenn ja, arbeitet er. Wenn nein, schläft er weiter.

Shawn Wang hat auf dem AI Engineer World's Fair im Juli 2026 den Bogen der letzten drei Jahre auf vier Wörter verdichtet: **Chat → Tools → Goals → Loops.** Chat war 2022. Tools waren 2023–2024. Goals war Post 6. Loops sind dieser Post. Das ist Wangs Bogen.

Dieser Post zeigt, was Loops in Claude Code konkret sind, wie du einen produktiv aufsetzt, und — das ist der ehrliche Teil — warum die Diskussion darüber gerade schon einen Schritt weiter ist. Andrew Ng hat Mitte Juli 2026 einen Kurs veröffentlicht, der Loops als *erste Stufe* einer längeren Progression positioniert, nicht als Endpunkt. Peter Steinberger hat kurz danach die These auf X in einem viel diskutierten Post zugespitzt. Post 8 wird diesen Punkt aufnehmen. Hier reicht die Vorwarnung: Loops sind mächtig, aber sie sind nicht das Ende der Geschichte — und diese Erkenntnis ist keine Zukunftsprognose mehr, sondern die laufende Debatte.

---

## Was ein Loop eigentlich ist

Ein Loop ist die Kombination aus vier Bausteinen, die diese Serie in den vorherigen Posts einzeln behandelt hat:

1. **Ein Trigger** — Zeit (`cron`), Ereignis (Webhook), oder Zustand (Datei-Watcher, CI-Signal)
2. **Ein Ziel** — `GOAL.md` aus Post 6, oder eine parametrisierte Variante davon
3. **Ein Verifier** — Stop-Hook + Subagent aus Posts 4 und 6
4. **Eine Eskalationsregel** — was passiert, wenn das Ziel *nicht* automatisch erreichbar ist

Ohne alle vier hast du keinen Loop. Du hast eine Automatisierung, die früher oder später kaputt geht, weil eine der vier Fragen ungeklärt ist.

Peter Steinberger (Gründer von OpenClaw, seit Anfang 2026 bei OpenAI) hat es auf dem Summit auf einen Satz reduziert: **Die Zukunft sind nicht 20 Terminal-Tabs — sondern bessere Loops.** Er schaut Agenten nicht mehr beim Coden zu. Er baut Loops, die nachts arbeiten. Am Morgen liest er, was passiert ist, und entscheidet, was davon in Produktion darf. Das ist keine Zukunftsmusik — das ist die aktuelle Praxis der frühen Anwender.

---

## Der einfachste Loop: `cron` + Claude Code Headless

Der billigste funktionierende Loop besteht aus zwei Zeilen `crontab` und einem Shell-Skript. Beispiel für eine nächtliche Triage aller offenen Bugs im GitHub-Repository:

```bash
# crontab -e
0 3 * * * cd /var/repos/order-api && ./scripts/nightly-triage.sh
```

Das Skript:

```bash
#!/bin/bash
# scripts/nightly-triage.sh

set -e
cd "$(dirname "$0")/.."

# Auth kommt aus der Umgebung (API-Key oder OAuth-Token)
# ANTHROPIC_API_KEY ist im systemd/cron-Kontext gesetzt

# 1. Neuen Branch für die Loop-Session
BRANCH="loop/triage-$(date +%Y%m%d)"
git checkout -b "$BRANCH"

# 2. Loop-spezifisches Ziel schreiben
cat > GOAL.md <<'EOF'
# GOAL: Nächtliche Bug-Triage

## Ziel
Für alle offenen Issues mit Label "bug", die in den letzten 24h erstellt wurden:
- Reproduktion versuchen
- Bei erfolgreicher Reproduktion: minimaler Fix + Test
- Bei nicht-trivialen Fixes: Human Gate (Label "needs-review" setzen)

## Fertig-Kriterien
- [ ] Alle Bug-Issues der letzten 24h bearbeitet
- [ ] Für jeden erfolgreichen Fix: PR eröffnet, Tests grün
- [ ] Für jeden komplexen Fix: Kommentar mit Analyse, Label gesetzt
- [ ] Zusammenfassung in STATE.md geschrieben

## Budget
- Max 60 Turns
- Max 500k Token Input, 100k Token Output
- Bei Überschreitung: Zwischenstand in STATE.md, Session beenden

## Human Gate
- Änderungen an .env, secrets/, oder db/migrations/ → immer eskalieren
- Refactors > 100 Zeilen → immer eskalieren
- Alles andere: PR direkt öffnen, Reviewer @-mentionen
EOF

# 3. Claude Code headless starten
claude -p --dangerously-skip-permissions \
  "Führe das aktuelle GOAL.md aus. Nutze den goal-verifier subagent \
   für die Abschlussprüfung." \
  > "logs/triage-$(date +%Y%m%d).log" 2>&1

# 4. Ergebnis auswerten
if [ -s STATE.md ] && grep -q "GOAL erreicht" STATE.md; then
  git add STATE.md
  git commit -m "chore: nightly triage $(date +%Y-%m-%d)"
  git push origin "$BRANCH"
else
  # Loop hat nicht sauber abgeschlossen — Human Alert
  ./scripts/notify-slack.sh "Triage-Loop $(date +%Y-%m-%d) unvollständig"
fi
```

Was dieser Loop macht: Er läuft um 3:00 Uhr morgens. Er erstellt einen frischen Branch, damit die Loop-Arbeit isoliert bleibt. Er schreibt ein `GOAL.md`, das diese Nacht beschreibt (nicht ein permanentes Ziel). Er startet Claude Code im Headless-Modus mit `-p`. Der Verifier-Subagent aus Post 6 prüft am Ende, ob das Ziel erreicht wurde. Und dann kommt der wichtigste Teil: Er unterscheidet zwischen sauberem Abschluss und Zwischenstand mit offenen Punkten. Bei sauberem Abschluss committet er. Bei allem anderen alarmiert er einen Menschen.

Am Morgen findest du entweder einen PR mit Fixes und dem Loop-Log, oder eine Slack-Nachricht mit einem Zwischenstand. Beides ist ein valides Ergebnis. Nur das Schweigen wäre ein Fehler.

**`--dangerously-skip-permissions` in einem Cron-Loop:** Das Flag existiert, weil ein Loop niemanden hat, der Permission-Prompts beantwortet. Es ist bewusst so benannt — Anthropic hätte es `--non-interactive` nennen können, hat aber "dangerously" gewählt, als expliziten Warnhinweis. Dieser Loop kompensiert mit drei anderen Schutzschichten: der isolierte Branch (kein Schaden am Hauptcode), die expliziten Human-Gates in `GOAL.md` (Grenzen, die das Modell respektieren muss), und die `PreToolUse`-Hooks aus Post 4 (Secret-Scans, die selbst mit übersprungenen Prompts noch feuern). Für höhere Isolation läuft der Loop idealerweise in einem Docker-Container ohne Netzwerkzugriff außer zur Anthropic-API und zu GitHub.

---

## Der professionelle Weg: GitHub Actions statt `cron`

`cron` funktioniert. Aber `cron` läuft auf einer Maschine, die jemand betreiben muss. Für Loops, die auf Team-Repositories arbeiten, ist GitHub Actions die natürlichere Umgebung — der Code lebt sowieso auf GitHub, die Berechtigungen sind sowieso konfiguriert, und die offizielle Claude-Code-Action nimmt die meiste Setup-Arbeit ab.

Ein minimales Loop-Workflow mit der offiziellen Action:

```yaml
# .github/workflows/nightly-triage.yml
name: Nightly Triage
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:  # manueller Trigger für Tests

jobs:
  triage:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write  # für Workload Identity Federation (optional)
    steps:
      - uses: actions/checkout@v4

      - name: Prepare GOAL.md
        run: ./scripts/write-nightly-goal.sh > GOAL.md

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Führe das GOAL.md im Root-Verzeichnis aus.
            Nutze den goal-verifier subagent für die Abschlussprüfung.
            Bei erfolgreichem Abschluss: PR mit den Änderungen eröffnen.
            Bei Unklarheiten oder Human-Gate-Auslösungen: als Issue melden.
          claude_args: |
            --dangerously-skip-permissions
            --max-turns 60
```

Der große Unterschied zum Cron-Setup: Berechtigungen laufen über die GitHub-Actions-Permissions und die offizielle Action, nicht über eine handgerollte Skript-Kette. Das ist überprüfbar, versionierbar, und auditierbar.

**Für regulierte Umgebungen: Workload Identity Federation.** Für Teams in Versicherungs- oder Energieumgebungen ist die statische `ANTHROPIC_API_KEY` als Secret oft nicht compliance-fähig — ein statisches Long-Lived-Secret in einem Repository-Secret bleibt ein statisches Long-Lived-Secret. Die offizielle Claude-Code-Action unterstützt Workload Identity Federation (WIF): GitHub Actions liefert ein OIDC-Token, Anthropic tauscht es gegen ein kurzlebiges Access-Token. Kein Secret zu verwalten, kein Rotationsprozess, kein Leck-Risiko. Für Auditoren ist das der Unterschied zwischen "funktioniert" und "funktioniert und darf produktiv laufen". Konfiguration über die Anthropic Console → Settings → Workload identity, dann `ANTHROPIC_FEDERATION_RULE_ID` und `ANTHROPIC_ORGANIZATION_ID` als GitHub-Variablen setzen — der API-Key entfällt komplett.

---

## Der Maker/Checker-Split

Der Triage-Loop oben hat einen versteckten Kompromiss: Der gleiche Agent, der die Fixes schreibt, entscheidet auch, ob sie gut genug sind. Der Verifier-Subagent aus Post 6 mildert das ab — er hat keinen Konversationskontext — aber er nutzt dasselbe Modell.

Für höhere Stakes brauchst du einen Maker/Checker-Split: zwei separate Loop-Läufe, mit unterschiedlichen Berechtigungen und unterschiedlichen Verantwortungen.

- **Maker-Loop** — Schreibt PRs, hat Push-Berechtigung auf Feature-Branches, keine Merge-Berechtigung.
- **Checker-Loop** — Läuft nach jedem Maker-Loop-Ergebnis. Hat Read-Only-Berechtigung auf den Feature-Branch, aber Kommentar- und Approval-Berechtigung. Führt eine strukturierte Review durch (die Skills aus Post 2 laden ihre Kriterien).

Der Effekt: Der Maker sieht seinen Diff nach der Erstellung noch einmal, aber ohne das Wissen darüber, wie er entstanden ist. Das ist derselbe Curse-of-Knowledge-Trick, den Post 2 für Subagents eingeführt hat — jetzt aber über zwei separate Sessions ausgedehnt, mit einem CI-Job dazwischen.

Die praktische Umsetzung ist ein zweiter Workflow-File, das auf `pull_request`-Events triggert und den `code-reviewer`-Subagent aus Post 2 startet. Wenn er approved, geht der PR in die menschliche Review-Queue. Wenn er ablehnt, kommentiert er die konkreten Punkte und schließt den PR nicht — der Maker-Loop kann in der nächsten Runde nacharbeiten.

---

## Was Ng dazu sagt: Loops sind Stufe 1

Andrew Ng hat Mitte Juli 2026 einen einstündigen Kurs auf DeepLearning.AI veröffentlicht — *Agentic Knowledge Graph Construction*, unterrichtet von Andreas Kollegger (Neo4j), mit Google's Agent Development Kit als Werkzeug. Die zentrale These ist für Loop Engineering direkt relevant: Loops externalisieren Revision. Chains externalisieren Reihenfolge. Networks externalisieren Rollen-Spezialisierung. Graphs externalisieren geteilten Zustand. Das sind vier Stufen der Externalisierung von Kognition — und Loops sind die erste.

Ng argumentiert nicht, dass Loops schlecht sind. Er argumentiert, dass sie eine spezifische Rolle in einer längeren Progression haben, und dass die Schwächen von Loops erst sichtbar werden, wenn man versucht, sie für Aufgaben zu benutzen, für die eine spätere Stufe gedacht ist:

- **Loop-Schwäche 1: Kontext-Kollaps.** Jede Iteration schickt Task, Draft, Kritik, Tool-Ergebnisse, Historie erneut durchs Fenster. Post 3 hat das Context Rot genannt. In einer Session ist das managbar. In einem täglichen Loop über Wochen wird es zum Bottleneck.
- **Loop-Schwäche 2: Ein Agent, viele Aufgaben.** Ein Loop ist per Definition ein Agent, der iteriert. Multiple Spezialisten, die parallel arbeiten und ihre Ergebnisse teilen — dafür sind Loops nicht gebaut. Das ist die Netzwerk-Stufe.
- **Loop-Schwäche 3: Keine geteilte Wahrheit.** Der Loop weiß, was er letzte Nacht gemacht hat, weil `STATE.md` es sagt. Aber ein zweiter Loop, der parallel läuft, muss dieselbe Datei lesen und riskiert Konflikte. Für echte Multi-Loop-Systeme brauchst du eine geteilte, konsistente Wissensrepräsentation. Das ist die Graph-Stufe.

Ng's Botschaft: Fang mit Loops an. Miss, wo sie brechen. Investier in die nächste Stufe erst, wenn eine spezifische Loop-Grenze zur bindenden Beschränkung wird. Diese Serie folgt derselben Logik. Post 7 zeigt Loops. Post 8 zeigt, was danach kommt.

---

## Der ehrliche Gegenwind: Huntley und Horthy

Nicht jeder auf dem AI Engineer World's Fair war euphorisch. Zwei Stimmen, die den frühen Anwenderfragen den Puls fühlen:

Geoff Huntley hat die Loop-Diskussion mit einer Kubernetes-Analogie eingerahmt: Die frühen Jahre waren schmerzhaft und chaotisch, und dann plötzlich, um 2018 herum, war es eine Revolution. Für Loops sagt er das gleiche voraus — mit einer unbequemen Zwischenetappe: *"Nächstes Jahr auf dieser Bühne werden wir eine Welle von 'Unsere Loops sind gescheitert'-Vorträgen sehen, weil wir das noch nicht gelöst haben."*

Das ist keine Ablehnung von Loops. Es ist die Prognose, dass die aktuelle Generation von Loop-Systemen fast alle scheitern wird — und aus diesen Scheitern die zweite Generation entstehen wird, die dann tatsächlich funktioniert. Wer heute Loops baut, sollte damit rechnen, in zwölf Monaten grundlegend anders zu bauen. Nicht als Katastrophe, sondern als normale Kurve einer neuen Technologie.

Dex Horthy (HumanLayer) hat empirischer argumentiert. Er hat das Experiment gemacht, das viele theoretisch diskutieren: Menschen komplett aus dem Loop rausnehmen. Loops schreiben, verifizieren, mergen selbst. Sein Ergebnis: *"Die Resultate waren nicht gut."* Nicht katastrophal — aber nicht gut genug, um es produktiv laufen zu lassen. Sein Punkt ist nicht, dass Loops schlecht sind. Sein Punkt ist, dass die lauteste frühe Anwender-Kohorte diejenige sein wird, die sich verbrennt, weil sie zu schnell zu viel automatisiert.

Der praktische Rückschluss aus beiden Stimmen: Loops mit menschlicher Gate-Kontrolle produzieren. Der Human-Gate-Abschnitt in `GOAL.md` oben ist keine Ornamentik — er ist die Bedingung, unter der ein produktiver Loop tatsächlich läuft. Wer den Human Gate rauswirft, um "die volle Autonomie zu haben", wird einer der Vorträge sein, die Huntley voraussagt.

---

## Failure Modes von Loops

**Loops ohne Human Gate.** Der häufigste und teuerste Fehler. Ein Loop, der alle Entscheidungen selbst treffen darf, produziert entweder trivialen Output (weil er sich selbst begrenzt) oder katastrophalen (weil er es nicht tut). Immer explizite Grenzen definieren, jenseits derer der Loop eskaliert.

**Loops ohne Isolation.** Ein Loop, der direkt auf `main` arbeitet, ist ein Zeitzünder. Immer auf einem Feature-Branch, immer über einen PR, immer mit einem menschlichen Merge-Schritt. Die Isolation ist billiger als die Aufräumarbeit.

**Loops ohne Alerting.** Ein Loop, der still fehlschlägt, ist schlimmer als kein Loop — er suggeriert, dass Arbeit passiert, wo tatsächlich nichts passiert. Jeder Loop braucht einen Erfolgs- und einen Fehler-Kanal. Slack, E-Mail, Ticket-System — irgendetwas, das den Menschen holt, wenn der Loop nicht sauber abschließt.

**Loops ohne Budget.** Ein `cron`-Job, der API-Kosten produziert und keine Obergrenze kennt, ist eine Rechnungsüberraschung, die auf ihren Moment wartet. Immer Token-Budgets in `GOAL.md`. Immer Kill-Switches im Skript.

**Loops als Skalierung eines schlechten Prozesses.** Wenn dein manueller Prozess kaputt ist, wird der automatisierte Loop davon eine schnellere kaputte Version. Loops verstärken, was da ist. Sie reparieren nichts, was der zugrundeliegende Prozess nicht schon reparieren würde. Wolffs Warnung aus Post 5 gilt hier doppelt: Ein Loop, den das Team nicht akzeptiert, wird umgangen — und ein Loop, der umgangen wird, wird nicht besser durch Automatisierung.

**Loop-Stapelei ohne Design.** Wangs *Loopcraft: The Art of Stacking Loops* ist bewusst gewählt: Loops zu stapeln ist eine Kunst, kein automatisches Ergebnis. Zwei Loops, die auf denselben Zustand schreiben, brauchen Koordination — sonst überschreiben sie sich gegenseitig, produzieren Konflikte, oder erzeugen inkonsistente Historien. Das ist der Punkt, an dem Loops in Netzwerke übergehen, und Netzwerke in Graphen.

---

## Die Faustregel

> *Ein Loop ohne Trigger, Ziel, Verifier und Eskalation ist keine Automatisierung — es ist ein Wunsch mit Cron-Job.*

Wangs Bogen — Chat → Tools → Goals → Loops — beschreibt die letzten drei Jahre. Ng's Progression — Loops → Chains → Networks → Graphs — beschreibt die nächsten drei. Diese Serie hat Post 1 mit Chat begonnen (Vibe Coding), Post 4 mit Tools (Hooks), Post 6 mit Goals, und Post 7 mit Loops. Post 8 nimmt den nächsten Schritt.

Loops sind mächtig. Loops sind nicht die letzte Stufe.

---

## Was kommt als nächstes

Die Debatte darum, was nach Loops kommt, ist keine Zukunftsfrage mehr — sie läuft gerade. Am 18. Juli 2026, zweieinhalb Wochen nach dem AI Engineer World's Fair, hat Peter Steinberger auf X einen Neun-Wort-Post veröffentlicht: *"Are we still talking loops or did we shift to graphs yet?"* Der Post hat innerhalb weniger Tage über zwei Millionen Views gesammelt und eine ganze Reihe von Reaktionen ausgelöst — Hamel Husains Essay *"Loop Engineering Is Dead. Enter Graph Engineering."*, Andrew Ngs frisch veröffentlichter Graphen-Kurs, und ein Chor von Praktiker-Threads, die das Gleiche aus verschiedenen Blickwinkeln beschreiben.

Post 8 zeigt, was jenseits von Loops liegt: Multi-Agenten-Systeme, die geteilten Zustand über Sessions und über Agenten hinweg persistent halten. Ng nennt das die Graph-Stufe. Anthropic nennt es MCP-basiertes Grounding. Es ist die gleiche Antwort auf zwei Fragen: Wie behalten mehrere Agenten eine gemeinsame Wahrheit, ohne sich gegenseitig Kontexte durchzureichen? Und: Wie erklärt man, warum ein Ergebnis so ist, wie es ist, wenn es aus einem verteilten System kommt?

Loops und Graphen sind keine konkurrierenden Paradigmen. Sie sind aufeinanderfolgende Stufen — und die meisten Produktivsysteme werden beide brauchen.

---

## Weiterführende Quellen

- **Shawn Wang (swyx)** — *"Loopcraft: The Art of Stacking Loops"*, AI Engineer World's Fair, Juli 2026. Der Bogen Chat → Tools → Goals → Loops als Rahmen für die letzten drei Jahre AI Engineering.
- **Peter Steinberger** — Vortrag am AI Engineer World's Fair, Juli 2026, und der viral gegangene X-Post *"Are we still talking loops or did we shift to graphs yet?"* vom 18. Juli 2026. Steinberger ist Gründer von OpenClaw (Open-Source-Agenten-Plattform) und seit Anfang 2026 bei OpenAI.
- **Hamel Husain** — *"Loop Engineering Is Dead. Enter Graph Engineering."* Die schriftliche Fassung der Debatte, die Steinbergers Post ausgelöst hat.
- **Andrew Ng** — *Agentic Knowledge Graph Construction* Kurs (DeepLearning.AI + Neo4j + Google ADK), Juli 2026. Eine Stunde, kostenlos, unterrichtet von Andreas Kollegger. Die Progression Loops → Chains → Networks → Graphs als Externalisierung von Kognition. [deeplearning.ai/courses/agentic-knowledge-graph-construction](https://www.deeplearning.ai/courses/agentic-knowledge-graph-construction)
- **Geoff Huntley** — sein *"ralph loop"*-Vortrag und die Kubernetes-Analogie für die Reifekurve von Loop-Systemen. Die ehrliche Vorhersage, dass die aktuelle Loop-Generation großenteils scheitern wird.
- **Dex Horthy (HumanLayer)** — der empirische Bericht darüber, was passiert, wenn man Menschen komplett aus dem Loop nimmt.
- **Cobus Greyling** — [loop-engineering](https://github.com/cobusgreyling/loop-engineering)-Repo. Die konzeptionelle Quelle für Recurring-Discovery-Loops und Maker/Checker-Splits.
- **Anthropic Claude Code Action** — [github.com/anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) — die offizielle GitHub Action, inklusive Workload Identity Federation für regulierte Umgebungen.
- **Claude Code Headless- und Permission-Dokumentation** — [code.claude.com/docs/en/permission-modes](https://code.claude.com/docs/en/permission-modes) für `-p`/`--print`, `--dangerously-skip-permissions`, und Auto-Mode als sicherere Alternative.
- **Anthropic** — *"Building Effective Agents"* — die Referenz für das Orchestrator-Workers-Muster, das Loops in Multi-Agenten-Systemen übernimmt.
