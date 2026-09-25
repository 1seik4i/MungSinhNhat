import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import giftBox from '../assets/gift-box-real.png';
import fortuneCookie from '../assets/fortune-cookie-real.png';

export default function BirthdaySurprises({ onOpenGift, onOpenFortune, cardSettings }) {
  const options = [
    {
      image: cardSettings?.gift?.image || giftBox,
      imageAlt: 'Hộp quà thắt nơ',
      title: cardSettings?.gift?.title || 'Hộp quà bí mật',
      description: cardSettings?.gift?.description || 'Một món quà nhỏ đang chờ em mở ra.',
      action: cardSettings?.gift?.action || 'Mở hộp quà',
      onClick: onOpenGift,
      accent: '#c85e6f',
      background: 'linear-gradient(135deg, #fff2ed, #fbe0df)',
    },
    {
      image: cardSettings?.fortune?.image || fortuneCookie,
      imageAlt: 'Bánh quy may mắn',
      title: cardSettings?.fortune?.title || 'Gieo thẻ sinh nhật',
      description: cardSettings?.fortune?.description || 'Khám phá một lời nhắn may mắn cho tuổi mới.',
      action: cardSettings?.fortune?.action || 'Gieo thẻ ngay',
      onClick: onOpenFortune,
      accent: '#b78940',
      background: 'linear-gradient(135deg, #fff8e8, #f7e9c9)',
    },
  ];

  return (
    <section style={{ maxWidth: '850px', margin: '0 auto 40px', padding: '0 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel"
        style={{ padding: '30px 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <p style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-handwriting)', fontSize: '1.4rem', fontWeight: 700 }}>Thêm một chút bất ngờ</p>
          <h2 className="mobile-balanced-heading" style={{ marginTop: '4px', fontFamily: 'var(--font-handwriting)', fontSize: 'clamp(2rem, 5vw, 2.7rem)', fontWeight: 700 }}><span>Chọn món quà</span>{' '}<span className="keep-together">dành cho em</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          {options.map(({ image, imageAlt, title, description, action, onClick, accent, background }) => (
            <motion.button
              key={title}
              type="button"
              onClick={onClick}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                border: `1px solid ${accent}33`, background, borderRadius: '18px', padding: '20px',
                textAlign: 'left', color: 'var(--text-main)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 250, 245, .75)', boxShadow: '0 4px 12px rgba(101, 60, 54, .1)', overflow: 'hidden' }}>
                <img src={image} alt={imageAlt} style={{ width: '47px', height: '47px', objectFit: 'contain' }} />
              </span>
              <h3 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '1.45rem', margin: '14px 0 6px', fontWeight: 700 }}>{title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', lineHeight: 1.55 }}>{description}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: accent, fontWeight: 700, fontSize: '.9rem', marginTop: '16px' }}>{action}<ChevronRight size={16} /></span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
