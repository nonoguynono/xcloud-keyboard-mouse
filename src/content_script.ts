import { Message, MessageTypes } from './shared/messages';
import { injectCssFile, injectImagePaths, injectInitialScriptFile } from './shared/pageInjectUtils';

/*
 * This script is run on the page, but in an isolated world (except for DOM/postMessage).
 * It is used to bridge communication between the extension background worker
 * and the injected script on the page.
 * https://developer.chrome.com/docs/extensions/mv3/content_scripts/#host-page-communication
 */

injectInitialScriptFile(chrome.runtime.getURL('/js/vendor.js'));
injectInitialScriptFile(chrome.runtime.getURL('/js/injected.js'));

document.addEventListener('DOMContentLoaded', () => {
  injectCssFile(chrome.runtime.getURL('/css/shared.css'));
  injectCssFile(chrome.runtime.getURL('/css/injected.css'));
  injectImagePaths([
    chrome.runtime.getURL('/images/keyboard.svg'),
    chrome.runtime.getURL('/images/mouse.svg'),
    chrome.runtime.getURL('/icon-16.png'),
    chrome.runtime.getURL('/images/pin-screenshot.png'),
  ]);
});

// Send messages to the injected script
function handleMessageFromExt(msg: Message) {
  window.postMessage({
    source: 'xcloud-keyboard-mouse-content-script',
    ...msg,
  });
}

// Accept messages from the injected script
window.addEventListener('message', (event) => {
  if (event.source != window || !event.data || event.data.source !== 'xcloud-page') {
    // Ignore other potential messages from the webpage - we only accept messages from ourselves
    return;
  }
  const msg: Message = event.data;

  // https://stackoverflow.com/a/69603416/2359478
  if (chrome.runtime?.id) {
    // Proxy to the extension background script.
    // (only INITIALIZED message needs a response, so we avoid passing the callback
    // otherwise - see https://stackoverflow.com/a/59915897)
    if (msg.type === MessageTypes.INITIALIZED || msg.type === MessageTypes.INJECTED) {
      chrome.runtime.sendMessage(msg, (response) => {
        // Handle response from extension
        handleMessageFromExt(response);
      });
    } else {
      chrome.runtime.sendMessage(msg);
    }
  }
});

// Accept messages from the extension background or popup page
chrome.runtime.onMessage.addListener((msg, sender) => {
  // Ignore messages from other content scripts just in case
  if (!sender.tab) {
    handleMessageFromExt(msg);
  }
  return false;
});
