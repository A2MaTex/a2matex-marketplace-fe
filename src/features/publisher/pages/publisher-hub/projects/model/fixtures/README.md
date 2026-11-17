# Project draft contract fixtures

These fixtures freeze the cloud draft shapes agreed with A2MaTeX Studio and the Project Draft API.

- `flat-draft.json`: current schema-version-1 entry workflow.
- `legacy-bundle-draft.json`: legacy multi-workflow bundle accepted by Studio in read-only compatibility mode.
- `unknown-node-draft.json`: valid graph containing a node absent from the catalog.
- `invalid-draft.json`: deliberately unsupported schema used by Phase 4 decoder tests.

They contain synthetic values only. Do not add access tokens, credentials, or production project data.
