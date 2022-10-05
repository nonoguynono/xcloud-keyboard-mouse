import { disableConfig, enableConfig } from './browser/browserEventProcessor';
import { renderOnboardingIntro } from './browser/dom/onboarding';
import { showToast } from './browser/dom/snackbar';
import { renderToolbar } from './browser/dom/toolbar';
import { modifyGamepadGlobals, isEnabled as gamepadSimulatorIsEnabled } from './browser/gamepadSimulator';
import { actions, store } from './browser/state';
import {
  gameChangedMsg,
  injectedMsg,
  intializedMsg,
  Message,
  MessageTypes,
  seenOnboardingMsg,
} from './shared/messages';
import { GamepadConfig } from './shared/types';

/*
 * This script is injected and run inside the browser page itself and thus
 * has no "isolated world" or sandboxing.
 * It uses window.postMessage to communicate with the content_script.
 */

const gameStartStopPollTimeMs = 1000;

let active = false;
let isXbox = false;
let interval: ReturnType<typeof setInterval>;

// Setup gamepad shims right away in case the page script stores any references
modifyGamepadGlobals();

function postMessageToWindow(msg: any) {
  window.postMessage({ ...msg, source: 'xcloud-page' });
}

function getXboxGameInfo(): { gameName: string; gameId: string } | null {
  // e.g. "Halo Infinite | Xbox Cloud Gaming (Beta) on Xbox.com"
  // Page URL: https://www.xbox.com/en-US/play/launch/fortnite/BT5P2X999VH2
  const inGameUrlRegex = /^https:\/\/(www.)?xbox.com\/[\w-]+\/play\/launch\/[\w-]+\/([A-Z0-9]+)/i;
  const matches = window.location.href.match(inGameUrlRegex);
  if (matches && matches[1]) {
    const gameId = matches[1];
    const titleSplit = document.title.split(/\s+\|/);
    if (titleSplit.length === 2) {
      const gameName = titleSplit[0];
      return {
        gameName,
        gameId,
      };
    }
  }
  return null;
}

function checkIfInGame() {
  const { gameName, gameId } = getXboxGameInfo() || { gameName: null, gameId: null };
  let isInGame = !isXbox;
  if (isXbox) {
    // Headings only shown when there are errors, need sign in, or a menu is active
    const h1 = document.querySelector('h1');
    const closeBtn = document.querySelector("[data-id='ui-container'] [aria-label='Close']");
    const streamDiv = document.getElementById('game-stream');
    isInGame = !h1 && !closeBtn && !!streamDiv;
  }
  return {
    isInGame,
    gameName,
    gameId,
  };
}

// Disable the fake gamepad and let them use their real gamepad
function disableVirtualGamepad() {
  if (gamepadSimulatorIsEnabled()) {
    showToast('Mouse/keyboard disabled');
  }
  disableConfig();
  store.dispatch(actions.updatePreset({ presetName: null, preset: null }));
}

// Update the active preset
function updateActiveGamepadConfig(name: string | null, config: GamepadConfig | null) {
  if (!name || !config) {
    disableVirtualGamepad();
    return;
  }
  showToast(`'${name}' preset activated`);
  enableConfig(config);
  store.dispatch(actions.updatePreset({ presetName: name, preset: config }));
}

function cancelEvent(event: Event) {
  event.stopImmediatePropagation();
  event.stopPropagation();
  event.preventDefault();
}

function isValidMsgEvent(event: MessageEvent<any>): event is MessageEvent<Message> {
  if (event.source != window || !event.data || event.data.source !== 'xcloud-keyboard-mouse-content-script') {
    // We only accept messages from ourselves
    return false;
  }
  return true;
}

// Called when a message is received from the content script while in game
// (proxied from the background or popup scripts)
function messageListener(event: MessageEvent<any>) {
  if (!isValidMsgEvent(event)) {
    return;
  }
  const msg = event.data;
  // Got message from extension
  if (msg.type === MessageTypes.INITIALIZE_RESPONSE) {
    if (!msg.seenOnboarding) {
      // Accounts for the case a user goes straight to a game page the first time they use the extension
      // (disables preset until they see onboaring and agree)
      renderOnboardingIntro(() => {
        updateActiveGamepadConfig(msg.name, msg.gamepadConfig);
        postMessageToWindow(seenOnboardingMsg());
      });
    } else {
      updateActiveGamepadConfig(msg.name, msg.gamepadConfig);
    }
    store.dispatch(actions.updatePrefs(msg.prefs));
  } else if (msg.type === MessageTypes.ACTIVATE_GAMEPAD_CONFIG) {
    updateActiveGamepadConfig(msg.name, msg.gamepadConfig);
  } else if (msg.type === MessageTypes.UPDATE_PREFS) {
    store.dispatch(actions.updatePrefs(msg.prefs));
  }
}

// Called when the user stops playing a game
function handleGameEnded() {
  clearInterval(interval);
  window.removeEventListener('message', messageListener);
  document.removeEventListener('visibilitychange', cancelEvent);
  window.removeEventListener('focusout', cancelEvent);
  window.removeEventListener('blur', cancelEvent);
  // The user is no longer playing a game, so disable the virtual gamepad
  disableVirtualGamepad();
  postMessageToWindow(gameChangedMsg(null));
  // Begin listening again for a game to start
  pollForActiveGame();
}

// Called when the user starts playing a game
function handleGameStarted(gameName: string | null) {
  // Set up connection to content script via postMessage and listen for any response messages
  postMessageToWindow(intializedMsg(gameName));
  window.addEventListener('message', messageListener);
  // Prevent xCloud's unfocus listeners from triggering
  document.addEventListener('visibilitychange', cancelEvent);
  window.addEventListener('focusout', cancelEvent);
  window.addEventListener('blur', cancelEvent);

  // Periodically check if user leaves the game or opens a menu
  clearInterval(interval);
  interval = setInterval(() => {
    const { isInGame } = checkIfInGame();
    if (!isInGame) {
      handleGameEnded();
    }
  }, gameStartStopPollTimeMs);
}

// Periodically check if user enters a game
function pollForActiveGame() {
  clearInterval(interval);
  interval = setInterval(() => {
    const { isInGame, gameName } = checkIfInGame();
    if (isInGame) {
      clearInterval(interval);
      handleGameStarted(gameName);
    }
  }, gameStartStopPollTimeMs);
}

// Listen for an initial out-of-band message about onboarding
// (Only used if not on a game page yet, e.g. root xbox.com/play page)
function onboardingListner(event: MessageEvent<Message & { source?: string }>) {
  if (!isValidMsgEvent(event)) {
    return;
  }
  const msg = event.data;
  if (msg.type === MessageTypes.SEEN_ONBOARDING) {
    window.removeEventListener('message', onboardingListner);
    if (msg.seen === false && !checkIfInGame().isInGame) {
      renderOnboardingIntro(() => {
        postMessageToWindow(seenOnboardingMsg());
      });
    }
  }
}

function bootstrap() {
  if (active) {
    // Already running
    return;
  }
  // Considred active if either (1) not on an xbox page - like gamepad-tester, or (2) on xbox.com/play
  isXbox = /^https:\/\/(www.)?xbox.com/i.test(window.location.href);
  if (!isXbox || /^https:\/\/(www.)?xbox.com\/[\w-]+\/play/i.test(window.location.href)) {
    active = true;
    window.addEventListener('message', onboardingListner);
    postMessageToWindow(injectedMsg());
    renderToolbar();
    pollForActiveGame();
  }
}

window.addEventListener('load', bootstrap, false);
// We need to use 'pageshow' here as well as 'load' because the 'load' event
// doesn't always trigger if the page is cached (e.g. pressing the back button)
window.addEventListener('pageshow', bootstrap, false);
// A few xbox pages use history.pushState to navigate to the /play URL,
// so we proxy that as well to be safe
window.history.pushState = new Proxy(window.history.pushState, {
  apply: (target, thisArg, argArray) => {
    const output = target.apply(thisArg, argArray as any);
    bootstrap();
    return output;
  },
});
