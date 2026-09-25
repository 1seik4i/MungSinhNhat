import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Copy, Check, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import { blastConfetti } from '../utils/confettiHelper';

const SAMPLE_MESSAGES = [
  `Chúc bạn một ngày sinh nhật thật rực rỡ, ấm áp và đong đầy nụ cười! Ước mong tuổi mới của bạn sẽ mở ra ngàn vạn điều may mắn, vạn sự hanh thông và luôn xinh đẹp rạng ngời như ánh ban mai. 🌸✨`,
  `Happy Birthday to the most amazing person! Chúc bạn tuổi mới luôn ngập tràn năng lượng tích cực, ăn ngon ngủ ngon, công việc thuận lợi và tiền vào như nước! 🥳💸`,
  `Sinh nhật vui vẻ nhé người bạn thân yêu! Cảm ơn vì đã luôn đồng hành và mang đến cho cuộc sống này thật nhiều tiếng cười hạnh phúc. Mãi mãi là cạ cứng số một! 💖🍰`
];

export default function CardCustomizer({ isOpen, onClose, cardData, onUpdateCard }) {
  const [name, setName] = useState(cardData.name || 'Minh Anh');
  const [birthDate, setBirthDate] = useState(cardData.birthDate || '05/10');
  const [title, setTitle] = useState(cardData.title || 'Chúc Mừng Sinh Nhật');
  const [message, setMessage] = useState(cardData.message || SAMPLE_MESSAGES[0]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    soundEngine.playSparkle();

    const updated = {
      name: name.trim() || 'Minh Anh',
      birthDate: birthDate.trim() || '05/10',
      title: title.trim() || 'Chúc Mừng Sinh Nhật',
      message: message.trim(),
    };

    try {
      const res = await fetch('/api/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const json = await res.json();
        const newUrl = `${window.location.origin}${window.location.pathname}?card=${json.id}`;
        window.history.replaceState(null, '', newUrl);
      }
    } catch (err) {
      console.warn('Card saved locally:', err);
    } finally {
      onUpdateCard(updated);
      setSaving(false);
      blastConfetti();
      onClose();
    }
  };

  const copyShareLink = () => {
    soundEngine.playPop();
    const query = new URLSearchParams({
      name: name.trim(),
      date: birthDate.trim(),
    }).toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(5, 2, 12, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '35px 25px',
            position: 'relative',
            background: 'linear-gradient(145deg, rgba(30, 15, 45, 0.95), rgba(10, 5, 20, 0.98))',
            border: '1px solid rgba(255, 107, 157, 0.3)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-handwriting)',
                fontSize: '1.6rem',
                fontWeight: 700,
              }}
            >
              <Wand2 size={20} />
              <span>Studio Tạo Thiệp Riêng</span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              🎨 Tùy Biến Thông Điệp Sinh Nhật
            </h2>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                  Tên người nhận:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Minh Anh"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                  Ngày sinh nhật:
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="Ví dụ: 05/10"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                Tiêu đề thiệp:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Chúc Mừng Sinh Nhật"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  Lời chúc yêu thương:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {SAMPLE_MESSAGES.map((msg, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setMessage(msg)}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        color: 'var(--accent-gold)',
                        cursor: 'pointer',
                      }}
                    >
                      Mẫu {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.95rem',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '25px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={copyShareLink}
                className="btn-secondary"
              >
                {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                <span>{copied ? 'Đã sao chép link!' : 'Copy Link Thiệp'}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                <Sparkles size={16} />
                <span>{saving ? 'Đang lưu...' : 'Áp Dụng Thiệp'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
