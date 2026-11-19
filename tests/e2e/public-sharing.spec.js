import {test,expect} from '@playwright/test';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {pool} from '../../server/db.js';
import {defaults} from '../../server/platform.js';

test.afterAll(async()=>{await pool?.end();});

test('real shared QR link opens directly in a fresh browser without account login',async({browser,page,baseURL})=>{
 test.setTimeout(60000);
 const owner=randomUUID(),id=randomUUID(),session=randomBytes(32).toString('base64url');let shareId,guest,badGuest;
 const content=structuredClone(defaults);content.cardData={...content.cardData,name:'Người nhận QR',birthDate:'2000-01-01',message:'Mở thiệp trực tiếp không cần đăng nhập.'};
 const media=randomUUID();content.memories=[{id:'memory',title:'Kỷ niệm',date:'Hôm nay',caption:'Ảnh riêng của thiệp',image:`/api/platform/media/${media}`}];
 try{
  // Seed only an isolated test owner/session; all publishing and receiver calls use the real API.
  await pool.query('INSERT INTO cms_users(id,email,password,verified) VALUES($1,$2,$3,false)',[owner,`qr-e2e-${owner}@example.test`,'unusable-test-password']);
  await pool.query("INSERT INTO cms_sessions(hash,user_id,expires) VALUES($1,$2,now()+interval '1 hour')",[createHash('sha256').update(session).digest('hex'),owner]);
  await pool.query('INSERT INTO cms_pages(id,owner,draft) VALUES($1,$2,$3)',[id,owner,JSON.stringify(content)]);
  await pool.query('INSERT INTO cms_media VALUES($1,$2,$3,$4)',[media,id,'image/png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')]);
  await page.context().addCookies([{name:'cms_session',value:session,url:baseURL}]);
  await page.goto('/app/qr');await page.getByRole('button',{name:'Tạo thiệp và QR',exact:true}).click();
  const input=page.getByLabel('Liên kết chia sẻ thiệp');await expect(input).toHaveValue(/\/s\/[0-9a-f-]+#key=.+/);
  const shareUrl=await input.inputValue();shareId=new URL(shareUrl).pathname.split('/').pop();
  expect(shareUrl.startsWith(baseURL+'/s/')).toBeTruthy();await expect(page.getByRole('link',{name:'Tải QR PNG'})).toHaveAttribute('href',/^data:image\/png;base64,/);
  guest=await browser.newContext();const receiver=await guest.newPage();const requests=[];receiver.on('request',r=>requests.push(new URL(r.url()).pathname));
  await receiver.goto(shareUrl);await expect(receiver.getByText(content.cardData.message).first()).toBeAttached();
  await expect(receiver).toHaveURL(baseURL+'/s/'+shareId);
  await expect(receiver.getByRole('button',{name:'Đăng nhập',exact:true})).toHaveCount(0);
  await expect(receiver.getByRole('button',{name:'Chỉnh sửa nội dung',exact:true})).toHaveCount(0);
  expect(requests.some(path=>/\/api\/platform\/(me|login|register)$/.test(path))).toBeFalsy();
  expect((await guest.cookies()).some(cookie=>cookie.name==='cms_session')).toBeFalsy();
  const receiverApi=guest.request;
  expect((await receiverApi.get(baseURL+'/api/platform/me')).status()).toBe(401);
  expect((await receiverApi.put(baseURL+'/api/platform/page',{headers:{Origin:baseURL},data:{revision:1,content}})).status()).toBe(401);
  expect((await receiverApi.get(`${baseURL}/api/platform/viewer/${shareId}/media/${media}`)).status()).toBe(200);
  await receiver.reload();await expect(receiver.getByText(content.cardData.message).first()).toBeAttached();
  badGuest=await browser.newContext();const invalid=await badGuest.newPage();await invalid.goto(shareUrl.replace(/#key=.*/,'#key=invalid'));
  await expect(invalid.getByRole('heading',{name:'Liên kết chưa mở được'})).toBeVisible();expect(new URL(invalid.url()).pathname).toBe('/s/'+shareId);
  await pool.query("UPDATE cms_pages SET share_expires=now()-interval '1 second' WHERE id=$1",[id]);
  await receiver.reload();await expect(receiver.getByRole('heading',{name:'Liên kết chưa mở được'})).toBeVisible();
  expect((await receiverApi.get(`${baseURL}/api/platform/viewer/${shareId}/media/${media}`)).status()).toBe(404);
 }finally{
  await guest?.close();await badGuest?.close();
  await pool.query('DELETE FROM cms_viewers WHERE share_id IN (SELECT share_id FROM cms_pages WHERE id=$1)',[id]);
  await pool.query('DELETE FROM cms_pages WHERE id=$1',[id]);
  await pool.query('DELETE FROM cms_sessions WHERE user_id=$1',[owner]);
  await pool.query('DELETE FROM cms_users WHERE id=$1',[owner]);
 }
});
