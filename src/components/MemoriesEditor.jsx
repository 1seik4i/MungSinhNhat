import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ImagePlus, Images, Link, Loader2, Plus, Trash2, Undo2, Upload } from 'lucide-react';
import './memories-editor.css';

export default function MemoriesEditor({memories,onChange,uploadImage,onUploadingChange}) {
  const [selectedId,setSelectedId]=useState(memories[0]?.id);
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[notice,setNotice]=useState('');
  const [dragging,setDragging]=useState(false),[url,setUrl]=useState(''),[lastRemoved,setLastRemoved]=useState(null);
  const adding=useRef(null),replacing=useRef(null),inFlight=useRef(false);
  const selected=memories.find(m=>m.id===selectedId)||memories[0];
  const index=memories.findIndex(m=>m.id===selected?.id);
  const update=(field,value)=>onChange(list=>list.map(m=>m.id===selected.id?{...m,[field]:value}:m));
  async function upload(files,replaceId=null) {
    if(inFlight.current)return;
    const chosen=Array.from(files||[]);if(!chosen.length)return;
    const capacity=replaceId?1:100-memories.length;
    if(chosen.length>capacity){setNotice(`Chỉ có thể thêm ${capacity} ảnh nữa (tối đa 100 ảnh).`);return;}
    inFlight.current=true;setBusy(true);onUploadingChange?.(true);setNotice('');
    let completed=0;const errors=[];
    try {
      for(const [i,file] of chosen.entries()){
        setProgress(`Đang tải ảnh ${i+1}/${chosen.length}…`);
        try {
          if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Chỉ nhận JPG, PNG hoặc WebP.');
          if(file.size>5*1024*1024)throw new Error('Ảnh vượt giới hạn 5 MiB.');
          const source=await uploadImage(file);
          if(replaceId){onChange(list=>list.map(m=>m.id===replaceId?{...m,image:source}:m));setSelectedId(replaceId);}
          else {const memory={id:crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),date:'',caption:'',image:source,rotate:0};onChange(list=>[...list,memory]);if(!completed)setSelectedId(memory.id);}
          completed++;
        }catch(e){errors.push(`${file.name}: ${e.message}`);}
      }
      setNotice([completed?(replaceId?'Đã đổi ảnh. Bấm “Lưu thay đổi” để lưu vào thiệp.':`Đã thêm ${completed} ảnh. Bấm “Lưu thay đổi” để lưu vào thiệp.`):'',...errors].filter(Boolean).join(' '));
    }finally{inFlight.current=false;setBusy(false);onUploadingChange?.(false);setProgress('');}
  }
  function addUrl(event){event.preventDefault();if(busy||memories.length>=100)return;try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new Error();}catch{setNotice('Hãy nhập liên kết ảnh HTTPS hợp lệ.');return;}const memory={id:crypto.randomUUID(),title:'Kỷ niệm mới',caption:'',date:'',image:url.trim(),rotate:0};onChange(list=>[...list,memory]);setSelectedId(memory.id);setUrl('');setNotice('Đã thêm ảnh từ liên kết. Hãy lưu thay đổi.');}
  function remove(){setLastRemoved({memory:selected,index});onChange(list=>list.filter(m=>m.id!==selected.id));setSelectedId(memories[index+1]?.id||memories[index-1]?.id);setNotice('Đã gỡ ảnh khỏi bản nháp. Bạn có thể hoàn tác trước khi rời trình sửa.');}
  function undo(){if(!lastRemoved||memories.length>=100)return;const {memory,index:position}=lastRemoved;onChange(list=>{const next=[...list];next.splice(Math.min(position,next.length),0,memory);return next;});setSelectedId(memory.id);setLastRemoved(null);setNotice('Đã khôi phục ảnh và nội dung.');}
  function move(direction){onChange(list=>{const next=[...list],from=next.findIndex(m=>m.id===selected.id),to=from+direction;if(to<0||to>=next.length)return list;[next[from],next[to]]=[next[to],next[from]];return next;});}
  return <section className="glass-panel memories-editor" aria-labelledby="memories-heading" aria-busy={busy} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragging(false);}} onDrop={e=>{e.preventDefault();setDragging(false);upload(e.dataTransfer.files);}}>
    <div className="memories-heading"><div><span className="memories-eyebrow"><Images size={15}/> ALBUM CỦA BẠN</span><h2 id="memories-heading">Góc kỷ niệm <span>{memories.length}/100 ảnh</span></h2><p>Thêm ảnh, chọn khoảnh khắc rồi viết đôi lời. Mỗi tấm ảnh là một câu chuyện.</p></div><button type="button" className="btn-secondary" disabled={busy||memories.length>=100} onClick={()=>adding.current.click()}><Plus size={17}/> Thêm ảnh</button></div>
    <input ref={adding} type="file" multiple hidden accept="image/jpeg,image/png,image/webp" aria-label="Chọn nhiều ảnh kỷ niệm" onChange={e=>{upload(e.target.files);e.target.value='';}}/>
    <input ref={replacing} type="file" hidden accept="image/jpeg,image/png,image/webp" aria-label="Đổi ảnh kỷ niệm" onChange={e=>{upload(e.target.files,selected?.id);e.target.value='';}}/>
    {(notice||busy)&&<div className="memories-notice" role="status">{busy?<><Loader2 size={16} className="animate-spin"/>{progress}</>:notice}</div>}
    {lastRemoved&&<button type="button" className="memory-text-button" disabled={busy||memories.length>=100} onClick={undo}><Undo2 size={15}/> Hoàn tác xóa ảnh</button>}
    <fieldset disabled={busy} className="memories-fields">
      {!memories.length?<button type="button" className={`memory-dropzone ${dragging?'is-dragging':''}`} onClick={()=>adding.current.click()}><span><ImagePlus size={31}/></span><strong>Thêm những khoảnh khắc đáng nhớ</strong><p>Kéo ảnh vào đây hoặc nhấn để chọn từ máy</p><small>Chọn nhiều ảnh cùng lúc · JPG, PNG, WebP · Tối đa 5 MiB/ảnh</small></button>:<div className={`memories-workspace ${dragging?'is-dragging':''}`}>
        <aside className="memory-sidebar"><p>Chọn ảnh để chỉnh sửa</p><div className="memory-thumbnails">{memories.map((m,i)=><button type="button" key={m.id} className={`memory-thumbnail ${selected?.id===m.id?'is-selected':''}`} aria-pressed={selected?.id===m.id} aria-label={`Chỉnh ảnh ${i+1}: ${m.title||'Chưa đặt tên'}`} onClick={()=>setSelectedId(m.id)}>{m.image?<img src={m.image} alt="" loading="lazy"/>:<span className="memory-missing"><ImagePlus size={23}/></span>}<span className="memory-number">{i+1}</span><span className="memory-thumb-name">{m.title||'Chưa đặt tên'}{!m.image&&<small>Chưa có ảnh</small>}</span>{selected?.id===m.id&&<Check className="memory-selected-mark" size={14}/>}</button>)}<button type="button" className="memory-thumb-add" disabled={memories.length>=100} onClick={()=>adding.current.click()}><Plus size={22}/><span>Thêm ảnh</span></button></div></aside>
        <div className="memory-details"><div className="memory-detail-heading"><span>ĐANG CHỈNH ẢNH {index+1}</span><div className="memory-order"><button type="button" aria-label="Đưa ảnh lên trước" disabled={index===0} onClick={()=>move(-1)}><ArrowUp size={16}/></button><button type="button" aria-label="Đưa ảnh xuống sau" disabled={index===memories.length-1} onClick={()=>move(1)}><ArrowDown size={16}/></button></div></div>
          <div className="memory-detail-body"><div className="memory-photo-column"><div className="memory-large-preview">{selected.image?<img src={selected.image} alt={selected.title||'Ảnh kỷ niệm đang chỉnh'}/>:<div><ImagePlus size={38}/><p>Khung này chưa có ảnh</p></div>}</div><button type="button" className="btn-secondary memory-replace" onClick={()=>replacing.current.click()}><Upload size={16}/>{selected.image?'Đổi ảnh khác':'Chọn ảnh cho khung này'}</button><p className="memory-photo-tip">Ảnh hiển thị dạng Polaroid trên thiệp.</p></div>
          <div className="memory-form"><label>Tiêu đề<input aria-label="Tiêu đề ảnh kỷ niệm" maxLength={200} placeholder="Ví dụ: Chuyến đi Đà Lạt" value={selected.title} onChange={e=>update('title',e.target.value)}/></label><label>Thời điểm <span>không bắt buộc</span><input aria-label="Thời điểm ảnh kỷ niệm" maxLength={80} placeholder="Ví dụ: Hè 2025, ngày đầu gặp nhau…" value={selected.date} onChange={e=>update('date',e.target.value)}/></label><label>Lời nhắn <span>{selected.caption.length}/1000</span><textarea aria-label="Lời nhắn ảnh kỷ niệm" rows={5} maxLength={1000} placeholder="Điều bạn muốn nhắn về khoảnh khắc này…" value={selected.caption} onChange={e=>update('caption',e.target.value)}/></label><div className="memory-form-bottom"><span>Thay đổi sẽ hiện khi bạn lưu và xem thiệp.</span><button type="button" className="memory-remove" onClick={remove}><Trash2 size={15}/> Xóa ảnh này</button></div></div></div>
        </div>
      </div>}
      <details className="memory-url-option"><summary><Link size={14}/> Bạn đã có liên kết ảnh?</summary><div className="memory-url-form"><label>Thêm ảnh từ URL HTTPS<input aria-label="URL ảnh kỷ niệm" type="url" placeholder="https://…" value={url} onChange={e=>setUrl(e.target.value)}/></label><button type="button" className="btn-secondary" disabled={!url.trim()||memories.length>=100} onClick={addUrl}>Thêm từ liên kết</button></div><p>Ảnh từ liên kết được tải từ website bên ngoài. Tải ảnh từ máy để lưu cùng thiệp của bạn.</p></details>
    </fieldset>
  </section>;
}
