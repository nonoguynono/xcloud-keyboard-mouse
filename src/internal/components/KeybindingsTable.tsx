import React from 'react';
import { emptyGamepadConfig } from '../../shared/gamepadConfig';
import { GamepadConfig, KeyMap } from '../../shared/types';
import { EditorState } from './hooks/useKeyConfigEditorState';
import KeybindingsForButton from './KeybindingsForButton';

interface KeybindingsTableProps {
  gamepadConfig: GamepadConfig;
  className?: string;
  errors?: EditorState['errors'];
  onKeybindChange?: (button: string, updated: KeyMap) => void;
  isEditing?: boolean;
  hideMissing?: boolean;
}

function KeybindingsTable({
  className,
  gamepadConfig,
  errors,
  isEditing,
  onKeybindChange,
  hideMissing,
}: KeybindingsTableProps) {
  let keys = Object.keys(emptyGamepadConfig.keyConfig) as Array<keyof typeof emptyGamepadConfig.keyConfig>;
  if (hideMissing) {
    keys = keys.filter((key) => !!gamepadConfig.keyConfig[key]?.length);
  }
  return (
    <table className={className}>
      <tbody>
        {keys.map((button) => {
          const val = gamepadConfig.keyConfig[button];
          return (
            <KeybindingsForButton
              key={button.toString()}
              useSpacers
              button={button}
              readOnly={!isEditing}
              value={val}
              onChange={onKeybindChange}
              error={errors?.keyConfig[button]}
            />
          );
        })}
      </tbody>
    </table>
  );
}

export default KeybindingsTable;
