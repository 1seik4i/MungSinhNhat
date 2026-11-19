import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import CreatorWorkspace from './CreatorWorkspace';
import AuthScreen from './AuthScreen';

export default function AccountPortal({api,BirthdayView,Captcha}) {
  const [user,setUser]=useState(null),[page,setPage]=useState(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const location=useLocation(),navigate=useNavigate();
  const authPaths={login:'/login',register:'/register',reset:'/forgot-password',verify:'/verify-email'};
  const mode=Object.keys(authPaths).find(key=>authPaths[key]===location.pathname)||'login';
  const setMode=next=>navigate(authPaths[next],{replace:true});
  const [config,setConfig]=useState({}),[captcha,setCaptcha]=useState('');
  const params=new URLSearchParams(location.hash.slice(1));
  const purpose=params.has('verify')?'verify':params.has('reset')?'reset':null;
  const loadAccount=useCallback(async()=>{
    try {
      const me=await api('/me');setUser(me);
      if(me.verified){
        try { setPage(await api('/page')); }
        catch(e){if(e.status!==404)throw e;await api('/page','POST');setPage(await api('/page'));}
      }
    } catch(e){if(e.status!==401)throw e;setUser(null);setPage(null);}
  },[api]);
  useEffect(()=>{let active=true;Promise.all([api('/config').then(c=>{if(active)setConfig(c);}),loadAccount()]).catch(e=>{if(active)setMessage(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[api,loadAccount]);
  async function run(fn){if(busy)return;setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  async function logout(){await api('/logout','POST');setPage(null);setUser(null);setMessage('');setMode('login');}
  async function submit(event){event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));await run(async()=>{
    if(purpose){const result=await api('/consume','POST',{purpose,key:params.get(purpose),password:data.password});navigate('/login',{replace:true});setMode('login');setMessage(result.message);}
    else if(mode==='login'){await api('/login','POST',data);await loadAccount();}
    else if(mode==='register'){const result=await api('/register','POST',{...data,captchaToken:captcha});setMessage(result.message);setMode('login');}
    else {const result=await api('/email','POST',{...data,purpose:mode==='reset'?'reset':'verify'});setMessage(result.message);}
  });window.turnstile?.reset();setCaptcha('');}
  if(loading)return <main className="portal" role="status">Đang mở xưởng thiệp của bạn…</main>;
  if(user?.verified&&page&&!purpose&&!/^\/app\/(edit|preview|qr)$/.test(location.pathname))return <Navigate to="/app/edit" replace/>;
  if(user?.verified&&page&&!purpose)return <CreatorWorkspace key={`${user.id}:${page.id}`} initialPage={page} user={user} api={api} BirthdayView={BirthdayView} onLogout={logout} onPageDeleted={loadAccount}/>;
  return <AuthScreen user={user} purpose={purpose} mode={mode} busy={busy} message={message} config={config} captcha={captcha} setCaptcha={setCaptcha} submit={submit} run={run} api={api} loadAccount={loadAccount} logout={logout} setMessage={setMessage} Captcha={Captcha}/>;
}
