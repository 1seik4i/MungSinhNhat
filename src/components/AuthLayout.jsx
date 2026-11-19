import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Heart, Mail, Music2, ShieldCheck } from 'lucide-react';
import { PublicHeader } from './LandingPage';
import cake from '../assets/birthday-cake.webp';
import './welcome.css';

export function PasswordField({label='Mật khẩu',name='password',confirmation=false,autoComplete='current-password'}){
  const [visible,setVisible]=useState(false);
  return <label className="auth-label">{label}<div className="auth-password"><input name={name} type={visible?'text':'password'} autoComplete={autoComplete} minLength={12} maxLength={128} required placeholder={confirmation?'Nhập lại mật khẩu của bạn':'Nhập mật khẩu của bạn'}/><button type="button" className="auth-eye" aria-label={visible?`Ẩn ${label.toLowerCase()}`:`Hiện ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>;
}
export default function AuthLayout({title,description,message,children,register=false}){
  useEffect(()=>{const previous=document.title;document.title=`${title} · Xưởng sinh nhật`;return()=>{document.title=previous;};},[title]);
  return <div className="welcome-page auth-page"><PublicHeader/><main className="auth-layout"><aside className="auth-story"><p className="welcome-eyebrow">MỘT CHÚT TÂM Ý, THẬT NHIỀU NIỀM VUI</p><h1>Lời chúc của bạn.<br/><em>Niềm vui của ai đó.</em></h1><p>Một phong thư, một giai điệu, một bất ngờ nhỏ.<br/>Tạo món quà sinh nhật mang dấu ấn riêng của bạn.</p><div className="auth-illustration"><span>made with love ♡</span><img src={cake} alt="Bánh sinh nhật dành tặng người thương"/><div><Heart size={16}/> Dành riêng cho một người đặc biệt</div></div><div className="auth-story-icons"><span><Mail size={17}/> Lời chúc riêng</span><span><Music2 size={17}/> Nhạc yêu thích</span><span><ShieldCheck size={17}/> Chỉ bạn được sửa</span></div></aside><section className="auth-form-card" aria-labelledby="auth-heading"><Link className="auth-back" to="/"><ArrowLeft size={15}/> Về trang chủ</Link><span className="auth-card-icon"><Heart size={23}/></span><h2 id="auth-heading">{title}</h2><p className="auth-description">{description}</p>{message&&<p className="auth-notice" role="status">{message}</p>}{children}<div className="auth-card-footer"><Heart size={13}/>{register?'Chiếc thiệp đầu tiên đang chờ bạn.':'Thật vui vì bạn đã ở đây.'}</div></section></main><footer className="auth-footer">Xưởng sinh nhật · Một lời chúc, thật nhiều yêu thương.</footer></div>;
}
