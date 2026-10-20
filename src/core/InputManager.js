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

    // Virtual Dual Joysticks (Left = Move, Right = Pan Camera)
    this.virtualJoysticks = {
      left: { x: 0, y: 0, active: false },
      right: { x: 0, y: 0, active: false }
    };

    // Virtual Action Buttons
    this.virtualActions = {
      sprint: false,
      jump: false
    };

    // Event callbacks (e.g. onCameraToggle, onResetCar, onHorn, onToggleGraph)
    this.callbacks = {};

    this._bindKeyboardEvents();
    this._bindMouseEvents();
    this._bindGamepadEvents();
  }

  setLeftJoystick(x, y) {
    this.virtualJoysticks.left.x = x;
    this.virtualJoysticks.left.y = y;
    this.virtualJoysticks.left.active = (Math.hypot(x, y) > 0.03);
  }

  setRightJoystick(x, y) {
    this.virtualJoysticks.right.x = x;
    this.virtualJoysticks.right.y = y;
    this.virtualJoysticks.right.active = (Math.hypot(x, y) > 0.03);
  }

  setVirtualAction(action, isPressed) {
    if (action in this.virtualActions) {
      this.virtualActions[action] = !!isPressed;
    }
  }

  triggerAction(actionName) {
    this._trigger(actionName);
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
      if (e.code === 'KeyF' || e.code === 'Enter') this._trigger('enterExitVehicle');
      if (e.code === 'KeyE') this._trigger('interact');
      if (e.code === 'KeyT') this._trigger('callTaxi');
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

    // 1. Left Analog Stick (Steering & On-Foot Movement) - Axes 0 & 1
    let stickX = pad.axes[0] || 0;
    // Deadzone filter
    if (Math.abs(stickX) < 0.12) stickX = 0;
    stickX = Math.sign(stickX) * Math.pow(Math.abs(stickX), 1.4);

    // Axis 1: -1 is UP (front), +1 is DOWN (back)
    let stickY = -(pad.axes[1] || 0);
    if (Math.abs(stickY) < 0.12) stickY = 0;
    stickY = Math.sign(stickY) * Math.pow(Math.abs(stickY), 1.4);

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
    if (dpadUp) {
      throttle += 1.0;
      stickY = 1.0;
    }

    if (btnLT > 0.05) throttle -= btnLT;
    if (dpadDown) {
      throttle -= 1.0;
      stickY = -1.0;
    }

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
      stickY: stickY,
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
   * Returns on-foot movement inputs for third-person player walking / sprinting / jumping.
   */
  getOnFootInput() {
    this._pollGamepad();

    let moveX = 0; // A/D or Left Stick X
    let moveZ = 0; // W/S or Left Stick Y

    // 1. Keyboard
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // 2. Virtual Left Joystick (Move Character)
    if (this.virtualJoysticks.left.active) {
      moveX += this.virtualJoysticks.left.x;
      moveZ += this.virtualJoysticks.left.y;
    }

    // 3. Gamepad Left Stick
    if (this.gamepadConnected) {
      if (Math.abs(this.gamepadState.steer) > 0.15) {
        moveX += this.gamepadState.steer;
      }
      if (this.gamepadState.stickY !== undefined && Math.abs(this.gamepadState.stickY) > 0.15) {
        moveZ += this.gamepadState.stickY;
      } else if (Math.abs(this.gamepadState.throttle) > 0.15) {
        moveZ += this.gamepadState.throttle;
      }
    }

    // Clamp analog magnitude to 1.0 max
    const mag = Math.hypot(moveX, moveZ);
    if (mag > 1.0) {
      moveX /= mag;
      moveZ /= mag;
    }

    const sprint = !!(
      this.keys['ShiftLeft'] ||
      this.keys['ShiftRight'] ||
      this.virtualActions.sprint ||
      (this.gamepadConnected && this.gamepadState.buttonA)
    );

    const jump = !!(
      this.keys['Space'] ||
      this.virtualActions.jump ||
      (this.gamepadConnected && this.gamepadState.buttonRB)
    );

    return {
      moveX,
      moveZ,
      sprint,
      jump
    };
  }

  /**
   * Returns camera mouse / analog stick / virtual joystick pan delta.
   */
  getCameraInput() {
    let deltaX = this.mouse.deltaX * 0.008 + this.gamepadState.cameraX * 0.05;
    let deltaY = this.mouse.deltaY * 0.008 + this.gamepadState.cameraY * 0.05;
    const zoom = this.mouse.zoomDelta;

    // Virtual Right Joystick (Pan Around Camera)
    if (this.virtualJoysticks.right.active) {
      deltaX += this.virtualJoysticks.right.x * 0.05;
      deltaY += this.virtualJoysticks.right.y * 0.035;
    }

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
