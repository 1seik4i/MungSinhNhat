import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthLayout, { PasswordField } from './AuthLayout';

export default function AuthScreen({user,purpose,mode,busy,message,config,captcha,setCaptcha,submit,run,api,loadAccount,logout,setMessage,Captcha}) {
  const registering=mode==='register'&&!purpose;
  const title=user&&!purpose?(user.verified?'Chưa mở được thiệp':'Xác minh email của bạn'):purpose==='verify'?'Xác minh email':purpose==='reset'?'Đặt mật khẩu mới':registering?'Bắt đầu một điều dễ thương':mode==='login'?'Chào bạn trở lại!':mode==='reset'?'Quên mật khẩu rồi à?':'Gửi lại email xác minh';
  return <AuthLayout title={title} register={registering} message={message} description={registering?'Tạo tài khoản để tự tay gói ghém món quà sinh nhật.':mode==='login'&&!purpose?'Đăng nhập để tiếp tục viết nên chiếc thiệp của bạn.':'Làm theo hướng dẫn để tiếp tục vào xưởng thiệp.'}>
    {user&&!purpose?<div className="auth-recovery">{!user.verified&&<button className="welcome-button" disabled={busy} onClick={()=>run(async()=>{const r=await api('/email','POST',{email:user.email,purpose:'verify'});setMessage(r.message);})}>Gửi lại email xác minh</button>}<button className="welcome-button" disabled={busy} onClick={()=>run(loadAccount)}>Thử lại</button><button className="auth-text-button" onClick={()=>run(logout)}>Đăng xuất</button></div>:<>
      {!purpose&&['login','register'].includes(mode)&&<nav className="auth-tabs" aria-label="Tài khoản">{['login','register'].map(m=><NavLink key={m} to={m==='login'?'/login':'/register'} className={({isActive})=>isActive?'is-active':''} aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault();else setMessage('');}}>{m==='login'?'Đăng nhập':'Đăng ký'}</NavLink>)}</nav>}
      <form onSubmit={submit} className="auth-form" key={`${mode}:${purpose}`} aria-label={registering?'Đăng ký tài khoản':'Đăng nhập hoặc xác minh tài khoản'}>
        {!purpose&&<label className="auth-label">Email<input name="email" type="email" autoComplete="email" placeholder="ban@example.com" maxLength={254} required/></label>}
        {(purpose==='reset'||(!purpose&&['login','register'].includes(mode)))&&<PasswordField autoComplete={mode==='login'&&!purpose?'current-password':'new-password'}/>}
        {registering&&<><p className="auth-hint">Mật khẩu từ 12 đến 128 ký tự.</p><PasswordField label="Nhập lại mật khẩu" name="confirmation" confirmation autoComplete="new-password"/><div className="auth-captcha">{config.siteKey?<Captcha siteKey={config.siteKey} onToken={setCaptcha}/>:<p role="status">CAPTCHA chưa sẵn sàng. Vui lòng thử lại sau.</p>}</div></>}
        {mode==='login'&&!purpose&&config.emailEnabled&&<Link className="auth-forgot" to="/forgot-password">Quên mật khẩu?</Link>}
        <button className="welcome-button auth-submit" disabled={busy||(registering&&!captcha)}>{busy?'Đang xử lý…':registering?'Tạo tài khoản':mode==='login'&&!purpose?'Đăng nhập vào xưởng thiệp':purpose==='verify'?'Xác minh email':'Tiếp tục'}<span aria-hidden="true">↗</span></button>
      </form>
      {!purpose&&['login','register'].includes(mode)&&<p className="auth-switch">{registering?'Đã có tài khoản?':'Chưa có tài khoản?'} <Link to={registering?'/login':'/register'} onClick={()=>setMessage('')}>{registering?'Đăng nhập':'Đăng ký ngay'}</Link></p>}
      {config.emailEnabled&&config.emailVerificationRequired&&<Link className="auth-forgot" to="/verify-email">Gửi lại email xác minh</Link>}
    </>}
  </AuthLayout>;
}
