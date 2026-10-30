// Procedural Persian Symphonic Soundtrack & Visceral Gore Sound Engine
// Combines Dastgah-e Shur / Chahargah Santur, Kamancheh, Karna Brass & Daf War Drums
// with Lyria 3 AI Music playback and Adult Gore/Dismemberment SFX.

export type SymphonicMode = 'shur_epic' | 'chahargah_war' | 'ahriman_doom';

class PersianSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterVolume: number = 0.85;
  private sfxVolume: number = 0.9;
  private chimeVolume: number = 0.85;

  // Continuous Symphonic Sequencer state
  private musicPlaying: boolean = false;
  private musicTimerId: number | null = null;
  private stepIndex: number = 0;
  private symphonicMode: SymphonicMode = 'chahargah_war';
  private customAudioEl: HTMLAudioElement | null = null;
  private usingLyriaAudio: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || this.masterVolume <= 0.01 || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public init(): void {
    this.ensureContext();
  }

  public setVolumes(master: number, sfx: number, chime: number): void {
    this.masterVolume = Math.max(0, Math.min(1, master / 100));
    this.sfxVolume = Math.max(0, Math.min(1, sfx / 100));
    this.chimeVolume = Math.max(0, Math.min(1, chime / 100));
    if (this.customAudioEl) {
      this.customAudioEl.volume = this.muted
        ? 0
        : Math.max(0, Math.min(1, this.masterVolume * this.chimeVolume));
    }
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.customAudioEl) {
      this.customAudioEl.muted = mute;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMusicPlaying(): boolean {
    return this.musicPlaying;
  }

  public getSymphonicMode(): SymphonicMode {
    return this.symphonicMode;
  }

  public setSymphonicMode(mode: SymphonicMode): void {
    this.symphonicMode = mode;
  }

  // Play AI-generated Lyria 3 Audio Track
  public playLyriaTrack(audioDataUrl: string): void {
    this.stopSymphonicSoundtrack();
    if (typeof window === 'undefined') return;
    if (this.customAudioEl) {
      this.customAudioEl.pause();
    }
    const audio = new Audio(audioDataUrl);
    audio.loop = true;
    audio.volume = this.muted
      ? 0
      : Math.max(0, Math.min(1, this.masterVolume * this.chimeVolume));
    audio.play().catch(() => {});
    this.customAudioEl = audio;
    this.usingLyriaAudio = true;
    this.musicPlaying = true;
  }

  public startSymphonicSoundtrack(mode?: SymphonicMode): void {
    if (mode) this.symphonicMode = mode;
    if (this.customAudioEl) {
      this.customAudioEl.pause();
      this.customAudioEl = null;
      this.usingLyriaAudio = false;
    }
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
    }
    this.musicPlaying = true;
    this.stepIndex = 0;

    // 136 BPM 16th-note Persian War Rhythm (~220ms per 8th step)
    this.musicTimerId = window.setInterval(() => {
      if (!this.musicPlaying || this.muted || this.usingLyriaAudio) return;
      this.playSequencerStep(this.stepIndex++);
    }, 220);
  }

  public stopSymphonicSoundtrack(): void {
    this.musicPlaying = false;
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
    if (this.customAudioEl) {
      this.customAudioEl.pause();
    }
  }

  private playSequencerStep(step: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Modal frequency tables (Hz)
    // Chahargah (Heroic Persian Battle Scale): D4, Eb4, F#4, G4, A4, Bb4, C#5, D5
    const chahargah = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 554.37, 587.33];
    // Shur (Epic Tragic Modal Scale): D4, Eb4, F4, G4, A4, Bb4, C5, D5
    const shur = [293.66, 311.13, 349.23, 392.0, 440.0, 466.16, 523.25, 587.33];
    // Ahriman Doom (Phrygian Dominant / Locrian Low Brass): D3, Eb3, F#3, G3, Ab3, Bb3, C#4, D4
    const doom = [146.83, 155.56, 185.0, 196.0, 207.65, 233.08, 277.18, 293.66];

    const scale =
      this.symphonicMode === 'chahargah_war'
        ? chahargah
        : this.symphonicMode === 'shur_epic'
        ? shur
        : doom;

    const barStep = step % 16;

    // 1. Daf & Tonbak War Drum Pattern (Steps 0, 3, 6, 8, 11, 14)
    if (barStep === 0 || barStep === 6 || barStep === 8 || barStep === 12) {
      const drumOsc = ctx.createOscillator();
      const drumGain = ctx.createGain();
      drumOsc.type = 'sine';
      const isAccent = barStep === 0 || barStep === 8;
      drumOsc.frequency.setValueAtTime(isAccent ? 115 : 155, now);
      drumOsc.frequency.exponentialRampToValueAtTime(36, now + (isAccent ? 0.19 : 0.12));

      drumGain.gain.setValueAtTime(
        this.chimeGain(isAccent ? 0.22 : 0.13),
        now
      );
      drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      drumOsc.connect(drumGain);
      drumGain.connect(ctx.destination);
      drumOsc.start(now);
      drumOsc.stop(now + 0.21);
    }

    // 2. Santur (Persian Hammered Dulcimer) Metallic Plucked Arpeggio
    const melodyPattern = [0, 2, 3, 4, 7, 6, 4, 2, 1, 3, 4, 5, 4, 3, 2, 0];
    const degree = melodyPattern[barStep];
    const santurFreq = scale[degree];

    const santurOsc = ctx.createOscillator();
    const santurHarm = ctx.createOscillator();
    const santurGain = ctx.createGain();

    santurOsc.type = 'triangle';
    santurHarm.type = 'sine';
    santurOsc.frequency.setValueAtTime(santurFreq, now);
    santurHarm.frequency.setValueAtTime(santurFreq * 2.0, now);

    santurGain.gain.setValueAtTime(this.chimeGain(0.095), now);
    santurGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    santurOsc.connect(santurGain);
    santurHarm.connect(santurGain);
    santurGain.connect(ctx.destination);
    santurOsc.start(now);
    santurHarm.start(now);
    santurOsc.stop(now + 0.35);
    santurHarm.stop(now + 0.35);

    // 3. Karna War Horn / Kamancheh Bowed Drone on Downbeats (Steps 0 and 8)
    if (barStep === 0 || barStep === 8) {
      const bassFreq = scale[barStep === 0 ? 0 : 4] * 0.5;
      const hornOsc = ctx.createOscillator();
      const hornGain = ctx.createGain();
      hornOsc.type = 'sawtooth';
      hornOsc.frequency.setValueAtTime(bassFreq, now);
      hornOsc.frequency.linearRampToValueAtTime(bassFreq * 1.008, now + 0.8);

      hornGain.gain.setValueAtTime(0.001, now);
      hornGain.gain.linearRampToValueAtTime(this.chimeGain(0.085), now + 0.12);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.88);

      hornOsc.connect(hornGain);
      hornGain.connect(ctx.destination);
      hornOsc.start(now);
      hornOsc.stop(now + 0.9);
    }
  }

  private sfxGain(base: number): number {
    return Math.max(0.001, base * this.masterVolume * this.sfxVolume);
  }

  private chimeGain(base: number): number {
    return Math.max(0.001, base * this.masterVolume * this.chimeVolume);
  }

  private pitchJitter(baseFreq: number, variance = 0.06): number {
    const factor = 1 + (Math.random() * 2 - 1) * variance;
    return baseFreq * factor;
  }

  public playSwordSlash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const f0 = this.pitchJitter(360, 0.08);
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(this.sfxGain(0.16), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Visceral Adult Gore: Flesh Cleave, Bone Crunch & Arterial Spray
  public playBloodSplatterGore(isDismemberment = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low bone-crunch impact
    const crunchOsc = ctx.createOscillator();
    const crunchGain = ctx.createGain();
    crunchOsc.type = 'sawtooth';
    crunchOsc.frequency.setValueAtTime(isDismemberment ? 98 : 135, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(28, now + (isDismemberment ? 0.32 : 0.18));

    crunchGain.gain.setValueAtTime(this.sfxGain(isDismemberment ? 0.32 : 0.22), now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + (isDismemberment ? 0.34 : 0.2));

    crunchOsc.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunchOsc.start(now);
    crunchOsc.stop(now + (isDismemberment ? 0.35 : 0.21));

    // High-frequency arterial hiss/splatter burst via noise buffer
    const bufferSize = Math.floor(ctx.sampleRate * (isDismemberment ? 0.26 : 0.14));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isDismemberment ? 950 : 1200, now);
    filter.Q.setValueAtTime(1.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.sfxGain(isDismemberment ? 0.28 : 0.18), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isDismemberment ? 0.25 : 0.14));

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
  }

  public playDash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.pitchJitter(220, 0.07), now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.09);

    gain.gain.setValueAtTime(this.sfxGain(0.12), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playFlintSparkParry(isParrySuccess: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = isParrySuccess ? [587.33, 880.0, 1174.66] : [440.0, 659.25];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.pitchJitter(f, 0.03), now + idx * 0.025);
      gain.gain.setValueAtTime(this.sfxGain(isParrySuccess ? 0.18 : 0.12), now + idx * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.025);
      osc.stop(now + idx * 0.025 + 0.23);
    });
  }

  public playDivBindFinisher(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playBloodSplatterGore(true);

    const chord = [293.66, 369.99, 440.0, 587.33, 739.99];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      gain.gain.setValueAtTime(this.chimeGain(0.15), now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.4);
    });
  }

  public playHeavyHit(isKill = false): void {
    this.playBloodSplatterGore(isKill);
  }

  public playTelegraphWarning(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196.0, now);
    osc.frequency.linearRampToValueAtTime(311.13, now + 0.22);

    gain.gain.setValueAtTime(this.sfxGain(0.08), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playPlayerHurt(): void {
    this.playBloodSplatterGore(false);
  }

  public playMythicNova(isAsha: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playBloodSplatterGore(true);

    const notes = isAsha ? [293.66, 369.99, 440.0, 587.33] : [146.83, 174.61, 207.65, 293.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isAsha ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(this.chimeGain(0.15), now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.36);
    });
  }

  public playMoralChoiceChime(path: 'asha' | 'ahriman'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = path === 'asha' ? [293.66, 440.0, 587.33] : [146.83, 207.65, 277.18];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = path === 'asha' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(this.chimeGain(0.15), now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.56);
    });
  }
}

export const soundEngine = new PersianSoundEngine();
