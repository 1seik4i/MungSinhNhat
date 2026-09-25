import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, GripVertical, ImagePlus, Link, Music2, Plus, Save, Trash2, Upload } from 'lucide-react';
import { getYouTubeVideoId, loadContentSettings, saveAudioFile, saveContentSettings } from '../utils/contentSettings';

const readImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const fieldStyle = { width: '100%', marginTop: '6px', boxSizing: 'border-box', border: '1px solid #ead6d2', borderRadius: '10px', padding: '11px 12px', font: 'inherit', fontWeight: 400, background: '#fffdfb' };

export default function EditorPage({ onExit, onSaved }) {
  const [settings, setSettings] = useState(loadContentSettings);
  const [selectedMemoryId, setSelectedMemoryId] = useState(() => loadContentSettings().memories[0]?.id);
  const [musicUrl, setMusicUrl] = useState('');
  const [message, setMessage] = useState('');
  const [draggedTrackId, setDraggedTrackId] = useState(null);
  const musicFileRef = useRef(null);
  const imageFileRef = useRef(null);
  const selectedMemory = settings.memories.find((memory) => memory.id === selectedMemoryId) || settings.memories[0];

  const save = () => {
    saveContentSettings(settings);
    setMessage('Đã lưu thay đổi.');
    onSaved?.();
  };

  useEffect(() => {
    const timeout = message ? setTimeout(() => setMessage(''), 2200) : null;
    return () => timeout && clearTimeout(timeout);
  }, [message]);

  const updateCardData = (key, value) => setSettings((current) => ({ ...current, cardData: { ...current.cardData, [key]: value } }));
  const updateMemory = (key, value) => setSettings((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedMemory.id ? { ...memory, [key]: value } : memory) }));

  const addMemory = () => {
    const id = crypto.randomUUID();
    setSettings((current) => ({ ...current, memories: [...current.memories, { id, title: 'Kỷ niệm mới', date: 'Hôm nay', caption: 'Một khoảnh khắc đáng nhớ của tuổi mới.', image: '', rotate: 0 }] }));
    setSelectedMemoryId(id);
  };

  const removeMemory = () => {
    if (settings.memories.length <= 1) return setMessage('Cần giữ lại ít nhất một ảnh kỷ niệm.');
    const remaining = settings.memories.filter((memory) => memory.id !== selectedMemory.id);
    setSettings((current) => ({ ...current, memories: remaining }));
    setSelectedMemoryId(remaining[0].id);
  };

  const addLink = () => {
    const url = musicUrl.trim();
    if (!url) return;
    const youtubeId = getYouTubeVideoId(url);
    const addTrack = async () => {
      let name = url.split('/').pop()?.split('?')[0] || 'Bài hát từ liên kết';
      if (youtubeId) {
        try {
          const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}&format=json`);
          const data = await response.json();
          name = data.title || 'Bài hát từ YouTube';
        } catch {
          name = `YouTube · ${youtubeId}`;
        }
      }
      setSettings((current) => ({ ...current, tracks: [...current.tracks, { id: crypto.randomUUID(), name, type: youtubeId ? 'youtube' : 'url', source: youtubeId || url }] }));
      setMusicUrl('');
    };
    addTrack();
  };

  const addAudioFile = async (file) => {
    if (!file || !file.type.startsWith('audio/')) return setMessage('Hãy chọn tệp âm thanh hợp lệ.');
    const fileId = await saveAudioFile(file);
    setSettings((current) => ({ ...current, tracks: [...current.tracks, { id: crypto.randomUUID(), name: file.name.replace(/\.[^/.]+$/, ''), type: 'file', source: fileId }] }));
  };

  const placeTrack = (targetId) => setSettings((current) => {
    const fromIndex = current.tracks.findIndex((track) => track.id === draggedTrackId);
    const toIndex = current.tracks.findIndex((track) => track.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
    const tracks = [...current.tracks];
    const [track] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, track);
    return { ...current, tracks };
  });

  return (
    <main style={{ minHeight: '100vh', padding: '30px 16px 80px', background: 'linear-gradient(135deg, #fff7ef, #ffe9e8 55%, #fce5dc)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '26px' }}>
          <div><p style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-handwriting)', fontSize: '1.5rem', fontWeight: 700 }}>Bảng chỉnh sửa</p><h1 style={{ fontFamily: 'var(--font-handwriting)', fontSize: 'clamp(2.2rem, 6vw, 3.2rem)' }}>Nội dung cho thiệp sinh nhật</h1></div>
          <button onClick={onExit} className="btn-secondary"><ArrowLeft size={17} /><span>Về thiệp</span></button>
        </header>

        <section className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '2rem', marginBottom: '18px' }}>Thông tin thiệp</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Tên người nhận<input value={settings.cardData.name} onChange={(event) => updateCardData('name', event.target.value)} style={fieldStyle} /></label>
            <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Ngày sinh nhật<input value={settings.cardData.birthDate} onChange={(event) => updateCardData('birthDate', event.target.value)} placeholder="05 / 10" style={fieldStyle} /></label>
            <label style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Tiêu đề thiệp<input value={settings.cardData.title} onChange={(event) => updateCardData('title', event.target.value)} style={fieldStyle} /></label>
            <label style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Lời chúc<textarea rows="4" value={settings.cardData.message} onChange={(event) => updateCardData('message', event.target.value)} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.55 }} /></label>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}><div><h2 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '2rem' }}>Góc kỷ niệm</h2><p style={{ color: 'var(--text-muted)', marginTop: '3px' }}>Chọn từng ảnh để thay đổi ảnh, tiêu đề và lời nhắn.</p></div><button onClick={addMemory} className="btn-secondary"><Plus size={17} /><span>Thêm kỷ niệm</span></button></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, .7fr) minmax(0, 1.3fr)', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>{settings.memories.map((memory) => <button key={memory.id} onClick={() => setSelectedMemoryId(memory.id)} style={{ border: selectedMemory?.id === memory.id ? '2px solid var(--accent-primary)' : '1px solid #ead6d2', background: '#fffaf7', padding: '7px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}><img src={memory.image || 'https://placehold.co/240x240/f8d9d5/875467?text=Ảnh'} alt="Kỷ niệm" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} /><span style={{ display: 'block', marginTop: '5px', fontSize: '.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memory.title}</span></button>)}</div>
            {selectedMemory && <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}><label className="btn-secondary" style={{ cursor: 'pointer' }}><ImagePlus size={17} /><span>Chọn ảnh</span><input ref={imageFileRef} type="file" hidden accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (file) updateMemory('image', await readImage(file)); }} /></label><button onClick={removeMemory} style={{ border: 0, background: 'transparent', color: '#c85e6f', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Trash2 size={17} />Xóa ảnh này</button></div>
              <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Liên kết ảnh<input value={selectedMemory.image} onChange={(event) => updateMemory('image', event.target.value)} placeholder="Dán liên kết ảnh" style={fieldStyle} /></label>
              <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Tiêu đề<input value={selectedMemory.title} onChange={(event) => updateMemory('title', event.target.value)} style={fieldStyle} /></label>
              <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Thời điểm<input value={selectedMemory.date} onChange={(event) => updateMemory('date', event.target.value)} style={fieldStyle} /></label>
              <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Lời nhắn<textarea rows="3" value={selectedMemory.caption} onChange={(event) => updateMemory('caption', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
            </div>}
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '2rem', marginBottom: '8px' }}>Nhạc nền</h2><p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>Dán liên kết YouTube, liên kết trực tiếp đến tệp nhạc hoặc kéo thả tệp MP3, WAV, M4A vào khung dưới đây.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}><input value={musicUrl} onChange={(event) => setMusicUrl(event.target.value)} placeholder="Dán liên kết YouTube hoặc bài hát (.mp3, .wav...)" style={{ flex: '1 1 330px', border: '1px solid #ead6d2', borderRadius: '10px', padding: '11px 12px', font: 'inherit' }} /><button onClick={addLink} className="btn-secondary"><Link size={16} /><span>Thêm liên kết</span></button></div>
          <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addAudioFile(event.dataTransfer.files?.[0]); }} onClick={() => musicFileRef.current?.click()} style={{ border: '2px dashed #d99a92', borderRadius: '16px', padding: '25px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,.45)' }}><Upload size={25} color="var(--accent-primary)" style={{ marginBottom: '7px' }} /><div style={{ fontWeight: 700 }}>Kéo tệp nhạc vào đây</div><div style={{ color: 'var(--text-muted)', fontSize: '.86rem', marginTop: '3px' }}>hoặc nhấn để chọn tệp từ máy</div><input ref={musicFileRef} hidden type="file" accept="audio/*" onChange={(event) => addAudioFile(event.target.files?.[0])} /></div>
          <div style={{ display: 'grid', gap: '9px', marginTop: '16px' }}>{settings.tracks.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Chưa có bài hát riêng.</div> : settings.tracks.map((track) => <div key={track.id} draggable onDragStart={() => setDraggedTrackId(track.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { placeTrack(track.id); setDraggedTrackId(null); }} onDragEnd={() => setDraggedTrackId(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '11px 10px', borderRadius: '10px', background: draggedTrackId === track.id ? '#f9dedb' : '#fff8f5', border: draggedTrackId === track.id ? '1px dashed #c85e6f' : '1px solid transparent', cursor: 'grab' }}><span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', minWidth: 0, flex: 1 }}><GripVertical size={17} color="#b89791" /><Music2 size={17} color="var(--accent-primary)" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</span></span><button onClick={() => setSettings((current) => ({ ...current, tracks: current.tracks.filter((item) => item.id !== track.id) }))} aria-label="Xóa bài hát" style={{ border: 0, background: 'transparent', color: '#c85e6f', cursor: 'pointer' }}><Trash2 size={17} /></button></div>)}</div>
        </section>
        <div style={{ position: 'sticky', bottom: '18px', display: 'flex', justifyContent: 'center', marginTop: '24px' }}><button onClick={save} className="btn-primary" style={{ padding: '13px 25px', boxShadow: '0 10px 28px rgba(200,94,111,.3)' }}><Save size={18} /><span>{message || 'Lưu thay đổi'}</span></button></div>
      </div>
    </main>
  );
}
