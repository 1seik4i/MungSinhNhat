import React, { Suspense, lazy, useState, useEffect } from 'react';
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
import { getAudioFileUrl, loadContentSettings, fetchServerContentSettings } from './utils/contentSettings';
import { Heart, Sparkles } from 'lucide-react';

const EditorPage = lazy(() => import('./components/EditorPage'));

export default function App() {
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isFortuneOpen, setIsFortuneOpen] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [contentSettings, setContentSettings] = useState(loadContentSettings);
  const [customTracks, setCustomTracks] = useState([]);

  const isEditorPage = new URLSearchParams(window.location.search).get('edit') === '1';

  const [cardData, setCardData] = useState(() => loadContentSettings().cardData);

  useEffect(() => {
    if (isEditorPage) return undefined;
    const timer = window.setTimeout(() => launchFireworksShow(1700), 550);
    return () => window.clearTimeout(timer);
  }, [isEditorPage]);

  // Keep the public card aligned with the shared Supabase content on every device.
  useEffect(() => {
    if (isEditorPage) return undefined;

    let active = true;
    const refreshContent = async () => {
      const serverSettings = await fetchServerContentSettings();
      if (!active || !serverSettings) return;
      setContentSettings((current) => (
        JSON.stringify(current) === JSON.stringify(serverSettings) ? current : serverSettings
      ));
    };

    refreshContent().finally(() => {
      if (active) setContentLoaded(true);
    });

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshContent();
    };
    window.addEventListener('focus', refreshContent);
    window.addEventListener('online', refreshContent);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const interval = window.setInterval(refreshContent, 10_000);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshContent);
      window.removeEventListener('online', refreshContent);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [isEditorPage]);

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
    const params = new URLSearchParams(window.location.search);
    if (params.get('card')) return;
    const nameParam = params.get('name');
    const dateParam = params.get('date');
    setCardData((current) => ({
      ...current,
      ...contentSettings.cardData,
      ...(nameParam ? { name: nameParam, birthDate: dateParam || contentSettings.cardData.birthDate } : {}),
    }));
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
    return (
      <Suspense fallback={<main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Đang mở trang chỉnh sửa...</main>}>
        <EditorPage
          onSaved={(savedSettings) => setContentSettings(savedSettings || loadContentSettings())}
          onExit={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('edit');
            window.location.assign(url.toString());
          }}
        />
      </Suspense>
    );
  }

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
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '100px' }}>
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
          onOpenEditor={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('edit', '1');
            window.location.assign(url.toString());
          }}
        />

        {/* Interactive 3D Birthday Cake */}
        <InteractiveCake />

        {contentLoaded && (
          <BirthdaySurprises
            onOpenGift={() => setIsGiftOpen(true)}
            onOpenFortune={() => setIsFortuneOpen(true)}
            cardSettings={contentSettings.surpriseCards}
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
      />

      <MiniGamesModal
        isOpen={isFortuneOpen}
        onClose={() => setIsFortuneOpen(false)}
      />

    </div>
  );
}
