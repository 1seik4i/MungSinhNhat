import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArrowLeft, Music2, Save, CheckCircle2, AlertCircle, Info, X, Loader2, LockKeyhole, LogOut } from 'lucide-react';
import * as legacyServices from '../utils/contentSettings';
import CardBasicsEditor from './CardBasicsEditor';
import MusicEditor from './MusicEditor';
import './editor-workbench.css';
import { Gift, Images, Heart, Eye, Check } from 'lucide-react';
import MemoriesEditor from './MemoriesEditor';
import { SurpriseCardFields } from './FortunesEditor';
import GiftRewardsEditor from './GiftRewardsEditor';
import { getGiftRewards } from '../../shared/giftRewards';

const fieldStyle = { width: '100%', marginTop: '6px', boxSizing: 'border-box', border: '1px solid #ead6d2', borderRadius: '10px', padding: '11px 12px', font: 'inherit', fontWeight: 400, background: '#fffdfb' };

export default forwardRef(function EditorPage({ onExit, onSaved, services, initialContent, onSettingsChange, onPreview, embedded = false }, ref) {
  const { loadContentSettings, fetchServerContentSettings, saveAudioFile, saveContentSettings, saveImageFile, getEditorSession, loginEditor, logoutEditor } = services || legacyServices;
  const initial = () => { const content=structuredClone(initialContent || loadContentSettings()); return {...content,giftRewards:structuredClone(getGiftRewards(content))}; };
  const [settings, setSettings] = useState(initial);
  const [activeSection,setActiveSection]=useState('basics');
  const [savedSignature,setSavedSignature]=useState(()=>JSON.stringify(initialContent||initial()));
  const [isProcessingAudio,setIsProcessingAudio]=useState(false);
  const panelTop=useRef(null);
  const editorRoot=useRef(null);
  const saveHandler=useRef(null);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'info', text: string }
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [sessionState, setSessionState] = useState(services ? 'authenticated' : 'loading');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { onSettingsChange?.(settings); }, [settings, onSettingsChange]);

  useEffect(() => {
    if (services) return;
    getEditorSession().then((session) => {
      if (!session.configured) return setSessionState('unconfigured');
      if (!session.authenticated) return setSessionState('locked');
      setSessionState('authenticated');
      fetchServerContentSettings().then((serverSettings) => {
        if (serverSettings) {
          setSettings(serverSettings);

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

  const persist = async () => {
    if (isProcessingImage || isProcessingAudio) throw new Error('Đang tải ảnh. Vui lòng chờ hoàn tất trước khi lưu hoặc chuyển bước.');
    setIsSaving(true);
    try {
      const savedSettings = await saveContentSettings(settings);
      showNotification('success', 'Đã lưu tất cả thay đổi thành công!');
      setSavedSignature(JSON.stringify(savedSettings));
      onSaved?.(savedSettings);
      return savedSettings;
    } catch (err) {
      console.error(err);
      showNotification('error', err.message || 'Không thể lưu dữ liệu. Vui lòng kiểm tra lại dung lượng ảnh!');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  const save = () => persist().catch(() => {});
  useImperativeHandle(ref, () => ({ save: persist, isUploading: () => isProcessingImage || isProcessingAudio }));

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
  const locked=isSaving||isProcessingImage||isProcessingAudio;
  const dirty=JSON.stringify(settings)!==savedSignature;
  const missing=Object.entries({name:'tên người nhận',birthDate:'ngày sinh',title:'tiêu đề',message:'lời chúc'}).filter(([key])=>!settings.cardData[key]?.trim());
  const sections=[{id:'basics',label:'Thông tin thiệp',Icon:Heart,count:`${4-missing.length}/4`},{id:'photos',label:'Ảnh kỷ niệm',Icon:Images,count:settings.memories.length},{id:'music',label:'Nhạc nền',Icon:Music2,count:settings.tracks.length},{id:'gifts',label:'Hộp quà',Icon:Gift,count:settings.giftRewards.length}];
  const selectSection=id=>{setActiveSection(id);panelTop.current?.scrollIntoView?.({behavior:'smooth',block:'start'});};
  saveHandler.current=save;
  useEffect(()=>{const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&editorRoot.current&&!editorRoot.current.closest('[hidden]')){e.preventDefault();saveHandler.current?.();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);

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
    <main ref={editorRoot} className="editor-page" style={{ minHeight: '100vh', padding: '30px 16px 100px', background: 'linear-gradient(135deg, #fff7ef, #ffe9e8 55%, #fce5dc)', position: 'relative' }}>
      {/* Floating Notification Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: embedded ? '150px' : '20px',
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

      <div className="editor-workbench">
        <header className="editor-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '26px' }}>
          <div><p style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-handwriting)', fontSize: '1.5rem', fontWeight: 700 }}>Bảng chỉnh sửa</p><h1 style={{ fontFamily: 'var(--font-handwriting)', fontSize: 'clamp(2.2rem, 6vw, 3.2rem)' }}>Nội dung cho thiệp sinh nhật</h1></div>
          {!embedded && <div style={{ display: 'flex', gap: '8px' }}><button onClick={handleLogout} className="btn-secondary"><LogOut size={17} /><span>Đăng xuất</span></button><button onClick={onExit} className="btn-secondary"><ArrowLeft size={17} /><span>Về thiệp</span></button></div>}
        </header>
        <p className="editor-intro">Bắt đầu với lời chúc. Sau đó chọn ảnh, nhạc và những bất ngờ bạn muốn gửi. Mẫu quà và quẻ đã sẵn sàng nếu bạn muốn dùng ngay.</p>
        <div className="editor-readiness"><Info size={18}/><span>{missing.length?`Còn thiếu ${missing.map(([,label])=>label).join(', ')} để tạo thiệp hoàn chỉnh. Bạn vẫn có thể lưu nháp.`:'Bốn thông tin chính đã đủ. Hãy xem thiệp trước khi tạo QR.'}</span>{missing.length>0&&<button type="button" disabled={locked} onClick={()=>{selectSection('basics');requestAnimationFrame(()=>editorRoot.current?.querySelector(`[name="${missing[0][0]==='name'?'recipientName':missing[0][0]==='birthDate'?'birthDate':missing[0][0]}"]`)?.focus());}}>Bổ sung</button>}</div>
        <div className="editor-layout">
          <aside className="editor-side-nav"><p>NỘI DUNG CHIẾC THIỆP</p><div role="tablist" aria-label="Các mục chỉnh sửa">{sections.map(({id,label,Icon,count},index)=><button type="button" key={id} id={`editor-tab-${id}`} role="tab" aria-label={`Chỉnh mục ${label}`} aria-selected={activeSection===id} aria-controls={`editor-panel-${id}`} tabIndex={activeSection===id?0:-1} className={activeSection===id?'is-active':''} disabled={locked} onClick={()=>selectSection(id)} onKeyDown={e=>{if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?sections.length-1:(index+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+sections.length)%sections.length;selectSection(sections[target].id);document.getElementById(`editor-tab-${sections[target].id}`)?.focus();}}}><Icon size={18}/><span>{label}</span><small>{count}</small></button>)}</div><div className="editor-side-note">Chỉnh từng mục theo ý bạn. Chuyển mục không làm mất nội dung. Nhớ lưu trước khi rời trang.</div></aside>
          <div className="editor-panels" ref={panelTop}>


        <div className="editor-panel" role="tabpanel" id="editor-panel-basics" aria-labelledby="editor-tab-basics" hidden={activeSection!=='basics'}><CardBasicsEditor card={settings.cardData} onChange={updateCardData}/></div>
        <div className="editor-panel" role="tabpanel" id="editor-panel-gifts" aria-labelledby="editor-tab-gifts" hidden={activeSection!=='gifts'}>
        <GiftRewardsEditor rewards={settings.giftRewards} onChange={giftRewards=>setSettings(current=>({...current,giftRewards}))}>
          <SurpriseCardFields label="hộp quà" card={settings.surpriseCards.gift} onChange={(field,value)=>updateSurpriseCard('gift',field,value)}/>
        </GiftRewardsEditor></div>
        <div className="editor-panel" role="tabpanel" id="editor-panel-photos" aria-labelledby="editor-tab-photos" hidden={activeSection!=='photos'}>
        <MemoriesEditor memories={settings.memories} uploadImage={saveImageFile} onUploadingChange={setIsProcessingImage} onChange={update=>setSettings(current=>({...current,memories:typeof update==='function'?update(current.memories):update}))}/></div>


        <div className="editor-panel" role="tabpanel" id="editor-panel-music" aria-labelledby="editor-tab-music" hidden={activeSection!=='music'}><MusicEditor tracks={settings.tracks} uploadAudio={saveAudioFile} onUploadingChange={setIsProcessingAudio} onChange={update=>setSettings(current=>({...current,tracks:typeof update==='function'?update(current.tracks):update}))}/></div>
          </div>
        </div>


        <div className="editor-savebar"><div><CheckCircle2 size={19}/><span>{locked?'Đang xử lý…':dirty?'Có thay đổi chưa lưu':'Đã lưu nội dung'}<small>Ctrl / Cmd + S để lưu nhanh</small></span></div><div className="editor-savebar-actions"><button type="button" onClick={save} disabled={locked||!dirty} className="btn-secondary">{isSaving?<Loader2 size={17} className="animate-spin"/>:<Save size={17}/>} Lưu thay đổi</button>{onPreview&&<button type="button" className="btn-primary" disabled={locked} onClick={onPreview}><Eye size={17}/> Lưu và xem thiệp</button>}</div></div>
      </div>
    </main>
  );
});
