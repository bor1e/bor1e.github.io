---
title: "Vom Use Case zum Harness: Wie du eine opinionated agentische Workflow-Architektur entwirfst"
date: 2026-07-26
draft: false
description: "Loops sind nicht tot. Die meisten Teams haben Stufe 1 nicht mal gemeistert. Aber die eigentliche Lücke im aktuellen Diskurs ist nicht die Auswahl der Stufe — sondern die Methode, mit der man sie wählt. Diese Methode gibt es schon: sie heißt Softwarearchitektur."
tags: ["claude-code", "architektur", "ddd", "workflow-design", "bounded-context", "personas", "arc42"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 8
---

> *„Loops externalize revision. Chains externalize order. Networks externalize roles. Graphs externalize state."*
> — Andrew Ng, *Agentic Knowledge Graph Construction*, Juli 2026
>
> Und was externalisiert die Entscheidung, welche Stufe du eigentlich brauchst?

---

## Wo wir stehen

Post 7 endete mit dem Chor um Peter Steinberger und Hamel Husain: *"Loop Engineering is dead. Enter Graph Engineering."* Die ehrliche Antwort lautet: **nein, Loops sind nicht tot — die meisten Teams haben Stufe 1 nicht mal gemeistert.**

Aber die interessante Lücke im aktuellen Diskurs ist eine andere. Der Diskurs springt von *"hier ist ein Design-Pattern"* (Reflection, Routing, Orchestrator-Workers) direkt zu *"hier ist ein Stack"* (Claude Code + MCP + Neo4j) und lässt die eigentliche Frage unbeantwortet: **Welches Pattern brauche ich für mein Problem?**

Softwarearchitekten beantworten diese Frage seit zwanzig Jahren mit einem etablierten Werkzeugkasten: Use Cases, Personas, Bounded Contexts, Workflows. Die Notation ist reif. Die Best Practice ist dokumentiert (arc42, C4, DDD). Die Übertragung auf die agentische Ebene ist verblüffend direkt — und niemand macht sie systematisch.

Dieser Post macht sie.

---

## Die vergessene Frage: Welche Stufe brauche ich?

Andrew Ngs Progression **Loops → Chains → Networks → Graphs** ist keine Reifekurve, die jedes Projekt durchlaufen muss. Sie ist ein **Entscheidungsraum**. Und Entscheidungsräume brauchen Entscheidungswerkzeuge.

Der aktuelle AI-Engineering-Diskurs behandelt die Progression fast durchgängig als Reifekurve: *"Wir sind bei Loops, als Nächstes kommen Graphs."* Das ist ein Kategorienfehler. Ng's eigene Formulierung im *Agentic Knowledge Graphs*-Kurs ist unmissverständlich: *"Start with the cheapest pattern. Add complexity only when a specific, measured failure demands it."* Anthropic hat in *Building Effective Agents* im Dezember 2024 dasselbe Prinzip formuliert: *"When building applications with LLMs, we recommend finding the simplest solution possible, and only increasing complexity when needed."*

Trotzdem greifen die meisten Teams zu *Orchestrator-Workers*, weil es am mächtigsten klingt — obwohl in ihrem konkreten Fall *Routing* oder *Prompt Chaining* die richtige Antwort wäre. Das ist kein AI-Fehler. Das ist ein **Architektur-Fehler**. Ein Muster wird gewählt, bevor der Use Case gemappt wurde.

Die Frage lautet also nicht *"Loops oder Graphs?"*. Sie lautet: **Wie leiten wir systematisch ab, welches Muster für welches Problem das richtige ist?**

---

## Was die Softwarearchitektur schon weiß

Bevor wir die Übertragung machen, kurz das Vokabular. Vier Konzepte, die jeder Software-Architekt kennt und die Post 8 als Werkzeuge nutzt:

**Use Case.** Was tut das System, für wen, unter welchen Vorbedingungen, mit welchem Ergebnis? Eine Textform, die seit Jacobson (1992) standardisiert ist. Ein Use Case ist *nicht* ein Feature — er ist ein Zielverhalten aus Sicht eines Akteurs.

**Persona.** Wer nutzt das System, mit welchen Zielen, unter welchen Randbedingungen? Alan Cooper hat den Begriff 1999 im Interaction Design geprägt (in *The Inmates Are Running the Asylum*); die Übertragung ins Architektur-Vokabular kam später über die UX-nahen Schulen der Softwarearchitektur. Personas sind keine Zielgruppen — sie sind konkrete, benannte Akteure mit Zielen und Grenzen.

**Bounded Context.** Wo endet die Verantwortung eines Systemteils, wo beginnt die des nächsten? Eric Evans hat den Begriff in *Domain-Driven Design* (2003) geprägt. Ein Bounded Context ist eine Grenze — sprachlich, semantisch, technisch. Innerhalb des Contexts gilt ein konsistentes Modell; zwischen Contexts wird explizit übersetzt.

**Workflow.** Wie fließen Aufgaben durch das System, in welcher Reihenfolge, mit welchen Übergängen? BPMN, Ereignisorientierte Modellierung, Ports & Adapters — die Notationen sind reif.

Alle vier haben etablierte Werkzeuge (arc42-Templates, C4-Diagramme, Domain Storytelling). Alle vier lassen sich sauber auf die agentische Ebene übertragen. Nur macht das im aktuellen AI-Engineering-Diskurs praktisch niemand.

---

## Das Mapping

Hier ist die Übersetzungstabelle, die den Rest dieses Posts trägt:

| Softwarearchitektur | Agentisches Äquivalent | Anthropic-Muster (2024) |
|---|---|---|
| Use Case | Ziel (`GOAL.md` aus Post 6) | — |
| Persona | Subagent-Rolle mit definiertem `description` und `tools` | Orchestrator-Workers |
| Bounded Context | Skill oder Rule mit Pfad-Scope (Post 2) | — |
| Workflow (Sequenz) | Prompt Chain, oder Loop mit Verifier | Prompt Chaining |
| Workflow (Entscheidung) | Routing per Skill-Description | Routing |
| Workflow (parallel) | Mehrere Subagents auf getrennten Diffs | Parallelization |
| Aggregate / Shared State | Externe Memory (Post 3) oder Knowledge Graph | Evaluator-Optimizer + Store |
| Anti-Corruption Layer | MCP-Server mit gefilterten Tools | Augmented LLM |
| Fitness Function | Hook (Post 4) oder Verifier-Subagent | Evaluator-Optimizer |

Die linke Spalte hat zwei Jahrzehnte Reife. Die mittlere Spalte hat sechs Monate. Die rechte Spalte hat zwei Jahre. **Wer die linke Spalte kennt, kann die anderen beiden viel schneller richtig einsetzen** — nicht weil die agentischen Muster neu sind, sondern weil ihre Namen neu sind. Der Mechanismus dahinter (Verantwortung trennen, Grenzen ziehen, Übergänge explizit machen) ist alt.

---

## Anthropic's fünf Workflow-Muster als Vokabular

Bevor wir mappen, kurz die fünf Muster aus *Building Effective Agents* (Erik Schluntz und Barry Zhang, Dezember 2024). Sie sind Bausteine, nicht Rezepte:

- **Prompt Chaining** — feste Sequenz von LLM-Aufrufen, jeder mit einer engen Transformation, programmatische Prüfungen dazwischen. Wenn die Zerlegung klar und stabil ist.
- **Routing** — Klassifizierung eines Inputs und Weiterleitung an einen spezialisierten Prompt oder Tool-Satz. Wenn Anfragen in klare Kategorien fallen.
- **Parallelization** — mehrere LLM-Aufrufe gleichzeitig, entweder aufgeteilt (Sectioning) oder für mehr Robustheit (Voting).
- **Orchestrator-Workers** — zentraler LLM analysiert die Aufgabe, delegiert dynamisch an Worker, synthetisiert. Wenn die Zerlegung erst zur Laufzeit klar wird.
- **Evaluator-Optimizer** — ein LLM produziert, ein zweiter bewertet, Zyklus bis Schwelle erreicht. Reflection als Produktionsmuster.

Ng's Regel dazu, sinngemäß: *das billigste Muster, das die Aufgabe löst, ist das richtige.* Und die Rangfolge nach Kosten und Fehlermodi ist genau die Reihenfolge oben.

---

## Ein konkretes Mapping: Antragsverarbeitung im Versicherungskontext

Zum Konkreten. Nehmen wir einen plausiblen Use Case aus der Versicherungswelt: **Ein Kunde reicht einen Änderungsantrag zu seinem bestehenden Vertrag ein.** Der Antrag muss validiert, geprüft und — je nach Komplexität — automatisch verarbeitet oder an einen Sachbearbeiter eskaliert werden.

### Schritt 1 — Use Cases identifizieren

Drei Use Cases in diesem Ablauf:

- **UC1:** Kunde reicht Antrag ein → System nimmt an, validiert Grunddaten, gibt Eingangsbestätigung.
- **UC2:** System prüft Antrag inhaltlich → entweder automatische Verarbeitung möglich, oder Eskalation an Sachbearbeiter.
- **UC3:** Sachbearbeiter bearbeitet eskalierten Antrag → System unterstützt mit Vorschlägen und relevanten Informationen aus Vorgängen.

Drei Use Cases, drei Akteure, drei Ergebnisse. Diese Auflistung ist keine AI-spezifische Arbeit — sie ist die klassische Use-Case-Modellierung, die man in jedem CPSA-Kurs lernt.

### Schritt 2 — Personas benennen

Für jeden Akteur eine Persona. In der klassischen Architektur:

- **Kunde** — will einen Antrag stellen, ohne die Details der internen Prozesse zu kennen.
- **Sachbearbeiter** — bearbeitet Eskalationen, kennt den Fachbereich, entscheidet unter Compliance-Vorgaben.
- **Compliance-Prüfer** — prüft stichprobenartig, ob Automatik-Entscheidungen die Vorgaben einhalten.

Für die agentische Ebene wird jede Persona zu einem **Subagent** mit klar definierter Rolle, klar begrenzten Tools und einer strengen Description, die den Trigger definiert. Das ist Post 2's Subagent-Muster, jetzt aber nicht mehr als *"Reviewer"* generisch, sondern als **spezifische Persona mit einer Grenze**.

### Schritt 3 — Bounded Contexts ziehen

Drei Contexts:

- **Antragseingang** — nimmt an, validiert Grunddaten, gibt Eingangsbestätigung. Sprachlich: *Antrag*, *Eingang*, *Bestätigung*.
- **Antragsprüfung** — inhaltliche Prüfung, Entscheidung Automatik/Eskalation. Sprachlich: *Prüfung*, *Regelwerk*, *Ausnahme*.
- **Sachbearbeitung** — Eskalationsbearbeitung mit Kontextinformationen. Sprachlich: *Fall*, *Vorgang*, *Bearbeitungsstand*.

Zwischen den Contexts wird explizit übersetzt. *Antrag* im Eingang ist nicht dasselbe wie *Fall* in der Sachbearbeitung — der eine ist ein eingegangenes Dokument, der andere ein aktiver Bearbeitungsvorgang mit Historie. Das ist DDD-Grundlage.

Auf der agentischen Ebene wird jeder Bounded Context zu einer eigenen `CLAUDE.md`-Datei (Post 2, hierarchisch), mit eigenen Rules und eigenen aktivierten Skills. Der Antragseingangs-Agent hat keine Ahnung von *Fall*. Der Sachbearbeitungs-Agent hat keine Ahnung von *Eingangsbestätigung*. Das ist Feature, nicht Bug — es ist die Grenze, die verhindert, dass sich Verantwortlichkeiten vermischen.

### Schritt 4 — Für jeden Context: welche Ng-Stufe?

Jetzt kommt die eigentliche Architekturentscheidung. Nicht *"welches Muster ist am besten?"*, sondern *"welches Muster ist für diesen Context angemessen?"*.

- **Antragseingang** — deterministisch, klar strukturierbar, Fehlerfälle bekannt. **Prompt Chain** (Anthropic-Muster #1). Kein Loop nötig, kein Graph nötig. Eingang → Validierung → Bestätigung, mit programmatischen Gates zwischen den Stufen.

- **Antragsprüfung** — inhaltliche Entscheidung, bei der die Fallunterscheidung erst zur Laufzeit klar wird. **Routing + Evaluator-Optimizer** (Anthropic #2 + #5). Router klassifiziert (automatisch vs eskalieren), Evaluator prüft im Automatik-Fall die Confidence der Entscheidung, unter Schwelle → Eskalation.

- **Sachbearbeitung** — komplexe, iterative Arbeit mit Rückgriff auf historische Vorgänge. **Loop** (Ng-Stufe 1) mit einem Retrieval-Skill für ähnliche Vergangenheitsfälle. Der Sachbearbeiter-Subagent arbeitet iterativ am Fall, Hooks aus Post 4 prüfen Compliance-Regeln, Verifier-Subagent aus Post 6 prüft am Ende.

Merke: kein einziger Bounded Context braucht die Graph-Stufe. Die drei Contexts kommen mit den ersten drei Anthropic-Mustern aus. Ein Team, das reflexartig zu Neo4j gegriffen hätte, hätte drei Wochen Infrastrukturarbeit für einen Fall, der es nicht braucht.

### Schritt 5 — Für jeden Workflow: welches Harness-Setup?

Jetzt wird das Harness aus Posts 1–7 zum Werkzeugkasten:

- **`CLAUDE.md` pro Context** (Post 2, hierarchisch) — je eine im Verzeichnis des Contexts, mit den domänenspezifischen Standards.
- **Skills für Personas** (Post 3) — `sachbearbeiter-vorgangsanalyse/SKILL.md`, `compliance-pruefer-regelwerk/SKILL.md`.
- **Rules für Grenzen** (Post 2) — `.claude/rules/antragspruefung.md` mit strikten Vorgaben, was in diesem Context erlaubt ist.
- **Hooks für Fitness Functions** (Post 4) — `PreToolUse`-Hook für Datenschutz-Regeln (keine Kunden-PII in Logs), `Stop`-Hook für Compliance-Prüfung.
- **Verifier-Subagent für Freigabe** (Post 6) — pro Automatik-Entscheidung ein isolierter Prüfer.
- **Metriken pro Context** (Post 5) — Rejection-Rate im Router, Eskalationsquote, Bearbeitungszeit pro Fall.

Das ist keine Ansammlung von Mustern. Das ist eine **kohärente Architektur**, in der jede Entscheidung von einer Use-Case-Analyse abgeleitet ist und jede Grenze durch ein Harness-Element enforced wird.

---

## Der Wolff-Reprise: Architektur ist ein soziotechnisches System, auch agentisch

Eberhard Wolffs Warnung aus Post 5 gilt hier verstärkt. Die schönste agentische Architektur ist wertlos, wenn das Team sie nicht diskutiert und mitträgt. Ein Bounded Context, den das Team nicht akzeptiert, wird verletzt — nicht durch Sabotage, sondern durch Interpretation. Ein Workflow, den nur ein Architekt entworfen hat, wird umgangen.

Der praktische Rückschluss: **Wolffs Interviews mit offenen Fragen funktionieren auch für die agentische Architekturarbeit.** Statt *"welche Muster brauchen wir?"* frage: *"Wo umgeht ihr aktuell manuelle Prozesse? Wo bleibt Wissen bei Einzelnen hängen? Wo wird zwischen Systemen kopiert, was eigentlich fließen sollte?"* Die Antworten zeigen dir die Use Cases, die Personas, die Contexts — bevor du eine einzige `CLAUDE.md` schreibst.

Das ist auch der Test für den Erfolg der Analyse: wenn dein Team beim Lesen des Architekturvorschlags nickt und sagt *"ja, so machen wir es tatsächlich"*, hast du die richtige Analyse gemacht. Wenn es die Stirn runzelt und sagt *"das klingt schön, aber so läuft es bei uns nicht"*, hast du eine Vision aufgeschrieben, keine Architektur.

---

## Die Graph-Frage, ehrlich beantwortet

Erst *nach* dieser Analyse kannst du sinnvoll entscheiden, ob dein Projekt tatsächlich einen Graphen braucht. Ngs eigene Regel im Playbook, direkt übernommen: **Ein Graph verdient sich seinen Platz, wenn dieselbe Entität von mehr als einem Agenten oder über mehr als eine Session hinweg abgefragt wird.**

> **Die CFO-Rauchprobe zur Use-Case-Readiness:**
> Ein Graph ist teuer — in der Infrastruktur (Neo4j-Lizenzen, Cluster-Hosting), in der Latenz und in der kognitiven Wartung. Ngs technische Regel ("gleiche Entität, mehrere Agenten") ist ein hervorragender Entwickler-Kompass. Aber die betriebswirtschaftliche Hürde für ein Enterprise ist höher: **Kannst du deinem CFO die konkrete geschäftliche Frage zeigen, die dieser Graph beantwortet und die ein klassisches relationales Schema (oder ein einfacher pgvector-Store) nicht oder nur mit absurdem Join-Aufwand lösen kann?** 
> 
> Wenn die Antwort lautet: *"Wir müssen Pfad-Traversierungen über 5 Beziehungsstufen hinweg machen (z. B. zur Erkennung von Betrugsnetzwerken bei Versicherungen oder zur Abhängigkeitsanalyse in 10-Millionen-Zeilen-Monorepos)"*, dann verdient der Graph seine Kosten. Wenn die Antwort lautet: *"Wir wollen Kundendaten abfragen und Dokumente suchen"*, dann ist ein Postgres-Cluster um Faktoren billiger, verlässlicher und schneller produktiv. Ein Enterprise ist erst bereit für einen Graphen, wenn die relationale Welt an der Komplexität der Beziehungen (nicht der Datenmenge) kollabiert.

Für das Antragsbeispiel oben: nein. Jeder Fall lebt in einem Context, wird von einem Agenten pro Persona bearbeitet, und der Vorgangsstand persistiert in einer bestehenden Fachanwendung (nicht in einem Graphen). Der Retrieval-Skill für historische Vorgänge holt sich Daten aus dem bestehenden CRM, nicht aus einem Neo4j-Cluster.

Für Kontexte wie Ngs Code-Review-Beispiel im Playbook — mehrere Reviewer-Agenten über Hunderte von PRs, mit Mustererkennung über Vorgänger-Vulnerabilities hinweg — **ja**. Die gleiche Entität (ein Code-Muster, eine Datei, eine Vulnerability-Klasse) wird von mehreren Agenten über Sessions hinweg abgefragt. Das ist genau der Fall, für den ein Graph existiert.

Für die meisten deutschen Enterprise-Projekte im Versicherungs- und Energiesektor: **Stufe 2 (Chain) oder Stufe 3 (Network) ist die richtige Antwort.** Nicht Stufe 4. Der Graph kommt später, wenn er sich verdient hat — nicht vorher, weil er auf einer Konferenzfolie stand.

---

## Failure Modes

**Pattern-First-Design.** Das Muster wählen und dann den Use Case daran anpassen. Das häufigste Anti-Pattern im aktuellen Diskurs. Wer mit *"wir bauen ein Orchestrator-Workers-System"* startet und dann sucht, was es tun soll, hat die Analyse übersprungen.

**Fehlende Bounded Contexts.** Ein Agent, der alles macht — Antragseingang, Prüfung, Sachbearbeitung. Das ist derselbe Fehler wie ein Microservice, der alles kann: kein klarer Verantwortungsbereich, kein testbares Verhalten, kein sauberer Fehlermodus.

**Persona-Verwechslung.** Der Reviewer-Subagent, der auch Code schreibt. Der Prüfer-Agent, der auch entscheidet. Personas mischen ist der schnellste Weg zurück in den Curse-of-Knowledge-Fall aus Post 1.

**Über-Engineering.** Neo4j, wo eine JSON-Datei reicht. Multi-Agent, wo Prompt Chaining reicht. Ngs Regel, direkt anwendbar: das billigste Muster, das die Aufgabe löst, ist das richtige.

**Unter-Engineering.** Ein einziger Loop für eine Aufgabe, die drei separate Contexts hat. Zusammengefasste Skills, wo Rules mit Pfad-Scope die richtige Antwort wären. Das ist das Spiegelbild von Über-Engineering — genauso teuer, nur später sichtbar.

**Architektur ohne soziotechnische Verankerung.** Wolffs Punkt: eine Architektur, die auf einer Folie schön aussieht, aber im Team nicht diskutiert wurde, wird ignoriert. Das ist keine AI-Frage. Das ist eine Führungsfrage.

---

## Die Faustregel

> *Erst der Use Case, dann die Persona, dann der Bounded Context, dann der Workflow, dann das Harness. Wer die Reihenfolge umdreht, baut ein Muster auf der Suche nach einem Problem.*

Diese Reihenfolge ist keine agentische Erfindung. Sie ist die klassische Softwarearchitektur-Reihenfolge, angewendet auf eine neue Ebene. Die gute Nachricht: wer die klassische Reihenfolge kennt, hat den halben Weg schon gemacht. Die schlechte Nachricht: wer sie überspringt, wird die gleichen Fehler machen, die die Softwarearchitektur seit zwanzig Jahren dokumentiert hat — nur schneller und teurer.

---

## Was kommt als nächstes

Post 9 zeigt Guardrails: wie du die Boundaries, die du in dieser Architektur-Übung gezogen hast, technisch durchsetzt. Die Verbindung ist eng — was hier *Bounded Context* heißt, wird dort *Permission-Boundary* und *Data-Boundary*. Was hier *Persona* heißt, wird dort *Least-Privilege-Prinzip*. Der DSGVO- und Compliance-Layer, den regulierte Umgebungen brauchen, ist keine Zusatzarbeit — er ist die konsequente Durchsetzung der Architekturentscheidungen aus diesem Post.

---

## Weiterführende Quellen

- **Eric Evans** — *Domain-Driven Design: Tackling Complexity in the Heart of Software* (Addison-Wesley, 2003). Das Original zu Bounded Contexts, Ubiquitous Language, Aggregates. Zwei Jahrzehnte alt, agentisch relevanter denn je.
- **Ivar Jacobson et al.** — *Object-Oriented Software Engineering: A Use Case Driven Approach* (Addison-Wesley, 1992). Das Fundament der Use-Case-Modellierung, das den Diskurs bis heute prägt.
- **Alan Cooper** — *The Inmates Are Running the Asylum: Why High Tech Products Drive Us Crazy and How to Restore the Sanity* (Sams Publishing, 1999). Die Einführung von Personas als Design-Werkzeug — ursprünglich für Interaction Design, später von der Architektur adoptiert.
- **Simon Brown** — *The C4 Model for Visualising Software Architecture* — [c4model.com](https://c4model.com). Die zeitgemäße Notation für Kontext-, Container- und Komponenten-Diagramme, die für agentische Systeme unmittelbar funktioniert.
- **Gernot Starke, Peter Hruschka** — *arc42 — Praktische Softwarearchitektur* — [arc42.org](https://arc42.org). Das Template, das die deutschsprachige Enterprise-Architektur-Community trägt.
- **Eberhard Wolff (INNOQ)** — *"Soziotechnische Architektur-Reviews"* auf heise.de. Die konsequente Erinnerung, dass Architektur ohne Team keine Architektur ist.
- **Andrew Ng** — *Agentic Knowledge Graph Construction* Kurs (DeepLearning.AI + Neo4j + Google ADK), Juli 2026. Die Progression Loops → Chains → Networks → Graphs als Externalisierung von Kognition, und die zugrunde liegende Regel *"start with the cheapest pattern"*. [deeplearning.ai/courses/agentic-knowledge-graph-construction](https://www.deeplearning.ai/courses/agentic-knowledge-graph-construction)
- **Erik Schluntz, Barry Zhang (Anthropic)** — *"Building Effective Agents"* (Dezember 2024). Die Referenz für die fünf Workflow-Muster, die diesen Post durchgehen: Prompt Chaining, Routing, Parallelization, Orchestrator-Workers, Evaluator-Optimizer. Das Prinzip: *"finding the simplest solution possible, and only increasing complexity when needed."*
- **iSAQB CPSA-F** — der Foundation-Level-Lehrplan der International Software Architecture Qualification Board. Für Leser, die die klassischen Werkzeuge noch nicht im Repertoire haben.
