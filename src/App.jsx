import React, { useState, useEffect } from 'react';
import CanvasEffects from './components/CanvasEffects';
import BirthdayDecorations from './components/BirthdayDecorations';
import FallingTreats from './components/FallingTreats';
import EnvelopeModal from './components/EnvelopeModal';
import HeroHeader from './components/HeroHeader';
import InteractiveCake from './components/InteractiveCake';
import BirthdaySurprises from './components/BirthdaySurprises';
import PhotoGallery from './components/PhotoGallery';
import GiftBoxModal from './components/GiftBoxModal';
import MiniGamesModal from './components/MiniGamesModal';
import MusicPlayer from './components/MusicPlayer';
import { launchFireworksShow, launchSideCannons } from './utils/confettiHelper';
import { Heart, Sparkles } from 'lucide-react';
import { getGiftRewards } from '../shared/giftRewards';
import { getFortunes } from '../shared/fortunes';
import { RecipientGenderContext } from './hooks/useRecipientCopy';

// Presentation is taken from MungSinhNhat-master.zip. The account/viewer layer
// supplies authorized content; this component never loads global or cached content.
export default function BirthdayPage({ content, onEdit, onShare }) {
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isFortuneOpen, setIsFortuneOpen] = useState(false);
  const contentSettings = content;
  const cardData = content.cardData;
  const customTracks = content.tracks;
  const contentLoaded = true;
  const giftRewards = getGiftRewards(content);
  const fortunes = getFortunes(content);
  useEffect(() => {
    const timer = window.setTimeout(() => launchFireworksShow(1700), 550);
    return () => window.clearTimeout(timer);
  }, []);

  const handleOpenEnvelope = () => {
    setEnvelopeOpened(true);
    // Start after the envelope fade so the celebration is fully visible.
    window.setTimeout(() => {
      launchFireworksShow(3000);
      launchSideCannons(3200);
    }, 120);
    // Dispatch event to trigger music autoplay smoothly
    window.dispatchEvent(new CustomEvent('app:envelope-opened'));
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <RecipientGenderContext.Provider value={cardData.gender}><div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Background visual canvas with twinkling stars and floral petals */}
      <CanvasEffects />
      <BirthdayDecorations />
      <FallingTreats />

      {/* Initial Envelope Experience */}
      {!envelopeOpened && (
        <EnvelopeModal
          recipientName={cardData.name}
          letterMessage={cardData.message}
          onOpen={handleOpenEnvelope}
        />
      )}

      {/* Main Content (Revealed after envelope open) */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: '30px' }}>
        {/* Hero Greeting Section */}
        <HeroHeader
          cardData={cardData}
          onReopenEnvelope={() => setEnvelopeOpened(false)}
          onScrollToCake={() => scrollToSection('cake-section')}
          onOpenEditor={onEdit}
          onShare={onShare}
        />

        {/* Interactive 3D Birthday Cake */}
        <InteractiveCake onOpenGift={()=>setIsGiftOpen(true)} onOpenFortune={()=>setIsFortuneOpen(true)} giftEnabled={giftRewards.length>0}/>

        {contentLoaded && (
          <BirthdaySurprises
            onOpenGift={() => setIsGiftOpen(true)}
            onOpenFortune={() => setIsFortuneOpen(true)}
            cardSettings={contentSettings.surpriseCards}
            giftEnabled={giftRewards.length > 0}
            fortuneEnabled={fortunes.length > 0}
          />
        )}

        {/* Polaroid Memory Photo Gallery */}
        <PhotoGallery memories={contentSettings.memories} />

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            marginTop: '60px',
            padding: '20px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span>Made with</span>
            <Heart size={16} fill="#ff6b9d" color="#ff6b9d" />
            <span>for a joyful birthday celebration</span>
            <Sparkles size={16} color="var(--accent-gold)" />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} • Chúc mừng sinh nhật {cardData.name}!
          </p>
        </footer>
      </main>

      {/* Floating Music Synth Player */}
      <MusicPlayer customTracks={customTracks} />

      <GiftBoxModal
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        recipientName={cardData.name}
        rewards={giftRewards}
      />

      <MiniGamesModal
        fortunes={fortunes}
        isOpen={isFortuneOpen}
        onClose={() => setIsFortuneOpen(false)}
      />

    </div></RecipientGenderContext.Provider>
  );
}
