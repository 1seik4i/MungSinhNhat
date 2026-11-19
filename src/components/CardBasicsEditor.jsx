import React from 'react';
import { Heart, WandSparkles } from 'lucide-react';
import { recipientCopy } from '../hooks/useRecipientCopy';

export default function CardBasicsEditor({card,onChange}){
  const copy=recipientCopy(card.gender);
  const sample=()=>{if(card.message.trim()&&!confirm('Thay lời chúc đang viết bằng lời chúc gợi ý?'))return;onChange('message',copy.sample(card.name.trim()));};
  return <section className="glass-panel editor-basics"><div className="editor-section-heading"><span className="editor-icon"><Heart size={23}/></span><div><h2>Thiệp này dành cho ai?</h2><p>Điền bốn thông tin dưới đây. Các phần còn lại bạn có thể tùy chỉnh sau.</p></div></div>
    <div className="editor-basic-fields">
      <fieldset className="recipient-gender editor-full-width"><legend>Người nhận thiệp</legend><div role="group" aria-label="Giới tính người nhận">{[{value:'male',label:'Nam'},{value:'female',label:'Nữ'}].map(option=><label key={option.value} className={card.gender===option.value?'is-selected':''}><input type="radio" name="recipientGender" value={option.value} checked={card.gender===option.value} onChange={()=>onChange('gender',option.value)}/>{option.label}</label>)}</div><small>Câu chữ mặc định dùng “anh” khi chọn Nam, “em” khi chọn Nữ. Nội dung bạn tự viết được giữ nguyên.</small></fieldset>
      <label>Tên người nhận <span className="editor-required">Bắt buộc</span><input name="recipientName" aria-label="Tên người nhận" maxLength={120} autoComplete="off" value={card.name} placeholder="Tên hoặc cách bạn hay gọi người ấy" onChange={e=>onChange('name',e.target.value)}/><small>Tên này sẽ xuất hiện trên phong thư và thiệp.</small></label>
      <label>Ngày sinh <span className="editor-required">Bắt buộc</span><input name="birthDate" aria-label="Ngày sinh người nhận" type="date" value={card.birthDate} onChange={e=>onChange('birthDate',e.target.value)}/><small>Bạn có thể chọn ngày trong tương lai để chuẩn bị thiệp trước.</small></label>
      <label className="editor-full-width">Tiêu đề thiệp <span className="editor-field-count">{card.title.length}/200</span><input name="title" aria-label="Tiêu đề thiệp" maxLength={200} value={card.title} placeholder="Ví dụ: Chúc mừng sinh nhật người bạn đặc biệt!" onChange={e=>onChange('title',e.target.value)}/></label>
      <label className="editor-full-width">Lời chúc <span className="editor-field-count">{card.message.length}/5000</span><textarea name="message" aria-label="Lời chúc sinh nhật" rows={7} maxLength={5000} value={card.message} placeholder="Viết vài lời từ trái tim, phần còn lại để chiếc thiệp nói thay bạn…" onChange={e=>onChange('message',e.target.value)}/><small>Hãy viết như cách bạn trò chuyện với người ấy. Lời chúc sẽ được giữ nguyên xuống dòng.</small></label>
    </div><button type="button" className="btn-secondary editor-sample" onClick={sample}><WandSparkles size={16}/> Gợi ý một lời chúc</button>
  </section>;
}
