// Procedural Web Audio API Synthesizer tuned to Persian modal intervals (Dastgah-e Shur & Chahargah)

class PersianSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterVolume: number = 0.85;
  private sfxVolume: number = 0.9;
  private chimeVolume: number = 0.8;

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

  public setVolumes(master: number, sfx: number, chime: number): void {
    this.masterVolume = Math.max(0, Math.min(1, master / 100));
    this.sfxVolume = Math.max(0, Math.min(1, sfx / 100));
    this.chimeVolume = Math.max(0, Math.min(1, chime / 100));
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
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
    osc.type = 'triangle';
    const f0 = this.pitchJitter(329.63, 0.08);
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.11);

    gain.gain.setValueAtTime(this.sfxGain(0.14), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
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

  // New v1.1 Era of Hushang: Sang-e Sadeh Flint-Stone Spark & Parry Ring
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

  // New v1.1/v1.2 Div-Band Finisher: Chain Lock & Santur Harmonic Chord
  public playDivBindFinisher(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

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
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isKill ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isKill ? 164.81 : 130.81, now);
    osc.frequency.exponentialRampToValueAtTime(48.99, now + (isKill ? 0.24 : 0.15));

    gain.gain.setValueAtTime(this.sfxGain(isKill ? 0.24 : 0.18), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isKill ? 0.25 : 0.16));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isKill ? 0.25 : 0.16));

    if (isKill) {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(587.33, now + 0.03);
      chime.frequency.exponentialRampToValueAtTime(880, now + 0.26);
      chimeGain.gain.setValueAtTime(this.chimeGain(0.11), now + 0.03);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 0.03);
      chime.stop(now + 0.28);
    }
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
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110.0, now);
    osc.frequency.exponentialRampToValueAtTime(45.0, now + 0.22);

    gain.gain.setValueAtTime(this.sfxGain(0.22), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playMythicNova(isAsha: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = isAsha ? [293.66, 369.99, 440.0, 587.33] : [146.83, 174.61, 207.65, 293.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isAsha ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(this.chimeGain(0.13), now + idx * 0.045);
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
