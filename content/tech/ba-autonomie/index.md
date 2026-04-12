---
title: "BA-Autonomie — Fachseite steuert, AI setzt um, Dev sichert ab"
date: 2026-04-12
draft: false
description: "Warum Business Analysten, Product Owner und Requirements Engineers mit AI die Verantwortung über Feature-Delivery übernehmen können — und was Entwickler davon haben."
tags: ["ai", "architecture", "process", "product-ownership"]
categories: ["tech"]
personas: ["tech"]
---

Du sitzt im Refinement. Das Ticket ist sauber geschrieben — Template, Akzeptanzkriterien, alles was in Retros erarbeitet wurde. Alle nicken. Drei Sprints später kommt das Feature zurück.

Und es ist nicht das was gemeint war.

Wenn du als BA, PO oder Requirements Engineer arbeitest, kennst du das. Nicht weil du schlecht formulierst. Sondern weil zwischen deinem Fachwissen und dem fertigen Feature ein Übersetzungsprozess sitzt, der Bedeutung verliert. Ticket, Refinement, Rückfragen, Interpretation, Umsetzung, Abnahme, Korrekturschleife. Stille Post.

## Was ich als Architekt sehe

Ich sitze auf der anderen Seite. Ich sehe wie Fachlichkeit auf dem Weg durch Refinement, Interpretation und Umsetzung verdünnt wird. Und ich sehe gleichzeitig, dass AI heute reif genug ist, diesen Bruch aufzulösen.

Nicht indem ihr Entwickler werdet. Sondern indem ihr die Abhängigkeit verliert.

Lead-Developer sagen offen, dass sie selbst kaum noch Code schreiben. Das Werkzeug ist reif. Wenn Entwickler es nutzen — warum nicht die Fachseite?

Nicht weil ihr Code schreiben sollt. Sondern weil niemand besser weiß was der Kunde braucht als ihr.

## Der Prozess

{{< figure src="ba_autonomie_prozess.svg" alt="BA-gesteuerter Entwicklungsprozess mit AI — Prozessdiagramm von Anforderungsdefinition über AI-Refinement und Implementierung bis Tech Review und Release" caption="BA-gesteuerter Entwicklungsprozess mit AI" >}}

### 1. Anforderungen definieren

Du beschreibst das Feature — wie du es heute schon tust. Jira-Ticket, Akzeptanzkriterien, fachlicher Rahmen. Nur dass du jetzt nicht auf den nächsten Sprint wartest, sondern direkt mit einem AI-Chatbot in das Refinement gehst.

Der Bot kennt den Kontext: Architektur-Dokumentation, Komponenten-Beschreibung, fachlicher Rahmen. Das muss vorher sauber aufgesetzt sein — dazu weiter unten.

### 2. Refinement mit AI

Du diskutierst mit dem Bot. Nicht über Code. Über Fachlichkeit. Der Bot erstellt eine Spec — eine detaillierte Produkt-Spezifikation basierend auf deinem Ticket und dem Systemkontext.

Du liest. Du challengst. Du iterierst. So lange, bis die Spec das widerspiegelt was du meinst. Kein Entwickler interpretiert dazwischen. Kein Stille-Post-Effekt.

### 3. Spec freigeben

Sobald die Spec deine fachlichen Anforderungen abbildet und klar ist welche Abhängigkeiten, Schnittstellen und Berechtigungen geklärt sind — gibst du frei.

### 4. AI implementiert

Der Bot setzt um. Nicht du. Du beauftragst die Implementierung. Der Bot coded, testet, deployed eine Version und kommentiert das Ergebnis direkt in Jira.

Du musst keinen Code lesen. Du musst keine CMD öffnen. Du musst nur prüfen ob das Feature das tut was du beschrieben hast.

### 5. Fachlicher Test

Du testest. Dein Fachbereich testet. Tut das Feature was es soll? Stimmt die Logik? Passt das Verhalten zu den Akzeptanzkriterien?

Das ist dein Terrain. Hier bist du der Experte.

### 6. Tech Review

Jetzt kommt die Entwicklung ins Spiel. Nicht vorher. Der System- oder Komponenten-Verantwortliche prüft den PR auf Scope, Qualität, Architektur-Konformität. Falls nötig werden mit dem Bot Iterationen gedreht — Details zur Implementierung, die nur technisch relevant sind.

Übergreifende Entscheidungen werden als ADRs (Architecture Decision Records) dokumentiert und fließen in das ADR-Repo des Unternehmens. Das schafft eine Diskussionsgrundlage für kommende Architektur-Refinements.

### 7. Release

PR wird gemerged. Release-Version ist erstellt. Feature ist live.

**Ziel: Das ganze innerhalb von Stunden, nicht Sprints.**

## Was sich ändert

Der Prozess wird umgedreht:

- **Fachseite** verantwortet das Feature — von der Anforderung bis zur fachlichen Abnahme. Inklusive Implementierung durch AI.
- **Entwicklung** verantwortet die Systemintegrität — Tech Review, Qualitätssicherung, Architektur.

BA, PO und RE fokussieren sich eigenständig auf Business. Dev fokussiert sich auf Technical Excellence und Wartung.

Beide Seiten gewinnen Autonomie. Beide Seiten machen das, worin sie gut sind.

## Voraussetzungen

Damit das funktioniert, braucht es Vorarbeit. Vor allem auf der technischen Seite:

- **Saubere Komponenten-Beschreibung** — der Bot muss wissen, wo das Feature verortet wird.
- **Architektur-Dokumentation** — nicht 200 Seiten, aber genug Kontext für den Bot.
- **Developer Guidelines & Team Practices** — kodifiziertes Wissen, nicht implizites.
- **Schnittstellen zwischen Tools** — Jira, GitLab/Bitbucket, Confluence müssen zusammenspielen.
- **AI-taugliche Systemlandschaft** — ArchUnit, Code Coverage, TDD, AGENTS.md. Dev weiß was gemeint ist.

Die Entwicklung schafft die Infrastruktur. Die Fachseite nutzt sie.

## Der erste Schritt

Nimm dein letztes Jira-Ticket. Öffne ChatGPT. Sag:

> "Schreib mir eine detaillierte Produkt-Spezifikation basierend auf folgendem Ticket."

Lies das Ergebnis. Dann sag:

> "Challenge this as a Devil's Advocate."

Kein Tool installieren. Kein Code. Nur du und dein Fachwissen. 10 Minuten.

Wenn du merkst was möglich ist, reden wir über den nächsten Schritt.

## Warum mir das wichtig ist

Mach ich mich damit arbeitslos? Ich will nicht für Code vergütet werden, sondern für den Mehrwert den ich schaffe. AI ist ein Werkzeug. Es bringt uns alle voran.

Das Unternehmen, das am schnellsten AI in den Entwicklungsprozess aufnimmt, schafft am schnellsten echten Kundenmehrwert.

Damit das nicht theoretisch bleibt: Gemeinnützigen Organisationen helfe ich beim Einstieg in AI unentgeltlich.
