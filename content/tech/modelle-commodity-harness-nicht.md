---
title: "Modelle werden Commodity. Das Harness nicht — weil es deine Use Cases ist"
date: 2026-08-09
draft: false
description: "Post 9 hat gezeigt, wie man vom Use Case zum Harness kommt. Dieser Nachtrag beantwortet die Frage, die ein CTO danach stellt: Warum selbst bauen, statt kaufen? Die Antwort kommt von einer Wardley-Map, einem korrigierten Strategiepapier und Steve Yegges Beobachtung, dass sein eigenes wiederverwendbares Harness an einer einzigen Modellgeneration zerbrochen ist."
tags: ["claude-code", "harness", "wardley-mapping", "build-vs-buy", "strategie", "use-cases", "commoditization"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 12
---

> *„I have given up on building reusable harnesses. Indeed I believe harnesses will all soon be bespoke, and the people trying to sell you one will all soon be bebroke. Harnesses need to be part of your application, chemically bonded in."*
> — Steve Yegge, *The Shape of Things to Come*

---

## Wo wir stehen

Post 10 hat diese Serie abgeschlossen. Zehn Posts, ein Bogen von *„was ist Vibe Coding eigentlich?"* bis *„wie deploye ich das compliance-konform?"*. Post 11 hat kurz danach hinter die Kulissen von Claude Code selbst geschaut — Protokoll, Streaming, Speicherung. Der Werkzeugkasten war vollständig.

Dann kam eine Wardley-Map auf LinkedIn, und die Serie hatte plötzlich eine zweite Lücke.

Die Lücke ist die Frage, die ein CTO stellt, nachdem der Architekt ihm Post 9 erklärt hat: **„Verstanden, wir leiten das Harness aus unseren Use Cases ab. Aber warum bauen wir das selbst? Wird das nicht in zwei Jahren jemand verkaufen?"**

Das ist keine dumme Frage. Sie ist die zentrale Build-vs-Buy-Frage der nächsten Jahre, und die Standardantwort — *„weil es strategisch ist"* — ist keine Antwort, sondern eine Behauptung. Dieser Nachtrag liefert die Begründung.

---

## Die Wardley-Beobachtung

Martin Rosén-Lidholm, seit fast dreißig Jahren im Software-Engineering und heute als VP of Product and Engineering bei ChronosHub tätig, hat den Weg seiner eigenen Engineering-Strategie öffentlich dokumentiert. Februar: Notizen im Obsidian-Vault. Anfang März: die Erkenntnis, aufgeschrieben in einem Satz — **die Innovationskosten verschieben sich vom Bauen des Systems zum Bauen der Fabrik, also des Systems, das das System baut.** April: daraus wurde Doktrin auf einer Wardley-Map.

Die These der Map: **Jede Schicht agentischen Engineerings entwickelt sich Richtung Commodity — außer zwei.** Die Spezifikation über dem Modell. Das Harness darunter.

Wer mit Wardley-Mapping nicht vertraut ist: Die Methode plottet Systemkomponenten auf zwei Achsen. Vertikal die Sichtbarkeit für den Nutzer, horizontal die evolutionäre Reife in vier Stufen — *Genesis*, *Custom-Built*, *Product*, *Commodity*. Die klassische Build-vs-Buy-Regel daraus: Was bei Product oder Commodity liegt, kaufst du. Was bei Genesis oder Custom-Built liegt, baust du.

Auf Rosén-Lidholms Map wandern fast alle Komponenten nach rechts. Das Frontier-Modell wandert am weitesten — von Custom-Built bis tief in die Commodity-Zone. Der Agent wandert. Das Design System wandert bis zur Commodity. Die Spezifikation wandert ein Stück.

Zwei Komponenten wandern nicht: **das Harness und die AI-native Architektur.** Beide bleiben im Custom-Built-Bereich.

![Wardley Map: Agentic Engineering — was kommoditisiert und was nicht. Schwarze Punkte markieren die heutige Position, rote Punkte und gestrichelte Pfeile die erwartete Evolution. Harness und AI-native Architecture bleiben als einzige Komponenten im Custom-Built-Bereich.](/images/wardley-agentic-engineering.svg)
*Rekonstruktion der Wardley-Map von Martin Rosén-Lidholm (ChronosHub), August 2026 — Koordinaten approximiert.*

Rosén-Lidholms Formulierung dazu ist die schärfste Fassung des Arguments, die ich kenne:

> **Modelle kommoditisieren. Die Schichten, die sie einrahmen, nicht.**

*Hinweis zur Quellenlage: Die Map und die Zitate stammen aus einem LinkedIn-Post, der nicht öffentlich durchsuchbar ist. Die Darstellung oben ist deshalb eine Nachzeichnung anhand eines Screenshots, nicht das Original selbst. Ich konnte Rosén-Lidholms Identität und seine Rolle bei ChronosHub unabhängig bestätigen — nicht aber den Wortlaut der Map über eine zweite, unabhängige Quelle, anders als bei den Yegge- und Wardley-Zitaten weiter unten, die ich gegen die Originalquellen verifiziert habe.*

---

## Die Korrektur als Beleg

Das eigentlich Überzeugende an dieser Map ist nicht, dass sie recht hat. Es ist, dass sie korrigiert wurde.

Im April hatte Rosén-Lidholm das Harness Richtung *Product* gezeichnet — als würde irgendwann jemand kommen und uns eines verkaufen. Im August hat er das revidiert. Auf der Map steht die Korrektur explizit als Anmerkung: *„April: mapped the harness evolving toward Product, as if someone would eventually sell us one. August: revised. It stays custom-built, bonded into the application."*

**Eine öffentlich korrigierte Strategie-Map ist ein stärkeres Argument als eine, die immer schon recht hatte.** Wer seine eigene Doktrin nach vier Monaten Praxis anpasst und die alte Position durchgestrichen stehen lässt, hat den Beleg dafür geliefert, dass die Position aus Erfahrung stammt und nicht aus einer Folie.

Die Frage, die er dazu stellt und die im Kern dieses Posts steht:

> **Wo lebt dein Harness heute? Eingebettet in deine Anwendung — oder auf der Roadmap eines Anbieters?**

---

## Yegges empirischer Beleg

Rosén-Lidholm beruft sich auf Steve Yegge, und Yegges Beleg ist der härteste, den man in dieser Debatte bekommen kann: **er hat es selbst versucht und ist gescheitert.**

Yegge hatte ein Harness namens *Gas Town* gebaut, ausdrücklich mit dem Ziel, es wiederverwendbar zu machen. Sein eigenes Fazit: Am Ende hat er es nur genutzt, um damit sich selbst zu bauen. Und dann kam eine neue Modellgeneration — und Gas Town zerbrach. Yegges Beschreibung: bis Opus 4.6 lief es brillant. Mit 4.7 kam ein Verhaltensmuster (er nennt es den *„just two more things"*-Tic), das verhinderte, dass das Modell jemals damit fertig wurde, das Harness selbst zu justieren, statt echte Arbeit zu erledigen. Das Muster verschwand nicht mehr. Gas Town brannte effektiv ab.

Sein Nachfolger heißt *Wheelhouse*, ist closed-source, und ist ausdrücklich nur für sein Projekt *Wyvern* gebaut. Und dann kommt die Zahl, die diesen Post für jeden CTO relevant macht:

> **Die Arbeit an Wheelhouse selbst beansprucht etwa 20-25% seiner gesamten Wyvern-Projektarbeit** — und Yegge vermutet, dass dieser Anteil über die Lebensdauer agentischer Systeme ungefähr konstant bleibt.

Das ist keine Anekdote, das ist eine Budgetposition. Wer agentische Entwicklung ernsthaft betreibt, muss dauerhaft ein Fünftel bis ein Viertel der Engineering-Kapazität für das Harness selbst einplanen. Nicht als Projektaufwand, der irgendwann abgeschlossen ist. Als Betriebskosten.

Die Verbindung zu Post 6 (Metriken) ist direkt: **wenn du keine Zeile in deinem Kapazitätsplan hast, die „Harness-Wartung" heißt, planst du falsch.**

---

## Warum das Harness nicht kommoditisiert

Jetzt zum Kern. Warum genau soll ausgerechnet diese Schicht sich der Kommoditisierung entziehen, wenn alles andere darum herum kommoditisiert?

Rosén-Lidholms Antwort ist eine Aufzählung dessen, was ein Harness tatsächlich enthält:

- deine **Verifikations-Verträge** (Post 5: was heißt „fertig" in deinem Kontext)
- deine **Quality Gates** (Post 5: welche Hooks blockieren was)
- deine **Domänenregeln** (Post 2: was steht in `CLAUDE.md`, was in Skills)
- deine **Architektur** (Post 9: welche Bounded Contexts, welche Personas)
- deine **Produkterfahrung** (was dein System für deine Nutzer eigentlich tut)

Und dann der Satz, an dem das ganze Argument hängt:

> **Der Wert liegt in der Bindung. Und Bindung ist per Definition nicht übertragbar.**

Das ist präziser, als es zunächst klingt. Es geht nicht darum, dass ein generisches Harness *schlechter* wäre. Es geht darum, dass es **strukturell nicht dasselbe Ding sein kann**. Ein Harness, das für alle passt, kann keine deiner fünf Schichten enthalten — sonst würde es nicht mehr für alle passen. Was übrig bleibt, wenn du alle domänenspezifischen Anteile entfernst, ist kein generisches Harness. Es ist ein leeres Gerüst.

Yegges Formulierung dafür — *chemically bonded in* — trifft es besser als jede Metapher, die ich mir ausdenken könnte. Man kann eine chemische Bindung nicht aus einem Molekül herauslösen und in ein anderes einsetzen. Sie ist nicht Teil eines der beiden Atome. Sie *ist* die Beziehung zwischen ihnen.

Und deshalb gilt die Umkehrung, die Rosén-Lidholm aus der Frage ableitet, was passiert, wenn Modelle irgendwann alles schreiben können:

> **Ein besseres Modell absorbiert dein Harness nicht. Es macht das Harness zu dem einzigen Teil, der noch dir gehört.**

---

## Die Verbindung zu Post 9

Wer Post 9 gelesen hat, erkennt hier eine Kette wieder. Die Methodik dort war:

**Use Case → Persona → Bounded Context → Workflow → Harness**

Post 9 hat das als Architektur-Methodik verkauft: *so leitest du systematisch ab, welches Muster du brauchst*. Dieser Post fügt die ökonomische Hälfte hinzu: **genau diese Kette produziert das, was niemand verkaufen kann.**

Jeder Schritt der Kette bindet das Harness enger an deine spezifische Situation. Der Use Case ist deiner. Die Personas sind deine Rollen. Die Bounded Contexts sind deine Domänengrenzen. Die Workflows sind deine Prozesse. Was am Ende als Harness herauskommt, ist die Summe dieser Bindungen.

Umgekehrt heißt das: **ein Harness, das nicht aus einer Use-Case-Analyse abgeleitet wurde, hat den Burggraben nicht.** Es ist nur eine Sammlung von Konfigurationsdateien, die zufällig bei dir liegt. Wer `CLAUDE.md` aus einem Blogpost kopiert (auch aus diesem), hat kein Harness. Er hat eine Vorlage.

Die Methodik aus Post 9 war nie nur Ordnungsliebe. Sie ist der Mechanismus, der aus Konfiguration Eigentum macht.

---

## Ein kurzer Einwand: Wardley selbst

Ehrlichkeitshalber: Simon Wardley, der Erfinder der Methode, hat zum Begriff *„Agentic Engineering"* eine skeptischere Position. Sein Argument: Testen ist eine Ingenieursdisziplin — Test-Driven Development hat aus Testen kein Rätselraten mehr gemacht, sondern Verständnis direkt in Testsuiten kodiert. Entwicklung dagegen ist noch ein Handwerk. Und: Die eigentlichen Entscheidungen fallen im Code, während Architekturdiagramme und Spezifikationen nichts weiter sind als Glaubensbekenntnisse.

Das trifft. Aber es trifft die **Spezifikations**-Seite der Map härter als die **Harness**-Seite — und stützt damit indirekt das Argument dieses Posts. Wenn Spezifikationen tatsächlich nur Glaubensbekenntnisse sind, dann ist das Harness, das ausführbare Verifikation enthält, *umso* wertvoller. Ein Hook, der bei roten Tests blockiert, ist kein Glaubensbekenntnis. Er ist ein Fakt.

---

## Die Build-vs-Buy-Regel

Rosén-Lidholms operative Regel bei ChronosHub, direkt übersetzbar:

**Kaufe die Commodity.** Modelle. CI. Observability-Backends. UI-Komponenten. Alles, was zwischen Modellgenerationen überlebt, ohne dass du es anfassen musst.

**Baue das Harness ins Produkt.** Das ist die haltbare Investition — die einzige, die sich über jede Modellgeneration hinweg verzinst.

Für deutsche Enterprise-Kontexte ist die praktische Übersetzung wichtiger als die Regel selbst. Die Frage, die in Beschaffungsrunden gestellt wird, lautet meistens: *„Welches AI-Coding-Tool kaufen wir?"*

Das ist die falsche Frage. Die richtige lautet: **„Welches Harness bauen wir, und was kaufen wir darunter?"**

Der Unterschied ist nicht semantisch. Die erste Frage führt zu einem Lizenzvertrag und einem Rollout. Die zweite führt zu einer Use-Case-Analyse, einem Architekturentwurf und einer Kapazitätsplanung, die Yegges 20-25% enthält. Nur eine der beiden produziert etwas, das dem Unternehmen gehört.

---

## Was das für regulierte Umgebungen bedeutet

In Versicherung, Energie und Finanzdienstleistung verschärft sich das Argument.

Die fünf Bestandteile eines Harness — Verifikations-Verträge, Quality Gates, Domänenregeln, Architektur, Produkterfahrung — sind in regulierten Branchen nicht nur *use-case-spezifisch*. Sie sind teilweise **regulatorisch vorgegeben**. VAIT, MaRisk, DSGVO, branchenspezifische Aufsichtsanforderungen. Was in deinem `Stop`-Hook steht, ist bei einem Energieversorger nicht dasselbe wie bei einem Versicherer — nicht weil die Teams unterschiedliche Vorlieben haben, sondern weil die Aufsicht unterschiedliche Nachweise verlangt.

Das macht das Harness dort noch weniger übertragbar. Und es macht die Eigenbau-Entscheidung noch klarer: **Ein Anbieter, der dir ein fertiges Harness verkauft, kann dir nicht gleichzeitig die Compliance-Nachweise mitverkaufen, die deine spezifische Aufsicht verlangt.** Er kennt deine Aufsicht nicht. Er kennt deine Prüfungshistorie nicht. Er kennt die Auslegungspraxis deines Prüfers nicht.

Was er verkaufen kann, ist das, was Post 10 als Commodity identifiziert hat: das Modell, die Cloud-Region, die Observability-Pipeline. Alles darüber baust du.

---

## Failure Modes

**Harness-Shopping.** Auf den Anbieter warten, der das Problem löst. Yegges Prognose dazu ist unmissverständlich: die Leute, die dir eines verkaufen wollen, werden bald pleite sein. Wer wartet, verliert die Zeit, in der er hätte bauen können.

**Harness ohne Use-Case-Ableitung.** Wer die Kette aus Post 9 überspringt und direkt konfiguriert, baut zwangsläufig generisch — und verliert damit genau den Vorteil, der das Harness verteidigungsfähig macht. Ein generisches Harness hat keinen Burggraben. Es hat nur Wartungskosten.

**Die 20-25% nicht einplanen.** Wer das Harness als Projekt behandelt, das irgendwann abgeschlossen ist, wird von der nächsten Modellgeneration überrascht. Gas Town lief brillant — bis es das nicht mehr tat.

**Bindung mit Lock-in verwechseln.** *„Wenn wir das Harness so eng an unsere Domäne binden, sind wir gefangen."* Nein — Lock-in ist, wenn ein *Dritter* die Bedingungen kontrolliert. Bindung an die eigene Domäne ist das Gegenteil: es ist der Teil, den du kontrollierst, während alles darunter austauschbar bleibt. Genau deshalb funktioniert die Build-vs-Buy-Regel.

**Das Harness als IT-Thema behandeln.** Verifikations-Verträge, Quality Gates und Domänenregeln sind fachliche Entscheidungen, keine technischen. Wolffs soziotechnischer Einwand aus Post 6 gilt hier verstärkt: ein Harness, das die Fachseite nie diskutiert hat, kodiert die Domäne falsch — und wird umgangen.

---

## Die Faustregel

> *Kaufe alles, was zwischen Modellgenerationen überlebt, ohne dass du es anfasst. Baue alles, was deine Use Cases kodiert. Die Grenze zwischen beiden ist das Harness.*

Zwölf Posts. Der erste hat behauptet, ein KI-Agent sei schlicht ein Modell plus ein Harness. Dieser hier hat die ökonomische Konsequenz nachgeliefert: **das Modell ist der Teil, der austauschbar wird. Das Harness ist der Teil, der bleibt.**

Wer die Posts davor als technische Anleitung gelesen hat, hat sie richtig gelesen. Wer sie zusätzlich als Investitionsplan liest, hat sie vollständig gelesen. Jede Stunde, die in `CLAUDE.md`, Skills, Rules, Hooks, Subagents, Verifier und Loops geflossen ist, ist in etwas geflossen, das die nächste Modellgeneration überlebt — weil es nicht das Modell beschreibt, sondern deine Arbeit.

Und die Frage, mit der Rosén-Lidholm seinen Post beendet hat, ist auch die richtige, um diesen Nachtrag zu beenden:

**Wo lebt dein Harness heute? Eingebettet in deine Anwendung — oder auf der Roadmap eines Anbieters?**

---

## Weiterführende Quellen

- **Steve Yegge** — *„The Shape of Things to Come, Part 1: The Continuous Thunderdome"*, [yegge.ai/essays/the-shape-of-things-to-come](https://yegge.ai/essays/the-shape-of-things-to-come/). Der Bericht über Gas Town, Wheelhouse und die 20-25%-Beobachtung. Die empirische Grundlage dieses Posts.
- **Martin Rosén-Lidholm (ChronosHub)** — die Wardley-Map zur agentischen Engineering-Landschaft und die dokumentierte Korrektur vom April zum August. Veröffentlicht auf LinkedIn, August 2026. Rosén-Lidholms Rolle als VP of Product and Engineering bei ChronosHub ist über [chronoshub.io/about-us/meet-the-team](https://chronoshub.io/about-us/meet-the-team/) bestätigt; der exakte Wortlaut der Map selbst ist nicht unabhängig nachprüfbar, da LinkedIn-Posts nicht öffentlich durchsuchbar sind.
- **Simon Wardley** — *„Agentic Engineering"* (Dezember 2025), [swardleymaps.com](https://www.swardleymaps.com/posts/2025-12-06-agentic-engineering). Der Erfinder der Mapping-Methode mit einer skeptischeren Lesart des Begriffs. Lesenswert gerade weil er widerspricht.
- **Simon Wardley** — *Wardley Maps* (das Originalwerk, CC-lizenziert). Für die Methodik selbst: Value-Chain-Achse, Evolutionsachse, die vier Stufen Genesis / Custom-Built / Product / Commodity.
- **David Haberlah** — *„Build vs Buy in 2026: Using Wardley Mapping to Navigate the Agentic AI Shift"* ([Medium](https://medium.com/@haberlah/build-vs-buy-in-2026-using-wardley-mapping-to-navigate-the-agentic-ai-shift-be24d534b054), März 2026). Enthält ein Open-Source-Wardley-Mapping-Skill für Claude ([github.com/haberlah/wardley-mapping](https://github.com/haberlah/wardley-mapping), MIT-lizenziert), mit dem du die Analyse für dein eigenes Portfolio reproduzieren kannst.
- **Alistair Cockburn** — *Writing Effective Use Cases* (2001) und die Hexagonal-Architecture-Arbeiten. Die praktische Ergänzung zu Jacobson für alle, die die Use-Case-Seite der Kette aus Post 9 vertiefen wollen.
- **Post 9 dieser Serie** — *„Vom Use Case zum Harness"*. Die Methodik, deren ökonomische Begründung dieser Post nachliefert.
- **Post 6 dieser Serie** — *„Metriken für agentische Entwicklung"*. Für die Kapazitätsplanung, in der Yegges 20-25% eine Zeile bekommen müssen.
