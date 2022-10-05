import { TooltipHost } from '@fluentui/react';
import classnames from 'classnames';
import React, { useCallback, MouseEvent } from 'react';
import { getInjectedImagePath } from '../../shared/pageInjectUtils';
import { mouseTriggerListener } from '../browserEventProcessor';
import { MouseState } from '../state';

export const firstClickText = 'Click here to enable mouse control';
export const secondClickText = 'Click again to enable mouse';

interface MouseEnableTargetProps extends MouseState {
  placement: 'small' | 'centered' | 'docked';
  onMinimize?: () => void;
}

function MouseEnableTarget({ status, placement, onMinimize }: MouseEnableTargetProps) {
  const mouseText = status === 'error' ? secondClickText : firstClickText;
  const mouseImgSrc = getInjectedImagePath('mouse.svg');

  const isNotSmall = placement !== 'small';
  const isCentered = placement === 'centered';

  const expandedStyle = { height: '1.5em' };

  const handleMouseDown = useCallback((e: MouseEvent) => {
    mouseTriggerListener(e.nativeEvent);
  }, []);

  const handleMinimize = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onMinimize?.();
    },
    [onMinimize],
  );

  return isNotSmall && status === 'listening' ? null : (
    <TooltipHost hidden={placement === 'centered'} content={mouseText} id="enable-mouse-tooltip">
      <div
        id="click-to-enable-mouse-xmnk"
        className={classnames(isNotSmall && 'expanded-xmnk', isCentered ? 'centered-xmnk' : 'left-xmnk')}
        onMouseDown={status !== 'listening' ? handleMouseDown : undefined}
      >
        <img src={mouseImgSrc} style={isNotSmall ? expandedStyle : undefined} />
        {isNotSmall ? <div>{mouseText}</div> : null}
        {isCentered && onMinimize ? (
          <div className="minimize-xmnk" onMouseDown={handleMinimize} title="Show less">
            -
          </div>
        ) : null}
      </div>
    </TooltipHost>
  );
}

export default MouseEnableTarget;
