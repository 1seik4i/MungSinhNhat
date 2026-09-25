import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Share2, Mail, CakeSlice, PartyPopper, Settings2 } from 'lucide-react';
import { blastConfetti, launchSideCannons } from '../utils/confettiHelper';
import { soundEngine } from '../utils/audioSynth';

export default function HeroHeader({
  cardData,
  onOpenGift,
  onOpenFortune,
  onReopenEnvelope,
  onScrollToCake,
  onOpenEditor
}) {
  const handleCelebrationClick = () => {
    soundEngine.playSparkle();
    blastConfetti();
    launchSideCannons();
  };

  const handleShare = () => {
    soundEngine.playPop();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('✨ Đã sao chép liên kết thiệp chúc mừng vào bộ nhớ tạm!');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '850px', margin: '0 auto', textAlign: 'center', padding: '20px 16px 40px' }}>
      
      {/* Top Bar with Quick Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginBottom: '25px' }}>
        <button
          onClick={onReopenEnvelope}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', padding: '6px 14px' }}
          title="Mở lại phong bì thư niêm phong sáp"
        >
          <Mail size={15} color="var(--accent-primary)" />
          <span>Mở lại bức thư</span>
        </button>
        <button
          onClick={handleShare}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', padding: '6px 14px' }}
          title="Chia sẻ thiệp"
        >
          <Share2 size={15} />
          <span>Chia sẻ</span>
        </button>
        <button onClick={onOpenEditor} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }} title="Chỉnh ảnh thẻ và nhạc nền">
          <Settings2 size={15} />
          <span>Chỉnh sửa nội dung</span>
        </button>
      </div>

      {/* Main Glass Greeting Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel"
        style={{
          position: 'relative',
          padding: '45px 30px 40px',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '350px',
            height: '250px',
            background: 'radial-gradient(ellipse at center, rgba(220, 142, 116, 0.18), transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Date badge */}
        <motion.div whileHover={{ y: -2 }} className="birthday-date-ribbon">
          <span className="birthday-date-ribbon__date"><Calendar size={18} strokeWidth={1.9} />{cardData.birthDate || '05 / 10'}</span>
          <span className="birthday-date-ribbon__divider" />
          <span className="birthday-date-ribbon__label">Ngày của em</span>
        </motion.div>

        {/* Greeting Title */}
        <div
          style={{
            fontFamily: 'var(--font-handwriting)',
            fontSize: '1.9rem',
            color: 'var(--text-muted)',
            textShadow: 'none',
            marginBottom: '4px',
          }}
        >
          {cardData.title || 'Chúc Mừng Sinh Nhật'}
        </div>

        {/* Name */}
        <h1
          className="text-shimmer glow-pulse"
          style={{
            fontFamily: 'var(--font-romantic)',
            fontSize: 'clamp(3rem, 7vw, 5rem)',
            lineHeight: 1.5,
            margin: '0 auto 15px',
            padding: '12px 18px 16px',
            wordSpacing: '0.18em',
            overflow: 'visible',
            filter: 'drop-shadow(0 8px 12px rgba(167, 73, 92, 0.12))',
          }}
        >
          {cardData.name || 'Minh Anh'}
        </h1>

        {/* Subtitle / Decorative Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            margin: '10px auto 25px',
          }}
        >
          <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, var(--accent-primary))' }} />
          <CakeSlice size={23} color="var(--accent-gold)" strokeWidth={1.7} />
          <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, var(--accent-primary), transparent)' }} />
        </div>

        {/* Heartfelt Message */}
        <p
          style={{
            fontSize: '1.15rem',
            lineHeight: 1.9,
            color: 'var(--text-muted)',
            maxWidth: '650px',
            margin: '0 auto 30px',
            whiteSpace: 'pre-line',
            fontFamily: 'var(--font-sans)',
            fontWeight: 400,
          }}
        >
          {cardData.message || `Chúc em một ngày sinh nhật thật rực rỡ, ấm áp và đong đầy nụ cười!\nƯớc mong tuổi mới của em sẽ mở ra ngàn vạn điều may mắn, vạn sự hanh thông và luôn xinh đẹp rạng ngời như ánh ban mai.`}
        </p>

        {/* Feature Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          <button
            onClick={handleCelebrationClick}
            className="btn-primary"
          >
            <PartyPopper size={18} />
            <span>Bắt đầu bữa tiệc</span>
          </button>

          <button
            onClick={onScrollToCake}
            className="btn-secondary"
          >
            <CakeSlice size={18} color="var(--accent-primary)" />
            <span>Thổi nến ước nguyện</span>
          </button>

        </div>
      </motion.div>
    </div>
  );
}
