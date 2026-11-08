# Swagger to MCP import starter

Compile your own swagger definition into directly callable local MCP tools. No PipMCP account is required.

## Quick start

Node.js22+. Clone this repository and run:

```sh
npm ci --ignore-scripts
npm test
npm start
```

The default example compiles a bundled fixture offline. It does not authenticate or call a provider.

## Compile your API

```sh
npm start -- /path/to/your-api.json --base-url https://your-api.example.com --output my-connector.json
node server.mjs --manifest my-connector.json
```

Use the server command in an MCP client with stdio transport. Authentication is derived from the definition; put provider API keys or access tokens in the environment fields named in the generated auth object. Writes require CONNECTOR_ALLOW_WRITES=true and explicit per-call _approval. External schema references must be bundled first; unsupported auth or body formats produce actionable errors. Never place provider secrets in the API definition.

The swagger fixture demonstrates getInvoice. The test suite executes compiled operations through the real MCP runtime with HTTP fixtures and stdio tools/call. Local status: **Tested (fixtures)**; provider authentication and live execution are not claimed.

## Optional managed production

[Use PipMCP](https://pipmcp.com/github/start?integration=swagger-to-mcp&utm_source=github&utm_campaign=github-swagger-to-mcp&utm_content=readme) for hosted import, credentials, policies and team access. The local tool does not send your definitions or secrets to PipMCP. [Directory](https://jannikco.github.io/pipmcp-connectors/guides/swagger-to-mcp/).

MIT. Maintainer:jannikco. See integration.json for source/evidence and LICENSE for code license.
