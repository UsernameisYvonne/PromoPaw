# PromoPaw

PromoPaw is a grocery promotion discovery prototype. The current release is a
static frontend with illustrative catalogue, price-history, forecasting and
trip-planning data. It does not yet use live retailer prices or production
forecast outputs.

## Repository scope

- `dist/` — the deployable static website.
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

## Release approach

The first EC2 release will use Nginx to serve `dist/` over HTTP. Each release
should be committed before deployment so the running version can be traced to a
Git commit. Domain, HTTPS and automated deployments are separate follow-up
stages.

