import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye, Gift, LogOut, PencilLine, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import AccountEditor from './AccountEditor';
import SharePanel from './SharePanel';
import { NavLink } from 'react-router-dom';
import { creatorPaths, useCreatorNavigation } from '../hooks/useCreatorNavigation';

export default function CreatorWorkspace({initialPage,user,api,BirthdayView,onLogout,onPageDeleted}) {
  const [page,setPage]=useState(initialPage);
  const [busy,setBusy]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [message,setMessage]=useState('');
  const [qr,setQr]=useState('');
  const [now,setNow]=useState(Date.now());
  const editor=useRef(null);
  const expired=page.share_expires && Date.parse(page.share_expires)<=now;
  const unpublished=page.source_revision!==page.revision;

  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{let active=true;setQr('');if(page.shareUrl)QRCode.toDataURL(page.shareUrl,{width:512,margin:4,errorCorrectionLevel:'M'}).then(url=>{if(active)setQr(url);}).catch(()=>{if(active)setMessage('Không tạo được ảnh QR. Vui lòng thử lại.');});return()=>{active=false;};},[page.shareUrl]);
  const load=async()=>{const next=await api('/page');setPage(next);return next;};
  const {tab,navigate}=useCreatorNavigation({editor,load,setBusy,setMessage});
  async function run(fn){if(busy)return;setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  async function publish(rotate=false){
    await editor.current?.prepare();
    const saved=await load();
    if(saved.source_revision!==saved.revision)await api('/generate','POST',{revision:saved.revision});
    await api('/share','POST',{rotate});
    await load();setNow(Date.now());setMessage(rotate?'Đã tạo QR mới. Mã cũ đã ngừng hoạt động.':'Thiệp đã sẵn sàng để gửi. QR có hiệu lực trong 3 ngày.');
  }
  const steps=[{id:'edit',label:'Chỉnh sửa thiệp',Icon:PencilLine},{id:'preview',label:'Xem thiệp',Icon:Eye},{id:'qr',label:'Tạo QR',Icon:QrCode}];
  return <div className="creator-workspace">
    <nav className="creator-nav" aria-label="Các bước tạo thiệp sinh nhật">
      <div className="creator-brand"><Gift size={23}/><span>Xưởng sinh nhật</span></div>
      <div className="creator-steps">{steps.map(({id,label,Icon},i)=><NavLink key={id} to={creatorPaths[id]} aria-current="step" className={({isActive})=>isActive?'is-active':''} aria-disabled={busy} onClick={event=>{if(busy)event.preventDefault();}}><span className="step-number">{i+1}</span><Icon size={18}/><span>{label}</span></NavLink>)}</div>
      <div className="creator-account"><span title={user.email}>{user.email}</span><button type="button" disabled={busy} onClick={()=>run(async()=>{if(editor.current?.isUploading?.())throw new Error('Đang tải ảnh. Vui lòng chờ hoàn tất trước khi đăng xuất.');if(editor.current?.isDirty()&&!confirm('Bạn còn thay đổi chưa lưu. Đăng xuất và bỏ thay đổi?'))return;await onLogout();})}><LogOut size={17}/><span>Đăng xuất</span></button></div>
    </nav>
    <div className="creator-status" aria-live="polite"><span><Check size={15}/>{busy?'Đang xử lý…':dirty?'Có thay đổi chưa lưu — chuyển bước sẽ lưu tự động.':'Nội dung đã được lưu riêng trong tài khoản của bạn.'}</span>{tab==='edit'&&<button disabled={busy} onClick={()=>navigate('preview')}>Lưu và xem thiệp <Eye size={16}/></button>}{tab==='preview'&&<button disabled={busy} onClick={()=>navigate('qr')}>Tiếp tục tạo QR <QrCode size={16}/></button>}</div>
    {message&&<div className="creator-notice" role="status">{message}</div>}
    <div className="creator-editor" hidden={tab!=='edit'} aria-busy={busy}>
      <fieldset disabled={busy} className="creator-editor-fields"><AccountEditor onPreview={()=>navigate('preview')} ref={editor} page={page} onDirtyChange={setDirty} onPageSaved={(content,revision)=>setPage(p=>({...p,draft:content,revision}))}/></fieldset>
    </div>
    {tab==='preview'&&<div className="creator-preview"><BirthdayView key={`${page.id}:${page.revision}`} content={page.draft} onEdit={()=>navigate('edit')} onShare={()=>navigate('qr')}/></div>}
    {tab==='qr'&&<SharePanel page={page} qr={qr} busy={busy} expired={expired} unpublished={unpublished} run={run}
      onCreate={()=>run(()=>publish())}
      onRotate={()=>run(async()=>{if(expired||confirm('Đổi mã sẽ ngừng QR và liên kết cũ. Tiếp tục?'))await publish(true);})}
      onRevoke={()=>run(async()=>{if(!confirm('Ngừng chia sẻ thiệp? Liên kết và QR hiện tại sẽ không còn mở được.'))return;await api('/share','DELETE');await load();setMessage('Đã ngừng chia sẻ.');})}
      onEdit={()=>navigate('edit')}
      onDelete={onPageDeleted?()=>run(async()=>{if(!confirm('Xóa thiệp và toàn bộ ảnh/nhạc? Hệ thống sẽ mở thiệp mẫu mới.'))return;await api('/page','DELETE');await onPageDeleted();}):undefined}
    />}

  </div>;
}
