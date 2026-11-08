# Swagger → MCP

**Turn your API into tools your AI can use.** Give a Swagger 2 API a practical path into MCP without rewriting its endpoint inventory.

**[Import Swagger with PipMCP](https://pipmcp.com/github/start?integration=swagger-to-mcp&utm_source=github&utm_medium=readme&utm_campaign=github-swagger-to-mcp&utm_content=readme)** · [Compile locally](#quick-start) · [Format guide](https://jannikco.github.io/pipmcp-connectors/guides/swagger-to-mcp/)

An established API still ships a Swagger 2 document. Compile that existing contract into local tools and inspect the resulting requests before connecting an AI client.

> **Included:** a local compiler, a runnable stdio MCP server and fixture tests. Start with your own API definition; use PipMCP’s hosted import when you want a managed connection flow.

## Quick start

Requires **Node.js 22 or later** and npm. Compile the bundled, non-customer fixture offline:

```bash
git clone https://github.com/jannikco/swagger-to-mcp.git
cd swagger-to-mcp
npm ci --ignore-scripts
npm test
npm start
```

The command prints an executable connector definition as JSON: its API origin, authentication configuration, named tools, input schemas and request bindings. It does not call a provider or create a hosted integration. The bundled fixture contains `getInvoice`.

## Compile your own Swagger API

**Accepted input:** Swagger 2.0 JSON or YAML. The host/basePath or --base-url must resolve to the intended HTTPS API.

```bash
npm start -- /path/to/your-api.json --base-url https://your-api.example.com --output my-connector.json
node server.mjs --manifest my-connector.json
```

Replace the input path and HTTPS origin with your own API. `--output` creates a new file and refuses to overwrite an existing file; choose a fresh filename for another compilation. The server command uses **stdio** and is intended to be launched by your MCP client. Keep stdout available for JSON-RPC.

Review the generated definition before use. Configure the provider credentials in the environment fields named by its `auth` object. The compiler derives supported authentication from the definition; verify it against the provider’s current authorization requirements. Never put real tokens, client secrets or customer records into the source definition.

## What you get

Named tools for supported Swagger operations, typed parameters and JSON-body mappings.

| Capability | Current released behavior | Evidence |
| --- | --- | --- |
| Swagger parsing and compilation | Produces local MCP connector JSON from supported input | Tested with fixtures |
| Compiled MCP execution | Runs the reviewed definition through the bundled stdio runtime | HTTP-fixture and real stdio contract tests |
| Provider authentication and results | Require your endpoint, credentials and operation-specific validation | No Live provider outcome is claimed here |
| External writes | Disabled until operator and individual call approve | Runtime write-approval checks |
| Hosted import | A separate PipMCP onboarding step | Documented; local compilation does not perform it |

## Write controls and supported boundary

Writes require both `CONNECTOR_ALLOW_WRITES=true` and an individual call containing `_approval: {approved:true,idempotencyKey:"unique-request-id"}`. Use a different key for a new logical request. After an uncertain network outcome, inspect the provider before retrying.

Bundle external references. Form-data, multipart and required custom-header adapters are unsupported. Validate the generated authentication and write classification against the API before execution.

Definitions must be smaller than 5 MB. Unsupported formats, authentication or request-body mappings fail with an error; compiling successfully does not establish account permissions, rate limits or a provider result. Review generated tools before granting them to an AI client.

## Use PipMCP for managed setup

[Import Swagger with PipMCP](https://pipmcp.com/github/start?integration=swagger-to-mcp&utm_source=github&utm_medium=readme&utm_campaign=github-swagger-to-mcp&utm_content=readme) when you want a hosted import and connection flow for credentials and MCP access. Continue to hosted API import, configure your authorized provider credentials and review the resulting tools before execution. A successful local compilation does not create a hosted integration. The local commands above do not upload your definition or credentials. Review the hosted plan, supported import format and provider permissions before connecting.

## Frequently asked questions

**Is this only a hosted import wrapper?**
No. The current release contains the local compiler and a callable MCP runtime. The default example compiles its bundled fixture offline.

**Which credentials do I need?**
The local compiler runs offline. The generated server uses the provider authentication configured in its definition; the commands shown do not enforce a PipMCP API key. Hosted import uses the product’s own account and connection flow.

**Does a green test mean my provider account is connected?**
No. Tests use fixtures. Validate an authorized operation against your own API before relying on its result.

**Can I publish the generated connector?**
Review its functionality, permissions and source redistribution rights first. Remove all credentials and customer examples. Compilation does not automatically publish a repository or a hosted integration.

## Sources

- [Released compiler implementation](./lib/compiler/index.mjs)
- [Compiler entry point](./compile.mjs)
- [Bundled fixtures](./fixtures/)
- [Format-specific usage and limitations](https://jannikco.github.io/pipmcp-connectors/guides/swagger-to-mcp/)

## Related projects

- [Typed LeadAdapter API client](https://github.com/jannikco/linkedin-typescript-sdk) — JavaScript runtime and generated TypeScript request types for the LeadAdapter REST API.
- [LeadAdapter Python API client](https://github.com/jannikco/linkedin-python-sdk) — Standard-library Python client for the LeadAdapter REST API.
- [LinkedIn API quickstart](https://github.com/jannikco/linkedin-api) — Inspect connected profile status and read stored leads through LeadAdapter.
- [LinkedIn people and post search](https://github.com/jannikco/linkedin-search-api) — Build asynchronous people and post search requests with explicit idempotency.

## Support and maintenance

[Report a reproducible issue](https://github.com/jannikco/swagger-to-mcp/issues) with command versions and sanitized output. For sensitive issues, use [PipMCP support](https://pipmcp.com/contact). Never publish tokens, connection URLs containing credentials or customer records.

Maintained by jannikco. MIT applies to this repository’s code; provider services and runtime dependencies have their own terms. Provider names do not imply endorsement. Recorded source revision: `2ae0b1339f6c8b591ca8c5998dfea4328f79ac4112ecd359be2bac3ca204018a`. See [integration.json](./integration.json), [LICENSE](./LICENSE) and [SECURITY.md](./SECURITY.md).
