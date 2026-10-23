export type SoundCue = "tap" | "step" | "open" | "success" | "error" | "beacon" | "delivery" | "victory";
const PREFERENCE = "codequest:audio:v1";
const VOLUME_KEY = "codequest:volume:v1";

/** Original synthesized effects with one lazily unlocked context and no asset downloads. */
class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Set<AudioScheduledSourceNode>();
  private texture?: AudioBuffer;
  private level = 0.65;
  private foot = 0;
  private last = new Map<SoundCue, number>();
  private listening = false;
  private quiet = false;

  get muted(): boolean {
    return this.quiet;
  }
  get volume(): number {
    return this.level;
  }

  init(): void {
    if (this.listening) return;
    this.listening = true;
    try {
      this.quiet = localStorage.getItem(PREFERENCE) === "muted";
      const volume = localStorage.getItem(VOLUME_KEY);
      if (volume !== null && Number.isFinite(Number(volume))) this.level = Math.max(0, Math.min(1, Number(volume)));
    } catch {
      /* Session preference still works. */
    }
    const unlock = (event: Event) => {
      if (event.isTrusted) this.unlock();
    };
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stop();
        if (this.context?.state === "running") void this.context.suspend().catch(() => {});
      }
      // Resume on the next deliberate interaction, not on a background timer.
    });
    window.addEventListener("pagehide", () => this.stop());
  }

  private unlock(): void {
    if (this.quiet || document.hidden) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.level * 0.55;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === "suspended") void this.context.resume().catch(() => {});
    } catch {
      /* Browsers without audio support keep full gameplay. */
    }
  }

  setMuted(muted: boolean): void {
    this.quiet = muted;
    if (muted) this.stop();
    this.applyVolume();
    try {
      localStorage.setItem(PREFERENCE, muted ? "muted" : "on");
    } catch {
      /* Optional preference. */
    }
    if (!muted) this.unlock();
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.level = Math.max(0, Math.min(1, volume));
    this.applyVolume();
    try {
      localStorage.setItem(VOLUME_KEY, String(this.level));
    } catch {
      /* Session volume still works. */
    }
  }

  private applyVolume(): void {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(this.quiet ? 0 : this.level * 0.55, this.context.currentTime, 0.015);
  }

  play(cue: SoundCue): void {
    const context = this.context,
      master = this.master;
    if (!context || !master || context.state !== "running" || this.quiet || document.hidden) return;
    const time = context.currentTime,
      previous = this.last.get(cue) ?? -Infinity;
    if (time - previous < (cue === "step" ? 0.12 : 0.06) || this.voices.size > 24 || this.level === 0) return;
    this.last.set(cue, time);
    switch (cue) {
      case "step": {
        this.foot = 1 - this.foot;
        const variation = (0.9 + Math.random() * 0.16) * (this.foot ? 1 : 0.82);
        // A padded, slow attack keeps the sole from sounding like a sharp pop.
        this.noise(0.28, 0.042 * variation, 210 + Math.random() * 65, 0, "lowpass", 0.075);
        this.noise(0.19, 0.009 * variation, 520 + Math.random() * 100, 0.045, "lowpass", 0.085);
        this.tone(78 + Math.random() * 9, 0.23, 0.016 * variation, 0.02, undefined, 0.08);
        break;
      }
      case "tap":
        this.noise(0.028, 0.19, 2400, 0, "bandpass");
        this.tone(360, 0.028, 0.055, 0, 180);
        break;
      case "open":
        this.noise(0.28, 0.22, 1800, 0, "bandpass", 0.06);
        this.bell(784, 0.11, 0.08, 0.32);
        break;
      case "error":
        this.noise(0.055, 0.16, 600, 0, "lowpass");
        this.tone(155, 0.11, 0.12, 0, 80);
        this.tone(125, 0.12, 0.09, 0.12, 70);
        break;
      case "success":
        this.bell(659, 0, 0.13, 0.42);
        this.bell(988, 0.13, 0.1, 0.55);
        break;
      case "delivery":
        this.noise(0.48, 0.2, 1100, 0, "bandpass", 0.08);
        this.tone(160, 0.3, 0.065, 0, 65);
        this.bell(784, 0.2, 0.09, 0.42);
        this.bell(1047, 0.32, 0.07, 0.5);
        break;
      case "beacon":
        this.noise(0.5, 0.1, 3300, 0, "highpass", 0.12);
        for (const [i, note] of [392, 587, 784, 1175].entries()) this.bell(note, i * 0.13, 0.1, 0.65);
        break;
      case "victory":
        for (const [i, note] of [523, 659, 784, 1047].entries()) this.bell(note, i * 0.15, 0.12, 0.85);
        this.tone(262, 1.1, 0.075, 0.45);
        break;
    }
  }

  private bell(frequency: number, delay: number, level: number, duration: number): void {
    this.tone(frequency, duration, level, delay);
    this.tone(frequency * 2.01, duration * 0.55, level * 0.22, delay);
    this.tone(frequency * 3.98, duration * 0.24, level * 0.07, delay);
  }

  private tone(frequency: number, duration: number, level: number, delay: number, end?: number, attack = 0.004): void {
    if (!this.context) return;
    const source = this.context.createOscillator(),
      start = this.context.currentTime + delay;
    source.type = "sine";
    source.frequency.setValueAtTime(frequency, start);
    if (end) source.frequency.exponentialRampToValueAtTime(end, start + duration);
    this.voice(source, duration, level, delay, attack);
  }

  private noise(
    duration: number,
    level: number,
    frequency: number,
    delay: number,
    type: BiquadFilterType,
    attack = 0.004,
  ): void {
    const context = this.context;
    if (!context) return;
    if (!this.texture) {
      this.texture = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = this.texture.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter();
    source.buffer = this.texture;
    source.playbackRate.value = 0.94 + Math.random() * 0.12;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.65;
    this.voice(source, duration, level, delay, attack, filter);
  }

  private voice(
    source: AudioScheduledSourceNode,
    duration: number,
    level: number,
    delay: number,
    attack: number,
    filter?: BiquadFilterNode,
  ): void {
    const context = this.context,
      master = this.master;
    if (!context || !master || this.voices.size >= 40) {
      source.disconnect();
      filter?.disconnect();
      return;
    }
    const envelope = context.createGain(),
      start = context.currentTime + delay;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(level, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    if (filter) source.connect(filter).connect(envelope);
    else source.connect(envelope);
    envelope.connect(master);
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      filter?.disconnect();
      envelope.disconnect();
    };
    source.start(start);
    source.stop(start + duration + 0.015);
  }

  private stop(): void {
    for (const oscillator of this.voices) {
      try {
        oscillator.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.voices.clear();
    this.last.clear();
  }
}

export const gameAudio = new GameAudio();
