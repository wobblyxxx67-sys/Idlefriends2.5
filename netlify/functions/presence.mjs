import { json, readJson, getJson, setJson } from './_store.mjs';

const KEY = 'presence';
const ONLINE_TIMEOUT = 60 * 1000;

const clean = (value) => String(value || '').trim().slice(0, 24);

export default async (req) => {
  const method = req.httpMethod;

  if (method === 'GET') {
    const players = await getJson(KEY, []);
    const cutoff = Date.now() - ONLINE_TIMEOUT;
    const online = players.filter(
      (p) => Number(p.lastSeen) > cutoff && p.name
    );

    await setJson(KEY, online);

    return json(200, {
      online: online.length,
      players: online.map((p) => ({
        name: p.name,
        stats: p.stats || {}
      }))
    });
  }

  if (method === 'POST') {
    const body = readJson(req);
    const name = clean(body.name);
    const sessionId = clean(body.sessionId);

    if (!name || !sessionId) {
      return json(400, { error: 'Name oder Session fehlt' });
    }

    const players = await getJson(KEY, []);
    const now = Date.now();

    const updated = players.filter(
      (p) => p.sessionId !== sessionId
    );

    updated.push({
      name,
      sessionId,
      stats: body.stats || {},
      lastSeen: now
    });

    await setJson(KEY, updated);

    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
};
