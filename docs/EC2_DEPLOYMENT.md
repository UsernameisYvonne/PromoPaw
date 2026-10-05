# PromoPaw EC2 deployment runbook

This document records the minimal, reproducible deployment of the static
PromoPaw prototype. Never place AWS credentials, private keys or secrets in
this repository.

## Release record

- Status: not deployed yet
- AWS region: to be recorded
- EC2 instance ID: to be recorded
- Public address: to be recorded
- Git commit: to be recorded
- Deployed at: to be recorded in Australia/Melbourne time

## Target architecture

Browser → EC2 public IPv4 → Security Group port 80 → Nginx → `dist/`

## Initial server setup

Commands will be confirmed against the selected EC2 operating system before
they are run. The expected sequence is:

1. Launch a small EC2 instance.
2. Allow SSH only as needed and allow HTTP on port 80.
3. Connect to the instance without sharing the private key.
4. Install and start Nginx.
5. copy the committed `dist/` release into the Nginx web root.
6. Verify the public URL with an unauthenticated HTTP request and in a browser.

## Release checklist

- [ ] Repository is clean and the release commit is identified.
- [ ] No credentials or private keys are tracked.
- [ ] Nginx is active.
- [ ] Port 80 is open to the intended audience.
- [ ] The home page returns HTTP 200 without authentication.
- [ ] Core desktop and mobile interactions work in an independent browser.
- [ ] The release record above is updated.

