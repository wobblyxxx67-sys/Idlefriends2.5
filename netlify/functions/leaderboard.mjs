import { json, readJson, getJson, setJson } from './_store.mjs';

const KEY = 'leaderboard';
const clean = (s) => String(s || '').trim().slice(0, 24);
const normalize = (s) => clean(s).toLowerCase();

export default async (req) => {
  const method = req.httpMethod;
  const params = new URLSearchParams(req.rawUrl?.split('?')[1] || '');
  const name = clean(params.get('name'));

  let board = await getJson(KEY, []);
  let users = await getJson('registered-users', []);
  let presence = await getJson('presence', []);

  if (method === 'GET') {
    if (name) {
      return json(200, {
        registered: users.some(u => normalize(u) === normalize(name))
      });
    }

    return json(200, {
      leaderboard: board
        .filter(p => normalize(p.name) !== 'test123')
        .sort((a, b) => (Number(b.rebirths) || 0) - (Number(a.rebirths) || 0))
    });
  }

  if (method === 'POST') {
    const body = readJson(req);
    const action = String(body.action || '').toLowerCase();
    const username = clean(body.name);

    if (!username) return json(400, { error: 'Name fehlt' });

    if (action === 'register') {
      if (users.some(u => normalize(u) === normalize(username))) {
        return json(409, { error: 'Name bereits vergeben' });
      }
      users.push(username);
      await setJson('registered-users', users);
      return json(200, { ok: true });
    }

    const entry = {
      name: username,
      rebirths: Number(body.rebirths) || 0,
      bestFriend: String(body.bestFriend || ''),
      totalIncome: Number(body.totalIncome) || 0,
      playtimeSeconds: Number(body.playtimeSeconds) || 0,
      updatedAt: Date.now()
    };

    board = board.filter(p => normalize(p.name) !== normalize(username));
    board.push(entry);
    await setJson(KEY, board);
    return json(200, { ok: true });
  }

  if (method === 'DELETE') {
    if (!name) return json(400, { error: 'Name fehlt' });

    board = board.filter(p => normalize(p.name) !== normalize(name));
    users = users.filter(u => normalize(u) !== normalize(name));
    presence = presence.filter(p => normalize(p.name) !== normalize(name));

    await setJson(KEY, board);
    await setJson('registered-users', users);
    await setJson('presence', presence);

    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
};
