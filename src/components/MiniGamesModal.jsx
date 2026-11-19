import { useRecipientCopy } from '../hooks/useRecipientCopy';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Compass } from 'lucide-react';
import { DEFAULT_FORTUNES, FORTUNE_CATALOG_VERSION } from '../../shared/fortunes';
import { soundEngine } from '../utils/audioSynth';
import { blastStars, launchWishCelebration } from '../utils/confettiHelper';

export default function MiniGamesModal({ isOpen, onClose }) {
  const copy=useRecipientCopy();
  const [fortunes,setFortunes]=useState(DEFAULT_FORTUNES);
  useEffect(()=>{if(!isOpen)return;const controller=new AbortController();fetch('/api/platform/fortune-catalog',{signal:controller.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(result=>{if(result.version===FORTUNE_CATALOG_VERSION&&result.data?.length===100&&result.data.every((f,i)=>f.id===DEFAULT_FORTUNES[i].id&&f.fortune===DEFAULT_FORTUNES[i].fortune))setFortunes(result.data);}).catch(()=>{});return()=>controller.abort();},[isOpen]);
  const [cookieCracked, setCookieCracked] = useState(false);
  const [selectedFortune, setSelectedFortune] = useState(null);
  const [isClosingFortune, setIsClosingFortune] = useState(false);

  const crackCookie = () => {
    if (cookieCracked || !fortunes.length) return;
    soundEngine.playSparkle();
    setSelectedFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
    setCookieCracked(true);
    blastStars();
    launchWishCelebration();
  };

  const resetCookie = () => {
    if (isClosingFortune) return;
    setIsClosingFortune(true);
    window.setTimeout(() => {
      setCookieCracked(false);
      setSelectedFortune(null);
      setIsClosingFortune(false);
    }, 560);
  };

  if (!isOpen || !fortunes.length) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5, 2, 12, 0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }} onClick={(e) => e.stopPropagation()} className="glass-panel"
          style={{ maxWidth: '590px', maxHeight:'90dvh', overflowY:'auto', width: '100%', padding: '35px 25px', textAlign: 'center', position: 'relative', background: 'linear-gradient(145deg, rgba(25, 20, 45, 0.94), rgba(10, 5, 20, 0.98))', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <button onClick={onClose} aria-label="Đóng" style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold)', fontFamily: 'var(--font-handwriting)', fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}><Compass size={22} /><span>Gieo Quẻ Sinh Nhật May Mắn</span></div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>100 quẻ Quan Âm</h2>
          {!cookieCracked && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 auto 6px', maxWidth: '430px' }}>Bẻ chiếc bánh may mắn để mở lời nhắn được giấu riêng cho {copy.you}.</p>}

          <div style={{ position: 'relative', minHeight: cookieCracked ? '240px' : '185px', margin: '10px auto 4px', transition: 'height .36s ease' }}>
            <AnimatePresence>
              {cookieCracked && (
                <motion.div key="fortune-paper" initial={{ opacity: 0, scaleX: 0.04, y: -5 }} animate={isClosingFortune ? { opacity: 0, scaleX: 0.04, y: -5 } : { opacity: 1, scaleX: 1, y: 0 }} exit={{ opacity: 0, scaleX: 0.04 }} transition={isClosingFortune ? { duration: 0.5, ease: [0.64, 0, 0.78, 0] } : { delay: 0.18, duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
                  style={{ position: 'relative', zIndex: 1, marginTop: '16px', insetInline: 0, marginInline: 'auto', width: 'min(430px, calc(100% - 18px))', minHeight: '112px', boxSizing: 'border-box', padding: '14px 32px', borderRadius: '3px', background: 'linear-gradient(90deg, #e7cfa1 0%, #fffdf3 5%, #fffaf0 50%, #fffdf3 95%, #e7cfa1 100%)', borderTop: '1px solid #fff9e9', borderBottom: '1px solid #caa86b', color: '#4b3343', boxShadow: '0 12px 28px rgba(0,0,0,0.34), inset 8px 0 8px -8px rgba(92,58,28,0.35), inset -8px 0 8px -8px rgba(92,58,28,0.35)', transformOrigin: 'center' }}>
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={isClosingFortune ? { opacity: 0 } : { opacity: 1, y: 0 }} transition={isClosingFortune ? { duration: 0.15 } : { delay: 1.02, duration: 0.4 }}>
                    <div style={{ fontFamily: 'var(--font-handwriting)', color: '#b77326', fontSize: '1.2rem', fontWeight: 700, marginBottom: '3px' }}>{selectedFortune?.title}</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.4, fontWeight: 600 }}>{selectedFortune?.fortune}</div>
                    <div style={{ marginTop: '7px', fontSize: '0.75rem', color: '#a14d62', fontWeight: 800 }}>{selectedFortune?.grade} · {selectedFortune?.titleOriginal}</div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {!cookieCracked && !isClosingFortune && (
              <motion.button type="button" onClick={crackCookie} aria-label="Bẻ bánh may mắn" whileHover={{ scale: 1.06, rotate: 3 }} whileTap={{ scale: 0.94 }} style={{ position: 'absolute', left: 'calc(50% - 90px)', top: '2px', width: '180px', height: '180px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontSize: '158px', lineHeight: '180px', filter: 'drop-shadow(0 10px 15px rgba(255, 177, 58, 0.28))' }}>🥠</motion.button>
            )}
          </div>

          {!cookieCracked ? (
            <button onClick={crackCookie} className="btn-primary" style={{ padding: '12px 30px', marginTop: '4px' }}><Wand2 size={18} /><span>Bẻ Bánh Khám Phá Quẻ May</span></button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: isClosingFortune ? 0 : 1, y: isClosingFortune ? 8 : 0 }} transition={{ delay: isClosingFortune ? 0 : 0.55 }}><p style={{ color: 'rgba(255,255,255,0.74)', fontSize: '0.86rem', margin: '2px auto 16px', maxWidth: '430px' }}>{selectedFortune?.interpretationLabel}</p><p style={{marginBottom:14,fontSize:'.72rem'}}><a href={selectedFortune?.sourceUrl} target="_blank" rel="noreferrer" style={{color:'#e5c98c'}}>Xem quẻ gốc · Chinese Temples Committee ↗</a></p><div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}><button onClick={resetCookie} disabled={isClosingFortune} className="btn-secondary"><span>Gieo quẻ khác</span></button><button onClick={onClose} className="btn-primary"><span>Đón nhận may mắn</span></button></div></motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
