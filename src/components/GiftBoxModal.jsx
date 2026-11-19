import { useRecipientCopy } from '../hooks/useRecipientCopy';
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Gift, RotateCcw, Ticket } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import { blastConfetti, blastHearts, launchFireworksShow } from '../utils/confettiHelper';
import { DEFAULT_GIFT_REWARDS, pickRewardIndex, rewardRollTarget } from '../../shared/giftRewards';
import giftBoxImage from '../assets/gift-box-real.png';

const ITEM_WIDTH = 232;
export default function GiftBoxModal({ isOpen, onClose, recipientName = '', rewards = DEFAULT_GIFT_REWARDS }) {
  const copy=useRecipientCopy();
  const [phase, setPhase] = useState('idle');
  const [targetIndex, setTargetIndex] = useState(22);
  const [rewardIndex, setRewardIndex] = useState(0);

  const selectedReward = rewards[rewardIndex];
  const track = useMemo(() => rewards.length ? Array.from({length:Math.ceil(24/rewards.length)*rewards.length+rewards.length+4},(_,index)=>rewards[index%rewards.length]) : [],[rewards]);
  const rollX = useMemo(() => -(targetIndex * ITEM_WIDTH + ITEM_WIDTH / 2), [targetIndex]);

  const openCase = () => {
    if (phase === 'rolling' || !rewards.length) return;
    const nextReward = pickRewardIndex(rewards);
    const nextTarget = rewardRollTarget(rewards.length,nextReward);
    setTargetIndex(nextTarget);
    setRewardIndex(nextReward);
    setPhase('rolling');
    soundEngine.playWhoosh();
  };

  const finishRoll = () => {
    soundEngine.playSparkle();
    blastConfetti();
    blastHearts();
    launchFireworksShow(1600);
    setPhase('result');
  };

  const resetCase = () => setPhase('idle');

  if (!isOpen || !rewards.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(25, 10, 28, .82)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      >
        <motion.div
          initial={{ scale: .92, y: 22 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .92, y: 22 }} onClick={(event) => event.stopPropagation()}
          className="gift-case-modal"
        >
          <button onClick={onClose} className="gift-case-close" aria-label="Đóng hộp quà"><X size={18} /></button>

          {phase === 'idle' && (
            <div className="gift-case-intro">
              <span className="gift-case-kicker">HỘP QUÀ BÍ MẬT</span>
              <h2>Dành riêng cho {recipientName || 'người nhận'}</h2>
              <p>Có nhiều voucher đang chờ trong hộp quà. Mở một lần để xem may mắn dừng lại ở đâu.</p>
              <motion.button whileHover={{ y: -5, rotate: -1 }} whileTap={{ scale: .96 }} onClick={openCase} className="gift-case-box" aria-label="Mở hộp quà">
                <img src={giftBoxImage} alt="Hộp quà thắt nơ" />
                <span>Chạm để mở</span>
              </motion.button>
              <button onClick={openCase} className="gift-case-open-button"><Gift size={18} /> Mở hộp quà</button>
            </div>
          )}

          {phase === 'rolling' && (
            <div className="gift-case-rolling">
              <span className="gift-case-kicker">VÒNG QUAY VOUCHER</span>
              <h2>Quà nào sẽ thuộc về {copy.you}?</h2>
              <div className="gift-roulette">
                <div className="gift-roulette-marker" />
                <motion.div className="gift-roulette-track" style={{left:'50%'}} initial={{ x: 0 }} animate={{ x: rollX }} transition={{ duration: 7.4, ease: [0.08, 0.75, 0.16, 1] }} onAnimationComplete={finishRoll}>
                  {track.map((reward, index) => (
                    <div key={`${reward.code}-${index}`} className="gift-roulette-card" style={{ borderColor: `${reward.tone}99` }}>
                      <span style={{ background: `${reward.tone}22`, color: reward.tone }}><Ticket size={17} /></span>
                      <strong>{reward.title}</strong>
                      <small>{reward.code}</small>
                    </div>
                  ))}
                </motion.div>
              </div>
              <p className="gift-case-roll-note">Đang mở hộp quà…</p>
            </div>
          )}

          {phase === 'result' && (
            <motion.div initial={{ opacity: 0, scale: .86 }} animate={{ opacity: 1, scale: 1 }} className="gift-case-result">
              <span className="gift-case-kicker">VOUCHER CỦA {copy.you.toUpperCase()}</span>
              <h2>Chúc mừng, {recipientName || 'người nhận'}!</h2>
              <div className="gift-case-reward" style={{ '--reward-tone': selectedReward.tone }}>
                <Award size={28} />
                <h3>{selectedReward.title}</h3>
                <p>{selectedReward.desc===DEFAULT_GIFT_REWARDS.find(r=>r.id===selectedReward.id)?.desc?selectedReward.desc.replace(/\bem\b/g,copy.you):selectedReward.desc}</p>
                <code>{selectedReward.code}</code>
              </div>
              <div className="gift-case-actions">
                <button onClick={resetCase} className="gift-case-secondary"><RotateCcw size={16} /> Mở hộp khác</button>
                <button onClick={onClose} className="gift-case-open-button">Lưu quà</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
