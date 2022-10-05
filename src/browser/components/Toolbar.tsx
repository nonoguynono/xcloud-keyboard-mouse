import classnames from 'classnames';
import React from 'react';
import { useSelector } from 'react-redux';
import KeybindingsTable from '../../internal/components/KeybindingsTable';
import { getInjectedImagePath } from '../../shared/pageInjectUtils';
import { selectors } from '../state';
import MouseEnableTarget from './MouseEnableTarget';
import { useLocalStorage } from './useLocalStorage';

function KeyboardOnlyIcon() {
  return <img className="left-xmnk" style={{ opacity: 0.5 }} src={getInjectedImagePath('keyboard.svg')} />;
}

export default function Toolbar() {
  // Using localstorage to avoid the complexity of message passing back to the extension storage
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>('xmnk-toolbar-expanded', true);

  const mouse = useSelector(selectors.selectMouse);
  const preset = useSelector(selectors.selectPreset);
  const { showControlsOverlay } = useSelector(selectors.selectPrefs);

  const increaseSize = () => setIsExpanded(true);
  const decreaseSize = () => setIsExpanded(false);

  const presetHasMouseControls = preset.preset?.mouseConfig.mouseControls !== undefined;

  return preset.preset ? (
    <div className={classnames(mouse.status === 'listening' && 'mouse-listening-xmnk', 'full-width-xmnk')}>
      <div
        className={classnames('header-xmnk', `header-xmnk-${isExpanded ? 'expanded' : 'minimized'}`, 'full-width-xmnk')}
      >
        {!isExpanded && presetHasMouseControls ? (
          // Small mouse is shown when minimized, regardless of controls overlay
          <MouseEnableTarget placement="small" {...mouse} />
        ) : showControlsOverlay ? (
          // Controls overlay shows keyboard fallback
          <KeyboardOnlyIcon />
        ) : null}

        {isExpanded && showControlsOverlay ? <div className="preset-name-xmnk">Preset: {preset.presetName}</div> : null}

        {showControlsOverlay || (!isExpanded && presetHasMouseControls) ? (
          <div className="size-buttons-xmnk">
            {isExpanded ? (
              <button onClick={decreaseSize} title="Show less">
                -
              </button>
            ) : (
              <button onClick={increaseSize} title="Show more">
                +
              </button>
            )}
          </div>
        ) : null}
      </div>

      {isExpanded && showControlsOverlay && (
        <div
          className="keybindings-xmnk"
          style={!presetHasMouseControls || mouse.status === 'listening' ? { borderBottom: 'none' } : undefined}
        >
          <KeybindingsTable hideMissing gamepadConfig={preset.preset} />
          <div className="explanation-xmnk">To edit bindings use the toolbar button for the extension.</div>
        </div>
      )}

      {isExpanded && presetHasMouseControls && (
        <MouseEnableTarget
          placement={!showControlsOverlay ? 'centered' : 'docked'}
          {...mouse}
          onMinimize={decreaseSize}
        />
      )}
    </div>
  ) : null;
}
