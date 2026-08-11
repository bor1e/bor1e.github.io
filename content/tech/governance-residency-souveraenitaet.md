---
title: "Governance, Residency, Souveränität: Die drei Achsen, die kein Anbieter gleichzeitig bedient"
date: 2026-10-05
draft: true
description: "Enterprise-KI scheitert an zwei Extremen: wilder Schatten-IT oder IT-Paralyse. Das AI Gateway ist die Antwort auf beide — aber es löst nur eine von drei Achsen. Dieser Post zeigt, welche drei das sind, warum sie sich heute gegenseitig ausschließen, und wie du die Entscheidung triffst, die dein Anbieter nicht für dich treffen kann."
tags: ["enterprise-ai", "governance", "dsgvo", "ai-gateway", "bedrock", "vertex", "foundry", "tco", "kritis", "cloud-act"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 13
---

> *Ein Gateway kauft dir Sichtbarkeit, nicht Sicherheit. Residency kauft dir Rechtssicherheit, nicht Governance. Souveränität kauft dir Kontrolle, nicht Fähigkeit.*

---

## Zwei Arten, an Enterprise-KI zu scheitern

Die erste Art ist laut. Entwickler kopieren Code in ChatGPT, weil es schneller geht. Fachbereiche kaufen SaaS-Tools mit Kreditkarte. Irgendwo läuft ein Claude-Pro-Account auf eine Privatadresse, weil der Freigabeprozess drei Monate dauert. Niemand weiß, welche Daten wohin fließen. Das ist Schatten-IT, und sie ist in fast jedem deutschen Konzern bereits Realität — meistens ohne dass die IT-Leitung das Ausmaß kennt.

Die zweite Art ist leise. Compliance blockiert, Security blockiert, der Betriebsrat hat Fragen, der Datenschutzbeauftragte hat mehr Fragen. Nichts wird freigegeben. Zwei Jahre später hat der Wettbewerb Erfahrung gesammelt, und das eigene Haus hat ein Konzept. Das ist Paralyse.

**Beides sind Governance-Versagen, nur in entgegengesetzte Richtungen.** Und beides hat dieselbe Ursache: Es gibt keinen Kontrollpunkt zwischen den Nutzern und den Modellen. Ohne Kontrollpunkt kann man nur zwischen *„alles erlauben"* und *„nichts erlauben"* wählen.

Der Kontrollpunkt heißt in der aktuellen Diskussion **AI Gateway**. Dieser Post erklärt, was ein Gateway tatsächlich leistet, was es nicht leistet, und warum die Entscheidung darüber komplizierter ist, als jeder Anbieter zugibt.

Er richtet sich an CIOs, CTOs und Architekten, die den Rollout verantworten — nicht an die Entwickler, die ihn nutzen. Für die gibt es die Posts 1 bis 12.

---

## Was ein Gateway wirklich ist

Zuerst die Entzauberung, weil davon alles Weitere abhängt.

Ein AI Gateway ist ein Proxy. Er sitzt zwischen den Werkzeugen deiner Nutzer und den Modell-Anbietern. Jeder Request läuft durch ihn hindurch. Er kann protokollieren, filtern, umleiten, drosseln, blockieren und abrechnen.

Was er **nicht** ist: eine Firewall im klassischen Sinn. Die Formulierung *„das Gateway verhindert Datenabfluss"* steht in vielen Decks und ist falsch. Wenn dein Modell bei Anthropic, OpenAI oder Google läuft, fließen deine Daten weiterhin dorthin. Das Gateway macht diesen Fluss **sichtbar, protokolliert, steuerbar und jederzeit unterbrechbar** — aber es verhindert ihn nicht.

Dieser Unterschied ist kein Wortspiel. Er entscheidet darüber, was du in einem Compliance-Review versprechen kannst. Ein CISO, der die Firewall-Formulierung hört und nachfragt, wird innerhalb von zwei Minuten feststellen, dass das Versprechen nicht hält. Danach steht die Glaubwürdigkeit des gesamten Konzepts zur Debatte.

Die ehrliche und immer noch starke Formulierung lautet: **Das Gateway verwandelt unkontrollierten Datenabfluss in kontrollierte, protokollierte und jederzeit abschaltbare Datenweitergabe.** Das ist der Unterschied zur Schatten-IT, und es ist genug.

---

## Die drei Achsen

Hier kommt der Punkt, an dem die meisten Enterprise-KI-Konzepte unpräzise werden. *„Wir brauchen ein Gateway"* klingt nach einer Entscheidung. Tatsächlich sind es drei — und sie sind heute nicht gleichzeitig erfüllbar.

**Achse 1 — Governance-Integration.** Läuft die KI-Nutzung in deiner bestehenden Identitäts-, Abrechnungs- und Berechtigungslandschaft? Konkret: Single Sign-on über dein Entra ID oder Keycloak. Schlüsselverwaltung in deinem Key Vault. Abrechnung über deinen bestehenden Enterprise Agreement. Rollenmodell aus deinem bestehenden IAM. Für einen Konzern mit gewachsener Azure- oder AWS-Landschaft ist das kein Komfort, sondern die Voraussetzung dafür, dass Betrieb und Revision überhaupt mitgehen.

**Achse 2 — Data Residency.** Wo genau findet die Inferenz statt? Nicht wo der Endpunkt liegt — wo das Modell tatsächlich rechnet. Das ist ein Unterschied, den viele Architekturen verwischen und den die Aufsicht nicht verwischt.

**Achse 3 — Souveränität.** Wem gehört die Infrastruktur, auf der das läuft? Wer kann per Gerichtsbeschluss darauf zugreifen? Welche Vertragskette steht dahinter?

Diese drei Achsen sind unabhängig voneinander. Und — das ist die unbequeme Nachricht — **kein Anbieter bedient heute alle drei gleichzeitig für Claude.**

---

## Warum sich die Achsen aktuell ausschließen

Die konkrete Marktlage, Stand Sommer 2026:

**Microsoft Foundry (früher Azure AI Foundry) bedient Achse 1 hervorragend.** Azure-natives Identity-Management, Key Vault, Abrechnung über den bestehenden EA, Governance-Werkzeuge, die dein Betrieb schon kennt. Für ein Azure-Haus ist das der Weg des geringsten Widerstands.

**Aber Foundry bedient Achse 2 für Claude heute nicht.** Anthropic ist seit Januar 2026 als Microsoft-Subprozessor gelistet — und Anthropic-Modelle sind **explizit aus Microsofts EU Data Boundary und den In-Country-Processing-Zusagen ausgeschlossen**. Wenn du Claude über Foundry deployst, läuft die Inferenz auf Anthropics eigenen Servern, unabhängig davon, ob du Sweden Central oder Germany West Central wählst. Anthropics eigene Dokumentation scoped die Residency-Zusagen ausdrücklich auf Vertex AI und Bedrock; Foundry ist nicht enthalten. Die regionale Compliance-Seite listet Microsoft Foundry Europa als *„Coming 2026"* — ohne Datum. Eine Microsoft-Q&A-Anfrage nach einem konkreten Zeitplan steht seit April unbeantwortet.

**AWS Bedrock und Google Vertex AI bedienen Achse 2.** Claude läuft dort in echten EU-Regionen — Bedrock in Frankfurt, Irland, Paris, Stockholm; Vertex in europe-west1 sowie über einen dedizierten EU-Multi-Region-Endpunkt. Beide mit vertraglichen Lokalisierungs-Zusagen. Wenn EU-Residency für Claude eine harte Anforderung ist, sind das heute die einzigen zwei Wege.

**Aber wenn dein Haus auf Azure läuft, kostet dich das Achse 1.** Ein zweiter Cloud-Provider bedeutet ein zweites IAM-Modell, einen zweiten Abrechnungsweg, eine zweite Betriebsmannschaft, ein zweites Netzwerk-Konzept. Das ist nicht unmöglich, aber es ist real teuer — und es ist der Grund, warum viele Häuser trotz der Residency-Lücke bei Foundry bleiben wollen.

**Achse 3 bedient heute niemand vollständig** — und das ist der Abschnitt, der die meisten Konzepte überrascht.

---

## Achse 3: Warum EU-Region nicht EU-Jurisdiktion bedeutet

Der **US CLOUD Act** von 2018 verpflichtet US-Unternehmen, Daten herauszugeben, die sich in ihrer *Kontrolle* befinden — auf Verlangen US-amerikanischer Behörden, unabhängig vom Speicherort. Das operative Kriterium ist **Kontrolle, nicht Geografie**. Ein Rechenzentrum in Frankfurt, betrieben von einem Unternehmen mit Sitz in Seattle, ist ein US-kontrolliertes Rechenzentrum. Das Gesetz folgt dem Unternehmen, nicht dem Server.

Das gilt für alle drei Hyperscaler, in allen ihren EU-Regionen. Und es kollidiert direkt mit **DSGVO Artikel 48**, der die Übermittlung personenbezogener Daten an Nicht-EU-Behörden allein auf Grundlage einer ausländischen Gerichts- oder Behördenanordnung untersagt. Standardvertragsklauseln und Auftragsverarbeitungsverträge können US-Rechtszwang nicht überschreiben.

Diese Lücke ist nicht theoretisch, und sie wird nicht nur von Kritikern behauptet. **Microsofts Chief Legal Officer in Frankreich hat unter Eid vor dem französischen Senat ausgesagt, dass das Unternehmen nicht garantieren kann, dass EU-Daten vor US-Zugriffsanfragen geschützt sind** — auch nicht in EU-Rechenzentren unter „Sovereign"-Programmen. Das ist keine Analystenmeinung, das ist eine Aussage des Anbieters selbst.

Dazu kommt bei Claude eine Besonderheit: Die Vertragskette ist dreistufig. *Dein Unternehmen (Verantwortlicher) → Cloud-Provider (Auftragsverarbeiter) → Anthropic (Unterauftragsverarbeiter).* Du hast keinen Direktvertrag mit Anthropic. Dein Datenschutzverhältnis zu Anthropic läuft ausschließlich über den Cloud-Provider — und hängt davon ab, was dessen AVV im Kleingedruckten tatsächlich zusagt.

Die **AWS European Sovereign Cloud** (`eusc-de-east-1`, seit Januar 2026) ist die weitestgehende Antwort, die ein US-Hyperscaler auf diese Achse anbietet: EU-Personal, EU-Governance, separate Rechtsentität. Ob das ausreicht, ist juristisch umstritten — solange die Muttergesellschaft US-amerikanisch ist, bleibt die grundsätzliche Exposition bestehen. Claude ist dort ohnehin noch nicht verfügbar.

Die präziseste Formulierung dessen, worum es bei Achse 3 tatsächlich geht:

> **Souveränität entsteht nicht dadurch, dass man einen Anbieter wählt, der verspricht, die Daten zu schützen. Sie entsteht dadurch, dass man eine Architektur einsetzt, in der der Anbieter technisch nicht in der Lage ist, das Versprechen zu brechen — weil er den Zugriff nie hatte.**

Wer Achse 3 kompromisslos braucht, landet bei einem EU-eigenen Anbieter oder eigener Infrastruktur — und verliert dafür Fähigkeit. Das ist der Preis, und er ist real.

**Für regulierte Branchen kommen zwei weitere Rahmenwerke dazu**, die in den meisten KI-Konzepten fehlen:

- **EU Data Act, Kapitel VII** (gilt seit September 2025) verpflichtet Cloud-Anbieter in der EU, unrechtmäßigen Nicht-EU-Behördenzugriff auf **nicht-personenbezogene** Daten zu verhindern. Betriebsgeheimnisse, Quellcode und Architekturinformationen in Prompts fallen hierunter — also genau das, was bei KI-gestützter Softwareentwicklung durch die Leitung geht.
- **NIS2 und DORA** fordern Risikomanagement für die ICT-Lieferkette. Für KRITIS-Betreiber und Finanzdienstleister heißt das konkret: Die Subprozessor-Kette bis zu Anthropic ist prüfungsrelevant, nicht nur der direkte Cloud-Vertrag.

Der Satz, der daraus folgt und den man einem Vorstand ehrlich sagen sollte: **Eine Organisation, die personenbezogene Daten über eine US-kontrollierte Plattform verarbeitet, kann sich in einem strukturellen Dauerverstoß befinden** — nicht wegen eines konkreten Vorfalls, sondern wegen der Architektur.

---

## Der Entscheidungsbaum

Die praktische Frage lautet nicht *„welche Option ist die beste?"*, sondern **„welche Achse ist bei uns bindend?"**. Eine Achse ist bindend, wenn ihre Verletzung das Projekt stoppt — nicht, wenn sie unangenehm ist.

| Bindende Achse | Konkrete Situation | Empfohlener Weg | Preis |
|---|---|---|---|
| **Keine** | Interne Entwicklerwerkzeuge, keine Kundendaten im Prompt | Anthropic direkt, Gateway für Logging und Kostenkontrolle | Keine Residency-Zusage |
| **Governance** | Azure-Haus, moderate Datensensitivität, Betrieb muss mitgehen | Foundry — aber Claude-Residency ehrlich als offen ausweisen | Keine EU-Inferenz für Claude |
| **Residency** | Kundendaten, DSGVO-relevante Prompts, Aufsicht prüft | Bedrock EU oder Vertex EU, Gateway davor | Zweiter Cloud-Stack |
| **Governance + Residency** | Regulierter Azure-Konzern | Foundry für Identity und Billing, Bedrock/Vertex für Claude-Inferenz — Gateway als Brücke | Komplexität, zwei Verträge |
| **Souveränität** | KRITIS-nah, Verteidigung, Cloud Act als Ausschlusskriterium | EU-eigener Anbieter oder selbst gehostetes Open-Source-Modell | Deutlich geringere Fähigkeit, GPU-Betrieb |

Die vierte Zeile ist der Weg, den die meisten regulierten Azure-Häuser gehen werden, sobald sie die Residency-Lücke bemerken. Sie ist unelegant, aber sie ist ehrlich: **Foundry für das, was Foundry kann. Bedrock oder Vertex für das, was Foundry heute nicht kann.** Das Gateway macht die Zweiteilung für die Nutzer unsichtbar.

Und sie hat einen Vorteil, den die reine Bedrock-Lösung nicht hat: Wenn Foundry EU liefert — irgendwann 2026 — ist die Umstellung nach meiner Einschätzung eine Konfigurationsänderung im Gateway, kein Migrationsprojekt.

---

## Der eigentliche Gewinn liegt woanders

Wer nur über Gateway-Architektur redet, verkauft sich unter Wert. Der größere Hebel liegt in einem Nebeneffekt, den die wenigsten Konzepte explizit machen.

**KI funktioniert nur bei klaren, dokumentierten Prozessen.** Ein Agent, der eine Aufgabe automatisieren soll, braucht eine Definition davon, was *fertig* heißt (Post 7). Er braucht deterministische Prüfungen (Post 5). Er braucht dokumentierte Domänenregeln (Post 2) und klare Verantwortungsgrenzen (Post 9).

All das ist Prozessarbeit, nicht KI-Arbeit. Und in den meisten Häusern existiert sie nicht in der benötigten Präzision. Der Freigabeprozess ist bekannt, aber nirgends so beschrieben, dass eine Maschine ihn prüfen könnte. Die Coding-Standards existieren als PDF von 2019. Die Definition von *fertig* lebt im Kopf des Teamleiters.

**Der Satz, der das für ein Management-Publikum auf den Punkt bringt: Wer Chaos automatisiert, bekommt automatisiertes Chaos.**

Die praktische Konsequenz ist unerwartet positiv. Eine ernsthafte KI-Einführung ist ein **getarntes Prozess-Sanierungsprogramm**. Die Arbeit, die man leisten muss, um Agenten produktiv zu machen — Prozesse dokumentieren, Qualitätskriterien explizit machen, Verantwortungsgrenzen ziehen — zahlt sich auch dann aus, wenn die KI danach abgeschaltet wird. Optimierte Prozesse senken Kosten unabhängig von der eingesetzten Technologie.

Das ist das stärkste Argument, das ein CIO in einer Vorstandsvorlage haben kann: **Selbst im schlechtesten Fall bleibt der Prozessgewinn.**

---

## Die Zahl, die in jeden Businessplan gehört

Steve Yegge hat in seiner Beschreibung eigener agentischer Systeme eine Zahl genannt, die in kaum einem Enterprise-Konzept auftaucht und in jedes gehört:

> **Die Arbeit am Harness selbst beansprucht etwa 20–25% der gesamten Projektarbeit** — und dieser Anteil bleibt über die Lebensdauer agentischer Systeme ungefähr konstant.

Das ist keine Anekdote, das ist eine Budgetposition. Post 12 hat den strategischen Grund dafür gezeigt: Das Harness ist der Teil, der nicht kommoditisiert, weil er deine Use Cases kodiert. Der operative Preis dafür: es wird nie fertig.

Für die Planung heißt das:

- **Harness-Aufwand ist OpEx, nicht CapEx.** Wer ihn als Projekt budgetiert, das nach der Einführung ausläuft, plant falsch.
- **Modellwechsel sind keine Konfigurationsänderungen.** Yegges eigenes wiederverwendbares Harness zerbrach an einer einzigen Modellgeneration. Das Gateway macht den technischen Wechsel einfach; die Anpassung der Prompts, Skills und Verifikationen bleibt Arbeit.
- **Ein Fünftel bis Viertel der Kapazität** ist die Größenordnung, die man einplanen sollte, bevor der erste Business Case gerechnet wird.

Wer diese Zeile in der TCO-Rechnung hat, wird in zwei Jahren nicht erklären müssen, warum das Team langsamer geworden ist.

---

## Das Risiko, das kein Architekturbild abbildet

Alle bisherigen Abschnitte behandeln Technik und Verträge. Der wahrscheinlichste Programmkiller ist keins von beidem.

Ein Gateway, das Entwickler als Bremse erleben, wird umgangen. Nicht durch Sabotage — durch Pragmatismus. Wenn die genehmigte Lösung dreimal langsamer antwortet oder das gewünschte Modell nicht anbietet, findet jemand einen Weg daran vorbei. Danach hast du Schatten-IT **plus** die Betriebskosten des Gateways.

Eberhard Wolff hat für klassische Architektur-Reviews den Punkt geprägt, der hier verstärkt gilt: **Software ist ein soziotechnisches System.** Eine Architektur, die das Team nie diskutiert hat, wird interpretiert statt befolgt. Sein Vorschlag für Reviews — Interviews mit offenen Fragen statt Metriken-Auswertung — lässt sich auf die Gateway-Einführung übertragen. Drei Fragen, die in der Praxis funktionieren:

- *Wo umgeht ihr aktuell den offiziellen Weg, und warum?*
- *Welches Werkzeug würdet ihr vermissen, wenn wir es abschalten?*
- *Was müsste die zentrale Lösung können, damit ihr sie freiwillig nutzt?*

Die Antworten auf diese drei Fragen sind wertvoller als jedes Anforderungsdokument. Und sie sind der Unterschied zwischen einem Gateway, das Schatten-IT ersetzt, und einem, das sie nur verlagert.

---

## Der Stufenplan

Von der ersten `claude`-CLI auf einem Entwicklerlaptop zum Konzernstandard — in einer Reihenfolge, die funktioniert:

**Stufe 0 — Bestandsaufnahme.** Wer nutzt heute was? Meistens ist die Antwort unangenehm und wichtig. Ohne diese Zahl kannst du weder den Nutzen noch das Risiko beziffern.

**Stufe 1 — Gateway ohne Zwang.** Das Gateway aufsetzen, protokollieren, aber noch nichts blockieren. Ziel: Sichtbarkeit. Welche Modelle, welche Volumina, welche Anwendungsfälle. Nach wenigen Wochen hast du echte Daten statt Schätzungen.

**Stufe 2 — Routing umstellen.** Entwicklerwerkzeuge auf das Gateway umleiten. In Claude Code sind das drei Umgebungsvariablen (Post 10 und der Bonus-Post). Für die Nutzer ändert sich nichts Sichtbares — genau das ist das Ziel.

**Stufe 3 — Direktverbindungen schließen.** Erst jetzt. Wer diesen Schritt vor Stufe 2 macht, produziert Frust und Umgehung.

**Stufe 4 — Guardrails schärfen.** Input-Filter, Output-Filter, Permission-Boundaries, Audit-Trail (Post 10). Jetzt hast du die Daten, um sie sinnvoll zu konfigurieren.

**Stufe 5 — Harness-Programm starten.** Erst wenn die Infrastruktur steht, lohnt sich die Investition in projektspezifische Skills, Rules, Hooks und Verifier. Mit der 20–25%-Kapazität im Plan.

Die häufigste Reihenfolge in der Praxis ist genau umgekehrt: erst blockieren, dann Gateway, dann feststellen, dass niemand mitmacht.

---

## Failure Modes

**Compliance-Versprechen ohne Architektur-Deckung.** *„Wir sind DSGVO-konform, weil wir ein Gateway haben."* Ein Gateway ist keine Residency-Zusage. Wenn die Inferenz außerhalb der EU läuft, ändert das Gateway daran nichts — es dokumentiert es nur besser.

**Foundry-Residency-Annahme.** Der spezifische Fall, der aktuell viele Häuser trifft: Azure-Region gewählt, EU-Compliance angenommen, und für Claude gilt sie nicht. Wer diesen Punkt in einem Audit-Bericht stehen hat, ohne ihn geprüft zu haben, hat ein Problem.

**EU-Region mit EU-Jurisdiktion verwechseln.** Der teuerste Denkfehler. Ein EU-Endpunkt bei einem US-kontrollierten Anbieter erfüllt die Residency-Anforderung, nicht die Souveränitäts-Anforderung. Wer beides in einem Satz zusagt, sagt eine Hälfte falsch zu.

**Die Subprozessor-Kette nicht prüfen.** Unter NIS2 und DORA ist die ICT-Lieferkette prüfungsrelevant. Der Cloud-Vertrag allein reicht nicht — die Zusagen des Unterauftragsverarbeiters gehören ins Verzeichnis.

**Harness-Aufwand nicht eingeplant.** Siehe oben. Der Klassiker.

**Gateway ohne Nutzerbeteiligung.** Zentral entworfen, dezentral umgangen.

**Blockieren vor Anbieten.** Schatten-IT verbieten, bevor es eine benutzbare Alternative gibt. Erzeugt Widerstand und lehrt die Organisation, dass die IT das Problem nicht versteht.

**Scope-Verwechslung beim AI Act.** Ein Coding-Assistent ist typischerweise **limited-risk** mit Artikel-50-Transparenzpflichten. Ein System, das Entwicklerproduktivität bewertet oder Personalentscheidungen beeinflusst, kippt in **high-risk (Annex III)** mit erheblich weiterreichenden Pflichten. Wer beides in einem Konzept vermischt, bekommt entweder überzogene Auflagen für das Erste oder zu schwache für das Zweite.

---

## Die Faustregel

> *Ein Gateway kauft dir Sichtbarkeit, nicht Sicherheit. Residency kauft dir Rechtssicherheit, nicht Governance. Souveränität kauft dir Kontrolle, nicht Fähigkeit. Wer alle drei gleichzeitig verspricht, hat eine der drei nicht verstanden.*

Der Reiz eines Enterprise-KI-Konzepts liegt darin, dass es alles zu lösen scheint: Schatten-IT beenden, Compliance herstellen, Kosten kontrollieren, Anbieter-Abhängigkeit vermeiden. Ein gutes Gateway leistet davon tatsächlich einiges — aber nicht alles, und nicht gleichzeitig.

Die Entscheidung, welche Achse bei dir bindend ist, kann dir kein Anbieter abnehmen. Sie hängt davon ab, welche Daten durch die Prompts fließen, welche Aufsicht dich prüft, und was dein Betrieb tragen kann. Wer diese drei Fragen ehrlich beantwortet, hat eine Architektur. Wer sie überspringt, hat eine Folie.

---

## Was kommt als nächstes

Damit ist die Serie geschlossen — zum zweiten Mal. Post 10 hat sie technisch abgeschlossen, Post 12 hat die ökonomische Begründung nachgeliefert, dieser Post die organisatorische. Wenn ein dritter Nachtrag kommt, liegt das daran, dass sich das Feld schneller bewegt als die Serie.

Was bleibt, ist eine Frage, die in jedem der zwölf vorangegangenen Posts anders formuliert wurde und immer dieselbe war: **Was davon gehört dir am Ende — und was gehört dem Anbieter?**

---

## Weiterführende Quellen

- **Anthropic Regional Compliance** — [claude.com/regional-compliance](https://claude.com/regional-compliance) — die kanonische Quelle für die Frage, welcher Deployment-Weg welche Residency-Zusage trägt. Prüfe vor jeder Architekturentscheidung neu; die Seite ändert sich.
- **Anthropic — Claude on Bedrock / Claude on Vertex AI** — die Deployment-Dokumentationen mit den EU-Regionslisten und Konfigurationsvariablen. Beachte: Anthropics Residency-Zusagen sind ausdrücklich auf diese beiden Wege gescoped.
- **InfoQ** — *„Claude Reaches GA on Microsoft Foundry: European Enterprises Cannot Deploy It"* (Juli 2026). Die klarste öffentliche Darstellung der Foundry-Residency-Lücke, inklusive Stimmen aus Banking und Healthcare.
- **US CLOUD Act (2018)** — für die Souveränitätsfrage die zentrale Rechtsgrundlage. Kriterium ist Kontrolle über die Daten, nicht deren Speicherort. Kollidiert mit **DSGVO Artikel 48**, der die Herausgabe an Nicht-EU-Behörden auf Basis ausländischer Anordnungen untersagt.
- **EU Data Act, Kapitel VII** (seit September 2025) — verpflichtet Cloud-Anbieter in der EU zum Schutz **nicht-personenbezogener** Daten vor unrechtmäßigem Drittstaatenzugriff. Für Quellcode und Betriebsgeheimnisse in Prompts der relevante Rahmen.
- **NIS2 und DORA** — Risikomanagement für die ICT-Lieferkette. Macht die Subprozessor-Kette bis zum Modellanbieter prüfungsrelevant.
- **Steve Yegge** — *„The Shape of Things to Come"*, [yegge.ai](https://yegge.ai/essays/the-shape-of-things-to-come/). Die 20–25%-Beobachtung zur Harness-Kapazität.
- **Eberhard Wolff (INNOQ)** — *„Soziotechnische Architektur-Reviews"*. Für die Adoptionsfrage: warum Interviews mit offenen Fragen mehr liefern als Anforderungsdokumente.
- **EU AI Act** — für die Risikoklassifizierung. Coding-Assistenten typischerweise limited-risk (Artikel 50), mit Eskalationspfaden in high-risk (Annex III) bei Produktivitätsbewertung, Personaltriage oder Einsatz als Sicherheitskomponente. Der Zeitplan der Pflichten ist selbst in Bewegung. Für konkrete Deployments: spezialisierten Anwalt konsultieren.
- **„Claude über Azure AI Foundry mit LiteLLM und Terraform bereitstellen"** (dieser Blog, Juli 2026) — der praktische Deployment-Weg für Achse 1, mit einem frühen Hinweis auf die EU-Verfügbarkeitslücke bei GA, die der Residency-Lücke in diesem Post vorausgeht.
- **Post 10 dieser Serie** — für die technische Guardrail-Ebene unterhalb dieser Architekturentscheidungen.
- **Post 12 dieser Serie** — für die strategische Begründung, warum das Harness die haltbare Investition ist.
