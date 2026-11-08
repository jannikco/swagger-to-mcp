---
name: pipmcp-swagger-to-mcp
description: Import a reviewed swagger API definition into private PipMCP and connect its tools to AI agents.
---

# Swagger to MCP import starter

Read capabilities.json and README.md. Preview the input upload, obtain explicit approval, then use the authenticated private importer. Importing does not publish tools or connect a provider account.

Use only PIPMCP_API_KEY for PipMCP. Provider credentials belong in the hosted product. Do not request another AI model API key for these instructions. Never print keys or commit result records.

For a no-network setup plan run npm start. After importing, reviewing/publishing tools and configuring a connection, run npm run doctor with an explicit PIPMCP_INTEGRATION_ID. 

Preserve policy/approval receipts and stable idempotency keys. Pending is not completed. Uncertain writes must be reconciled; never retry with a new key to bypass a hold. Existing MCP client approval and hosted policy remain authoritative.
