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

    // Non-Copyright Taxi Radio & Music System
    this.musicGain = null;
    this.musicFilter = null;
    this.musicVolume = 0.65; // 0.0 to 1.0
    this.isMusicMuted = false;
    this.isInTaxi = true;
    this.currentStationIndex = 0;
    this.isRadioPlaying = false;
    this.currentStep = 0;
    this.schedulerTimer = null;
    this.nextNoteTime = 0;

    // Royalty-Free Procedural Synthwave / Lo-Fi / Cyberpunk Radio Stations
    this.radioStations = [
      {
        id: 'neon',
        name: '88.5 NEON SYNTH',
        tag: 'RETRO SYNTHWAVE',
        track: 'Midnight Highway',
        bpm: 112,
        bassNotes: [55.0, 55.0, 55.0, 55.0, 43.65, 43.65, 43.65, 43.65, 65.41, 65.41, 65.41, 65.41, 49.0, 49.0, 49.0, 49.0], // A1, F1, C2, G1
        chords: [
          [220.0, 261.63, 329.63, 392.0], // Am7
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [261.63, 329.63, 392.0, 523.25], // Cmaj7
          [196.0, 246.94, 293.66, 392.0]   // G
        ],
        arpNotes: [440.0, 523.25, 659.25, 783.99, 659.25, 523.25, 880.0, 659.25],
        leadWave: 'sawtooth',
        bassWave: 'sawtooth'
      },
      {
        id: 'lofi',
        name: '94.2 LO-FI NIGHTS',
        tag: 'CHILL JAZZHOP',
        track: 'Sunset Dreams',
        bpm: 84,
        bassNotes: [73.42, 73.42, 65.41, 65.41, 58.27, 58.27, 55.0, 55.0], // D2, C2, Bb1, A1
        chords: [
          [293.66, 349.23, 440.0, 523.25], // Dm7
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [233.08, 293.66, 349.23, 440.0], // Bbmaj7
          [220.0, 277.18, 329.63, 392.0]   // A7
        ],
        arpNotes: [587.33, 659.25, 698.46, 783.99, 880.0, 698.46, 587.33, 523.25],
        leadWave: 'triangle',
        bassWave: 'triangle'
      },
      {
        id: 'cyber',
        name: '103.7 CYBER DRIVE',
        tag: 'OUTRUN ELECTRO',
        track: 'Neon Overdrive',
        bpm: 124,
        bassNotes: [82.41, 82.41, 82.41, 82.41, 73.42, 73.42, 87.31, 87.31], // E2, D2, F2
        chords: [
          [164.81, 196.0, 246.94, 329.63], // Em
          [146.83, 174.61, 220.0, 293.66], // Dm
          [174.61, 220.0, 261.63, 349.23], // F
          [196.0, 246.94, 293.66, 392.0]   // G
        ],
        arpNotes: [659.25, 783.99, 987.77, 880.0, 659.25, 987.77, 1174.66, 880.0],
        leadWave: 'sawtooth',
        bassWave: 'square'
      }
    ];
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
      this._setupRadioAudio();
      this.startRadio();

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
    if (this.musicGain) {
      const targetGain = (this.isMuted || this.isMusicMuted || !this.isInTaxi) ? 0 : this.musicVolume;
      this.musicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // =========================================================================
  // NON-COPYRIGHT TAXI RADIO & MUSIC SYNTHESIS ENGINE
  // =========================================================================

  _setupRadioAudio() {
    if (!this.ctx) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.setValueAtTime(18000, this.ctx.currentTime);
    this.musicFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.musicFilter.connect(this.musicGain);
    this.musicGain.connect(this.ctx.destination);
  }

  startRadio() {
    if (!this.ctx || this.isRadioPlaying) return;
    this.isRadioPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this._scheduleRadio();
  }

  stopRadio() {
    this.isRadioPlaying = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  _scheduleRadio() {
    if (!this.isRadioPlaying || !this.ctx) return;

    const station = this.radioStations[this.currentStationIndex];
    const secondsPerBeat = 60.0 / station.bpm;
    const secondsPer16th = secondsPerBeat / 4;

    // Lookahead schedule: queue notes up to 0.18s into the future
    while (this.nextNoteTime < this.ctx.currentTime + 0.18) {
      if (this.isInTaxi && !this.isMuted && !this.isMusicMuted) {
        this._playStep(this.currentStep, this.nextNoteTime, station, secondsPer16th);
      }
      this.nextNoteTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 64;
    }

    this.schedulerTimer = setTimeout(() => this._scheduleRadio(), 45);
  }

  _playStep(step, time, station, stepDuration) {
    const stepInBar = step % 16;
    const barIndex = Math.floor(step / 16) % 4;

    // 1. Kick Drum (Beats 0 & 8 in 16-step bar)
    if (stepInBar === 0 || stepInBar === 8) {
      this._playKick(time);
    }

    // 2. Snare / Clap (Beats 4 & 12 in 16-step bar)
    if (stepInBar === 4 || stepInBar === 12) {
      this._playSnare(time);
    }

    // 3. Hi-Hats (Eighth notes + open hat syncopation)
    if (stepInBar % 2 === 0) {
      const isOpen = (stepInBar === 6 || stepInBar === 14);
      this._playHiHat(time, isOpen);
    }

    // 4. Bassline (Syncopated 8th-note driving groove)
    if (stepInBar === 0 || stepInBar === 2 || stepInBar === 4 || stepInBar === 6 ||
        stepInBar === 8 || stepInBar === 10 || stepInBar === 12 || stepInBar === 14) {
      const bassIndex = (barIndex * 4 + Math.floor(stepInBar / 4)) % station.bassNotes.length;
      const bassFreq = station.bassNotes[bassIndex];
      this._playBass(bassFreq, time, stepDuration * 1.8, station.bassWave);
    }

    // 5. Chords / Pad (Sustained at start of each 16-step bar)
    if (stepInBar === 0) {
      const chord = station.chords[barIndex % station.chords.length];
      this._playChord(chord, time, stepDuration * 14.0);
    }

    // 6. Arpeggiated Lead Melody (16th-note sequence)
    if (stepInBar % 2 === 1 || stepInBar === 3 || stepInBar === 7 || stepInBar === 11 || stepInBar === 15) {
      const arpFreq = station.arpNotes[(stepInBar + barIndex * 2) % station.arpNotes.length];
      this._playArp(arpFreq, time, stepDuration * 1.4, station.leadWave);
    }
  }

  _playKick(time) {
    if (!this.ctx || !this.musicFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.musicFilter);
    osc.start(time);
    osc.stop(time + 0.18);
  }

  _playSnare(time) {
    if (!this.ctx || !this.musicFilter) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(2.2, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicFilter);
    noise.start(time);

    // Body punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(65, time + 0.06);

    oscGain.gain.setValueAtTime(0.12, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.musicFilter);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  _playHiHat(time, isOpen = false) {
    if (!this.ctx || !this.musicFilter) return;
    const dur = isOpen ? 0.12 : 0.035;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.07 : 0.045, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicFilter);
    noise.start(time);
  }

  _playBass(freq, time, dur, waveType) {
    if (!this.ctx || !this.musicFilter) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = waveType || 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + dur);
    filter.Q.setValueAtTime(3.2, time);

    gain.gain.setValueAtTime(0.19, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicFilter);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  _playChord(notes, time, dur) {
    if (!this.ctx || !this.musicFilter) return;
    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, time);
      filter.Q.setValueAtTime(1.2, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.032, time + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicFilter);

      osc.start(time);
      osc.stop(time + dur + 0.05);
    });
  }

  _playArp(freq, time, dur, waveType) {
    if (!this.ctx || !this.musicFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType || 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.065, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.musicFilter);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  /**
   * Static radio channel sweep sound effect when switching stations.
   */
  _playRadioStaticZap() {
    if (!this.ctx || !this.musicFilter) return;
    const dur = 0.09;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + dur);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicFilter);
    noise.start();
  }

  /**
   * Sets music volume (0 to 1).
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx) {
      const targetGain = (this.isMusicMuted || !this.isInTaxi || this.isMuted) ? 0 : this.musicVolume;
      this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
    }
    return this.musicVolume;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.musicGain && this.ctx) {
      const targetGain = (this.isMusicMuted || !this.isInTaxi || this.isMuted) ? 0 : this.musicVolume;
      this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMusicMuted;
  }

  /**
   * Updates state when driver enters or exits the taxi.
   * Inside taxi: full rich music plays.
   * Outside taxi: fades to silence cleanly.
   */
  setInTaxiState(inTaxi) {
    this.isInTaxi = inTaxi;
    if (this.musicGain && this.ctx) {
      if (inTaxi) {
        this.musicFilter.frequency.setTargetAtTime(18000, this.ctx.currentTime, 0.3);
        const targetGain = (this.isMusicMuted || this.isMuted) ? 0 : this.musicVolume;
        this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
      } else {
        this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
      }
    }
  }

  nextRadioStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % this.radioStations.length;
    this._playRadioStaticZap();
    return this.radioStations[this.currentStationIndex];
  }

  prevRadioStation() {
    this.currentStationIndex = (this.currentStationIndex - 1 + this.radioStations.length) % this.radioStations.length;
    this._playRadioStaticZap();
    return this.radioStations[this.currentStationIndex];
  }

  getCurrentStation() {
    return this.radioStations[this.currentStationIndex];
  }
}
