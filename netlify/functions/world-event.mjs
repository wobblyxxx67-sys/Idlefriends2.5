import { json, readJson, getJson, setJson, isAdmin } from './_store.mjs';

const KEY = 'world-events';

const ALLOWED_EVENTS = [
  'luck3',
  'luck5',
  'luck7',
  'luck12',
  'income3',
  'income5',
  'income8',
  'diamondOnly'
];

const EVENT_DURATION = 60 * 1000;

export default async (req) => {
  const method = req.httpMethod;

  if (method === 'GET') {
    const events = await getJson(KEY, []);
    const now = Date.now();
    const active = events.filter(
      (event) => Number(event.endsAt) > now
    );

    if (active.length !== events.length) {
      await setJson(KEY, active);
    }

    return json(200, {
      events: active,
      event: active[0] || null,
      updatedAt: now
    });
  }

  if (method === 'POST') {
    const body = readJson(req);

    if (!isAdmin(body)) {
      return json(403, { error: 'Keine Berechtigung' });
    }

    const type = String(body.event || body.type || '');

    if (!ALLOWED_EVENTS.includes(type)) {
      return json(400, { error: 'Unbekanntes Event', allowed: ALLOWED_EVENTS });
    }

    const events = await getJson(KEY, []);
    const now = Date.now();

    const active = events.filter(
      (event) => Number(event.endsAt) > now
    );

    const newEvent = {
      id: `${type}-${now}`,
      event: type,
      type,
      startedAt: now,
      endsAt: now + EVENT_DURATION,
      startedBy: String(body.name || '')
    };

    active.push(newEvent);
    await setJson(KEY, active);

    return json(200, { ok: true, event: newEvent, events: active });
  }

  return json(405, { error: 'Method not allowed' });
};
