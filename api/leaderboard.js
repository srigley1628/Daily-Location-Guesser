// Vercel serverless function (use at /api/leaderboard)
// Place this file at /api/leaderboard.js in the repository root.
// Requires env vars (set in Vercel Project Settings): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase env vars not set: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();

    if (req.method === 'POST') {
      const { key, entry } = req.body || {};
      if (!key || !entry) return res.status(400).json({ error: 'Missing key or entry' });

      const { data: insertData, error: insertError } = await supabase
        .from('leaderboards')
        .insert({
          day_key: key,
          name: entry.name || 'Anonymous',
          time: entry.time || 0,
          attempts: entry.attempts || 0,
          score: entry.score || 0,
        });

      if (insertError) {
        console.error('Supabase insert error', insertError);
        return res.status(500).json({ error: 'DB insert failed' });
      }

      const { data: top, error: topError } = await supabase
        .from('leaderboards')
        .select('id, name, time, attempts, score, created_at')
        .eq('day_key', key)
        .order('score', { ascending: false })
        .order('time', { ascending: true })
        .limit(10);

      if (topError) {
        console.error('Supabase select error', topError);
        return res.status(500).json({ error: 'DB query failed' });
      }

      return res.status(200).json({ top });
    }

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'Missing key' });

      const { data: top, error } = await supabase
        .from('leaderboards')
        .select('id, name, time, attempts, score, created_at')
        .eq('day_key', key)
        .order('score', { ascending: false })
        .order('time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Supabase select error', error);
        return res.status(500).json({ error: 'DB query failed' });
      }

      return res.status(200).json({ top });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('Unhandled error in leaderboard handler', err);
    return res.status(500).json({ error: 'Server error' });
  }
}