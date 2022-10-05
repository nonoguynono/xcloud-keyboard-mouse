import React from 'react';
import Header from './components/Header';
import MainConfigEditor from './components/MainConfigEditor';
import useGameName from './components/hooks/useGameStatus';
import useGamepadConfigs from './components/hooks/useGamepadConfigs';
import UpsellModal from './components/UpsellModal';

export default function Popup() {
  const { activeConfig, status, isEnabled, configs, error } = useGamepadConfigs();
  const { gameName } = useGameName();

  return (
    <div className="popup vertical">
      <Header activeConfig={activeConfig} isEnabled={isEnabled} gameName={gameName} />
      <MainConfigEditor
        activeConfig={activeConfig}
        isEnabled={isEnabled}
        status={status}
        configs={configs}
        error={error}
      />
      <UpsellModal />
    </div>
  );
}
