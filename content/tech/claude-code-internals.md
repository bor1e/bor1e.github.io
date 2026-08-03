---
title: "Wie Claude Code eigentlich funktioniert: Ein Java-Unit-Test von Prompt zu JSON und zurück"
date: 2026-08-03
draft: false
description: "Zehn Posts haben das Harness um Claude Code gebaut. Dieser Bonus-Post zeigt, was in der Kiste steckt: was Claude Code beim Start tut, welches Protokoll er spricht, wie das Modell aus dem Kontext seine Entscheidungen ableitet, wo die Historie landet — und wie ein konkreter Java-Unit-Test von der ersten Prompt bis zum grünen Test durchläuft."
tags: ["claude-code", "internals", "protocol", "anthropic-api", "streaming", "tools", "java", "junit"]
categories: ["tech"]
personas: ["tech"]
series: ["Vom Hype zum Harness"]
series_order: 11
---

> *„Was du nicht debuggen kannst, bringst du nicht in Produktion. Und du kannst nichts debuggen, dessen Innenleben du nicht kennst."*
> — Faustregel jedes Ops-Reviews

---

## Warum das wichtig ist

Diese Serie hat zehn Posts lang das Harness um Claude Code beschrieben. Was fehlt: das Wissen darüber, **was Claude Code eigentlich tut, wenn du `claude` in einem Terminal tippst und ihm eine Aufgabe gibst**.

Für die meisten Aufgaben brauchst du das nicht. Aber für drei Szenarien schon: **Debugging** von Hook- und Skill-Konfigurationen, die gelegentliche **Umleitung** auf ein anderes Modell-Backend, und die **Compliance-Frage** *"wo landet eigentlich unser Code, wenn wir Claude Code produktiv nutzen?"*. Alle drei verlangen dieselbe Grundlage — Verstehen, was Claude Code im Anthropic-Protokoll sendet, wie das Modell aus diesem Kontext ableitet, was es tut, wo Daten liegen, und was serverseitig überhaupt persistiert.

Dieser Post arbeitet das an einem konkreten Beispiel durch: einem Java-Unit-Test, den Claude Code für die Methode `AddressCheck.validate()` schreibt. Vier Runden, jede mit einem JSON-Snippet, jede zeigt einen anderen Teil der Mechanik. Zwischen Runde 1 und Runde 2 ein Zwischenspiel, das die eigentliche Modell-Entscheidung sichtbar macht. Danach ein Abschnitt zur Speicherung — lokal und serverseitig. Am Ende weißt du, wie das System-Prompt aussieht, wie Tools aufgerufen werden, warum der `Edit`-Aufruf exakte String-Matches braucht, wie das Modell aus dem Kontext ableitet welches Tool es nutzt, und wo genau der Code landet.

---

## Was `claude` beim Start tatsächlich tut

Wenn du `claude` in einem Projektverzeichnis tippst, passieren fünf Dinge in Reihe:

**1. Prozess-Start.** Claude Code ist eine Node.js-basierte CLI, die intern den Claude Agent SDK verwendet.

**2. Config-Resolution.** Claude Code liest drei Konfigurationsquellen in absteigender Priorität: Command-Line-Flags, `.claude/settings.json` (Projekt), `~/.claude/settings.json` (global), Umgebungsvariablen. Der `env`-Block in `settings.json` überschreibt Shell-Exports — das verhindert, dass ein vergessener Export deine Team-Konfiguration überschreibt.

**3. Credential-Detection.** Anthropic-OAuth-Login, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` (für Proxies), oder Cloud-Provider-Credentials (`CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`).

**4. Initial-Handshake.** Ein minimaler Test-Request an den konfigurierten Endpunkt.

**5. Projekt-Ingest.** `CLAUDE.md`-Dateien werden gelesen (Projekt-Root, dann alle Elternverzeichnisse, dann `~/.claude/CLAUDE.md`). Skill-Descriptions werden indiziert. Hooks werden registriert.

Nach diesen fünf Schritten ist die Session bereit. Alles danach ist Anthropic Messages API.

---

## Das Anthropic-Protokoll: Was Claude Code sendet

Claude Code spricht das Anthropic Messages API-Protokoll auf `/v1/messages`. Jeder Request hat vier Kern-Elemente:

- **`system`** — die System-Prompt-Ebene. Hier baut Claude Code aus `CLAUDE.md`, aktivierten Skills und Tool-Beschreibungen einen (oft mehrere Tausend Tokens langen) Text zusammen.
- **`messages`** — die Konversationshistorie in chronologischer Reihenfolge. Jede Nachricht hat eine `role` (`user` oder `assistant`) und `content`. Content kann String sein oder ein Array strukturierter Content-Blöcke (Text, `tool_use`, `tool_result`).
- **`tools`** — die Werkzeug-Schemata. Claude Code definiert für jedes Tool (Read, Edit, Write, Bash, Grep, Glob, plus MCP-Server-Tools) ein JSON-Schema. Claude entscheidet dann pro Turn, welche Tools er in welcher Reihenfolge aufruft.
- **Header** — inklusive der Anthropic-Beta-Header, die Feature-Flags aktivieren (Prompt Caching, Advanced Tool Use, etc.).

Genug Theorie. Wie das konkret aussieht, zeigt der Java-Beispieldurchlauf.

---

## Ein Java-Unit-Test von Anfang bis Ende

**Ausgangslage:** Ein bestehendes Projekt hat eine Klasse `AddressCheck` mit einer Methode `validate(Address address)`, die eine `ValidationResult` zurückgibt. Es existiert bereits ein `AddressCheckTest.java` mit ein paar Tests, aber der Fall *"Postleitzahl ist leer"* fehlt.

**Prompt:** `Schreib einen Unit-Test für AddressCheck.validate(), der den Fall abdeckt, wenn die Postleitzahl leer ist.`

Was jetzt passiert, in vier Runden — mit einer Zwischenerklärung nach Runde 1, die zeigt, *wie* das Modell aus dem Kontext ableitet, was zu tun ist.

### Runde 1 — Discovery (voller Request und Response)

Claude Code baut den ersten Request:

```json
{
  "model": "claude-sonnet-4-6-20261005",
  "max_tokens": 8192,
  "stream": true,
  "system": [
    {
      "type": "text",
      "text": "You are Claude Code, Anthropic's official CLI for Claude.\n\nYou are an interactive CLI tool that helps users with software engineering tasks.\n\n# Project: order-service\n\n## Stack\nJava 21, Spring Boot 3, Maven, JUnit 5, AssertJ, Mockito.\n\n## Conventions\n- Test-Dateien liegen unter src/test/java, spiegeln das Package des Ziels.\n- Ein Test pro Verhalten. Keine Mega-Tests mit 15 Assertions.\n- AssertJ statt JUnit-Assertions.\n\n## Hard rules\n- Niemals @Disabled ohne Ticket-Link im Kommentar.\n- Öffentliche APIs haben Precondition-Checks mit expliziten Ausnahmen.\n\n[... Skills-Deskriptionen, Rules-Inhalte, MCP-Server-Beschreibungen ...]"
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "Schreib einen Unit-Test für AddressCheck.validate(), der den Fall abdeckt, wenn die Postleitzahl leer ist."
    }
  ],
  "tools": [
    {
      "name": "Glob",
      "description": "Fast file pattern matching that works with any codebase size.",
      "input_schema": {
        "type": "object",
        "required": ["pattern"],
        "properties": {
          "pattern": {"type": "string", "description": "The glob pattern to match files against"},
          "path": {"type": "string", "description": "The directory to search in. Omit for current working directory."}
        }
      }
    },
    {
      "name": "Read",
      "description": "Read file contents from the filesystem.",
      "input_schema": {
        "type": "object",
        "required": ["file_path"],
        "properties": {
          "file_path": {"type": "string"},
          "limit": {"type": "number"},
          "offset": {"type": "number"}
        }
      }
    },
    {
      "name": "Edit",
      "description": "Modify file contents by exact string replacement.",
      "input_schema": {
        "type": "object",
        "required": ["file_path", "old_string", "new_string"],
        "properties": {
          "file_path": {"type": "string"},
          "old_string": {"type": "string"},
          "new_string": {"type": "string"},
          "replace_all": {"type": "boolean"}
        }
      }
    },
    {
      "name": "Bash",
      "description": "Executes a given bash command and returns its output.",
      "input_schema": {
        "type": "object",
        "required": ["command"],
        "properties": {
          "command": {"type": "string"},
          "timeout": {"type": "number"},
          "run_in_background": {"type": "boolean"}
        }
      }
    }
    // ... weitere Tools: Write, Grep, LSP, WebFetch, WebSearch, TodoWrite, Task
  ]
}
```

Drei Punkte verdienen Aufmerksamkeit:

Der `system`-Block ist mehrschichtig. Was du hier siehst — der Meta-Prompt, gefolgt von dem, was aus `CLAUDE.md` kommt — ist nur die Spitze. In einem realen Projekt mit fünf aktiven Skills und drei Rules ist der System-Prompt oft 3000-5000 Tokens lang. Jeder dieser Tokens wird in jedem Turn neu bezahlt (Post 3, das Recall-Problem).

Die `tools`-Definitionen sind reines JSON-Schema. Anthropic's Tool-Use-Protokoll gibt dem Modell ein Schema, das Modell entscheidet, welches Tool es aufruft und mit welchen Argumenten. Kein Code-Aufruf über das Netzwerk — nur strukturierte Beschreibung, was verfügbar ist.

Nur ein User-Turn. Am Anfang ist die `messages`-Historie kurz. Sie wächst mit jeder Runde.

Claudes akkumulierte Antwort auf Runde 1 (aus dem Stream zusammengesetzt):

```json
{
  "id": "msg_01ABC...",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Ich schaue mir zuerst an, wo AddressCheck liegt und wie die bestehenden Tests strukturiert sind."
    },
    {
      "type": "tool_use",
      "id": "toolu_01XYZ...",
      "name": "Glob",
      "input": {
        "pattern": "**/AddressCheck*.java"
      }
    }
  ],
  "stop_reason": "tool_use"
}
```

Die Antwort enthält zwei Content-Blöcke: einen Text-Block (was Claude im Terminal anzeigt) und einen `tool_use`-Block (den Tool-Aufruf, den Claude Code jetzt ausführt). Der `stop_reason: "tool_use"` signalisiert, dass Claude auf das Tool-Ergebnis wartet, bevor er weitermacht.

Aber diese fertige JSON ist bereits das Ergebnis eines Prozesses. Wie ist sie entstanden?

### Zwischenspiel: Wie entscheidet Claude, welches Tool er aufruft?

Zwischen dem Request in Runde 1 und der Response mit dem `Glob`-Aufruf ist etwas passiert, das dieser Post bisher übersprungen hat: das Modell hat entschieden. Aus `system` + `messages` + `tools` hat es abgeleitet, dass jetzt nicht direkt Code geschrieben werden soll, sondern erst Discovery — und dass `Glob` das richtige Werkzeug dafür ist. Wie funktioniert diese Entscheidung?

Das Modell arbeitet autoregressiv: Token für Token, jeder Token abhängig von allem, was davor kommt. Der Kontext (System-Prompt, Konversationshistorie, Tool-Schemata) ist die Bedingung; die Antwort ist die Konsequenz. Es gibt keinen separaten "Tool-Auswahl-Algorithmus" — das Modell lernt während des Trainings, aus einem gegebenen Kontext das nächste Token so zu wählen, dass die entstehende Antwort strukturell und inhaltlich passt. Wenn im Kontext Tool-Definitionen liegen und die Aufgabe Discovery erfordert, ist die statistisch wahrscheinliche Fortsetzung ein Tool-Aufruf.

Konkret sichtbar wird das im Streaming-Output. Claude Code setzt bei jedem Request `stream: true` — der Terminal-Typing-Effekt kommt genau daher. Statt eines fertigen JSON-Blocks bekommt der Client eine Folge von Server-Sent Events. Der Stream für Runde 1 sieht (verkürzt und lesbar formatiert) so aus:

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_01ABC...","role":"assistant",
       "usage":{"input_tokens":4187,"output_tokens":0}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Ich"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" schaue"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" mir zuerst"}}

... (weitere text_delta-Events, jedes mit ein paar Zeichen) ...

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" strukturiert sind."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,
       "content_block":{"type":"tool_use","id":"toolu_01XYZ...","name":"Glob","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\""}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"pattern"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"\": \"**/"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"AddressCheck"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"*.java\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"tool_use","stop_sequence":null},
       "usage":{"output_tokens":47}}

event: message_stop
data: {"type":"message_stop"}
```

Was du hier siehst, ist der eigentliche Entscheidungsmoment:

Zwei Content-Blöcke, zwei Strukturen. Der erste Block hat `type: "text"` — Fließtext. Deltas kommen als `text_delta`. Der zweite Block hat `type: "tool_use"` mit `name: "Glob"` — Tool-Aufruf. Deltas kommen als `input_json_delta` und akkumulieren zum Argument-JSON. Zwischen dem `content_block_stop` des ersten Blocks und dem `content_block_start` des zweiten passiert keine externe Entscheidung. Das Modell hat aus dem Kontext abgeleitet, dass jetzt ein Tool-Aufruf kommt — und welcher.

Die Tool-Auswahl ist Token-Konsequenz. Als das Modell den Token `Glob` (statt `Read` oder `Grep`) generiert hat, hat es nicht eine Liste von Tools durchgeschaut und das beste ausgewählt. Es hat den nächsten Token so gewählt, wie es die Trainings-Verteilung nahegelegt hat — gegeben ein System-Prompt mit Coding-Konventionen, ein User-Prompt zu Datei-Suche, und Tool-Schemata, in denen `Glob` als "file pattern matching" beschrieben ist. Die Auswahl passiert in der Generation, nicht vor ihr.

Die Argumente sind ebenfalls Token-Konsequenz. Das Pattern `**/AddressCheck*.java` ist nicht das Ergebnis einer expliziten Regel-Anwendung — es ist die statistisch plausible Fortsetzung, gegeben dass der User "AddressCheck" genannt hat und dass typische Glob-Patterns für Java-Discovery so aussehen. Die Präzision dieses Patterns ist ein Beleg dafür, wie stark das Modell aus dem Kontext extrahiert.

Der `stop_reason` steht im `message_delta`, nicht im `message_stop`. Das ist Anthropic-Konvention und für Debugging wichtig: wenn du einen Gateway (LiteLLM, Bedrock) durchleitest und `stop_reason` fehlt oder falsch ist, liegt das fast immer daran, dass das Gateway die `message_delta`-Events falsch weiterleitet.

Die praktische Konsequenz. Wenn du das Verhalten von Claude Code ändern willst — welche Tools er aufruft, in welcher Reihenfolge, mit welchen Argumenten — hast du keinen Hebel nach dem Modell. Du hast Hebel vor dem Modell: was in `CLAUDE.md` steht, welche Skills geladen sind, welche Tool-Schemata Claude Code definiert, wie der User-Prompt formuliert ist. Alles, was in Runde 1 an das Modell geht, formt die Verteilung, aus der die nächste Antwort gezogen wird. Das ist Post 1's "Model + Harness"-These auf Token-Ebene: das Harness ist genau die Menge an Kontext-Manipulationen, die das statistische Verhalten des Modells in die gewünschte Richtung schiebt.

Und deshalb funktioniert Prompt Engineering überhaupt.

Zurück zum Durchlauf.

### Runde 2 — Analyse (nur die Änderung gegenüber Runde 1)

Claude Code führt den Glob-Aufruf aus und schickt das Ergebnis als neue Nachricht zurück. Ab hier zeige ich nur, was zur `messages`-Historie hinzukommt:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01XYZ...",
      "content": "src/main/java/com/example/order/AddressCheck.java\nsrc/test/java/com/example/order/AddressCheckTest.java"
    }
  ]
}
```

Wichtige Beobachtung: `tool_result` kommt mit `role: user`. Das ist die Protokoll-Konvention — jede Nachricht, die nicht vom Modell erzeugt wurde, ist eine User-Nachricht, auch wenn sie inhaltlich nur die Ausgabe eines Tools transportiert.

Claudes nächste Antwort — zwei Reads parallel:

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Zwei Dateien gefunden. Ich lese beide gleichzeitig."
    },
    {
      "type": "tool_use",
      "id": "toolu_02...",
      "name": "Read",
      "input": {"file_path": "src/main/java/com/example/order/AddressCheck.java"}
    },
    {
      "type": "tool_use",
      "id": "toolu_03...",
      "name": "Read",
      "input": {"file_path": "src/test/java/com/example/order/AddressCheckTest.java"}
    }
  ],
  "stop_reason": "tool_use"
}
```

Zwei `tool_use`-Blöcke in einer Antwort. Das ist parallele Tool-Ausführung. Claude Code führt beide Reads gleichzeitig aus und liefert beide Ergebnisse in der nächsten `user`-Nachricht — jedes mit seiner eigenen `tool_use_id`. Das ist der Grund, warum Claude Code Datei-Discovery viel schneller ist als naive sequenzielle Ansätze.

Die Tool-Ergebnisse (Auszug):

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_02...",
      "content": "package com.example.order;\n\npublic class AddressCheck {\n\n    public ValidationResult validate(Address address) {\n        if (address == null) {\n            return ValidationResult.fail(\"Adresse fehlt\");\n        }\n        if (address.getPostalCode() == null || address.getPostalCode().isBlank()) {\n            return ValidationResult.fail(\"Postleitzahl fehlt\");\n        }\n        // weitere Prüfungen ...\n        return ValidationResult.ok();\n    }\n}"
    },
    {
      "type": "tool_result",
      "tool_use_id": "toolu_03...",
      "content": "package com.example.order;\n\nimport org.junit.jupiter.api.Test;\nimport static org.assertj.core.api.Assertions.assertThat;\n\nclass AddressCheckTest {\n\n    private final AddressCheck check = new AddressCheck();\n\n    @Test\n    void validate_returnsFailWhenAddressIsNull() {\n        ValidationResult result = check.validate(null);\n        assertThat(result.isValid()).isFalse();\n        assertThat(result.getError()).isEqualTo(\"Adresse fehlt\");\n    }\n\n    // TODO: weitere Testfälle\n}"
    }
  ]
}
```

Jetzt hat Claude alles, was er braucht: den Vertrag der `validate`-Methode und das Muster, in dem bestehende Tests geschrieben sind.

### Runde 3 — Der Edit (nur die Änderung)

Claude entscheidet: einen Test-Block hinzufügen, der dem bestehenden Muster folgt. Der Tool-Aufruf:

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Ich füge einen Test hinzu, der dem bestehenden Muster folgt: leere PLZ → ValidationResult mit passender Fehlermeldung."
    },
    {
      "type": "tool_use",
      "id": "toolu_04...",
      "name": "Edit",
      "input": {
        "file_path": "src/test/java/com/example/order/AddressCheckTest.java",
        "old_string": "    @Test\n    void validate_returnsFailWhenAddressIsNull() {\n        ValidationResult result = check.validate(null);\n        assertThat(result.isValid()).isFalse();\n        assertThat(result.getError()).isEqualTo(\"Adresse fehlt\");\n    }\n\n    // TODO: weitere Testfälle",
        "new_string": "    @Test\n    void validate_returnsFailWhenAddressIsNull() {\n        ValidationResult result = check.validate(null);\n        assertThat(result.isValid()).isFalse();\n        assertThat(result.getError()).isEqualTo(\"Adresse fehlt\");\n    }\n\n    @Test\n    void validate_returnsFailWhenPostalCodeIsBlank() {\n        Address address = new Address();\n        address.setPostalCode(\"\");\n\n        ValidationResult result = check.validate(address);\n\n        assertThat(result.isValid()).isFalse();\n        assertThat(result.getError()).isEqualTo(\"Postleitzahl fehlt\");\n    }"
      }
    }
  ],
  "stop_reason": "tool_use"
}
```

Das ist die wichtigste JSON dieses Posts. Der `Edit`-Aufruf zeigt drei Dinge, die man nur beim Zusehen versteht:

- `old_string` muss exakt matchen. Wenn auch nur ein Zeichen (Whitespace, Zeilenumbruch, Kommentar) anders ist als in der Datei, schlägt der Edit fehl. Das ist der Grund, warum Claude in Runde 2 die Datei komplett gelesen hat — er braucht die exakte Vorlage.
- `new_string` ersetzt `old_string` an genau einer Stelle. Wenn der Match mehrfach im File vorkommt, schlägt der Edit fehl. Für den Fall gibt es `replace_all: true`.
- Der Kontext um den Change ist mit im `old_string`. Claude hat nicht nur die `TODO`-Zeile ersetzt, sondern den vorhergehenden Test-Block mit-eingebaut. Das ist Absicht: mehr Kontext im `old_string` macht den Match eindeutiger.

Das Tool-Ergebnis bestätigt den Edit:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_04...",
      "content": "The file /home/dev/order-service/src/test/java/com/example/order/AddressCheckTest.java has been updated. Here's the result of running `cat -n` on a snippet of the edited file:\n   9\t    @Test\n  10\t    void validate_returnsFailWhenAddressIsNull() {\n  ...\n  22\t    void validate_returnsFailWhenPostalCodeIsBlank() {\n  23\t        Address address = new Address();\n  ...",
      "is_error": false
    }
  ]
}
```

### Runde 4 — Verifikation (nur die Änderung)

Claude will jetzt sicherstellen, dass der neue Test tatsächlich läuft und grün ist:

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Test hinzugefügt. Ich lasse jetzt die Test-Suite laufen, um zu verifizieren."
    },
    {
      "type": "tool_use",
      "id": "toolu_05...",
      "name": "Bash",
      "input": {
        "command": "mvn test -Dtest=AddressCheckTest",
        "timeout": 120000
      }
    }
  ],
  "stop_reason": "tool_use"
}
```

Zwei Punkte:

- Bash bekommt einen expliziten Timeout (120 Sekunden). Die Default-Grenze für Bash-Calls ist zwei Minuten; für lange Test-Suites kann bis zu 600.000 ms (10 Minuten) konfiguriert werden.
- Der Command ist scharf umrissen (`-Dtest=AddressCheckTest`), damit nicht die ganze Test-Suite läuft. Diese Präzision spart Zeit und Kontext-Tokens.

Das Ergebnis:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_05...",
      "content": "[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS",
      "is_error": false
    }
  ]
}
```

Claude schließt die Session ab:

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Fertig. `AddressCheckTest.validate_returnsFailWhenPostalCodeIsBlank` läuft grün. Der neue Test folgt dem bestehenden Muster (AssertJ, prüft `isValid` und `getError`) und deckt den Fall ab, dass die Postleitzahl ein Leerstring ist (nicht `null` — das würde durch die bestehende null-Prüfung schon abgefangen)."
    }
  ],
  "stop_reason": "end_turn"
}
```

`stop_reason: "end_turn"` — die Session ist abgeschlossen. Kein weiterer Tool-Aufruf, keine offenen Fragen. Vier Runden, zehn Content-Blöcke, ein grüner Test.

### Was der Durchlauf lehrt

Drei Beobachtungen aus dem JSON, die man ohne den Durchlauf nicht bekommt:

1. **Der `Edit`-Tool zwingt zu vorherigem `Read`.** Claude Code hat einen internen "Read-before-Edit-Check" (dokumentiert in der Tool-Reference) — wenn eine Datei nicht in der aktuellen Session gelesen wurde, wird der Edit abgelehnt. Der Grund ist strukturell: ohne die exakte Datei-Version im Kontext kann das Modell keinen korrekten `old_string` konstruieren. In der Praxis bedeutet das: jeder Edit hat einen Read als Vorbedingung, entweder explizit in derselben Session oder implizit durch ein früheres Read.
2. **Parallelität ist ein First-Class-Feature.** Runde 2 hat zwei `Read`s parallel ausgeführt. Das ist kein Trick, sondern normale Protokoll-Nutzung: Claude kann mehrere `tool_use`-Blöcke in einer einzigen Antwort emittieren, und Claude Code führt sie parallel aus. Wer das im Kopf hat, versteht, warum große Projekte mit dutzenden Dateien nicht mit einer langen sequenziellen Kette abgeklappert werden, sondern mit wenigen parallelen Runden.
3. **Der `Bash`-Tool ist der letzte Ausweg, nicht der erste.** Das Tool-Prompt selbst enthält explizite Warnungen: "Avoid using Bash with `find`, `grep`, `cat`, `head`, `tail`, `sed`, `awk`, or `echo` commands. Instead, use the dedicated tool." Warum? Weil die dedizierten Tools (Glob, Grep, Read, Edit) strukturierte Outputs liefern, die das Modell zuverlässig parsen kann. Bash liefert unstrukturierten Text, der bei jeder Terminal-Farbcodierung, jeder unerwarteten Zeile die Interpretation erschwert.

---

## Wo die Historie gespeichert wird — lokal und serverseitig

Die naheliegende Anschluss-Frage nach dem Durchlauf: wo landet dieses JSON eigentlich? Die Antwort hat zwei Ebenen — lokal auf deiner Maschine und serverseitig bei Anthropic (oder deinem Cloud-Provider). Beide sind für Compliance-Reviews relevant.

### Lokal: `~/.claude/projects/` als JSONL

Claude Code schreibt jede Session vollständig auf deine Festplatte. Der Pfad:

```
~/.claude/projects/<encoded-project-path>/<session-uuid>.jsonl
```

Der `encoded-project-path` ist der absolute Pfad deines Projekts mit Slashes durch Dashes ersetzt. Ein Projekt in `/Users/dev/order-service` landet also unter:

```
~/.claude/projects/-Users-dev-order-service/bf8ecb66-fc60-4187-9c92-cded3ea68f58.jsonl
```

Jede Session ist eine JSONL-Datei — ein JSON-Objekt pro Zeile, jede Zeile ein Event: User-Message, Assistant-Response, Tool-Call, Tool-Result. Die Datei-Rechte sind typisch `-rw-------` (nur der Owner liest). Das ist derselbe Content, den du in den vier Runden oben gesehen hast — nur linearisiert. `/resume` und `--continue` lesen exakt diese Files und rekonstruieren die Session.

Weitere lokale Verzeichnisse:

- `~/.claude/todos/{session-id}-*.json` — die vom TodoWrite-Tool erzeugten Task-Listen
- `~/.claude/debug/` — Diagnose-Logs
- `~/.claude/projects/<project>/memory/` — Auto Memory (seit v2.1.59, Post 3)

Praktische Konsequenz für Enterprise-Setups: die vollständige Konversationshistorie inklusive aller Prompt-Inhalte und Tool-Outputs liegt unverschlüsselt auf jeder Entwickler-Maschine. Wer Full-Disk-Encryption nicht ohnehin schon Pflicht macht, sollte spätestens jetzt darüber nachdenken. Für Auditor-Fragen ist das der erste Ort, an dem du nachweisen musst, wie du damit umgehst.

### Serverseitig: was Anthropic (oder Bedrock/Vertex) sieht

Jeder API-Request geht durch die Anthropic-Infrastruktur (oder AWS Bedrock / Google Vertex AI, wenn du entsprechend konfiguriert bist). Was danach damit passiert, hängt vom Setup ab:

- **Anthropic Commercial API** (Team, Enterprise, direkt): Content wird standardmäßig nicht für Training genutzt. Anthropic hat im September 2025 die Standard-Retention der Backend-Logs von 30 auf 7 Tage reduziert; die aktuelle Platform-Dokumentation formuliert es als "not retained by default; exception: 30 days for Covered Models". Für dich als Nutzer: der Prompt und die Antwort sind nach kurzer Zeit weg.
- **Bedrock / Vertex:** Retention-Daten bleiben in deinem AWS- oder GCP-Konto, nicht bei Anthropic. Das ist der Grund, warum Post 10 für DSGVO-relevante Deployments den Cloud-Provider-Weg empfohlen hat.
- **Zero Data Retention (ZDR):** Für qualifizierende Enterprise-Kunden verfügbar. Content wird nach der API-Antwort gar nicht mehr gespeichert — Anthropic hält nichts, außer die vertraglich vorgeschriebenen Betriebs-Metadaten.
- **Consumer-Tarife (Free, Pro, Max):** nicht das, worum es hier geht. Für Enterprise-Setups darf Claude Code nie über einen persönlichen Pro-Account laufen — die Retention-Regeln sind strenger für Team/Enterprise, und die Compliance-Grundlage steht und fällt mit dem Vertrag.
- **Policy-Violation-Ausnahme:** Wird ein Request von den Trust-and-Safety-Systemen als Verstoß geflaggt, kann Content bis zu 2 Jahre gespeichert werden, die Klassifikations-Scores bis zu 7 Jahre. Das ist die einzige Standard-Ausnahme von den kurzen Retention-Fenstern.

Der Kurzschluss für einen Compliance-Officer: Die Konversation liegt vollständig lokal beim Entwickler. Serverseitig liegt sie kurz oder gar nicht — je nach Setup. Wer diesen Satz in den Audit-Bericht schreiben kann, hat die Grundlage. Wer ihn nicht schreiben kann, hat noch Arbeit vor sich.

---

## Ein kurzer Seitenblick: Modell-Umleitung

Übrigens — weil das erfahrungsgemäß die nächste Frage ist: du kannst Claude Code an ein beliebiges Anthropic-Messages-API-kompatibles Backend umleiten, indem du `ANTHROPIC_BASE_URL` in `~/.claude/settings.json` setzt:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-gateway.internal",
    "ANTHROPIC_AUTH_TOKEN": "sk-your-gateway-key",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
  }
}
```

Dahinter kann Anthropic direkt liegen (regionaler Proxy), Bedrock oder Vertex mit anderer Modell-Route, oder ein LiteLLM-Proxy, der intern zu einem selbst-gehosteten Qwen 3 oder Llama übersetzt. Für die 90% der Enterprise-Fälle, in denen Bedrock/Vertex EU die richtige Antwort ist (Post 10), reicht diese Konfiguration nicht — dort brauchst du die dedizierten `CLAUDE_CODE_USE_BEDROCK`/`CLAUDE_CODE_USE_VERTEX`-Variablen. Aber für die 10%, in denen ein eigener Proxy dazwischen sitzen soll: drei Env-Variablen, das war's.

---

## Die Faustregel

Claude Code spricht Anthropic Messages API. Jedes Tool ist ein JSON-Schema. Jeder Turn wächst die `messages`-Historie um eine Nachricht. Das Modell entscheidet Token für Token, was als nächstes kommt — es gibt keinen separaten Auswahl-Algorithmus. Die vollständige Historie liegt lokal in JSONL. Serverseitig ist sie kurz oder gar nicht.

Der Java-Beispiel-Durchlauf hat nichts Exotisches gezeigt — er hat den Normalbetrieb transparent gemacht. Vier Runden, ein neuer grüner Test. Für den Nutzer ein Ein-Zeilen-Prompt und eine Antwort. Für Claude Code fünf `tool_use`-Blöcke, fünf `tool_result`-Antworten, ein wachsender Kontext. Dazwischen ein Modell, das Token für Token entscheidet, was als nächstes zu tun ist — nicht durch einen expliziten Auswahl-Algorithmus, sondern als statistisch wahrscheinliche Fortsetzung des Kontexts. Das ist die Maschine.

---

## Weiterführende Quellen

- **Claude Code Tools Reference** — [code.claude.com/docs/en/tools-reference](https://code.claude.com/docs/en/tools-reference) — die kanonische Definition aller eingebauten Tools inklusive der Parameter-Schemata und der `Read-before-Edit`-Semantik.
- **Anthropic Messages API Reference** — [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages) — für das Protokoll selbst: Message-Struktur, Content-Block-Typen, `stop_reason`-Semantik.
- **Anthropic Streaming Messages** — [platform.claude.com/docs/en/build-with-claude/streaming](https://platform.claude.com/docs/en/build-with-claude/streaming) — die kanonische Referenz für Server-Sent Events, `content_block_delta`-Typen, und das Verhältnis von `message_delta` zu `stop_reason`.
- **Anthropic Tool Use Guide** — [docs.anthropic.com/en/docs/build-with-claude/tool-use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — für das breitere Tool-Use-Protokoll (nicht Claude-Code-spezifisch), aus dem Claude Code seine Werkzeugebene aufsetzt.
- **Anthropic API and Data Retention** — [platform.claude.com/docs/en/manage-claude/api-and-data-retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention) — die kanonische Referenz für serverseitige Retention, Covered Models und Zero Data Retention.
- **Claude Code Environment Variables** — [code.claude.com/docs/en/settings](https://code.claude.com/docs/en/settings) — die Referenz für `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`, und die Precedence zwischen Shell und `settings.json`.
- **Post 10 dieser Serie** — für die strategische Frage, wann eine Modell-Umleitung sinnvoll ist. Dieser Post beantwortet nur die technische Seite.
