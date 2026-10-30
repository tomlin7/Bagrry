import { create } from "zustand";

export type PlaybackRate = 1.0 | 1.25 | 1.5 | 2.0;

export const PLAYBACK_RATES: PlaybackRate[] = [1.0, 1.25, 1.5, 2.0];

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {
      /* AudioContext unavailable in test/headless */
    }
  }

  startSpeechSimulation(volume: number, rate: number) {
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    try {
      if (this.osc) {
        try { this.osc.stop(); } catch { /* ignore */ }
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(2.5, now);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);

      // Subtle human speech prosody modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4 * rate, now); // syllable rate ~4Hz
      lfoGain.gain.setValueAtTime(25, now);
      lfo.connect(osc.frequency);
      lfo.start(now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.08, now + 0.05); // warm subtle level

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      this.osc = osc;
      this.gain = gain;
    } catch {
      /* ignore audio synthesis failures */
    }
  }

  stopSpeechSimulation() {
    if (this.gain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        setTimeout(() => {
          if (this.osc) {
            try { this.osc.stop(); } catch { /* ignore */ }
            this.osc = null;
          }
        }, 60);
      } catch {
        /* ignore */
      }
    }
  }

  setVolume(v: number) {
    if (this.gain && this.ctx) {
      try {
        this.gain.gain.setValueAtTime(v * 0.08, this.ctx.currentTime);
      } catch {
        /* ignore */
      }
    }
  }
}

const engine = new WebAudioEngine();

export type AudioPlayerStore = {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  playbackRate: PlaybackRate;
  activeMeetingId: string | null;
  activeSentenceId: string | null;
  volume: number; // 0 to 1
  isMuted: boolean;
  isVisible: boolean;

  playFrom: (meetingId: string, startMs: number, sentenceId?: string, totalDurationMs?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (ms: number) => void;
  skip: (deltaMs: number) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  cyclePlaybackRate: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  close: () => void;
  tick: (deltaMs: number) => void;
};

let tickerInterval: ReturnType<typeof setInterval> | null = null;
let lastTickTime = Date.now();

function startTicker() {
  if (tickerInterval) clearInterval(tickerInterval);
  lastTickTime = Date.now();
  tickerInterval = setInterval(() => {
    const now = Date.now();
    const delta = now - lastTickTime;
    lastTickTime = now;
    useAudioPlayerStore.getState().tick(delta);
  }, 50);
}

function stopTicker() {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
}

export const useAudioPlayerStore = create<AudioPlayerStore>((set, get) => ({
  isPlaying: false,
  currentTimeMs: 0,
  durationMs: 60000,
  playbackRate: 1.0,
  activeMeetingId: null,
  activeSentenceId: null,
  volume: 0.8,
  isMuted: false,
  isVisible: false,

  playFrom: (meetingId, startMs, sentenceId, totalDurationMs) => {
    const duration = totalDurationMs && totalDurationMs > 0 ? Math.max(totalDurationMs, startMs + 10000) : Math.max(get().durationMs, startMs + 15000);
    const effectiveVolume = get().isMuted ? 0 : get().volume;
    engine.startSpeechSimulation(effectiveVolume, get().playbackRate);
    startTicker();

    set({
      isPlaying: true,
      isVisible: true,
      activeMeetingId: meetingId,
      activeSentenceId: sentenceId ?? null,
      currentTimeMs: Math.max(0, startMs),
      durationMs: duration,
    });
  },

  pause: () => {
    engine.stopSpeechSimulation();
    stopTicker();
    set({ isPlaying: false });
  },

  resume: () => {
    const effectiveVolume = get().isMuted ? 0 : get().volume;
    engine.startSpeechSimulation(effectiveVolume, get().playbackRate);
    startTicker();
    set({ isPlaying: true, isVisible: true });
  },

  togglePlay: () => {
    if (get().isPlaying) {
      get().pause();
    } else {
      get().resume();
    }
  },

  seek: (ms) => {
    const clamped = Math.max(0, Math.min(get().durationMs, ms));
    set({ currentTimeMs: clamped });
  },

  skip: (deltaMs) => {
    const next = Math.max(0, Math.min(get().durationMs, get().currentTimeMs + deltaMs));
    set({ currentTimeMs: next });
  },

  setPlaybackRate: (playbackRate) => {
    set({ playbackRate });
    if (get().isPlaying) {
      const effectiveVolume = get().isMuted ? 0 : get().volume;
      engine.startSpeechSimulation(effectiveVolume, playbackRate);
    }
  },

  cyclePlaybackRate: () => {
    const current = get().playbackRate;
    const currentIndex = PLAYBACK_RATES.indexOf(current);
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
    get().setPlaybackRate(nextRate);
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set({ volume: clamped, isMuted: false });
    engine.setVolume(clamped);
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
    engine.setVolume(nextMuted ? 0 : get().volume);
  },

  close: () => {
    engine.stopSpeechSimulation();
    stopTicker();
    set({ isPlaying: false, isVisible: false, activeMeetingId: null, activeSentenceId: null });
  },

  tick: (deltaMs) => {
    const { isPlaying, currentTimeMs, durationMs, playbackRate } = get();
    if (!isPlaying) return;

    const nextTime = currentTimeMs + deltaMs * playbackRate;
    if (nextTime >= durationMs) {
      engine.stopSpeechSimulation();
      stopTicker();
      set({ isPlaying: false, currentTimeMs: durationMs });
    } else {
      set({ currentTimeMs: nextTime });
    }
  },
}));
