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
import EditorPage from './components/EditorPage';
import { launchSideCannons } from './utils/confettiHelper';
import { getAudioFileUrl, loadContentSettings, fetchServerContentSettings } from './utils/contentSettings';
import { Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isFortuneOpen, setIsFortuneOpen] = useState(false);
  const [contentSettings, setContentSettings] = useState(loadContentSettings);
  const [customTracks, setCustomTracks] = useState([]);

  const isEditorPage = new URLSearchParams(window.location.search).get('edit') === '1';

  const [cardData, setCardData] = useState(() => loadContentSettings().cardData);

  // Sync settings with server on app load (ensures desktop edits sync instantly to mobile devices)
  useEffect(() => {
    fetchServerContentSettings().then((serverSettings) => {
      if (serverSettings) {
        setContentSettings(serverSettings);
      }
    });
  }, []);

  // Check URL query parameters for custom cards
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('card');
    const nameParam = params.get('name');
    const dateParam = params.get('date');

    if (cardId) {
      fetch(`/api/card/${cardId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setCardData(data.data);
          }
        })
        .catch(err => console.warn('Could not fetch custom card ID:', err));
    } else if (nameParam) {
      setCardData(prev => ({
        ...prev,
        name: nameParam,
        birthDate: dateParam || prev.birthDate,
      }));
    }
  }, []);

  useEffect(() => {
    setCardData((current) => ({ ...current, ...contentSettings.cardData }));
  }, [contentSettings.cardData]);

  useEffect(() => {
    let active = true;
    const objectUrls = [];
    Promise.all(contentSettings.tracks.map(async (track) => {
      const source = track.type === 'file' ? await getAudioFileUrl(track.source) : track.source;
      if (track.type === 'file' && source) objectUrls.push(source);
      return { ...track, source };
    })).then((tracks) => {
      if (active) setCustomTracks(tracks.filter((track) => track.source));
    });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [contentSettings]);

  if (isEditorPage) {
    return <EditorPage
      onSaved={() => setContentSettings(loadContentSettings())}
      onExit={() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        window.location.assign(url.toString());
      }}
    />;
  }

  const handleOpenEnvelope = () => {
    setEnvelopeOpened(true);
    // Two celebratory cannons fire from the screen edges for four seconds.
    launchSideCannons(4000);
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
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Background visual canvas with twinkling stars and floral petals */}
      <CanvasEffects />
      <BirthdayDecorations />
      <FallingTreats />

      {/* Initial Envelope Experience */}
      {!envelopeOpened && (
        <EnvelopeModal
          recipientName={cardData.name}
          onOpen={handleOpenEnvelope}
        />
      )}

      {/* Main Content (Revealed after envelope open) */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: '30px' }}>
        {/* Hero Greeting Section */}
        <HeroHeader
          cardData={cardData}
          onOpenGift={() => setIsGiftOpen(true)}
          onOpenFortune={() => setIsFortuneOpen(true)}
          onReopenEnvelope={() => setEnvelopeOpened(false)}
          onScrollToCake={() => scrollToSection('cake-section')}
          onOpenEditor={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('edit', '1');
            window.location.assign(url.toString());
          }}
        />

        {/* Interactive 3D Birthday Cake */}
        <InteractiveCake />

        <BirthdaySurprises
          onOpenGift={() => setIsGiftOpen(true)}
          onOpenFortune={() => setIsFortuneOpen(true)}
          cardSettings={contentSettings.surpriseCards}
        />

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

      {/* Gift Box Reveal Modal */}
      <GiftBoxModal
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        recipientName={cardData.name}
      />

      {/* Fortune Cookie & Horoscope Modal */}
      <MiniGamesModal
        isOpen={isFortuneOpen}
        onClose={() => setIsFortuneOpen(false)}
      />

    </div>
  );
}
