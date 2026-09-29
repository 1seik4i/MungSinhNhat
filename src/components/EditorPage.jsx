import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, GripVertical, ImagePlus, Link, Music2, Plus, Save, Trash2, Upload, CheckCircle2, AlertCircle, Info, X, Loader2, LockKeyhole, LogOut } from 'lucide-react';
import { getYouTubeVideoId, loadContentSettings, fetchServerContentSettings, saveAudioFile, saveContentSettings, compressImageFile, deleteAudioFile, getEditorSession, loginEditor, logoutEditor } from '../utils/contentSettings';

const fieldStyle = { width: '100%', marginTop: '6px', boxSizing: 'border-box', border: '1px solid #ead6d2', borderRadius: '10px', padding: '11px 12px', font: 'inherit', fontWeight: 400, background: '#fffdfb' };

export default function EditorPage({ onExit, onSaved }) {
  const [settings, setSettings] = useState(loadContentSettings);
  const [selectedMemoryId, setSelectedMemoryId] = useState(() => loadContentSettings().memories[0]?.id);
  const [musicUrl, setMusicUrl] = useState('');
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'info', text: string }
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [draggedTrackId, setDraggedTrackId] = useState(null);
  const [sessionState, setSessionState] = useState('loading');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const musicFileRef = useRef(null);
  const imageFileRef = useRef(null);
  const selectedMemory = settings.memories.find((memory) => memory.id === selectedMemoryId) || settings.memories[0];

  useEffect(() => {
    getEditorSession().then((session) => {
      if (!session.configured) return setSessionState('unconfigured');
      if (!session.authenticated) return setSessionState('locked');
      setSessionState('authenticated');
      fetchServerContentSettings().then((serverSettings) => {
        if (serverSettings) {
          setSettings(serverSettings);
          if (!serverSettings.memories?.some((item) => item.id === selectedMemoryId)) {
            setSelectedMemoryId(serverSettings.memories?.[0]?.id);
          }
        }
      });
    }).catch(() => {
      setSessionState('locked');
    });
  }, []);

  const showNotification = (type, text, duration = 3800) => {
    setNotification({ type, text });
    if (duration > 0) {
      setTimeout(() => {
        setNotification((current) => (current?.text === text ? null : current));
      }, duration);
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const savedSettings = await saveContentSettings(settings);
      showNotification('success', 'Đã lưu tất cả thay đổi thành công!');
      onSaved?.(savedSettings);
    } catch (err) {
      console.error(err);
      showNotification('error', err.message || 'Không thể lưu dữ liệu. Vui lòng kiểm tra lại dung lượng ảnh!');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCardData = (key, value) => setSettings((current) => ({ ...current, cardData: { ...current.cardData, [key]: value } }));
  const updateSurpriseCard = (cardKey, field, value) => setSettings((current) => ({
    ...current,
    surpriseCards: {
      ...current.surpriseCards,
      [cardKey]: {
        ...(current.surpriseCards?.[cardKey] || {}),
        [field]: value,
      },
    },
  }));
  const updateMemory = (key, value) => setSettings((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedMemory.id ? { ...memory, [key]: value } : memory) }));

  const addMemory = () => {
    const id = crypto.randomUUID();
    const newMemory = { id, title: 'Kỷ niệm mới', date: 'Hôm nay', caption: 'Một khoảnh khắc đáng nhớ của tuổi mới.', image: '', rotate: 0 };
    const updatedSettings = { ...settings, memories: [...settings.memories, newMemory] };
    setSettings(updatedSettings);
    setSelectedMemoryId(id);
    showNotification('info', 'Đã thêm một ảnh kỷ niệm mới. Hãy chọn ảnh và điền thông điệp nhé!');
  };

  const removeMemory = async () => {
    if (settings.memories.length <= 1) return showNotification('error', 'Cần giữ lại ít nhất một ảnh kỷ niệm trong album.');
    const remaining = settings.memories.filter((memory) => memory.id !== selectedMemory.id);
    const updatedSettings = { ...settings, memories: remaining };
    setSettings(updatedSettings);
    setSelectedMemoryId(remaining[0].id);
    try {
      await saveContentSettings(updatedSettings);
      showNotification('info', 'Đã xóa kỷ niệm và giải phóng bộ nhớ lưu trữ!');
      onSaved?.();
    } catch (err) {
      console.warn(err);
    }
  };

  const clearImage = async () => {
    if (!selectedMemory.image) return;
    const updatedMemories = settings.memories.map((memory) =>
      memory.id === selectedMemory.id ? { ...memory, image: '' } : memory
    );
    const updatedSettings = { ...settings, memories: updatedMemories };
    setSettings(updatedSettings);
    try {
      await saveContentSettings(updatedSettings);
      showNotification('info', 'Đã gỡ ảnh và giải phóng bộ nhớ!');
      onSaved?.();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...).');
      return;
    }

    setIsProcessingImage(true);
    showNotification('info', 'Đang nén và tối ưu hóa hình ảnh...', 2000);

    try {
      const compressedDataUrl = await compressImageFile(file);
      const updatedMemories = settings.memories.map((memory) =>
        memory.id === selectedMemory.id ? { ...memory, image: compressedDataUrl } : memory
      );
      const updatedSettings = { ...settings, memories: updatedMemories };
      setSettings(updatedSettings);
      await saveContentSettings(updatedSettings);
      onSaved?.();
      showNotification('success', 'Đã tải, tối ưu và lưu ảnh thành công!');
    } catch (err) {
      console.error(err);
      showNotification('error', err.message || 'Không thể đọc và xử lý tệp ảnh này.');
    } finally {
      setIsProcessingImage(false);
      if (event.target) event.target.value = '';
    }
  };

  const addLink = async () => {
    const url = musicUrl.trim();
    if (!url) return showNotification('error', 'Vui lòng nhập đường link bài hát hoặc YouTube.');
    const youtubeId = getYouTubeVideoId(url);
    try {
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
      const updatedTracks = [...settings.tracks, { id: crypto.randomUUID(), name, type: youtubeId ? 'youtube' : 'url', source: youtubeId || url }];
      const updatedSettings = { ...settings, tracks: updatedTracks };
      setSettings(updatedSettings);
      await saveContentSettings(updatedSettings);
      onSaved?.();
      setMusicUrl('');
      showNotification('success', `Đã thêm bài hát: ${name}`);
    } catch (error) {
      showNotification('error', error.message || 'Không thể thêm bài hát.');
    }
  };

  const addAudioFile = async (file) => {
    if (!file || !file.type.startsWith('audio/')) return showNotification('error', 'Hãy chọn tệp âm thanh hợp lệ (.mp3, .wav, .m4a...).');
    try {
      const fileId = await saveAudioFile(file);
      const name = file.name.replace(/\.[^/.]+$/, '');
      const updatedTracks = [...settings.tracks, { id: crypto.randomUUID(), name, type: 'file', source: fileId }];
      const updatedSettings = { ...settings, tracks: updatedTracks };
      setSettings(updatedSettings);
      await saveContentSettings(updatedSettings);
      onSaved?.();
      showNotification('success', `Đã tải lên tệp nhạc: ${name}`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Không thể lưu tệp âm thanh vào bộ nhớ trình duyệt.');
    }
  };

  const removeTrack = async (trackId) => {
    const trackToRemove = settings.tracks.find((item) => item.id === trackId);
    if (trackToRemove?.type === 'file' && trackToRemove.source) {
      await deleteAudioFile(trackToRemove.source);
    }
    const updatedTracks = settings.tracks.filter((item) => item.id !== trackId);
    const updatedSettings = { ...settings, tracks: updatedTracks };
    setSettings(updatedSettings);
    try {
      await saveContentSettings(updatedSettings);
      showNotification('info', 'Đã xóa bài hát và giải phóng bộ nhớ!');
      onSaved?.();
    } catch (err) {
      console.warn(err);
    }
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

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    try {
      await loginEditor(password);
      setPassword('');
      setSessionState('authenticated');
      const serverSettings = await fetchServerContentSettings();
      if (serverSettings) {
        setSettings(serverSettings);
        setSelectedMemoryId(serverSettings.memories?.[0]?.id);
      }
    } catch (error) {
      setLoginError(error.message || 'Không thể đăng nhập.');
    }
  };

  const handleLogout = async () => {
    await logoutEditor();
    setSessionState('locked');
  };

  if (sessionState !== 'authenticated') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #fff7ef, #ffe9e8 55%, #fce5dc)' }}>
        <form onSubmit={handleLogin} className="glass-panel" style={{ width: 'min(430px, 100%)', padding: '34px', textAlign: 'center' }}>
          <LockKeyhole size={34} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
          <h1 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '2.2rem', marginBottom: '8px' }}>Bảo vệ trang chỉnh sửa</h1>
          {sessionState === 'loading' ? (
            <p style={{ color: 'var(--text-muted)' }}>Đang kiểm tra phiên đăng nhập...</p>
          ) : sessionState === 'unconfigured' ? (
            <p style={{ color: '#991b1b', lineHeight: 1.6 }}>Máy chủ chưa có ADMIN_PASSWORD và EDITOR_SESSION_SECRET. Hãy thêm hai biến này trong môi trường chạy web.</p>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>Nhập mật khẩu quản trị để thay đổi nội dung, ảnh và bài hát.</p>
              <input autoFocus type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu quản trị" style={fieldStyle} />
              {loginError && <p style={{ color: '#b91c1c', marginTop: '10px' }}>{loginError}</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={!password}>Đăng nhập</button>
            </>
          )}
          <button type="button" onClick={onExit} className="btn-secondary" style={{ marginTop: '14px' }}><ArrowLeft size={17} />Về thiệp</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '30px 16px 100px', background: 'linear-gradient(135deg, #fff7ef, #ffe9e8 55%, #fce5dc)', position: 'relative' }}>
      {/* Floating Notification Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: 'min(92vw, 540px)',
            width: 'max-content',
            padding: '12px 18px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.92rem',
            fontWeight: 600,
            background:
              notification.type === 'error'
                ? '#fee2e2'
                : notification.type === 'success'
                ? '#dcfce7'
                : '#e0f2fe',
            color:
              notification.type === 'error'
                ? '#991b1b'
                : notification.type === 'success'
                ? '#166534'
                : '#075985',
            border: `1px solid ${
              notification.type === 'error'
                ? '#fca5a5'
                : notification.type === 'success'
                ? '#86efac'
                : '#7dd3fc'
            }`,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          {notification.type === 'error' && <AlertCircle size={19} style={{ flexShrink: 0 }} />}
          {notification.type === 'success' && <CheckCircle2 size={19} style={{ flexShrink: 0 }} />}
          {notification.type === 'info' && <Info size={19} style={{ flexShrink: 0 }} />}
          <span style={{ flex: 1 }}>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', padding: '2px', display: 'flex' }}
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '26px' }}>
          <div><p style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-handwriting)', fontSize: '1.5rem', fontWeight: 700 }}>Bảng chỉnh sửa</p><h1 style={{ fontFamily: 'var(--font-handwriting)', fontSize: 'clamp(2.2rem, 6vw, 3.2rem)' }}>Nội dung cho thiệp sinh nhật</h1></div>
          <div style={{ display: 'flex', gap: '8px' }}><button onClick={handleLogout} className="btn-secondary"><LogOut size={17} /><span>Đăng xuất</span></button><button onClick={onExit} className="btn-secondary"><ArrowLeft size={17} /><span>Về thiệp</span></button></div>
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
          <h2 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '2rem', marginBottom: '8px' }}>Hộp quà và Gieo thẻ</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>Nội dung hai lựa chọn bất ngờ trên trang chính.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {[
              ['gift', 'Hộp quà'],
              ['fortune', 'Gieo thẻ'],
            ].map(([key, label]) => {
              const card = settings.surpriseCards?.[key] || {};
              return (
                <div key={key} style={{ display: 'grid', gap: '10px', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,.45)', border: '1px solid #ead6d2' }}>
                  <h3 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '1.45rem' }}>{label}</h3>
                  <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Tiêu đề<input value={card.title || ''} onChange={(event) => updateSurpriseCard(key, 'title', event.target.value)} style={fieldStyle} /></label>
                  <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Mô tả<textarea rows="2" value={card.description || ''} onChange={(event) => updateSurpriseCard(key, 'description', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
                  <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Nhãn nút<input value={card.action || ''} onChange={(event) => updateSurpriseCard(key, 'action', event.target.value)} style={fieldStyle} /></label>
                  <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Ảnh minh họa URL<input value={card.image || ''} onChange={(event) => updateSurpriseCard(key, 'image', event.target.value)} placeholder="https://..." style={fieldStyle} /></label>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}><div><h2 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '2rem' }}>Góc kỷ niệm</h2><p style={{ color: 'var(--text-muted)', marginTop: '3px' }}>Chọn từng ảnh để thay đổi ảnh, tiêu đề và lời nhắn.</p></div><button onClick={addMemory} className="btn-secondary"><Plus size={17} /><span>Thêm kỷ niệm</span></button></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, .7fr) minmax(0, 1.3fr)', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>{settings.memories.map((memory) => <button key={memory.id} onClick={() => setSelectedMemoryId(memory.id)} style={{ border: selectedMemory?.id === memory.id ? '2px solid var(--accent-primary)' : '1px solid #ead6d2', background: '#fffaf7', padding: '7px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}><img src={memory.image || 'https://placehold.co/240x240/f8d9d5/875467?text=Ảnh'} alt="Kỷ niệm" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} /><span style={{ display: 'block', marginTop: '5px', fontSize: '.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memory.title}</span></button>)}</div>
            {selectedMemory && <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="btn-secondary" style={{ cursor: isProcessingImage ? 'not-allowed' : 'pointer', opacity: isProcessingImage ? 0.7 : 1 }}>
                  {isProcessingImage ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} />}
                  <span>{isProcessingImage ? 'Đang xử lý ảnh...' : selectedMemory?.image ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}</span>
                  <input ref={imageFileRef} type="file" hidden accept="image/*" disabled={isProcessingImage} onChange={handleImageUpload} />
                </label>
                {selectedMemory?.image && (
                  <button onClick={clearImage} style={{ border: 0, background: 'transparent', color: '#c85e6f', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Trash2 size={17} />Gỡ ảnh
                  </button>
                )}
                <button onClick={removeMemory} style={{ border: 0, background: 'transparent', color: '#888', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                  <Trash2 size={17} />Xóa khung này
                </button>
              </div>
              <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '.9rem' }}>Liên kết ảnh (hoặc URL ảnh online)<input value={selectedMemory.image} onChange={(event) => updateMemory('image', event.target.value)} placeholder="https://..." style={fieldStyle} /></label>
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
          <div style={{ display: 'grid', gap: '9px', marginTop: '16px' }}>{settings.tracks.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Chưa có bài hát riêng.</div> : settings.tracks.map((track) => <div key={track.id} draggable onDragStart={() => setDraggedTrackId(track.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { placeTrack(track.id); setDraggedTrackId(null); }} onDragEnd={() => setDraggedTrackId(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '11px 10px', borderRadius: '10px', background: draggedTrackId === track.id ? '#f9dedb' : '#fff8f5', border: draggedTrackId === track.id ? '1px dashed #c85e6f' : '1px solid transparent', cursor: 'grab' }}><span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', minWidth: 0, flex: 1 }}><GripVertical size={17} color="#b89791" /><Music2 size={17} color="var(--accent-primary)" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</span></span><button onClick={() => removeTrack(track.id)} aria-label="Xóa bài hát" style={{ border: 0, background: 'transparent', color: '#c85e6f', cursor: 'pointer' }}><Trash2 size={17} /></button></div>)}</div>
        </section>

        <div style={{ position: 'sticky', bottom: '18px', display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button onClick={save} disabled={isSaving} className="btn-primary" style={{ padding: '13px 28px', boxShadow: '0 10px 28px rgba(200,94,111,.3)', gap: '8px', opacity: isSaving ? .7 : 1 }}>
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
