import {test,expect} from '@playwright/test';
test('landing and login navigation',async({page},testInfo)=>{
 await page.route('**/api/platform/**',route=>route.fulfill({status:route.request().url().endsWith('/me')?401:200,json:{}}));
 await page.goto('/');await expect(page.getByRole('heading',{name:/Một chiếc thiệp nhỏ/})).toBeVisible();await page.screenshot({path:testInfo.outputPath('landing.png'),fullPage:true});await page.getByRole('link',{name:'Đăng nhập',exact:true}).click();await expect(page.getByLabel('Email',{exact:true})).toBeVisible();await page.screenshot({path:testInfo.outputPath('login.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('editor keeps content across sections and savebar is fixed (mock API)',async({page})=>{
 let data={id:'test-page',revision:1,draft:{cardData:{name:'An',birthDate:'2000-01-01',title:'Sinh nhật',message:'Chúc bạn vui vẻ'},surpriseCards:{gift:{title:'Quà',description:'',action:''},fortune:{title:'Quẻ',description:'',action:''}},tracks:[],memories:[]}};
 await page.route('**/api/platform/**',route=>{const url=route.request().url();return route.fulfill({json:url.endsWith('/me')?{id:'a',email:'a@example.test',verified:true}:url.endsWith('/page')?data:{}});});
 await page.goto('/app/edit');await page.getByLabel('Tên người nhận',{exact:true}).fill('Bình');await page.getByRole('tab',{name:'Chỉnh mục Ảnh kỷ niệm'}).click();await expect(page.getByText('Thêm những khoảnh khắc đáng nhớ')).toBeVisible();await page.getByRole('tab',{name:'Chỉnh mục Thông tin thiệp'}).click();await expect(page.getByLabel('Tên người nhận',{exact:true})).toHaveValue('Bình');await expect(page.locator('.editor-savebar')).toHaveCSS('position','fixed');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('real API catalogue, guest guard, CSRF and Swagger contract',async({request})=>{
 const root='http://localhost:3002';const spec=await request.get(root+'/api/openapi.json');expect(spec.ok()).toBeTruthy();expect((await spec.json()).paths['/api/platform/share'].post).toBeTruthy();
 const me=await request.get(root+'/api/platform/me');expect(me.status()).toBe(401);
 const csrf=await request.post(root+'/api/platform/share',{headers:{Origin:'https://invalid.example'},data:{}});expect(csrf.status()).toBe(403);
 const catalog=await request.get(root+'/api/platform/fortune-catalog');expect(catalog.ok()).toBeTruthy();expect((await catalog.json()).data).toHaveLength(100);
});
test('Swagger UI executes catalogue request against real backend',async({page})=>{
 await page.goto('http://localhost:3002/api/docs/');
 const operation=page.locator('.opblock').filter({has:page.locator('[data-path="/api/platform/fortune-catalog"]')});
 await operation.locator('.opblock-summary').click();await operation.getByRole('button',{name:'Try it out'}).click();await operation.getByRole('button',{name:'Execute',exact:true}).click();await expect(operation.locator('.live-responses-table .response-col_status:not(.col_header)')).toContainText('200');
});
test('saved card generates downloadable QR and recipient opens without login (mock API)',async({page},testInfo)=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copiedLink=value;}}});});
 const data={id:'test-page',revision:1,source_revision:null,shareUrl:null,draft:{cardData:{name:'An',birthDate:'2000-01-01',title:'Sinh nhật',message:'Chúc bạn vui vẻ'},surpriseCards:{gift:{title:'Quà',description:'',action:''},fortune:{title:'Quẻ',description:'',action:''}},tracks:[],memories:[]}};
 const calls=[];
 await page.route('**/api/platform/**',async route=>{const path=new URL(route.request().url()).pathname;calls.push(path);
 if(path.endsWith('/generate'))data.source_revision=data.revision;
 if(path.endsWith('/share')){data.shareUrl='http://localhost:5175/s/11111111-1111-1111-1111-111111111111#key=fake-test-token';data.share_expires=new Date(Date.now()+259200000).toISOString();}
 await route.fulfill({json:path.endsWith('/me')?{id:'a',email:'a@example.test',verified:true}:path.includes('/viewer/')&&path.endsWith('/page')?data.draft:path.endsWith('/page')?data:{}});
 });
 await page.goto('/app/qr');await page.getByRole('button',{name:'Tạo thiệp và QR',exact:true}).click();await expect(page.getByRole('link',{name:'Tải QR PNG'})).toHaveAttribute('href',/^data:image\/png;base64,/);expect(calls.findIndex(p=>p.endsWith('/generate'))).toBeLessThan(calls.findIndex(p=>p.endsWith('/share')));
 await expect(page.getByLabel('Liên kết chia sẻ thiệp')).toHaveValue(data.shareUrl);await page.getByRole('button',{name:'Sao chép liên kết',exact:true}).click();await expect(page.getByText('Đã sao chép',{exact:true})).toBeVisible();expect(await page.evaluate(()=>window.__copiedLink)).toBe(data.shareUrl);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:testInfo.outputPath('share-panel.png'),fullPage:true});
 await page.goto(data.shareUrl);await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toHaveCount(0);await expect(page.getByText('Chúc bạn vui vẻ').first()).toBeAttached();
});
