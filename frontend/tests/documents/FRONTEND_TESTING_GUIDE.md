# Frontend E2E Test Guide

This document explains what the frontend end-to-end (E2E) tests are, why they exist, how to run them locally, how to generate HTML reports, and troubleshooting tips.

## What is it?

This repository contains Playwright-based E2E tests for the KU-Connect frontend. The tests simulate user interactions in a browser and verify end-to-end functionality across different roles: students, employers, admins, and professors.

## What is it for?

- Validate critical user journeys (login, role guards, job posting, applications, moderation, analytics).
- Prevent regressions in routing, authentication, and UI flows.
- Provide a reproducible smoke/regression suite that runs in CI and locally.
- Produce HTML reports for stakeholders and QA.

## Where tests live

- `frontend/tests/**/*.spec.ts` — Playwright test specs.
- `frontend/tests/fixtures` — predefined fixtures per role (student.fixture, employer.fixture, admin.fixture, professor.fixture).
- `frontend/playwright.config.ts` — Playwright configuration.
- Common role folders: `student/`, `employer/`, `admin/`, `professor/`.

## Requirements

- Node.js (18+ recommended)
- npm (or yarn)
- Playwright (browsers installed via `npx playwright install`)

## Install (one-time)

```bash
cd frontend
npm ci
# install browsers
npx playwright install --with-deps
```

If you use yarn:

```bash
cd frontend
yarn install
npx playwright install --with-deps
```

## How to run tests locally

Run the full suite:

```bash
cd frontend
npx playwright test
```

Run tests for a role/folder:

```bash
# employer tests
npx playwright test tests/employer

# student tests
npx playwright test tests/student
```

Run a single file:

```bash
npx playwright test tests/student/student-profile.spec.ts
```

Run tests in headed mode (for debugging):

```bash
npx playwright test --headed
```

Run with specific project (chromium/firefox/webkit):

```bash
npx playwright test --project=chromium
```

Run a single test with the Playwright inspector (debug):

```bash
npx playwright test tests/employer/employer-create-job.spec.ts --debug
```

## Grep by tag

Tests include tags in descriptions (e.g. `@smoke`, `@regression`, `@negative`). Use `--grep` to run tagged tests:

```bash
# run smoke tests
npx playwright test --grep @smoke

# run regression tests
npx playwright test --grep @regression
```

## HTML report

Generate and view HTML report locally:

```bash
npx playwright test --reporter=html
npx playwright show-report
```

Default report location: `frontend/playwright-report/`.

In CI, archive `frontend/playwright-report/` as an artifact for review.

## Backend considerations

Some tests rely on mocked API responses from fixtures; others may require a running backend. Options:

- Start backend locally before running tests (backend startup command depends on `backend/package.json`).
- Use fixtures (mocked responses) — many tests in `frontend/tests/fixtures` mock API endpoints and do not need the backend.

## CI example (GitHub Actions)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
	e2e:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup Node
				uses: actions/setup-node@v4
				with:
					node-version: 18
			- name: Install deps
				run: |
					cd frontend
					npm ci
					npx playwright install --with-deps
			- name: Run E2E tests
				run: |
					cd frontend
					npx playwright test --reporter=dot,html
			- name: Upload HTML report
				uses: actions/upload-artifact@v4
				with:
					name: playwright-report
					path: frontend/playwright-report
```

## Troubleshooting

- Missing browsers: run `npx playwright install`.
- Selector failures after UI changes: update selectors in tests or add stable test ids.
- Timeouts: increase `timeout` in `playwright.config.ts` or use `page.waitForLoadState('networkidle')` where appropriate.
- Auth/session issues: check `frontend/tests/fixtures/*` to confirm auth mocking or seeding is current.

## Tips for writing new tests

- Reuse role fixtures (`student.fixture`, `employer.fixture`, etc.).
- Keep tests focused and idempotent.
- Use `page.waitForResponse` for network-asserts and `page.waitForLoadState('networkidle')` after navigation.
- Add scenario IDs in test names for traceability (e.g., `EMP-TS-006-TC01`).

## Quick commands

```bash
# install
cd frontend && npm ci && npx playwright install --with-deps

# run all tests
npx playwright test

# run tests + html report
npx playwright test --reporter=html
npx playwright show-report

# run a single spec
npx playwright test tests/admin/admin-report-management.spec.ts
```
