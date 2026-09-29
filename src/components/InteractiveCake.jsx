import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEngine } from '../utils/audioSynth';
import { blastConfetti, blastStars } from '../utils/confettiHelper';
import { Wind, RotateCcw, Mic, MicOff, Sparkles, CakeSlice, Send } from 'lucide-react';
import interactiveCake from '../assets/strawberry-birthday-cake-final.png';

const CANDLE_POSITIONS = [
  { left: '37.5%', top: '7%' },
  { left: '40%', top: '11.2%' },
  { left: '51.6%', top: '6%' },
  { left: '57.4%', top: '10.5%' },
  { left: '61.3%', top: '7.6%' },
];

export default function InteractiveCake() {
  const [candles, setCandles] = useState([true, true, true, true, true]);
  const [isAllBlown, setIsAllBlown] = useState(false);
  const [wishMade, setWishMade] = useState('');
  const [submittedWish, setSubmittedWish] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const resumeTimerRef = useRef(null);

  const pauseMusicForCandleBlow = () => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    window.dispatchEvent(new CustomEvent('app:pause-music'));
  };

  const resumeMusicAfterCandleBlow = (delay = 0) => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('app:resume-music'));
      resumeTimerRef.current = null;
    }, delay);
  };

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicListening(false);
  };

  const extinguishCandle = (index) => {
    if (!candles[index]) return;
    if (candles.filter(Boolean).length === 1) pauseMusicForCandleBlow();
    soundEngine.playCandlePuff();
    setCandles(prev => {
      const next = [...prev];
      next[index] = false;
      return next;
    });
  };

  const blowAllCandles = () => {
    pauseMusicForCandleBlow();
    soundEngine.playCandlePuff();
    setCandles([false, false, false, false, false]);
  };

  const relightCandles = () => {
    soundEngine.playSparkle();
    setCandles([true, true, true, true, true]);
    setIsAllBlown(false);
    setSubmittedWish('');
  };

  // Check if all candles blown
  useEffect(() => {
    const allOff = candles.every(c => !c);
    if (allOff && !isAllBlown) {
      setIsAllBlown(true);
      soundEngine.playSparkle();
      blastConfetti();
      blastStars();
      stopMic();
      resumeMusicAfterCandleBlow(800);
    }
  }, [candles, isAllBlown]);

  // Cleanup microphone when component unmounts
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      stopMic();
    };
  }, []);

  // Microphone Blow Detection
  const toggleMic = async () => {
    if (isMicListening) {
      stopMic();
      resumeMusicAfterCandleBlow();
      return;
    }

    // Nếu nến đang tắt hết, tự động thắp sáng lại nến khi bật micro
    if (candles.every(c => !c) || isAllBlown) {
      relightCandles();
    }

    // Tự động tạm dừng nhạc nền khi bắt đầu lắng nghe tiếng thổi
    pauseMusicForCandleBlow();

    try {
      // Yêu cầu luồng âm thanh gốc (tắt lọc nhiễu tự động để bắt trọn xung áp suất gió thổi vào màng mic)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      micStreamRef.current = stream;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsMicListening(true);

      const startTime = Date.now();
      let consecutiveBlowFrames = 0;

      const checkBlow = () => {
        if (!micStreamRef.current || !micStreamRef.current.active) return;
        analyser.getByteFrequencyData(dataArray);

        // Khoảng thời gian đệm 750ms đầu sau khi bật micro để tránh tiếng click chuột / tiếng môi chạm làm tắt nến ngay lập tức
        if (Date.now() - startTime < 750) {
          requestAnimationFrame(checkBlow);
          return;
        }

        // 1. Năng lượng dải tần cực thấp (sub-bass / xung áp lực luồng gió thổi vào màng mic: bin 0 đến 5 ~ 0 - 200Hz)
        let lowSum = 0;
        for (let i = 0; i < 6; i++) {
          lowSum += dataArray[i];
        }
        const lowAvg = lowSum / 6;

        // 2. Năng lượng dải tần giọng nói người (voice harmonics: bin 10 đến 40 ~ 400Hz - 1800Hz)
        let midSum = 0;
        for (let i = 10; i < 40; i++) {
          midSum += dataArray[i];
        }
        const midAvg = midSum / 30;

        // Tiếng thổi thực tế vào micro tạo ra luồng áp suất cực đại ở dải tần số thấp (lowAvg > 125)
        // và áp đảo hoàn toàn dải tần giọng nói thông thường (lowAvg > midAvg * 1.5)
        const isBlowFrame = lowAvg > 125 && (lowAvg > midAvg * 1.5 || lowAvg > 185);

        if (isBlowFrame) {
          consecutiveBlowFrames++;
        } else {
          consecutiveBlowFrames = Math.max(0, consecutiveBlowFrames - 1);
        }

        // Cần duy trì hơi thổi liên tục tối thiểu 4-5 frames (~80-120ms) để xác nhận là hơi thổi có chủ đích
        if (consecutiveBlowFrames >= 4) {
          blowAllCandles();
          return;
        }

        requestAnimationFrame(checkBlow);
      };

      checkBlow();
    } catch (err) {
      console.warn('Microphone permission not granted or unsupported:', err);
      alert('Không thể kích hoạt micro (em có thể nhấn nút "Thổi Tắt Nến" bên dưới thay thế nhé!)');
      stopMic();
      resumeMusicAfterCandleBlow();
    }
  };

  const handleWishSubmit = async (e) => {
    e.preventDefault();
    const wish = wishMade.trim();
    if (!wish) return;
    soundEngine.playSparkle();
    setSubmittedWish(wish);
    setWishMade('');
    blastStars();
    try {
      await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wish }),
      });
    } catch (error) {
      console.warn('Could not save birthday wish:', error);
    }
  };

  return (
    <div
      id="cake-section"
      style={{
        maxWidth: '850px',
        margin: '40px auto',
        padding: '0 16px',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel"
        style={{
          padding: '40px 24px 45px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <span
            style={{
              fontFamily: 'var(--font-handwriting)',
              fontSize: '1.6rem',
              color: 'var(--accent-primary)',
              fontWeight: 700,
            }}
          >
            Thời khắc thiêng liêng
          </span>
          <h2
            className="mobile-balanced-heading"
            style={{
              fontSize: '2.2rem',
              fontFamily: 'var(--font-handwriting)',
              letterSpacing: '0.5px',
              fontWeight: 700,
              marginTop: '4px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}><CakeSlice className="mobile-heading-icon" size={30} color="var(--accent-primary)" /><span>Thổi Nến & Gửi</span><span className="keep-together">Ước Nguyện</span></span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Nhấp vào từng ngọn nến hoặc nhấn nút bên dưới để thổi tắt nến và cầu ước điều tuyệt vời nhất!
          </p>
        </div>

        {/* 3D Birthday Cake Container */}
        <div
          style={{
            position: 'relative',
            width: '320px',
            height: '320px',
            margin: '0 auto 35px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {/* Five animated flames, aligned to the candle positions in the cake artwork. */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            {candles.map((isLit, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => extinguishCandle(idx)}
                style={{
                  position: 'absolute',
                  left: CANDLE_POSITIONS[idx].left,
                  top: CANDLE_POSITIONS[idx].top,
                  width: '28px',
                  height: '35px',
                  transform: 'translateX(-50%)',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: isLit ? 'pointer' : 'default',
                }}
                title={isLit ? 'Nhấn để thổi nến' : 'Nến đã tắt'}
              >
                {isLit ? <span className="flame-real" style={{ display: 'block', margin: '0 auto' }} /> : <span className="smoke-puff" />}
              </button>
            ))}
          </div>

          <img
            src={interactiveCake}
            alt="Bánh kem dâu tây sinh nhật với năm cây nến"
            style={{ width: '320px', height: '320px', objectFit: 'contain', filter: 'drop-shadow(0 14px 16px rgba(94, 55, 49, .2))' }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: '25px' }}>
          <button
            onClick={blowAllCandles}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
          >
            <Wind size={18} />
            <span>Thổi Tắt Nến</span>
          </button>

          <button
            onClick={toggleMic}
            className="btn-secondary"
            style={{
              borderColor: isMicListening ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
              background: isMicListening ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.08)',
            }}
          >
            {isMicListening ? <Mic size={18} color="#ec4899" /> : <MicOff size={18} />}
            <span>{isMicListening ? 'Đang lắng nghe hơi thổi...' : 'Bật Micro để thổi nến'}</span>
          </button>

          <button
            onClick={relightCandles}
            className="btn-secondary"
          >
            <RotateCcw size={18} />
            <span>Thắp Lại Nến</span>
          </button>
        </div>

        {/* Wish Granted Notification */}
        <AnimatePresence>
          {isAllBlown && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="gold-badge"
              style={{
                padding: '16px 24px',
                borderRadius: '16px',
                maxWidth: '550px',
                margin: '0 auto 25px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                ✨ Ước Nguyện Của Em Đã Bay Lên Vũ Trụ! ✨
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main, #2d2427)', fontWeight: 500, marginTop: '6px', lineHeight: 1.5 }}>
                Cả bầu trời sao đang lắng nghe và sẽ biến mọi điều ước tốt đẹp nhất của em thành hiện thực! 🌟
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Private Wish input */}
        <form onSubmit={handleWishSubmit} style={{ maxWidth: '520px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="wish-form-row" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={wishMade}
              onChange={(e) => setWishMade(e.target.value)}
              placeholder="Gõ điều ước sinh nhật bí mật của em vào đây..."
              aria-label="Điều ước sinh nhật"
              className="wish-input"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '12px 18px',
                borderRadius: '50px',
                border: '1px solid rgba(158, 91, 89, 0.28)',
                background: 'rgba(255, 253, 248, 0.94)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                pointerEvents: 'auto',
              }}
            />
            <button
              type="submit"
              className="btn-primary wish-submit"
              style={{ padding: '10px 18px', fontSize: '0.95rem', flex: '0 0 auto', minWidth: '116px', whiteSpace: 'nowrap' }}
            >
              <Send size={16} />
              <span>Gửi Ước Mơ</span>
            </button>
          </div>

          {submittedWish && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '12px',
                color: 'var(--accent-gold)',
                fontStyle: 'italic',
                fontSize: '0.9rem',
              }}
            >
              Đã gửi điều ước: “{submittedWish}”
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
