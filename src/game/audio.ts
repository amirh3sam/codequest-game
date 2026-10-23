export type SoundCue = "tap" | "step" | "open" | "success" | "error" | "beacon" | "delivery" | "victory";
type Note = readonly [frequency: number, delay: number, duration: number, endFrequency?: number];
const NOTES: Record<SoundCue, readonly Note[]> = {
  tap: [[720, 0, 0.045, 490]],
  step: [[110, 0, 0.055, 48]],
  open: [
    [330, 0, 0.1],
    [660, 0.07, 0.13],
  ],
  success: [
    [523, 0, 0.13],
    [659, 0.1, 0.13],
    [784, 0.2, 0.22],
  ],
  error: [
    [220, 0, 0.12],
    [165, 0.11, 0.16],
  ],
  beacon: [
    [392, 0, 0.18],
    [523, 0.12, 0.2],
    [659, 0.24, 0.22],
    [1047, 0.36, 0.35],
  ],
  delivery: [
    [392, 0, 0.12],
    [587, 0.1, 0.15],
    [784, 0.24, 0.25],
  ],
  victory: [
    [523, 0, 0.2],
    [659, 0.16, 0.2],
    [784, 0.32, 0.2],
    [1047, 0.5, 0.5],
  ],
};
const PREFERENCE = "codequest:audio:v1";

/** Original synthesized effects with one lazily unlocked context and no asset downloads. */
class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Set<OscillatorNode>();
  private last = new Map<SoundCue, number>();
  private listening = false;
  private quiet = false;

  get muted(): boolean {
    return this.quiet;
  }

  init(): void {
    if (this.listening) return;
    this.listening = true;
    try {
      this.quiet = localStorage.getItem(PREFERENCE) === "muted";
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
        this.master.gain.value = 0.22;
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
    if (this.context && this.master) this.master.gain.setValueAtTime(muted ? 0 : 0.22, this.context.currentTime);
    try {
      localStorage.setItem(PREFERENCE, muted ? "muted" : "on");
    } catch {
      /* Optional preference. */
    }
    if (!muted) this.unlock();
  }

  play(cue: SoundCue): void {
    const context = this.context,
      master = this.master;
    if (!context || !master || context.state !== "running" || this.quiet || document.hidden) return;
    const time = context.currentTime,
      previous = this.last.get(cue) ?? -Infinity;
    if (time - previous < (cue === "step" ? 0.12 : 0.06) || this.voices.size > 16) return;
    this.last.set(cue, time);
    for (const [frequency, delay, duration, end] of NOTES[cue]) {
      const oscillator = context.createOscillator(),
        envelope = context.createGain(),
        start = time + delay;
      oscillator.type = cue === "step" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      if (end) oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(cue === "step" ? 0.14 : 0.24, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(envelope).connect(master);
      this.voices.add(oscillator);
      oscillator.onended = () => {
        this.voices.delete(oscillator);
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
    }
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
