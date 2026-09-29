import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Images } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

export default function PhotoGallery({ memories }) {
  const [photos, setPhotos] = useState(Array.isArray(memories) ? memories : []);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    setPhotos(Array.isArray(memories) ? memories : []);
  }, [memories]);

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

        </div>

        {/* Polaroid Gallery Grid */}
        {photos.length === 0 ? (
          <div style={{ padding: '28px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có ảnh kỷ niệm. Hãy thêm ảnh trong trang chỉnh sửa.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '25px',
              padding: '10px',
            }}
          >
          {photos.map((item, index) => {
            const fallbackRotations = [-1.4, 1.1, -0.8, 1.3, -1.1, 0.9];
            const rotation = Number(item.rotate) || fallbackRotations[index % fallbackRotations.length];
            return (
            <div key={item.id} style={{ transform: `rotate(${rotation}deg)` }}>
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
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'low'}
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
          );
          })}
          </div>
        )}
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
                  decoding="async"
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
