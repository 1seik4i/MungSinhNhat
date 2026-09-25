import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, SkipForward, Play, Pause, Disc, ChevronDown, ChevronUp } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export default function MusicPlayer({ customTracks = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const [youtubeTrack, setYoutubeTrack] = useState(null);
  const [playback, setPlayback] = useState({ current: 0, duration: 0 });
  const audioRef = useRef(null);
  const youtubeFrameRef = useRef(null);
  const hasAutoplayedYoutube = useRef(false);
  const lastScrollY = useRef(0);

  const tracks = customTracks;
  const currentTrack = tracks[currentTrackIndex];

  // Detect scroll direction to auto hide on scroll down and auto show on scroll up
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY.current;

          // When scrolling down past 60px -> hide player
          if (diff > 12 && currentScrollY > 60) {
            setIsAutoHidden(true);
          } 
          // When scrolling up or near top of page -> show player
          else if (diff < -12 || currentScrollY < 40) {
            setIsAutoHidden(false);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const wasPlayingBeforeMic = useRef(false);

  // Pause music when mic is turned on, resume music when mic is turned off / candles blown
  useEffect(() => {
    const handlePauseMusic = () => {
      if (isPlaying) {
        wasPlayingBeforeMic.current = true;
        if (youtubeTrack) youtubeCommand('pauseVideo');
        else audioRef.current?.pause();
        soundEngine.stopMelody();
        setIsPlaying(false);
      }
    };

    const handleResumeMusic = () => {
      if (wasPlayingBeforeMic.current) {
        wasPlayingBeforeMic.current = false;
        if (youtubeTrack) {
          youtubeCommand('playVideo');
          setIsPlaying(true);
        } else if (audioRef.current?.src) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    };

    window.addEventListener('app:pause-music', handlePauseMusic);
    window.addEventListener('app:resume-music', handleResumeMusic);
    return () => {
      window.removeEventListener('app:pause-music', handlePauseMusic);
      window.removeEventListener('app:resume-music', handleResumeMusic);
    };
  }, [isPlaying, youtubeTrack]);

  // Autoplay music when user opens envelope successfully
  useEffect(() => {
    const handleEnvelopeOpened = () => {
      if (tracks.length > 0) {
        const trackToPlay = tracks[currentTrackIndex] || tracks[0];
        playTrack(trackToPlay);
      } else {
        // Play gentle default birthday synth chime melody if no custom music track
        soundEngine.init();
        soundEngine.playMelody('classic');
        setIsPlaying(true);
      }
    };

    window.addEventListener('app:envelope-opened', handleEnvelopeOpened);
    return () => window.removeEventListener('app:envelope-opened', handleEnvelopeOpened);
  }, [tracks, currentTrackIndex, volume, isMuted]);

  const youtubeCommand = (func, args = []) => {
    youtubeFrameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
  };

  useEffect(() => {
    if (currentTrackIndex >= tracks.length) setCurrentTrackIndex(Math.max(0, tracks.length - 1));
  }, [currentTrackIndex, tracks.length]);

  useEffect(() => {
    const receiveYoutubeStatus = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      let data;
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
      if (data?.event === 'infoDelivery' && data.info) {
        setPlayback((current) => ({ current: Number.isFinite(data.info.currentTime) ? data.info.currentTime : current.current, duration: Number.isFinite(data.info.duration) ? data.info.duration : current.duration }));
      }
    };
    window.addEventListener('message', receiveYoutubeStatus);
    return () => window.removeEventListener('message', receiveYoutubeStatus);
  }, []);

  useEffect(() => () => {
    soundEngine.stopMelody();
    audioRef.current?.pause();
    youtubeCommand('pauseVideo');
  }, []);

  useEffect(() => {
    // If tracks change and currently nothing is playing, prepare first track index
    if (customTracks.length > 0 && currentTrackIndex >= customTracks.length) {
      setCurrentTrackIndex(0);
    }
  }, [customTracks]);

  useEffect(() => {
    if (!youtubeTrack || !isPlaying) return undefined;
    const interval = window.setInterval(() => {
      youtubeCommand('getCurrentTime');
      youtubeCommand('getDuration');
    }, 900);
    return () => window.clearInterval(interval);
  }, [youtubeTrack, isPlaying]);

  const stopCurrent = () => {
    soundEngine.stopMelody();
    youtubeCommand('pauseVideo');
    setYoutubeTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayback({ current: 0, duration: 0 });
  };

  const playTrack = async (track) => {
    if (!track) return;
    stopCurrent();
    if (track.type === 'youtube') {
      setYoutubeTrack(track);
      setIsPlaying(true);
      return;
    }
    if (!track.source) return;
    const audio = audioRef.current;
    audio.src = track.source;
    audio.volume = isMuted ? 0 : volume;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      if (youtubeTrack) youtubeCommand('pauseVideo');
      else audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (currentTrack.type === 'youtube' && youtubeTrack?.id === currentTrack.id) {
      youtubeCommand('playVideo');
      setIsPlaying(true);
    } else if (currentTrack.type !== 'youtube' && audioRef.current?.src) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else playTrack(currentTrack);
  };

  const nextTrack = () => {
    if (!tracks.length) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlaying) playTrack(tracks[nextIdx]);
  };

  const handleSeek = (event) => {
    const time = Number(event.target.value);
    if (youtubeTrack) youtubeCommand('seekTo', [time, true]);
    else if (audioRef.current) audioRef.current.currentTime = time;
    setPlayback((current) => ({ ...current, current: time }));
  };

  const handleVolumeChange = (event) => {
    const value = parseFloat(event.target.value);
    setVolume(value);
    soundEngine.setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
    if (value > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setVolume(nextMuted ? 0 : volume);
    if (audioRef.current) audioRef.current.volume = nextMuted ? 0 : volume;
    if (youtubeTrack) youtubeCommand('setVolume', [nextMuted ? 0 : volume * 100]);
  };

  const isHidden = isMinimized || isAutoHidden;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 900 }}>
      <audio ref={audioRef} onLoadedMetadata={(event) => setPlayback({ current: 0, duration: event.currentTarget.duration })} onTimeUpdate={(event) => setPlayback({ current: event.currentTarget.currentTime, duration: event.currentTarget.duration })} onEnded={nextTrack} onPause={() => setIsPlaying(false)} />
      {youtubeTrack && <iframe ref={youtubeFrameRef} title="Trình phát nhạc YouTube" onLoad={() => { youtubeCommand('addEventListener', ['onStateChange']); youtubeCommand('getDuration'); }} src={`https://www.youtube.com/embed/${youtubeTrack.source}?autoplay=1&controls=0&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`} allow="autoplay; encrypted-media" style={{ position: 'fixed', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', left: '-10px', bottom: '-10px' }} />}

      <AnimatePresence mode="wait">
        {!isHidden ? (
          <motion.div
            key="expanded-player"
            initial={{ y: 60, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel music-player-card"
            style={{
              position: 'relative',
              width: 'min(224px, calc(100vw - 32px))',
              aspectRatio: '1 / 1',
              background: 'rgba(20, 10, 30, .94)',
              border: '1px solid rgba(255, 107, 157, .35)',
              borderRadius: '24px',
              padding: '16px',
              boxSizing: 'border-box',
              boxShadow: '0 10px 30px rgba(0,0,0,.6), 0 0 20px rgba(255, 107, 157,.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Collapse Down Button */}
            <button
              onClick={() => setIsMinimized(true)}
              title="Hạ xuống ẩn"
              aria-label="Hạ thanh nhạc xuống"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'grid',
                placeItems: 'center',
                color: 'rgba(255, 255, 255, 0.85)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                zIndex: 15,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 157, 0.35)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
              }}
            >
              <ChevronDown size={16} />
            </button>

            <motion.div className="music-player-disc" animate={{ rotate: isPlaying ? 360 : 0 }} transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }} onClick={() => setIsExpanded(!isExpanded)} style={{ flex: '0 0 auto', width: '68px', height: '68px', borderRadius: '50%', background: 'radial-gradient(circle at center, #fff 0 8%, #ff8bc0 9% 16%, #d64d9b 17% 58%, #7d285d 59% 100%)', border: '4px solid #f8b0d5', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff', boxShadow: '0 0 16px rgba(255,107,157,.5)' }}><Disc size={28} /></motion.div>
            <div className="music-player-info" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer', minWidth: 0, width: '100%', textAlign: 'center', marginTop: '8px' }}><div style={{ fontSize: '.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '16px', paddingLeft: '4px' }}>{currentTrack?.name || 'Chưa có bài hát'}</div><div style={{ fontSize: '.7rem', color: isPlaying ? 'var(--accent-primary)' : 'rgba(255,255,255,.45)', marginTop: '2px' }}>{isPlaying ? 'Đang phát' : tracks.length ? 'Nhấn để phát' : 'Thêm nhạc trong Chỉnh sửa'}</div></div>
            <div className="music-player-action-row" style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
              <div className="music-player-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginTop: '8px' }}><button onClick={togglePlay} disabled={!currentTrack} aria-label={isPlaying ? 'Dừng nhạc' : 'Phát nhạc'} style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b9d, #c78bfa)', border: 0, color: '#fff', display: 'grid', placeItems: 'center', cursor: currentTrack ? 'pointer' : 'not-allowed', opacity: currentTrack ? 1 : .45 }}>{isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}</button><button onClick={nextTrack} disabled={!currentTrack} aria-label="Chuyển bài" style={{ background: 'transparent', border: 0, color: 'rgba(255,255,255,.78)', cursor: currentTrack ? 'pointer' : 'not-allowed', display: 'flex', opacity: currentTrack ? 1 : .45 }}><SkipForward size={20} /></button></div>
              {currentTrack && <div className="music-player-progress" style={{ display: 'flex', gap: '5px', alignItems: 'center', width: '100%', color: 'rgba(255,255,255,.55)', fontSize: '.61rem' }}><span>{formatTime(playback.current)}</span><input aria-label="Tiến trình bài hát" type="range" min="0" max={playback.duration || 1} step="0.1" value={Math.min(playback.current, playback.duration || 1)} onChange={handleSeek} style={{ minWidth: 0, flex: 1, accentColor: 'var(--accent-primary)', cursor: playback.duration ? 'pointer' : 'default' }} /><span>{playback.duration ? formatTime(playback.duration) : youtubeTrack ? 'YT' : '--:--'}</span></div>}
            </div>
            <AnimatePresence>{isExpanded && <motion.div className="music-player-volume" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '8px' }}><button onClick={toggleMute} style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer' }}>{isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} style={{ flex: 1, accentColor: 'var(--accent-primary)' }} /></motion.div>}</AnimatePresence>
          </motion.div>
        ) : (
          <motion.button
            key="minimized-pill"
            initial={{ y: 30, opacity: 0, scale: 0.88 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => {
              setIsMinimized(false);
              setIsAutoHidden(false);
            }}
            className="glass-panel"
            title="Nhấn để hiện trình phát nhạc"
            aria-label="Hiện trình phát nhạc"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(20, 10, 30, 0.94)',
              border: '1px solid rgba(255, 107, 157, 0.45)',
              borderRadius: '50px',
              padding: '8px 14px 8px 10px',
              color: '#fff',
              boxShadow: '0 8px 25px rgba(0,0,0,0.6), 0 0 16px rgba(255, 107, 157, 0.35)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at center, #fff 0 10%, #d64d9b 20% 100%)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                boxShadow: isPlaying ? '0 0 10px rgba(255,107,157,0.6)' : 'none',
              }}
            >
              <Disc size={16} color="#fff" />
            </motion.div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isPlaying ? (currentTrack?.name || 'Đang phát...') : 'Bật nhạc'}
            </span>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(255, 107, 157, 0.25)',
                flexShrink: 0,
              }}
            >
              <ChevronUp size={14} color="#ff8bc0" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

