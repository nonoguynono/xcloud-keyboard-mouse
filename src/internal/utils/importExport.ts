import { isGamepadConfigValid, upgradeOldGamepadConfig } from '../../shared/gamepadConfig';
import { GamepadConfig } from '../../shared/types';

const INPUT_ID = 'import-json-input';

export function exportConfig(config: GamepadConfig, name?: string) {
  // https://stackoverflow.com/a/65939108/2359478
  const blob = new Blob([JSON.stringify(config)], { type: 'text/json' });
  const link = document.createElement('a');

  link.download = `xcloud_preset_${name || 'game'}.json`;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove();
}

export function importConfig(): Promise<GamepadConfig> {
  // Ask user to select JSON file
  // Parse it, and show error if failed
  let input = document.getElementById(INPUT_ID) as HTMLInputElement;
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = INPUT_ID;
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);
  }
  input.click();
  return new Promise<GamepadConfig>((resolve, reject) => {
    input.onchange = function fileSelected() {
      if (!input.files || !input.files[0]) {
        return reject('Please select a file');
      }
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = function receivedText(e: ProgressEvent<FileReader>) {
        const lines = e.target!.result;
        let isValid = false;
        let config: GamepadConfig | null = null;
        try {
          const json = JSON.parse(lines as string) as GamepadConfig;
          isValid = isGamepadConfigValid(json);
          upgradeOldGamepadConfig(json);
          config = json;
        } catch (e) {
          isValid = false;
        }
        if (!isValid || !config) {
          return reject('Preset data is not valid');
        }
        return resolve(config);
      };
      reader.readAsText(file);
    };
  }).finally(() => {
    input.remove();
  });
}
