---
title: "Sensoren und Hooks: Warum die Verifier die eigentlich knappen Ressourcen sind"
date: 2026-07-20
draft: true
description: "Guides sagen dem Modell, was es tun soll. Sensoren prüfen, ob es das getan hat. In Claude Code sind Sensoren Hooks — und die Frage 'welcher Anker gehört in einen Hook, welcher in ein Skill' entscheidet, ob dein Harness hält oder driftet."
tags: ["claude-code", "hooks", "sensors", "harness", "verifier", "PreToolUse", "PostToolUse", "Stop"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 4
---

> *"In the Land of AI Agents, the Verifiers Are King."*
> — Tariq Shaukat, Sonar (AI Engineer World's Fair, Juli 2026)

---

## Wo wir stehen

Post 2 hat das Harness in fünf Schichten gezeigt — `CLAUDE.md`, Skills, Rules, Hooks, Subagents. Post 3 hat gezeigt, wie Wissen ins Kontextfenster kommt, ohne dass es in der Mitte verloren geht. Beide Posts haben eine Kategorie von Mechanismen behandelt: **Guides**. Das Modell liest sie, das Modell versteht sie, das Modell befolgt sie — meistens.

Meistens.

Ein Guide, den das Modell ignoriert, ist keine Anweisung — er ist eine Bitte. Und irgendwann trifft jede Bitte auf ein Modell, das gerade den bequemeren Weg gefunden hat. Wenn du willst, dass eine Regel *gilt*, brauchst du eine zweite Kategorie: **Sensoren**. In Claude Code heißen sie Hooks.

Dieser Post zeigt, was Sensoren sind, warum Tariq Shaukats *"Verifier"*-Ökonomie sie in die Mitte des Bildes rückt, und wie du entscheidest, welcher Anker in einen Hook gehört und welcher in ein Skill bleiben kann.

---

## Die Verifier-Ökonomie

Tariq Shaukat, CEO von Sonar, hat auf dem AI Engineer World's Fair in San Francisco am 1. Juli 2026 die Konsequenz aus fünf Jahren KI-Coding auf einen Satz kondensiert: **In the Land of AI Agents, the Verifiers Are King.**

Die Logik dahinter ist unbequem klar. Wenn Code-Generierung nahezu unendlich und nahezu kostenlos wird, dann verschiebt sich die Knappheit. Was früher knapp war — jemand, der schnell und korrekt Code schreiben kann — ist jetzt Commodity. Was jetzt knapp ist: alles, was zwischen Modell-Output und Produktion steht und *nachweislich* prüfen kann, ob der Output taugt. Tests. Static Analysis. Type-Checker. Security-Scans. Coverage-Gates. Quality-Gates.

Sonar ist in diesem Markt kein neutraler Beobachter — Shaukat verkauft Verifier. Sein Vortrag fiel zeitgleich mit dem Launch von Sonar Vortex zusammen, einem Produkt, das genau das kommerziell anbietet, was Post 4 in Claude-Code-Hooks skizziert: Kontext-Injektion vor dem Write, Verifikation im inneren Loop, ready-to-merge PRs am Ende. Der Marktkampf um Verifier ist also nicht theoretisch — er hat schon Umsatz.

Aber die Marktbeobachtung stimmt trotzdem: Die Werkzeuge, die vor drei Jahren *"nice to have"* waren, sind die, die jetzt entscheiden, ob eine Agenten-Session in Produktion landet oder in einem Rollback endet.

Post 2 hat diesen Punkt bereits vorbereitet. Die Faustregel dort war: *Anker, die ein Prozessor prüfen kann, leben in Hooks.* Was Shaukat hinzufügt: **das ist nicht nur eine architektonische Präferenz — es ist die neue Verteilung von Wert.** Ein Team, das Agenten einsetzt, ohne in Verifier zu investieren, kauft Geschwindigkeit auf Kredit. Das Rückzahlungsdatum ist der erste Production-Incident.

---

## Was ein Hook eigentlich ist

Ein Hook ist ein Shell-Befehl, den die Claude-Code-Runtime — nicht das Modell — bei einem bestimmten Event ausführt. Wenn der Hook Exit-Code 2 zurückgibt, wird die Aktion blockiert und Claude bekommt die stderr-Ausgabe zur Verarbeitung. Das Modell hat keine Wahl. Es kann den Hook nicht ignorieren, nicht überstimmen, nicht wegargumentieren.

Das ist die Definition von deterministisch: **eine Regel, die nicht davon abhängt, ob das Modell sie liest.**

Konfiguriert wird das in `.claude/settings.json` (projektweit) oder `~/.claude/settings.json` (nutzerweit). Claude Code definiert inzwischen weit über zwanzig Event-Typen. Fünf davon decken 90% des Alltags ab:

- **`PreToolUse`** — läuft *vor* jeder Tool-Ausführung. Kann die Ausführung blockieren. Der richtige Ort für Sicherheits-Vetos.
- **`PostToolUse`** — läuft *nach* jeder Tool-Ausführung. Kann den nächsten Turn beeinflussen, aber die bereits erfolgte Aktion nicht rückgängig machen. Der richtige Ort für Lint- und Type-Checks.
- **`Stop`** — läuft, *bevor* Claude die Aufgabe als abgeschlossen meldet. Kann die Fertig-Meldung blockieren. Der richtige Ort für "Tests grün, Coverage erreicht, keine offenen Type-Errors."
- **`UserPromptSubmit`** — läuft, *wenn du eine neue Aufgabe schickst*. Der richtige Ort für Kontext-Injektion (aktueller Git-Status, offene Tickets).
- **`SessionStart`** und **`SessionEnd`** — für Umgebungs-Setup und -Aufräumen.

Ein Beispiel-`settings.json`, das drei der fünf nutzt:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/secret-scan.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "ruff check $CLAUDE_PROJECT_DIR/src && mypy --strict $CLAUDE_PROJECT_DIR/src"
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

- **Vor jedem Write oder Edit** läuft `secret-scan.sh`. Wenn AWS-Keys, GitHub-Tokens oder API-Secrets im Diff auftauchen, gibt der Hook Exit 2 zurück und Claude sieht: *"Secret detected. Refusing to write."* Die Datei wird nicht geschrieben.
- **Nach jedem Write oder Edit** laufen `ruff` und `mypy`. Lint- und Type-Fehler landen sofort im nächsten Turn. Claude korrigiert sie, bevor überhaupt jemand hinschaut.
- **Bevor Claude "fertig" meldet** läuft `verify.sh`. Das Script kann Tests ausführen, Coverage prüfen, Integration-Tests triggern. Wenn irgendetwas rot ist, ist die Aufgabe nicht fertig — egal was Claude denkt.

Drei Hooks. Zwölf Zeilen Konfiguration. Jede Session, die danach läuft, ist gegen die drei häufigsten Klassen von Agenten-Fehlern immun: **Secret-Leaks, Lint-Drift, verfrühte Fertig-Meldungen.**

---

## Der Entscheidungsrahmen: Deterministisch, inferentiell, oder ambient?

Post 2 hatte eine kurze Faustregel: *Anker, auf die sich das Team einigt, leben in `CLAUDE.md`. Anker, die Urteilsvermögen brauchen, leben in Skills. Anker, die ein Prozessor prüfen kann, leben in Hooks.*

Das ist der richtige Rahmen, aber er verdient hier eine konkrete Tabelle. Für jeden benannten Anker aus deinem Projekt gibt es genau *eine* richtige Schicht — und meistens ist die Antwort nicht die, die man beim ersten Nachdenken vermutet.

| Anker | Kann ein Prozessor das prüfen? | Richtige Schicht | Warum |
|---|---|---|---|
| Kein `console.log` in Production-Code | Ja — regex, ESLint-Rule | **Hook** (PostToolUse) | Deterministisch, nicht verhandelbar |
| Alle Public-APIs haben Docstrings | Ja — `interrogate` oder ähnliches | **Hook** (PostToolUse) | Deterministisch |
| Keine Secrets im Diff | Ja — `gitleaks`, `trufflehog` | **Hook** (PreToolUse) | Sicherheits-Veto, muss *vor* Write greifen |
| Test-Coverage ≥ 90% | Ja — `pytest --cov` | **Hook** (Stop) | Deterministisch, prüfbar am Ende |
| SOLID Principles einhalten | Nein — Urteilsfrage | **Skill** oder `CLAUDE.md` | Kein Prozessor kann "Single Responsibility" objektiv prüfen |
| Design by Contract für neue APIs | Nein — Urteilsfrage | **Skill** | Braucht Kontext, wann API "neu genug" ist |
| Domain-Sprache konsistent nutzen | Nein — Urteilsfrage | **`CLAUDE.md`** oder **Rule** | Braucht semantisches Verständnis |
| Migrations sind Zero-Downtime | Teilweise — Schema-Diffs prüfbar, Semantik nicht | **Hook + Skill** | Deterministischer Teil in Hook, Rest in Skill |

Die Regel, die aus dieser Tabelle folgt, ist scharf: **Wenn ein Anker deterministisch prüfbar ist, gehört er in einen Hook. Punkt.**

Warum? Weil ein Anker, der als Prosa in `CLAUDE.md` steht, in *jedem Turn* Tokens kostet, in *jedem Turn* der Modell-Aufmerksamkeit unterworfen ist, und in *jedem Turn* umgangen werden *kann*. Ein Anker, der als Hook läuft, kostet 50 Millisekunden, ist deterministisch, und kann nicht umgangen werden. Ein Linter braucht keine Aufmerksamkeit. Er hat Recht.

Umgekehrt gilt: Wenn du einen inferentiellen Anker in einen Hook zwingst, baust du dir false positives oder false negatives ein. *"Diese Methode verletzt SRP"* ist keine Regex-Frage. Der Versuch, sie zur Regex-Frage zu machen, endet in einem Hook, der entweder alles blockiert oder nichts fängt.

---

## Der Tod des Code-Reviews

Laurie Voss (Arize) hat auf demselben Fair einen Vortrag mit dem Titel *"The Death of the Code Review"* gehalten. Die Provokation: **Zeile-für-Zeile-Review durch Menschen skaliert nicht auf Agenten-Output.**

Voss' Argument ist nicht, dass Review verschwindet. Es ist, dass die Form, in der wir Review gelernt haben — ein Mensch, der ein PR durchgeht, Kommentare hinterlässt, auf Antworten wartet, iteriert — nicht überlebt, wenn Agenten pro Tag mehr Code produzieren als ein Team in einer Woche lesen kann. Voss' Antwort ist nicht *"besser skalieren."* Es ist *"neu erfinden."*

Die Neuerfindung passiert in zwei Schichten, und beide sind in Claude Code heute da:

**Erste Schicht — Hooks als kontinuierliches Review.** Was ein Reviewer früher am Ende gefunden hätte (Lint, Types, Coverage, Secrets), findet der Hook in dem Moment, in dem der Code entsteht. Das ist kein Ersatz für Review — es ist eine Vorverlagerung des mechanischen Anteils. Was am Ende bleibt, ist der Teil, den nur ein Mensch prüfen kann.

**Zweite Schicht — Subagents als spezialisierter Review-Kontext.** Post 2 hat Subagents als isolierten Reviewer eingeführt. Post 5 wird das vertiefen. Der Punkt für hier: Ein `code-reviewer`-Subagent, der Diffs gegen benannte Kriterien prüft (SOLID, Code Smells, Hard Rules), ist eine andere Klasse von Review als Zeile-für-Zeile. Er skaliert mit dem Agenten-Output, weil er selbst Agent ist. Und er hat den Vorteil, den kein menschlicher Reviewer mehr hat: **frischen Kontext**.

Voss' Provokation ist also technisch beantwortbar. Die schwierigere Frage ist die daraus folgende: *Wenn Hooks das mechanische Review erledigen und Subagents das strukturelle Review erledigen — was macht der Mensch dann eigentlich noch?*

Das ist der Punkt, an dem Geoffrey Litt in die Diskussion tritt.

---

## Der Gegenpol: Verstehen ist der neue Engpass

Geoffrey Litt (Design Engineer bei Notion) hat auf derselben Bühne die einzige Formulierung geliefert, die Post 4 daran hindert, in Automatisierungs-Triumphalismus zu kippen. Sein Vortrag hieß **"Understanding is the new bottleneck."**

Litts eigenes Argument: Wir verstehen Code nicht, um ihn zu verifizieren — dafür werden Agenten gut. Wir verstehen ihn, um aktive Teilnehmer an dem System zu bleiben, das wir bauen. Ein Projekt ist nie ein einzelner Loop; es sind hunderte, und das mentale Modell in deinem Kopf ist das, was dich befähigt, den nächsten sinnvoll zu entwerfen. Verlierst du das mentale Modell — weil du zu viel outsourct, zu wenig liest, zu selten das Warum hinter dem Code kennst — dann hast du still und leise deine Fähigkeit begrenzt, das Ganze zu steuern.

Litt hat als Antwort auf sein eigenes Problem ein Skill gebaut: **`/explain-diff`**. Es nimmt einen Diff und produziert strukturierte Erklärungen — zuerst Hintergrund (was war da vorher?), dann Intuition (was ändert sich konzeptionell?), dann Details (welche Zeilen tun was?). Ausgegeben als Markdown, HTML oder direkt in einem Notion-Dokument, wo Teams gemeinsam darüber diskutieren können. Das ist Understanding als Werkzeug, nicht nur als Vorsatz. Es ist ein Claude-Code-Skill wie jeder andere — und es adressiert exakt die Fähigkeit, die Litt für die knappste des agentischen Zeitalters hält.

Das ist keine Kritik an Verifiern. Es ist eine Präzisierung dessen, wofür sie da sind. Ein Hook, der Coverage prüft, ersetzt nicht das Verständnis, *warum* eine bestimmte Coverage-Schwelle für diese Codebase sinnvoll ist. Ein Subagent, der SOLID-Verletzungen findet, ersetzt nicht das Urteil, *wann* SOLID pragmatisch anwendbar ist und wann nicht. Die deterministischen Werkzeuge übernehmen die deterministischen Fragen. Die inferentiellen Fragen bleiben.

Und die wichtigste inferentielle Frage — *was soll dieses System eigentlich tun?* — bleibt immer beim Menschen.

Zwischen Shaukats Verifier-Ökonomie und Litts Understanding-Vorbehalt läuft die eigentliche Achse dieses Posts. **Verifier sind knapp und wertvoll. Aber Verstehen ist die Voraussetzung dafür, dass Verifier überhaupt sinnvoll eingesetzt werden können.** Ein Team, das nur in Verifier investiert und nicht in Verstehen, baut sich schnelle Loops in eine Codebase, die niemand mehr steuern kann.

---

## Failure Modes von Hooks

**Lang laufende Hooks.** Ein `PostToolUse`-Hook, der fünf Sekunden braucht, macht jede Session zur Geduldsprobe. Hooks müssen unter einer Sekunde bleiben. Wenn nicht: in einen Background-Job auslagern, oder auf `Stop` verschieben, wo Latenz seltener wehtut.

**Hooks als Skills-Ersatz.** Der Versuch, SOLID Principles per Regex zu erzwingen, endet entweder in einem Hook, der alles blockiert (weil die Heuristik zu breit ist), oder einem, der nichts fängt (weil sie zu eng ist). Inferentielle Anker gehören in Skills, nicht in Hooks. Das ist keine ästhetische Regel — es ist der Grund, warum das Konzept "Sensor" von "Guide" getrennt wurde.

**Hooks ohne stderr-Disziplin.** Ein Hook, der bei Fehlschlag nichts aussagekräftiges auf stderr ausgibt, produziert einen Agent, der weiß, dass etwas falsch war, aber nicht was. Der Hook muss dem Modell genug Information geben, damit es korrigieren kann. *"Failed with exit 2"* reicht nicht. *"ruff: F401 unused import 'json' in src/orders.py:3"* reicht.

**Stop-Hook als Alibi.** Ein `Stop`-Hook, der nur die Test-Suite ausführt, aber keine Integration-Tests, keine Coverage-Prüfung, keinen Type-Check, ist kein Verifier — er ist ein Feigenblatt. Wenn du "fertig" definierst, definier es ehrlich.

**Infinite Stop-Loops.** Ein `Stop`-Hook, der auf Exit 2 geht, ohne den Fall abzufangen, dass er *schon einmal* gefeuert hat, produziert einen Agenten, der endlos weiterarbeitet. Der Standard-Fix: am Anfang des Hook-Scripts `stop_hook_active` aus dem JSON-Input prüfen und bei `true` mit Exit 0 durchlaufen. Jeder Entwickler lernt das einmal.

**PostToolUse als Rückgängig-Werkzeug.** `PostToolUse` läuft *nach* der Aktion. Die Datei ist schon geschrieben. Der Hook kann Feedback geben, aber nicht undo. Wer Prävention will, braucht `PreToolUse`. Wer Reaktion will, `PostToolUse`. Verwechseln kostet echten Schaden.

**Verifier ohne Verständnis.** Litts Warnung, in Hook-Form: Ein Team, das seine Regeln nur noch in Hooks kennt und nicht mehr im Kopf, hat die Kontrolle abgegeben. Wenn du einen Hook nicht innerhalb von 30 Sekunden erklären kannst — was er prüft, warum er das prüft, was passiert wenn er scheitert — solltest du ihn nicht haben.

---

## Die Faustregel

> *Was ein Prozessor prüfen kann, prüft ein Hook. Was Urteilsvermögen braucht, prüft ein Skill oder ein Subagent. Was Verständnis braucht, prüft ein Mensch. Verwechsel die drei nicht.*

Die Verifier-Ökonomie, die Shaukat beschreibt, ist real. Die Neuerfindung des Code-Reviews, die Voss anmahnt, ist notwendig. Der Understanding-Vorbehalt, den Litt einlegt, ist die Bedingung dafür, dass das Ganze auf Dauer trägt. Hooks in Claude Code sind eines der Werkzeuge, das die drei Ebenen sauber trennt — vorausgesetzt, du weißt, welche Schicht welche Frage beantwortet.

---

## Was kommt als nächstes

Post 5 zeigt Goal Engineering: Aufgaben, die laufen, bis ein verifizierbares "fertig" erreicht ist. Der `Stop`-Hook aus diesem Post ist die technische Grundlage — ein Ziel ohne Stop-Hook ist ein Wunsch. Post 6 zeigt dann Loops: Aufgaben, die gar nicht mehr von dir gestartet werden. Shawn Wang hat dafür den Bogen geliefert: **Chat → Tools → Goals → Loops.** Post 5 ist Goals, Post 6 ist Loops. Sensor first.

---

## Weiterführende Quellen

- **Tariq Shaukat (Sonar)** — *"In the Land of AI Agents, the Verifiers Are King."* Keynote, AI Engineer World's Fair, San Francisco, 1. Juli 2026. Die Marktökonomie hinter der Verlagerung von Codegenerierung zu Verifikation. Zeitgleich mit dem Launch von Sonar Vortex und dem SonarQube Remediation Agent.
- **Laurie Voss (Arize)** — *"The Death of the Code Review."* AI Engineer World's Fair, 2026. Die Provokation, dass Zeile-für-Zeile-Review nicht mehr skaliert — und was an seine Stelle tritt.
- **Geoffrey Litt (Notion)** — *"Understanding is the new bottleneck."* AI Engineer World's Fair, Juli 2026. Schriftliche Fassung mit Details zum `/explain-diff`-Skill: [geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck.html](https://www.geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck.html)
- **Claude Code Hooks-Dokumentation** — [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) — kanonische Referenz zu Event-Typen, `settings.json`-Struktur, Exit-Codes und stderr-Verhalten.
- **Martin Fowler** — *"Harness Engineering for Coding Agent Users."* Die abstrakte Framework-Ebene: warum Guides und Sensoren getrennte Kategorien sind, und wie sie zusammenspielen.
- **Simon Willison** — *"The Lethal Trifecta."* Für den Sicherheits-Hook-Teil: welche Angriffs­flächen ein PreToolUse-Hook konkret verkleinert und welche nicht.
- **Zum Feld:** Die Loop-Engineering-Diskussion (Shawn Wang, Peter Steinberger, Geoff Huntley, Dex Horthy) läuft parallel zur Verifier-Debatte. Post 6 greift diese Stimmen konkret auf.
