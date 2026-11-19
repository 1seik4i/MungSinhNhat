import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import CreatorWorkspace from './CreatorWorkspace';
import SharePanel from './SharePanel';
import AccountPortal from './AccountPortal';
import LandingPage from './LandingPage';
import MemoriesEditor from './MemoriesEditor';
import MusicEditor from './MusicEditor';
import InteractiveCake from './InteractiveCake';
import BirthdaySurprises from './BirthdaySurprises';
import MiniGamesModal from './MiniGamesModal';
import { soundEngine } from '../utils/audioSynth';
import BirthdayPage from '../App';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:5173'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,history:dom.window.history,FormData:dom.window.FormData,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
window.scrollTo=()=>{};
globalThis.CustomEvent=dom.window.CustomEvent;
globalThis.requestAnimationFrame=callback=>queueMicrotask(callback);
globalThis.IntersectionObserver=class {observe(){} unobserve(){} disconnect(){}};
const {createRoot}=await import('react-dom/client');
const originalFetch=globalThis.fetch;
const content={cardData:{name:'An',birthDate:'2000-02-29',title:'Sinh nhật',message:'Chúc mừng'},surpriseCards:{gift:{image:'',title:'Quà',description:'Món quà',action:'Mở'},fortune:{image:'',title:'May mắn',description:'Lời chúc',action:'Mở'}},memories:[],tracks:[]};
const initial=()=>({id:'page-a',owner:'a',revision:1,source_revision:null,draft:structuredClone(content),snapshot:null,shareUrl:null});
test('ZIP birthday layout renders account content and keeps recipient controls read-only',()=>{
  const html=renderToStaticMarkup(<BirthdayPage content={content}/>);
  assert.match(html,/Made with/);assert.match(html,/for a joyful birthday celebration/);assert.match(html,/Chúc mừng sinh nhật An/);assert.match(html,/cake-section/);assert.match(html,/Góc Kỷ Niệm Polaroid/);
  assert.doesNotMatch(html,/Chỉnh sửa nội dung/);
  const owner=renderToStaticMarkup(<BirthdayPage content={content} onEdit={()=>{}} onShare={()=>{}}/>);
  assert.match(owner,/Chỉnh sửa nội dung/);assert.match(owner,/Chia sẻ/);
  assert.ok(html.indexOf('cake-section')<html.indexOf('Góc Kỷ Niệm Polaroid'));
});
const View=({content})=><div data-testid="preview">{content.cardData.name}</div>;
const button=text=>[...document.querySelectorAll('button,a')].find(b=>b.textContent===text||b.textContent.trim().endsWith(text)||b.textContent.replace(/\s*↗$/,'').trim()===text);
async function click(element){assert.ok(element,'button exists');await act(async()=>{element.click();});}
async function mount(component,entry='/app/edit'){const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const router=createMemoryRouter([{path:'*',element:component}],{initialEntries:[entry]});await act(async()=>root.render(<RouterProvider router={router}/>));const cleanup=async()=>{await act(async()=>root.unmount());router.dispose();host.remove();};cleanup.router=router;return cleanup;}

test('share panel copies the complete receiver link including its access key',async()=>{
  const page={...initial(),shareUrl:'https://example.test/s/card#key=receiver-access-key'};let copied;
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value;}}});
  const cleanup=await mount(<SharePanel page={page} qr="data:image/png;base64,test" run={fn=>fn()}/>);
  try{const input=document.querySelector('#birthday-share-link');assert.equal(input.readOnly,true);assert.equal(input.value,page.shareUrl);await click(button('Sao chép liên kết'));assert.equal(copied,page.shareUrl);assert.match(document.body.textContent,/Đã sao chép/);assert.equal(document.querySelector('a[download]').download,'sinh-nhat-qr.png');}
  finally{await cleanup();delete navigator.clipboard;}
});

test('share panel uses native sharing when available and ignores user cancellation',async()=>{
  const page={...initial(),shareUrl:'https://example.test/s/card#key=receiver-key'};let shared;
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{shared=data;throw Object.assign(new Error('Cancelled'),{name:'AbortError'});}});
  const cleanup=await mount(<SharePanel page={page} run={fn=>fn()}/>);
  try{await click(button('Chia sẻ'));assert.equal(shared.url,page.shareUrl);assert.match(shared.text,/An/);}
  finally{await cleanup();delete navigator.share;}
});

test('expired sharing hides the old link and QR download and offers a fresh code',async()=>{
  const page={...initial(),shareUrl:'https://example.test/s/old#key=expired'};let rotated=false;
  const cleanup=await mount(<SharePanel page={page} expired qr="data:image/png;base64,test" onRotate={()=>{rotated=true;}}/>);
  try{assert.equal(document.querySelector('#birthday-share-link').value,'');assert.equal(document.querySelector('a[download]'),null);assert.equal(button('Sao chép liên kết'),undefined);await click(button('Tạo QR mới — 3 ngày'));assert.equal(rotated,true);}
  finally{await cleanup();}
});

test('landing introduces birthday features and provides register/login routes',async()=>{
  const cleanup=await mount(<LandingPage/>,'/');
  try{assert.match(document.body.textContent,/Một chiếc thiệp nhỏ/);assert.match(document.body.textContent,/3 ngày/);assert.equal(document.querySelectorAll('a[href="/register"]').length>=3,true);await click(button('Đăng nhập'));assert.equal(cleanup.router.state.location.pathname,'/login');}finally{await cleanup();}
});

test('redesigned registration requires CAPTCHA and submits existing account API',async()=>{
  const calls=[];const api=async(path,method,body)=>{calls.push({path,method,body});if(path==='/config')return {siteKey:'test-site'};if(path==='/me')throw Object.assign(new Error('Sign in'),{status:401});if(path==='/register')return {message:'Đăng ký thành công thử nghiệm'};return {};};
  const CaptchaMock=({onToken})=><button type="button" onClick={()=>onToken('test-captcha')}>Xác nhận CAPTCHA thử nghiệm</button>;
  const cleanup=await mount(<AccountPortal api={api} BirthdayView={View} Captcha={CaptchaMock}/>,'/register');
  try{
    assert.equal(button('Tạo tài khoản').disabled,true);
    await click(button('Xác nhận CAPTCHA thử nghiệm'));
    for(const [name,value] of Object.entries({email:'new@example.test',password:'strong-password-123',confirmation:'strong-password-123'})){const input=document.querySelector(`[name="${name}"]`);await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new window.Event('input',{bubbles:true}));});}
    await click(button('Tạo tài khoản'));const registered=calls.find(c=>c.path==='/register');assert.equal(registered.body.captchaToken,'test-captcha');assert.equal(registered.body.email,'new@example.test');assert.equal(cleanup.router.state.location.pathname,'/login');assert.match(document.body.textContent,/Đăng ký thành công thử nghiệm/);
  }finally{await cleanup();}
});

test('password visibility toggle preserves input and login errors remain visible',async()=>{
  const api=async path=>{if(path==='/config')return {};if(path==='/me')throw Object.assign(new Error('Sign in'),{status:401});if(path==='/login')throw new Error('Email hoặc mật khẩu chưa đúng.');return {};};
  const cleanup=await mount(<AccountPortal api={api} BirthdayView={View} Captcha={()=>null}/>,'/login');
  try{const input=document.querySelector('[name="password"]');input.value='strong-password-123';await click(document.querySelector('[aria-label="Hiện mật khẩu"]'));assert.equal(input.type,'text');assert.equal(input.value,'strong-password-123');await click(document.querySelector('[aria-label="Ẩn mật khẩu"]'));assert.equal(input.type,'password');document.querySelector('[name="email"]').value='new@example.test';await click(button('Đăng nhập vào xưởng thiệp'));assert.match(document.body.textContent,/Email hoặc mật khẩu chưa đúng/);}finally{await cleanup();}
});

test('new account automatically creates its own page and opens editor',async()=>{
  const calls=[];let page;
  const api=async(path,method='GET')=>{calls.push([path,method]);if(path==='/config')return {};if(path==='/me')return {id:'a',email:'a@example.test',verified:true};if(path==='/page'&&method==='POST'){page=initial();return {};}if(path==='/page'&&!page)throw Object.assign(new Error('Not found'),{status:404});return page;};
  const cleanup=await mount(<AccountPortal api={api} BirthdayView={View} Captcha={()=>null}/>);
  try{assert.ok(calls.some(([p,m])=>p==='/page'&&m==='POST'));assert.match(document.body.textContent,/Nội dung cho thiệp sinh nhật/);assert.equal(document.querySelector('[aria-current="step"]').textContent.includes('Chỉnh sửa thiệp'),true);}finally{await cleanup();}
});

test('navbar saves edit before preview, then creates snapshot before QR without resetting editor',async()=>{
  let page=initial();const calls=[];
  const api=async(path,method='GET',body)=>{calls.push([path,method]);if(path==='/page'&&method==='PUT'){page={...page,draft:structuredClone(body.content),revision:page.revision+1};return {revision:page.revision};}if(path==='/page')return structuredClone(page);if(path==='/generate'){page.snapshot=structuredClone(page.draft);page.source_revision=page.revision;return {};}if(path==='/share'){page.shareUrl='https://example.test/s/test#key=test';page.share_expires=new Date(Date.now()+259200000).toISOString();return {};}return {};};
  globalThis.fetch=async(url,options={})=>({ok:true,json:()=>api(url.replace('/api/platform',''),options.method||'GET',options.body?JSON.parse(options.body):undefined)});
  const cleanup=await mount(<CreatorWorkspace initialPage={page} user={{id:'a',email:'a@example.test'}} api={api} BirthdayView={View} onLogout={async()=>{}}/>);
  try{
    const input=document.querySelector('[aria-label="Tên người nhận"]');
    await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'Bình');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
    await click(button('Xem thiệp'));
    assert.equal(cleanup.router.state.location.pathname,'/app/preview');
    assert.equal(page.draft.cardData.name,'Bình');assert.equal(document.querySelector('[data-testid="preview"]').textContent,'Bình');
    await click(button('Tạo QR'));await click(button('Tạo thiệp và QR'));
    assert.equal(cleanup.router.state.location.pathname,'/app/qr');
    assert.equal(page.snapshot.cardData.name,'Bình');assert.ok(calls.findIndex(([p])=>p==='/generate')<calls.findIndex(([p])=>p==='/share'));
    await click(button('Chỉnh sửa thiệp'));assert.equal(document.querySelector('[aria-label="Tên người nhận"]').value,'Bình');
    await act(async()=>{await cleanup.router.navigate(-1);});
    assert.equal(cleanup.router.state.location.pathname,'/app/qr');
    await act(async()=>{await cleanup.router.navigate(1);});
    assert.equal(cleanup.router.state.location.pathname,'/app/edit');
  }finally{await cleanup();globalThis.fetch=originalFetch;}
});

test('failed save keeps editor and unsaved text, without opening preview',async()=>{
  const page=initial();const api=async()=>structuredClone(page);
  globalThis.fetch=async()=>({ok:false,json:async()=>({message:'Lưu thất bại thử nghiệm'})});
  const cleanup=await mount(<CreatorWorkspace initialPage={page} user={{id:'a',email:'a@example.test'}} api={api} BirthdayView={View} onLogout={async()=>{}}/>);
  const originalError=console.error;console.error=()=>{};
  try{
    const input=document.querySelector('[aria-label="Tên người nhận"]');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'Chưa lưu');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
    await click(button('Xem thiệp'));assert.equal(document.querySelector('[data-testid="preview"]'),null);assert.equal(input.value,'Chưa lưu');assert.match(document.body.textContent,/Lưu thất bại thử nghiệm/);
  }finally{console.error=originalError;await cleanup();globalThis.fetch=originalFetch;}
});

test('gift editor adds edits deletes gifts and persists account-specific content',async()=>{
  let page=initial();const api=async(path,method='GET',body)=>{if(path==='/page'&&method==='PUT'){page={...page,draft:structuredClone(body.content),revision:page.revision+1};return {revision:page.revision};}return structuredClone(page);};
  globalThis.fetch=async(url,options={})=>({ok:true,json:()=>api(url.replace('/api/platform',''),options.method||'GET',options.body?JSON.parse(options.body):undefined)});
  const cleanup=await mount(<CreatorWorkspace initialPage={page} user={{id:'a',email:'a@example.test'}} api={api} BirthdayView={View} onLogout={async()=>{}}/>);
  try{
    assert.equal(document.querySelectorAll('[aria-label^="Tên quà "]').length,8);
    await click(button('Thêm quà'));
    const title=document.querySelector('[aria-label="Tên quà 9"]');
    await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(title,'Vé du lịch riêng');title.dispatchEvent(new window.Event('input',{bubbles:true}));});
    await click(button('Xem thiệp'));assert.equal(page.draft.giftRewards.length,9);assert.equal(page.draft.giftRewards[8].title,'Vé du lịch riêng');
    await click(button('Chỉnh sửa thiệp'));await click(document.querySelector('[aria-label="Xóa quà 9"]'));await click(button('Xem thiệp'));assert.equal(page.draft.giftRewards.length,8);assert.equal(getDefaultName(), 'Voucher Trà Sữa Full Topping');
  }finally{await cleanup();globalThis.fetch=originalFetch;}
  function getDefaultName(){return page.draft.giftRewards[0].title;}
});

test('fortune editing is absent and legacy empty fortune list still shows system game',async()=>{
 const page=initial();const cleanup=await mount(<CreatorWorkspace initialPage={page} user={{id:'a',email:'a@example.test'}} api={async()=>page} BirthdayView={View} onLogout={async()=>{}}/>);
 try{assert.equal(document.querySelector('[aria-label="Chỉnh mục Gieo quẻ"]'),null);assert.equal(button('Thêm quẻ'),undefined);assert.equal(document.querySelector('[aria-label="Tên quẻ 1"]'),null);}finally{await cleanup();}
 const html=renderToStaticMarkup(<BirthdayPage content={{...content,fortunes:[]}}/>);assert.match(html,/alt="Bánh quy may mắn"/);assert.match(html,/100 quẻ/);
});

test('memory editor uploads multiple photos then edits reorders deletes and restores a memory',async()=>{
  let current=[];const status=[];const uploads=[];
  function Album(){const [list,setList]=React.useState([]);current=list;return <MemoriesEditor memories={list} onChange={setList} onUploadingChange={v=>status.push(v)} uploadImage={async file=>{uploads.push(file.name);return `/api/platform/media/${uploads.length}`;}}/>;}
  const cleanup=await mount(<Album/>);
  try{
    assert.match(document.body.textContent,/Thêm những khoảnh khắc đáng nhớ/);
    const input=document.querySelector('[aria-label="Chọn nhiều ảnh kỷ niệm"]');
    await act(async()=>{Object.defineProperty(input,'files',{value:[new window.File(['test'],'Da Lat.jpg',{type:'image/jpeg'}),new window.File(['test'],'Bien.png',{type:'image/png'})],configurable:true});input.dispatchEvent(new window.Event('change',{bubbles:true}));});
    assert.equal(current.length,2);assert.deepEqual(status,[true,false]);assert.equal(current[0].title,'Da Lat');
    const caption=document.querySelector('[aria-label="Lời nhắn ảnh kỷ niệm"]');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(caption,'Chuyến đi thật đáng nhớ');caption.dispatchEvent(new window.Event('input',{bubbles:true}));});
    await click(document.querySelector('[aria-label="Đưa ảnh xuống sau"]'));assert.equal(current[1].caption,'Chuyến đi thật đáng nhớ');assert.equal(current[0].title,'Bien');
    await click(button('Xóa ảnh này'));assert.equal(current.length,1);await click(button('Hoàn tác xóa ảnh'));assert.equal(current.length,2);assert.equal(current[1].caption,'Chuyến đi thật đáng nhớ');
    await click(button('Xóa ảnh này'));await click(button('Xóa ảnh này'));assert.equal(current.length,0);assert.match(document.body.textContent,/Thêm những khoảnh khắc đáng nhớ/);
  }finally{await cleanup();}
});

test('memory upload rejects invalid file and keeps successful photos from a partial batch',async()=>{
  let current=[];const uploaded=[];
  function Album(){const [list,setList]=React.useState([]);current=list;return <MemoriesEditor memories={list} onChange={setList} uploadImage={async file=>{uploaded.push(file.name);if(file.name==='bad.png')throw new Error('Lỗi mạng thử nghiệm');return '/api/platform/media/test';}}/>;}
  const cleanup=await mount(<Album/>);
  try{const input=document.querySelector('[aria-label="Chọn nhiều ảnh kỷ niệm"]');await act(async()=>{Object.defineProperty(input,'files',{value:[new window.File(['test'],'notes.txt',{type:'text/plain'}),new window.File(['test'],'bad.png',{type:'image/png'}),new window.File(['test'],'good.jpg',{type:'image/jpeg'})],configurable:true});input.dispatchEvent(new window.Event('change',{bubbles:true}));});assert.equal(current.length,1);assert.equal(current[0].title,'good');assert.deepEqual(uploaded,['bad.png','good.jpg']);assert.match(document.body.textContent,/Chỉ nhận JPG/);assert.match(document.body.textContent,/Lỗi mạng thử nghiệm/);}finally{await cleanup();}
});

test('memory upload shows progress and disables editing until upload is finished',async()=>{
  let finish;const pending=new Promise(resolve=>{finish=resolve;});
  function Album(){const [list,setList]=React.useState([]);return <MemoriesEditor memories={list} onChange={setList} uploadImage={()=>pending}/>;}
  const cleanup=await mount(<Album/>);
  try{const input=document.querySelector('[aria-label="Chọn nhiều ảnh kỷ niệm"]');await act(async()=>{Object.defineProperty(input,'files',{value:[new window.File(['test'],'test.jpg',{type:'image/jpeg'})],configurable:true});input.dispatchEvent(new window.Event('change',{bubbles:true}));});assert.match(document.body.textContent,/Đang tải ảnh 1\/1/);assert.equal(document.querySelector('.memories-fields').disabled,true);await act(async()=>{finish('/api/platform/media/test');await pending;});assert.equal(document.querySelector('.memories-fields').disabled,false);assert.match(document.body.textContent,/Đã thêm 1 ảnh/);}finally{await cleanup();}
});

test('editor sections keep input and support keyboard save and required-field guidance',async()=>{
  let page=initial();page.draft.cardData.birthDate='';let saves=0;
  const api=async()=>structuredClone(page);
  globalThis.fetch=async(url,options={})=>{const body=JSON.parse(options.body);saves++;page={...page,draft:body.content,revision:page.revision+1};return {ok:true,json:async()=>({revision:page.revision})};};
  const cleanup=await mount(<CreatorWorkspace initialPage={page} user={{id:'a',email:'a@example.test'}} api={api} BirthdayView={View} onLogout={async()=>{}}/>);
  try{
    assert.match(document.querySelector('.editor-readiness').textContent,/ngày sinh/);
    const input=document.querySelector('[aria-label="Tên người nhận"]');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'Tên mới');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
    await click(document.querySelector('[aria-label="Chỉnh mục Ảnh kỷ niệm"]'));assert.equal(document.getElementById('editor-panel-basics').hidden,true);assert.equal(document.getElementById('editor-panel-photos').hidden,false);
    await click(document.querySelector('[aria-label="Chỉnh mục Thông tin thiệp"]'));assert.equal(input.value,'Tên mới');await click(button('Bổ sung'));assert.equal(document.activeElement.name,'birthDate');
    const key=new window.KeyboardEvent('keydown',{key:'s',ctrlKey:true,bubbles:true,cancelable:true});await act(async()=>window.dispatchEvent(key));assert.equal(key.defaultPrevented,true);assert.equal(saves,1);assert.equal(page.draft.cardData.name,'Tên mới');assert.match(document.querySelector('.editor-savebar').textContent,/Đã lưu nội dung/);
  }finally{await cleanup();globalThis.fetch=originalFetch;}
});

test('music editor reorders removes restores and edits without overwriting other tracks',async()=>{
  let current=[];function Music(){const [list,setList]=React.useState([{id:'a',name:'Bài A',type:'url',source:'https://example.test/a.mp3'},{id:'b',name:'Bài B',type:'url',source:'https://example.test/b.mp3'}]);current=list;return <MusicEditor tracks={list} onChange={setList} uploadAudio={async()=>''} onUploadingChange={()=>{}}/>;}
  const cleanup=await mount(<Music/>);
  try{await click(document.querySelector('[aria-label="Đưa bài 1 xuống sau"]'));assert.equal(current[0].id,'b');await click(document.querySelector('[aria-label="Gỡ bài hát 1"]'));assert.equal(current.length,1);await click(button('Hoàn tác gỡ bài hát'));assert.equal(current[0].id,'b');assert.equal(current.length,2);const input=document.querySelector('[aria-label="Tên bài hát 1"]');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'Nhạc yêu thích');input.dispatchEvent(new window.Event('input',{bubbles:true}));});assert.equal(current[0].name,'Nhạc yêu thích');assert.equal(current[1].name,'Bài A');}finally{await cleanup();}
});

test('blowing candles reveals both gift and fortune actions immediately',async()=>{
  const puff=soundEngine.playCandlePuff,sparkle=soundEngine.playSparkle;
  soundEngine.playCandlePuff=()=>{};soundEngine.playSparkle=()=>{};
  let gifts=0,fortunes=0;const cleanup=await mount(<InteractiveCake onOpenGift={()=>gifts++} onOpenFortune={()=>fortunes++}/>);
  try{assert.equal(button('🎁 Quay quà sinh nhật'),undefined);await click(button('Thổi Tắt Nến'));await click(button('🎁 Quay quà sinh nhật'));await click(button('🥠 Gieo quẻ may mắn'));assert.equal(gifts,1);assert.equal(fortunes,1);}finally{await cleanup();soundEngine.playCandlePuff=puff;soundEngine.playSparkle=sparkle;}
});

test('blank legacy headings do not hide gift and fortune cards',()=>{
 const html=renderToStaticMarkup(<BirthdaySurprises cardSettings={{gift:{title:'',description:'',action:''}}}/>);assert.match(html,/Hộp quà sinh nhật/);assert.match(html,/100 quẻ Quan Âm/);
});

test('fortune draw uses sourced system records when database fetch fails',async()=>{
 const sparkle=soundEngine.playSparkle;soundEngine.playSparkle=()=>{};globalThis.fetch=async()=>{throw new Error('test offline');};
 const cleanup=await mount(<MiniGamesModal isOpen onClose={()=>{}} fortunes={[{title:'Injected fortune'}]}/>);
 try{await click(button('Bẻ Bánh Khám Phá Quẻ May'));assert.match(document.body.textContent,/Diễn giải tiếng Việt của ứng dụng/);assert.doesNotMatch(document.body.textContent,/Injected fortune/);const source=document.querySelector('a[href^="https://www.ctc.org.hk/chim/"]');assert.ok(source);assert.match(document.body.textContent,/Quẻ \d{3}/);}finally{await cleanup();globalThis.fetch=originalFetch;soundEngine.playSparkle=sparkle;}
});

test('gender switch persists choice without overwriting custom wishes and changes default copy',async()=>{
 const data=initial();const cleanup=await mount(<CreatorWorkspace initialPage={data} user={{id:'a',email:'a@example.test'}} api={async()=>data} BirthdayView={View} onLogout={async()=>{}}/>);
 try{const wish=document.querySelector('[aria-label="Lời chúc sinh nhật"]');const original=wish.value;await click(document.querySelector('input[value="male"]'));assert.equal(wish.value,original);await click(document.querySelector('input[value="female"]'));assert.equal(wish.value,original);}finally{await cleanup();}
 const male=renderToStaticMarkup(<BirthdayPage content={{...content,cardData:{...content.cardData,gender:'male'}}}/>);const female=renderToStaticMarkup(<BirthdayPage content={{...content,cardData:{...content.cardData,gender:'female'}}}/>);
 assert.match(male,/Ngày của anh/);assert.match(female,/Ngày của em/);assert.match(male,/dành cho anh/);assert.match(female,/dành cho em/);
});
