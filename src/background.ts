import {
  getAllStoredSync,
  storeActiveGamepadConfig,
  storeGlobalPrefs,
  storeSeenOnboarding,
  updateGameName,
} from './internal/state/chromeStoredData';
import { enableActionButton } from './internal/utils/actionButtonUtils';
import { arrayPrevOrNext } from './internal/utils/generalUtils';
import { sendMessage, setActiveConfig } from './internal/utils/messageUtils';
import { DEFAULT_CONFIG_NAME } from './shared/gamepadConfig';
import {
  MessageTypes,
  Message,
  initializeResponseMsg,
  closeWindowMsg,
  updatePrefsMsg,
  seenOnboardingMsg,
} from './shared/messages';
import { getExtPay } from './shared/payments';
import { GlobalPrefs } from './shared/types';

getExtPay().startBackground();

/*
 * This script is run as a service worker and may be killed or restarted at any time.
 * Make sure to read the following for more information:
 * https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  // Page actions are disabled by default and enabled on select tabs
  if (reason === 'install') {
    // First time install - enable the default gamepad config
    storeActiveGamepadConfig(DEFAULT_CONFIG_NAME);
  }
  if (typeof chrome.runtime.setUninstallURL === 'function') {
    chrome.runtime.setUninstallURL('https://forms.gle/nzToDcw1mmssMBLx6');
  }
});

// https://developer.chrome.com/docs/extensions/reference/commands/#handling-command-events
chrome.commands.onCommand.addListener((command) => {
  console.log('Keyboard command:', command);
  const commandToProfileOrder: Record<string, boolean> = {
    'profile-prev': true,
    'profile-next': false,
  };
  getAllStoredSync().then(({ activeConfig, configs, prefs }) => {
    const isPrev = commandToProfileOrder[command];
    if (command === 'show-hide-cheatsheet') {
      const newPrefs: GlobalPrefs = {
        ...prefs,
        showControlsOverlay: !prefs.showControlsOverlay,
      };
      sendMessage(updatePrefsMsg(newPrefs));
      storeGlobalPrefs(newPrefs);
    } else if (isPrev !== undefined) {
      const configsArray = Object.keys(configs);
      const currentConfigIndex = configsArray.indexOf(activeConfig);
      const nextConfigName =
        currentConfigIndex === -1 ? DEFAULT_CONFIG_NAME : arrayPrevOrNext(configsArray, currentConfigIndex, isPrev);
      const nextConfig = configs[nextConfigName];
      setActiveConfig(nextConfigName, nextConfig);
    }
    // Close the popup if it is open to avoid it showing stale data
    chrome.runtime.sendMessage(closeWindowMsg());
  });
});

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  // Receives messages from the content_script
  if (!sender.tab) return false;

  if (msg.type === MessageTypes.INJECTED) {
    console.log('Injected');
    getAllStoredSync().then(({ seenOnboarding }) => {
      sendResponse(seenOnboardingMsg(seenOnboarding));
    });
    // Note this is probably not needed anymore, since action button should always be enabled now
    enableActionButton(sender.tab.id);
    return true;
  }
  if (msg.type === MessageTypes.INITIALIZED) {
    console.log('Initialized', msg.gameName);
    updateGameName(msg.gameName);
    // Send any currently-active config
    getAllStoredSync().then(({ isEnabled, activeConfig, configs, seenOnboarding, prefs }) => {
      const config = !isEnabled ? null : configs[activeConfig];
      sendResponse(initializeResponseMsg(activeConfig, config, seenOnboarding, prefs));
    });
    // https://stackoverflow.com/a/56483156
    return true;
  }
  if (msg.type === MessageTypes.GAME_CHANGED) {
    console.log('Game changed to', msg.gameName);
    updateGameName(msg.gameName);
    return false;
  }
  if (msg.type === MessageTypes.SEEN_ONBOARDING) {
    console.log('User dismissed onboarding');
    storeSeenOnboarding();
    return false;
  }
  return false;
});
