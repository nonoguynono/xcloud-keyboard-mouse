import React, { useState, useRef, useMemo, KeyboardEventHandler, useCallback } from 'react';
import { PrimaryButton, IconButton, TextField, Callout, DirectionalHint, DefaultButton } from '@fluentui/react';
import { GamepadConfig } from '../../shared/types';
import { PlusCircleIcon } from './icons';
import { importConfig } from '../utils/importExport';
import useIsMounted from './hooks/useIsMounted';

interface NewConfigButtonProps {
  allConfigs: Record<string, GamepadConfig>;
  disabled?: boolean;
  onCreate: (name: string) => void;
  onImport: (name: string, config: GamepadConfig) => void;
}

export default function NewConfigButton({ disabled, allConfigs, onCreate, onImport }: NewConfigButtonProps) {
  const buttonId = 'new-config-btn';
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const isMounted = useIsMounted();
  const isTaken = useMemo(() => {
    return (
      Object.keys(allConfigs)
        .map((existing) => existing.toLowerCase())
        .indexOf(name.toLowerCase()) !== -1
    );
  }, [name, allConfigs]);
  const triggerRef = useRef<null | HTMLButtonElement>(null);
  const handleToggleClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  const handleImport = useCallback(() => {
    importConfig()
      .then((config) => {
        onImport(name, config);
        if (isMounted()) setName('');
        alert('Preset file imported successfully');
      })
      .catch((errorMsg) => {
        console.error('Import failed', errorMsg);
        alert(errorMsg);
      });
  }, [isMounted, name, onImport]);
  const handleSubmit = useCallback(() => {
    onCreate(name);
  }, [onCreate, name]);
  const handleKeyPress: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
    (e) => {
      if (e.code === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit],
  );
  return (
    <>
      <IconButton
        id={buttonId}
        elementRef={triggerRef}
        onClick={handleToggleClick}
        title="Add new preset"
        ariaLabel="Add new preset"
        disabled={disabled}
      >
        <PlusCircleIcon />
      </IconButton>
      {isOpen ? (
        <Callout
          setInitialFocus
          gapSpace={0}
          directionalHint={DirectionalHint.bottomRightEdge}
          target={`#${buttonId}`}
          onDismiss={handleClose}
          // Needed to fix issue in Safari
          preventDismissOnEvent={(e) => e.type === 'resize'}
        >
          <div style={{ width: 250 }} className="padding-full">
            <TextField
              placeholder="New preset name"
              autoFocus={isOpen}
              value={name}
              maxLength={18}
              onKeyPress={handleKeyPress}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            {isTaken ? <div className="error margin-top-s">Config with that name already exists!</div> : null}
            <div className="horizontal space-between margin-top-s">
              <DefaultButton disabled={!name || isTaken} onClick={handleImport}>
                Import File
              </DefaultButton>
              <PrimaryButton disabled={!name || isTaken} onClick={handleSubmit}>
                Create New
              </PrimaryButton>
            </div>
          </div>
        </Callout>
      ) : null}
    </>
  );
}
