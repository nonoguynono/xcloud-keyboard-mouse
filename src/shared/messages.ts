import { GamepadConfig, GlobalPrefs } from './types';

export enum MessageTypes {
  INJECTED = 'INJECTED',
  INITIALIZED = 'INITIALIZED',
  GAME_CHANGED = 'GAME_CHANGED',
  ACTIVATE_GAMEPAD_CONFIG = 'ACTIVATE_GAMEPAD_CONFIG',
  INITIALIZE_RESPONSE = 'INITIALIZE_RESPONSE',
  SEEN_ONBOARDING = 'SEEN_ONBOARDING',
  UPDATE_PREFS = 'UPDATE_PREFS',
  CLOSE_WINDOW = 'CLOSE_WINDOW',
}

export type Message =
  | ReturnType<typeof injectedMsg>
  | ReturnType<typeof intializedMsg>
  | ReturnType<typeof gameChangedMsg>
  | ReturnType<typeof activateGamepadConfigMsg>
  | ReturnType<typeof initializeResponseMsg>
  | ReturnType<typeof seenOnboardingMsg>
  | ReturnType<typeof updatePrefsMsg>
  | ReturnType<typeof closeWindowMsg>;

// Sent from page to background to enable the context button in the toolbar
export function injectedMsg() {
  return { type: MessageTypes.INJECTED as const };
}

// Sent from page to background to load all settings
export function intializedMsg(gameName: string | null) {
  return { type: MessageTypes.INITIALIZED as const, gameName };
}

// Sent from page to background to set game name manually
export function gameChangedMsg(gameName: string | null) {
  return { type: MessageTypes.GAME_CHANGED as const, gameName };
}

// Sent from the page to background to note the user has seen the onboarding
export function seenOnboardingMsg(seen = true) {
  return { type: MessageTypes.SEEN_ONBOARDING as const, seen };
}

// Sent from background to page for user's first time using the extension
export function initializeResponseMsg(
  name: string | null,
  gamepadConfig: GamepadConfig | null,
  seenOnboarding: boolean,
  prefs: GlobalPrefs,
) {
  return { type: MessageTypes.INITIALIZE_RESPONSE as const, name, gamepadConfig, seenOnboarding, prefs };
}

// Sent from background to page to set active mouse+keyboard config (null for disabled)
export function activateGamepadConfigMsg(name: string | null, gamepadConfig: GamepadConfig | null) {
  return { type: MessageTypes.ACTIVATE_GAMEPAD_CONFIG as const, name, gamepadConfig };
}

export function disableGamepadMsg() {
  return activateGamepadConfigMsg(null, null);
}

// Sent from the background to page when preferences are updated that would impact it
export function updatePrefsMsg(prefs: GlobalPrefs) {
  return { type: MessageTypes.UPDATE_PREFS as const, prefs };
}

// Sent from the background to popup to close
export function closeWindowMsg() {
  return { type: MessageTypes.CLOSE_WINDOW as const };
}
