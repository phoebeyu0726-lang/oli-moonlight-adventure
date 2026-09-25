const THEMES = {
  cover: { tempo: 94, wave: 'sine', notes: [62, 66, 69, 71, 69, 66, 64, 62, 57, 62, 64, 66] },
  game: { tempo: 142, wave: 'triangle', notes: [62, 69, 71, 74, 71, 69, 66, 69, 74, 76, 74, 71] },
  story: { tempo: 82, wave: 'sine', notes: [57, 62, 64, 66, 69, 66, 64, 62, 59, 62, 66, 64] },
};

const midi = (note) => 440 * (2 ** ((note - 69) / 12));

export class FestivalMusic {
  constructor() {
    this.enabled = false;
    this.theme = 'cover';
    this.step = 0;
    this.timer = null;
    this.context = null;
    this.master = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return;
      this.context = new AudioEngine();
      this.master = this.context.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.context.destination);
    }
    if (this.context?.state === 'suspended') this.context.resume();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) return this.stop();
    this.ensureContext();
    if (!this.context) return;
    this.start();
  }

  setTheme(theme) {
    if (!THEMES[theme] || this.theme === theme) return;
    this.theme = theme;
    this.step = 0;
    if (this.enabled) this.start();
  }

  start() {
    this.stop();
    if (!this.enabled) return;
    this.ensureContext();
    const play = () => {
      const theme = THEMES[this.theme];
      const beat = 60 / theme.tempo;
      const note = theme.notes[this.step++ % theme.notes.length];
      this.pluck(note, beat * .72, theme.wave, this.step % 4 === 1 ? .07 : .045);
      if (this.step % 4 === 1) this.pluck(note - 12, beat * 1.8, 'sine', .022);
    };
    play();
    this.timer = setInterval(play, 60000 / THEMES[this.theme].tempo);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  pluck(note, duration = .2, wave = 'sine', volume = .05) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midi(note), now);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  }

  chime(frequency = 560, duration = .09) {
    if (!this.enabled) return;
    const note = 69 + 12 * Math.log2(frequency / 440);
    this.pluck(note, duration, 'sine', .06);
  }
}
