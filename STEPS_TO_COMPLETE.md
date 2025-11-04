# Complete These Steps NOW

## Step 1: Force Push to GitHub ⚡

Run this command in your terminal:

```bash
git push CarScore main --force
```

This will replace the GitHub repository history with the cleaned version (without .env files).

---

## Step 2: Revoke the Exposed API Key 🔑

### Your Exposed Key:
```
AIzaSyAoY9xxHmhL3DVm4b-QKl21VwQcC_svlsU
```

### How to Revoke:

1. **Open Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

2. **Find the API Key**:
   - Look for the key starting with `AIzaSyAoY9xxHmhL3DVm4b-QKl21VwQcC_svlsU`
   - Or look for keys created around November 3rd, 2025

3. **Delete the Key**:
   - Click on the key name
   - Click the "DELETE" button (trash icon)
   - Confirm deletion

4. **Create a New Key**:
   - Click "CREATE CREDENTIALS" → "API key"
   - A new key will be generated

5. **Restrict the New Key** (IMPORTANT for security):
   - Click on the new key to edit it
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose only: **Generative Language API**
   - Click "SAVE"

6. **Copy Your New API Key**:
   - Copy the new key to your clipboard

---

## Step 3: Update Your Local .env Files 📝

### Update backend/.env:

```bash
# backend/.env
API_KEY=your_new_api_key_here
PORT=3001
```

Replace `your_new_api_key_here` with the new key you just created.

### Update .env (root directory):

```bash
# .env
VITE_API_BASE_URL=http://localhost:3001
```

---

## Step 4: Verify on GitHub ✅

1. Go to: https://github.com/razvanvlad/CarScore

2. Check that `.env` files don't appear in the file list

3. Click on "commits" and check the first commit - it should NOT contain .env files

4. Use GitHub search:
   - Click the search box in your repository
   - Search for: `AIzaSyAoY9xxHmhL3DVm4b`
   - Result should be: "We couldn't find any code matching"

---

## Step 5: Test Your App 🚀

Restart your application with the new API key:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

---

## Important Notes ⚠️

- **DO NOT** commit SECURITY_FIX.md or STEPS_TO_COMPLETE.md to GitHub
- The force push will rewrite public history
- If anyone else has cloned your repo, they'll need to re-clone it
- The old API key is compromised - you MUST delete it
- Set up billing alerts in Google Cloud to detect unusual usage

---

## Checklist

- [ ] Force pushed to GitHub
- [ ] Old API key deleted in Google Cloud Console
- [ ] New API key created with restrictions
- [ ] backend/.env updated with new key
- [ ] Verified .env not visible on GitHub
- [ ] Tested app works with new key
- [ ] Set up API usage alerts (recommended)

---

**Once you complete these steps, your security issue will be resolved!**
