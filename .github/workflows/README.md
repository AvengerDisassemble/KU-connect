# Security CI/CD Workflows

This directory contains GitHub Actions workflows for automated security scanning.

## Workflows

### 1. Secrets Scanning (`secrets-scan.yml`)

**Purpose:** Detect accidentally committed secrets, API keys, tokens, and credentials in the codebase.

**Tools:**
- **TruffleHog OSS**: Scans git history for high-entropy strings and verified secrets
- **Gitleaks**: Fast, lightweight secret scanning with customizable rules

**Triggers:**
- Push to `main`, `develop`, `test/**` branches
- Pull requests to `main`, `develop`
- Daily scheduled scan at 2 AM UTC

**Configuration:**
- Scans entire git history (fetch-depth: 0)
- Only reports verified secrets (--only-verified)
- Uploads scan results as artifacts on failure

**OWASP Requirement:** V13.4.4 - Secrets Management

---

### 2. Snyk Security Scan (`security.yml`)

**Purpose:** Automated dependency vulnerability scanning and SAST (Static Application Security Testing).

**Components:**

#### Backend Dependencies Scan
- Scans `backend/package.json` for vulnerable npm packages
- Threshold: High severity and above
- Monitors project in Snyk dashboard

#### Frontend Dependencies Scan
- Scans `frontend/package.json` for vulnerable npm packages
- Threshold: High severity and above
- Monitors project in Snyk dashboard

#### Snyk Code (SAST)
- Static code analysis for security vulnerabilities
- Detects:
  - SQL injection
  - XSS vulnerabilities
  - Path traversal
  - Insecure deserialization
  - Hard-coded secrets

**Triggers:**
- Push to `main`, `develop`, `test/**` branches
- Pull requests to `main`, `develop`
- Weekly scheduled scan on Monday at 3 AM UTC

**OWASP Requirement:** V15.3.2 - Dependency Security

---

## Setup Instructions

### Prerequisites
1. **Snyk Account**: Sign up at https://snyk.io
2. **GitHub Repository Access**: Admin permissions to add secrets

### Step 1: Create Snyk API Token
1. Log in to Snyk (https://app.snyk.io)
2. Go to Account Settings → General
3. Copy your API token under "Auth Token"

### Step 2: Add GitHub Secret
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `SNYK_TOKEN`
4. Value: Paste your Snyk API token
5. Click "Add secret"

### Step 3: Verify Workflows
1. Push a commit to trigger the workflows
2. Go to Actions tab to view workflow runs
3. Check for any detected vulnerabilities

---

## Understanding Results

### TruffleHog Results
- **Verified secrets**: High-confidence detection (immediate action required)
- **Unverified secrets**: Potential secrets (manual review needed)

### Gitleaks Results
- Reports secrets found with line numbers and file paths
- Check `.gitleaksignore` to suppress false positives

### Snyk Results
- **Critical**: Fix immediately
- **High**: Fix within 7 days
- **Medium**: Fix within 30 days
- **Low**: Address during regular maintenance

---

## Response Procedures

### If Secrets Are Detected
1. ⚠️ **IMMEDIATELY ROTATE** the exposed secret
2. Remove the secret from git history using:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH/TO/FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Update `.gitignore` to prevent future commits
4. Document the incident

### If Vulnerabilities Are Detected
1. Review Snyk dashboard for details
2. Check if patches/updates are available
3. Update dependencies: `npm update` or `npm audit fix`
4. For unfixable vulnerabilities:
   - Assess risk vs. functionality
   - Consider alternative packages
   - Implement mitigations if necessary

---

## Best Practices

### Preventing Secret Leaks
1. Always use `.env` files for secrets (never commit `.env`)
2. Use `.env.example` with placeholder values
3. Review changes before committing: `git diff --cached`
4. Configure git hooks for pre-commit scanning

### Dependency Management
1. Keep dependencies up to date
2. Review changelogs before updating
3. Run tests after dependency updates
4. Use `npm audit` locally before pushing
5. Monitor Snyk dashboard weekly

### Security Baseline
- Zero high/critical vulnerabilities in production
- All secrets must be environment variables
- Regular security reviews (quarterly)
- Incident response plan documented

---

## Troubleshooting

### Workflow Failures

**Problem:** TruffleHog finds false positives
- **Solution:** Add patterns to `.trufflehog-ignore` file

**Problem:** Snyk workflow fails with "SNYK_TOKEN not set"
- **Solution:** Verify secret is added to GitHub repository settings

**Problem:** Snyk detects outdated packages
- **Solution:** Run `npm update` locally, test, then commit

**Problem:** Rate limiting on GitHub API
- **Solution:** Scheduled scans spread workload; reduce frequency if needed

---

## Maintenance

### Weekly Tasks
- Review Snyk dashboard for new vulnerabilities
- Check workflow run history in GitHub Actions

### Monthly Tasks
- Update workflow dependencies (e.g., `actions/checkout@v4`)
- Review and tune scan configurations
- Test secret rotation procedures

### Quarterly Tasks
- Security audit of entire CI/CD pipeline
- Update response procedures
- Train team on security best practices

---

## Additional Resources

- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Snyk Documentation](https://docs.snyk.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

---

## Support

For security incidents or questions:
- **Security Team**: security@ku-connect.edu (example)
- **DevOps Team**: devops@ku-connect.edu (example)
- **Emergency**: Follow incident response plan

---

*Last Updated: 2024 - KU Connect Security Team*
