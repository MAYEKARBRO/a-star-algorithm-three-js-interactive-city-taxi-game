/**
 * AudioManager provides procedural, zero-dependency sound synthesis using the Web Audio API:
 * - Engine RPM pitch modulation & acceleration growl
 * - Tire drift screech (bandpass filtered noise)
 * - Car horn (dual frequency chord)
 * - Passenger pickup notification chime
 * - Cash dropoff payout register ("Cha-ching!")
 * - Wall collision thud impact
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Engine sound nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;

    // Tire screech nodes
    this.screechSource = null;
    this.screechGain = null;
    this.screechFilter = null;

    // Horn nodes
    this.hornOsc1 = null;
    this.hornOsc2 = null;
    this.hornGain = null;
    this.isHonking = false;
  }

  /**
   * Initializes the AudioContext upon first user interaction (browser requirement).
   */
  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this._setupEngineAudio();
      this._setupTireScreechAudio();

      this.isInitialized = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio API failed to initialize:', e);
    }
  }

  _setupEngineAudio() {
    if (!this.ctx) return;

    // Master engine gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Lowpass filter for smooth rumble
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Primary engine oscillator (sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Secondary sub oscillator (triangle)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  _setupTireScreechAudio() {
    if (!this.ctx) return;

    // Generate white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    whiteNoise.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.ctx.destination);

    whiteNoise.start();
  }

  /**
   * Modulates the engine frequency based on car RPM and acceleration.
   * @param {number} rpm - Ratio from 0 to 1
   * @param {boolean} isAccelerating
   */
  updateEnginePitch(rpm, isAccelerating) {
    if (!this.ctx || !this.engineOsc1 || this.isMuted) return;

    const baseFreq = 40 + rpm * 140;
    const filterFreq = 300 + rpm * 800 + (isAccelerating ? 250 : 0);
    const volume = 0.05 + rpm * 0.08 + (isAccelerating ? 0.04 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    this.engineGain.gain.setTargetAtTime(this.isMuted ? 0 : volume, now, 0.08);
  }

  /**
   * Plays tire screech sound during drifting.
   * @param {number} intensity - 0 to 1
   */
  playDriftScreech(intensity) {
    if (!this.ctx || !this.screechGain || this.isMuted) return;
    const vol = Math.min(0.2, intensity * 0.2);
    this.screechGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  stopDriftScreech() {
    if (!this.ctx || !this.screechGain) return;
    this.screechGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
  }

  /**
   * Sounds the taxi horn.
   */
  startHorn() {
    if (!this.ctx || this.isHonking || this.isMuted) return;
    this.isHonking = true;

    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'triangle';
    this.hornOsc1.frequency.setValueAtTime(440, this.ctx.currentTime); // A4

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'triangle';
    this.hornOsc2.frequency.setValueAtTime(554.37, this.ctx.currentTime); // C#5 (Major chord)

    this.hornOsc1.connect(this.hornGain);
    this.hornOsc2.connect(this.hornGain);
    this.hornGain.connect(this.ctx.destination);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  stopHorn() {
    if (!this.isHonking || !this.hornGain) return;
    this.isHonking = false;
    this.hornGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    setTimeout(() => {
      try {
        if (this.hornOsc1) this.hornOsc1.stop();
        if (this.hornOsc2) this.hornOsc2.stop();
      } catch (e) {}
    }, 100);
  }

  /**
   * Bright arpeggio chime when passenger is collected.
   */
  playPickupSound() {
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);

      const startTime = this.ctx.currentTime + idx * 0.07;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /**
   * Cash register and coin cascade celebration sound when dropoff succeeds.
   */
  playCashDropoffSound() {
    if (!this.ctx || this.isMuted) return;

    // High metal ding
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'triangle';
    bellOsc.frequency.setValueAtTime(1760, this.ctx.currentTime); // A6
    bellGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    bellGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    bellOsc.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    bellOsc.start();
    bellOsc.stop(this.ctx.currentTime + 0.6);

    // Cascading coins
    for (let i = 0; i < 6; i++) {
      const coinTime = this.ctx.currentTime + 0.08 + i * 0.05;
      const coinOsc = this.ctx.createOscillator();
      const coinGain = this.ctx.createGain();
      coinOsc.type = 'sine';
      coinOsc.frequency.setValueAtTime(1200 + Math.random() * 800, coinTime);
      coinGain.gain.setValueAtTime(0.12, coinTime);
      coinGain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.15);

      coinOsc.connect(coinGain);
      coinGain.connect(this.ctx.destination);
      coinOsc.start(coinTime);
      coinOsc.stop(coinTime + 0.18);
    }
  }

  /**
   * Deep bass impact when colliding with a building.
   * @param {number} volume
   */
  playCrashSound(volume = 0.5) {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.3);

    const actualVol = Math.min(0.35, volume * 0.35);
    gain.gain.setValueAtTime(actualVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /**
   * Comical bonk sound and cash penalty chime when hitting a pedestrian.
   */
  playPedestrianHitSound() {
    if (!this.ctx || this.isMuted) return;

    // 1. Comical rubbery "bonk"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);

    // 2. Penalty buzzer / coin loss tone
    const buzzerOsc = this.ctx.createOscillator();
    const buzzerGain = this.ctx.createGain();
    buzzerOsc.type = 'sawtooth';
    buzzerOsc.frequency.setValueAtTime(180, this.ctx.currentTime + 0.1);
    buzzerOsc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.25);

    buzzerGain.gain.setValueAtTime(0.18, this.ctx.currentTime + 0.1);
    buzzerGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    buzzerOsc.connect(buzzerGain);
    buzzerGain.connect(this.ctx.destination);
    buzzerOsc.start(this.ctx.currentTime + 0.1);
    buzzerOsc.stop(this.ctx.currentTime + 0.45);
  }

  /**
   * Emergency wailing two-tone police siren.
   */
  startPoliceSiren() {
    if (!this.ctx || this.isMuted || this.policeSirenOsc) return;

    this.policeSirenGain = this.ctx.createGain();
    this.policeSirenGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.policeSirenOsc = this.ctx.createOscillator();
    this.policeSirenOsc.type = 'sawtooth';
    this.policeSirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

    this.policeSirenOsc.connect(this.policeSirenGain);
    this.policeSirenGain.connect(this.ctx.destination);
    this.policeSirenOsc.start();

    // Modulate between 600Hz and 950Hz
    this.sirenInterval = setInterval(() => {
      if (!this.ctx || !this.policeSirenOsc) return;
      const now = this.ctx.currentTime;
      this.policeSirenOsc.frequency.setValueAtTime(950, now);
      this.policeSirenOsc.frequency.setTargetAtTime(600, now + 0.35, 0.2);
    }, 700);
  }

  stopPoliceSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.policeSirenGain) {
      this.policeSirenGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          if (this.policeSirenOsc) this.policeSirenOsc.stop();
          this.policeSirenOsc = null;
          this.policeSirenGain = null;
        } catch (e) {}
      }, 150);
    }
  }

  /**
   * High-pitch turbo whoosh sound on Nitro activation.
   */
  playNitroSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  /**
   * Ascending launch sound for stunt ramp jumps.
   */
  playJumpSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  /**
   * Rushing water spray sound for broken fire hydrants.
   */
  playHydrantGeyserSound() {
    if (!this.ctx || this.isMuted) return;

    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  /**
   * Wooden splinter crash impact for broken crates.
   */
  playCrateSmashSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Metallic clatter sound for knocked trash cans.
   */
  playTrashCanClatterSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  /**
   * Snappy plastic pop sound for traffic cones.
   */
  playConeHitSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
