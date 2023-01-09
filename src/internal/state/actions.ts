import { createAction, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GamepadConfig, GlobalPrefs, Payment } from '../../shared/types';
import { DEFAULT_CONFIG_NAME } from '../../shared/gamepadConfig';
import { activateGamepadConfigMsg, disableGamepadMsg, updatePrefsMsg } from '../../shared/messages';
import { getGamepadConfig, getIsAllowed, isConfigActive } from './selectors';
import { RootState } from './store';
import {
  deleteGamepadConfig,
  getAllStoredSync,
  getLocalGameStatus,
  storeGamepadConfig,
  storeGamepadConfigEnabled,
  storeGlobalPrefs,
} from './chromeStoredData';
import { getExtPay } from '../../shared/payments';
import { sendMessage, setActiveConfig } from '../utils/messageUtils';

const extpay = getExtPay();

export const showUpsellModalAction = createAction<boolean>('upsellModal/show');

export const fetchGameStatusAction = createAsyncThunk('meta/gameStatus', getLocalGameStatus);

export const fetchAllAction = createAsyncThunk('config/fetchAll', getAllStoredSync);

export const fetchPaymentAction = createAsyncThunk('payment/fetch', async (): Promise<Payment> => {
  const user = await extpay.getUser();
  return {
    paid: user.paid,
    paidAt: user.paidAt && user.paidAt.getTime(),
    installedAt: user.installedAt.getTime(),
    trialStartedAt: user.trialStartedAt && user.trialStartedAt.getTime(),
  };
});

async function _setActiveConfig(name: string, state: RootState) {
  const { config: gamepadConfig } = getGamepadConfig(state, name);
  if (!gamepadConfig) throw new Error('Missing gamepad config cache');
  if (!getIsAllowed(state)) throw new Error('Not allowed to enable config');
  return await setActiveConfig(name, gamepadConfig);
}

export const activateGamepadConfigAction = createAsyncThunk(
  'config/activate',
  ({ name }: { name: string }, { getState }) => _setActiveConfig(name, getState()),
);

export const disableGamepadConfigAction = createAsyncThunk('config/disable', async () => {
  await sendMessage(disableGamepadMsg());
  await storeGamepadConfigEnabled(false);
});

export const deleteGamepadConfigAction = createAsyncThunk(
  'config/delete',
  async ({ name }: { name: string }, { getState }) => {
    const promises: Promise<any>[] = [];
    if (isConfigActive(getState(), name)) {
      // We are deleting the active config, so activate default instead
      promises.push(_setActiveConfig(DEFAULT_CONFIG_NAME, getState()));
    }
    await Promise.all([...promises, deleteGamepadConfig(name)]);
    return { name };
  },
);

export const modifyGamepadConfigAction = createAsyncThunk(
  'config/modify',
  async ({ name, gamepadConfig }: { name: string; gamepadConfig: GamepadConfig }, { getState }) => {
    if (isConfigActive(getState(), name)) {
      // Update the active config on page
      await sendMessage(activateGamepadConfigMsg(name, gamepadConfig));
    }
    await storeGamepadConfig(name, gamepadConfig);
    return { name, gamepadConfig };
  },
);

// Sends the updated prefs (without waiting)
export const updatePrefsAction = (prefs: GlobalPrefs): PayloadAction<GlobalPrefs> => {
  // TODO should we just make this createAsyncThunk and await here?
  sendMessage(updatePrefsMsg(prefs));
  storeGlobalPrefs(prefs);
  return { type: 'prefs/update', payload: prefs };
};
