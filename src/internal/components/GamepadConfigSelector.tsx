import React, { memo, useCallback, useMemo, FormEvent } from 'react';
import classnames from 'classnames';
import {
  DefaultButton,
  Dropdown,
  IconButton,
  IDropdownOption,
  IDropdownStyleProps,
  IDropdownStyles,
  IStyleFunctionOrObject,
  ResponsiveMode,
} from '@fluentui/react';
import { GamepadConfig } from '../../shared/types';
import { MAX_NUM_CONFIGS } from '../../shared/gamepadConfig';
import NewConfigButton from './NewConfigButton';
import { ChevronLeftIcon, ChevronRightIcon, Wrench } from './icons';
import { arrayPrevOrNext } from '../utils/generalUtils';

interface GamepadConfigSelectorProps {
  className?: string;
  currentConfig: string;
  isEnabled: boolean;
  activeConfig: string | null;
  allConfigs: Record<string, GamepadConfig>;
  setCurrentConfig: (name: string) => void;
  addNewConfig: (newName: string) => void;
  importConfig: (name: string, config: GamepadConfig) => void;
  toggleShowSettings: () => void;
}

const dropdownStyles: IStyleFunctionOrObject<IDropdownStyleProps, IDropdownStyles> = {
  root: { width: '100%' },
  title: { border: 'none', background: 'transparent' },
};

function ConfigTitle({ name, status }: { name: string; status?: 'New' | 'Active' | false }) {
  return (
    <div className="horizontal centered">
      <span className={classnames('overflow-ellipsis margin-right-s', status && 'selector-active')}>{name}</span>
      {status ? <small>({status})</small> : null}
    </div>
  );
}

function renderOption(option?: IDropdownOption) {
  return option ? <ConfigTitle name={option.text} status={option.data?.active && 'Active'} /> : null;
}

function renderTitle(options?: IDropdownOption[]) {
  const option = options && options[0];
  return renderOption(option);
}

function GamepadConfigSelector({
  className,
  currentConfig,
  activeConfig,
  isEnabled,
  allConfigs,
  setCurrentConfig,
  addNewConfig,
  importConfig,
  toggleShowSettings,
}: GamepadConfigSelectorProps) {
  const configsArray = useMemo(() => Object.keys(allConfigs), [allConfigs]);
  const currentConfigIndex = useMemo(() => configsArray.indexOf(currentConfig), [configsArray, currentConfig]);
  const isNew = !allConfigs[currentConfig];
  const onlyOneConfig = configsArray.length < 2;
  const handleMove = (isBack: boolean) => {
    const nextConfigName = arrayPrevOrNext(configsArray, currentConfigIndex, isBack);
    setCurrentConfig(nextConfigName);
  };
  const handleSelectConfig = useCallback(
    (_event: FormEvent<HTMLDivElement>, item?: IDropdownOption) => {
      if (item) {
        setCurrentConfig(item.key as string);
      }
    },
    [setCurrentConfig],
  );
  const arrowCssClasses = classnames(onlyOneConfig && 'not-allowed-cursor');
  const rootCssClasses = classnames('config-selector horizontal centered', !isNew && 'space-between', className);
  const dropdownOptions: IDropdownOption[] = useMemo(
    () =>
      configsArray.map((configName) => ({
        key: configName,
        text: configName,
        data: isEnabled && configName === activeConfig ? { active: true } : undefined,
      })),
    [configsArray, isEnabled, activeConfig],
  );
  return isNew ? (
    <div className={rootCssClasses}>
      <ConfigTitle name={currentConfig} status="New" />
    </div>
  ) : (
    <div className={rootCssClasses}>
      <DefaultButton
        className={arrowCssClasses}
        disabled={onlyOneConfig}
        onClick={() => handleMove(true)}
        title="Previous preset"
      >
        <ChevronLeftIcon />
      </DefaultButton>

      <Dropdown
        ariaLabel="Select preset"
        calloutProps={{ doNotLayer: true }}
        selectedKey={currentConfig}
        onChange={handleSelectConfig}
        styles={dropdownStyles}
        options={dropdownOptions}
        onRenderTitle={renderTitle}
        onRenderOption={renderOption}
        responsiveMode={ResponsiveMode.large}
      />

      <div className="horizontal">
        <DefaultButton
          className={arrowCssClasses}
          disabled={configsArray.length < 2}
          onClick={() => handleMove(false)}
          title="Next preset"
        >
          <ChevronRightIcon />
        </DefaultButton>
        <NewConfigButton
          disabled={configsArray.length >= MAX_NUM_CONFIGS - 1}
          allConfigs={allConfigs}
          onCreate={addNewConfig}
          onImport={importConfig}
        />
        <IconButton onClick={toggleShowSettings} title="Settings" ariaLabel="Settings">
          <Wrench />
        </IconButton>
      </div>
    </div>
  );
}

export default memo(GamepadConfigSelector);
