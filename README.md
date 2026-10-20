# PromoPaw

PromoPaw is a grocery promotion discovery prototype. The static frontend now
keeps two explicitly separated iterations in one site:

- **Reference Prototype (Iteration 1)** preserves the illustrative catalogue,
  price history, forecasting and trip-planning experience.
- **Data-backed Beta (Iteration 2)** presents the canonical 33-product scope,
  verified product imagery and a dated store-specific collection. Missing data
  stays visible, and this iteration does not claim live retailer prices or
  validated forecast outputs.

Use the version switch in the site header, or open `?mode=data` directly.

## Repository scope

- `dist/` — the deployable static website.
- `dist/data/observed-catalogue.json` — curated frontend export for Iteration 2.
- `tools/export_observed_frontend_data.mjs` — reproducible export from the
  canonical product master and approved collected observations.
- `tools/validate_observed_frontend.mjs` — integrity checks for the exported
  catalogue and product imagery.
- `docs/EC2_DEPLOYMENT.md` — the deployment runbook and release record.
- `.openai/hosting.json` — an earlier Sites configuration retained for history;
  the current deployment target is Amazon EC2.

Generated workbooks, raw snapshots, local caches, credentials and exploratory
image files are deliberately excluded from Git.

## Preview locally

From the repository root:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

Regenerate and validate the Data-backed Beta with:

```bash
node tools/export_observed_frontend_data.mjs
node tools/validate_observed_frontend.mjs
node --check dist/mode-loader.js
node --check dist/observed-app.js
node --check dist/app.js
```

## Release approach

The first EC2 release will use Nginx to serve `dist/` over HTTP. Each release
should be committed before deployment so the running version can be traced to a
Git commit. Domain, HTTPS and automated deployments are separate follow-up
stages.

