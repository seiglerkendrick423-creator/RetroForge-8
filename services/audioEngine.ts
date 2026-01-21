import { Sound } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy init
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(frequency: number, type: Sound['type'], duration: number, volume: number = 0.5) {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'noise') {
      // Simple white noise buffer
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(gain);
      noise.start();
    } else {
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.connect(gain);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    gain.connect(this.masterGain);
    
    // Envelope
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
  }

  playSound(sound: Sound) {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);

    if (sound.type === 'noise') {
        const duration = sound.attack + sound.decay + sound.release; // approx
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
           data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        source.start();
    } else {
        const osc = this.ctx.createOscillator();
        osc.type = sound.type;
        osc.frequency.setValueAtTime(sound.frequency, now);
        
        // Pitch slide for simple FX
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, sound.frequency / 2), now + sound.decay + sound.release);

        osc.connect(gain);
        osc.start();
        osc.stop(now + sound.attack + sound.decay + sound.release + 0.1);
    }

    // ADSR Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(sound.volume, now + sound.attack);
    gain.gain.linearRampToValueAtTime(sound.volume * sound.sustain, now + sound.attack + sound.decay);
    gain.gain.linearRampToValueAtTime(0, now + sound.attack + sound.decay + sound.release);
  }
}

export const audioEngine = new AudioEngine();
