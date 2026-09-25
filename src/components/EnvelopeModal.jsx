import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEngine } from '../utils/audioSynth';
import { blastConfetti, blastHearts, blastStars } from '../utils/confettiHelper';
import { Sparkles, Cake, ChevronRight, PartyPopper, Heart } from 'lucide-react';

export default function EnvelopeModal({ recipientName = 'Minh Anh', onOpen }) {
  // 'closed' -> 'opened' -> 'transitioning'
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (isOpen) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 14;
    const y = (clientY / innerHeight - 0.5) * 14;
    setMousePos({ x, y });
  };

  const handleOpenLetter = () => {
    if (isOpen) return;
    soundEngine.playWhoosh();
    soundEngine.playSparkle();
    setIsOpen(true);
    blastHearts();

    // Trigger celebratory confetti in background smoothly
    setTimeout(() => {
      blastStars();
      blastConfetti();
    }, 900);
  };

  const handleEnterParty = () => {
    setIsTransitioning(true);
    soundEngine.playSparkle();
    blastConfetti();
    setTimeout(() => {
      onOpen && onOpen();
    }, 600);
  };

  if (isTransitioning) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, scale: 1.08 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'radial-gradient(circle at center, #24113b 0%, #06010d 100%)',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onMouseMove={handleMouseMove}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'radial-gradient(ellipse at center, #220f38 0%, #0f041d 55%, #05010a 100%)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          perspective: '1200px',
        }}
      >
        {/* Ambient floating stardust */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '25%',
              left: '35%',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 107, 157, 0.25) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                left: `${(i * 18) % 94}%`,
                top: `${(i * 22) % 92}%`,
                fontSize: i % 3 === 0 ? '1.3rem' : '1rem',
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))',
              }}
            >
              {i % 3 === 0 ? '✨' : i % 3 === 1 ? '🌸' : '⭐'}
            </motion.div>
          ))}
        </div>

        {/* ================= 3D ENVELOPE & LETTER CONTAINER ================= */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          {/* 3D Envelope */}
          <motion.div
            animate={{
              rotateY: !isOpen ? mousePos.x : 0,
              rotateX: !isOpen ? -mousePos.y : 0,
              y: !isOpen ? [0, -6, 0] : 0,
              scale: !isOpen ? 1 : 0.9,
              opacity: !isOpen ? 1 : 0,
              pointerEvents: !isOpen ? 'auto' : 'none',
            }}
            transition={
              !isOpen
                ? {
                    y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                    scale: { duration: 0.4 },
                  }
                : {
                    duration: 0.6,
                    delay: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
            onClick={handleOpenLetter}
            style={{
              position: 'absolute',
              width: 'min(78vw, 480px)',
              aspectRatio: '1.52 / 1',
              perspective: '1200px',
              transformStyle: 'preserve-3d',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            {/* 1. Envelope Back Interior */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(145deg, #d4be8d, #bda470)',
                borderRadius: '16px',
                boxShadow: '0 30px 70px rgba(0,0,0,0.65), 0 0 40px rgba(255, 183, 77, 0.2)',
                border: '1.5px solid rgba(212, 175, 55, 0.4)',
              }}
            />

            {/* 2. Top Flap (Opens upwards 180 deg in 3D) */}
            <motion.div
              animate={isOpen ? { rotateX: 180, zIndex: 1 } : { rotateX: 0, zIndex: 25 }}
              transition={{ duration: 0.65, ease: [0.34, 1.2, 0.64, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '56%',
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                pointerEvents: 'none',
              }}
            >
              {/* Front of Top Flap */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  background: 'linear-gradient(180deg, #ecd6a9 0%, #dec494 100%)',
                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.22))',
                }}
              />
            </motion.div>

            {/* 3. Solid Front Pocket (Left, Right, Bottom Triangles - completely covers the letter) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '16px',
                overflow: 'hidden',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            >
              {/* Left Side Flap */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '50%',
                  clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
                  background: 'linear-gradient(135deg, #e8d0a2 0%, #dbbf8c 100%)',
                }}
              />
              {/* Right Side Flap */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '50%',
                  clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
                  background: 'linear-gradient(225deg, #e8d0a2 0%, #dbbf8c 100%)',
                }}
              />
              {/* Bottom Large Flap */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '65%',
                  clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                  background: 'linear-gradient(180deg, #ecd7ad 0%, #dbbf8c 100%)',
                  boxShadow: '0 -4px 15px rgba(0,0,0,0.12)',
                }}
              />
            </div>

            {/* 4. Wax Seal Button (Seals top flap and bottom pocket together in center) */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 30 }}>
              <motion.div
                animate={
                  isOpen
                    ? { scale: 0, opacity: 0, rotate: 30 }
                    : { scale: [1, 1.05, 1], opacity: 1 }
                }
                transition={
                  !isOpen
                    ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.35, ease: 'easeIn' }
                }
              >
                <div className="wax-seal">
                  <span>♥</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ================= UNFOLDED PARCHMENT LETTER (Appears & Expands Seamlessly) ================= */}
          <motion.div
            initial={false}
            animate={
              isOpen
                ? {
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    pointerEvents: 'auto',
                  }
                : {
                    scale: 0.5,
                    y: 60,
                    opacity: 0,
                    pointerEvents: 'none',
                  }
            }
            transition={{
              duration: 0.75,
              delay: isOpen ? 0.3 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="envelope-letter-card"
            style={{
              position: 'relative',
              width: 'min(calc(100% - 24px), 480px)',
              maxWidth: '480px',
              maxHeight: 'min(94vh, 600px)',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              background: 'linear-gradient(135deg, #fffdfa 0%, #fff8ee 50%, #fef3c7 100%)',
              borderRadius: '22px',
              padding: 'clamp(18px, 3vh, 28px) clamp(16px, 3.5vw, 24px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(255, 215, 0, 0.35)',
              border: '2px solid rgba(251, 191, 36, 0.45)',
              textAlign: 'center',
              zIndex: 40,
            }}
          >
            {/* Vintage Filigree Corner Ornaments */}
            <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '1.1rem', color: '#f59e0b', opacity: 0.6 }}>✦</div>
            <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '1.1rem', color: '#f59e0b', opacity: 0.6 }}>✦</div>
            <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '1.1rem', color: '#f59e0b', opacity: 0.6 }}>✦</div>
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '1.1rem', color: '#f59e0b', opacity: 0.6 }}>✦</div>

            {/* Letter Header */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(236, 72, 153, 0.1)',
                  padding: '4px 14px',
                  borderRadius: '30px',
                  color: '#e11d48',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                <Cake size={14} />
                <span>BỨC THƯ SINH NHẬT ĐẶC BIỆT</span>
                <Sparkles size={14} />
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-romantic)',
                  background: 'linear-gradient(135deg, #e11d48, #9333ea, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.15,
                  margin: '0 0 8px',
                  padding: '4px 6px 0',
                  overflow: 'visible',
                }}
              >
                <span style={{ display: 'block', fontSize: 'clamp(1.7rem, 4.4vw, 2.5rem)', lineHeight: 1.15 }}>Thương gửi</span>
                <span style={{ display: 'block', fontSize: 'clamp(2.1rem, 5.5vw, 3.2rem)', lineHeight: 1.1, marginTop: '1px' }}>{recipientName}</span>
              </h2>

              <div
                style={{
                  width: '70px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #ec4899, #f59e0b, transparent)',
                  margin: '0 auto 12px',
                }}
              />
            </div>

            {/* Letter Body */}
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(0.88rem, 2.4vw, 0.98rem)',
                lineHeight: 1.55,
                color: '#374151',
                margin: '0 auto 16px',
                maxWidth: '420px',
                textAlign: 'center',
              }}
            >
              Chúc em một ngày sinh nhật ngập tràn <strong>tiếng cười</strong>, <strong>sự ấm áp</strong> và những điều kỳ diệu nhất! ✨<br />
              Mong rằng ở tuổi mới, mọi ước nguyện của em đều sẽ đơm hoa kết trái, em luôn được bao bọc bởi tình yêu thương và giữ mãi nụ cười rạng rỡ trên môi. 🌸💖
            </p>

            {/* Enter Celebration Button */}
            <button
              onClick={handleEnterParty}
              className="btn-primary"
              style={{
                fontSize: 'clamp(0.92rem, 2.5vw, 1rem)',
                padding: '10px 24px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #e11d48, #9333ea)',
                boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)',
                cursor: 'pointer',
                gap: '8px',
              }}
            >
              <PartyPopper size={18} />
              <span>Bước Vào Bữa Tiệc Sinh Nhật</span>
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Action Hint when closed */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: [0.6, 1, 0.6], y: [0, -6, 0], x: '-50%' }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 'clamp(14px, 4vh, 45px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: 'max-content',
              maxWidth: 'calc(100vw - 20px)',
              color: '#fef08a',
              fontSize: 'clamp(0.85rem, 3.4vw, 1.08rem)',
              fontWeight: 600,
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              textShadow: '0 0 16px rgba(254, 240, 138, 0.7)',
              pointerEvents: 'none',
            }}
          >
            <Heart size={16} fill="#ff6b9d" color="#ff6b9d" style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>Chạm vào dấu sáp đỏ để mở thư</span>
            <Heart size={16} fill="#ff6b9d" color="#ff6b9d" style={{ flexShrink: 0 }} />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
