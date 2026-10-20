/**
 * InputManager handles multiple input devices:
 * - Keyboard (WASD, Arrow Keys, Space, C, R, H, M, G, I)
 * - Mouse (Camera orbit drag & zoom)
 * - Gamepad / Joystick Controller (Standard Gamepad API with analog sticks & triggers)
 * - Touch Controls (Virtual pedals & steer buttons)
 */
export class InputManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // Keys State
    this.keys = {};

    // Mouse Orbit State
    this.mouse = {
      isDown: false,
      lastX: 0,
      lastY: 0,
      deltaX: 0,
      deltaY: 0,
      zoomDelta: 0
    };

    // Gamepad State
    this.gamepadConnected = false;
    this.gamepadId = '';
    this.gamepadIndex = -1;
    this.gamepadState = {
      steer: 0,
      throttle: 0,
      handbrake: false,
      cameraX: 0,
      cameraY: 0,
      buttonA: false,
      buttonB: false,
      buttonX: false,
      buttonY: false,
      buttonLB: false,
      buttonRB: false,
      buttonStart: false,
      buttonSelect: false
    };

    // Event callbacks (e.g. onCameraToggle, onResetCar, onHorn, onToggleGraph)
    this.callbacks = {};

    this._bindKeyboardEvents();
    this._bindMouseEvents();
    this._bindGamepadEvents();
  }

  on(eventName, callback) {
    this.callbacks[eventName] = callback;
  }

  _trigger(eventName, payload) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName](payload);
    }
  }

  _bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Do not intercept or block keys if typing inside an input or textarea
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      this.keys[e.code] = true;

      // Handle single-press action toggles
      if (e.code === 'KeyC') this._trigger('cameraToggle');
      if (e.code === 'KeyR') this._trigger('resetCar');
      if (e.code === 'KeyH') this._trigger('horn');
      if (e.code === 'KeyM') this._trigger('muteToggle');
      if (e.code === 'KeyG') this._trigger('toggleGraph');
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        this._trigger('toggleAStarInspector');
      }
    });

    window.addEventListener('keyup', (e) => {
      // Do not intercept keys if typing inside an input or textarea
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      this.keys[e.code] = false;
      if (e.code === 'KeyH') {
        this._trigger('hornRelease');
      }
    });
  }

  _bindMouseEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.mouse.isDown = true;
        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isDown) {
        this.mouse.deltaX = e.clientX - this.mouse.lastX;
        this.mouse.deltaY = e.clientY - this.mouse.lastY;
        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
      this.mouse.deltaX = 0;
      this.mouse.deltaY = 0;
    });

    this.canvas.addEventListener('wheel', (e) => {
      this.mouse.zoomDelta = Math.sign(e.deltaY);
    }, { passive: true });
  }

  _bindGamepadEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadId = e.gamepad.id;
      this.gamepadIndex = e.gamepad.index;
      console.log(`[InputManager] Gamepad connected: ${e.gamepad.id} at index ${e.gamepad.index}`);
      this._trigger('gamepadConnected', { id: e.gamepad.id });
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadConnected = false;
        this.gamepadId = '';
        this.gamepadIndex = -1;
        console.log('[InputManager] Gamepad disconnected');
        this._trigger('gamepadDisconnected');
      }
    });
  }

  /**
   * Samples current Gamepad status from navigator.getGamepads().
   */
  _pollGamepad() {
    if (!navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    let pad = null;

    if (this.gamepadIndex >= 0 && gamepads[this.gamepadIndex]) {
      pad = gamepads[this.gamepadIndex];
    } else {
      // Find first connected gamepad
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          pad = gamepads[i];
          this.gamepadConnected = true;
          this.gamepadId = pad.id;
          this.gamepadIndex = i;
          break;
        }
      }
    }

    if (!pad) {
      this.gamepadConnected = false;
      return;
    }

    // 1. Left Analog Stick (Steering) - Axis 0
    let stickX = pad.axes[0] || 0;
    // Deadzone filter
    if (Math.abs(stickX) < 0.12) stickX = 0;
    // Non-linear response curve for fine precision at center
    stickX = Math.sign(stickX) * Math.pow(Math.abs(stickX), 1.4);

    // 2. Triggers (RT / LT for Acceleration & Brake)
    // In standard gamepad mapping: Button 7 = RT, Button 6 = LT
    const btnRT = pad.buttons[7] ? pad.buttons[7].value : 0;
    const btnLT = pad.buttons[6] ? pad.buttons[6].value : 0;
    const btnA = pad.buttons[0] ? pad.buttons[0].pressed : false; // Face button down
    const btnB = pad.buttons[1] ? pad.buttons[1].pressed : false; // Face button right (Handbrake / Brake)
    const btnX = pad.buttons[2] ? pad.buttons[2].pressed : false; // Face button left
    const btnY = pad.buttons[3] ? pad.buttons[3].pressed : false; // Face button top (Horn)
    const btnRB = pad.buttons[5] ? pad.buttons[5].pressed : false; // Right Bumper (Handbrake)
    const btnSelect = pad.buttons[8] ? pad.buttons[8].pressed : false;
    const btnStart = pad.buttons[9] ? pad.buttons[9].pressed : false;

    // D-Pad navigation
    const dpadLeft = pad.buttons[14] ? pad.buttons[14].pressed : false;
    const dpadRight = pad.buttons[15] ? pad.buttons[15].pressed : false;
    const dpadUp = pad.buttons[12] ? pad.buttons[12].pressed : false;
    const dpadDown = pad.buttons[13] ? pad.buttons[13].pressed : false;

    if (dpadLeft) stickX = -1.0;
    if (dpadRight) stickX = 1.0;

    let throttle = 0;
    if (btnRT > 0.05) throttle += btnRT;
    if (btnA) throttle += 1.0;
    if (dpadUp) throttle += 1.0;

    if (btnLT > 0.05) throttle -= btnLT;
    if (dpadDown) throttle -= 1.0;

    const handbrake = btnRB || btnB || (btnX && throttle < 0.1);

    // Right Analog Stick (Camera Orbit) - Axes 2 & 3
    let rStickX = pad.axes[2] || 0;
    let rStickY = pad.axes[3] || 0;
    if (Math.abs(rStickX) < 0.15) rStickX = 0;
    if (Math.abs(rStickY) < 0.15) rStickY = 0;

    // Edge triggers for camera toggle / reset
    if (btnSelect && !this.gamepadState.buttonSelect) {
      this._trigger('resetCar');
    }
    if (btnStart && !this.gamepadState.buttonStart) {
      this._trigger('cameraToggle');
    }
    if (btnY && !this.gamepadState.buttonY) {
      this._trigger('horn');
    } else if (!btnY && this.gamepadState.buttonY) {
      this._trigger('hornRelease');
    }

    this.gamepadState = {
      steer: stickX,
      throttle: Math.max(-1, Math.min(1, throttle)),
      handbrake,
      cameraX: rStickX,
      cameraY: rStickY,
      buttonA: btnA,
      buttonB: btnB,
      buttonX: btnX,
      buttonY: btnY,
      buttonRB: btnRB,
      buttonStart: btnStart,
      buttonSelect: btnSelect
    };
  }

  /**
   * Aggregates input from Keyboard, Gamepad, and Mouse into unified vehicle controls.
   * @returns {{ throttle: number, steer: number, handbrake: boolean }}
   */
  getDrivingInput() {
    this._pollGamepad();

    // 1. Keyboard Steer & Throttle
    let kbSteer = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) kbSteer -= 1.0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kbSteer += 1.0;

    let kbThrottle = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) kbThrottle += 1.0;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) kbThrottle -= 1.0;

    const kbHandbrake = !!this.keys['Space'];
    const kbNitro = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyN']);
    const gpNitro = !!(this.gamepadState.buttonX);

    // 2. Merge with Gamepad input (taking strongest non-zero signal)
    const steer = Math.abs(this.gamepadState.steer) > Math.abs(kbSteer)
      ? this.gamepadState.steer
      : kbSteer;

    const throttle = Math.abs(this.gamepadState.throttle) > Math.abs(kbThrottle)
      ? this.gamepadState.throttle
      : kbThrottle;

    const handbrake = kbHandbrake || this.gamepadState.handbrake;
    const nitro = kbNitro || gpNitro;

    return {
      throttle: Math.max(-1.0, Math.min(1.0, throttle)),
      steer: Math.max(-1.0, Math.min(1.0, steer)),
      handbrake,
      nitro
    };
  }

  /**
   * Returns camera mouse / analog stick delta.
   */
  getCameraInput() {
    const deltaX = this.mouse.deltaX * 0.008 + this.gamepadState.cameraX * 0.05;
    const deltaY = this.mouse.deltaY * 0.008 + this.gamepadState.cameraY * 0.05;
    const zoom = this.mouse.zoomDelta;

    // Reset mouse deltas after consuming
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.mouse.zoomDelta = 0;

    return { deltaX, deltaY, zoom };
  }

  /**
   * Returns gamepad connection status & sticks for the HUD overlay.
   */
  getGamepadTelemetry() {
    return {
      connected: this.gamepadConnected,
      name: this.gamepadId ? this.gamepadId.split('(')[0].trim() : 'No Gamepad',
      steer: this.gamepadState.steer,
      throttle: this.gamepadState.throttle,
      handbrake: this.gamepadState.handbrake,
      buttonA: this.gamepadState.buttonA,
      buttonB: this.gamepadState.buttonB
    };
  }
}
