import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Send, MessageSquareHeart, Sparkles, User, Tag } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import { blastHearts, blastConfetti } from '../utils/confettiHelper';

const AVATAR_OPTIONS = ['🌸', '🐱', '🦄', '🌟', '🎈', '🧸', '🍰', '🎁', '🌻', '🍓', '👑', '💫'];
const STICKER_OPTIONS = ['✨', '🎉', '💖', '🥳', '💐', '🎂', '💌', '⭐'];
const COLOR_OPTIONS = ['#ff6b9d', '#c78bfa', '#fbbf24', '#38bdf8', '#34d399', '#f472b6'];

export default function WishesWall() {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [avatar, setAvatar] = useState('🌸');
  const [sticker, setSticker] = useState('✨');
  const [color, setColor] = useState('#ff6b9d');
  const [submitting, setSubmitting] = useState(false);

  // Fetch wishes from API
  const fetchWishes = async () => {
    try {
      const res = await fetch('/api/wishes');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWishes(json.data);
        }
      }
    } catch (err) {
      console.warn('Fallback wishes loaded due to offline or proxy:', err);
      // Fallback local initial state
      setWishes([
        {
          id: 'w1',
          author: 'Bạn Thân',
          avatar: '🌸',
          color: '#ff6b9d',
          content: 'Chúc Minh Anh sinh nhật siêu cấp rực rỡ! Tuổi mới luôn ngập tràn may mắn, xinh đẹp rạng ngời và đạt được mọi mục tiêu nhé! ✨🎂',
          likes: 12,
          createdAt: new Date().toISOString(),
          sticker: '🎉'
        },
        {
          id: 'w2',
          author: 'Cạ Cứng',
          avatar: '🐱',
          color: '#c78bfa',
          content: 'Happy Birthday to my favorite human! Mong cậu luôn giữ nụ cười tỏa nắng, ăn hoài không béo và tiền vô như nước nha! 🥳💖',
          likes: 8,
          createdAt: new Date().toISOString(),
          sticker: '🍰'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishes();
  }, []);

  const handleLike = async (id) => {
    soundEngine.playPop();
    blastHearts();
    // Optimistic UI update
    setWishes(prev =>
      prev.map(w => (w.id === id ? { ...w, likes: (w.likes || 0) + 1 } : w))
    );

    try {
      await fetch(`/api/wishes/${id}/like`, { method: 'POST' });
    } catch (e) {
      console.warn('Like sync failed:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    soundEngine.playSparkle();

    const newWishData = {
      author: author.trim() || 'Người bạn giấu tên',
      content: content.trim(),
      avatar,
      sticker,
      color,
    };

    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWishData),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWishes(prev => [json.data, ...prev]);
        }
      } else {
        // Fallback local prepend
        setWishes(prev => [
          {
            id: 'w_' + Date.now(),
            ...newWishData,
            likes: 0,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      }
    } catch (err) {
      setWishes(prev => [
        {
          id: 'w_' + Date.now(),
          ...newWishData,
          likes: 0,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    } finally {
      setContent('');
      setSubmitting(false);
      blastConfetti();
    }
  };

  return (
    <div
      id="wishes-section"
      style={{
        maxWidth: '1050px',
        margin: '50px auto',
        padding: '0 16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel"
        style={{
          padding: '40px 24px',
          position: 'relative',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
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
            <MessageSquareHeart size={24} />
            <span>Sổ Lưu Bút Kỷ Niệm</span>
          </div>
          <h2
            style={{
              fontSize: '2.3rem',
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              marginTop: '4px',
            }}
          >
            💌 Bức Tường Lời Chúc Ngọt Ngào
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Hãy gửi gắm những tâm tư, lời chúc chân thành nhất để lưu giữ kỷ niệm sinh nhật đáng nhớ này nhé!
          </p>
        </div>

        {/* Input Form Box */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '750px',
            margin: '0 auto 45px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {/* Author Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                Tên hoặc Biệt danh của bạn:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ví dụ: Bạn thân chí cốt..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Avatar & Color Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                Chọn Biểu tượng & Gam màu:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: '#1a1028',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {AVATAR_OPTIONS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>

                {/* Color dots */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {COLOR_OPTIONS.map(c => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: c,
                        cursor: 'pointer',
                        border: color === c ? '2px solid #fff' : '2px solid transparent',
                        boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Wish Message Content */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              Nội dung lời chúc:
            </label>
            <textarea
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết lời chúc yêu thương của bạn ở đây..."
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.95rem',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Stickers row & Submit button */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Sticker:</span>
              {STICKER_OPTIONS.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSticker(s)}
                  style={{
                    background: sticker === s ? 'rgba(255,255,255,0.2)' : 'transparent',
                    border: sticker === s ? '1px solid var(--accent-gold)' : 'none',
                    borderRadius: '8px',
                    padding: '4px 6px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.95rem' }}
            >
              <Send size={16} />
              <span>{submitting ? 'Đang gửi...' : 'Gửi Lời Chúc'}</span>
            </button>
          </div>
        </form>

        {/* Wishes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {wishes.map((w, index) => (
            <motion.div
              key={w.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '22px',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                borderLeft: `4px solid ${w.color || 'var(--accent-primary)'}`,
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Sticker badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '14px',
                  fontSize: '1.4rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              >
                {w.sticker || '✨'}
              </div>

              <div>
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      border: `1px solid ${w.color || 'var(--accent-primary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    {w.avatar || '🌸'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      {w.author || 'Người bạn giấu tên'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      {w.createdAt ? new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <p
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    marginBottom: '16px',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {w.content}
                </p>
              </div>

              {/* Footer with Like Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '10px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  #BirthdayWish
                </span>

                <button
                  onClick={() => handleLike(w.id)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255, 107, 157, 0.3)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    color: '#ff6b9d',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  title="Thả tim cho lời chúc này"
                >
                  <Heart size={14} fill="#ff6b9d" />
                  <span>{w.likes || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
