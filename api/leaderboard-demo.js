// Demo serverless function (file-backed) for local development only.
// Place at /api/leaderboard-demo.js for quick local testing.
// WARNING: Not suitable for production (filesystem persistence only).

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'leaderboards.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return {};
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('readDB error', e);
    return {};
  }
}

function writeDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('writeDB error', e);
  }
}

export default function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { key, entry } = req.body || {};
      if (!key || !entry) return res.status(400).json({ error: 'Missing key or entry' });

      const db = readDB();
      db[key] = db[key] || [];
      db[key].push(entry);
      db[key] = db[key]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10);
      writeDB(db);
      return res.status(200).json({ top: db[key] });
    }

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'Missing key' });
      const db = readDB();
      return res.status(200).json({ top: db[key] || [] });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('demo handler error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}