import {
  ButtonKeyConfig,
  AxesKeyConfig,
  Direction,
  GamepadKeyConfig,
  GamepadConfig,
  GamepadMouseConfig,
} from './types';

export const DEFAULT_CONFIG_NAME = 'default';
export const MAX_NUM_CONFIGS = 25;
export const DEFAULT_SENSITIVITY = 10;
export const MAX_BINDINGS_PER_BUTTON = 2; // TODO do people want/need tripple keybinds?

const buttonToGamepadIndex: Record<keyof ButtonKeyConfig, number> = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  leftShoulder: 4,
  rightShoulder: 5,
  leftTrigger: 6,
  rightTrigger: 7,
  select: 8,
  start: 9,
  leftStickPressed: 10,
  rightStickPressed: 11,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
  home: 16,
};

const buttonToAxisIndex = (button: keyof AxesKeyConfig): number => {
  return button[0] === 'l' ? 0 : 1;
};

const buttonToAxisDirection = (button: keyof AxesKeyConfig): Direction => {
  return button.replace(/^(left|right)Stick/, '')[0].toLowerCase() as Direction;
};

export const isButtonMapping = (mapping: ButtonCodeMap | AxisCodeMap): mapping is ButtonCodeMap => {
  return (mapping as ButtonCodeMap).gamepadIndex !== undefined;
};

interface CodeMapBase {
  button: string;
}

export interface ButtonCodeMap extends CodeMapBase {
  gamepadIndex: number;
}

export interface AxisCodeMap extends CodeMapBase {
  axisIndex: number;
  axisDirection: Direction;
}

export type CodeMap = ButtonCodeMap | AxisCodeMap;
export type KeyConfigErrors = Partial<Record<keyof GamepadKeyConfig, string | undefined>>;
export interface MouseConfigErrors {
  mouseControls?: string;
  sensitivity?: string;
}

// Modifies a gamepad config in-place to convert old schemas
export function upgradeOldGamepadConfig(config: GamepadConfig) {
  const { keyConfig } = config;
  (Object.keys(keyConfig) as Array<keyof GamepadKeyConfig>).forEach((button) => {
    const keyMap = keyConfig[button];
    if (!keyMap) {
      return;
    }
    const codes = (!Array.isArray(keyMap) ? [keyMap] : keyMap).flatMap((code) => {
      // Expand any special code into a group of codes (e.g. 'Scroll' -> ['ScrollUp', 'ScrollDown'])
      if (code === 'Scroll') {
        return ['ScrollUp', 'ScrollDown'];
      }
      return code;
    });
    keyConfig[button] = codes;
  });
}

export function processGamepadConfig(config: GamepadKeyConfig) {
  // Validate a given code has only one button
  // and normalize from code to buttons array
  const codeMapping: Record<string, CodeMap> = {};
  const invalidButtons: KeyConfigErrors = {};
  (Object.keys(config) as Array<keyof GamepadKeyConfig>).forEach((button) => {
    const keyMap = config[button];
    if (!keyMap) {
      return;
    }
    const codes = !Array.isArray(keyMap) ? [keyMap] : keyMap;

    // Technically we allow importing configs with more than MAX_BINDINGS_PER_BUTTON, but it is not possible
    // in the UI. We could validate it here if we want to be more strict.
    // if (codes.length > MAX_BINDINGS_PER_BUTTON) {
    //   invalidButtons[button] = `Only ${MAX_BINDINGS_PER_BUTTON} bindings per button is allowed`;
    //   return;
    // }

    for (const code of codes) {
      if (code === 'Escape') {
        invalidButtons[button] = 'Binding Escape key is not allowed';
        continue;
      }
      if (codeMapping[code]) {
        invalidButtons[button] = `'${code}' is already bound to button '${codeMapping[code].button}'`;
        continue;
      }
      const gamepadIndex = buttonToGamepadIndex[button as keyof ButtonKeyConfig];
      if (gamepadIndex !== undefined) {
        codeMapping[code] = { button, gamepadIndex };
      } else {
        const axisIndex = buttonToAxisIndex(button as keyof AxesKeyConfig);
        const axisDirection = buttonToAxisDirection(button as keyof AxesKeyConfig);
        codeMapping[code] = { button, axisIndex, axisDirection };
      }
    }
  });
  return { codeMapping, invalidButtons, hasErrors: Object.keys(invalidButtons).length > 0 };
}

export function validateMouseConfig(mouseConfig: GamepadMouseConfig): {
  errors: MouseConfigErrors;
  hasErrors: boolean;
} {
  const { sensitivity, mouseControls } = mouseConfig;
  const errors: MouseConfigErrors = {};
  if (mouseControls !== undefined && mouseControls !== 0 && mouseControls !== 1) {
    errors.mouseControls = 'Invalid stick number';
  }
  if (sensitivity < 1 || sensitivity > 1000) {
    errors.mouseControls = 'Invalid sensitivity value. Must be between 1 and 1000.';
  }
  return { errors, hasErrors: Object.keys(errors).length > 0 };
}

export function isGamepadConfigValid(gamepadConfig: GamepadConfig) {
  try {
    const { hasErrors: mouseErrors } = validateMouseConfig(gamepadConfig.mouseConfig);
    if (mouseErrors) {
      return false;
    }
    const { hasErrors: buttonErrors } = processGamepadConfig(gamepadConfig.keyConfig);
    return !buttonErrors;
  } catch (e) {
    return false;
  }
}

export const defaultGamepadConfig: GamepadConfig = {
  mouseConfig: {
    mouseControls: 1,
    sensitivity: DEFAULT_SENSITIVITY,
  },
  // Find "event.code" from https://keycode.info/
  keyConfig: {
    a: 'Space',
    b: ['ControlLeft', 'Backspace'],
    x: 'KeyR',
    y: ['ScrollUp', 'ScrollDown'],
    leftShoulder: ['KeyC', 'KeyG'],
    leftTrigger: 'RightClick',
    rightShoulder: 'KeyQ',
    rightTrigger: 'Click',
    start: 'Enter',
    select: 'Tab',
    home: undefined,
    dpadUp: ['ArrowUp', 'KeyX'],
    dpadLeft: ['ArrowLeft', 'KeyN'],
    dpadDown: ['ArrowDown', 'KeyZ'],
    dpadRight: 'ArrowRight',
    leftStickUp: 'KeyW',
    leftStickLeft: 'KeyA',
    leftStickDown: 'KeyS',
    leftStickRight: 'KeyD',
    rightStickUp: 'KeyO',
    rightStickLeft: 'KeyK',
    rightStickDown: 'KeyL',
    rightStickRight: 'Semicolon',
    leftStickPressed: 'ShiftLeft',
    rightStickPressed: 'KeyF',
  },
};

export const emptyGamepadConfig: GamepadConfig = {
  mouseConfig: {
    mouseControls: undefined,
    sensitivity: DEFAULT_SENSITIVITY,
  },
  keyConfig: (Object.keys(defaultGamepadConfig.keyConfig) as Array<keyof GamepadKeyConfig>).reduce((keyConfig, key) => {
    keyConfig[key] = undefined;
    return keyConfig;
  }, {} as GamepadKeyConfig),
};
