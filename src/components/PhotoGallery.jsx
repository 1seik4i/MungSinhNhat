import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, X, Sparkles, Heart, Images } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

const DEFAULT_MEMORIES = [
  {
    id: 1,
    title: 'Nụ Cười Tỏa Nắng',
    date: 'Mùa hè rực rỡ',
    caption: 'Chúc bạn luôn giữ trọn nụ cười hồn nhiên và rạng ngời này trên môi!',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    rotate: -3
  },
  {
    id: 2,
    title: 'Những Chuyến Đi Xa',
    date: 'Thanh xuân phiêu lưu',
    caption: 'Mong bạn sẽ đi đến bất cứ nơi đâu bạn muốn và khám phá muôn điều kỳ diệu.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    rotate: 2
  },
  {
    id: 3,
    title: 'Khoảnh Khắc Bình Yên',
    date: 'Những ngày thảnh thơi',
    caption: 'Mỗi ngày trôi qua đều là một món quà đáng trân trọng và ngập tràn niềm vui.',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    rotate: -2
  },
  {
    id: 4,
    title: 'Rạng Rỡ Đón Tuổi Mới',
    date: 'Sinh nhật ý nghĩa',
    caption: 'Tuổi mới mở ra những trang sách tuyệt vời nhất trong cuộc đời bạn!',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    rotate: 3
  }
];

export default function PhotoGallery({ memories }) {
  const [photos, setPhotos] = useState(memories?.length ? memories : DEFAULT_MEMORIES);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (memories?.length) setPhotos(memories);
  }, [memories]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    soundEngine.playSparkle();
    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto = {
        id: Date.now(),
        title: 'Kỷ Niệm Mới Thêm',
        date: 'Hôm nay',
        caption: 'Một mảnh ghép kỷ niệm đáng nhớ vừa được lưu giữ!',
        image: event.target.result,
        rotate: (Math.random() - 0.5) * 6
      };
      setPhotos(prev => [newPhoto, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '950px', margin: '40px auto', padding: '0 16px' }}>
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
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '35px' }}>
          <div>
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
              <Camera className="mobile-heading-icon" size={22} />
              <span>Góc Kỷ Niệm Polaroid</span>
            </div>
            <h2
              className="mobile-balanced-heading"
              style={{
                fontSize: '2.2rem',
                fontFamily: 'var(--font-handwriting)',
                fontWeight: 700,
                marginTop: '4px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><Images className="mobile-heading-icon" size={28} color="var(--accent-primary)" /><span className="keep-together">Những Khoảnh</span><span className="keep-together">Khắc Tươi Đẹp</span></span>
            </h2>
          </div>

          {/* Add custom photo button */}
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <ImagePlus size={16} />
            <span>Thêm Ảnh Kỷ Niệm</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Polaroid Gallery Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '25px',
            padding: '10px',
          }}
        >
          {photos.map((item) => (
            <div key={item.id} style={{ transform: `rotate(${item.rotate}deg)` }}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => {
                soundEngine.playPop();
                setSelectedPhoto(item);
              }}
              className="polaroid"
              style={{ transformOrigin: 'center center' }}
            >
              {/* Tape sticker on top */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '18px',
                  background: 'rgba(255, 235, 150, 0.75)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(2px)',
                }}
              />

              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '3px',
                  background: '#f3f4f6',
                  marginBottom: '10px',
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h4
                  style={{
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '1.25rem',
                    color: '#1f2937',
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>
                  {item.date}
                </p>
              </div>
            </motion.div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                maxWidth: '500px',
                width: '100%',
                color: '#1f2937',
                position: 'relative',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              }}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>

              <div
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  overflow: 'hidden',
                  borderRadius: '10px',
                  marginBottom: '15px',
                }}
              >
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '1.8rem',
                  color: '#e11d48',
                  fontWeight: 700,
                }}
              >
                {selectedPhoto.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>
                {selectedPhoto.date}
              </p>
              <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#374151' }}>
                {selectedPhoto.caption}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
