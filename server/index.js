import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { ensureDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_NAME = 'birthday_editor';
const SESSION_LIFETIME = 7 * 24 * 60 * 60 * 1000;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MEDIA_CHUNK_BYTES = 1024 * 1024;
const sessionSecret = process.env.EDITOR_SESSION_SECRET || '';
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'ADMIN';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (process.env.VERCEL) app.set('trust proxy', 1);

const EMPTY_CONTENT = {
  cardData: { name: '', birthDate: '', title: '', message: '' },
  surpriseCards: {
    gift: { image: '', title: '', description: '', action: '' },
    fortune: { image: '', title: '', description: '', action: '' },
  },
  memories: [],
  tracks: [],
};

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'DENY');
  res.set('Content-Security-Policy', "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; frame-src https://www.youtube.com; connect-src 'self' https://www.youtube.com https://*.youtube.com");
  if (req.secure || req.get('x-forwarded-proto') === 'https') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '25mb' }));

const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

function hash(value) {
  return createHash('sha256').update(String(value)).digest();
}

function sameSecret(left, right) {
  return timingSafeEqual(hash(left), hash(right));
}

function makePasswordHash(password) {
  const salt = randomBytes(16).toString('base64url');
  const derived = scryptSync(password, salt, 64).toString('base64url');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, derived] = String(storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !derived) return false;
  const candidate = scryptSync(password, salt, 64).toString('base64url');
  return sameSecret(candidate, derived);
}

function editorConfigured() {
  return sessionSecret.length >= 32 && DEFAULT_ADMIN_PASSWORD.length > 0;
}

function makeSessionToken() {
  const expires = String(Date.now() + SESSION_LIFETIME);
  const signature = createHmac('sha256', sessionSecret).update(expires).digest('base64url');
  return `${expires}.${signature}`;
}

function hasSession(req) {
  if (!editorConfigured()) return false;
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_NAME}=`));
  const token = cookie?.slice(SESSION_NAME.length + 1);
  const [expires, signature] = token?.split('.') || [];
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = createHmac('sha256', sessionSecret).update(expires).digest('base64url');
  return sameSecret(signature, expected);
}

async function ensureAdminUser(db) {
  const username = DEFAULT_ADMIN_USERNAME.trim() || 'ADMIN';
  const { rows } = await db.query('SELECT id FROM admin_users WHERE username = $1', [username]);
  if (rows.length) return;
  if (!DEFAULT_ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD chưa được cấu hình.');
  await db.query(
    'INSERT INTO admin_users (id, username, password_hash) VALUES ($1, $2, $3)',
    [randomUUID(), username, makePasswordHash(DEFAULT_ADMIN_PASSWORD)]
  );
}

function isAllowedOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const forwardedHost = req.get('x-forwarded-host') || req.get('host');
    if (parsed.host === forwardedHost) return true;
    if (process.env.SITE_ORIGIN && origin === process.env.SITE_ORIGIN) return true;
    return process.env.NODE_ENV !== 'production' && ['localhost:5173', '127.0.0.1:5173'].includes(parsed.host);
  } catch {
    return false;
  }
}

function requireEditor(req, res, next) {
  if (!isAllowedOrigin(req)) return res.status(403).json({ success: false, message: 'Nguồn yêu cầu không hợp lệ.' });
  if (!hasSession(req)) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để chỉnh sửa.' });
  next();
}

function validContent(data) {
  return data && !Array.isArray(data) && typeof data === 'object'
    && data.cardData && typeof data.cardData === 'object' && !Array.isArray(data.cardData)
    && Array.isArray(data.memories) && data.memories.length <= 100
    && Array.isArray(data.tracks) && data.tracks.length <= 100
    && data.memories.every((item) => item && typeof item.id === 'string' && typeof item.image === 'string')
    && data.tracks.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.source === 'string' && ['file', 'url', 'youtube'].includes(item.type));
}

function mergeContent(current, incoming) {
  return {
    ...current,
    ...incoming,
    cardData: { ...current.cardData, ...incoming.cardData },
    surpriseCards: { ...current.surpriseCards, ...incoming.surpriseCards },
    memories: incoming.memories,
    tracks: incoming.tracks,
  };
}

async function readContent(db) {
  await db.query('INSERT INTO birthday_profile (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
  await db.query(`
    INSERT INTO birthday_surprise_cards (id, sort_order)
    VALUES ('gift', 1), ('fortune', 2)
    ON CONFLICT (id) DO NOTHING
  `);
  const [profileResult, surpriseResult, memoriesResult, tracksResult] = await Promise.all([
    db.query('SELECT name, birth_date, title, message FROM birthday_profile WHERE id = 1'),
    db.query('SELECT id, image, title, description, action FROM birthday_surprise_cards ORDER BY sort_order, id'),
    db.query('SELECT id, title, memory_date, caption, image, rotate FROM birthday_memories ORDER BY sort_order, created_at'),
    db.query('SELECT id, name, type, source FROM birthday_tracks ORDER BY sort_order, created_at'),
  ]);
  const profile = profileResult.rows[0] || {};
  const surpriseCards = { ...EMPTY_CONTENT.surpriseCards };
  surpriseResult.rows.forEach((item) => {
    surpriseCards[item.id] = {
      image: item.image || '',
      title: item.title || '',
      description: item.description || '',
      action: item.action || '',
    };
  });
  return {
    cardData: {
      name: profile.name || '',
      birthDate: profile.birth_date || '',
      title: profile.title || '',
      message: profile.message || '',
    },
    surpriseCards,
    memories: memoriesResult.rows.map((item) => ({
      id: item.id,
      title: item.title || '',
      date: item.memory_date || '',
      caption: item.caption || '',
      image: item.image || '',
      rotate: Number(item.rotate) || 0,
    })),
    tracks: tracksResult.rows.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      source: item.source,
    })),
  };
}

async function saveContent(db, data) {
  const content = mergeContent(EMPTY_CONTENT, data);
  const client = await db.connect();
  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO birthday_profile (id, name, birth_date, title, message, updated_at)
       VALUES (1, $1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         birth_date = EXCLUDED.birth_date,
         title = EXCLUDED.title,
         message = EXCLUDED.message,
         updated_at = now()`,
      [
        content.cardData.name || '',
        content.cardData.birthDate || '',
        content.cardData.title || '',
        content.cardData.message || '',
      ]
    );

    const surpriseIds = Object.keys(content.surpriseCards || {});
    for (const [index, id] of surpriseIds.entries()) {
      const card = content.surpriseCards[id] || {};
      await client.query(
        `INSERT INTO birthday_surprise_cards (id, image, title, description, action, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (id) DO UPDATE SET
           image = EXCLUDED.image,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           action = EXCLUDED.action,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()`,
        [id, card.image || '', card.title || '', card.description || '', card.action || '', index + 1]
      );
    }
    if (surpriseIds.length) {
      await client.query('DELETE FROM birthday_surprise_cards WHERE NOT (id = ANY($1::text[]))', [surpriseIds]);
    } else {
      await client.query('DELETE FROM birthday_surprise_cards');
    }

    const memoryIds = content.memories.map((item) => item.id);
    for (const [index, memory] of content.memories.entries()) {
      await client.query(
        `INSERT INTO birthday_memories (id, title, memory_date, caption, image, rotate, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           memory_date = EXCLUDED.memory_date,
           caption = EXCLUDED.caption,
           image = EXCLUDED.image,
           rotate = EXCLUDED.rotate,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()`,
        [memory.id, memory.title || '', memory.date || '', memory.caption || '', memory.image || '', Number(memory.rotate) || 0, index + 1]
      );
    }
    if (memoryIds.length) {
      await client.query('DELETE FROM birthday_memories WHERE NOT (id = ANY($1::text[]))', [memoryIds]);
    } else {
      await client.query('DELETE FROM birthday_memories');
    }

    const trackIds = content.tracks.map((item) => item.id);
    for (const [index, track] of content.tracks.entries()) {
      await client.query(
        `INSERT INTO birthday_tracks (id, name, type, source, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           source = EXCLUDED.source,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()`,
        [track.id, track.name, track.type, track.source, index + 1]
      );
    }
    if (trackIds.length) {
      await client.query('DELETE FROM birthday_tracks WHERE NOT (id = ANY($1::text[]))', [trackIds]);
    } else {
      await client.query('DELETE FROM birthday_tracks');
    }

    await client.query('COMMIT');
    return readContent(db);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

app.get('/api/editor-session', route(async (req, res) => {
  const configured = editorConfigured();
  if (configured) {
    const db = await ensureDatabase();
    await ensureAdminUser(db);
  }
  res.json({ success: true, authenticated: hasSession(req), configured });
}));

app.post('/api/editor-session', route(async (req, res) => {
  if (!isAllowedOrigin(req)) return res.status(403).json({ success: false, message: 'Nguồn yêu cầu không hợp lệ.' });
  if (!editorConfigured()) return res.status(503).json({ success: false, message: 'Khóa phiên cần ít nhất 32 ký tự.' });
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const db = await ensureDatabase();
  await ensureAdminUser(db);
  const { rows } = await db.query('SELECT id, password_hash FROM admin_users WHERE username = $1', [DEFAULT_ADMIN_USERNAME]);
  if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
    return res.status(401).json({ success: false, message: 'Mật khẩu chưa đúng.' });
  }
  await db.query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [rows[0].id]);
  const secure = req.secure || req.get('x-forwarded-proto') === 'https';
  res.set('Set-Cookie', `${SESSION_NAME}=${makeSessionToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_LIFETIME / 1000}${secure ? '; Secure' : ''}`);
  res.json({ success: true });
}));

app.delete('/api/editor-session', requireEditor, (req, res) => {
  res.set('Set-Cookie', `${SESSION_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  res.json({ success: true });
});

app.get('/api/content-settings', route(async (req, res) => {
  const db = await ensureDatabase();
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: await readContent(db) });
}));

app.get('/api/tracks', route(async (req, res) => {
  const db = await ensureDatabase();
  const { rows } = await db.query('SELECT id, name, type, source FROM birthday_tracks ORDER BY sort_order, created_at');
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: rows });
}));

app.post('/api/content-settings', requireEditor, route(async (req, res) => {
  if (!validContent(req.body)) return res.status(400).json({ success: false, message: 'Dữ liệu thiệp không hợp lệ.' });
  const db = await ensureDatabase();
  const data = await saveContent(db, req.body);
  res.json({ success: true, data });
}));

app.post('/api/content-media', requireEditor, route(async (req, res) => {
  const match = typeof req.body?.dataUrl === 'string' && req.body.dataUrl.match(/^data:(audio\/[\w.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ success: false, message: 'Tệp âm thanh không hợp lệ.' });
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) return res.status(413).json({ success: false, message: 'Tệp nhạc phải nhỏ hơn 15 MB.' });
  const id = randomUUID();
  const db = await ensureDatabase();
  await db.query('INSERT INTO birthday_media (id, mime_type, data) VALUES ($1, $2, $3)', [id, match[1], buffer]);
  res.status(201).json({ success: true, data: { source: `/api/content-media/${id}` } });
}));

app.get('/api/content-media/:id', route(async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.sendStatus(404);
  const db = await ensureDatabase();
  const metadata = await db.query(
    'SELECT mime_type, octet_length(data) AS byte_length FROM birthday_media WHERE id = $1',
    [req.params.id]
  );
  if (!metadata.rows.length) return res.sendStatus(404);
  const { mime_type: mimeType } = metadata.rows[0];
  const byteLength = Number(metadata.rows[0].byte_length);
  res.set({
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': `"media-${req.params.id}-${byteLength}"`,
  });
  if (req.method === 'HEAD') {
    res.set('Content-Length', byteLength);
    return res.end();
  }
  const range = req.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const suffix = range[1] === '';
    const requestedStart = suffix ? Math.max(0, byteLength - Number(range[2])) : Number(range[1]);
    const requestedEnd = suffix
      ? byteLength - 1
      : range[2] ? Math.min(Number(range[2]), byteLength - 1) : byteLength - 1;
    const end = Math.min(requestedEnd, requestedStart + MEDIA_CHUNK_BYTES - 1);
    if (!Number.isFinite(requestedStart) || !Number.isFinite(end) || requestedStart > end || requestedStart >= byteLength) {
      res.set('Content-Range', `bytes */${byteLength}`);
      return res.sendStatus(416);
    }
    const chunkLength = end - requestedStart + 1;
    const chunk = await db.query(
      'SELECT substring(data FROM $2 FOR $3) AS data FROM birthday_media WHERE id = $1',
      [req.params.id, requestedStart + 1, chunkLength]
    );
    res.status(206).set({
      'Content-Range': `bytes ${requestedStart}-${end}/${byteLength}`,
      'Content-Length': chunkLength,
    });
    return res.send(chunk.rows[0].data);
  }
  const media = await db.query('SELECT data FROM birthday_media WHERE id = $1', [req.params.id]);
  res.set('Content-Length', byteLength);
  res.send(media.rows[0].data);
}));

app.delete('/api/content-media/:id', requireEditor, route(async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.sendStatus(404);
  const db = await ensureDatabase();
  await db.query('DELETE FROM birthday_media WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));

app.get('/api/card/:id?', route(async (req, res) => {
  const db = await ensureDatabase();
  const id = req.params.id || 'default';
  const { rows } = await db.query('SELECT data FROM birthday_cards WHERE id = $1', [id]);
  const content = rows.length ? null : await readContent(db);
  res.json({ success: true, data: rows[0]?.data || content.cardData });
}));

app.post('/api/card', requireEditor, route(async (req, res) => {
  const data = req.body;
  if (!data || typeof data.name !== 'string' || data.name.length > 120) return res.status(400).json({ success: false, message: 'Thiệp không hợp lệ.' });
  const id = `card_${randomUUID()}`;
  const db = await ensureDatabase();
  await db.query('INSERT INTO birthday_cards (id, data) VALUES ($1, $2::jsonb)', [id, JSON.stringify(data)]);
  res.status(201).json({ success: true, id, data });
}));

app.post('/api/wishes', route(async (req, res) => {
  const wish = typeof req.body?.wish === 'string' ? req.body.wish.trim() : '';
  if (!wish || wish.length > 500) return res.status(400).json({ success: false, message: 'Điều ước không hợp lệ.' });
  const db = await ensureDatabase();
  const id = `wish_${randomUUID()}`;
  await db.query('INSERT INTO birthday_wishes (id, data) VALUES ($1, $2::jsonb)', [id, JSON.stringify({ wish })]);
  res.status(201).json({ success: true, id });
}));

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API không tồn tại.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('API error:', error);
  res.status(503).json({ success: false, message: 'Máy chủ chưa thể truy cập dữ liệu. Vui lòng thử lại.' });
});

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Birthday Celebration Server running on http://localhost:${PORT}`));
}

export default app;
