import { json, readJson, getJson, setJson, isAdmin } from './_store.mjs';

const KEY = 'world-spawn';
const MAX_AGE = 5 * 60 * 1000;

export default async (req) => {
  const method = req.httpMethod;

  if (method === 'GET') {
    const spawn = await getJson(KEY, null);

    if (!spawn) {
      return json(200, { spawn: null });
    }

    if (Date.now() - Number(spawn.createdAt) > MAX_AGE) {
      await setJson(KEY, null);
      return json(200, { spawn: null });
    }

    return json(200, { spawn });
  }

  if (method === 'POST') {
    const body = readJson(req);

    if (!isAdmin(body)) {
      return json(403, { error: 'Keine Berechtigung' });
    }

    const friend = String(body.friend || body.friendId || '').trim();

    if (!friend) {
      return json(400, { error: 'Friend fehlt' });
    }

    const spawn = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      friend,
      createdAt: Date.now(),
      createdBy: String(body.name || '')
    };

    await setJson(KEY, spawn);

    return json(200, { ok: true, spawn });
  }

  return json(405, { error: 'Method not allowed' });
};
