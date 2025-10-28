# Leaderboard Client Patch

This directory contains a JS patch to add to your `index.html` to enable remote leaderboard calls.

How to apply
1. Open `index.html` in the repository root.
2. Find the existing `loadLeaderboard()` and `saveToLeaderboard()` functions.
3. Replace their bodies with the code in `PATCHES/leaderboard-client-patch.js` (the functions are named `loadLeaderboardPatch` and `saveToLeaderboardPatch` — rename to `loadLeaderboard` and `saveToLeaderboard` when pasting).
4. Commit the change to the `add/leaderboard-api` branch and deploy.

After deployment make sure to set these environment variables in your deployment provider:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server-side only)