const SOUND_STORAGE_KEY = 'christiane_sound_enabled';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_STORAGE_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage restriction
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  delay = 0
): void {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export const soundFX = {
  click() {
    playTone(520, 0.06, 'triangle', 0.05);
  },
  place() {
    playTone(620, 0.09, 'sine', 0.06);
  },
  hint() {
    playTone(587.33, 0.12, 'sine', 0.06, 0);
    playTone(880, 0.16, 'sine', 0.06, 0.08);
  },
  error() {
    playTone(230, 0.14, 'triangle', 0.08, 0);
    playTone(185, 0.18, 'triangle', 0.07, 0.09);
  },
  clear() {
    playTone(523.25, 0.11, 'sine', 0.07, 0);
    playTone(659.25, 0.12, 'sine', 0.07, 0.07);
    playTone(783.99, 0.18, 'sine', 0.07, 0.14);
  },
  victory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      playTone(freq, 0.24, 'sine', 0.08, idx * 0.11);
    });
  },
};
