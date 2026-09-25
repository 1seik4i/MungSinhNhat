// Web Audio API Sound Synthesizer & Music Box

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentTrack = 'classic';
    this.musicTimeout = null;
    this.volume = 0.4;
    this.melodyOscillators = new Set();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a single harmonic note (Music Box / Bell tone)
  playBellNote(freq, startTime, duration = 0.8, volume = 0.2, isMelody = false) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.value = freq;

    // slight overtone for shimmer
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;

    filter.type = 'lowpass';
    filter.frequency.value = 3500;

    const netVolume = volume * this.volume;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(netVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    if (isMelody) {
      [osc1, osc2].forEach((oscillator) => {
        this.melodyOscillators.add(oscillator);
        oscillator.addEventListener('ended', () => this.melodyOscillators.delete(oscillator), { once: true });
      });
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // Sound Effect: Envelope Open / Page Whoosh
  playWhoosh() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Sound Effect: Candle Extinguish (Puff / Wind)
  playCandlePuff() {
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Sound Effect: Sparkle / Magic Chime
  playSparkle() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    freqs.forEach((freq, index) => {
      this.playBellNote(freq, now + index * 0.06, 0.7, 0.15);
    });
  }

  // Sound Effect: Heart / Like Pop
  playPop() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Melodies
  getTracks() {
    return [
      { id: 'classic', name: '🎂 Happy Birthday (Music Box)' },
      { id: 'lofi', name: '☕ Lo-Fi Birthday Chill' },
      { id: 'dreamy', name: '✨ Dreamy Wishing Star' }
    ];
  }

  // Play full birthday melody in loop
  playMelody(trackId = 'classic') {
    this.init();
    if (!this.ctx) return;
    this.isPlaying = true;
    this.currentTrack = trackId;

    if (this.musicTimeout) clearTimeout(this.musicTimeout);

    let melodyNotes = [];
    if (trackId === 'classic') {
      // Classic Happy Birthday (C4 -> C5)
      melodyNotes = [
        { f: 261.63, d: 0.35, pause: 0.1 },
        { f: 261.63, d: 0.35, pause: 0.1 },
        { f: 293.66, d: 0.7, pause: 0.15 },
        { f: 261.63, d: 0.7, pause: 0.15 },
        { f: 349.23, d: 0.7, pause: 0.15 },
        { f: 329.63, d: 1.2, pause: 0.3 },

        { f: 261.63, d: 0.35, pause: 0.1 },
        { f: 261.63, d: 0.35, pause: 0.1 },
        { f: 293.66, d: 0.7, pause: 0.15 },
        { f: 261.63, d: 0.7, pause: 0.15 },
        { f: 392.00, d: 0.7, pause: 0.15 },
        { f: 349.23, d: 1.2, pause: 0.3 },

        { f: 261.63, d: 0.35, pause: 0.1 },
        { f: 261.63, d: 0.35, pause: 0.1 },
        { f: 523.25, d: 0.7, pause: 0.15 },
        { f: 440.00, d: 0.7, pause: 0.15 },
        { f: 349.23, d: 0.7, pause: 0.15 },
        { f: 329.63, d: 0.7, pause: 0.15 },
        { f: 293.66, d: 1.2, pause: 0.3 },

        { f: 466.16, d: 0.35, pause: 0.1 },
        { f: 466.16, d: 0.35, pause: 0.1 },
        { f: 440.00, d: 0.7, pause: 0.15 },
        { f: 349.23, d: 0.7, pause: 0.15 },
        { f: 392.00, d: 0.7, pause: 0.15 },
        { f: 349.23, d: 1.4, pause: 0.6 },
      ];
    } else if (trackId === 'lofi') {
      // Warm chill chord progression
      melodyNotes = [
        { f: 329.63, d: 0.8, pause: 0.2 },
        { f: 392.00, d: 0.6, pause: 0.1 },
        { f: 493.88, d: 1.0, pause: 0.3 },
        { f: 440.00, d: 0.6, pause: 0.1 },
        { f: 349.23, d: 0.8, pause: 0.2 },
        { f: 293.66, d: 1.2, pause: 0.4 },
        { f: 261.63, d: 0.6, pause: 0.1 },
        { f: 329.63, d: 0.8, pause: 0.2 },
        { f: 392.00, d: 1.4, pause: 0.6 },
      ];
    } else {
      // Dreamy star arpeggio
      melodyNotes = [
        { f: 523.25, d: 0.5, pause: 0.15 },
        { f: 659.25, d: 0.5, pause: 0.15 },
        { f: 783.99, d: 0.5, pause: 0.15 },
        { f: 987.77, d: 0.9, pause: 0.2 },
        { f: 880.00, d: 0.5, pause: 0.15 },
        { f: 783.99, d: 0.5, pause: 0.15 },
        { f: 659.25, d: 1.2, pause: 0.5 },
      ];
    }

    let timeOffset = 0.1;
    const now = this.ctx.currentTime;

    melodyNotes.forEach(note => {
      this.playBellNote(note.f, now + timeOffset, note.d, 0.18, true);
      timeOffset += note.d + note.pause;
    });

    // Schedule next loop
    if (this.isPlaying) {
      this.musicTimeout = setTimeout(() => {
        if (this.isPlaying) {
          this.playMelody(this.currentTrack);
        }
      }, (timeOffset + 0.5) * 1000);
    }
  }

  stopMelody() {
    this.isPlaying = false;
    if (this.musicTimeout) clearTimeout(this.musicTimeout);
    this.musicTimeout = null;
    this.melodyOscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have completed naturally.
      }
    });
    this.melodyOscillators.clear();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }
}

export const soundEngine = new SoundEngine();
