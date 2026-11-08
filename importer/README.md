# Import an API into PipMCP

Four different input formats produce exact requests for the published PipMCP management API. Node.js 22+, zero dependencies. Run from this directory:

```sh
node run.mjs openapi
node run.mjs swagger
node run.mjs postman
node run.mjs graphql
```

These commands only print a dry-run request, including the source document; no account or API key is needed. Bundled inputs are illustrative fixture APIs using example.com, not working provider connections. OpenAPI describes inventory, Swagger describes invoices, Postman describes support tickets and GraphQL describes a product catalog. Supply your own JSON or SDL document as the second argument. JSON is the supported OpenAPI/Swagger file format in this CLI.

Review the exact source content, then explicitly create a **private** integration:

```sh
export PIPMCP_API_KEY='your-management-key'
node run.mjs openapi ./your-api.json --name 'My API' --execute --confirm-import
node run.mjs graphql ./schema.graphql --endpoint https://your-api.example/graphql --execute --confirm-import
```

Use a management key beginning `pmk_` with `integrations:read` and `integrations:write`; an endpoint execution token is different. Do not commit the key. The runner first checks existing integration names and stops if one already exists. Import is not idempotent: if a response is lost, inspect the dashboard before retrying. No automatic retries occur.

OpenAPI 3 and Swagger 2 both use `source_type: openapi_upload`; PipMCP detects the document format. Postman v2 uses `postman`; GraphQL SDL/introspection uses `graphql`. GraphQL import can be disabled by a workspace feature flag. A supplied GraphQL endpoint becomes the imported server; without one, configure a connection base URL later.

Importing creates and parses an integration. It does **not** publish it, create credentials/connections or an MCP endpoint, or run provider operations. Inspect import status, warnings, generated tools and permissions in PipMCP before connecting real services. Mock tests and public schema inspection verify the request contract; no authenticated live import was performed.

`pipmcp-openapi.json` and `evidence.json` pin the public management contract. Runtime sends credentials only to the fixed HTTPS PipMCP origin and refuses redirects. No telemetry is collected.
