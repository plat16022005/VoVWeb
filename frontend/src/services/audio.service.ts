// Web Audio API ambient synth & sound effects
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isPlayingBgm = false;
  private bgmInterval: ReturnType<typeof setInterval> | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play subtle UI button click chime
  playClick() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  // Play character switch celestial chime
  playCelestialChime() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.03, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + i * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.45);
      });
    } catch {
      // Ignore audio failure
    }
  }

  // Toggle ambient BGM chord progression (ethereal space pad)
  toggleBgm(onStateChange?: (playing: boolean) => void) {
    this.initContext();
    if (this.isPlayingBgm) {
      this.stopBgm();
      if (onStateChange) onStateChange(false);
      return false;
    } else {
      this.startBgm();
      if (onStateChange) onStateChange(true);
      return true;
    }
  }

  startBgm() {
    if (this.isPlayingBgm || !this.ctx) return;
    this.isPlayingBgm = true;

    // Cosmic chord progressions: D minor, Bb major, F major, C major (epic sci-fi feel)
    const chords = [
      [293.66, 349.23, 440.0, 587.33], // Dm
      [233.08, 293.66, 349.23, 466.16], // Bb
      [174.61, 261.63, 349.23, 523.25], // F
      [261.63, 329.63, 392.0, 523.25],  // C
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.isPlayingBgm || !this.ctx) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 2);
        filter.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 3.8);

        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 4.0);
      });
    };

    playChord();
    this.bgmInterval = setInterval(playChord, 3800);
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  isBgmPlaying() {
    return this.isPlayingBgm;
  }
}

export const soundEngine = new SoundEngine();
