---
title: "Claude über Azure AI Foundry mit LiteLLM und Terraform bereitstellen"
date: 2026-07-08
draft: false
description: "Seit Claude-Modelle in Microsoft Foundry allgemein verfügbar sind, lässt sich Anthropics Modellfamilie über bestehende Azure-Verträge nutzen. Dieser Beitrag zeigt den kompletten Weg — von der Terraform-Provisionierung des Foundry-Deployments bis zur LiteLLM-Proxy-Konfiguration."
tags: ["claude", "azure", "azure-ai-foundry", "litellm", "terraform", "mlops", "infrastructure-as-code"]
categories: ["tech"]
personas: ["tech"]
---

Seit Claude-Modelle in Microsoft Foundry (früher Azure AI Studio) allgemein verfügbar sind, lässt sich Anthropics Modellfamilie direkt über bestehende Azure-Verträge, Entra-ID-Authentifizierung und Governance-Prozesse nutzen. Für Teams, die bereits mit LiteLLM als einheitlichem Proxy vor mehreren LLM-Anbietern arbeiten, stellt sich schnell die Frage: Wie bekomme ich Claude auf Azure sauber per Terraform provisioniert und danach über LiteLLM ansprechbar?

Dieser Beitrag zeigt den kompletten Weg – von der Terraform-Konfiguration für das Foundry-Deployment bis zur LiteLLM-Proxy-Konfiguration, mit der Claude wie jedes andere Modell im Fleet erscheint.

## Warum diese Kombination?

- **Azure AI Foundry** übernimmt Hosting, Abrechnung (auf der bestehenden Azure-Rechnung), Kontingente und Compliance-Kontrollen für Claude-Deployments.
- **Terraform** macht das Deployment reproduzierbar und versionierbar, statt es manuell im Foundry-Portal zu konfigurieren.
- **LiteLLM** abstrahiert die eigentliche Modell-Ansteuerung: Anwendungen sprechen weiterhin die gewohnte OpenAI- oder Anthropic-kompatible Schnittstelle, während LiteLLM im Hintergrund zwischen Azure-gehosteten und anderen Modellen routet, Kosten trackt und Rate-Limits durchsetzt.

## Voraussetzungen

- Ein zahlungspflichtiges Azure-Abonnement mit Berechtigung, Claude-Modelle in Microsoft Foundry zu beziehen (Enterprise- bzw. MCA-E-Abrechnung; öffentliche Pay-as-you-go-Kontingente sind für Claude standardmäßig auf 0 gesetzt).
- Contributor- oder Owner-Rolle auf der Ziel-Ressourcengruppe sowie Zugriff auf den Azure Marketplace für Partnermodelle.
- Terraform ≥ 1.5, Azure CLI, sowie die Provider `azurerm` und `azapi`.
- Ein akzeptiertes Marketplace-Angebot für das gewünschte Claude-Modell.

> **Hinweis für europäische Organisationen:** Zum Zeitpunkt der GA (Juli 2026) berichten mehrere europäische Unternehmen, dass sich Claude-Deployments trotz gültiger Abrechnung und korrektem Setup nicht anlegen lassen. Die hier gezeigte Terraform-Konfiguration ist korrekt — die *Verfügbarkeit* für eine EU-Organisation kann in der Praxis aber (noch) blockiert sein. Wer auf einen solchen Fehler stößt, sollte die aktuelle Foundry-Regionsverfügbarkeit prüfen, bevor er lange debuggt.

Das Marketplace-Angebot muss vor dem ersten `terraform apply` einmalig akzeptiert werden:

```bash
az term accept \
  --publisher anthropic \
  --product anthropic-claude-sonnet-4-6-offer \
  --plan <plan-name-aus-dem-katalog>
```

## Terraform: Warum `azapi_resource` statt der nativen `azurerm`-Ressourcen?

Ein wichtiger Punkt vorab: Die nativen Terraform-Ressourcen `azurerm_cognitive_account` und `azurerm_cognitive_deployment` unterstützen aktuell noch nicht die Felder `allowProjectManagement` und `modelProviderData`, die für Anthropic-Deployments zwingend erforderlich sind. Ohne `modelProviderData` (bestehend aus `organizationName`, `countryCode` und einem kleingeschriebenen `industry`-Wert) schlägt das Deployment mit einer `AnthropicOrganizationCreationException` fehl. Bis der `azurerm`-Provider das nachzieht, führt der zuverlässige Weg über den generischen `azapi_resource` – er spricht die Azure-REST-API direkt an und unterstützt damit auch Vorschau-Felder, die in `azurerm` noch fehlen.

### 1. Foundry-Account (AIServices-Konto)

```hcl
terraform {
  required_providers {
    azapi = {
      source  = "Azure/azapi"
      version = "~> 2.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "foundry" {
  name     = "rg-claude-foundry"
  location = "eastus2"
}

resource "azapi_resource" "ai_services" {
  type      = "Microsoft.CognitiveServices/accounts@2025-10-01-preview"
  name      = "aisvc-claude-demo"
  parent_id = azurerm_resource_group.foundry.id
  location  = azurerm_resource_group.foundry.location

  body = {
    kind = "AIServices"
    sku = {
      name = "S0"
    }
    properties = {
      allowProjectManagement = true
      customSubDomainName    = "aisvc-claude-demo"
      publicNetworkAccess    = "Enabled"
    }
  }

  schema_validation_enabled = false
}
```

### 2. Claude-Deployment

```hcl
resource "azapi_resource" "claude_sonnet" {
  type      = "Microsoft.CognitiveServices/accounts/deployments@2025-10-01-preview"
  name      = "claude-sonnet"
  parent_id = azapi_resource.ai_services.id

  body = {
    properties = {
      model = {
        format  = "Anthropic"
        name    = "claude-sonnet-4-6"
        version = "1"
      }
      modelProviderData = {
        organizationName = "Meine Firma GmbH"
        countryCode      = "DE"
        industry         = "consulting"
      }
      versionUpgradeOption = "OnceNewDefaultVersionAvailable"
    }
    sku = {
      name     = "GlobalStandard"
      capacity = 25
    }
  }

  schema_validation_enabled = false
}
```

Wichtige Details, die in der Praxis häufig zu Fehlern führen:

- `industry` muss exakt kleingeschrieben sein, sonst schlägt die Attestierung fehl, obwohl `terraform plan` sauber durchläuft.
- Global-Standard-Deployments für Claude sind aktuell primär in East US 2 und Sweden Central verfügbar; einzelne Modelle (z. B. Opus-Varianten) unterstützen zusätzlich Data-Zone-Standard in den USA.
- Wird ein Foundry-/AIServices-Konto gelöscht, bleibt das reservierte Tokens-pro-Minute-Kontingent bis zu 48 Stunden im "Soft-Delete"-Zustand gebunden. Beim Terraform-Teardown lohnt sich ein anschließendes `az cognitiveservices account purge`, wenn das Kontingent sofort wieder benötigt wird.
- Wer den manuellen `azapi`-Weg vermeiden möchte, kann alternativ das offizielle Claude-on-Foundry-Starterkit nutzen, das per `azd up` sowohl eine Bicep- als auch eine Terraform-Variante bereitstellt und zusätzlich Preflight-Checks für Marketplace- und Kontingent-Probleme mitbringt.

Nach `terraform apply` liefert die Ausgabe die für LiteLLM relevante Endpoint-URL:

```hcl
output "foundry_anthropic_endpoint" {
  value = "https://${azapi_resource.ai_services.name}.services.ai.azure.com/anthropic"
}
```

## LiteLLM: Claude über Azure Foundry ansprechen

LiteLLM behandelt über Foundry gehostete Claude-Modelle als eigenen Provider (`azure_ai/`), technisch aber mit identischen Request-/Response-Transformationen wie beim direkten Anthropic-Zugang – der einzige Unterschied liegt in der Authentifizierung.

### Authentifizierung per API-Key

```python
import os
from litellm import completion

os.environ["AZURE_API_KEY"] = "<azure-api-key>"
os.environ["AZURE_API_BASE"] = "https://aisvc-claude-demo.services.ai.azure.com/anthropic"

response = completion(
    model="azure_ai/claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Erkläre Terraform-State in zwei Sätzen."}],
    max_tokens=500,
)
```

### Authentifizierung per Entra ID (empfohlen für Produktion)

Statt eines statischen API-Keys lässt sich auch ein Entra-ID-Token verwenden – konsistent mit dem restlichen Azure-Sicherheitsmodell:

```python
os.environ["AZURE_TENANT_ID"] = "<tenant-id>"
os.environ["AZURE_CLIENT_ID"] = "<client-id>"
os.environ["AZURE_CLIENT_SECRET"] = "<client-secret>"
os.environ["AZURE_SCOPE"] = "https://cognitiveservices.azure.com/.default"
os.environ["AZURE_API_BASE"] = "https://aisvc-claude-demo.services.ai.azure.com/anthropic"
```

### LiteLLM-Proxy-Konfiguration

Für den produktiven Einsatz läuft LiteLLM meist als eigener Proxy-Dienst, vor dem mehrere Modelle registriert sind. Eine minimale `config.yaml`:

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: azure_ai/claude-sonnet-4-6
      api_base: https://aisvc-claude-demo.services.ai.azure.com/anthropic
      api_key: os.environ/AZURE_API_KEY

  - model_name: claude-haiku
    litellm_params:
      model: azure_ai/claude-haiku-4-5
      api_base: https://aisvc-claude-demo.services.ai.azure.com/anthropic
      api_key: os.environ/AZURE_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

Start des Proxys:

```bash
litellm --config config.yaml --port 4000
```

Anschließend lässt sich Claude über die Anthropic-kompatible Route des Proxys ansprechen, unabhängig davon, welche Clients dahinter angebunden sind:

```bash
curl --request POST \
  --url http://0.0.0.0:4000/anthropic/v1/messages \
  --header 'content-type: application/json' \
  --header 'Authorization: bearer sk-anything' \
  --data '{
    "model": "claude-sonnet",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hallo Welt"}]
  }'
```

Da LiteLLM alle Request-/Response-Transformationen für Azure-gehostetes Claude identisch zum direkten Anthropic-Provider behandelt, funktionieren Tool-Calling, Streaming, Extended Thinking und die üblichen Parameter (`temperature`, `top_p`, `tools`, `tool_choice` usw.) unverändert.

## Typische Stolpersteine

- **`AnthropicOrganizationCreationException`**: fehlendes oder fehlerhaftes `modelProviderData` – alle drei Felder (`organizationName`, `countryCode`, `industry`) müssen gesetzt sein, `industry` kleingeschrieben.
- **Opake 400er-Fehler beim Deployment**, obwohl Ressourcengruppe, Foundry-Account und Projekt erfolgreich angelegt wurden: meist unzureichendes Kontingent, oft verursacht durch noch nicht bereinigte Soft-Delete-Reste vorheriger Testläufe.
- **Marketplace-Kauf schlägt fehl**: Das Abonnement hat keine Berechtigung für das Anthropic-Angebot. Entweder ein Abonnement mit passender Berechtigung verwenden oder die Vereinbarung vorab explizit per `az term accept` bestätigen.
- **LiteLLM meldet fehlende API-Base**: Die URL muss exakt auf `https://<resource-name>.services.ai.azure.com/anthropic` enden – LiteLLM ergänzt `/v1/messages` automatisch, wenn es fehlt.
- **`azure_ai/`-Registrierung für Anthropic verhält sich nicht wie dokumentiert**: Der native `azure_ai/`-Pfad für Claude-Modelle ist noch jung, und einzelne LiteLLM-Versionen weichen vom dokumentierten Verhalten ab (siehe LiteLLM-Issue #17765). Wenn Requests trotz korrekter `api_base` fehlschlagen, hilft es, auf eine bekannt funktionierende LiteLLM-Version zu pinnen, statt der jeweils neuesten zu vertrauen.

## Fazit

Die Kombination aus Terraform, Azure AI Foundry und LiteLLM ergibt einen reproduzierbaren, versionierten Weg, Claude-Modelle innerhalb bestehender Azure-Governance zu betreiben und gleichzeitig die Flexibilität eines modellagnostischen Proxys zu behalten. Der einzige echte Reibungspunkt liegt aktuell im Terraform-Ökosystem selbst: Solange `azurerm` die für Anthropic nötigen Felder nicht nativ unterstützt, führt kein Weg an `azapi_resource` vorbei. Wer den Umweg scheut, kann für den Einstieg auch auf das offizielle Bicep/Terraform-Starterkit von Microsoft zurückgreifen und die hier gezeigte Konfiguration später als Grundlage für eine individuell angepasste Terraform-Struktur nutzen.
