# GitHub Actions Workflow Setup

## Manual Step Required

Due to GitHub App permissions, the workflow file needs to be added manually.

### Option 1: Add via GitHub UI (Recommended)

1. Go to your repo on GitHub
2. Navigate to `.github/workflows/`
3. Create a new file called `ci.yml`
4. Copy the content from the workflow file below

### Option 2: Push from Local Machine

If you have the repo cloned locally with proper permissions:

```bash
git add .github/workflows/ci.yml
git commit -m "Add GitHub Actions CI workflow"
git push
```

## Workflow File Content

Create `.github/workflows/ci.yml` with this content:

```yaml
name: CI

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Build application
        run: npm run build

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          fail_ci_if_error: false
        env:
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

## What the CI Pipeline Does

- ✅ Runs on all PRs and pushes to main/develop branches
- ✅ Executes ESLint checks
- ✅ Runs Jest test suite with coverage reporting
- ✅ Validates Next.js production build
- ✅ Uploads coverage to Codecov (optional - requires CODECOV_TOKEN secret)
