import { AllMyGamepadConfigs, GamepadConfig } from '../../shared/types';
import { defaultGamepadConfig, DEFAULT_CONFIG_NAME, upgradeOldGamepadConfig } from '../../shared/gamepadConfig';

// Chrome Sync Storage Limits:
// max items = 512
// max writes per second = 2
// max bytes per item = 8.192 KB

enum LocalStorageKeys {
  GAME_NAME = 'GAME_NAME',
}

enum SyncStorageKeys {
  GAMEPAD_CONFIGS = 'GP_CONF',
  ACTIVE_GAMEPAD_CONFIG = 'ACTIVE_GP_CONF',
  ENABLED = 'ENABLED',
}

export function updateGameName(gameName: string | null) {
  return chrome.storage.local.set({ [LocalStorageKeys.GAME_NAME]: gameName });
}

export async function getLocalGameStatus(): Promise<string | null> {
  const data = await chrome.storage.local.get(LocalStorageKeys.GAME_NAME);
  return (data && data[LocalStorageKeys.GAME_NAME]) || null;
}

/**
 * Updates a stored gamepad config by name (does not set it as active)
 */
export function storeGamepadConfig(name: string, gamepadConfig: GamepadConfig) {
  return chrome.storage.sync.set({ [`${SyncStorageKeys.GAMEPAD_CONFIGS}:${name}`]: gamepadConfig });
}

/**
 * Deletes a stored gamepad config.
 * Be careful not to delete the active config!
 */
export function deleteGamepadConfig(name: string) {
  if (name === DEFAULT_CONFIG_NAME) {
    throw new Error('Cannot delete default config');
  }
  return chrome.storage.sync.remove(`${SyncStorageKeys.GAMEPAD_CONFIGS}:${name}`);
}

/**
 * Sets the extension enabled/disabled.
 */
export function storeGamepadConfigEnabled(enabled: boolean) {
  return chrome.storage.sync.set({ [SyncStorageKeys.ENABLED]: enabled });
}

/**
 * Sets a gamepad config as active.
 */
export function storeActiveGamepadConfig(name: string) {
  // TODO validate the name exists before setting it active?
  return chrome.storage.sync.set({
    [SyncStorageKeys.ENABLED]: true,
    [SyncStorageKeys.ACTIVE_GAMEPAD_CONFIG]: name,
  });
}

function normalizeGamepadConfigs(data: Record<string, any> = {}): AllMyGamepadConfigs {
  const activeConfig: string = data[SyncStorageKeys.ACTIVE_GAMEPAD_CONFIG] || DEFAULT_CONFIG_NAME;
  const isEnabled: boolean =
    data[SyncStorageKeys.ENABLED] === undefined
      ? !!data[SyncStorageKeys.ACTIVE_GAMEPAD_CONFIG]
      : data[SyncStorageKeys.ENABLED];
  const keys = Object.keys(data).filter((key) => key.startsWith(SyncStorageKeys.GAMEPAD_CONFIGS));
  const initialConfigsMap: AllMyGamepadConfigs['configs'] = {
    [DEFAULT_CONFIG_NAME]: defaultGamepadConfig,
  };
  return {
    isEnabled,
    activeConfig,
    configs: keys.reduce((configs, key) => {
      const name = key.split(':')[1];
      const config = data[key];
      upgradeOldGamepadConfig(config);
      configs[name] = config;
      return configs;
    }, initialConfigsMap),
  };
}

export async function getAllStoredSync() {
  const data = await chrome.storage.sync.get(null);
  return normalizeGamepadConfigs(data);
}
