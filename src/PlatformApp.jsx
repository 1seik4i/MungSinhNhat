import React, { useEffect, useRef, useState } from 'react';
import AccountPortal from './components/AccountPortal';
import BirthdayView from './App';
import LandingPage from './components/LandingPage';
import './platform.css';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useLocation, useNavigate, useParams } from 'react-router-dom';

async function api(path, method='GET', body) {
  const response=await fetch(`/api/platform${path}`,{method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.message),{status:response.status});return data;
}
function Viewer({id}) {
  const routeLocation=useLocation(),navigate=useNavigate();
  const [content,setContent]=useState(null),[error,setError]=useState('');
  useEffect(()=>{let alive=true;const load=async()=>{try{const key=new URLSearchParams(routeLocation.hash.slice(1)).get('key');if(key){await api(`/viewer/${id}/exchange`,'POST',{key});navigate({pathname:routeLocation.pathname,search:routeLocation.search,hash:''},{replace:true});}const data=await api(`/viewer/${id}/page`);const source=s=>s.replace(/\/api\/platform\/media\//g,`/api/platform/viewer/${id}/media/`);const transformed=JSON.parse(source(JSON.stringify(data)));if(alive){setContent(transformed);setError('');}}catch(e){if(alive){setContent(null);setError(e.message+' Hãy mở lại liên kết gốc hoặc liên hệ người gửi.');}}};load();const timer=setInterval(load,30000);const focus=()=>{if(document.visibilityState==='visible')load();};document.addEventListener('visibilitychange',focus);return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',focus);};},[id]);
  return content?<BirthdayView content={content}/>:<main className="portal"><h1>{error?'Liên kết chưa mở được':'Đang mở món quà…'}</h1><p role="alert">{error}</p>{error&&<button onClick={()=>location.reload()}>Thử lại</button>}</main>;
}
function Captcha({siteKey,onToken}) {
  const container=useRef(null);
  useEffect(()=>{if(!siteKey)return;let widget,alive=true;const render=()=>{if(alive&&window.turnstile&&container.current)widget=window.turnstile.render(container.current,{sitekey:siteKey,action:'register',callback:onToken,'expired-callback':()=>onToken('')});};let script=document.getElementById('turnstile-script');if(!script){script=document.createElement('script');script.id='turnstile-script';script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;document.head.append(script);}if(window.turnstile)render();else script.addEventListener('load',render);return()=>{alive=false;script.removeEventListener('load',render);if(widget!==undefined)window.turnstile?.remove(widget);};},[siteKey,onToken]);return <div ref={container}/>;
}
function SharedBirthdayRoute() {
  const { id } = useParams();
  return <Viewer key={id} id={id}/>;
}
function HomeRoute() {
  const {hash}=useLocation();
  const params=new URLSearchParams(hash.slice(1));
  return params.has('verify')||params.has('reset')
    ? <AccountPortal api={api} BirthdayView={BirthdayView} Captcha={Captcha}/>
    : <LandingPage/>;
}
const router = createBrowserRouter(createRoutesFromElements(<>
  <Route path="/" element={<HomeRoute/>}/>
  <Route path="/s/:id" element={<SharedBirthdayRoute/>}/>
  <Route path="*" element={<AccountPortal api={api} BirthdayView={BirthdayView} Captcha={Captcha}/>}/>
</>));
export default function PlatformApp() {
  return <RouterProvider router={router}/>;
}
