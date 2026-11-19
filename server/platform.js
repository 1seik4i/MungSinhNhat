import express from 'express';
import { randomBytes, randomUUID, createHash, createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ensureDatabase } from './db.js';
import { DEFAULT_GIFT_REWARDS, getGiftRewards, GIFT_CARD } from '../shared/giftRewards.js';
import { DEFAULT_FORTUNES, FORTUNE_CATALOG_VERSION, FORTUNE_CARD } from '../shared/fortunes.js';

const derive = promisify(scrypt);
const digest = x => createHash('sha256').update(String(x)).digest('hex');
const token = () => randomBytes(32).toString('base64url');
const fail = (status, message) => Object.assign(new Error(message), { status });
const cookie = (req, key) => req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(`${key}=`))?.slice(key.length + 1);
const origin = () => process.env.SITE_ORIGIN || 'http://localhost:5173';
const shareKey = id => {
  if ((process.env.EDITOR_SESSION_SECRET || '').length < 32) throw fail(503, 'Chưa cấu hình khóa phiên.');
  return createHmac('sha256', process.env.EDITOR_SESSION_SECRET).update(`share:${id}`).digest('base64url');
};
export const defaults = {
  fortuneCatalogVersion: FORTUNE_CATALOG_VERSION,
  giftRewards: structuredClone(DEFAULT_GIFT_REWARDS),
  cardData: { name: 'Bạn thân yêu', birthDate: '', title: 'Chúc mừng sinh nhật!', message: 'Chúc bạn một tuổi mới thật nhiều niềm vui, bình an và những điều tuyệt vời. Hãy mở món quà sinh nhật dành riêng cho bạn nhé!' },
  surpriseCards: {
    gift: { image: '', title: 'Hộp quà bí mật', description: 'Một món quà nhỏ với thật nhiều yêu thương đang chờ bạn.', action: 'Mở quà ngay' },
    fortune: { ...FORTUNE_CARD },
  },
  memories: [], tracks: [
    { id: 'default-hieuthuhai-sinh-nhat', name: 'HIEUTHUHAI - SINH NHẬT', type: 'url', source: '/audio/hieuthuhai-sinh-nhat.mp3' },
    { id: 'default-phan-dinh-tung-khuc-hat-mung-sinh-nhat', name: 'KHÚC HÁT MỪNG SINH NHẬT - PHAN ĐINH TÙNG', type: 'url', source: '/audio/phan-dinh-tung-khuc-hat-mung-sinh-nhat.mp3' },
  ],
};
export const emailVerificationRequired = () => process.env.EMAIL_VERIFICATION_REQUIRED === 'true';
export const SHARE_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000;
export function shareExpiry(existing, rotate, now = Date.now()) {
  return existing.share_id && !rotate && existing.share_expires
    ? new Date(existing.share_expires).toISOString()
    : new Date(now + SHARE_LIFETIME_MS).toISOString();
}
let setup;
async function database() {
  const db = await ensureDatabase();
  if (!setup) setup = db.query(`
    CREATE TABLE IF NOT EXISTS cms_users(id uuid PRIMARY KEY,email text UNIQUE NOT NULL,password text NOT NULL,verified boolean NOT NULL DEFAULT false,active boolean NOT NULL DEFAULT true);
    CREATE TABLE IF NOT EXISTS cms_sessions(hash text PRIMARY KEY,user_id uuid REFERENCES cms_users(id),expires timestamptz NOT NULL,last_seen timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS cms_tokens(hash text PRIMARY KEY,user_id uuid REFERENCES cms_users(id),purpose text NOT NULL,expires timestamptz NOT NULL);
    CREATE TABLE IF NOT EXISTS cms_pages(id uuid PRIMARY KEY,owner uuid UNIQUE REFERENCES cms_users(id),draft jsonb NOT NULL,revision integer NOT NULL DEFAULT 1,snapshot jsonb,source_revision integer,share_id uuid UNIQUE,share_expires timestamptz,updated_at timestamptz DEFAULT now());
    UPDATE cms_pages SET share_expires=now()+interval '3 days' WHERE share_id IS NOT NULL AND (share_expires IS NULL OR share_expires>now()+interval '3 days');
    CREATE TABLE IF NOT EXISTS cms_media(id uuid PRIMARY KEY,page_id uuid REFERENCES cms_pages(id) ON DELETE CASCADE,mime text NOT NULL,data bytea NOT NULL);
    CREATE TABLE IF NOT EXISTS cms_viewers(hash text PRIMARY KEY,share_id uuid NOT NULL,snapshot jsonb NOT NULL,expires timestamptz NOT NULL);
    CREATE TABLE IF NOT EXISTS cms_limits(key text PRIMARY KEY,count integer NOT NULL,expires timestamptz NOT NULL);
    CREATE TABLE IF NOT EXISTS cms_captcha(hash text PRIMARY KEY,created_at timestamptz DEFAULT now());
    CREATE TABLE IF NOT EXISTS cms_fortune_catalog(number integer PRIMARY KEY CHECK(number BETWEEN 1 AND 100),version text NOT NULL,data jsonb NOT NULL);
  `).then(()=>db.query(`INSERT INTO cms_fortune_catalog(number,version,data) SELECT (item->>'number')::integer,$2,item FROM jsonb_array_elements($1::jsonb) item ON CONFLICT(number) DO UPDATE SET version=EXCLUDED.version,data=EXCLUDED.data`,[JSON.stringify(DEFAULT_FORTUNES),FORTUNE_CATALOG_VERSION])).catch(e => { setup = undefined; throw e; });
  await setup;
  return db;
}
async function passwordHash(password) {
  const salt = token();
  return `${salt}:${(await derive(password, salt, 64)).toString('hex')}`;
}
async function matches(password, stored) {
  const [salt, hash] = stored.split(':');
  const value = await derive(password, salt, 64);
  return timingSafeEqual(value, Buffer.from(hash, 'hex'));
}
function passwordValid(value) { return typeof value === 'string' && [...value].length >= 12 && [...value].length <= 128; }
async function limit(db, key, max, seconds) {
  const { rows } = await db.query(`INSERT INTO cms_limits(key,count,expires) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN cms_limits.expires<now() THEN 1 ELSE cms_limits.count+1 END,expires=CASE WHEN cms_limits.expires<now() THEN now()+$2*interval '1 second' ELSE cms_limits.expires END RETURNING count`, [key,max ? seconds : 1]);
  if (rows[0].count > max) throw fail(429, 'Thao tác quá nhiều lần. Vui lòng thử lại sau.');
}
async function mail(db, user, purpose) {
  if (!process.env.AUTH_EMAIL_WEBHOOK || !process.env.AUTH_EMAIL_WEBHOOK_SECRET) throw fail(503, 'Chưa cấu hình dịch vụ email.');
  const key = token();
  await db.query('INSERT INTO cms_tokens VALUES($1,$2,$3,now()+$4*interval \'1 minute\')', [digest(key),user.id,purpose,purpose === 'verify' ? 1440 : 30]);
  const response = await fetch(process.env.AUTH_EMAIL_WEBHOOK, { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.AUTH_EMAIL_WEBHOOK_SECRET}`}, body:JSON.stringify({to:user.email,purpose,url:`${origin()}/#${purpose}=${key}`}),signal:AbortSignal.timeout(10000) });
  if (!response.ok) throw fail(503,'Chưa gửi được email. Hãy dùng nút gửi lại.');
}
export function validateContent(content, complete = false) {
  if (!content || !content.cardData || !Array.isArray(content.memories) || !Array.isArray(content.tracks) || content.memories.length > 100 || content.tracks.length > 100) throw fail(422,'Nội dung không hợp lệ.');
  const rewards=getGiftRewards(content);
  if(!Array.isArray(rewards)||rewards.length>50||!rewards.every(r=>r&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=100&&typeof r.title==='string'&&r.title.length<=120&&(!complete||r.title.trim())&&typeof r.desc==='string'&&r.desc.length<=1000&&typeof r.code==='string'&&r.code.length<=80&&typeof r.tone==='string'&&/^#[0-9a-f]{6}$/i.test(r.tone)&&Number.isInteger(r.weight)&&r.weight>=1&&r.weight<=100)||new Set(rewards.map(r=>r.id)).size!==rewards.length)throw fail(422,'Danh sách quà không hợp lệ: tối đa 50 quà, tên tối đa 120 ký tự và màu dạng #RRGGBB.');
  for (const [key,max] of Object.entries({name:120,title:200,message:5000,birthDate:10})) {
    const value = content.cardData[key];
    if (typeof value !== 'string' || [...value].length > max || (complete && !value.trim())) throw fail(422,`Kiểm tra trường ${key}.`);
  }
  if(content.cardData.gender!==undefined&&!['male','female'].includes(content.cardData.gender)) throw fail(422,'Giới tính không hợp lệ.');
  const date = content.cardData.birthDate;
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date > new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Saigon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()))) throw fail(422,'Ngày sinh không hợp lệ.');
  const sourceOK = source => typeof source === 'string' && (defaults.tracks.some(t => t.source === source) || /^\/api\/platform\/media\/[0-9a-f-]{36}$/.test(source));
  const https = value => { try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[|0\.)/.test(u.hostname); } catch { return false; } };
  if (!content.memories.every(m => m && typeof m.id === 'string' && typeof m.caption === 'string' && m.caption.length <= 1000 && ((m.image===''&&!complete) || sourceOK(m.image) || https(m.image)))) throw fail(422,'Ảnh kỷ niệm không hợp lệ.');
  if (!content.tracks.every(t => t && typeof t.id === 'string' && typeof t.name === 'string' && t.name.length <= 200 && ((['url','file'].includes(t.type)&&(sourceOK(t.source)||https(t.source))) || (t.type==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(t.source))))) throw fail(422,'Bài nhạc không hợp lệ.');
  if (new Set(content.tracks.map(t=>t.id)).size!==content.tracks.length || new Set(content.memories.map(m=>m.id)).size!==content.memories.length) throw fail(422,'ID nội dung bị trùng.');
  for(const type of ['gift']){const card=content.surpriseCards?.[type];if(!card)throw fail(422,'Thiếu cấu hình quà.');for(const [field,max] of Object.entries({title:200})){if(typeof card[field]!=='string'||card[field].length>max)throw fail(422,'Cấu hình quà không hợp lệ.');}}
  const {fortunes:ignored,...clean}=content;
  return {...clean,surpriseCards:{...clean.surpriseCards,gift:{...clean.surpriseCards.gift,description:GIFT_CARD.description,action:GIFT_CARD.action,image:''},fortune:{...FORTUNE_CARD}},fortuneCatalogVersion:FORTUNE_CATALOG_VERSION};
}
export function checkSignature(mime,data){
  const hex=data.subarray(0,12).toString('hex'),ascii=data.subarray(0,12).toString('ascii');
  return mime==='image/jpeg'?hex.startsWith('ffd8ff'):mime==='image/png'?hex.startsWith('89504e470d0a1a0a'):mime==='image/webp'?ascii.startsWith('RIFF')&&ascii.endsWith('WEBP'):mime==='audio/wav'?ascii.startsWith('RIFF')&&ascii.endsWith('WAVE'):['audio/mp4','audio/x-m4a'].includes(mime)?ascii.slice(4,8)==='ftyp':mime==='audio/mpeg'?(ascii.startsWith('ID3')||(data[0]===255&&(data[1]&224)===224)):false;
}
const mediaIds = content => [...new Set(JSON.stringify(content).match(/\/api\/platform\/media\/[0-9a-f-]{36}/g) || [])].map(s => s.split('/').pop());
function setCookie(res, req, name, value, seconds, path='/') { res.append('Set-Cookie',`${name}=${value}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${seconds}${process.env.NODE_ENV === 'production' || req.secure ? '; Secure' : ''}`); }
export const platform = express.Router();
platform.use((req,res,next) => {
  req.body ||= {};
  res.set({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'});
  if (!['GET','HEAD'].includes(req.method) && req.get('origin') !== origin()) return res.status(403).json({message:'Nguồn yêu cầu không hợp lệ.'});
  next();
});
const route = handler => async (req,res,next) => { try { req.db = await database(); await handler(req,res); } catch(e) { next(e); } };
platform.get('/fortune-catalog',route(async(req,res)=>{const {rows}=await req.db.query('SELECT data FROM cms_fortune_catalog WHERE version=$1 ORDER BY number',[FORTUNE_CATALOG_VERSION]);res.json({version:FORTUNE_CATALOG_VERSION,data:rows.map(row=>row.data)});}));
async function user(req, verified=true) {
  const {rows} = await req.db.query(`UPDATE cms_sessions s SET last_seen=now() FROM cms_users u WHERE s.hash=$1 AND s.user_id=u.id AND s.expires>now() AND s.last_seen>now()-interval '30 minutes' AND u.active RETURNING u.id,u.email,u.verified`,[digest(cookie(req,'cms_session') || '')]);
  if (!rows[0]) throw fail(401,'Vui lòng đăng nhập.');
  if (verified && emailVerificationRequired() && !rows[0].verified) throw fail(403,'Vui lòng xác minh email.');
  return {...rows[0], emailVerified:rows[0].verified, verified:!emailVerificationRequired() || rows[0].verified};
}
async function page(req) { const u=await user(req); const {rows}=await req.db.query('SELECT * FROM cms_pages WHERE owner=$1',[u.id]); if (!rows[0]) throw fail(404,'Chưa có trang.'); return rows[0]; }
platform.get('/config',(req,res) => res.json({siteKey:process.env.TURNSTILE_SITE_KEY || '',defaultTracks:defaults.tracks,emailVerificationRequired:emailVerificationRequired(),emailEnabled:!!(process.env.AUTH_EMAIL_WEBHOOK && process.env.AUTH_EMAIL_WEBHOOK_SECRET)}));
platform.post('/register',route(async(req,res) => {
  await limit(req.db,`register:${req.ip}`,5,900);
  const {password,confirmation,captchaToken}=req.body; const email=String(req.body.email || '').trim().toLowerCase();
  if (!passwordValid(password) || password!==confirmation || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254) throw fail(422,'Email hoặc mật khẩu không hợp lệ (12–128 ký tự).');
  if (!process.env.TURNSTILE_SECRET_KEY) throw fail(503,'Chưa cấu hình CAPTCHA.');
  if (emailVerificationRequired() && (!process.env.AUTH_EMAIL_WEBHOOK || !process.env.AUTH_EMAIL_WEBHOOK_SECRET)) throw fail(503,'Chưa cấu hình email xác minh.');
  if (typeof captchaToken !== 'string' || !captchaToken || captchaToken.length > 2048) throw fail(422,'Vui lòng hoàn thành CAPTCHA.');
  const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:process.env.TURNSTILE_SECRET_KEY,response:captchaToken}),signal:AbortSignal.timeout(10000)}).then(r=>r.json());
  if (!result.success || result.action!=='register' || result.hostname!==new URL(origin()).hostname) throw fail(422,'CAPTCHA không hợp lệ. Hãy thử lại.');
  const used=await req.db.query('INSERT INTO cms_captcha(hash) VALUES($1) ON CONFLICT DO NOTHING RETURNING hash',[digest(captchaToken)]);
  if (!used.rowCount) throw fail(422,'CAPTCHA đã dùng.');
  const created=await req.db.query('INSERT INTO cms_users(id,email,password) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING RETURNING id,email',[randomUUID(),email,await passwordHash(password)]);
  if (created.rows[0] && emailVerificationRequired()) await mail(req.db,created.rows[0],'verify');
  res.status(202).json({message:emailVerificationRequired()?'Kiểm tra email xác minh hoặc dùng chức năng gửi lại.':'Đăng ký đã được xử lý. Bạn có thể đăng nhập bằng email và mật khẩu.'});
}));
platform.post('/login',route(async(req,res)=>{
  const email=String(req.body.email || '').trim().toLowerCase(); await limit(req.db,`login:${req.ip}`,30,900); await limit(req.db,`login-email:${email}`,5,900);
  const {rows}=await req.db.query('SELECT * FROM cms_users WHERE email=$1 AND active',[email]);
  if (!passwordValid(req.body.password) || !rows[0] || !await matches(req.body.password,rows[0].password)) throw fail(401,'Email hoặc mật khẩu chưa đúng.');
  const key=token(); await req.db.query("INSERT INTO cms_sessions(hash,user_id,expires) VALUES($1,$2,now()+interval '7 days')",[digest(key),rows[0].id]);
  await req.db.query('DELETE FROM cms_limits WHERE key=$1',[`login-email:${email}`]);
  setCookie(res,req,'cms_session',key,604800); res.json({success:true});
}));
platform.get('/me',route(async(req,res)=>res.json(await user(req,false))));
platform.post('/logout',route(async(req,res)=>{ await req.db.query('DELETE FROM cms_sessions WHERE hash=$1',[digest(cookie(req,'cms_session') || '')]); setCookie(res,req,'cms_session','',0); res.json({success:true}); }));
platform.post('/email',route(async(req,res)=>{ const email=String(req.body.email||'').trim().toLowerCase(); await limit(req.db,`email:${email}`,3,3600); await limit(req.db,`email-ip:${req.ip}`,20,3600); const {rows}=await req.db.query('SELECT id,email,verified FROM cms_users WHERE email=$1 AND active',[email]); const purpose=req.body.purpose==='reset'?'reset':'verify'; if(rows[0] && (purpose==='reset'||!rows[0].verified)) await mail(req.db,rows[0],purpose); res.json({message:'Nếu tài khoản phù hợp, email đã được gửi.'}); }));
platform.post('/consume',route(async(req,res)=>{
  const {key,purpose,password}=req.body;
  if (!['verify','reset'].includes(purpose) || (purpose==='reset'&&!passwordValid(password))) throw fail(422,'Yêu cầu không hợp lệ.');
  const client=await req.db.connect(); try { await client.query('BEGIN'); const {rows}=await client.query('DELETE FROM cms_tokens WHERE hash=$1 AND purpose=$2 AND expires>now() RETURNING user_id',[digest(key),purpose]); if(!rows[0]) throw fail(422,'Liên kết đã hết hạn hoặc được dùng.'); if(purpose==='verify') await client.query('UPDATE cms_users SET verified=true WHERE id=$1',[rows[0].user_id]); else { await client.query('UPDATE cms_users SET password=$1 WHERE id=$2',[await passwordHash(password),rows[0].user_id]); await client.query('DELETE FROM cms_sessions WHERE user_id=$1',[rows[0].user_id]); await client.query('DELETE FROM cms_tokens WHERE user_id=$1 AND purpose=$2',[rows[0].user_id,'reset']); } await client.query('COMMIT'); } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();} res.json({message:'Thành công. Bạn có thể đăng nhập.'});
}));
platform.get('/page',route(async(req,res)=>{ const p=await page(req); res.json({...p,shareUrl:p.share_id?`${origin()}/s/${p.share_id}#key=${shareKey(p.share_id)}`:null}); }));
platform.post('/page',route(async(req,res)=>{ const u=await user(req); await req.db.query('INSERT INTO cms_pages(id,owner,draft) VALUES($1,$2,$3) ON CONFLICT(owner) DO NOTHING',[randomUUID(),u.id,JSON.stringify(defaults)]); res.json({success:true}); }));
platform.put('/page',route(async(req,res)=>{
  const p=await page(req); const content=validateContent(req.body.content);
  const ids=mediaIds(content); if(ids.length){ const own=await req.db.query('SELECT id FROM cms_media WHERE page_id=$1 AND id=ANY($2::uuid[])',[p.id,ids]); if(own.rowCount!==ids.length) throw fail(422,'Media không thuộc trang.'); }
  const result=await req.db.query('UPDATE cms_pages SET draft=$1,revision=revision+1,updated_at=now() WHERE id=$2 AND revision=$3 RETURNING revision',[JSON.stringify(content),p.id,req.body.revision]); if(!result.rowCount) throw fail(409,'Nội dung đã thay đổi ở tab khác. Tải lại trước khi sửa.'); res.json(result.rows[0]);
}));
platform.post('/generate',route(async(req,res)=>{const p=await page(req); validateContent(p.draft,true); const result=await req.db.query('UPDATE cms_pages SET snapshot=draft,source_revision=revision WHERE id=$1 AND revision=$2 RETURNING id',[p.id,req.body.revision]); if(!result.rowCount) throw fail(409,'Hãy tải lại bản nháp.');res.json({success:true});}));
platform.post('/share',route(async(req,res)=>{
  const owned=await page(req),client=await req.db.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT * FROM cms_pages WHERE id=$1 AND owner=$2 FOR UPDATE',[owned.id,owned.owner]);
    const p=rows[0];
    if(!p?.snapshot)throw fail(409,'Hãy tạo trang trước.');
    const rotate=req.body.rotate===true;
    const id=rotate||!p.share_id?randomUUID():p.share_id;
    shareKey(id);
    const expires=shareExpiry(p,rotate);
    await client.query('UPDATE cms_pages SET share_id=$1,share_expires=$2 WHERE id=$3',[id,expires,p.id]);
    await client.query('COMMIT');
    res.json({success:true,expires});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}));
platform.delete('/share',route(async(req,res)=>{const p=await page(req);await req.db.query('UPDATE cms_pages SET share_id=NULL WHERE id=$1',[p.id]);res.json({success:true});}));
platform.delete('/page',route(async(req,res)=>{ const p=await page(req);await req.db.query('DELETE FROM cms_pages WHERE id=$1',[p.id]);res.json({success:true}); }));
platform.post('/media',route(async(req,res)=>{
  const p=await page(req); const match=String(req.body.dataUrl||'').match(/^data:(image\/(?:jpeg|png|webp)|audio\/(?:mpeg|wav|mp4|x-m4a));base64,([A-Za-z0-9+/=]+)$/); if(!match) throw fail(415,'Chỉ hỗ trợ JPG, PNG, WebP, MP3, WAV, M4A.'); const data=Buffer.from(match[2],'base64'); if(!data.length||data.length>(match[1].startsWith('image')?5:15)*1024*1024) throw fail(413,'File quá lớn.');
  if(!checkSignature(match[1],data))throw fail(415,'Nội dung file không khớp định dạng.');
  const client=await req.db.connect();const id=randomUUID();try{ await client.query('BEGIN');await client.query('SELECT id FROM cms_pages WHERE id=$1 FOR UPDATE',[p.id]); const size=await client.query('SELECT COALESCE(sum(octet_length(data)),0) AS bytes FROM cms_media WHERE page_id=$1',[p.id]);if(Number(size.rows[0].bytes)+data.length>300*1024*1024) throw fail(409,'Hết dung lượng 300 MiB.');await client.query('INSERT INTO cms_media VALUES($1,$2,$3,$4)',[id,p.id,match[1],data]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}res.json({source:`/api/platform/media/${id}`});
}));
async function sendMedia(req,res,id,content,pid){if(!/^[0-9a-f-]{36}$/.test(id)||!mediaIds(content).includes(id)) throw fail(404,'Không tìm thấy.');const {rows}=await req.db.query('SELECT mime,data FROM cms_media WHERE id=$1 AND page_id=$2',[id,pid]);if(!rows[0])throw fail(404,'Không tìm thấy.');const {data,mime}=rows[0];res.set({'Content-Type':mime,'Accept-Ranges':'bytes'});if(req.headers.range){const m=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);const start=m?Number(m[1]):-1,end=m&&m[2]?Math.min(Number(m[2]),data.length-1):data.length-1;if(start<0||start>=data.length||end<start){res.set('Content-Range',`bytes */${data.length}`);return res.sendStatus(416);}return res.status(206).set('Content-Range',`bytes ${start}-${end}/${data.length}`).send(data.subarray(start,end+1));}res.send(data);}
platform.get('/media/:id',route(async(req,res)=>{const p=await page(req);await sendMedia(req,res,req.params.id,{draft:p.draft,snapshot:p.snapshot},p.id);}));
platform.post('/viewer/:id/exchange',route(async(req,res)=>{ await limit(req.db,`viewer:${req.ip}`,60,60);const {rows}=await req.db.query('SELECT p.* FROM cms_pages p JOIN cms_users u ON p.owner=u.id WHERE p.share_id::text=$1 AND u.active AND (u.verified OR $2::boolean) AND (share_expires IS NULL OR share_expires>now())',[req.params.id,!emailVerificationRequired()]);if(!rows[0]||digest(req.body.key)!==digest(shareKey(req.params.id)))throw fail(404,'Liên kết không còn khả dụng.'); const key=token();await req.db.query("INSERT INTO cms_viewers VALUES($1,$2,$3,now()+interval '30 minutes')",[digest(key),req.params.id,JSON.stringify(rows[0].snapshot)]);setCookie(res,req,'cms_viewer',key,1800,`/api/platform/viewer/${req.params.id}`);res.json({success:true});}));
async function viewer(req){const {rows}=await req.db.query(`SELECT v.snapshot,p.id FROM cms_viewers v JOIN cms_pages p ON p.share_id=v.share_id JOIN cms_users u ON p.owner=u.id WHERE v.hash=$1 AND v.share_id::text=$2 AND v.expires>now() AND u.active AND (u.verified OR $3::boolean) AND (p.share_expires IS NULL OR p.share_expires>now())`,[digest(cookie(req,'cms_viewer')||''),req.params.id,!emailVerificationRequired()]);if(!rows[0])throw fail(404,'Liên kết không còn khả dụng.');return rows[0];}
platform.get('/viewer/:id/page',route(async(req,res)=>res.json((await viewer(req)).snapshot)));
platform.get('/viewer/:id/media/:asset',route(async(req,res)=>{const v=await viewer(req);await sendMedia(req,res,req.params.asset,v.snapshot,v.id);}));
platform.use((error,req,res,next)=>{if(res.headersSent)return next(error);if(error.status===429)res.set('Retry-After','900');res.status(error.status||503).json({message:error.status?error.message:'Dịch vụ tạm thời chưa khả dụng. Vui lòng thử lại.'});});
