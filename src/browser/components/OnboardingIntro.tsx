// only shows when the user goes to xcloud and uses the extension for the first time
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-responsive-modal';
import { getInjectedImagePath } from '../../shared/pageInjectUtils';

interface OnboardingIntroProps {
  onDismiss: () => void;
}

export default function OnboardingIntro({ onDismiss }: OnboardingIntroProps) {
  const [canDismiss, setCanDismiss] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setCanDismiss(true);
    }, 2200);
  }, []);

  const icon16 = getInjectedImagePath('icon-16.png');
  const pinScreenshot = getInjectedImagePath('pin-screenshot.png');

  return (
    <Modal
      center
      open={true}
      onClose={onDismiss}
      showCloseIcon={false}
      focusTrapped={true}
      closeOnEsc={false}
      closeOnOverlayClick={false}
    >
      <div className="explanation-modal-xmnk">
        <h1>Welcome to Keyboard &amp; Mouse for xCloud!</h1>
        <p>
          <strong>Use the extension popup to configure the extension and set up your key bindings.</strong>
        </p>
        <p>
          To access the extension popup, simply click the <img src={icon16} /> icon at the top right of your browser. If
          you do not see the <img src={icon16} /> icon in your extension toolbar, use the following steps to pin it:
        </p>
        <ol>
          <li>Click the extensions puzzle icon in the top-right of the browser toolbar</li>
          <li>Click the pin icon next to the green xCloud mouse icon</li>
        </ol>
        <p>
          <img src={pinScreenshot} />
        </p>
        <p>
          <strong>Other important notes:</strong>
        </p>
        <ul>
          <li>
            You may see a warning when launching a game on xCloud about no controller - just click &quot;Continue
            Anyway&quot;
          </li>
          <li>
            Mouse control can be enabled by clicking the overlay that appears after launching a game, and can be exited
            by pressing the <kbd>Esc</kbd> key
          </li>
          <li>
            Mouse sensitivity can be changed in the extension popup, however for best results{' '}
            <u>
              it is important to also tweak controler stick sensitivity and deadzone options inside each game&apos;s
              settings as well
            </u>
          </li>
        </ul>
        <div style={{ textAlign: 'center' }}>
          <button className="agree" disabled={!canDismiss} onClick={onDismiss}>
            Understood
          </button>
        </div>
      </div>
    </Modal>
  );
}
