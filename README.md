# Swagger to MCP import starter

Preview and explicitly submit a swagger API import to the PipMCP managed control plane. Includes a standalone fixture and exact management request.

Maintainer: jannikco · License: MIT · Verification: **mock-only**

## Quick start

Requires Node.js 22 or later.

```sh
npm ci
npm test
npm start
```

The default example runs locally without credentials and makes no external changes. Verification status describes recorded evidence; local configuration tests do not establish that provider authentication or execution works.

## Import execution

The default example produces an offline import request plan. See format-specific instructions below.

## Managed service

[Continue with PipMCP](https://pipmcp.com/register?utm_source=github&utm_campaign=github-swagger-to-mcp). This repository is maintained by the integration team and does not imply endorsement by LinkedIn or other providers.

## Provenance and support

Source revision: 57ce0fbf3c5a257a7eaa4b10844aa7be5fda4f4b447ac933d5aa3f9c0223a0a3. The complete manifest is in integration.json; SHA256SUMS covers the reviewed artifact. Open a repository issue without credentials or personal data. See SECURITY.md for sensitive reports. No telemetry is sent by this code; signup links include explicit campaign parameters.

## API import request builder

The default example parses a bundled format-specific fixture and prints the exact private integration import request without sending it. Inspect lib/README.md and the pinned management API contract. To import into your own PipMCP account, set PIPMCP_API_KEY and pass --execute --confirm-import. This creates a private integration only; it does not publish or execute provider tools. Provider setup, credentials and subsequent execution remain separate steps.
