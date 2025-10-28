// Client patch: drop this file in PATCHES/ and follow the README below to apply to index.html.
// This file contains the loadLeaderboard and saveToLeaderboard implementations to add to index.html.

export async function loadLeaderboardPatch() {
  try {
    const key = todayKey();

    // try remote first
    try {
      const res = await fetch(`/api/leaderboard?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body.top)) {
          setLeaderboard(body.top);
          localStorage.setItem(`leaderboard-${key}`, JSON.stringify(body.top));
          return;
        }
      } else {
        console.warn('Remote leaderboard returned non-OK', res.status);
      }
    } catch (err) {
      console.warn('Remote leaderboard fetch failed; falling back to local', err);
    }

    // fallback to local
    const saved = localStorage.getItem(`leaderboard-${key}`);
    if (saved) setLeaderboard(JSON.parse(saved));
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    setLeaderboard([]);
  }
}

export async function saveToLeaderboardPatch(name, time, attemptCount) {
  try {
    const key = todayKey();
    const newEntry = {
      name: name || 'Anonymous',
      time,
      attempts: attemptCount,
      score: Math.round(10000 / (Math.max(time, 1) * Math.max(attemptCount, 1))),
      timestamp: new Date().toISOString(),
    };

    // update local leaderboard immediately for responsive UI
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem(`leaderboard-${key}`, JSON.stringify(updated));

    // Try to save remotely (non-blocking)
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, entry: newEntry }),
      });

      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body.top)) {
          setLeaderboard(body.top);
          localStorage.setItem(`leaderboard-${key}`, JSON.stringify(body.top));
        }
      } else {
        console.warn('Remote leaderboard save failed with status', res.status);
      }
    } catch (err) {
      console.warn('Could not save to remote leaderboard; using local copy', err);
    }
  } catch (error) {
    console.error('Error saving to leaderboard:', error);
  }
}