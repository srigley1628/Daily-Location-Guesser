// Netlify serverless function (deploy under netlify/functions/leaderboard.js)
// Requires env vars in Netlify: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { key, entry } = body;
      if (!key || !entry) return { statusCode: 400, body: JSON.stringify({ error: 'Missing key or entry' }) };

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
        return { statusCode: 500, body: JSON.stringify({ error: 'DB insert failed' }) };
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
        return { statusCode: 500, body: JSON.stringify({ error: 'DB query failed' }) };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ top }),
      };
    }

    if (event.httpMethod === 'GET') {
      const key = event.queryStringParameters && event.queryStringParameters.key;
      if (!key) return { statusCode: 400, body: JSON.stringify({ error: 'Missing key' }) };

      const { data: top, error } = await supabase
        .from('leaderboards')
        .select('id, name, time, attempts, score, created_at')
        .eq('day_key', key)
        .order('score', { ascending: false })
        .order('time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Supabase select error', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'DB query failed' }) };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ top }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Unhandled error in Netlify leaderboard', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};