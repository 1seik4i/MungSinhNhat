import React from 'react';
import { DEFAULT_GIFT_REWARDS } from '../../shared/giftRewards';
import { Gift, Plus, Trash2 } from 'lucide-react';

const fieldStyle={width:'100%',padding:11,marginTop:6,border:'1px solid #ead6d2',borderRadius:10,font:'inherit',background:'#fffdfb'};
export default function GiftRewardsEditor({rewards,onChange,children}) {
  const update=(id,field,value)=>onChange(rewards.map(reward=>reward.id===id?{...reward,[field]:value}:reward));
  return <section className="glass-panel" style={{padding:28,marginBottom:20}} aria-label="Danh sách quà vòng quay">
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}><div><h2 style={{fontFamily:'var(--font-handwriting)',fontSize:'2rem'}}><Gift size={24}/> Quà trong hộp quay</h2><p style={{color:'var(--text-muted)',margin:'8px 0 16px'}}>Đổi tên, mô tả và mã quà. Lưu thay đổi rồi xem thiệp để thử quay. Xóa hết quà sẽ ẩn hộp quà.</p></div><button type="button" className="btn-secondary" onClick={()=>onChange(structuredClone(DEFAULT_GIFT_REWARDS))}>Mặc định hệ thống</button></div>
    <p style={{color:'var(--text-muted)'}}>Hình hộp quà có sẵn, không cần URL ảnh.</p>{children}
    {!rewards.length&&<p role="status">Chưa có quà. Bấm “Thêm quà” để bật lại hộp quay.</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:16}}>{rewards.map((reward,index)=><fieldset key={reward.id} style={{minWidth:0,border:'1px solid #ead6d2',borderRadius:14,padding:16,background:'rgba(255,255,255,.5)'}}><legend>Quà {index+1}</legend>
      <label>Tên quà<input aria-label={`Tên quà ${index+1}`} maxLength={120} style={fieldStyle} value={reward.title} onChange={e=>update(reward.id,'title',e.target.value)}/></label>
      <label style={{display:'block',marginTop:12}}>Mô tả<textarea aria-label={`Mô tả quà ${index+1}`} rows={3} maxLength={1000} style={fieldStyle} value={reward.desc} onChange={e=>update(reward.id,'desc',e.target.value)}/></label>
      <label style={{display:'block',marginTop:12}}>Mã quà<input aria-label={`Mã quà ${index+1}`} maxLength={80} style={fieldStyle} value={reward.code} onChange={e=>update(reward.id,'code',e.target.value)}/></label>
      <label style={{display:'flex',alignItems:'center',gap:12,margin:'14px 0'}}>Màu thẻ quà<input aria-label={`Màu quà ${index+1}`} type="color" value={reward.tone} onChange={e=>update(reward.id,'tone',e.target.value)}/></label>
      <button type="button" className="btn-secondary" aria-label={`Xóa quà ${index+1}`} onClick={()=>onChange(rewards.filter(item=>item.id!==reward.id))}><Trash2 size={16}/> Xóa quà</button>
    </fieldset>)}<button type="button" className="collection-add" disabled={rewards.length>=50} onClick={()=>onChange([...rewards,{id:crypto.randomUUID(),title:'Món quà mới',desc:'Một món quà dành riêng cho bạn.',code:`GIFT-${crypto.randomUUID().slice(0,8).toUpperCase()}`,tone:'#d95f79',weight:10}])}><Plus size={17}/> Thêm quà</button></div>
  </section>;
}
