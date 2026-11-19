import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Clock3, Copy, Download, Gift, Heart, Link2, Loader2, LockKeyhole, QrCode, RefreshCw, Send, Share2 } from 'lucide-react';
import './share-panel.css';

export default function SharePanel({page,qr,busy,expired,unpublished,run,onCreate,onRotate,onRevoke,onEdit,onDelete}){
  const [copied,setCopied]=useState(false);
  const [nativeShare,setNativeShare]=useState(false);
  const linkInput=useRef(null);
  const active=!!page.shareUrl&&!expired;
  useEffect(()=>{setNativeShare(typeof navigator.share==='function');},[]);
  useEffect(()=>{setCopied(false);},[page.shareUrl]);
  useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),2500);return()=>clearTimeout(timer);},[copied]);
  const copy=()=>run(async()=>{
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(page.shareUrl);setCopied(true);}
    else {linkInput.current?.focus();linkInput.current?.select();throw new Error('Đã chọn liên kết. Nhấn Ctrl/Cmd + C hoặc chạm giữ để sao chép.');}
  });
  const share=()=>run(async()=>{try{await navigator.share({title:page.snapshot?.cardData?.title||page.draft.cardData.title||'Thiệp sinh nhật',text:`Một bất ngờ sinh nhật dành cho ${page.draft.cardData.name||'bạn'}. Mở thiệp nhé!`,url:page.shareUrl});}catch(error){if(error.name!=='AbortError')throw error;}});
  return <main className="share-page"><header className="share-heading"><span className="share-eyebrow"><Heart size={14}/> MỘT MÓN QUÀ, HAI CÁCH GỬI</span><h1>Gửi lời thương,<br className="share-mobile-break"/> trao <em>điều bất ngờ.</em></h1><p>Gửi một liên kết hoặc chiếc QR nhỏ. Người nhận mở thiệp ngay, không cần tài khoản.</p></header>
    <section className="share-studio" aria-label="Chia sẻ thiệp sinh nhật">
      <div className="share-recipient"><span className="share-recipient-icon"><Gift size={24}/></span><div><small>THIỆP SINH NHẬT DÀNH CHO</small><h2>{page.draft.cardData.name||'Người thương của bạn'}</h2></div><span className={`share-badge ${expired?'expired':active?'active':''}`}>{expired?'Đã hết hạn':active?'Sẵn sàng gửi':'Chưa chia sẻ'}</span></div>
      <div className="share-options">
        <section className="share-link-card"><span className="share-option-icon"><Send size={23}/></span><h3>Gửi bằng liên kết</h3><p>Gửi qua Zalo, Messenger hoặc tin nhắn. Một chạm là mở cả món quà.</p><label htmlFor="birthday-share-link">Liên kết thiệp của bạn</label><div className={`share-link-input ${!active?'is-pending':''}`}><Link2 size={17}/><input ref={linkInput} id="birthday-share-link" aria-label="Liên kết chia sẻ thiệp" readOnly disabled={!active} value={active?page.shareUrl:''} placeholder={expired?'Tạo mã mới để nhận liên kết mới':'Liên kết sẽ xuất hiện sau khi tạo thiệp'} onFocus={e=>e.target.select()}/></div>
          {active?<><div className="share-link-actions"><button type="button" className="share-primary" aria-label="Sao chép liên kết" disabled={busy} onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?'Đã sao chép':'Sao chép liên kết'}</button>{nativeShare&&<button type="button" className="share-secondary" disabled={busy} onClick={share}><Share2 size={17}/> Chia sẻ</button>}</div><Link className="share-open" to={page.shareUrl} target="_blank" rel="noreferrer">Mở thử thiệp <ArrowUpRight size={15}/></Link><p className="share-copy-status" role="status">{copied?'Liên kết đã sẵn sàng để dán vào tin nhắn.':'Liên kết và QR có cùng quyền xem, cùng thời hạn.'}</p></>:<p className="share-await"><LockKeyhole size={14}/>{expired?'Liên kết cũ đã dừng hoạt động.':'Tạo thiệp bên dưới để nhận liên kết riêng.'}</p>}
        </section>
        <section className="share-qr-card"><span className="share-qr-label">MỘT LẦN QUÉT, MỘT NIỀM VUI</span><div className={`share-qr-frame ${active&&qr?'has-code':''}`}>{active&&qr?<img src={qr} alt="QR để người nhận mở thiệp sinh nhật" width={240} height={240}/>:<><QrCode size={88} strokeWidth={1}/><span>{expired?'QR đã hết hạn':'QR của riêng bạn'}</span><small>{expired?'Đổi mã để tiếp tục gửi thiệp':'Sẽ sẵn sàng khi thiệp được tạo'}</small></>}</div><h3>Hoặc gửi bằng mã QR</h3><p>Tải ảnh để gửi, in lên thiệp giấy<br/>hoặc đặt trong hộp quà sinh nhật.</p>{active&&qr&&<a className="share-secondary" download="sinh-nhat-qr.png" href={qr}><Download size={17}/> Tải QR PNG</a>}{active&&!qr&&<span className="share-await"><Loader2 size={16}/> Đang tạo ảnh QR…</span>}</section>
      </div>
      {unpublished&&active&&<div className="share-update-note"><RefreshCw size={17}/><span>Thiệp có thay đổi chưa gửi lên bản chia sẻ. Cập nhật để người nhận xem nội dung mới.</span><button type="button" disabled={busy} onClick={onCreate}>Cập nhật thiệp</button></div>}
      <div className="share-bottom"><div className="share-lifetime"><Clock3 size={19}/><div><strong>Niềm vui được giữ trong 3 ngày</strong><p>{page.share_expires?`${expired?'Đã hết hạn':'Hết hạn'}: ${new Date(page.share_expires).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})} (giờ Việt Nam)`:'QR và liên kết có hiệu lực 72 giờ kể từ lúc tạo.'}</p></div></div>{!page.shareUrl?<button type="button" className="share-primary" disabled={busy} onClick={onCreate}>{busy?<Loader2 size={17}/>:<QrCode size={18}/>} Tạo thiệp và QR</button>:expired?<button type="button" className="share-primary" disabled={busy} onClick={onRotate}><RefreshCw size={17}/> Tạo QR mới — 3 ngày</button>:<span className="share-owner-note"><LockKeyhole size={14}/> Chỉ bạn được chỉnh sửa</span>}</div>
    </section>
    <div className="share-secondary-row"><button type="button" className="share-back" disabled={busy} onClick={onEdit}><ArrowLeft size={15}/> Quay lại chỉnh sửa</button><span><Heart size={13}/> Ai có liên kết hoặc QR đều có thể xem thiệp.</span></div>
    {page.shareUrl&&<details className="share-settings"><summary>Tùy chọn chia sẻ</summary><p>Đổi QR sẽ tạo liên kết mới và ngừng mã cũ. Xem hoặc tải lại không kéo dài thời hạn.</p><div><button type="button" className="share-secondary" disabled={busy} onClick={onRotate}>Đổi QR và liên kết</button><button type="button" className="share-secondary" disabled={busy} onClick={onRevoke}>Ngừng chia sẻ</button></div></details>}
    {onDelete&&<details className="share-settings"><summary>Quản lý thiệp</summary><p>Xóa thiệp sẽ xóa ảnh/nhạc đã tải và ngừng mọi liên kết cũ.</p><button type="button" className="share-danger" disabled={busy} onClick={onDelete}>Xóa thiệp và tạo lại từ mẫu</button></details>}
  </main>;
}
