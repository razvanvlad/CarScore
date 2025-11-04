# URGENT: Security Fix Required - API Key Exposed

## What Happened?

Your Google Gemini API Key was accidentally committed and pushed to GitHub. GitGuardian detected this security vulnerability.

**Exposed API Key**: `AIzaSyAoY9xxHmhL3DVm4b-QKl21VwQcC_svlsU`

## Immediate Actions Required

### Step 1: Revoke the Exposed API Key (DO THIS FIRST!)

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Find the API key: `AIzaSyAoY9xxHmhL3DVm4b-QKl21VwQcC_svlsU`
3. **DELETE or DISABLE** this key immediately
4. Anyone with this key can use your Gemini API quota and potentially incur charges

### Step 2: Create a New API Key

1. In Google Cloud Console, create a new API key
2. **Important**: Add API restrictions:
   - Go to "API restrictions"
   - Select "Restrict key"
   - Choose only "Generative Language API"
3. Add application restrictions if possible (HTTP referrers or IP addresses)
4. Copy the new API key

### Step 3: Update Your Local Environment

1. Update your local `.env` file in the root directory:
   ```bash
   VITE_API_BASE_URL=http://localhost:3001
   ```

2. Update `backend/.env` file with your NEW API key:
   ```bash
   API_KEY=your_new_api_key_here
   PORT=3001
   ```

### Step 4: Remove Sensitive Data from Git History

**CRITICAL**: The .env files are still in your Git history on GitHub. You need to remove them completely.

#### Option A: Using git filter-repo (Recommended)

1. Install git-filter-repo:
   ```bash
   # Windows (using pip)
   pip install git-filter-repo

   # macOS
   brew install git-filter-repo
   ```

2. Remove the .env files from all history:
   ```bash
   git filter-repo --path .env --path backend/.env --invert-paths --force
   ```

3. Force push to GitHub:
   ```bash
   git push origin --force --all
   ```

#### Option B: Using BFG Repo-Cleaner (Alternative)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
   ```bash
   # Create a fresh clone
   git clone --mirror https://github.com/razvanvlad/CarScore.git
   cd CarScore.git

   # Remove .env files
   java -jar bfg.jar --delete-files ".env"

   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push
   git push --force
   ```

#### Option C: Rewrite History Manually (If above options fail)

```bash
# Backup your current work
git branch backup

# Remove files from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
git push origin --force --tags
```

### Step 5: Commit the Security Fixes

The following changes have already been made locally:
- ✅ `.gitignore` updated to exclude `.env` files
- ✅ `.env` files removed from git tracking
- ✅ `.env.example` files created as templates

Now commit these changes:

```bash
git add .gitignore .env.example backend/.env.example
git commit -m "Security fix: Remove exposed API keys and update .gitignore"
git push origin main
```

### Step 6: Verify the Fix

1. Check your GitHub repository - the .env files should not be visible in any commits
2. Use GitHub's search to verify: search for your old API key in the repo
3. If it still appears, the git history wasn't properly cleaned

### Step 7: Monitor Your API Usage

1. Check Google Cloud Console for unusual API activity
2. Set up usage alerts and quotas to prevent abuse
3. Monitor your billing for unexpected charges

## Prevention for Future

### Best Practices Implemented:

1. ✅ `.env` files are now in `.gitignore`
2. ✅ `.env.example` templates created for reference
3. ✅ Actual `.env` files removed from git tracking

### Additional Recommendations:

1. **Use Environment Variable Validation**
   - Add startup checks to ensure API keys are loaded correctly
   - Never log environment variables

2. **Pre-commit Hooks**
   - Install `git-secrets` or similar tools:
     ```bash
     # Install git-secrets
     git secrets --install
     git secrets --register-aws
     git secrets --add 'AIza[0-9A-Za-z-_]{35}'
     ```

3. **Use GitHub Secret Scanning**
   - GitHub already detected this (via GitGuardian)
   - Enable "Push protection" in repository settings to prevent future leaks

4. **Local Development Workflow**
   - Always check `git status` before committing
   - Review files with `git diff` before committing
   - Never commit files in the root or backend directories without reviewing

## Security Checklist

- [ ] Old API key revoked/deleted in Google Cloud Console
- [ ] New API key created with restrictions
- [ ] Local `.env` files updated with new key
- [ ] `.env` files removed from git history
- [ ] Changes committed to GitHub
- [ ] Verified API key no longer visible on GitHub
- [ ] Set up API usage alerts in Google Cloud
- [ ] (Optional) Install pre-commit hooks

## Need Help?

If you're unsure about any of these steps, particularly cleaning the git history:
1. Consider making the repository private temporarily
2. You can also delete and recreate the repository (losing all commit history)
3. Consult GitHub's guide: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## Important Notes

- **DO NOT** commit this SECURITY_FIX.md file to GitHub as it contains your exposed key
- The exposed key is already public, so revoking it is your top priority
- Even after cleaning git history, the key may be cached on GitHub's servers for a short time
- Always assume exposed secrets are compromised - revoke and replace them

---

**This fix was generated on**: November 4th, 2025
**Detected by**: GitGuardian
**Repository**: razvanvlad/CarScore
